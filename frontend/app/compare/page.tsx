"use client";

import { useAppStore } from "@/stores/app.store";
import { useToolDetail } from "@/hooks";
import { LoadingState } from "@/components/LoadingState";
import { formatPrice, formatNumber, getPricingLabel } from "@/lib/utils";
import { X, Star, Check, XCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

function CompareRow({
  label,
  values,
  highlight = false,
}: {
  label: string;
  values: React.ReactNode[];
  highlight?: boolean;
}) {
  return (
    <div
      className={`grid gap-4 ${
        highlight ? "bg-[#1c1c1e]" : ""
      }`}
      style={{
        gridTemplateColumns: `200px repeat(${values.length}, 1fr)`,
      }}
    >
      <div className="px-4 py-3 text-xs font-medium text-[#636366] uppercase tracking-wider flex items-center">
        {label}
      </div>
      {values.map((value, i) => (
        <div key={i} className="px-4 py-3 text-sm text-[#f5f5f7]">
          {value}
        </div>
      ))}
    </div>
  );
}

function ToolHeader({ slug, onRemove }: { slug: string; onRemove: () => void }) {
  const { data: tool, loading, error } = useToolDetail(slug);

  if (loading) return <div className="p-4"><LoadingState /></div>;
  if (error || !tool) return <div className="p-4 text-sm text-[#636366]">加载失败</div>;

  const pricing = getPricingLabel((tool as any).pricingType || (tool as any).pricingModel);

  return (
    <div className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#2c2c2e] flex items-center justify-center overflow-hidden">
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
            <div className="text-xs text-[#636366]">{(tool as any).developer || tool.developer || '-'}</div>
          </div>
        </div>
        <button
          onClick={onRemove}
          className="p-1.5 rounded-lg text-[#636366] hover:text-[#ff3b30] hover:bg-[#ff3b30]/10 transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#2c2c2e]" style={{ color: pricing.color }}>
          {pricing.label}
        </span>
        {tool.availableInChina && (
          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#30d158]/10 text-[#30d158]">
            国内可用
          </span>
        )}
      </div>
    </div>
  );
}

export default function ComparePage() {
  const selectedTools = useAppStore((s) => s.compare.selectedTools);
  const removeFromCompare = useAppStore((s) => s.removeFromCompare);
  const clearCompare = useAppStore((s) => s.clearCompare);

  if (selectedTools.length === 0) {
    return (
      <div className="p-4 lg:p-8 max-w-[1200px] mx-auto">
        <h1 className="text-2xl font-bold text-[#f5f5f7] mb-2">对比</h1>
        <p className="text-sm text-[#636366] mb-8">选择多个 AI 工具进行并排对比</p>
        <div className="text-center py-20">
          <p className="text-sm text-[#636366]">请在工具库中选择要对比的工具</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#f5f5f7] mb-2">对比</h1>
          <p className="text-sm text-[#636366]">并排对比 {selectedTools.length} 个 AI 工具</p>
        </div>
        <button
          onClick={clearCompare}
          className="px-4 py-2 rounded-lg text-sm text-[#8e8e93] hover:text-[#f5f5f7] hover:bg-[#1c1c1e] transition-all"
        >
          清除全部
        </button>
      </div>

      {/* Compare Table */}
      <div className="rounded-xl border border-[#2c2c2e] overflow-hidden overflow-x-auto">
        <div
          className="grid gap-4"
          style={{
            gridTemplateColumns: `200px repeat(${selectedTools.length}, minmax(280px, 1fr))`,
            minWidth: `${200 + selectedTools.length * 280}px`,
          }}
        >
          {/* Headers */}
          <div className="px-4 py-3 text-xs font-medium text-[#636366] uppercase tracking-wider border-b border-[#2c2c2e]" />
          {selectedTools.map((tool) => (
            <div key={tool.slug} className="border-b border-[#2c2c2e]">
              <ToolHeader slug={tool.slug} onRemove={() => removeFromCompare(tool.slug)} />
            </div>
          ))}

          {/* Basic Info */}
          <CompareRow
            label="价格模型"
            values={selectedTools.map((t) => getPricingLabel((t as any).pricingType || (t as any).pricingModel).label)}
          />
          <CompareRow
            label="输入价格"
            values={selectedTools.map((t) => formatPrice((t as any).inputPrice))}
            highlight
          />
          <CompareRow
            label="输出价格"
            values={selectedTools.map((t) => formatPrice((t as any).outputPrice))}
          />
          <CompareRow
            label="上下文窗口"
            values={selectedTools.map((t) => formatNumber((t as any).contextWindow))}
            highlight
          />
          <CompareRow
            label="最大输出"
            values={selectedTools.map((t) => formatNumber((t as any).maxOutputTokens))}
          />

          {/* Capabilities */}
          <CompareRow
            label="能力"
            values={selectedTools.map((t) => (
              <div className="flex flex-wrap gap-1">
                {t.capabilities?.map((cap) => (
                  <span key={cap} className="px-2 py-0.5 rounded text-[10px] bg-[#2c2c2e] text-[#8e8e93]">
                    {cap}
                  </span>
                )) || "—"}
              </div>
            ))}
            highlight
          />

          {/* Platforms */}
          <CompareRow
            label="平台"
            values={selectedTools.map((t) => t.platforms?.join(", ") || "—")}
          />

          {/* China */}
          <CompareRow
            label="国内可用"
            values={selectedTools.map((t) =>
              t.availableInChina ? (
                <Check className="w-4 h-4 text-[#30d158]" />
              ) : (
                <XCircle className="w-4 h-4 text-[#636366]" />
              )
            )}
            highlight
          />

          {/* OpenAI Compatible */}
          <CompareRow
            label="OpenAI 兼容"
            values={selectedTools.map((t) =>
              (t as any).openaiCompatible ? (
                <Check className="w-4 h-4 text-[#30d158]" />
              ) : (
                <XCircle className="w-4 h-4 text-[#636366]" />
              )
            )}
          />

          {/* Rating */}
          <CompareRow
            label="评分"
            values={selectedTools.map((t) => (
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-[#ff9f0a] fill-current" />
                <span>{t.averageRating?.toFixed(1) || "—"}</span>
              </div>
            ))}
            highlight
          />

          {/* Developer */}
          <CompareRow
            label="开发商"
            values={selectedTools.map((t) => t.developer || "—")}
          />

          {/* Website */}
          <CompareRow
            label="官网"
            values={selectedTools.map((t) =>
              t.websiteUrl ? (
                <Link
                  href={t.websiteUrl}
                  target="_blank"
                  className="text-[#ff3b30] hover:underline"
                >
                  访问
                </Link>
              ) : (
                "—"
              )
            )}
            highlight
          />
        </div>
      </div>
    </div>
  );
}
