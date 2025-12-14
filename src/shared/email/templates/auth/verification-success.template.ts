import { getBaseTemplate } from '../base.template';

export interface VerificationSuccessTemplateProps {
  firstName: string;
  partnerName?: string;
}

export const getVerificationSuccessTemplate = ({
  firstName,
  partnerName,
}: VerificationSuccessTemplateProps): string => {
  const title = 'Email verified – welcome to HyFuture!';
  const content = `
    <p>Hi ${firstName},</p>
    <p>🎉 Your email is confirmed and your HyFuture account is ready.</p>
    <p>Here's what you can do next:</p>
    <ul style="color: #4B5563; line-height: 1.8;">
      <li>Create and schedule letters to your future self</li>
      <li>Send letters to friends and family for future delivery</li>
      <li>Save drafts and edit them before scheduling</li>
      <li>Track all your scheduled and delivered letters</li>
    </ul>
    <p>Start writing your first letter and send it to the future!</p>
  `;

  return getBaseTemplate({
    title,
    content,
    buttonText: 'Start Writing',
    buttonLink: `${process.env.FRONTEND_URL || 'https://app.futureme.com'}/dashboard`,
  });
};

