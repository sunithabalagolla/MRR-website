export interface IAdmin {
  id: string;
  email: string;
  passwordHash: string;
  role: 'super_admin' | 'admin';
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date | null;
}

export interface CreateAdminData {
  email: string;
  passwordHash: string;
  role: 'super_admin' | 'admin';
  permissions?: string[];
}
