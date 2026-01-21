// Course Archive and Lifecycle Management System

class CourseArchiveManager {
  constructor() {
    this.archivedCourses = this.loadArchivedCourses();
    this.retirementSettings = this.loadRetirementSettings();
  }

  loadArchivedCourses() {
    const stored = localStorage.getItem('archived_courses');
    return stored ? JSON.parse(stored) : [];
  }

  loadRetirementSettings() {
    const stored = localStorage.getItem('course_retirement_settings');
    return stored ? JSON.parse(stored) : {
      autoArchiveInactive: true,
      inactiveThresholdDays: 365,
      autoRetireOld: false,
      retirementThresholdDays: 730,
      notifyBeforeArchive: true,
      archiveNotificationDays: 30
    };
  }

  saveArchivedCourses() {
    localStorage.setItem('archived_courses', JSON.stringify(this.archivedCourses));
  }

  saveRetirementSettings() {
    localStorage.setItem('course_retirement_settings', JSON.stringify(this.retirementSettings));
  }

  // Archive a course
  archiveCourse(courseId, reason = '', archivedBy = null) {
    const course = this.findCourseById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    // Check if course is already archived
    if (this.archivedCourses.some(ac => ac.id === courseId)) {
      throw new Error('Course is already archived');
    }

    // Check if course has active enrollments
    const activeEnrollments = this.getActiveEnrollments(courseId);
    if (activeEnrollments > 0) {
      throw new Error(`Cannot archive course with ${activeEnrollments} active enrollments. Retire the course instead.`);
    }

    const archivedCourse = {
      ...course,
      archivedAt: new Date().toISOString(),
      archivedBy: archivedBy || this.getCurrentUser()?.id,
      archiveReason: reason,
      originalStatus: course.status,
      status: 'archived'
    };

    // Remove from active courses
    this.removeFromActiveCourses(courseId);

    // Add to archived courses
    this.archivedCourses.push(archivedCourse);
    this.saveArchivedCourses();

    // Log the action
    this.logCourseAction(courseId, 'archived', reason, archivedBy);

    return archivedCourse;
  }

  // Retire a course (soft delete with access preservation)
  retireCourse(courseId, reason = '', retiredBy = null) {
    const course = this.findCourseById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    // Check if course is already retired
    if (course.status === 'retired') {
      throw new Error('Course is already retired');
    }

    const retiredCourse = {
      ...course,
      retiredAt: new Date().toISOString(),
      retiredBy: retiredBy || this.getCurrentUser()?.id,
      retirementReason: reason,
      originalStatus: course.status,
      status: 'retired'
    };

    // Update course status (keep in active courses but mark as retired)
    this.updateCourseStatus(courseId, retiredCourse);

    // Log the action
    this.logCourseAction(courseId, 'retired', reason, retiredBy);

    // Notify enrolled users
    this.notifyEnrolledUsers(courseId, 'retired', reason);

    return retiredCourse;
  }

  // Restore an archived course
  restoreArchivedCourse(courseId, restoredBy = null) {
    const archivedCourse = this.archivedCourses.find(ac => ac.id === courseId);
    if (!archivedCourse) {
      throw new Error('Archived course not found');
    }

    // Remove from archived courses
    this.archivedCourses = this.archivedCourses.filter(ac => ac.id !== courseId);
    this.saveArchivedCourses();

    // Restore to active courses with original status
    const restoredCourse = {
      ...archivedCourse,
      status: archivedCourse.originalStatus,
      restoredAt: new Date().toISOString(),
      restoredBy: restoredBy || this.getCurrentUser()?.id
    };

    delete restoredCourse.archivedAt;
    delete restoredCourse.archivedBy;
    delete restoredCourse.archiveReason;

    this.addToActiveCourses(restoredCourse);

    // Log the action
    this.logCourseAction(courseId, 'restored', 'Restored from archive', restoredBy);

    return restoredCourse;
  }

  // Unretire a course
  unretireCourse(courseId, reason = '', unretiredBy = null) {
    const course = this.findCourseById(courseId);
    if (!course || course.status !== 'retired') {
      throw new Error('Course not found or not retired');
    }

    const unretiredCourse = {
      ...course,
      status: course.originalStatus || 'published',
      unretiredAt: new Date().toISOString(),
      unretiredBy: unretiredBy || this.getCurrentUser()?.id,
      unretirementReason: reason
    };

    delete unretiredCourse.retiredAt;
    delete unretiredCourse.retiredBy;
    delete unretiredCourse.retirementReason;

    this.updateCourseStatus(courseId, unretiredCourse);

    // Log the action
    this.logCourseAction(courseId, 'unretired', reason, unretiredBy);

    // Notify enrolled users
    this.notifyEnrolledUsers(courseId, 'unretired', reason);

    return unretiredCourse;
  }

