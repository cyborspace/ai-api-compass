"use client";

import { useState } from "react";
import {
  Database,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  FileInput,
  Cog,
  Filter,
  Boxes,
  Activity,
  Shield,
  Sparkles,
  Layers,
} from "lucide-react";
import Link from "next/link";

// =============================================================================
// Data
// =============================================================================

const DATA_FLOW_STEPS = [
  {
    id: "source",
    title: "数据源接入",
    description: "从 API、数据库、文件等来源获取原始数据",
    icon: FileInput,
    color: "#ff3b30",
    details: [
      "REST API 抓取",
      "数据库连接（JDBC/ODBC）",
      "文件上传（CSV, JSON, Parquet）",
      "流式数据接入（Kafka, Kinesis）",
    ],
  },
  {
    id: "extract",
    title: "数据提取",
    description: "从源系统提取数据，保留原始格式",
    icon: Database,
    color: "#ff9f0a",
    details: [
      "全量抽取",
      "增量抽取（基于时间戳）",
      "变更数据捕获（CDC）",
      "API 分页处理",
    ],
  },
  {
    id: "transform",
    title: "数据转换",
    description: "清洗、标准化、丰富数据",
    icon: Cog,
    color: "#30d158",
    details: [
      "数据清洗（去重、去空）",
      "格式标准化",
      "数据类型转换",
      "业务规则应用",
    ],
  },
  {
    id: "validate",
    title: "数据验证",
    description: "检查数据质量，确保符合 Ontology 定义",
    icon: Shield,
    color: "#0a84ff",
    details: [
      "完整性检查",
      "一致性验证",
      "范围检查",
      "引用完整性",
    ],
  },
  {
    id: "load",
    title: "数据加载",
    description: "将数据加载到 Ontology 对象中",
    icon: Boxes,
    color: "#bf5af2",
    details: [
      "Object 创建/更新",
      "Link 建立",
      "属性映射",
      "批量导入",
    ],
  },
  {
    id: "monitor",
    title: "监控与告警",
    description: "持续监控数据质量，发现问题及时告警",
    icon: Activity,
    color: "#64d2ff",
    details: [
      "数据新鲜度监控",
      "质量指标追踪",
      "异常检测",
      "自动修复",
    ],
  },
];

const QUALITY_CHECKS = [
  { name: "完整性", score: 92, status: "good" as const },
  { name: "准确性", score: 88, status: "good" as const },
  { name: "一致性", score: 85, status: "warning" as const },
  { name: "唯一性", score: 95, status: "good" as const },
  { name: "有效性", score: 90, status: "good" as const },
  { name: "及时性", score: 78, status: "warning" as const },
];

const ETL_PATTERNS = [
  {
    name: "批量 ETL",
    description: "定时执行，适合历史数据",
    pros: ["实现简单", "资源可控", "易于调试"],
    cons: ["延迟较高", "不适合实时场景"],
    useCase: "每日全量同步",
  },
  {
    name: "增量 ETL",
    description: "仅处理变更数据，提升效率",
    pros: ["效率高", "资源占用少", "延迟较低"],
    cons: ["需要变更追踪", "逻辑复杂"],
    useCase: "每小时增量更新",
  },
  {
    name: "流式处理",
    description: "实时处理数据流",
    pros: ["实时性高", "延迟极低"],
    cons: ["复杂度高", "资源消耗大", "容错难"],
    useCase: "实时事件处理",
  },
];

// =============================================================================
// Components
// =============================================================================

