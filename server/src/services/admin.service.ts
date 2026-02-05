import { prisma as adminPrisma } from '../models/Admin.model';
import { prisma } from '../models/User.model';
import { comparePassword } from './password.service';
import { generateAccessToken } from './token.service';
import { IUser } from '../types/user.types';

export interface AdminLoginResult {
  success: boolean;
  admin?: {
    id: string;
    email: string;
    role: string;
    permissions: string[];
  };
  accessToken?: string;
  message?: string;
}

export interface PaginatedUsersResult {
  users: IUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UserStatsResult {
  totalUsers: number;
  emailUsers: number;
  googleUsers: number;
  recentRegistrations: number;
  activeUsers: number;
}

/**
 * Admin login with email and password
 */
export async function adminLogin(
  email: string,
  password: string
): Promise<AdminLoginResult> {
  try {
    // Find admin by email
    const admin = await adminPrisma.admin.findUnique({ 
      where: { email } 
    });

    if (!admin) {
      return {
        success: false,
        message: 'Invalid credentials',
      };
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, admin.passwordHash);

    if (!isPasswordValid) {
      return {
        success: false,
        message: 'Invalid credentials',
      };
    }

    // Update last login timestamp
    await adminPrisma.admin.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } });

    // Generate JWT with admin role in payload
    const accessToken = generateAccessToken(
      admin.id,
      admin.email,
      'admin',
      admin.role,
      admin.permissions
    );

    return {
      success: true,
      admin: {
        id: admin.id,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions,
      },
      accessToken,
    };
  } catch (error) {
    console.error('Admin login error:', error);
    return {
      success: false,
      message: 'An error occurred during login',
    };
  }
}

/**
 * Get all users with pagination
 */
export async function getAllUsers(
  page: number = 1,
  limit: number = 20
): Promise<PaginatedUsersResult> {
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find().skip(skip).limit(limit).sort({ createdAt: -1 }),
    User.countDocuments(),
  ]);

  return {
    users: users.map((user) => ({
      ...user.toObject(),
      _id: user._id.toString(),
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<IUser | null> {
  const user = await User.findById(userId);
  return user ? { ...user.toObject(), _id: user._id.toString() } : null;
}

/**
 * Update user information
 */
export async function updateUser(
  userId: string,
  updates: Partial<Pick<IUser, 'firstName' | 'lastName' | 'phoneNumber'>>
): Promise<IUser | null> {
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: updates },
    { new: true, runValidators: true }
  );

  return user ? { ...user.toObject(), _id: user._id.toString() } : null;
}

/**
 * Delete user
 */
export async function deleteUser(userId: string): Promise<boolean> {
  const result = await User.findByIdAndDelete(userId);
  return result !== null;
}

/**
 * Search users by email or name
 */
export async function searchUsers(
  query: string,
  page: number = 1,
  limit: number = 20
): Promise<PaginatedUsersResult> {
  const skip = (page - 1) * limit;

  const searchRegex = new RegExp(query, 'i');
  const searchFilter = {
    $or: [
      { email: searchRegex },
      { firstName: searchRegex },
      { lastName: searchRegex },
    ],
  };

  const [users, total] = await Promise.all([
    User.find(searchFilter).skip(skip).limit(limit).sort({ createdAt: -1 }),
    User.countDocuments(searchFilter),
  ]);

  return {
    users: users.map((user) => ({
      ...user.toObject(),
      _id: user._id.toString(),
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Get user statistics
 */
export async function getUserStats(): Promise<UserStatsResult> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    emailUsers,
    googleUsers,
    recentRegistrations,
    activeUsers,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ authProvider: 'email' }),
    User.countDocuments({ authProvider: 'google' }),
    User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
    User.countDocuments({ lastLoginAt: { $gte: sevenDaysAgo } }),
  ]);

  return {
    totalUsers,
    emailUsers,
    googleUsers,
    recentRegistrations,
    activeUsers,
  };
}

/**
 * Get active users within a specific timeframe
 */
export async function getActiveUsers(
  timeframeHours: number = 24
): Promise<IUser[]> {
  const cutoffTime = new Date(
    Date.now() - timeframeHours * 60 * 60 * 1000
  );

  const users = await User.find({
    lastLoginAt: { $gte: cutoffTime },
  }).sort({ lastLoginAt: -1 });

  return users.map((user) => ({
    ...user.toObject(),
    _id: user._id.toString(),
  }));
}
