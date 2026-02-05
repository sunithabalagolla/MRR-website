export interface IRateLimit {
  id: string;
  ip: string;
  endpoint: string;
  requestCount: number;
  windowStart: Date;
  expiresAt: Date;
  createdAt: Date;
}
