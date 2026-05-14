# Phase 1: 数据丰富化

> **目标**：为 295 个 AI 工具补充完整的数据，确保所有功能都能验证
> **策略**：先尝试自动获取数据，获取失败则使用模拟数据，后续再替换为真实数据

---

## 1. 目标数据

### 1.1 数据清单

| 数据项 | 当前状态 | 目标 | 优先级 |
|--------|----------|------|--------|
| **定价模型** | 0% | 100% | P0 |
| **价格区间** | 0% | 90% | P0 |
| **上下文窗口** | 0% | 80% | P0 |
| **能力标签** | 0% | 70% | P1 |
| **模态支持** | 0% | 50% | P1 |
| **开发者信息** | 50% | 100% | P1 |

### 1.2 数据格式标准

```typescript
// 定价模型枚举
type PricingModel = 
  | 'free'                    // 完全免费
  | 'freemium'               // 有免费额度
  | 'per_token'              // 按 token 计费
  | 'per_call'               // 按 API 调用计费
  | 'subscription'           // 订阅制
  | 'contact_sales'          // 联系销售
  | 'unknown';               // 未知

// 能力标签枚举
type Capability = 
  | 'text_generation'        // 文本生成
  | 'code_generation'        // 代码生成
  | 'image_generation'       // 图像生成
  | 'video_generation'       // 视频生成
  | 'audio_generation'       // 音频生成
  | 'multimodal'             // 多模态
  | 'function_calling'       // 函数调用
  | 'streaming'             // 流式输出
  | 'context_32k'           // 32K 上下文
  | 'context_128k'          // 128K 上下文
  | 'context_200k'          // 200K+ 上下文
  | 'vision'                // 视觉理解
  | 'function_calling'      // 函数调用
  | 'retrieval'            // 检索增强
  | 'fine_tuning'           // 微调支持;

// 模态支持
type Modality = 'text' | 'image' | 'audio' | 'video' | 'code';
```

---

## 2. 数据采集策略

### 2.1 采集优先级

```
第一优先级：已知的主流工具（OpenAI, Anthropic, Google, Meta 等）
第二优先级：其他知名工具（有官方网站）
第三优先级：小型/新兴工具（可能无法获取真实数据）
```

### 2.2 采集流程

```
┌─────────────────────────────────────────────────────────────────┐
│                     数据采集流程                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. 尝试自动获取                                                 │
│     └── 访问工具官网 / API 文档                                  │
│         ├── 成功 → 使用真实数据                                  │
│         └── 失败 → 进入下一步                                    │
│                                                                 │
│  2. 尝试公开数据源                                               │
│     └── 查询 OpenRouter / LMSYS 等数据源                         │
│         ├── 成功 → 使用该数据源                                  │
│         └── 失败 → 进入下一步                                    │
│                                                                 │
│  3. 使用模拟数据                                                 │
│     └── 基于工具名称/分类生成合理的模拟数据                       │
│         └── 标记为 "simulated"                                  │
│                                                                 │
│  4. 记录数据来源                                                 │
│     └── source: 'official' | 'third_party' | 'simulated'        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Agent 任务定义

### Agent 1: 定价数据采集

```yaml
name: enrich-pricing-agent
description: 为每个工具采集或生成定价数据
priority: P0
parallel: true

inputs:
  - tools: AIGCTool[]  # 295 个工具列表

outputs:
  - pricing_data.json  # 定价数据

tasks:
  - name: scrape_pricing
    description: 批量爬取工具定价信息
    strategy: auto_first
    
  - name: generate_simulated
    description: 为无法获取的工具生成模拟数据
    strategy: fallback
    
  - name: validate
    description: 验证数据格式和完整性
    strategy: assert

acceptance:
  - "100% 工具拥有 pricingModel"
  - "90% 工具拥有 priceRange"
  - "所有模拟数据标记 source='simulated'"
```

### Agent 2: 上下文窗口采集

```yaml
name: enrich-context-agent
description: 为每个工具采集或生成上下文窗口数据
priority: P0
parallel: true

inputs:
  - tools: AIGCTool[]

outputs:
  - context_window_data.json

