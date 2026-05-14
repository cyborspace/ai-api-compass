"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Minus, BarChart3, Clock } from "lucide-react";
import { useAppStore, type ToolHeatData } from "@/stores/app.store";
import { cn } from "@/lib/utils";

export function TrendAnalysisPanel() {
  const { clickTracking } = useAppStore();
  const [topTools, setTopTools] = useState<{ slug: string; heat: ToolHeatData }[]>([]);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);

  useEffect(() => {
    const tools = Object.entries(clickTracking.heatData)
      .map(([slug, heat]) => ({ slug, heat }))
      .sort((a, b) => b.heat.totalHeat - a.heat.totalHeat)
      .slice(0, 5);
    setTopTools(tools);
    if (tools.length > 0 && !selectedTool) {
      setSelectedTool(tools[0].slug);
    }
  }, [clickTracking.heatData, selectedTool]);

  const selectedHeat = topTools.find((t) => t.slug === selectedTool)?.heat;

  const getTrendIcon = (trendScore: number) => {
    if (trendScore > 1.5) return <TrendingUp className="w-4 h-4 text-[#30d158]" />;
    if (trendScore < 0.5) return <TrendingDown className="w-4 h-4 text-[#ff453a]" />;
    return <Minus className="w-4 h-4 text-[#8e8e93]" />;
  };

  const getTrendColor = (trendScore: number) => {
    if (trendScore > 1.5) return "text-[#30d158]";
    if (trendScore < 0.5) return "text-[#ff453a]";
    return "text-[#8e8e93]";
  };

  const getTrendLabel = (trendScore: number) => {
    if (trendScore > 2) return "爆炸增长";
    if (trendScore > 1.5) return "快速上升";
    if (trendScore > 1.2) return "稳步增长";
    if (trendScore > 0.8) return "稳定";
    if (trendScore > 0.5) return "略有下降";
    return "明显下降";
  };

  return (
    <div className="p-4 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
      <h3 className="text-sm font-semibold text-[#f5f5f7] flex items-center gap-2 mb-4">
        <BarChart3 className="w-4 h-4 text-[#30d158]" />
        趋势分析
      </h3>

      {/* Tool Selection */}
      {topTools.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {topTools.map((tool) => (
            <button
              key={tool.slug}
              onClick={() => setSelectedTool(tool.slug)}
              className={`px-3 py-1 rounded-lg text-xs transition-all ${
                selectedTool === tool.slug
                  ? "bg-[#30d158]/10 text-[#30d158] border border-[#30d158]/20"
                  : "bg-[#141416] text-[#8e8e93] border border-[#2c2c2e]"
              }`}
            >
              {tool.slug}
            </button>
          ))}
        </div>
      )}

      {/* Trend Stats */}
      {selectedHeat && (
        <div className="space-y-4">
          {/* Trend Overview */}
          <div className="p-3 rounded-lg bg-[#141416]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[#636366]">当前趋势</span>
              {getTrendIcon(selectedHeat.trendScore)}
            </div>
            <div className="flex items-center justify-between">
              <span className={cn("text-lg font-bold", getTrendColor(selectedHeat.trendScore))}>
                {getTrendLabel(selectedHeat.trendScore)}
              </span>
              <span className="text-xs text-[#636366]">
                趋势指数: {selectedHeat.trendScore.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-lg bg-[#141416]">
              <div className="text-[10px] text-[#636366] mb-1">总点击</div>
              <div className="text-lg font-bold text-[#f5f5f7]">{selectedHeat.clickCount}</div>
            </div>
            <div className="p-3 rounded-lg bg-[#141416]">
              <div className="text-[10px] text-[#636366] mb-1">喜欢数</div>
              <div className="text-lg font-bold text-[#ff3b30]">{selectedHeat.likeCount}</div>
            </div>
            <div className="p-3 rounded-lg bg-[#141416]">
              <div className="text-[10px] text-[#636366] mb-1">浏览数</div>
              <div className="text-lg font-bold text-[#0a84ff]">{selectedHeat.viewCount}</div>
            </div>
            <div className="p-3 rounded-lg bg-[#141416]">
              <div className="text-[10px] text-[#636366] mb-1">热度分数</div>
              <div className="text-lg font-bold text-[#ff9f0a]">{selectedHeat.totalHeat.toFixed(1)}</div>
            </div>
          </div>

          {/* Hourly Trend Chart */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-3 h-3 text-[#636366]" />
              <span className="text-xs text-[#636366]">24小时趋势</span>
            </div>
            <div className="flex items-end gap-1 h-16">
              {selectedHeat.hourlyClicks.map((clicks, index) => {
                const maxClicks = Math.max(...selectedHeat.hourlyClicks, 1);
                const height = (clicks / maxClicks) * 100;
                const isRecent = index >= selectedHeat.hourlyClicks.length - 3;
                return (
                  <div
                    key={index}
                    className={`flex-1 rounded-t transition-all ${
                      isRecent ? "bg-[#30d158]" : "bg-[#2c2c2e]"
                    }`}
                    style={{ height: `${Math.max(height, 5)}%` }}
                    title={`第 ${index + 1} 小时: ${clicks} 次点击`}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {topTools.length === 0 && (
        <div className="text-center py-8">
          <BarChart3 className="w-8 h-8 text-[#636366] mx-auto mb-2" />
          <p className="text-sm text-[#636366]">暂无趋势数据</p>
        </div>
      )}
    </div>
  );
}
