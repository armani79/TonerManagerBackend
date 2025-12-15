/*
  Warnings:

  - The `printers` column on the `Toner` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Toner" DROP COLUMN "printers",
ADD COLUMN     "printers" TEXT[];
