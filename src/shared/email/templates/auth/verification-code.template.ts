import { getBaseTemplate } from '../base.template';

export interface VerificationCodeTemplateProps {
  firstName: string;
  verificationCode: string;
}

export const getVerificationCodeTemplate = ({
  firstName,
  verificationCode,
}: VerificationCodeTemplateProps): string => {
  const title = 'Verify your HyFuture email';
  const content = `
    <p>Hi ${firstName},</p>
    <p>Welcome to <strong>HyFuture</strong>—send letters to your future self, friends, and family.</p>
    <p>Use the code below to verify your email so you can start scheduling letters:</p>
    <div style="background-color: #F5F5F5; border: 2px dashed #2563EB; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
      <p style="margin: 0; font-size: 32px; font-weight: 700; color: #2563EB; letter-spacing: 8px; font-family: 'Courier New', monospace;">
        ${verificationCode}
      </p>
    </div>
    <p style="margin-top: 20px;"><strong>This code will expire in 10 minutes.</strong></p>
    <p>If you didn't request a HyFuture account, you can safely ignore this message.</p>
  `;

  return getBaseTemplate({
    title,
    content,
  });
};

