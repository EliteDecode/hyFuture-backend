// Users Module Response Constants

export const USERS_MESSAGES = {
  // Success Messages
  WELCOME_MESSAGE_UPDATED: 'Welcome message updated successfully',
  USER_UPDATED: 'User updated successfully',
  USER_RETRIEVED: 'User retrieved successfully',

  // Error Messages
  USER_NOT_FOUND: 'User not found',
  NOT_USER_A: 'You are not authorized to perform this action',
  COUPLE_NOT_PENDING: 'Welcome message can only be set when couple is pending',
  INVALID_INPUT: 'Invalid input provided',
  ACCOUNT_DELETED: 'Account deleted successfully',
  INVALID_PASSWORD: 'Invalid password. Account deletion requires password confirmation',
} as const;

