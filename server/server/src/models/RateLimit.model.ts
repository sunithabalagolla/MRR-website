import mongoose, { Schema } from 'mongoose';
import { IRateLimit } from '../types/rateLimit.types';

const RateLimitSchema = new Schema<IRateLimit>(
  {
    ip: {
      type: String,
      required: true,
    },
    endpoint: {
      type: String,
      required: true,
    },
    requestCount: {
      type: Number,
      default: 1,
      required: true,
    },
    windowStart: {
      type: Date,
      default: Date.now,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

// TTL index - automatically delete documents after they expire (15 minutes)
RateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound index on ip + endpoint for fast lookups
RateLimitSchema.index({ ip: 1, endpoint: 1 });

const RateLimitModel = mongoose.model<IRateLimit>('RateLimit', RateLimitSchema);

export default RateLimitModel;
