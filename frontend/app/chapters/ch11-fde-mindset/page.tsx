"use client";

import { useState } from "react";
import {
  Brain,
  ChevronRight,
  Eye,
  Box,
  Database,
  CheckCircle2,
  Rocket,
  ArrowRight,
  Sparkles,
  Lightbulb,
  Target,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";

// =============================================================================
// Data
// =============================================================================

const MINDSET_CYCLE = [
  {
    id: "observe",
    title: "观察",
    description: "深入理解业务场景，收集需求和痛点",
    icon: Eye,
    color: "#ff3b30",
    questions: [
      "用户在什么场景下使用？",
      "当前流程有什么痛点？",
      "数据从哪里来？到哪里去？",
      "谁是关键利益相关者？",
    ],
  },
  {
    id: "abstract",
    title: "抽象",
    description: "从具体业务中提炼通用概念",
    icon: Box,
    color: "#ff9f0a",
    questions: [
      "核心业务实体是什么？",
      "实体之间有什么关系？",
      "哪些属性是关键的？",
      "业务规则有哪些？",
    ],
  },
  {
    id: "model",
    title: "建模",
    description: "将抽象概念转化为 Ontology 模型",
    icon: Database,
    color: "#30d158",
    questions: [
      "Object Types 如何设计？",
      "Link Types 如何定义？",
      "Action Types 有哪些？",
      "Functions 计算什么？",
    ],
  },
  {
    id: "validate",
    title: "验证",
    description: "验证模型是否满足业务需求",
    icon: CheckCircle2,
    color: "#0a84ff",
    questions: [
      "模型是否覆盖所有场景？",
      "数据质量是否达标？",
      "性能是否满足要求？",
      "用户反馈如何？",
    ],
  },
  {
    id: "deploy",
    title: "部署",
    description: "将模型部署到生产环境",
    icon: Rocket,
    color: "#bf5af2",
    questions: [
      "如何平滑迁移？",
      "监控哪些指标？",
      "如何回滚？",
      "如何持续优化？",
    ],
  },
];

const PRINCIPLES = [
  {
    title: "Object-First",
    description: "一切从业务实体出发，而非表结构",
    icon: Target,
    color: "#ff3b30",
  },
  {
    title: "渐进式建模",
    description: "从简单开始，逐步丰富 Ontology",
    icon: RefreshCw,
    color: "#ff9f0a",
  },
  {
    title: "数据驱动",
    description: "用数据验证假设，而非主观判断",
    icon: Database,
    color: "#30d158",
  },
  {
    title: "持续迭代",
    description: "Ontology 是活的，需要持续演进",
    icon: Rocket,
    color: "#0a84ff",
  },
  {
    title: "业务共创",
    description: "与业务专家共建，而非闭门造车",
    icon: Lightbulb,
    color: "#bf5af2",
  },
];

// =============================================================================
// Components
// =============================================================================

function MindsetCycle() {
  const [activePhase, setActivePhase] = useState<string>("observe");

  return (
    <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
      <h3 className="text-sm font-semibold text-[#f5f5f7] mb-4">FDE 思维循环</h3>

      {/* Cycle */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {MINDSET_CYCLE.map((phase, index) => {
          const Icon = phase.icon;
          const isActive = activePhase === phase.id;
          return (
            <div key={phase.id} className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setActivePhase(phase.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all ${
                  isActive
                    ? "bg-[#ff3b30]/10 text-[#ff3b30] border border-[#ff3b30]/30"
                    : "bg-[#141416] text-[#8e8e93] border border-[#2c2c2e] hover:border-[#3a3a3c]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="font-medium">{phase.title}</span>
              </button>
              {index < MINDSET_CYCLE.length - 1 && (
                <ArrowRight className="w-3 h-3 text-[#636366] flex-shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      {/* Phase Detail */}
      {(() => {
        const phase = MINDSET_CYCLE.find((p) => p.id === activePhase);
        if (!phase) return null;
        const Icon = phase.icon;
        return (
          <div className="p-4 rounded-lg bg-[#141416] border border-[#2c2c2e]">
            <div className="flex items-start gap-3 mb-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${phase.color}15` }}
              >
                <Icon className="w-5 h-5" style={{ color: phase.color }} />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[#f5f5f7]">{phase.title}</h4>
                <p className="text-xs text-[#8e8e93]">{phase.description}</p>
              </div>
            </div>
            <div className="space-y-1">
              {phase.questions.map((q) => (
                <div
                  key={q}
                  className="flex items-center gap-2 text-xs text-[#8e8e93]"
                >
                  <CheckCircle2 className="w-3 h-3 text-[#30d158]" />
                  {q}
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

function PrinciplesGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {PRINCIPLES.map((principle) => {
        const Icon = principle.icon;
        return (
          <div
            key={principle.title}
            className="p-4 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e] hover:border-[#3a3a3c] transition-all"
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
              style={{ backgroundColor: `${principle.color}15` }}
            >
              <Icon className="w-5 h-5" style={{ color: principle.color }} />
            </div>
            <h4 className="text-sm font-semibold text-[#f5f5f7] mb-1">
              {principle.title}
            </h4>
            <p className="text-xs text-[#8e8e93]">{principle.description}</p>
          </div>
        );
      })}
    </div>
  );
}

// =============================================================================
// Main Page
// =============================================================================

export default function Ch11FdeMindsetPage() {
  return (
    <div className="p-4 lg:p-8 max-w-[1200px] mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[#636366] mb-6">
        <Link href="/chapters" className="hover:text-[#f5f5f7] transition-colors">
          学习章节
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-[#8e8e93]">第十一回</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#bf5af2]/10 flex items-center justify-center">
            <Brain className="w-5 h-5 text-[#bf5af2]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#f5f5f7]">FDE 思维模型</h1>
            <p className="text-sm text-[#636366]">
              观察→抽象→建模→验证→部署的完整思维循环
            </p>
          </div>
        </div>
      </div>

      {/* Mindset Cycle */}
      <div className="mb-8">
        <MindsetCycle />
      </div>

      {/* ============================================ */}
      {/* FDE 思维模型 博客详解 */}
      {/* ============================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* OAMVD 详解 */}
        <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
          <h3 className="text-sm font-semibold text-[#f5f5f7] mb-3">OAMVD 五阶思维循环</h3>
          <p className="text-xs text-[#8e8e93] leading-relaxed mb-3">
            OAMVD 是 FDE 的<strong className="text-[#f5f5f7]">核心认知框架</strong>，每次迭代都更深一层：
          </p>
          <div className="space-y-2">
            {[
              { step: "O - Observe（观察）", desc: "深入一线观察业务痛点。不是远程听 PPT，而是走进仓库、车间、指挥中心，看用户到底在做什么。如果仓库管理员半夜用手电筒照着货架编号找货物——这就是闪送单问题的起点。" },
              { step: "A - Abstract（抽象）", desc: "提取核心概念并剥离细节。从「一个关于查找 AI 工具的网站」这个模糊需求中，抽象出 Tool、Category、UseCase 三个核心实体——所有后续设计的起点。" },
              { step: "M - Model（建模）", desc: "将抽象概念映射为 Ontology 类型。确定 Object Type（AIGCTool、ToolCategory）、Link Type（belongsTo）、Action Type（rateTool）。建模不是一次完成的，而是多次迭代。" },
              { step: "V - Verify（验证）", desc: "验证模型正确性与完整性。用真实数据填充 Ontology、用真实查询测试搜索、用真实场景验证推荐。不是功能测试，而是语义验证——Ontology 是否真实反映了业务世界？" },
              { step: "D - Deploy（部署）", desc: "发布到生产并加载数据。部署不仅是技术上线，更是将模型交还给业务验证。写回日志、监控指标、业务反馈随时触发下一轮 OAMVD 循环。" },
            ].map((item) => (
              <div key={item.step} className="p-2 rounded bg-[#141416] border border-[#2c2c2e]">
                <span className="text-xs font-medium text-[#f5f5f7] block">{item.step}</span>
                <span className="text-[10px] text-[#636366]">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 三原则 + 黄金法则 */}
        <div className="space-y-4">
          <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
            <h3 className="text-sm font-semibold text-[#f5f5f7] mb-3">Ontology 思维的三原则</h3>
            <div className="space-y-3">
              {[
                { num: "01", title: "Object-First", desc: "先找核心对象，再定义关系和属性。不是先设计数据库表，而是先问：这个业务有哪些核心实体？这避免了过早陷入技术细节。" },
                { num: "02", title: "业务语义驱动", desc: "建模必须使用业务语言，而非技术术语。AIGCTool 而非 tools_table。让业务人员能直接理解 Ontology，这是 FDE 与业务协同的基础。" },
                { num: "03", title: "持续演进", desc: "Ontology 不是一次性设计。随着业务理解和数据丰富，不断调整和优化。Ontology 是活的，它随着业务一起进化。" },
              ].map((item) => (
                <div key={item.num} className="p-3 rounded bg-[#141416] border border-[#2c2c2e]">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg font-bold" style={{ color: "#bf5af2" }}>{item.num}</span>
                    <span className="text-xs font-medium text-[#f5f5f7]">{item.title}</span>
                  </div>
                  <span className="text-[10px] text-[#8e8e93]">{item.desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
            <h3 className="text-sm font-semibold text-[#f5f5f7] mb-3">FDE 四大黄金法则</h3>
            <div className="space-y-2">
              {[
                "先理解业务，再设计 Ontology — 永远从业务出发",
                "用最少的类型表达最丰富的语义 — 少即是多，简洁即优雅",
                "每个 Action 都要有明确的业务价值 — 没有值的 Action 不值得存在",
                "Ontology 是活的，持续演进 — 永远不要停止改进",
              ].map((rule, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded bg-[#141416] border border-[#2c2c2e]">
                  <span className="text-[10px] font-bold text-[#ff9f0a] flex-shrink-0">{i + 1}.</span>
                  <span className="text-[10px] text-[#8e8e93]">{rule}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Principles */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-[#f5f5f7] mb-4">核心原则</h3>
        <PrinciplesGrid />
      </div>

      {/* Key Takeaway */}
      <div className="p-5 rounded-xl bg-[#bf5af2]/5 border border-[#bf5af2]/20">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-[#bf5af2] flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-[#f5f5f7] mb-2">核心要点</h3>
            <p className="text-xs text-[#8e8e93] leading-relaxed">
              FDE 思维模型是一个<strong className="text-[#f5f5f7]">持续循环</strong>的过程：
              观察业务场景 → 抽象核心概念 → 建模 Ontology → 验证模型正确性 → 部署到生产。
              核心原则是 Object-First、渐进式建模、数据驱动、持续迭代和业务共创。
              思维模型的关键在于<strong className="text-[#f5f5f7]">从业务出发，而非从技术出发</strong>。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
