import { PrismaClient } from '@prisma/client';
import { IUser } from '../types/user.types';

const prisma = new PrismaClient();

export { prisma };
export type { IUser as IUserDocument };
