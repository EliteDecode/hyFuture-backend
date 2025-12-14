import { getBaseTemplate } from '../base.template';

export interface PasswordResetTemplateProps {
  firstName: string;
  resetCode: string;
  resetLink: string;
}

export const getPasswordResetTemplate = ({
  firstName,
  resetCode,
  resetLink,
}: PasswordResetTemplateProps): string => {
  const title = 'Reset your HyFuture password';
  const content = `
    <p>Hi ${firstName},</p>
    <p>We received a request to reset the password on your HyFuture account.</p>
    <p>Click the button below to choose a new password and keep your account secure:</p>
    <p style="margin-top: 20px; color: #4B5563; font-size: 14px;"><strong>This link will expire in 10 minutes.</strong></p>
    <p>If you didn't request this, no worries—your password will stay the same.</p>
  `;

  return getBaseTemplate({
    title,
    content,
    buttonText: 'Reset Password',
    buttonLink: resetLink,
  });
};

