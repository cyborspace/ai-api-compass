/**
 * Scenario Matcher
 * 
 * 场景匹配服务
 * 
 * 功能:
 * - 提取需求关键词
 * - 计算匹配度
 * - 生成推荐理由
 * - 预设场景映射
 */

// =============================================================================
// Types & Interfaces
// =============================================================================

/** 预设场景配置 */
export interface PresetScenario {
  id: string;
  name: string;
  keywords: string[];
  requiredCapabilities: string[];
  preferredCategories: string[];
  priceSensitive: boolean;
  description: string;
  examples: string[];
}

/** 场景匹配结果 */
export interface ScenarioMatchResult {
  scenarioId: string;
  scenarioName: string;
  confidence: number;
  requiredCapabilities: string[];
  preferredCategories: string[];
  priceSensitive: boolean;
  extractedKeywords: string[];
  matchReasons: string[];
}

/** 关键词权重 */
interface KeywordWeight {
  keyword: string;
  weight: number;
  category: 'capability' | 'category' | 'price' | 'platform' | 'general';
}

// =============================================================================
// Preset Scenarios - 预设场景配置
// =============================================================================

export const PRESET_SCENARIOS: PresetScenario[] = [
  {
    id: 'customer-service-bot',
    name: '客服机器人',
    keywords: ['客服', '机器人', '对话', '自动回复', '智能客服', '在线客服', 'chatbot'],
    requiredCapabilities: ['text_generation', 'function_calling', 'conversation'],
    preferredCategories: ['chatbot', 'nlp', 'customer-service'],
    priceSensitive: true,
    description: '构建智能客服系统，支持自动对话、问题解答和多轮交互',
    examples: ['电商客服机器人', '技术支持助手', 'FAQ自动回答'],
  },
  {
    id: 'code-generation',
    name: '代码生成',
    keywords: ['代码', '编程', '开发', '写代码', '代码补全', '代码生成', 'copilot', 'ide'],
    requiredCapabilities: ['code_generation', 'text_generation'],
    preferredCategories: ['code-assistant', 'developer-tools', 'programming'],
    priceSensitive: false,
    description: 'AI辅助编程，代码生成、补全和优化',
    examples: ['代码补全助手', '代码审查工具', '单元测试生成'],
  },
  {
    id: 'image-generation',
    name: '图像生成',
    keywords: ['图像', '图片', '绘画', '设计', 'ai绘画', '生成图片', 'midjourney', 'stable diffusion'],
    requiredCapabilities: ['image_generation'],
    preferredCategories: ['image-generation', 'creative-tools', 'design'],
    priceSensitive: false,
    description: 'AI图像生成和编辑，支持文生图、图生图等',
    examples: ['营销海报生成', '产品图片设计', '艺术创作'],
  },
  {
    id: 'content-writing',
    name: '内容写作',
    keywords: ['写作', '文案', '文章', '内容', '博客', '营销文案', 'seo', '写作助手'],
    requiredCapabilities: ['text_generation'],
    preferredCategories: ['writing-assistant', 'content-creation', 'marketing'],
    priceSensitive: true,
    description: 'AI辅助写作，生成文章、文案、营销内容等',
    examples: ['博客文章生成', '营销文案创作', 'SEO内容优化'],
  },
  {
    id: 'data-analysis',
    name: '数据分析',
    keywords: ['数据', '分析', '报表', 'bi', '可视化', '数据挖掘', '统计分析', 'excel'],
    requiredCapabilities: ['text_generation', 'function_calling'],
    preferredCategories: ['data-analysis', 'bi-tools', 'analytics'],
    priceSensitive: false,
    description: '数据分析和可视化，生成报表和洞察',
    examples: ['销售数据分析', '用户行为分析', '财务报表生成'],
  },
  {
    id: 'translation',
    name: '翻译服务',
    keywords: ['翻译', '多语言', '国际化', '本地化', '语言', 'translate'],
    requiredCapabilities: ['translation', 'text_generation'],
    preferredCategories: ['translation', 'localization', 'nlp'],
    priceSensitive: true,
    description: '多语言翻译和本地化服务',
    examples: ['文档翻译', '网站国际化', '实时翻译'],
  },
  {
    id: 'voice-assistant',
    name: '语音助手',
    keywords: ['语音', '语音识别', '语音合成', 'tts', 'asr', '语音交互', '智能音箱'],
    requiredCapabilities: ['speech_recognition', 'speech_synthesis'],
    preferredCategories: ['voice', 'speech', 'audio'],
    priceSensitive: false,
    description: '语音识别和合成，构建语音交互应用',
    examples: ['智能音箱', '语音转文字', '有声读物生成'],
  },
  {
    id: 'video-generation',
    name: '视频生成',
    keywords: ['视频', '视频生成', '视频编辑', '短视频', '动画', 'ai视频'],
    requiredCapabilities: ['video_generation'],
    preferredCategories: ['video-generation', 'creative-tools', 'media'],
    priceSensitive: false,
    description: 'AI视频生成和编辑',
    examples: ['短视频创作', '营销视频生成', '动画制作'],
  },
  {
    id: 'budget-constrained',
    name: '预算有限',
    keywords: ['免费', '便宜', '预算', '低成本', '省钱', '免费试用', '开源'],
    requiredCapabilities: [],
    preferredCategories: [],
    priceSensitive: true,
    description: '寻找免费或低成本的工具方案',
    examples: ['个人项目', '创业初期', '学生项目'],
  },
  {
    id: 'enterprise-solution',
    name: '企业解决方案',
    keywords: ['企业', '私有部署', '安全', '合规', '大模型', '定制', 'api'],
    requiredCapabilities: ['text_generation', 'function_calling'],
    preferredCategories: ['enterprise', 'llm', 'api-platform'],
    priceSensitive: false,
    description: '企业级AI解决方案，支持私有部署和定制',
    examples: ['企业知识库', '内部文档处理', '业务流程自动化'],
  },
];

