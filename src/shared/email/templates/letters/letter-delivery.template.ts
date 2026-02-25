import { AttachmentType } from '@prisma/client';
import { EMAIL_COLORS } from '../../constants/email-colors.constants';
import { EMAIL_FONTS } from '../../constants/email-fonts.constants';

const FUTURE_ME_LOGO_URL =
  process.env.FUTURE_ME_LOGO_URL ||
  'https://res.cloudinary.com/dns9drdhu/image/upload/v1764716758/logoHyFuture_sifmb3.png';

export interface LetterAttachment {
  fileUrl: string;
  type: AttachmentType;
}

export interface LetterDeliveryTemplateProps {
  recipientName?: string;
  senderName?: string;
  senderEmail: string;
  recipientEmail: string;
  subject?: string;
  content?: string;
  deliveryDate: string; // Format: "December 2, 2026"
  attachments?: LetterAttachment[];
}

export const getLetterDeliveryTemplate = ({
  recipientName,
  senderName,
  senderEmail,
  recipientEmail,
  subject,
  content,
  deliveryDate,
  attachments = [],
}: LetterDeliveryTemplateProps): string => {
  // Determine if this is a letter to self
  const isLetterToSelf = senderEmail === recipientEmail;

  // Determine the greeting and sender display
  const greeting = recipientName || (isLetterToSelf ? 'Future Me' : 'Friend');
  const fromDisplay = isLetterToSelf
    ? senderName || 'Past You'
    : senderName || senderEmail;

  const audioAttachments = attachments.filter((a) => a.type === 'AUDIO');
  const videoAttachments = attachments.filter((a) => a.type === 'VIDEO');
  const imageAttachments = attachments.filter((a) => a.type === 'IMAGE');
  const documentAttachments = attachments.filter((a) => a.type === 'DOCUMENT');

  const hasAnyAttachments = attachments.length > 0;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>A Letter from the Past</title>
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
              ${isLetterToSelf ? 'For you' : 'A letter from the past'}
            </p>
            <p style="margin: 0; color: #6B7280; font-size: 16px;">
              ${deliveryDate}
            </p>
          </div>
          <div style="display: inline-block; width: 35%; text-align: right; vertical-align: top;">
            <img src="${FUTURE_ME_LOGO_URL}" alt="HyFuture logo" style="max-width: 110px; height: auto; object-fit: contain;" />
          </div>
        </div>

        <!-- From Display -->
        ${!isLetterToSelf
      ? `
        <p style="margin: 0; color: #1F2937; font-size: 18px; line-height: 1.5; margin-top: 40px">
          Sent to you by: <strong>${fromDisplay}</strong>
        </p>
        `
      : ''
    }
      </div>

      <!-- Subject (if exists) -->
      ${subject
      ? `
      <div style="padding: 0 24px 16px 24px;">
        <h2 style="margin: 0; color: #1F2937; font-size: 20px; font-weight: 600; line-height: 1.4;">
          ${subject}
        </h2>
      </div>
      `
      : ''
    }

      <!-- Main Content Card -->
      <div style="padding: 0 24px 24px 24px;">
        <div>
          ${content
      ? `
          <div style="color: #374151; font-size: 16px; line-height: 1.7;  word-wrap: break-word;">
            ${content}
          </div>
          `
      : ''
    }

          ${hasAnyAttachments
      ? `
          <div style="margin-top: ${content ? '24px' : '0'}; padding-top: ${content ? '24px' : '0'}; border-top: ${content ? '1px solid #E5E7EB' : 'none'};">
            ${imageAttachments.length > 0
        ? imageAttachments
          .map(
            (att, index) => `
            <div style="margin-bottom: 20px;">
              <img src="${att.fileUrl}" alt="Image ${index + 1}" style="max-width: 100%; height: auto; border-radius: 6px; display: block;" />
              <p style="margin: 8px 0 0 0; color: #6B7280; font-size: 12px;">
                <a href="${att.fileUrl}" style="color: #2563EB; text-decoration: none;">View full size</a>
              </p>
            </div>
            `,
          )
          .join('')
        : ''
      }
            ${videoAttachments.length > 0
        ? videoAttachments
          .map(
            (att, index) => `
            <div style="margin-bottom: 20px;">
              <video controls style="width: 100%; max-width: 100%; height: auto; border-radius: 6px; background-color: #F3F4F6;">
                <source src="${att.fileUrl}" type="video/mp4">
                <source src="${att.fileUrl}" type="video/webm">
                <p style="margin: 12px 0 0 0; color: #6B7280; font-size: 14px;">
                  Your email client doesn't support video playback. 
                  <a href="${att.fileUrl}" style="color: #2563EB; text-decoration: none;">Download video</a>
                </p>
              </video>
              <p style="margin: 8px 0 0 0; color: #6B7280; font-size: 12px;">
                <a href="${att.fileUrl}" style="color: #2563EB; text-decoration: none;">Download video</a>
              </p>
            </div>
            `,
          )
          .join('')
        : ''
      }
            ${audioAttachments.length > 0
        ? audioAttachments
          .map(
            (att, index) => `
            <div style="margin-bottom: 20px; background-color: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 6px; padding: 16px;">
              <p style="margin: 0 0 12px 0; color: #374151; font-size: 13px; font-weight: 500;">
                🎵 Audio ${index + 1}
              </p>
              <audio controls preload="metadata" style="width: 100%; height: 48px; outline: none;">
                <source src="${att.fileUrl}" type="audio/mpeg">
                <source src="${att.fileUrl}" type="audio/mp3">
                <source src="${att.fileUrl}" type="audio/wav">
                <source src="${att.fileUrl}" type="audio/ogg">
                <source src="${att.fileUrl}" type="audio/aac">
                 <source src="${att.fileUrl}" type="audio/webm">
                <p style="margin: 12px 0 0 0; color: #6B7280; font-size: 14px;">
                  Your email client doesn't support audio playback. 
                  <a href="${att.fileUrl}" style="color: #2563EB; text-decoration: none; font-weight: 500;">Download audio</a>
                </p>
              </audio>
              <p style="margin: 8px 0 0 0; color: #6B7280; font-size: 12px;">
                <a href="${att.fileUrl}" style="color: #2563EB; text-decoration: none;">Download audio file</a>
              </p>
            </div>
            `,
          )
          .join('')
        : ''
      }
            ${documentAttachments.length > 0
        ? `
            <div style="margin-top: ${imageAttachments.length > 0 || videoAttachments.length > 0 || audioAttachments.length > 0 ? '20px' : '0'}; padding-top: ${imageAttachments.length > 0 || videoAttachments.length > 0 || audioAttachments.length > 0 ? '20px' : '0'}; border-top: ${imageAttachments.length > 0 || videoAttachments.length > 0 || audioAttachments.length > 0 ? '1px solid #E5E7EB' : 'none'};">
              <p style="margin: 0 0 12px 0; color: #374151; font-size: 13px; font-weight: 500;">
                Documents
              </p>
              ${documentAttachments
          .map(
            (att, index) => `
              <div style="margin-bottom: 12px;">
                <a href="${att.fileUrl}" style="display: inline-block; padding: 10px 16px; background-color: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 6px; color: #2563EB; text-decoration: none; font-size: 14px;">
                  📄 Document ${index + 1} - Download
                </a>
              </div>
              `,
          )
          .join('')}
            </div>
            `
        : ''
      }
          </div>
          `
      : ''
    }
        </div>
      </div>

      <!-- Call to Action -->
      <div style="padding: 0 24px 24px 24px;">
        <div style=" border: 1px solid #E2E8F0; border-radius: 8px; padding: 24px; text-align: center;">
          <p style="margin: 0 0 16px 0; color: #475569; font-size: 17px; font-weight: 600;">
            Want to send another letter?
          </p>
          <a href="https://myfuture.app/letters/new" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #2563EB 0%, #10B981 100%); border-radius: 8px; color: #FFFFFF; text-decoration: none; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.25);">
            Send More Letters →
          </a>
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
  </div>
</body>
</html>
  `.trim();
};
