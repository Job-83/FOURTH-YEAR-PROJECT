
import prisma from "./config/prisma.js";

async function testDatabase() {
  try {
    await prisma.$connect();
    console.log("PostgreSQL connected successfully!");

    const userCount = await prisma.user.count();
    console.log(`Database query successful. Current users: ${userCount}`);
  } catch (error) {
    console.error("Database connection or query failed:");
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();
