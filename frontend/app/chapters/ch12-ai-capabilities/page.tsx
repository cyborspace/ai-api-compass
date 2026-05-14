"use client";

import { useState } from "react";
import {
  Cpu,
  ChevronRight,
  Brain,
  Code,
  Zap,
  Search,
  Database,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Eye,
  Shield,
  Lock,
  BarChart3,
  Image,
  MessageSquare,
  Network,
  GitBranch,
  Globe,
  AlertTriangle,
  Layers,
  FileText,
  Target,
} from "lucide-react";
import Link from "next/link";

// =============================================================================
// Data
// =============================================================================

const LLM_CAPABILITIES = [
  { name: "对话生成", score: 95, icon: Brain, color: "#ff3b30" },
  { name: "Function Calling", score: 90, icon: Code, color: "#ff9f0a" },
  { name: "代码生成", score: 85, icon: Code, color: "#30d158" },
  { name: "推理分析", score: 88, icon: Brain, color: "#0a84ff" },
  { name: "多语言", score: 92, icon: Brain, color: "#bf5af2" },
  { name: "RAG", score: 87, icon: Search, color: "#64d2ff" },
];

const ML_TYPES = [
  {
    name: "监督学习",
    description: "使用标记数据训练模型",
    examples: "分类、回归",
    icon: Target,
    color: "#ff3b30",
  },
  {
    name: "无监督学习",
    description: "使用未标记数据发现模式",
    examples: "聚类、降维",
    icon: Eye,
    color: "#ff9f0a",
  },
  {
    name: "强化学习",
    description: "通过试错学习最优策略",
    examples: "游戏 AI、推荐系统",
    icon: Zap,
    color: "#30d158",
  },
];

const ML_ALGORITHMS = [
  { name: "线性回归", type: "监督学习", scenario: "价格预测", icon: BarChart3, color: "#ff3b30" },
  { name: "逻辑回归", type: "监督学习", scenario: "二分类问题", icon: BarChart3, color: "#ff9f0a" },
  { name: "决策树", type: "监督学习", scenario: "规则提取", icon: GitBranch, color: "#30d158" },
  { name: "随机森林", type: "监督学习", scenario: "分类、回归", icon: GitBranch, color: "#0a84ff" },
  { name: "支持向量机", type: "监督学习", scenario: "文本分类", icon: Code, color: "#bf5af2" },
  { name: "K-Means", type: "无监督学习", scenario: "客户分群", icon: Network, color: "#64d2ff" },
  { name: "PCA", type: "无监督学习", scenario: "降维", icon: Layers, color: "#ff453a" },
];

const DL_TYPES = [
  { name: "CNN", full: "卷积神经网络", scenario: "图像识别", color: "#ff3b30" },
  { name: "RNN", full: "循环神经网络", scenario: "序列数据", color: "#ff9f0a" },
  { name: "LSTM", full: "长短期记忆网络", scenario: "时间序列预测", color: "#30d158" },
  { name: "Transformer", full: "注意力机制", scenario: "NLP", color: "#0a84ff" },
  { name: "GAN", full: "生成对抗网络", scenario: "图像生成", color: "#bf5af2" },
];

const NLP_TASKS = [
  { task: "分词", description: "将文本拆分为单词", example: '"Hello World" → ["Hello", "World"]', color: "#ff3b30" },
  { task: "词性标注", description: "标注单词的词性", example: '"Hello" → 感叹词', color: "#ff9f0a" },
  { task: "命名实体识别", description: "识别文本中的实体", example: '"Apple" → 组织', color: "#30d158" },
  { task: "情感分析", description: "分析文本的情感倾向", example: '"Great!" → 正面', color: "#0a84ff" },
  { task: "机器翻译", description: "将文本翻译成另一种语言", example: '"Hello" → "你好"', color: "#bf5af2" },
  { task: "问答系统", description: "回答用户的问题", example: '"What is AI?" → "AI is..."', color: "#64d2ff" },
];

const RECOMMENDATION_TYPES = [
  { name: "协同过滤", description: "基于用户行为推荐", example: "用户A和用户B都喜欢X，推荐Y给用户A", color: "#ff3b30" },
  { name: "内容推荐", description: "基于内容特征推荐", example: "用户喜欢A，推荐与A相似的B", color: "#ff9f0a" },
  { name: "混合推荐", description: "结合多种推荐方法", example: "协同过滤 + 内容推荐", color: "#30d158" },
];

