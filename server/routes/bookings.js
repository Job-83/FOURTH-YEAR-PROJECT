
import express from "express";
import prisma from "../config/prisma.js";
import authenticateToken from "../middleware/auth.js";

const router = express.Router();

// Protect every booking endpoint.
router.use(authenticateToken);

// --------------------------------------------------
// CREATE A BOOKING
// POST /api/bookings
// --------------------------------------------------

router.post("/", async (req, res) => {
  try {
    const { showtimeId, seatIds } = req.body;

    // Validate showtime ID.
    if (
      !Number.isSafeInteger(showtimeId) ||
      showtimeId <= 0
    ) {
      return res.status(400).json({
        status: "error",
        message: "Please select a valid showtime.",
      });
    }

    // Validate selected seats.
    if (
      !Array.isArray(seatIds) ||
      seatIds.length === 0 ||
      !seatIds.every(
        (id) => Number.isSafeInteger(id) && id > 0
      )
    ) {
      return res.status(400).json({
        status: "error",
        message: "Please select at least one valid seat.",
      });
    }

    // Reject duplicate seat IDs.
    if (new Set(seatIds).size !== seatIds.length) {
      return res.status(400).json({
        status: "error",
        message: "The same seat cannot be selected more than once.",
      });
    }

    // Find the showtime and its cinema details.
    const showtime = await prisma.showtime.findUnique({
      where: {
        id: showtimeId,
      },
      include: {
        movie: true,
        hall: {
          include: {
            cinema: true,
          },
        },
      },
    });

    if (!showtime) {
      return res.status(404).json({
        status: "error",
        message: "The selected showtime was not found.",
      });
    }

    // Do not allow bookings for past showtimes.
    if (showtime.startsAt <= new Date()) {
      return res.status(400).json({
        status: "error",
        message: "This showtime has already started or passed.",
      });
    }

    // Confirm that all selected seats belong to this hall.
    const validSeats = await prisma.seat.findMany({
      where: {
        id: {
          in: seatIds,
        },
        hallId: showtime.hallId,
      },
      select: {
        id: true,
        seatNumber: true,
      },
    });

    if (validSeats.length !== seatIds.length) {
      return res.status(400).json({
        status: "error",
        message: "One or more seats do not belong to this show's cinema hall.",
      });
    }

    // Calculate the total using the database price.
    const totalPrice = showtime.price.mul(seatIds.length);

    // Create the booking and its seats in one transaction.
    const booking = await prisma.$transaction(
      async (tx) => {
        const newBooking = await tx.booking.create({
          data: {
            userId: req.userId,
            showtimeId: showtimeId,
            status: "PENDING",
            totalPrice: totalPrice,
          },
        });

        await tx.bookingSeat.createMany({
          data: seatIds.map((seatId) => ({
            bookingId: newBooking.id,
            seatId: seatId,
            showtimeId: showtimeId,
          })),
        });

        return tx.booking.findUnique({
          where: {
            id: newBooking.id,
          },
          include: {
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
          },
        });
      },
      {
        isolationLevel: "Serializable",
      }
    );

    return res.status(201).json({
      status: "success",
      message: "Your booking has been created successfully.",
      booking,
    });
  } catch (error) {
    console.error("Booking creation error:", error);

    // P2002: unique constraint violation.
    // P2034: transaction conflict or serialization failure.
    if (
      error.code === "P2002" ||
      error.code === "P2034"
    ) {
      return res.status(409).json({
        status: "error",
        message: "One or more selected seats are already booked. Please choose different seats and try again.",
      });
    }

    return res.status(500).json({
      status: "error",
      message: "Unable to create your booking. Please try again.",
    });
  }
});

// --------------------------------------------------
// GET BOOKINGS FOR THE LOGGED-IN CUSTOMER
// GET /api/bookings
// --------------------------------------------------

router.get("/", async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: {
        userId: req.userId,
      },
      include: {
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
      },
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
    console.error("Retrieve bookings error:", error);

    return res.status(500).json({
      status: "error",
      message: "Unable to retrieve your bookings.",
    });
  }
});

// --------------------------------------------------
// GET ONE BOOKING BELONGING TO THE LOGGED-IN CUSTOMER
// GET /api/bookings/:id
// --------------------------------------------------

router.get("/:id", async (req, res) => {
  try {
    const bookingId = Number(req.params.id);

    if (
      !Number.isSafeInteger(bookingId) ||
      bookingId <= 0
    ) {
      return res.status(400).json({
        status: "error",
        message: "Invalid booking ID.",
      });
    }

    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        userId: req.userId,
      },
      include: {
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
      },
    });

    if (!booking) {
      return res.status(404).json({
        status: "error",
        message: "Booking not found.",
      });
    }

    return res.status(200).json({
      status: "success",
      booking,
    });
  } catch (error) {
    console.error("Retrieve single booking error:", error);

    return res.status(500).json({
      status: "error",
      message: "Unable to retrieve this booking.",
    });
  }
});

export default router;
