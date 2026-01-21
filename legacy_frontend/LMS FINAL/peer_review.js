// Peer Review and Group Assessment System

class PeerReviewManager {
  constructor() {
    this.reviews = this.loadReviews();
    this.assignments = this.loadAssignments();
    this.groups = this.loadGroups();
    this.rubrics = this.loadRubrics();
  }

  loadReviews() {
    const stored = localStorage.getItem('peer_reviews');
    return stored ? JSON.parse(stored) : [];
  }

  loadAssignments() {
    const stored = localStorage.getItem('peer_assignments');
    return stored ? JSON.parse(stored) : [];
  }

  loadGroups() {
    const stored = localStorage.getItem('peer_groups');
    return stored ? JSON.parse(stored) : [];
  }

  loadRubrics() {
    const stored = localStorage.getItem('peer_rubrics');
    return stored ? JSON.parse(stored) : [];
  }

  saveReviews() {
    localStorage.setItem('peer_reviews', JSON.stringify(this.reviews));
  }

  saveAssignments() {
    localStorage.setItem('peer_assignments', JSON.stringify(this.assignments));
  }

  saveGroups() {
    localStorage.setItem('peer_groups', JSON.stringify(this.groups));
  }

  saveRubrics() {
    localStorage.setItem('peer_rubrics', JSON.stringify(this.rubrics));
  }

  // Create a peer review assignment
  createPeerAssignment(assignmentData) {
    const assignment = {
      id: Date.now().toString(),
      courseId: assignmentData.courseId,
      lessonId: assignmentData.lessonId,
      title: assignmentData.title,
      description: assignmentData.description,
      instructions: assignmentData.instructions,
      type: assignmentData.type, // 'individual', 'group', 'peer_review'
      rubricId: assignmentData.rubricId,
      submissionType: assignmentData.submissionType, // 'text', 'file', 'url'
      maxFileSize: assignmentData.maxFileSize || 10, // MB
      allowLateSubmissions: assignmentData.allowLateSubmissions || false,
      peerReviewRequired: assignmentData.peerReviewRequired || false,
      reviewCount: assignmentData.reviewCount || 2, // how many peers to review
      dueDate: assignmentData.dueDate,
      reviewDueDate: assignmentData.reviewDueDate,
      isActive: true,
      createdBy: this.getCurrentUser()?.id,
      createdAt: new Date().toISOString()
    };

    this.assignments.push(assignment);
    this.saveAssignments();

    return assignment;
  }

  // Create a rubric for assessment
  createRubric(rubricData) {
    const rubric = {
      id: Date.now().toString(),
      name: rubricData.name,
      description: rubricData.description,
      criteria: rubricData.criteria.map(criterion => ({
        id: Date.now().toString() + Math.random(),
        name: criterion.name,
        description: criterion.description,
        levels: criterion.levels.map(level => ({
          score: level.score,
          description: level.description
        }))
      })),
      createdBy: this.getCurrentUser()?.id,
      createdAt: new Date().toISOString()
    };

    this.rubrics.push(rubric);
    this.saveRubrics();

    return rubric;
  }

  // Submit assignment
  submitAssignment(submissionData) {
    const { assignmentId, userId, content, files, url } = submissionData;

    const assignment = this.assignments.find(a => a.id === assignmentId);
    if (!assignment) {
      throw new Error('Assignment not found');
    }

    // Check if already submitted
    const existingSubmission = this.getSubmission(assignmentId, userId);
    if (existingSubmission) {
      throw new Error('Assignment already submitted');
    }

    // Check due date
    if (assignment.dueDate && new Date() > new Date(assignment.dueDate) && !assignment.allowLateSubmissions) {
      throw new Error('Assignment submission deadline has passed');
    }

    const submission = {
      id: Date.now().toString(),
      assignmentId,
      userId,
      content: content || '',
      files: files || [],
      url: url || '',
      submittedAt: new Date().toISOString(),
      status: 'submitted',
      grade: null,
      feedback: '',
      peerReviews: []
    };

    // Save submission (mock - would integrate with existing submission system)
    this.saveSubmission(submission);

    // If peer review is required, assign reviewers
    if (assignment.peerReviewRequired) {
      this.assignPeerReviewers(assignmentId, userId);
    }

    return submission;
  }