// =============================================================================
// Keyword Weights - 关键词权重配置
// =============================================================================

const KEYWORD_WEIGHTS: KeywordWeight[] = [
  // 能力关键词
  { keyword: '文本生成', weight: 0.9, category: 'capability' },
  { keyword: '代码生成', weight: 0.9, category: 'capability' },
  { keyword: '图像生成', weight: 0.9, category: 'capability' },
  { keyword: '语音识别', weight: 0.9, category: 'capability' },
  { keyword: '语音合成', weight: 0.9, category: 'capability' },
  { keyword: '视频生成', weight: 0.9, category: 'capability' },
  { keyword: '翻译', weight: 0.8, category: 'capability' },
  { keyword: '对话', weight: 0.7, category: 'capability' },
  { keyword: 'function_calling', weight: 0.8, category: 'capability' },
  
  // 类别关键词
  { keyword: '客服', weight: 0.8, category: 'category' },
  { keyword: '编程', weight: 0.8, category: 'category' },
  { keyword: '设计', weight: 0.8, category: 'category' },
  { keyword: '写作', weight: 0.8, category: 'category' },
  { keyword: '数据分析', weight: 0.8, category: 'category' },
  
  // 价格关键词
  { keyword: '免费', weight: 0.9, category: 'price' },
  { keyword: '便宜', weight: 0.7, category: 'price' },
  { keyword: '预算', weight: 0.6, category: 'price' },
  { keyword: '低成本', weight: 0.7, category: 'price' },
  
  // 平台关键词
  { keyword: 'api', weight: 0.6, category: 'platform' },
  { keyword: '私有部署', weight: 0.7, category: 'platform' },
  { keyword: '云端', weight: 0.5, category: 'platform' },
  
  // 通用关键词
  { keyword: '智能', weight: 0.3, category: 'general' },
  { keyword: 'AI', weight: 0.3, category: 'general' },
  { keyword: '自动', weight: 0.3, category: 'general' },
];

// =============================================================================
// Scenario Matcher Class
// =============================================================================

export class ScenarioMatcher {
  private presetScenarios: PresetScenario[];
  private keywordWeights: Map<string, KeywordWeight>;

  constructor() {
    this.presetScenarios = PRESET_SCENARIOS;
    this.keywordWeights = new Map(
      KEYWORD_WEIGHTS.map(kw => [kw.keyword.toLowerCase(), kw])
    );
  }

  // ===========================================================================
  // Public Methods
  // ===========================================================================

