# 第 10 章：AI Agent 降尘世，AIP 逻辑启新元

> **核心问题**：AI 时代的 FDE 如何部署智能体？
>
> **本章简介**：本章站在 AI 时代的最前沿，探索 FDE 如何部署 AI Agent。从 LLM 基础到 AIP Logic 的集成，从 AI Agent 的 Ontology 集成模式到 AIP Bootcamp 的实战——读者将掌握将大语言模型接入企业运营的完整技术体系。通过为 AI-API-COMPASS 集成 LLM 能力，体验 AI 时代的 FDE 工作方式。

---

## 10.1 LLM 基础

### 10.1.1 大语言模型的工作原理

大语言模型（LLM）是 AI Agent 的"大脑"。理解其工作原理，是 FDE 部署 AI Agent 的基础。

**核心机制**：

1. **Transformer 架构**：自注意力机制（Self-Attention）让模型理解上下文关系
2. **预训练 + 微调**：先在海量文本上预训练，再在特定任务上微调
3. **Token 化**：文本被拆分为 Token（词片段），模型预测下一个 Token
4. **概率分布**：模型输出的是下一个 Token 的概率分布，通过采样生成文本

```
输入文本 → Token 化 → 嵌入层 → Transformer 层 × N → 输出概率 → 采样 → 生成文本
```

**关键概念**：

| 概念 | 说明 | FDE 关注点 |
|------|------|-----------|
| **上下文窗口** | 模型能处理的 Token 数量 | 选择合适窗口的模型 |
| **温度（Temperature）** | 控制输出的随机性 | 业务场景调参 |
| **Top-p / Top-k** | 控制采样范围 | 平衡创造性和准确性 |
| **系统提示（System Prompt）** | 定义模型角色和行为 | 设计有效的系统提示 |
| **Few-shot 示例** | 通过示例引导模型 | 准备高质量示例 |

### 10.1.2 Prompt Engineering：提示词工程

Prompt Engineering 是 FDE 与 LLM 交互的核心技能。

**Prompt 设计原则**：

1. **清晰明确**：避免模糊指令，使用具体描述
2. **结构化**：使用标记、列表、JSON 格式组织信息
3. **角色定义**：明确模型扮演的角色
4. **约束条件**：设定输出格式、长度、风格限制
5. **示例引导**：提供输入输出示例（Few-shot）

AI-API-COMPASS 的场景推荐功能使用了精心设计的 Prompt：

```typescript
// 场景匹配中的 Prompt 设计（概念示例）
const SCENARIO_ANALYSIS_PROMPT = `
你是一位 AI 工具推荐专家。请分析用户的需求描述，提取关键信息。

用户需求："{userInput}"

请按以下格式输出分析结果：
{
  "requiredCapabilities": ["需要的核心能力"],
  "preferredCategories": ["偏好的工具类别"],
  "priceSensitive": true/false,
  "platformRequirements": ["平台要求"],
  "reasoning": "分析推理过程"
}

约束：
- 只输出 JSON 格式，不要其他内容
- requiredCapabilities 必须从预定义列表中选择
- priceSensitive 根据用户是否提及价格、预算、免费等词判断
`;
```

**Prompt 优化技巧**：

```typescript
// 技巧 1：Chain-of-Thought（思维链）
const COT_PROMPT = `
请逐步分析以下需求，然后给出推荐：
1. 首先，识别用户的核心任务
2. 然后，确定需要的 AI 能力
3. 接着，考虑约束条件（价格、平台等）
4. 最后，给出推荐结果

需求：{userInput}
`;

// 技巧 2：ReAct（推理 + 行动）
const REACT_PROMPT = `
你可以使用以下工具：
- searchTools(query): 搜索工具
- getToolDetails(rid): 获取工具详情
- compareTools(rids): 对比工具

请按以下格式思考：
Thought: 我需要...
Action: searchTools("...")
Observation: 搜索结果...
Thought: 基于结果...
Action: getToolDetails("...")
...

最终推荐：...
`;

// 技巧 3：结构化输出
const STRUCTURED_PROMPT = `
请分析以下工具描述，提取结构化信息。

工具描述：{description}

输出格式（JSON）：
{
  "primaryCapability": "主要能力",
  "supportedModalities": ["支持的模态"],
  "pricingModel": "定价模式",
  "targetAudience": "目标用户",
  "keyFeatures": ["关键特性"],
  "limitations": ["局限性"]
}
`;
```

### 10.1.3 RAG（检索增强生成）：让 LLM 访问私有数据

RAG 是 FDE 将 LLM 接入企业数据的核心技术。

**RAG 架构**：

```
用户查询 → 向量化 → 向量检索 → 获取相关文档 → 构建 Prompt → LLM 生成回答
```

**AI-API-COMPASS 的 RAG 实现思路**：

