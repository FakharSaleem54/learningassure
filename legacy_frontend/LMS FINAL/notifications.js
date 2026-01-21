// Notification System for LMS

class NotificationManager {
  constructor() {
    this.notifications = this.loadNotifications();
    this.settings = this.loadNotificationSettings();
    this.templates = this.getNotificationTemplates();
  }

  loadNotifications() {
    const stored = localStorage.getItem('notifications');
    return stored ? JSON.parse(stored) : [];
  }

  loadNotificationSettings() {
    const stored = localStorage.getItem('notification_settings');
    return stored ? JSON.parse(stored) : this.getDefaultSettings();
  }

  saveNotifications() {
    localStorage.setItem('notifications', JSON.stringify(this.notifications));
  }

  saveNotificationSettings() {
    localStorage.setItem('notification_settings', JSON.stringify(this.settings));
  }

  getDefaultSettings() {
    return {
      email: {
        courseUpdates: true,
        enrollmentConfirmations: true,
        certificateReady: true,
        forumReplies: true,
        marketing: false
      },
      inApp: {
        courseReminders: true,
        achievementUnlocked: true,
        forumMentions: true,
        newMessages: true,
        systemUpdates: true
      },
      push: {
        courseDeadlines: true,
        liveSessions: true,
        importantUpdates: true
      }
    };
  }

  getNotificationTemplates() {
    return {
      // Course-related notifications
      course_enrolled: {
        title: 'Welcome to {courseTitle}!',
        message: 'You have successfully enrolled in {courseTitle}. Start learning now!',
        type: 'success',
        category: 'course'
      },
      course_completed: {
        title: 'Congratulations! 🎉',
        message: 'You have completed {courseTitle}. Your certificate is ready!',
        type: 'achievement',
        category: 'course'
      },
      course_reminder: {
        title: 'Continue Learning',
        message: 'Don\'t forget to continue {courseTitle}. You\'re making great progress!',
        type: 'reminder',
        category: 'course'
      },
      course_deadline: {
        title: 'Course Deadline Approaching',
        message: '{courseTitle} deadline is in {daysLeft} days. Complete it on time!',
        type: 'warning',
        category: 'course'
      },

      // Achievement notifications
      badge_earned: {
        title: 'New Badge Unlocked! 🏆',
        message: 'Congratulations! You earned the "{badgeName}" badge.',
        type: 'achievement',
        category: 'gamification'
      },
      level_up: {
        title: 'Level Up! 🚀',
        message: 'You reached level {level}! Keep up the great work.',
        type: 'achievement',
        category: 'gamification'
      },

      // Social notifications
      forum_reply: {
        title: 'New Reply',
        message: '{userName} replied to your post in {forumTitle}',
        type: 'social',
        category: 'forum'
      },
      forum_mention: {
        title: 'You were mentioned',
        message: '{userName} mentioned you in {forumTitle}',
        type: 'social',
        category: 'forum'
      },

      // System notifications
      certificate_ready: {
        title: 'Certificate Ready',
        message: 'Your certificate for {courseTitle} is now available for download.',
        type: 'success',
        category: 'certificate'
      },
      live_session: {
        title: 'Live Session Starting',
        message: '{courseTitle} live session starts in {minutes} minutes.',
        type: 'info',
        category: 'live'
      },
      system_update: {
        title: 'Platform Update',
        message: 'Learning Assure has been updated with new features!',
        type: 'info',
        category: 'system'
      },

      // Payment notifications
      payment_success: {
        title: 'Payment Successful',
        message: 'Your payment of ${amount} has been processed successfully.',
        type: 'success',
        category: 'payment'
      },
      subscription_expiring: {
        title: 'Subscription Expiring',
        message: 'Your subscription expires in {daysLeft} days. Renew now to continue learning.',
        type: 'warning',
        category: 'subscription'
      }
    };
  }

  // Create and send notification
  createNotification(userId, templateKey, data = {}, channels = ['inApp']) {
    const template = this.templates[templateKey];
    if (!template) return null;

    const notification = {
      id: Date.now().toString(),
      userId: userId,
      template: templateKey,
      title: this.interpolateString(template.title, data),
      message: this.interpolateString(template.message, data),
      type: template.type,
      category: template.category,
      data: data,
      channels: channels,
      read: false,
      createdAt: new Date().toISOString(),
      expiresAt: this.getExpirationDate(template.category)
    };

    this.notifications.push(notification);
    this.saveNotifications();

    // Send through specified channels
    this.sendThroughChannels(notification, channels);

    return notification;
  }

  interpolateString(template, data) {
    return template.replace(/{(\w+)}/g, (match, key) => {
      return data[key] !== undefined ? data[key] : match;
    });
  }

  getExpirationDate(category) {
    const now = new Date();
    switch (category) {
      case 'achievement':
        now.setDate(now.getDate() + 30); // 30 days
        break;
      case 'reminder':
        now.setDate(now.getDate() + 7); // 7 days
        break;
      case 'warning':
        now.setDate(now.getDate() + 3); // 3 days
        break;
      default:
        now.setDate(now.getDate() + 14); // 14 days
    }
    return now.toISOString();
  }

  sendThroughChannels(notification, channels) {
    channels.forEach(channel => {
      switch (channel) {
        case 'inApp':
          this.sendInApp(notification);
          break;
        case 'email':
          this.sendEmail(notification);
          break;
        case 'push':
          this.sendPush(notification);
          break;
      }
    });
  }

