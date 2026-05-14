"use client";

import { useState } from "react";
import {
  GitBranch,
  ChevronRight,
  Target,
  Database,
  Code2,
  Brain,
  Sparkles,
  CheckCircle2,
  Lock,
  Star,
  MessageSquare,
  Users,
  Calendar,
  Clock,
  Shield,
  Lightbulb,
  TrendingUp,
  GraduationCap,
  Briefcase,
  FileText,
  Presentation,
  Timer,
  AlertTriangle,
  Layers,
  BookOpen,
  Network,
} from "lucide-react";
import Link from "next/link";

// =============================================================================
// Data
// =============================================================================

const SKILL_LEVELS = [
  {
    level: "初级 FDE",
    color: "#ff3b30",
    skills: [
      { name: "Ontology 基础", icon: Target, completed: true },
      { name: "数据工程", icon: Database, completed: true },
      { name: "Foundry 平台", icon: Code2, completed: true },
      { name: "SQL 查询", icon: Database, completed: true },
    ],
  },
  {
    level: "中级 FDE",
    color: "#ff9f0a",
    skills: [
      { name: "Ontology 建模", icon: Target, completed: true },
      { name: "Action 设计", icon: Code2, completed: true },
      { name: "Function 开发", icon: Brain, completed: true },
      { name: "应用开发", icon: Code2, completed: false },
    ],
  },
  {
    level: "高级 FDE",
    color: "#30d158",
    skills: [
      { name: "AIP Logic", icon: Brain, completed: false },
      { name: "LLM 集成", icon: Brain, completed: false },
      { name: "Agent 部署", icon: Code2, completed: false },
      { name: "性能优化", icon: Database, completed: false },
    ],
  },
  {
    level: "专家 FDE",
    color: "#0a84ff",
    skills: [
      { name: "架构设计", icon: Target, completed: false },
      { name: "团队领导", icon: Brain, completed: false },
      { name: "业务战略", icon: Sparkles, completed: false },
      { name: "创新研究", icon: Brain, completed: false },
    ],
  },
];

const TECH_SKILL_CATEGORIES = [
  {
    title: "基础技能",
    color: "#ff3b30",
    icon: Code2,
    items: [
      { name: "编程语言", note: "Python、TypeScript、SQL", importance: "必备" },
      { name: "数据结构与算法", note: "数组、链表、树、图", importance: "必备" },
      { name: "数据库", note: "关系型数据库、NoSQL", importance: "必备" },
      { name: "版本控制", note: "Git", importance: "必备" },
      { name: "Linux", note: "基本命令、Shell 脚本", importance: "重要" },
      { name: "网络", note: "HTTP、TCP/IP、RESTful API", importance: "重要" },
    ],
  },
  {
    title: "数据工程技能",
    color: "#ff9f0a",
    icon: Database,
    items: [
      { name: "ETL/ELT", note: "数据抽取、转换、加载", importance: "必备" },
      { name: "数据建模", note: "维度建模、关系建模", importance: "必备" },
      { name: "数据质量", note: "数据清洗、数据验证", importance: "必备" },
      { name: "数据管道", note: "Airflow、Dagster", importance: "重要" },
      { name: "大数据", note: "Spark、Hadoop", importance: "重要" },
      { name: "流处理", note: "Kafka、Flink", importance: "重要" },
    ],
  },
  {
    title: "Palantir 平台技能",
    color: "#30d158",
    icon: Layers,
    items: [
      { name: "Ontology", note: "Object Type、Property、Link Type", importance: "必备" },
      { name: "AIP", note: "AIP Logic、Model Catalog", importance: "必备" },
      { name: "Workshop", note: "低代码应用开发", importance: "重要" },
      { name: "Slate", note: "全代码应用开发", importance: "重要" },
      { name: "Quiver", note: "数据分析", importance: "重要" },
      { name: "Foundry", note: "数据集成", importance: "重要" },
    ],
  },
  {
    title: "AI 技能",
    color: "#0a84ff",
    icon: Brain,
    items: [
      { name: "机器学习", note: "监督学习、无监督学习", importance: "重要" },
      { name: "深度学习", note: "神经网络、CNN、RNN", importance: "重要" },
      { name: "NLP", note: "文本处理、语义分析", importance: "重要" },
      { name: "LLM", note: "大语言模型、Prompt Engineering", importance: "重要" },
      { name: "MLOps", note: "模型部署、监控", importance: "重要" },
    ],
  },
];