const NLP_APPLICATIONS = [
  { name: "文本分类", description: "将文本分类到预定义类别", example: "情感分析", color: "#ff3b30" },
  { name: "文本生成", description: "生成新的文本", example: "文章生成", color: "#ff9f0a" },
  { name: "文本摘要", description: "生成文本的摘要", example: "新闻摘要", color: "#30d158" },
  { name: "问答系统", description: "回答用户的问题", example: "智能客服", color: "#0a84ff" },
  { name: "对话系统", description: "与用户进行对话", example: "聊天机器人", color: "#bf5af2" },
];

const CV_TASKS = [
  { task: "图像分类", description: "将图像分类到预定义类别", example: "猫狗分类", color: "#ff3b30" },
  { task: "目标检测", description: "检测图像中的目标", example: "人脸检测", color: "#ff9f0a" },
  { task: "图像分割", description: "将图像分割成多个区域", example: "语义分割", color: "#30d158" },
  { task: "图像生成", description: "生成新的图像", example: "图像合成", color: "#0a84ff" },
];

const ETHICS_PRINCIPLES = [
  { principle: "公平性", description: "AI 系统应该公平对待所有人", example: "避免算法偏见", color: "#ff3b30" },
  { principle: "透明性", description: "AI 系统应该透明可解释", example: "解释模型决策", color: "#ff9f0a" },
  { principle: "隐私保护", description: "AI 系统应该保护用户隐私", example: "数据脱敏", color: "#30d158" },
  { principle: "安全性", description: "AI 系统应该安全可靠", example: "防止模型被攻击", color: "#0a84ff" },
  { principle: "可控性", description: "AI 系统应该可控", example: "人类可以干预", color: "#bf5af2" },
];

const BIAS_SOURCES = [
  { source: "数据偏见", description: "训练数据存在偏见", solution: "数据增强、重采样", color: "#ff3b30" },
  { source: "算法偏见", description: "算法本身存在偏见", solution: "公平性约束", color: "#ff9f0a" },
  { source: "交互偏见", description: "用户交互产生偏见", solution: "多样性推荐", color: "#30d158" },
];

const EXPLAINABILITY_METHODS = [
  { method: "特征重要性", description: "显示特征对预测的贡献", example: "SHAP 值", color: "#ff3b30" },
  { method: "局部解释", description: "解释单个预测", example: "LIME", color: "#ff9f0a" },
  { method: "全局解释", description: "解释整个模型", example: "决策树可视化", color: "#30d158" },
];

const SECURITY_THREATS = [
  { threat: "对抗样本", description: "输入微小扰动导致错误预测", defense: "对抗训练", color: "#ff3b30" },
  { threat: "模型窃取", description: "通过查询窃取模型", defense: "查询限制", color: "#ff9f0a" },
  { threat: "数据投毒", description: "污染训练数据", defense: "数据验证", color: "#30d158" },
];

const DATA_SECURITY_MEASURES = [
  { measure: "数据加密", description: "加密敏感数据", example: "AES 加密", color: "#ff3b30" },
  { measure: "数据脱敏", description: "隐藏敏感信息", example: "姓名脱敏", color: "#ff9f0a" },
  { measure: "访问控制", description: "限制数据访问", example: "RBAC", color: "#30d158" },
  { measure: "审计日志", description: "记录数据访问", example: "日志监控", color: "#0a84ff" },
];

const PRIVACY_TECHNIQUES = [
  { technique: "差分隐私", description: "添加噪声保护隐私", example: "拉普拉斯噪声", color: "#ff3b30" },
  { technique: "联邦学习", description: "分布式训练保护数据", example: "横向联邦学习", color: "#ff9f0a" },
  { technique: "同态加密", description: "加密状态下计算", example: "全同态加密", color: "#30d158" },
];

const AI_ONTOLOGY_ENHANCEMENT = [
  { method: "自动分类", description: "自动将对象分类", example: "工具自动分类", color: "#ff3b30" },
  { method: "关系发现", description: "自动发现对象关系", example: "发现工具相似性", color: "#ff9f0a" },
  { method: "属性补全", description: "自动补全缺失属性", example: "补全工具描述", color: "#30d158" },
  { method: "异常检测", description: "检测异常对象", example: "检测异常评价", color: "#0a84ff" },
];

