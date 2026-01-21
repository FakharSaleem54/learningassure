// Gamification System - Badges, Points, and Leaderboards

class GamificationManager {
  constructor() {
    this.points = this.loadPoints();
    this.badges = this.loadBadges();
    this.achievements = this.loadAchievements();
    this.leaderboard = this.loadLeaderboard();
    this.badgeDefinitions = this.getBadgeDefinitions();
  }

  loadPoints() {
    const stored = localStorage.getItem('user_points');
    return stored ? JSON.parse(stored) : {};
  }

  loadBadges() {
    const stored = localStorage.getItem('user_badges');
    return stored ? JSON.parse(stored) : {};
  }

  loadAchievements() {
    const stored = localStorage.getItem('user_achievements');
    return stored ? JSON.parse(stored) : {};
  }

  loadLeaderboard() {
    const stored = localStorage.getItem('leaderboard');
    return stored ? JSON.parse(stored) : [];
  }

  savePoints() {
    localStorage.setItem('user_points', JSON.stringify(this.points));
  }

  saveBadges() {
    localStorage.setItem('user_badges', JSON.stringify(this.badges));
  }

  saveAchievements() {
    localStorage.setItem('user_achievements', JSON.stringify(this.achievements));
  }

  saveLeaderboard() {
    localStorage.setItem('leaderboard', JSON.stringify(this.leaderboard));
  }

  // Badge definitions
  getBadgeDefinitions() {
    return {
      // Course completion badges
      first_course: {
        id: 'first_course',
        name: 'First Steps',
        description: 'Complete your first course',
        icon: '🎓',
        points: 100,
        category: 'completion'
      },
      course_master: {
        id: 'course_master',
        name: 'Course Master',
        description: 'Complete 10 courses',
        icon: '👑',
        points: 500,
        category: 'completion'
      },
      speed_learner: {
        id: 'speed_learner',
        name: 'Speed Learner',
        description: 'Complete a course in less than 7 days',
        icon: '⚡',
        points: 200,
        category: 'completion'
      },

      // Learning streak badges
      week_streak: {
        id: 'week_streak',
        name: 'Week Warrior',
        description: 'Learn for 7 consecutive days',
        icon: '🔥',
        points: 150,
        category: 'streak'
      },
      month_streak: {
        id: 'month_streak',
        name: 'Monthly Master',
        description: 'Learn for 30 consecutive days',
        icon: '🌟',
        points: 300,
        category: 'streak'
      },

      // Social badges
      helpful: {
        id: 'helpful',
        name: 'Helpful Contributor',
        description: 'Receive 10 helpful votes on forum posts',
        icon: '🤝',
        points: 100,
        category: 'social'
      },
      mentor: {
        id: 'mentor',
        name: 'Mentor',
        description: 'Help 5 learners in the forum',
        icon: '🎯',
        points: 250,
        category: 'social'
      },

      // Assessment badges
      quiz_master: {
        id: 'quiz_master',
        name: 'Quiz Master',
        description: 'Score 100% on 5 quizzes',
        icon: '🧠',
        points: 300,
        category: 'assessment'
      },
      perfect_score: {
        id: 'perfect_score',
        name: 'Perfect Score',
        description: 'Get 100% on any quiz',
        icon: '💯',
        points: 50,
        category: 'assessment'
      },

      // Special badges
      early_bird: {
        id: 'early_bird',
        name: 'Early Bird',
        description: 'Complete a course before the deadline',
        icon: '🐦',
        points: 75,
        category: 'special'
      },
      reviewer: {
        id: 'reviewer',
        name: 'Course Reviewer',
        description: 'Leave reviews for 5 courses',
        icon: '⭐',
        points: 100,
        category: 'special'
      }
    };
  }

  // Points management
  addPoints(userId, points, reason = '') {
    if (!this.points[userId]) {
      this.points[userId] = { total: 0, history: [] };
    }

    this.points[userId].total += points;
    this.points[userId].history.push({
      points: points,
      reason: reason,
      timestamp: new Date().toISOString()
    });

    this.savePoints();
    this.updateLeaderboard();
    this.checkAchievements(userId);

    return this.points[userId].total;
  }

  getUserPoints(userId) {
    return this.points[userId] ? this.points[userId].total : 0;
  }

  getPointsHistory(userId) {
    return this.points[userId] ? this.points[userId].history : [];
  }

  // Badge management
  awardBadge(userId, badgeId) {
    if (!this.badges[userId]) {
      this.badges[userId] = [];
    }

    // Check if user already has this badge
    if (this.badges[userId].some(badge => badge.id === badgeId)) {
      return false; // Already has this badge
    }

    const badgeDef = this.badgeDefinitions[badgeId];
    if (!badgeDef) return false;

    const badge = {
      id: badgeId,
      name: badgeDef.name,
      description: badgeDef.description,
      icon: badgeDef.icon,
      awardedAt: new Date().toISOString(),
      category: badgeDef.category
    };

    this.badges[userId].push(badge);
    this.saveBadges();

    // Award points for the badge
    this.addPoints(userId, badgeDef.points, `Badge earned: ${badgeDef.name}`);

    return badge;
  }

  getUserBadges(userId) {
    return this.badges[userId] || [];
  }

