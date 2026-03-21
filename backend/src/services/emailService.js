const nodemailer = require('nodemailer');
const crypto = require('crypto');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const generateVerificationToken = () => crypto.randomBytes(32).toString('hex');

const sendVerificationEmail = async (email, name, token) => {
  const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;

  await transporter.sendMail({
    from: `"Vi-Notes" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Verify your Vi-Notes account',
    html: `
      <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; padding: 40px; background: #fff;">
        <div style="font-size: 22px; font-weight: 700; margin-bottom: 24px;">
          <span style="color: #1a6b3c;">Ψ</span> Vi-Notes
        </div>
        <h2 style="font-size: 22px; font-weight: 400; margin-bottom: 12px;">Hi ${name},</h2>
        <p style="font-family: sans-serif; color: #666; line-height: 1.6; margin-bottom: 24px;">
          Thanks for signing up for Vi-Notes. Please verify your email address to activate your account.
        </p>
        <a href="${verifyUrl}" style="display: inline-block; background: #1a6b3c; color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-family: sans-serif; font-size: 15px; font-weight: 600;">
          Verify my email
        </a>
        <p style="font-family: sans-serif; font-size: 12px; color: #aaa; margin-top: 32px; line-height: 1.6;">
          This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.
        </p>
      </div>
    `,
  });
};

const sendPasswordResetEmail = async (email, name, token) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

  await transporter.sendMail({
    from: `"Vi-Notes" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Reset your Vi-Notes password',
    html: `
      <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; padding: 40px; background: #fff;">
        <div style="font-size: 22px; font-weight: 700; margin-bottom: 24px;">
          <span style="color: #1a6b3c;">Ψ</span> Vi-Notes
        </div>
        <h2 style="font-size: 22px; font-weight: 400; margin-bottom: 12px;">Hi ${name},</h2>
        <p style="font-family: sans-serif; color: #666; line-height: 1.6; margin-bottom: 24px;">
          You requested a password reset. Click the button below to choose a new password.
        </p>
        <a href="${resetUrl}" style="display: inline-block; background: #1a1a1a; color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-family: sans-serif; font-size: 15px; font-weight: 600;">
          Reset my password
        </a>
        <p style="font-family: sans-serif; font-size: 12px; color: #aaa; margin-top: 32px; line-height: 1.6;">
          This link expires in 1 hour. If you didn't request a reset, you can safely ignore this email.
        </p>
      </div>
    `,
  });
};

module.exports = { generateVerificationToken, sendVerificationEmail, sendPasswordResetEmail };
