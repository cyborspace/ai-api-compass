"use client";

import { useState } from "react";
import {
  Layers,
  ChevronRight,
  ChevronDown,
  Search,
  BarChart3,
  Heart,
  Grid3X3,
  Sparkles,
  Calculator,
  Shield,
  Activity,
  MessageSquare,
  Brain,
  Code,
  FileText,
  ArrowRight,
  Compass,
  Check,
  LineChart,
  Lightbulb,
  Target,
  Users,
  Zap,
  GitBranch,
  Eye,
  Settings,
  TrendingUp,
  Clock,
  AlertTriangle,
  BookOpen,
  Workflow,
  Presentation,
  Scale,
  Database,
  Puzzle,
  Map,
  Telescope,
  Microscope,
  Wrench,
  Hammer,
  Rocket,
  Crown,
  Star,
  Award,
  Medal,
  Trophy,
} from "lucide-react";
import Link from "next/link";

// =============================================================================
// PART 1: FDE Core Capabilities (The Main Focus)
// =============================================================================

const FDE_CAPABILITIES = {
  // ========== 认知层 ==========
  cognitive: {
    title: "认知层能力",
    subtitle: "看清世界的本质",
    color: "#ff3b30",
    icon: Brain,
    description: "FDE 最核心的能力层。在纷繁复杂的业务场景中识别核心概念，剥离细节，构建可复用的领域模型。",
    abilities: [
      {
        name: "抽象建模",
        icon: Puzzle,
        definition: "在纷繁复杂的业务场景中识别核心概念，剥离细节，构建可复用的领域模型",
        importance: "★★★★★ 这是 FDE 区别于普通工程师的核心能力",
        aiCompassCase: {
          scenario: "将'AI 工具导航'这个业务需求抽象为 Ontology 模型",
          process: [
            "识别核心概念：工具、分类、提供商、能力标签",
            "定义关系：工具属于分类、提供商发布工具、工具具有能力",
            "抽象为 11 个 Object Type + 10 种 Link Type",
          ],
          outcome: "模型可复用于任何'资源导航'类场景（API 导航、模型导航等）",
        },
        practice: [
          "拿到需求后先画概念图，不急于写代码",
          "问自己：这个需求的本质是什么？它代表了哪一类通用问题？",
          "参考成熟领域模型（电商、CRM、CMS）寻找类比",
        ],
        palantirMapping: "对应 Foundry Ontology 的 Object Type / Link Type 设计",
      },
      {
        name: "类比迁移",
        icon: GitBranch,
        definition: "将一个领域的解决方案迁移到另一个领域，识别深层结构相似性",
        importance: "★★★★☆ 加速问题解决，避免重复造轮子",
        aiCompassCase: {
          scenario: "设计 AI 工具的'对比'功能",
          process: [
            "类比：电商的'购物车'功能",
            "相似性：都是临时收集多个商品/工具进行批量操作",
            "迁移：购物车 → 对比清单，结算 → 生成对比报告",
          ],
          outcome: "复用成熟的交互模式，用户学习成本更低",
        },
        practice: [
          "建立个人'模式库'，记录常见问题的解决方案",
          "遇到新问题时，先问自己：这和之前解决的哪个问题相似？",
          "阅读跨领域案例（建筑、生物、物理），寻找灵感",
        ],
        palantirMapping: "对应 Palantir 的跨行业 Ontology 模板复用",
      },
      {
        name: "推理归因",
        icon: Microscope,
        definition: "面对数据异常或系统故障，能构建逻辑链条，定位根本原因",
        importance: "★★★★★ 解决问题的关键能力",
        aiCompassCase: {
          scenario: "某工具热度突然下降 50%",
          process: [
            "Step 1: 检查事件上报系统 → 事件量正常",
            "Step 2: 检查评分数据 → 无大量差评",
            "Step 3: 检查竞品动态 → 竞品发布了新功能",
            "Step 4: 检查数据源 → 数据同步延迟导致热度计算错误",
          ],
          outcome: "定位根因：数据同步延迟，非业务问题",
        },
        practice: [
          "使用'5 Whys'方法层层追问",
          "区分相关性和因果性",
          "建立系统思维，理解组件间的依赖关系",
        ],
        palantirMapping: "对应 Foundry 的数据血缘追溯 + Health Checks",
      },
      {
        name: "模式识别",
        icon: Eye,
        definition: "从大量具体案例中识别重复出现的模式，提炼通用规则",
        importance: "★★★★☆ 从个案到方法论的关键",
        aiCompassCase: {
          scenario: "分析用户搜索行为，优化推荐算法",
          process: [
            "收集 1000+ 搜索日志",
            "识别高频模式：'文本摘要'、'代码生成'、'图像处理'",
            "提炼为 20+ 预置场景",
            "基于场景优化推荐匹配逻辑",
          ],
          outcome: "推荐准确率从 72% 提升至 91%",
        },
        practice: [
          "定期做案例分析，写复盘文档",
          "使用分类法整理经验（按场景、按技术、按行业）",
          "与同事交流，验证自己的模式识别是否正确",
        ],
        palantirMapping: "对应 AIP Logic 的规则引擎设计",
      },
    ],
  },

  // ========== 执行层 ==========
  execution: {
    title: "执行层能力",
    subtitle: "把想法变成现实",
    color: "#ff9f0a",
    icon: Zap,
    description: "将抽象的想法转化为可执行的方案，在资源有限的情况下推进项目交付。",
    abilities: [
      {
        name: "路径构建",
        icon: Map,
        definition: "将模糊目标拆解为清晰的执行路径，识别关键里程碑和依赖关系",
        importance: "★★★★★ 项目成功的基础",
        aiCompassCase: {
          scenario: "规划'智能推荐功能'的开发路径",
          process: [
            "Week 1: 基础推荐（基于热度）",
            "Week 2: 协同过滤（基于用户行为）",
            "Week 3: 混合推荐（多算法融合）",
            "Week 4: A/B 测试与优化",
          ],
          outcome: "4 周交付完整推荐系统，每周末都有可演示的版本",
        },
        practice: [
          "使用'反向规划'：从目标倒推步骤",
          "识别关键路径，优先保障",
          "设置检查点（Checkpoint），及时调整",
        ],
        palantirMapping: "对应 AIP Bootcamp 的 5 天冲刺计划",
      },
      {
        name: "任务拆解",
        icon: Puzzle,
        definition: "将复杂需求原子化分解为可执行、可验证的最小任务单元",
        importance: "★★★★★ 提高执行效率的关键",
        aiCompassCase: {
          scenario: "拆解'评分系统'开发任务",
          process: [
            "数据模型设计（4h）：定义评分表结构、关联关系",
            "API 开发（6h）：提交评分、查询评分、统计评分",
            "统计逻辑（4h）：平均分、分布、趋势计算",
            "前端展示（8h）：评分组件、评分列表、统计图表",
            "测试验证（8h）：单元测试、集成测试、边界测试",
          ],
          outcome: "总工时 30h，可并行开发，风险可控",
        },
        practice: [
          "任务粒度控制在 4-8 小时",
          "每个任务都有明确的完成标准（Definition of Done）",
          "识别任务间的依赖关系，合理安排顺序",
        ],
        palantirMapping: "对应 Ontology Action 的原子化设计",
      },
      {
        name: "绝对执行",
        icon: Rocket,
        definition: "在信息不全、资源有限、需求模糊的情况下，仍能推进项目交付",
        importance: "★★★★★ FDE 的核心特质",
        aiCompassCase: {
          scenario: "API 密钥未就绪，但需要先行开发",
          process: [
            "不等待：使用 Mock 数据搭建完整流程",
            "定义契约：与后端约定 API 接口格式",
            "并行开发：前端用 Mock，后端并行实现",
            "快速集成：API 就绪后 2 小时内完成对接",
          ],
          outcome: "零等待时间，项目进度不受影响",
        },
        practice: [
          "'先跑起来再说'，避免过度设计",
          "使用原型验证想法，快速迭代",
          "在约束中寻找创造性解决方案",
        ],
        palantirMapping: "对应 FDE '零周交付'的工作方式",
      },
      {
        name: "快速学习",
        icon: BookOpen,
        definition: "在短时间内掌握新技术、新领域、新工具",
        importance: "★★★★★ 适应多变环境的基础",
        aiCompassCase: {
          scenario: "需要在一周内掌握 MeiliSearch 实现全文搜索",
          process: [
            "Day 1: 阅读官方文档，理解核心概念",
            "Day 2: 搭建本地环境，跑通示例",
            "Day 3: 设计索引结构，编写同步逻辑",
            "Day 4-5: 集成到项目，调优性能",
          ],
          outcome: "5 天完成从 0 到生产级搜索功能",
        },
        practice: [
          "使用'80/20 法则'：先掌握 20% 核心知识解决 80% 问题",
          "边做边学，在实践中深化理解",
          "建立个人知识库，记录学习心得",
        ],
        palantirMapping: "对应 FDE 跨行业快速上手的通用能力",
      },
    ],
  },

  // ========== 表达层 ==========
  expression: {
    title: "表达层能力",
    subtitle: "让协作高效顺畅",
    color: "#30d158",
    icon: Users,
    description: "将技术方案转化为不同受众能理解的语言，推动团队协作和决策。",
    abilities: [
      {
        name: "沟通表达",
        icon: MessageSquare,
        definition: "根据受众切换表达风格，让技术方案被理解、被接受",
        importance: "★★★★★ 推动项目的关键",
        aiCompassCase: {
          scenario: "向不同角色介绍 Ontology 架构方案",
          versions: [
            { audience: "CTO", focus: "架构战略", content: "采用 Ontology 三层架构，支撑未来 3 年业务扩展，降低 40% 维护成本" },
            { audience: "产品经理", focus: "业务价值", content: "Ontology 让我们可以快速配置新功能，需求响应时间从 2 周缩短到 2 天" },
            { audience: "开发工程师", focus: "技术细节", content: "Object Type 定义在 schema.prisma，通过 Action Executor 执行业务逻辑" },
          ],
          outcome: "各角色都能理解方案价值，获得一致支持",
        },
        practice: [
          "沟通前先问自己：对方关心什么？",
          "准备多个版本的说明（电梯演讲版、详细版、技术版）",
          "使用类比和可视化降低理解门槛",
        ],
        palantirMapping: "对应 Echo 角色的客户沟通能力",
      },
      {
        name: "任务可视化",
        icon: Presentation,
        definition: "将项目状态、风险、依赖转化为直观的可视化呈现",
        importance: "★★★★☆ 提升团队透明度",
        aiCompassCase: {
          scenario: "设计 FDE 工作仪表盘",
          elements: [
            "进度条：各模块完成百分比",
            "风险信号灯：红（阻塞）/ 黄（风险）/ 绿（正常）",
            "下一步行动项：明确的待办任务",
            "依赖关系图：展示模块间的依赖",
          ],
          outcome: "团队对项目状态一目了然，问题早发现早解决",
        },
        practice: [
          "使用看板（Kanban）管理任务流",
          "定期更新进度，保持信息透明",
          "用图表代替文字，降低认知负担",
        ],
        palantirMapping: "对应 Workshop 的可视化应用构建",
      },
      {
        name: "方法论提取",
        icon: BookOpen,
        definition: "从单个项目经验中提炼可复用的模板和方法论",
        importance: "★★★★☆ 实现规模化复制",
        aiCompassCase: {
          scenario: "将 AIGC 数据同步提炼为通用模式",
          process: [
            "原始：SyncFromAIGC - 针对特定数据源的硬编码",
            "抽象：DataSyncEngine - 通用同步引擎",
            "模板：SyncConfig + SyncExecutor + SyncValidator",
            "复用：新数据源只需配置，零代码开发",
          ],
          outcome: "新增数据源接入时间从 3 天缩短到 2 小时",
        },
        practice: [
          "项目结束后写复盘文档，提炼可复用部分",
          "建立团队知识库，共享方法论",
          "定期回顾和优化模板",
        ],
        palantirMapping: "对应 Palantir 的平台产品化过程",
      },
      {
        name: "文档写作",
        icon: FileText,
        definition: "编写清晰、完整、易维护的技术文档",
        importance: "★★★★☆ 知识传承的基础",
        aiCompassCase: {
          scenario: "编写 Ontology Action 开发文档",
          structure: [
            "快速开始：5 分钟上手示例",
            "核心概念：Action、Rule、Side Effect 详解",
            "开发指南：Step by Step 教程",
            "API 参考：完整的接口文档",
            "最佳实践：常见模式和注意事项",
          ],
          outcome: "新成员 2 天即可独立开发 Action",
        },
        practice: [
          "采用'金字塔原理'：结论先行，层次分明",
          "文档与代码同步更新，避免过时",
          "多写示例，少写说明",
        ],
        palantirMapping: "对应 Palantir 官方文档的写作标准",
      },
    ],
  },

  // ========== 战略层 ==========
  strategic: {
    title: "战略层能力",
    subtitle: "做正确的事",
    color: "#0a84ff",
    icon: Target,
    description: "从技术视角上升到业务视角，用 ROI 思维指导决策，创造最大价值。",
    abilities: [
      {
        name: "目标导向",
        icon: Target,
        definition: "所有技术决策以 ROI 为核心标准，权衡成本与收益",
        importance: "★★★★★ 避免技术自嗨",
        aiCompassCase: {
          scenario: "实时排名 vs 5 分钟延迟批处理",
          analysis: [
            "实时排名：开发成本 2 周，服务器成本 +300%，用户体验提升 5%",
            "批处理：开发成本 3 天，服务器成本 +10%，用户体验几乎无差异",
          ],
          decision: "选择批处理，成本降低 80%，ROI 更高",
        },
        practice: [
          "每个技术决策前问自己：业务价值是什么？",
          "量化成本和收益，避免主观判断",
          "接受'足够好'，避免过度工程",
        ],
        palantirMapping: "对应 FDE '价值叙事'的构建",
      },
      {
        name: "价值叙事",
        icon: Presentation,
        definition: "用数据和故事构建'价值叙事'，先证明价值，再谈架构",
        importance: "★★★★★ 获得资源支持的关键",
        aiCompassCase: {
          scenario: "向 CEO 汇报推荐系统价值",
          narrative: [
            "开场（30s）：用户平均浏览 12 个工具才能找到合适的",
            "问题（60s）：选择困难导致 40% 用户流失",
            "方案（90s）：智能推荐系统，基于场景精准匹配",
            "对比（60s）：人工筛选 vs 智能推荐的效果对比",
            "数据（60s）：预计提升转化率 25%，年增收 200 万",
          ],
          outcome: "获得 100% 资源支持，项目顺利启动",
        },
        practice: [
          "准备'电梯演讲'：30 秒说清价值",
          "用数据说话，避免空泛描述",
          "先讲 Why，再讲 How，最后讲 What",
        ],
        palantirMapping: "对应 AIP Bootcamp 的 Demo 结构",
      },
      {
        name: "优先级判断",
        icon: Scale,
        definition: "在多个需求中选择最有价值的先做，合理分配资源",
        importance: "★★★★★ 资源有限时的关键能力",
        aiCompassCase: {
          scenario: "产品 backlog 有 20 个需求，资源只够做 5 个",
          framework: [
            "用户价值：解决多少用户的核心痛点？",
            "业务价值：对收入/留存/增长的贡献？",
            "技术价值：对架构/效率/质量的提升？",
            "成本评估：开发成本、维护成本、机会成本？",
          ],
          outcome: "选出 Top 5 高价值需求，ROI 最大化",
        },
        practice: [
          "使用 RICE 模型（Reach × Impact × Confidence / Effort）",
          "定期回顾优先级，根据反馈调整",
          "敢于说'不'，拒绝低价值需求",
        ],
        palantirMapping: "对应 FDE '只做前五个问题'的原则",
      },
      {
        name: "长期规划",
        icon: Telescope,
        definition: "在技术选型时考虑未来 1-3 年的扩展性",
        importance: "★★★★☆ 避免技术债务",
        aiCompassCase: {
          scenario: "选择数据库方案",
          options: [
            { name: "SQLite", pros: "简单快速", cons: "无法扩展，未来必须迁移" },
            { name: "PostgreSQL", pros: "功能强大，扩展性好", cons: "初期配置复杂" },
            { name: "MongoDB", pros: "Schema 灵活", cons: "不适合关系型数据" },
          ],
          decision: "选择 PostgreSQL，支撑未来 3 年数据增长",
        },
        practice: [
          "评估技术方案的'演进路径'",
          "预留 20% 的扩展余量",
          "关注技术趋势，避免选择即将被淘汰的方案",
        ],
        palantirMapping: "对应 Palantir 平台的长期演进策略",
      },
    ],
  },
};