  /**
   * 匹配场景
   * 根据用户输入匹配最合适的场景
   */
  async matchScenario(
    input: string,
    description?: string
  ): Promise<ScenarioMatchResult> {
    // 合并输入文本
    const fullText = `${input} ${description || ''}`.toLowerCase();
    
    // 提取关键词
    const extractedKeywords = this.extractKeywords(fullText);
    
    // 匹配预设场景
    const matchedScenario = this.findBestMatchingScenario(fullText, extractedKeywords);
    
    // 如果找到高置信度匹配，直接返回
    if (matchedScenario.confidence > 0.5) {
      return matchedScenario;
    }
    
    // 否则进行动态场景分析
    return this.analyzeDynamicScenario(fullText, extractedKeywords);
  }

  /**
   * 获取所有预设场景
   */
  getPresetScenarios(): PresetScenario[] {
    return this.presetScenarios;
  }

  /**
   * 根据ID获取预设场景
   */
  getPresetScenario(id: string): PresetScenario | undefined {
    return this.presetScenarios.find(s => s.id === id);
  }

  /**
   * 提取关键词
   */
  extractKeywords(text: string): string[] {
    const keywords: string[] = [];
    const textLower = text.toLowerCase();
    
    // 从关键词权重表中提取
    for (const [keyword, weight] of this.keywordWeights) {
      if (textLower.includes(keyword)) {
        keywords.push(keyword);
      }
    }
    
    // 从预设场景关键词中提取
    for (const scenario of this.presetScenarios) {
      for (const keyword of scenario.keywords) {
        if (textLower.includes(keyword.toLowerCase()) && !keywords.includes(keyword)) {
          keywords.push(keyword);
        }
      }
    }
    
    return [...new Set(keywords)];
  }

  /**
   * 计算场景匹配得分
   */
  calculateScenarioScore(
    text: string,
    scenario: PresetScenario,
    extractedKeywords: string[]
  ): number {
    let score = 0;
    const textLower = text.toLowerCase();
    
    // 关键词匹配得分
    for (const keyword of scenario.keywords) {
      if (textLower.includes(keyword.toLowerCase())) {
        score += 0.15;
      }
    }
    
    // 提取关键词与场景关键词重叠
    const keywordOverlap = extractedKeywords.filter(k => 
      scenario.keywords.some(sk => sk.toLowerCase() === k.toLowerCase())
    );
    score += keywordOverlap.length * 0.1;
    
    // 能力匹配
    for (const capability of scenario.requiredCapabilities) {
      if (textLower.includes(capability.toLowerCase())) {
        score += 0.2;
      }
    }
    
    // 价格敏感度匹配
    if (scenario.priceSensitive) {
      if (textLower.includes('免费') || textLower.includes('便宜') || textLower.includes('预算')) {
        score += 0.15;
      }
    }
    
    return Math.min(1, score);
  }

  // ===========================================================================
  // Private Methods
  // ===========================================================================

  /**
   * 查找最佳匹配的预设场景
   */
  private findBestMatchingScenario(
    text: string,
    extractedKeywords: string[]
  ): ScenarioMatchResult {
    let bestMatch: ScenarioMatchResult | null = null;
    let highestScore = 0;

    for (const scenario of this.presetScenarios) {
      const score = this.calculateScenarioScore(text, scenario, extractedKeywords);
      
      if (score > highestScore) {
        highestScore = score;
        bestMatch = {
          scenarioId: scenario.id,
          scenarioName: scenario.name,
          confidence: score,
          requiredCapabilities: scenario.requiredCapabilities,
          preferredCategories: scenario.preferredCategories,
          priceSensitive: scenario.priceSensitive,
          extractedKeywords,
          matchReasons: this.generateMatchReasons(text, scenario, extractedKeywords),
        };
      }
    }

    // 如果没有找到好的匹配，返回默认场景
    if (!bestMatch) {
      return {
        scenarioId: 'general',
        scenarioName: '通用场景',
        confidence: 0.3,
        requiredCapabilities: ['text_generation'],
        preferredCategories: [],
        priceSensitive: false,
        extractedKeywords,
        matchReasons: ['基于您的需求进行通用推荐'],
      };
    }

    return bestMatch;
  }

