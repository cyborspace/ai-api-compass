"use client";

import Link from "next/link";
import {
  UserCog,
  Network,
  Database,
  Boxes,
  BookOpen,
  Layers,
  Search,
  Zap,
  AppWindow,
  Bot,
  Brain,
  Cpu,
  GitBranch,
  TrendingUp,
  ChevronRight,
  GraduationCap,
  Rocket,
  Star,
  ArrowRight,
} from "lucide-react";

// =============================================================================
// Data
// =============================================================================

const LEARNING_PATHS = [
  {
    title: "基础认知",
    subtitle: "理解 FDE 角色与 Palantir 生态",
    color: "#ff3b30",
    icon: GraduationCap,
    chapters: ["ch01", "ch02"],
  },
  {
    title: "核心技能",
    subtitle: "掌握 Ontology 与数据工程",
    color: "#ff9f0a",
    icon: BookOpen,
    chapters: ["ch03", "ch04"],
  },
  {
    title: "实战项目",
    subtitle: "AI-API-COMPASS 完整实践",
    color: "#30d158",
    icon: Rocket,
    chapters: ["ch05a", "ch05b", "ch06", "ch08", "ch09", "ch10"],
  },
  {
    title: "进阶成长",
    subtitle: "思维模型、AI 能力与职业发展",
    color: "#0a84ff",
    icon: Star,
    chapters: ["ch11", "ch12", "ch13", "ch14"],
  },
];

