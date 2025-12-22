import { EMAIL_COLORS } from '../constants/email-colors.constants';
import { EMAIL_FONTS } from '../constants/email-fonts.constants';

const FUTURE_ME_LOGO_URL =
  process.env.FUTURE_ME_LOGO_URL ||
  'https://res.cloudinary.com/dns9drdhu/image/upload/v1764716758/logoHyFuture_sifmb3.png';

export interface BaseTemplateProps {
  title: string;
  content: string;
  buttonText?: string;
  buttonLink?: string;
  footerText?: string;
}

export const getBaseTemplate = ({
  title,
  content,
  buttonText,
  buttonLink,
  footerText = '© 2024 HyFuture. Your words, their future.',
}: BaseTemplateProps): string => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link rel="preconnect" href="${EMAIL_FONTS.PRECONNECT_GOOGLE}">
  <link rel="preconnect" href="${EMAIL_FONTS.PRECONNECT_GSTATIC}" crossorigin>
  <link href="${EMAIL_FONTS.GOOGLE_FONTS_LINK}" rel="stylesheet">
</head>
<body style="margin: 0; padding: 0; font-family: ${EMAIL_FONTS.FONT_FAMILY}; background-color: #F5F5F5;">
  <div style="width: 100%; background-color: #F5F5F5; padding: 32px 16px;">
    <div style="max-width: 600px; width: 100%; margin: 0 auto; background-color: ${EMAIL_COLORS.WHITE}; border-radius: 8px; overflow: hidden;">
      <div style="padding: 24px 24px 16px 24px;">
        <img src="${FUTURE_ME_LOGO_URL}" alt="HyFuture logo" style="max-width: 180px; height: auto; object-fit: contain;" />
      </div>
      <div style="padding: 0 24px 24px 24px;">
        <h2 style="margin: 0 0 12px 0; color: ${EMAIL_COLORS.TEXT_PRIMARY}; font-size: 20px; font-weight: 600; line-height: 1.4;">
          ${title}
        </h2>
        <div style="color: ${EMAIL_COLORS.TEXT_SECONDARY}; font-size: 16px; line-height: 1.6;">
          ${content}
        </div>
        ${
          buttonText && buttonLink
            ? `
        <div style="margin-top: 24px;">
          <a href="${buttonLink}" style="display: inline-block; padding: 10px 24px; background-color: ${EMAIL_COLORS.PRIMARY}; color: ${EMAIL_COLORS.WHITE}; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px;">
            ${buttonText}
          </a>
        </div>
        `
            : ''
        }
      </div>
      <div style="padding: 16px 24px; border-top: 1px solid #E5E7EB; text-align: center;">
        <p style="margin: 0; color: #6B7280; font-size: 12px;">
          ${footerText}
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
};
