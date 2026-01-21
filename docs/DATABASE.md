# Database Documentation

## Overview

Learning Assure LMS uses **PostgreSQL** as its production database, managed through **Prisma ORM** for type-safe database access and migrations.

---

## Migration History: SQLite → PostgreSQL

### Prototyping Phase (SQLite)

During initial development, SQLite was used for:
- Zero-configuration local development
- Rapid prototyping without external dependencies
- Simple file-based storage for MVP testing

**SQLite Configuration (Deprecated):**
```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}
```

### Production Phase (PostgreSQL)

The migration to PostgreSQL was driven by production requirements:

**Current Configuration:**
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

---

## Why PostgreSQL?

### 1. Concurrency & Multi-User Support

| Scenario | SQLite | PostgreSQL |
|----------|--------|------------|
| Simultaneous readers | ✅ Unlimited | ✅ Unlimited |
| Simultaneous writers | ❌ 1 (blocks others) | ✅ Thousands (MVCC) |
| Connection pooling | ❌ Not applicable | ✅ PgBouncer, built-in |
| Write-heavy workloads | ❌ Performance degrades | ✅ Optimized |

**LMS Impact:** An LMS with hundreds of concurrent learners submitting quizzes, updating progress, and posting to forums requires true concurrent write support.

### 2. Scalability

| Feature | SQLite | PostgreSQL |
|---------|--------|------------|
| Max database size | ~281 TB (theoretical) | Unlimited |
| Replication | ❌ Manual | ✅ Streaming, logical |
| Read replicas | ❌ No | ✅ Yes |
| Horizontal scaling | ❌ No | ✅ Citus, sharding |
| Cloud-native | ❌ No | ✅ AWS RDS, Azure, GCP |

### 3. Advanced Data Types

PostgreSQL provides native support for complex data:

```prisma
// UUID - Distributed-friendly unique IDs
id String @id @default(uuid()) @db.Uuid

// JSONB - Flexible schema for analytics
metadata Json? @db.JsonB

// Decimal - Precise monetary values
price Decimal @db.Decimal(10, 2)

// Timestamp with timezone
createdAt DateTime @db.Timestamptz
```

### 4. JSONB for AI & Analytics

PostgreSQL's JSONB enables schema-flexible storage for:

#### Activity Logs
```sql
-- Example UserActivityLog.metadata
{
  "videoTimestamp": 120,
  "quizScore": 85,
  "clickTarget": "enroll_button",
  "scrollDepth": 0.75
}
```

#### User Behavior Profiles
```sql
-- Example UserBehaviorProfile.learningPreferences
{
  "preferredCategories": ["web-development", "data-science"],
  "preferredDifficulty": "intermediate",
  "learningStyle": "visual",
  "avgSessionDuration": 45
}
```

#### AI Recommendations
```sql
-- Example AIRecommendation.details
{
  "score": 0.95,
  "reasons": ["matches_interest", "trending", "peer_recommended"],
  "position": 1,
  "impressionId": "abc123"
}
```

**Why JSONB over separate tables?**
- Evolving schema without migrations
- Single query for complete user profile
- GIN indexes for fast querying
- Native PostgreSQL performance

---

## Schema Overview

### Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐
│      User       │       │     Course      │
├─────────────────┤       ├─────────────────┤
│ id (UUID)       │──┐    │ id (UUID)       │
│ email           │  │    │ title           │
│ name            │  │    │ description     │
│ password        │  │    │ instructorId ───┤──┐
│ role            │  │    │ published       │  │
└────────┬────────┘  │    └────────┬────────┘  │
         │           │             │           │
         │           └─────────────┼───────────┘
         │                         │
    ┌────┴────┐               ┌────┴────┐
    │Enrollment│              │  Module  │
    ├──────────┤              ├──────────┤
    │ userId   │              │ courseId │
    │ courseId │              │ title    │
    │ progress │              │ order    │
    └────┬─────┘              └────┬─────┘
         │                         │
    ┌────┴────┐               ┌────┴────┐
    │Certificate│             │  Lesson  │
    └──────────┘              └──────────┘
```

### Models Summary

| Category | Models |
|----------|--------|
| **Core** | User, Course, Module, Lesson |
| **Progress** | Enrollment, Certificate, LessonResource |
| **Community** | ForumThread, ForumReply, ThreadVote, ReplyVote |
| **Meetings** | LiveMeetingRequest, Notification |
| **AI/Chat** | LectureChunk, ChatMessage |
| **Analytics** | UserActivityLog, UserBehaviorProfile, AIRecommendation, LearningAnalytics, UserSession |

---

## Indexing Strategy

All foreign keys and frequently queried fields are indexed:

```prisma
model Course {
  @@index([instructorId])  // Instructor's courses
  @@index([category])      // Category filtering
  @@index([published])     // Published course listing
}

model UserActivityLog {
  @@index([userId])                    // User's activity history
  @@index([eventType])                 // Event type filtering
  @@index([resourceType, resourceId])  // Resource-specific logs
  @@index([createdAt])                 // Time-based queries
}
```

---

## Connection Configuration

### Development
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/learning_assure_lms
```

### Production (Example with connection pooling)
```env
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require&connection_limit=20
```

### Connection Pooling Recommendations

| Environment | Pool Size | Recommendation |
|-------------|-----------|----------------|
| Development | 5 | Default Prisma |
| Production | 20-50 | Based on server resources |
| Serverless | 1-10 | Use PgBouncer or connection proxy |

---

## Migrations

### Creating a Migration
```bash
npx prisma migrate dev --name descriptive_name
```

### Applying Migrations (Production)
```bash
npx prisma migrate deploy
```

### Resetting Database (Development Only)
```bash
npx prisma migrate reset
```

### Quick Schema Push (Development)
```bash
npx prisma db push
```

---

## Backup & Recovery

### Manual Backup
```bash
pg_dump -U postgres learning_assure_lms > backup.sql
```

### Restore from Backup
```bash
psql -U postgres learning_assure_lms < backup.sql
```

### Automated Backups
For production, use your cloud provider's automated backup:
- **AWS RDS**: Automated snapshots
- **Azure**: Geo-redundant backups
- **GCP Cloud SQL**: Automated backups

---

## Performance Considerations

### JSONB Query Optimization

Create GIN indexes for frequently queried JSONB paths:

```sql
-- Index for category preferences
CREATE INDEX idx_behavior_categories 
ON "UserBehaviorProfile" 
USING GIN ((learningPreferences->'preferredCategories'));

-- Index for event metadata
CREATE INDEX idx_activity_metadata 
ON "UserActivityLog" 
USING GIN (metadata);
```

### Query Examples

```sql
-- Find users interested in "web-dev"
SELECT * FROM "UserBehaviorProfile"
WHERE learningPreferences->'preferredCategories' ? 'web-dev';

-- Get activity logs with video watch time > 60s
SELECT * FROM "UserActivityLog"
WHERE (metadata->>'videoTimestamp')::int > 60;
```

---

## Security

### Best Practices Implemented
- ✅ UUID primary keys (non-sequential)
- ✅ Password hashing with bcrypt
- ✅ Environment-based credentials
- ✅ Parameterized queries (Prisma)
- ✅ Cascade deletes for data integrity

### Recommendations for Production
- Enable SSL/TLS connections
- Use database firewalls / VPC
- Implement row-level security if needed
- Regular security audits