const CHAPTERS = [
  {
    id: "ch01",
    href: "/chapters/ch01-fde-role",
    title: "第一回：什么是 FDE",
    description:
      "Foundry 开发工程师的角色定义、核心能力雷达图、与传统数据工程师和全栈工程师的角色对比、思维差异分析",
    icon: UserCog,
    color: "#ff3b30",
    tags: ["角色定义", "能力模型", "角色对比"],
    topics: [
      "什么是 FDE？",
      "核心能力模型（5 维度）",
      "数据工程师 vs 全栈 vs FDE",
      "FDE 的思维差异",
      "FDE 的典型一天",
    ],
  },
  {
    id: "ch02",
    href: "/chapters/ch02-ecosystem",
    title: "第二回：Palantir 生态系统",
    description:
      "Foundry、AIP、Gotham、Apollo 四大产品线的定位与关系、Ontology 三层架构、数据治理与产品协同机制",
    icon: Network,
    color: "#ff3b30",
    tags: ["产品生态", "架构概览", "Ontology 三层架构"],
    topics: [
      "Palantir 产品线全景",
      "Foundry + AIP：数据到 AI 的桥梁",
      "Ontology 三层架构",
      "Gotham 与 Apollo",
      "数据治理与合规",
    ],
  },
  {
    id: "ch03",
    href: "/chapters/ch03-data-engineering",
    title: "第三回：数据工程基础",
    description:
      "数据源类型与接入方式、ETL 转换流程与工具选型、数据质量检查与治理、Ontology 构建前的数据准备策略",
    icon: Database,
    color: "#ff9f0a",
    tags: ["数据流", "ETL", "数据质量"],
    topics: [
      "数据源类型与接入策略",
      "ETL vs ELT 范式选择",
      "数据质量六步检查法",
      "数据治理最佳实践",
      "Ontology 构建前数据准备",
    ],
  },
  {
    id: "ch04",
    href: "/chapters/ch04-ontology-concepts",
    title: "第四回：Ontology 核心概念",
    description:
      "Object Types 的属性与主键设计、Link Types 的基数约束、Action Types 的提交条件、Value Types 与 Interface 共享",
    icon: Boxes,
    color: "#ff9f0a",
    tags: ["本体建模", "核心概念", "类型系统"],
    topics: [
      "Object Type：属性、主键、状态",
      "Link Type：基数约束与方向",
      "Action Type：提交条件与副作用",
      "Value Type：自定义约束",
      "Interface：多态共享属性",
    ],
  },
  {
    id: "ch05a",
    href: "/chapters/ch05a-project-overview",
    title: "第五回（上）：项目概览",
    description:
      "295 个 AI 工具、10 个分类、303 条关系 —— AI-API-COMPASS 项目架构全景、技术栈选型、Ontology 映射与路线图",
    icon: BookOpen,
    color: "#30d158",
    tags: ["项目架构", "数据规模", "Ontology 映射"],
    topics: [
      "项目背景：为什么做 AI 工具对比？",
      "核心数据：295 工具、10 分类、303 关系",
      "技术栈：Fastify + Prisma + Next.js",
      "11 Object Types + 46 Functions",
      "Phase 0-6 路线图",
    ],
  },
  {
    id: "ch05b",
    href: "/chapters/ch05b-core-capabilities",
    title: "第五回（下）：核心能力详解",
    description:
      "语义搜索引擎、多维排行榜算法与反作弊、热度计算系统、场景智能推荐、成本对比、数据质量与系统监控",
    icon: Layers,
    color: "#30d158",
    tags: ["功能详解", "算法设计", "反作弊"],
    topics: [
      "语义搜索：向量+关键词混合",
      "排名算法：加权综合评分",
      "反作弊：刷分行为检测",
      "热度系统：时间衰减权重",
      "场景推荐：AI 驱动匹配",
    ],
  },
  {
    id: "ch06",
    href: "/chapters/ch06-semantic-layer",
    title: "第六回：语义层设计",
    description:
      "Embedding 技术选型、语义匹配策略与阈值调优、关键词提取算法、意图识别与语义搜索的完整实现流程",
    icon: Search,
    color: "#30d158",
    tags: ["语义搜索", "向量化", "Embedding"],
    topics: [
      "Embedding 模型选型对比",
      "向量存储与检索方案",
      "语义匹配与阈值调优",
      "关键词提取与意图识别",
      "混合搜索策略",
    ],
  },
  {
    id: "ch08",
    href: "/chapters/ch08-dynamic-layer",
    title: "第八回：动态层设计",
    description:
      "Action 执行器引擎设计、Function 计算与缓存优化、Writeback 双向数据同步机制、Webhook 触发与事件驱动架构",
    icon: Zap,
    color: "#30d158",
    tags: ["Action 引擎", "Function", "Writeback"],
    topics: [
      "Action Executor 引擎架构",
      "13 种 Logic Rules 执行器",
      "Function 运行时与缓存策略",
      "Writeback 双向同步机制",
      "Webhook 事件驱动触发器",
    ],
  },
  {
    id: "ch09",
    href: "/chapters/ch09-ontology-apps",
    title: "第九回：Ontology 感知应用",
    description:
      "Workshop 低代码开发、Object Explorer 数据探索、Quiver 数据分析、Slate 全代码应用与 Ontology 联动的构建模式",
    icon: AppWindow,
    color: "#30d158",
    tags: ["应用联动", "Workshop", "低代码"],
    topics: [
      "Workshop：低代码应用构建",
      "Object Explorer：数据探索",
      "Quiver：交互式数据分析",
      "Slate：全代码定制开发",
      "应用与 Ontology 联动模式",
    ],
  },
  {
    id: "ch10",
    href: "/chapters/ch10-ai-agent",
    title: "第十回：AI Agent 部署实战",
    description:
      "AIP Logic 工作流编排、LLM 模型接入与选型、Function Calling 工具注册与调用、Agent 部署、监控与安全策略",
    icon: Bot,
    color: "#30d158",
    tags: ["AI Agent", "AIP Logic", "Function Calling"],
    topics: [
      "AIP Logic：可视化工作流编排",
      "LLM 模型接入与选型",
      "Function Calling 工具注册",
      "Agent 部署与调度",
      "Agent 监控与安全防护",
    ],
  },
  {
    id: "ch11",
    href: "/chapters/ch11-fde-mindset",
    title: "第十一回：FDE 思维模型",
    description:
      "观察→抽象→建模→验证→部署 的五阶思维循环、Ontology 思维的三原则、系统性思维与FDE黄金法则",
    icon: Brain,
    color: "#0a84ff",
    tags: ["思维模型", "方法论", "Ontology 思维"],
    topics: [
      "OAMVD 五阶思维循环",
      "Ontology 思维三原则",
      "系统性思维的层次",
      "FDE 的黄金法则",
      "思维模型实战应用",
    ],
  },
  {
    id: "ch12",
    href: "/chapters/ch12-ai-capabilities",
    title: "第十二回：FDE 的 AI 能力",
    description:
      "机器学习三类型、深度学习网络、NLP 全链路、AI 伦理原则与偏见治理、AI 安全防护、Ontology+AI 融合策略",
    icon: Cpu,
    color: "#0a84ff",
    tags: ["AI 基础", "LLM", "AI 伦理与安全"],
    topics: [
      "AI 基础：ML、DL、NLP",
      "AI 应用：推荐、NLP、CV",
      "LLM 能力矩阵与 RAG 架构",
      "AI 伦理原则与偏见治理",
      "Ontology + AI 融合策略",
    ],
  },
  {
    id: "ch13",
    href: "/chapters/ch13-skill-tree",
    title: "第十三回：技能树与面试准备",
    description:
      "四大技术技能分类、三大软技能体系、技术面试与行为面试准备、STAR 法则与面试技巧、职业阶段规划",
    icon: GitBranch,
    color: "#0a84ff",
    tags: ["技能树", "面试准备", "软技能"],
    topics: [
      "技术技能：基础/数据/Palantir/AI",
      "软技能：沟通/项目/问题解决",
      "面试准备：技术+行为+技巧",
      "STAR 法则与追问应对",
      "初级→中级→高级 职业规划",
    ],
  },
  {
    id: "ch14",
    href: "/chapters/ch14-career-path",
    title: "第十四回：职业发展路径",
    description:
      "初级到专家五阶段全景、技术专家/管理/创业三条转型路线、学习资源与认证考试、行业趋势与薪资分析",
    icon: TrendingUp,
    color: "#0a84ff",
    tags: ["职业规划", "转型路线", "持续学习"],
    topics: [
      "初级→专家 五阶段全景",
      "技术专家/管理/创业路线",
      "各阶段职责与薪资范围",
      "学习资源与认证考试",
      "行业趋势：AIP+Agent 爆发",
    ],
  },
];