```typescript
// 概念示例：工具推荐的 RAG 实现
interface RAGConfig {
  embeddingModel: string;      // 嵌入模型
  vectorStore: string;         // 向量数据库
  topK: number;                // 检索数量
  similarityThreshold: number; // 相似度阈值
}

class ToolRAGSystem {
  private embeddingModel: EmbeddingModel;
  private vectorStore: VectorStore;

  async indexTools(tools: AIGCTool[]) {
    for (const tool of tools) {
      // 1. 构建工具描述文本
      const description = `
        工具名称：${tool.name}
        描述：${tool.description}
        能力：${tool.capabilities?.join(', ')}
        模态：${tool.modalities?.join(', ')}
        定价：${tool.pricingType}
        开发商：${tool.developer}
      `;

      // 2. 生成嵌入向量
      const embedding = await this.embeddingModel.embed(description);

      // 3. 存入向量数据库
      await this.vectorStore.upsert({
        id: tool.rid,
        embedding,
        metadata: {
          slug: tool.slug,
          name: tool.name,
          capabilities: tool.capabilities,
          pricingType: tool.pricingType,
        },
      });
    }
  }

  async query(userQuery: string, filters?: ToolFilters): Promise<RAGResult> {
    // 1. 查询向量化
    const queryEmbedding = await this.embeddingModel.embed(userQuery);

    // 2. 向量检索
    const results = await this.vectorStore.similaritySearch({
      vector: queryEmbedding,
      topK: 10,
      filters,  // 过滤条件（价格、平台等）
    });

    // 3. 构建 RAG Prompt
    const context = results.map(r => `
      工具：${r.metadata.name}
      能力：${r.metadata.capabilities?.join(', ')}
      定价：${r.metadata.pricingType}
    `).join('\n');

    const prompt = `
      基于以下工具信息，回答用户的问题：

      ${context}

      用户问题：${userQuery}

      请推荐最合适的工具，并说明理由。
    `;

    // 4. LLM 生成回答
    return await this.llm.generate(prompt);
  }
}
```

### 10.1.4 Agent 模式：让 LLM 自主执行任务

AI Agent 是 LLM 的高级应用形式，能够自主规划、执行和反思。

**Agent 核心循环**：

```
感知（Perceive）→ 思考（Think）→ 行动（Act）→ 观察（Observe）→ 反思（Reflect）
```

**ReAct 模式实现**：

```typescript
// 概念示例：AI 工具推荐 Agent
class ToolRecommendationAgent {
  private llm: LLM;
  private tools: Map<string, ToolFunction>;

  constructor(llm: LLM) {
    this.llm = llm;
    this.tools = new Map([
      ['searchTools', this.searchTools.bind(this)],
      ['getToolDetails', this.getToolDetails.bind(this)],
      ['compareTools', this.compareTools.bind(this)],
      ['getPricing', this.getPricing.bind(this)],
    ]);
  }

  async run(userInput: string): Promise<AgentResult> {
    const context: AgentContext = {
      userInput,
      history: [],
      toolCalls: [],
      finalAnswer: null,
    };

    // Agent 循环（最多 10 轮）
    for (let i = 0; i < 10; i++) {
      // 1. 思考
      const thought = await this.think(context);
      context.history.push({ role: 'thought', content: thought });

      // 2. 决定行动
      const action = await this.decideAction(context);

      if (action.type === 'final_answer') {
        context.finalAnswer = action.content;
        break;
      }

      // 3. 执行工具
      const observation = await this.executeTool(action);
      context.history.push({ role: 'observation', content: observation });
    }

    return {
      answer: context.finalAnswer,
      reasoning: context.history,
      toolCalls: context.toolCalls,
    };
  }

  private async think(context: AgentContext): Promise<string> {
    const prompt = `
      你是 AI 工具推荐专家。请分析当前情况，决定下一步行动。

      用户需求：${context.userInput}

      历史：
      ${context.history.map(h => `${h.role}: ${h.content}`).join('\n')}

      可用工具：
      - searchTools(query): 搜索工具
      - getToolDetails(rid): 获取工具详情
      - compareTools(rids): 对比工具
      - getPricing(rid): 获取定价信息

      请思考：
      1. 用户的核心需求是什么？
      2. 我还需要哪些信息？
      3. 下一步应该调用哪个工具？
    `;

    return await this.llm.generate(prompt);
  }

  private async decideAction(context: AgentContext): Promise<AgentAction> {
    const prompt = `
      基于以下思考，决定下一步行动：

      ${context.history[context.history.length - 1]?.content}

      请输出 JSON 格式：
      {
        "type": "tool_call" | "final_answer",
        "tool": "工具名（如果是 tool_call）",
        "params": { 参数 },
        "content": "最终回答（如果是 final_answer）"
      }
    `;

    const response = await this.llm.generate(prompt);
    return JSON.parse(response);
  }

  private async executeTool(action: AgentAction): Promise<string> {
    const tool = this.tools.get(action.tool);
    if (!tool) return `错误：未知工具 ${action.tool}`;

    try {
      const result = await tool(action.params);
      return JSON.stringify(result);
    } catch (error) {
      return `错误：${error.message}`;
    }
  }
}
```

---

## 10.2 AIP Logic 与 AI 集成

