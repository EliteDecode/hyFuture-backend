/**
 * Input sanitization utilities
 */

export const sanitizeString = (input: string | undefined | null): string => {
  if (!input || typeof input !== 'string') {
    return '';
  }
  // Trim whitespace
  return input.trim();
};

export const sanitizeEmail = (email: string | undefined | null): string => {
  const sanitized = sanitizeString(email);
  // Convert to lowercase for consistency
  return sanitized.toLowerCase();
};

export const sanitizePhone = (phone: string | undefined | null): string => {
  return sanitizeString(phone);
};

export const isStringEmpty = (input: string | undefined | null): boolean => {
  return !input || sanitizeString(input).length === 0;
};

