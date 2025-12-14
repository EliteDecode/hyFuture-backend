-- AlterTable
ALTER TABLE "letters" ADD COLUMN     "senderName" TEXT,
ALTER COLUMN "recipientName" DROP NOT NULL;