// =============================================================================
// PART 2: Product Features (Reference Section)
// =============================================================================

const PRODUCT_FEATURES = [
  {
    name: "搜索能力",
    icon: Search,
    color: "#ff3b30",
    description: "基于语义理解和关键词匹配的多维度搜索系统",
    keyPoints: ["语义搜索", "多字段搜索", "自动补全", "过滤筛选"],
    api: "GET /api/aigc/search",
  },
  {
    name: "对比能力",
    icon: BarChart3,
    color: "#ff9f0a",
    description: "多工具并行对比系统，支持维度对比和差异高亮",
    keyPoints: ["多工具对比", "维度分析", "差异高亮", "历史记录"],
    api: "POST /api/compare",
  },
  {
    name: "排行榜能力",
    icon: Activity,
    color: "#30d158",
    description: "多维度排名系统，综合评分算法",
    keyPoints: ["综合排名", "分类排名", "趋势榜", "防作弊"],
    api: "GET /api/rankings",
  },
  {
    name: "收藏能力",
    icon: Heart,
    color: "#0a84ff",
    description: "个人收藏系统，支持分类管理和云端同步",
    keyPoints: ["添加收藏", "分类管理", "快速访问", "云端同步"],
    api: "POST /api/favorites",
  },
  {
    name: "分类能力",
    icon: Grid3X3,
    color: "#bf5af2",
    description: "层级分类系统，支持工具计数和热门分类",
    keyPoints: ["层级分类", "工具计数", "热门分类", "快速筛选"],
    api: "GET /api/categories",
  },
  {
    name: "场景推荐",
    icon: Sparkles,
    color: "#64d2ff",
    description: "基于场景的智能推荐系统，使用 LLM 理解需求",
    keyPoints: ["场景识别", "能力匹配", "约束分析", "LLM 增强"],
    api: "POST /api/recommend",
  },
  {
    name: "成本计算",
    icon: Calculator,
    color: "#ff9500",
    description: "LLM API 调用成本估算系统",
    keyPoints: ["单次估算", "批量对比", "价格趋势", "预算规划"],
    api: "POST /api/cost/estimate",
  },
  {
    name: "数据质量",
    icon: Shield,
    color: "#ff453a",
    description: "数据质量监控与保障系统",
    keyPoints: ["完整性检查", "准确性验证", "一致性检测", "质量报告"],
    api: "GET /api/quality/report",
  },
  {
    name: "监控能力",
    icon: Activity,
    color: "#32d74b",
    description: "系统性能监控与告警系统",
    keyPoints: ["性能指标", "错误追踪", "慢查询分析", "告警通知"],
    api: "GET /api/monitoring/metrics",
  },
  {
    name: "对话能力",
    icon: MessageSquare,
    color: "#0a84ff",
    description: "AI 对话助手，支持 Function Calling",
    keyPoints: ["自然语言", "Function Calling", "上下文记忆", "多轮对话"],
    api: "POST /api/chat",
  },
];

