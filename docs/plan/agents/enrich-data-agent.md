# 数据丰富化 Agent

> **任务**：为 295 个 AI 工具补充完整数据
> **输入**：当前工具列表
> **输出**：enriched_data.json

---

## Agent 信息

```yaml
name: enrich-data-agent
type: general_purpose_task
priority: P0
timeout: 30 minutes
parallel: true
```

---

## 执行流程

```
┌─────────────────────────────────────────────────────────────────┐
│                    数据丰富化流程                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. 读取工具列表                                                │
│     └── 从数据库获取 295 个工具                                  │
│                                                                 │
│  2. 数据采集                                                    │
│     ├── 2.1 尝试从官方获取                                      │
│     ├── 2.2 尝试从第三方获取                                    │
│     └── 2.3 生成模拟数据                                        │
│                                                                 │
│  3. 数据验证                                                    │
│     └── 验证格式和完整性                                         │
│                                                                 │
│  4. 保存结果                                                    │
│     └── 输出 enriched_data.json                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 详细步骤

### Step 1: 读取工具列表

```typescript
async function getAllTools(): Promise<AIGCTool[]> {
  const tools = await prisma.object.findMany({
    where: { objectType: { apiName: 'aigc_tool' } },
    select: {
      rid: true,
      properties: true,
    },
  });

  return tools.map(t => ({
    rid: t.rid,
    ...t.properties as Record<string, any>,
  }));
}
```

### Step 2: 采集数据

#### 2.1 尝试从官方获取

```typescript
async function tryScrapeOfficial(tool: AIGCTool): Promise<EnrichedData | null> {
  const website = tool.website;

  if (!website) return null;

  try {
    // 1. 访问官网定价页
    const pricingPage = await fetchPage(website + '/pricing');
    if (pricingPage) {
      const pricing = parsePricingPage(pricingPage);
      return { pricing, source: 'official' as const };
    }

    // 2. 访问 API 文档
    const docsPage = await fetchPage(website + '/docs');
    if (docsPage) {
      const specs = parseSpecs(docsPage);
      return { ...specs, source: 'official' as const };
    }
  } catch (error) {
    console.log(`Failed to scrape ${tool.name}: ${error.message}`);
  }

  return null;
}
```

#### 2.2 尝试从第三方获取

```typescript
async function tryThirdParty(toolName: string): Promise<EnrichedData | null> {
  // OpenRouter API
  const openrouterModels = await fetchOpenRouterModels();
  const match = openrouterModels.find(m =>
    m.name.toLowerCase().includes(toolName.toLowerCase())
  );

  if (match) {
    return {
      pricingModel: 'per_token',
      inputPrice: match.pricing?.prompt || 0,
      outputPrice: match.pricing?.completion || 0,
      contextWindow: match.context_length,
      source: 'third_party' as const,
    };
  }

  return null;
}
```

#### 2.3 生成模拟数据

```typescript
function generateSimulatedData(tool: AIGCTool): EnrichedData {
  const category = tool.categories?.[0] || 'other';

  // 基于分类的默认值
  const defaults = CATEGORY_DEFAULTS[category] || {
    pricingModel: 'per_token',
    contextWindow: 8192,
    capabilities: ['text_generation'],
  };

  return {
    ...defaults,
    source: 'simulated' as const,
    confidence: 0.4,
  };
}
```

### Step 3: 数据验证

```typescript
function validateData(data: EnrichedData): ValidationResult {
  const errors: string[] = [];

  if (!data.pricingModel) {
    errors.push('Missing pricingModel');
  }

  if (!data.contextWindow || data.contextWindow < 1000) {
    errors.push('Invalid contextWindow');
  }

  if (!data.capabilities || data.capabilities.length === 0) {
    errors.push('Missing capabilities');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
```

### Step 4: 保存结果

```typescript
async function saveResults(results: EnrichedData[]): Promise<void> {
  // 1. 保存到 JSON 文件
  await writeFile('enriched_data.json', JSON.stringify(results, null, 2));

  // 2. 更新数据库
  for (const data of results) {
    await prisma.object.update({
      where: { rid: data.toolRid },
      data: {
        properties: {
          ...(await getCurrentProperties(data.toolRid)),
          pricingModel: data.pricingModel,
          priceRange: data.priceRange,
          contextWindow: data.contextWindow,
          capabilities: data.capabilities,
          modalities: data.modalities,
          dataSource: data.source,
          dataConfidence: data.confidence,
        },
      },
    });
  }

  console.log(`Updated ${results.length} tools`);
}
```

---

## 数据规则

### CATEGORY_DEFAULTS

```typescript
const CATEGORY_DEFAULTS: Record<string, CategoryDefault> = {
  'ai-chatbots': {
    pricingModel: 'per_token',
    contextWindow: 128000,
    capabilities: ['text_generation', 'function_calling', 'streaming'],
    modalities: ['text'],
  },
  'ai-image': {
    pricingModel: 'per_call',
    contextWindow: 4096,
    capabilities: ['image_generation'],
    modalities: ['text', 'image'],
  },
  'ai-code': {
    pricingModel: 'subscription',
    contextWindow: 32000,
    capabilities: ['code_generation', 'text_generation'],
    modalities: ['text', 'code'],
  },
  'ai-video': {
    pricingModel: 'per_minute',
    contextWindow: 8192,
    capabilities: ['video_generation'],
    modalities: ['text', 'video'],
  },
  'ai-audio': {
    pricingModel: 'per_token',
    contextWindow: 8192,
    capabilities: ['audio_generation', 'text_generation'],
    modalities: ['text', 'audio'],
  },
  'ai-design': {
    pricingModel: 'subscription',
    contextWindow: 8192,
    capabilities: ['image_generation', 'text_generation'],
    modalities: ['text', 'image'],
  },
  'ai-office': {
    pricingModel: 'subscription',
    contextWindow: 32000,
    capabilities: ['text_generation', 'function_calling'],
    modalities: ['text'],
  },
  'ai-marketing': {
    pricingModel: 'subscription',
    contextWindow: 16384,
    capabilities: ['text_generation', 'image_generation'],
    modalities: ['text', 'image'],
  },
  'ai-search': {
    pricingModel: 'per_call',
    contextWindow: 32000,
    capabilities: ['text_generation', 'retrieval'],
    modalities: ['text'],
  },
};
```

### KNOWN_VENDOR_DEFAULTS

```typescript
const KNOWN_VENDOR_DEFAULTS: Record<string, VendorDefault> = {
  'openai': {
    pricingModel: 'per_token',
    inputPrice: 5,
    outputPrice: 15,
    contextWindow: 128000,
    capabilities: ['text_generation', 'function_calling', 'vision'],
  },
  'anthropic': {
    pricingModel: 'per_token',
    inputPrice: 3,
    outputPrice: 15,
    contextWindow: 200000,
    capabilities: ['text_generation', 'function_calling', 'vision'],
  },
  'google': {
    pricingModel: 'per_token',
    inputPrice: 0,
    outputPrice: 0,
    contextWindow: 1000000,
    capabilities: ['text_generation', 'function_calling', 'vision'],
    freeTier: { hasFreeTier: true, monthlyQuota: 0 },
  },
  'meta': {
    pricingModel: 'per_token',
    inputPrice: 8,
    outputPrice: 24,
    contextWindow: 128000,
    capabilities: ['text_generation'],
  },
  'mistral': {
    pricingModel: 'per_token',
    inputPrice: 2,
    outputPrice: 6,
    contextWindow: 32000,
    capabilities: ['text_generation'],
  },
};
```

---

## 输出格式

### enriched_data.json

```json
{
  "generatedAt": "2026-05-09T00:00:00Z",
  "totalTools": 295,
  "dataStats": {
    "official": 50,
    "third_party": 30,
    "simulated": 215
  },
  "tools": [
    {
      "toolRid": "aigc-tool:gpt-4-turbo",
      "name": "GPT-4 Turbo",
      "pricingModel": "per_token",
      "priceRange": "$5/1M input, $15/1M output",
      "inputPrice": 5,
      "outputPrice": 15,
      "contextWindow": 128000,
      "maxOutputTokens": 4096,
      "capabilities": ["text_generation", "function_calling", "vision"],
      "modalities": ["text", "image"],
      "source": "official",
      "confidence": 0.95
    }
  ]
}
```

---

## 验收要求

### 必须完成

1. **295 个工具全部有数据**
   - 每个工具必须有 pricingModel
   - 每个工具必须有 contextWindow
   - 每个工具必须有至少 1 个 capability

2. **数据来源标记**
   - source 字段必须为 'official' | 'third_party' | 'simulated'
   - 模拟数据的 confidence 必须 < 0.6

3. **格式验证**
   - pricingModel 必须在枚举值中
   - contextWindow 必须是正整数
   - capabilities 必须是数组

### 验证命令

```bash
npm run verify:phase1:enrich

# 检查输出
# - 295 个工具有 pricingModel
# - 266 个工具有 priceRange (90%)
# - 236 个工具有 contextWindow (80%)
# - 207 个工具有 capabilities (70%)
```

---

## 错误处理

### 错误类型

| 错误类型 | 处理方式 |
|----------|----------|
| 网络错误 | 跳过，使用模拟数据 |
| 解析错误 | 记录日志，使用模拟数据 |
| 验证失败 | 记录错误，继续处理 |

### 错误日志

```typescript
interface EnrichError {
  toolRid: string;
  step: string;
  error: string;
  timestamp: Date;
}

// 错误日志格式
{
  "toolRid": "aigc-tool:xxx",
  "step": "scrape_official",
  "error": "Connection timeout",
  "timestamp": "2026-05-09T00:00:00Z"
}
```

---

## 性能要求

| 指标 | 目标 |
|------|------|
| 处理速度 | 50 工具/分钟 |
| 内存使用 | < 500MB |
| 网络请求 | 批量处理，减少请求数 |
| 失败率 | < 5% |

---

*相关文档: [Phase 1: 数据丰富化](../phase-1-data-enrichment.md)*