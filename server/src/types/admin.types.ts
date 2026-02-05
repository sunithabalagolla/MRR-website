export interface IAdmin {
  _id: string;
  email: string;
  passwordHash: string;
  role: 'super_admin' | 'admin';
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

export interface CreateAdminData {
  email: string;
  passwordHash: string;
  role: 'super_admin' | 'admin';
  permissions?: string[];
}
