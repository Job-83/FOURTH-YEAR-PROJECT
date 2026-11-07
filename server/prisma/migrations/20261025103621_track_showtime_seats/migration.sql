/*
  Warnings:

  - A unique constraint covering the columns `[showtimeId,seatId]` on the table `BookingSeat` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `showtimeId` to the `BookingSeat` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "BookingSeat" ADD COLUMN     "showtimeId" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "Booking_showtimeId_status_idx" ON "Booking"("showtimeId", "status");

-- CreateIndex
CREATE INDEX "Booking_userId_idx" ON "Booking"("userId");

-- CreateIndex
CREATE INDEX "BookingSeat_bookingId_idx" ON "BookingSeat"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "BookingSeat_showtimeId_seatId_key" ON "BookingSeat"("showtimeId", "seatId");

-- CreateIndex
CREATE INDEX "Showtime_startsAt_idx" ON "Showtime"("startsAt");

-- CreateIndex
CREATE INDEX "Showtime_movieId_idx" ON "Showtime"("movieId");

-- CreateIndex
CREATE INDEX "Showtime_hallId_idx" ON "Showtime"("hallId");

-- AddForeignKey
ALTER TABLE "BookingSeat" ADD CONSTRAINT "BookingSeat_showtimeId_fkey" FOREIGN KEY ("showtimeId") REFERENCES "Showtime"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
