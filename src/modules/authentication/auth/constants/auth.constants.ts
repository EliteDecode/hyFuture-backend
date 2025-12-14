// Auth Module Response Constants

export const AUTH_MESSAGES = {
  // Success Messages
  REGISTER_SUCCESS: 'User registered successfully. Please verify your email.',
  LOGIN_SUCCESS: 'Login successful',
  VERIFY_SUCCESS:
    'Email verified successfully. Your couple profile has been created.',
  LOGOUT_SUCCESS: 'Logged out successfully',
  TOKEN_RENEWED: 'Tokens renewed successfully',
  INVITATION_VALID: 'Invitation code is valid',
  REGISTRATION_COMPLETE:
    'Registration completed successfully. Welcome to Two Tone!',
  VERIFICATION_CODE_SENT: 'A verification code has been sent to your email',

  // Error Messages (Generic to prevent information leakage)
  INVALID_CREDENTIALS: 'Invalid email or password',
  USER_ALREADY_EXISTS: 'An account with this email already exists',
  USER_NOT_FOUND: 'User not found',
  INVALID_AUTH_CODE: 'Invalid or expired verification code',
  AUTH_CODE_NOT_FOUND: 'Verification code not found',
  AUTH_CODE_EXPIRED: 'Verification code has expired',
  AUTH_CODE_ALREADY_EXISTS:
    'A verification code has already been sent. Please check your email.',
  INVALID_TOKEN: 'Invalid or expired token',
  TOKEN_NOT_FOUND: 'Token not found',
  USER_NOT_VERIFIED: 'Please verify your email before proceeding',
  USER_ALREADY_VERIFIED: 'User is already verified',
  ALREADY_HAS_COUPLE: 'User already has a couple',
  PARTNER_EMAIL_REQUIRED: 'Partner email is required',
  ALREADY_IN_COUPLE: 'User is already in a couple',
  INVITATION_NOT_FOUND: 'Invitation code not found',
  INVITATION_EXPIRED: 'Invitation code has expired',
  INVITATION_ALREADY_USED: 'Invitation code has already been used',
  COUPLE_ALREADY_USED: 'This invitation has already been used',
  NOT_PARTNER: 'You are not authorized to use this invitation code',
  PENDING_INVITATION_EXISTS:
    'You have a pending invitation from {partnerName}. Please use your invitation code to join.',
  INVITATION_RESENT: 'Invitation code has been resent successfully',
  NO_PENDING_INVITATION: 'No pending invitation found to resend',
  PASSWORD_RESET_CODE_SENT:
    'Password reset code has been sent to your email. Please check your inbox.',
  PASSWORDS_DO_NOT_MATCH: 'Passwords do not match',
  PASSWORD_RESET_SUCCESS: 'Password has been reset successfully',
} as const;

export const AUTH_CONSTANTS = {
  // Time constants (in milliseconds)
  INVITATION_CODE_EXPIRY_HOURS: 72,
  AUTH_CODE_EXPIRY_MINUTES: 10,

  // Rate limiting
  MAX_LOGIN_ATTEMPTS: 5,
  MAX_REGISTRATION_ATTEMPTS: 3,
  MAX_VERIFICATION_ATTEMPTS: 3,
} as const;
