export interface IUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  profession?: string;
  passwordHash?: string;
  authProvider: 'email' | 'google' | 'facebook';
  googleId?: string;
  facebookId?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
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
