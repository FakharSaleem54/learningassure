// AI Course Recommendation System for LMS

class AIRecommendationEngine {
  constructor() {
    this.userProfiles = this.loadUserProfiles();
    this.courseData = this.loadCourseData();
    this.interactionHistory = this.loadInteractionHistory();
    this.recommendationCache = new Map();
    this.similarityThreshold = 0.6;
    this.linkedinIntegration = null; // Will be set when LinkedIn data is available
  }

  loadUserProfiles() {
    const stored = localStorage.getItem('user_profiles');
    return stored ? JSON.parse(stored) : {};
  }

  loadCourseData() {
    // Use CourseManager if available (preferred), otherwise fall back to localStorage
    if (window.CourseManager && typeof window.CourseManager.getAllCourses === 'function') {
      return window.CourseManager.getAllCourses();
    }
    const stored = localStorage.getItem('courses');
    return stored ? JSON.parse(stored) : [];
  }

  loadInteractionHistory() {
    const stored = localStorage.getItem('user_interactions');
    return stored ? JSON.parse(stored) : [];
  }

  saveUserProfiles() {
    localStorage.setItem('user_profiles', JSON.stringify(this.userProfiles));
  }

  saveInteractionHistory() {
    localStorage.setItem('user_interactions', JSON.stringify(this.interactionHistory));
  }

  // Track user interaction
  trackInteraction(userId, action, data) {
    const interaction = {
      id: Date.now().toString(),
      userId,
      action, // 'view_course', 'enroll_course', 'complete_course', 'rate_course', 'search', etc.
      data,
      timestamp: new Date().toISOString()
    };

    this.interactionHistory.push(interaction);
    this.saveInteractionHistory();

    // Update user profile based on interaction
    this.updateUserProfile(userId, interaction);

    // Clear recommendation cache for this user
    this.recommendationCache.delete(userId);
  }

  // Update user profile based on interactions
  updateUserProfile(userId, interaction) {
    if (!this.userProfiles[userId]) {
      this.userProfiles[userId] = {
        interests: {},
        skills: {},
        learningStyle: {},
        completedCourses: [],
        viewedCourses: [],
        searchHistory: [],
        ratings: {},
        timeSpent: {},
        preferredCategories: {},
        difficultyPreference: 'intermediate',
        learningGoals: [],
        linkedinData: null // Store LinkedIn profile data
      };
    }

    const profile = this.userProfiles[userId];

    switch (interaction.action) {
      case 'view_course':
        if (!profile.viewedCourses.includes(interaction.data.courseId)) {
          profile.viewedCourses.push(interaction.data.courseId);
        }
        // Update category preferences
        const course = this.courseData.find(c => c.id === interaction.data.courseId);
        if (course) {
          profile.preferredCategories[course.category] = (profile.preferredCategories[course.category] || 0) + 1;
        }
        break;

      case 'enroll_course':
        // Track enrollment patterns
        profile.learningGoals.push(interaction.data.goal || 'skill_development');
        break;

      case 'complete_course':
        if (!profile.completedCourses.includes(interaction.data.courseId)) {
          profile.completedCourses.push(interaction.data.courseId);
        }
        // Update skills
        const completedCourse = this.courseData.find(c => c.id === interaction.data.courseId);
        if (completedCourse) {
          profile.skills[completedCourse.category] = (profile.skills[completedCourse.category] || 0) + 1;
        }
        break;

      case 'rate_course':
        profile.ratings[interaction.data.courseId] = interaction.data.rating;
        break;

      case 'search':
        profile.searchHistory.push(interaction.data.query);
        // Extract keywords from search
        this.extractKeywordsFromSearch(profile, interaction.data.query);
        break;

      case 'time_spent':
        profile.timeSpent[interaction.data.courseId] = (profile.timeSpent[interaction.data.courseId] || 0) + interaction.data.duration;
        break;

      case 'linkedin_sync':
        // Sync LinkedIn profile data
        this.syncLinkedInData(userId, interaction.data.linkedinProfile);
        break;
    }

    this.saveUserProfiles();
  }

