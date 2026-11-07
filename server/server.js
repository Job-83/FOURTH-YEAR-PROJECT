
import express from "express";
import cors from "cors";
import "dotenv/config";

import prisma from "./config/prisma.js";

import authRoutes from "./routes/auth.js";
import bookingRoutes from "./routes/bookings.js";
import adminRoutes from "./routes/admin.js";

const app = express();
const PORT = process.env.PORT || 3000;

// --------------------------------------------------
// MIDDLEWARE
// --------------------------------------------------

app.use(cors());

app.use(express.json({ limit: "20kb" }));

// --------------------------------------------------
// API ROUTES
// --------------------------------------------------

app.use("/api/auth", authRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/admin", adminRoutes);

// --------------------------------------------------
// HOME ROUTE
// --------------------------------------------------

app.get("/", (req, res) => {
  res.json({
    status: "success",
    message: "Welcome to Jus & Loski Cinemax API.",
    endpoints: {
      health: "/api/health",
      movies: "/api/movies",
      cinemas: "/api/cinemas",
      showtimes: "/api/showtimes",
      seats: "/api/showtimes/:id/seats",
      register: "/api/auth/register",
      login: "/api/auth/login",
      profile: "/api/auth/me",
      bookings: "/api/bookings",
      adminOverview: "/api/admin/overview",
      adminBookings: "/api/admin/bookings",
    },
  });
});

// --------------------------------------------------
// DATABASE HEALTH CHECK
// --------------------------------------------------

app.get("/api/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      status: "success",
      message: "Jus & Loski Cinemax API and database are running.",
    });
  } catch (error) {
    console.error("Database health check failed:", error);

    res.status(500).json({
      status: "error",
      message: "Database connection failed.",
    });
  }
});

// --------------------------------------------------
// GET ALL MOVIES
// --------------------------------------------------

app.get("/api/movies", async (req, res) => {
  try {
    const movies = await prisma.movie.findMany({
      orderBy: {
        title: "asc",
      },
    });

    res.status(200).json({
      status: "success",
      count: movies.length,
      data: movies,
    });
  } catch (error) {
    console.error("Get movies error:", error);

    res.status(500).json({
      status: "error",
      message: "Unable to retrieve movies.",
    });
  }
});

// --------------------------------------------------
// GET ALL CINEMAS
// --------------------------------------------------

app.get("/api/cinemas", async (req, res) => {
  try {
    const cinemas = await prisma.cinema.findMany({
      include: {
        halls: {
          include: {
            _count: {
              select: {
                seats: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    res.status(200).json({
      status: "success",
      count: cinemas.length,
      data: cinemas,
    });
  } catch (error) {
    console.error("Get cinemas error:", error);

    res.status(500).json({
      status: "error",
      message: "Unable to retrieve cinemas.",
    });
  }
});

// --------------------------------------------------
// GET ALL FUTURE SHOWTIMES
// --------------------------------------------------

app.get("/api/showtimes", async (req, res) => {
  try {
    const showtimes = await prisma.showtime.findMany({
      where: {
        startsAt: {
          gt: new Date(),
        },
      },
      include: {
        movie: true,
        hall: {
          include: {
            cinema: true,
          },
        },
      },
      orderBy: {
        startsAt: "asc",
      },
    });

    res.status(200).json({
      status: "success",
      count: showtimes.length,
      data: showtimes,
    });
  } catch (error) {
    console.error("Get showtimes error:", error);

    res.status(500).json({
      status: "error",
      message: "Unable to retrieve showtimes.",
    });
  }
});

// --------------------------------------------------
// GET SEATS FOR A SHOWTIME
// --------------------------------------------------

app.get("/api/showtimes/:id/seats", async (req, res) => {
  try {
    const showtimeId = Number(req.params.id);

    if (
      !Number.isSafeInteger(showtimeId) ||
      showtimeId <= 0
    ) {
      return res.status(400).json({
        status: "error",
        message: "Invalid showtime ID.",
      });
    }

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
        message: "Showtime not found.",
      });
    }

    const seats = await prisma.seat.findMany({
      where: {
        hallId: showtime.hallId,
      },
      orderBy: {
        seatNumber: "asc",
      },
    });

    const bookedSeats = await prisma.bookingSeat.findMany({
      where: {
        showtimeId,
        booking: {
          status: {
            in: ["PENDING", "CONFIRMED"],
          },
        },
      },
      select: {
        seatId: true,
      },
    });

    const bookedSeatIds = new Set(
      bookedSeats.map((item) => item.seatId)
    );

    const seatData = seats.map((seat) => ({
      ...seat,
      isBooked: bookedSeatIds.has(seat.id),
      isAvailable: !bookedSeatIds.has(seat.id),
    }));

    const availableSeats = seatData.filter(
      (seat) => seat.isAvailable
    ).length;

    res.status(200).json({
      status: "success",
      showtime,
      totalSeats: seats.length,
      availableSeats,
      data: seatData,
    });
  } catch (error) {
    console.error("Get showtime seats error:", error);

    res.status(500).json({
      status: "error",
      message: "Unable to retrieve seats for this showtime.",
    });
  }
});

// --------------------------------------------------
// API NOT FOUND
// --------------------------------------------------

app.use("/api", (req, res) => {
  res.status(404).json({
    status: "error",
    message: "API endpoint not found.",
  });
});

// --------------------------------------------------
// GENERAL ERROR HANDLER
// --------------------------------------------------

app.use((error, req, res, next) => {
  console.error("Server error:", error);

  res.status(500).json({
    status: "error",
    message: "An unexpected server error occurred.",
  });
});

// --------------------------------------------------
// START SERVER
// --------------------------------------------------

const server = app.listen(PORT, "127.0.0.1", () => {
  console.log("----------------------------------------");
  console.log("Jus & Loski Cinemax API is running.");
  console.log(`Server: http://localhost:${PORT}`);
  console.log(`Health: http://localhost:${PORT}/api/health`);
  console.log("----------------------------------------");
});

// --------------------------------------------------
// GRACEFUL SHUTDOWN
// --------------------------------------------------

async function shutdown(signal) {
  console.log(`${signal} received. Shutting down server...`);

  server.close(async () => {
    try {
      await prisma.$disconnect();
      console.log("Database disconnected.");
      process.exit(0);
    } catch (error) {
      console.error("Shutdown error:", error);
      process.exit(1);
    }
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
