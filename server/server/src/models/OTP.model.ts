import { PrismaClient } from '@prisma/client';
import { IOTPRecord } from '../types/otp.types';

const prisma = new PrismaClient();

export { prisma };
export type { IOTPRecord };