const ONTOLOGY_DRIVEN_AI = [
  { method: "知识图谱", description: "使用 Ontology 构建知识图谱", example: "工具知识图谱", color: "#ff3b30" },
  { method: "推理引擎", description: "使用 Ontology 进行推理", example: "工具推荐推理", color: "#ff9f0a" },
  { method: "语义搜索", description: "使用 Ontology 进行语义搜索", example: "工具语义搜索", color: "#30d158" },
];

const RAG_ARCHITECTURE = [
  { step: "用户查询", description: "输入自然语言问题", icon: Brain, color: "#ff3b30", type: "input" },
  { step: "查询向量化", description: "将查询转换为向量", icon: Code, color: "#ff9f0a", type: "process" },
  { step: "向量检索", description: "从向量数据库检索相关文档", icon: Search, color: "#30d158", type: "data" },
  { step: "上下文构建", description: "将检索结果构建为上下文", icon: Database, color: "#0a84ff", type: "process" },
  { step: "LLM 生成", description: "基于上下文生成回答", icon: Brain, color: "#bf5af2", type: "output" },
];

const FUNCTION_CALLING_STEPS = [
  { step: "用户请求", content: "推荐适合处理 PDF 的 AI 工具", type: "input" },
  { step: "意图识别", content: "识别为场景推荐请求", type: "process" },
  { step: "函数选择", content: "选择 getRecommendations 函数", type: "action" },
  { step: "参数提取", content: "提取参数: {scenario: 'pdf-processing'}", type: "process" },
  { step: "函数执行", content: "调用函数，查询 Ontology", type: "action" },
  { step: "结果返回", content: "返回推荐结果给 LLM", type: "data" },
  { step: "回答生成", content: "生成自然语言回答", type: "output" },
];

// =============================================================================
// Components
// =============================================================================

function SectionHeader({ icon: Icon, title, color }: { icon: React.ElementType; title: string; color: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <h2 className="text-base font-semibold text-[#f5f5f7]">{title}</h2>
    </div>
  );
}

