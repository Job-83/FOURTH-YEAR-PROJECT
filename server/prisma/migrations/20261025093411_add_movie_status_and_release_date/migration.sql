-- AlterTable
ALTER TABLE "Movie" ADD COLUMN     "releaseDate" TIMESTAMP(3),
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'Now Showing';
