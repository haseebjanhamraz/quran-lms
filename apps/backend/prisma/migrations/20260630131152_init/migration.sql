-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'TEACHER', 'STUDENT', 'REVIEWER');

-- CreateEnum
CREATE TYPE "CourseType" AS ENUM ('NAZIRA', 'TAJWEED', 'HIFZ_UL_QURAN', 'ISLAMIC_STUDIES');

-- CreateEnum
CREATE TYPE "ClassStatus" AS ENUM ('SCHEDULED', 'LIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RecordingStatus" AS ENUM ('PROCESSING', 'UPLOADING', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "ReviewMode" AS ENUM ('LIVE_MONITOR', 'RECORDING_REVIEW');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('DRAFT', 'SUBMITTED');

-- CreateEnum
CREATE TYPE "FlagSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "type" "CourseType" NOT NULL,
    "curriculum" TEXT NOT NULL,
    "teacherId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enrollment" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "courseId" UUID NOT NULL,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassSession" (
    "id" UUID NOT NULL,
    "courseId" UUID NOT NULL,
    "teacherId" UUID NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "status" "ClassStatus" NOT NULL DEFAULT 'SCHEDULED',
    "livekitRoomId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClassSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "joinTime" TIMESTAMP(3),
    "leaveTime" TIMESTAMP(3),
    "durationSeconds" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recording" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "localPath" TEXT,
    "driveFileId" TEXT,
    "driveUrl" TEXT,
    "durationSeconds" INTEGER NOT NULL DEFAULT 0,
    "status" "RecordingStatus" NOT NULL DEFAULT 'PROCESSING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recording_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewerAssignment" (
    "id" UUID NOT NULL,
    "reviewerId" UUID NOT NULL,
    "courseId" UUID NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ReviewerAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassReview" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "reviewerId" UUID NOT NULL,
    "reviewMode" "ReviewMode" NOT NULL,
    "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "curriculumAdherenceScore" INTEGER NOT NULL,
    "teachingQualityScore" INTEGER NOT NULL,
    "engagementScore" INTEGER NOT NULL,
    "overallScore" DOUBLE PRECISION NOT NULL,
    "strengths" TEXT NOT NULL,
    "improvements" TEXT NOT NULL,
    "privateNotes" TEXT NOT NULL,
    "isFlagged" BOOLEAN NOT NULL DEFAULT false,
    "flagSeverity" "FlagSeverity",
    "flagReason" TEXT,
    "status" "ReviewStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClassReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewAnnotation" (
    "id" UUID NOT NULL,
    "reviewId" UUID NOT NULL,
    "timestamp" DOUBLE PRECISION NOT NULL,
    "note" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewAnnotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "action" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_studentId_courseId_key" ON "Enrollment"("studentId", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "ClassSession_livekitRoomId_key" ON "ClassSession"("livekitRoomId");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_sessionId_userId_key" ON "Attendance"("sessionId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Recording_sessionId_key" ON "Recording"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewerAssignment_reviewerId_courseId_key" ON "ReviewerAssignment"("reviewerId", "courseId");

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassSession" ADD CONSTRAINT "ClassSession_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ClassSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recording" ADD CONSTRAINT "Recording_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ClassSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewerAssignment" ADD CONSTRAINT "ReviewerAssignment_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewerAssignment" ADD CONSTRAINT "ReviewerAssignment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassReview" ADD CONSTRAINT "ClassReview_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ClassSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassReview" ADD CONSTRAINT "ClassReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewAnnotation" ADD CONSTRAINT "ReviewAnnotation_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "ClassReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
