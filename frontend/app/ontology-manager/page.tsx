"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Link2,
  Zap,
  Code,
  Hash,
  Layers,
  Search,
  ChevronRight,
  Database,
  Eye,
  Settings,
  FolderTree,
  Play,
  Activity,
  HeartPulse,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import type {
  Ontology,
  ObjectType,
  LinkType,
  ValueType,
  InterfaceType,
  ActionType,
  FunctionType,
} from "@/lib/ontology-api";
import {
  fetchOntologies,
  fetchObjectTypes,
  fetchLinkTypes,
  fetchValueTypes,
  fetchInterfaces,
  fetchActionTypes,
  fetchFunctions,
} from "@/lib/ontology-api";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { ActionExecutionPanel } from "@/components/ontology/ActionExecutionPanel";
import { FunctionExecutionPanel } from "@/components/ontology/FunctionExecutionPanel";
import { WritebackVisualizationPanel } from "@/components/ontology/WritebackVisualizationPanel";
import { ObjectTypeDetail } from "@/components/ontology/ObjectTypeDetail";
import { useOntologyHealth } from "@/hooks/useOntologyHealth";

type MainTab =
  | "overview"
  | "objectTypes"
  | "linkTypes"
  | "valueTypes"
  | "interfaces"
  | "actionTypes"
  | "functions"
  | "actionExecution"
  | "functionExecution"
  | "writeback"
  | "healthCheck";

const RIGHT_NAV_ITEMS: {
  key: MainTab;
  label: string;
  icon: React.ElementType;
  countKey: keyof Ontology;
}[] = [
  { key: "overview", label: "概览", icon: Eye, countKey: "objectTypesCount" },
  { key: "objectTypes", label: "Object Types", icon: Box, countKey: "objectTypesCount" },
  { key: "linkTypes", label: "Link Types", icon: Link2, countKey: "linkTypesCount" },
  { key: "valueTypes", label: "Value Types", icon: Hash, countKey: "valueTypesCount" },
  { key: "interfaces", label: "Interfaces", icon: Layers, countKey: "interfacesCount" },
  { key: "actionTypes", label: "Action Types", icon: Zap, countKey: "actionTypesCount" },
  { key: "functions", label: "Functions", icon: Code, countKey: "functionsCount" },
];

// 执行相关 Tab (单独显示)
const EXECUTION_NAV_ITEMS: {
  key: MainTab;
  label: string;
  icon: React.ElementType;
}[] = [
  { key: "actionExecution", label: "Action 执行", icon: Play },
  { key: "functionExecution", label: "Function 执行", icon: Code },
  { key: "writeback", label: "Writeback 日志", icon: Activity },
];

// 健康检查 Tab
const HEALTH_NAV_ITEM = { key: "healthCheck" as MainTab, label: "健康检查", icon: HeartPulse };

function StatusBadge({ status }: { status: string }) {
  const isActive = status === "active";
  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <span
        className="w-2 h-2 rounded-full"
        style={{
          background: isActive ? "#30d158" : "#636366",
          boxShadow: isActive ? "0 0 6px rgba(48, 209, 88, 0.4)" : "none",
        }}
      />
      <span className="text-[#636366]">{isActive ? "活跃" : status}</span>
    </span>
  );
}

