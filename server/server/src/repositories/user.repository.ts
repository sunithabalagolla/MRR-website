import { prisma, IUserDocument } from '../models/User.model';
import { CreateUserData, IUser } from '../types/user.types';

/**
 * User Repository
 * Handles all database operations for users using Prisma
 */

/**
 * Create a new user
 * @param userData - User data to create
 * @returns Created user document
 */
export const createUser = async (userData: CreateUserData): Promise<IUser> => {
  try {
    const user = await prisma.user.create({
      data: {
        ...userData,
        email: userData.email.toLowerCase(), // Ensure lowercase email
      },
    });
    console.log(`✅ User created: ${user.email}`);
    return user;
  } catch (error: any) {
    // Handle duplicate email error
    if (error.code === 'P2002') {
      throw new Error('Email already exists');
    }
    console.error('Error creating user:', error);
    throw new Error('Failed to create user');
  }
};

/**
 * Find user by email
 * @param email - User's email address
 * @returns User document or null if not found
 */
export const findByEmail = async (email: string): Promise<IUser | null> => {
  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    return user;
  } catch (error) {
    console.error('Error finding user by email:', error);
    throw new Error('Failed to find user');
  }
};

/**
 * Find user by ID
 * @param userId - User's ID
 * @returns User document or null if not found
 */
export const findById = async (userId: string): Promise<IUser | null> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    return user;
  } catch (error) {
    console.error('Error finding user by ID:', error);
    throw new Error('Failed to find user');
  }
};

/**
 * Find user by Google ID
 * @param googleId - User's Google ID
 * @returns User document or null if not found
 */
export const findByGoogleId = async (googleId: string): Promise<IUser | null> => {
  try {
    const user = await prisma.user.findUnique({
      where: { googleId },
    });
    return user;
  } catch (error) {
    console.error('Error finding user by Google ID:', error);
    throw new Error('Failed to find user');
  }
};

/**
 * Update user's password
 * @param userId - User's ID
 * @param passwordHash - New hashed password
 * @returns Updated user document
 */
export const updatePassword = async (
  userId: string,
  passwordHash: string
): Promise<IUser | null> => {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    if (user) {
      console.log(`✅ Password updated for user: ${user.email}`);
    }

    return user;
  } catch (error) {
    console.error('Error updating password:', error);
    throw new Error('Failed to update password');
  }
};

/**
 * Update user's last login timestamp
 * @param userId - User's ID
 * @returns Updated user document
 */
export const updateLastLogin = async (userId: string): Promise<IUser | null> => {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });

    if (user) {
      console.log(`✅ Last login updated for user: ${user.email}`);
    }

    return user;
  } catch (error) {
    console.error('Error updating last login:', error);
    throw new Error('Failed to update last login');
  }
};

/**
 * Update user profile information
 * @param userId - User's ID
 * @param updates - Fields to update (firstName, lastName, phoneNumber, profession)
 * @returns Updated user document
 */
export const updateProfile = async (
  userId: string,
  updates: {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    profession?: string;
  }
): Promise<IUser | null> => {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: updates,
    });

    if (user) {
      console.log(`✅ Profile updated for user: ${user.email}`);
    }

    return user;
  } catch (error) {
    console.error('Error updating profile:', error);
    throw new Error('Failed to update profile');
  }
};

/**
 * Delete user by ID
 * @param userId - User's ID
 * @returns True if deleted, false if not found
 */
export const deleteUser = async (userId: string): Promise<boolean> => {
  try {
    const user = await prisma.user.delete({
      where: { id: userId },
    });

    if (user) {
      console.log(`✅ User deleted: ${user.email}`);
      return true;
    }

    return false;
  } catch (error: any) {
    if (error.code === 'P2025') {
      // Record not found
      return false;
    }
    console.error('Error deleting user:', error);
    throw new Error('Failed to delete user');
  }
};

/**
 * Check if email exists
 * @param email - Email to check
 * @returns True if email exists, false otherwise
 */
export const emailExists = async (email: string): Promise<boolean> => {
  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true },
    });
    return user !== null;
  } catch (error) {
    console.error('Error checking email existence:', error);
    throw new Error('Failed to check email');
  }
};

/**
 * Get all users (for admin)
 * @param limit - Maximum number of users to return
 * @param skip - Number of users to skip (for pagination)
 * @returns Array of user documents
 */
export const getAllUsers = async (
  limit: number = 50,
  skip: number = 0
): Promise<IUser[]> => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        profession: true,
        authProvider: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        // Exclude passwordHash
      },
      take: limit,
      skip: skip,
      orderBy: { createdAt: 'desc' },
    });

    return users as IUser[];
  } catch (error) {
    console.error('Error getting all users:', error);
    throw new Error('Failed to get users');
  }
};

/**
 * Get total user count (for admin)
 * @returns Total number of users
 */
export const getUserCount = async (): Promise<number> => {
  try {
    const count = await prisma.user.count();
    return count;
  } catch (error) {
    console.error('Error getting user count:', error);
    throw new Error('Failed to get user count');
  }
};

/**
 * Search users by email or name (for admin)
 * @param searchTerm - Search term
 * @param limit - Maximum number of results
 * @returns Array of matching user documents
 */
export const searchUsers = async (
  searchTerm: string,
  limit: number = 20
): Promise<IUser[]> => {
  try {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: searchTerm, mode: 'insensitive' } },
          { firstName: { contains: searchTerm, mode: 'insensitive' } },
          { lastName: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        profession: true,
        authProvider: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        // Exclude passwordHash
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return users as IUser[];
  } catch (error) {
    console.error('Error searching users:', error);
    throw new Error('Failed to search users');
  }
};

/**
 * Find user by Facebook ID
 * @param facebookId - User's Facebook ID
 * @returns User document or null if not found
 */
export const findByFacebookId = async (facebookId: string): Promise<IUser | null> => {
  try {
    const user = await prisma.user.findUnique({
      where: { facebookId },
    });
    return user;
  } catch (error) {
    console.error('Error finding user by Facebook ID:', error);
    throw new Error('Failed to find user');
  }
};
