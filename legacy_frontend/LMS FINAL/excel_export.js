// Excel Export Functionality for LMS Analytics

class ExcelExportManager {
  constructor() {
    this.xlsxLoaded = false;
    this.loadXLSXLibrary();
  }

  // Load XLSX library dynamically
  async loadXLSXLibrary() {
    if (this.xlsxLoaded) return;

    try {
      // Load SheetJS library from CDN
      await this.loadScript('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js');
      this.xlsxLoaded = true;
      console.log('XLSX library loaded successfully');
    } catch (error) {
      console.error('Failed to load XLSX library:', error);
      // Fallback to CSV export
      this.xlsxLoaded = false;
    }
  }

  loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // Export analytics data to Excel
  async exportAnalyticsToExcel(data, filename = 'lms_analytics.xlsx') {
    await this.loadXLSXLibrary();

    if (!this.xlsxLoaded) {
      console.warn('XLSX library not available, falling back to CSV export');
      return this.exportToCSV(data, filename.replace('.xlsx', '.csv'));
    }

    try {
      const workbook = XLSX.utils.book_new();

      // Create different sheets for different data types
      if (data.userStats) {
        const userStatsSheet = this.createUserStatsSheet(data.userStats);
        XLSX.utils.book_append_sheet(workbook, userStatsSheet, 'User Statistics');
      }

      if (data.courseStats) {
        const courseStatsSheet = this.createCourseStatsSheet(data.courseStats);
        XLSX.utils.book_append_sheet(workbook, courseStatsSheet, 'Course Statistics');
      }

      if (data.revenueStats) {
        const revenueSheet = this.createRevenueSheet(data.revenueStats);
        XLSX.utils.book_append_sheet(workbook, revenueSheet, 'Revenue Analytics');
      }

      if (data.certificates) {
        const certificatesSheet = this.createCertificatesSheet(data.certificates);
        XLSX.utils.book_append_sheet(workbook, certificatesSheet, 'Certificates');
      }

      // Create summary sheet
      const summarySheet = this.createSummarySheet(data);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

      // Save the file
      XLSX.writeFile(workbook, filename);
      return true;

    } catch (error) {
      console.error('Error creating Excel file:', error);
      // Fallback to CSV
      return this.exportToCSV(data, filename.replace('.xlsx', '.csv'));
    }
  }

  // Create user statistics sheet
  createUserStatsSheet(userStats) {
    const headers = [
      'User ID', 'Name', 'Email', 'Role', 'Registration Date',
      'Courses Enrolled', 'Courses Completed', 'Completion Rate',
      'Total Time Spent (hours)', 'Average Quiz Score', 'Certificates Earned',
      'Last Activity', 'Status'
    ];

    const data = userStats.map(user => [
      user.id,
      user.name,
      user.email,
      user.role,
      new Date(user.registrationDate).toLocaleDateString(),
      user.coursesEnrolled || 0,
      user.coursesCompleted || 0,
      user.completionRate ? `${user.completionRate}%` : '0%',
      user.totalTimeSpent ? (user.totalTimeSpent / 3600).toFixed(1) : 0,
      user.averageQuizScore ? `${user.averageQuizScore}%` : 'N/A',
      user.certificatesEarned || 0,
      user.lastActivity ? new Date(user.lastActivity).toLocaleDateString() : 'Never',
      user.status || 'Active'
    ]);

    return XLSX.utils.aoa_to_sheet([headers, ...data]);
  }

  // Create course statistics sheet
  createCourseStatsSheet(courseStats) {
    const headers = [
      'Course ID', 'Course Title', 'Category', 'Instructor',
      'Price ($)', 'Enrollments', 'Completions', 'Completion Rate',
      'Average Rating', 'Total Revenue ($)', 'Creation Date',
      'Last Updated', 'Status'
    ];

    const data = courseStats.map(course => [
      course.id,
      course.title,
      course.category,
      course.instructor,
      course.price || 0,
      course.enrollments || 0,
      course.completions || 0,
      course.completionRate ? `${course.completionRate}%` : '0%',
      course.averageRating ? course.averageRating.toFixed(1) : 'N/A',
      course.totalRevenue || 0,
      new Date(course.creationDate).toLocaleDateString(),
      course.lastUpdated ? new Date(course.lastUpdated).toLocaleDateString() : 'Never',
      course.status || 'Published'
    ]);

    return XLSX.utils.aoa_to_sheet([headers, ...data]);
  }

  // Create revenue analytics sheet
  createRevenueSheet(revenueStats) {
    const headers = [
      'Date', 'Daily Revenue ($)', 'Subscriptions', 'One-time Purchases',
      'Refunds ($)', 'Net Revenue ($)', 'Active Subscriptions',
      'New Signups', 'Churn Rate (%)'
    ];

    const data = revenueStats.map(stat => [
      new Date(stat.date).toLocaleDateString(),
      stat.dailyRevenue || 0,
      stat.subscriptions || 0,
      stat.oneTimePurchases || 0,
      stat.refunds || 0,
      stat.netRevenue || 0,
      stat.activeSubscriptions || 0,
      stat.newSignups || 0,
      stat.churnRate ? `${stat.churnRate}%` : '0%'
    ]);

    return XLSX.utils.aoa_to_sheet([headers, ...data]);
  }

  // Create certificates sheet
  createCertificatesSheet(certificates) {
    const headers = [
      'Certificate ID', 'Recipient Name', 'Recipient Email',
      'Course Title', 'Completion Date', 'Issue Date',
      'Certificate URL', 'Status'
    ];

    const data = certificates.map(cert => [
      cert.id,
      cert.recipientName,
      cert.recipientEmail,
      cert.courseTitle,
      new Date(cert.completionDate).toLocaleDateString(),
      new Date(cert.issueDate).toLocaleDateString(),
      cert.verificationUrl || '',
      cert.status || 'Active'
    ]);

    return XLSX.utils.aoa_to_sheet([headers, ...data]);
  }