const SOFT_SKILLS = [
  {
    title: "沟通能力",
    color: "#ff3b30",
    icon: MessageSquare,
    items: [
      { skill: "技术翻译", description: "将技术概念转化为业务语言", improve: "多与客户交流" },
      { skill: "需求挖掘", description: "挖掘客户的真实需求", improve: "练习 5 Whys" },
      { skill: "演示能力", description: "清晰展示技术方案", improve: "多练习演讲" },
      { skill: "文档能力", description: "编写清晰的技术文档", improve: "多写文档" },
    ],
  },
  {
    title: "项目管理能力",
    color: "#ff9f0a",
    icon: Briefcase,
    items: [
      { skill: "时间管理", description: "合理安排时间", improve: "使用番茄工作法" },
      { skill: "风险管理", description: "识别和管理风险", improve: "学习风险管理框架" },
      { skill: "团队协作", description: "与团队成员协作", improve: "多参与团队项目" },
      { skill: "敏捷开发", description: "掌握敏捷开发方法", improve: "学习 Scrum、Kanban" },
    ],
  },
  {
    title: "问题解决能力",
    color: "#30d158",
    icon: Lightbulb,
    items: [
      { skill: "分析能力", description: "分析问题的根本原因", improve: "学习 RCA" },
      { skill: "创新能力", description: "提出创新的解决方案", improve: "多思考、多尝试" },
      { skill: "决策能力", description: "做出正确的决策", improve: "学习决策框架" },
      { skill: "学习能力", description: "快速学习新技术", improve: "保持好奇心" },
    ],
  },
];

const INTERVIEW_SECTIONS = [
  {
    type: "技术面试",
    color: "#ff3b30",
    items: [
      { name: "算法题", description: "数据结构与算法", prep: "LeetCode 刷题" },
      { name: "系统设计", description: "设计分布式系统", prep: "学习系统设计案例" },
      { name: "SQL 题", description: "编写复杂 SQL", prep: "练习 SQL 题目" },
      { name: "Ontology 设计", description: "设计 Ontology", prep: "练习 Ontology 设计" },
      { name: "项目经验", description: "介绍过往项目", prep: "准备项目案例" },
    ],
  },
  {
    type: "行为面试",
    color: "#ff9f0a",
    items: [
      { name: "自我介绍", description: "介绍自己的背景", prep: "准备 1-2 分钟版本" },
      { name: "项目介绍", description: "介绍过往项目", prep: "使用 STAR 法则" },
      { name: "团队协作", description: "描述团队协作经验", prep: "准备具体案例" },
      { name: "问题解决", description: "描述解决问题的经验", prep: "准备具体案例" },
      { name: "职业规划", description: "描述职业规划", prep: "准备清晰的目标" },
    ],
  },
];

const INTERVIEW_TIPS = [
  { tip: "STAR 法则", description: "情境、任务、行动、结果", example: "「在 XX 项目中，我负责 XX，通过 XX 方法，实现了 XX 结果」", color: "#ff3b30" },
  { tip: "提前准备", description: "提前了解公司和职位", example: "研究公司官网、产品", color: "#ff9f0a" },
  { tip: "提问环节", description: "准备问题问面试官", example: "「团队的技术栈是什么？」", color: "#30d158" },
  { tip: "跟进感谢", description: "面试后发感谢信", example: "感谢面试官的时间", color: "#0a84ff" },
];

