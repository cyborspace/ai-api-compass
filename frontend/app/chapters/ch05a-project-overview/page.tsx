"use client";

import { useState } from "react";
import {
  BookOpen,
  ChevronRight,
  Layers,
  Database,
  Code2,
  Brain,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Server,
  Globe,
  Shield,
  Target,
  GitBranch,
  Network,
  Cpu,
  BarChart3,
  FileText,
  Zap,
  Clock,
  Link2,
  FunctionSquare,
  Route,
} from "lucide-react";
import Link from "next/link";

// =============================================================================
// Data
// =============================================================================

const TECH_STACK = [
  {
    layer: "前端",
    color: "#ff3b30",
    technologies: [
      { name: "Next.js 15", description: "React 框架，App Router" },
      { name: "TypeScript", description: "类型安全" },
      { name: "Tailwind CSS", description: "原子化 CSS" },
      { name: "SWR", description: "数据获取与缓存" },
      { name: "Zustand", description: "状态管理" },
    ],
  },
  {
    layer: "后端",
    color: "#ff9f0a",
    technologies: [
      { name: "Fastify", description: "高性能 Web 框架" },
      { name: "Prisma", description: "类型安全 ORM" },
      { name: "TypeScript", description: "类型安全" },
      { name: "Facade 模式", description: "统一服务入口" },
      { name: "Repository 模式", description: "数据访问层分离" },
    ],
  },
  {
    layer: "数据",
    color: "#30d158",
    technologies: [
      { name: "PostgreSQL", description: "Railway 免费版 500MB" },
      { name: "Prisma", description: "ORM / 迁移管理" },
      { name: "Redis", description: "Upstash 免费 10K/天" },
      { name: "JSONB", description: "存储 Ontology 属性" },
    ],
  },
  {
    layer: "AI",
    color: "#0a84ff",
    technologies: [
      { name: "MiniMax", description: "LLM 提供商" },
      { name: "OpenAI", description: "GPT-4 备选" },
      { name: "Embedding", description: "向量化语义搜索" },
      { name: "Function Calling", description: "工具调用能力" },
    ],
  },
  {
    layer: "部署",
    color: "#bf5af2",
    technologies: [
      { name: "Vercel", description: "前端托管 (100GB/月)" },
      { name: "Railway", description: "后端+DB ($5额度/月)" },
      { name: "Upstash Redis", description: "缓存/会话" },
      { name: "GitHub Actions", description: "CI/CD" },
    ],
  },
];

const CORE_FEATURES = [
  { name: "语义搜索", description: "关键词+向量混合搜索", icon: Globe, color: "#ff3b30", status: "已实现" },
  { name: "多工具对比", description: "横向对比，差异高亮", icon: Layers, color: "#ff9f0a", status: "已实现" },
  { name: "多维排行榜", description: "综合/分类/场景排名", icon: BarChart3, color: "#30d158", status: "已实现" },
  { name: "热度系统", description: "工具热度计算", icon: Zap, color: "#0a84ff", status: "已实现" },
  { name: "场景推荐", description: "AI 驱动场景匹配", icon: Brain, color: "#bf5af2", status: "已实现" },
  { name: "反作弊", description: "防刷分行为检测", icon: Shield, color: "#64d2ff", status: "已实现" },
  { name: "收藏夹", description: "个人收藏管理", icon: CheckCircle2, color: "#ff3b30", status: "已实现" },
  { name: "分类浏览", description: "10 大类工具分类", icon: Layers, color: "#ff9f0a", status: "已实现" },
  { name: "成本计算", description: "多模型成本估算", icon: Database, color: "#30d158", status: "已实现" },
  { name: "数据质量", description: "数据清洗与验证", icon: Shield, color: "#0a84ff", status: "已实现" },
  { name: "系统监控", description: "性能监控与告警", icon: Server, color: "#bf5af2", status: "已实现" },
  { name: "AI 对话", description: "AI 问答助手", icon: Brain, color: "#64d2ff", status: "已实现" },
];