function DataTable({
  columns,
  data,
}: {
  columns: string[];
  data: (string | number)[][];
}) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-[#636366]">
        <Database className="w-10 h-10 mb-3 opacity-30" />
        <p className="text-sm">暂无数据</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[#2c2c2e] overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#1c1c1e] border-b border-[#2c2c2e]">
            {columns.map((col) => (
              <th
                key={col}
                className="px-4 py-2.5 text-left text-xs font-medium text-[#636366] uppercase tracking-wider"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={i}
              className="border-b border-[#2c2c2e] last:border-b-0 hover:bg-[#1c1c1e]/60 transition-colors"
            >
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-2.5 text-[#8e8e93]">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RightSidebar({
  ontology,
  activeTab,
  onTabChange,
}: {
  ontology: Ontology;
  activeTab: MainTab;
  onTabChange: (tab: MainTab) => void;
}) {
  return (
    <aside className="w-56 flex-shrink-0 border-l border-[#2c2c2e] bg-[#141416] h-[calc(100vh-56px)] lg:h-screen overflow-y-auto">
      <div className="p-4 border-b border-[#2c2c2e]">
        <div className="flex items-center gap-2 mb-2">
          <FolderTree className="w-4 h-4 text-[#ff3b30]" />
          <span className="text-xs font-medium text-[#636366] uppercase tracking-wider">
            Ontology
          </span>
        </div>
        <h3 className="text-sm font-semibold text-[#f5f5f7] truncate">
          {ontology.displayName}
        </h3>
        <p className="text-[10px] font-mono text-[#636366] truncate mt-0.5">
          {ontology.apiName}
        </p>
      </div>

      {/* Schema 导航 */}
      <div className="p-2">
        <div className="text-[10px] font-medium text-[#636366] uppercase tracking-wider px-3 mb-1">
          Schema
        </div>
        <nav className="space-y-0.5">
          {RIGHT_NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.key;
            const count = ontology[item.countKey] as number;
            return (
              <button
                key={item.key}
                onClick={() => onTabChange(item.key)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-all ${
                  isActive
                    ? "bg-[#ff3b30]/10 text-[#ff3b30] font-medium"
                    : "text-[#8e8e93] hover:text-[#f5f5f7] hover:bg-[#1c1c1e]"
                }`}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 text-left truncate">{item.label}</span>
                {count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      isActive
                        ? "bg-[#ff3b30]/20 text-[#ff3b30]"
                        : "bg-[#2c2c2e] text-[#636366]"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* 执行相关导航 */}
      <div className="p-2 border-t border-[#2c2c2e]">
        <div className="text-[10px] font-medium text-[#636366] uppercase tracking-wider px-3 mb-1">
          执行 & Writeback
        </div>
        <nav className="space-y-0.5">
          {EXECUTION_NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onTabChange(item.key)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-all ${
                  isActive
                    ? "bg-[#30d158]/10 text-[#30d158] font-medium"
                    : "text-[#8e8e93] hover:text-[#f5f5f7] hover:bg-[#1c1c1e]"
                }`}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 text-left truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* 健康检查导航 */}
      <div className="p-2 border-t border-[#2c2c2e]">
        <nav className="space-y-0.5">
          {(() => {
            const item = HEALTH_NAV_ITEM;
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onTabChange(item.key)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-all ${
                  isActive
                    ? "bg-[#ff3b30]/10 text-[#ff3b30] font-medium"
                    : "text-[#8e8e93] hover:text-[#f5f5f7] hover:bg-[#1c1c1e]"
                }`}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 text-left truncate">{item.label}</span>
              </button>
            );
          })()}
        </nav>
      </div>

      <div className="p-3 border-t border-[#2c2c2e] mt-auto">
        <button className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-[#8e8e93] hover:text-[#f5f5f7] hover:bg-[#1c1c1e] transition-all">
          <Settings className="w-4 h-4" />
          设置
        </button>
      </div>
    </aside>
  );
}

function StatCard({
  icon,
  label,
  count,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  color: string;
}) {
  return (
    <div className="p-4 rounded-lg bg-[#141416] border border-[#2c2c2e]">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ background: `${color}15`, color }}>
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold text-[#f5f5f7]">{count}</div>
      <div className="text-[10px] text-[#636366] uppercase tracking-wider mt-0.5">{label}</div>
    </div>
  );
}

function MainContent({
  ontology,
  activeTab,
}: {
  ontology: Ontology;
  activeTab: MainTab;
}) {
  const [loading, setLoading] = useState(false);
  const [objectTypes, setObjectTypes] = useState<ObjectType[]>([]);
  const [linkTypes, setLinkTypes] = useState<LinkType[]>([]);
  const [valueTypes, setValueTypes] = useState<ValueType[]>([]);
  const [interfaces, setInterfaces] = useState<InterfaceType[]>([]);
  const [actionTypes, setActionTypes] = useState<ActionType[]>([]);
  const [functions, setFunctions] = useState<FunctionType[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [otRes, ltRes, vtRes, ifRes, atRes, fnRes] = await Promise.all([
        fetchObjectTypes(ontology.rid).catch(() => ({ data: [] })),
        fetchLinkTypes(ontology.rid).catch(() => ({ data: [] })),
        fetchValueTypes(ontology.rid).catch(() => ({ data: [] })),
        fetchInterfaces(ontology.rid).catch(() => ({ data: [] })),
        fetchActionTypes(ontology.rid).catch(() => ({ data: [] })),
        fetchFunctions(ontology.rid).catch(() => ({ data: [] })),
      ]);
      setObjectTypes(otRes.data || []);
      setLinkTypes(ltRes.data || []);
      setValueTypes(vtRes.data || []);
      setInterfaces(ifRes.data || []);
      setActionTypes(atRes.data || []);
      setFunctions(fnRes.data || []);
    } catch (err) {
      console.error("Failed to load ontology details:", err);
    } finally {
      setLoading(false);
    }
  }, [ontology.rid]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex-1 p-6">
        <LoadingState />
      </div>
    );
  }

  if (activeTab === "overview") {
    return (
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-[#f5f5f7] mb-1">
            {ontology.displayName}
          </h2>
          <p className="text-sm text-[#636366]">{ontology.description || "暂无描述"}</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          <StatCard icon={<Box size={16} />} label="Object Types" count={ontology.objectTypesCount} color="#ff3b30" />
          <StatCard icon={<Link2 size={16} />} label="Link Types" count={ontology.linkTypesCount} color="#ff9f0a" />
          <StatCard icon={<Zap size={16} />} label="Action Types" count={ontology.actionTypesCount} color="#30d158" />
          <StatCard icon={<Code size={16} />} label="Functions" count={ontology.functionsCount} color="#64d2ff" />
          <StatCard icon={<Hash size={16} />} label="Value Types" count={ontology.valueTypesCount} color="#bf5af2" />
          <StatCard icon={<Layers size={16} />} label="Interfaces" count={ontology.interfacesCount} color="#ff453a" />
        </div>

        <div className="rounded-lg border border-[#2c2c2e] bg-[#141416]">
          <div className="px-4 py-3 border-b border-[#2c2c2e]">
            <h3 className="text-xs font-medium text-[#636366] uppercase tracking-wider">
              基本信息
            </h3>
          </div>
          <div className="p-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-[#636366]">API Name</span>
              <span className="text-[#f5f5f7] font-mono">{ontology.apiName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#636366]">RID</span>
              <span className="text-[#f5f5f7] font-mono text-xs">{ontology.rid}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#636366]">Status</span>
              <StatusBadge status={ontology.status} />
            </div>
            <div className="flex justify-between">
              <span className="text-[#636366]">Total Components</span>
              <span className="text-[#f5f5f7]">
                {ontology.objectTypesCount +
                  ontology.linkTypesCount +
                  ontology.valueTypesCount +
                  ontology.interfacesCount +
                  ontology.actionTypesCount +
                  ontology.functionsCount}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === "objectTypes") {
    return (
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#f5f5f7]">Object Types</h2>
          <span className="text-sm text-[#636366]">{objectTypes.length} items</span>
        </div>
        <DataTable
          columns={["API Name", "Display Name", "Status", "Properties", "Version"]}
          data={objectTypes.map((ot) => [
            ot.apiName,
            ot.displayName,
            ot.status,
            ot.properties?.length || 0,
            ot.version,
          ])}
        />
      </div>
    );
  }

  if (activeTab === "linkTypes") {
    return (
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#f5f5f7]">Link Types</h2>
          <span className="text-sm text-[#636366]">{linkTypes.length} items</span>
        </div>
        <DataTable
          columns={["API Name", "Display Name", "Source", "Target", "Cardinality"]}
          data={linkTypes.map((lt) => [
            lt.apiName,
            lt.displayName,
            lt.sourceObjectTypeId,
            lt.targetObjectTypeId,
            lt.cardinality,
          ])}
        />
      </div>
    );
  }

  if (activeTab === "valueTypes") {
    return (
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#f5f5f7]">Value Types</h2>
          <span className="text-sm text-[#636366]">{valueTypes.length} items</span>
        </div>
        <DataTable
          columns={["API Name", "Display Name", "Field Type"]}
          data={valueTypes.map((vt) => [vt.apiName, vt.displayName, vt.fieldType])}
        />
      </div>
    );
  }

  if (activeTab === "interfaces") {
    return (
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#f5f5f7]">Interfaces</h2>
          <span className="text-sm text-[#636366]">{interfaces.length} items</span>
        </div>
        <DataTable
          columns={["API Name", "Display Name", "Status"]}
          data={interfaces.map((i) => [i.apiName, i.displayName, i.status])}
        />
      </div>
    );
  }

  if (activeTab === "actionTypes") {
    return (
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#f5f5f7]">Action Types</h2>
          <span className="text-sm text-[#636366]">{actionTypes.length} items</span>
        </div>
        <DataTable
          columns={["API Name", "Display Name", "Status"]}
          data={actionTypes.map((at) => [at.apiName, at.displayName, at.status])}
        />
      </div>
    );
  }

  if (activeTab === "functions") {
    return (
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#f5f5f7]">Functions</h2>
          <span className="text-sm text-[#636366]">{functions.length} items</span>
        </div>
        <DataTable
          columns={["API Name", "Display Name", "Status"]}
          data={functions.map((fn) => [fn.apiName, fn.displayName, fn.status])}
        />
      </div>
    );
  }

  // Action 执行面板
  if (activeTab === "actionExecution") {
    return (
      <div className="flex-1 p-6 overflow-y-auto">
        <ActionExecutionPanel
          actionTypes={actionTypes}
          objectTypeApiName={objectTypes[0]?.apiName}
          onObjectSelect={(objectId) => console.log('Object selected:', objectId)}
        />
      </div>
    );
  }

  // Function 执行面板
  if (activeTab === "functionExecution") {
    return (
      <div className="flex-1 p-6 overflow-y-auto">
        <FunctionExecutionPanel
          functions={functions}
        />
      </div>
    );
  }

  // Writeback 日志面板
  if (activeTab === "writeback") {
    return (
      <div className="flex-1 p-6 overflow-y-auto">
        <WritebackVisualizationPanel
          ontologyRid={ontology.rid}
          onObjectUpdate={(objectType, objectId) => {
            console.log('Object updated:', objectType, objectId);
            loadData();
          }}
        />
      </div>
    );
  }

  // 健康检查面板
  if (activeTab === "healthCheck") {
    return (
      <div className="flex-1 p-6 overflow-y-auto">
        <HealthCheckPanel />
      </div>
    );
  }

  return null;
}

function HealthCheckPanel() {
  const { data, loading, error, refresh } = useOntologyHealth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-[#ff3b30] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-[#2c2c2e] bg-[#141416] p-6">
        <div className="flex items-center gap-2 text-[#ff453a] mb-2">
          <AlertCircle className="w-5 h-5" />
          <h3 className="font-semibold">加载失败</h3>
        </div>
        <p className="text-sm text-[#636366]">{error}</p>
        <button
          onClick={() => refresh()}
          className="mt-4 flex items-center gap-2 px-4 py-2 rounded-md bg-[#ff3b30] text-white text-sm hover:bg-[#ff3b30]/90 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          重试
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-lg border border-[#2c2c2e] bg-[#141416] p-6 text-center">
        <HeartPulse className="w-10 h-10 text-[#636366] mx-auto mb-3" />
        <p className="text-sm text-[#636366]">暂无健康检查数据</p>
      </div>
    );
  }

  const score = data.score;
  const scoreColor = score >= 80 ? "#30d158" : score >= 60 ? "#ff9f0a" : "#ff453a";
  const scoreBg = score >= 80 ? "#30d15815" : score >= 60 ? "#ff9f0a15" : "#ff453a15";

  const severityIcon = {
    error: <AlertCircle className="w-4 h-4 text-[#ff453a]" />,
    warning: <AlertTriangle className="w-4 h-4 text-[#ff9f0a]" />,
    info: <Info className="w-4 h-4 text-[#64d2ff]" />,
  };

  const severityBg = {
    error: "bg-[#ff453a]/10 border-[#ff453a]/20",
    warning: "bg-[#ff9f0a]/10 border-[#ff9f0a]/20",
    info: "bg-[#64d2ff]/10 border-[#64d2ff]/20",
  };

  const checkItems = [
    { key: "objectCount", label: "对象数量", ...data.checks.objectCount },
    { key: "linkTypes", label: "Link Types", ...data.checks.linkTypes },
    { key: "actionComplexity", label: "Action 复杂度", ...data.checks.actionComplexity },
    { key: "properties", label: "Properties", ...data.checks.properties },
    { key: "naming", label: "命名规范", ...data.checks.naming },
  ];

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#f5f5f7] mb-1">Ontology 健康检查</h2>
          <p className="text-sm text-[#636366]">检查 Ontology 设计的健康状态和潜在问题</p>
        </div>
        <button
          onClick={() => refresh()}
          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-[#8e8e93] hover:text-[#f5f5f7] hover:bg-[#1c1c1e] transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          刷新
        </button>
      </div>

      {/* 总分卡片 */}
      <div className="rounded-lg border border-[#2c2c2e] bg-[#141416] p-6">
        <div className="flex items-center gap-6">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center border-4"
            style={{
              borderColor: scoreColor,
              background: scoreBg,
            }}
          >
            <span className="text-3xl font-bold" style={{ color: scoreColor }}>
              {score}
            </span>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-[#f5f5f7] mb-1">
              {data.status === "ok" ? "健康状态良好" : data.status === "warning" ? "存在警告" : "发现问题"}
            </h3>
            <p className="text-sm text-[#636366] mb-3">
              共发现 {data.summary.totalIssues} 个问题
              {data.summary.errors > 0 && `，${data.summary.errors} 个错误`}
              {data.summary.warnings > 0 && `，${data.summary.warnings} 个警告`}
              {data.summary.infos > 0 && `，${data.summary.infos} 个提示`}
            </p>
            <div className="flex gap-4 text-xs">
              <span className="flex items-center gap-1 text-[#ff453a]">
                <AlertCircle className="w-3.5 h-3.5" />
                {data.summary.errors} 错误
              </span>
              <span className="flex items-center gap-1 text-[#ff9f0a]">
                <AlertTriangle className="w-3.5 h-3.5" />
                {data.summary.warnings} 警告
              </span>
              <span className="flex items-center gap-1 text-[#64d2ff]">
                <Info className="w-3.5 h-3.5" />
                {data.summary.infos} 提示
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 检查项列表 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {checkItems.map((item) => (
          <div
            key={item.key}
            className={`rounded-lg border p-4 ${
              item.status === "ok"
                ? "border-[#2c2c2e] bg-[#141416]"
                : item.status === "warning"
                ? "border-[#ff9f0a]/20 bg-[#ff9f0a]/5"
                : "border-[#ff453a]/20 bg-[#ff453a]/5"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {item.status === "ok" ? (
                  <CheckCircle2 className="w-4 h-4 text-[#30d158]" />
                ) : item.status === "warning" ? (
                  <AlertTriangle className="w-4 h-4 text-[#ff9f0a]" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-[#ff453a]" />
                )}
                <span className="text-sm font-medium text-[#f5f5f7]">{item.label}</span>
              </div>
              <span
                className="text-sm font-bold"
                style={{
                  color:
                    item.score >= 80 ? "#30d158" : item.score >= 60 ? "#ff9f0a" : "#ff453a",
                }}
              >
                {item.score}
              </span>
            </div>
            <p className="text-xs text-[#636366]">{item.message}</p>
          </div>
        ))}
      </div>

      {/* 问题列表 */}
      {data.issues.length > 0 && (
        <div className="rounded-lg border border-[#2c2c2e] bg-[#141416]">
          <div className="px-4 py-3 border-b border-[#2c2c2e]">
            <h3 className="text-xs font-medium text-[#636366] uppercase tracking-wider">
              问题列表
            </h3>
          </div>
          <div className="divide-y divide-[#2c2c2e]">
            {data.issues.map((issue: any, index: number) => (
              <div key={index} className={`p-4 ${severityBg[issue.severity as keyof typeof severityBg]}`}>
                <div className="flex items-start gap-3">
                  {severityIcon[issue.severity as keyof typeof severityIcon]}
                  <div className="flex-1">
                    <p className="text-sm text-[#f5f5f7] mb-1">{issue.message}</p>
                    <p className="text-xs text-[#636366]">
                      <span className="text-[#8e8e93]">建议：</span>
                      {issue.suggestion}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full uppercase ${
                      issue.severity === "error"
                        ? "bg-[#ff453a]/20 text-[#ff453a]"
                        : issue.severity === "warning"
                        ? "bg-[#ff9f0a]/20 text-[#ff9f0a]"
                        : "bg-[#64d2ff]/20 text-[#64d2ff]"
                    }`}
                  >
                    {issue.severity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function OntologyList({
  onSelect,
}: {
  onSelect: (ontology: Ontology) => void;
}) {
  const [ontologies, setOntologies] = useState<Ontology[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchOntologies();
      setOntologies(res.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = ontologies.filter((o) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      o.displayName?.toLowerCase().includes(q) ||
      o.apiName?.toLowerCase().includes(q)
    );
  });

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#f5f5f7] mb-2">Ontology Manager</h1>
        <p className="text-sm text-[#636366]">选择 Ontology 进行管理</p>
      </div>

      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#636366]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="搜索 ontologies..."
          className="w-full h-10 pl-10 pr-4 bg-[#141416] border border-[#2c2c2e] rounded-lg text-sm text-[#f5f5f7] placeholder:text-[#636366] focus:outline-none focus:border-[#ff3b30] transition-all"
        />
      </div>

      <div className="text-sm text-[#636366] mb-3">{filtered.length} ontologies</div>

      <div className="space-y-2">
        {filtered.map((ontology) => (
          <button
            key={ontology.rid}
            onClick={() => onSelect(ontology)}
            className="w-full text-left p-4 rounded-lg bg-[#141416] border border-[#2c2c2e] hover:border-[#3a3a3c] transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#1c1c1e] flex items-center justify-center">
                  <FolderTree className="w-5 h-5 text-[#8e8e93] group-hover:text-[#ff3b30] transition-colors" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#f5f5f7]">{ontology.displayName}</h3>
                  <p className="text-xs font-mono text-[#636366]">{ontology.apiName}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 text-xs text-[#636366]">
                  <span>{ontology.objectTypesCount} 对象</span>
                  <span>{ontology.linkTypesCount} 链接</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#636366] group-hover:text-[#f5f5f7] transition-colors" />
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function OntologyManagerPage() {
  const [selectedOntology, setSelectedOntology] = useState<Ontology | null>(null);
  const [activeTab, setActiveTab] = useState<MainTab>("overview");

  if (!selectedOntology) {
    return (
      <div className="h-[calc(100vh-56px)] lg:h-screen overflow-hidden">
        <OntologyList onSelect={setSelectedOntology} />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-56px)] lg:h-screen overflow-hidden">
      <MainContent ontology={selectedOntology} activeTab={activeTab} />
      <RightSidebar
        ontology={selectedOntology}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </div>
  );
}
