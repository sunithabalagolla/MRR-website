import nodemailer from 'nodemailer';
import config from '../config/env.config';

/**
 * Email Service
 * Handles sending emails using Nodemailer
 */

/**
 * Create and configure Nodemailer transporter
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    host: config.emailHost,
    port: config.emailPort,
    secure: false, // true for 465, false for other ports
    auth: {
      user: config.emailUser,
      pass: config.emailPassword,
    },
  });
};

/**
 * Get HTML template for OTP email
 */
const getOTPEmailTemplate = (otp: string, firstName: string): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f4f4f4;
        }
        .container {
          max-width: 600px;
          margin: 20px auto;
          background: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
          background: #007bff;
          color: #ffffff;
          padding: 30px 20px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
        }
        .content {
          padding: 30px 20px;
        }
        .otp-box {
          background: #f8f9fa;
          border: 2px dashed #007bff;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
          margin: 20px 0;
        }
        .otp-code {
          font-size: 36px;
          font-weight: bold;
          color: #007bff;
          letter-spacing: 8px;
          font-family: 'Courier New', monospace;
        }
        .info-box {
          background: #fff3cd;
          border-left: 4px solid #ffc107;
          padding: 15px;
          margin: 20px 0;
        }
        .footer {
          background: #f8f9fa;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #6c757d;
        }
        .button {
          display: inline-block;
          padding: 12px 30px;
          background: #007bff;
          color: #ffffff;
          text-decoration: none;
          border-radius: 5px;
          margin: 10px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Email Verification</h1>
        </div>
        <div class="content">
          <p>Hi <strong>${firstName}</strong>,</p>
          <p>Thank you for registering with PPC (Politikos People Center). To complete your registration, please use the verification code below:</p>
          
          <div class="otp-box">
            <div class="otp-code">${otp}</div>
          </div>
          
          <div class="info-box">
            <strong>⏰ Important:</strong> This code will expire in <strong>5 minutes</strong>.
          </div>
          
          <p>If you didn't request this code, please ignore this email. Your account will not be created without verification.</p>
          
          <p>For security reasons, never share this code with anyone.</p>
        </div>
        <div class="footer">
          <p>This is an automated email from PPC Authentication System.</p>
          <p>© ${new Date().getFullYear()} Politikos People Center. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Get HTML template for password reset OTP email
 */
const getPasswordResetTemplate = (otp: string, firstName: string): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f4f4f4;
        }
        .container {
          max-width: 600px;
          margin: 20px auto;
          background: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
          background: #dc3545;
          color: #ffffff;
          padding: 30px 20px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
        }
        .content {
          padding: 30px 20px;
        }
        .otp-box {
          background: #f8f9fa;
          border: 2px dashed #dc3545;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
          margin: 20px 0;
        }
        .otp-code {
          font-size: 36px;
          font-weight: bold;
          color: #dc3545;
          letter-spacing: 8px;
          font-family: 'Courier New', monospace;
        }
        .warning-box {
          background: #f8d7da;
          border-left: 4px solid #dc3545;
          padding: 15px;
          margin: 20px 0;
        }
        .footer {
          background: #f8f9fa;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #6c757d;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔑 Password Reset Request</h1>
        </div>
        <div class="content">
          <p>Hi <strong>${firstName}</strong>,</p>
          <p>We received a request to reset your password. Use the verification code below to proceed:</p>
          
          <div class="otp-box">
            <div class="otp-code">${otp}</div>
          </div>
          
          <div class="warning-box">
            <strong>⏰ Important:</strong> This code will expire in <strong>5 minutes</strong>.
          </div>
          
          <p><strong>⚠️ Security Alert:</strong> If you didn't request a password reset, please ignore this email and ensure your account is secure. Your password will not be changed without this verification code.</p>
          
          <p>For your security, never share this code with anyone, including PPC staff.</p>
        </div>
        <div class="footer">
          <p>This is an automated email from PPC Authentication System.</p>
          <p>© ${new Date().getFullYear()} Politikos People Center. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Get HTML template for welcome email
 */
const getWelcomeEmailTemplate = (firstName: string): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f4f4f4;
        }
        .container {
          max-width: 600px;
          margin: 20px auto;
          background: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
          background: #28a745;
          color: #ffffff;
          padding: 30px 20px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
        }
        .content {
          padding: 30px 20px;
        }
        .welcome-box {
          background: #d4edda;
          border-left: 4px solid #28a745;
          padding: 15px;
          margin: 20px 0;
        }
        .footer {
          background: #f8f9fa;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #6c757d;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Welcome to PPC!</h1>
        </div>
        <div class="content">
          <p>Hi <strong>${firstName}</strong>,</p>
          <p>Welcome to <strong>Politikos People Center (PPC)</strong>! We're excited to have you on board.</p>
          
          <div class="welcome-box">
            <strong>✅ Your account has been successfully created!</strong>
          </div>
          
          <p>You can now access all PPC services with your registered email address.</p>
          
          <p><strong>What's next?</strong></p>
          <ul>
            <li>Complete your profile</li>
            <li>Explore PPC features</li>
            <li>Connect with the community</li>
          </ul>
          
          <p>If you have any questions or need assistance, feel free to reach out to our support team.</p>
          
          <p>Thank you for joining us!</p>
          <p><strong>The PPC Team</strong></p>
        </div>
        <div class="footer">
          <p>This is an automated email from PPC Authentication System.</p>
          <p>© ${new Date().getFullYear()} Politikos People Center. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Send OTP email for registration
 * @param email - Recipient email address
 * @param otp - OTP code
 * @param firstName - User's first name
 */
export const sendOTP = async (
  email: string,
  otp: string,
  firstName: string
): Promise<void> => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"PPC Auth" <${config.emailFrom}>`,
      to: email,
      subject: 'Your PPC Verification Code',
      html: getOTPEmailTemplate(otp, firstName),
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ OTP email sent to ${email}`);
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw new Error('Failed to send OTP email');
  }
};

/**
 * Send password reset OTP email
 * @param email - Recipient email address
 * @param otp - OTP code
 * @param firstName - User's first name
 */
export const sendPasswordResetOTP = async (
  email: string,
  otp: string,
  firstName: string
): Promise<void> => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"PPC Auth" <${config.emailFrom}>`,
      to: email,
      subject: 'Password Reset Code - PPC',
      html: getPasswordResetTemplate(otp, firstName),
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Password reset email sent to ${email}`);
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
};

/**
 * Send welcome email to new user
 * @param email - Recipient email address
 * @param firstName - User's first name
 */
export const sendWelcomeEmail = async (
  email: string,
  firstName: string
): Promise<void> => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"PPC Auth" <${config.emailFrom}>`,
      to: email,
      subject: 'Welcome to PPC! 🎉',
      html: getWelcomeEmailTemplate(firstName),
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Welcome email sent to ${email}`);
  } catch (error) {
    console.error('Error sending welcome email:', error);
    // Don't throw error for welcome email - it's not critical
    console.warn('Welcome email failed, but continuing...');
  }
};
