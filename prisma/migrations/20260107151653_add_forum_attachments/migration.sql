-- AlterTable
ALTER TABLE "ForumReply" ADD COLUMN     "attachments" JSONB;

-- AlterTable
ALTER TABLE "ForumThread" ADD COLUMN     "attachments" JSONB;

-- AddForeignKey
ALTER TABLE "Quiz" ADD CONSTRAINT "Quiz_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
