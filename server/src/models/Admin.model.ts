import { PrismaClient } from '@prisma/client';
import { IAdmin } from '../types/admin.types';

const prisma = new PrismaClient();

export { prisma };
export type { IAdmin as IAdminDocument };
