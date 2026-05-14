/**
 * LLM Cost Simulator
 *
 * 估算不同 LLM 模型的 API 调用成本
 */

// =============================================================================
// Types
// =============================================================================

export interface ModelPricing {
  modelId: string;
  name: string;
  provider: string;
  inputPricePer1M: number; // USD per 1M input tokens
  outputPricePer1M: number; // USD per 1M output tokens
  currency: string;
}

export interface CostEstimateParams {
  modelId: string;
  inputText: string;
  expectedOutputTokens: number;
  callsPerDay: number;
  daysPerMonth?: number;
}

export interface CostEstimate {
  modelId: string;
  modelName: string;
  provider: string;
  inputTokens: number;
  outputTokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
  costPerDay: number;
  costPerMonth: number;
  currency: string;
}

export interface CostComparison {
  estimates: CostEstimate[];
  cheapest: CostEstimate;
  mostExpensive: CostEstimate;
  savings: {
    vsCheapest: number;
    vsMostExpensive: number;
  };
}

// =============================================================================
// Model Pricing Data
// =============================================================================

const MODEL_PRICING: ModelPricing[] = [
  {
    modelId: "abab6.5s-chat",
    name: "MiniMax abab6.5s",
    provider: "MiniMax",
    inputPricePer1M: 1.0,
    outputPricePer1M: 1.0,
    currency: "USD",
  },
  {
    modelId: "abab6-chat",
    name: "MiniMax abab6",
    provider: "MiniMax",
    inputPricePer1M: 2.0,
    outputPricePer1M: 2.0,
    currency: "USD",
  },
  {
    modelId: "gpt-4o",
    name: "GPT-4o",
    provider: "OpenAI",
    inputPricePer1M: 2.5,
    outputPricePer1M: 10.0,
    currency: "USD",
  },
  {
    modelId: "gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "OpenAI",
    inputPricePer1M: 0.15,
    outputPricePer1M: 0.6,
    currency: "USD",
  },
  {
    modelId: "claude-3-5-sonnet",
    name: "Claude 3.5 Sonnet",
    provider: "Anthropic",
    inputPricePer1M: 3.0,
    outputPricePer1M: 15.0,
    currency: "USD",
  },
  {
    modelId: "claude-3-haiku",
    name: "Claude 3 Haiku",
    provider: "Anthropic",
    inputPricePer1M: 0.25,
    outputPricePer1M: 1.25,
    currency: "USD",
  },
];

// =============================================================================
// Cost Simulator
// =============================================================================

export class LLMCostSimulator {
  private pricing: Map<string, ModelPricing>;

  constructor() {
    this.pricing = new Map(MODEL_PRICING.map((p) => [p.modelId, p]));
  }

  /**
   * 估算单次调用成本
   */
  estimateCost(params: CostEstimateParams): CostEstimate {
    const pricing = this.pricing.get(params.modelId);
    if (!pricing) {
      throw new Error(`Unknown model: ${params.modelId}`);
    }

    // Token 估算（粗略：1 token ≈ 4 字符，中文 ≈ 2 字符）
    const inputTokens = Math.ceil(params.inputText.length / 2);
    const outputTokens = params.expectedOutputTokens;

    // 计算单次成本
    const inputCost =
      (inputTokens / 1_000_000) * pricing.inputPricePer1M;
    const outputCost =
      (outputTokens / 1_000_000) * pricing.outputPricePer1M;
    const totalCost = inputCost + outputCost;

    // 计算日/月成本
    const daysPerMonth = params.daysPerMonth || 30;
    const costPerDay = totalCost * params.callsPerDay;
    const costPerMonth = costPerDay * daysPerMonth;

    return {
      modelId: params.modelId,
      modelName: pricing.name,
      provider: pricing.provider,
      inputTokens,
      outputTokens,
      inputCost,
      outputCost,
      totalCost,
      costPerDay,
      costPerMonth,
      currency: pricing.currency,
    };
  }

  /**
   * 对比多个模型成本
   */
  compareModels(params: {
    inputText: string;
    expectedOutputTokens: number;
    callsPerDay: number;
    daysPerMonth?: number;
    modelIds?: string[];
  }): CostComparison {
    const modelIds =
      params.modelIds || Array.from(this.pricing.keys());

    const estimates: CostEstimate[] = [];

    for (const modelId of modelIds) {
      try {
        const estimate = this.estimateCost({
          modelId,
          inputText: params.inputText,
          expectedOutputTokens: params.expectedOutputTokens,
          callsPerDay: params.callsPerDay,
          daysPerMonth: params.daysPerMonth,
        });
        estimates.push(estimate);
      } catch (error) {
        console.warn(`Skipping model ${modelId}:`, error);
      }
    }

    // 按月成本排序
    estimates.sort((a, b) => a.costPerMonth - b.costPerMonth);

    const cheapest = estimates[0];
    const mostExpensive = estimates[estimates.length - 1];

    return {
      estimates,
      cheapest,
      mostExpensive,
      savings: {
        vsCheapest: 0,
        vsMostExpensive:
          mostExpensive.costPerMonth - cheapest.costPerMonth,
      },
    };
  }

  /**
   * 获取所有支持的模型
   */
  getSupportedModels(): ModelPricing[] {
    return Array.from(this.pricing.values());
  }

  /**
   * 添加自定义模型定价
   */
  addCustomModel(pricing: ModelPricing): void {
    this.pricing.set(pricing.modelId, pricing);
  }
}

// =============================================================================
// Singleton
// =============================================================================

let simulator: LLMCostSimulator | null = null;

export function getCostSimulator(): LLMCostSimulator {
  if (!simulator) {
    simulator = new LLMCostSimulator();
  }
  return simulator;
}
