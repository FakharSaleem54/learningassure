// Learner dashboard functionality

// Initialize learner dashboard
function pageLearnerDashboardInit() {
  console.log('Initializing learner dashboard...');
  addDebugLog('Initializing learner dashboard...', 'info');

  // Check learner access
  const session = Auth.requireLogin('login.html');
  if (!session) {
    console.log('No session found, redirecting to login');
    addDebugLog('No session found, redirecting to login', 'error');
    return;
  }

  console.log('Session found:', session);
  addDebugLog(`Session found for user: ${session.name}`, 'success');

  // Load learner data
  try {
    loadLearnerStats();
    loadEnrolledCourses();
    loadCertificates();
    console.log('Learner dashboard initialized successfully');
    addDebugLog('Learner dashboard initialized successfully', 'success');
  } catch (error) {
    console.error('Error initializing learner dashboard:', error);
    addDebugLog(`Error initializing learner dashboard: ${error.message}`, 'error');
  }
}

// Load learner statistics
function loadLearnerStats() {
  console.log('Loading learner stats...');
  const session = Auth.currentSession();
  if (!session) {
    console.log('No session found in loadLearnerStats');
    return;
  }

  try {
    const enrollments = CourseManager.getEnrollments(session.userId);
    console.log('Enrollments found:', enrollments.length);

    const totalEnrolled = enrollments.length;
    const completed = enrollments.filter(e => e.progressPercent >= 100).length;
    const certificates = sGet('certificates', []).filter(c => c.userId === session.userId).length;

    // Update KPI cards
    const statEnrolled = document.getElementById('statEnrolled');
    const statCompleted = document.getElementById('statCompleted');
    const statCertificates = document.getElementById('statCertificates');
    const statSpent = document.getElementById('statSpent');

    if (statEnrolled) statEnrolled.textContent = totalEnrolled;
    if (statCompleted) statCompleted.textContent = completed;
    if (statCertificates) statCertificates.textContent = certificates;

    // Calculate total spent (assuming $50 per enrollment)
    const totalSpent = totalEnrolled * 50;
    if (statSpent) statSpent.textContent = AppUtils.formatCurrency(totalSpent);

    // Load additional analytics
    loadLearnerAnalytics();
    console.log('Learner stats loaded successfully');
  } catch (error) {
    console.error('Error loading learner stats:', error);
  }
}

// Load learner analytics
function loadLearnerAnalytics() {
  console.log('Loading learner analytics...');
  const session = Auth.currentSession();
  if (!session) {
    console.log('No session found in loadLearnerAnalytics');
    return;
  }

  try {
    const enrollments = CourseManager.getEnrollments(session.userId);

    // Calculate average progress
    const avgProgress = enrollments.length > 0
      ? Math.round(enrollments.reduce((sum, e) => sum + e.progressPercent, 0) / enrollments.length)
      : 0;
    const avgProgressEl = document.getElementById('avgProgress');
    if (avgProgressEl) avgProgressEl.textContent = avgProgress + '%';

    // Calculate courses in progress
    const inProgressCourses = enrollments.filter(e => e.progressPercent > 0 && e.progressPercent < 100).length;
    const inProgressEl = document.getElementById('inProgressCourses');
    if (inProgressEl) inProgressEl.textContent = inProgressCourses;

    // Calculate completion rate
    const completionRate = enrollments.length > 0
      ? Math.round((enrollments.filter(e => e.progressPercent >= 100).length / enrollments.length) * 100)
      : 0;
    const completionRateEl = document.getElementById('completionRate');
    if (completionRateEl) completionRateEl.textContent = completionRate + '%';

    console.log('Learner analytics loaded successfully');
  } catch (error) {
    console.error('Error loading learner analytics:', error);
  }
}

// Load enrolled courses
function loadEnrolledCourses() {
  console.log('Loading enrolled courses...');
  const session = Auth.currentSession();
  if (!session) {
    console.log('No session found in loadEnrolledCourses');
    return;
  }

  try {
    const enrollments = CourseManager.getEnrollments(session.userId);
    console.log('Enrollments to display:', enrollments.length);

    const container = document.getElementById('enrolledCourses');
    if (!container) {
      console.log('Enrolled courses container not found');
      return;
    }

    container.innerHTML = '';

    if (enrollments.length === 0) {
      container.innerHTML = '<p class="no-courses">You haven\'t enrolled in any courses yet.</p>';
      console.log('No enrollments to display');
      return;
    }

    enrollments.forEach(enrollment => {
      const course = CourseManager.getCourseById(enrollment.courseId);
      if (!course) {
        console.log('Course not found for enrollment:', enrollment.courseId);
        return;
      }

      const card = document.createElement('div');
      card.className = 'course-card';
      card.innerHTML = `
        <div class="course-header">
          <h3>${course.title}</h3>
          <span class="badge ${course.level.toLowerCase()}">${course.level}</span>
        </div>
        <p class="course-desc">By ${course.instructor}</p>
        <div class="progress-section">
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${enrollment.progressPercent}%"></div>
          </div>
          <span class="progress-text">${enrollment.progressPercent}% Complete</span>
        </div>
        <div class="course-actions">
          <a href="player.html?course=${course.id}" class="btn primary">Continue Learning</a>
          <button class="btn outline" onclick="viewCertificate('${course.id}')">View Certificate</button>
        </div>
        <div class="enrollment-date">Enrolled: ${AppUtils.formatDate(enrollment.enrolledAt)}</div>
      `;
      container.appendChild(card);
    });

    console.log('Enrolled courses loaded successfully');

    // Load AI recommendations after enrolled courses
    loadAIRecommendations();
  } catch (error) {
    console.error('Error loading enrolled courses:', error);
  }
}

