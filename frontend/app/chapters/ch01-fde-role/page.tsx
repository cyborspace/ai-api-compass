"use client";

import { useState } from "react";
import {
  UserCog,
  Database,
  Code2,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Minus,
  ChevronRight,
  Target,
  Brain,
  Workflow,
  Shield,
  Sparkles,
  Clock,
} from "lucide-react";
import Link from "next/link";

// =============================================================================
// Data
// =============================================================================

const ROLE_COMPARISON = [
  {
    dimension: "核心职责",
    fde: "Ontology 建模 + 应用开发 + 数据工程",
    dataEng: "数据管道 + ETL + 数据仓库",
    fullStack: "前端 + 后端 + 数据库",
  },
  {
    dimension: "主要工具",
    fde: "Palantir Foundry, AIP, Ontology",
    dataEng: "Spark, Airflow, dbt, Snowflake",
    fullStack: "React, Node.js, PostgreSQL",
  },
  {
    dimension: "数据思维",
    fde: "本体驱动（Object-First）",
    dataEng: "表驱动（Schema-First）",
    fullStack: "API 驱动（Endpoint-First）",
  },
  {
    dimension: "应用构建",
    fde: "Ontology 感知应用（Workshop, Object Explorer）",
    dataEng: "报表与仪表盘（Tableau, Looker）",
    fullStack: "自定义 Web 应用",
  },
  {
    dimension: "AI 集成",
    fde: "原生 AIP 集成（LLM, Function Calling）",
    dataEng: "后期集成（ML Pipeline）",
    fullStack: "API 调用（OpenAI API）",
  },
  {
    dimension: "协作模式",
    fde: "与业务专家共建 Ontology",
    dataEng: "接收需求，交付数据",
    fullStack: "接收 PRD，交付功能",
  },
];

const CORE_CAPABILITIES = [
  { name: "Ontology 建模", score: 95, icon: Target, color: "#ff3b30" },
  { name: "数据工程", score: 85, icon: Database, color: "#ff9f0a" },
  { name: "应用开发", score: 80, icon: Code2, color: "#30d158" },
  { name: "AI 集成", score: 75, icon: Brain, color: "#0a84ff" },
  { name: "业务理解", score: 90, icon: Sparkles, color: "#bf5af2" },
  { name: "系统思维", score: 88, icon: Workflow, color: "#64d2ff" },
];

const MINDSET_DIFFERENCES = [
  {
    aspect: "数据视角",
    traditional: "表是数据的容器",
    fde: "Object 是业务实体的数字孪生",
  },
  {
    aspect: "关系理解",
    traditional: "外键关联表与表",
    fde: "Link Types 表达业务关系",
  },
  {
    aspect: "变更处理",
    traditional: "迁移脚本修改表结构",
    fde: "Action Types 驱动业务变更",
  },
  {
    aspect: "应用构建",
    traditional: "前后端分离，API 传数据",
    fde: "Ontology 感知应用，Object 即接口",
  },
  {
    aspect: "AI 集成",
    traditional: "AI 是独立模块",
    fde: "AI 是 Ontology 的自然延伸",
  },
];

// =============================================================================
// Components
// =============================================================================

