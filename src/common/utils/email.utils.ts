import nodemailer from 'nodemailer';

interface MailOptions {
  to: string;
  subject: string;
  html: string;
}

// const sendMail = async ({ to, subject, html }: MailOptions): Promise<void> => {
//   const transporter = nodemailer.createTransport({
//     service: 'gmail',
//     host: 'smtp.gmail.com',
//     port: 587,
//     secure: false, // true for 465, false for other ports
//     auth: {
//       user: process.env.EMAIL_APP_DEV,
//       pass: process.env.EMAIL_APP_PASSWORD_DEV,
//     },
//   });

//   await transporter.sendMail({
//     from: process.env.EMAIL_APP_DEV,
//     to: to,
//     subject: subject,
//     html: html,
//   });
// };

const sendMail = async ({ to, subject, html }: MailOptions): Promise<void> => {
  const transporter = nodemailer.createTransport({
    host: 'mail.privateemail.com',
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_SMTP,
      pass: process.env.EMAIL_SMTP_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: 'Hyfuture Team',
    to: to,
    subject: subject,
    html: html,
  });
};

export default sendMail;
