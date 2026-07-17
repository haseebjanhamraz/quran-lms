/*
  Warnings:

  - You are about to drop the column `driveFileId` on the `Recording` table. All the data in the column will be lost.
  - You are about to drop the column `driveUrl` on the `Recording` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ViolationType" AS ENUM ('PHONE_NUMBER', 'EMAIL', 'WHATSAPP', 'SOCIAL_MEDIA', 'OFF_TOPIC', 'INAPPROPRIATE_LANGUAGE', 'MISSING_CONTENT', 'EXCESSIVE_NON_ACADEMIC');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('CLASS_STARTING', 'REPORT_READY', 'RECORDING_READY', 'FLAG_RAISED', 'SYSTEM');

-- AlterTable
ALTER TABLE "ClassSession" ADD COLUMN     "startedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Recording" DROP COLUMN "driveFileId",
DROP COLUMN "driveUrl",
ADD COLUMN     "filePath" TEXT,
ADD COLUMN     "fileSize" INTEGER;

-- CreateTable
CREATE TABLE "TranscriptSegment" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "startTime" DOUBLE PRECISION NOT NULL,
    "endTime" DOUBLE PRECISION NOT NULL,
    "text" TEXT NOT NULL,
    "speakerLabel" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "language" TEXT NOT NULL DEFAULT 'en',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TranscriptSegment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIReport" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "teacherId" UUID NOT NULL,
    "riskScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "teachingQualityScore" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "topicRelevanceScore" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "summary" TEXT NOT NULL,
    "mainTopics" JSONB NOT NULL,
    "offTopicAnalysis" TEXT NOT NULL,
    "contactSharingDetection" JSONB NOT NULL,
    "complianceFindings" TEXT NOT NULL,
    "teachingAssessment" TEXT NOT NULL,
    "engagementAssessment" TEXT NOT NULL,
    "recommendations" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Violation" (
    "id" UUID NOT NULL,
    "reportId" UUID NOT NULL,
    "type" "ViolationType" NOT NULL,
    "evidence" TEXT NOT NULL,
    "severity" "FlagSeverity" NOT NULL DEFAULT 'MEDIUM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Violation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PipelineLog" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "step" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PipelineLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AIReport_sessionId_key" ON "AIReport"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "SystemSetting_key_key" ON "SystemSetting"("key");

-- AddForeignKey
ALTER TABLE "TranscriptSegment" ADD CONSTRAINT "TranscriptSegment_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ClassSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIReport" ADD CONSTRAINT "AIReport_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ClassSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIReport" ADD CONSTRAINT "AIReport_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Violation" ADD CONSTRAINT "Violation_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "AIReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PipelineLog" ADD CONSTRAINT "PipelineLog_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ClassSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
