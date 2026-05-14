"use client";

import Link from "next/link";
import { X, BarChart3 } from "lucide-react";
import { useAppStore } from "@/stores/app.store";

export function CompareBar() {
  const selectedTools = useAppStore((s) => s.compare.selectedTools);
  const removeFromCompare = useAppStore((s) => s.removeFromCompare);
  const clearCompare = useAppStore((s) => s.clearCompare);

  if (selectedTools.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 lg:left-56 bg-[#141416] border-t border-[#2c2c2e] p-4 z-40">
      <div className="max-w-4xl mx-auto flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-[#636366]">
          <BarChart3 className="w-4 h-4" />
          <span>已选择 {selectedTools.length} 个工具</span>
        </div>

        <div className="flex-1 flex items-center gap-2 overflow-x-auto">
          {selectedTools.map((tool) => (
            <div
              key={tool.slug}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1c1c1e] border border-[#2c2c2e] text-sm text-[#f5f5f7] whitespace-nowrap"
            >
              <span>{tool.name}</span>
              <button
                onClick={() => removeFromCompare(tool.slug)}
                className="text-[#636366] hover:text-[#ff3b30]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={clearCompare}
            className="px-3 py-2 rounded-lg text-sm text-[#8e8e93] hover:text-[#f5f5f7] hover:bg-[#1c1c1e] transition-all"
          >
            清除
          </button>
          <Link
            href="/compare"
            className="px-4 py-2 rounded-lg bg-[#ff3b30] text-white text-sm font-medium hover:bg-[#ff453a] transition-all"
          >
            开始对比
          </Link>
        </div>
      </div>
    </div>
  );
}
