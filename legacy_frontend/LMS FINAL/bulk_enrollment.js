// Bulk Enrollment System for LMS

class BulkEnrollmentManager {
  constructor() {
    this.enrollmentHistory = this.loadEnrollmentHistory();
    this.templates = this.getEnrollmentTemplates();
  }

  loadEnrollmentHistory() {
    const stored = localStorage.getItem('bulk_enrollment_history');
    return stored ? JSON.parse(stored) : [];
  }

  saveEnrollmentHistory() {
    localStorage.setItem('bulk_enrollment_history', JSON.stringify(this.enrollmentHistory));
  }

  getEnrollmentTemplates() {
    return {
      csv: {
        headers: ['email', 'firstName', 'lastName', 'department', 'role'],
        sampleData: [
          ['john.doe@company.com', 'John', 'Doe', 'Engineering', 'learner'],
          ['jane.smith@company.com', 'Jane', 'Smith', 'Marketing', 'learner'],
          ['bob.wilson@company.com', 'Bob', 'Wilson', 'HR', 'instructor']
        ]
      },
      json: {
        sampleData: [
          {
            email: 'john.doe@company.com',
            firstName: 'John',
            lastName: 'Doe',
            department: 'Engineering',
            role: 'learner'
          },
          {
            email: 'jane.smith@company.com',
            firstName: 'Jane',
            lastName: 'Smith',
            department: 'Marketing',
            role: 'learner'
          }
        ]
      }
    };
  }

  // Parse CSV data
  parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