function CapabilityMatrix() {
  return (
    <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
      <h3 className="text-sm font-semibold text-[#f5f5f7] mb-4">LLM 能力矩阵</h3>
      <div className="space-y-3">
        {LLM_CAPABILITIES.map((cap) => {
          const Icon = cap.icon;
          return (
            <div key={cap.name}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5" style={{ color: cap.color }} />
                  <span className="text-xs text-[#8e8e93]">{cap.name}</span>
                </div>
                <span className="text-xs text-[#f5f5f7] font-medium">{cap.score}%</span>
              </div>
              <div className="h-2 bg-[#2c2c2e] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${cap.score}%`, backgroundColor: cap.color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MlTypesCard() {
  return (
    <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
      <h3 className="text-sm font-semibold text-[#f5f5f7] mb-4">机器学习类型</h3>
      <div className="grid grid-cols-1 gap-3">
        {ML_TYPES.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.name} className="p-3 rounded-lg bg-[#141416] border border-[#2c2c2e]">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${item.color}15` }}>
                  <Icon className="w-4 h-4" style={{ color: item.color }} />
                </div>
                <div>
                  <div className="text-xs font-medium text-[#f5f5f7]">{item.name}</div>
                  <div className="text-[10px] text-[#8e8e93] mt-0.5">{item.description}</div>
                  <div className="text-[10px] text-[#636366] mt-0.5">示例: {item.examples}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MlAlgorithmsGrid() {
  return (
    <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
      <h3 className="text-sm font-semibold text-[#f5f5f7] mb-4">常见算法</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {ML_ALGORITHMS.map((alg) => {
          const Icon = alg.icon;
          return (
            <div key={alg.name} className="p-3 rounded-lg bg-[#141416] border border-[#2c2c2e] hover:border-[#3a3a3c] transition-all group">
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-3.5 h-3.5" style={{ color: alg.color }} />
                <span className="text-xs font-medium text-[#f5f5f7]">{alg.name}</span>
              </div>
              <div className="text-[10px] text-[#8e8e93]">{alg.type}</div>
              <div className="text-[10px] text-[#636366] mt-0.5">场景: {alg.scenario}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DeepLearningTypes() {
  return (
    <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
      <h3 className="text-sm font-semibold text-[#f5f5f7] mb-4">深度学习神经网络类型</h3>
      <div className="space-y-2">
        {DL_TYPES.map((dl) => (
          <div key={dl.name} className="flex items-center gap-3 p-3 rounded-lg bg-[#141416] border border-[#2c2c2e]">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-[#f5f5f7]" style={{ backgroundColor: `${dl.color}20`, color: dl.color }}>
              {dl.name}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-[#f5f5f7]">{dl.full}</div>
              <div className="text-[10px] text-[#8e8e93]">{dl.scenario}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NlpTasksList() {
  return (
    <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
      <h3 className="text-sm font-semibold text-[#f5f5f7] mb-4">NLP 基础任务</h3>
      <div className="space-y-2">
        {NLP_TASKS.map((item) => (
          <div key={item.task} className="flex items-start gap-3 p-3 rounded-lg bg-[#141416] border border-[#2c2c2e]">
            <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ backgroundColor: item.color }} />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-[#f5f5f7]">{item.task}</div>
              <div className="text-[10px] text-[#8e8e93]">{item.description}</div>
              <div className="text-[10px] text-[#636366] font-mono mt-0.5">{item.example}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecommendationSystem() {
  return (
    <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
      <h3 className="text-sm font-semibold text-[#f5f5f7] mb-4">推荐系统类型</h3>
      <div className="space-y-3">
        {RECOMMENDATION_TYPES.map((item) => (
          <div key={item.name} className="p-3 rounded-lg bg-[#141416] border border-[#2c2c2e]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-[#f5f5f7]">{item.name}</span>
              <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: `${item.color}15`, color: item.color }}>{item.example}</span>
            </div>
            <p className="text-[10px] text-[#8e8e93]">{item.description}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 p-3 rounded-lg bg-[#2c2c2e]/30">
        <div className="text-[10px] text-[#30d158] mb-1 font-medium">AI-API-COMPASS 中的应用</div>
        <pre className="text-[10px] text-[#8e8e93] font-mono overflow-x-auto">
{`class RecommendationSystem {
  async recommend(userId, context) {
    const history = await getUserHistory(userId);
    const similar = await getSimilarUsers(userId);
    return generateRecommendations(history, similar, context);
  }
}`}
        </pre>
      </div>
    </div>
  );
}

function NlpApplicationsList() {
  return (
    <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
      <h3 className="text-sm font-semibold text-[#f5f5f7] mb-4">NLP 应用</h3>
      <div className="space-y-2">
        {NLP_APPLICATIONS.map((item) => (
          <div key={item.name} className="flex items-center gap-3 p-3 rounded-lg bg-[#141416] border border-[#2c2c2e]">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${item.color}15` }}>
              <FileText className="w-4 h-4" style={{ color: item.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-[#f5f5f7]">{item.name}</div>
              <div className="text-[10px] text-[#8e8e93]">{item.description}</div>
              <span className="text-[10px] px-1.5 py-0.5 rounded mt-1 inline-block bg-[#2c2c2e] text-[#8e8e93]">{item.example}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ComputerVisionTasks() {
  return (
    <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
      <h3 className="text-sm font-semibold text-[#f5f5f7] mb-4">计算机视觉任务</h3>
      <div className="grid grid-cols-2 gap-3">
        {CV_TASKS.map((item) => (
          <div key={item.task} className="p-3 rounded-lg bg-[#141416] border border-[#2c2c2e]">
            <div className="flex items-center gap-2 mb-1">
              <Image className="w-3.5 h-3.5" style={{ color: item.color }} />
              <span className="text-xs font-medium text-[#f5f5f7]">{item.task}</span>
            </div>
            <div className="text-[10px] text-[#8e8e93]">{item.description}</div>
            <div className="text-[10px] text-[#636366] mt-0.5">示例: {item.example}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AiEthics() {
  return (
    <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
      <h3 className="text-sm font-semibold text-[#f5f5f7] mb-4">AI 伦理原则</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {ETHICS_PRINCIPLES.map((item) => (
          <div key={item.principle} className="p-3 rounded-lg bg-[#141416] border border-[#2c2c2e]">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-3.5 h-3.5" style={{ color: item.color }} />
              <span className="text-xs font-medium text-[#f5f5f7]">{item.principle}</span>
            </div>
            <div className="text-[10px] text-[#8e8e93]">{item.description}</div>
            <div className="text-[10px] text-[#636366] mt-0.5">示例: {item.example}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BiasAndExplainability() {
  const [activeTab, setActiveTab] = useState<"bias" | "explain">("bias");

  return (
    <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
      <div className="flex gap-1 mb-4 bg-[#141416] rounded-lg p-0.5">
        <button
          onClick={() => setActiveTab("bias")}
          className={`flex-1 px-3 py-1.5 rounded text-xs transition-all ${
            activeTab === "bias" ? "bg-[#ff3b30]/20 text-[#ff3b30]" : "text-[#8e8e93]"
          }`}
        >
          AI 偏见来源
        </button>
        <button
          onClick={() => setActiveTab("explain")}
          className={`flex-1 px-3 py-1.5 rounded text-xs transition-all ${
            activeTab === "explain" ? "bg-[#0a84ff]/20 text-[#0a84ff]" : "text-[#8e8e93]"
          }`}
        >
          可解释性方法
        </button>
      </div>

      {activeTab === "bias" ? (
        <div className="space-y-2">
          {BIAS_SOURCES.map((item) => (
            <div key={item.source} className="p-3 rounded-lg bg-[#141416] border border-[#2c2c2e]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-[#f5f5f7]">{item.source}</span>
                <span className="text-[10px] text-[#30d158]">{item.solution}</span>
              </div>
              <div className="text-[10px] text-[#8e8e93]">{item.description}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {EXPLAINABILITY_METHODS.map((item) => (
            <div key={item.method} className="p-3 rounded-lg bg-[#141416] border border-[#2c2c2e]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-[#f5f5f7]">{item.method}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#2c2c2e] text-[#8e8e93]">{item.example}</span>
              </div>
              <div className="text-[10px] text-[#8e8e93]">{item.description}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AiSecurity() {
  const [activeTab, setActiveTab] = useState<"threats" | "data" | "privacy">("threats");

  return (
    <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
      <div className="flex gap-1 mb-4 bg-[#141416] rounded-lg p-0.5 flex-wrap">
        <button onClick={() => setActiveTab("threats")} className={`px-3 py-1.5 rounded text-xs transition-all ${activeTab === "threats" ? "bg-[#ff3b30]/20 text-[#ff3b30]" : "text-[#8e8e93]"}`}>模型威胁</button>
        <button onClick={() => setActiveTab("data")} className={`px-3 py-1.5 rounded text-xs transition-all ${activeTab === "data" ? "bg-[#0a84ff]/20 text-[#0a84ff]" : "text-[#8e8e93]"}`}>数据安全</button>
        <button onClick={() => setActiveTab("privacy")} className={`px-3 py-1.5 rounded text-xs transition-all ${activeTab === "privacy" ? "bg-[#30d158]/20 text-[#30d158]" : "text-[#8e8e93]"}`}>隐私保护</button>
      </div>

      {activeTab === "threats" && (
        <div className="space-y-2">
          {SECURITY_THREATS.map((item) => (
            <div key={item.threat} className="p-3 rounded-lg bg-[#141416] border border-[#2c2c2e]">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5" style={{ color: item.color }} />
                  <span className="text-xs font-medium text-[#f5f5f7]">{item.threat}</span>
                </div>
                <span className="text-[10px] text-[#30d158]">{item.defense}</span>
              </div>
              <div className="text-[10px] text-[#8e8e93]">{item.description}</div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "data" && (
        <div className="space-y-2">
          {DATA_SECURITY_MEASURES.map((item) => (
            <div key={item.measure} className="p-3 rounded-lg bg-[#141416] border border-[#2c2c2e]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-[#f5f5f7]">{item.measure}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#2c2c2e] text-[#8e8e93]">{item.example}</span>
              </div>
              <div className="text-[10px] text-[#8e8e93]">{item.description}</div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "privacy" && (
        <div className="space-y-2">
          {PRIVACY_TECHNIQUES.map((item) => (
            <div key={item.technique} className="p-3 rounded-lg bg-[#141416] border border-[#2c2c2e]">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5" style={{ color: item.color }} />
                  <span className="text-xs font-medium text-[#f5f5f7]">{item.technique}</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#2c2c2e] text-[#8e8e93]">{item.example}</span>
              </div>
              <div className="text-[10px] text-[#8e8e93]">{item.description}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AiOntologyIntegration() {
  const [activeTab, setActiveTab] = useState<"enhance" | "driven">("enhance");

  return (
    <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
      <div className="flex gap-1 mb-4 bg-[#141416] rounded-lg p-0.5">
        <button onClick={() => setActiveTab("enhance")} className={`flex-1 px-3 py-1.5 rounded text-xs transition-all ${activeTab === "enhance" ? "bg-[#ff3b30]/20 text-[#ff3b30]" : "text-[#8e8e93]"}`}>AI 增强 Ontology</button>
        <button onClick={() => setActiveTab("driven")} className={`flex-1 px-3 py-1.5 rounded text-xs transition-all ${activeTab === "driven" ? "bg-[#0a84ff]/20 text-[#0a84ff]" : "text-[#8e8e93]"}`}>Ontology 驱动 AI</button>
      </div>

      {activeTab === "enhance" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {AI_ONTOLOGY_ENHANCEMENT.map((item) => (
            <div key={item.method} className="p-3 rounded-lg bg-[#141416] border border-[#2c2c2e]">
              <div className="flex items-center gap-2 mb-1">
                <Brain className="w-3.5 h-3.5" style={{ color: item.color }} />
                <span className="text-xs font-medium text-[#f5f5f7]">{item.method}</span>
              </div>
              <div className="text-[10px] text-[#8e8e93]">{item.description}</div>
              <div className="text-[10px] text-[#636366] mt-0.5">示例: {item.example}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {ONTOLOGY_DRIVEN_AI.map((item) => (
            <div key={item.method} className="p-3 rounded-lg bg-[#141416] border border-[#2c2c2e]">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Network className="w-3.5 h-3.5" style={{ color: item.color }} />
                  <span className="text-xs font-medium text-[#f5f5f7]">{item.method}</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#2c2c2e] text-[#8e8e93]">{item.example}</span>
              </div>
              <div className="text-[10px] text-[#8e8e93]">{item.description}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RagArchitecture() {
  const [activeStep, setActiveStep] = useState<number | null>(null);

  return (
    <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
      <h3 className="text-sm font-semibold text-[#f5f5f7] mb-4">RAG 架构</h3>
      <div className="space-y-2">
        {RAG_ARCHITECTURE.map((step, index) => {
          const Icon = step.icon;
          const isActive = activeStep === index;
          return (
            <button
              key={index}
              onClick={() => setActiveStep(isActive ? null : index)}
              className={`w-full text-left p-3 rounded-lg border transition-all ${
                isActive
                  ? "bg-[#141416] border-[#3a3a3c]"
                  : "bg-[#141416] border-[#2c2c2e] hover:border-[#3a3a3c]"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${step.color}15` }}
                >
                  <Icon className="w-4 h-4" style={{ color: step.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[#f5f5f7]">{step.step}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded ${
                        step.type === "input"
                          ? "bg-[#ff3b30]/20 text-[#ff3b30]"
                          : step.type === "process"
                          ? "bg-[#ff9f0a]/20 text-[#ff9f0a]"
                          : step.type === "data"
                          ? "bg-[#0a84ff]/20 text-[#0a84ff]"
                          : "bg-[#bf5af2]/20 text-[#bf5af2]"
                      }`}
                    >
                      {step.type}
                    </span>
                  </div>
                  {isActive && (
                    <p className="text-xs text-[#8e8e93] mt-1">{step.description}</p>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FunctionCallingSteps() {
  return (
    <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
      <h3 className="text-sm font-semibold text-[#f5f5f7] mb-4">Function Calling 流程</h3>
      <div className="space-y-2">
        {FUNCTION_CALLING_STEPS.map((step, index) => (
          <div
            key={index}
            className="flex items-center gap-3 p-3 rounded-lg bg-[#141416] border border-[#2c2c2e]"
          >
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                step.type === "input"
                  ? "bg-[#ff3b30]/20 text-[#ff3b30]"
                  : step.type === "process"
                  ? "bg-[#ff9f0a]/20 text-[#ff9f0a]"
                  : step.type === "action"
                  ? "bg-[#30d158]/20 text-[#30d158]"
                  : step.type === "data"
                  ? "bg-[#0a84ff]/20 text-[#0a84ff]"
                  : "bg-[#bf5af2]/20 text-[#bf5af2]"
              }`}
            >
              {step.step}
            </span>
            <span className="text-xs text-[#f5f5f7] font-mono flex-1 truncate">
              {step.content}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// Main Page
// =============================================================================

export default function Ch12AiCapabilitiesPage() {
  return (
    <div className="p-4 lg:p-8 max-w-[1200px] mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[#636366] mb-6">
        <Link href="/chapters" className="hover:text-[#f5f5f7] transition-colors">
          学习章节
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-[#8e8e93]">第十二回</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#64d2ff]/10 flex items-center justify-center">
            <Cpu className="w-5 h-5 text-[#64d2ff]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#f5f5f7]">FDE 的 AI 能力</h1>
            <p className="text-sm text-[#636366]">
              从机器学习基础到 AI 安全，从 LLM 能力到 Ontology+AI 融合 —— FDE 的完整 AI 知识体系
            </p>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* 12.1 AI 基础 */}
      {/* ============================================ */}
      <div className="mb-6">
        <SectionHeader icon={Brain} title="12.1 AI 基础" color="#0a84ff" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <MlTypesCard />
        <DeepLearningTypes />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <MlAlgorithmsGrid />
        <NlpTasksList />
      </div>

      {/* ============================================ */}
      {/* 12.2 AI 应用 */}
      {/* ============================================ */}
      <div className="mb-6 mt-10">
        <SectionHeader icon={Zap} title="12.2 AI 应用" color="#ff9f0a" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <RecommendationSystem />
        <NlpApplicationsList />
        <ComputerVisionTasks />
      </div>

      {/* ============================================ */}
      {/* LLM 能力 (现有内容整合) */}
      {/* ============================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <CapabilityMatrix />
        <RagArchitecture />
      </div>

      <div className="mb-8">
        <FunctionCallingSteps />
      </div>

      {/* ============================================ */}
      {/* 12.3 AI 伦理 */}
      {/* ============================================ */}
      <div className="mb-6 mt-10">
        <SectionHeader icon={Shield} title="12.3 AI 伦理" color="#30d158" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <AiEthics />
        <BiasAndExplainability />
      </div>

      {/* ============================================ */}
      {/* 12.4 AI 安全 */}
      {/* ============================================ */}
      <div className="mb-6 mt-10">
        <SectionHeader icon={Lock} title="12.4 AI 安全" color="#ff3b30" />
      </div>

      <div className="mb-8">
        <AiSecurity />
      </div>

      {/* ============================================ */}
      {/* 12.5 AI 与 Ontology */}
      {/* ============================================ */}
      <div className="mb-6 mt-10">
        <SectionHeader icon={Layers} title="12.5 AI 与 Ontology" color="#bf5af2" />
      </div>

      <div className="mb-8">
        <AiOntologyIntegration />
      </div>

      {/* ============================================ */}
      {/* AI 与 Ontology 融合详解 */}
      {/* ============================================ */}
      <div className="mb-8">
        <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
          <h3 className="text-sm font-semibold text-[#f5f5f7] mb-4">AI 与 Ontology 融合详解</h3>
          <div className="space-y-4 text-xs text-[#8e8e93] leading-relaxed">
            <p>
              <strong className="text-[#f5f5f7]">AI 不是替代 Ontology，而是增强 Ontology 的智能化能力</strong>。
              在 Palantir 平台中，AI 与 Ontology 的融合体现在多个层面。
              首先，<strong className="text-[#f5f5f7]">Function Calling</strong> 让 LLM 能够调用 Ontology 中的函数，
              获取实时数据并执行业务操作。例如，LLM 可以调用「获取工具评分」函数，
              获取最新评分数据，然后基于这些数据生成推荐结果。
              这种融合让 LLM 不再是「黑盒」，而是能够基于实时、准确的业务数据生成回答。
            </p>
            <p>
              <strong className="text-[#f5f5f7]">RAG（检索增强生成）</strong>是 AI 与 Ontology 融合的另一个重要模式。
              RAG 让 LLM 能够基于 Ontology 数据生成回答，而不是仅依赖训练数据。
              具体流程是：1. 用户提出问题；2. 系统在 Ontology 中检索相关数据；
              3. 将检索结果作为上下文提供给 LLM；4. LLM 基于上下文生成回答。
              这种模式确保了回答的准确性和时效性，避免了 LLM 的「幻觉」问题。
            </p>
            <p>
              <strong className="text-[#f5f5f7]">Vector Property（向量属性）</strong>是 Palantir 平台支持的高级属性类型，
              用于在对象上存储向量，以支持语义搜索。
              根据官方文档，Vector 类型可以存储 Embedding 向量，
              用于相似度搜索和推荐系统。例如，可以为每个 AI 工具生成描述文本的 Embedding，
              存储在 Vector 属性中，然后基于用户查询的 Embedding 进行相似度搜索，
              找到最相关的工具。
            </p>
            <p>
              <strong className="text-[#f5f5f7]">AI FDE（AI 驱动的 FDE）</strong>是 Palantir 推出的 AI 代理，
              能够通过对话命令操 Foundry。AI FDE 将自然语言请求转化为 Foundry 操作，
              允许用户执行数据转换、管理代码仓库、构建和维护 Ontology 等任务。
              AI FDE 采用闭环操作模型：模型执行操作、观察结果、使用反馈确定下一步操作。
              这种持续反馈循环让 AI FDE 能够处理复杂的多步骤工作流。
            </p>
            <p>
              <strong className="text-[#f5f5f7]">AI 伦理与安全</strong>是 FDE 必须重视的领域。
              根据 Palantir 官方文档，AI 安全包括模型威胁（如提示注入、数据投毒）、
              数据安全（如加密、访问控制）和隐私保护（如差分隐私、联邦学习）。
              FDE 需要在设计和实现 AI 功能时，充分考虑这些安全和伦理问题，
              确保 AI 系统的可靠性、公平性和透明性。
            </p>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* AI 能力矩阵 */}
      {/* ============================================ */}
      <div className="mb-8">
        <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
          <h3 className="text-sm font-semibold text-[#f5f5f7] mb-4">FDE 的 AI 能力矩阵</h3>
          <div className="space-y-3">
            {[
              {
                level: "基础层",
                abilities: ["理解机器学习基本概念", "掌握监督/无监督/强化学习区别", "了解深度学习网络结构", "熟悉常用 AI 框架"],
                desc: "掌握 AI 基础理论，能够理解 AI 模型的基本原理和适用场景",
              },
              {
                level: "应用层",
                abilities: ["使用 LLM API 进行文本生成", "实现 RAG 检索增强生成", "构建推荐系统", "开发智能客服"],
                desc: "能够将 AI 技术应用到实际业务场景，解决具体问题",
              },
              {
                level: "集成层",
                abilities: ["将 LLM 与 Ontology 集成", "实现 Function Calling", "构建 AI Agent", "开发 AIP Logic 工作流"],
                desc: "能够将 AI 能力与 Palantir 平台深度集成，构建智能化应用",
              },
              {
                level: "优化层",
                abilities: ["微调模型以适应特定领域", "优化提示词工程", "实现模型评估和监控", "处理 AI 伦理问题"],
                desc: "能够优化 AI 系统性能，确保可靠性、公平性和透明性",
              },
            ].map((item) => (
              <div key={item.level} className="p-3 rounded bg-[#141416] border border-[#2c2c2e]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-[#f5f5f7]">{item.level}</span>
                  <span className="text-[10px] text-[#636366]">{item.desc}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {item.abilities.map((ability) => (
                    <span key={ability} className="text-[10px] px-2 py-0.5 rounded bg-[#1c1c1e] text-[#8e8e93]">
                      {ability}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Key Takeaway */}
      <div className="p-5 rounded-xl bg-[#64d2ff]/5 border border-[#64d2ff]/20">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-[#64d2ff] flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-[#f5f5f7] mb-2">核心要点</h3>
            <p className="text-xs text-[#8e8e93] leading-relaxed">
              AI 能力是 FDE 在 AI 时代的核心竞争力。从机器学习基础到 AI 应用，从 AI 伦理到 AI 安全，
              FDE 需要掌握 AI 的完整知识体系。
              <strong className="text-[#f5f5f7]">Function Calling</strong> 让 LLM 能够调用 Ontology 函数，
              <strong className="text-[#f5f5f7]">RAG</strong> 让 LLM 能够基于 Ontology 数据生成回答。
              通过 <strong className="text-[#f5f5f7]">Ontology 与 AI 的结合</strong>，FDE 可以构建更智能、更可靠的应用。
              AI 不是替代 Ontology，而是增强 Ontology 的智能化能力。
              Vector Property 支持语义搜索，AI FDE 提供 AI 驱动的操作能力，
              让 FDE 能够更高效地构建和维护 Ontology。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}