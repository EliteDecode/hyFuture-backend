import { Resend } from 'resend';
// import nodemailer from 'nodemailer';

interface MailOptions {
  to: string;
  subject: string;
  html: string;
}

const sendMail = async ({ to, subject, html }: MailOptions): Promise<void> => {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data, error } = await resend.emails.send({
      from: 'HyFuture Team <hello@hyfuture.app>',
      to: [to],
      subject: subject,
      html: html,
    });

    if (error) {
      console.error('Error sending email via Resend:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    console.log('Email sent successfully via Resend:', data);
  } catch (error) {
    console.error('Unexpected error sending email:', error);
    throw error;
  }
};
// const sendMail = async ({ to, subject, html }: MailOptions): Promise<void> => {
//   const transporter = nodemailer.createTransport({
//     host: 'mail.privateemail.com',
//     port: 465,
//     secure: true, // true for 465, false for other ports
//     auth: {
//       user: process.env.EMAIL_SMTP,
//       pass: process.env.EMAIL_SMTP_PASSWORD,
//     },
//   });

//   await transporter.sendMail({
//     from: '"HyFuture Team" <hello@hyfuture.app>',
//     to: to,
//     subject: subject,
//     html: html,
//   });
// };

export default sendMail;