// Load certificates
function loadCertificates() {
  console.log('Loading certificates...');
  const session = Auth.currentSession();
  if (!session) {
    console.log('No session found in loadCertificates');
    return;
  }

  try {
    const certificates = sGet('certificates', []).filter(c => c.userId === session.userId);
    console.log('Certificates found:', certificates.length);

    const container = document.getElementById('certificatesList');
    if (!container) {
      console.log('Certificates container not found');
      return;
    }

    container.innerHTML = '';

    if (certificates.length === 0) {
      container.innerHTML = '<p class="no-certificates">No certificates earned yet. Complete courses to earn certificates!</p>';
      console.log('No certificates to display');
      return;
    }

    certificates.forEach(cert => {
      const course = CourseManager.getCourseById(cert.courseId);
      if (!course) {
        console.log('Course not found for certificate:', cert.courseId);
        return;
      }

      const certCard = document.createElement('div');
      certCard.className = 'certificate-card';
      certCard.innerHTML = `
        <div class="certificate-header">
          <h4>Certificate of Completion</h4>
          <span class="certificate-date">${AppUtils.formatDate(cert.issuedAt)}</span>
        </div>
        <div class="certificate-content">
          <h3>${course.title}</h3>
          <p>Awarded to ${session.name}</p>
          <p>Instructor: ${course.instructor}</p>
        </div>
        <div class="certificate-actions">
          <button class="btn primary" onclick="downloadCertificate('${cert.id}')">Download</button>
          <button class="btn outline" onclick="shareCertificate('${cert.id}')">Share</button>
        </div>
      `;
      container.appendChild(certCard);
    });

    console.log('Certificates loaded successfully');
  } catch (error) {
    console.error('Error loading certificates:', error);
  }
}

// View certificate (placeholder)
function viewCertificate(courseId) {
  const session = Auth.currentSession();
  const certificates = sGet('certificates', []).filter(c =>
    c.userId === session.userId && c.courseId === courseId
  );

  if (certificates.length > 0) {
    window.location.href = `certificate.html?course=${courseId}`;
  } else {
    AppUtils.showError('Certificate not available. Complete the course first.');
  }
}

// Download certificate (placeholder)
function downloadCertificate(certId) {
  // In a real implementation, this would generate and download a PDF
  AppUtils.showSuccess('Certificate download feature coming soon!');
}

// Share certificate (placeholder)
function shareCertificate(certId) {
  // In a real implementation, this would open sharing options
  const shareUrl = `${window.location.origin}/certificate.html?id=${certId}`;
  navigator.clipboard.writeText(shareUrl).then(() => {
    AppUtils.showSuccess('Certificate link copied to clipboard!');
  });
}

// Browse courses
function browseCourses() {
  window.location.href = 'catalog.html';
}