const ARCHITECTURE_DIAGRAM = [
  { layer: "用户界面", items: ["Next.js 15", "Tailwind CSS", "SWR", "Zustand"], color: "#ff3b30" },
  { layer: "API 网关", items: ["Fastify", "REST API", "请求日志", "错误处理"], color: "#ff9f0a" },
  { layer: "Service 层", items: ["Facade 模式", "Cache Service", "Compare Service", "Search Service"], color: "#30d158" },
  { layer: "Repository 层", items: ["Base Repository", "Model Repo", "Provider Repo", "SearchLog Repo"], color: "#0a84ff" },
  { layer: "数据层", items: ["PostgreSQL", "Prisma ORM", "Redis 缓存", "JSONB"], color: "#bf5af2" },
];

const PROJECT_STATS = [
  { label: "AI 工具", value: "295", color: "#ff3b30" },
  { label: "工具分类", value: "10", color: "#ff9f0a" },
  { label: "关联关系", value: "303", color: "#30d158" },
  { label: "用户评价", value: "~10,000", color: "#0a84ff" },
  { label: "热度指标", value: "~50,000", color: "#bf5af2" },
];

const OBJECT_TYPES = [
  { name: "AIGCTool", desc: "AI 工具", props: "name, slug, pricingType, rating", color: "#ff3b30" },
  { name: "ToolCategory", desc: "工具分类", props: "name, slug, icon", color: "#ff9f0a" },
  { name: "ToolProvider", desc: "提供商", props: "name, websiteUrl, logoUrl", color: "#30d158" },
  { name: "ToolTag", desc: "标签", props: "tag, color", color: "#0a84ff" },
  { name: "UseCase", desc: "使用场景", props: "title, description, keywords", color: "#bf5af2" },
  { name: "PricingPlan", desc: "定价方案", props: "price, billingCycle", color: "#64d2ff" },
  { name: "ToolCapability", desc: "工具能力", props: "capabilityName, description", color: "#ff453a" },
  { name: "TechnicalSpec", desc: "技术规格", props: "contextWindow, maxTokens", color: "#e84f0a" },
  { name: "UserReview", desc: "用户评价", props: "rating, pros, cons", color: "#ff3b30" },
  { name: "TrendMetric", desc: "趋势指标", props: "metricName, value, trend", color: "#30d158" },
  { name: "CompetitorAnalysis", desc: "竞品分析", props: "competitorName, score", color: "#0a84ff" },
];

const FUNCTION_GROUPS = [
  { group: "排名", count: 8, example: "calculateComprehensiveRanking", color: "#ff3b30" },
  { group: "热度", count: 8, example: "getTrendingTools", color: "#ff9f0a" },
  { group: "评分", count: 7, example: "calculateAverageRating", color: "#30d158" },
  { group: "推荐", count: 7, example: "getScenarioRecommendations", color: "#0a84ff" },
  { group: "防作弊", count: 6, example: "detectGamingBehavior", color: "#bf5af2" },
  { group: "场景", count: 5, example: "matchScenario", color: "#64d2ff" },
  { group: "通用", count: 5, example: "filterTools", color: "#ff453a" },
];

const PROJECT_PHASES = [
  { phase: "Phase 0", title: "项目初始化", desc: "技术选型、项目搭建", status: "done", color: "#30d158" },
  { phase: "Phase 1", title: "Ontology 定义", desc: "核心模型定义", status: "done", color: "#30d158" },
  { phase: "Phase 2", title: "后端 API", desc: "API 开发", status: "done", color: "#30d158" },
  { phase: "Phase 3", title: "前端页面", desc: "页面开发", status: "done", color: "#30d158" },
  { phase: "Phase 4", title: "数据同步", desc: "数据集成", status: "done", color: "#30d158" },
  { phase: "Phase 5", title: "Ontology 集成", desc: "前端集成", status: "in-progress", color: "#ff9f0a" },
  { phase: "Phase 6", title: "生态飞轮", desc: "推荐、排名、热度", status: "in-progress", color: "#ff9f0a" },
];

