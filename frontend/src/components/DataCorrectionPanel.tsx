"use client";

import { useState, useEffect } from "react";
import { Pencil, Check, X, RefreshCw, AlertCircle } from "lucide-react";
import { useAppStore, type DataCorrection } from "@/stores/app.store";
import { cn } from "@/lib/utils";

interface DataCorrectionPanelProps {
  slug: string;
  name: string;
  initialData: {
    score?: number;
    rating?: number;
    contextWindow?: number;
    pricingModel?: string;
    [key: string]: any;
  };
  onCorrectionApplied?: () => void;
}

const editableFields = [
  { key: "score", label: "综合得分", type: "number", min: 0, max: 100, step: 0.1 },
  { key: "rating", label: "用户评分", type: "number", min: 0, max: 5, step: 0.1 },
  { key: "contextWindow", label: "上下文窗口", type: "text" },
  { key: "pricingModel", label: "价格模型", type: "select", options: ["Free", "Freemium", "Paid", "Enterprise"] },
];

export function DataCorrectionPanel({ slug, name, initialData, onCorrectionApplied }: DataCorrectionPanelProps) {
  const { applyCorrection, getCorrectedValue, getAllCorrections, clearAllCorrections } = useAppStore();
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [corrections, setCorrections] = useState<DataCorrection[]>([]);

  useEffect(() => {
    setCorrections(getAllCorrections().filter((c) => c.slug === slug));
  }, [getAllCorrections, slug]);

  const getCurrentValue = (field: string) => {
    const corrected = getCorrectedValue(slug, field);
    if (corrected !== null) return corrected;
    return initialData[field];
  };

  const handleStartEdit = (field: string) => {
    setEditingField(field);
    setEditValue(String(getCurrentValue(field) || ""));
  };

  const handleSave = (field: string) => {
    const fieldConfig = editableFields.find((f) => f.key === field);
    if (!fieldConfig) return;

    let correctedValue: any = editValue;
    if (fieldConfig.type === "number") {
      correctedValue = parseFloat(editValue);
      if (isNaN(correctedValue)) {
        alert("请输入有效的数字");
        return;
      }
      if (fieldConfig.min !== undefined && correctedValue < fieldConfig.min) {
        alert(`最小值为 ${fieldConfig.min}`);
        return;
      }
      if (fieldConfig.max !== undefined && correctedValue > fieldConfig.max) {
        alert(`最大值为 ${fieldConfig.max}`);
        return;
      }
    }

    const originalValue = initialData[field];
    applyCorrection(slug, field, originalValue, correctedValue);
    setEditingField(null);
    setEditValue("");
    onCorrectionApplied?.();
  };

  const handleCancel = () => {
    setEditingField(null);
    setEditValue("");
  };

  const hasCorrections = corrections.length > 0;

  return (
    <div className="p-4 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[#f5f5f7] flex items-center gap-2">
          <Pencil className="w-4 h-4 text-[#0a84ff]" />
          数据修正
        </h3>
        {hasCorrections && (
          <button
            onClick={clearAllCorrections}
            className="text-xs text-[#ff3b30] hover:underline"
          >
            清除所有修正
          </button>
        )}
      </div>

      {hasCorrections && (
        <div className="mb-4 p-3 rounded-lg bg-[#0a84ff]/10 border border-[#0a84ff]/20">
          <div className="flex items-center gap-2 mb-1">
            <RefreshCw className="w-3 h-3 text-[#0a84ff]" />
            <span className="text-xs font-medium text-[#0a84ff]">已应用 {corrections.length} 项修正</span>
          </div>
          <p className="text-[10px] text-[#8e8e93]">
            修正后的数据将影响排名计算和热度统计
          </p>
        </div>
      )}

      <div className="space-y-3">
        {editableFields.map((field) => {
          const currentValue = getCurrentValue(field.key);
          const isEditing = editingField === field.key;
          const isCorrected = getCorrectedValue(slug, field.key) !== null;

          return (
            <div key={field.key}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-[#636366]">{field.label}</span>
                {isCorrected && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#30d158]/10 text-[#30d158]">
                    已修正
                  </span>
                )}
              </div>

              {isEditing ? (
                <div className="flex items-center gap-2">
                  {field.type === "select" ? (
                    <select
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg bg-[#141416] border border-[#2c2c2e] text-sm text-[#f5f5f7] focus:outline-none focus:border-[#0a84ff]"
                    >
                      {field.options?.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      min={field.min}
                      max={field.max}
                      step={field.step}
                      className="flex-1 px-3 py-2 rounded-lg bg-[#141416] border border-[#0a84ff] text-sm text-[#f5f5f7] focus:outline-none"
                    />
                  )}
                  <button
                    onClick={() => handleSave(field.key)}
                    className="p-2 rounded-lg bg-[#30d158]/10 text-[#30d158] hover:bg-[#30d158]/20 transition-colors"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleCancel}
                    className="p-2 rounded-lg bg-[#ff3b30]/10 text-[#ff3b30] hover:bg-[#ff3b30]/20 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => handleStartEdit(field.key)}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all",
                    isCorrected
                      ? "bg-[#30d158]/5 border border-[#30d158]/20"
                      : "bg-[#141416] border border-[#2c2c2e] hover:border-[#0a84ff]/50"
                  )}
                >
                  <span className="text-sm text-[#f5f5f7]">
                    {currentValue !== undefined ? String(currentValue) : "—"}
                  </span>
                  <Pencil className="w-4 h-4 text-[#636366] hover:text-[#0a84ff] transition-colors" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!hasCorrections && (
        <div className="mt-4 p-3 rounded-lg bg-[#2c2c2e]/50">
          <div className="flex items-center gap-2 text-xs text-[#636366]">
            <AlertCircle className="w-3 h-3" />
            <span>点击字段即可编辑，修正后的数据将自动影响排名</span>
          </div>
        </div>
      )}
    </div>
  );
}
