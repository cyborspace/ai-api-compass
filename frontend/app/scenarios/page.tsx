/**
 * Scenarios Page - 场景推荐
 * 
 * 允许用户描述使用场景，系统返回推荐的 AI 工具
 * 对应书中第九回实践环节和第十回 AI Agent 部署实战
 */

"use client";

import { useState } from "react";
import { useScenarioRecommendations, usePresetScenarios, useScenarioAnalyzer } from "@/hooks/useRecommendations";
import { PresetScenario } from "@/types/api";
import { Sparkles, Search, Loader2, Wand2, Lightbulb, ChevronRight, Filter, Brain } from "lucide-react";
import { ToolCard } from "@/components/ToolCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

// =============================================================================
// Types
// =============================================================================

interface ConstraintState {
  maxPrice: number | undefined;
  modalities: string[];
  platform: string;
}

// =============================================================================
// Constants
// =============================================================================

const MODALITY_OPTIONS = [
  { value: "text", label: "文本" },
  { value: "image", label: "图像" },
  { value: "audio", label: "音频" },
  { value: "video", label: "视频" },
  { value: "code", label: "代码" },
];

const PLATFORM_OPTIONS = [
  { value: "", label: "不限" },
  { value: "web", label: "Web" },
  { value: "api", label: "API" },
  { value: "desktop", label: "桌面端" },
  { value: "mobile", label: "移动端" },
];

// =============================================================================
// Components
// =============================================================================

/**
 * 预设场景卡片
 */
