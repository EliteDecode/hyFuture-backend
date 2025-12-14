// Tokens Module Response Constants

export const TOKENS_MESSAGES = {
  // Success Messages
  TOKEN_GENERATED: 'Token generated successfully',
  TOKEN_REVOKED: 'Token revoked successfully',
  AUTH_CODE_SENT: 'Verification code sent successfully',
  AUTH_CODE_VERIFIED: 'Verification code verified successfully',
  AUTH_CODE_DELETED: 'Verification code deleted successfully',

  // Error Messages
  INVALID_TOKEN: 'Invalid or expired token',
  TOKEN_NOT_FOUND: 'Token not found',
  AUTH_CODE_NOT_FOUND: 'Verification code not found',
  AUTH_CODE_EXPIRED: 'Verification code has expired',
  AUTH_CODE_INVALID: 'Invalid verification code',
  AUTH_CODE_ALREADY_EXISTS: 'A verification code has already been sent. Please check your email.',
  USER_NOT_FOUND: 'User not found',
} as const;

export const TOKENS_CONSTANTS = {
  AUTH_CODE_EXPIRY_MINUTES: 10,
  AUTH_CODE_LENGTH: 6,
} as const;

