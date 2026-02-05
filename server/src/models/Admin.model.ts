import mongoose, { Schema, Document } from 'mongoose';
import { IAdmin } from '../types/admin.types';

export interface IAdminDocument extends Omit<IAdmin, '_id'>, Document {}

const AdminSchema = new Schema<IAdminDocument>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      select: false, // Don't include password in queries by default
    },
    role: {
      type: String,
      enum: ['super_admin', 'admin'],
      required: [true, 'Role is required'],
      default: 'admin',
    },
    permissions: {
      type: [String],
      default: function () {
        // Default permissions based on role
        if (this.role === 'super_admin') {
          return [
            'users:read',
            'users:write',
            'users:delete',
            'admins:read',
            'admins:write',
            'admins:delete',
            'logs:read',
            'stats:read',
          ];
        } else {
          return ['users:read', 'users:write', 'logs:read', 'stats:read'];
        }
      },
    },
    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for fast email lookups
AdminSchema.index({ email: 1 });

const Admin = mongoose.model<IAdminDocument>('Admin', AdminSchema);

export default Admin;