  /**
   * 动态场景分析
   * 当预设场景匹配度不高时，动态分析用户需求
   */
  private analyzeDynamicScenario(
    text: string,
    extractedKeywords: string[]
  ): ScenarioMatchResult {
    const textLower = text.toLowerCase();
    
    // 分析能力需求
    const requiredCapabilities: string[] = [];
    if (textLower.includes('文本') || textLower.includes('对话') || textLower.includes('写作')) {
      requiredCapabilities.push('text_generation');
    }
    if (textLower.includes('代码') || textLower.includes('编程')) {
      requiredCapabilities.push('code_generation');
    }
    if (textLower.includes('图像') || textLower.includes('图片') || textLower.includes('绘画')) {
      requiredCapabilities.push('image_generation');
    }
    if (textLower.includes('语音') || textLower.includes('音频')) {
      if (textLower.includes('识别') || textLower.includes('转文字')) {
        requiredCapabilities.push('speech_recognition');
      }
      if (textLower.includes('合成') || textLower.includes('朗读')) {
        requiredCapabilities.push('speech_synthesis');
      }
    }
    if (textLower.includes('视频')) {
      requiredCapabilities.push('video_generation');
    }
    if (textLower.includes('翻译')) {
      requiredCapabilities.push('translation');
    }
    
    // 默认能力
    if (requiredCapabilities.length === 0) {
      requiredCapabilities.push('text_generation');
    }
    
    // 分析价格敏感度
    const priceSensitive = 
      textLower.includes('免费') || 
      textLower.includes('便宜') || 
      textLower.includes('预算') ||
      textLower.includes('低成本');
    
    // 分析类别偏好
    const preferredCategories = this.inferCategories(textLower, extractedKeywords);
    
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

  /**
   * 推断类别偏好
   */
  private inferCategories(text: string, keywords: string[]): string[] {
    const categories: string[] = [];
    
    if (text.includes('客服') || text.includes('对话')) {
      categories.push('chatbot', 'customer-service');
    }
    if (text.includes('编程') || text.includes('代码')) {
      categories.push('code-assistant', 'developer-tools');
    }
    if (text.includes('设计') || text.includes('创意')) {
      categories.push('creative-tools', 'design');
    }
    if (text.includes('营销') || text.includes('推广')) {
      categories.push('marketing', 'content-creation');
    }
    if (text.includes('数据') || text.includes('分析')) {
      categories.push('data-analysis', 'analytics');
    }
    
    return categories;
  }

  /**
   * 生成匹配理由
   */
  private generateMatchReasons(
    text: string,
    scenario: PresetScenario,
    extractedKeywords: string[]
  ): string[] {
    const reasons: string[] = [];
    
    // 场景名称匹配
    reasons.push(`匹配场景: ${scenario.name}`);
    
    // 关键词匹配
    const matchedKeywords = scenario.keywords.filter(k => 
      text.toLowerCase().includes(k.toLowerCase())
    );
    if (matchedKeywords.length > 0) {
      reasons.push(`关键词匹配: ${matchedKeywords.slice(0, 3).join(', ')}`);
    }
    
    // 能力需求
    if (scenario.requiredCapabilities.length > 0) {
      reasons.push(`需要能力: ${scenario.requiredCapabilities.join(', ')}`);
    }
    
    // 价格敏感
    if (scenario.priceSensitive) {
      reasons.push('关注价格因素');
    }
    
    return reasons;
  }

  /**
   * 生成动态分析理由
   */
  private generateDynamicReasons(
    capabilities: string[],
    priceSensitive: boolean,
    keywords: string[]
  ): string[] {
    const reasons: string[] = [];
    
    reasons.push('基于您的描述进行智能分析');
    
    if (capabilities.length > 0) {
      const capabilityNames: Record<string, string> = {
        'text_generation': '文本生成',
        'code_generation': '代码生成',
        'image_generation': '图像生成',
        'speech_recognition': '语音识别',
        'speech_synthesis': '语音合成',
        'video_generation': '视频生成',
        'translation': '翻译',
      };
      const names = capabilities.map(c => capabilityNames[c] || c);
      reasons.push(`检测到需求: ${names.join(', ')}`);
    }
    
    if (priceSensitive) {
      reasons.push('优先推荐免费或低成本方案');
    }
    
    if (keywords.length > 0) {
      reasons.push(`相关关键词: ${keywords.slice(0, 5).join(', ')}`);
    }
    
    return reasons;
  }
}

// =============================================================================
// Export Singleton Instance
// =============================================================================

let scenarioMatcherInstance: ScenarioMatcher | null = null;

export function getScenarioMatcher(): ScenarioMatcher {
  if (!scenarioMatcherInstance) {
    scenarioMatcherInstance = new ScenarioMatcher();
  }
  return scenarioMatcherInstance;
}

export default ScenarioMatcher;
