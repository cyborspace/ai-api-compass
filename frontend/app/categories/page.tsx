"use client";

import { useCategories } from "@/hooks";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { Hexagon } from "lucide-react";
import Link from "next/link";

export default function CategoriesPage() {
  const { data: categories, loading, error } = useCategories();

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="p-4 lg:p-8 max-w-[1200px] mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#f5f5f7] mb-2">分类</h1>
        <p className="text-sm text-[#636366]">按类别浏览 AI 工具</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <Link
            key={cat.slug}
            href={`/?category=${cat.slug}`}
            className="p-6 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e] hover:border-[#3a3a3c] transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#2c2c2e] flex items-center justify-center group-hover:bg-[#ff3b30]/10 transition-all">
                <Hexagon className="w-6 h-6 text-[#8e8e93] group-hover:text-[#ff3b30] transition-colors" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#f5f5f7] group-hover:text-[#ff3b30] transition-colors">
                  {cat.name}
                </h3>
                <p className="text-xs text-[#636366]">{cat.description}</p>
                {cat.toolCount !== undefined && (
                  <p className="text-xs text-[#8e8e93] mt-1">{cat.toolCount} 个工具</p>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
