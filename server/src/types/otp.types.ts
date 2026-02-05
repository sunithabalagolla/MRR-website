export interface IOTPRecord {
  id: string;
  email: string;
  otp: string;
  purpose: 'registration' | 'password_reset' | 'email_verification';
  expiresAt: Date;
  attempts: number;
  isUsed: boolean;
  createdAt: Date;
}
