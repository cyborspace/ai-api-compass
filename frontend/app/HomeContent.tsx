"use client";

import { useSearchParams } from "next/navigation";
import { LayoutGrid, List, Table2 } from "lucide-react";
import { useToolsList, useHomeRecommendations } from "@/hooks";
import { useAppStore } from "@/stores/app.store";
import { SearchBar } from "@/components/SearchBar";
import { ToolCard } from "@/components/ToolCard";
import { FilterPanel } from "@/components/FilterPanel";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";

export default function HomeContent() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("search") || "";

  const layout = useAppStore((s) => s.view.layout);
  const setLayout = useAppStore((s) => s.setLayout);
  const filter = useAppStore((s) => s.filter);

  const {
    data: toolsData,
    loading: toolsLoading,
    error: toolsError,
    refresh: refreshTools,
  } = useToolsList({
    limit: 50,
    search: searchQuery || undefined,
    categories: filter.selectedCategories.length > 0 ? filter.selectedCategories : undefined,
    pricingTypes: filter.pricingTypes.length > 0 ? filter.pricingTypes : undefined,
    capabilities: filter.capabilities.length > 0 ? filter.capabilities : undefined,
    availableInChina: filter.availableInChina,
    sortBy: filter.sortBy !== 'relevance' ? filter.sortBy : undefined,
  });

  const {
    data: recommendations,
    loading: recsLoading,
    error: recsError,
  } = useHomeRecommendations({ limit: 6 });

  // Backend handles filtering and sorting via API params
  const filteredTools = toolsData?.data || [];

  const isLoading = toolsLoading || recsLoading;
  const hasError = toolsError || recsError;

  return (
    <div className="p-4 lg:p-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#f5f5f7] mb-2">AI 工具库</h1>
        <p className="text-sm text-[#636366]">发现、对比、选择最适合的 AI 工具</p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <SearchBar initialValue={searchQuery} />
      </div>

      {/* Recommendations */}
      {recommendations?.items && recommendations.items.length > 0 && !searchQuery && (
        <div className="mb-8">
          <h2 className="text-sm font-medium text-[#636366] uppercase tracking-wider mb-4">
            推荐工具
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.items.map((item) => (
              <ToolCard key={item.tool.slug} tool={item.tool} />
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex gap-8">
        {/* Filter Sidebar */}
        <div className="hidden lg:block">
          <FilterPanel />
        </div>

        {/* Tool List */}
        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-[#636366]">
              {filteredTools.length} 个工具
            </div>
            <div className="flex items-center gap-1 bg-[#1c1c1e] rounded-lg p-1">
              <button
                onClick={() => setLayout("grid")}
                className={`p-2 rounded-md transition-all ${
                  layout === "grid" ? "bg-[#2c2c2e] text-[#f5f5f7]" : "text-[#636366] hover:text-[#f5f5f7]"
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setLayout("list")}
                className={`p-2 rounded-md transition-all ${
                  layout === "list" ? "bg-[#2c2c2e] text-[#f5f5f7]" : "text-[#636366] hover:text-[#f5f5f7]"
                }`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setLayout("table")}
                className={`p-2 rounded-md transition-all ${
                  layout === "table" ? "bg-[#2c2c2e] text-[#f5f5f7]" : "text-[#636366] hover:text-[#f5f5f7]"
                }`}
              >
                <Table2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Loading / Error */}
          {isLoading && <LoadingState />}
          {hasError && !isLoading && (
            <ErrorState message={toolsError || recsError || undefined} onRetry={refreshTools} />
          )}

          {/* Grid View */}
          {!isLoading && !hasError && layout === "grid" && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredTools.map((tool) => (
                <ToolCard key={tool.slug} tool={tool} />
              ))}
            </div>
          )}

          {/* List View */}
          {!isLoading && !hasError && layout === "list" && (
            <div className="space-y-2">
              {filteredTools.map((tool) => (
                <ToolCard key={tool.slug} tool={tool} variant="ranking" />
              ))}
            </div>
          )}

          {/* Table View */}
          {!isLoading && !hasError && layout === "table" && (
            <div className="rounded-xl border border-[#2c2c2e] overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#1c1c1e]">
                    <th className="data-header text-left">工具</th>
                    <th className="data-header text-left">开发商</th>
                    <th className="data-header text-left">价格</th>
                    <th className="data-header text-left">上下文</th>
                    <th className="data-header text-left">评分</th>
                    <th className="data-header text-left">热度</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTools.map((tool) => (
                    <tr key={tool.slug} className="hover:bg-[#1c1c1e]/50 transition-colors">
                      <td className="data-cell">
                        <ToolCard tool={tool} variant="compact" />
                      </td>
                      <td className="data-cell text-[#8e8e93]">{tool.developer || "—"}</td>
                      <td className="data-cell text-[#8e8e93]">{(tool as any).inputPrice || "—"}</td>
                      <td className="data-cell text-[#8e8e93]">{(tool as any).contextWindow || "—"}</td>
                      <td className="data-cell text-[#ff9f0a]">{tool.averageRating?.toFixed(1) || "—"}</td>
                      <td className="data-cell text-[#8e8e93]">{tool.heatScore?.toFixed(0) || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !hasError && filteredTools.length === 0 && (
            <div className="text-center py-20">
              <p className="text-sm text-[#636366]">未找到匹配的工具</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
