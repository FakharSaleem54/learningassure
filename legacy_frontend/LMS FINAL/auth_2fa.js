// Two-Factor Authentication System

class TwoFactorAuth {
  constructor() {
    this.enabledUsers = this.loadEnabledUsers();
    this.backupCodes = this.loadBackupCodes();
    this.tempSecrets = {}; // Temporary secrets for setup
  }

  loadEnabledUsers() {
    const stored = localStorage.getItem('2fa_enabled_users');
    return stored ? JSON.parse(stored) : [];
  }

  loadBackupCodes() {
    const stored = localStorage.getItem('2fa_backup_codes');
    return stored ? JSON.parse(stored) : {};
  }

  saveEnabledUsers() {
    localStorage.setItem('2fa_enabled_users', JSON.stringify(this.enabledUsers));
  }

  saveBackupCodes() {
    localStorage.setItem('2fa_backup_codes', JSON.stringify(this.backupCodes));
  }

  // Generate a random secret for TOTP
  generateSecret() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return secret;
  }

  // Generate TOTP code from secret
  generateTOTP(secret, timeStep = 30) {
    const time = Math.floor(Date.now() / 1000 / timeStep);
    const timeHex = this.intToHex(time);
    const secretBytes = this.base32ToBytes(secret);
    const hmac = this.hmacSha1(secretBytes, timeHex);
    const offset = hmac[hmac.length - 1] & 0x0f;
    const code = ((hmac[offset] & 0x7f) << 24) |
                 ((hmac[offset + 1] & 0xff) << 16) |
                 ((hmac[offset + 2] & 0xff) << 8) |
                 (hmac[offset + 3] & 0xff);
    return (code % 1000000).toString().padStart(6, '0');
  }

  // Verify TOTP code
  verifyTOTP(secret, code, window = 1) {
    const timeStep = 30;
    const currentTime = Math.floor(Date.now() / 1000 / timeStep);

    for (let i = -window; i <= window; i++) {
      const checkTime = currentTime + i;
      const expectedCode = this.generateTOTP(secret, timeStep);
      if (code === expectedCode) {
        return true;
      }
    }
    return false;
  }

  // Helper functions for TOTP
  intToHex(int) {
    let hex = '';
    for (let i = 7; i >= 0; i--) {
      hex += ((int >>> (i * 4)) & 0xf).toString(16);
    }
    return hex;
  }

  base32ToBytes(base32) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = '';
    let bytes = [];

    for (let char of base32.toUpperCase()) {
      const index = alphabet.indexOf(char);
      if (index === -1) continue;
      bits += index.toString(2).padStart(5, '0');
    }

    for (let i = 0; i < bits.length; i += 8) {
      const byte = bits.substr(i, 8);
      if (byte.length === 8) {
        bytes.push(parseInt(byte, 2));
      }
    }

    return bytes;
  }

  hmacSha1(key, message) {
    // Simple HMAC-SHA1 implementation (in production, use crypto libraries)
    // This is a basic implementation for demonstration
    return new Uint8Array(20); // Placeholder - would need proper crypto implementation
  }

  // Enable 2FA for a user
  async enable2FA(userId) {
    const secret = this.generateSecret();
    this.tempSecrets[userId] = {
      secret: secret,
      timestamp: Date.now()
    };

    // Generate backup codes
    const backupCodes = this.generateBackupCodes();
    this.backupCodes[userId] = backupCodes;

    // Generate QR code URL for authenticator apps
    const qrUrl = this.generateQRCodeURL(userId, secret);

    return {
      secret: secret,
      qrUrl: qrUrl,
      backupCodes: backupCodes
    };
  }

  // Verify and complete 2FA setup
  async verifyAndEnable2FA(userId, code) {
    const tempData = this.tempSecrets[userId];
    if (!tempData) {
      throw new Error('No 2FA setup in progress');
    }

    // Check if setup hasn't expired (5 minutes)
    if (Date.now() - tempData.timestamp > 5 * 60 * 1000) {
      delete this.tempSecrets[userId];
      throw new Error('2FA setup expired. Please start again.');
    }

    // Verify the code
    if (!this.verifyTOTP(tempData.secret, code)) {
      throw new Error('Invalid verification code');
    }

    // Enable 2FA for user
    this.enabledUsers.push({
      userId: userId,
      secret: tempData.secret,
      enabledAt: new Date().toISOString(),
      backupCodesUsed: 0
    });

    this.saveEnabledUsers();
    this.saveBackupCodes();

    // Clean up temp data
    delete this.tempSecrets[userId];

    return true;
  }

  // Generate backup codes
  generateBackupCodes(count = 10) {
    const codes = [];
    for (let i = 0; i < count; i++) {
      codes.push(Math.random().toString(36).substr(2, 8).toUpperCase());
    }
    return codes;
  }

  // Generate QR code URL for authenticator apps
  generateQRCodeURL(userId, secret) {
    const issuer = 'Learning Assure';
    const accountName = userId + '@learningassure.com';
    return `otpauth://totp/${issuer}:${accountName}?secret=${secret}&issuer=${issuer}`;
  }

  // Verify 2FA code during login
  async verifyLoginCode(userId, code) {
    const user2FA = this.enabledUsers.find(u => u.userId === userId);
    if (!user2FA) {
      return true; // 2FA not enabled for this user
    }

    // Check if it's a backup code
    if (this.backupCodes[userId] && this.backupCodes[userId].includes(code)) {
      // Remove used backup code
      this.backupCodes[userId] = this.backupCodes[userId].filter(c => c !== code);
      user2FA.backupCodesUsed++;
      this.saveBackupCodes();
      this.saveEnabledUsers();
      return true;
    }

    // Verify TOTP code
    return this.verifyTOTP(user2FA.secret, code);
  }

  // Check if 2FA is enabled for user
  isEnabled(userId) {
    return this.enabledUsers.some(u => u.userId === userId);
  }

  // Disable 2FA for user
  disable2FA(userId) {
    this.enabledUsers = this.enabledUsers.filter(u => u.userId !== userId);
    delete this.backupCodes[userId];
    this.saveEnabledUsers();
    this.saveBackupCodes();
  }

  // Get remaining backup codes count
  getBackupCodesCount(userId) {
    return this.backupCodes[userId] ? this.backupCodes[userId].length : 0;
  }

  // Regenerate backup codes
  regenerateBackupCodes(userId) {
    if (!this.isEnabled(userId)) {
      throw new Error('2FA not enabled for this user');
    }

    const newCodes = this.generateBackupCodes();
    this.backupCodes[userId] = newCodes;
    this.saveBackupCodes();

    return newCodes;
  }
}

// Initialize 2FA system
const TwoFAManager = new TwoFactorAuth();

// Export for global use
window.TwoFAManager = TwoFAManager;