  // Create summary sheet
  createSummarySheet(data) {
    const summaryData = [
      ['LMS Analytics Summary'],
      ['Generated on:', new Date().toLocaleString()],
      [''],
      ['Key Metrics'],
      ['Total Users:', data.totalUsers || 0],
      ['Total Courses:', data.totalCourses || 0],
      ['Total Enrollments:', data.totalEnrollments || 0],
      ['Total Revenue ($):', data.totalRevenue || 0],
      ['Active Subscriptions:', data.activeSubscriptions || 0],
      ['Completion Rate (%):', data.overallCompletionRate ? `${data.overallCompletionRate}%` : '0%'],
      [''],
      ['Top Performing Courses'],
      ...(data.topCourses || []).map(course => [course.title, course.enrollments || 0, course.completionRate ? `${course.completionRate}%` : '0%'])
    ];

    return XLSX.utils.aoa_to_sheet(summaryData);
  }

  // Fallback CSV export
  exportToCSV(data, filename = 'lms_analytics.csv') {
    let csvContent = '';

    // Convert data to CSV format
    if (data.userStats) {
      csvContent += this.arrayToCSV(this.createUserStatsSheet(data.userStats));
    }

    // Create and download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return true;
  }

  // Helper to convert sheet data to CSV
  arrayToCSV(sheet) {
    const csv = [];
    const range = XLSX.utils.decode_range(sheet['!ref']);

    for (let row = range.s.r; row <= range.e.r; row++) {
      const csvRow = [];
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = sheet[cellAddress];
        csvRow.push(cell ? cell.v : '');
      }
      csv.push(csvRow.join(','));
    }

    return csv.join('\n') + '\n';
  }

  // Export specific report types
  async exportUserReport(userId = null, dateRange = null) {
    const data = await this.getUserReportData(userId, dateRange);
    const filename = userId ? `user_report_${userId}.xlsx` : 'all_users_report.xlsx';
    return this.exportAnalyticsToExcel(data, filename);
  }

  async exportCourseReport(courseId = null, dateRange = null) {
    const data = await this.getCourseReportData(courseId, dateRange);
    const filename = courseId ? `course_report_${courseId}.xlsx` : 'all_courses_report.xlsx';
    return this.exportAnalyticsToExcel(data, filename);
  }

  async exportRevenueReport(dateRange = null) {
    const data = await this.getRevenueReportData(dateRange);
    return this.exportAnalyticsToExcel(data, 'revenue_report.xlsx');
  }

  // Mock data retrieval functions (would integrate with actual analytics)
  async getUserReportData(userId, dateRange) {
    // Mock implementation - would get from analytics system
    return {
      userStats: [
        {
          id: 'user1',
          name: 'John Doe',
          email: 'john@example.com',
          role: 'learner',
          registrationDate: '2024-01-15',
          coursesEnrolled: 5,
          coursesCompleted: 3,
          completionRate: 60,
          totalTimeSpent: 7200, // seconds
          averageQuizScore: 85,
          certificatesEarned: 3,
          lastActivity: '2024-11-07',
          status: 'Active'
        }
      ]
    };
  }

  async getCourseReportData(courseId, dateRange) {
    // Mock implementation
    return {
      courseStats: [
        {
          id: 'course1',
          title: 'JavaScript Fundamentals',
          category: 'Programming',
          instructor: 'Jane Smith',
          price: 49.99,
          enrollments: 150,
          completions: 120,
          completionRate: 80,
          averageRating: 4.5,
          totalRevenue: 7498.50,
          creationDate: '2024-01-01',
          lastUpdated: '2024-10-01',
          status: 'Published'
        }
      ]
    };
  }

  async getRevenueReportData(dateRange) {
    // Mock implementation
    return {
      revenueStats: [
        {
          date: '2024-11-01',
          dailyRevenue: 245.50,
          subscriptions: 12,
          oneTimePurchases: 8,
          refunds: 15.00,
          netRevenue: 230.50,
          activeSubscriptions: 450,
          newSignups: 25,
          churnRate: 2.1
        }
      ]
    };
  }

  // Quick export functions for UI integration
  async exportCurrentView(viewType, filters = {}) {
    let data = {};

    switch (viewType) {
      case 'users':
        data = await this.getUserReportData(filters.userId, filters.dateRange);
        break;
      case 'courses':
        data = await this.getCourseReportData(filters.courseId, filters.dateRange);
        break;
      case 'revenue':
        data = await this.getRevenueReportData(filters.dateRange);
        break;
      case 'certificates':
        data = { certificates: await this.getCertificatesData(filters) };
        break;
    }

    const filename = `${viewType}_export_${new Date().toISOString().split('T')[0]}.xlsx`;
    return this.exportAnalyticsToExcel(data, filename);
  }

  async getCertificatesData(filters) {
    // Mock implementation
    return [
      {
        id: 'CERT001',
        recipientName: 'John Doe',
        recipientEmail: 'john@example.com',
        courseTitle: 'JavaScript Fundamentals',
        completionDate: '2024-11-01',
        issueDate: '2024-11-01',
        verificationUrl: 'https://learningassure.com/verify/CERT001',
        status: 'Active'
      }
    ];
  }
}

// Initialize Excel export manager
const ExcelExportManagerInstance = new ExcelExportManager();

// Export for global use
window.ExcelExportManager = ExcelExportManagerInstance;
