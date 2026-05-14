import { prisma } from '../repositories/base.repository.js';

// AI Compass 常用的 ValueTypes
export const VALUE_TYPES = [
  // === 基础类型 ===
  {
    apiName: 'string',
    displayName: '文本',
    baseType: 'String',
    description: '普通文本字符串',
    status: 'active',
  },
  {
    apiName: 'integer',
    displayName: '整数',
    baseType: 'Integer',
    description: '整数值',
    status: 'active',
  },
  {
    apiName: 'float',
    displayName: '浮点数',
    baseType: 'Float',
    description: '浮点数值',
    status: 'active',
  },
  {
    apiName: 'boolean',
    displayName: '布尔值',
    baseType: 'Boolean',
    description: '真或假',
    status: 'active',
  },
  {
    apiName: 'decimal',
    displayName: '精确小数',
    baseType: 'Decimal',
    description: '精确小数数值，用于货币计算',
    status: 'active',
  },
  {
    apiName: 'timestamp',
    displayName: '时间戳',
    baseType: 'Timestamp',
    description: '日期和时间',
    status: 'active',
  },
  {
    apiName: 'date',
    displayName: '日期',
    baseType: 'Date',
    description: '仅日期',
    status: 'active',
  },

  // === 字符串子类型 ===
  {
    apiName: 'url',
    displayName: '网页链接',
    baseType: 'String',
    description: '有效的网页 URL',
    status: 'active',
    constraints: {
      pattern: '^https?://',
      maxLength: 2048,
    },
  },
  {
    apiName: 'email',
    displayName: '邮箱地址',
    baseType: 'String',
    description: '有效的电子邮件地址',
    status: 'active',
    constraints: {
      pattern: '^[^@]+@[^@]+$',
      maxLength: 255,
    },
  },
  {
    apiName: 'phone',
    displayName: '电话号码',
    baseType: 'String',
    description: '国际电话号码格式',
    status: 'active',
    constraints: {
      pattern: '^\\+?[0-9\\-\\s]+$',
      maxLength: 20,
    },
  },
  {
    apiName: 'uuid',
    displayName: '唯一标识符',
    baseType: 'String',
    description: '全局唯一标识符',
    status: 'active',
    constraints: {
      pattern: '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$',
    },
  },
  {
    apiName: 'slug',
    displayName: 'URL Slug',
    baseType: 'String',
    description: 'URL 友好的标识符',
    status: 'active',
    constraints: {
      pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$',
      maxLength: 128,
    },
  },
  {
    apiName: 'color',
    displayName: '颜色代码',
    baseType: 'String',
    description: '十六进制颜色代码',
    status: 'active',
    constraints: {
      pattern: '^#[0-9a-fA-F]{6}$',
    },
  },
  {
    apiName: 'currency',
    displayName: '货币代码',
    baseType: 'String',
    description: 'ISO 4217 货币代码 (如 USD, CNY)',
    status: 'active',
    constraints: {
      maxLength: 3,
      enum: ['USD', 'CNY', 'EUR', 'GBP', 'JPY', 'KRW', 'INR'],
    },
  },
  {
    apiName: 'language-code',
    displayName: '语言代码',
    baseType: 'String',
    description: 'ISO 639-1 语言代码',
    status: 'active',
    constraints: {
      maxLength: 5,
      enum: ['en', 'zh', 'ja', 'ko', 'fr', 'de', 'es', 'ru'],
    },
  },
  {
    apiName: 'region-code',
    displayName: '地区代码',
    baseType: 'String',
    description: 'ISO 3166-1 国家/地区代码',
    status: 'active',
    constraints: {
      maxLength: 3,
    },
  },

  // === 特定领域类型 ===
  {
    apiName: 'price-per-unit',
    displayName: '单价',
    baseType: 'Decimal',
    description: '每单位的价格 (如 $2.50 / 1M tokens)',
    status: 'active',
    constraints: {
      min: 0,
      precision: 10,
      scale: 6,
    },
  },
  {
    apiName: 'token-count',
    displayName: 'Token 数量',
    baseType: 'Integer',
    description: 'Token 数量 (如上下文窗口大小)',
    status: 'active',
    constraints: {
      min: 0,
    },
  },
  {
    apiName: 'version',
    displayName: '版本号',
    baseType: 'String',
    description: '语义化版本号',
    status: 'active',
    constraints: {
      pattern: '^\\d+\\.\\d+(\\.\\d+)?(-[a-zA-Z0-9]+)?$',
    },
  },
  {
    apiName: 'api-key-format',
    displayName: 'API Key 格式',
    baseType: 'String',
    description: 'API Key 的格式描述',
    status: 'active',
  },
  {
    apiName: 'markdown',
    displayName: 'Markdown 文本',
    baseType: 'String',
    description: '支持 Markdown 格式的文本',
    status: 'active',
  },
  {
    apiName: 'json',
    displayName: 'JSON 数据',
    baseType: 'String',
    description: 'JSON 格式的数据',
    status: 'active',
  },
  {
    apiName: 'image-url',
    displayName: '图片链接',
    baseType: 'String',
    description: '图片资源的 URL',
    status: 'active',
    constraints: {
      pattern: '^https?://.*\\.(jpg|jpeg|png|gif|webp|svg)$',
    },
  },
  {
    apiName: 'iso-duration',
    displayName: 'ISO 时长',
    baseType: 'String',
    description: 'ISO 8601 持续时间格式 (如 PT1H30M)',
    status: 'active',
    constraints: {
      pattern: '^P(\\d+D)?(T(\\d+H)?(\\d+M)?(\\d+S)?)?$',
    },
  },
  {
    apiName: 'ipv4-address',
    displayName: 'IPv4 地址',
    baseType: 'String',
    description: 'IPv4 网络地址',
    status: 'active',
    constraints: {
      pattern: '^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$',
    },
  },
  {
    apiName: 'semantic-version',
    displayName: '语义化版本',
    baseType: 'String',
    description: '语义化版本号 (major.minor.patch)',
    status: 'active',
    constraints: {
      pattern: '^\\d+\\.\\d+\\.\\d+$',
    },
  },
];

export async function seedValueTypes() {
  console.log('Seeding ValueTypes...');

  for (const vt of VALUE_TYPES) {
    const now = new Date();
    await prisma.value_types.upsert({
      where: { apiName: vt.apiName },
      update: {
        displayName: vt.displayName,
        description: vt.description,
        baseType: vt.baseType,
        constraints: vt.constraints ? JSON.stringify(vt.constraints) : JSON.stringify({}),
        updatedAt: now,
      },
      create: {
        id: `vt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        rid: `vt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        apiName: vt.apiName,
        displayName: vt.displayName,
        description: vt.description,
        baseType: vt.baseType,
        constraints: vt.constraints ? JSON.stringify(vt.constraints) : JSON.stringify({}),
        status: vt.status,
        updatedAt: now,
      },
    });
  }

  console.log(`Seeded ${VALUE_TYPES.length} ValueTypes`);
}

// Run if called directly
if (process.argv[1] && process.argv[1].includes('seed-value-types')) {
  seedValueTypes()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}