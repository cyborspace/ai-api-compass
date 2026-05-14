/**
 * MiniMax LLM Client
 * 
 * 使用 MiniMax API 进行大语言模型调用
 * 文档: https://www.minimaxi.com/document
 */

import axios, { AxiosInstance } from 'axios';

// =============================================================================
// Types
// =============================================================================

export interface MiniMaxMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface MiniMaxCompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stream?: boolean;
}

export interface MiniMaxResponse {
  id: string;
  choices: Array<{
    message: MiniMaxMessage;
    finishReason: string;
  }>;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface MiniMaxConfig {
  apiKey: string;
  groupId?: string;
  baseURL?: string;
  model?: string;
  defaultTemperature?: number;
  defaultMaxTokens?: number;
}

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_BASE_URL = 'https://api.minimaxi.chat/v1';
const DEFAULT_MODEL = 'abab6.5s-chat';
const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_MAX_TOKENS = 2000;

// =============================================================================
// MiniMax Client
// =============================================================================

export class MiniMaxClient {
  private client: AxiosInstance;
  private config: MiniMaxConfig;

  constructor(config: MiniMaxConfig) {
    this.config = {
      baseURL: DEFAULT_BASE_URL,
      model: DEFAULT_MODEL,
      defaultTemperature: DEFAULT_TEMPERATURE,
      defaultMaxTokens: DEFAULT_MAX_TOKENS,
      ...config,
    };

    this.client = axios.create({
      baseURL: this.config.baseURL,
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  /**
   * 发送聊天完成请求
   */
  async chatCompletion(
    messages: MiniMaxMessage[],
    options: MiniMaxCompletionOptions = {}
  ): Promise<string> {
    const model = options.model || this.config.model || DEFAULT_MODEL;
    const temperature = options.temperature ?? this.config.defaultTemperature ?? DEFAULT_TEMPERATURE;
    const maxTokens = options.maxTokens ?? this.config.defaultMaxTokens ?? DEFAULT_MAX_TOKENS;

    const requestBody: any = {
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    };

    if (options.topP !== undefined) {
      requestBody.top_p = options.topP;
    }

    try {
      const response = await this.client.post<MiniMaxResponse>('/text/chatcompletion_v2', requestBody);
      
      if (response.data.choices && response.data.choices.length > 0) {
        return response.data.choices[0].message.content;
      }
      
      throw new Error('Empty response from MiniMax');
    } catch (error: any) {
      if (error.response) {
        throw new Error(`MiniMax API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      }
      throw new Error(`MiniMax request failed: ${error.message}`);
    }
  }

  /**
   * 生成文本（简化接口）
   */
  async generate(
    prompt: string,
    systemPrompt?: string,
    options?: MiniMaxCompletionOptions
  ): Promise<string> {
    const messages: MiniMaxMessage[] = [];
    
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    
    messages.push({ role: 'user', content: prompt });
    
    return this.chatCompletion(messages, options);
  }

  /**
   * 生成 JSON（要求模型返回 JSON 格式）
   */
  async generateJSON<T>(
    prompt: string,
    systemPrompt?: string,
    options?: MiniMaxCompletionOptions
  ): Promise<T> {
    const jsonSystemPrompt = systemPrompt 
      ? `${systemPrompt}\n\n你必须只返回 JSON 格式，不要包含任何其他文本。`
      : '你必须只返回 JSON 格式，不要包含任何其他文本。';
    
    const response = await this.generate(prompt, jsonSystemPrompt, {
      ...options,
      temperature: 0.3, // 降低温度以获得更确定性的输出
    });
    
    try {
      // 尝试提取 JSON（模型可能会用 markdown 代码块包裹）
      const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/) || 
                        response.match(/```\n?([\s\S]*?)\n?```/) ||
                        [null, response];
      
      const jsonStr = jsonMatch[1]?.trim() || response.trim();
      return JSON.parse(jsonStr) as T;
    } catch (error: any) {
      throw new Error(`Failed to parse JSON response: ${error.message}. Response: ${response}`);
    }
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

let minimaxClient: MiniMaxClient | null = null;

export function getMiniMaxClient(): MiniMaxClient {
  if (!minimaxClient) {
    const apiKey = process.env.MINIMAX_API_KEY;
    if (!apiKey) {
      throw new Error('MINIMAX_API_KEY environment variable is not set');
    }

    minimaxClient = new MiniMaxClient({
      apiKey,
      model: process.env.MINIMAX_MODEL || DEFAULT_MODEL,
      baseURL: process.env.MINIMAX_BASE_URL || DEFAULT_BASE_URL,
      defaultTemperature: parseFloat(process.env.MINIMAX_TEMPERATURE || '0.7'),
      defaultMaxTokens: parseInt(process.env.MINIMAX_MAX_TOKENS || '2000'),
    });
  }

  return minimaxClient;
}

export function resetMiniMaxClient(): void {
  minimaxClient = null;
}
