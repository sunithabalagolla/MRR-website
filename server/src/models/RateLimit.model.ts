import { PrismaClient } from '@prisma/client';
import { IRateLimit } from '../types/rateLimit.types';

const prisma = new PrismaClient();

export { prisma };
export type { IRateLimit };
