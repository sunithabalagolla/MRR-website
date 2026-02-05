// Quick script to check if OTPs are being saved
// Run this IMMEDIATELY after requesting an OTP (before entering it)

const mongoose = require('mongoose');
require('dotenv').config();

async function checkOTPs() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const OTP = mongoose.model('OTP', new mongoose.Schema({
      email: String,
      otp: String,
      expiresAt: Date,
      attempts: Number,
      createdAt: Date,
    }));

    const otps = await OTP.find({});
    
    console.log('\n📋 Current OTPs in database:');
    console.log('Total count:', otps.length);
    
    otps.forEach((otp, index) => {
      console.log(`\n${index + 1}. Email: ${otp.email}`);
      console.log(`   OTP: ${otp.otp}`);
      console.log(`   Expires: ${otp.expiresAt}`);
      console.log(`   Attempts: ${otp.attempts}`);
      console.log(`   Created: ${otp.createdAt}`);
    });

    if (otps.length === 0) {
      console.log('\n⚠️  No OTPs found. This could mean:');
      console.log('   1. No OTP has been requested yet');
      console.log('   2. All OTPs have been used/validated');
      console.log('   3. All OTPs have expired');
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkOTPs();