    const data = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      if (values.length === headers.length) {
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });
        data.push(row);
      }
    }

    return data;
  }

  // Parse JSON data
  parseJSON(jsonText) {
    try {
      return JSON.parse(jsonText);
    } catch (error) {
      throw new Error('Invalid JSON format');
    }
  }

  // Validate enrollment data
  validateEnrollmentData(data, courseId = null) {
    const errors = [];
    const validRoles = ['learner', 'instructor', 'admin'];

    data.forEach((user, index) => {
      // Required fields validation
      if (!user.email || !this.isValidEmail(user.email)) {
        errors.push(`Row ${index + 1}: Invalid or missing email`);
      }

      if (!user.firstName || user.firstName.trim().length < 2) {
        errors.push(`Row ${index + 1}: First name must be at least 2 characters`);
      }

      if (!user.lastName || user.lastName.trim().length < 2) {
        errors.push(`Row ${index + 1}: Last name must be at least 2 characters`);
      }

      if (user.role && !validRoles.includes(user.role.toLowerCase())) {
        errors.push(`Row ${index + 1}: Invalid role. Must be one of: ${validRoles.join(', ')}`);
      }

      // Check for duplicates in the batch
      const duplicateIndex = data.findIndex((u, i) =>
        i !== index && u.email.toLowerCase() === user.email.toLowerCase()
      );
      if (duplicateIndex !== -1) {
        errors.push(`Row ${index + 1}: Duplicate email in batch`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Process bulk enrollment
  async processBulkEnrollment(data, options = {}) {
    const {
      courseId = null,
      sendWelcomeEmails = true,
      autoGeneratePasswords = true,
      defaultRole = 'learner',
      notifyOnCompletion = true
    } = options;

    const batchId = Date.now().toString();
    const results = {
      batchId: batchId,
      total: data.length,
      successful: 0,
      failed: 0,
      errors: [],
      processedAt: new Date().toISOString()
    };

    // Validate data first
    const validation = this.validateEnrollmentData(data, courseId);
    if (!validation.isValid) {
      results.failed = data.length;
      results.errors = validation.errors;
      this.saveEnrollmentHistory();
      return results;
    }

    // Process each user
    for (let i = 0; i < data.length; i++) {
      const userData = data[i];

      try {
        const user = await this.createOrUpdateUser(userData, {
          autoGeneratePasswords,
          defaultRole,
          courseId
        });

        if (courseId) {
          await this.enrollUserInCourse(user.id, courseId);
        }

        if (sendWelcomeEmails) {
          await this.sendWelcomeEmail(user, courseId);
        }

        results.successful++;

        // Add to gamification if new user
        if (window.GamificationManager) {
          window.GamificationManager.addPoints(user.id, 50, 'Account created via bulk enrollment');
        }

      } catch (error) {
        results.failed++;
        results.errors.push(`Row ${i + 1} (${userData.email}): ${error.message}`);
      }
    }

    // Save to history
    this.enrollmentHistory.push(results);
    this.saveEnrollmentHistory();

    // Send completion notification
    if (notifyOnCompletion && window.NotificationManager) {
      const currentUser = this.getCurrentUser();
      if (currentUser) {
        window.NotificationManager.createNotification(
          currentUser.id,
          'bulk_enrollment_complete',
          {
            successful: results.successful,
            failed: results.failed,
            total: results.total
          },
          ['inApp']
        );
      }
    }

    return results;
  }

  // Create or update user
  async createOrUpdateUser(userData, options) {
    const { autoGeneratePasswords, defaultRole } = options;

    // Check if user already exists
    let user = this.findUserByEmail(userData.email);

    if (user) {
      // Update existing user
      user.firstName = userData.firstName;
      user.lastName = userData.lastName;
      user.department = userData.department;
      user.role = userData.role || user.role || defaultRole;
      user.updatedAt = new Date().toISOString();
      this.updateUser(user);
      return user;
    } else {
      // Create new user
      const password = autoGeneratePasswords ?
        this.generatePassword() :
        'TempPass123!'; // Default temp password

      user = {
        id: Date.now().toString(),
        email: userData.email.toLowerCase(),
        firstName: userData.firstName,
        lastName: userData.lastName,
        department: userData.department,
        role: userData.role || defaultRole,
        password: this.hashPassword(password), // In production, use proper hashing
        isActive: true,
        emailVerified: false,
        createdAt: new Date().toISOString(),
        enrolledCourses: [],
        tempPassword: autoGeneratePasswords
      };

      this.saveUser(user);
      return user;
    }
  }

  // Enroll user in course
  async enrollUserInCourse(userId, courseId) {
    const enrollment = {
      userId: userId,
      courseId: courseId,
      enrolledAt: new Date().toISOString(),
      progress: 0,
      status: 'enrolled',
      completedLessons: [],
      quizScores: {}
    };

    // Save enrollment (mock implementation)
    const enrollments = this.loadEnrollments();
    enrollments.push(enrollment);
    localStorage.setItem('enrollments', JSON.stringify(enrollments));

    // Notify user
    if (window.NotificationManager) {
      window.NotificationManager.createNotification(
        userId,
        'course_enrolled',
        { courseTitle: 'Course' }, // Would get actual course title
        ['inApp']
      );
    }
  }

  // Send welcome email
  async sendWelcomeEmail(user, courseId) {
    // Mock email sending
    console.log(`Welcome email sent to ${user.email}`);
    // In production, integrate with email service
  }

  // Helper methods
  findUserByEmail(email) {
    const users = this.loadUsers();
    return users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  loadUsers() {
    const stored = localStorage.getItem('users');
    return stored ? JSON.parse(stored) : [];
  }

  saveUser(user) {
    const users = this.loadUsers();
    users.push(user);
    localStorage.setItem('users', JSON.stringify(users));
  }

  updateUser(updatedUser) {
    const users = this.loadUsers();
    const index = users.findIndex(u => u.id === updatedUser.id);
    if (index !== -1) {
      users[index] = updatedUser;
      localStorage.setItem('users', JSON.stringify(users));
    }
  }

  loadEnrollments() {
    const stored = localStorage.getItem('enrollments');
    return stored ? JSON.parse(stored) : [];
  }

  generatePassword(length = 12) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  hashPassword(password) {
    // Mock hashing - in production use proper hashing like bcrypt
    return btoa(password); // Base64 encoding for demo
  }

  getCurrentUser() {
    // Mock current user - would get from auth system
    return { id: 'admin1', role: 'admin' };
  }

  // Get enrollment history
  getEnrollmentHistory(options = {}) {
    let history = [...this.enrollmentHistory];

    // Filter by date range
    if (options.since) {
      const sinceDate = new Date(options.since);
      history = history.filter(h => new Date(h.processedAt) >= sinceDate);
    }

    // Sort by date (newest first)
    history.sort((a, b) => new Date(b.processedAt) - new Date(a.processedAt));

    return history;
  }

  // Get enrollment statistics
  getEnrollmentStats() {
    const history = this.enrollmentHistory;
    const totalBatches = history.length;
    const totalUsers = history.reduce((sum, batch) => sum + batch.total, 0);
    const totalSuccessful = history.reduce((sum, batch) => sum + batch.successful, 0);
    const totalFailed = history.reduce((sum, batch) => sum + batch.failed, 0);

    return {
      totalBatches,
      totalUsers,
      totalSuccessful,
      totalFailed,
      successRate: totalUsers > 0 ? Math.round((totalSuccessful / totalUsers) * 100) : 0
    };
  }

  // Export enrollment results
  exportResults(batchId, format = 'csv') {
    const batch = this.enrollmentHistory.find(b => b.batchId === batchId);
    if (!batch) return null;

    if (format === 'csv') {
      const headers = ['Email', 'Status', 'Error'];
      const rows = batch.errors.map(error => {
        const [email, message] = error.split(': ');
        return [email || '', 'Failed', message || ''];
      });

      // Add successful entries (without errors)
      const successfulCount = batch.successful;
      for (let i = 0; i < successfulCount; i++) {
        rows.push(['', 'Successful', '']);
      }

      return [headers, ...rows];
    }

    return batch; // JSON format
  }

  // Download template
  downloadTemplate(format = 'csv') {
    const template = this.templates[format];
    if (!template) return;

    if (format === 'csv') {
      const csvContent = [
        template.headers.join(','),
        ...template.sampleData.map(row => row.join(','))
      ].join('\n');

      this.downloadFile(csvContent, 'bulk_enrollment_template.csv', 'text/csv');
    } else if (format === 'json') {
      const jsonContent = JSON.stringify(template.sampleData, null, 2);
      this.downloadFile(jsonContent, 'bulk_enrollment_template.json', 'application/json');
    }
  }

  downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Clean up old history (keep last 100 batches)
  cleanupHistory() {
    if (this.enrollmentHistory.length > 100) {
      this.enrollmentHistory = this.enrollmentHistory.slice(-100);
      this.saveEnrollmentHistory();
    }
  }
}

// Initialize bulk enrollment system
const BulkEnrollmentManagerInstance = new BulkEnrollmentManager();

// Export for global use
window.BulkEnrollmentManager = BulkEnrollmentManagerInstance;
