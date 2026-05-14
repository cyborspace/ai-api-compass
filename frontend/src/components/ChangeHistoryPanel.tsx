"use client";

import { useEffect, useState } from "react";
import { History, Clock, RotateCcw, Trash2, AlertTriangle } from "lucide-react";
import { useAppStore, type DataCorrection } from "@/stores/app.store";
import { cn } from "@/lib/utils";

export function ChangeHistoryPanel() {
  const { getAllCorrections, revertCorrection, clearAllCorrections } = useAppStore();
  const [corrections, setCorrections] = useState<DataCorrection[]>([]);

  useEffect(() => {
    setCorrections(getAllCorrections());
  }, [getAllCorrections]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString("zh-CN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatValue = (value: any) => {
    if (typeof value === "number") {
      return value.toFixed(value % 1 === 0 ? 0 : 1);
    }
    return String(value);
  };

  const getFieldLabel = (field: string) => {
    const labels: Record<string, string> = {
      score: "综合得分",
      rating: "用户评分",
      contextWindow: "上下文窗口",
      pricingModel: "价格模型",
    };
    return labels[field] || field;
  };

  if (corrections.length === 0) {
    return (
      <div className="p-4 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
        <h3 className="text-sm font-semibold text-[#f5f5f7] flex items-center gap-2 mb-4">
          <History className="w-4 h-4 text-[#bf5af2]" />
          修改历史
        </h3>
        <div className="text-center py-8">
          <History className="w-8 h-8 text-[#636366] mx-auto mb-2" />
          <p className="text-sm text-[#636366]">暂无修改记录</p>
        </div>
      </div>
    );
  }

  const groupedCorrections = corrections.reduce((acc, correction) => {
    const key = correction.slug;
    if (!acc[key]) acc[key] = [];
    acc[key].push(correction);
    return acc;
  }, {} as Record<string, DataCorrection[]>);

  return (
    <div className="p-4 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[#f5f5f7] flex items-center gap-2">
          <History className="w-4 h-4 text-[#bf5af2]" />
          修改历史
          <span className="text-xs text-[#636366] font-normal">({corrections.length})</span>
        </h3>
        <button
          onClick={clearAllCorrections}
          className="flex items-center gap-1 text-xs text-[#ff3b30] hover:underline"
        >
          <Trash2 className="w-3 h-3" />
          清除全部
        </button>
      </div>

      <div className="space-y-4 max-h-80 overflow-y-auto">
        {Object.entries(groupedCorrections).map(([slug, toolCorrections]) => (
          <div key={slug} className="p-3 rounded-lg bg-[#141416] border border-[#2c2c2e]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-[#f5f5f7] truncate">{slug}</span>
              <span className="text-[10px] text-[#636366]">
                {toolCorrections.length} 项修改
              </span>
            </div>
            
            <div className="space-y-2">
              {toolCorrections.map((correction) => (
                <div
                  key={correction.id}
                  className="flex items-start gap-2 p-2 rounded-lg bg-[#1c1c1e]"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-[#bf5af2]">{getFieldLabel(correction.field)}</span>
                      <span className="text-[#636366]">从</span>
                      <span className="text-[#ff453a] line-through">
                        {formatValue(correction.originalValue)}
                      </span>
                      <span className="text-[#636366]">改为</span>
                      <span className="text-[#30d158] font-medium">
                        {formatValue(correction.correctedValue)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-[#636366] mt-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(correction.timestamp)}
                    </div>
                  </div>
                  <button
                    onClick={() => revertCorrection(correction.id)}
                    className="flex-shrink-0 p-1.5 rounded-md hover:bg-[#2c2c2e] text-[#636366] hover:text-[#ff3b30] transition-colors"
                    title="撤销此修改"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 rounded-lg bg-[#bf5af2]/5 border border-[#bf5af2]/10">
        <div className="flex items-center gap-2 text-xs text-[#bf5af2]">
          <AlertTriangle className="w-3 h-3" />
          <span>所有修改都是临时的，刷新页面后会保留在本地存储中</span>
        </div>
      </div>
    </div>
  );
}
