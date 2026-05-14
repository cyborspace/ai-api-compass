"use client";

import { useState } from "react";
import {
  TrendingUp,
  ChevronRight,
  Target,
  Code2,
  Brain,
  Rocket,
  Sparkles,
  DollarSign,
  MapPin,
  Calendar,
  BookOpen,
  Globe,
  GraduationCap,
  Lightbulb,
  Users,
  Briefcase,
  Star,
  Layers,
  Database,
  Shield,
  Cpu,
  GitBranch,
} from "lucide-react";
import Link from "next/link";

// =============================================================================
// Data
// =============================================================================

const CAREER_STAGES = [
  {
    id: "junior",
    title: "初级 FDE",
    years: "0-2 年",
    salary: "15-25K",
    color: "#ff3b30",
    icon: Target,
    responsibilities: [
      "学习 Ontology 基础概念",
      "参与数据工程任务",
      "协助应用开发",
      "编写 SQL 查询",
    ],
    skills: ["Ontology 基础", "SQL", "Foundry 平台", "数据工程"],
  },
  {
    id: "mid",
    title: "中级 FDE",
    years: "2-5 年",
    salary: "25-40K",
    color: "#ff9f0a",
    icon: Code2,
    responsibilities: [
      "独立设计 Ontology 模型",
      "开发 Action 和 Function",
      "构建 Ontology 感知应用",
      "指导初级工程师",
    ],
    skills: ["Ontology 建模", "Action 设计", "Function 开发", "应用开发"],
  },
  {
    id: "senior",
    title: "高级 FDE",
    years: "5-8 年",
    salary: "40-60K",
    color: "#30d158",
    icon: Brain,
    responsibilities: [
      "设计复杂 Ontology 架构",
      "AIP Logic 工作流编排",
      "LLM 集成与 Agent 部署",
      "技术方案评审",
    ],
    skills: ["AIP Logic", "LLM 集成", "Agent 部署", "性能优化"],
  },
  {
    id: "lead",
    title: "FDE 负责人",
    years: "8-12 年",
    salary: "60-80K",
    color: "#0a84ff",
    icon: Rocket,
    responsibilities: [
      "团队技术规划",
      "跨团队协作",
      "技术选型决策",
      "培养团队成员",
    ],
    skills: ["团队管理", "技术规划", "跨团队协作", "人才培养"],
  },
  {
    id: "expert",
    title: "FDE 专家",
    years: "12+ 年",
    salary: "80K+",
    color: "#bf5af2",
    icon: Sparkles,
    responsibilities: [
      "行业影响力建设",
      "创新技术研究",
      "企业级架构设计",
      "战略决策参与",
    ],
    skills: ["架构设计", "创新研究", "行业影响力", "战略决策"],
  },
];

const DETAILED_STAGES = [
  {
    level: "初级 FDE",
    color: "#ff3b30",
    icon: GraduationCap,
    duties: ["数据接入 (将数据接入 Palantir 平台)", "Ontology 构建 (在指导下构建 Ontology)", "应用开发 (开发简单应用)", "技术支持 (为客户提供技术支持)"],
    skillReqs: ["编程语言: Python、TypeScript、SQL", "数据库: 关系型数据库", "Palantir 平台: Ontology、Workshop", "数据工程: ETL/ELT"],
    goals: ["独立负责小型项目", "能够设计简单的 Ontology", "能够与客户直接沟通"],
  },
  {
    level: "中级 FDE",
    color: "#ff9f0a",
    icon: Briefcase,
    duties: ["独立负责项目", "设计复杂 Ontology", "指导初级 FDE", "与客户直接沟通"],
    skillReqs: ["编程语言: Python、TypeScript、SQL", "数据库: 关系型数据库、NoSQL", "Palantir: Ontology、AIP、Workshop、Slate", "数据工程: ETL/ELT、数据建模", "AI: 机器学习、LLM"],
    goals: ["能够设计系统架构", "能够管理小型团队", "能够拓展新业务"],
  },
  {
    level: "高级 FDE",
    color: "#30d158",
    icon: Star,
    duties: ["设计系统架构", "做出关键技术决策", "管理团队", "拓展新业务"],
    skillReqs: ["编程语言: Python、TypeScript、SQL", "数据库: 关系型数据库、NoSQL", "Palantir: Ontology、AIP、Workshop、Slate、Quiver、Foundry", "数据工程: ETL/ELT、数据建模、数据质量", "AI: 机器学习、深度学习、LLM、MLOps", "管理: 团队管理、项目管理"],
    goals: ["成为技术专家", "晋升为管理岗位", "创业或加入初创公司"],
  },
];

