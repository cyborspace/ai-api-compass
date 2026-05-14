"use client";

import { useState } from "react";
import {
  AppWindow,
  ChevronRight,
  Box,
  Search,
  BarChart3,
  Brain,
  ArrowRight,
  CheckCircle2,
  Link2,
  Layers,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

// =============================================================================
// Data
// =============================================================================

const APPLICATIONS = [
  {
    id: "workshop",
    name: "Workshop",
    description: "可视化应用构建器，拖拽式创建 Ontology 感知应用",
    icon: AppWindow,
    color: "#ff3b30",
    features: ["拖拽式界面", "Object 绑定", "实时预览", "权限集成"],
    ontologyBinding: "直接绑定 Object Types，自动感知数据变更",
  },
  {
    id: "explorer",
    name: "Object Explorer",
    description: "对象浏览器，查看和搜索 Ontology 中的所有对象",
    icon: Search,
    color: "#ff9f0a",
    features: ["对象搜索", "关系图谱", "属性查看", "批量操作"],
    ontologyBinding: "基于 Object Types 自动生成浏览界面",
  },
  {
    id: "quiver",
    name: "Quiver",
    description: "数据分析工具，对 Ontology 数据进行分析和可视化",
    icon: BarChart3,
    color: "#30d158",
    features: ["图表生成", "数据透视", "时间序列", "导出报表"],
    ontologyBinding: "直接读取 Object 属性，支持 Function 计算结果",
  },
  {
    id: "aip",
    name: "AIP Logic",
    description: "AI 工作流编排，将 LLM 与 Ontology 结合",
    icon: Brain,
    color: "#0a84ff",
    features: ["LLM 调用", "Function Calling", "Agent 编排", "自动化工作流"],
    ontologyBinding: "通过 Function 访问 Ontology，通过 Action 写回结果",
  },
];

const OBJECT_SET_QUERY = {
  query: "所有评分大于 4.5 的图像生成工具",
  steps: [
    { operation: "FROM", target: "AIGCTool", description: "从 AIGCTool 对象类型开始" },
    { operation: "WHERE", target: "rating > 4.5", description: "筛选评分大于 4.5 的工具" },
    { operation: "AND", target: "category = 'image-generation'", description: "且分类为图像生成" },
    { operation: "SELECT", target: "name, rating, capabilities", description: "选择名称、评分和能力" },
  ],
  results: [
    { name: "Midjourney", rating: 4.8, capabilities: ["图像生成", "风格迁移"] },
    { name: "DALL-E 3", rating: 4.7, capabilities: ["图像生成", "编辑"] },
    { name: "Stable Diffusion", rating: 4.6, capabilities: ["图像生成", "本地部署"] },
  ],
};

const APP_ONTOLOGY_LINKS = [
  { app: "Workshop", direction: "→", ontology: "Object Types", type: "绑定" },
  { app: "Workshop", direction: "→", ontology: "Action Types", type: "触发" },
  { app: "Object Explorer", direction: "→", ontology: "Object Types", type: "浏览" },
  { app: "Quiver", direction: "→", ontology: "Functions", type: "计算" },
  { app: "AIP Logic", direction: "↔", ontology: "Functions", type: "调用" },
  { app: "AIP Logic", direction: "→", ontology: "Action Types", type: "写回" },
];

// =============================================================================
// Components
// =============================================================================

function AppCard({
  app,
  isActive,
  onClick,
}: {
  app: (typeof APPLICATIONS)[0];
  isActive: boolean;
  onClick: () => void;
}) {
  const Icon = app.icon;
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border transition-all ${
        isActive
          ? "bg-[#1c1c1e] border-[#3a3a3c]"
          : "bg-[#141416] border-[#2c2c2e] hover:border-[#3a3a3c]"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${app.color}15` }}
        >
          <Icon className="w-5 h-5" style={{ color: app.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-[#f5f5f7]">{app.name}</h4>
            <ChevronRight
              className={`w-4 h-4 text-[#636366] transition-transform ${
                isActive ? "rotate-90" : ""
              }`}
            />
          </div>
          <p className="text-xs text-[#8e8e93] mt-1">{app.description}</p>
        </div>
      </div>

      {isActive && (
        <div className="mt-3 pt-3 border-t border-[#2c2c2e]">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[10px] text-[#636366] uppercase tracking-wider mb-2">
                核心功能
              </div>
              <ul className="space-y-1">
                {app.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-[#8e8e93]">
                    <CheckCircle2 className="w-3 h-3 text-[#30d158]" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-[10px] text-[#636366] uppercase tracking-wider mb-2">
                Ontology 绑定
              </div>
              <p className="text-xs text-[#8e8e93]">{app.ontologyBinding}</p>
            </div>
          </div>
        </div>
      )}
    </button>
  );
}

function ObjectSetQueryBuilder() {
  const [activeStep, setActiveStep] = useState<number | null>(null);

  return (
    <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
      <h3 className="text-sm font-semibold text-[#f5f5f7] mb-4">Object Set 查询可视化</h3>

      {/* Query */}
      <div className="p-3 rounded-lg bg-[#141416] border border-[#2c2c2e] mb-4">
        <div className="text-[10px] text-[#636366] mb-1">查询语句</div>
        <div className="text-xs text-[#f5f5f7] font-mono">{OBJECT_SET_QUERY.query}</div>
      </div>

      {/* Steps */}
      <div className="space-y-2 mb-4">
        {OBJECT_SET_QUERY.steps.map((step, index) => (
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
                  step.operation === "FROM"
                    ? "bg-[#ff3b30]/20 text-[#ff3b30]"
                    : step.operation === "WHERE"
                    ? "bg-[#ff9f0a]/20 text-[#ff9f0a]"
                    : step.operation === "AND"
                    ? "bg-[#30d158]/20 text-[#30d158]"
                    : "bg-[#0a84ff]/20 text-[#0a84ff]"
                }`}
              >
                {step.operation}
              </span>
              <span className="text-xs text-[#f5f5f7] font-mono">{step.target}</span>
            </div>
            {activeStep === index && (
              <p className="text-xs text-[#8e8e93] mt-2">{step.description}</p>
            )}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="p-3 rounded-lg bg-[#141416] border border-[#2c2c2e]">
        <div className="text-[10px] text-[#636366] mb-2">查询结果 ({OBJECT_SET_QUERY.results.length} 条)</div>
        <div className="space-y-2">
          {OBJECT_SET_QUERY.results.map((result) => (
            <div
              key={result.name}
              className="flex items-center justify-between p-2 rounded bg-[#2c2c2e]/50"
            >
              <span className="text-xs text-[#f5f5f7]">{result.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#ff9f0a]">★ {result.rating}</span>
                <div className="flex gap-1">
                  {result.capabilities.map((cap) => (
                    <span
                      key={cap}
                      className="px-1.5 py-0.5 rounded text-[8px] bg-[#2c2c2e] text-[#8e8e93]"
                    >
                      {cap}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AppOntologyLinkage() {
  return (
    <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
      <h3 className="text-sm font-semibold text-[#f5f5f7] mb-4">应用与 Ontology 联动关系</h3>
      <div className="space-y-2">
        {APP_ONTOLOGY_LINKS.map((link, index) => (
          <div
            key={index}
            className="flex items-center gap-3 p-3 rounded-lg bg-[#141416] border border-[#2c2c2e]"
          >
            <span className="text-xs text-[#f5f5f7] w-28">{link.app}</span>
            <div className="flex items-center gap-1">
              {link.direction.split("").map((char, i) => (
                <ArrowRight
                  key={i}
                  className={`w-3 h-3 text-[#636366] ${
                    char === "←" ? "rotate-180" : char === "↔" ? "" : ""
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-[#f5f5f7] flex-1">{link.ontology}</span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] ${
                link.type === "绑定"
                  ? "bg-[#ff3b30]/20 text-[#ff3b30]"
                  : link.type === "触发"
                  ? "bg-[#ff9f0a]/20 text-[#ff9f0a]"
                  : link.type === "浏览"
                  ? "bg-[#30d158]/20 text-[#30d158]"
                  : link.type === "计算"
                  ? "bg-[#0a84ff]/20 text-[#0a84ff]"
                  : "bg-[#bf5af2]/20 text-[#bf5af2]"
              }`}
            >
              {link.type}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// Main Page
// =============================================================================

export default function Ch09OntologyAppsPage() {
  const [activeApp, setActiveApp] = useState<string>("workshop");

  return (
    <div className="p-4 lg:p-8 max-w-[1200px] mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[#636366] mb-6">
        <Link href="/chapters" className="hover:text-[#f5f5f7] transition-colors">
          学习章节
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-[#8e8e93]">第九回</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#30d158]/10 flex items-center justify-center">
            <AppWindow className="w-5 h-5 text-[#30d158]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#f5f5f7]">Ontology 感知应用</h1>
            <p className="text-sm text-[#636366]">
              Workshop、Object Explorer、Quiver 等应用如何与 Ontology 联动
            </p>
          </div>
        </div>
      </div>

      {/* App Cards + Object Set Query */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="space-y-3">
          {APPLICATIONS.map((app) => (
            <AppCard
              key={app.id}
              app={app}
              isActive={activeApp === app.id}
              onClick={() => setActiveApp(app.id)}
            />
          ))}
        </div>
        <ObjectSetQueryBuilder />
      </div>

      {/* App-Ontology Linkage */}
      <div className="mb-8">
        <AppOntologyLinkage />
      </div>

      {/* ============================================ */}
      {/* 应用-本体联动博客详解 */}
      {/* ============================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        {[
          {
            title: "Workshop",
            color: "#ff3b30",
            desc: "Palantir 的低代码应用构建平台，通过拖拽式界面绑定 Ontology Object Type，自动生成 CRUD 界面。FDE 通过 Widget 配置而非代码构建 80% 的业务应用。三种构建模式：模板快速启动（推荐）、从 Object Type 开始、从空白画布开始。",
          },
          {
            title: "Object Explorer",
            color: "#ff9f0a",
            desc: "自动生成的 Ontology 数据浏览器。无需编写任何前端代码，系统根据 Object Type 定义自动渲染列表页、详情页、搜索和筛选功能。FDE 定义好 Object Type 后，Object Explorer 自动产出生产级浏览界面。",
          },
          {
            title: "Quiver",
            color: "#30d158",
            desc: "交互式数据分析工具。直接连接 Ontology，支持组织节点（Linked Objects）、地理空间、时间序列、自定义图表四种视图。FDE 用 Quiver 做深度因果分析——不需要写代码，拖动对象即可形成分析链条。",
          },
        ].map((item) => (
          <div key={item.title} className="p-4 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
            <h4 className="text-xs font-semibold text-[#f5f5f7] mb-2" style={{ color: item.color }}>{item.title}</h4>
            <p className="text-[10px] text-[#8e8e93] leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Slate 详解 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
          <h3 className="text-sm font-semibold text-[#f5f5f7] mb-3">Slate：全代码定制开发</h3>
          <p className="text-xs text-[#8e8e93] leading-relaxed mb-3">
            当 Workshop 的拖拽式开发无法满足复杂交互需求时，Slate 提供完全的控制权。
            它让 FDE 使用 <strong className="text-[#f5f5f7]">TypeScript + React</strong> 构建高度定制的交互式应用，
            直接调用 Ontology SDK 读写对象数据。
          </p>
          <p className="text-xs text-[#8e8e93] leading-relaxed mb-3">
            5 种 Slate 前端布局：标签页（Tab）、仪表盘（Dashboard）、数据流视图（Graph）、经典网页布局、向左钻取。
            Slate 与 Workshop 不是替代关系而是互补：Workshop 处理标准化查询展示，Slate 处理高度定制化的交互逻辑。
          </p>
          <div className="p-3 rounded bg-[#141416] border border-[#2c2c2e]">
            <span className="text-[10px] text-[#30d158] font-medium">适合 Slate 的场景：</span>
            <span className="text-[10px] text-[#8e8e93]">供应链实时监控看板、作战指挥大屏、复杂甘特图、自定义地图标注</span>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
          <h3 className="text-sm font-semibold text-[#f5f5f7] mb-3">应用与 Ontology 的双向联动模式</h3>
          <p className="text-xs text-[#8e8e93] leading-relaxed mb-3">
            Ontology 感知应用的核心特点是双向联动，而非单向读取：
          </p>
          <div className="space-y-2">
            {[
              { direction: "Ontology → 应用", desc: "数据自动净化后通过 API 层供应用消费。数据变更实时推送，无需刷新。" },
              { direction: "应用 → Ontology", desc: "用户操作通过 Action 写入 Ontology。点赞、评价、收藏 → Action → Writeback → 数据库。" },
              { direction: "AI → 双向", desc: "LLM 通过 Function 读取 Ontology 数据，通过 Action 写入结果。自然语言对话 ↔ 结构化操作。" },
            ].map((item) => (
              <div key={item.direction} className="p-2 rounded bg-[#141416] border border-[#2c2c2e]">
                <span className="text-xs font-medium text-[#f5f5f7] block">{item.direction}</span>
                <span className="text-[10px] text-[#636366]">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Key Takeaway */}
      <div className="p-5 rounded-xl bg-[#30d158]/5 border border-[#30d158]/20">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-[#30d158] flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-[#f5f5f7] mb-2">核心要点</h3>
            <p className="text-xs text-[#8e8e93] leading-relaxed">
              Ontology 感知应用的核心特点是<strong className="text-[#f5f5f7]">数据与应用的无缝绑定</strong>。
              Workshop 直接绑定 Object Types，Object Explorer 自动生成浏览界面，
              Quiver 直接读取 Object 属性，AIP Logic 通过 Function 访问 Ontology。
              这种绑定是双向的：应用读取 Ontology 数据，Action 将用户操作写回 Ontology。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
