import nodemailer from "nodemailer";
import dotenv from "dotenv"
dotenv.config()

export const emailService = {
  transporter: nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    
    },
  }),
   
  async sendEmail(to, subject, html) {
    await this.transporter.sendMail({
      from: '"TaskMe Notifications" <no-reply@taskme.com>',
      to,
      subject,
      html,
    });
  },
};
