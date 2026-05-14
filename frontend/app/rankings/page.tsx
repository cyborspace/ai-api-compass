"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRankings, useRankingMeta } from "@/hooks";
import { useAppStore, type ToolHeatData } from "@/stores/app.store";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { InteractiveLikeButton } from "@/components/InteractiveLikeButton";
import { ImpactVisualizationPanel } from "@/components/ImpactVisualizationPanel";
import { DataCorrectionPanel } from "@/components/DataCorrectionPanel";
import { ChangeHistoryPanel } from "@/components/ChangeHistoryPanel";
import { TrendAnalysisPanel } from "@/components/TrendAnalysisPanel";
import { ActivityNotifications } from "@/components/ActivityNotifications";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronRight,
  BarChart3,
  X,
  Flame,
  Pencil,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import type { RankingEntry, RankingResult } from "@/types/api";

interface EnhancedEntry extends RankingEntry {
  adjustedScore: number;
  heatData: ToolHeatData | null;
  rankChangeFromHeat: number;
  originalRank: number;
}

function RankChange({ entry }: { entry: RankingEntry }) {
  if (!entry.rankChange || entry.rankChange === 0) {
    return <Minus className="w-3 h-3 text-[#636366]" />;
  }
  if (entry.rankChange > 0) {
    return (
      <span className="flex items-center gap-0.5 text-[#30d158] text-xs">
        <TrendingUp className="w-3 h-3" />
        +{entry.rankChange}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-0.5 text-[#ff3b30] text-xs">
      <TrendingDown className="w-3 h-3" />
      {entry.rankChange}
    </span>
  );
}

function ScoreBreakdownModal({
  entry,
  ranking,
  onClose,
}: {
  entry: RankingEntry;
  ranking: RankingResult;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-[#1c1c1e] border border-[#2c2c2e] p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[#f5f5f7]">{entry.name}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[#2c2c2e] text-[#636366]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mb-4">
          <div className="text-3xl font-bold text-[#ff3b30]">
            {entry.score.toFixed(1)}
          </div>
          <div className="text-xs text-[#636366]">综合得分</div>
        </div>

        <div className="space-y-3">
          {Object.entries(ranking.weights).map(([key, weight]) => {
            const dimScore =
              (entry as any).dimensions?.[key] ??
              (entry as any).breakdown?.[key]?.score ??
              0;
            const contribution = dimScore * weight;
            return (
              <div key={key}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#8e8e93]">
                    {key === "benchmarkQuality" && "Benchmark 质量"}
                    {key === "contextWindow" && "上下文窗口"}
                    {key === "pricingValue" && "价格性价比"}
                    {key === "lmsysElo" && "LMSYS ELO"}
                    {key === "artificialAnalysis" && "Artificial Analysis"}
                    {key === "openrouterUsage" && "OpenRouter 使用率"}
                    {key === "clickPopularity" && "点击热度"}
                    {key === "ratingAverage" && "平均评分"}
                    {key === "engagementDepth" && "参与深度"}
                  </span>
                  <span className="text-[#f5f5f7]">
                    {dimScore.toFixed(0)} × {weight.toFixed(2)} ={" "}
                    <span className="text-[#ff9f0a]">
                      {contribution.toFixed(1)}
                    </span>
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[#2c2c2e] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#ff3b30] transition-all"
                    style={{ width: `${dimScore}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 pt-6 border-t border-[#2c2c2e]">
          <DataCorrectionPanel
            slug={entry.slug}
            name={entry.name}
            initialData={{
              score: entry.score,
              rating: entry.averageRating,
              contextWindow: entry.contextWindow,
              pricingModel: entry.pricingModel,
            }}
          />
        </div>

        <Link
          href={`/tool/${entry.slug}`}
          className="mt-6 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#ff3b30] text-white text-sm font-medium hover:bg-[#ff3b30]/90 transition-colors"
        >
          查看工具详情
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

export default function RankingsPage() {
  const router = useRouter();
  const [selectedEntry, setSelectedEntry] = useState<RankingEntry | null>(null);
  const [showHeatImpact, setShowHeatImpact] = useState(true);

  const { 
    activeRankingType, 
    activePerspective, 
    setActiveRankingType, 
    setActivePerspective,
    getToolHeat,
    clickTracking,
  } = useAppStore();

  const { types, perspectives } = useRankingMeta();

  const {
    data: ranking,
    loading,
    error,
    refresh,
  } = useRankings(activeRankingType, {
    perspective: activePerspective,
    limit: 50,
  });

  const enhancedEntries = useMemo((): EnhancedEntry[] => {
    if (!ranking?.entries) return [];
    
    return ranking.entries.map((entry) => {
      const heatData = getToolHeat(entry.slug);
      const heatBonus = heatData ? heatData.clickBoost * 0.5 : 0;
      const adjustedScore = entry.score + heatBonus;
      
      return {
        ...entry,
        adjustedScore,
        heatData,
        rankChangeFromHeat: 0,
        originalRank: entry.rank,
      };
    });
  }, [ranking?.entries, getToolHeat]);

  const sortedEntries = useMemo(() => {
    if (!showHeatImpact) return enhancedEntries;
    
    const sorted = [...enhancedEntries].sort((a, b) => {
      if (b.adjustedScore !== a.adjustedScore) {
        return b.adjustedScore - a.adjustedScore;
      }
      return a.rank - b.rank;
    });

    return sorted.map((entry, index) => ({
      ...entry,
      rank: index + 1,
      rankChangeFromHeat: entry.originalRank - (index + 1),
    }));
  }, [enhancedEntries, showHeatImpact]);

  return (
    <div className="p-4 lg:p-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#f5f5f7] mb-2">排行榜</h1>
        <p className="text-sm text-[#636366]">基于多维度评分的 AI 工具排名</p>
        <div className="flex flex-wrap items-center gap-4 mt-2">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-[#ff9f0a]" />
            <span className="text-xs text-[#636366]">点击喜欢按钮提升工具热度</span>
          </div>
          <div className="flex items-center gap-2">
            <Pencil className="w-4 h-4 text-[#0a84ff]" />
            <span className="text-xs text-[#636366]">点击详情面板可修正数据</span>
          </div>
        </div>
      </div>

      {/* Ranking Type Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {types.map((type) => (
          <button
            key={type.type}
            onClick={() => setActiveRankingType(type.type)}
            className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-all ${
              activeRankingType === type.type
                ? "bg-[#ff3b30] text-white font-medium"
                : "bg-[#1c1c1e] text-[#8e8e93] border border-[#2c2c2e] hover:border-[#3a3a3c]"
            }`}
          >
            {type.name}
          </button>
        ))}
      </div>

      {/* Perspective Tabs */}
      {perspectives.length > 0 && (
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {perspectives.map((p) => (
            <button
              key={p.type}
              onClick={() => setActivePerspective(p.type)}
              className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all ${
                activePerspective === p.type
                  ? "bg-[#ff3b30]/10 text-[#ff3b30] font-medium border border-[#ff3b30]/20"
                  : "bg-[#1c1c1e] text-[#636366] border border-[#2c2c2e] hover:border-[#3a3a3c]"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}

      {/* Explanation */}
      {ranking?.explanation && ranking.explanation.length > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
          <h3 className="text-xs font-medium text-[#636366] uppercase tracking-wider mb-2">
            评分说明
          </h3>
          <ul className="space-y-1">
            {ranking.explanation.map((text, i) => (
              <li key={i} className="text-sm text-[#8e8e93]">
                {text}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Heat Impact Toggle */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Flame className={`w-4 h-4 ${showHeatImpact ? "text-[#ff9f0a]" : "text-[#636366]"}`} />
          <span className="text-sm text-[#8e8e93]">
            {showHeatImpact ? "热度影响已启用" : "热度影响已关闭"}
          </span>
        </div>
        <button
          onClick={() => setShowHeatImpact(!showHeatImpact)}
          className={`relative w-12 h-6 rounded-full transition-all ${
            showHeatImpact ? "bg-[#ff9f0a]" : "bg-[#2c2c2e]"
          }`}
        >
          <div
            className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
              showHeatImpact ? "left-7" : "left-1"
            }`}
          />
        </button>
      </div>

      {/* Loading / Error */}
      {loading && <LoadingState />}
      {error && !loading && <ErrorState message={error} onRetry={refresh} />}

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Rankings List */}
        <div className="xl:col-span-2">
          {!loading && !error && sortedEntries.length > 0 && (
            <div className="space-y-2">
              {sortedEntries.map((entry) => (
                <div
                  key={entry.rid}
                  onClick={() => router.push(`/tool/${entry.slug}`)}
                  className={`group flex items-center gap-4 p-4 rounded-xl bg-[#1c1c1e] border transition-all cursor-pointer ${
                    entry.rankChangeFromHeat !== 0 
                      ? "border-[#ff9f0a]/30" 
                      : "border-[#2c2c2e] hover:border-[#ff3b30]/30"
                  }`}
                >
                  {/* Rank */}
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 relative ${
                      entry.rank === 1
                        ? "bg-[#ff3b30] text-white"
                        : entry.rank === 2
                        ? "bg-[#ff9f0a] text-white"
                        : entry.rank === 3
                        ? "bg-[#30d158] text-white"
                        : "bg-[#2c2c2e] text-[#8e8e93]"
                    }`}
                  >
                    {entry.rank}
                    {entry.rankChangeFromHeat !== 0 && (
                      <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold ${
                        entry.rankChangeFromHeat > 0 
                          ? "bg-[#30d158] text-white" 
                          : "bg-[#ff453a] text-white"
                      }`}>
                        {entry.rankChangeFromHeat > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-[#f5f5f7] group-hover:text-[#ff3b30] transition-colors">
                        {entry.name}
                      </span>
                      <RankChange entry={entry} />
                      {entry.rankChangeFromHeat !== 0 && (
                        <span className={`text-xs font-medium ${
                          entry.rankChangeFromHeat > 0 ? "text-[#30d158]" : "text-[#ff453a]"
                        }`}>
                          {entry.rankChangeFromHeat > 0 ? "+" : ""}{entry.rankChangeFromHeat} 热度提升
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[#636366]">{entry.developer}</div>
                  </div>

                  {/* Score */}
                  <div className="text-right">
                    <div className="text-lg font-bold text-[#ff3b30]">
                      {showHeatImpact ? entry.adjustedScore.toFixed(1) : entry.score.toFixed(1)}
                    </div>
                    <div className="text-[10px] text-[#636366]">综合得分</div>
                    {entry.heatData?.clickBoost && showHeatImpact && (
                      <div className="text-[10px] text-[#ff9f0a]">
                        +{entry.heatData.clickBoost * 0.5} 热度加成
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="hidden md:flex items-center gap-6 text-xs text-[#8e8e93]">
                    <div>
                      <div className="text-[#636366]">价格</div>
                      <div>{entry.pricingModel}</div>
                    </div>
                    <div>
                      <div className="text-[#636366]">上下文</div>
                      <div>{entry.contextWindow}</div>
                    </div>
                    <div>
                      <div className="text-[#636366]">评分</div>
                      <div className="text-[#ff9f0a]">
                        {entry.averageRating.toFixed(1)}
                      </div>
                    </div>
                  </div>

                  {/* Like Button */}
                  <div className="flex-shrink-0">
                    <InteractiveLikeButton
                      slug={entry.slug}
                      variant="heart"
                      size="sm"
                    />
                  </div>

                  {/* Breakdown button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEntry(entry);
                    }}
                    className="p-2 rounded-lg hover:bg-[#2c2c2e] text-[#636366] hover:text-[#ff3b30] transition-colors flex-shrink-0"
                    title="查看评分详情"
                  >
                    <BarChart3 className="w-4 h-4" />
                  </button>

                  {/* Arrow */}
                  <ChevronRight className="w-4 h-4 text-[#636366] group-hover:text-[#ff3b30] transition-colors flex-shrink-0" />
                </div>
              ))}
            </div>
          )}

          {/* Empty */}
          {!loading && !error && (!ranking?.entries || ranking.entries.length === 0) && (
            <div className="text-center py-20">
              <p className="text-sm text-[#636366]">暂无排名数据</p>
            </div>
          )}
        </div>

        {/* Sidebar Panels */}
        <div className="xl:col-span-1 space-y-6">
          <ActivityNotifications />
          <TrendAnalysisPanel />
          <ImpactVisualizationPanel />
          <ChangeHistoryPanel />
        </div>
      </div>

      {/* Breakdown Modal */}
      {selectedEntry && ranking && (
        <ScoreBreakdownModal
          entry={selectedEntry}
          ranking={ranking}
          onClose={() => setSelectedEntry(null)}
        />
      )}
    </div>
  );
}