  // Assign peer reviewers
  assignPeerReviewers(assignmentId, submitterId) {
    const assignment = this.assignments.find(a => a.id === assignmentId);
    if (!assignment) return;

    // Get all submissions for this assignment
    const submissions = this.getAssignmentSubmissions(assignmentId);
    const otherSubmissions = submissions.filter(s => s.userId !== submitterId);

    if (otherSubmissions.length < assignment.reviewCount) {
      // Not enough submissions yet, will assign later
      return;
    }

    // Randomly select reviewers
    const reviewers = this.shuffleArray(otherSubmissions)
      .slice(0, assignment.reviewCount)
      .map(s => s.userId);

    // Create review assignments
    reviewers.forEach(reviewerId => {
      const review = {
        id: Date.now().toString(),
        assignmentId,
        reviewerId,
        revieweeId: submitterId,
        status: 'pending',
        rubricScores: {},
        comments: '',
        assignedAt: new Date().toISOString()
      };

      this.reviews.push(review);
    });

    this.saveReviews();
  }

  // Submit peer review
  submitPeerReview(reviewData) {
    const { reviewId, rubricScores, comments } = reviewData;

    const review = this.reviews.find(r => r.id === reviewId);
    if (!review) {
      throw new Error('Review not found');
    }

    if (review.reviewerId !== this.getCurrentUser()?.id) {
      throw new Error('You are not assigned to review this submission');
    }

    review.rubricScores = rubricScores;
    review.comments = comments;
    review.submittedAt = new Date().toISOString();
    review.status = 'completed';

    this.saveReviews();

    // Check if all reviews are complete for this submission
    this.checkReviewCompletion(review.assignmentId, review.revieweeId);

    return review;
  }

  // Check if all peer reviews are complete
  checkReviewCompletion(assignmentId, revieweeId) {
    const assignment = this.assignments.find(a => a.id === assignmentId);
    if (!assignment) return;

    const submissionReviews = this.reviews.filter(r =>
      r.assignmentId === assignmentId &&
      r.revieweeId === revieweeId &&
      r.status === 'completed'
    );

    if (submissionReviews.length >= assignment.reviewCount) {
      // Calculate average scores
      const averageScores = this.calculateAverageScores(submissionReviews, assignment.rubricId);

      // Update submission with peer review results
      this.updateSubmissionWithReviews(assignmentId, revieweeId, averageScores);

      // Notify student
      if (window.NotificationManager) {
        window.NotificationManager.createNotification(
          revieweeId,
          'peer_reviews_complete',
          { assignmentTitle: assignment.title },
          ['inApp']
        );
      }
    }
  }

  // Calculate average rubric scores
  calculateAverageScores(reviews, rubricId) {
    const rubric = this.rubrics.find(r => r.id === rubricId);
    if (!rubric) return {};

    const averages = {};

    rubric.criteria.forEach(criterion => {
      const scores = reviews
        .map(review => review.rubricScores[criterion.id])
        .filter(score => score !== undefined);

      if (scores.length > 0) {
        averages[criterion.id] = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      }
    });

    return averages;
  }

  // Create study groups
  createStudyGroup(groupData) {
    const group = {
      id: Date.now().toString(),
      name: groupData.name,
      description: groupData.description,
      courseId: groupData.courseId,
      maxMembers: groupData.maxMembers || 5,
      members: [groupData.creatorId],
      assignments: [],
      createdBy: groupData.creatorId,
      createdAt: new Date().toISOString(),
      isActive: true
    };

    this.groups.push(group);
    this.saveGroups();

    return group;
  }

  // Join study group
  joinStudyGroup(groupId, userId) {
    const group = this.groups.find(g => g.id === groupId);
    if (!group) {
      throw new Error('Group not found');
    }

    if (group.members.includes(userId)) {
      throw new Error('You are already a member of this group');
    }

    if (group.members.length >= group.maxMembers) {
      throw new Error('Group is full');
    }

    group.members.push(userId);
    this.saveGroups();

    return group;
  }

  // Assign group project
  assignGroupProject(projectData) {
    const { groupId, assignmentData } = projectData;

    const group = this.groups.find(g => g.id === groupId);
    if (!group) {
      throw new Error('Group not found');
    }

    const project = {
      id: Date.now().toString(),
      groupId,
      ...assignmentData,
      assignedTo: group.members,
      status: 'active',
      createdAt: new Date().toISOString()
    };

    group.assignments.push(project);
    this.saveGroups();

    return project;
  }

  // Submit group project
  submitGroupProject(submissionData) {
    const { projectId, submittedBy, content, files } = submissionData;

    // Find the project
    let project = null;
    for (const group of this.groups) {
      project = group.assignments.find(a => a.id === projectId);
      if (project) break;
    }

    if (!project) {
      throw new Error('Project not found');
    }

    if (!project.assignedTo.includes(submittedBy)) {
      throw new Error('You are not assigned to this project');
    }

    // Check if already submitted
    if (project.submissions) {
      const existingSubmission = project.submissions.find(s => s.userId === submittedBy);
      if (existingSubmission) {
        throw new Error('You have already submitted this project');
      }
    } else {
      project.submissions = [];
    }

    const submission = {
      userId: submittedBy,
      content: content || '',
      files: files || [],
      submittedAt: new Date().toISOString()
    };

    project.submissions.push(submission);
    this.saveGroups();

    return submission;
  }

