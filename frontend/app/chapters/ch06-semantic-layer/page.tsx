"use client";

import { useState } from "react";
import {
  Search,
  ChevronRight,
  Brain,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Text,
  Hash,
  Filter,
} from "lucide-react";
import Link from "next/link";

// =============================================================================
// Data
// =============================================================================

const SEMANTIC_SEARCH_STEPS = [
  {
    id: "query",
    title: "用户查询",
    description: "用户输入自然语言查询",
    icon: Text,
    color: "#ff3b30",
    example: "我需要处理大量 PDF 文档，提取关键信息并生成摘要",
  },
  {
    id: "parse",
    title: "意图解析",
    description: "提取关键词、识别意图、分析约束条件",
    icon: Brain,
    color: "#ff9f0a",
    example: "关键词: PDF, 提取, 摘要 | 意图: 文档处理 | 约束: 无",
  },
  {
    id: "vectorize",
    title: "向量化",
    description: "将查询转换为向量表示",
    icon: Hash,
    color: "#30d158",
    example: "Query Embedding: [0.12, -0.34, 0.56, ...] (768维)",
  },
  {
    id: "match",
    title: "语义匹配",
    description: "计算与工具描述的相似度",
    icon: Filter,
    color: "#0a84ff",
    example: "相似度: Claude (0.92), GPT-4 (0.88), Gemini (0.85)",
  },
  {
    id: "rank",
    title: "结果排序",
    description: "综合语义相似度和业务规则排序",
    icon: Sparkles,
    color: "#bf5af2",
    example: "1. Claude | 2. GPT-4 | 3. Gemini | 4. Llama",
  },
];

const VECTORIZATION_EXAMPLE = {
  input: "处理 PDF 文档，提取信息并生成摘要",
  tokens: ["处理", "PDF", "文档", "提取", "信息", "生成", "摘要"],
  embedding: [
    0.12, -0.34, 0.56, -0.21, 0.78, -0.45, 0.33, -0.67, 0.89, -0.12,
    0.45, -0.78, 0.23, -0.56, 0.91, -0.34, 0.67, -0.89, 0.12, -0.45,
  ],
};

const SEMANTIC_MATCHES = [
  { tool: "Claude", score: 0.92, capabilities: ["长文本", "文档理解", "摘要生成"] },
  { tool: "GPT-4", score: 0.88, capabilities: ["多模态", "代码生成", "文档处理"] },
  { tool: "Gemini", score: 0.85, capabilities: ["大上下文", "多语言", "推理"] },
  { tool: "Llama", score: 0.72, capabilities: ["开源", "本地部署", "可定制"] },
];

// =============================================================================
// Components
// =============================================================================