const CAREER_STAGES = [
  {
    title: "初级 FDE",
    color: "#ff3b30",
    icon: GraduationCap,
    duties: ["数据接入", "Ontology 构建（指导下）", "开发简单应用", "为客户提供技术支持"],
  },
  {
    title: "中级 FDE",
    color: "#ff9f0a",
    icon: Briefcase,
    duties: ["独立负责项目", "设计复杂 Ontology", "指导初级 FDE", "与客户直接沟通"],
  },
  {
    title: "高级 FDE",
    color: "#30d158",
    icon: Star,
    duties: ["设计系统架构", "做出关键技术决策", "管理团队", "拓展新业务"],
  },
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

function SkillTree() {
  const [hoveredSkill, setHoveredSkill] = useState<string | null>(null);

  return (
    <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
      <h3 className="text-sm font-semibold text-[#f5f5f7] mb-4">FDE 技能树</h3>
      <div className="space-y-6">
        {SKILL_LEVELS.map((level, levelIndex) => (
          <div key={level.level}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: level.color }} />
              <span className="text-xs font-medium text-[#f5f5f7]">{level.level}</span>
              <div className="flex-1 h-px bg-[#2c2c2e]" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {level.skills.map((skill) => {
                const Icon = skill.icon;
                const isHovered = hoveredSkill === skill.name;
                return (
                  <div
                    key={skill.name}
                    className={`p-3 rounded-lg border transition-all cursor-pointer ${
                      skill.completed
                        ? "bg-[#141416] border-[#30d158]/30"
                        : "bg-[#141416] border-[#2c2c2e]"
                    } ${isHovered ? "border-[#3a3a3c]" : ""}`}
                    onMouseEnter={() => setHoveredSkill(skill.name)}
                    onMouseLeave={() => setHoveredSkill(null)}
                  >
                    <div className="flex items-center gap-2">
                      <Icon
                        className="w-4 h-4"
                        style={{ color: skill.completed ? "#30d158" : "#636366" }}
                      />
                      <span
                        className={`text-xs ${skill.completed ? "text-[#f5f5f7]" : "text-[#636366]"}`}
                      >
                        {skill.name}
                      </span>
                      {skill.completed ? (
                        <CheckCircle2 className="w-3 h-3 text-[#30d158] ml-auto" />
                      ) : (
                        <Lock className="w-3 h-3 text-[#636366] ml-auto" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {levelIndex < SKILL_LEVELS.length - 1 && (
              <div className="flex justify-center my-3">
                <div className="w-px h-4 bg-[#2c2c2e]" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ProgressTracker() {
  const totalSkills = SKILL_LEVELS.reduce((acc, level) => acc + level.skills.length, 0);
  const completedSkills = SKILL_LEVELS.reduce(
    (acc, level) => acc + level.skills.filter((s) => s.completed).length,
    0
  );
  const progress = (completedSkills / totalSkills) * 100;

  return (
    <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
      <h3 className="text-sm font-semibold text-[#f5f5f7] mb-4">进度追踪</h3>
      <div className="flex items-center gap-4 mb-4">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-[#8e8e93]">总体进度</span>
            <span className="text-xs text-[#f5f5f7] font-medium">
              {completedSkills}/{totalSkills}
            </span>
          </div>
          <div className="h-3 bg-[#2c2c2e] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#30d158] rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <div className="text-2xl font-bold text-[#f5f5f7]">{Math.round(progress)}%</div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {SKILL_LEVELS.map((level) => {
          const levelCompleted = level.skills.filter((s) => s.completed).length;
          const levelTotal = level.skills.length;
          const levelProgress = (levelCompleted / levelTotal) * 100;
          return (
            <div key={level.level} className="p-3 rounded-lg bg-[#141416] border border-[#2c2c2e]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-[#8e8e93]">{level.level}</span>
                <span className="text-xs text-[#f5f5f7]">{levelCompleted}/{levelTotal}</span>
              </div>
              <div className="h-2 bg-[#2c2c2e] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${levelProgress}%`, backgroundColor: level.color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TechSkillCategories() {
  const [activeCategory, setActiveCategory] = useState("基础技能");

  const category = TECH_SKILL_CATEGORIES.find((c) => c.title === activeCategory);

  return (
    <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
      <h3 className="text-sm font-semibold text-[#f5f5f7] mb-4">技术技能表</h3>

      <div className="flex flex-wrap gap-2 mb-4">
        {TECH_SKILL_CATEGORIES.map((cat) => (
          <button
            key={cat.title}
            onClick={() => setActiveCategory(cat.title)}
            className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
              activeCategory === cat.title
                ? "text-white font-medium"
                : "bg-[#141416] text-[#8e8e93] border border-[#2c2c2e] hover:border-[#3a3a3c]"
            }`}
            style={activeCategory === cat.title ? { backgroundColor: cat.color, borderColor: cat.color } : {}}
          >
            {cat.title}
          </button>
        ))}
      </div>

      {category && (
        <div className="space-y-2">
          {category.items.map((item) => (
            <div key={item.name} className="flex items-center justify-between p-3 rounded-lg bg-[#141416] border border-[#2c2c2e]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${category.color}15` }}>
                  <CheckCircle2 className="w-4 h-4" style={{ color: category.color }} />
                </div>
                <div>
                  <div className="text-xs font-medium text-[#f5f5f7]">{item.name}</div>
                  <div className="text-[10px] text-[#636366]">{item.note}</div>
                </div>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded ${
                  item.importance === "必备"
                    ? "bg-[#ff3b30]/20 text-[#ff3b30]"
                    : "bg-[#ff9f0a]/20 text-[#ff9f0a]"
                }`}
              >
                {item.importance}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SoftSkillsSection() {
  const [activeCategory, setActiveCategory] = useState("沟通能力");

  const category = SOFT_SKILLS.find((c) => c.title === activeCategory);

  return (
    <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
      <h3 className="text-sm font-semibold text-[#f5f5f7] mb-4">软技能</h3>

      <div className="flex flex-wrap gap-2 mb-4">
        {SOFT_SKILLS.map((cat) => (
          <button
            key={cat.title}
            onClick={() => setActiveCategory(cat.title)}
            className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
              activeCategory === cat.title
                ? "text-white font-medium"
                : "bg-[#141416] text-[#8e8e93] border border-[#2c2c2e] hover:border-[#3a3a3c]"
            }`}
            style={activeCategory === cat.title ? { backgroundColor: cat.color, borderColor: cat.color } : {}}
          >
            {cat.title}
          </button>
        ))}
      </div>

      {category && (
        <div className="space-y-2">
          {category.items.map((item) => (
            <div key={item.skill} className="p-3 rounded-lg bg-[#141416] border border-[#2c2c2e]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-[#f5f5f7]">{item.skill}</span>
                <span className="text-[10px] text-[#30d158]">{item.improve}</span>
              </div>
              <div className="text-[10px] text-[#8e8e93]">{item.description}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InterviewPrep() {
  const [activeTab, setActiveTab] = useState<"tech" | "behavior" | "tips">("tech");

  return (
    <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
      <h3 className="text-sm font-semibold text-[#f5f5f7] mb-4">面试准备</h3>

      <div className="flex gap-1 mb-4 bg-[#141416] rounded-lg p-0.5">
        <button onClick={() => setActiveTab("tech")} className={`flex-1 px-3 py-1.5 rounded text-xs transition-all ${activeTab === "tech" ? "bg-[#ff3b30]/20 text-[#ff3b30]" : "text-[#8e8e93]"}`}>技术面试</button>
        <button onClick={() => setActiveTab("behavior")} className={`flex-1 px-3 py-1.5 rounded text-xs transition-all ${activeTab === "behavior" ? "bg-[#ff9f0a]/20 text-[#ff9f0a]" : "text-[#8e8e93]"}`}>行为面试</button>
        <button onClick={() => setActiveTab("tips")} className={`flex-1 px-3 py-1.5 rounded text-xs transition-all ${activeTab === "tips" ? "bg-[#30d158]/20 text-[#30d158]" : "text-[#8e8e93]"}`}>面试技巧</button>
      </div>

      {activeTab === "tips" ? (
        <div className="space-y-2">
          {INTERVIEW_TIPS.map((tip) => (
            <div key={tip.tip} className="p-3 rounded-lg bg-[#141416] border border-[#2c2c2e]">
              <div className="flex items-center gap-2 mb-1">
                <Star className="w-3.5 h-3.5" style={{ color: tip.color }} />
                <span className="text-xs font-medium text-[#f5f5f7]">{tip.tip}</span>
              </div>
              <div className="text-[10px] text-[#8e8e93]">{tip.description}</div>
              <div className="text-[10px] text-[#636366] mt-1">「{tip.example}」</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {(activeTab === "tech" ? INTERVIEW_SECTIONS[0].items : INTERVIEW_SECTIONS[1].items).map((item) => (
            <div key={item.name} className="flex items-center justify-between p-3 rounded-lg bg-[#141416] border border-[#2c2c2e]">
              <div>
                <div className="text-xs font-medium text-[#f5f5f7]">{item.name}</div>
                <div className="text-[10px] text-[#8e8e93]">{item.description}</div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#2c2c2e] text-[#30d158] whitespace-nowrap ml-3">
                {item.prep}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CareerStages() {
  return (
    <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
      <h3 className="text-sm font-semibold text-[#f5f5f7] mb-4">职业规划</h3>
      <div className="space-y-3">
        {CAREER_STAGES.map((stage) => {
          const Icon = stage.icon;
          return (
            <div key={stage.title} className="p-4 rounded-lg bg-[#141416] border border-[#2c2c2e]">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${stage.color}15` }}>
                  <Icon className="w-5 h-5" style={{ color: stage.color }} />
                </div>
                <span className="text-sm font-semibold text-[#f5f5f7]">{stage.title}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {stage.duties.map((duty) => (
                  <div key={duty} className="flex items-center gap-2 text-xs text-[#8e8e93]">
                    <ChevronRight className="w-3 h-3 text-[#636366] flex-shrink-0" />
                    {duty}
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

// =============================================================================
// Main Page
// =============================================================================

export default function Ch13SkillTreePage() {
  return (
    <div className="p-4 lg:p-8 max-w-[1200px] mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[#636366] mb-6">
        <Link href="/chapters" className="hover:text-[#f5f5f7] transition-colors">
          学习章节
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-[#8e8e93]">第十三回</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#ff453a]/10 flex items-center justify-center">
            <GitBranch className="w-5 h-5 text-[#ff453a]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#f5f5f7]">FDE 技能树与面试准备</h1>
            <p className="text-sm text-[#636366]">
              从初级到专家的技能路径、软技能培养、面试准备策略与职业规划
            </p>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* 13.1 技术技能树 */}
      {/* ============================================ */}
      <div className="mb-6">
        <SectionHeader icon={Code2} title="13.1 技术技能树" color="#ff3b30" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="lg:row-span-2">
          <SkillTree />
        </div>
        <ProgressTracker />
        <TechSkillCategories />
      </div>

      {/* ============================================ */}
      {/* 13.2 软技能 */}
      {/* ============================================ */}
      <div className="mb-6 mt-10">
        <SectionHeader icon={Users} title="13.2 软技能" color="#ff9f0a" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <SoftSkillsSection />
        <CareerStages />
      </div>

      {/* ============================================ */}
      {/* 13.3 面试准备 */}
      {/* ============================================ */}
      <div className="mb-6 mt-10">
        <SectionHeader icon={GraduationCap} title="13.3 面试准备" color="#30d158" />
      </div>

      <div className="mb-8">
        <InterviewPrep />
      </div>

      {/* Key Takeaway */}
      <div className="p-5 rounded-xl bg-[#ff453a]/5 border border-[#ff453a]/20">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-[#ff453a] flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-[#f5f5f7] mb-2">核心要点</h3>
            <p className="text-xs text-[#8e8e93] leading-relaxed">
              FDE 需要具备<strong className="text-[#f5f5f7]">完整的技术技能树和软技能</strong>。
              从技术技能到软技能，从面试准备到职业规划，FDE 需要不断学习和提升。
              初级聚焦基础技能（Ontology、数据工程），中级深入核心能力（Action、Function、应用开发），
              高级掌握 AI 集成（AIP Logic、LLM、Agent），专家阶段关注架构设计和业务战略。
              通过<strong className="text-[#f5f5f7]">系统的技能培养和面试准备</strong>，FDE 可以在职业发展中取得成功。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}