function DataFlowDiagram() {
  const [activeStep, setActiveStep] = useState<string>("source");

  return (
    <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
      <h3 className="text-sm font-semibold text-[#f5f5f7] mb-4">数据流图</h3>

      {/* Flow Steps */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {DATA_FLOW_STEPS.map((step, index) => {
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
              {index < DATA_FLOW_STEPS.length - 1 && (
                <ArrowRight className="w-3 h-3 text-[#636366] flex-shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Detail */}
      {(() => {
        const step = DATA_FLOW_STEPS.find((s) => s.id === activeStep);
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
            <div className="grid grid-cols-2 gap-2">
              {step.details.map((detail) => (
                <div
                  key={detail}
                  className="flex items-center gap-2 text-xs text-[#8e8e93]"
                >
                  <CheckCircle2 className="w-3 h-3 text-[#30d158]" />
                  {detail}
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

function QualityDashboard() {
  return (
    <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
      <h3 className="text-sm font-semibold text-[#f5f5f7] mb-4">数据质量检查</h3>
      <div className="space-y-3">
        {QUALITY_CHECKS.map((check) => (
          <div key={check.name}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-[#8e8e93]">{check.name}</span>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-medium ${
                    check.status === "good" ? "text-[#30d158]" : "text-[#ff9f0a]"
                  }`}
                >
                  {check.score}%
                </span>
                {check.status === "warning" && (
                  <AlertTriangle className="w-3 h-3 text-[#ff9f0a]" />
                )}
              </div>
            </div>
            <div className="h-2 bg-[#2c2c2e] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  check.status === "good" ? "bg-[#30d158]" : "bg-[#ff9f0a]"
                }`}
                style={{ width: `${check.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EtlPatternCard({
  pattern,
}: {
  pattern: (typeof ETL_PATTERNS)[0];
}) {
  return (
    <div className="p-4 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e] hover:border-[#3a3a3c] transition-all">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-[#f5f5f7]">{pattern.name}</h4>
        <span className="text-[10px] px-2 py-0.5 rounded bg-[#2c2c2e] text-[#8e8e93]">
          {pattern.useCase}
        </span>
      </div>
      <p className="text-xs text-[#8e8e93] mb-3">{pattern.description}</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-[10px] text-[#30d158] mb-1">优势</div>
          <ul className="space-y-0.5">
            {pattern.pros.map((pro) => (
              <li key={pro} className="flex items-center gap-1 text-[10px] text-[#8e8e93]">
                <CheckCircle2 className="w-2.5 h-2.5 text-[#30d158]" />
                {pro}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="text-[10px] text-[#ff453a] mb-1">劣势</div>
          <ul className="space-y-0.5">
            {pattern.cons.map((con) => (
              <li key={con} className="flex items-center gap-1 text-[10px] text-[#8e8e93]">
                <AlertTriangle className="w-2.5 h-2.5 text-[#ff453a]" />
                {con}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Main Page
// =============================================================================

export default function Ch03DataEngineeringPage() {
  return (
    <div className="p-4 lg:p-8 max-w-[1200px] mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[#636366] mb-6">
        <Link href="/chapters" className="hover:text-[#f5f5f7] transition-colors">
          学习章节
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-[#8e8e93]">第三回</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#30d158]/10 flex items-center justify-center">
            <Database className="w-5 h-5 text-[#30d158]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#f5f5f7]">数据工程基础</h1>
            <p className="text-sm text-[#636366]">
              从数据源到 Ontology 的完整数据流
            </p>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* 数据工程博客文字详解 */}
      {/* ============================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="prose prose-invert max-w-none">
          <h3 className="text-base font-semibold text-[#f5f5f7] mb-3 flex items-center gap-2">
            <Database className="w-4 h-4 text-[#ff9f0a]" />
            数据管道的五个阶段
          </h3>
          <p className="text-sm text-[#8e8e93] leading-relaxed mb-3">
            FDE 的数据工程遵循<strong className="text-[#f5f5f7]">五阶段流水线</strong>模型，这是比传统 ETL/ELT 更适用于 Ontology 构建的范式：
          </p>
          <div className="space-y-2">
            {[
              { stage: "阶段 0：接入（Ingest）", desc: "从各种数据源获取数据。支持 150+ 连接器（数据库、API、文件系统、流数据），以及自定义 Connector SDK。" },
              { stage: "阶段 1：理解（Understand）", desc: "理解数据结构和语义。进行数据探勘（Profiling），识别数据类型、分布、异常值，标注字段含义。" },
              { stage: "阶段 2：处理（Process）", desc: "清洗、转换、聚合数据。处理缺失值、格式转换、多源融合。这是最耗时但也是最能体现 FDE 价值的阶段。" },
              { stage: "阶段 3：建模（Model）", desc: "将处理后的数据映射为 Ontology 对象。定义 Object Type、Link Type、Action Type。这是传统 ETL 不具备的阶段。" },
              { stage: "阶段 4：发布（Publish）", desc: "将 Ontology 发布到生产环境。设置访问控制、监控数据质量、建立数据血缘追踪。" },
            ].map((item) => (
              <div key={item.stage} className="p-2 rounded bg-[#141416] border border-[#2c2c2e]">
                <span className="text-xs font-medium text-[#f5f5f7]">{item.stage}</span>
                <span className="text-[10px] text-[#636366] block">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="prose prose-invert max-w-none">
          <h3 className="text-base font-semibold text-[#f5f5f7] mb-3 flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#30d158]" />
            数据质量：六步检查法
          </h3>
          <p className="text-sm text-[#8e8e93] leading-relaxed mb-3">
            数据质量是 Ontology 可信度的基石。FDE 采用<strong className="text-[#f5f5f7]">六步质量检查法</strong>确保数据质量：
          </p>
          <div className="space-y-2">
            {[
              { step: "完整性", check: "必填字段是否为空？", example: "AI 工具必须有 name 和 description" },
              { step: "准确性", check: "数据是否正确？", example: "价格是否正确换算为统一货币？" },
              { step: "一致性", check: "数据是否一致？", example: "同一提供商的不同工具，logo_url 格式是否一致？" },
              { step: "时效性", check: "数据是否更新？", example: "上月导入的评价数据是否仍有效？" },
              { step: "唯一性", check: "是否有重复？", example: "slug 字段是否有冲突？" },
              { step: "有效性", check: "符合业务规则？", example: "rating 是否在 0-5 之间？" },
            ].map((item) => (
              <div key={item.step} className="p-2 rounded bg-[#141416] border border-[#2c2c2e]">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-medium text-[#f5f5f7]">{item.step}</span>
                  <span className="text-[10px] text-[#636366]">{item.check}</span>
                </div>
                <span className="text-[10px] text-[#30d158]">{item.example}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-8">
        <div className="prose prose-invert max-w-none">
          <h3 className="text-base font-semibold text-[#f5f5f7] mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#ff3b30]" />
            Flatten-Transform 策略与数据源类型
          </h3>
          <p className="text-sm text-[#8e8e93] leading-relaxed mb-3">
            AI-API-COMPASS 采用 <strong className="text-[#f5f5f7]">Flatten-Transform 策略</strong>处理多源异构数据。
            先通过标准化接口将所有数据源"压平"为统一的 JSON 行格式，再进行领域转换。
            FDE 面对的四种典型数据源：
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
            {[
              { source: "结构化数据（RDBMS）", desc: "PostgreSQL、MySQL 等关系型数据库，是 Ontology 的主要数据来源" },
              { source: "半结构化数据（API）", desc: "REST API JSON、GraphQL 响应，需要 Schema 推断和字段映射" },
              { source: "非结构化数据（文档）", desc: "PDF、Word、网页，需要 NLP 预处理后再映射到 Ontology" },
              { source: "实时流数据（Event）", desc: "Kafka、WebSocket 消息，需要 Windowing 和状态管理" },
            ].map((item) => (
              <div key={item.source} className="p-2 rounded bg-[#141416] border border-[#2c2c2e]">
                <span className="text-xs font-medium text-[#f5f5f7] block">{item.source}</span>
                <span className="text-[10px] text-[#636366]">{item.desc}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-[#8e8e93] leading-relaxed">
            选型决策：AI-API-COMPASS 采用<strong className="text-[#f5f5f7]">ETL 范式</strong>（而非 ELT），
            因为数据量可控、需要在入库前进行复杂转换、且目标 Schema 是固定的 Prisma 数据模型。
            FDE 需要掌握多种 ETL 模式：全量同步（初始化）、增量同步（日常更新）、CDC 变更捕获（实时同步）。
          </p>
        </div>
      </div>

      {/* Data Flow + Quality */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2">
          <DataFlowDiagram />
        </div>
        <div>
          <QualityDashboard />
        </div>
      </div>

      {/* ETL Patterns */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-[#f5f5f7] mb-4">ETL 模式对比</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {ETL_PATTERNS.map((pattern) => (
            <EtlPatternCard key={pattern.name} pattern={pattern} />
          ))}
        </div>
      </div>

      {/* Key Takeaway */}
      <div className="p-5 rounded-xl bg-[#30d158]/5 border border-[#30d158]/20">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-[#30d158] flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-[#f5f5f7] mb-2">核心要点</h3>
            <p className="text-xs text-[#8e8e93] leading-relaxed">
              数据工程是 Ontology 构建的基石。FDE 遵循<strong className="text-[#f5f5f7]">五阶段流水线</strong>
              （接入→理解→处理→建模→发布），采用 Flatten-Transform 策略处理
              结构化/半结构化/非结构化/流数据四种数据源。
              六步质量检查法（完整性、准确性、一致性、时效性、唯一性、有效性）
              贯穿整个流程。AI-API-COMPASS 选择 ETL 范式（而非 ELT），
              因为数据量可控且目标 Schema 为固定的 Prisma 模型。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
