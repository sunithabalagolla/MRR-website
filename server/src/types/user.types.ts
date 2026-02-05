export interface IUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string | null;
  profession?: string | null;
  passwordHash?: string | null;
  authProvider: 'email' | 'google' | 'facebook';
  googleId?: string | null;
  facebookId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date | null;
}

export interface CreateUserData {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  profession?: string;
  passwordHash?: string;
  authProvider: 'email' | 'google' | 'facebook';
  googleId?: string;
  facebookId?: string;
}