tasks:
  - name: scrape_context
    description: 批量爬取上下文窗口信息
    
  - name: infer_context
    description: 基于工具名称推断上下文窗口
    # 例如：GPT-4-32K → 32K
    
  - name: generate_simulated
    description: 基于分类生成合理的模拟数据
    # AI 对话类默认 128K，代码类默认 32K 等

acceptance:
  - "80% 工具拥有 contextWindow"
  - "模拟数据基于合理的推断规则"
```

### Agent 3: 能力标签标注

```yaml
name: enrich-capabilities-agent
description: 为每个工具标注能力标签
priority: P1
parallel: true

inputs:
  - tools: AIGCTool[]
  - categories: ToolCategory[]

outputs:
  - capabilities_data.json

tasks:
  - name: auto_tag
    description: 基于工具名称和分类自动标注
    
  - name: rule_based
    description: 使用规则推断能力
    rules:
      - name: "包含 code/code/coding" → code_generation
      - name: "包含 image/img/画图" → image_generation
      - name: "包含 chat/dialog/对话" → text_generation
      - category: "AI代码" → code_generation
      - category: "AI图像" → image_generation
      
  - name: generate_defaults
    description: 为未标注的工具生成默认标签

acceptance:
  - "100% 工具至少有一个 capability"
  - "平均每个工具 3-5 个 capabilities"
```

---

## 4. 并行执行计划

### 4.1 任务分组

```
┌─────────────────────────────────────────────────────────────────┐
│                    Agent 并行执行                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Agent-1: 定价数据        Agent-2: 上下文        Agent-3: 标签   │
│  处理工具: 0-98           处理工具: 0-98         处理工具: 0-98   │
│                                                                 │
│  Agent-1: 定价数据        Agent-2: 上下文        Agent-3: 标签   │
│  处理工具: 99-197         处理工具: 99-197        处理工具: 99-197│
│                                                                 │
│  Agent-1: 定价数据        Agent-2: 上下文        Agent-3: 标签   │
│  处理工具: 198-295        处理工具: 198-295       处理工具: 198-295│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 执行顺序

```bash
# 第一批：同时启动 3 个 Agent
tsx agents/enrich-pricing.ts --batch=1 &
tsx agents/enrich-context.ts --batch=1 &
tsx agents/enrich-capabilities.ts --batch=1 &

# 第二批
tsx agents/enrich-pricing.ts --batch=2 &
tsx agents/enrich-context.ts --batch=2 &
tsx agents/enrich-capabilities.ts --batch=2 &

# 第三批
tsx agents/enrich-pricing.ts --batch=3 &
tsx agents/enrich-context.ts --batch=3 &
tsx agents/enrich-capabilities.ts --batch=3 &
```

---

## 5. 模拟数据生成规则

### 5.1 定价模拟规则

```typescript
// 基于分类的默认定价
const DEFAULT_PRICING_BY_CATEGORY: Record<string, PricingConfig> = {
  'ai-chatbots': {
    pricingModel: 'per_token',
    priceRange: '$5-20/1M tokens',
    inputPrice: 10,
    outputPrice: 30,
  },
  'ai-image': {
    pricingModel: 'per_call',
    priceRange: '$0.01-0.1/张',
    pricePerCall: 0.05,
  },
  'ai-code': {
    pricingModel: 'subscription',
    priceRange: '$10-50/月',
    monthlyPrice: 19,
  },
  'ai-video': {
    pricingModel: 'per_minute',
    priceRange: '$0.05-0.5/秒',
    pricePerMinute: 0.10,
  },
  'ai-audio': {
    pricingModel: 'per_token',
    priceRange: '$1-5/1M tokens',
    inputPrice: 2,
    outputPrice: 6,
  },
};

// 知名厂商自动识别
const KNOWN_VENDOR_PRICING: Record<string, PricingConfig> = {
  'openai': { pricingModel: 'per_token', inputPrice: 5, outputPrice: 15 },
  'anthropic': { pricingModel: 'per_token', inputPrice: 3, outputPrice: 15 },
  'google': { pricingModel: 'per_token', inputPrice: 0, outputPrice: 0 }, // Free tier
  'meta': { pricingModel: 'per_token', inputPrice: 8, outputPrice: 24 },
  'mistral': { pricingModel: 'per_token', inputPrice: 2, outputPrice: 6 },
};
```

### 5.2 上下文窗口模拟规则

