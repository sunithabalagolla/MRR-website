import { PrismaClient } from '@prisma/client';
import config from './env.config';

let prisma: PrismaClient;
let retryCount = 0;

/**
 * Initialize Prisma Client with retry logic
 */
const connectDatabase = async (): Promise<void> => {
  try {
    console.log(`🔄 Connecting to PostgreSQL... (Attempt ${retryCount + 1}/${config.dbMaxRetries})`);

    // Initialize Prisma Client
    prisma = new PrismaClient({
      log: config.nodeEnv === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
      errorFormat: 'pretty',
    });

    // Test the connection
    await prisma.$connect();

    // Reset retry count on successful connection
    retryCount = 0;

    console.log('✅ PostgreSQL connected successfully');
    console.log(`📊 Database: Connected via Prisma`);

    // Test with a simple query
    const userCount = await prisma.user.count();
    console.log(`👥 Total users in database: ${userCount}`);

  } catch (error) {
    retryCount++;

    console.error(`❌ PostgreSQL connection failed (Attempt ${retryCount}/${config.dbMaxRetries}):`, error);

    // Check if max retries reached
    if (retryCount >= config.dbMaxRetries) {
      console.error('');
      console.error('💥 FATAL ERROR: Maximum database connection retries reached!');
      console.error('Please check:');
      console.error('  1. PostgreSQL is running');
      console.error('  2. DATABASE_URL in .env is correct');
      console.error('  3. Network connectivity');
      console.error('  4. Database credentials');
      console.error('  5. Run: npx prisma migrate dev');
      console.error('');
      console.error('Exiting application...');
      process.exit(1); // Exit with error code
    }

    // Retry connection with exponential backoff
    const retryDelay = Math.min(5000 * retryCount, 30000); // Max 30 seconds
    console.log(`⏳ Retrying connection in ${retryDelay / 1000} seconds...`);
    
    setTimeout(connectDatabase, retryDelay);
  }
};

/**
 * Disconnect from PostgreSQL gracefully
 */
const disconnectDatabase = async (): Promise<void> => {
  try {
    if (prisma) {
      await prisma.$disconnect();
      console.log('✅ PostgreSQL connection closed gracefully');
    }
  } catch (error) {
    console.error('❌ Error closing PostgreSQL connection:', error);
    throw error;
  }
};

/**
 * Check if database is connected
 */
const isDatabaseConnected = async (): Promise<boolean> => {
  try {
    if (!prisma) return false;
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
};

/**
 * Get Prisma Client instance
 */
const getPrismaClient = (): PrismaClient => {
  if (!prisma) {
    throw new Error('Database not connected. Call connectDatabase() first.');
  }
  return prisma;
};

export { connectDatabase, disconnectDatabase, isDatabaseConnected, getPrismaClient };
