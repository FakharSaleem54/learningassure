-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255),
    "password" VARCHAR(255) NOT NULL,
    "role" VARCHAR(20) NOT NULL DEFAULT 'LEARNER',
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL DEFAULT 0.0,
    "category" VARCHAR(100) NOT NULL DEFAULT 'Uncategorized',
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "published" BOOLEAN NOT NULL DEFAULT false,
    "thumbnail" VARCHAR(500),
    "instructorId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Module" (
    "id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "courseId" UUID NOT NULL,

    CONSTRAINT "Module_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lesson" (
    "id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "content" TEXT,
    "videoUrl" VARCHAR(500),
    "order" INTEGER NOT NULL DEFAULT 0,
    "moduleId" UUID NOT NULL,

    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonResource" (
    "id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "fileUrl" VARCHAR(500) NOT NULL,
    "fileName" VARCHAR(255) NOT NULL,
    "fileSize" INTEGER NOT NULL DEFAULT 0,
    "lessonId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LessonResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TranscriptionJob" (
    "id" UUID NOT NULL,
    "lessonId" UUID NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "TranscriptionJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transcript" (
    "id" UUID NOT NULL,
    "lessonId" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "segments" JSONB,
    "language" VARCHAR(10) NOT NULL DEFAULT 'en',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transcript_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enrollment" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "courseId" UUID NOT NULL,
    "progress" DECIMAL(5,2) NOT NULL DEFAULT 0.0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "enrolledAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Certificate" (
    "id" UUID NOT NULL,
    "enrollmentId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "issuedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Certificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForumThread" (
    "id" UUID NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "content" TEXT NOT NULL,
    "authorId" UUID NOT NULL,
    "courseId" UUID,
    "tags" VARCHAR(500),
    "upvotes" INTEGER NOT NULL DEFAULT 0,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "ForumThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForumReply" (
    "id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "authorId" UUID NOT NULL,
    "threadId" UUID NOT NULL,
    "parentId" UUID,
    "upvotes" INTEGER NOT NULL DEFAULT 0,
    "isAccepted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "ForumReply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThreadVote" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "threadId" UUID NOT NULL,
    "value" SMALLINT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ThreadVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReplyVote" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "replyId" UUID NOT NULL,
    "value" SMALLINT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReplyVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiveMeetingRequest" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "instructorId" UUID NOT NULL,
    "courseId" UUID NOT NULL,
    "lectureId" UUID,
    "objective" TEXT NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "preferredTime" TIMESTAMPTZ,
    "meetingLink" VARCHAR(500),
    "zoomMeetingId" VARCHAR(100),
    "zoomJoinUrl" VARCHAR(500),
    "zoomStartUrl" VARCHAR(500),
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "LiveMeetingRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "message" TEXT NOT NULL,
    "type" VARCHAR(20) NOT NULL DEFAULT 'INFO',
    "link" VARCHAR(500),
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LectureChunk" (
    "id" UUID NOT NULL,
    "courseId" UUID NOT NULL,
    "lectureTitle" VARCHAR(255) NOT NULL,
    "chunkText" TEXT NOT NULL,
    "embedding" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LectureChunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" UUID NOT NULL,
    "courseId" UUID NOT NULL,
    "sender" VARCHAR(20) NOT NULL,
    "messageText" TEXT NOT NULL,
    "timestamp" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserActivityLog" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "sessionId" UUID,
    "eventType" VARCHAR(50) NOT NULL,
    "eventAction" VARCHAR(100) NOT NULL,
    "resourceType" VARCHAR(50),
    "resourceId" UUID,
    "metadata" JSONB,
    "clientInfo" JSONB,
    "duration" INTEGER,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBehaviorProfile" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "learningPreferences" JSONB,
    "engagementPatterns" JSONB,
    "contentInteractions" JSONB,
    "skillProfile" JSONB,
    "recommendationSignals" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "UserBehaviorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIRecommendation" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "recommendationType" VARCHAR(50) NOT NULL,
    "resourceType" VARCHAR(50) NOT NULL,
    "resourceId" UUID NOT NULL,
    "details" JSONB,
    "modelInfo" JSONB,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "clickedAt" TIMESTAMPTZ,
    "dismissedAt" TIMESTAMPTZ,
    "expiresAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningAnalytics" (
    "id" UUID NOT NULL,
    "courseId" UUID NOT NULL,
    "periodStart" TIMESTAMPTZ NOT NULL,
    "periodEnd" TIMESTAMPTZ NOT NULL,
    "periodType" VARCHAR(20) NOT NULL,
    "engagementMetrics" JSONB,
    "completionMetrics" JSONB,
    "assessmentMetrics" JSONB,
    "feedbackMetrics" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearningAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSession" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "startedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMPTZ,
    "duration" INTEGER,
    "deviceInfo" JSONB,
    "sessionSummary" JSONB,
    "trafficSource" JSONB,

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "Course_instructorId_idx" ON "Course"("instructorId");

-- CreateIndex
CREATE INDEX "Course_category_idx" ON "Course"("category");

-- CreateIndex
CREATE INDEX "Course_published_idx" ON "Course"("published");

-- CreateIndex
CREATE INDEX "Module_courseId_idx" ON "Module"("courseId");

-- CreateIndex
CREATE INDEX "Lesson_moduleId_idx" ON "Lesson"("moduleId");

-- CreateIndex
CREATE INDEX "LessonResource_lessonId_idx" ON "LessonResource"("lessonId");

-- CreateIndex
CREATE UNIQUE INDEX "TranscriptionJob_lessonId_key" ON "TranscriptionJob"("lessonId");

-- CreateIndex
CREATE INDEX "TranscriptionJob_status_idx" ON "TranscriptionJob"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Transcript_lessonId_key" ON "Transcript"("lessonId");

-- CreateIndex
CREATE INDEX "Transcript_lessonId_idx" ON "Transcript"("lessonId");

-- CreateIndex
CREATE INDEX "Enrollment_userId_idx" ON "Enrollment"("userId");

-- CreateIndex
CREATE INDEX "Enrollment_courseId_idx" ON "Enrollment"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_userId_courseId_key" ON "Enrollment"("userId", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_enrollmentId_key" ON "Certificate"("enrollmentId");

-- CreateIndex
CREATE INDEX "Certificate_userId_idx" ON "Certificate"("userId");

-- CreateIndex
CREATE INDEX "ForumThread_authorId_idx" ON "ForumThread"("authorId");

-- CreateIndex
CREATE INDEX "ForumThread_courseId_idx" ON "ForumThread"("courseId");

-- CreateIndex
CREATE INDEX "ForumThread_createdAt_idx" ON "ForumThread"("createdAt");

-- CreateIndex
CREATE INDEX "ForumReply_authorId_idx" ON "ForumReply"("authorId");

-- CreateIndex
CREATE INDEX "ForumReply_threadId_idx" ON "ForumReply"("threadId");

-- CreateIndex
CREATE INDEX "ForumReply_parentId_idx" ON "ForumReply"("parentId");

-- CreateIndex
CREATE INDEX "ThreadVote_threadId_idx" ON "ThreadVote"("threadId");

-- CreateIndex
CREATE UNIQUE INDEX "ThreadVote_userId_threadId_key" ON "ThreadVote"("userId", "threadId");

-- CreateIndex
CREATE INDEX "ReplyVote_replyId_idx" ON "ReplyVote"("replyId");

-- CreateIndex
CREATE UNIQUE INDEX "ReplyVote_userId_replyId_key" ON "ReplyVote"("userId", "replyId");

-- CreateIndex
CREATE INDEX "LiveMeetingRequest_studentId_idx" ON "LiveMeetingRequest"("studentId");

-- CreateIndex
CREATE INDEX "LiveMeetingRequest_instructorId_idx" ON "LiveMeetingRequest"("instructorId");

-- CreateIndex
CREATE INDEX "LiveMeetingRequest_courseId_idx" ON "LiveMeetingRequest"("courseId");

-- CreateIndex
CREATE INDEX "LiveMeetingRequest_status_idx" ON "LiveMeetingRequest"("status");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_read_idx" ON "Notification"("read");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "LectureChunk_courseId_idx" ON "LectureChunk"("courseId");

-- CreateIndex
CREATE INDEX "ChatMessage_courseId_idx" ON "ChatMessage"("courseId");

-- CreateIndex
CREATE INDEX "ChatMessage_timestamp_idx" ON "ChatMessage"("timestamp");

-- CreateIndex
CREATE INDEX "UserActivityLog_userId_idx" ON "UserActivityLog"("userId");

-- CreateIndex
CREATE INDEX "UserActivityLog_sessionId_idx" ON "UserActivityLog"("sessionId");

-- CreateIndex
CREATE INDEX "UserActivityLog_eventType_idx" ON "UserActivityLog"("eventType");

-- CreateIndex
CREATE INDEX "UserActivityLog_resourceType_resourceId_idx" ON "UserActivityLog"("resourceType", "resourceId");

-- CreateIndex
CREATE INDEX "UserActivityLog_createdAt_idx" ON "UserActivityLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserBehaviorProfile_userId_key" ON "UserBehaviorProfile"("userId");

-- CreateIndex
CREATE INDEX "UserBehaviorProfile_userId_idx" ON "UserBehaviorProfile"("userId");

-- CreateIndex
CREATE INDEX "AIRecommendation_userId_idx" ON "AIRecommendation"("userId");

-- CreateIndex
CREATE INDEX "AIRecommendation_recommendationType_idx" ON "AIRecommendation"("recommendationType");

-- CreateIndex
CREATE INDEX "AIRecommendation_resourceType_resourceId_idx" ON "AIRecommendation"("resourceType", "resourceId");

-- CreateIndex
CREATE INDEX "AIRecommendation_status_idx" ON "AIRecommendation"("status");

-- CreateIndex
CREATE INDEX "AIRecommendation_createdAt_idx" ON "AIRecommendation"("createdAt");

-- CreateIndex
CREATE INDEX "LearningAnalytics_courseId_idx" ON "LearningAnalytics"("courseId");

-- CreateIndex
CREATE INDEX "LearningAnalytics_periodStart_idx" ON "LearningAnalytics"("periodStart");

-- CreateIndex
CREATE INDEX "LearningAnalytics_periodType_idx" ON "LearningAnalytics"("periodType");

-- CreateIndex
CREATE UNIQUE INDEX "LearningAnalytics_courseId_periodStart_periodType_key" ON "LearningAnalytics"("courseId", "periodStart", "periodType");

-- CreateIndex
CREATE INDEX "UserSession_userId_idx" ON "UserSession"("userId");

-- CreateIndex
CREATE INDEX "UserSession_startedAt_idx" ON "UserSession"("startedAt");

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Module" ADD CONSTRAINT "Module_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonResource" ADD CONSTRAINT "LessonResource_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TranscriptionJob" ADD CONSTRAINT "TranscriptionJob_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transcript" ADD CONSTRAINT "Transcript_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumThread" ADD CONSTRAINT "ForumThread_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumThread" ADD CONSTRAINT "ForumThread_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumReply" ADD CONSTRAINT "ForumReply_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumReply" ADD CONSTRAINT "ForumReply_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "ForumThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumReply" ADD CONSTRAINT "ForumReply_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ForumReply"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThreadVote" ADD CONSTRAINT "ThreadVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThreadVote" ADD CONSTRAINT "ThreadVote_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "ForumThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReplyVote" ADD CONSTRAINT "ReplyVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReplyVote" ADD CONSTRAINT "ReplyVote_replyId_fkey" FOREIGN KEY ("replyId") REFERENCES "ForumReply"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveMeetingRequest" ADD CONSTRAINT "LiveMeetingRequest_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveMeetingRequest" ADD CONSTRAINT "LiveMeetingRequest_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveMeetingRequest" ADD CONSTRAINT "LiveMeetingRequest_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveMeetingRequest" ADD CONSTRAINT "LiveMeetingRequest_lectureId_fkey" FOREIGN KEY ("lectureId") REFERENCES "Lesson"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
