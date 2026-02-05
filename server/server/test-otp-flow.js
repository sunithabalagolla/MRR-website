// Test OTP registration flow
require('dotenv').config();
const nodemailer = require('nodemailer');

async function testOTPFlow() {
  console.log('🧪 Testing OTP Registration Flow...\n');
  
  // Display configuration
  console.log('📋 Email Configuration:');
  console.log('  Service:', process.env.EMAIL_SERVICE);
  console.log('  Host:', process.env.EMAIL_HOST);
  console.log('  Port:', process.env.EMAIL_PORT);
  console.log('  User:', process.env.EMAIL_USER);
  console.log('  Password:', process.env.EMAIL_PASSWORD ? '****' + process.env.EMAIL_PASSWORD.slice(-4) : 'NOT SET');
  console.log('  From:', process.env.EMAIL_FROM);
  console.log('');

  try {
    // Create transporter (same as email.service.ts)
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    console.log('📧 Sending OTP email...');

    // Simulate OTP email (same format as email.service.ts)
    const otp = '123456';
    const firstName = 'Test';
    const email = 'test@example.com';

    const mailOptions = {
      from: `"PPC Auth" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: 'Your PPC Verification Code',
      html: `
        <h1>🔐 Email Verification</h1>
        <p>Hi <strong>${firstName}</strong>,</p>
        <p>Your verification code is: <strong>${otp}</strong></p>
      `,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('✅ OTP email sent successfully!');
    console.log('📬 Message ID:', info.messageId);
    console.log('📧 Sent to:', email);
    console.log('\n🎉 Check your Mailtrap inbox now!');
  } catch (error) {
    console.error('❌ Error sending OTP email:', error.message);
    console.error('❌ Full error:', error);
    if (error.code) {
      console.error('   Error code:', error.code);
    }
  }
}

testOTPFlow();