### 10.2.1 AIP Logic 的概念：将 LLM 接入 Ontology

AIP Logic 是 Palantir AIP 平台的核心组件，它将 LLM 能力无缝集成到 Ontology 中。

**AIP Logic 的核心能力**：

1. **自然语言查询**：用自然语言查询 Ontology 数据
2. **自动 Action 执行**：LLM 自动决定执行哪些 Actions
3. **智能推荐**：基于 Ontology 数据的智能推荐
4. **数据生成**：根据 Ontology Schema 生成合成数据
5. **异常检测**：识别 Ontology 数据中的异常模式

**AIP Logic 架构**：

```
用户输入（自然语言）
    ↓
AIP Logic 解析器
    ↓
Ontology 查询生成
    ↓
数据检索（Object Sets / Functions）
    ↓
LLM 推理与生成
    ↓
Action 执行（可选）
    ↓
结果格式化
    ↓
用户输出
```

### 10.2.2 模型目录（Model Catalog）：统一管理 LLM

Palantir 的 Model Catalog 允许 FDE 统一管理企业使用的所有 LLM。

**Model Catalog 功能**：

| 功能 | 说明 | FDE 操作 |
|------|------|---------|
| **模型注册** | 注册外部模型（OpenAI、Anthropic 等） | 配置 API 密钥和参数 |
| **模型版本** | 管理模型版本和回滚 | 版本切换和 A/B 测试 |
| **访问控制** | 控制谁可以使用哪些模型 | 权限配置 |
| **成本追踪** | 监控模型调用成本 | 成本优化 |
| **性能监控** | 追踪延迟、准确率等指标 | 性能调优 |

```typescript
// 概念示例：Model Catalog 配置
interface ModelConfig {
  modelId: string;
  provider: 'openai' | 'anthropic' | 'azure' | 'custom';
  modelName: string;
  apiKey: string;  // 加密存储
  parameters: {
    temperature: number;
    maxTokens: number;
    topP: number;
  };
  rateLimits: {
    requestsPerMinute: number;
    tokensPerMinute: number;
  };
  costTracking: {
    enabled: boolean;
    budgetLimit?: number;
  };
}

// AI-API-COMPASS 的模型配置示例
const MODEL_CATALOG = {
  'gpt-4': {
    provider: 'openai',
    modelName: 'gpt-4-turbo',
    parameters: {
      temperature: 0.7,
      maxTokens: 2000,
      topP: 0.9,
    },
    rateLimits: {
      requestsPerMinute: 60,
      tokensPerMinute: 100000,
    },
  },
  'claude-3': {
    provider: 'anthropic',
    modelName: 'claude-3-sonnet',
    parameters: {
      temperature: 0.5,
      maxTokens: 4000,
    },
  },
};
```

### 10.2.3 AI Agent 的 Ontology 集成模式

AI Agent 与 Ontology 的集成有三种主要模式：

**模式 1：Ontology 作为知识库（RAG 模式）**

```
用户查询 → 向量检索 Ontology 数据 → LLM 生成回答
```

适用场景：问答、推荐、分析

**模式 2：Ontology 作为工具箱（Tool Use 模式）**

```
用户请求 → LLM 规划 → 调用 Ontology Actions → 执行结果 → LLM 总结
```

适用场景：复杂任务自动化、工作流执行

**模式 3：Ontology 作为记忆（Memory 模式）**

```
Agent 执行 → 结果写入 Ontology → 后续查询读取历史
```

适用场景：长期记忆、学习优化

AI-API-COMPASS 的场景推荐功能结合了模式 1 和模式 2：

```typescript
// 场景推荐 Agent 实现
class ScenarioRecommendationAgent {
  private scenarioMatcher: ScenarioMatcher;
  private recommendationEngine: RecommendationEngine;
  private llm: LLM;

  async recommend(userInput: string): Promise<RecommendationResult> {
    // 模式 1：Ontology 作为知识库
    // 1. 分析用户输入
    const scenarioMatch = await this.scenarioMatcher.matchScenario(userInput);

    // 2. 从 Ontology 检索相关工具
    const tools = await this.recommendationEngine.getScenarioRecommendations({
      scenario: userInput,
      constraints: {
        maxPrice: scenarioMatch.priceSensitive ? 100 : undefined,
      },
      limit: 10,
    });

    // 模式 2：LLM 增强推荐
    // 3. 使用 LLM 生成推荐理由
    const enhancedRecommendations = await this.enhanceWithLLM(
      tools,
      userInput,
      scenarioMatch
    );

    return enhancedRecommendations;
  }

  private async enhanceWithLLM(
    tools: RecommendationResult,
    userInput: string,
    scenarioMatch: ScenarioMatchResult
  ): Promise<RecommendationResult> {
    const prompt = `
      作为 AI 工具推荐专家，请为以下工具生成个性化推荐理由。

      用户需求：${userInput}
      匹配场景：${scenarioMatch.scenarioName}
      置信度：${scenarioMatch.confidence}

      推荐工具：
      ${tools.items.map((item, i) => `
        ${i + 1}. ${item.tool.name}
           能力：${item.tool.capabilities?.join(', ')}
           定价：${item.tool.pricingType}
           匹配得分：${item.score}
      `).join('\n')}

      请为每个工具生成：
      1. 一句话推荐理由
      2. 三个关键优势
      3. 适用场景说明

      输出 JSON 格式。
    `;

    const llmResponse = await this.llm.generate(prompt);
    const enhancements = JSON.parse(llmResponse);

    // 合并 LLM 增强结果
    return {
      ...tools,
      items: tools.items.map((item, i) => ({
        ...item,
        reasons: [
          ...item.reasons,
          enhancements[i]?.summary,
        ].filter(Boolean),
        llmEnhanced: enhancements[i],
      })),
    };
  }
}
```

