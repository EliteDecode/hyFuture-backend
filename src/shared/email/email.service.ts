import { Injectable } from '@nestjs/common';
import sendMail, { getFirstName } from 'src/common/utils/email.utils';
import {
  getVerificationCodeTemplate,
  getVerificationSuccessTemplate,
  getPasswordResetTemplate,
  getLetterDeliveryTemplate,
  getWaitlistConfirmationTemplate,
  getBroadcastEmailTemplate,
  VerificationCodeTemplateProps,
  VerificationSuccessTemplateProps,
  PasswordResetTemplateProps,
  LetterDeliveryTemplateProps,
  WaitlistConfirmationTemplateProps,
  BroadcastEmailTemplateProps,
} from './templates';

@Injectable()
export class EmailService {
  async sendVerificationCode(
    props: VerificationCodeTemplateProps & { email: string },
  ): Promise<void> {
    const html = getVerificationCodeTemplate({
      firstName: getFirstName(props.firstName),
      verificationCode: props.verificationCode,
    });

    await sendMail({
      to: props.email,
      subject: 'Confirm your HyFuture email',
      html,
    });
  }

  async sendVerificationSuccess(
    props: VerificationSuccessTemplateProps & { email: string },
  ): Promise<void> {
    const html = getVerificationSuccessTemplate({
      firstName: getFirstName(props.firstName),
      partnerName: props.partnerName,
    });

    await sendMail({
      to: props.email,
      subject: 'Welcome to HyFuture',
      html,
    });
  }

  async sendPasswordReset(
    props: PasswordResetTemplateProps & { email: string },
  ): Promise<void> {
    const html = getPasswordResetTemplate({
      firstName: getFirstName(props.firstName),
      resetCode: props.resetCode,
      resetLink: props.resetLink,
    });

    await sendMail({
      to: props.email,
      subject: 'Reset your HyFuture password',
      html,
    });
  }

  async sendWaitlistConfirmation(
    props: WaitlistConfirmationTemplateProps & { email: string },
  ): Promise<void> {
    const html = getWaitlistConfirmationTemplate({
      name: getFirstName(props.name),
      email: props.email,
    });

    await sendMail({
      to: props.email,
      subject: 'Welcome to the HyFuture Waitlist!',
      html,
    });
  }

  async sendLetterDelivery(
    props: LetterDeliveryTemplateProps & { email: string },
  ): Promise<void> {
    const isLetterToSelf = props.senderEmail === props.recipientEmail;

    const html = getLetterDeliveryTemplate({
      recipientName: getFirstName(props.recipientName),
      senderName: props.senderName,
      senderEmail: props.senderEmail,
      recipientEmail: props.recipientEmail,
      subject: props.subject,
      content: props.content,
      deliveryDate: props.deliveryDate,
      attachments: props.attachments,
    });

    const emailSubject = isLetterToSelf
      ? props.subject
        ? `${props.subject} - Message from Your Past Self`
        : 'A Message from Your Past Self'
      : props.subject
        ? ` ${props.subject} - A Letter from the Past`
        : ' A Letter from the Past Has Arrived!';

    await sendMail({
      to: props.email,
      subject: emailSubject,
      html,
    });
  }

  async sendBroadcastEmail(
    props: BroadcastEmailTemplateProps & { email: string; subject: string },
  ): Promise<void> {
    const html = getBroadcastEmailTemplate({
      name: getFirstName(props.name),
      subject: props.subject,
      message: props.message,
      deliveryDate: props.deliveryDate,
      actionButton: props.actionButton,
    });

    await sendMail({
      to: props.email,
      subject: props.subject,
      html,
    });
  }
}
