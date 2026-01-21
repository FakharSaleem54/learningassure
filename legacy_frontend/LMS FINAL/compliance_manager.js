// Advanced Compliance Manager for GDPR/FERPA

class ComplianceManager {
  constructor() {
    this.consentRecords = this.loadConsentRecords();
    this.dataRequests = this.loadDataRequests();
    this.auditLogs = this.loadAuditLogs();
    this.retentionPolicies = this.loadRetentionPolicies();
    this.privacySettings = this.loadPrivacySettings();
  }

  loadConsentRecords() {
    const stored = localStorage.getItem('consent_records');
    return stored ? JSON.parse(stored) : [];
  }

  loadDataRequests() {
    const stored = localStorage.getItem('data_requests');
    return stored ? JSON.parse(stored) : [];
  }

  loadAuditLogs() {
    const stored = localStorage.getItem('audit_logs');
    return stored ? JSON.parse(stored) : [];
  }

  loadRetentionPolicies() {
    const stored = localStorage.getItem('retention_policies');
    return stored ? JSON.parse(stored) : {
      userData: 2555, // 7 years in days
      courseData: 1825, // 5 years
      certificates: -1, // Indefinite
      logs: 2555 // 7 years
    };
  }

  loadPrivacySettings() {
    const stored = localStorage.getItem('privacy_settings');
    return stored ? JSON.parse(stored) : {
      dataCollection: true,
      analyticsTracking: true,
      marketingEmails: false,
      thirdPartySharing: false,
      dataEncryption: true
    };
  }

  saveConsentRecords() {
    localStorage.setItem('consent_records', JSON.stringify(this.consentRecords));
  }

  saveDataRequests() {
    localStorage.setItem('data_requests', JSON.stringify(this.dataRequests));
  }

  saveAuditLogs() {
    localStorage.setItem('audit_logs', JSON.stringify(this.auditLogs));
  }

  saveRetentionPolicies() {
    localStorage.setItem('retention_policies', JSON.stringify(this.retentionPolicies));
  }

  savePrivacySettings() {
    localStorage.setItem('privacy_settings', JSON.stringify(this.privacySettings));
  }

  // GDPR Consent Management
  recordConsent(userId, consentType, consented, details = {}) {
    const consentRecord = {
      id: Date.now().toString(),
      userId,
      consentType, // 'data_processing', 'marketing', 'analytics', 'cookies'
      consented,
      timestamp: new Date().toISOString(),
      ipAddress: this.getClientIP(),
      userAgent: navigator.userAgent,
      details,
      version: '1.0'
    };

    this.consentRecords.push(consentRecord);
    this.saveConsentRecords();

    // Log the consent action
    this.logAuditEvent(userId, 'consent_recorded', {
      consentType,
      consented,
      consentId: consentRecord.id
    });

    return consentRecord;
  }

  // Check if user has given consent
  hasConsent(userId, consentType) {
    const userConsents = this.consentRecords.filter(record =>
      record.userId === userId && record.consentType === consentType
    );

    if (userConsents.length === 0) return false;

    // Get the most recent consent
    const latestConsent = userConsents.sort((a, b) =>
      new Date(b.timestamp) - new Date(a.timestamp)
    )[0];

    return latestConsent.consented;
  }

