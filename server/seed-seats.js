
import prisma from "./config/prisma.js";

async function main() {
  const halls = await prisma.hall.findMany({
    orderBy: [{ cinemaId: "asc" }, { id: "asc" }],
  });

  if (halls.length === 0) {
    console.log("No cinema halls found. Run your main seed script first.");
    return;
  }

  const rows = ["A", "B", "C", "D", "E"];
  let created = 0;

  for (const hall of halls) {
    for (const row of rows) {
      for (let number = 1; number <= 10; number++) {
        const seatNumber = `${row}${number}`;

        await prisma.seat.upsert({
          where: {
            hallId_seatNumber: {
              hallId: hall.id,
              seatNumber,
            },
          },
          update: {},
          create: {
            seatNumber,
            hallId: hall.id,
          },
        });

        created++;
      }
    }

    console.log(`Processed seats for ${hall.name}`);
  }

  console.log(`Finished! Processed ${created} seats across ${halls.length} halls.`);
}

main()
  .catch((error) => {
    console.error("Failed to create seats:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
