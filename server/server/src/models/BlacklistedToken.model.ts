import { PrismaClient } from '@prisma/client';
import { IBlacklistedToken } from '../types/token.types';

const prisma = new PrismaClient();

export { prisma };
export type { IBlacklistedToken };