function RadarChart() {
  const size = 280;
  const center = size / 2;
  const radius = 100;
  const levels = 5;
  const angleStep = (Math.PI * 2) / CORE_CAPABILITIES.length;

  const getPoint = (index: number, value: number) => {
    const angle = index * angleStep - Math.PI / 2;
    const r = (value / 100) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  const gridLines = Array.from({ length: levels }, (_, i) => {
    const levelRadius = ((i + 1) / levels) * radius;
    const points = CORE_CAPABILITIES.map((_, idx) => {
      const angle = idx * angleStep - Math.PI / 2;
      return `${center + levelRadius * Math.cos(angle)},${center + levelRadius * Math.sin(angle)}`;
    }).join(" ");
    return points;
  });

  const dataPoints = CORE_CAPABILITIES.map((cap, i) => getPoint(i, cap.score));
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x},${p.y}`).join(" ") + " Z";

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="mb-4">
        {/* Grid */}
        {gridLines.map((points, i) => (
          <polygon
            key={i}
            points={points}
            fill="none"
            stroke="#2c2c2e"
            strokeWidth="1"
          />
        ))}
        {/* Axes */}
        {CORE_CAPABILITIES.map((_, i) => {
          const end = getPoint(i, 100);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={end.x}
              y2={end.y}
              stroke="#2c2c2e"
              strokeWidth="1"
            />
          );
        })}
        {/* Data area */}
        <path
          d={dataPath}
          fill="rgba(255, 59, 48, 0.15)"
          stroke="#ff3b30"
          strokeWidth="2"
        />
        {/* Data points */}
        {dataPoints.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="4"
            fill="#ff3b30"
            stroke="#1c1c1e"
            strokeWidth="2"
          />
        ))}
        {/* Labels */}
        {CORE_CAPABILITIES.map((cap, i) => {
          const angle = i * angleStep - Math.PI / 2;
          const labelRadius = radius + 28;
          const x = center + labelRadius * Math.cos(angle);
          const y = center + labelRadius * Math.sin(angle);
          return (
            <text
              key={i}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-[10px] fill-[#8e8e93]"
            >
              {cap.name}
            </text>
          );
        })}
      </svg>
      <div className="grid grid-cols-2 gap-x-6 gap-y-1">
        {CORE_CAPABILITIES.map((cap) => (
          <div key={cap.name} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cap.color }} />
            <span className="text-xs text-[#8e8e93]">{cap.name}</span>
            <span className="text-xs text-[#f5f5f7] font-medium">{cap.score}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ComparisonTable() {
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  return (
    <div className="rounded-xl border border-[#2c2c2e] overflow-hidden">
      <div className="grid grid-cols-4 gap-0 text-xs">
        {/* Header */}
        <div className="px-4 py-3 bg-[#1c1c1e] text-[#636366] font-medium uppercase tracking-wider">
          对比维度
        </div>
        <div className="px-4 py-3 bg-[#ff3b30]/10 text-[#ff3b30] font-medium text-center">
          FDE
        </div>
        <div className="px-4 py-3 bg-[#0a84ff]/10 text-[#0a84ff] font-medium text-center">
          数据工程师
        </div>
        <div className="px-4 py-3 bg-[#30d158]/10 text-[#30d158] font-medium text-center">
          全栈工程师
        </div>

        {/* Rows */}
        {ROLE_COMPARISON.map((row, i) => (
          <>
            <div
              key={`dim-${i}`}
              className={`px-4 py-3 text-[#f5f5f7] font-medium border-t border-[#2c2c2e] transition-colors ${
                hoveredRow === i ? "bg-[#1c1c1e]" : ""
              }`}
              onMouseEnter={() => setHoveredRow(i)}
              onMouseLeave={() => setHoveredRow(null)}
            >
              {row.dimension}
            </div>
            <div
              key={`fde-${i}`}
              className={`px-4 py-3 text-[#8e8e93] text-center border-t border-[#2c2c2e] transition-colors ${
                hoveredRow === i ? "bg-[#ff3b30]/5" : ""
              }`}
              onMouseEnter={() => setHoveredRow(i)}
              onMouseLeave={() => setHoveredRow(null)}
            >
              {row.fde}
            </div>
            <div
              key={`de-${i}`}
              className={`px-4 py-3 text-[#8e8e93] text-center border-t border-[#2c2c2e] transition-colors ${
                hoveredRow === i ? "bg-[#0a84ff]/5" : ""
              }`}
              onMouseEnter={() => setHoveredRow(i)}
              onMouseLeave={() => setHoveredRow(null)}
            >
              {row.dataEng}
            </div>
            <div
              key={`fs-${i}`}
              className={`px-4 py-3 text-[#8e8e93] text-center border-t border-[#2c2c2e] transition-colors ${
                hoveredRow === i ? "bg-[#30d158]/5" : ""
              }`}
              onMouseEnter={() => setHoveredRow(i)}
              onMouseLeave={() => setHoveredRow(null)}
            >
              {row.fullStack}
            </div>
          </>
        ))}
      </div>
    </div>
  );
}

function MindsetCard({
  aspect,
  traditional,
  fde,
}: {
  aspect: string;
  traditional: string;
  fde: string;
}) {
  return (
    <div className="p-4 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e] hover:border-[#3a3a3c] transition-all group">
      <div className="text-xs text-[#636366] uppercase tracking-wider mb-3">{aspect}</div>
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <XCircle className="w-4 h-4 text-[#636366] flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-[10px] text-[#636366] mb-0.5">传统思维</div>
            <div className="text-sm text-[#8e8e93]">{traditional}</div>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-4 h-4 text-[#30d158] flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-[10px] text-[#30d158] mb-0.5">FDE 思维</div>
            <div className="text-sm text-[#f5f5f7]">{fde}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Main Page
// =============================================================================

export default function Ch01FdeRolePage() {
  return (
    <div className="p-4 lg:p-8 max-w-[1200px] mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[#636366] mb-6">
        <Link href="/chapters" className="hover:text-[#f5f5f7] transition-colors">
          学习章节
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-[#8e8e93]">第一回</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#ff3b30]/10 flex items-center justify-center">
            <UserCog className="w-5 h-5 text-[#ff3b30]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#f5f5f7]">什么是 FDE</h1>
            <p className="text-sm text-[#636366]">
              Foundry 开发工程师的角色定义与核心能力模型
            </p>
          </div>
        </div>
      </div>

      {/* Role Definition Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
          <div className="w-10 h-10 rounded-lg bg-[#ff3b30]/10 flex items-center justify-center mb-3">
            <Target className="w-5 h-5 text-[#ff3b30]" />
          </div>
          <h3 className="text-sm font-semibold text-[#f5f5f7] mb-2">核心定位</h3>
          <p className="text-xs text-[#8e8e93] leading-relaxed">
            FDE 是连接业务与技术的桥梁，通过 Ontology 建模将业务概念转化为数字实体，
            并构建 Ontology 感知应用。
          </p>
        </div>
        <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
          <div className="w-10 h-10 rounded-lg bg-[#ff9f0a]/10 flex items-center justify-center mb-3">
            <Brain className="w-5 h-5 text-[#ff9f0a]" />
          </div>
          <h3 className="text-sm font-semibold text-[#f5f5f7] mb-2">思维特点</h3>
          <p className="text-xs text-[#8e8e93] leading-relaxed">
            Object-First 思维：一切从业务实体出发，而非表结构或 API 端点。
            关注「是什么」而非「怎么存」。
          </p>
        </div>
        <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
          <div className="w-10 h-10 rounded-lg bg-[#30d158]/10 flex items-center justify-center mb-3">
            <Workflow className="w-5 h-5 text-[#30d158]" />
          </div>
          <h3 className="text-sm font-semibold text-[#f5f5f7] mb-2">工作方式</h3>
          <p className="text-xs text-[#8e8e93] leading-relaxed">
            与业务专家共建 Ontology，通过 Action Types 驱动变更，
            使用 Workshop 快速构建应用原型。
          </p>
        </div>
      </div>

      {/* Radar Chart + Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
          <h3 className="text-sm font-semibold text-[#f5f5f7] mb-4">
            FDE 核心能力雷达图
          </h3>
          <RadarChart />
        </div>
        <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
          <h3 className="text-sm font-semibold text-[#f5f5f7] mb-4">
            角色对比
          </h3>
          <ComparisonTable />
        </div>
      </div>

      {/* ============================================ */}
      {/* FDE 的典型一天（博客文字） */}
      {/* ============================================ */}
      <div className="mb-8">
        <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
          <h3 className="text-sm font-semibold text-[#f5f5f7] mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#ff9f0a]" />
            FDE 的典型一天
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { time: "09:00", activity: "Standup", desc: "同步进度、讨论阻塞问题", icon: "👥" },
              { time: "10:00", activity: "Ontology 建模", desc: "与业务方讨论新增 Object Type", icon: "🔧" },
              { time: "12:00", activity: "午餐 + 技术讨论", desc: "与团队分享最新技术", icon: "🍜" },
              { time: "14:00", activity: "应用开发", desc: "用 Workshop 构建 Ontology 感知应用", icon: "💻" },
              { time: "16:00", activity: "数据工程", desc: "接入新数据源，配置 ETL 管道", icon: "📊" },
              { time: "18:00", activity: "Demo 准备", desc: "准备给客户的功能演示", icon: "🎤" },
            ].map((item) => (
              <div key={item.time} className="p-3 rounded-lg bg-[#141416] border border-[#2c2c2e]">
                <div className="text-xs font-bold text-[#ff9f0a] mb-1">{item.time}</div>
                <div className="text-xs font-medium text-[#f5f5f7] mb-1">{item.activity}</div>
                <div className="text-[10px] text-[#636366]">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* FDE 工具链详解 */}
      {/* ============================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
          <h3 className="text-sm font-semibold text-[#f5f5f7] mb-3">核心工具栈</h3>
          <div className="space-y-2">
            {[
              { tool: "Ontology Manager", purpose: "定义 Object Type、Link Type、Action Type" },
              { tool: "Workshop", purpose: "低代码应用构建" },
              { tool: "Object Explorer", purpose: "自动生成的数据浏览器" },
              { tool: "Quiver", purpose: "交互式数据分析" },
              { tool: "Slate", purpose: "全代码定制开发" },
              { tool: "AIP Logic", purpose: "AI 工作流编排" },
            ].map((item) => (
              <div key={item.tool} className="flex items-center justify-between p-2 rounded bg-[#141416] border border-[#2c2c2e]">
                <span className="text-xs font-medium text-[#f5f5f7]">{item.tool}</span>
                <span className="text-[10px] text-[#636366]">{item.purpose}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
          <h3 className="text-sm font-semibold text-[#f5f5f7] mb-3">学习路径建议</h3>
          <div className="space-y-3">
            {[
              { phase: "第1-3个月", skill: "基础入门", desc: "学习 Ontology 概念、Foundry 平台操作、Workshop 基础" },
              { phase: "第3-6个月", skill: "能力构建", desc: "掌握 Ontology 建模、数据工程、简单应用开发" },
              { phase: "第6-12个月", skill: "进阶成长", desc: "掌握 AIP、Function 开发、Slate 开发" },
              { phase: "12个月+", skill: "专家之路", desc: "架构设计、团队领导、业务战略" },
            ].map((item) => (
              <div key={item.phase} className="p-3 rounded bg-[#141416] border border-[#2c2c2e]">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold text-[#30d158]">{item.phase}</span>
                  <span className="text-xs font-medium text-[#f5f5f7]">{item.skill}</span>
                </div>
                <span className="text-[10px] text-[#636366]">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mindset Differences */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-[#f5f5f7] mb-4">
          思维差异：传统 vs FDE
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {MINDSET_DIFFERENCES.map((item) => (
            <MindsetCard key={item.aspect} {...item} />
          ))}
        </div>
      </div>

      {/* ============================================ */}
      {/* FDE 学习路径详解 */}
      {/* ============================================ */}
      <div className="mb-8">
        <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
          <h3 className="text-sm font-semibold text-[#f5f5f7] mb-4">FDE 学习路径指南</h3>
          <div className="space-y-4">
            {[
              {
                phase: "第一阶段：基础认知",
                duration: "2-3 周",
                color: "#0a84ff",
                items: ["理解 Palantir 四大产品线定位", "学习 Ontology 核心概念（Object/Link/Action）", "掌握 Foundry 界面操作", "完成 AIP Bootcamp 基础课程"],
              },
              {
                phase: "第二阶段：核心技能",
                duration: "4-6 周",
                color: "#ff9f0a",
                items: ["掌握 Ontology 建模最佳实践", "学习数据工程五阶段流水线", "熟练使用 Workshop 构建应用", "实践 Action Types 开发"],
              },
              {
                phase: "第三阶段：实战项目",
                duration: "8-12 周",
                color: "#30d158",
                items: ["独立完成端到端 Ontology 建模", "构建语义层与向量搜索", "开发 AI Agent 应用", "完成完整项目交付"],
              },
              {
                phase: "第四阶段：进阶成长",
                duration: "持续",
                color: "#bf5af2",
                items: ["深入 AI 能力集成", "掌握高级性能优化", "参与社区贡献", "成为领域专家"],
              },
            ].map((phase) => (
              <div key={phase.phase} className="p-4 rounded-lg bg-[#141416] border border-[#2c2c2e]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: phase.color }} />
                    <span className="text-xs font-medium text-[#f5f5f7]">{phase.phase}</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#2c2c2e] text-[#8e8e93]">{phase.duration}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {phase.items.map((item) => (
                    <span key={item} className="text-[10px] px-2 py-0.5 rounded bg-[#1c1c1e] text-[#8e8e93]">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* FDE 职业发展方向 */}
      {/* ============================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
          <h3 className="text-sm font-semibold text-[#f5f5f7] mb-3">技术方向</h3>
          <div className="space-y-2">
            {[
              { role: "Ontology 架构师", desc: "负责大型 Ontology 设计与治理" },
              { role: "AI 集成专家", desc: "专注 LLM 与 Ontology 融合" },
              { role: "数据工程师", desc: "构建高效数据管道" },
              { role: "应用开发专家", desc: "精通 Workshop/Quiver/Slate" },
            ].map((item) => (
              <div key={item.role} className="p-3 rounded bg-[#141416] border border-[#2c2c2e]">
                <span className="text-xs font-medium text-[#f5f5f7] block">{item.role}</span>
                <span className="text-[10px] text-[#636366]">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
          <h3 className="text-sm font-semibold text-[#f5f5f7] mb-3">业务方向</h3>
          <div className="space-y-2">
            {[
              { role: "行业解决方案专家", desc: "深耕特定行业领域知识" },
              { role: "客户成功工程师", desc: "保障客户价值实现" },
              { role: "售前技术顾问", desc: "技术方案设计与演示" },
              { role: "产品经理", desc: "产品规划与需求分析" },
            ].map((item) => (
              <div key={item.role} className="p-3 rounded bg-[#141416] border border-[#2c2c2e]">
                <span className="text-xs font-medium text-[#f5f5f7] block">{item.role}</span>
                <span className="text-[10px] text-[#636366]">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* FDE 角色深度解析（基于 Palantir 官方定义） */}
      {/* ============================================ */}
      <div className="mb-8">
        <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
          <h3 className="text-sm font-semibold text-[#f5f5f7] mb-4">FDE 角色深度解析</h3>
          <div className="space-y-4 text-xs text-[#8e8e93] leading-relaxed">
            <p>
              <strong className="text-[#f5f5f7]">Forward Deployed Engineer（FDE）</strong>是 Palantir 生态系统中独特的角色定位。
              根据 Palantir 官方定义，FDE 是「客户现场与产品研发的桥梁」，在客户现场端到端交付 Palantir Foundry/Gotham/AIP 解决方案，
              解决复杂业务与数据问题，推动平台落地与价值闭环，同时将客户反馈回流产品迭代。
            </p>
            <p>
              FDE 的第一价值不是代码写得多溜，而是<strong className="text-[#f5f5f7]">弥合「标准化软件平台」与「非标准化企业业务」之间的鸿沟</strong>。
              企业的现实往往是：ERP 系统里的表结构像一团乱麻，主数据错漏百出。FDE 的价值，就是把复杂、肮脏的现实业务，
              精准地「翻译」成 Palantir 里的 Ontology，让系统真正能跑通真实世界的商业逻辑。
              他们是懂技术的业务顾问，也是懂业务的架构师。
            </p>
            <p>
              FDE 面临的环境永远是高压和未知的。今天可能在空客的装配车间看飞机零部件的 BOM 表，
              下周可能就被丢进食品加工厂去盘点冷链物流。他们必须具备极强的短时间降维学习能力。
              不需要懂所有细节，但必须能在几天内，通过不断连问「5个为什么」（5 Whys），
              迅速抓住核心业务的主干逻辑，敢于打破原有的部门数据壁垒，重构业务流。
            </p>
            <p>
              Palantir 极其依赖的 <strong className="text-[#f5f5f7]">Bootcamp（训练营）模式</strong>，本质上是一场为期 3 到 5 天的「极限生存战」。
              Day 1 直面「数据泥潭」，把脏乱差的源头数据「暴力」接入 Foundry；
              Day 2 砍掉伪需求，锁定 MVP；Day 3-4 闭门造车与疯狂迭代；
              Day 5 高管路演与「Aha Moment」。Bootcamp 不是培训，而是用最短的时间、最高的压强，
              逼着业务知识与底层代码发生化学反应。
            </p>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* FDE 核心职责详解 */}
      {/* ============================================ */}
      <div className="mb-8">
        <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
          <h3 className="text-sm font-semibold text-[#f5f5f7] mb-4">FDE 核心职责详解</h3>
          <div className="space-y-4">
            {[
              {
                title: "客户现场深度协作",
                desc: "驻场客户侧，快速理解业务痛点，转化为可落地的 Palantir 平台解决方案，覆盖需求定义、架构设计、POC 验证到生产部署。FDE 必须极其强势地把范围缩小：'不，这 5 天我们只解决一个问题'。",
              },
              {
                title: "全栈方案交付",
                desc: "使用 Foundry Pipeline Builder、Ontology、Slate、AIP 等工具，结合 Python/Java/TypeScript 开发数据集成、模型构建、定制应用与工作流。不是'完成了 60%'，而是设计仪表盘展示进度条、风险信号灯、下一步行动项。",
              },
              {
                title: "数据治理与合规",
                desc: "设计数据接入、清洗、转换与权限体系，确保数据完整性、安全性与行业合规（如 GDPR、HIPAA、FedRAMP）。实施数据验证、监控和文档，确保可追溯性。",
              },
              {
                title: "客户赋能与推广",
                desc: "主导平台培训、最佳实践分享，推动用户 adoption，识别交叉销售与扩展机会，提升客户价值与粘性。第一周就搭建可点击原型，展示核心流程。",
              },
              {
                title: "跨团队协同",
                desc: "与客户 IT、业务、安全团队及 Palantir 内部研发、产品、支持团队紧密协作，解决跨系统集成与技术瓶颈。主动识别阻塞、差距或模糊性，无需等待指令即可推动解决。",
              },
            ].map((item) => (
              <div key={item.title} className="p-3 rounded bg-[#141416] border border-[#2c2c2e]">
                <span className="text-xs font-medium text-[#f5f5f7] block mb-1">{item.title}</span>
                <span className="text-[10px] text-[#636366] leading-relaxed">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Key Takeaway */}
      <div className="p-5 rounded-xl bg-[#ff3b30]/5 border border-[#ff3b30]/20">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-[#ff3b30] flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-[#f5f5f7] mb-2">核心要点</h3>
            <p className="text-xs text-[#8e8e93] leading-relaxed">
              FDE 不是传统工程师的简单叠加，而是一种全新的工程范式。
              核心差异在于<strong className="text-[#f5f5f7]">Object-First 思维</strong>：
              从业务实体出发，通过 Ontology 建模、Action 驱动变更、Function 计算派生属性，
              最终构建 Ontology 感知应用。AI 不是外挂模块，而是 Ontology 的自然延伸。
              FDE 是「拿着高薪的高级泥腿子」——软件卖出去了，如果客户不会用、用不好，
              FDE 就得直接空降到前线，把炮火和泥泞挡在研发团队之外。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
