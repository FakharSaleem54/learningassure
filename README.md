# Learning Assure LMS

A modern, feature-rich Learning Management System built with Next.js 15, PostgreSQL, and Prisma ORM.

## 🎯 Overview

Learning Assure is a comprehensive LMS platform designed for scalable, multi-user learning environments. It supports learners, instructors, and administrators with features including course management, progress tracking, certifications, community forums, and AI-powered recommendations.

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **Next.js 15** | Full-stack React framework with App Router |
| **PostgreSQL** | Production database with JSONB support |
| **Prisma ORM** | Type-safe database access and migrations |
| **TypeScript** | Type-safe development |
| **Tailwind CSS** | Utility-first styling (optional) |
| **bcryptjs** | Secure password hashing |

---

## 📊 Database Architecture

### Why PostgreSQL?

> **Note:** SQLite was initially used during the prototyping phase for rapid development and zero-configuration setup. The migration to PostgreSQL was essential for production readiness.

#### Migration Justification

| Requirement | SQLite Limitation | PostgreSQL Solution |
|-------------|-------------------|---------------------|
| **Concurrent Users** | Single-writer lock causes bottlenecks | MVCC enables thousands of simultaneous connections |
| **Scalability** | File-based, limited to single server | Supports clustering, replication, and sharding |
| **Data Types** | Limited type support | Native UUID, JSONB, ARRAY, TIMESTAMPTZ |
| **Full-Text Search** | Requires extensions | Built-in tsvector/tsquery support |
| **ACID Compliance** | Basic | Full ACID with advanced isolation levels |
| **Production Hosting** | Not recommended | Industry standard for cloud deployments |

### JSONB Usage for AI & Analytics

PostgreSQL's JSONB data type is utilized for flexible, schema-less data storage in our analytics and AI recommendation system:

```prisma
// Activity logs with flexible metadata
model UserActivityLog {
  metadata   Json? @db.JsonB  // { "videoTimestamp": 120, "quizScore": 85 }
  clientInfo Json? @db.JsonB  // { "browser": "Chrome", "device": "desktop" }
}

// User behavior profiles for AI recommendations
model UserBehaviorProfile {
  learningPreferences   Json? @db.JsonB  // { "preferredCategories": ["web-dev"] }
  engagementPatterns    Json? @db.JsonB  // { "peakHours": [9, 10, 14] }
  recommendationSignals Json? @db.JsonB  // { "recentlyViewed": ["course-1"] }
}

// AI recommendation storage
model AIRecommendation {
  details   Json? @db.JsonB  // { "score": 0.95, "reasons": ["trending"] }
  modelInfo Json? @db.JsonB  // { "algorithm": "collaborative_filtering" }
}
```

**Benefits of JSONB:**
- Flexible schema for evolving analytics requirements
- Efficient querying with GIN indexes
- Native PostgreSQL performance without external stores
- Supports complex nested structures for ML features

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ 
- **PostgreSQL** 14+ running locally or remotely
- **npm** or **yarn**

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd learning_assure
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Copy `.env.example` to `.env` and update:
   ```env
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/learning_assure_lms
   AUTH_SECRET=your-secure-random-string
   ```

4. **Create PostgreSQL database**
   ```bash
   psql -U postgres -c "CREATE DATABASE learning_assure_lms;"
   ```

5. **Apply database migrations**
   ```bash
   npx prisma db push
   # or for versioned migrations:
   npx prisma migrate dev --name init
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. **Open in browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
learning_assure/
├── prisma/
│   └── schema.prisma      # Database schema (PostgreSQL)
├── src/
│   ├── app/               # Next.js App Router pages
│   │   ├── (auth)/        # Authentication routes
│   │   ├── admin/         # Admin panel
│   │   ├── courses/       # Course management
│   │   ├── dashboard/     # User dashboards
│   │   ├── community/     # Forum/community
│   │   └── api/           # API routes
│   ├── components/        # React components
│   ├── lib/               # Utilities & services
│   │   ├── db.ts          # Prisma client
│   │   ├── session.ts     # Authentication
│   │   └── ai/            # AI service integration
│   └── actions/           # Server actions
├── public/
│   └── assets/            # Static assets
└── .env                   # Environment variables
```

---

## ✨ Features

### For Learners
- 📚 Browse and enroll in courses
- 🎥 Video lessons with progress tracking
- 📝 Quizzes and assessments
- 🏆 Certificates upon completion
- 💬 Community forum participation
- 🎮 Gamification (points, badges, levels)

### For Instructors
- ➕ Create and manage courses
- 📊 Analytics dashboard
- 👥 Student progress monitoring
- 📅 Live meeting scheduling (Zoom integration)
- 📄 PDF resources upload

### For Admins
- 👤 User management
- ✅ Course approval workflow
- 📈 Platform analytics
- 🔧 System configuration

### AI-Powered Features
- 🤖 Personalized course recommendations
- 📊 Learning behavior analysis
- 💡 Smart content suggestions
- 📉 Engagement pattern insights

---

## 🗃️ Database Models

### Core Entities
| Model | Description |
|-------|-------------|
| `User` | Learners, instructors, admins |
| `Course` | Course content and metadata |
| `Module` | Course sections |
| `Lesson` | Individual lessons with video/text |
| `Enrollment` | User-course relationships |
| `Certificate` | Completion certificates |

### Community
| Model | Description |
|-------|-------------|
| `ForumThread` | Discussion threads |
| `ForumReply` | Thread responses |
| `ThreadVote` / `ReplyVote` | Voting system |

### Analytics & AI
| Model | Description |
|-------|-------------|
| `UserActivityLog` | Individual action tracking |
| `UserBehaviorProfile` | Aggregated user patterns |
| `AIRecommendation` | Personalized suggestions |
| `LearningAnalytics` | Course-level insights |
| `UserSession` | Session tracking |

---

## 🧪 Testing Features

After setup, verify the following functionality:

1. **User Authentication**
   - Sign up with email/password
   - Login/logout flow
   - Role-based access (Learner/Instructor/Admin)

2. **Course Management**
   - Create course (as Instructor)
   - Add modules and lessons
   - Publish course

3. **Enrollment & Progress**
   - Enroll in a course
   - Complete lessons
   - Track progress percentage

4. **Assessments**
   - Take quizzes
   - View scores

5. **Certificates**
   - Complete a course
   - Generate certificate

---

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `AUTH_SECRET` | Session encryption key | ✅ |
| `AI_API_KEY` | OpenAI/AI provider key | Optional |
| `AI_API_URL` | AI API endpoint | Optional |
| `ZOOM_CLIENT_ID` | Zoom OAuth client ID | Optional |
| `ZOOM_CLIENT_SECRET` | Zoom OAuth secret | Optional |

---

## 🚀 Deployment

### Recommended Platforms
- **Vercel** - Optimized for Next.js
- **Railway** - Easy PostgreSQL + Next.js hosting
- **AWS/GCP** - Enterprise deployments

### Production Checklist
- [ ] Set `DATABASE_URL` to production PostgreSQL
- [ ] Generate secure `AUTH_SECRET`
- [ ] Run `npx prisma migrate deploy`
- [ ] Configure environment variables
- [ ] Set up SSL/TLS

---

## 📄 License

This project is licensed under the MIT License.

---

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.
