/*
  Warnings:

  - The values [in_person] on the enum `MeetingType` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "FileEntityType" AS ENUM ('test', 'homework_submission', 'student_profile', 'class_resource', 'general');

-- AlterEnum
BEGIN;
CREATE TYPE "MeetingType_new" AS ENUM ('in-person', 'virtual');
ALTER TABLE "meetings" ALTER COLUMN "meeting_type" TYPE "MeetingType_new" USING ("meeting_type"::text::"MeetingType_new");
ALTER TYPE "MeetingType" RENAME TO "MeetingType_old";
ALTER TYPE "MeetingType_new" RENAME TO "MeetingType";
DROP TYPE "MeetingType_old";
COMMIT;

-- CreateTable
CREATE TABLE "files" (
    "id" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "s3_key" TEXT NOT NULL,
    "s3_bucket" TEXT NOT NULL,
    "cloudfront_url" TEXT,
    "uploaded_by" TEXT,
    "entity_type" "FileEntityType" NOT NULL,
    "entity_id" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "files_pkey" PRIMARY KEY ("id")
);
