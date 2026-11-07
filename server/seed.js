import prisma from "./config/prisma.js";

async function seedDatabase() {
  try {
    // Sample movies
    const movies = [
      {
        title: "The Last Horizon",
        description: "An adventurous journey beyond the known world.",
        duration: 125,
        genre: "Adventure",
        posterUrl:
          "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
        status: "Now Showing",
        releaseDate: new Date("2026-10-01"),
      },
      {
        title: "Kingdom of Shadows",
        description: "A kingdom faces its greatest challenge.",
        duration: 115,
        genre: "Action",
        posterUrl:
          "https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
        status: "Coming Soon",
        releaseDate: new Date("2026-11-20"),
      },
      {
        title: "Love in Nairobi",
        description: "A romantic story set in the heart of Nairobi.",
        duration: 105,
        genre: "Romance",
        posterUrl: null,
        status: "Now Showing",
        releaseDate: new Date("2026-09-15"),
      },
    ];

    for (const movie of movies) {
      const existingMovie = await prisma.movie.findFirst({
        where: { title: movie.title },
      });

      if (existingMovie) {
        await prisma.movie.update({
          where: { id: existingMovie.id },
          data: movie,
        });

        console.log(`Updated movie: ${movie.title}`);
      } else {
        await prisma.movie.create({
          data: movie,
        });

        console.log(`Added movie: ${movie.title}`);
      }
    }

    // Sample cinemas and halls
    const cinemas = [
      {
        name: "Westgate Cinema",
        location: "Westlands, Nairobi",
      },
      {
        name: "Two Rivers Cinema",
        location: "Ruaka, Kiambu County",
      },
      {
        name: "Garden City Cinema",
        location: "Thika Road, Nairobi",
      },
    ];

    for (const cinemaData of cinemas) {
      let cinema = await prisma.cinema.findFirst({
        where: {
          name: cinemaData.name,
          location: cinemaData.location,
        },
      });

      if (!cinema) {
        cinema = await prisma.cinema.create({
          data: {
            ...cinemaData,
            halls: {
              create: [
                { name: "Hall 1" },
                { name: "Hall 2" },
              ],
            },
          },
        });

        console.log(`Added cinema: ${cinemaData.name}`);
      } else {
        console.log(`Cinema already exists: ${cinemaData.name}`);

        // Ensure both halls exist
        for (const hallName of ["Hall 1", "Hall 2"]) {
          const existingHall = await prisma.hall.findFirst({
            where: {
              cinemaId: cinema.id,
              name: hallName,
            },
          });

          if (!existingHall) {
            await prisma.hall.create({
              data: {
                name: hallName,
                cinemaId: cinema.id,
              },
            });

            console.log(`Added ${hallName} to ${cinema.name}`);
          }
        }
      }
    }

    // Retrieve movies and halls from the database
    const movieRecords = await prisma.movie.findMany();
    const hallRecords = await prisma.hall.findMany({
      include: {
        cinema: true,
      },
    });

    const movieByTitle = new Map(
      movieRecords.map((movie) => [movie.title, movie])
    );

    const hallByCinemaAndName = new Map(
      hallRecords.map((hall) => [
        `${hall.cinema.name}|${hall.name}`,
        hall,
      ])
    );

    // Create upcoming showtimes.
    // These are demonstration schedules, not real cinema schedules.
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const showtimeTemplates = [
      {
        movieTitle: "The Last Horizon",
        cinemaName: "Westgate Cinema",
        hallName: "Hall 1",
        dayOffset: 0,
        time: "14:00",
        price: "800.00",
      },
      {
        movieTitle: "The Last Horizon",
        cinemaName: "Westgate Cinema",
        hallName: "Hall 2",
        dayOffset: 0,
        time: "18:00",
        price: "1000.00",
      },
      {
        movieTitle: "Love in Nairobi",
        cinemaName: "Two Rivers Cinema",
        hallName: "Hall 1",
        dayOffset: 0,
        time: "16:00",
        price: "700.00",
      },
      {
        movieTitle: "Love in Nairobi",
        cinemaName: "Garden City Cinema",
        hallName: "Hall 2",
        dayOffset: 0,
        time: "19:00",
        price: "750.00",
      },
      {
        movieTitle: "The Last Horizon",
        cinemaName: "Two Rivers Cinema",
        hallName: "Hall 2",
        dayOffset: 1,
        time: "15:00",
        price: "850.00",
      },
      {
        movieTitle: "Love in Nairobi",
        cinemaName: "Westgate Cinema",
        hallName: "Hall 1",
        dayOffset: 1,
        time: "17:00",
        price: "800.00",
      },
      {
        movieTitle: "Kingdom of Shadows",
        cinemaName: "Garden City Cinema",
        hallName: "Hall 1",
        dayOffset: 27,
        time: "18:00",
        price: "1000.00",
      },
    ];

    for (const template of showtimeTemplates) {
      const movie = movieByTitle.get(template.movieTitle);
      const hall = hallByCinemaAndName.get(
        `${template.cinemaName}|${template.hallName}`
      );

      if (!movie) {
        console.warn(`Movie not found: ${template.movieTitle}`);
        continue;
      }

      if (!hall) {
        console.warn(
          `Hall not found: ${template.cinemaName} - ${template.hallName}`
        );
        continue;
      }

      // Build the showtime in the computer's local timezone.
      const startsAt = new Date(today);
      startsAt.setDate(startsAt.getDate() + template.dayOffset);

      const [hours, minutes] = template.time.split(":").map(Number);
      startsAt.setHours(hours, minutes, 0, 0);

      // Avoid adding showtimes that have already passed.
      if (startsAt <= new Date()) {
        startsAt.setDate(startsAt.getDate() + 1);
      }

      // Avoid duplicate showtimes for the same movie, hall and start time.
      const existingShowtime = await prisma.showtime.findFirst({
        where: {
          movieId: movie.id,
          hallId: hall.id,
          startsAt,
        },
      });

      if (existingShowtime) {
        console.log(
          `Showtime already exists: ${movie.title} at ${template.cinemaName}`
        );
        continue;
      }

      await prisma.showtime.create({
        data: {
          movieId: movie.id,
          hallId: hall.id,
          startsAt,
          price: template.price,
        },
      });

      console.log(
        `Added showtime: ${movie.title} | ${template.cinemaName} | ${startsAt.toLocaleString()}`
      );
    }

    console.log("\nSample movies, cinemas and showtimes are ready!");
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

seedDatabase();