function SearchFlowDiagram() {
  const [activeStep, setActiveStep] = useState<string>("query");

  return (
    <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
      <h3 className="text-sm font-semibold text-[#f5f5f7] mb-4">语义搜索流程</h3>

      {/* Steps */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {SEMANTIC_SEARCH_STEPS.map((step, index) => {
          const Icon = step.icon;
          const isActive = activeStep === step.id;
          return (
            <div key={step.id} className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setActiveStep(step.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all ${
                  isActive
                    ? "bg-[#ff3b30]/10 text-[#ff3b30] border border-[#ff3b30]/30"
                    : "bg-[#141416] text-[#8e8e93] border border-[#2c2c2e] hover:border-[#3a3a3c]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="font-medium">{step.title}</span>
              </button>
              {index < SEMANTIC_SEARCH_STEPS.length - 1 && (
                <ArrowRight className="w-3 h-3 text-[#636366] flex-shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Detail */}
      {(() => {
        const step = SEMANTIC_SEARCH_STEPS.find((s) => s.id === activeStep);
        if (!step) return null;
        const Icon = step.icon;
        return (
          <div className="p-4 rounded-lg bg-[#141416] border border-[#2c2c2e]">
            <div className="flex items-start gap-3 mb-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${step.color}15` }}
              >
                <Icon className="w-5 h-5" style={{ color: step.color }} />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[#f5f5f7]">{step.title}</h4>
                <p className="text-xs text-[#8e8e93]">{step.description}</p>
              </div>
            </div>
            <div className="p-3 rounded bg-[#2c2c2e]/50">
              <div className="text-[10px] text-[#636366] mb-1">示例</div>
              <div className="text-xs text-[#8e8e93] font-mono">{step.example}</div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

function VectorizationVisualizer() {
  const [showEmbedding, setShowEmbedding] = useState(false);

  return (
    <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
      <h3 className="text-sm font-semibold text-[#f5f5f7] mb-4">向量化过程</h3>

      {/* Input */}
      <div className="p-3 rounded-lg bg-[#141416] border border-[#2c2c2e] mb-3">
        <div className="text-[10px] text-[#636366] mb-1">输入文本</div>
        <div className="text-xs text-[#f5f5f7]">{VECTORIZATION_EXAMPLE.input}</div>
      </div>

      <ArrowRight className="w-4 h-4 text-[#636366] mx-auto mb-3 rotate-90" />

      {/* Tokens */}
      <div className="p-3 rounded-lg bg-[#141416] border border-[#2c2c2e] mb-3">
        <div className="text-[10px] text-[#636366] mb-2">分词</div>
        <div className="flex flex-wrap gap-1">
          {VECTORIZATION_EXAMPLE.tokens.map((token, i) => (
            <span
              key={i}
              className="px-2 py-0.5 rounded text-[10px] bg-[#2c2c2e] text-[#8e8e93]"
            >
              {token}
            </span>
          ))}
        </div>
      </div>

      <ArrowRight className="w-4 h-4 text-[#636366] mx-auto mb-3 rotate-90" />

      {/* Embedding */}
      <div className="p-3 rounded-lg bg-[#141416] border border-[#2c2c2e]">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[10px] text-[#636366]">向量嵌入 (768维)</div>
          <button
            onClick={() => setShowEmbedding(!showEmbedding)}
            className="text-[10px] text-[#0a84ff] hover:text-[#0a84ff]/80"
          >
            {showEmbedding ? "收起" : "展开"}
          </button>
        </div>
        <div className="flex flex-wrap gap-1">
          {VECTORIZATION_EXAMPLE.embedding.slice(0, showEmbedding ? undefined : 10).map((val, i) => (
            <div
              key={i}
              className="w-6 h-6 rounded flex items-center justify-center text-[8px]"
              style={{
                backgroundColor: val > 0 ? `rgba(48, 209, 88, ${val})` : `rgba(255, 69, 58, ${Math.abs(val)})`,
                color: Math.abs(val) > 0.5 ? "#fff" : "#8e8e93",
              }}
              title={`维度 ${i}: ${val.toFixed(2)}`}
            >
              {val.toFixed(1)}
            </div>
          ))}
          {!showEmbedding && (
            <span className="text-[10px] text-[#636366] self-center">...</span>
          )}
        </div>
      </div>
    </div>
  );
}

function SemanticMatchResults() {
  return (
    <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
      <h3 className="text-sm font-semibold text-[#f5f5f7] mb-4">语义匹配结果</h3>
      <div className="space-y-3">
        {SEMANTIC_MATCHES.map((match, index) => (
          <div
            key={match.tool}
            className="p-3 rounded-lg bg-[#141416] border border-[#2c2c2e] hover:border-[#3a3a3c] transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    index === 0
                      ? "bg-[#ff3b30] text-white"
                      : index === 1
                      ? "bg-[#ff9f0a] text-white"
                      : index === 2
                      ? "bg-[#30d158] text-white"
                      : "bg-[#2c2c2e] text-[#8e8e93]"
                  }`}
                >
                  {index + 1}
                </div>
                <span className="text-sm font-medium text-[#f5f5f7]">{match.tool}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-[#2c2c2e] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#ff3b30] rounded-full"
                    style={{ width: `${match.score * 100}%` }}
                  />
                </div>
                <span className="text-xs text-[#ff9f0a] font-medium">
                  {(match.score * 100).toFixed(0)}%
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              {match.capabilities.map((cap) => (
                <span
                  key={cap}
                  className="px-2 py-0.5 rounded text-[10px] bg-[#2c2c2e] text-[#8e8e93]"
                >
                  {cap}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// Main Page
// =============================================================================

export default function Ch06SemanticLayerPage() {
  return (
    <div className="p-4 lg:p-8 max-w-[1200px] mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[#636366] mb-6">
        <Link href="/chapters" className="hover:text-[#f5f5f7] transition-colors">
          学习章节
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-[#8e8e93]">第六回</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#ff453a]/10 flex items-center justify-center">
            <Search className="w-5 h-5 text-[#ff453a]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#f5f5f7]">语义层设计</h1>
            <p className="text-sm text-[#636366]">
              语义搜索、向量化、语义匹配与意图识别
            </p>
          </div>
        </div>
      </div>

      {/* Search Flow */}
      <div className="mb-8">
        <SearchFlowDiagram />
      </div>

      {/* ============================================ */}
      {/* 6.2-6.9 语义层博客文字详解 */}
      {/* ============================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Schema 生成与 Embedding 工程 */}
        <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
          <h3 className="text-sm font-semibold text-[#f5f5f7] mb-3">Schema 生成方法论</h3>
          <p className="text-xs text-[#8e8e93] leading-relaxed mb-3">
            语义搜索的起点不是代码，而是数据模型的重新组织。在 AI-API-COMPASS 中，我们设计了
            <strong className="text-[#f5f5f7]">分层 Schema</strong>：
          </p>
          <div className="space-y-2">
            {[
              { layer: "基础属性层", desc: "name、summary、description — 工具的基本身份信息" },
              { layer: "分类维度层", desc: "category、subcategory、tags — 工具的归类信息" },
              { layer: "场景关联层", desc: "use_cases、competitors、cost_model — 工具的竞争与场景信息" },
              { layer: "质量指标层", desc: "rating、hot_score、review_count — 工具的质量评估信息" },
            ].map((item) => (
              <div key={item.layer} className="p-2 rounded-lg bg-[#141416] border border-[#2c2c2e]">
                <span className="text-xs font-medium text-[#f5f5f7]">{item.layer}</span>
                <span className="text-[10px] text-[#636366] block">{item.desc}</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-[#8e8e93] mt-3">
            预处理的每一步都对应一个 Prisma 迁移脚本，确保 Schema 变更可追溯。
          </p>
        </div>

        <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
          <h3 className="text-sm font-semibold text-[#f5f5f7] mb-3">Embedding 工程详解</h3>
          <p className="text-xs text-[#8e8e93] leading-relaxed mb-3">
            Embedding 是将语义"翻译"给计算机的关键技术。选型标准：
          </p>
          <div className="space-y-2 mb-3">
            {[
              { model: "text-embedding-3-small", dim: 1536, cost: "$0.020/1M tokens", note: "性价比最高" },
              { model: "text-embedding-3-large", dim: 3072, cost: "$0.130/1M tokens", note: "精度最高" },
              { model: "ada v2", dim: 1536, cost: "$0.100/1M tokens", note: "OpenAI 经典方案" },
            ].map((m) => (
              <div key={m.model} className="flex items-center justify-between p-2 rounded bg-[#141416] border border-[#2c2c2e]">
                <span className="text-xs font-medium text-[#f5f5f7]">{m.model}</span>
                <span className="text-[10px] text-[#30d158]">{m.note}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-[#8e8e93] leading-relaxed mb-3">
            AI-API-COMPASS 选择 <strong className="text-[#f5f5f7]">text-embedding-3-small</strong>：
            成本低（批量生成 $0.02/1000 条）、维度适中（1536 适合中等规模）、兼容 OpenAI API。
          </p>
          <div className="p-2 rounded-lg bg-[#141416] border border-[#ff9f0a]/30">
            <p className="text-xs text-[#8e8e93] leading-relaxed">
              <span className="text-[#ff9f0a] font-medium">核心优化：</span>
              动态批处理（batch_size=100）、本地缓存（SQLite 存储已计算的 embedding）、
              增量更新策略（监听工具描述变更自动重新向量化）。
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* 混合搜索与意图识别 */}
        <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
          <h3 className="text-sm font-semibold text-[#f5f5f7] mb-3">语义搜索 + 关键字搜索融合</h3>
          <p className="text-xs text-[#8e8e93] leading-relaxed mb-3">
            纯粹的向量搜索和纯粹的关键词搜索各有缺陷。向量搜索可能忽略精确的名称匹配，
            关键词搜索则无法理解"最好用的 AI 绘画工具"中的"好用"到底指什么。
          </p>
          <div className="space-y-2 mb-3">
            {[
              { name: "向量搜索", weight: "权重 0.7", desc: "处理语义模糊查询、理解同义词" },
              { name: "关键词搜索", weight: "权重 0.3", desc: "精确匹配工具名、分类、标签" },
              { name: "场景权重加权", weight: "×1.5", desc: "如果查询与某个场景高度匹配" },
            ].map((s) => (
              <div key={s.name} className="p-2 rounded bg-[#141416] border border-[#2c2c2e]">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-medium text-[#f5f5f7]">{s.name}</span>
                  <span className="text-[10px] text-[#ff9f0a]">{s.weight}</span>
                </div>
                <span className="text-[10px] text-[#636366]">{s.desc}</span>
              </div>
            ))}
          </div>
          <div className="p-2 rounded bg-[#141416] border border-[#30d158]/30">
            <p className="text-[10px] text-[#8e8e93]">
              <span className="text-[#30d158] font-medium">最终分数：</span>
              FinalScore = α × Similarity(vector, query) + β × BM25(doc, query) + γ × ScenarioMatch(scenario, query)
            </p>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
          <h3 className="text-sm font-semibold text-[#f5f5f7] mb-3">查询意图识别</h3>
          <p className="text-xs text-[#8e8e93] leading-relaxed mb-3">
            不同查询需要不同策略。系统首先通过 LLM 进行意图分类：
          </p>
          <div className="space-y-2">
            {[
              { intent: "直接查询", example: "\"ChatGPT\"", strategy: "精确匹配", trigger: "包含工具名、品牌名" },
              { intent: "场景推荐", example: "\"适合写论文的\"", strategy: "场景匹配", trigger: "\"适合\"、\"用于\"、\"XX场景\"" },
              { intent: "能力对比", example: "\"GPT-4 vs Claude\"", strategy: "对比搜索", trigger: "\"vs\"、\"对比\"、\"哪个好\"" },
              { intent: "功能搜索", example: "\"支持 PDF 上传\"", strategy: "能力匹配", trigger: "\"支持\"、\"能\"、\"可以\"" },
            ].map((item) => (
              <div key={item.intent} className="p-2 rounded bg-[#141416] border border-[#2c2c2e]">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-medium text-[#f5f5f7]">{item.intent}</span>
                  <span className="text-[10px] text-[#bf5af2]">{item.trigger}</span>
                </div>
                <span className="text-[10px] text-[#636366]">{item.example} → {item.strategy}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Vectorization + Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <VectorizationVisualizer />
        <SemanticMatchResults />
      </div>

      {/* Key Takeaway */}
      <div className="p-5 rounded-xl bg-[#ff453a]/5 border border-[#ff453a]/20">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-[#ff453a] flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-[#f5f5f7] mb-2">核心要点</h3>
            <p className="text-xs text-[#8e8e93] leading-relaxed">
              语义层是连接用户意图与 Ontology 数据的桥梁。AI-API-COMPASS 采用
              <strong className="text-[#f5f5f7]">向量+关键词混合搜索</strong>策略（权重 7:3），
              结合 LLM 意图识别（直接查询/场景推荐/能力对比/功能搜索四种模式），
              通过分层 Schema（基础属性/分类维度/场景关联/质量指标）进行数据预处理。
              选用 text-embedding-3-small（1536维）实现成本最优的 Embedding 工程，
              配合动态批处理、本地缓存和增量更新策略，构建了完整的语义搜索管道。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
