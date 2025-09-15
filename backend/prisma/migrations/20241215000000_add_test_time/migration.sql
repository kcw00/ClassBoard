-- AlterTable
ALTER TABLE "tests" ADD COLUMN "test_time" TEXT NOT NULL DEFAULT '09:00';

-- Update existing tests to have a default time
UPDATE "tests" SET "test_time" = '09:00' WHERE "test_time" IS NULL;