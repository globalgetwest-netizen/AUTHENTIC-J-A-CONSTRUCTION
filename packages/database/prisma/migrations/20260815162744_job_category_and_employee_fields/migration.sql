-- CreateEnum
CREATE TYPE "JobCategory" AS ENUM ('EXECUTIVE', 'MANAGEMENT', 'PROFESSIONAL', 'TECHNICAL', 'SKILLED', 'ADMINISTRATIVE', 'SUPPORT');

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "contractEnd" TIMESTAMP(3),
ADD COLUMN     "contractStart" TIMESTAMP(3),
ADD COLUMN     "jobCategory" "JobCategory",
ADD COLUMN     "nationality" TEXT,
ADD COLUMN     "placeOfBirth" TEXT;

-- AlterTable
ALTER TABLE "EmployeeID" ADD COLUMN     "jobCategory" "JobCategory";