### 10.2.4 AIP Bootcamp 中的 AI 实战

AIP Bootcamp 是 Palantir 的核心交付模式，其中 AI 实战是重要环节。

**Bootcamp AI 实战流程**：

```
Day 1: 数据接入 → 将客户数据导入 Ontology
Day 2: Ontology 构建 → 定义 Object Types 和 Links
Day 3: AI 集成 → 配置 AIP Logic 和 Model Catalog
Day 4: 应用开发 → 构建 Ontology 感知应用
Day 5: 部署与优化 → 上线和性能调优
```

**FDE 在 Bootcamp 中的 AI 任务**：

1. **模型选择**：根据场景选择合适的 LLM
2. **Prompt 设计**：设计有效的系统提示和任务提示
3. **RAG 配置**：配置向量检索和上下文注入
4. **Action 集成**：让 LLM 能够执行 Ontology Actions
5. **评估优化**：评估 AI 效果并持续优化

---

## 10.3 AI-API-COMPASS 的 AI 能力

### 10.3.1 推荐引擎：场景匹配与相似工具推荐

AI-API-COMPASS 的推荐引擎是 AI Agent 的典型应用，它结合了规则引擎和 LLM 增强。

**推荐引擎架构**：

```typescript
// backend/src/services/recommendation/rec-engine.ts
export class RecommendationEngine {
  private prisma: PrismaClient;
  private scenarioMatcher: ScenarioMatcher;
  private config: RecommendationConfig;

  constructor(prisma: PrismaClient, config?: Partial<RecommendationConfig>) {
    this.prisma = prisma;
    this.scenarioMatcher = new ScenarioMatcher();
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 首页推荐
   * 混合热门工具、新兴工具和精选工具
   */
  async getHomeRecommendations(params: HomeRecommendationParams = {}): Promise<RecommendationResult> {
    const { limit = 20, offset = 0, mixRatio = DEFAULT_MIX_RATIO } = params;

    const [hotTools, risingTools, featuredTools] = await Promise.all([
      this.getHotTools(Math.ceil(limit * mixRatio.hot) + 10),
      this.getRisingTools(Math.ceil(limit * mixRatio.rising) + 10),
      this.getFeaturedTools(Math.ceil(limit * mixRatio.featured) + 10),
    ]);

    const mixedItems = this.mixRecommendations(hotTools, risingTools, featuredTools, mixRatio, limit);
    const diversifiedItems = this.diversifyResults(mixedItems);

    return {
      success: true,
      scene: 'home',
      items: diversifiedItems.slice(offset, offset + limit),
      metadata: {
        total: diversifiedItems.length,
        generatedAt: new Date().toISOString(),
        algorithm: 'home-mixed-recommendation',
        params: { mixRatio, limit, offset },
      },
    };
  }

  /**
   * 场景推荐
   * 根据用户场景描述匹配推荐工具
   */
  async getScenarioRecommendations(params: ScenarioRecommendationParams): Promise<RecommendationResult> {
    const { scenario, description, constraints, limit = 10 } = params;

    // 1. 场景匹配（Ontology Function）
    const scenarioMatch = await this.scenarioMatcher.matchScenario(scenario, description);

    // 2. 工具检索（Ontology Object Set 查询）
    const allTools = await aigcRepository.getTools({ limit: 200 });

    // 3. 匹配评分（规则引擎）
    const items: RecommendationItem[] = [];
    for (const tool of allTools) {
      const matchResult = this.calculateScenarioMatchScore(tool, scenarioMatch, constraints);

      if (matchResult.score > this.config.minScore) {
        items.push({
          tool,
          score: matchResult.score,
          reasons: matchResult.reasons,
          matchDetails: {
            scenarioMatch: matchResult.score,
            categoryMatch: matchResult.categoryMatch,
            pricingMatch: matchResult.pricingMatch,
          },
        });
      }
    }

    items.sort((a, b) => b.score - a.score);
    const diversifiedItems = this.diversifyResults(items);

    return {
      success: true,
      scene: 'scenario',
      items: diversifiedItems.slice(0, limit),
      metadata: {
        total: items.length,
        generatedAt: new Date().toISOString(),
        algorithm: 'scenario-matching',
        params: { scenario, constraints },
      },
    };
  }
}
```

**场景匹配器实现**：

