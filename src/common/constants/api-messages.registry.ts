// API Messages Registry
// Maps handler method names to success messages

export const API_MESSAGES_REGISTRY: Record<string, string> = {
  // Auth Controller
  register: 'User registered successfully. Please verify your email.',
  login: 'Login successful',
  verifyAuthCode: 'Email verified successfully',
  checkInvitation: 'Invitation code is valid',
  completeRegistration: 'Registration completed successfully',
  renewTokens: 'Tokens renewed successfully',
  logout: 'Logged out successfully',
  resendInvitation: 'Invitation code has been resent successfully',
  forgotPassword: 'Password reset code has been sent to your email',
  resetPassword: 'Password has been reset successfully',
  resendVerificationCode: 'Verification code has been resent successfully',
  resendPasswordCode: 'Password reset code has been resent successfully',

  // Admin Auth Controller
  seedAdmin: 'Admin account seeded successfully',

  // Users Controller

  // Countries Controller
  findAll: 'Countries retrieved successfully',
  findOne: 'Country retrieved successfully',
  getMyCountry: 'Country information retrieved successfully',

  // Letters Controller
  createGuestLetter: 'Guest letter created successfully',
  createAuthenticatedLetter: 'Letter created successfully',
  getAllLetters: 'Letters retrieved successfully',
  getLetterById: 'Letter retrieved successfully',
  deleteLetter: 'Letter deleted successfully',
  createDraft: 'Draft saved successfully',
  updateDraft: 'Draft updated successfully',
  getAllPublicLetters: 'Public letters retrieved successfully',
  getPublicLetterById: 'Public letter retrieved successfully',
  getAdminStats: 'Admin statistics retrieved successfully',
  getAdminLetters: 'Admin letters retrieved successfully',
  fixDoubleEncryption: 'Double encryption fixed successfully',

  // Notifications Controller
  getNotifications: 'Notifications retrieved successfully',
  getUnreadCount: 'Unread count retrieved successfully',
  markAsRead: 'Notification marked as read',
  markAllAsRead: 'All notifications marked as read',

  // Profile Controller
  getProfile: 'Profile retrieved successfully',
  updateProfile: 'Profile updated successfully',
  changePassword: 'Password changed successfully',

  // Waitlist Controller
  create: 'Successfully joined the waitlist',
  getAllWaitlist: 'Waitlist entries retrieved successfully',

  // Broadcast Email Controller
  createBroadcastEmail: 'Broadcast email job created successfully',
  getJobStatus: 'Broadcast job status retrieved successfully',
  getQueueStats: 'Queue statistics retrieved successfully',

  // Users Controller
  setWelcomeMessage: 'Welcome message updated successfully',
  deleteAccount: 'Account deleted successfully',
  getAllUsers: 'Users retrieved successfully',
};