// =============================================================================
// Components
// =============================================================================

function AbilityCard({ ability, color }: { ability: any; color: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const Icon = ability.icon;

  return (
    <div className="border border-[#2c2c2e] rounded-xl overflow-hidden bg-[#1c1c1e]">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left p-4 hover:bg-[#2c2c2e] transition-colors"
      >
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${color}15` }}
          >
            <Icon className="w-5 h-5" style={{ color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-[#f5f5f7]">{ability.name}</h4>
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-[#636366]" />
              ) : (
                <ChevronRight className="w-4 h-4 text-[#636366]" />
              )}
            </div>
            <p className="text-xs text-[#8e8e93] mt-1">{ability.definition}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#2c2c2e] text-[#8e8e93]">
                重要性: {ability.importance}
              </span>
            </div>
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-[#2c2c2e] p-4 space-y-4">
          {/* AI-COMPASS 案例 */}
          <div className="bg-[#141416] rounded-lg p-4">
            <h5 className="text-xs font-semibold text-[#64d2ff] mb-3 flex items-center gap-2">
              <Target className="w-4 h-4" />
              AI-API-COMPASS 实战案例
            </h5>
            {ability.aiCompassCase.scenario && (
              <p className="text-xs text-[#f5f5f7] mb-3">
                <span className="text-[#636366]">场景：</span>
                {ability.aiCompassCase.scenario}
              </p>
            )}
            {ability.aiCompassCase.process && (
              <div className="space-y-2">
                <span className="text-[10px] text-[#636366]">过程：</span>
                <div className="space-y-1">
                  {ability.aiCompassCase.process.map((step: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <span className="text-[#64d2ff] font-mono">{i + 1}.</span>
                      <span className="text-[#8e8e93]">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {ability.aiCompassCase.versions && (
              <div className="space-y-2">
                {ability.aiCompassCase.versions.map((v: any, i: number) => (
                  <div key={i} className="bg-[#0a0a0c] rounded p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[#64d2ff]/10 text-[#64d2ff]">
                        {v.audience}
                      </span>
                      <span className="text-[10px] text-[#636366]">{v.focus}</span>
                    </div>
                    <p className="text-xs text-[#8e8e93]">{v.content}</p>
                  </div>
                ))}
              </div>
            )}
            {ability.aiCompassCase.outcome && (
              <div className="mt-3 pt-3 border-t border-[#2c2c2e]">
                <span className="text-[10px] text-[#30d158]">✓ 结果：{ability.aiCompassCase.outcome}</span>
              </div>
            )}
          </div>

          {/* 实践建议 */}
          <div className="bg-[#141416] rounded-lg p-4">
            <h5 className="text-xs font-semibold text-[#ff9f0a] mb-3 flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              实践建议
            </h5>
            <div className="space-y-2">
              {ability.practice.map((tip: string, i: number) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#ff9f0a] mt-1.5 flex-shrink-0" />
                  <span className="text-[#8e8e93]">{tip}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Palantir 对应 */}
          <div className="bg-[#141416] rounded-lg p-4">
            <h5 className="text-xs font-semibold text-[#bf5af2] mb-2 flex items-center gap-2">
              <Compass className="w-4 h-4" />
              Palantir 对应
            </h5>
            <p className="text-xs text-[#8e8e93]">{ability.palantirMapping}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function CapabilityLayer({ layer }: { layer: any }) {
  const Icon = layer.icon;

  return (
    <div className="mb-8">
      {/* Layer Header */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${layer.color}15` }}
        >
          <Icon className="w-6 h-6" style={{ color: layer.color }} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-[#f5f5f7]">{layer.title}</h3>
          <p className="text-sm" style={{ color: layer.color }}>{layer.subtitle}</p>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-[#8e8e93] mb-4 pl-15">{layer.description}</p>

      {/* Abilities */}
      <div className="space-y-3">
        {layer.abilities.map((ability: any, index: number) => (
          <AbilityCard key={index} ability={ability} color={layer.color} />
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// Main Page
// =============================================================================

export default function Ch05bCoreCapabilitiesPage() {
  return (
    <div className="p-4 lg:p-8 max-w-[1400px] mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[#636366] mb-6">
        <Link href="/chapters" className="hover:text-[#f5f5f7] transition-colors">
          学习章节
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-[#8e8e93]">第五回（下）：十大能力铸金身</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-[#64d2ff]/10 flex items-center justify-center">
            <Brain className="w-6 h-6 text-[#64d2ff]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#f5f5f7]">FDE 核心能力体系</h1>
            <p className="text-sm text-[#636366]">
              从认知到战略，四层能力构建完整的 FDE 能力图谱
            </p>
          </div>
        </div>
      </div>

      {/* Introduction */}
      <div className="mb-8 p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
        <h2 className="text-sm font-semibold text-[#f5f5f7] mb-3">为什么 FDE 需要独特的能力体系？</h2>
        <p className="text-xs text-[#8e8e93] leading-relaxed mb-4">
          FDE（Forward Deployed Engineer）不是普通的软件工程师，也不是传统的咨询顾问。
          FDE 需要同时具备技术深度、业务理解、快速执行和战略思维。
          这种独特的角色定位，要求 FDE 必须掌握一套独特的能力体系。
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-[#141416] rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-[#ff3b30]">认知层</div>
            <div className="text-[10px] text-[#636366] mt-1">看清本质</div>
          </div>
          <div className="bg-[#141416] rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-[#ff9f0a]">执行层</div>
            <div className="text-[10px] text-[#636366] mt-1">把想法落地</div>
          </div>
          <div className="bg-[#141416] rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-[#30d158]">表达层</div>
            <div className="text-[10px] text-[#636366] mt-1">让协作顺畅</div>
          </div>
          <div className="bg-[#141416] rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-[#0a84ff]">战略层</div>
            <div className="text-[10px] text-[#636366] mt-1">做正确的事</div>
          </div>
        </div>
      </div>

      {/* FDE Capabilities - Main Content */}
      <div className="space-y-8">
        <CapabilityLayer layer={FDE_CAPABILITIES.cognitive} />
        <CapabilityLayer layer={FDE_CAPABILITIES.execution} />
        <CapabilityLayer layer={FDE_CAPABILITIES.expression} />
        <CapabilityLayer layer={FDE_CAPABILITIES.strategic} />
      </div>

      {/* Capability Relationship Diagram */}
      <div className="mt-12 mb-8 p-6 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
        <h2 className="text-sm font-semibold text-[#f5f5f7] mb-4">能力层次关系</h2>
        <div className="relative">
          {/* Pyramid Diagram */}
          <div className="flex flex-col items-center gap-2">
            {/* 战略层 */}
            <div className="w-1/3 bg-[#0a84ff]/10 border border-[#0a84ff]/30 rounded-lg p-3 text-center">
              <div className="text-xs font-semibold text-[#0a84ff]">战略层</div>
              <div className="text-[10px] text-[#8e8e93] mt-1">放大器</div>
            </div>
            {/* 表达层 */}
            <div className="w-1/2 bg-[#30d158]/10 border border-[#30d158]/30 rounded-lg p-3 text-center">
              <div className="text-xs font-semibold text-[#30d158]">表达层</div>
              <div className="text-[10px] text-[#8e8e93] mt-1">桥梁</div>
            </div>
            {/* 执行层 */}
            <div className="w-2/3 bg-[#ff9f0a]/10 border border-[#ff9f0a]/30 rounded-lg p-3 text-center">
              <div className="text-xs font-semibold text-[#ff9f0a]">执行层</div>
              <div className="text-[10px] text-[#8e8e93] mt-1">保障</div>
            </div>
            {/* 认知层 */}
            <div className="w-full bg-[#ff3b30]/10 border border-[#ff3b30]/30 rounded-lg p-3 text-center">
              <div className="text-xs font-semibold text-[#ff3b30]">认知层</div>
              <div className="text-[10px] text-[#8e8e93] mt-1">基础</div>
            </div>
          </div>

          {/* Description */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center">
              <div className="text-[10px] text-[#ff3b30] font-semibold mb-1">认知层是基础</div>
              <div className="text-[10px] text-[#636366]">没有抽象建模能力，就无法构建可复用的解决方案</div>
            </div>
            <div className="text-center">
              <div className="text-[10px] text-[#ff9f0a] font-semibold mb-1">执行层是保障</div>
              <div className="text-[10px] text-[#636366]">没有绝对执行能力，想法永远无法落地</div>
            </div>
            <div className="text-center">
              <div className="text-[10px] text-[#30d158] font-semibold mb-1">表达层是桥梁</div>
              <div className="text-[10px] text-[#636366]">没有沟通表达能力，就无法获得支持和协作</div>
            </div>
            <div className="text-center">
              <div className="text-[10px] text-[#0a84ff] font-semibold mb-1">战略层是放大器</div>
              <div className="text-[10px] text-[#636366]">没有目标导向能力，努力可能白费</div>
            </div>
          </div>
        </div>
      </div>

      {/* Self Assessment */}
      <div className="mb-12 p-6 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
        <h2 className="text-sm font-semibold text-[#f5f5f7] mb-4">能力自评表</h2>
        <p className="text-xs text-[#8e8e93] mb-4">
          对照以下 15 项能力，评估自己当前的水平（1-5 分），找出需要重点提升的方向。
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
          {[
            { name: "抽象建模", level: "认知层", color: "#ff3b30" },
            { name: "类比迁移", level: "认知层", color: "#ff3b30" },
            { name: "推理归因", level: "认知层", color: "#ff3b30" },
            { name: "模式识别", level: "认知层", color: "#ff3b30" },
            { name: "路径构建", level: "执行层", color: "#ff9f0a" },
            { name: "任务拆解", level: "执行层", color: "#ff9f0a" },
            { name: "绝对执行", level: "执行层", color: "#ff9f0a" },
            { name: "快速学习", level: "执行层", color: "#ff9f0a" },
            { name: "沟通表达", level: "表达层", color: "#30d158" },
            { name: "任务可视化", level: "表达层", color: "#30d158" },
            { name: "方法论提取", level: "表达层", color: "#30d158" },
            { name: "文档写作", level: "表达层", color: "#30d158" },
            { name: "目标导向", level: "战略层", color: "#0a84ff" },
            { name: "价值叙事", level: "战略层", color: "#0a84ff" },
            { name: "优先级判断", level: "战略层", color: "#0a84ff" },
            { name: "长期规划", level: "战略层", color: "#0a84ff" },
          ].map((item) => (
            <div
              key={item.name}
              className="flex items-center gap-2 p-2 rounded-lg bg-[#141416] border border-[#2c2c2e]"
            >
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs text-[#f5f5f7] flex-1">{item.name}</span>
              <span className="text-[10px] text-[#636366]">{item.level}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Product Features - Reference Section */}
      <div className="mt-16 pt-8 border-t border-[#2c2c2e]">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#636366]/10 flex items-center justify-center">
            <Layers className="w-5 h-5 text-[#636366]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#f5f5f7]">产品功能参考</h2>
            <p className="text-sm text-[#636366]">
              AI-API-COMPASS 实现的十大产品功能（供参考，非本章重点）
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {PRODUCT_FEATURES.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg bg-[#1c1c1e] border border-[#2c2c2e]"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${feature.color}15` }}
                >
                  <Icon className="w-4 h-4" style={{ color: feature.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[#f5f5f7]">{feature.name}</span>
                    <code className="text-[10px] text-[#636366]">{feature.api}</code>
                  </div>
                  <p className="text-[10px] text-[#8e8e93] mt-1">{feature.description}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {feature.keyPoints.map((point, i) => (
                      <span
                        key={i}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-[#2c2c2e] text-[#636366]"
                      >
                        {point}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Key Takeaway */}
      <div className="mt-8 p-5 rounded-xl bg-[#64d2ff]/5 border border-[#64d2ff]/20">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-[#64d2ff] flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-[#f5f5f7] mb-2">核心要点</h3>
            <p className="text-xs text-[#8e8e93] leading-relaxed">
              FDE 的 15 项核心能力分为认知、执行、表达、战略四个层次。
              <strong className="text-[#f5f5f7]">认知层是基础，执行层是保障，表达层是桥梁，战略层是放大器——四层能力缺一不可。</strong>
              每个能力都配有 AI-API-COMPASS 的实战案例，你可以通过参与项目实践来锻炼这些能力。
              记住：FDE 不是天生的，而是通过刻意练习培养出来的。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