```typescript
// backend/src/services/recommendation/scenario-match.ts
export class ScenarioMatcher {
  private presetScenarios: PresetScenario[];
  private keywordWeights: Map<string, KeywordWeight>;

  constructor() {
    this.presetScenarios = PRESET_SCENARIOS;
    this.keywordWeights = new Map(
      KEYWORD_WEIGHTS.map(kw => [kw.keyword.toLowerCase(), kw])
    );
  }

  /**
   * 匹配场景
   * 根据用户输入匹配最合适的场景
   */
  async matchScenario(input: string, description?: string): Promise<ScenarioMatchResult> {
    const fullText = `${input} ${description || ''}`.toLowerCase();
    const extractedKeywords = this.extractKeywords(fullText);
    const matchedScenario = this.findBestMatchingScenario(fullText, extractedKeywords);

    if (matchedScenario.confidence > 0.5) {
      return matchedScenario;
    }

    return this.analyzeDynamicScenario(fullText, extractedKeywords);
  }

  /**
   * 动态场景分析
   * 当预设场景匹配度不高时，动态分析用户需求
   */
  private analyzeDynamicScenario(text: string, extractedKeywords: string[]): ScenarioMatchResult {
    const requiredCapabilities: string[] = [];

    if (text.includes('文本') || text.includes('对话') || text.includes('写作')) {
      requiredCapabilities.push('text_generation');
    }
    if (text.includes('代码') || text.includes('编程')) {
      requiredCapabilities.push('code_generation');
    }
    if (text.includes('图像') || text.includes('图片') || text.includes('绘画')) {
      requiredCapabilities.push('image_generation');
    }
    if (text.includes('语音') || text.includes('音频')) {
      if (text.includes('识别') || text.includes('转文字')) {
        requiredCapabilities.push('speech_recognition');
      }
      if (text.includes('合成') || text.includes('朗读')) {
        requiredCapabilities.push('speech_synthesis');
      }
    }
    if (text.includes('视频')) {
      requiredCapabilities.push('video_generation');
    }
    if (text.includes('翻译')) {
      requiredCapabilities.push('translation');
    }

    if (requiredCapabilities.length === 0) {
      requiredCapabilities.push('text_generation');
    }

    const priceSensitive =
      text.includes('免费') ||
      text.includes('便宜') ||
      text.includes('预算') ||
      text.includes('低成本');

    const preferredCategories = this.inferCategories(text, extractedKeywords);

    return {
      scenarioId: 'dynamic',
      scenarioName: '自定义场景',
      confidence: 0.6,
      requiredCapabilities,
      preferredCategories,
      priceSensitive,
      extractedKeywords,
      matchReasons: this.generateDynamicReasons(requiredCapabilities, priceSensitive, extractedKeywords),
    };
  }
}
```

### 10.3.2 智能搜索：基于语义的 AI 工具发现

智能搜索结合了关键词匹配和语义理解。

```typescript
// 概念示例：语义搜索实现
interface SemanticSearchConfig {
  embeddingModel: string;
  similarityThreshold: number;
  hybridWeight: {
    keyword: number;
    semantic: number;
  };
}

class SemanticSearchEngine {
  private embeddingModel: EmbeddingModel;
  private vectorStore: VectorStore;

  async search(query: string, options?: SearchOptions): Promise<SearchResult> {
    // 1. 关键词搜索
    const keywordResults = await this.keywordSearch(query, options);

    // 2. 语义搜索
    const queryEmbedding = await this.embeddingModel.embed(query);
    const semanticResults = await this.vectorStore.similaritySearch({
      vector: queryEmbedding,
      topK: options?.limit || 20,
    });

    // 3. 混合排序
    const hybridResults = this.hybridRank(keywordResults, semanticResults, {
      keyword: 0.3,
      semantic: 0.7,
    });

    return {
      items: hybridResults,
      total: hybridResults.length,
      query,
      metadata: {
        keywordMatches: keywordResults.length,
        semanticMatches: semanticResults.length,
      },
    };
  }

  private hybridRank(
    keywordResults: SearchResultItem[],
    semanticResults: SearchResultItem[],
    weights: { keyword: number; semantic: number }
  ): SearchResultItem[] {
    const scores = new Map<string, number>();

    // 关键词得分
    for (const item of keywordResults) {
      scores.set(item.tool.rid, (scores.get(item.tool.rid) || 0) + item.score * weights.keyword);
    }

    // 语义得分
    for (const item of semanticResults) {
      scores.set(item.tool.rid, (scores.get(item.tool.rid) || 0) + item.score * weights.semantic);
    }

    // 排序
    return Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([rid, score]) => ({
        tool: this.getToolByRid(rid),
        score,
        reasons: ['语义匹配', '关键词匹配'],
      }));
  }
}
```

### 10.3.3 成本模拟器：LLM API 调用成本预估

成本模拟器帮助用户预估使用 LLM 的成本。

