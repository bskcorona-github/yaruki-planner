import { PrismaClient } from '@prisma/client';

// PrismaClientのグローバルインスタンスを作成（開発環境でのホットリロード対策）
const globalForPrisma = global as unknown as { prisma: PrismaClient };

const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma; 