  // Permanently delete a course (dangerous operation)
  permanentlyDeleteCourse(courseId, reason = '', deletedBy = null) {
    // Only allow admins to permanently delete
    const currentUser = this.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error('Only administrators can permanently delete courses');
    }

    // Check if course has any enrollments or certificates
    const enrollments = this.getAllEnrollments(courseId);
    const certificates = this.getCourseCertificates(courseId);

    if (enrollments.length > 0 || certificates.length > 0) {
      throw new Error('Cannot permanently delete course with existing enrollments or certificates');
    }

    // Remove from archived courses if present
    this.archivedCourses = this.archivedCourses.filter(ac => ac.id !== courseId);

    // Remove from active courses
    this.removeFromActiveCourses(courseId);

    this.saveArchivedCourses();

    // Log the action
    this.logCourseAction(courseId, 'permanently_deleted', reason, deletedBy);

    return true;
  }

  // Get archived courses
  getArchivedCourses(options = {}) {
    let archived = [...this.archivedCourses];

    // Filter by date range
    if (options.since) {
      const sinceDate = new Date(options.since);
      archived = archived.filter(ac => new Date(ac.archivedAt) >= sinceDate);
    }

    // Filter by archived by
    if (options.archivedBy) {
      archived = archived.filter(ac => ac.archivedBy === options.archivedBy);
    }

    // Sort by archived date (newest first)
    archived.sort((a, b) => new Date(b.archivedAt) - new Date(a.archivedAt));

    return archived;
  }

  // Get retired courses
  getRetiredCourses(options = {}) {
    const courses = this.loadActiveCourses();
    let retired = courses.filter(c => c.status === 'retired');

    // Filter by date range
    if (options.since) {
      const sinceDate = new Date(options.since);
      retired = retired.filter(c => new Date(c.retiredAt) >= sinceDate);
    }

    // Sort by retired date (newest first)
    retired.sort((a, b) => new Date(b.retiredAt) - new Date(a.retiredAt));

    return retired;
  }

  // Auto-archive inactive courses
  autoArchiveInactiveCourses() {
    if (!this.retirementSettings.autoArchiveInactive) return;

    const courses = this.loadActiveCourses();
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - this.retirementSettings.inactiveThresholdDays);

    const inactiveCourses = courses.filter(course => {
      if (course.status !== 'published') return false;

      const lastActivity = this.getCourseLastActivity(course.id);
      return lastActivity && new Date(lastActivity) < thresholdDate;
    });

    let archivedCount = 0;
    inactiveCourses.forEach(course => {
      try {
        this.archiveCourse(course.id, 'Auto-archived due to inactivity', 'system');
        archivedCount++;
      } catch (error) {
        console.warn(`Failed to auto-archive course ${course.id}:`, error.message);
      }
    });

    return archivedCount;
  }

  // Auto-retire old courses
  autoRetireOldCourses() {
    if (!this.retirementSettings.autoRetireOld) return;

    const courses = this.loadActiveCourses();
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - this.retirementSettings.retirementThresholdDays);

    const oldCourses = courses.filter(course => {
      return course.status === 'published' && new Date(course.createdAt) < thresholdDate;
    });

    let retiredCount = 0;
    oldCourses.forEach(course => {
      try {
        this.retireCourse(course.id, 'Auto-retired due to age', 'system');
        retiredCount++;
      } catch (error) {
        console.warn(`Failed to auto-retire course ${course.id}:`, error.message);
      }
    });

    return retiredCount;
  }

  // Update retirement settings
  updateRetirementSettings(settings) {
    this.retirementSettings = { ...this.retirementSettings, ...settings };
    this.saveRetirementSettings();
  }

  // Get course statistics
  getCourseLifecycleStats() {
    const activeCourses = this.loadActiveCourses();
    const published = activeCourses.filter(c => c.status === 'published').length;
    const drafts = activeCourses.filter(c => c.status === 'draft').length;
    const retired = activeCourses.filter(c => c.status === 'retired').length;
    const archived = this.archivedCourses.length;

    return {
      total: activeCourses.length + archived,
      active: activeCourses.length,
      published,
      drafts,
      retired,
      archived,
      inactiveRate: ((drafts + retired + archived) / (activeCourses.length + archived) * 100).toFixed(1)
    };
  }

  // Helper methods
  findCourseById(courseId) {
    const courses = this.loadActiveCourses();
    return courses.find(c => c.id === courseId);
  }

  loadActiveCourses() {
    const stored = localStorage.getItem('courses');
    return stored ? JSON.parse(stored) : [];
  }

  removeFromActiveCourses(courseId) {
    const courses = this.loadActiveCourses();
    const updatedCourses = courses.filter(c => c.id !== courseId);
    localStorage.setItem('courses', JSON.stringify(updatedCourses));
  }

  addToActiveCourses(course) {
    const courses = this.loadActiveCourses();
    courses.push(course);
    localStorage.setItem('courses', JSON.stringify(courses));
  }

  updateCourseStatus(courseId, updatedCourse) {
    const courses = this.loadActiveCourses();
    const index = courses.findIndex(c => c.id === courseId);
    if (index !== -1) {
      courses[index] = updatedCourse;
      localStorage.setItem('courses', JSON.stringify(courses));
    }
  }

  getActiveEnrollments(courseId) {
    const enrollments = JSON.parse(localStorage.getItem('enrollments') || '[]');
    return enrollments.filter(e => e.courseId === courseId && e.status === 'enrolled').length;
  }

  getAllEnrollments(courseId) {
    const enrollments = JSON.parse(localStorage.getItem('enrollments') || '[]');
    return enrollments.filter(e => e.courseId === courseId);
  }

  getCourseCertificates(courseId) {
    const certificates = JSON.parse(localStorage.getItem('certificates') || '[]');
    return certificates.filter(c => c.courseId === courseId);
  }

  getCourseLastActivity(courseId) {
    const enrollments = this.getAllEnrollments(courseId);
    if (enrollments.length === 0) return null;

    // Find the most recent activity
    const activities = enrollments
      .map(e => e.lastActivity)
      .filter(activity => activity)
      .sort((a, b) => new Date(b) - new Date(a));

    return activities[0] || null;
  }

  getCurrentUser() {
    // Mock implementation - would get from auth system
    return { id: 'admin1', role: 'admin' };
  }

  logCourseAction(courseId, action, reason, performedBy) {
    const logEntry = {
      id: Date.now().toString(),
      courseId,
      action,
      reason,
      performedBy,
      timestamp: new Date().toISOString()
    };

    const logs = JSON.parse(localStorage.getItem('course_action_logs') || '[]');
    logs.push(logEntry);
    localStorage.setItem('course_action_logs', JSON.stringify(logs));
  }

  notifyEnrolledUsers(courseId, action, reason) {
    const enrollments = this.getAllEnrollments(courseId);

    enrollments.forEach(enrollment => {
      if (window.NotificationManager) {
        window.NotificationManager.createNotification(
          enrollment.userId,
          'course_status_changed',
          {
            courseTitle: 'Course', // Would get actual title
            action: action,
            reason: reason
          },
          ['inApp']
        );
      }
    });
  }

  // Bulk operations
  bulkArchiveCourses(courseIds, reason = '', archivedBy = null) {
    const results = { successful: [], failed: [] };

    courseIds.forEach(courseId => {
      try {
        const result = this.archiveCourse(courseId, reason, archivedBy);
        results.successful.push(result);
      } catch (error) {
        results.failed.push({ courseId, error: error.message });
      }
    });

    return results;
  }

  bulkRetireCourses(courseIds, reason = '', retiredBy = null) {
    const results = { successful: [], failed: [] };

    courseIds.forEach(courseId => {
      try {
        const result = this.retireCourse(courseId, reason, retiredBy);
        results.successful.push(result);
      } catch (error) {
        results.failed.push({ courseId, error: error.message });
      }
    });

    return results;
  }

  // Cleanup old archived courses (optional)
  cleanupOldArchivedCourses(daysOld = 1095) { // 3 years
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const oldArchived = this.archivedCourses.filter(ac => new Date(ac.archivedAt) < cutoffDate);

    if (oldArchived.length > 0) {
      // In production, you might want to move these to long-term storage
      console.log(`Found ${oldArchived.length} archived courses older than ${daysOld} days`);
    }

    return oldArchived.length;
  }
}

// Initialize course archive manager
const CourseArchiveManagerInstance = new CourseArchiveManager();

// Export for global use
window.CourseArchiveManager = CourseArchiveManagerInstance;