```typescript
// 概念示例：成本模拟器
interface CostEstimate {
  model: string;
  inputTokens: number;
  outputTokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
  currency: string;
}

class LLMCostSimulator {
  private pricing: Map<string, ModelPricing>;

  constructor() {
    this.pricing = new Map([
      ['gpt-4', { inputPricePer1M: 30, outputPricePer1M: 60 }],
      ['gpt-3.5-turbo', { inputPricePer1M: 0.5, outputPricePer1M: 1.5 }],
      ['claude-3-sonnet', { inputPricePer1M: 3, outputPricePer1M: 15 }],
    ]);
  }

  estimateCost(params: {
    model: string;
    inputText: string;
    expectedOutputTokens: number;
    callsPerDay: number;
  }): CostEstimate {
    const pricing = this.pricing.get(params.model);
    if (!pricing) throw new Error(`Unknown model: ${params.model}`);

    // Token 估算（粗略：1 token ≈ 4 字符）
    const inputTokens = Math.ceil(params.inputText.length / 4);
    const outputTokens = params.expectedOutputTokens;

    const inputCost = (inputTokens / 1_000_000) * pricing.inputPricePer1M * params.callsPerDay;
    const outputCost = (outputTokens / 1_000_000) * pricing.outputPricePer1M * params.callsPerDay;

    return {
      model: params.model,
      inputTokens,
      outputTokens,
      inputCost,
      outputCost,
      totalCost: inputCost + outputCost,
      currency: 'USD',
    };
  }

  compareModels(params: {
    inputText: string;
    expectedOutputTokens: number;
    callsPerDay: number;
  }): CostComparison {
    const results: CostEstimate[] = [];

    for (const [model, pricing] of this.pricing) {
      results.push(this.estimateCost({
        model,
        ...params,
      }));
    }

    return {
      estimates: results.sort((a, b) => a.totalCost - b.totalCost),
      cheapest: results[0],
      mostExpensive: results[results.length - 1],
    };
  }
}
```

### 10.3.4 未来规划：AI 对话式工具选择

AI-API-COMPASS 的未来规划是实现对话式工具选择。

```typescript
// 概念示例：对话式 Agent
class ConversationalToolAgent {
  private llm: LLM;
  private ontology: OntologyAPI;
  private conversationHistory: Message[] = [];

  async chat(userMessage: string): Promise<AgentResponse> {
    // 1. 添加到历史
    this.conversationHistory.push({ role: 'user', content: userMessage });

    // 2. 理解意图
    const intent = await this.understandIntent(userMessage);

    // 3. 执行相应操作
    switch (intent.type) {
      case 'search':
        return this.handleSearch(intent);
      case 'compare':
        return this.handleCompare(intent);
      case 'recommend':
        return this.handleRecommend(intent);
      case 'question':
        return this.handleQuestion(intent);
      default:
        return this.handleGeneral(userMessage);
    }
  }

  private async handleSearch(intent: Intent): Promise<AgentResponse> {
    // 执行搜索
    const results = await this.ontology.searchTools({
      query: intent.query,
      filters: intent.filters,
    });

    // 生成自然语言回复
    const prompt = `
      用户搜索：${intent.query}
      找到 ${results.total} 个工具：
      ${results.items.slice(0, 5).map((item, i) => `${i + 1}. ${item.name}: ${item.tagline}`).join('\n')}

      请用自然语言回复用户，简要介绍搜索结果。
    `;

    const reply = await this.llm.generate(prompt);

    return {
      type: 'search_results',
      message: reply,
      data: results,
      suggestions: ['查看更多', '筛选结果', '对比前两个'],
    };
  }

  private async handleRecommend(intent: Intent): Promise<AgentResponse> {
    // 收集用户需求
    const requirements = await this.collectRequirements(intent);

    // 执行推荐
    const recommendations = await this.ontology.getRecommendations({
      scenario: requirements.scenario,
      constraints: requirements.constraints,
    });

    // 生成个性化推荐语
    const prompt = `
      基于用户需求：${requirements.scenario}
      推荐以下工具：
      ${recommendations.items.map((item, i) => `
        ${i + 1}. ${item.tool.name}
           匹配原因：${item.reasons.join(', ')}
           得分：${item.score}
      `).join('\n')}

      请生成个性化的推荐说明。
    `;

    const reply = await this.llm.generate(prompt);

    return {
      type: 'recommendations',
      message: reply,
      data: recommendations,
      actions: ['添加到对比', '查看详情', '重新推荐'],
    };
  }
}
```

---

## 10.4 MLOps 基础

### 10.4.1 模型训练、评估与部署

MLOps 是 AI Agent 持续运营的基础。

**模型生命周期**：

```
数据准备 → 模型训练 → 模型评估 → 模型注册 → 模型部署 → 模型监控 → 模型迭代
```

**AI-API-COMPASS 的模型管理**：

