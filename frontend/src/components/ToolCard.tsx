"use client";

import Link from "next/link";
import Image from "next/image";
import { Star, TrendingUp, Plus, Check, Heart } from "lucide-react";
import type { AIGCTool } from "@/types/api";
import { formatPrice, formatNumber, getPricingLabel, getHeatLevel } from "@/lib/utils";
import { useAppStore } from "@/stores/app.store";
import { InteractiveLikeButton } from "./InteractiveLikeButton";

interface ToolCardProps {
  tool: AIGCTool;
  variant?: "default" | "compact" | "ranking";
  rank?: number;
}

export function ToolCard({ tool, variant = "default", rank }: ToolCardProps) {
  const selectedTools = useAppStore((s) => s.compare.selectedTools);
  const addToCompare = useAppStore((s) => s.addToCompare);
  const removeFromCompare = useAppStore((s) => s.removeFromCompare);
  const isSelected = selectedTools.some((t) => t.slug === tool.slug);

  const isFav = useAppStore((s) => s.isFavorite(tool.slug));
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);

  const pricing = getPricingLabel(tool.pricingType);
  const heat = tool.heatScore ? getHeatLevel(tool.heatScore) : null;

  if (variant === "compact") {
    return (
      <Link
        href={`/tool/${tool.slug}`}
        className="flex items-center gap-3 p-3 rounded-lg bg-[#1c1c1e] border border-[#2c2c2e] hover:border-[#3a3a3c] transition-all group"
      >
        <div className="w-10 h-10 rounded-lg bg-[#2c2c2e] flex items-center justify-center flex-shrink-0 overflow-hidden">
          {tool.logoUrl ? (
            <Image src={tool.logoUrl} alt={tool.name} width={40} height={40} className="object-contain" />
          ) : (
            <span className="text-xs font-bold text-[#8e8e93]">{tool.name.slice(0, 2)}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-[#f5f5f7] truncate">{tool.name}</div>
          <div className="text-xs text-[#636366] truncate">{tool.developer || tool.tagline}</div>
        </div>
        {tool.averageRating && (
          <div className="flex items-center gap-1 text-xs text-[#ff9f0a]">
            <Star className="w-3 h-3 fill-current" />
            {tool.averageRating.toFixed(1)}
          </div>
        )}
      </Link>
    );
  }

  if (variant === "ranking") {
    return (
      <div className="flex items-center gap-4 p-4 rounded-lg bg-[#1c1c1e] border border-[#2c2c2e] hover:border-[#3a3a3c] transition-all">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
          rank === 1 ? "bg-[#ff3b30] text-white" :
          rank === 2 ? "bg-[#ff9f0a] text-white" :
          rank === 3 ? "bg-[#30d158] text-white" :
          "bg-[#2c2c2e] text-[#8e8e93]"
        }`}>
          {rank}
        </div>
        <div className="w-10 h-10 rounded-lg bg-[#2c2c2e] flex items-center justify-center flex-shrink-0 overflow-hidden">
          {tool.logoUrl ? (
            <Image src={tool.logoUrl} alt={tool.name} width={40} height={40} className="object-contain" />
          ) : (
            <span className="text-xs font-bold text-[#8e8e93]">{tool.name.slice(0, 2)}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <Link href={`/tool/${tool.slug}`} className="text-sm font-medium text-[#f5f5f7] hover:text-[#ff3b30] transition-colors">
            {tool.name}
          </Link>
          <div className="text-xs text-[#636366]">{tool.developer}</div>
        </div>
        <div className="flex items-center gap-4 text-xs">
          {tool.heatScore && (
            <div className="flex items-center gap-1" style={{ color: heat?.color }}>
              <TrendingUp className="w-3 h-3" />
              {tool.heatScore.toFixed(0)}
            </div>
          )}
          {tool.averageRating && (
            <div className="flex items-center gap-1 text-[#ff9f0a]">
              <Star className="w-3 h-3 fill-current" />
              {tool.averageRating.toFixed(1)}
            </div>
          )}
          <button
            onClick={() => toggleFavorite(tool.slug)}
            className={`p-1.5 rounded-md transition-all ${
              isFav
                ? "bg-[#ff3b30]/10 text-[#ff3b30]"
                : "bg-[#2c2c2e] text-[#8e8e93] hover:text-[#f5f5f7]"
            }`}
            title={isFav ? "取消收藏" : "收藏"}
          >
            <Heart className={`w-3.5 h-3.5 ${isFav ? "fill-current" : ""}`} />
          </button>
          <button
            onClick={() => isSelected ? removeFromCompare(tool.slug) : addToCompare(tool)}
            className={`p-1.5 rounded-md transition-all ${
              isSelected
                ? "bg-[#30d158]/10 text-[#30d158]"
                : "bg-[#2c2c2e] text-[#8e8e93] hover:text-[#f5f5f7]"
            }`}
            title={isSelected ? "移除对比" : "加入对比"}
          >
            {isSelected ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-[#1c1c1e] border border-[#2c2c2e] hover:border-[#3a3a3c] transition-all group overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#2c2c2e] flex items-center justify-center flex-shrink-0 overflow-hidden">
              {tool.logoUrl ? (
                <Image src={tool.logoUrl} alt={tool.name} width={48} height={48} className="object-contain" />
              ) : (
                <span className="text-sm font-bold text-[#8e8e93]">{tool.name.slice(0, 2)}</span>
              )}
            </div>
            <div>
              <Link href={`/tool/${tool.slug}`} className="text-base font-semibold text-[#f5f5f7] hover:text-[#ff3b30] transition-colors">
                {tool.name}
              </Link>
              <div className="text-xs text-[#636366]">{tool.developer || "—"}</div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => toggleFavorite(tool.slug)}
              className={`p-2 rounded-lg transition-all ${
                isFav
                  ? "bg-[#ff3b30]/10 text-[#ff3b30]"
                  : "bg-[#2c2c2e] text-[#8e8e93] hover:text-[#f5f5f7] opacity-0 group-hover:opacity-100"
              }`}
              title={isFav ? "取消收藏" : "收藏"}
            >
              <Heart className={`w-4 h-4 ${isFav ? "fill-current" : ""}`} />
            </button>
            <button
              onClick={() => isSelected ? removeFromCompare(tool.slug) : addToCompare(tool)}
              className={`p-2 rounded-lg transition-all ${
                isSelected
                  ? "bg-[#30d158]/10 text-[#30d158]"
                  : "bg-[#2c2c2e] text-[#8e8e93] hover:text-[#f5f5f7] opacity-0 group-hover:opacity-100"
              }`}
              title={isSelected ? "移除对比" : "加入对比"}
            >
              {isSelected ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Interactive Like Button */}
        <div className="flex justify-end mb-3">
          <InteractiveLikeButton slug={tool.slug} variant="flame" size="sm" />
        </div>

        <p className="text-sm text-[#8e8e93] mb-3 line-clamp-2">{tool.tagline || tool.description || "—"}</p>

        <div className="flex flex-wrap gap-2 mb-3">
          <span
            className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#2c2c2e]"
            style={{ color: pricing.color }}
          >
            {pricing.label}
          </span>
          {tool.availableInChina && (
            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#30d158]/10 text-[#30d158]">
              国内可用
            </span>
          )}
          {heat && (
            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#2c2c2e]" style={{ color: heat.color }}>
              {heat.label}
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs">
          <div>
            <div className="text-[#636366]">输入价格</div>
            <div className="text-[#f5f5f7] font-medium">{formatPrice(tool.inputPrice)}</div>
          </div>
          <div>
            <div className="text-[#636366]">上下文</div>
            <div className="text-[#f5f5f7] font-medium">{formatNumber(tool.contextWindow)}</div>
          </div>
          <div>
            <div className="text-[#636366]">评分</div>
            <div className="flex items-center gap-1 text-[#ff9f0a]">
              <Star className="w-3 h-3 fill-current" />
              <span className="text-[#f5f5f7] font-medium">{tool.averageRating?.toFixed(1) || "—"}</span>
            </div>
          </div>
        </div>
      </div>

      {tool.capabilities && tool.capabilities.length > 0 && (
        <div className="px-4 pb-4">
          <div className="flex flex-wrap gap-1.5">
            {tool.capabilities.slice(0, 5).map((cap) => (
              <span key={cap} className="px-2 py-0.5 rounded text-[10px] bg-[#2c2c2e] text-[#8e8e93]">
                {cap}
              </span>
            ))}
            {tool.capabilities.length > 5 && (
              <span className="px-2 py-0.5 rounded text-[10px] bg-[#2c2c2e] text-[#636366]">
                +{tool.capabilities.length - 5}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