function PresetScenarioCard({
  scenario,
  onClick,
}: {
  scenario: PresetScenario;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="text-left w-full p-4 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e] hover:border-[#ff3b30]/50 hover:bg-[#2c2c2e] transition-all group"
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#ff3b30]/10 flex items-center justify-center flex-shrink-0">
          <Lightbulb className="w-4 h-4 text-[#ff3b30]" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-[#f5f5f7] group-hover:text-[#ff3b30] transition-colors">
            {scenario.name}
          </h3>
          <p className="text-xs text-[#636366] mt-1 line-clamp-2">{scenario.description}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {(scenario.requiredCapabilities || []).slice(0, 3).map((kw: string, i: number) => (
              <Badge key={`cap-${i}-${kw}`} variant="secondary" className="text-[10px] bg-[#2c2c2e] text-[#8e8e93]">
                {kw}
              </Badge>
            ))}
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-[#636366] group-hover:text-[#ff3b30] transition-colors flex-shrink-0" />
      </div>
    </button>
  );
}

/**
 * 约束条件选择器
 */
function ConstraintSelector({
  constraints,
  onChange,
}: {
  constraints: ConstraintState;
  onChange: (c: ConstraintState) => void;
}) {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="space-y-4">
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="flex items-center gap-2 text-sm text-[#8e8e93] hover:text-[#f5f5f7] transition-colors"
      >
        <Filter className="w-4 h-4" />
        <span>约束条件</span>
        <ChevronRight className={cn("w-3 h-3 transition-transform", showFilters && "rotate-90")} />
      </button>

      {showFilters && (
        <div className="p-4 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e] space-y-4">
          {/* 最高价格 */}
          <div>
            <label className="text-xs text-[#636366] mb-2 block">
              最高月费: {constraints.maxPrice ? `$${constraints.maxPrice}` : "不限"}
            </label>
            <Slider
              value={[constraints.maxPrice || 500]}
              onValueChange={([v]) => onChange({ ...constraints, maxPrice: v === 500 ? undefined : v })}
              max={500}
              step={10}
              className="w-full"
            />
          </div>

          {/* 模态选择 */}
          <div>
            <label className="text-xs text-[#636366] mb-2 block">支持模态</label>
            <div className="flex flex-wrap gap-2">
              {MODALITY_OPTIONS.map((m, i) => (
                <button
                  key={`modality-${i}-${m.value}`}
                  onClick={() => {
                    const newModalities = constraints.modalities.includes(m.value)
                      ? constraints.modalities.filter((x) => x !== m.value)
                      : [...constraints.modalities, m.value];
                    onChange({ ...constraints, modalities: newModalities });
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs transition-colors",
                    constraints.modalities.includes(m.value)
                      ? "bg-[#ff3b30]/10 text-[#ff3b30] border border-[#ff3b30]/30"
                      : "bg-[#2c2c2e] text-[#8e8e93] border border-transparent hover:border-[#3c3c3e]"
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* 平台选择 */}
          <div>
            <label className="text-xs text-[#636366] mb-2 block">平台要求</label>
            <div className="flex flex-wrap gap-2">
              {PLATFORM_OPTIONS.map((p, i) => (
                <button
                  key={`platform-${i}-${p.value}`}
                  onClick={() => onChange({ ...constraints, platform: p.value })}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs transition-colors",
                    constraints.platform === p.value
                      ? "bg-[#ff3b30]/10 text-[#ff3b30] border border-[#ff3b30]/30"
                      : "bg-[#2c2c2e] text-[#8e8e93] border border-transparent hover:border-[#3c3c3e]"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 推荐结果卡片（增强版）
 */
function RecommendationResultCard({
  tool,
  score,
  reasons,
  index,
}: {
  tool: any;
  score: number;
  reasons: string[];
  index: number;
}) {
  return (
    <div className="relative">
      {/* 排名标识 */}
      <div className="absolute -left-3 -top-3 w-6 h-6 rounded-full bg-[#ff3b30] text-white text-xs font-bold flex items-center justify-center z-10">
        {index + 1}
      </div>
      
      <div className="p-4 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e] hover:border-[#ff3b30]/30 transition-all">
        <ToolCard tool={tool} variant="compact" />
        
        {/* 推荐理由 */}
        <div className="mt-3 pt-3 border-t border-[#2c2c2e]">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#ff9f0a]" />
            <span className="text-xs text-[#ff9f0a] font-medium">匹配得分: {(score * 100).toFixed(0)}%</span>
          </div>
          <ul className="space-y-1">
            {reasons.slice(0, 3).map((reason, i) => (
              <li key={`reason-${i}`} className="text-xs text-[#8e8e93] flex items-start gap-1.5">
                <span className="text-[#30d158] mt-0.5">✓</span>
                {reason}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Main Page
// =============================================================================

export default function ScenariosPage() {
  const [scenario, setScenario] = useState("");
  const [constraints, setConstraints] = useState<ConstraintState>({
    maxPrice: undefined,
    modalities: [],
    platform: "",
  });
  const [hasSearched, setHasSearched] = useState(false);
  const [enhanceWithLLM, setEnhanceWithLLM] = useState(false);

  // 预设场景
  const { data: presetScenarios, loading: loadingPresets } = usePresetScenarios();

  // 场景推荐
  const { data: recommendations, loading: loadingRecommendations, error, enhanced, llmUsed } = useScenarioRecommendations(
    hasSearched
      ? {
          scenario,
          constraints: {
            maxPrice: constraints.maxPrice,
            modalities: constraints.modalities.length > 0 ? constraints.modalities : undefined,
            platform: constraints.platform || undefined,
          },
          limit: 10,
          enhanceWithLLM,
        }
      : { scenario: "" }
  );

  // 场景分析
  const { analyze } = useScenarioAnalyzer();
  const [analysis, setAnalysis] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const handleSubmit = async () => {
    if (!scenario.trim()) return;
    setHasSearched(true);
    
    // 同时进行分析（如果启用 LLM，也使用 LLM 分析）
    setAnalyzing(true);
    try {
      const result = await analyze(scenario, undefined, enhanceWithLLM);
      setAnalysis(result);
    } catch (e) {
      console.error("分析失败:", e);
    } finally {
      setAnalyzing(false);
    }
  };

  const handlePresetClick = (preset: { name: string; description: string }) => {
    setScenario(`${preset.name}: ${preset.description}`);
    setHasSearched(false);
    setAnalysis(null);
  };

  return (
    <div className="p-4 lg:p-8 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#ff3b30]/10 flex items-center justify-center">
            <Wand2 className="w-5 h-5 text-[#ff3b30]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#f5f5f7]">场景推荐</h1>
            <p className="text-sm text-[#636366]">描述你的使用场景，AI 为你推荐最合适的工具</p>
          </div>
        </div>
      </div>

      {/* Input Section */}
      <div className="mb-8 space-y-4">
        <div className="relative">
          <textarea
            value={scenario}
            onChange={(e) => {
              setScenario(e.target.value);
              setHasSearched(false);
            }}
            placeholder="例如：我需要处理大量 PDF 文档，提取关键信息并生成摘要，预算每月不超过 50 美元..."
            className="w-full h-32 p-4 pr-14 bg-[#1c1c1e] border border-[#2c2c2e] rounded-xl text-sm text-[#f5f5f7] placeholder:text-[#636366] focus:outline-none focus:border-[#ff3b30] resize-none"
          />
          <button
            onClick={handleSubmit}
            disabled={!scenario.trim() || loadingRecommendations}
            className="absolute right-3 bottom-3 w-10 h-10 rounded-lg bg-[#ff3b30] text-white flex items-center justify-center hover:bg-[#ff3b30]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loadingRecommendations ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* LLM 增强开关 */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setEnhanceWithLLM(!enhanceWithLLM)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all",
              enhanceWithLLM
                ? "bg-[#ff3b30]/10 text-[#ff3b30] border border-[#ff3b30]/30"
                : "bg-[#1c1c1e] text-[#8e8e93] border border-[#2c2c2e] hover:border-[#3c3c3e]"
            )}
          >
            <Brain className="w-4 h-4" />
            <span>AI 增强推荐</span>
            <span className={cn(
              "w-2 h-2 rounded-full",
              enhanceWithLLM ? "bg-[#ff3b30]" : "bg-[#636366]"
            )} />
          </button>
          {enhanceWithLLM && (
            <span className="text-xs text-[#636366]">
              使用 MiniMax LLM 生成个性化推荐理由
            </span>
          )}
        </div>

        {/* 约束条件 */}
        <ConstraintSelector constraints={constraints} onChange={setConstraints} />
      </div>

      {/* 预设场景 */}
      {!hasSearched && (
        <div className="mb-8">
          <h2 className="text-sm font-medium text-[#636366] uppercase tracking-wider mb-4">
            预设场景
          </h2>
          {loadingPresets ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-[#636366]" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {presetScenarios?.map((preset, i) => (
                <PresetScenarioCard
                  key={preset.rid || `preset-${i}`}
                  scenario={preset}
                  onClick={() => handlePresetClick(preset)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 分析结果 */}
      {analyzing && (
        <div className="mb-6 p-4 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
          <div className="flex items-center gap-2 text-sm text-[#8e8e93]">
            <Loader2 className="w-4 h-4 animate-spin" />
            正在分析你的需求...
          </div>
        </div>
      )}

      {analysis && !analyzing && (
        <div className="mb-6 p-4 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
          <h3 className="text-sm font-medium text-[#f5f5f7] mb-3">需求分析</h3>
          <div className="space-y-2">
            {analysis.scenarioName && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-[#ff3b30]/10 text-[#ff3b30]">
                  {analysis.scenarioName}
                </Badge>
                <span className="text-xs text-[#636366]">
                  置信度: {(analysis.confidence * 100).toFixed(0)}%
                </span>
              </div>
            )}
            {analysis.requiredCapabilities && analysis.requiredCapabilities.length > 0 && (
              <div className="flex flex-wrap gap-1">
                <span className="text-xs text-[#636366]">需要能力:</span>
                {analysis.requiredCapabilities.map((cap: string, i: number) => (
                  <Badge key={`acap-${i}-${cap}`} variant="secondary" className="text-[10px] bg-[#2c2c2e]">
                    {cap}
                  </Badge>
                ))}
              </div>
            )}
            {analysis.extractedKeywords && analysis.extractedKeywords.length > 0 && (
              <div className="flex flex-wrap gap-1">
                <span className="text-xs text-[#636366]">关键词:</span>
                {analysis.extractedKeywords.map((kw: string, i: number) => (
                  <Badge key={`akw-${i}-${kw}`} variant="secondary" className="text-[10px] bg-[#2c2c2e]">
                    {kw}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 推荐结果 */}
      {hasSearched && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-medium text-[#636366] uppercase tracking-wider">
                推荐结果
              </h2>
              {llmUsed && (
                <Badge variant="secondary" className="bg-[#ff3b30]/10 text-[#ff3b30] text-[10px]">
                  <Brain className="w-3 h-3 mr-1" />
                  AI 增强
                </Badge>
              )}
            </div>
            {recommendations?.items && (
              <span className="text-xs text-[#636366]">
                共 {recommendations.items.length} 个工具
              </span>
            )}
          </div>

          {loadingRecommendations ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#ff3b30] mx-auto mb-3" />
                <p className="text-sm text-[#636366]">正在为你寻找最合适的工具...</p>
              </div>
            </div>
          ) : error ? (
            <div className="p-8 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e] text-center">
              <p className="text-sm text-[#ff453a]">加载失败: {error}</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setHasSearched(false)}
              >
                重试
              </Button>
            </div>
          ) : recommendations?.items && recommendations.items.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendations.items.map((item, index) => (
                <RecommendationResultCard
                  key={item.tool?.rid || `rec-${index}`}
                  tool={item.tool}
                  score={item.score}
                  reasons={item.reasons}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <div className="p-8 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e] text-center">
              <Sparkles className="w-8 h-8 text-[#636366] mx-auto mb-3" />
              <p className="text-sm text-[#636366]">没有找到匹配的工具，尝试调整描述或约束条件</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