```typescript
// 概念示例：模型版本管理
interface ModelVersion {
  version: string;
  modelId: string;
  trainingData: string;
  metrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1: number;
  };
  deployedAt?: string;
  status: 'training' | 'evaluating' | 'ready' | 'deployed' | 'deprecated';
}

class ModelRegistry {
  private versions: Map<string, ModelVersion[]>;

  async registerModel(version: ModelVersion): Promise<void> {
    const versions = this.versions.get(version.modelId) || [];
    versions.push(version);
    this.versions.set(version.modelId, versions);
  }

  async deployModel(modelId: string, version: string): Promise<void> {
    const versions = this.versions.get(modelId) || [];
    const target = versions.find(v => v.version === version);

    if (!target) throw new Error(`Version ${version} not found`);
    if (target.status !== 'ready') throw new Error(`Version ${version} is not ready`);

    // 部署逻辑
    target.status = 'deployed';
    target.deployedAt = new Date().toISOString();

    // 更新其他版本状态
    for (const v of versions) {
      if (v.version !== version && v.status === 'deployed') {
        v.status = 'deprecated';
      }
    }
  }
}
```

### 10.4.2 模型监控与漂移检测

模型监控确保 AI Agent 持续有效。

**监控指标**：

| 指标 | 说明 | 告警阈值 |
|------|------|---------|
| **延迟** | 模型响应时间 | > 2s |
| **错误率** | 请求失败比例 | > 1% |
| **Token 消耗** | 每请求 Token 数 | > 4000 |
| **用户满意度** | 评分/反馈 | < 4.0 |
| **概念漂移** | 输入分布变化 | KL 散度 > 0.1 |

```typescript
// 概念示例：模型监控
class ModelMonitor {
  private metrics: MetricsCollector;

  async recordRequest(request: ModelRequest, response: ModelResponse): Promise<void> {
    const latency = Date.now() - request.startTime;
    const tokenCount = response.tokens.input + response.tokens.output;

    this.metrics.record('model.latency', latency, {
      model: request.model,
      endpoint: request.endpoint,
    });

    this.metrics.record('model.tokens', tokenCount, {
      model: request.model,
      type: 'total',
    });

    if (response.error) {
      this.metrics.increment('model.errors', {
        model: request.model,
        errorType: response.error.type,
      });
    }
  }

  async detectDrift(recentData: InputData[], baselineData: InputData[]): Promise<DriftReport> {
    // 计算输入分布的 KL 散度
    const klDivergence = this.calculateKLDivergence(recentData, baselineData);

    return {
      hasDrift: klDivergence > 0.1,
      klDivergence,
      affectedFeatures: this.identifyDriftedFeatures(recentData, baselineData),
      recommendation: klDivergence > 0.1 ? 'retrain' : 'monitor',
    };
  }
}
```

### 10.4.3 A/B 测试与模型迭代

A/B 测试是优化 AI Agent 的关键手段。

```typescript
// 概念示例：A/B 测试框架
interface ABTestConfig {
  testId: string;
  feature: string;
  variants: {
    name: string;
    weight: number;
    config: any;
  }[];
  metrics: string[];
  duration: number;
}

class ABTestFramework {
  private activeTests: Map<string, ABTest>;

  async createTest(config: ABTestConfig): Promise<ABTest> {
    const test: ABTest = {
      ...config,
      status: 'running',
      startTime: new Date().toISOString(),
      results: new Map(),
    };

    this.activeTests.set(config.testId, test);
    return test;
  }

  assignVariant(testId: string, userId: string): string {
    const test = this.activeTests.get(testId);
    if (!test) return 'control';

    // 基于用户 ID 哈希分配
    const hash = this.hashUserId(userId, testId);
    let cumulativeWeight = 0;

    for (const variant of test.variants) {
      cumulativeWeight += variant.weight;
      if (hash < cumulativeWeight) {
        return variant.name;
      }
    }

    return test.variants[test.variants.length - 1].name;
  }

  async recordMetric(testId: string, variant: string, metric: string, value: number): Promise<void> {
    const test = this.activeTests.get(testId);
    if (!test) return;

    const key = `${variant}.${metric}`;
    const values = test.results.get(key) || [];
    values.push(value);
    test.results.set(key, values);
  }

  async analyzeTest(testId: string): Promise<TestAnalysis> {
    const test = this.activeTests.get(testId);
    if (!test) throw new Error(`Test ${testId} not found`);

    const analysis: TestAnalysis = {
      testId,
      variants: [],
      winner: null,
      confidence: 0,
    };

    for (const variant of test.variants) {
      const metrics: Record<string, MetricStats> = {};

      for (const metric of test.metrics) {
        const values = test.results.get(`${variant.name}.${metric}`) || [];
        metrics[metric] = this.calculateStats(values);
      }

      analysis.variants.push({
        name: variant.name,
        metrics,
      });
    }

    // 确定获胜者
    analysis.winner = this.determineWinner(analysis.variants);
    analysis.confidence = this.calculateConfidence(analysis.variants);

    return analysis;
  }
}
```

---

## 🎯 实践环节：为 AI-API-COMPASS 集成一个 LLM 能力

### 任务：集成 LLM 增强的场景推荐

**目标**：使用 LLM 增强现有的场景推荐功能，生成更智能的推荐理由。

