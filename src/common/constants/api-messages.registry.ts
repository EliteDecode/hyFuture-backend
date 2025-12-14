// API Messages Registry
// Maps handler method names to success messages

export const API_MESSAGES_REGISTRY: Record<string, string> = {
  // Auth Controller
  register: 'User registered successfully. Please verify your email.',
  login: 'Login successful',
  verifyAuthCode:
    'Email verified successfully. Your couple profile has been created.',
  checkInvitation: 'Invitation code is valid',
  completeRegistration:
    'Registration completed successfully. Welcome to Two Tone!',
  renewTokens: 'Tokens renewed successfully',
  logout: 'Logged out successfully',
  resendInvitation: 'Invitation code has been resent successfully',
  forgotPassword:
    'Password reset code has been sent to your email. Please check your inbox.',
  resetPassword: 'Password has been reset successfully',

  // Users Controller
  setWelcomeMessage: 'Welcome message updated successfully',
  deleteAccount: 'Account deleted successfully',

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

  // Notifications Controller
  getNotifications: 'Notifications retrieved successfully',
  getUnreadCount: 'Unread count retrieved successfully',
  markAsRead: 'Notification marked as read',
  markAllAsRead: 'All notifications marked as read',
};
