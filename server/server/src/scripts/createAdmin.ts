import mongoose from 'mongoose';
import Admin from '../models/Admin.model';
import { hashPassword } from '../services/password.service';
import config from '../config/env.config';

/**
 * Script to create an admin user
 * Run with: npx ts-node src/scripts/createAdmin.ts
 */

const createAdmin = async () => {
  try {
    console.log('🔧 Creating admin user...\n');

    // Connect to MongoDB
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(config.mongodbUri);
    console.log('✅ Connected to MongoDB\n');

    // Admin details
    const adminEmail = 'admin@politikos.com';
    const adminPassword = 'Admin123!'; // Change this to a secure password
    const adminRole = 'super_admin';

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists!');
      console.log(`📧 Email: ${adminEmail}`);
      console.log('💡 Use this email to login to the admin dashboard\n');
      await mongoose.connection.close();
      return;
    }

    // Hash password
    console.log('🔐 Hashing password...');
    const passwordHash = await hashPassword(adminPassword);

    // Create admin
    console.log('👤 Creating admin user...');
    const admin = await Admin.create({
      email: adminEmail,
      passwordHash,
      role: adminRole,
    });

    console.log('\n✅ Admin user created successfully!\n');
    console.log('📋 Admin Details:');
    console.log(`   📧 Email: ${admin.email}`);
    console.log(`   🔑 Password: ${adminPassword}`);
    console.log(`   👑 Role: ${admin.role}`);
    console.log(`   🎫 Permissions: ${admin.permissions.join(', ')}`);
    console.log('\n💡 You can now login to the admin dashboard with these credentials');
    console.log(`   POST http://localhost:${config.port}/api/admin/login`);
    console.log('   Body: { "email": "admin@politikos.com", "password": "Admin123!" }\n');

    // Close connection
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  }
};

// Run the script
createAdmin();