  getBadgeStats(userId) {
    const userBadges = this.getUserBadges(userId);
    const stats = {
      total: userBadges.length,
      byCategory: {}
    };

    userBadges.forEach(badge => {
      stats.byCategory[badge.category] = (stats.byCategory[badge.category] || 0) + 1;
    });

    return stats;
  }

  // Achievement checking
  checkAchievements(userId) {
    // This would be called after various user actions
    // For now, we'll implement basic checks

    const userStats = this.getUserStats(userId);

    // Check course completion achievements
    if (userStats.completedCourses >= 1 && !this.hasBadge(userId, 'first_course')) {
      this.awardBadge(userId, 'first_course');
    }

    if (userStats.completedCourses >= 10 && !this.hasBadge(userId, 'course_master')) {
      this.awardBadge(userId, 'course_master');
    }

    // Check quiz achievements
    if (userStats.perfectQuizzes >= 1 && !this.hasBadge(userId, 'perfect_score')) {
      this.awardBadge(userId, 'perfect_score');
    }

    if (userStats.perfectQuizzes >= 5 && !this.hasBadge(userId, 'quiz_master')) {
      this.awardBadge(userId, 'quiz_master');
    }

    // Check social achievements
    if (userStats.helpfulVotes >= 10 && !this.hasBadge(userId, 'helpful')) {
      this.awardBadge(userId, 'helpful');
    }

    if (userStats.forumHelps >= 5 && !this.hasBadge(userId, 'mentor')) {
      this.awardBadge(userId, 'mentor');
    }
  }

  hasBadge(userId, badgeId) {
    const userBadges = this.getUserBadges(userId);
    return userBadges.some(badge => badge.id === badgeId);
  }

  // User statistics for achievement checking
  getUserStats(userId) {
    // This would aggregate data from various sources
    // Mock implementation
    return {
      completedCourses: Math.floor(Math.random() * 15),
      perfectQuizzes: Math.floor(Math.random() * 8),
      helpfulVotes: Math.floor(Math.random() * 20),
      forumHelps: Math.floor(Math.random() * 10),
      learningStreak: Math.floor(Math.random() * 30)
    };
  }

  // Leaderboard management
  updateLeaderboard() {
    const users = Object.keys(this.points).map(userId => ({
      userId: userId,
      points: this.points[userId].total,
      badges: this.getUserBadges(userId).length,
      level: this.getUserLevel(userId)
    }));

    // Sort by points descending
    users.sort((a, b) => b.points - a.points);

    this.leaderboard = users.slice(0, 100); // Top 100
    this.saveLeaderboard();
  }

  getLeaderboard(limit = 50) {
    return this.leaderboard.slice(0, limit);
  }

  getUserRank(userId) {
    const index = this.leaderboard.findIndex(user => user.userId === userId);
    return index !== -1 ? index + 1 : null;
  }

  // Level system
  getUserLevel(userId) {
    const points = this.getUserPoints(userId);
    // Simple level calculation: 1000 points per level
    return Math.floor(points / 1000) + 1;
  }

  getLevelProgress(userId) {
    const points = this.getUserPoints(userId);
    const currentLevel = this.getUserLevel(userId);
    const pointsForCurrentLevel = (currentLevel - 1) * 1000;
    const pointsForNextLevel = currentLevel * 1000;
    const progress = points - pointsForCurrentLevel;
    const needed = pointsForNextLevel - pointsForCurrentLevel;

    return {
      currentLevel: currentLevel,
      currentPoints: progress,
      pointsNeeded: needed,
      progressPercent: Math.round((progress / needed) * 100)
    };
  }

  // Event triggers for gamification
  onCourseCompleted(userId, courseId, timeToComplete) {
    let points = 500; // Base points for completion
    let reason = 'Course completed';

    // Bonus points for speed
    if (timeToComplete < 7 * 24 * 60 * 60 * 1000) { // Less than 7 days
      points += 200;
      reason += ' (Speed bonus!)';
      this.awardBadge(userId, 'speed_learner');
    }

    this.addPoints(userId, points, reason);
  }

  onQuizCompleted(userId, score, isPerfect = false) {
    let points = Math.round(score * 10); // Points based on score
    let reason = `Quiz completed (${score}%)`;

    if (isPerfect) {
      points += 50;
      reason += ' - Perfect score!';
    }

    this.addPoints(userId, points, reason);
  }

  onForumPost(userId) {
    this.addPoints(userId, 10, 'Forum post created');
  }

  onHelpfulVote(userId) {
    this.addPoints(userId, 25, 'Helpful forum contribution');
  }

  onReviewSubmitted(userId) {
    this.addPoints(userId, 15, 'Course review submitted');
  }

  // Get available badges for display
  getAvailableBadges() {
    return Object.values(this.badgeDefinitions);
  }

  // Get user achievements summary
  getUserAchievementsSummary(userId) {
    const badges = this.getUserBadges(userId);
    const points = this.getUserPoints(userId);
    const level = this.getUserLevel(userId);
    const rank = this.getUserRank(userId);

    return {
      totalPoints: points,
      totalBadges: badges.length,
      currentLevel: level,
      leaderboardRank: rank,
      recentBadges: badges.slice(-3), // Last 3 badges
      levelProgress: this.getLevelProgress(userId)
    };
  }
}

// Initialize gamification system
const GamificationManagerInstance = new GamificationManager();

// Export for global use
window.GamificationManager = GamificationManagerInstance;