  // Extract keywords from search queries
  extractKeywordsFromSearch(profile, query) {
    const keywords = query.toLowerCase().split(/\s+/);
    keywords.forEach(keyword => {
      if (keyword.length > 2) { // Ignore very short words
        profile.interests[keyword] = (profile.interests[keyword] || 0) + 1;
      }
    });
  }

  // Get personalized course recommendations
  getRecommendations(userId, options = {}) {
    const limit = options.limit || 10;
    const cacheKey = `${userId}_${limit}`;

    // Check cache first
    if (this.recommendationCache.has(cacheKey)) {
      return this.recommendationCache.get(cacheKey);
    }

    const profile = this.userProfiles[userId];
    if (!profile) {
      // New user - return popular courses
      return this.getPopularCourses(limit);
    }

    const recommendations = [];

    // 1. Content-based filtering (based on user's interests and completed courses)
    const contentBased = this.getContentBasedRecommendations(profile, limit * 2);

    // 2. Collaborative filtering (based on similar users)
    const collaborative = this.getCollaborativeRecommendations(userId, limit * 2);

    // 3. Popularity-based (fallback)
    const popular = this.getPopularCourses(limit);

    // Combine and deduplicate recommendations
    const allRecommendations = [...contentBased, ...collaborative, ...popular];
    const seen = new Set();
    const uniqueRecommendations = allRecommendations.filter(rec => {
      if (seen.has(rec.courseId)) return false;
      seen.add(rec.courseId);
      return true;
    });

    // Sort by relevance score and limit
    const finalRecommendations = uniqueRecommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    // Cache the results
    this.recommendationCache.set(cacheKey, finalRecommendations);

    return finalRecommendations;
  }

