/*
  Warnings:

  - Added the required column `recipientName` to the `letters` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "letters" ADD COLUMN     "recipientName" TEXT NOT NULL;
