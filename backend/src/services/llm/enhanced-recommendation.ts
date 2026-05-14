/**
 * Enhanced Recommendation with MiniMax LLM
 * 
 * 使用 MiniMax LLM 增强推荐结果，生成个性化推荐理由
 */

import { getMiniMaxClient } from './minimax-client.js';
import type { RecommendationResult, RecommendationItem } from '../recommendation/rec-engine.js';

// =============================================================================
// Types
// =============================================================================

export interface LLMEnhancedRecommendation {
  tool: any;
  score: number;
  reasons: string[];
  llmSummary: string;
  keyAdvantages: string[];
  useCases: string[];
}

export interface LLMEnhancementResult {
  items: LLMEnhancedRecommendation[];
  enhanced: boolean;
  llmUsed: boolean;
  error?: string;
}

// =============================================================================
// System Prompts
// =============================================================================

const ENHANCEMENT_SYSTEM_PROMPT = `你是 AI 工具推荐专家。你的任务是为推荐的工具生成个性化、有说服力的推荐理由。

要求：
1. 每个工具的总结必须针对用户的具体需求
2. 关键优势必须基于工具的实际能力
3. 使用场景必须具体且实用
4. 使用中文回复
5. 严格按照要求的 JSON 格式输出`;

// =============================================================================
// Enhancement Functions
// =============================================================================

/**
 * 使用 LLM 增强推荐结果
 */
export async function enhanceRecommendationsWithLLM(
  recommendations: RecommendationResult,
  userQuery: string
): Promise<LLMEnhancementResult> {
  try {
    const client = getMiniMaxClient();

    const prompt = buildEnhancementPrompt(recommendations, userQuery);

    const enhancements = await client.generateJSON<Array<{
      toolName: string;
      summary: string;
      advantages: string[];
      useCases: string[];
    }>>(prompt, ENHANCEMENT_SYSTEM_PROMPT, {
      temperature: 0.7,
      maxTokens: 3000,
    });

    const enhancedItems: LLMEnhancedRecommendation[] = recommendations.items.map((item, index) => {
      const enhancement = enhancements[index];
      return {
        tool: item.tool,
        score: item.score,
        reasons: enhancement?.summary ? [enhancement.summary, ...item.reasons] : item.reasons,
        llmSummary: enhancement?.summary || '',
        keyAdvantages: enhancement?.advantages || [],
        useCases: enhancement?.useCases || [],
      };
    });

    return {
      items: enhancedItems,
      enhanced: true,
      llmUsed: true,
    };
  } catch (error: any) {
    console.error('LLM enhancement failed:', error);
    
    // 降级：返回基础推荐
    return {
      items: recommendations.items.map(item => ({
        tool: item.tool,
        score: item.score,
        reasons: item.reasons,
        llmSummary: '',
        keyAdvantages: [],
        useCases: [],
      })),
      enhanced: false,
      llmUsed: false,
      error: error.message,
    };
  }
}

/**
 * 分析场景需求
 */
export async function analyzeScenarioWithLLM(
  userInput: string
): Promise<{
  requiredCapabilities: string[];
  preferredCategories: string[];
  priceSensitive: boolean;
  platformRequirements: string[];
  reasoning: string;
}> {
  try {
    const client = getMiniMaxClient();

    const prompt = `
分析以下用户需求，提取关键信息：

用户需求："${userInput}"

请按以下 JSON 格式输出分析结果：
{
  "requiredCapabilities": ["需要的核心能力"],
  "preferredCategories": ["偏好的工具类别"],
  "priceSensitive": true/false,
  "platformRequirements": ["平台要求"],
  "reasoning": "分析推理过程"
}

约束：
- requiredCapabilities 从以下列表中选择：text_generation, image_generation, code_generation, speech_recognition, speech_synthesis, video_generation, translation, summarization, data_analysis
- priceSensitive 根据用户是否提及价格、预算、免费等词判断
- platformRequirements 从以下列表中选择：web, api, desktop, mobile
`;

    return await client.generateJSON(prompt, undefined, {
      temperature: 0.3,
      maxTokens: 1500,
    });
  } catch (error: any) {
    console.error('Scenario analysis failed:', error);
    
    // 降级：返回基础分析
    return {
      requiredCapabilities: extractCapabilitiesFallback(userInput),
      preferredCategories: [],
      priceSensitive: userInput.includes('免费') || userInput.includes('便宜') || userInput.includes('预算'),
      platformRequirements: [],
      reasoning: '基于关键词的基础分析（LLM 不可用）',
    };
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

function buildEnhancementPrompt(
  recommendations: RecommendationResult,
  userQuery: string
): string {
  const toolsInfo = recommendations.items.map((item, i) => `
${i + 1}. ${item.tool.name}
   描述：${item.tool.description || '无'}
   能力：${item.tool.capabilities?.join(', ') || '无'}
   定价：${item.tool.pricingType}
   开发商：${item.tool.developer}
   匹配得分：${item.score}
   原始推荐理由：${item.reasons.join(', ')}
`).join('\n');

  return `
作为 AI 工具推荐专家，请为以下工具生成个性化推荐理由。

用户需求：${userQuery}

推荐工具：
${toolsInfo}

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
}

function extractCapabilitiesFallback(text: string): string[] {
  const capabilities: string[] = [];
  const lowerText = text.toLowerCase();

  if (lowerText.includes('文本') || lowerText.includes('对话') || lowerText.includes('写作')) {
    capabilities.push('text_generation');
  }
  if (lowerText.includes('代码') || lowerText.includes('编程')) {
    capabilities.push('code_generation');
  }
  if (lowerText.includes('图像') || lowerText.includes('图片') || lowerText.includes('绘画')) {
    capabilities.push('image_generation');
  }
  if (lowerText.includes('语音') || lowerText.includes('音频')) {
    if (lowerText.includes('识别') || lowerText.includes('转文字')) {
      capabilities.push('speech_recognition');
    }
    if (lowerText.includes('合成') || lowerText.includes('朗读')) {
      capabilities.push('speech_synthesis');
    }
  }
  if (lowerText.includes('视频')) {
    capabilities.push('video_generation');
  }
  if (lowerText.includes('翻译')) {
    capabilities.push('translation');
  }
  if (lowerText.includes('摘要') || lowerText.includes('总结')) {
    capabilities.push('summarization');
  }
  if (lowerText.includes('数据') || lowerText.includes('分析')) {
    capabilities.push('data_analysis');
  }

  if (capabilities.length === 0) {
    capabilities.push('text_generation');
  }

  return capabilities;
}