  // Content-based recommendations
  getContentBasedRecommendations(profile, limit) {
    const recommendations = [];

    this.courseData.forEach(course => {
      let score = 0;

      // Skip courses user has already completed or is enrolled in
      if (profile.completedCourses.includes(course.id)) return;
      if (this.isUserEnrolled(profile.id, course.id)) return;

      // Category preference matching
      if (profile.preferredCategories[course.category]) {
        score += profile.preferredCategories[course.category] * 0.3;
      }

      // Skill gap analysis
      if (profile.skills[course.category] && profile.skills[course.category] < 3) {
        score += (3 - profile.skills[course.category]) * 0.2;
      }

      // Interest keyword matching
      const courseKeywords = this.extractCourseKeywords(course);
      Object.keys(profile.interests).forEach(interest => {
        if (courseKeywords.includes(interest)) {
          score += profile.interests[interest] * 0.1;
        }
      });

      // Difficulty matching
      if (course.level === profile.difficultyPreference) {
        score += 0.2;
      }

      // Learning goal alignment
      if (this.matchesLearningGoals(course, profile.learningGoals)) {
        score += 0.3;
      }

      // LinkedIn skills matching
      if (profile.linkedinData?.skills) {
        const linkedinSkills = profile.linkedinData.skills.map(skill => skill.toLowerCase());
        const courseText = `${course.title} ${course.description} ${course.category}`.toLowerCase();

        linkedinSkills.forEach(skill => {
          if (courseText.includes(skill)) {
            score += 0.4; // Boost score for LinkedIn skill matches
          }
        });
      }

      // LinkedIn experience matching
      if (profile.linkedinData?.positions) {
        profile.linkedinData.positions.forEach(position => {
          const industryMatch = course.category.toLowerCase().includes(position.industry?.toLowerCase());
          const titleMatch = course.title.toLowerCase().includes(position.title?.toLowerCase());

          if (industryMatch || titleMatch) {
            score += 0.25; // Boost for relevant experience
          }
        });
      }

      // LinkedIn education matching
      if (profile.linkedinData?.education) {
        profile.linkedinData.education.forEach(edu => {
          const fieldMatch = course.category.toLowerCase().includes(edu.fieldOfStudy?.toLowerCase());
          if (fieldMatch) {
            score += 0.2; // Boost for educational background match
          }
        });
      }

      if (score > 0) {
        recommendations.push({
          courseId: course.id,
          course: course,
          score: score,
          reason: this.generateRecommendationReason(course, profile, score)
        });
      }
    });

    return recommendations.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  // Collaborative filtering recommendations
  getCollaborativeRecommendations(userId, limit) {
    const similarUsers = this.findSimilarUsers(userId);
    const recommendations = [];

    similarUsers.forEach(similarUser => {
      const similarProfile = this.userProfiles[similarUser.userId];

      // Get courses the similar user liked but current user hasn't seen
      similarProfile.completedCourses.forEach(courseId => {
        if (!this.userProfiles[userId].completedCourses.includes(courseId) &&
            !this.isUserEnrolled(userId, courseId)) {

          const course = this.courseData.find(c => c.id === courseId);
          if (course) {
            const existingRec = recommendations.find(r => r.courseId === courseId);
            if (existingRec) {
              existingRec.score += similarUser.similarity * 0.5;
            } else {
              recommendations.push({
                courseId: courseId,
                course: course,
                score: similarUser.similarity * 0.5,
                reason: `Recommended because similar learners enjoyed this course`
              });
            }
          }
        }
      });
    });

    return recommendations.slice(0, limit);
  }

  // Find similar users based on profile similarity
  findSimilarUsers(userId, limit = 10) {
    const currentProfile = this.userProfiles[userId];
    const similarities = [];

    Object.keys(this.userProfiles).forEach(otherUserId => {
      if (otherUserId === userId) return;

      const otherProfile = this.userProfiles[otherUserId];
      const similarity = this.calculateProfileSimilarity(currentProfile, otherProfile);

      if (similarity > this.similarityThreshold) {
        similarities.push({
          userId: otherUserId,
          similarity: similarity
        });
      }
    });

    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }

  // Calculate similarity between two user profiles
  calculateProfileSimilarity(profile1, profile2) {
    let similarity = 0;
    let factors = 0;

    // Category preferences similarity
    const categories1 = Object.keys(profile1.preferredCategories);
    const categories2 = Object.keys(profile2.preferredCategories);
    const commonCategories = categories1.filter(cat => categories2.includes(cat));

    if (commonCategories.length > 0) {
      const categorySimilarity = commonCategories.length / Math.max(categories1.length, categories2.length);
      similarity += categorySimilarity * 0.3;
      factors++;
    }

    // Skills similarity
    const skills1 = Object.keys(profile1.skills);
    const skills2 = Object.keys(profile2.skills);
    const commonSkills = skills1.filter(skill => skills2.includes(skill));

    if (commonSkills.length > 0) {
      const skillSimilarity = commonSkills.length / Math.max(skills1.length, skills2.length);
      similarity += skillSimilarity * 0.3;
      factors++;
    }

    // Completed courses similarity
    const completed1 = profile1.completedCourses;
    const completed2 = profile2.completedCourses;
    const commonCompleted = completed1.filter(courseId => completed2.includes(courseId));

    if (completed1.length > 0 && completed2.length > 0) {
      const completionSimilarity = commonCompleted.length / Math.max(completed1.length, completed2.length);
      similarity += completionSimilarity * 0.4;
      factors++;
    }

    return factors > 0 ? similarity / factors : 0;
  }

  // Get popular courses as fallback
  getPopularCourses(limit) {
    const courseStats = {};

    // Calculate popularity based on enrollments and ratings
    this.courseData.forEach(course => {
      const enrollments = this.getCourseEnrollmentCount(course.id);
      const avgRating = this.getCourseAverageRating(course.id);

      courseStats[course.id] = {
        course: course,
        score: (enrollments * 0.7) + (avgRating * 10 * 0.3),
        reason: `${enrollments} learners enrolled, ${avgRating.toFixed(1)} ⭐ average rating`
      };
    });

    return Object.values(courseStats)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(stat => ({
        courseId: stat.course.id,
        course: stat.course,
        score: stat.score,
        reason: stat.reason
      }));
  }

  // Helper methods
  extractCourseKeywords(course) {
    const keywords = [];
    const text = `${course.title} ${course.description} ${course.category}`.toLowerCase();
    const words = text.split(/\s+/);

    words.forEach(word => {
      if (word.length > 2 && !this.isStopWord(word)) {
        keywords.push(word);
      }
    });

    return [...new Set(keywords)]; // Remove duplicates
  }

  isStopWord(word) {
    const stopWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'an', 'a'];
    return stopWords.includes(word);
  }

