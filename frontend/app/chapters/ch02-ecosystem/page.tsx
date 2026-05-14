"use client";

import { useState } from "react";
import {
  Network,
  ChevronRight,
  Layers,
  Brain,
  Shield,
  Rocket,
  Database,
  Code2,
  Users,
  BarChart3,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";

// =============================================================================
// Data
// =============================================================================

const ECOSYSTEM_LAYERS = [
  {
    id: "foundry",
    name: "Palantir Foundry",
    tagline: "数据操作系统",
    description: "企业级数据平台，提供数据集成、转换、建模和分析能力",
    icon: Database,
    color: "#ff3b30",
    features: [
      "数据集成与 ETL",
      "Ontology 建模",
      "数据质量管理",
      "权限与安全",
      "版本控制",
    ],
    components: ["Ontology", "Workshop", "Object Explorer", "Quiver", "Code Workbook"],
  },
  {
    id: "aip",
    name: "Palantir AIP",
    tagline: "AI 平台",
    description: "集成大语言模型的 AI 平台，支持 Agent 部署、逻辑编排和智能分析",
    icon: Brain,
    color: "#0a84ff",
    features: [
      "LLM 集成",
      "AIP Logic",
      "Function Calling",
      "Agent 部署",
      "智能分析",
    ],
    components: ["AIP Logic", "LLM 网关", "Function Registry", "Agent 运行时"],
  },
  {
    id: "gotham",
    name: "Palantir Gotham",
    tagline: "防务与情报",
    description: "面向国防、情报和执法领域的数据分析与决策平台",
    icon: Shield,
    color: "#30d158",
    features: [
      "情报分析",
      "态势感知",
      "决策支持",
      "数据融合",
      "安全合规",
    ],
    components: ["情报图谱", "地理空间分析", "时序分析", "对象追踪"],
  },
  {
    id: "apollo",
    name: "Palantir Apollo",
    tagline: "持续交付平台",
    description: "DevOps 和持续交付平台，支持软件部署、监控和运维",
    icon: Rocket,
    color: "#ff9f0a",
    features: [
      "持续集成/交付",
      "基础设施管理",
      "监控告警",
      "版本管理",
      "多环境部署",
    ],
    components: ["CI/CD 流水线", "容器编排", "监控中心", "日志管理"],
  },
];

const RELATIONSHIPS = [
  {
    from: "Foundry",
    to: "AIP",
    description: "Foundry 提供结构化数据，AIP 提供 AI 能力",
    type: "数据→智能",
  },
  {
    from: "AIP",
    to: "Foundry",
    description: "AIP 通过 Action 将 AI 结果写回 Ontology",
    type: "智能→数据",
  },
  {
    from: "Foundry",
    to: "Gotham",
    description: "Foundry 提供基础数据层，Gotham 专注情报分析",
    type: "基础→专业",
  },
  {
    from: "Apollo",
    to: "Foundry/AIP",
    description: "Apollo 负责部署和运维 Foundry 与 AIP",
    type: "运维→平台",
  },
];

const FDE_FOCUS = [
  { area: "Ontology 建模", foundry: true, aip: false, gotham: false, apollo: false },
  { area: "数据工程", foundry: true, aip: false, gotham: false, apollo: false },
  { area: "应用开发", foundry: true, aip: true, gotham: false, apollo: false },
  { area: "AI 集成", foundry: false, aip: true, gotham: false, apollo: false },
  { area: "Function 开发", foundry: true, aip: true, gotham: false, apollo: false },
  { area: "Action 设计", foundry: true, aip: true, gotham: false, apollo: false },
  { area: "安全合规", foundry: true, aip: true, gotham: true, apollo: false },
  { area: "部署运维", foundry: false, aip: false, gotham: false, apollo: true },
];

// =============================================================================
// Components
// =============================================================================

function LayerCard({
  layer,
  isActive,
  onClick,
}: {
  layer: (typeof ECOSYSTEM_LAYERS)[0];
  isActive: boolean;
  onClick: () => void;
}) {
  const Icon = layer.icon;
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-5 rounded-xl border transition-all ${
        isActive
          ? "bg-[#1c1c1e] border-[#3a3a3c]"
          : "bg-[#141416] border-[#2c2c2e] hover:border-[#3a3a3c]"
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform"
          style={{ backgroundColor: `${layer.color}15` }}
        >
          <Icon className="w-6 h-6" style={{ color: layer.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-[#f5f5f7]">{layer.name}</h3>
            <ChevronRight
              className={`w-4 h-4 text-[#636366] transition-transform ${
                isActive ? "rotate-90" : ""
              }`}
            />
          </div>
          <p className="text-xs text-[#ff9f0a] mb-2">{layer.tagline}</p>
          <p className="text-xs text-[#8e8e93] line-clamp-2">{layer.description}</p>
        </div>
      </div>

      {isActive && (
        <div className="mt-4 pt-4 border-t border-[#2c2c2e]">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[10px] text-[#636366] uppercase tracking-wider mb-2">
                核心功能
              </div>
              <ul className="space-y-1">
                {layer.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-[#8e8e93]">
                    <CheckCircle2 className="w-3 h-3 text-[#30d158]" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-[10px] text-[#636366] uppercase tracking-wider mb-2">
                关键组件
              </div>
              <div className="flex flex-wrap gap-1">
                {layer.components.map((c) => (
                  <span
                    key={c}
                    className="px-2 py-0.5 rounded text-[10px] bg-[#2c2c2e] text-[#8e8e93]"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </button>
  );
}

function ArchitectureDiagram() {
  return (
    <div className="p-6 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
      <h3 className="text-sm font-semibold text-[#f5f5f7] mb-6">生态架构关系图</h3>
      <div className="relative">
        {/* Central hub */}
        <div className="flex justify-center mb-8">
          <div className="p-4 rounded-xl bg-[#ff3b30]/10 border border-[#ff3b30]/30 text-center">
            <Database className="w-6 h-6 text-[#ff3b30] mx-auto mb-2" />
            <div className="text-sm font-semibold text-[#f5f5f7]">Foundry</div>
            <div className="text-[10px] text-[#8e8e93]">数据中枢</div>
          </div>
        </div>

        {/* Connections */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="flex flex-col items-center">
            <div className="h-8 w-px bg-[#2c2c2e]" />
            <ArrowRight className="w-4 h-4 text-[#636366] rotate-[-90deg]" />
            <div className="p-3 rounded-lg bg-[#0a84ff]/10 border border-[#0a84ff]/30 text-center mt-2">
              <Brain className="w-5 h-5 text-[#0a84ff] mx-auto mb-1" />
              <div className="text-xs font-medium text-[#f5f5f7]">AIP</div>
              <div className="text-[10px] text-[#8e8e93]">AI 智能层</div>
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div className="h-8 w-px bg-[#2c2c2e]" />
            <ArrowRight className="w-4 h-4 text-[#636366] rotate-[-90deg]" />
            <div className="p-3 rounded-lg bg-[#30d158]/10 border border-[#30d158]/30 text-center mt-2">
              <Shield className="w-5 h-5 text-[#30d158] mx-auto mb-1" />
              <div className="text-xs font-medium text-[#f5f5f7]">Gotham</div>
              <div className="text-[10px] text-[#8e8e93]">防务情报层</div>
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div className="h-8 w-px bg-[#2c2c2e]" />
            <ArrowRight className="w-4 h-4 text-[#636366] rotate-[-90deg]" />
            <div className="p-3 rounded-lg bg-[#ff9f0a]/10 border border-[#ff9f0a]/30 text-center mt-2">
              <Rocket className="w-5 h-5 text-[#ff9f0a] mx-auto mb-1" />
              <div className="text-xs font-medium text-[#f5f5f7]">Apollo</div>
              <div className="text-[10px] text-[#8e8e93]">交付运维层</div>
            </div>
          </div>
        </div>

        {/* Relationships */}
        <div className="space-y-2">
          {RELATIONSHIPS.map((rel) => (
            <div
              key={rel.from + rel.to}
              className="flex items-center gap-3 p-2 rounded-lg bg-[#141416] border border-[#2c2c2e]"
            >
              <span className="text-xs font-medium text-[#f5f5f7] w-16">{rel.from}</span>
              <ArrowRight className="w-3 h-3 text-[#636366]" />
              <span className="text-xs text-[#8e8e93] flex-1">{rel.description}</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#2c2c2e] text-[#636366]">
                {rel.type}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FdeFocusMatrix() {
  const products = ["Foundry", "AIP", "Gotham", "Apollo"];

  return (
    <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
      <h3 className="text-sm font-semibold text-[#f5f5f7] mb-4">FDE 工作范围矩阵</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#2c2c2e]">
              <th className="text-left py-2 px-3 text-[#636366] font-medium">工作领域</th>
              {products.map((p) => (
                <th key={p} className="text-center py-2 px-3 text-[#636366] font-medium">
                  {p}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FDE_FOCUS.map((item) => (
              <tr key={item.area} className="border-b border-[#2c2c2e] last:border-0">
                <td className="py-2 px-3 text-[#f5f5f7]">{item.area}</td>
                <td className="py-2 px-3 text-center">
                  {item.foundry ? (
                    <CheckCircle2 className="w-4 h-4 text-[#30d158] mx-auto" />
                  ) : (
                    <span className="text-[#636366]">—</span>
                  )}
                </td>
                <td className="py-2 px-3 text-center">
                  {item.aip ? (
                    <CheckCircle2 className="w-4 h-4 text-[#30d158] mx-auto" />
                  ) : (
                    <span className="text-[#636366]">—</span>
                  )}
                </td>
                <td className="py-2 px-3 text-center">
                  {item.gotham ? (
                    <CheckCircle2 className="w-4 h-4 text-[#30d158] mx-auto" />
                  ) : (
                    <span className="text-[#636366]">—</span>
                  )}
                </td>
                <td className="py-2 px-3 text-center">
                  {item.apollo ? (
                    <CheckCircle2 className="w-4 h-4 text-[#30d158] mx-auto" />
                  ) : (
                    <span className="text-[#636366]">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

}

// =============================================================================
// Main Page
// =============================================================================

export default function Ch02EcosystemPage() {
  const [activeLayer, setActiveLayer] = useState<string>("foundry");

  return (
    <div className="p-4 lg:p-8 max-w-[1200px] mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[#636366] mb-6">
        <Link href="/chapters" className="hover:text-[#f5f5f7] transition-colors">
          学习章节
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-[#8e8e93]">第二回</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#ff9f0a]/10 flex items-center justify-center">
            <Network className="w-5 h-5 text-[#ff9f0a]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#f5f5f7]">Palantir 生态系统</h1>
            <p className="text-sm text-[#636366]">
              四大产品线的定位、关系与协同
            </p>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* 2.1 Foundry 平台概览 - 博客文字 */}
      {/* ============================================ */}
      <div className="mb-8">
        <div className="prose prose-invert max-w-none">
          <h3 className="text-base font-semibold text-[#f5f5f7] mb-3 flex items-center gap-2">
            <Database className="w-4 h-4 text-[#ff3b30]" />
            Foundry：企业的"数据操作系统"
          </h3>
          <p className="text-sm text-[#8e8e93] leading-relaxed mb-3">
            Palantir Foundry 的官方定位是<strong className="text-[#f5f5f7]">"现代企业的端到端数据操作系统"</strong>，旨在减少数据孤岛并推动运营决策。
            关键词是"操作系统"——不是又一个数据仓库，不是又一个 BI 工具，而是一个让企业所有数据、决策和行动统一运行的底层平台。
          </p>
          <p className="text-sm text-[#8e8e93] leading-relaxed mb-3">
            Palantir 资深架构师 Chad Wahlquist 指出，当今企业的软件格局比以往任何时候都更加碎片化，形成了一个名副其实的<strong className="text-[#ff9f0a]">"巴别塔"</strong>：
            不同的团队、工具和技术各自为政，拥有不同的扩展功能、安全机制和数据格式，每个部分都在追求自身的利益，却牺牲了整个系统的协同性。
            Foundry 的目标，就是在这个碎片化的世界中，提供一个统一的、集成的平台。
          </p>
          <p className="text-sm text-[#8e8e93] leading-relaxed mb-3">
            Foundry 的底层技术栈包括：<strong className="text-[#f5f5f7]">Apache Spark</strong> 作为计算引擎，
            <strong className="text-[#f5f5f7]">React + TypeScript</strong> 驱动前端，
            <strong className="text-[#f5f5f7]">GraphQL</strong> 作为 Ontology 数据查询的核心协议。
            支持多种部署模式：Palantir 云、客户云（AWS/Azure/GCP）、以及完全断网的<strong className="text-[#ff3b30]">气隙隔离（Air-gapped）</strong>环境——
            这种"在最严苛条件下工作"的经验塑造了 Foundry 的设计哲学：自包含、可离线运行、高安全性。
          </p>
        </div>
      </div>

      {/* Layer Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {ECOSYSTEM_LAYERS.map((layer) => (
          <LayerCard
            key={layer.id}
            layer={layer}
            isActive={activeLayer === layer.id}
            onClick={() => setActiveLayer(layer.id)}
          />
        ))}
      </div>

      {/* ============================================ */}
      {/* 2.2 AIP - AI Mesh 架构详解 */}
      {/* ============================================ */}
      <div className="mb-8">
        <div className="prose prose-invert max-w-none">
          <h3 className="text-base font-semibold text-[#f5f5f7] mb-3 flex items-center gap-2">
            <Brain className="w-4 h-4 text-[#0a84ff]" />
            AIP 的设计理念：AI Mesh 架构
          </h3>
          <p className="text-sm text-[#8e8e93] leading-relaxed mb-3">
            2023 年大语言模型爆发后，Palantir 推出了 AIP（Artificial Intelligence Platform）。
            AIP 并非独立产品，而是<strong className="text-[#f5f5f7]">构建在 Foundry 和 Apollo 之上</strong>的新一代平台层。
            它的核心使命是：<strong className="text-[#0a84ff]">将大语言模型与企业的私有数据和操作本体连接，驱动业务流程自动化</strong>。
          </p>
          <p className="text-sm text-[#8e8e93] leading-relaxed mb-3">
            AIP 的底层架构被称为 <strong className="text-[#f5f5f7]">"AI Mesh 架构"</strong>，由八大核心能力组成：
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
            {[
              { name: "应用构建服务", desc: "预构建 AI 产品 (AIP Now) + 开发工具包 (SDK/Workshop)" },
              { name: "本体论 (Ontology)", desc: "对象+关系+属性+动作，AI 和人类操作同一套对象" },
              { name: "数据服务", desc: "150+ 连接器、Hyper Auto 自动化、Data as Code" },
              { name: "AI 服务", desc: "任何模型任何地方、JupyterLab 环境、完整 MLOps" },
              { name: "工作流服务", desc: "基于模型的执行、决策编排、边缘集成" },
              { name: "安全", desc: "角色/标记/目的访问控制、审批框架、审计追踪" },
              { name: "Apollo", desc: "编排数百微服务、快速部署更新" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-[#141416] border border-[#2c2c2e]">
                <span className="text-[10px] font-bold text-[#0a84ff] flex-shrink-0">{i + 1}.</span>
                <div>
                  <span className="text-xs font-medium text-[#f5f5f7]">{item.name}</span>
                  <span className="text-[10px] text-[#636366] block">{item.desc}</span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-sm text-[#8e8e93] leading-relaxed mb-3">
            AIP 的核心理念是<strong className="text-[#30d158]">"AI 与人类协作"（AI and Human Teaming）</strong>——不是用 AI 替代人类，而是让 AI 和人类协同工作。
            AI 负责处理大量数据和常规决策，人类负责需要判断力和责任承担的关键决策。
            所有 AI 决策都有完整的审计追踪和可解释的"思维链"。
          </p>
          <p className="text-sm text-[#8e8e93] leading-relaxed">
            AIP 的核心工具包括：<strong className="text-[#f5f5f7]">AIP Logic</strong>（创建系统提示，为 AI 代理授予工具访问权限）、
            <strong className="text-[#f5f5f7]">AIP Agent Studio</strong>（AI 代理开发环境）、
            <strong className="text-[#f5f5f7]">AIP Evals</strong>（模型评估框架）和
            <strong className="text-[#f5f5f7]">Model Catalog</strong>（统一的多模型管理目录）。
          </p>
        </div>
      </div>

      {/* Architecture + Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <ArchitectureDiagram />
        <FdeFocusMatrix />
      </div>

      {/* ============================================ */}
      {/* 2.3 Gotham + Apollo 详解 */}
      {/* ============================================ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="prose prose-invert max-w-none">
          <h3 className="text-base font-semibold text-[#f5f5f7] mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#30d158]" />
            Gotham：情报与国防的 Ontology 实践
          </h3>
          <p className="text-sm text-[#8e8e93] leading-relaxed">
            Gotham 是 Palantir 的第一个核心产品，服务于美国情报界和国防领域。2005 年，CIA 旗下的 In-Q-Tel 给 Palantir 进行了 200 万美元的种子轮投资——这笔投资不仅是资金，更是进入美国情报界的入场券。
            Gotham 的工作方式直接塑造了 FDE 模式：工程师需要深入现场，与情报分析师并肩工作——因为没人能坐在办公室里"想象"出情报分析师的工作方式。这种"前线驻场"模式后来被系统化为 FDE 方法论。
            主要用户包括美国情报界（USIC）、美国国防部（DoD）、乌克兰军队、国际刑警组织等，符合 IL5/IL6 安全认证。
          </p>
        </div>
        <div className="prose prose-invert max-w-none">
          <h3 className="text-base font-semibold text-[#f5f5f7] mb-3 flex items-center gap-2">
            <Rocket className="w-4 h-4 text-[#ff9f0a]" />
            Apollo：FDE 快速交付的技术基础
          </h3>
          <p className="text-sm text-[#8e8e93] leading-relaxed">
            Apollo 是 Palantir 的基础设施产品，负责自主部署、CI/CD 和环境管理。它的存在使得 FDE 在前线做的每一项创新，都能快速、安全地部署到生产环境中。
            支持 FedRAMP、IL5 和 IL6 认证，具备合规感知型变更管理、发布通道订阅、边缘部署等能力。
            正是 Apollo，确保了 FDE 模式能够<strong className="text-[#f5f5f7]">"在规模化的状态下持续做无法规模化的事情"</strong>。
          </p>
        </div>
      </div>

      {/* ============================================ */}
      {/* 2.4 FDE 商业哲学 */}
      {/* ============================================ */}
      <div className="mb-8">
        <div className="prose prose-invert max-w-none">
          <h3 className="text-base font-semibold text-[#f5f5f7] mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-[#bf5af2]" />
            FDE 的三条生死线与商业模式
          </h3>
          <div className="space-y-3">
            <div className="p-4 rounded-lg bg-[#141416] border border-[#2c2c2e]">
              <p className="text-sm text-[#f5f5f7] font-medium mb-1">一、必须搞定客户 CEO</p>
              <p className="text-xs text-[#8e8e93]">FDE 模式需要高管督战——强行穿透部门墙，让业务和 IT 坐在同一张桌子上。
              没有高层支持，FDE 连客户的数据都拿不到，更别说在几天内交付原型了。Palantir 只做客户最关心的前五个问题。</p>
            </div>
            <div className="p-4 rounded-lg bg-[#141416] border border-[#2c2c2e]">
              <p className="text-sm text-[#f5f5f7] font-medium mb-1">二、敢赔钱换信任</p>
              <p className="text-xs text-[#8e8e93]">AI 项目失败太多，客户对"炫酷演示"产生了免疫。Palantir 的做法是直接承担早期风险——Bootcamp 通常免费或只收象征性费用。
              当客户亲眼看到 AI 在自己的真实数据上跑出结果时，这种信任是任何 PPT 都无法替代的。</p>
            </div>
            <div className="p-4 rounded-lg bg-[#141416] border border-[#2c2c2e]">
              <p className="text-sm text-[#f5f5f7] font-medium mb-1">三、不能沦为外包队</p>
              <p className="text-xs text-[#8e8e93]">FDE 要主动找到那个"最值钱的问题"，不是简单接活，而是帮客户解决命运级的挑战。
              必须主动定义问题、抽象通用模式、反哺产品平台。</p>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* AIP Bootcamp */}
      {/* ============================================ */}
      <div className="mb-8">
        <div className="prose prose-invert max-w-none">
          <h3 className="text-base font-semibold text-[#f5f5f7] mb-3 flex items-center gap-2">
            <Rocket className="w-4 h-4 text-[#ff3b30]" />
            AIP Bootcamp：增长引擎的终极体现
          </h3>
          <p className="text-sm text-[#8e8e93] leading-relaxed mb-3">
            Bootcamp 不是培训，是一场<strong className="text-[#ff3b30]">"带资进组"的黑客松</strong>。
            为期 1-5 天，客户必须带着真实的业务数据和最头疼的业务问题参加。
            FDE 团队和客户团队坐在一起，在几天内直接利用 AIP 和 Foundry 平台，当场搭建出一个能跑通的 AI 应用。
          </p>
          <div className="overflow-x-auto mb-3">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#2c2c2e]">
                  <th className="text-left py-2 px-3 text-[#636366]">阶段</th>
                  <th className="text-left py-2 px-3 text-[#636366]">内容</th>
                  <th className="text-left py-2 px-3 text-[#636366]">关键产出</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Day 0（筹备）", "明确一个极其聚焦的\"核心战场\"", "聚焦的业务问题定义"],
                  ["Day 1（接入）", "快速打通 ERP/MES/CRM 系统，构建初步 Ontology", "数据接入完成"],
                  ["Day 2-3（构建）", "FDE 与客户 IT 背靠背写代码、配规则，接入 LLM", "可运行的 AI 应用原型"],
                  ["Day 4-5（Demo 与拍板）", "业务高管直接上手操作，进入商务谈判", "合同签约"],
                ].map((row, i) => (
                  <tr key={i} className="border-b border-[#2c2c2e] last:border-0">
                    <td className="py-2 px-3 text-[#ff9f0a] font-medium">{row[0]}</td>
                    <td className="py-2 px-3 text-[#8e8e93]">{row[1]}</td>
                    <td className="py-2 px-3 text-[#30d158]">{row[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-[#8e8e93] leading-relaxed">
            Palantir 美国商业市场 40%-70% 的同比增速，<strong className="text-[#f5f5f7]">几乎全部由 AIP Bootcamp 驱动</strong>。
            Bootcamp 带来的不是零碎的培训费，而是后端每年数百万美元的软件订阅 ARR。
            Bootcamp 实现了"一箭三雕"：极速获客（将 9-12 个月的销售周期压缩到几周）、吸纳行业 Know-How、建立替换成本。
          </p>
        </div>
      </div>

      {/* Key Takeaway */}
      <div className="p-5 rounded-xl bg-[#ff9f0a]/5 border border-[#ff9f0a]/20">
        <div className="flex items-start gap-3">
          <Layers className="w-5 h-5 text-[#ff9f0a] flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-[#f5f5f7] mb-2">核心要点</h3>
            <p className="text-xs text-[#8e8e93] leading-relaxed">
              Palantir 生态以 <strong className="text-[#f5f5f7]">Foundry</strong> 为数据中枢，<strong className="text-[#f5f5f7]">AIP</strong> 提供 AI 智能层与 LLM 深度集成，
              <strong className="text-[#f5f5f7]">Gotham</strong> 专注防务情报，<strong className="text-[#f5f5f7]">Apollo</strong> 负责交付运维。
              AI Mesh 架构的八大能力使 AI 与人类在同一 Ontology 上协作。
              FDE 三条生死线（搞定 CEO、赔钱换信任、不沦为外包）定义了其商业哲学，
              AIP Bootcamp 将 12 个月销售周期压缩到 1-5 天，驱动 Palantir 美国市场 40%+ 增长。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
