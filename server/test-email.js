// Test script to verify email service configuration
require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmail() {
  console.log('🧪 Testing email configuration...\n');
  
  // Display configuration
  console.log('📋 Email Configuration:');
  console.log('  Host:', process.env.EMAIL_HOST);
  console.log('  Port:', process.env.EMAIL_PORT);
  console.log('  User:', process.env.EMAIL_USER);
  console.log('  Password:', process.env.EMAIL_PASSWORD ? '****' + process.env.EMAIL_PASSWORD.slice(-4) : 'NOT SET');
  console.log('  From:', process.env.EMAIL_FROM);
  console.log('');

  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    console.log('📧 Attempting to send test email...');

    // Send test email
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: 'test@example.com',
      subject: 'Test Email from PPC',
      html: '<h1>Test Email</h1><p>If you see this in Mailtrap, your email service is working!</p>',
    });

    console.log('✅ Email sent successfully!');
    console.log('📬 Message ID:', info.messageId);
    console.log('\n🎉 Check your Mailtrap inbox now!');
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    if (error.code) {
      console.error('   Error code:', error.code);
    }
  }
}

testEmail();