const COST_BREAKDOWN = [
  { service: "Vercel (前端托管)", cost: "¥0", detail: "Hobby 计划" },
  { service: "Railway (后端+DB)", cost: "¥0", detail: "Starter $5 额度" },
  { service: "Upstash (Redis 缓存)", cost: "¥0", detail: "免费 10K/d" },
  { service: "GitHub (代码+CI)", cost: "¥0", detail: "免费版" },
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

function TechStack() {
  const [activeLayer, setActiveLayer] = useState<string>("前端");

  const layer = TECH_STACK.find((l) => l.layer === activeLayer);

  return (
    <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
      <h3 className="text-sm font-semibold text-[#f5f5f7] mb-4">技术栈</h3>
      <div className="flex flex-wrap gap-2 mb-4">
        {TECH_STACK.map((l) => (
          <button
            key={l.layer}
            onClick={() => setActiveLayer(l.layer)}
            className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
              activeLayer === l.layer
                ? "text-white font-medium"
                : "bg-[#141416] text-[#8e8e93] border border-[#2c2c2e] hover:border-[#3a3a3c]"
            }`}
            style={activeLayer === l.layer ? { backgroundColor: l.color, borderColor: l.color } : {}}
          >
            {l.layer}
          </button>
        ))}
      </div>
      {layer && (
        <div className="space-y-2">
          {layer.technologies.map((tech) => (
            <div key={tech.name} className="flex items-center justify-between p-2 rounded-lg bg-[#141416] border border-[#2c2c2e]">
              <span className="text-xs text-[#f5f5f7]">{tech.name}</span>
              <span className="text-[10px] text-[#8e8e93]">{tech.description}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FeatureGrid() {
  return (
    <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
      <h3 className="text-sm font-semibold text-[#f5f5f7] mb-4">核心功能 (12项)</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {CORE_FEATURES.map((feature) => {
          const Icon = feature.icon;
          return (
            <div key={feature.name} className="p-3 rounded-lg bg-[#141416] border border-[#2c2c2e] hover:border-[#3a3a3c] transition-all">
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-4 h-4" style={{ color: feature.color }} />
                <span className="text-xs font-medium text-[#f5f5f7]">{feature.name}</span>
              </div>
              <p className="text-[10px] text-[#8e8e93]">{feature.description}</p>
              <span className="text-[10px] text-[#30d158] mt-1 block">{feature.status}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ArchitectureDiagram() {
  return (
    <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
      <h3 className="text-sm font-semibold text-[#f5f5f7] mb-4">五层架构</h3>
      <div className="space-y-3">
        {ARCHITECTURE_DIAGRAM.map((layer, index) => (
          <div key={layer.layer}>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: layer.color }} />
              <span className="text-xs font-medium text-[#f5f5f7] w-24 flex-shrink-0">{layer.layer}</span>
              <div className="flex flex-wrap gap-2 flex-1">
                {layer.items.map((item) => (
                  <span key={item} className="px-2.5 py-1 rounded text-[10px] bg-[#2c2c2e] text-[#8e8e93]">{item}</span>
                ))}
              </div>
            </div>
            {index < ARCHITECTURE_DIAGRAM.length - 1 && (
              <div className="ml-1.5 mt-1 mb-1 w-px h-3 bg-[#2c2c2e]" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ProjectStats() {
  return (
    <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
      <h3 className="text-sm font-semibold text-[#f5f5f7] mb-4">核心数据规模</h3>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {PROJECT_STATS.map((stat) => (
          <div key={stat.label} className="p-3 rounded-lg bg-[#141416] border border-[#2c2c2e] text-center">
            <div className="text-xl font-bold mb-1" style={{ color: stat.color }}>{stat.value}</div>
            <div className="text-[10px] text-[#8e8e93]">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OntologyMapping() {
  const [activeTab, setActiveTab] = useState<"objects" | "functions">("objects");

  return (
    <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
      <h3 className="text-sm font-semibold text-[#f5f5f7] mb-4">Ontology 映射</h3>
      <div className="flex gap-1 mb-4 bg-[#141416] rounded-lg p-0.5">
        <button onClick={() => setActiveTab("objects")} className={`flex-1 px-3 py-1.5 rounded text-xs transition-all ${activeTab === "objects" ? "bg-[#bf5af2]/20 text-[#bf5af2]" : "text-[#8e8e93]"}`}>
          11 个 Object Type
        </button>
        <button onClick={() => setActiveTab("functions")} className={`flex-1 px-3 py-1.5 rounded text-xs transition-all ${activeTab === "functions" ? "bg-[#0a84ff]/20 text-[#0a84ff]" : "text-[#8e8e93]"}`}>
          46 个 Function
        </button>
      </div>

      {activeTab === "objects" ? (
        <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-1">
          {OBJECT_TYPES.map((obj) => (
            <div key={obj.name} className="flex items-center gap-3 p-2 rounded-lg bg-[#141416] border border-[#2c2c2e]">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: obj.color }} />
              <div className="w-28 text-xs font-medium text-[#f5f5f7] flex-shrink-0">{obj.name}</div>
              <div className="text-[10px] text-[#8e8e93] flex-1">{obj.desc}</div>
              <div className="text-[9px] text-[#636366] hidden md:block">{obj.props}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-1">
          {FUNCTION_GROUPS.map((fg) => (
            <div key={fg.group} className="flex items-center gap-3 p-2 rounded-lg bg-[#141416] border border-[#2c2c2e]">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold" style={{ backgroundColor: `${fg.color}15`, color: fg.color }}>{fg.count}</div>
              <span className="text-xs font-medium text-[#f5f5f7] w-16">{fg.group}</span>
              <span className="text-[10px] text-[#636366] font-mono flex-1 truncate">{fg.example}</span>
            </div>
          ))}
          <div className="p-2 text-center text-[10px] text-[#30d158]">总计: 46 个 Function</div>
        </div>
      )}
    </div>
  );
}

function ProjectRoadmap() {
  return (
    <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
      <h3 className="text-sm font-semibold text-[#f5f5f7] mb-4">项目路线图</h3>
      <div className="space-y-2">
        {PROJECT_PHASES.map((ph) => (
          <div key={ph.phase} className="flex items-center gap-3 p-2 rounded-lg bg-[#141416] border border-[#2c2c2e]">
            <span className="text-[10px] font-medium text-[#8e8e93] w-16">{ph.phase}</span>
            <div className="flex-1">
              <div className="text-xs font-medium text-[#f5f5f7]">{ph.title}</div>
              <div className="text-[10px] text-[#8e8e93]">{ph.desc}</div>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded ${ph.status === "done" ? "bg-[#30d158]/20 text-[#30d158]" : "bg-[#ff9f0a]/20 text-[#ff9f0a]"}`}>
              {ph.status === "done" ? "✅" : "🔄"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CostBreakdown() {
  return (
    <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
      <h3 className="text-sm font-semibold text-[#f5f5f7] mb-4">部署成本: ¥0/月</h3>
      <div className="space-y-2">
        {COST_BREAKDOWN.map((item) => (
          <div key={item.service} className="flex items-center justify-between p-2 rounded-lg bg-[#141416] border border-[#2c2c2e]">
            <div>
              <div className="text-xs text-[#f5f5f7]">{item.service}</div>
              <div className="text-[10px] text-[#636366]">{item.detail}</div>
            </div>
            <span className="text-sm font-bold text-[#30d158]">{item.cost}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 p-2 rounded bg-[#30d158]/10 text-center">
        <span className="text-xs font-bold text-[#30d158]">总计: ¥0/月 — 完全免费</span>
      </div>
    </div>
  );
}

function ProjectBackground() {
  return (
    <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
      <h3 className="text-sm font-semibold text-[#f5f5f7] mb-3">为什么做这个项目？</h3>
      <p className="text-xs text-[#8e8e93] leading-relaxed mb-3">
        2024 年 AIGC 工具爆发式增长，用户面临<strong className="text-[#f5f5f7]">"如何选择 AI 工具"</strong>的核心痛点。
        搜索引擎碎片化、垂直媒体评测主观、官方文档无法横向比较、社区观点分散。
      </p>
      <p className="text-xs text-[#8e8e93] leading-relaxed mb-3">
        AI-API-COMPASS 不仅是工具导航，更是
        <strong className="text-[#bf5af2]"> Ontology 架构的实践场</strong> ——
        通过 Palantir 三层架构思想，构建可扩展、可演进的 AI 工具知识图谱。
      </p>
      <div className="mt-3 p-3 rounded-lg bg-[#141416] border border-[#2c2c2e]">
        <div className="text-[10px] text-[#636366] mb-1">传统数据模型</div>
        <div className="text-[10px] text-[#8e8e93] font-mono">工具表 → 分类表 → 标签表 → 评价表</div>
      </div>
      <div className="mt-2 p-3 rounded-lg bg-[#141416] border border-[#bf5af2]/30">
        <div className="text-[10px] text-[#bf5af2] mb-1">Ontology 模型</div>
        <div className="text-[10px] text-[#8e8e93] font-mono leading-relaxed">
          AIGCTool → belongsTo → ToolCategory<br />
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;→ providedBy → ToolProvider<br />
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;→ hasTag → ToolTag<br />
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;→ supports → UseCase<br />
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;→ hasPricing → PricingPlan<br />
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;→ hasCapability → ToolCapability
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Main Page
// =============================================================================

export default function Ch05aProjectOverviewPage() {
  return (
    <div className="p-4 lg:p-8 max-w-[1200px] mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[#636366] mb-6">
        <Link href="/chapters" className="hover:text-[#f5f5f7] transition-colors">
          学习章节
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-[#8e8e93]">第五回（上）</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#bf5af2]/10 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-[#bf5af2]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#f5f5f7]">AI-API-COMPASS 项目全景</h1>
            <p className="text-sm text-[#636366]">
              295个AI工具 · 10个分类 · 303条关系 · Ontology架构实践 · 零成本部署
            </p>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* 5.1 项目背景与目标 */}
      {/* ============================================ */}
      <div className="mb-6">
        <SectionHeader icon={Target} title="5.1 项目背景与目标" color="#ff3b30" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2">
          <ProjectBackground />
        </div>
        <ProjectStats />
      </div>

      {/* ============================================ */}
      {/* 5.2 技术栈 */}
      {/* ============================================ */}
      <div className="mb-6 mt-10">
        <SectionHeader icon={Cpu} title="5.2 技术栈与选型思维" color="#ff9f0a" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <TechStack />
        <CostBreakdown />
      </div>

      {/* ============================================ */}
      {/* 5.3 项目架构 */}
      {/* ============================================ */}
      <div className="mb-6 mt-10">
        <SectionHeader icon={Layers} title="5.3 后端分层架构" color="#30d158" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <ArchitectureDiagram />
        <FeatureGrid />
      </div>

      {/* ============================================ */}
      {/* 5.4 Ontology 映射 */}
      {/* ============================================ */}
      <div className="mb-6 mt-10">
        <SectionHeader icon={Network} title="5.4 Ontology 在项目中的映射" color="#bf5af2" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <OntologyMapping />
        <ProjectRoadmap />
      </div>

      {/* ============================================ */}
      {/* 项目详细说明 */}
      {/* ============================================ */}
      <div className="mb-8">
        <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
          <h3 className="text-sm font-semibold text-[#f5f5f7] mb-4">项目架构设计详解</h3>
          <div className="space-y-4 text-xs text-[#8e8e93] leading-relaxed">
            <p>
              <strong className="text-[#f5f5f7]">AI-API-COMPASS</strong> 是一个基于 Palantir Ontology 架构思想构建的 AI 工具导航平台。
              项目采用<strong className="text-[#f5f5f7]">五层架构</strong>设计：接入层负责数据获取与预处理，
              理解层负责数据清洗与结构化，处理层负责业务逻辑与数据转换，
              建模层负责 Ontology 构建与关系建立，发布层负责 API 服务与前端展示。
              这种分层架构确保了系统的可扩展性和可维护性。
            </p>
            <p>
              <strong className="text-[#f5f5f7]">技术选型思路</strong>：后端选择 Fastify 而非 Express，
              是因为 Fastify 的插件架构和性能优势更适合构建高性能 API 服务。
              Prisma 作为 ORM 提供了类型安全和自动迁移能力，
              与 TypeScript 结合使用可以大幅减少运行时错误。
              PostgreSQL 作为关系型数据库，通过 pgvector 扩展支持向量搜索，
              为后续的语义搜索功能奠定基础。
              前端选择 Next.js 15 的 App Router 模式，
              配合 Server Components 可以减少客户端 JavaScript 体积，提升首屏加载速度。
            </p>
            <p>
              <strong className="text-[#f5f5f7]">Ontology 设计思路</strong>：项目参考 Palantir Ontology 的核心概念，
              设计了 11 个 Object Type（AIGCTool、ToolCategory、ToolProvider 等）、
              10 种 Link Type（belongsTo、providedBy、hasTag 等）、46 个 Function。
              每个 Object Type 都有明确的业务含义和属性定义，
              Link Type 建立了对象之间的关联关系，
              Function 提供了派生属性的计算逻辑。
              这种设计让数据结构清晰易懂，便于后续扩展和维护。
            </p>
            <p>
              <strong className="text-[#f5f5f7]">零成本部署策略</strong>：
              前端部署在 Vercel（免费额度足够个人项目使用），
              后端和数据库部署在 Railway（免费额度包含 500MB 存储和每月 5 美元使用额度）。
              通过合理的资源使用和缓存策略，项目可以实现完全免费的持续运行。
              这种部署方式适合个人开发者和小型团队，
              也体现了 FDE 在资源受限环境下的工程能力。
            </p>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* 项目学习价值 */}
      {/* ============================================ */}
      <div className="mb-8">
        <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
          <h3 className="text-sm font-semibold text-[#f5f5f7] mb-4">通过项目学习 FDE 技能</h3>
          <div className="space-y-3">
            {[
              {
                level: "入门阶段",
                tasks: ["修复前端样式 Bug", "补充缺失的 TypeScript 类型定义", "优化 API 响应格式", "添加单元测试"],
                skills: "熟悉项目结构、掌握基础开发流程",
              },
              {
                level: "进阶阶段",
                tasks: ["实现新的 Object Type（如 ToolReview）", "设计新的 Link Type（如 reviewedBy）", "开发新的 API 端点", "优化数据库查询性能"],
                skills: "掌握 Ontology 建模、理解数据关系设计",
              },
              {
                level: "高级阶段",
                tasks: ["实现排名算法（如 PageRank、HITS）", "集成 LLM 进行智能推荐", "构建语义搜索功能", "设计实时数据同步机制"],
                skills: "掌握算法设计、AI 集成、系统架构",
              },
              {
                level: "专家阶段",
                tasks: ["设计微服务架构拆分", "实现分布式事务", "构建数据管道自动化", "开发自定义 Workshop 组件"],
                skills: "掌握系统架构、分布式系统、平台工程",
              },
            ].map((item) => (
              <div key={item.level} className="p-3 rounded bg-[#141416] border border-[#2c2c2e]">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-[#bf5af2]" />
                  <span className="text-xs font-medium text-[#f5f5f7]">{item.level}</span>
                  <span className="text-[10px] text-[#636366] ml-auto">{item.skills}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {item.tasks.map((task) => (
                    <span key={task} className="text-[10px] px-2 py-0.5 rounded bg-[#1c1c1e] text-[#8e8e93]">
                      {task}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Key Takeaway */}
      <div className="p-5 rounded-xl bg-[#bf5af2]/5 border border-[#bf5af2]/20">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-[#bf5af2] flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-[#f5f5f7] mb-2">核心要点</h3>
            <p className="text-xs text-[#8e8e93] leading-relaxed">
              AI-API-COMPASS 是一个<strong className="text-[#f5f5f7]">Ontology 架构的实践场</strong>，
              收录 295 个 AI 工具，建立 10 个分类 303 条关联关系。
              后端采用 Fastify + Prisma + PostgreSQL 的高性能架构，
              前端使用 Next.js 15 + TypeScript + Tailwind + Zustand，
              整体部署在 Vercel + Railway，<strong className="text-[#30d158]">月成本 ¥0</strong>。
              Ontology 包含 11 个 Object Type、10 种 Link Type、46 个 Function。
              项目分 7 个 Phase 推进，Phase 0-4 已完成，Phase 5-6 进行中。
              通过贡献项目来学习 FDE 技能：从入门 Bug 修复，到进阶新 Object Type 实现，
              到高级排名算法优化和 LLM 集成。
              项目不仅是工具导航，更是 Palantir Ontology 思想的开源实践。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}