  matchesLearningGoals(course, goals) {
    if (!goals || goals.length === 0) return false;

    const courseText = `${course.title} ${course.description}`.toLowerCase();
    return goals.some(goal =>
      courseText.includes(goal.toLowerCase()) ||
      course.category.toLowerCase().includes(goal.toLowerCase())
    );
  }

  getCourseEnrollmentCount(courseId) {
    const enrollments = JSON.parse(localStorage.getItem('enrollments') || '[]');
    return enrollments.filter(e => e.courseId === courseId).length;
  }

  getCourseAverageRating(courseId) {
    const ratings = Object.values(this.userProfiles)
      .map(profile => profile.ratings[courseId])
      .filter(rating => rating !== undefined);

    if (ratings.length === 0) return 0;
    return ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
  }

  isUserEnrolled(userId, courseId) {
    const enrollments = JSON.parse(localStorage.getItem('enrollments') || '[]');
    return enrollments.some(e => e.userId === userId && e.courseId === courseId);
  }

  generateRecommendationReason(course, profile, score) {
    const reasons = [];

    if (profile.preferredCategories[course.category]) {
      reasons.push(`Based on your interest in ${course.category}`);
    }

    if (profile.completedCourses.length > 0) {
      reasons.push('Similar to courses you\'ve completed');
    }

    if (score > 0.8) {
      reasons.push('Highly recommended for you');
    } else if (score > 0.5) {
      reasons.push('Good match for your learning style');
    }

    return reasons.length > 0 ? reasons[0] : 'Personalized recommendation';
  }

  // Get trending courses
  getTrendingCourses(limit = 10) {
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const recentInteractions = this.interactionHistory.filter(interaction =>
      new Date(interaction.timestamp) > lastWeek &&
      (interaction.action === 'enroll_course' || interaction.action === 'view_course')
    );

    const courseCounts = {};
    recentInteractions.forEach(interaction => {
      courseCounts[interaction.data.courseId] = (courseCounts[interaction.data.courseId] || 0) + 1;
    });

    return Object.entries(courseCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([courseId, count]) => {
        const course = this.courseData.find(c => c.id === courseId);
        return {
          courseId,
          course,
          score: count,
          reason: `${count} recent interactions this week`
        };
      });
  }

  // Get courses for skill development
  getCoursesForSkill(skill, userId, limit = 5) {
    const profile = this.userProfiles[userId];
    const currentSkillLevel = profile?.skills[skill] || 0;

    return this.courseData
      .filter(course =>
        course.category.toLowerCase().includes(skill.toLowerCase()) &&
        !profile?.completedCourses.includes(course.id) &&
        !this.isUserEnrolled(userId, course.id)
      )
      .sort((a, b) => {
        // Prefer courses at appropriate difficulty level
        const aLevel = this.getDifficultyLevel(a.level);
        const bLevel = this.getDifficultyLevel(b.level);
        const targetLevel = Math.min(currentSkillLevel + 1, 3);

        return Math.abs(aLevel - targetLevel) - Math.abs(bLevel - targetLevel);
      })
      .slice(0, limit)
      .map(course => ({
        courseId: course.id,
        course,
        score: 0.8,
        reason: `Develop your ${skill} skills`
      }));
  }

  getDifficultyLevel(level) {
    const levels = { 'beginner': 1, 'intermediate': 2, 'advanced': 3 };
    return levels[level.toLowerCase()] || 2;
  }

  // Clear recommendation cache (useful after major data changes)
  clearCache() {
    this.recommendationCache.clear();
  }

