"use client";

import { useParams } from "next/navigation";
import { useToolDetail, useToolRatings, useToolRatingStats } from "@/hooks";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { formatPrice, formatNumber, getPricingLabel, getHeatLevel } from "@/lib/utils";
import { Star, Check, XCircle, Globe, Code } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function ToolDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const { data: tool, loading, error } = useToolDetail(slug);
  const { ratings, total, loading: ratingsLoading } = useToolRatings(slug, { limit: 5 });
  const { stats: ratingStats } = useToolRatingStats(slug);

  if (loading) return <LoadingState />;
  if (error || !tool) return <ErrorState message={error || "工具不存在"} />;

  const pricing = getPricingLabel(tool.pricingType);
  const heat = tool.heatScore ? getHeatLevel(tool.heatScore) : null;

  return (
    <div className="p-4 lg:p-8 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex items-start gap-6 mb-8">
        <div className="w-20 h-20 rounded-2xl bg-[#2c2c2e] flex items-center justify-center flex-shrink-0 overflow-hidden">
          {tool.logoUrl ? (
            <Image src={tool.logoUrl} alt={tool.name} width={80} height={80} className="object-contain" />
          ) : (
            <span className="text-2xl font-bold text-[#8e8e93]">{tool.name.slice(0, 2)}</span>
          )}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-[#f5f5f7] mb-1">{tool.name}</h1>
          <p className="text-sm text-[#636366] mb-3">{tool.tagline || tool.description}</p>
          <div className="flex flex-wrap gap-2">
            <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[#2c2c2e]" style={{ color: pricing.color }}>
              {pricing.label}
            </span>
            {tool.availableInChina && (
              <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[#30d158]/10 text-[#30d158]">
                国内可用
              </span>
            )}
            {heat && (
              <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[#2c2c2e]" style={{ color: heat.color }}>
                {heat.label}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {tool.websiteUrl && (
            <Link
              href={tool.websiteUrl}
              target="_blank"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#ff3b30] text-white text-sm font-medium hover:bg-[#ff453a] transition-all"
            >
              <Globe className="w-4 h-4" />
              访问官网
            </Link>
          )}
          {tool.apiDocsUrl && (
            <Link
              href={tool.apiDocsUrl}
              target="_blank"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1c1c1e] border border-[#2c2c2e] text-sm text-[#8e8e93] hover:text-[#f5f5f7] hover:border-[#3a3a3c] transition-all"
            >
              <Code className="w-4 h-4" />
              API 文档
            </Link>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="p-4 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
          <div className="text-xs text-[#636366] mb-1">输入价格</div>
          <div className="text-lg font-semibold text-[#f5f5f7]">{formatPrice(tool.inputPrice)}</div>
        </div>
        <div className="p-4 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
          <div className="text-xs text-[#636366] mb-1">输出价格</div>
          <div className="text-lg font-semibold text-[#f5f5f7]">{formatPrice(tool.outputPrice)}</div>
        </div>
        <div className="p-4 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
          <div className="text-xs text-[#636366] mb-1">上下文窗口</div>
          <div className="text-lg font-semibold text-[#f5f5f7]">{formatNumber(tool.contextWindow)}</div>
        </div>
        <div className="p-4 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
          <div className="text-xs text-[#636366] mb-1">最大输出</div>
          <div className="text-lg font-semibold text-[#f5f5f7]">{formatNumber(tool.maxOutputTokens)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Description */}
          {tool.description && (
            <div>
              <h2 className="text-sm font-medium text-[#636366] uppercase tracking-wider mb-3">简介</h2>
              <p className="text-sm text-[#8e8e93] leading-relaxed">{tool.description}</p>
            </div>
          )}

          {/* Capabilities */}
          {tool.capabilities && tool.capabilities.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-[#636366] uppercase tracking-wider mb-3">能力</h2>
              <div className="flex flex-wrap gap-2">
                {tool.capabilities.map((cap) => (
                  <span key={cap} className="px-3 py-1.5 rounded-lg text-xs bg-[#1c1c1e] border border-[#2c2c2e] text-[#8e8e93]">
                    {cap}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Modalities */}
          {tool.modalities && tool.modalities.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-[#636366] uppercase tracking-wider mb-3">模态</h2>
              <div className="flex flex-wrap gap-2">
                {tool.modalities.map((mod) => (
                  <span key={mod} className="px-3 py-1.5 rounded-lg text-xs bg-[#1c1c1e] border border-[#2c2c2e] text-[#8e8e93]">
                    {mod}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Platforms */}
          {tool.platforms && tool.platforms.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-[#636366] uppercase tracking-wider mb-3">平台</h2>
              <div className="flex flex-wrap gap-2">
                {tool.platforms.map((plat) => (
                  <span key={plat} className="px-3 py-1.5 rounded-lg text-xs bg-[#1c1c1e] border border-[#2c2c2e] text-[#8e8e93]">
                    {plat}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Ratings */}
          <div>
            <h2 className="text-sm font-medium text-[#636366] uppercase tracking-wider mb-3">
              评价 ({total})
            </h2>
            {ratingsLoading ? (
              <LoadingState />
            ) : ratings.length > 0 ? (
              <div className="space-y-3">
                {ratings.map((rating) => (
                  <div key={rating.rid} className="p-4 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < rating.overallRating
                                ? "text-[#ff9f0a] fill-current"
                                : "text-[#2c2c2e]"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-[#636366]">{rating.createdAt.slice(0, 10)}</span>
                    </div>
                    {rating.reviewTitle && (
                      <div className="text-sm font-medium text-[#f5f5f7] mb-1">{rating.reviewTitle}</div>
                    )}
                    {rating.reviewContent && (
                      <p className="text-sm text-[#8e8e93]">{rating.reviewContent}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#636366]">暂无评价</p>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Rating Stats */}
          {ratingStats && (
            <div className="p-4 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-3xl font-bold text-[#f5f5f7]">{ratingStats.averageRating.toFixed(1)}</div>
                <div>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.round(ratingStats.averageRating)
                            ? "text-[#ff9f0a] fill-current"
                            : "text-[#2c2c2e]"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="text-xs text-[#636366]">{ratingStats.totalRatings} 条评价</div>
                </div>
              </div>
              <div className="space-y-1.5">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = (ratingStats.distribution || {})[star] || 0;
                  const pct = ratingStats.totalRatings > 0 ? (count / ratingStats.totalRatings) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-2">
                      <span className="text-xs text-[#636366] w-3">{star}</span>
                      <Star className="w-3 h-3 text-[#ff9f0a] fill-current" />
                      <div className="flex-1 h-1.5 bg-[#2c2c2e] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#ff9f0a] rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-[#636366] w-8 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Info */}
          <div className="p-4 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
            <h3 className="text-xs font-medium text-[#636366] uppercase tracking-wider mb-3">信息</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-[#636366]">开发商</span>
                <span className="text-[#f5f5f7]">{tool.developer || "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#636366]">OpenAI 兼容</span>
                {tool.openaiCompatible ? (
                  <Check className="w-4 h-4 text-[#30d158]" />
                ) : (
                  <XCircle className="w-4 h-4 text-[#636366]" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#636366]">国内可用</span>
                {tool.availableInChina ? (
                  <Check className="w-4 h-4 text-[#30d158]" />
                ) : (
                  <XCircle className="w-4 h-4 text-[#636366]" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#636366]">浏览量</span>
                <span className="text-[#f5f5f7]">{formatNumber(tool.viewCount)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
