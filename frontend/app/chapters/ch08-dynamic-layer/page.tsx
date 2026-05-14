"use client";

import { useState } from "react";
import {
  Zap,
  ChevronRight,
  Play,
  Code,
  Activity,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

// =============================================================================
// Data
// =============================================================================

const ACTION_RULES = [
  {
    id: 1,
    rule: "参数验证",
    description: "检查所有必填参数是否存在且类型正确",
    example: "验证 rating 是否在 1-5 之间",
  },
  {
    id: 2,
    rule: "权限检查",
    description: "验证用户是否有权限执行此 Action",
    example: "检查用户是否已登录",
  },
  {
    id: 3,
    rule: "业务规则",
    description: "执行业务逻辑验证",
    example: "检查用户是否已评价过该工具",
  },
  {
    id: 4,
    rule: "对象查找",
    description: "根据参数查找目标对象",
    example: "查找 toolId 对应的 AIGCTool",
  },
  {
    id: 5,
    rule: "状态变更",
    description: "修改对象属性状态",
    example: "更新工具的评分和评分人数",
  },
  {
    id: 6,
    rule: "Link 操作",
    description: "创建或删除对象间的关系",
    example: "创建 User 和 Review 之间的 Link",
  },
  {
    id: 7,
    rule: "派生计算",
    description: "触发 Function 重新计算派生属性",
    example: "重新计算 averageRating",
  },
  {
    id: 8,
    rule: "副作用执行",
    description: "执行 Action 的副作用",
    example: "发送通知给工具开发者",
  },
  {
    id: 9,
    rule: "Writeback 触发",
    description: "触发 Writeback 机制",
    example: "通知下游系统数据已变更",
  },
  {
    id: 10,
    rule: "事务提交",
    description: "提交所有变更到数据库",
    example: "COMMIT 事务",
  },
  {
    id: 11,
    rule: "审计日志",
    description: "记录 Action 执行历史",
    example: "记录用户 X 在 Y 时间评价了 Z",
  },
  {
    id: 12,
    rule: "缓存失效",
    description: "使相关缓存失效",
    example: "清除该工具的评分缓存",
  },
  {
    id: 13,
    rule: "事件发布",
    description: "发布领域事件",
    example: "发布 RatingSubmitted 事件",
  },
];

const FUNCTION_CATEGORIES = [
  {
    name: "排名计算",
    count: 8,
    color: "#ff3b30",
    functions: ["综合排名", "分类排名", "新兴榜", "趋势榜"],
  },
  {
    name: "热度计算",
    count: 6,
    color: "#ff9f0a",
    functions: ["点击热度", "搜索热度", "收藏热度", "分享热度"],
  },
  {
    name: "评分计算",
    count: 5,
    color: "#30d158",
    functions: ["加权评分", "贝叶斯评分", "时间衰减", "置信区间"],
  },
  {
    name: "推荐计算",
    count: 7,
    color: "#0a84ff",
    functions: ["协同过滤", "内容推荐", "场景匹配", "LLM增强"],
  },
  {
    name: "场景分析",
    count: 4,
    color: "#bf5af2",
    functions: ["场景识别", "能力提取", "约束分析", "关键词提取"],
  },
  {
    name: "安全风控",
    count: 4,
    color: "#64d2ff",
    functions: ["反作弊", "异常检测", "频率限制", "内容审核"],
  },
];

const WRITEBACK_FLOW = [
  { step: "Action 触发", description: "用户提交评价", icon: Play, color: "#ff3b30" },
  { step: "业务逻辑", description: "验证并更新对象", icon: Code, color: "#ff9f0a" },
  { step: "数据变更", description: "评分从 4.2 → 4.5", icon: RefreshCw, color: "#30d158" },
  { step: "Webhook 通知", description: "发送变更事件", icon: Activity, color: "#0a84ff" },
  { step: "下游处理", description: "更新排行榜、热度", icon: Zap, color: "#bf5af2" },
];

// =============================================================================
// Components
// =============================================================================

function ActionRulesList() {
  const [activeRule, setActiveRule] = useState<number | null>(null);

  return (
    <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
      <h3 className="text-sm font-semibold text-[#f5f5f7] mb-4">Action 执行逻辑（13 条规则）</h3>
      <div className="space-y-2">
        {ACTION_RULES.map((rule) => (
          <button
            key={rule.id}
            onClick={() => setActiveRule(activeRule === rule.id ? null : rule.id)}
            className={`w-full text-left p-3 rounded-lg border transition-all ${
              activeRule === rule.id
                ? "bg-[#141416] border-[#3a3a3c]"
                : "bg-[#141416] border-[#2c2c2e] hover:border-[#3a3a3c]"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                  activeRule === rule.id
                    ? "bg-[#ff3b30] text-white"
                    : "bg-[#2c2c2e] text-[#636366]"
                }`}
              >
                {rule.id}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[#f5f5f7]">{rule.rule}</span>
                  <ChevronRight
                    className={`w-3 h-3 text-[#636366] transition-transform ${
                      activeRule === rule.id ? "rotate-90" : ""
                    }`}
                  />
                </div>
                {activeRule === rule.id && (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-[#8e8e93]">{rule.description}</p>
                    <p className="text-[10px] text-[#636366]">示例: {rule.example}</p>
                  </div>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function FunctionRegistry() {
  const [activeCategory, setActiveCategory] = useState<string>("排名计算");

  const category = FUNCTION_CATEGORIES.find((c) => c.name === activeCategory);

  return (
    <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
      <h3 className="text-sm font-semibold text-[#f5f5f7] mb-4">Function Registry（46 个函数）</h3>

      {/* Categories */}
      <div className="flex flex-wrap gap-2 mb-4">
        {FUNCTION_CATEGORIES.map((cat) => (
          <button
            key={cat.name}
            onClick={() => setActiveCategory(cat.name)}
            className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
              activeCategory === cat.name
                ? "text-white font-medium"
                : "bg-[#141416] text-[#8e8e93] border border-[#2c2c2e] hover:border-[#3a3a3c]"
            }`}
            style={
              activeCategory === cat.name
                ? { backgroundColor: cat.color, borderColor: cat.color }
                : {}
            }
          >
            {cat.name} ({cat.count})
          </button>
        ))}
      </div>

      {/* Functions */}
      {category && (
        <div className="grid grid-cols-2 gap-2">
          {category.functions.map((fn) => (
            <div
              key={fn}
              className="p-2 rounded-lg bg-[#141416] border border-[#2c2c2e] text-xs text-[#8e8e93]"
            >
              {fn}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function WritebackFlow() {
  const [activeStep, setActiveStep] = useState<number | null>(null);

  return (
    <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
      <h3 className="text-sm font-semibold text-[#f5f5f7] mb-4">Writeback 执行流程</h3>
      <div className="space-y-3">
        {WRITEBACK_FLOW.map((step, index) => {
          const Icon = step.icon;
          const isActive = activeStep === index;
          return (
            <div key={step.step} className="flex items-center gap-3">
              <button
                onClick={() => setActiveStep(isActive ? null : index)}
                className={`flex-1 flex items-center gap-3 p-3 rounded-lg border transition-all ${
                  isActive
                    ? "bg-[#141416] border-[#3a3a3c]"
                    : "bg-[#141416] border-[#2c2c2e] hover:border-[#3a3a3c]"
                }`}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${step.color}15` }}
                >
                  <Icon className="w-5 h-5" style={{ color: step.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-[#f5f5f7]">{step.step}</div>
                  <div className="text-[10px] text-[#8e8e93]">{step.description}</div>
                </div>
                <ChevronRight
                  className={`w-4 h-4 text-[#636366] transition-transform ${
                    isActive ? "rotate-90" : ""
                  }`}
                />
              </button>
              {index < WRITEBACK_FLOW.length - 1 && (
                <ArrowRight className="w-4 h-4 text-[#636366] flex-shrink-0" />
              )}
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

export default function Ch08DynamicLayerPage() {
  return (
    <div className="p-4 lg:p-8 max-w-[1200px] mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[#636366] mb-6">
        <Link href="/chapters" className="hover:text-[#f5f5f7] transition-colors">
          学习章节
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-[#8e8e93]">第八回</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#ff9f0a]/10 flex items-center justify-center">
            <Zap className="w-5 h-5 text-[#ff9f0a]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#f5f5f7]">动态层设计</h1>
            <p className="text-sm text-[#636366]">
              Action 执行、Function 计算、Writeback 机制
            </p>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* 动态层博客文字详解 */}
      {/* ============================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
          <h3 className="text-sm font-semibold text-[#f5f5f7] mb-3">Action Executor 引擎详解</h3>
          <p className="text-xs text-[#8e8e93] leading-relaxed mb-3">
            Action Executor 是动态层的<strong className="text-[#f5f5f7]">核心引擎</strong>，负责解析 Action Definition
            并串联执行它所引用的 Logic Rules。13 种 Logic Rules 覆盖了数据操作的全生命周期：
          </p>
          <div className="space-y-1.5 text-[10px]">
            {[
              { rule: "Create Object", desc: "创建新对象 — 最基本的 CRUD 操作" },
              { rule: "Update Object", desc: "更新对象属性 — 包括实体和关系的修改" },
              { rule: "Delete Object", desc: "软删除/硬删除对象" },
              { rule: "Search Objects", desc: "按条件查询对象" },
              { rule: "Create Link", desc: "在两个对象间建立关系" },
              { rule: "Delete Link", desc: "删除对象间的关系" },
              { rule: "Call Function", desc: "调用已注册的 Function，获取计算结果" },
              { rule: "Call External API", desc: "调用外部 API，实现跨系统交互" },
              { rule: "Send Email", desc: "触发邮件通知" },
              { rule: "Read Object", desc: "读取对象数据" },
              { rule: "Assess Conditions", desc: "评估条件判断（if/then/else）" },
              { rule: "Manage Submissions", desc: "管理提交状态（pending/approved/rejected）" },
              { rule: "Generate Notification", desc: "触发系统通知" },
            ].map((item) => (
              <div key={item.rule} className="flex items-center gap-2 p-1.5 rounded bg-[#141416] border border-[#2c2c2e]">
                <span className="text-xs font-medium text-[#f5f5f7] w-32">{item.rule}</span>
                <span className="text-[#636366]">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
          <h3 className="text-sm font-semibold text-[#f5f5f7] mb-3">Function 运行时与优化</h3>
          <p className="text-xs text-[#8e8e93] leading-relaxed mb-3">
            46 个 Function 并非直接执行原始 SQL，而是在 <strong className="text-[#f5f5f7]">Repository Layer</strong>
            之上进行语义封装。三个核心优化策略：
          </p>
          <div className="space-y-3">
            <div className="p-3 rounded bg-[#141416] border border-[#2c2c2e]">
              <span className="text-xs font-medium text-[#30d158]">结果缓存</span>
              <p className="text-[10px] text-[#8e8e93] mt-1">
                排行榜、热度等高频查询的结果缓存到 Redis（TTL 5分钟）。
                在广泛应用场景中，缓存命中率可达 80%+，API 响应时间从 200ms 降至 5ms。
              </p>
            </div>
            <div className="p-3 rounded bg-[#141416] border border-[#2c2c2e]">
              <span className="text-xs font-medium text-[#ff9f0a]">批量计算</span>
              <p className="text-[10px] text-[#8e8e93] mt-1">
                热度更新等批量操作合并为单次 SQL 事务，性能提升 75%。
              </p>
            </div>
            <div className="p-3 rounded bg-[#141416] border border-[#2c2c2e]">
              <span className="text-xs font-medium text-[#0a84ff]">延迟加载</span>
              <p className="text-[10px] text-[#8e8e93] mt-1">
                非关键 Function（如 updateAllHotCache）通过 Redis Pub/Sub 延迟执行，避免阻塞 API 响应。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* Writeback 机制详解 */}
      {/* ============================================ */}
      <div className="mb-8">
        <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
          <h3 className="text-sm font-semibold text-[#f5f5f7] mb-3">Writeback 双向同步机制</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { title: "触发时机", content: "Action 提交后自动触发（规则: WRITE_TO_EXTERNAL_DB）" },
              { title: "同步策略", content: "事件驱动（Event-Driven），Action 提交 → Event Bus → Writeback Handler" },
              { title: "幂等性", content: "基于业务主键的 UPSERT 操作，确保重试不会产生重复数据" },
            ].map((item) => (
              <div key={item.title} className="p-3 rounded bg-[#141416] border border-[#2c2c2e]">
                <span className="text-xs font-medium text-[#f5f5f7] block mb-1">{item.title}</span>
                <span className="text-[10px] text-[#8e8e93]">{item.content}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* Webhook 与事件驱动 */}
      {/* ============================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
          <h3 className="text-sm font-semibold text-[#f5f5f7] mb-3">Webhook 触发机制</h3>
          <div className="space-y-3">
            {[
              { type: "Ontology 事件", desc: "Object 创建/更新/删除时触发 Webhook" },
              { type: "Action 事件", desc: "Action 执行成功/失败时触发 Webhook" },
              { type: "定时触发", desc: "按固定时间间隔触发（如每天凌晨同步数据）" },
              { type: "API 触发", desc: "通过 REST API 手动触发" },
            ].map((item) => (
              <div key={item.type} className="p-3 rounded bg-[#141416] border border-[#2c2c2e]">
                <span className="text-xs font-medium text-[#f5f5f7] block">{item.type}</span>
                <span className="text-[10px] text-[#636366]">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
          <h3 className="text-sm font-semibold text-[#f5f5f7] mb-3">事件驱动架构模式</h3>
          <div className="space-y-3">
            {[
              { pattern: "事件溯源", desc: "记录所有变更事件，支持时间线回放" },
              { pattern: "CQRS", desc: "命令查询职责分离，提高系统可扩展性" },
              { pattern: "Saga 模式", desc: "分布式事务协调，确保最终一致性" },
              { pattern: "消息队列", desc: "异步解耦，削峰填谷" },
            ].map((item) => (
              <div key={item.pattern} className="p-3 rounded bg-[#141416] border border-[#2c2c2e]">
                <span className="text-xs font-medium text-[#f5f5f7] block">{item.pattern}</span>
                <span className="text-[10px] text-[#636366]">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* 动态层工作原理详解 */}
      {/* ============================================ */}
      <div className="mb-8">
        <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
          <h3 className="text-sm font-semibold text-[#f5f5f7] mb-4">动态层工作原理详解</h3>
          <div className="space-y-4 text-xs text-[#8e8e93] leading-relaxed">
            <p>
              <strong className="text-[#f5f5f7]">动态层是 Ontology 的「大脑」</strong>，负责处理业务逻辑、计算派生属性和同步数据变更。
              与静态层（Object Type、Link Type 的定义）不同，动态层关注的是「数据如何变化」和「业务规则如何执行」。
              动态层包含三个核心组件：Action Type（操作类型）、Function（函数）和 Writeback（回写机制）。
              三者协同工作，确保数据一致性、业务规则正确性和系统可扩展性。
            </p>
            <p>
              <strong className="text-[#f5f5f7]">Action Type（操作类型）</strong>是用户可以对对象、属性值和链接进行的一组更改或编辑的 Schema 定义。
              根据 Palantir 官方文档，Action Type 还包括操作提交时发生的副作用行为。
              一旦在 Ontology 中配置了操作类型，最终用户就可以通过应用操作来更改对象。
              Action Type 是组织的动力学（kinetics）——在遵守组织控制和治理的同时实现变更。
              例如，当用户提交一个「更新工具评分」的 Action 时，系统会自动触发评分重新计算、排名更新、通知发送等一系列副作用。
            </p>
            <p>
              <strong className="text-[#f5f5f7]">Function（函数）</strong>是一段基于代码的逻辑，接受输入参数并返回输出。
              根据 Palantir 官方文档，函数与 Ontology 原生集成：它们可以接受对象和对象集作为输入，读取对象的属性值，
              并可以在构建在 Ontology 之上的操作类型和应用程序中使用。
              Function 提供了编写和演进具有任意复杂度的业务逻辑的方式。
              例如，可以编写一个 Function 来计算工具的综合评分，
              该 Function 接收 Tool 对象作为输入，读取其各项评分属性，
              返回加权计算后的综合评分。
            </p>
            <p>
              <strong className="text-[#f5f5f7]">Writeback（回写机制）</strong>是 Palantir 平台的关键特性，
              允许将 Ontology 中的变更同步回外部系统。
              当 Action 提交后，Writeback 机制会自动触发，
              将变更数据通过事件驱动的方式同步到下游系统（如 ERP、CRM 等）。
              这种双向同步确保了 Ontology 中的数据与外部系统保持一致。
              Writeback 基于业务主键进行 UPSERT 操作，确保重试不会产生重复数据，
              保证了数据同步的幂等性。
            </p>
            <p>
              <strong className="text-[#f5f5f7]">事件驱动架构</strong>是动态层的核心设计模式。
              当 Action 提交时，系统会生成事件并放入 Event Bus，
              各个 Handler 监听特定事件并执行相应的业务逻辑。
              这种架构实现了业务逻辑的解耦，使得系统更加灵活和可扩展。
              例如，「工具评分更新」事件可以被多个 Handler 监听：
              一个 Handler 负责更新排名，另一个 Handler 负责发送通知，
              第三个 Handler 负责同步到外部系统。
            </p>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* Action Type 规则详解 */}
      {/* ============================================ */}
      <div className="mb-8">
        <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
          <h3 className="text-sm font-semibold text-[#f5f5f7] mb-4">Action Type 规则详解</h3>
          <div className="space-y-3">
            {[
              {
                rule: "VALIDATE_INPUT",
                desc: "验证输入数据的格式和类型是否符合要求。例如，评分必须在 1-5 之间，URL 必须符合标准格式。",
                example: "评分输入验证",
              },
              {
                rule: "CHECK_PERMISSIONS",
                desc: "检查当前用户是否有权限执行该操作。基于 RBAC 模型，验证用户角色和操作权限的匹配关系。",
                example: "管理员才能删除工具",
              },
              {
                rule: "CHECK_STATE",
                desc: "验证对象当前状态是否允许执行该操作。例如，已发布的工具才能被评分，草稿状态的工具不能删除。",
                example: "状态机校验",
              },
              {
                rule: "PRECONDITION",
                desc: "定义操作执行的前置条件。例如，创建评论前必须确保用户已登录且工具存在。",
                example: "前置条件检查",
              },
              {
                rule: "EXECUTE_LOGIC",
                desc: "执行核心业务逻辑。例如，更新评分时重新计算综合评分、更新排名、触发通知。",
                example: "评分重新计算",
              },
              {
                rule: "SIDE_EFFECTS",
                desc: "处理操作的副作用。例如，更新工具信息后同步更新搜索引擎索引、触发 Webhook 通知。",
                example: "副作用处理",
              },
              {
                rule: "WRITE_TO_EXTERNAL_DB",
                desc: "将变更写入外部数据库。通过 Writeback 机制实现 Ontology 与外部系统的双向同步。",
                example: "Writeback 触发",
              },
              {
                rule: "AUDIT_LOG",
                desc: "记录操作审计日志。包括操作人、操作时间、变更内容、操作结果等信息，支持事后追溯。",
                example: "审计日志记录",
              },
            ].map((item) => (
              <div key={item.rule} className="p-3 rounded bg-[#141416] border border-[#2c2c2e]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-[#f5f5f7]">{item.rule}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#2c2c2e] text-[#8e8e93]">{item.example}</span>
                </div>
                <span className="text-[10px] text-[#636366] leading-relaxed">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Key Takeaway */}
      <div className="p-5 rounded-xl bg-[#ff9f0a]/5 border border-[#ff9f0a]/20">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-[#ff9f0a] flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-[#f5f5f7] mb-2">核心要点</h3>
            <p className="text-xs text-[#8e8e93] leading-relaxed">
              动态层是 Ontology 的「大脑」。<strong className="text-[#f5f5f7]">Action</strong> 执行业务逻辑（13 条规则），
              <strong className="text-[#f5f5f7]">Function</strong> 计算派生属性（46 个函数），
              <strong className="text-[#f5f5f7]">Writeback</strong> 将变更同步到下游系统。
              三者协同工作，确保数据一致性、业务规则正确性和系统可扩展性。
              Action Type 是组织的动力学，Function 提供业务逻辑计算能力，Writeback 实现双向数据同步。
              事件驱动架构让系统更加灵活和可扩展。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
