/**
 * Cost Calculator Page - LLM API 成本计算器
 *
 * 估算不同 LLM 模型的 API 调用成本
 */

"use client";

import { useState, useEffect } from "react";
import { useCostModels, useCostComparison } from "@/hooks/useCost";
import { Calculator, DollarSign, TrendingUp, BarChart3, Loader2, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// =============================================================================
// Types
// =============================================================================

interface CostEstimate {
  modelId: string;
  modelName: string;
  provider: string;
  inputTokens: number;
  outputTokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
  costPerDay: number;
  costPerMonth: number;
  currency: string;
}

// =============================================================================
// Components
// =============================================================================

function CostCard({ estimate, isCheapest, isMostExpensive }: { estimate: CostEstimate; isCheapest?: boolean; isMostExpensive?: boolean }) {
  return (
    <div className={cn(
      "p-4 rounded-xl border transition-all",
      isCheapest ? "bg-[#30d158]/5 border-[#30d158]/30" :
      isMostExpensive ? "bg-[#ff453a]/5 border-[#ff453a]/30" :
      "bg-[#1c1c1e] border-[#2c2c2e]"
    )}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-medium text-[#f5f5f7]">{estimate.modelName}</h3>
          <p className="text-xs text-[#636366]">{estimate.provider}</p>
        </div>
        {isCheapest && (
          <Badge className="bg-[#30d158]/10 text-[#30d158] text-[10px]">
            最便宜
          </Badge>
        )}
        {isMostExpensive && (
          <Badge className="bg-[#ff453a]/10 text-[#ff453a] text-[10px]">
            最贵
          </Badge>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-[#636366]">输入 Token</span>
          <span className="text-[#f5f5f7]">{estimate.inputTokens.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-[#636366]">输出 Token</span>
          <span className="text-[#f5f5f7]">{estimate.outputTokens.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-[#636366]">单次成本</span>
          <span className="text-[#f5f5f7]">${estimate.totalCost.toFixed(6)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-[#636366]">每日成本</span>
          <span className="text-[#f5f5f7]">${estimate.costPerDay.toFixed(4)}</span>
        </div>
        <div className="pt-2 border-t border-[#2c2c2e]">
          <div className="flex justify-between">
            <span className="text-xs text-[#636366]">每月成本</span>
            <span className={cn(
              "text-sm font-bold",
              isCheapest ? "text-[#30d158]" :
              isMostExpensive ? "text-[#ff453a]" :
              "text-[#f5f5f7]"
            )}>
              ${estimate.costPerMonth.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Main Page
// =============================================================================

export default function CostCalculatorPage() {
  const [inputText, setInputText] = useState("我需要处理大量 PDF 文档，提取关键信息并生成摘要...");
  const [outputTokens, setOutputTokens] = useState([500]);
  const [callsPerDay, setCallsPerDay] = useState([1000]);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [hasCalculated, setHasCalculated] = useState(false);

  // 获取支持的模型
  const { data: models, loading: loadingModels } = useCostModels();

  // 成本对比
  const { data: comparison, loading: loadingComparison, error } = useCostComparison(
    hasCalculated
      ? {
          inputText,
          expectedOutputTokens: outputTokens[0],
          callsPerDay: callsPerDay[0],
          modelIds: selectedModels.length > 0 ? selectedModels : undefined,
        }
      : null
  );

  // 默认选中所有模型
  useEffect(() => {
    if (models && selectedModels.length === 0) {
      setSelectedModels(models.map((m: any) => m.modelId));
    }
  }, [models]);

  const handleCalculate = () => {
    setHasCalculated(true);
  };

  const toggleModel = (modelId: string) => {
    setSelectedModels((prev) =>
      prev.includes(modelId)
        ? prev.filter((id) => id !== modelId)
        : [...prev, modelId]
    );
  };

  return (
    <div className="p-4 lg:p-8 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#30d158]/10 flex items-center justify-center">
            <Calculator className="w-5 h-5 text-[#30d158]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#f5f5f7]">成本计算器</h1>
            <p className="text-sm text-[#636366]">估算不同 LLM 模型的 API 调用成本</p>
          </div>
        </div>
      </div>

      {/* Input Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* 输入参数 */}
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
            <h3 className="text-sm font-medium text-[#f5f5f7] mb-4">输入参数</h3>

            {/* 输入文本 */}
            <div className="mb-4">
              <label className="text-xs text-[#636366] mb-2 block">示例输入文本</label>
              <textarea
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  setHasCalculated(false);
                }}
                className="w-full h-24 p-3 bg-[#141416] border border-[#2c2c2e] rounded-lg text-sm text-[#f5f5f7] placeholder:text-[#636366] focus:outline-none focus:border-[#30d158] resize-none"
              />
            </div>

            {/* 输出 Token */}
            <div className="mb-4">
              <div className="flex justify-between mb-2">
                <label className="text-xs text-[#636366]">预期输出 Token</label>
                <span className="text-xs text-[#f5f5f7]">{outputTokens[0]}</span>
              </div>
              <Slider
                value={outputTokens}
                onValueChange={setOutputTokens}
                max={4000}
                step={100}
              />
            </div>

            {/* 每日调用次数 */}
            <div className="mb-4">
              <div className="flex justify-between mb-2">
                <label className="text-xs text-[#636366]">每日调用次数</label>
                <span className="text-xs text-[#f5f5f7]">{callsPerDay[0]}</span>
              </div>
              <Slider
                value={callsPerDay}
                onValueChange={setCallsPerDay}
                max={10000}
                step={100}
              />
            </div>
          </div>

          {/* 模型选择 */}
          <div className="p-4 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
            <h3 className="text-sm font-medium text-[#f5f5f7] mb-4">选择模型</h3>
            {loadingModels ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-4 h-4 animate-spin text-[#636366]" />
              </div>
            ) : (
              <div className="space-y-2">
                {models?.map((model: any) => (
                  <button
                    key={model.modelId}
                    onClick={() => toggleModel(model.modelId)}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-lg text-sm transition-all",
                      selectedModels.includes(model.modelId)
                        ? "bg-[#30d158]/10 border border-[#30d158]/30"
                        : "bg-[#141416] border border-[#2c2c2e] hover:border-[#3c3c3e]"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-4 h-4 rounded border flex items-center justify-center",
                        selectedModels.includes(model.modelId)
                          ? "bg-[#30d158] border-[#30d158]"
                          : "border-[#636366]"
                      )}>
                        {selectedModels.includes(model.modelId) && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div className="text-left">
                        <div className="text-[#f5f5f7]">{model.name}</div>
                        <div className="text-xs text-[#636366]">{model.provider}</div>
                      </div>
                    </div>
                    <div className="text-xs text-[#636366]">
                      ${model.inputPricePer1M}/${model.outputPricePer1M} per 1M
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 计算按钮 */}
          <Button
            onClick={handleCalculate}
            disabled={selectedModels.length === 0}
            className="w-full"
            size="lg"
          >
            <Calculator className="w-4 h-4 mr-2" />
            计算成本
          </Button>
        </div>

        {/* 结果展示 */}
        <div>
          {hasCalculated ? (
            <div className="space-y-4">
              {loadingComparison ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-[#30d158] mx-auto mb-3" />
                    <p className="text-sm text-[#636366]">计算中...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="p-8 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e] text-center">
                  <p className="text-sm text-[#ff453a]">计算失败: {error}</p>
                </div>
              ) : comparison ? (
                <>
                  {/* 成本对比 */}
                  <div className="p-4 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e] mb-4">
                    <h3 className="text-sm font-medium text-[#f5f5f7] mb-4">成本对比</h3>
                    <div className="space-y-3">
                      {comparison.estimates.map((estimate: CostEstimate) => (
                        <CostCard
                          key={estimate.modelId}
                          estimate={estimate}
                          isCheapest={estimate.modelId === comparison.cheapest?.modelId}
                          isMostExpensive={estimate.modelId === comparison.mostExpensive?.modelId}
                        />
                      ))}
                    </div>
                  </div>

                  {/* 节省提示 */}
                  {comparison.savings.vsMostExpensive > 0 && (
                    <div className="p-4 rounded-xl bg-[#30d158]/5 border border-[#30d158]/30">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-[#30d158]" />
                        <span className="text-sm font-medium text-[#30d158]">节省建议</span>
                      </div>
                      <p className="text-xs text-[#8e8e93]">
                        选择 <span className="text-[#30d158] font-medium">{comparison.cheapest?.modelName}</span> 相比{" "}
                        <span className="text-[#ff453a] font-medium">{comparison.mostExpensive?.modelName}</span>{" "}
                        每月可节省{" "}
                        <span className="text-[#30d158] font-bold">${comparison.savings.vsMostExpensive.toFixed(2)}</span>
                      </p>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          ) : (
            <div className="p-8 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e] text-center">
              <Calculator className="w-12 h-12 text-[#636366] mx-auto mb-4" />
              <h3 className="text-sm font-medium text-[#f5f5f7] mb-2">开始计算</h3>
              <p className="text-xs text-[#636366]">
                设置输入参数并选择模型，然后点击「计算成本」查看结果
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 说明 */}
      <div className="p-4 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
        <div className="flex items-center gap-2 mb-2">
          <Info className="w-4 h-4 text-[#636366]" />
          <h3 className="text-sm font-medium text-[#f5f5f7]">计算说明</h3>
        </div>
        <ul className="space-y-1 text-xs text-[#636366]">
          <li>• Token 估算基于字符数（中文 ≈ 2 字符/token，英文 ≈ 4 字符/token）</li>
          <li>• 实际成本可能因模型版本、地区等因素略有差异</li>
          <li>• 价格数据仅供参考，请以各平台官方定价为准</li>
          <li>• 支持模型：MiniMax、OpenAI GPT、Anthropic Claude</li>
        </ul>
      </div>
    </div>
  );
}
