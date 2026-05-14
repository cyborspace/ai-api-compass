"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Flame,
  Activity,
  History,
  BarChart3,
  Zap,
  Clock,
} from "lucide-react";
import { useAppStore, type ClickRecord, type ToolHeatData } from "@/stores/app.store";
import { cn } from "@/lib/utils";

export function ImpactVisualizationPanel() {
  const { getClickHistory, clickTracking, dynamicImpact, resetClickTracking } = useAppStore();
  const [history, setHistory] = useState<ClickRecord[]>([]);
  const [topTools, setTopTools] = useState<{ slug: string; heat: number; clicks: number }[]>([]);

  useEffect(() => {
    setHistory(getClickHistory());
  }, [getClickHistory]);

  useEffect(() => {
    const tools = Object.entries(clickTracking.heatData).map(([slug, data]) => ({
      slug,
      heat: data.totalHeat,
      clicks: data.clickCount,
    }));
    setTopTools(tools.sort((a, b) => b.heat - a.heat).slice(0, 5));
  }, [clickTracking.heatData]);

  const recentClicks = history.slice(-10);
  const totalClicks = history.length;
  const totalLikes = clickTracking.totalLikes;
  const avgHeat = topTools.length > 0
    ? topTools.reduce((sum, t) => sum + t.heat, 0) / topTools.length
    : 0;

  const getClickTypeLabel = (type: ClickRecord["type"]) => {
    switch (type) {
      case "like": return { label: "喜欢", color: "#ff3b30" };
      case "view": return { label: "浏览", color: "#0a84ff" };
      case "compare": return { label: "对比", color: "#30d158" };
      case "detail": return { label: "详情", color: "#bf5af2" };
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  return (
    <div className="p-4 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[#f5f5f7] flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#ff9f0a]" />
          动态影响追踪
        </h3>
        <button
          onClick={resetClickTracking}
          className="text-xs text-[#636366] hover:text-[#ff3b30] transition-colors"
        >
          重置数据
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div className="p-3 rounded-lg bg-[#141416]">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-[#ff9f0a]" />
            <span className="text-[10px] text-[#636366]">总点击</span>
          </div>
          <div className="text-xl font-bold text-[#f5f5f7]">{totalClicks}</div>
        </div>
        <div className="p-3 rounded-lg bg-[#141416]">
          <div className="flex items-center gap-2 mb-1">
            <Flame className="w-4 h-4 text-[#ff3b30]" />
            <span className="text-[10px] text-[#636366]">喜欢数</span>
          </div>
          <div className="text-xl font-bold text-[#ff3b30]">{totalLikes}</div>
        </div>
        <div className="p-3 rounded-lg bg-[#141416]">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-4 h-4 text-[#30d158]" />
            <span className="text-[10px] text-[#636366]">热门工具</span>
          </div>
          <div className="text-xl font-bold text-[#30d158]">{topTools.length}</div>
        </div>
        <div className="p-3 rounded-lg bg-[#141416]">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-[#0a84ff]" />
            <span className="text-[10px] text-[#636366]">平均热度</span>
          </div>
          <div className="text-xl font-bold text-[#0a84ff]">{avgHeat.toFixed(0)}°</div>
        </div>
      </div>

      {/* 最后影响提示 */}
      {dynamicImpact.lastImpact && (
        <div className="mb-4 p-3 rounded-lg bg-[#ff9f0a]/10 border border-[#ff9f0a]/20">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-[#ff9f0a]" />
            <span className="text-xs font-medium text-[#ff9f0a]">最新影响</span>
          </div>
          <div className="text-sm text-[#f5f5f7]">
            工具 <span className="font-medium">{dynamicImpact.lastImpact.slug}</span> 的
            {dynamicImpact.lastImpact.changeType === "heat" && "热度"}
            {dynamicImpact.lastImpact.changeType === "rank" && "排名"}
            {dynamicImpact.lastImpact.changeType === "score" && "评分"}
            从 <span className="text-[#ff453a]">{dynamicImpact.lastImpact.oldValue.toFixed(1)}</span>
            上升到 <span className="text-[#30d158]">{dynamicImpact.lastImpact.newValue.toFixed(1)}</span>
          </div>
        </div>
      )}

      {/* 热门工具排行 */}
      {topTools.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-medium text-[#636366] mb-2 flex items-center gap-2">
            <Flame className="w-3 h-3" />
            热度排行
          </h4>
          <div className="space-y-2">
            {topTools.map((tool, index) => (
              <div key={tool.slug} className="flex items-center gap-3 p-2 rounded-lg bg-[#141416]">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    index === 0 ? "bg-[#ff3b30] text-white" :
                    index === 1 ? "bg-[#ff9f0a] text-white" :
                    index === 2 ? "bg-[#30d158] text-white" :
                    "bg-[#2c2c2e] text-[#8e8e93]"
                  }`}
                >
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="text-xs text-[#f5f5f7] truncate">{tool.slug}</div>
                  <div className="text-[10px] text-[#636366]">{tool.clicks} 次点击</div>
                </div>
                <div className="text-sm font-bold text-[#ff9f0a]">{tool.heat.toFixed(0)}°</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 点击历史 */}
      {recentClicks.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-[#636366] mb-2 flex items-center gap-2">
            <History className="w-3 h-3" />
            操作历史
          </h4>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {recentClicks.map((record, index) => {
              const typeInfo = getClickTypeLabel(record.type);
              return (
                <div
                  key={index}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#141416] transition-colors"
                >
                  <Clock className="w-3 h-3 text-[#636366] flex-shrink-0" />
                  <span className="text-[10px] text-[#636366]">{formatTime(record.timestamp)}</span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: `${typeInfo.color}15`, color: typeInfo.color }}
                  >
                    {typeInfo.label}
                  </span>
                  <span className="text-xs text-[#8e8e93] truncate">{record.slug}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 空状态 */}
      {totalClicks === 0 && (
        <div className="text-center py-8">
          <Activity className="w-8 h-8 text-[#636366] mx-auto mb-2" />
          <p className="text-sm text-[#636366]">开始点击工具，查看动态影响</p>
        </div>
      )}
    </div>
  );
}
