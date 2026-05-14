"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { useAppStore } from "@/stores/app.store";
import { useCategories } from "@/hooks";

const PRICING_OPTIONS = [
  { value: "free", label: "免费" },
  { value: "freemium", label: "免费增值" },
  { value: "paid", label: "付费" },
  { value: "enterprise", label: "企业" },
  { value: "open_source", label: "开源" },
];

const CAPABILITY_OPTIONS = [
  "text-generation",
  "image-generation",
  "code-generation",
  "vision",
  "audio",
  "video",
  "embedding",
  "function-calling",
  "streaming",
  "json-mode",
  "agents",
];

const SORT_OPTIONS = [
  { value: "relevance", label: "相关度" },
  { value: "rating", label: "评分" },
  { value: "price_asc", label: "价格从低到高" },
  { value: "price_desc", label: "价格从高到低" },
  { value: "heat", label: "热度" },
];

export function FilterPanel() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const {
    filter,
    toggleCategory,
    togglePricingType,
    toggleCapability,
    setAvailableInChina,
    setSortBy,
    clearFilters,
  } = useAppStore();

  const { data: categories } = useCategories();

  // Sync URL params to store on mount
  useEffect(() => {
    const cats = searchParams.get("categories");
    const pricing = searchParams.get("pricing");
    const caps = searchParams.get("capabilities");
    const china = searchParams.get("china");
    const sort = searchParams.get("sort") as typeof filter.sortBy;

    if (cats) {
      cats.split(",").forEach((slug) => {
        if (!filter.selectedCategories.includes(slug)) {
          toggleCategory(slug);
        }
      });
    }
    if (pricing) {
      pricing.split(",").forEach((type) => {
        if (!filter.pricingTypes.includes(type)) {
          togglePricingType(type);
        }
      });
    }
    if (caps) {
      caps.split(",").forEach((cap) => {
        if (!filter.capabilities.includes(cap)) {
          toggleCapability(cap);
        }
      });
    }
    if (china === "true") setAvailableInChina(true);
    if (china === "false") setAvailableInChina(false);
    if (sort && SORT_OPTIONS.some((o) => o.value === sort)) {
      setSortBy(sort);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync store to URL when filter changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());

    if (filter.selectedCategories.length > 0) {
      params.set("categories", filter.selectedCategories.join(","));
    } else {
      params.delete("categories");
    }

    if (filter.pricingTypes.length > 0) {
      params.set("pricing", filter.pricingTypes.join(","));
    } else {
      params.delete("pricing");
    }

    if (filter.capabilities.length > 0) {
      params.set("capabilities", filter.capabilities.join(","));
    } else {
      params.delete("capabilities");
    }

    if (filter.availableInChina !== null) {
      params.set("china", String(filter.availableInChina));
    } else {
      params.delete("china");
    }

    if (filter.sortBy !== "relevance") {
      params.set("sort", filter.sortBy);
    } else {
      params.delete("sort");
    }

    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(newUrl, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filter.selectedCategories,
    filter.pricingTypes,
    filter.capabilities,
    filter.availableInChina,
    filter.sortBy,
  ]);

  const hasFilters =
    filter.selectedCategories.length > 0 ||
    filter.pricingTypes.length > 0 ||
    filter.capabilities.length > 0 ||
    filter.availableInChina !== null ||
    filter.sortBy !== "relevance";

  return (
    <div className="w-full lg:w-64 flex-shrink-0 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-[#f5f5f7]">
          <SlidersHorizontal className="w-4 h-4" />
          筛选
        </div>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-[#ff3b30] hover:text-[#ff453a] transition-colors"
          >
            清除全部
          </button>
        )}
      </div>

      {/* Sort */}
      <div>
        <div className="text-xs font-medium text-[#636366] uppercase tracking-wider mb-2">
          排序
        </div>
        <div className="space-y-1">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSortBy(opt.value as typeof filter.sortBy)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                filter.sortBy === opt.value
                  ? "bg-[#ff3b30]/10 text-[#ff3b30] font-medium"
                  : "text-[#8e8e93] hover:text-[#f5f5f7] hover:bg-[#1c1c1e]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Categories */}
      {categories && categories.length > 0 && (
        <div>
          <div className="text-xs font-medium text-[#636366] uppercase tracking-wider mb-2">
            分类
          </div>
          <div className="space-y-1">
            {categories.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => toggleCategory(cat.slug)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all ${
                  filter.selectedCategories.includes(cat.slug)
                    ? "bg-[#ff3b30]/10 text-[#ff3b30] font-medium"
                    : "text-[#8e8e93] hover:text-[#f5f5f7] hover:bg-[#1c1c1e]"
                }`}
              >
                <span>{cat.name}</span>
                {cat.toolCount !== undefined && (
                  <span className="text-[10px] text-[#636366]">{cat.toolCount}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Pricing */}
      <div>
        <div className="text-xs font-medium text-[#636366] uppercase tracking-wider mb-2">
          价格类型
        </div>
        <div className="flex flex-wrap gap-2">
          {PRICING_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => togglePricingType(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                filter.pricingTypes.includes(opt.value)
                  ? "bg-[#ff3b30]/10 text-[#ff3b30] font-medium border border-[#ff3b30]/20"
                  : "bg-[#1c1c1e] text-[#8e8e93] border border-[#2c2c2e] hover:border-[#3a3a3c]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Capabilities */}
      <div>
        <div className="text-xs font-medium text-[#636366] uppercase tracking-wider mb-2">
          能力
        </div>
        <div className="flex flex-wrap gap-2">
          {CAPABILITY_OPTIONS.map((cap) => (
            <button
              key={cap}
              onClick={() => toggleCapability(cap)}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                filter.capabilities.includes(cap)
                  ? "bg-[#ff3b30]/10 text-[#ff3b30] font-medium border border-[#ff3b30]/20"
                  : "bg-[#1c1c1e] text-[#8e8e93] border border-[#2c2c2e] hover:border-[#3a3a3c]"
              }`}
            >
              {cap}
            </button>
          ))}
        </div>
      </div>

      {/* Region */}
      <div>
        <div className="text-xs font-medium text-[#636366] uppercase tracking-wider mb-2">
          地区
        </div>
        <div className="space-y-1">
          <button
            onClick={() => setAvailableInChina(filter.availableInChina === true ? null : true)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
              filter.availableInChina === true
                ? "bg-[#ff3b30]/10 text-[#ff3b30] font-medium"
                : "text-[#8e8e93] hover:text-[#f5f5f7] hover:bg-[#1c1c1e]"
            }`}
          >
            国内可用
          </button>
          <button
            onClick={() => setAvailableInChina(filter.availableInChina === false ? null : false)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
              filter.availableInChina === false
                ? "bg-[#ff3b30]/10 text-[#ff3b30] font-medium"
                : "text-[#8e8e93] hover:text-[#f5f5f7] hover:bg-[#1c1c1e]"
            }`}
          >
            海外工具
          </button>
        </div>
      </div>
    </div>
  );
}