  // Get user's consent history
  getConsentHistory(userId) {
    return this.consentRecords
      .filter(record => record.userId === userId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  // GDPR Data Subject Access Request (DSAR)
  submitDataRequest(userId, requestType, details = {}) {
    const request = {
      id: Date.now().toString(),
      userId,
      requestType, // 'access', 'rectification', 'erasure', 'portability', 'restriction', 'objection'
      status: 'pending',
      submittedAt: new Date().toISOString(),
      details,
      requesterInfo: {
        ipAddress: this.getClientIP(),
        userAgent: navigator.userAgent
      }
    };

    this.dataRequests.push(request);
    this.saveDataRequests();

    // Log the request
    this.logAuditEvent(userId, 'data_request_submitted', {
      requestType,
      requestId: request.id
    });

    // Notify administrators
    this.notifyAdministrators('data_request_submitted', request);

    return request;
  }

  // Process data request
  processDataRequest(requestId, action, processedBy, notes = '') {
    const request = this.dataRequests.find(req => req.id === requestId);
    if (!request) {
      throw new Error('Data request not found');
    }

    request.status = action; // 'approved', 'denied', 'completed'
    request.processedAt = new Date().toISOString();
    request.processedBy = processedBy;
    request.notes = notes;

    this.saveDataRequests();

    // Log the processing
    this.logAuditEvent(request.userId, 'data_request_processed', {
      requestId,
      action,
      processedBy
    });

    // Execute the request if approved
    if (action === 'approved') {
      this.executeDataRequest(request);
    }

    return request;
  }

  // Execute approved data request
  async executeDataRequest(request) {
    const userId = request.userId;

    switch (request.requestType) {
      case 'access':
        return await this.provideDataAccess(userId);

      case 'erasure':
        return await this.eraseUserData(userId);

      case 'portability':
        return await this.exportUserData(userId);

      case 'rectification':
        return await this.rectifyUserData(userId, request.details);

      case 'restriction':
        return await this.restrictDataProcessing(userId);

      default:
        throw new Error('Unknown request type');
    }
  }

  // Provide data access (GDPR Article 15)
  async provideDataAccess(userId) {
    const userData = {
      personalInfo: await this.getUserPersonalData(userId),
      courseHistory: await this.getUserCourseHistory(userId),
      certificates: await this.getUserCertificates(userId),
      consentHistory: this.getConsentHistory(userId),
      activityLogs: await this.getUserActivityLogs(userId)
    };

    // Create downloadable report
    const reportData = {
      userId,
      generatedAt: new Date().toISOString(),
      data: userData
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `user_data_${userId}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();

    URL.revokeObjectURL(url);

    return { success: true, message: 'Data access report downloaded' };
  }

  // Erase user data (Right to be Forgotten - GDPR Article 17)
  async eraseUserData(userId) {
    try {
      // Anonymize personal data
      await this.anonymizeUserData(userId);

      // Delete or anonymize related data
      await this.deleteUserEnrollments(userId);
      await this.anonymizeUserPosts(userId);
      await this.deleteUserCertificates(userId);

      // Log the erasure
      this.logAuditEvent(userId, 'data_erased', {
        erasedBy: this.getCurrentUser()?.id,
        reason: 'GDPR right to erasure'
      });

      return { success: true, message: 'User data erased successfully' };
    } catch (error) {
      console.error('Failed to erase user data:', error);
      return { success: false, error: error.message };
    }
  }

  // Export user data for portability (GDPR Article 20)
  async exportUserData(userId) {
    const userData = await this.provideDataAccess(userId);
    // Additional portability format (XML/CSV) could be added here
    return userData;
  }

  // Rectify inaccurate data (GDPR Article 16)
  async rectifyUserData(userId, corrections) {
    // This would update user data based on corrections provided
    console.log('Rectifying user data for:', userId, corrections);
    // Implementation would depend on specific data structure
    return { success: true, message: 'Data rectification request noted' };
  }

  // Restrict data processing (GDPR Article 18)
  async restrictDataProcessing(userId) {
    // Mark user data as restricted
    const restriction = {
      userId,
      restricted: true,
      restrictedAt: new Date().toISOString(),
      reason: 'User requested processing restriction'
    };

    const restrictions = JSON.parse(localStorage.getItem('data_restrictions') || '[]');
    restrictions.push(restriction);
    localStorage.setItem('data_restrictions', JSON.stringify(restrictions));

    return { success: true, message: 'Data processing restricted' };
  }

  // Helper methods for data operations
  async getUserPersonalData(userId) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.id === userId);

    if (!user) return null;

    // Return only non-sensitive data
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      registrationDate: user.registrationDate,
      role: user.role,
      lastLogin: user.lastLogin
    };
  }

  async getUserCourseHistory(userId) {
    const enrollments = JSON.parse(localStorage.getItem('enrollments') || '[]');
    return enrollments.filter(e => e.userId === userId);
  }

  async getUserCertificates(userId) {
    const certificates = JSON.parse(localStorage.getItem('certificates') || '[]');
    return certificates.filter(c => c.recipientId === userId);
  }

  async getUserActivityLogs(userId) {
    // Return sanitized activity logs
    const logs = this.auditLogs.filter(log => log.userId === userId);
    return logs.map(log => ({
      action: log.action,
      timestamp: log.timestamp,
      details: log.details
    }));
  }

  async anonymizeUserData(userId) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex !== -1) {
      users[userIndex] = {
        ...users[userIndex],
        name: `Anonymous User ${userId}`,
        email: `anonymous${userId}@deleted.local`,
        anonymized: true,
        anonymizedAt: new Date().toISOString()
      };

      localStorage.setItem('users', JSON.stringify(users));
    }
  }

  async deleteUserEnrollments(userId) {
    const enrollments = JSON.parse(localStorage.getItem('enrollments') || '[]');
    const filteredEnrollments = enrollments.filter(e => e.userId !== userId);
    localStorage.setItem('enrollments', JSON.stringify(filteredEnrollments));
  }

  async anonymizeUserPosts(userId) {
    // Anonymize forum posts, comments, etc.
    const posts = JSON.parse(localStorage.getItem('forum_posts') || '[]');
    const anonymizedPosts = posts.map(post => {
      if (post.authorId === userId) {
        return {
          ...post,
          authorName: 'Anonymous User',
          authorId: 'anonymous',
          anonymized: true
        };
      }
      return post;
    });

    localStorage.setItem('forum_posts', JSON.stringify(anonymizedPosts));
  }

  async deleteUserCertificates(userId) {
    const certificates = JSON.parse(localStorage.getItem('certificates') || '[]');
    const filteredCertificates = certificates.filter(c => c.recipientId !== userId);
    localStorage.setItem('certificates', JSON.stringify(filteredCertificates));
  }

  // Audit logging
  logAuditEvent(userId, action, details = {}) {
    const logEntry = {
      id: Date.now().toString(),
      userId,
      action,
      details,
      timestamp: new Date().toISOString(),
      ipAddress: this.getClientIP(),
      userAgent: navigator.userAgent,
      performedBy: this.getCurrentUser()?.id
    };

    this.auditLogs.push(logEntry);
    this.saveAuditLogs();
  }

  // Get audit logs for user
  getAuditLogs(userId, options = {}) {
    let logs = this.auditLogs.filter(log => log.userId === userId);

    // Filter by date range
    if (options.since) {
      const sinceDate = new Date(options.since);
      logs = logs.filter(log => new Date(log.timestamp) >= sinceDate);
    }

    // Filter by action
    if (options.action) {
      logs = logs.filter(log => log.action === options.action);
    }

    return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  // Data retention management
  async enforceDataRetention() {
    const now = new Date();
    let cleanedRecords = 0;

    // Clean old audit logs
    const retentionDays = this.retentionPolicies.logs;
    if (retentionDays > 0) {
      const cutoffDate = new Date(now.getTime() - retentionDays * 24 * 60 * 60 * 1000);
      const originalLength = this.auditLogs.length;
      this.auditLogs = this.auditLogs.filter(log => new Date(log.timestamp) >= cutoffDate);
      cleanedRecords += originalLength - this.auditLogs.length;
    }

    // Clean old consent records (keep for 7 years as per GDPR)
    const consentRetentionDays = 2555; // 7 years
    const consentCutoffDate = new Date(now.getTime() - consentRetentionDays * 24 * 60 * 60 * 1000);
    const originalConsentLength = this.consentRecords.length;
    this.consentRecords = this.consentRecords.filter(record => new Date(record.timestamp) >= consentCutoffDate);
    cleanedRecords += originalConsentLength - this.consentRecords.length;

    // Save cleaned data
    this.saveAuditLogs();
    this.saveConsentRecords();

    return cleanedRecords;
  }

  // Privacy settings management
  updatePrivacySettings(settings) {
    this.privacySettings = { ...this.privacySettings, ...settings };
    this.savePrivacySettings();

    // Log the change
    this.logAuditEvent(this.getCurrentUser()?.id, 'privacy_settings_updated', settings);
  }

  getPrivacySettings() {
    return this.privacySettings;
  }

  // FERPA compliance (for educational institutions)
  checkFERPACompliance(userData) {
    // FERPA requires protection of student educational records
    const ferpaChecks = {
      parentalConsent: userData.age < 18 ? this.hasParentalConsent(userData.id) : true,
      directoryInfo: !userData.directoryRestriction,
      legitimateInterest: this.hasLegitimateEducationalInterest(userData)
    };

    return {
      compliant: Object.values(ferpaChecks).every(check => check),
      checks: ferpaChecks
    };
  }

  hasParentalConsent(userId) {
    // Check if parent/guardian has given consent for minors
    const consents = this.consentRecords.filter(record =>
      record.userId === userId && record.consentType === 'parental'
    );
    return consents.length > 0 && consents[consents.length - 1].consented;
  }

  hasLegitimateEducationalInterest(userData) {
    // Check if data access is for legitimate educational purposes
    return userData.role === 'instructor' || userData.role === 'admin' ||
           userData.purpose === 'educational';
  }

  // Generate compliance report
  generateComplianceReport() {
    const now = new Date();
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const recentRequests = this.dataRequests.filter(req =>
      new Date(req.submittedAt) >= lastMonth
    );

    const consentStats = {
      totalConsents: this.consentRecords.length,
      marketingConsents: this.consentRecords.filter(r => r.consentType === 'marketing' && r.consented).length,
      dataProcessingConsents: this.consentRecords.filter(r => r.consentType === 'data_processing' && r.consented).length
    };

    return {
      generatedAt: now.toISOString(),
      period: 'Last 30 days',
      dataRequests: {
        total: recentRequests.length,
        pending: recentRequests.filter(r => r.status === 'pending').length,
        approved: recentRequests.filter(r => r.status === 'approved').length,
        denied: recentRequests.filter(r => r.status === 'denied').length
      },
      consentStatistics: consentStats,
      auditLogsCount: this.auditLogs.length,
      retentionPolicies: this.retentionPolicies,
      privacySettings: this.privacySettings
    };
  }

  // Notification system for compliance
  notifyAdministrators(eventType, data) {
    if (window.NotificationManager) {
      const admins = this.getAdministrators();
      admins.forEach(adminId => {
        window.NotificationManager.createNotification(
          adminId,
          eventType,
          data,
          ['inApp', 'email']
        );
      });
    }
  }

  getAdministrators() {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    return users.filter(u => u.role === 'admin').map(u => u.id);
  }

  // Utility methods
  getClientIP() {
    // In a real implementation, this would get the actual IP
    return '127.0.0.1'; // Mock for demo
  }

  getCurrentUser() {
    return JSON.parse(localStorage.getItem('currentUser') || 'null');
  }

  // Get pending data requests (for admin dashboard)
  getPendingDataRequests() {
    return this.dataRequests.filter(req => req.status === 'pending');
  }

  // Get compliance statistics
  getComplianceStats() {
    const now = new Date();
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return {
      totalConsentRecords: this.consentRecords.length,
      totalDataRequests: this.dataRequests.length,
      pendingRequests: this.dataRequests.filter(r => r.status === 'pending').length,
      recentRequests: this.dataRequests.filter(r => new Date(r.submittedAt) >= lastMonth).length,
      auditLogsCount: this.auditLogs.length
    };
  }
}

// Initialize compliance manager
const ComplianceManagerInstance = new ComplianceManager();

// Export for global use
window.ComplianceManager = ComplianceManagerInstance;
