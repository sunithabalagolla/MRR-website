import { Document } from 'mongoose';

export interface IRateLimit extends Document {
  ip: string;
  endpoint: string;
  requestCount: number;
  windowStart: Date;
  expiresAt: Date;
}
