// ============================================================
// User Types - 用户相关类型
// ============================================================

export interface User {
  id: string;
  rid?: string;
  phone?: string;
  email?: string;
  phoneVerifiedAt?: string;
  emailVerifiedAt?: string;
  name?: string;
  avatarUrl?: string;
  authProvider: 'phone' | 'email' | 'wechat' | 'alipay';
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreference {
  id: string;
  rid?: string;
  userId: string;
  theme: 'light' | 'dark' | 'system';
  defaultMode: 'simple' | 'pro';
  defaultView: 'grid' | 'list';
  defaultCompareCount: number;
  priceAlertEnabled: boolean;
  emailNotificationEnabled: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface SmsCode {
  id: string;
  rid?: string;
  phone: string;
  code: string;
  type: 'register' | 'login' | 'resetPassword';
  expiresAt: string;
  usedAt?: string;
  userId?: string;
  createdAt: string;
}

// 认证相关类型
export interface LoginParams {
  account: string; // 支持手机号或邮箱
  password: string;
}

export interface SmsLoginParams {
  phone: string;
  code: string;
}

export interface RegisterWithPhoneParams {
  phone: string;
  code: string;
  name?: string;
}

export interface RegisterWithEmailParams {
  email: string;
  password: string;
  name?: string;
}

export interface SendSmsCodeParams {
  phone: string;
  type: 'register' | 'login' | 'resetPassword';
}

export interface AuthResponse {
  user: User;
  token: string;
  expiresAt: string;
}

// 用户偏好更新
export interface UpdatePreferenceParams {
  theme?: 'light' | 'dark' | 'system';
  defaultMode?: 'simple' | 'pro';
  defaultView?: 'grid' | 'list';
  defaultCompareCount?: number;
  priceAlertEnabled?: boolean;
  emailNotificationEnabled?: boolean;
}
