/*
  Warnings:

  - You are about to drop the `Country` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CustomerAddress` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Order` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VendorKycDocument` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VendorProfile` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "LetterStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'DELIVERED', 'FAILED');

-- CreateEnum
CREATE TYPE "AttachmentType" AS ENUM ('IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('LETTER_SCHEDULED', 'LETTER_DELIVERED', 'REMINDER', 'SYSTEM');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'IN_APP');

-- DropForeignKey
ALTER TABLE "AuthCode" DROP CONSTRAINT "AuthCode_userId_fkey";

-- DropForeignKey
ALTER TABLE "CustomerAddress" DROP CONSTRAINT "CustomerAddress_userId_fkey";

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_userId_fkey";

-- DropForeignKey
ALTER TABLE "Token" DROP CONSTRAINT "Token_userId_fkey";

-- DropForeignKey
ALTER TABLE "VendorKycDocument" DROP CONSTRAINT "VendorKycDocument_vendorProfileId_fkey";

-- DropForeignKey
ALTER TABLE "VendorProfile" DROP CONSTRAINT "VendorProfile_userId_fkey";

-- DropTable
DROP TABLE "Country";

-- DropTable
DROP TABLE "CustomerAddress";

-- DropTable
DROP TABLE "Order";

-- DropTable
DROP TABLE "User";

-- DropTable
DROP TABLE "VendorKycDocument";

-- DropTable
DROP TABLE "VendorProfile";

-- DropEnum
DROP TYPE "OrderStatus";

-- DropEnum
DROP TYPE "Region";

-- DropEnum
DROP TYPE "Role";

-- DropEnum
DROP TYPE "VendorBusinessType";

-- DropEnum
DROP TYPE "VendorDocumentType";

-- DropEnum
DROP TYPE "VendorKycStatus";

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "letters" (
    "id" TEXT NOT NULL,
    "subject" TEXT,
    "content" TEXT NOT NULL,
    "senderEmail" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "userId" TEXT,
    "deliveryDate" TIMESTAMP(3) NOT NULL,
    "deliveredAt" TIMESTAMP(3),
    "status" "LetterStatus" NOT NULL DEFAULT 'SCHEDULED',
    "isGuest" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "letters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guest_letter_tracking" (
    "id" TEXT NOT NULL,
    "guestEmail" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "letterId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guest_letter_tracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attachments" (
    "id" TEXT NOT NULL,
    "letterId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "type" "AttachmentType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "type" "NotificationType" NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),
    "letterId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_logs" (
    "id" TEXT NOT NULL,
    "letterId" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "provider" TEXT,
    "providerMessageId" TEXT,
    "errorMessage" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "letters_senderEmail_recipientEmail_idx" ON "letters"("senderEmail", "recipientEmail");

-- CreateIndex
CREATE INDEX "letters_userId_idx" ON "letters"("userId");

-- CreateIndex
CREATE INDEX "letters_status_idx" ON "letters"("status");

-- CreateIndex
CREATE INDEX "letters_deliveryDate_idx" ON "letters"("deliveryDate");

-- CreateIndex
CREATE UNIQUE INDEX "guest_letter_tracking_guestEmail_recipientEmail_key" ON "guest_letter_tracking"("guestEmail", "recipientEmail");

-- CreateIndex
CREATE INDEX "attachments_letterId_idx" ON "attachments"("letterId");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "notifications_isRead_idx" ON "notifications"("isRead");

-- CreateIndex
CREATE INDEX "email_logs_letterId_idx" ON "email_logs"("letterId");

-- AddForeignKey
ALTER TABLE "letters" ADD CONSTRAINT "letters_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_letterId_fkey" FOREIGN KEY ("letterId") REFERENCES "letters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Token" ADD CONSTRAINT "Token_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthCode" ADD CONSTRAINT "AuthCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