const STATS = [
  { label: "学习章节", value: "14", icon: BookOpen, color: "#ff3b30" },
  { label: "核心概念", value: "50+", icon: Boxes, color: "#ff9f0a" },
  { label: "可视化图表", value: "60+", icon: Layers, color: "#30d158" },
  { label: "实践项目", value: "1 完整", icon: Rocket, color: "#0a84ff" },
];

// =============================================================================
// Components
// =============================================================================

function ChapterCard({ chapter }: { chapter: (typeof CHAPTERS)[0] }) {
  const Icon = chapter.icon;
  return (
    <Link
      href={chapter.href}
      className="group block p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e] hover:border-[#3a3a3c] transition-all hover:bg-[#1c1c1e]/80"
    >
      <div className="flex items-start gap-4 mb-3">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
          style={{ backgroundColor: `${chapter.color}15` }}
        >
          <Icon className="w-6 h-6" style={{ color: chapter.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-[#f5f5f7] group-hover:text-[#ff3b30] transition-colors">
              {chapter.title}
            </h3>
            <ChevronRight className="w-4 h-4 text-[#636366] group-hover:text-[#f5f5f7] transition-colors flex-shrink-0" />
          </div>
          <p className="text-xs text-[#8e8e93] line-clamp-2">{chapter.description}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-2">
        {chapter.tags.map((tag) => (
          <span key={tag} className="px-2 py-0.5 rounded text-[10px] bg-[#2c2c2e] text-[#8e8e93]">
            {tag}
          </span>
        ))}
      </div>

      <div className="border-t border-[#2c2c2e] pt-2">
        <div className="grid grid-cols-1 gap-1">
          {chapter.topics.map((topic, i) => (
            <div key={i} className="flex items-center gap-1.5 text-[10px] text-[#636366]">
              <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ backgroundColor: chapter.color }} />
              {topic}
            </div>
          ))}
        </div>
      </div>
    </Link>
  );
}

function LearningPathNav() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
      {LEARNING_PATHS.map((path) => {
        const Icon = path.icon;
        return (
          <div
            key={path.title}
            className="p-4 rounded-xl border transition-all"
            style={{
              backgroundColor: `${path.color}08`,
              borderColor: `${path.color}30`,
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Icon className="w-4 h-4" style={{ color: path.color }} />
              <span className="text-xs font-semibold" style={{ color: path.color }}>
                {path.title}
              </span>
            </div>
            <div className="text-[10px] text-[#636366] mb-2">{path.subtitle}</div>
            <div className="text-[10px] font-medium" style={{ color: path.color }}>
              {path.chapters.length} 章节
            </div>
          </div>
        );
      })}
    </div>
  );
}

// =============================================================================
// Main Page
// =============================================================================

export default function ChaptersPage() {
  return (
    <div className="p-4 lg:p-8 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#ff3b30]/10 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-[#ff3b30]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#f5f5f7]">学习章节</h1>
            <p className="text-sm text-[#636366]">
              Palantir Foundry 开发工程师（FDE）完整学习路径 —— 从认知到实践
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {STATS.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="p-4 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e] text-center">
              <div className="text-2xl font-bold text-[#f5f5f7]">{stat.value}</div>
              <div className="flex items-center justify-center gap-1 text-xs text-[#636366] mt-1">
                <Icon className="w-3 h-3" style={{ color: stat.color }} />
                {stat.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Learning Path */}
      <LearningPathNav />

      {/* Chapter Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CHAPTERS.map((chapter) => (
          <ChapterCard key={chapter.id} chapter={chapter} />
        ))}
      </div>
    </div>
  );
}