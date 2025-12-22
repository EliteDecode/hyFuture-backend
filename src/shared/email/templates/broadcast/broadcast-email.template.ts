import { EMAIL_COLORS } from '../../constants/email-colors.constants';
import { EMAIL_FONTS } from '../../constants/email-fonts.constants';

const FUTURE_ME_LOGO_URL =
  process.env.FUTURE_ME_LOGO_URL ||
  'https://res.cloudinary.com/dns9drdhu/image/upload/v1764716758/logoHyFuture_sifmb3.png';

const APP_URL = process.env.APP_URL || 'https://hyfuture.app';

export interface BroadcastEmailTemplateProps {
  name: string;
  subject: string;
  message: string; // HTML content
  deliveryDate: Date; // Date when email was delivered/sent
  actionButton?: {
    introText: string;
    buttonText: string;
    url: string;
  };
}

export const getBroadcastEmailTemplate = ({
  name,
  subject,
  message,
  deliveryDate,
  actionButton,
}: BroadcastEmailTemplateProps): string => {
  // Format date as "December 22, 2025"
  const formattedDate = deliveryDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <link rel="preconnect" href="${EMAIL_FONTS.PRECONNECT_GOOGLE}">
  <link rel="preconnect" href="${EMAIL_FONTS.PRECONNECT_GSTATIC}" crossorigin>
  <link href="${EMAIL_FONTS.GOOGLE_FONTS_LINK}" rel="stylesheet">
</head>
<body style="margin: 0; padding: 0; font-family: ${EMAIL_FONTS.FONT_FAMILY}; background-color: #F5F5F5;">
  <div style="width: 100%; background-color: #F5F5F5; padding: 0px;">
    <div style="max-width: 600px; width: 100%; margin: 0 auto; background-color: ${EMAIL_COLORS.WHITE}; overflow: hidden;">
      
      <!-- Header -->
      <div style="padding: 24px 24px 16px 24px;">
        <div style="margin-bottom: 16px;">
          <div style="display: inline-block; width: 60%; vertical-align: top;">
            <p style="margin: 0 0 4px 0; color: #2563EB; font-size: 18px; font-weight: 600;">
              ${subject}
            </p>
            <p style="margin: 0; color: #6B7280; font-size: 16px;">
              ${formattedDate}
            </p>
          </div>
          <div style="display: inline-block; width: 35%; text-align: right; vertical-align: top;">
            <img src="${FUTURE_ME_LOGO_URL}" alt="HyFuture logo" style="max-width: 110px; height: auto; object-fit: contain;" />
          </div>
        </div>
      </div>

      <!-- Main Content Card -->
      <div style="padding: 0 24px 24px 24px;">
        <div>
          <div style="color: #374151; font-size: 16px; line-height: 1.7; word-wrap: break-word;">
            <p style="margin: 0 0 16px 0;">Hi ${name},</p>
            <div style="margin: 0 0 24px 0;">
              ${message}
            </div>
          </div>
        </div>
        
        ${
          actionButton
            ? `
        <!-- Call to Action -->
        <div style="margin-top: 24px;">
          <div style="border: 1px solid #E2E8F0; border-radius: 8px; padding: 24px; text-align: center;">
            <p style="margin: 0 0 16px 0; color: #475569; font-size: 17px; font-weight: 600;">
              ${actionButton.introText}
            </p>
            <a href="${actionButton.url}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #2563EB 0%, #10B981 100%); border-radius: 8px; color: #FFFFFF; text-decoration: none; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.25);">
              ${actionButton.buttonText}
            </a>
          </div>
        </div>
        `
            : ''
        }
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
