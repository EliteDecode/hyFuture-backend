import { TOKENS_CONSTANTS } from '../constants/tokens.constants';

export const generateAuthCode = (): string => {
  const min = Math.pow(10, TOKENS_CONSTANTS.AUTH_CODE_LENGTH - 1);
  const max = Math.pow(10, TOKENS_CONSTANTS.AUTH_CODE_LENGTH) - 1;
  return Math.floor(min + Math.random() * (max - min + 1)).toString();
};

export const generateAuthCodeExpiresAt = (): Date => {
  const minutesInMs = TOKENS_CONSTANTS.AUTH_CODE_EXPIRY_MINUTES * 60 * 1000;
  return new Date(Date.now() + minutesInMs);
};
