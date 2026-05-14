/**
 * 能力标签生成脚本
 * 
 * 为 AI API Compass 项目的工具自动标注能力标签
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// 类型定义
// ============================================================================

type Capability = 
  | 'text_generation'
  | 'code_generation'
  | 'image_generation'
  | 'video_generation'
  | 'audio_generation'
  | 'multimodal'
  | 'function_calling'
  | 'streaming'
  | 'vision'
  | 'retrieval'
  | 'fine_tuning';

type Modality = 'text' | 'image' | 'audio' | 'video' | 'code';

type Source = 'auto' | 'manual' | 'simulated';

interface ToolData {
  category: string;
  name: string;
  slug: string;
  url: string;
  description: string;
  developer?: string;
}

interface CapabilityData {
  toolRid: string;
  capabilities: Capability[];
  modalities: Modality[];
  source: Source;
}

interface SeedData {
  ontologyRid: string;
  categories: Array<{
    name: string;
    slug: string;
    description: string;
  }>;
  tools: ToolData[];
}

// ============================================================================
// 分类到能力的映射
// ============================================================================

const CATEGORY_CAPABILITY_MAP: Record<string, Capability[]> = {
  'AI写作工具': ['text_generation', 'streaming'],
  'AI绘画工具': ['image_generation', 'vision'],
  'AI视频生成': ['video_generation', 'image_generation'],
  'AI生成PPT': ['text_generation', 'image_generation'],
  'AI设计工具': ['image_generation', 'text_generation'],
  'AI智能助手': ['text_generation', 'function_calling', 'streaming', 'multimodal'],
  'AI音乐生成': ['audio_generation', 'text_generation'],
  'Agents开发平台': ['code_generation', 'text_generation', 'function_calling'],
  'AI编程工具': ['code_generation', 'text_generation', 'streaming'],
  'AI应用接口API': ['text_generation', 'function_calling', 'streaming', 'fine_tuning'],
};

// ============================================================================
// 分类到模态的映射
// ============================================================================

const CATEGORY_MODALITY_MAP: Record<string, Modality[]> = {
  'AI写作工具': ['text'],
  'AI绘画工具': ['image', 'text'],
  'AI视频生成': ['video', 'image', 'text'],
  'AI生成PPT': ['text', 'image'],
  'AI设计工具': ['image', 'text'],
  'AI智能助手': ['text', 'image', 'audio'],
  'AI音乐生成': ['audio', 'text'],
  'Agents开发平台': ['text', 'code'],
  'AI编程工具': ['code', 'text'],
  'AI应用接口API': ['text', 'code', 'image', 'audio'],
};

// ============================================================================
// 名称关键词到能力的映射
// ============================================================================

const NAME_KEYWORD_CAPABILITY_MAP: Array<{
  keywords: string[];
  capabilities: Capability[];
  modalities: Modality[];
}> = [
  // 代码相关
  {
    keywords: ['code', 'coder', 'dev', 'programming', '编程', '代码', 'cursor', 'copilot', 'replit', 'codeium', 'continue', 'tabnine', 'aixcoder', '通义灵码', 'baidu-coder', 'ai-xcoder'],
    capabilities: ['code_generation', 'text_generation'],
    modalities: ['code', 'text']
  },
  // 图像相关
  {
    keywords: ['image', 'photo', 'picture', 'art', 'design', '绘画', '绘图', '图片', 'midjourney', 'stable', 'dall', 'flux', 'ideogram', 'leonardo', 'liblib', '即梦', '堆友', '通义万象', '文心一格', '美图', '稿定', '创客贴', 'canva', 'figma', 'remove.bg', 'clipdrop', 'playground', 'nightcafe', 'civitai', 'tensor.art', 'seaart', 'yodayo', 'picasso', 'vector', 'icon', 'logo'],
    capabilities: ['image_generation', 'vision'],
    modalities: ['image', 'text']
  },
  // 视频相关
  {
    keywords: ['video', 'movie', 'clip', '视频', 'sora', 'runway', 'pika', '可灵', 'vidu', 'luma', 'heygen', '数字人', 'd-id', 'synthesia', 'descript', '剪映', '必剪', '来画', '万兴', 'wondershare', 'filmora', 'topaz', 'capcut', 'lumen5', 'invideo', 'pictory', 'elai', 'd-id', 'rephrase', 'bhuman', 'synths', 'hourone'],
    capabilities: ['video_generation', 'image_generation'],
    modalities: ['video', 'image', 'text']
  },
  // 音频相关
  {
    keywords: ['audio', 'speech', 'voice', 'tts', '音乐', '语音', '音频', 'suno', 'udio', 'elevenlabs', 'fish', 'gpt-sovits', 'murf', 'lovo', 'resemble', 'descript', 'assemblyai', 'whisper', 'speechify', 'play.ht', 'bark', 'valls', 'azure-speech', 'google-tts', 'amazon-polly', '讯飞', '百度语音', '阿里云语音', '腾讯云语音'],
    capabilities: ['audio_generation', 'text_generation'],
    modalities: ['audio', 'text']
  },
  // 对话/聊天相关
  {
    keywords: ['chat', 'talk', 'conversation', 'dialog', '对话', '聊天', '助手', 'assistant', 'chatgpt', 'claude', 'gemini', '千问', '文心', '通义', 'kimi', '豆包', 'deepseek', '智谱', 'doubao', 'poe', 'perplexity', 'you.com', 'phind', 'nomic', 'pi', 'character', 'chai', 'janitor', 'candy', 'muah', 'crushon'],
    capabilities: ['text_generation', 'function_calling', 'streaming'],
    modalities: ['text']
  },
  // API/模型服务
  {
    keywords: ['api', 'model', 'llm', 'gpt', 'openai', 'anthropic', 'hugging', 'replicate', 'together', 'groq', 'bedrock', 'azure', '硅基流动', '智谱ai', '百川', 'minimax', 'moonshot', 'yi', 'baichuan', 'xverse', 'internlm', 'qwen', 'deepseek-api', 'cohere', 'mistral', 'inflection', 'ai21', 'aleph', 'stability'],
    capabilities: ['text_generation', 'function_calling', 'streaming', 'fine_tuning'],
    modalities: ['text', 'code']
  },
  // PPT/演示相关
  {
    keywords: ['ppt', 'slide', '演示', 'gamma', 'beautiful', 'tome', 'mindshow', 'slidesai', 'pitch', 'beautiful.ai', 'slidesgo', 'canva-ppt', 'powerpoint', 'keynote', 'prezi', 'pitch.com', 'sendsteps', 'presentations'],
    capabilities: ['text_generation', 'image_generation'],
    modalities: ['text', 'image']
  },
  // 搜索/检索相关
  {
    keywords: ['search', '检索', '搜索', 'perplexity', '秘塔', 'tiangong', '天工', 'metaso', 'consensus', 'elicit', 'semanticscholar', 'connected-papers', 'research-rabbit', 'scite', 'scholarcy', 'scholar', 'you.com', 'phind', 'komo', 'andisearch'],
    capabilities: ['text_generation', 'retrieval', 'streaming'],
    modalities: ['text']
  },
  // 写作相关
  {
    keywords: ['write', 'writing', '写作', '文案', 'notion', 'jasper', 'copy', '蛙蛙', '笔灵', '秘塔写作', 'copy.ai', 'writesonic', 'rytr', 'sudowrite', 'novelai', 'sudowrite', 'anyword', 'wordtune', 'grammarly', 'quillbot', 'outwrite', 'prowritingaid', 'hemingway', 'paperpal', 'wordai', 'articleforge', 'contentbot', 'copySmith', 'longshot', 'contentatscale'],
    capabilities: ['text_generation', 'streaming'],
    modalities: ['text']
  },
  // Agent/自动化
  {
    keywords: ['agent', 'automation', 'workflow', '自动', 'dify', 'coze', 'langchain', 'autogpt', 'gpt-engineer', 'babyagi', 'autoGen', 'crewai', 'metagpt', 'agentgpt', 'godmode', 'n8n', 'zapier', 'make', 'ifttt', 'relevance', 'stack', 'reworkd', 'superagent', 'agent-protocol'],
    capabilities: ['code_generation', 'text_generation', 'function_calling'],
    modalities: ['text', 'code']
  },
  // 多模态
  {
    keywords: ['multimodal', '多模态', 'vision', '视觉', 'gpt-4v', 'gemini-pro-vision', 'claude-vision', 'llava', 'qwen-vl', 'cogvlm', 'yi-vl', 'internvl', 'deepseek-vl'],
    capabilities: ['multimodal', 'vision', 'text_generation'],
    modalities: ['text', 'image', 'audio', 'video']
  },
  // 设计相关
  {
    keywords: ['design', 'ui', 'ux', 'figma', 'canva', '稿定', '创客贴', '美图', 'sketch', 'adobe', 'photoshop', 'illustrator', 'xd', 'framer', 'webflow', 'squarespace', 'wix', 'durable', '10web', 'divi', 'elementor', 'brizy', 'pinegrow', 'bootstrap'],
    capabilities: ['image_generation', 'text_generation'],
    modalities: ['image', 'text']
  },
  // 翻译
  {
    keywords: ['translate', 'translation', '翻译', 'deepl', 'google-translate', 'baidu-translate', '有道', '腾讯翻译', 'papago', 'systran', 'smartling', 'phrase', 'lokalise', 'crowdin', 'transifex'],
    capabilities: ['text_generation', 'streaming'],
    modalities: ['text']
  },
  // 数据分析
  {
    keywords: ['data', 'analytics', 'analysis', '数据', '分析', 'tableau', 'powerbi', 'looker', 'metabase', 'superset', 'grafana', 'kibana', 'julius', 'obviously', 'jupyter', 'colab', 'kaggle', 'h2o', 'dataiku', 'databricks'],
    capabilities: ['text_generation', 'code_generation'],
    modalities: ['text', 'code']
  },
  // 电商
  {
    keywords: ['电商', '商品', 'shop', 'store', 'commerce', '淘宝', '京东', '拼多多', 'shopify', 'woocommerce', 'magento', 'bigcommerce', 'squarespace-commerce', 'wix-stores', 'ecwid', 'sellfy', 'gumroad'],
    capabilities: ['text_generation', 'image_generation'],
    modalities: ['text', 'image']
  },
  // 营销
  {
    keywords: ['marketing', '营销', '推广', 'ad', '广告', 'seo', 'sem', 'hubspot', 'mailchimp', 'klaviyo', 'activecampaign', 'convertkit', 'mailerlite', 'sendinblue', 'brevo', 'omnisend', 'drip', 'aweber', 'getresponse'],
    capabilities: ['text_generation', 'image_generation'],
    modalities: ['text', 'image']
  },
  // 教育/学习
  {
    keywords: ['edu', 'learn', 'teach', '教育', '学习', 'course', 'quiz', '考试', '作业', 'duolingo', 'khan', 'coursera', 'udemy', 'edx', 'skillshare', 'brilliant', 'photomath', 'socratic', 'wolfram', 'gradescope', 'turnitin', 'grammarly-edu'],
    capabilities: ['text_generation', 'streaming'],
    modalities: ['text']
  },
  // 会议/协作
  {
    keywords: ['meet', 'meeting', '会议', '协作', 'collab', 'zoom', 'teams', 'slack', 'notion', 'coda', 'airtable', 'clickup', 'asana', 'monday', 'trello', 'jira', 'linear', 'basecamp', 'miro', 'lucid', 'figjam', 'mural'],
    capabilities: ['text_generation', 'audio_generation'],
    modalities: ['text', 'audio']
  },
  // 法律
  {
    keywords: ['legal', 'law', '法律', '律师', 'contract', '合同', 'doNotPay', 'legalzoom', 'rocketlawyer', 'casetext', 'ross', 'lawgeex', 'ironclad', 'juro', 'docuSign', 'hellosign'],
    capabilities: ['text_generation', 'retrieval'],
    modalities: ['text']
  },
  // 医疗
  {
    keywords: ['medical', 'health', '医疗', '健康', '诊断', 'doctor', 'med', 'clinical', 'pathai', 'tempus', 'babylon', 'ada', 'buoy', 'symptomate', 'isabel', 'medscape', 'uptodate', 'epocrates'],
    capabilities: ['text_generation', 'vision'],
    modalities: ['text', 'image']
  }
];

// ============================================================================
// 能力推断函数
// ============================================================================

function inferCapabilities(tool: ToolData): { capabilities: Capability[]; modalities: Modality[] } {
  const capabilitiesSet = new Set<Capability>();
  const modalitiesSet = new Set<Modality>();

  // 1. 基于分类添加默认能力
  const categoryCapabilities = CATEGORY_CAPABILITY_MAP[tool.category] || ['text_generation'];
  const categoryModalities = CATEGORY_MODALITY_MAP[tool.category] || ['text'];
  
  categoryCapabilities.forEach(cap => capabilitiesSet.add(cap));
  categoryModalities.forEach(mod => modalitiesSet.add(mod));

  // 2. 基于名称关键词推断额外能力
  const nameLower = tool.name.toLowerCase();
  const slugLower = tool.slug.toLowerCase();
  const descriptionLower = (tool.description || '').toLowerCase();
  const combinedText = `${nameLower} ${slugLower} ${descriptionLower}`;

  for (const mapping of NAME_KEYWORD_CAPABILITY_MAP) {
    const hasKeyword = mapping.keywords.some(keyword => 
      combinedText.includes(keyword.toLowerCase())
    );
    
    if (hasKeyword) {
      mapping.capabilities.forEach(cap => capabilitiesSet.add(cap));
      mapping.modalities.forEach(mod => modalitiesSet.add(mod));
    }
  }

  // 3. 特殊规则处理
  
  // 如果有多个模态，添加 multimodal 能力
  if (modalitiesSet.size > 2) {
    capabilitiesSet.add('multimodal');
  }

  // API类工具通常支持 fine_tuning
  if (tool.category === 'AI应用接口API') {
    capabilitiesSet.add('fine_tuning');
  }

  // 智能助手类通常支持 function_calling
  if (tool.category === 'AI智能助手') {
    capabilitiesSet.add('function_calling');
  }

  // 确保至少有一个能力
  if (capabilitiesSet.size === 0) {
    capabilitiesSet.add('text_generation');
  }

  // 确保至少有一个模态
  if (modalitiesSet.size === 0) {
    modalitiesSet.add('text');
  }

  return {
    capabilities: Array.from(capabilitiesSet),
    modalities: Array.from(modalitiesSet)
  };
}

// ============================================================================
// 主函数
// ============================================================================

async function main() {
  console.log('开始生成能力标签数据...\n');

  // 读取种子数据
  const seedDataPath = path.join(__dirname, 'aigc_tools_data.json');
  const seedDataRaw = fs.readFileSync(seedDataPath, 'utf-8');
  const seedData: SeedData = JSON.parse(seedDataRaw);

  console.log(`读取到 ${seedData.tools.length} 个工具`);
  console.log(`分类数量: ${seedData.categories.length}\n`);

  // 生成能力数据
  const capabilitiesData: CapabilityData[] = [];
  const stats = {
    total: 0,
    byCategory: {} as Record<string, number>,
    avgCapabilities: 0,
    avgModalities: 0,
    capabilityCounts: {} as Record<string, number>,
    modalityCounts: {} as Record<string, number>,
    minCapabilities: Infinity,
    maxCapabilities: 0,
    toolsWithLowCapabilities: [] as string[]
  };

  let totalCapabilities = 0;
  let totalModalities = 0;

  for (const tool of seedData.tools) {
    const { capabilities, modalities } = inferCapabilities(tool);
    
    const capabilityData: CapabilityData = {
      toolRid: `ri.aigc.main.object.aigc-tool.${tool.slug}`,
      capabilities,
      modalities,
      source: 'auto'
    };

    capabilitiesData.push(capabilityData);

    // 统计
    stats.total++;
    stats.byCategory[tool.category] = (stats.byCategory[tool.category] || 0) + 1;
    totalCapabilities += capabilities.length;
    totalModalities += modalities.length;

    // 追踪最小/最大能力数
    if (capabilities.length < stats.minCapabilities) {
      stats.minCapabilities = capabilities.length;
    }
    if (capabilities.length > stats.maxCapabilities) {
      stats.maxCapabilities = capabilities.length;
    }

    // 记录能力数较低的工具
    if (capabilities.length < 3) {
      stats.toolsWithLowCapabilities.push(tool.name);
    }

    for (const cap of capabilities) {
      stats.capabilityCounts[cap] = (stats.capabilityCounts[cap] || 0) + 1;
    }
    for (const mod of modalities) {
      stats.modalityCounts[mod] = (stats.modalityCounts[mod] || 0) + 1;
    }
  }

  stats.avgCapabilities = totalCapabilities / stats.total;
  stats.avgModalities = totalModalities / stats.total;

  // 输出统计信息
  console.log('=== 生成统计 ===\n');
  console.log(`总工具数: ${stats.total}`);
  console.log(`平均能力数: ${stats.avgCapabilities.toFixed(2)}`);
  console.log(`平均模态数: ${stats.avgModalities.toFixed(2)}`);
  console.log(`最小能力数: ${stats.minCapabilities}`);
  console.log(`最大能力数: ${stats.maxCapabilities}\n`);

  console.log('按分类统计:');
  for (const [category, count] of Object.entries(stats.byCategory)) {
    console.log(`  ${category}: ${count} 个工具`);
  }
  console.log();

  console.log('能力分布:');
  const sortedCapabilities = Object.entries(stats.capabilityCounts)
    .sort((a, b) => b[1] - a[1]);
  for (const [cap, count] of sortedCapabilities) {
    const percentage = ((count / stats.total) * 100).toFixed(1);
    console.log(`  ${cap}: ${count} (${percentage}%)`);
  }
  console.log();

  console.log('模态分布:');
  const sortedModalities = Object.entries(stats.modalityCounts)
    .sort((a, b) => b[1] - a[1]);
  for (const [mod, count] of sortedModalities) {
    const percentage = ((count / stats.total) * 100).toFixed(1);
    console.log(`  ${mod}: ${count} (${percentage}%)`);
  }
  console.log();

  // 验证
  const toolsWithNoCapabilities = capabilitiesData.filter(d => d.capabilities.length === 0);
  if (toolsWithNoCapabilities.length > 0) {
    console.log(`警告: ${toolsWithNoCapabilities.length} 个工具没有能力标签!`);
  } else {
    console.log('验证通过: 所有工具都至少有 1 个能力标签');
  }

  // 检查能力数是否在合理范围
  if (stats.avgCapabilities >= 3 && stats.avgCapabilities <= 5) {
    console.log('验证通过: 平均能力数在 3-5 范围内');
  } else {
    console.log(`注意: 平均能力数 ${stats.avgCapabilities.toFixed(2)} 不在推荐的 3-5 范围内`);
  }

  // 写入输出文件
  const outputDir = path.join(__dirname, '../data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'capabilities_data.json');
  fs.writeFileSync(outputPath, JSON.stringify(capabilitiesData, null, 2), 'utf-8');

  console.log(`\n数据已保存到: ${outputPath}`);
  console.log('完成!');
}

main().catch(console.error);