const CAREER_PATHS = [
  {
    title: "技术专家路线",
    color: "#0a84ff",
    icon: Cpu,
    stages: [
      { name: "初级 FDE", description: "学习基础技能" },
      { name: "中级 FDE", description: "深入技术领域" },
      { name: "高级 FDE", description: "成为技术专家" },
      { name: "首席 FDE", description: "成为首席技术专家" },
    ],
  },
  {
    title: "管理路线",
    color: "#ff9f0a",
    icon: Users,
    stages: [
      { name: "初级 FDE", description: "学习基础技能" },
      { name: "中级 FDE", description: "开始指导他人" },
      { name: "高级 FDE", description: "管理团队" },
      { name: "经理", description: "管理多个团队" },
      { name: "总监", description: "管理整个部门" },
    ],
  },
  {
    title: "创业路线",
    color: "#30d158",
    icon: Rocket,
    stages: [
      { name: "初级 FDE", description: "学习基础技能" },
      { name: "中级 FDE", description: "积累项目经验" },
      { name: "高级 FDE", description: "积累行业资源" },
      { name: "创业", description: "创办自己的公司" },
    ],
  },
];

const LEARNING_RESOURCES = [
  { name: "官方文档", description: "Palantir 官方文档", color: "#ff3b30" },
  { name: "在线课程", description: "Coursera、Udemy", color: "#ff9f0a" },
  { name: "技术博客", description: "Medium、Dev.to", color: "#30d158" },
  { name: "开源项目", description: "GitHub", color: "#0a84ff" },
  { name: "技术社区", description: "Stack Overflow、Reddit", color: "#bf5af2" },
];

const LEARNING_METHODS = [
  { method: "项目驱动", description: "通过项目学习", color: "#ff3b30" },
  { method: "问题导向", description: "通过解决问题学习", color: "#ff9f0a" },
  { method: "社区参与", description: "参与技术社区", color: "#30d158" },
  { method: "分享输出", description: "通过分享学习", color: "#0a84ff" },
];

const CERTIFICATIONS = [
  { cert: "Palantir 认证", description: "Palantir 官方认证", color: "#ff3b30" },
  { cert: "云认证", description: "AWS、Azure、GCP 认证", color: "#ff9f0a" },
  { cert: "数据认证", description: "数据工程师认证", color: "#30d158" },
  { cert: "AI 认证", description: "机器学习工程师认证", color: "#0a84ff" },
];

