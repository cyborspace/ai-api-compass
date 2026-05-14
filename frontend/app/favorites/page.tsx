"use client";

import { useAppStore } from "@/stores/app.store";
import { ToolCard } from "@/components/ToolCard";
import { Star, Trash2 } from "lucide-react";
import Link from "next/link";
import { useToolsList } from "@/hooks";
import { LoadingState } from "@/components/LoadingState";

export default function FavoritesPage() {
  const { toolSlugs, removeFromFavorite, clearFavorites } = useAppStore((s) => ({
    toolSlugs: s.favorite.toolSlugs,
    removeFromFavorite: s.removeFromFavorite,
    clearFavorites: s.clearFavorites,
  }));

  const { data, loading } = useToolsList({ limit: 500 });

  const favoriteTools =
    data?.data?.filter((tool) => toolSlugs.includes(tool.slug)) || [];

  return (
    <div className="p-4 lg:p-8 max-w-[1200px] mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#f5f5f7] mb-2">收藏</h1>
          <p className="text-sm text-[#636366]">已收藏的工具列表</p>
        </div>
        {favoriteTools.length > 0 && (
          <button
            onClick={clearFavorites}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-[#8e8e93] hover:text-[#ff3b30] hover:bg-[#ff3b30]/10 transition-all"
          >
            <Trash2 className="w-4 h-4" />
            清空收藏
          </button>
        )}
      </div>

      {loading ? (
        <LoadingState />
      ) : favoriteTools.length === 0 ? (
        <div className="text-center py-20">
          <Star className="w-12 h-12 text-[#2c2c2e] mx-auto mb-4" />
          <p className="text-sm text-[#636366] mb-2">暂无收藏</p>
          <Link href="/" className="text-sm text-[#ff3b30] hover:underline">
            去工具库添加
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {favoriteTools.map((tool) => (
            <div key={tool.slug} className="relative group">
              <ToolCard tool={tool} />
              <button
                onClick={() => removeFromFavorite(tool.slug)}
                className="absolute top-3 right-3 p-1.5 rounded-lg bg-[#1c1c1e]/80 text-[#636366] hover:text-[#ff3b30] opacity-0 group-hover:opacity-100 transition-all"
                title="取消收藏"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
