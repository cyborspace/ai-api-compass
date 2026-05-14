// ============================================================
// Auth Service - 认证服务
// ============================================================

import { prisma } from '../repositories/base.repository.js';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

export interface RegisterWithPhoneParams {
  phone: string;
  code: string;
  password?: string;
  nickname?: string;
}

export interface RegisterWithEmailParams {
  email: string;
  password: string;
  nickname?: string;
}

export interface LoginParams {
  account: string;
  password: string;
}

export interface SendCodeParams {
  phone: string;
}

const SMS_CODE_EXPIRE_MINUTES = 10;
const TOKEN_EXPIRE_DAYS = 7;

const smsCodeStore = new Map<string, { code: string; expiresAt: Date }>();

export class AuthService {
  private jwtSecret: string;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'ai-compass-secret-key';
  }

  async sendSmsCode(phone: string): Promise<{ success: boolean; message: string }> {
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    smsCodeStore.set(phone, {
      code,
      expiresAt: new Date(Date.now() + SMS_CODE_EXPIRE_MINUTES * 60 * 1000),
    });

    console.log(`[SMS Mock] Phone: ${phone}, Code: ${code}`);

    return {
      success: true,
      message: `Verification code sent to ${phone}`,
    };
  }

  async registerWithPhone(params: RegisterWithPhoneParams): Promise<{ user: any; token: string }> {
    const { phone, code, password, nickname } = params;

    const smsCode = smsCodeStore.get(phone);
    if (!smsCode || smsCode.code !== code) {
      throw new Error('Invalid verification code');
    }
    if (smsCode.expiresAt < new Date()) {
      throw new Error('Verification code expired');
    }

    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

    const user = await prisma.users.create({
      data: {
        id: crypto.randomUUID(),
        phone,
        nickname: nickname || `用户${Math.floor(Math.random() * 10000)}`,
        password: hashedPassword,
        authType: 'phone',
        updatedAt: new Date(),
      },
    });

    smsCodeStore.delete(phone);

    const token = this.generateToken(user.id);
    return { user, token };
  }

  async registerWithEmail(params: RegisterWithEmailParams): Promise<{ user: any; token: string }> {
    const { email, password, nickname } = params;

    const existing = await prisma.users.findUnique({ where: { email } });
    if (existing) {
      throw new Error('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.users.create({
      data: {
        id: crypto.randomUUID(),
        email,
        nickname: nickname || `用户${Math.floor(Math.random() * 10000)}`,
        password: hashedPassword,
        authType: 'email',
        updatedAt: new Date(),
      },
    });

    const token = this.generateToken(user.id);
    return { user, token };
  }

  async login(params: LoginParams): Promise<{ user: any; token: string }> {
    const { account, password } = params;

    const user = await prisma.users.findFirst({
      where: {
        OR: [{ phone: account }, { email: account }],
      },
    });

    if (!user || !user.password) {
      throw new Error('Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    const token = this.generateToken(user.id);
    return { user, token };
  }

  async getUserById(userId: string): Promise<any | null> {
    return prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phone: true,
        email: true,
        nickname: true,
        avatar: true,
        authType: true,
        createdAt: true,
      },
    });
  }

  async updateUser(userId: string, data: {
    nickname?: string;
    avatar?: string;
  }): Promise<any> {
    return prisma.users.update({
      where: { id: userId },
      data,
    });
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    const user = await prisma.users.findUnique({ where: { id: userId } });
    if (!user || !user.password) {
      throw new Error('User not found or no password set');
    }

    const isValid = await bcrypt.compare(oldPassword, user.password);
    if (!isValid) {
      throw new Error('Invalid old password');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.users.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }

  async verifyToken(token: string): Promise<string | null> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as { userId: string };
      return decoded.userId;
    } catch {
      return null;
    }
  }

  private generateToken(userId: string): string {
    return jwt.sign({ userId }, this.jwtSecret, { expiresIn: `${TOKEN_EXPIRE_DAYS}d` });
  }
}

export const authService = new AuthService();