  sendInApp(notification) {
    // In-app notification is already stored
    // Could trigger UI updates here
    console.log('In-app notification:', notification.title);
  }

  sendEmail(notification) {
    // Mock email sending
    console.log('Email sent:', notification.title);
    // In production, this would integrate with email service
  }

  sendPush(notification) {
    // Mock push notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico'
      });
    }
    console.log('Push notification:', notification.title);
  }

  // Get notifications for user
  getUserNotifications(userId, options = {}) {
    let userNotifications = this.notifications.filter(n => n.userId === userId);

    // Filter by read status
    if (options.unreadOnly) {
      userNotifications = userNotifications.filter(n => !n.read);
    }

    // Filter by category
    if (options.category) {
      userNotifications = userNotifications.filter(n => n.category === options.category);
    }

    // Filter by date range
    if (options.since) {
      const sinceDate = new Date(options.since);
      userNotifications = userNotifications.filter(n =>
        new Date(n.createdAt) >= sinceDate
      );
    }

    // Sort by creation date (newest first)
    userNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Apply limit
    if (options.limit) {
      userNotifications = userNotifications.slice(0, options.limit);
    }

    return userNotifications;
  }

  // Mark notification as read
  markAsRead(notificationId) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      notification.readAt = new Date().toISOString();
      this.saveNotifications();
      return true;
    }
    return false;
  }

  // Mark all notifications as read for user
  markAllAsRead(userId) {
    const userNotifications = this.notifications.filter(n => n.userId === userId && !n.read);
    userNotifications.forEach(n => {
      n.read = true;
      n.readAt = new Date().toISOString();
    });
    this.saveNotifications();
  }

  // Delete notification
  deleteNotification(notificationId) {
    const index = this.notifications.findIndex(n => n.id === notificationId);
    if (index !== -1) {
      this.notifications.splice(index, 1);
      this.saveNotifications();
      return true;
    }
    return false;
  }

  // Get notification settings for user
  getUserSettings(userId) {
    return this.settings[userId] || this.getDefaultSettings();
  }

  // Update notification settings
  updateUserSettings(userId, newSettings) {
    this.settings[userId] = { ...this.getDefaultSettings(), ...newSettings };
    this.saveNotificationSettings();
  }

  // Clean up expired notifications
  cleanupExpiredNotifications() {
    const now = new Date();
    this.notifications = this.notifications.filter(n => {
      const expiresAt = new Date(n.expiresAt);
      return expiresAt > now;
    });
    this.saveNotifications();
  }

  // Auto-send reminders for incomplete courses
  sendCourseReminders() {
    // This would be called by a scheduled job
    const enrolledUsers = this.getAllEnrolledUsers();

    enrolledUsers.forEach(user => {
      const incompleteCourses = this.getIncompleteCourses(user.userId);

      incompleteCourses.forEach(course => {
        const lastActivity = this.getLastActivity(user.userId, course.id);
        const daysSinceActivity = this.getDaysSince(lastActivity);

        if (daysSinceActivity >= 7) { // Send reminder after 7 days of inactivity
          this.createNotification(user.userId, 'course_reminder', {
            courseTitle: course.title
          }, ['inApp', 'email']);
        }
      });
    });
  }

  // Send deadline reminders
  sendDeadlineReminders() {
    const enrolledUsers = this.getAllEnrolledUsers();

    enrolledUsers.forEach(user => {
      const coursesWithDeadlines = this.getCoursesWithDeadlines(user.userId);

      coursesWithDeadlines.forEach(course => {
        const daysLeft = this.getDaysUntilDeadline(course.deadline);

        if (daysLeft <= 3 && daysLeft > 0) { // Remind 3 days before deadline
          this.createNotification(user.userId, 'course_deadline', {
            courseTitle: course.title,
            daysLeft: daysLeft
          }, ['inApp', 'push']);
        }
      });
    });
  }

  // Helper methods (mock implementations)
  getAllEnrolledUsers() {
    // Mock data - would get from enrollment system
    return [
      { userId: 'user1', name: 'John Doe' },
      { userId: 'user2', name: 'Jane Smith' }
    ];
  }

  getIncompleteCourses(userId) {
    // Mock data
    return [
      { id: 'course1', title: 'JavaScript Basics' },
      { id: 'course2', title: 'React Development' }
    ];
  }

  getLastActivity(userId, courseId) {
    // Mock data
    return new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10 days ago
  }

  getDaysSince(date) {
    const now = new Date();
    const diffTime = Math.abs(now - date);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getCoursesWithDeadlines(userId) {
    // Mock data
    return [
      { id: 'course1', title: 'JavaScript Basics', deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) }
    ];
  }

  getDaysUntilDeadline(deadline) {
    const now = new Date();
    const diffTime = deadline - now;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Request notification permissions
  async requestNotificationPermission() {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }

  // Get notification statistics
  getNotificationStats(userId) {
    const userNotifications = this.notifications.filter(n => n.userId === userId);

    return {
      total: userNotifications.length,
      unread: userNotifications.filter(n => !n.read).length,
      byCategory: this.groupBy(userNotifications, 'category'),
      byType: this.groupBy(userNotifications, 'type')
    };
  }

  groupBy(array, key) {
    return array.reduce((groups, item) => {
      const value = item[key];
      groups[value] = (groups[value] || 0) + 1;
      return groups;
    }, {});
  }
}

// Initialize notification system
const NotificationManagerInstance = new NotificationManager();

// Export for global use
window.NotificationManager = NotificationManagerInstance;
