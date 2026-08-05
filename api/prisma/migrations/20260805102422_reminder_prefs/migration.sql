-- AlterTable
ALTER TABLE "User" ADD COLUMN     "inactivityReminderDays" INTEGER,
ADD COLUMN     "reminderEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reminderHour" INTEGER NOT NULL DEFAULT 19,
ADD COLUMN     "timezoneOffsetMin" INTEGER;