**步骤 1：配置 LLM 客户端**

```typescript
// src/services/llm/llm-client.ts
import OpenAI from 'openai';

interface LLMConfig {
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

class LLMClient {
  private client: OpenAI;
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.client = new OpenAI({ apiKey: config.apiKey });
    this.config = config;
  }

  async generate(prompt: string, options?: Partial<LLMConfig>): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: options?.model || this.config.model,
      temperature: options?.temperature || this.config.temperature,
      max_tokens: options?.maxTokens || this.config.maxTokens,
      messages: [
        { role: 'system', content: '你是 AI 工具推荐专家。' },
        { role: 'user', content: prompt },
      ],
    });

    return response.choices[0]?.message?.content || '';
  }
}

export const llmClient = new LLMClient({
  apiKey: process.env.OPENAI_API_KEY || '',
  model: 'gpt-4-turbo',
  temperature: 0.7,
  maxTokens: 2000,
});
```

**步骤 2：创建 LLM 增强服务**

```typescript
// src/services/llm/enhanced-recommendation.ts
import { llmClient } from './llm-client';
import { RecommendationResult } from '../recommendation/rec-engine';

interface EnhancedRecommendation {
  tool: any;
  score: number;
  reasons: string[];
  llmSummary: string;
  keyAdvantages: string[];
  useCases: string[];
}

export async function enhanceRecommendations(
  recommendations: RecommendationResult,
  userQuery: string
): Promise<EnhancedRecommendation[]> {
  const prompt = `
    作为 AI 工具推荐专家，请为以下工具生成个性化推荐理由。

    用户需求：${userQuery}

    推荐工具：
    ${recommendations.items.map((item, i) => `
      ${i + 1}. ${item.tool.name}
         描述：${item.tool.description}
         能力：${item.tool.capabilities?.join(', ')}
         定价：${item.tool.pricingType}
         开发商：${item.tool.developer}
         匹配得分：${item.score}
         原始推荐理由：${item.reasons.join(', ')}
    `).join('\n')}

    请为每个工具生成：
    1. 一句话总结（为什么适合用户）
    2. 三个关键优势
    3. 两个最佳使用场景

    输出 JSON 数组格式：
    [
      {
        "toolName": "工具名",
        "summary": "一句话总结",
        "advantages": ["优势1", "优势2", "优势3"],
        "useCases": ["场景1", "场景2"]
      }
    ]
  `;

  const response = await llmClient.generate(prompt);
  const enhancements = JSON.parse(response);

  return recommendations.items.map((item, i) => ({
    tool: item.tool,
    score: item.score,
    reasons: item.reasons,
    llmSummary: enhancements[i]?.summary || '',
    keyAdvantages: enhancements[i]?.advantages || [],
    useCases: enhancements[i]?.useCases || [],
  }));
}
```

**步骤 3：更新推荐 API**

```typescript
// src/routes/recommendations.routes.ts
import { enhanceRecommendations } from '../services/llm/enhanced-recommendation';

app.post('/api/aigc/recommendations/scenario', async (request, reply) => {
  const { scenario, description, constraints, limit, enhanceWithLLM } = request.body;

  // 1. 执行基础推荐
  const result = await recommendationEngine.getScenarioRecommendations({
    scenario,
    description,
    constraints,
    limit,
  });

  // 2. 如果启用 LLM 增强
  if (enhanceWithLLM && result.success) {
    const enhanced = await enhanceRecommendations(result, scenario);
    return {
      ...result,
      items: enhanced,
      enhanced: true,
    };
  }

  return result;
});
```

---

## 📚 推荐书籍

《Designing Machine Learning Systems》— Chip Huyen

---

## ✅ 本章自评清单

- [ ] 理解 LLM 的核心工作原理（Transformer、Token 化、概率分布）
- [ ] 掌握 Prompt Engineering 的核心技巧（清晰、结构化、Few-shot）
- [ ] 理解 RAG 架构及其实现方式
- [ ] 掌握 Agent 模式（ReAct、Tool Use）
- [ ] 理解 AIP Logic 的概念和架构
- [ ] 了解 Model Catalog 的功能和配置
- [ ] 掌握 AI Agent 与 Ontology 的三种集成模式
- [ ] 理解 AIP Bootcamp 的 AI 实战流程
- [ ] 能够分析 AI-API-COMPASS 的推荐引擎实现
- [ ] 理解 MLOps 基础（训练、评估、部署、监控）
- [ ] 完成实践环节：集成 LLM 增强推荐

---

> **本章小结**：AI Agent 是 FDE 在 AI 时代的核心竞争力。从 LLM 基础到 AIP Logic 集成，从 RAG 到 Agent 模式，FDE 需要掌握将大语言模型接入企业运营的完整技术栈。AI-API-COMPASS 的推荐引擎展示了如何在实际项目中应用这些技术——场景匹配、相似推荐、语义搜索。随着 AI 技术的快速发展，FDE 的角色正在从"数据工程师"进化为"AI 应用架构师"，而 Ontology 正是连接数据与 AI 的桥梁。