  // Sync LinkedIn data with user profile
  syncLinkedInData(userId, linkedinProfile) {
    const profile = this.userProfiles[userId];
    if (!profile) return;

    profile.linkedinData = {
      skills: linkedinProfile.skills || [],
      positions: linkedinProfile.positions || [],
      education: linkedinProfile.education || [],
      lastSync: new Date().toISOString()
    };

    // Update profile skills based on LinkedIn data
    if (linkedinProfile.skills) {
      linkedinProfile.skills.forEach(skill => {
        const skillName = skill.toLowerCase();
        profile.skills[skillName] = (profile.skills[skillName] || 0) + 2; // Boost LinkedIn skills
      });
    }

    // Update interests based on positions and education
    if (linkedinProfile.positions) {
      linkedinProfile.positions.forEach(position => {
        if (position.industry) {
          profile.interests[position.industry.toLowerCase()] = (profile.interests[position.industry.toLowerCase()] || 0) + 1;
        }
      });
    }

    if (linkedinProfile.education) {
      linkedinProfile.education.forEach(edu => {
        if (edu.fieldOfStudy) {
          profile.interests[edu.fieldOfStudy.toLowerCase()] = (profile.interests[edu.fieldOfStudy.toLowerCase()] || 0) + 1;
        }
      });
    }

    this.saveUserProfiles();
    this.clearCache(); // Clear cache to reflect new data
  }

  // Set LinkedIn integration instance
  setLinkedInIntegration(linkedinInstance) {
    this.linkedinIntegration = linkedinInstance;
  }

  // Get LinkedIn-enhanced recommendations
  getLinkedInEnhancedRecommendations(userId, options = {}) {
    const profile = this.userProfiles[userId];
    if (!profile?.linkedinData) {
      // Fall back to regular recommendations if no LinkedIn data
      return this.getRecommendations(userId, options);
    }

    const recommendations = this.getRecommendations(userId, options);

    // Add LinkedIn-specific insights to reasons
    return recommendations.map(rec => ({
      ...rec,
      linkedinInsights: this.generateLinkedInInsights(rec.course, profile.linkedinData)
    }));
  }

  // Generate LinkedIn-specific insights for a course
  generateLinkedInInsights(course, linkedinData) {
    const insights = [];

    // Check if course matches LinkedIn skills
    if (linkedinData.skills) {
      const courseText = `${course.title} ${course.description} ${course.category}`.toLowerCase();
      const matchingSkills = linkedinData.skills.filter(skill =>
        courseText.includes(skill.toLowerCase())
      );

      if (matchingSkills.length > 0) {
        insights.push(`Builds on your ${matchingSkills.join(', ')} skills`);
      }
    }

    // Check career progression
    if (linkedinData.positions) {
      const relevantPositions = linkedinData.positions.filter(pos =>
        course.category.toLowerCase().includes(pos.industry?.toLowerCase()) ||
        course.title.toLowerCase().includes(pos.title?.toLowerCase())
      );

      if (relevantPositions.length > 0) {
        insights.push('Aligns with your career path');
      }
    }

    // Check educational background
    if (linkedinData.education) {
      const relevantEducation = linkedinData.education.filter(edu =>
        course.category.toLowerCase().includes(edu.fieldOfStudy?.toLowerCase())
      );

      if (relevantEducation.length > 0) {
        insights.push('Complements your educational background');
      }
    }

    return insights;
  }

  // Get recommendation statistics
  getRecommendationStats() {
    const totalUsers = Object.keys(this.userProfiles).length;
    const totalInteractions = this.interactionHistory.length;
    const avgInteractionsPerUser = totalUsers > 0 ? totalInteractions / totalUsers : 0;
    const linkedinUsers = Object.values(this.userProfiles).filter(p => p.linkedinData).length;

    return {
      totalUsers,
      totalInteractions,
      avgInteractionsPerUser: avgInteractionsPerUser.toFixed(1),
      cacheSize: this.recommendationCache.size,
      linkedinUsers,
      linkedinIntegrationRate: totalUsers > 0 ? ((linkedinUsers / totalUsers) * 100).toFixed(1) : 0
    };
  }
}

// Initialize AI recommendation engine
const AIRecommendationEngineInstance = new AIRecommendationEngine();

// Export for global use
window.AIRecommendationEngine = AIRecommendationEngineInstance;
