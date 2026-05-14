// ============================================================
// Base Repository - 仓储基类
// ============================================================

import { PrismaClient } from '@prisma/client';

export abstract class BaseRepository<
  T extends { id: string },
  CreateInput extends Record<string, unknown>,
  UpdateInput extends Record<string, unknown>
> {
  protected constructor(
    protected prisma: PrismaClient,
    protected modelName: string
  ) {}

  async findById(id: string): Promise<T | null> {
    const result = await (this.prisma as any)[this.modelName].findUnique({
      where: { id },
    });
    return result as T | null;
  }

  async findMany(args?: any): Promise<T[]> {
    const result = await (this.prisma as any)[this.modelName].findMany(args);
    return result as T[];
  }

  async findFirst(args?: any): Promise<T | null> {
    const result = await (this.prisma as any)[this.modelName].findFirst(args);
    return result as T | null;
  }

  async create(data: CreateInput): Promise<T> {
    const result = await (this.prisma as any)[this.modelName].create({
      data: this.prepareCreateData(data),
    });
    return result as T;
  }

  async update(id: string, data: UpdateInput): Promise<T> {
    const result = await (this.prisma as any)[this.modelName].update({
      where: { id },
      data: this.prepareUpdateData(data),
    });
    return result as T;
  }

  async delete(id: string): Promise<T> {
    const result = await (this.prisma as any)[this.modelName].delete({
      where: { id },
    });
    return result as T;
  }

  async count(args?: any): Promise<number> {
    return (this.prisma as any)[this.modelName].count(args);
  }

  async exists(args: any): Promise<boolean> {
    const count = await this.count(args);
    return count > 0;
  }

  protected prepareCreateData(data: CreateInput): CreateInput {
    return data;
  }

  protected prepareUpdateData(data: UpdateInput): UpdateInput {
    return data;
  }
}

// ============================================================
// Prisma Client 实例
// ============================================================

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export default prisma;