  // Get user's assignments
  getUserAssignments(userId, courseId = null) {
    let userAssignments = this.assignments.filter(assignment => {
      if (courseId && assignment.courseId !== courseId) return false;

      // Check if user is enrolled in the course
      return this.isUserEnrolled(userId, assignment.courseId);
    });

    // Add submission status
    userAssignments = userAssignments.map(assignment => ({
      ...assignment,
      submission: this.getSubmission(assignment.id, userId),
      peerReviews: this.getUserPeerReviews(assignment.id, userId)
    }));

    return userAssignments;
  }

  // Get assignments for review
  getAssignmentsForReview(userId) {
    return this.reviews
      .filter(review => review.reviewerId === userId && review.status === 'pending')
      .map(review => {
        const assignment = this.assignments.find(a => a.id === review.assignmentId);
        const submission = this.getSubmission(review.assignmentId, review.revieweeId);

        return {
          reviewId: review.id,
          assignment: assignment,
          submission: submission,
          assignedAt: review.assignedAt
        };
      });
  }

  // Get peer review statistics
  getPeerReviewStats(userId) {
    const submittedReviews = this.reviews.filter(r => r.reviewerId === userId && r.status === 'completed').length;
    const receivedReviews = this.reviews.filter(r => r.revieweeId === userId && r.status === 'completed').length;
    const pendingReviews = this.reviews.filter(r => r.reviewerId === userId && r.status === 'pending').length;

    return {
      submittedReviews,
      receivedReviews,
      pendingReviews,
      averageRating: this.calculateAverageRating(userId)
    };
  }

  // Calculate average peer review rating
  calculateAverageRating(userId) {
    const userReviews = this.reviews.filter(r => r.revieweeId === userId && r.status === 'completed');

    if (userReviews.length === 0) return 0;

    const totalScore = userReviews.reduce((sum, review) => {
      const scores = Object.values(review.rubricScores);
      return sum + (scores.reduce((s, score) => s + score, 0) / scores.length);
    }, 0);

    return totalScore / userReviews.length;
  }

  // Helper methods
  getSubmission(assignmentId, userId) {
    // Mock implementation - would integrate with existing submission system
    const submissions = JSON.parse(localStorage.getItem('assignment_submissions') || '[]');
    return submissions.find(s => s.assignmentId === assignmentId && s.userId === userId);
  }

  saveSubmission(submission) {
    const submissions = JSON.parse(localStorage.getItem('assignment_submissions') || '[]');
    submissions.push(submission);
    localStorage.setItem('assignment_submissions', JSON.stringify(submissions));
  }

  updateSubmissionWithReviews(assignmentId, userId, averageScores) {
    // Mock implementation
    console.log('Updating submission with peer review scores:', averageScores);
  }

  getAssignmentSubmissions(assignmentId) {
    const submissions = JSON.parse(localStorage.getItem('assignment_submissions') || '[]');
    return submissions.filter(s => s.assignmentId === assignmentId);
  }

  getUserPeerReviews(assignmentId, userId) {
    return this.reviews.filter(r =>
      r.assignmentId === assignmentId &&
      (r.reviewerId === userId || r.revieweeId === userId)
    );
  }

  isUserEnrolled(userId, courseId) {
    // Mock implementation - would check enrollment system
    const enrollments = JSON.parse(localStorage.getItem('enrollments') || '[]');
    return enrollments.some(e => e.userId === userId && e.courseId === courseId);
  }

  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  getCurrentUser() {
    // Mock implementation
    return { id: 'user1', role: 'learner' };
  }

  // Get all rubrics
  getRubrics() {
    return this.rubrics;
  }

  // Get rubric by ID
  getRubric(rubricId) {
    return this.rubrics.find(r => r.id === rubricId);
  }

  // Get study groups for course
  getCourseGroups(courseId) {
    return this.groups.filter(g => g.courseId === courseId && g.isActive);
  }

  // Get user's groups
  getUserGroups(userId) {
    return this.groups.filter(g => g.members.includes(userId) && g.isActive);
  }
}

// Initialize peer review manager
const PeerReviewManagerInstance = new PeerReviewManager();

// Export for global use
window.PeerReviewManager = PeerReviewManagerInstance;