// Load AI-powered course recommendations
function loadAIRecommendations() {
  console.log('Loading AI recommendations...');

  const session = Auth.currentSession();
  console.log('Current session:', session);

  if (!session) {
    console.log('No session found');
    return;
  }

  try {
    // Ensure CourseManager is available
    if (!window.CourseManager) {
      console.error('CourseManager not available');
      return;
    }

    const recommendations = AIRecommendationEngine.getLinkedInEnhancedRecommendations(session.userId, { limit: 6 });
    console.log('AI Recommendations:', recommendations);

    // Find the recommendations container by ID
    const container = document.getElementById('recommendations-container');
    console.log('Recommendations container found:', container);

    if (!container) {
      console.log('Recommendations container not found');
      return;
    }

    // Clear existing content
    container.innerHTML = '';

    if (recommendations.length === 0) {
      container.innerHTML = '<p class="no-recommendations">No recommendations available at this time. Complete some courses to get personalized suggestions!</p>';
      console.log('No recommendations to display');
      return;
    }

    recommendations.forEach(rec => {
      const course = rec.course;
      const card = document.createElement('div');
      card.className = 'course-card recommended';

      // Determine badge based on recommendation score
      let badgeText = 'Recommended';
      if (rec.score > 1.0) badgeText = 'Highly Recommended';
      else if (rec.score > 0.7) badgeText = 'Good Match';

      card.innerHTML = `
        <div class="course-badge">${badgeText}</div>
        <div class="course-thumb">
          <img src="${course.thumbnail || 'https://via.placeholder.com/300x200?text=Course'}" alt="${course.title}" onerror="this.src='https://via.placeholder.com/300x200?text=Course'">
        </div>
        <div class="course-info">
          <h4>${course.title}</h4>
          <p class="course-desc">${course.description ? course.description.substring(0, 100) + '...' : 'Learn valuable skills in this course'}</p>
          <div class="course-meta">
            <span class="rating">⭐ ${course.rating || '4.5'}</span>
            <span class="students">${course.students || '1,000+'} students</span>
            <span class="level">${course.level || 'Beginner'}</span>
          </div>
          <div class="course-price">$${course.price || '49'}</div>
          <div class="recommendation-reason">
            <small>💡 ${rec.reason}</small>
          </div>
          ${rec.linkedinInsights && rec.linkedinInsights.length > 0 ? `
            <div class="linkedin-insights">
              <small class="linkedin-insight">💼 ${rec.linkedinInsights[0]}</small>
            </div>
          ` : ''}
          <button class="btn primary" onclick="enrollInCourse('${course.id}')">Enroll Now</button>
        </div>
      `;
      container.appendChild(card);
    });

    console.log('AI recommendations loaded successfully');

  } catch (error) {
    console.error('Error loading AI recommendations:', error);
    const container = document.querySelector('section.dashboard-section .courses-grid');
    if (container) {
      container.innerHTML = '<p class="error-message">Unable to load recommendations. Please try refreshing the page.</p>';
    }
  }
}

// Enroll in recommended course
function enrollInCourse(courseId) {
  const session = Auth.currentSession();
  const course = CourseManager.getCourseById(courseId);

  if (!course) {
    AppUtils.showError('Course not found.');
    return;
  }

  // Check if already enrolled
  const existingEnrollment = CourseManager.getEnrollments(session.userId)
    .find(e => e.courseId === courseId);

  if (existingEnrollment) {
    AppUtils.showInfo('You are already enrolled in this course.');
    window.location.href = `player.html?course=${courseId}`;
    return;
  }

  // Create enrollment
  const enrollment = {
    id: Date.now().toString(),
    userId: session.userId,
    courseId: courseId,
    enrolledAt: new Date().toISOString(),
    progressPercent: 0,
    lastAccessed: new Date().toISOString()
  };

  const enrollments = sGet('enrollments', []);
  enrollments.push(enrollment);
  sSet('enrollments', enrollments);

  // Track interaction for AI learning
  AIRecommendationEngine.trackInteraction(session.userId, 'enroll_course', {
    courseId: courseId,
    goal: 'ai_recommended'
  });

  AppUtils.showSuccess(`Successfully enrolled in "${course.title}"!`);
  window.location.href = `player.html?course=${courseId}`;
}

// Debug panel functions
function toggleDebugPanel() {
  const debugSection = document.getElementById('debug-section');
  debugSection.style.display = debugSection.style.display === 'none' ? 'block' : 'none';
}

function clearDebugLogs() {
  const debugLogs = document.getElementById('debugLogs');
  debugLogs.innerHTML = '<div class="debug-item">🔄 Debug logs cleared</div>';
}

function exportDebugLogs() {
  const debugLogs = document.getElementById('debugLogs');
  const logs = Array.from(debugLogs.children).map(item => item.textContent).join('\n');
  const blob = new Blob([logs], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'debug-logs.txt';
  a.click();
  URL.revokeObjectURL(url);
}

// Enhanced logging function
function addDebugLog(message, type = 'info') {
  const debugLogs = document.getElementById('debugLogs');
  if (!debugLogs) return;

  const timestamp = new Date().toLocaleTimeString();
  const icon = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
  const logItem = document.createElement('div');
  logItem.className = `debug-item ${type}`;
  logItem.textContent = `${icon} [${timestamp}] ${message}`;

  debugLogs.appendChild(logItem);
  debugLogs.scrollTop = debugLogs.scrollHeight;

  // Also log to console
  console.log(`[${type.toUpperCase()}] ${message}`);
}

// Export functions
window.LearnerDashboard = {
  loadLearnerStats,
  loadEnrolledCourses,
  loadCertificates,
  viewCertificate,
  downloadCertificate,
  shareCertificate,
  browseCourses,
  loadAIRecommendations,
  enrollInCourse
};

// Export debug functions
window.DebugPanel = {
  toggleDebugPanel,
  clearDebugLogs,
  exportDebugLogs,
  addDebugLog
};
