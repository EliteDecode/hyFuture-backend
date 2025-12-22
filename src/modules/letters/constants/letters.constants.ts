// Letters Module Constants

export const LETTERS_CONSTANTS = {
  // Rate limiting (Guest letter creation)
  // 10 requests per hour
  MAX_GUEST_LETTER_ATTEMPTS: 10,
  GUEST_LETTER_TTL_MS: 60 * 60 * 1000, // 1 hour in milliseconds

  // Rate limiting (Authenticated letter creation)
  // 20 requests per hour
  MAX_AUTHENTICATED_LETTER_ATTEMPTS: 20,
  AUTHENTICATED_LETTER_TTL_MS: 60 * 60 * 1000, // 1 hour in milliseconds
} as const;

export const LETTERS_MESSAGES = {
  // Success Messages
  LETTER_CREATED: 'Letter created successfully',
  LETTER_RETRIEVED: 'Letter retrieved successfully',
  LETTERS_RETRIEVED: 'Letters retrieved successfully',
  LETTER_DELETED: 'Letter deleted successfully',
  DRAFT_CREATED: 'Draft saved successfully',
  DRAFT_UPDATED: 'Draft updated successfully',

  // Error Messages
  LETTER_NOT_FOUND: 'Letter not found',
  DELIVERY_DATE_NOT_REACHED:
    'You cannot view this letter because the delivery date has not been reached yet',
  CANNOT_DELETE_BEFORE_DELIVERY:
    'You cannot delete this letter because the delivery date has not passed yet',
  CANNOT_DELETE_NON_DRAFT:
    'You can only delete draft letters. Once a letter is scheduled or delivered, it cannot be deleted.',
  UNAUTHORIZED_ACCESS: 'You are not authorized to access this letter',
  GUEST_LETTER_LIMIT_REACHED:
    'You have already sent a letter. Please sign up to send more letters.',
  CANNOT_UPDATE_SENT_LETTER:
    'You cannot update a letter that has already been sent. Only drafts can be updated.',
  DRAFT_NOT_FOUND: 'Draft not found',
  DRAFT_DELETED: 'Draft deleted successfully',
} as const;
