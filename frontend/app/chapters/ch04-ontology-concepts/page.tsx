"use client";

import { useState } from "react";
import {
  Boxes,
  ChevronRight,
  Box,
  Link2,
  Zap,
  Hash,
  Layers,
  ArrowRight,
  CheckCircle2,
  Circle,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

// =============================================================================
// Data
// =============================================================================

const ONTOLOGY_CONCEPTS = [
  {
    id: "objectType",
    name: "Object Type",
    description: "业务实体的数字化定义，如 AIGCTool、User、Review",
    icon: Box,
    color: "#ff3b30",
    properties: [
      { name: "name", type: "string", required: true },
      { name: "developer", type: "string", required: false },
      { name: "pricingType", type: "enum", required: true },
      { name: "capabilities", type: "array<string>", required: false },
    ],
    example: "AIGCTool 对象类型定义了 AI 工具的所有属性",
  },
  {
    id: "linkType",
    name: "Link Type",
    description: "对象之间的关系定义，如 User 收藏 AIGCTool",
    icon: Link2,
    color: "#ff9f0a",
    properties: [
      { name: "source", type: "ObjectType", required: true },
      { name: "target", type: "ObjectType", required: true },
      { name: "cardinality", type: "enum", required: true },
    ],
    example: "FavoriteLink 连接 User 和 AIGCTool，表示收藏关系",
  },
  {
    id: "actionType",
    name: "Action Type",
    description: "业务操作的定义，如提交评价、更新工具信息",
    icon: Zap,
    color: "#30d158",
    properties: [
      { name: "parameters", type: "object", required: true },
      { name: "logic", type: "function", required: true },
      { name: "writeback", type: "boolean", required: false },
    ],
    example: "SubmitRatingAction 接收评分参数，更新 Review 对象",
  },
  {
    id: "valueType",
    name: "Value Type",
    description: "属性的数据类型定义，如字符串、数字、枚举",
    icon: Hash,
    color: "#0a84ff",
    properties: [
      { name: "fieldType", type: "string", required: true },
      { name: "constraints", type: "object", required: false },
      { name: "defaultValue", type: "any", required: false },
    ],
    example: "PricingType 枚举值：free, freemium, paid, enterprise",
  },
  {
    id: "interface",
    name: "Interface",
    description: "跨对象类型的共享属性集合",
    icon: Layers,
    color: "#bf5af2",
    properties: [
      { name: "extends", type: "Interface[]", required: false },
      { name: "properties", type: "object", required: true },
    ],
    example: "Timestamped 接口为所有对象添加 createdAt 和 updatedAt",
  },
];

const AIGC_ONTOLOGY_EXAMPLE = {
  objectTypes: [
    { id: "tool", name: "AIGCTool", x: 200, y: 100 },
    { id: "user", name: "User", x: 100, y: 250 },
    { id: "review", name: "Review", x: 300, y: 250 },
    { id: "category", name: "Category", x: 400, y: 100 },
  ],
  links: [
    { from: "user", to: "tool", label: "favorites", type: "1:N" },
    { from: "user", to: "review", label: "writes", type: "1:N" },
    { from: "tool", to: "review", label: "has", type: "1:N" },
    { from: "tool", to: "category", label: "belongsTo", type: "N:1" },
  ],
};

// =============================================================================
// Components
// =============================================================================

function ConceptCard({
  concept,
  isActive,
  onClick,
}: {
  concept: (typeof ONTOLOGY_CONCEPTS)[0];
  isActive: boolean;
  onClick: () => void;
}) {
  const Icon = concept.icon;
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
          style={{ backgroundColor: `${concept.color}15` }}
        >
          <Icon className="w-5 h-5" style={{ color: concept.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-[#f5f5f7]">{concept.name}</h4>
            <ChevronRight
              className={`w-4 h-4 text-[#636366] transition-transform ${
                isActive ? "rotate-90" : ""
              }`}
            />
          </div>
          <p className="text-xs text-[#8e8e93] mt-1">{concept.description}</p>
        </div>
      </div>

      {isActive && (
        <div className="mt-3 pt-3 border-t border-[#2c2c2e]">
          <div className="text-[10px] text-[#636366] uppercase tracking-wider mb-2">
            属性定义
          </div>
          <div className="space-y-1">
            {concept.properties.map((prop) => (
              <div
                key={prop.name}
                className="flex items-center justify-between text-xs"
              >
                <span className="text-[#f5f5f7]">{prop.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[#8e8e93]">{prop.type}</span>
                  {prop.required && (
                    <span className="text-[10px] text-[#ff453a]">必填</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 p-2 rounded bg-[#2c2c2e]/50">
            <div className="text-[10px] text-[#636366] mb-1">示例</div>
            <div className="text-xs text-[#8e8e93]">{concept.example}</div>
          </div>
        </div>
      )}
    </button>
  );
}

function OntologyGraph() {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);

  const nodeColors: Record<string, string> = {
    tool: "#ff3b30",
    user: "#0a84ff",
    review: "#30d158",
    category: "#ff9f0a",
  };

  return (
    <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
      <h3 className="text-sm font-semibold text-[#f5f5f7] mb-4">
        AIGC Ontology 示例
      </h3>
      <div className="relative w-full" style={{ height: 320 }}>
        <svg viewBox="0 0 500 320" className="w-full h-full">
          {/* Links */}
          {AIGC_ONTOLOGY_EXAMPLE.links.map((link) => {
            const fromNode = AIGC_ONTOLOGY_EXAMPLE.objectTypes.find(
              (n) => n.id === link.from
            );
            const toNode = AIGC_ONTOLOGY_EXAMPLE.objectTypes.find(
              (n) => n.id === link.to
            );
            if (!fromNode || !toNode) return null;

            const isHovered = hoveredLink === `${link.from}-${link.to}`;
            const midX = (fromNode.x + toNode.x) / 2;
            const midY = (fromNode.y + toNode.y) / 2;

            return (
              <g key={`${link.from}-${link.to}`}>
                <line
                  x1={fromNode.x}
                  y1={fromNode.y}
                  x2={toNode.x}
                  y2={toNode.y}
                  stroke={isHovered ? "#ff3b30" : "#2c2c2e"}
                  strokeWidth={isHovered ? 2 : 1}
                  className="transition-all cursor-pointer"
                  onMouseEnter={() => setHoveredLink(`${link.from}-${link.to}`)}
                  onMouseLeave={() => setHoveredLink(null)}
                />
                <rect
                  x={midX - 30}
                  y={midY - 10}
                  width={60}
                  height={20}
                  rx={4}
                  fill="#141416"
                  stroke={isHovered ? "#ff3b30" : "#2c2c2e"}
                  className="transition-all cursor-pointer"
                  onMouseEnter={() => setHoveredLink(`${link.from}-${link.to}`)}
                  onMouseLeave={() => setHoveredLink(null)}
                />
                <text
                  x={midX}
                  y={midY + 4}
                  textAnchor="middle"
                  className="text-[8px] fill-[#8e8e93] cursor-pointer"
                  onMouseEnter={() => setHoveredLink(`${link.from}-${link.to}`)}
                  onMouseLeave={() => setHoveredLink(null)}
                >
                  {link.label}
                </text>
              </g>
            );
          })}

          {/* Nodes */}
          {AIGC_ONTOLOGY_EXAMPLE.objectTypes.map((node) => {
            const isHovered = hoveredNode === node.id;
            return (
              <g
                key={node.id}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
              >
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={isHovered ? 28 : 24}
                  fill={`${nodeColors[node.id]}15`}
                  stroke={nodeColors[node.id]}
                  strokeWidth={isHovered ? 2 : 1}
                  className="transition-all"
                />
                <text
                  x={node.x}
                  y={node.y + 5}
                  textAnchor="middle"
                  className="text-[10px] fill-[#f5f5f7] font-medium"
                >
                  {node.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-3">
        {AIGC_ONTOLOGY_EXAMPLE.objectTypes.map((node) => (
          <div key={node.id} className="flex items-center gap-1.5">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: nodeColors[node.id] }}
            />
            <span className="text-[10px] text-[#8e8e93]">{node.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HierarchyDiagram() {
  const levels = [
    {
      level: "应用层",
      items: ["Workshop", "Object Explorer", "Quiver", "AIP Logic"],
      color: "#ff3b30",
    },
    {
      level: "动态层",
      items: ["Action Types", "Functions", "Writeback"],
      color: "#ff9f0a",
    },
    {
      level: "语义层",
      items: ["Object Types", "Link Types", "Interfaces"],
      color: "#30d158",
    },
    {
      level: "数据层",
      items: ["Value Types", "Properties", "Constraints"],
      color: "#0a84ff",
    },
  ];

  return (
    <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
      <h3 className="text-sm font-semibold text-[#f5f5f7] mb-4">Ontology 层级结构</h3>
      <div className="space-y-3">
        {levels.map((level, index) => (
          <div key={level.level}>
            <div className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: level.color }}
              />
              <span className="text-xs font-medium text-[#f5f5f7] w-16">
                {level.level}
              </span>
              <div className="flex flex-wrap gap-2 flex-1">
                {level.items.map((item) => (
                  <span
                    key={item}
                    className="px-2.5 py-1 rounded text-[10px] bg-[#2c2c2e] text-[#8e8e93]"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
            {index < levels.length - 1 && (
              <div className="ml-1.5 mt-1 mb-1 w-px h-3 bg-[#2c2c2e]" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// Main Page
// =============================================================================

export default function Ch04OntologyConceptsPage() {
  const [activeConcept, setActiveConcept] = useState<string>("objectType");

  return (
    <div className="p-4 lg:p-8 max-w-[1200px] mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[#636366] mb-6">
        <Link href="/chapters" className="hover:text-[#f5f5f7] transition-colors">
          学习章节
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-[#8e8e93]">第四回</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#0a84ff]/10 flex items-center justify-center">
            <Boxes className="w-5 h-5 text-[#0a84ff]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#f5f5f7]">Ontology 核心概念</h1>
            <p className="text-sm text-[#636366]">
              Object Types、Link Types、Action Types 的定义与关系
            </p>
          </div>
        </div>
      </div>

      {/* Concepts + Graph */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="space-y-3">
          {ONTOLOGY_CONCEPTS.map((concept) => (
            <ConceptCard
              key={concept.id}
              concept={concept}
              isActive={activeConcept === concept.id}
              onClick={() => setActiveConcept(concept.id)}
            />
          ))}
        </div>
        <div className="space-y-6">
          <OntologyGraph />
          <HierarchyDiagram />
        </div>
      </div>

      {/* ============================================ */}
      {/* Ontology 建模最佳实践（博客文字） */}
      {/* ============================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
          <h3 className="text-sm font-semibold text-[#f5f5f7] mb-3">Object Type 设计原则</h3>
          <div className="space-y-3">
            {[
              { rule: "命名规范", desc: "使用 PascalCase，如 AIGCTool、ToolCategory。避免缩写，保持业务可读性" },
              { rule: "主键选择", desc: "优先使用稳定的业务主键（如 slug），避免自增 ID 作为业务标识" },
              { rule: "属性设计", desc: "属性命名使用 camelCase。区分必需属性（required）和可选属性" },
              { rule: "状态管理", desc: "使用 Status Value Type 管理对象生命周期状态" },
            ].map((item) => (
              <div key={item.rule} className="p-3 rounded bg-[#141416] border border-[#2c2c2e]">
                <span className="text-xs font-medium text-[#f5f5f7] block">{item.rule}</span>
                <span className="text-[10px] text-[#636366]">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
          <h3 className="text-sm font-semibold text-[#f5f5f7] mb-3">Link Type 设计原则</h3>
          <div className="space-y-3">
            {[
              { rule: "命名规范", desc: "使用过去分词形式，如 createdBy、reviewedBy。或使用动词形式，如 belongsTo、hasTag" },
              { rule: "基数约束", desc: "明确基数（0..1、1..1、0..*、1..*）。如一个工具 belongsTo 一个分类（1..1）" },
              { rule: "方向语义", desc: "区分单向和双向链接。必要时创建反向链接便于查询" },
              { rule: "级联删除", desc: "定义删除对象时链接的行为（保留、删除、限制）" },
            ].map((item) => (
              <div key={item.rule} className="p-3 rounded bg-[#141416] border border-[#2c2c2e]">
                <span className="text-xs font-medium text-[#f5f5f7] block">{item.rule}</span>
                <span className="text-[10px] text-[#636366]">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e] mb-8">
        <h3 className="text-sm font-semibold text-[#f5f5f7] mb-3">Action Type 设计原则</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: "命名规范", content: "使用动词短语，如 createReview、updateTool、deleteComment。清晰表达业务意图" },
            { title: "提交条件", content: "定义执行条件（如状态检查、权限验证）。使用 Ontology 表达式编写约束" },
            { title: "副作用", content: "明确 Action 执行后的副作用（如触发 Writeback、发送通知）" },
            { title: "返回值", content: "定义执行成功后返回的数据（如创建的对象、操作状态）" },
            { title: "错误处理", content: "定义失败时的错误消息和回滚策略" },
            { title: "审计日志", content: "记录操作人、时间、变更内容，支持追溯" },
          ].map((item) => (
            <div key={item.title} className="p-3 rounded bg-[#141416] border border-[#2c2c2e]">
              <span className="text-xs font-medium text-[#f5f5f7] block mb-1">{item.title}</span>
              <span className="text-[10px] text-[#636366]">{item.content}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ============================================ */}
      {/* Ontology 建模模式 */}
      {/* ============================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
          <h3 className="text-sm font-semibold text-[#f5f5f7] mb-3">常见建模模式</h3>
          <div className="space-y-3">
            {[
              { pattern: "单表模式", desc: "单个 Object Type 对应单个数据源表，适用于简单实体" },
              { pattern: "继承模式", desc: "使用 Supertype/Subtype 关系实现类型继承和多态" },
              { pattern: "聚合模式", desc: "通过 Link 将多个 Object Type 组合成复杂实体" },
              { pattern: "值对象模式", desc: "使用 Value Type 封装不可变的值对象（如地址、金额）" },
              { pattern: "事件溯源模式", desc: "通过 Action 记录所有变更事件，支持时间线回放" },
              { pattern: "工厂模式", desc: "使用 Action 创建复杂对象图，封装创建逻辑" },
            ].map((item) => (
              <div key={item.pattern} className="p-3 rounded bg-[#141416] border border-[#2c2c2e]">
                <span className="text-xs font-medium text-[#f5f5f7] block">{item.pattern}</span>
                <span className="text-[10px] text-[#636366]">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
          <h3 className="text-sm font-semibold text-[#f5f5f7] mb-3">版本控制与迁移</h3>
          <div className="space-y-3">
            {[
              { topic: "语义化版本", desc: "使用 MAJOR.MINOR.PATCH 版本号。MAJOR 破坏性变更，MINOR 新增功能，PATCH 修复" },
              { topic: "向后兼容", desc: "优先添加新属性而非修改/删除现有属性。使用 deprecation 标记废弃字段" },
              { topic: "数据迁移", desc: "使用 Ontology Migration 工具处理数据转换。测试环境验证后再部署到生产" },
              { topic: "多版本并存", desc: "支持同一 Object Type 的多个版本同时存在，平滑过渡" },
              { topic: "回滚策略", desc: "定义回滚计划，确保版本升级失败时可以安全回退" },
              { topic: "发布流程", desc: "开发 → 测试 → 预生产 → 生产，每个阶段验证完整性" },
            ].map((item) => (
              <div key={item.topic} className="p-3 rounded bg-[#141416] border border-[#2c2c2e]">
                <span className="text-xs font-medium text-[#f5f5f7] block">{item.topic}</span>
                <span className="text-[10px] text-[#636366]">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* Ontology 治理最佳实践 */}
      {/* ============================================ */}
      <div className="mb-8">
        <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
          <h3 className="text-sm font-semibold text-[#f5f5f7] mb-4">Ontology 治理最佳实践</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { area: "所有权管理", desc: "为每个 Object Type 指定负责人，明确维护责任" },
              { area: "访问控制", desc: "使用 RBAC 控制 Ontology 对象的读写权限" },
              { area: "变更审批", desc: "建立变更审批流程，重要变更需要评审" },
              { area: "文档规范", desc: "为每个 Object Type 和属性添加清晰的业务说明" },
              { area: "监控告警", desc: "监控 Ontology 使用情况，设置异常告警" },
              { area: "性能优化", desc: "定期分析查询性能，优化索引和数据结构" },
              { area: "合规审计", desc: "确保 Ontology 数据符合行业合规要求" },
              { area: "知识共享", desc: "建立 Ontology 培训和知识库，促进团队学习" },
            ].map((item) => (
              <div key={item.area} className="p-3 rounded bg-[#141416] border border-[#2c2c2e]">
                <span className="text-xs font-medium text-[#f5f5f7] block">{item.area}</span>
                <span className="text-[10px] text-[#636366]">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* Ontology 核心概念深度解析（基于 Palantir 官方文档） */}
      {/* ============================================ */}
      <div className="mb-8">
        <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
          <h3 className="text-sm font-semibold text-[#f5f5f7] mb-4">Ontology 核心概念深度解析</h3>
          <div className="space-y-4 text-xs text-[#8e8e93] leading-relaxed">
            <p>
              根据 <strong className="text-[#f5f5f7]">Palantir 官方文档</strong>，Ontology 是组织的运营层（operational layer）。
              Ontology 位于集成到 Palantir 平台的数字资产（数据集、虚拟表和模型）之上，
              将它们与现实世界的对应物连接起来——从工厂、设备和产品等物理资产到客户订单或财务交易等概念。
              在许多场景中，Ontology 充当组织的<strong className="text-[#f5f5f7]">数字孪生（digital twin）</strong>，
              包含启用各种用例所需的语义元素（对象、属性、链接）和动态元素（操作、函数、动态安全）。
            </p>
            <p>
              <strong className="text-[#f5f5f7]">Object Type（对象类型）</strong>是现实世界实体或事件的 Schema 定义。
              例如，JFK 和 LHR 都可以是 Airport 对象类型的对象。
              一个 Object 是对象类型的单个实例，对应于单个现实世界实体或事件。
              一个 Object Set 是多个对象实例的集合，表示一组现实世界实体或事件。
              可以把 Object Type 类比为数据集（Dataset），Object 类比为行（Row），
              Property 类比为列（Column），Property Value 类比为字段值（Field Value）。
            </p>
            <p>
              <strong className="text-[#f5f5f7]">Property（属性）</strong>是对象类型的特征定义，用于描述现实世界实体或事件的特性。
              例如，如果 LHR 是 Airports 的对象，name 和 country 就是 Airports 的属性。
              对于 LHR 这个对象，属性值分别是 name: LHR 和 country: United Kingdom。
              Shared Property（共享属性）可以在 Ontology 中的多个对象类型上使用，
              允许跨对象类型的一致数据建模和属性元数据的集中管理。
            </p>
            <p>
              <strong className="text-[#f5f5f7]">Link Type（链接类型）</strong>是两个对象类型之间关系的 Schema 定义。
              一个 Link 是指两个对象之间该关系的单个实例。
              链接类型让 Object Type 之间能够建立关联，形成完整的业务关系网络。
              例如，AIGCTool 可以通过 belongsTo 链接类型关联到 ToolCategory，
              通过 providedBy 链接类型关联到 ToolProvider。
            </p>
            <p>
              <strong className="text-[#f5f5f7]">Action Type（操作类型）</strong>是用户可以对对象、属性值和链接进行的一组更改或编辑的 Schema 定义。
              操作类型还包括操作提交时发生的副作用行为。
              一旦在 Ontology 中配置了操作类型，最终用户就可以通过应用操作来更改对象。
              Action Type 是组织的动力学（kinetics）——在遵守组织控制和治理的同时实现变更。
            </p>
            <p>
              <strong className="text-[#f5f5f7]">Function（函数）</strong>是一段基于代码的逻辑，接受输入参数并返回输出。
              函数与 Ontology 原生集成：它们可以接受对象和对象集作为输入，读取对象的属性值，
              并可以在构建在 Ontology 之上的操作类型和应用程序中使用。
              Function 提供了编写和演进具有任意复杂度的业务逻辑的方式。
            </p>
            <p>
              <strong className="text-[#f5f5f7]">Interface（接口）</strong>是一种 Ontology 类型，描述对象类型的形状及其能力。
              接口提供对象类型多态性，允许对共享共同形状的对象类型进行一致的建模和交互。
              接口让不同的 Object Type 可以共享相同的属性和行为模式。
            </p>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* Ontology 与数据集对比 */}
      {/* ============================================ */}
      <div className="mb-8">
        <div className="p-5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
          <h3 className="text-sm font-semibold text-[#f5f5f7] mb-4">Ontology 与数据集概念映射</h3>
          <p className="text-xs text-[#8e8e93] leading-relaxed mb-4">
            Palantir 官方文档提供了 Ontology 概念与传统数据集概念的清晰映射，帮助理解 Ontology 的本质：
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { dataset: "Dataset", ontology: "Object Type", desc: "数据集的 Schema 定义" },
              { dataset: "Row", ontology: "Object", desc: "数据集的一行记录" },
              { dataset: "Column", ontology: "Property", desc: "数据集的列定义" },
              { dataset: "Field", ontology: "Property Value", desc: "单元格的值" },
              { dataset: "Join", ontology: "Link Type", desc: "表之间的关联关系" },
            ].map((item) => (
              <div key={item.dataset} className="p-3 rounded bg-[#141416] border border-[#2c2c2e]">
                <div className="text-[10px] text-[#636366] mb-1">数据集概念</div>
                <div className="text-xs font-medium text-[#f5f5f7] mb-2">{item.dataset}</div>
                <div className="text-[10px] text-[#636366] mb-1">Ontology 概念</div>
                <div className="text-xs font-medium text-[#0a84ff]">{item.ontology}</div>
                <div className="text-[10px] text-[#636366] mt-1">{item.desc}</div>
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
              Ontology 是 Palantir Foundry 的核心抽象层，是组织的数字孪生。
              <strong className="text-[#f5f5f7]">Object Type</strong> 定义业务实体（如 Airport、AIGCTool），
              <strong className="text-[#f5f5f7]">Property</strong> 定义实体特征（如 name、country），
              <strong className="text-[#f5f5f7]">Link Type</strong> 定义实体关系（如 belongsTo、providedBy），
              <strong className="text-[#f5f5f7]">Action Type</strong> 定义业务操作（如 create、update、delete），
              <strong className="text-[#f5f5f7]">Function</strong> 提供业务逻辑计算能力，
              <strong className="text-[#f5f5f7]">Interface</strong> 提供多态性和一致性建模。
              这些元素共同构成了 Ontology 的基础，上层应用（Workshop、AIP Logic、Object Explorer）都建立在 Ontology 之上。
              Ontology 的目标是在规模上促进组织更好的决策制定。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
