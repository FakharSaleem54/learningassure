// Course management and enrollment functions

// Course CRUD operations
function getAllCourses() {
  return sGet('courses', []);
}

function getCourseById(courseId) {
  const courses = getAllCourses();
  return courses.find(c => c.id === courseId);
}

function createCourse(courseData) {
  const courses = getAllCourses();
  const newCourse = {
    id: Date.now().toString(),
    ...courseData,
    createdAt: new Date().toISOString(),
    lessons: courseData.lessons || []
  };
  courses.push(newCourse);
  sSet('courses', courses);
  return newCourse;
}

function updateCourse(courseId, updates) {
  const courses = getAllCourses();
  const index = courses.findIndex(c => c.id === courseId);
  if (index === -1) return null;

  courses[index] = { ...courses[index], ...updates };
  sSet('courses', courses);
  return courses[index];
}

function deleteCourse(courseId) {
  const courses = getAllCourses();
  const filtered = courses.filter(c => c.id !== courseId);
  sSet('courses', filtered);
  return true;
}

// Enrollment management
function getEnrollments(userId = null) {
  const enrollments = sGet('enrollments', []);
  return userId ? enrollments.filter(e => e.userId === userId) : enrollments;
}

function enrollCourse(userId, courseId) {
  const enrollments = getEnrollments();
  const existing = enrollments.find(e => e.userId === userId && e.courseId === courseId);

  if (existing) {
    return { ok: false, msg: 'Already enrolled in this course' };
  }

  const enrollment = {
    id: Date.now().toString(),
    userId,
    courseId,
    enrolledAt: new Date().toISOString(),
    progressPercent: 0,
    completedLessons: [],
    lastAccessed: new Date().toISOString()
  };

  enrollments.push(enrollment);
  sSet('enrollments', enrollments);
  return { ok: true, enrollment };
}

function unenrollCourse(userId, courseId) {
  const enrollments = getEnrollments();
  const filtered = enrollments.filter(e => !(e.userId === userId && e.courseId === courseId));
  sSet('enrollments', filtered);
  return true;
}

function updateProgress(userId, courseId, progressPercent, completedLessons = []) {
  const enrollments = getEnrollments();
  const enrollment = enrollments.find(e => e.userId === userId && e.courseId === courseId);

  if (!enrollment) return false;

  enrollment.progressPercent = progressPercent;
  enrollment.completedLessons = completedLessons;
  enrollment.lastAccessed = new Date().toISOString();

  sSet('enrollments', enrollments);
  return true;
}

function markLessonDone(userId, courseId, lessonId) {
  const enrollments = getEnrollments();
  const enrollment = enrollments.find(e => e.userId === userId && e.courseId === courseId);

  if (!enrollment) return false;

  if (!enrollment.completedLessons.includes(lessonId)) {
    enrollment.completedLessons.push(lessonId);
  }

  const course = getCourseById(courseId);
  const progressPercent = Math.round((enrollment.completedLessons.length / course.lessons.length) * 100);

  enrollment.progressPercent = progressPercent;
  enrollment.lastAccessed = new Date().toISOString();

  sSet('enrollments', enrollments);
  return true;
}

// Alias for markLessonComplete (used in player.html)
function markLessonComplete(userId, courseId, lessonId) {
  return markLessonDone(userId, courseId, lessonId);
}

// Lesson time tracking
function updateLessonTime(userId, courseId, lessonId, timeSpent) {
  const enrollments = getEnrollments();
  const enrollment = enrollments.find(e => e.userId === userId && e.courseId === courseId);

  if (!enrollment) return false;

  if (!enrollment.lessonTimes) {
    enrollment.lessonTimes = {};
  }

  enrollment.lessonTimes[lessonId] = (enrollment.lessonTimes[lessonId] || 0) + timeSpent;
  enrollment.lastAccessed = new Date().toISOString();

  sSet('enrollments', enrollments);
  return true;
}

// Alias for enrollCourse (used in payment.html)
function enrollUser(userId, courseId) {
  return enrollCourse(userId, courseId);
}

// Instructor functions
function getCoursesByInstructor(instructorId) {
  const courses = getAllCourses();
  return courses.filter(c => c.instructorId === instructorId);
}

// Analytics
function getCourseStats(courseId) {
  const enrollments = getEnrollments();
  const courseEnrollments = enrollments.filter(e => e.courseId === courseId);

  return {
    totalEnrollments: courseEnrollments.length,
    completedCount: courseEnrollments.filter(e => e.progressPercent === 100).length,
    averageProgress: courseEnrollments.length > 0
      ? Math.round(courseEnrollments.reduce((sum, e) => sum + e.progressPercent, 0) / courseEnrollments.length)
      : 0
  };
}

// Export functions
window.CourseManager = {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  getEnrollments,
  enrollCourse,
  unenrollCourse,
  updateProgress,
  markLessonDone,
  markLessonComplete,
  updateLessonTime,
  enrollUser,
  getCoursesByInstructor,
  getCourseStats
};