```typescript
// 基于工具名称的上下文推断
const inferContextWindow = (toolName: string): number => {
  // 明确标注的
  if (toolName.includes('128k') || toolName.includes('128K')) return 128000;
  if (toolName.includes('32k') || toolName.includes('32K')) return 32000;
  if (toolName.includes('200k') || toolName.includes('200K')) return 200000;
  if (toolName.includes('1m') || toolName.includes('1M')) return 1000000;

  // 基于厂商的默认值
  if (toolName.includes('gpt-4')) return 128000;
  if (toolName.includes('gpt-3.5')) return 16385;
  if (toolName.includes('claude')) return 200000;
  if (toolName.includes('gemini')) return 1000000;

  // 基于分类的默认值
  return 8192; // 默认 8K
};
```

### 5.3 能力标签模拟规则

```typescript
// 基于分类的默认能力
const DEFAULT_CAPABILITIES_BY_CATEGORY: Record<string, Capability[]> = {
  'ai-chatbots': ['text_generation', 'function_calling', 'streaming'],
  'ai-image': ['image_generation', 'vision'],
  'ai-code': ['code_generation', 'text_generation'],
  'ai-video': ['video_generation'],
  'ai-audio': ['audio_generation', 'text_generation'],
  'ai-design': ['image_generation', 'text_generation'],
  'ai-office': ['text_generation', 'function_calling'],
  'ai-marketing': ['text_generation', 'image_generation'],
  'ai-search': ['text_generation', 'retrieval'],
};

// 基于名称关键词
const inferCapabilities = (toolName: string): Capability[] => {
  const capabilities: Capability[] = [];

  if (toolName.match(/code|coder|dev|programming/i)) {
    capabilities.push('code_generation');
  }
  if (toolName.match(/image|photo|picture|art|design/i)) {
    capabilities.push('image_generation');
  }
  if (toolName.match(/video|movie|clip/i)) {
    capabilities.push('video_generation');
  }
  if (toolName.match(/audio|speech|voice|tts/i)) {
    capabilities.push('audio_generation');
  }
  if (toolName.match(/chat|talk|conversation|dialog/i)) {
    capabilities.push('text_generation');
  }

  // 默认添加 text_generation
  if (capabilities.length === 0) {
    capabilities.push('text_generation');
  }

  return capabilities;
};
```

---

## 6. 输出格式

### 6.1 定价数据结构

```typescript
interface EnrichedPricing {
  toolRid: string;
  pricingModel: PricingModel;
  priceRange: string;
  inputPrice?: number;           // $/1M tokens
  outputPrice?: number;          // $/1M tokens
  monthlyPrice?: number;         // $/月
  pricePerCall?: number;         // $/次
  freeTier?: {
    hasFreeTier: boolean;
    monthlyQuota?: number;
    limitations?: string;
  };
  source: 'official' | 'third_party' | 'simulated';
  lastUpdated: string;
  confidence: number;            // 0-1，数据可信度
}
```

### 6.2 上下文窗口数据结构

```typescript
interface EnrichedContextWindow {
  toolRid: string;
  contextWindow: number;
  maxOutputTokens?: number;
  supportsStreaming: boolean;
  supportsFunctionCalling: boolean;
  source: 'official' | 'third_party' | 'simulated';
  lastUpdated: string;
  confidence: number;
}
```

### 6.3 能力标签数据结构

```typescript
interface EnrichedCapabilities {
  toolRid: string;
  capabilities: Capability[];
  modalities: Modality[];
  supportedLanguages?: string[];
  source: 'auto' | 'manual' | 'simulated';
  lastUpdated: string;
}
```

---

## 7. 执行脚本示例

### 7.1 enrich-pricing.ts