const INDUSTRY_TRENDS = [
  { year: "2024", trend: "AIP 集成需求激增", growth: "+150%" },
  { year: "2025", trend: "Agent 部署成为标配", growth: "+200%" },
  { year: "2026", trend: "多模态 AI 集成", growth: "+180%" },
  { year: "2027", trend: "Auto-Ontology 生成", growth: "+120%" },
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

function CareerTimeline() {
  const [activeStage, setActiveStage] = useState<string>("junior");

  return (
    <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
      <h3 className="text-sm font-semibold text-[#f5f5f7] mb-4">职业发展时间线</h3>

      {/* Timeline */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {CAREER_STAGES.map((stage, index) => {
          const Icon = stage.icon;
          const isActive = activeStage === stage.id;
          return (
            <button
              key={stage.id}
              onClick={() => setActiveStage(stage.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all flex-shrink-0 ${
                isActive
                  ? "text-white font-medium"
                  : "bg-[#141416] text-[#8e8e93] border border-[#2c2c2e] hover:border-[#3a3a3c]"
              }`}
              style={
                isActive
                  ? { backgroundColor: stage.color, borderColor: stage.color }
                  : {}
              }
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{stage.title}</span>
            </button>
          );
        })}
      </div>

      {/* Stage Detail */}
      {(() => {
        const stage = CAREER_STAGES.find((s) => s.id === activeStage);
        if (!stage) return null;
        const Icon = stage.icon;
        return (
          <div className="p-4 rounded-lg bg-[#141416] border border-[#2c2c2e]">
            <div className="flex items-start gap-3 mb-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${stage.color}15` }}
              >
                <Icon className="w-5 h-5" style={{ color: stage.color }} />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[#f5f5f7]">{stage.title}</h4>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] text-[#8e8e93] flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {stage.years}
                  </span>
                  <span className="text-[10px] text-[#8e8e93] flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    {stage.salary}
                  </span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-[10px] text-[#636366] uppercase tracking-wider mb-2">
                  职责
                </div>
                <ul className="space-y-1">
                  {stage.responsibilities.map((r) => (
                    <li key={r} className="flex items-center gap-2 text-xs text-[#8e8e93]">
                      <ChevronRight className="w-3 h-3 text-[#636366]" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="text-[10px] text-[#636366] uppercase tracking-wider mb-2">
                  核心技能
                </div>
                <div className="flex flex-wrap gap-1">
                  {stage.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-2 py-0.5 rounded text-[10px] bg-[#2c2c2e] text-[#8e8e93]"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

function DetailedStages() {
  const [activeStage, setActiveStage] = useState("初级 FDE");

  const stage = DETAILED_STAGES.find((s) => s.level === activeStage);

  return (
    <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
      <h3 className="text-sm font-semibold text-[#f5f5f7] mb-4">各阶段详解</h3>

      <div className="flex flex-wrap gap-2 mb-4">
        {DETAILED_STAGES.map((s) => (
          <button
            key={s.level}
            onClick={() => setActiveStage(s.level)}
            className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
              activeStage === s.level
                ? "text-white font-medium"
                : "bg-[#141416] text-[#8e8e93] border border-[#2c2c2e] hover:border-[#3a3a3c]"
            }`}
            style={activeStage === s.level ? { backgroundColor: s.color, borderColor: s.color } : {}}
          >
            {s.level}
          </button>
        ))}
      </div>

      {stage && (
        <div className="space-y-4">
          <div>
            <div className="text-[10px] text-[#636366] uppercase tracking-wider mb-2">职责</div>
            <div className="grid grid-cols-2 gap-2">
              {stage.duties.map((d) => (
                <div key={d} className="flex items-center gap-2 text-xs text-[#8e8e93] p-2 rounded bg-[#2c2c2e]/30">
                  <ChevronRight className="w-3 h-3 text-[#636366]" />
                  {d}
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-[#636366] uppercase tracking-wider mb-2">技能要求</div>
            <div className="flex flex-wrap gap-1">
              {stage.skillReqs.map((s) => (
                <span key={s} className="px-2 py-1 rounded text-[10px] bg-[#2c2c2e] text-[#8e8e93]">{s}</span>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-[#636366] uppercase tracking-wider mb-2">发展目标</div>
            <div className="flex flex-wrap gap-1">
              {stage.goals.map((g) => (
                <span key={g} className="px-2 py-1 rounded text-[10px] bg-[#30d158]/10 text-[#30d158] border border-[#30d158]/20">{g}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CareerPaths() {
  return (
    <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
      <h3 className="text-sm font-semibold text-[#f5f5f7] mb-4">职业转型路线</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {CAREER_PATHS.map((path) => {
          const Icon = path.icon;
          return (
            <div key={path.title} className="p-4 rounded-xl bg-[#141416] border border-[#2c2c2e]">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${path.color}15` }}>
                  <Icon className="w-4 h-4" style={{ color: path.color }} />
                </div>
                <span className="text-sm font-semibold text-[#f5f5f7]">{path.title}</span>
              </div>
              <div className="space-y-2">
                {path.stages.map((stage, index) => (
                  <div key={stage.name} className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold flex-shrink-0"
                      style={{
                        backgroundColor: index === path.stages.length - 1 ? path.color : `${path.color}20`,
                        color: index === path.stages.length - 1 ? "#fff" : path.color,
                      }}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <div className="text-xs font-medium text-[#f5f5f7]">{stage.name}</div>
                      <div className="text-[10px] text-[#636366]">{stage.description}</div>
                    </div>
                    {index < path.stages.length - 1 && (
                      <ChevronRight className="w-3 h-3 text-[#636366] ml-auto" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ContinuousLearning() {
  const [activeTab, setActiveTab] = useState<"resources" | "methods" | "certs">("resources");

  return (
    <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
      <h3 className="text-sm font-semibold text-[#f5f5f7] mb-4">持续学习</h3>

      <div className="flex gap-1 mb-4 bg-[#141416] rounded-lg p-0.5">
        <button onClick={() => setActiveTab("resources")} className={`flex-1 px-3 py-1.5 rounded text-xs transition-all ${activeTab === "resources" ? "bg-[#ff3b30]/20 text-[#ff3b30]" : "text-[#8e8e93]"}`}>学习资源</button>
        <button onClick={() => setActiveTab("methods")} className={`flex-1 px-3 py-1.5 rounded text-xs transition-all ${activeTab === "methods" ? "bg-[#ff9f0a]/20 text-[#ff9f0a]" : "text-[#8e8e93]"}`}>学习方法</button>
        <button onClick={() => setActiveTab("certs")} className={`flex-1 px-3 py-1.5 rounded text-xs transition-all ${activeTab === "certs" ? "bg-[#30d158]/20 text-[#30d158]" : "text-[#8e8e93]"}`}>认证考试</button>
      </div>

      {activeTab === "resources" && (
        <div className="space-y-2">
          {LEARNING_RESOURCES.map((item) => (
            <div key={item.name} className="flex items-center gap-3 p-3 rounded-lg bg-[#141416] border border-[#2c2c2e]">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${item.color}15` }}>
                <BookOpen className="w-4 h-4" style={{ color: item.color }} />
              </div>
              <div>
                <div className="text-xs font-medium text-[#f5f5f7]">{item.name}</div>
                <div className="text-[10px] text-[#8e8e93]">{item.description}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "methods" && (
        <div className="grid grid-cols-2 gap-3">
          {LEARNING_METHODS.map((item) => (
            <div key={item.method} className="p-3 rounded-lg bg-[#141416] border border-[#2c2c2e]">
              <div className="flex items-center gap-2 mb-1">
                <Lightbulb className="w-3.5 h-3.5" style={{ color: item.color }} />
                <span className="text-xs font-medium text-[#f5f5f7]">{item.method}</span>
              </div>
              <div className="text-[10px] text-[#8e8e93]">{item.description}</div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "certs" && (
        <div className="space-y-2">
          {CERTIFICATIONS.map((item) => (
            <div key={item.cert} className="flex items-center justify-between p-3 rounded-lg bg-[#141416] border border-[#2c2c2e]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${item.color}15` }}>
                  <Shield className="w-4 h-4" style={{ color: item.color }} />
                </div>
                <div>
                  <div className="text-xs font-medium text-[#f5f5f7]">{item.cert}</div>
                  <div className="text-[10px] text-[#8e8e93]">{item.description}</div>
                </div>
              </div>
              <Sparkles className="w-3.5 h-3.5" style={{ color: item.color }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function IndustryTrends() {
  return (
    <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
      <h3 className="text-sm font-semibold text-[#f5f5f7] mb-4">行业趋势</h3>
      <div className="space-y-3">
        {INDUSTRY_TRENDS.map((trend) => (
          <div
            key={trend.year}
            className="flex items-center gap-3 p-3 rounded-lg bg-[#141416] border border-[#2c2c2e]"
          >
            <span className="text-xs font-medium text-[#f5f5f7] w-10">{trend.year}</span>
            <span className="text-xs text-[#8e8e93] flex-1">{trend.trend}</span>
            <span className="text-xs text-[#30d158] font-medium">{trend.growth}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// Main Page
// =============================================================================

export default function Ch14CareerPathPage() {
  return (
    <div className="p-4 lg:p-8 max-w-[1200px] mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[#636366] mb-6">
        <Link href="/chapters" className="hover:text-[#f5f5f7] transition-colors">
          学习章节
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-[#8e8e93]">第十四回</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#ff9f0a]/10 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-[#ff9f0a]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#f5f5f7]">职业发展路径</h1>
            <p className="text-sm text-[#636366]">
              从初级到专家的完整职业规划、三条转型路线与持续学习策略
            </p>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* 14.1-14.3 各阶段详解 */}
      {/* ============================================ */}
      <div className="mb-6">
        <SectionHeader icon={Target} title="14.1 初级 → 14.2 中级 → 14.3 高级" color="#ff3b30" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <CareerTimeline />
        <DetailedStages />
      </div>

      {/* ============================================ */}
      {/* 14.4 职业转型 */}
      {/* ============================================ */}
      <div className="mb-6 mt-10">
        <SectionHeader icon={GitBranch} title="14.4 职业转型" color="#0a84ff" />
      </div>

      <div className="mb-8">
        <CareerPaths />
      </div>

      {/* ============================================ */}
      {/* 14.5 持续学习 */}
      {/* ============================================ */}
      <div className="mb-6 mt-10">
        <SectionHeader icon={BookOpen} title="14.5 持续学习" color="#30d158" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2">
          <ContinuousLearning />
        </div>
        <div>
          <IndustryTrends />
        </div>
      </div>

      {/* Key Takeaway */}
      <div className="p-5 rounded-xl bg-[#ff9f0a]/5 border border-[#ff9f0a]/20">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-[#ff9f0a] flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-[#f5f5f7] mb-2">核心要点</h3>
            <p className="text-xs text-[#8e8e93] leading-relaxed">
              FDE 是一个快速发展的新兴职业。职业发展路径清晰：从初级到专家，每个阶段都有明确的技能要求和职责范围。
              三条转型路线（<strong className="text-[#f5f5f7]">技术专家</strong>、<strong className="text-[#f5f5f7]">管理</strong>、<strong className="text-[#f5f5f7]">创业</strong>）
              提供了多元化的职业选择。通过持续学习和认证考试，FDE 可以保持竞争力。
              行业趋势显示，<strong className="text-[#f5f5f7]">AIP 集成</strong>和<strong className="text-[#f5f5f7]">Agent 部署</strong>
              将成为未来几年的核心需求。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}