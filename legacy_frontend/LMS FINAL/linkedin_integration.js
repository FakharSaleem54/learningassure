// LinkedIn Certificate Integration for LMS

class LinkedInIntegration {
  constructor() {
    this.clientId = 'YOUR_LINKEDIN_CLIENT_ID'; // Replace with actual LinkedIn app credentials
    this.clientSecret = 'YOUR_LINKEDIN_CLIENT_SECRET';
    this.redirectUri = `${window.location.origin}/linkedin-callback.html`;
    this.apiBaseUrl = 'https://api.linkedin.com/v2';
    this.authUrl = 'https://www.linkedin.com/oauth/v2/authorization';
    this.tokenUrl = 'https://www.linkedin.com/oauth/v2/accessToken';

    this.accessToken = null;
    this.userProfile = null;
  }

  // Initialize LinkedIn SDK
  init() {
    // Load LinkedIn JavaScript SDK
    if (!document.getElementById('linkedin-sdk')) {
      const script = document.createElement('script');
      script.id = 'linkedin-sdk';
      script.src = 'https://platform.linkedin.com/in.js';
      script.innerHTML = `
        api_key: ${this.clientId}
        authorize: true
        lang: en_US
      `;
      document.head.appendChild(script);
    }
  }

  // Start LinkedIn OAuth flow
  login() {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: 'r_liteprofile r_emailaddress w_member_social',
      state: this.generateState()
    });

    const authUrl = `${this.authUrl}?${params.toString()}`;
    window.location.href = authUrl;
  }

  // Handle OAuth callback
  async handleCallback(code, state) {
    if (!this.verifyState(state)) {
      throw new Error('Invalid state parameter');
    }

    try {
      // Exchange code for access token
      const tokenResponse = await this.exchangeCodeForToken(code);
      this.accessToken = tokenResponse.access_token;

      // Get user profile
      this.userProfile = await this.getUserProfile();

      // Store authentication data
      this.storeAuthData(tokenResponse);

      return {
        success: true,
        profile: this.userProfile
      };
    } catch (error) {
      console.error('LinkedIn authentication failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Exchange authorization code for access token
  async exchangeCodeForToken(code) {
    const response = await fetch(this.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: this.redirectUri,
        client_id: this.clientId,
        client_secret: this.clientSecret
      })
    });

    if (!response.ok) {
      throw new Error('Failed to exchange code for token');
    }

    return await response.json();
  }

  // Get LinkedIn user profile
  async getUserProfile() {
    const response = await fetch(`${this.apiBaseUrl}/people/~:(id,firstName,lastName,profilePicture,publicProfileUrl)`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get user profile');
    }

    const profile = await response.json();

    // Get additional profile data for AI recommendations
    const skills = await this.getUserSkills();
    const positions = await this.getUserPositions();
    const education = await this.getUserEducation();

    return {
      id: profile.id,
      firstName: profile.firstName.localized.en_US,
      lastName: profile.lastName.localized.en_US,
      profilePicture: profile.profilePicture?.displayImage,
      publicProfileUrl: profile.publicProfileUrl,
      skills: skills,
      positions: positions,
      education: education
    };
  }

  // Share certificate on LinkedIn
  async shareCertificate(certificateData) {
    if (!this.accessToken) {
      throw new Error('User not authenticated with LinkedIn');
    }

    const shareData = {
      author: `urn:li:person:${this.userProfile.id}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: `I am proud to share that I have successfully completed the "${certificateData.courseTitle}" course on Learning Assure! 🎓

Certificate ID: ${certificateData.id}
Completion Date: ${new Date(certificateData.completionDate).toLocaleDateString()}
Issued by: Learning Assure

#LearningAssure #Certificate #ProfessionalDevelopment #${certificateData.courseTitle.replace(/\s+/g, '')}`
          },
          shareMediaCategory: 'IMAGE',
          media: [{
            status: 'READY',
            description: {
              text: `${certificateData.courseTitle} Certificate from Learning Assure`
            },
            media: certificateData.certificateImageUrl,
            title: {
              text: `${certificateData.courseTitle} Certificate`
            }
          }]
        }
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
      }
    };

    try {
      const response = await fetch(`${this.apiBaseUrl}/ugcPosts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0'
        },
        body: JSON.stringify(shareData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`LinkedIn share failed: ${errorData.message}`);
      }

      const result = await response.json();

      // Log the share
      this.logCertificateShare(certificateData.id, result.id);

      return {
        success: true,
        postId: result.id,
        shareUrl: `https://www.linkedin.com/feed/update/${result.id}`
      };

    } catch (error) {
      console.error('Failed to share certificate on LinkedIn:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Add certificate to LinkedIn profile (as achievement)
  async addCertificateToProfile(certificateData) {
    if (!this.accessToken) {
      throw new Error('User not authenticated with LinkedIn');
    }

    // Note: LinkedIn API doesn't have direct certificate addition
    // This would typically be done through their "Add profile section" feature
    // For now, we'll share it as a post with achievement context

    return await this.shareCertificate({
      ...certificateData,
      shareType: 'achievement'
    });
  }

  // Generate certificate image for sharing
  async generateCertificateImage(certificateData) {
    // This would integrate with a service like html2canvas or a backend service
    // For now, return a placeholder URL
    return `https://learningassure.com/certificates/${certificateData.id}/image.png`;
  }

  // Check if user is connected to LinkedIn
  isConnected() {
    return this.accessToken && this.userProfile;
  }

  // Disconnect from LinkedIn
  disconnect() {
    this.accessToken = null;
    this.userProfile = null;
    localStorage.removeItem('linkedin_auth');
  }

  // Store authentication data
  storeAuthData(tokenData) {
    const authData = {
      accessToken: tokenData.access_token,
      expiresAt: Date.now() + (tokenData.expires_in * 1000),
      userProfile: this.userProfile
    };

    localStorage.setItem('linkedin_auth', JSON.stringify(authData));
  }

  // Load stored authentication data
  loadStoredAuth() {
    const stored = localStorage.getItem('linkedin_auth');
    if (stored) {
      const authData = JSON.parse(stored);

      // Check if token is still valid
      if (authData.expiresAt > Date.now()) {
        this.accessToken = authData.accessToken;
        this.userProfile = authData.userProfile;
        return true;
      } else {
        // Token expired, remove it
        localStorage.removeItem('linkedin_auth');
      }
    }
    return false;
  }

  // Generate state parameter for OAuth security
  generateState() {
    const state = Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem('linkedin_oauth_state', state);
    return state;
  }

  // Verify state parameter
  verifyState(state) {
    const storedState = sessionStorage.getItem('linkedin_oauth_state');
    sessionStorage.removeItem('linkedin_oauth_state');
    return state === storedState;
  }

  // Log certificate sharing
  logCertificateShare(certificateId, linkedinPostId) {
    const shareLog = {
      id: Date.now().toString(),
      certificateId,
      linkedinPostId,
      userId: this.getCurrentUser()?.id,
      sharedAt: new Date().toISOString(),
      platform: 'linkedin'
    };

    const logs = JSON.parse(localStorage.getItem('certificate_shares') || '[]');
    logs.push(shareLog);
    localStorage.setItem('certificate_shares', JSON.stringify(logs));
  }

  // Get sharing history
  getSharingHistory(userId = null) {
    const logs = JSON.parse(localStorage.getItem('certificate_shares') || '[]');
    return userId ? logs.filter(log => log.userId === userId) : logs;
  }

  // Create share button for certificates
  createShareButton(certificateData, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const button = document.createElement('button');
    button.className = 'btn linkedin-share-btn';
    button.innerHTML = `
      <span class="btn-icon">💼</span>
      Share on LinkedIn
    `;
    button.onclick = () => this.handleShareClick(certificateData);

    container.appendChild(button);
  }

  // Handle share button click
  async handleShareClick(certificateData) {
    if (!this.isConnected()) {
      // Redirect to LinkedIn login
      this.login();
      return;
    }

    try {
      // Generate certificate image
      certificateData.certificateImageUrl = await this.generateCertificateImage(certificateData);

      // Share on LinkedIn
      const result = await this.shareCertificate(certificateData);

      if (result.success) {
        alert('Certificate shared successfully on LinkedIn!');
        // Optionally open the post in a new window
        window.open(result.shareUrl, '_blank');
      } else {
        alert('Failed to share certificate: ' + result.error);
      }
    } catch (error) {
      alert('Error sharing certificate: ' + error.message);
    }
  }

  // Get current user (mock implementation)
  getCurrentUser() {
    return JSON.parse(localStorage.getItem('currentUser') || 'null');
  }

  // Get user skills from LinkedIn
  async getUserSkills() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/people/~:(skills)`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0'
        }
      });

      if (!response.ok) {
        console.warn('Failed to fetch LinkedIn skills');
        return [];
      }

      const data = await response.json();
      return data.skills?.values?.map(skill => skill.skill.name) || [];
    } catch (error) {
      console.warn('Error fetching LinkedIn skills:', error);
      return [];
    }
  }

  // Get user positions (work experience) from LinkedIn
  async getUserPositions() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/people/~:(positions)`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0'
        }
      });

      if (!response.ok) {
        console.warn('Failed to fetch LinkedIn positions');
        return [];
      }

      const data = await response.json();
      return data.positions?.values?.map(position => ({
        title: position.title,
        company: position.company?.name,
        industry: position.company?.industry,
        startDate: position.startDate,
        endDate: position.endDate,
        isCurrent: position.isCurrent
      })) || [];
    } catch (error) {
      console.warn('Error fetching LinkedIn positions:', error);
      return [];
    }
  }

  // Get user education from LinkedIn
  async getUserEducation() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/people/~:(educations)`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0'
        }
      });

      if (!response.ok) {
        console.warn('Failed to fetch LinkedIn education');
        return [];
      }

      const data = await response.json();
      return data.educations?.values?.map(edu => ({
        schoolName: edu.schoolName,
        degree: edu.degree,
        fieldOfStudy: edu.fieldOfStudy,
        startDate: edu.startDate,
        endDate: edu.endDate
      })) || [];
    } catch (error) {
      console.warn('Error fetching LinkedIn education:', error);
      return [];
    }
  }

  // Initialize on page load
  static init() {
    const instance = new LinkedInIntegration();
    instance.init();
    instance.loadStoredAuth();

    // Make globally available
    window.LinkedInIntegration = instance;

    return instance;
  }
}

// Initialize LinkedIn integration
document.addEventListener('DOMContentLoaded', () => {
  LinkedInIntegration.init();
});
