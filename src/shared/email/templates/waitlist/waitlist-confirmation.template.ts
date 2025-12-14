import { EMAIL_COLORS } from '../../constants/email-colors.constants';

const FUTURE_ME_LOGO_URL =
  process.env.FUTURE_ME_LOGO_URL ||
  'https://res.cloudinary.com/dns9drdhu/image/upload/v1764716758/logoHyFuture_sifmb3.png';

export interface WaitlistConfirmationTemplateProps {
  name: string;
  email: string;
}

export const getWaitlistConfirmationTemplate = ({
  name,
  email,
}: WaitlistConfirmationTemplateProps): string => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to HyFuture Waitlist</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Merriweather:ital,opsz,wght@0,18..144,300..900;1,18..144,300..900&display=swap" rel="stylesheet">
</head>
<body style="margin: 0; padding: 0; font-family: 'Merriweather', Georgia, 'Times New Roman', serif; background-color: #F5F5F5;">
  <div style="width: 100%; background-color: #F5F5F5; padding: 0px;">
    <div style="max-width: 600px; width: 100%; margin: 0 auto; background-color: ${EMAIL_COLORS.WHITE}; overflow: hidden;">
      
      <!-- Header -->
      <div style="padding: 24px 24px 16px 24px;">
        <div style="margin-bottom: 16px;">
          <div style="display: inline-block; width: 60%; vertical-align: top;">
            <p style="margin: 0 0 4px 0; color: #2563EB; font-size: 18px; font-weight: 600;">
              You're on the list!
            </p>
            <p style="margin: 0; color: #6B7280; font-size: 16px;">
              Welcome to HyFuture
            </p>
          </div>
          <div style="display: inline-block; width: 35%; text-align: right; vertical-align: top;">
            <img src="${FUTURE_ME_LOGO_URL}" alt="HyFuture logo" style="max-width: 120px; height: auto; object-fit: contain;" />
          </div>
        </div>
      </div>

      <!-- Main Content Card -->
      <div style="padding: 0 24px 24px 24px;">
        <div>
          <div style="color: #374151; font-size: 15px; line-height: 1.7; word-wrap: break-word;">
            <p style="margin: 0 0 16px 0;">Hi ${name},</p>
            <p style="margin: 0 0 16px 0;">
              Thank you for joining the <strong>HyFuture</strong> waitlist! We're excited to have you on board.
            </p>
            <p style="margin: 0 0 16px 0;">
              We're working hard to bring you an amazing experience where you can send letters to your future self, friends, and family. We'll keep you updated as we get closer to launch.
            </p>
            <p style="margin: 0 0 16px 0;">
              <strong>What happens next?</strong>
            </p>
            <ul style="margin: 0 0 16px 0; padding-left: 20px; color: #4B5563; line-height: 1.8;">
              <li>You'll receive updates about our progress</li>
              <li>We'll notify you as soon as HyFuture goes live</li>
              <li>You'll be among the first to experience the platform</li>
            </ul>
            <p style="margin: 0;">
              We can't wait to share HyFuture with you! Stay tuned for exciting updates.
            </p>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div style="padding: 16px 24px; border-top: 1px solid #E2E8F0; text-align: center;">
        <p style="margin: 0; color: #94A3B8; font-size: 13px;">
          Sent with ❤️ via <strong style="color: #64748B;">HyFuture</strong>
        </p>
        <p style="margin: 8px 0 0 0; color: #CBD5E1; font-size: 12px;">
          © ${new Date().getFullYear()} HyFuture. All rights reserved.
        </p>
      </div>

    </div>
  </div>
</body>
</html>
  `.trim();
};

