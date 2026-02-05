import { prisma } from '../models/Admin.model';
import { hashPassword } from '../services/password.service';
import config from '../config/env.config';

/**
 * Script to create an admin user
 * Run with: npx ts-node src/scripts/createAdmin.ts
 */

const createAdmin = async () => {
  try {
    console.log('🔧 Creating admin user...\n');

    // Connect to PostgreSQL
    console.log('🔄 Connecting to PostgreSQL...');
    await prisma.$connect();
    console.log('✅ Connected to PostgreSQL\n');

    // Admin details
    const adminEmail = 'admin@mrrwebsite.com';
    const adminPassword = 'Admin123!'; // Change this to a secure password
    const adminRole = 'super_admin' as const;

    // Check if admin already exists
    const existingAdmin = await prisma.admin.findUnique({ 
      where: { email: adminEmail } 
    });
    
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists!');
      console.log(`📧 Email: ${adminEmail}`);
      console.log('💡 Use this email to login to the admin dashboard\n');
      await prisma.$disconnect();
      return;
    }

    // Hash password
    console.log('🔐 Hashing password...');
    const passwordHash = await hashPassword(adminPassword);

    // Default permissions based on role
    const defaultPermissions = adminRole === 'super_admin' 
      ? [
          'users:read',
          'users:write', 
          'users:delete',
          'admins:read',
          'admins:write',
          'admins:delete',
          'logs:read',
          'stats:read',
        ]
      : ['users:read', 'users:write', 'logs:read', 'stats:read'];

    // Create admin
    console.log('👤 Creating admin user...');
    const admin = await prisma.admin.create({
      data: {
        email: adminEmail,
        passwordHash,
        role: adminRole,
        permissions: defaultPermissions,
      },
    });

    console.log('\n✅ Admin user created successfully!\n');
    console.log('📋 Admin Details:');
    console.log(`   📧 Email: ${admin.email}`);
    console.log(`   🔑 Password: ${adminPassword}`);
    console.log(`   👑 Role: ${admin.role}`);
    console.log(`   🎫 Permissions: ${admin.permissions.join(', ')}`);
    console.log('\n💡 You can now login to the admin dashboard with these credentials');
    console.log(`   POST http://localhost:${config.port}/api/admin/login`);
    console.log('   Body: { "email": "admin@mrrwebsite.com", "password": "Admin123!" }\n');

    // Close connection
    await prisma.$disconnect();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  }
};

// Run the script
createAdmin();
