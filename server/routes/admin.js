import express from "express";
import bcrypt from "bcryptjs";
import prisma from "../config/prisma.js";

import authenticateToken from "../middleware/auth.js";
import requireAdmin, {
  requireSuperAdmin,
} from "../middleware/admin.js";

const router = express.Router();

// All admin routes require authentication and admin privileges.
router.use(authenticateToken, requireAdmin);

// Shared booking details used by the booking endpoints.
const bookingDetails = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  showtime: {
    include: {
      movie: true,
      hall: {
        include: {
          cinema: true,
        },
      },
    },
  },
  seats: {
    include: {
      seat: true,
    },
  },
};

// --------------------------------------------------
// ADMIN DASHBOARD OVERVIEW
// GET /api/admin/overview
// --------------------------------------------------

router.get("/overview", async (req, res) => {
  try {
    const [
      totalBookings,
      totalCustomers,
      pendingBookings,
      confirmedBookings,
      cancelledBookings,
      pendingTotal,
    ] = await Promise.all([
      prisma.booking.count(),

      prisma.user.count({
        where: { role: "CUSTOMER" },
      }),

      prisma.booking.count({
        where: { status: "PENDING" },
      }),

      prisma.booking.count({
        where: { status: "CONFIRMED" },
      }),

      prisma.booking.count({
        where: { status: "CANCELLED" },
      }),

      prisma.booking.aggregate({
        where: { status: "PENDING" },
        _sum: { totalPrice: true },
      }),
    ]);

    return res.status(200).json({
      status: "success",
      overview: {
        totalBookings,
        totalCustomers,
        pendingBookings,
        confirmedBookings,
        cancelledBookings,
        pendingBookingValue:
          pendingTotal._sum.totalPrice?.toString() || "0",
      },
    });
  } catch (error) {
    console.error("Admin overview error:", error);

    return res.status(500).json({
      status: "error",
      message: "Unable to retrieve dashboard statistics.",
    });
  }
});

// --------------------------------------------------
// GET ALL CUSTOMER BOOKINGS
// GET /api/admin/bookings
// --------------------------------------------------

router.get("/bookings", async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      include: bookingDetails,
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      status: "success",
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error("Admin bookings error:", error);

    return res.status(500).json({
      status: "error",
      message: "Unable to retrieve customer bookings.",
    });
  }
});

// --------------------------------------------------
// UPDATE BOOKING STATUS
// PATCH /api/admin/bookings/:bookingId/status
// ADMIN AND SUPER_ADMIN
// --------------------------------------------------

router.patch("/bookings/:bookingId/status", async (req, res) => {
  try {
    const bookingId = Number(req.params.bookingId);
    const { status } = req.body;

    if (!Number.isSafeInteger(bookingId) || bookingId <= 0) {
      return res.status(400).json({
        status: "error",
        message: "Invalid booking ID.",
      });
    }

    const allowedStatuses = ["PENDING", "CONFIRMED", "CANCELLED"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        status: "error",
        message: "Choose PENDING, CONFIRMED, or CANCELLED.",
      });
    }

    const existingBooking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        status: true,
      },
    });

    if (!existingBooking) {
      return res.status(404).json({
        status: "error",
        message: "Booking not found.",
      });
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: { status },
      include: bookingDetails,
    });

    return res.status(200).json({
      status: "success",
      message: `Booking #${bookingId} updated to ${status}.`,
      booking: updatedBooking,
    });
  } catch (error) {
    console.error("Update booking status error:", error);

    return res.status(500).json({
      status: "error",
      message: "Unable to update booking status.",
    });
  }
});

// --------------------------------------------------
// GET ALL ADMINISTRATORS
// GET /api/admin/administrators
// SUPER_ADMIN ONLY
// --------------------------------------------------

router.get(
  "/administrators",
  requireSuperAdmin,
  async (req, res) => {
    try {
      const administrators = await prisma.user.findMany({
        where: {
          role: {
            in: ["ADMIN", "SUPER_ADMIN"],
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return res.status(200).json({
        status: "success",
        count: administrators.length,
        administrators,
      });
    } catch (error) {
      console.error("Get administrators error:", error);

      return res.status(500).json({
        status: "error",
        message: "Unable to retrieve administrators.",
      });
    }
  }
);

// --------------------------------------------------
// CREATE AN ADMINISTRATOR
// POST /api/admin/administrators
// SUPER_ADMIN ONLY
// --------------------------------------------------

router.post(
  "/administrators",
  requireSuperAdmin,
  async (req, res) => {
    try {
      const name =
        typeof req.body?.name === "string"
          ? req.body.name.trim()
          : "";

      const email =
        typeof req.body?.email === "string"
          ? req.body.email.trim().toLowerCase()
          : "";

      const password =
        typeof req.body?.password === "string"
          ? req.body.password
          : "";

      if (name.length < 2 || name.length > 100) {
        return res.status(400).json({
          status: "error",
          message: "Name must contain between 2 and 100 characters.",
        });
      }

      if (
        email.length > 254 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      ) {
        return res.status(400).json({
          status: "error",
          message: "Enter a valid email address.",
        });
      }

      if (password.length < 8 || password.length > 72) {
        return res.status(400).json({
          status: "error",
          message: "Password must contain 8 to 72 characters.",
        });
      }

      const existingUser = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });

      if (existingUser) {
        return res.status(409).json({
          status: "error",
          message: "An account with this email already exists.",
        });
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      const administrator = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: "ADMIN",
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });

      return res.status(201).json({
        status: "success",
        message: "Administrator created successfully.",
        administrator,
      });
    } catch (error) {
      if (error.code === "P2002") {
        return res.status(409).json({
          status: "error",
          message: "An account with this email already exists.",
        });
      }

      console.error("Create administrator error:", error);

      return res.status(500).json({
        status: "error",
        message: "Unable to create administrator.",
      });
    }
  }
);

export default router;