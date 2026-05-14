"use client";

import { useState } from "react";
import {
  Bot,
  ChevronRight,
  Brain,
  Code,
  Zap,
  ArrowRight,
  CheckCircle2,
  MessageSquare,
  Settings,
  Activity,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

// =============================================================================
// Data
// =============================================================================

const AGENT_DEPLOYMENT_STEPS = [
  {
    id: "design",
    title: "Agent 设计",
    description: "定义 Agent 的目标、能力和触发条件",
    icon: Brain,
    color: "#ff3b30",
    details: [
      "确定 Agent 的业务目标",
      "定义输入输出格式",
      "设计系统提示词",
      "设定触发条件",
    ],
  },
  {
    id: "ontology",
    title: "Ontology 绑定",
    description: "将 Agent 与 Ontology 对象和函数绑定",
    icon: Code,
    color: "#ff9f0a",
    details: [
      "选择相关的 Object Types",
      "绑定 Function 作为工具",
      "定义 Action 作为输出",
      "配置权限和范围",
    ],
  },
  {
    id: "logic",
    title: "AIP Logic 编排",
    description: "使用 AIP Logic 编排 Agent 的工作流",
    icon: Zap,
    color: "#30d158",
    details: [
      "设计工作流节点",
      "配置 LLM 调用参数",
      "设置条件分支",
      "定义错误处理",
    ],
  },
  {
    id: "test",
    title: "测试验证",
    description: "在测试环境中验证 Agent 行为",
    icon: CheckCircle2,
    color: "#0a84ff",
    details: [
      "单元测试各节点",
      "集成测试完整流程",
      "边界条件测试",
      "性能基准测试",
    ],
  },
  {
    id: "deploy",
    title: "部署上线",
    description: "将 Agent 部署到生产环境",
    icon: Activity,
    color: "#bf5af2",
    details: [
      "配置生产环境参数",
      "设置监控和告警",
      "灰度发布",
      "全量上线",
    ],
  },
];

const LLM_INTEGRATION = {
  providers: [
    { name: "MiniMax", model: "abab6.5", status: "active", color: "#ff3b30" },
    { name: "OpenAI", model: "GPT-4", status: "available", color: "#0a84ff" },
    { name: "Anthropic", model: "Claude 3", status: "available", color: "#30d158" },
    { name: "Google", model: "Gemini", status: "available", color: "#ff9f0a" },
  ],
  capabilities: [
    { name: "对话生成", score: 95 },
    { name: "Function Calling", score: 90 },
    { name: "代码生成", score: 85 },
    { name: "推理分析", score: 88 },
    { name: "多语言", score: 92 },
  ],
};

const FUNCTION_CALLING_FLOW = [
  { step: "用户提问", content: "推荐适合处理 PDF 的 AI 工具", type: "input" },
  { step: "意图识别", content: "场景推荐 | 文档处理 | PDF", type: "process" },
  { step: "Function 调用", content: "getRecommendations({scenario: 'pdf-processing'})", type: "action" },
  { step: "数据查询", content: "从 Ontology 查询匹配的工具", type: "data" },
  { step: "结果生成", content: "Claude (95%), GPT-4 (92%), Gemini (88%)", type: "output" },
];

// =============================================================================
// Components
// =============================================================================

function DeploymentSteps() {
  const [activeStep, setActiveStep] = useState<string>("design");

  return (
    <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
      <h3 className="text-sm font-semibold text-[#f5f5f7] mb-4">Agent 部署流程</h3>

      {/* Steps */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {AGENT_DEPLOYMENT_STEPS.map((step, index) => {
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
              {index < AGENT_DEPLOYMENT_STEPS.length - 1 && (
                <ArrowRight className="w-3 h-3 text-[#636366] flex-shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Detail */}
      {(() => {
        const step = AGENT_DEPLOYMENT_STEPS.find((s) => s.id === activeStep);
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

function LlmIntegration() {
  return (
    <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
      <h3 className="text-sm font-semibold text-[#f5f5f7] mb-4">LLM 集成架构</h3>

      {/* Providers */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {LLM_INTEGRATION.providers.map((provider) => (
          <div
            key={provider.name}
            className={`p-3 rounded-lg border ${
              provider.status === "active"
                ? "bg-[#141416] border-[#30d158]/30"
                : "bg-[#141416] border-[#2c2c2e]"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-[#f5f5f7]">{provider.name}</span>
              {provider.status === "active" && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#30d158]/20 text-[#30d158]">
                  当前
                </span>
              )}
            </div>
            <div className="text-[10px] text-[#8e8e93]">{provider.model}</div>
          </div>
        ))}
      </div>

      {/* Capabilities */}
      <div className="space-y-2">
        <div className="text-[10px] text-[#636366] uppercase tracking-wider mb-2">
          能力评估
        </div>
        {LLM_INTEGRATION.capabilities.map((cap) => (
          <div key={cap.name}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-[#8e8e93]">{cap.name}</span>
              <span className="text-xs text-[#f5f5f7] font-medium">{cap.score}%</span>
            </div>
            <div className="h-2 bg-[#2c2c2e] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#0a84ff] rounded-full"
                style={{ width: `${cap.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FunctionCallingFlow() {
  const [activeStep, setActiveStep] = useState<number | null>(null);

  return (
    <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
      <h3 className="text-sm font-semibold text-[#f5f5f7] mb-4">Function Calling 流程</h3>
      <div className="space-y-2">
        {FUNCTION_CALLING_FLOW.map((step, index) => (
          <button
            key={index}
            onClick={() => setActiveStep(activeStep === index ? null : index)}
            className={`w-full text-left p-3 rounded-lg border transition-all ${
              activeStep === index
                ? "bg-[#141416] border-[#3a3a3c]"
                : "bg-[#141416] border-[#2c2c2e] hover:border-[#3a3a3c]"
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                  step.type === "input"
                    ? "bg-[#ff3b30]/20 text-[#ff3b30]"
                    : step.type === "process"
                    ? "bg-[#ff9f0a]/20 text-[#ff9f0a]"
                    : step.type === "action"
                    ? "bg-[#30d158]/20 text-[#30d158]"
                    : step.type === "data"
                    ? "bg-[#0a84ff]/20 text-[#0a84ff]"
                    : "bg-[#bf5af2]/20 text-[#bf5af2]"
                }`}
              >
                {step.step}
              </span>
              <span className="text-xs text-[#f5f5f7] font-mono flex-1 truncate">
                {step.content}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// Main Page
// =============================================================================

export default function Ch10AiAgentPage() {
  return (
    <div className="p-4 lg:p-8 max-w-[1200px] mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[#636366] mb-6">
        <Link href="/chapters" className="hover:text-[#f5f5f7] transition-colors">
          学习章节
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-[#8e8e93]">第十回</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#0a84ff]/10 flex items-center justify-center">
            <Bot className="w-5 h-5 text-[#0a84ff]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#f5f5f7]">AI Agent 部署实战</h1>
            <p className="text-sm text-[#636366]">
              AIP Logic 工作流、LLM 集成、Function Calling
            </p>
          </div>
        </div>
      </div>

      {/* Deployment Steps */}
      <div className="mb-8">
        <DeploymentSteps />
      </div>

      {/* ============================================ */}
      {/* AI Agent 博客文字详解 */}
      {/* ============================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
          <h3 className="text-sm font-semibold text-[#f5f5f7] mb-3">AIP Logic：AI 工作流编排</h3>
          <p className="text-xs text-[#8e8e93] leading-relaxed mb-3">
            AIP Logic 是 Palantir 的<strong className="text-[#f5f5f7]">AI 工作流编排画布</strong>。
            通过积木式搭建 Prompt Chain，FDE 不需要写代码就能将 LLM 与 Ontology 打通。
          </p>
          <div className="space-y-2 mb-3">
            {[
              "创建 System Prompt：定义 Agent 的初始规则和角色",
              "构建 Prompt Chain：使用 LLM、Ask User、Entity Extraction 块",
              "Knowledge Base 嵌入：将企业文档导入 Agent 知识库",
              "LLM 模型配置：选择模型（GPT-4/Claude）并调整参数",
              "关联知识库与 Prompt 块：让 Agent 调用企业私有数据",
              "触发器设计：Webhook 触发 / 定时触发 / 交易触发",
            ].map((step) => (
              <div key={step} className="flex items-center gap-2 p-2 rounded bg-[#141416] border border-[#2c2c2e] text-[10px] text-[#8e8e93]">
                <ChevronRight className="w-3 h-3 text-[#0a84ff] flex-shrink-0" />
                {step}
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
          <h3 className="text-sm font-semibold text-[#f5f5f7] mb-3">Agent 部署与监控策略</h3>
          <p className="text-xs text-[#8e8e93] leading-relaxed mb-3">
            Agent 部署不是一次性上线，而是持续的生命周期管理。FDE 需要建立完整的部署-监控-反馈闭环：
          </p>
          <div className="space-y-3">
            <div className="p-3 rounded bg-[#141416] border border-[#2c2c2e]">
              <span className="text-xs font-medium text-[#ff3b30]">安全沙箱部署</span>
              <p className="text-[10px] text-[#8e8e93] mt-1">
                AIP Evals 评估框架在部署前自动测试 Agent 质量（准确率、回复相关性、幻觉率三指标）。
                通过角色/标记/目的三级访问控制确保 Agent 只能访问授权数据。
              </p>
            </div>
            <div className="p-3 rounded bg-[#141416] border border-[#2c2c2e]">
              <span className="text-xs font-medium text-[#ff9f0a]">运行时监控</span>
              <p className="text-[10px] text-[#8e8e93] mt-1">
                AIP Operations 面板：Agent 运行状态、Token 使用量、API 调用频率、异常告警。
                FDE 需要为每个 Agent 建立健康度仪表盘。
              </p>
            </div>
            <div className="p-3 rounded bg-[#141416] border border-[#2c2c2e]">
              <span className="text-xs font-medium text-[#30d158]">持续优化</span>
              <p className="text-[10px] text-[#8e8e93] mt-1">
                基于用户显式反馈（点赞/点踩）和隐式反馈（点击/停留/转化）持续优化 Agent 表现。
                完整的审计追踪和可解释的思维链确保每个 AI 决策可回溯。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* LLM Integration + Function Calling */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <LlmIntegration />
        <FunctionCallingFlow />
      </div>

      {/* ============================================ */}
      {/* Agent 设计模式与最佳实践 */}
      {/* ============================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
          <h3 className="text-sm font-semibold text-[#f5f5f7] mb-3">Agent 设计模式</h3>
          <div className="space-y-3">
            {[
              { pattern: "任务分解 Agent", desc: "将复杂任务分解为子任务，逐步执行" },
              { pattern: "总结 Agent", desc: "汇总多个步骤的结果，生成最终报告" },
              { pattern: "反思 Agent", desc: "自我检查回答质量，必要时重试" },
              { pattern: "多 Agent 协作", desc: "多个 Agent 分工合作完成复杂任务" },
              { pattern: "工具使用 Agent", desc: "通过 Function Calling 调用外部工具" },
              { pattern: "记忆 Agent", desc: "记住对话历史，提供上下文感知服务" },
            ].map((item) => (
              <div key={item.pattern} className="p-3 rounded bg-[#141416] border border-[#2c2c2e]">
                <span className="text-xs font-medium text-[#f5f5f7] block">{item.pattern}</span>
                <span className="text-[10px] text-[#636366]">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
          <h3 className="text-sm font-semibold text-[#f5f5f7] mb-3">Agent 安全最佳实践</h3>
          <div className="space-y-3">
            {[
              { practice: "输入验证", desc: "对用户输入进行严格验证和过滤" },
              { practice: "输出审查", desc: "审查 Agent 输出，防止敏感信息泄露" },
              { practice: "权限控制", desc: "限制 Agent 访问敏感数据和功能" },
              { practice: "速率限制", desc: "限制 API 调用频率，防止滥用" },
              { practice: "日志审计", desc: "记录所有操作，支持追溯和审计" },
              { practice: "模型隔离", desc: "不同场景使用不同模型，降低风险" },
            ].map((item) => (
              <div key={item.practice} className="p-3 rounded bg-[#141416] border border-[#2c2c2e]">
                <span className="text-xs font-medium text-[#f5f5f7] block">{item.practice}</span>
                <span className="text-[10px] text-[#636366]">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* AIP Logic 详解（基于 Palantir 官方文档） */}
      {/* ============================================ */}
      <div className="mb-8">
        <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
          <h3 className="text-sm font-semibold text-[#f5f5f7] mb-4">AIP Logic 详解</h3>
          <div className="space-y-4 text-xs text-[#8e8e93] leading-relaxed">
            <p>
              根据 <strong className="text-[#f5f5f7]">Palantir 官方文档</strong>，AIP Logic 是 Palantir 平台的 AI 工作流编排工具。
              AIP Logic 的界面主要由三个组件构成：输入/块/输出配置、调试器、执行面板。
              典型的 AIP Logic 工作流程是：首先在左面板配置输入、块和输出，
              然后使用执行面板生成样本输出，最后在调试器中查看 LLM 的思维链（CoT）。
            </p>
            <p>
              <strong className="text-[#f5f5f7]">输入（Inputs）</strong>：AIP Logic 可以接受各种输入，包括原始类型或 Ontology 中的对象类型。
              支持的原始类型包括：数组、布尔值、日期、双精度浮点数、浮点数、整数、长整数、短整数、字符串、时间戳。
              输入让 Logic 函数能够接收外部数据，为后续处理提供基础。
            </p>
            <p>
              <strong className="text-[#f5f5f7]">块（Blocks）</strong>：AIP Logic 函数由块组成，块用于定义 Logic 指令。
              一个块的输出可以作为后续块的输入，形成数据流。
              常用的块包括：Use LLM（使用 LLM 进行推理）、Call Function（调用函数）、
              Query Ontology（查询 Ontology 数据）、Condition（条件分支）等。
              通过组合不同的块，可以构建复杂的工作流。
            </p>
            <p>
              <strong className="text-[#f5f5f7]">输出（Outputs）</strong>：输出定义了 Logic 函数的期望结果。
              输出可以是原始类型或对象类型，与输入类似。
              输出让 Logic 函数能够将处理结果返回给调用方，
              可以是另一个 Logic 函数、Workshop 应用或外部系统。
            </p>
            <p>
              <strong className="text-[#f5f5f7]">调试器（Debugger）</strong>：调试器显示 LLM 的思维链（Chain of Thought），
              展示 LLM 生成输出时所采取的步骤。
              通过调试器，可以了解 LLM 的推理过程，发现潜在问题，优化提示词。
              调试器与执行面板结合使用，可以可视化最终输出。
            </p>
            <p>
              <strong className="text-[#f5f5f7]">Function Calling（函数调用）</strong>：
              Call Function 工具让 LLM 能够调用 Ontology 中的函数。
              函数可以接受对象和对象集作为输入，读取对象的属性值，
              并返回计算结果。通过 Function Calling，LLM 可以获取实时数据，
              执行业务操作，实现与 Ontology 的深度集成。
              例如，LLM 可以调用「获取工具评分」函数，获取最新评分数据，
              然后基于这些数据生成推荐结果。
            </p>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* LLM 集成详解 */}
      {/* ============================================ */}
      <div className="mb-8">
        <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
          <h3 className="text-sm font-semibold text-[#f5f5f7] mb-4">LLM 集成详解</h3>
          <div className="space-y-4 text-xs text-[#8e8e93] leading-relaxed">
            <p>
              <strong className="text-[#f5f5f7]">Bring Your Own Model（BYOM）</strong>：
              Palantir 平台支持用户自带模型（BYOM），也称为「注册模型」。
              根据官方文档，用户可以通过函数接口注册自己的 LLM，
              无论是本地部署、自有云部署，还是在其他平台微调的模型。
              注册后的模型可以在 AIP Logic、Pipeline Builder、Agent Studio 等应用中使用。
            </p>
            <p>
              <strong className="text-[#f5f5f7]">注册 LLM 的步骤</strong>：
              1. 设置 REST 源和 Webhook：在 Data Connection 中创建 REST API 源，
              配置 LLM 的 API 端点和认证信息。
              2. 实现 ChatCompletion 接口：编写 TypeScript 函数，
              使用 @ChatCompletion 装饰器标记，调用 Webhook 与外部模型通信。
              3. 发布函数：保存并发布函数，使其在 AIP Logic 中可用。
              4. 使用注册模型：在 AIP Logic 的 Use LLM 块中，
              选择 Registered 标签页，选择已注册的模型。
            </p>
            <p>
              <strong className="text-[#f5f5f7]">支持的模型能力</strong>：
              注册模型支持多种能力，包括 ChatCompletion（文本聊天完成）、
              StreamedChatCompletion（流式文本完成）、ChatCompletionWithVision（支持图像的聊天完成）。
              这些能力让模型可以处理文本、图像等多种输入，生成丰富的输出。
            </p>
            <p>
              <strong className="text-[#f5f5f7]">安全与合规</strong>：
              所有操作都尊重用户现有的权限，包括应用和数据访问。
              用户可以选择特定的模型，以及模型可用的工具和数据，
              确保模型只能访问请求操作所需的能力。
              这种受控的上下文方法防止了「上下文污染」——
              即无关信息稀释模型推理效果的问题。
            </p>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* AI Agent 设计模式 */}
      {/* ============================================ */}
      <div className="mb-8">
        <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
          <h3 className="text-sm font-semibold text-[#f5f5f7] mb-4">AI Agent 设计模式</h3>
          <div className="space-y-3">
            {[
              {
                pattern: "任务分解 Agent",
                desc: "将复杂任务分解为子任务，逐步执行。例如，用户请求「推荐适合我的 AI 工具」，Agent 先分解为「了解用户需求」「筛选候选工具」「排序推荐」「生成推荐理由」四个子任务。",
              },
              {
                pattern: "总结 Agent",
                desc: "汇总多个步骤的结果，生成最终报告。例如，Agent 先收集多个工具的评分、评论、使用数据，然后生成综合对比报告。",
              },
              {
                pattern: "反思 Agent",
                desc: "自我检查回答质量，必要时重试。例如，Agent 生成推荐后，检查推荐是否符合用户需求，如果不符合，重新调整推荐策略。",
              },
              {
                pattern: "多 Agent 协作",
                desc: "多个 Agent 分工合作完成复杂任务。例如，一个 Agent 负责数据收集，一个 Agent 负责分析，一个 Agent 负责生成报告。",
              },
              {
                pattern: "工具使用 Agent",
                desc: "通过 Function Calling 调用外部工具。例如，Agent 调用「获取工具评分」函数获取实时数据，调用「更新用户偏好」函数记录用户选择。",
              },
              {
                pattern: "记忆 Agent",
                desc: "记住对话历史，提供上下文感知服务。例如，Agent 记住用户之前的查询和选择，在后续对话中提供个性化推荐。",
              },
            ].map((item) => (
              <div key={item.pattern} className="p-3 rounded bg-[#141416] border border-[#2c2c2e]">
                <span className="text-xs font-medium text-[#f5f5f7] block mb-1">{item.pattern}</span>
                <span className="text-[10px] text-[#636366] leading-relaxed">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Key Takeaway */}
      <div className="p-5 rounded-xl bg-[#0a84ff]/5 border border-[#0a84ff]/20">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-[#0a84ff] flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-[#f5f5f7] mb-2">核心要点</h3>
            <p className="text-xs text-[#8e8e93] leading-relaxed">
              AI Agent 部署是 FDE 的核心能力之一。通过 <strong className="text-[#f5f5f7]">AIP Logic</strong> 编排工作流，
              将 <strong className="text-[#f5f5f7]">LLM</strong> 与 Ontology 结合，实现智能推荐、自动分析等功能。
              <strong className="text-[#f5f5f7]">Function Calling</strong> 让 LLM 能够调用 Ontology 中的函数，
              获取实时数据并执行业务操作。Agent 不是独立系统，而是 Ontology 的智能延伸。
              AIP Logic 提供输入、块、输出三个核心组件，配合调试器和执行面板，
              让 FDE 能够构建复杂的 AI 工作流。BYOM 能力让用户可以自带模型，
              满足合规和定制化需求。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