```typescript
// scripts/agents/enrich-pricing.ts
import { prisma } from '../lib/prisma';
import { KNOWN_VENDOR_PRICING, DEFAULT_PRICING_BY_CATEGORY } from './pricing-rules';

interface PricingData {
  toolRid: string;
  pricingModel: string;
  priceRange: string;
  inputPrice?: number;
  outputPrice?: number;
  source: 'official' | 'third_party' | 'simulated';
  confidence: number;
}

async function enrichPricing() {
  console.log('Starting pricing enrichment...');

  // 获取所有工具
  const tools = await prisma.object.findMany({
    where: { objectType: { apiName: 'aigc_tool' } },
  });

  const results: PricingData[] = [];

  for (const tool of tools) {
    const props = tool.properties as any;
    const toolName = props.name || '';
    const developer = props.developer || '';
    const category = (props.categories as string[])?.[0] || '';

    // 1. 尝试从已知厂商获取
    const vendorKey = developer.toLowerCase().replace(/\s+/g, '-');
    if (KNOWN_VENDOR_PRICING[vendorKey]) {
      const pricing = KNOWN_VENDOR_PRICING[vendorKey];
      results.push({
        toolRid: tool.rid,
        pricingModel: pricing.pricingModel,
        priceRange: pricing.priceRange || '',
        inputPrice: pricing.inputPrice,
        outputPrice: pricing.outputPrice,
        source: 'official',
        confidence: 0.95,
      });
      continue;
    }

    // 2. 从官方网站获取（模拟）
    // 实际实现会访问官方网站
    const officialData = await tryScrapeOfficial(tool.website);
    if (officialData) {
      results.push({ ...officialData, source: 'official', confidence: 0.8 });
      continue;
    }

    // 3. 从第三方数据源获取（模拟）
    const thirdPartyData = await tryThirdParty(toolName);
    if (thirdPartyData) {
      results.push({ ...thirdPartyData, source: 'third_party', confidence: 0.6 });
      continue;
    }

    // 4. 使用模拟数据
    const simulatedData = generateSimulatedPricing(category, toolName);
    results.push({ ...simulatedData, source: 'simulated', confidence: 0.4 });
  }

  // 保存结果
  await saveResults(results);
  console.log(`Enriched ${results.length} tools with pricing data`);
}

// 模拟：生成模拟数据
function generateSimulatedPricing(category: string, toolName: string): Partial<PricingData> {
  const categoryPricing = DEFAULT_PRICING_BY_CATEGORY[category] || {
    pricingModel: 'per_token',
    priceRange: '$10/1M tokens',
    inputPrice: 10,
    outputPrice: 30,
  };

  return {
    pricingModel: categoryPricing.pricingModel,
    priceRange: categoryPricing.priceRange,
    inputPrice: categoryPricing.inputPrice,
    outputPrice: categoryPricing.outputPrice,
  };
}

enrichPricing().catch(console.error);
```

---

## 8. 验收标准

### 8.1 定量指标

| 指标 | 目标 | 当前 | 差距 |
|------|------|------|------|
| 工具数量 | 295 | 295 | 0 |
| 有定价模型 | 100% | 0% | 295 |
| 有价格区间 | 90% | 0% | 266 |
| 有上下文窗口 | 80% | 0% | 236 |
| 有能力标签 | 70% | 0% | 207 |
| 数据来源标记 | 100% | 0% | 295 |

### 8.2 验收检查清单

```bash
# 验收命令
npm run verify:phase1

# 检查项
1. [ ] 数据库中 295 个工具都有 pricingModel 字段
2. [ ] 至少 266 个工具有 priceRange 字段
3. [ ] 至少 236 个工具有 contextWindow 字段
4. [ ] 至少 207 个工具有 capabilities 数组
5. [ ] 所有数据都有 source 标记
6. [ ] 模拟数据有明显标记（可通过 API 查询）
```

### 8.3 端到端验证

```typescript
// 测试用例
describe('Phase 1 Data Enrichment', () => {
  it('所有工具都有定价数据', async () => {
    const tools = await getAllTools();
    const withoutPricing = tools.filter(t => !t.pricingModel);
    expect(withoutPricing).toHaveLength(0);
  });

  it('定价数据格式正确', async () => {
    const tools = await getAllTools();
    for (const tool of tools) {
      expect(['free', 'per_token', 'per_call', 'subscription', 'freemium', 'contact_sales', 'unknown'])
        .toContain(tool.pricingModel);
    }
  });

  it('模拟数据可识别', async () => {
    const tools = await getToolsBySource('simulated');
    expect(tools.length).toBeGreaterThan(0);
    // 验证模拟数据的合理性
    for (const tool of tools) {
      expect(tool.pricingConfidence).toBeLessThan(0.5);
    }
  });
});
```

---

*相关文档: [Phase 2: 动态层实现](./phase-2-dynamic-layer.md) | [Phase 3: 动力层实现](./phase-3-motivation-layer.md)*