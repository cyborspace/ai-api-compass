/**
 * Data Quality Page - 数据质量检查
 */

"use client";

import { useState } from "react";
import { useDataQuality } from "@/hooks/useDataQuality";
import { Shield, AlertTriangle, CheckCircle, XCircle, Info, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function QualityScoreCard({ title, score, icon: Icon }: { title: string; score: number; icon: any }) {
  const getColor = (s: number) => {
    if (s >= 90) return "text-[#30d158]";
    if (s >= 70) return "text-[#ff9f0a]";
    return "text-[#ff453a]";
  };

  const getBgColor = (s: number) => {
    if (s >= 90) return "bg-[#30d158]/10 border-[#30d158]/30";
    if (s >= 70) return "bg-[#ff9f0a]/10 border-[#ff9f0a]/30";
    return "bg-[#ff453a]/10 border-[#ff453a]/30";
  };

  return (
    <div className={cn("p-4 rounded-xl border", getBgColor(score))}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className={cn("w-4 h-4", getColor(score))} />
          <span className="text-sm text-[#f5f5f7]">{title}</span>
        </div>
        <span className={cn("text-lg font-bold", getColor(score))}>{score}</span>
      </div>
      <div className="w-full h-1.5 bg-[#2c2c2e] rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", 
            score >= 90 ? "bg-[#30d158]" : score >= 70 ? "bg-[#ff9f0a]" : "bg-[#ff453a]"
          )}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

function IssueCard({ issue }: { issue: any }) {
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error': return <XCircle className="w-4 h-4 text-[#ff453a]" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-[#ff9f0a]" />;
      default: return <Info className="w-4 h-4 text-[#0a84ff]" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error': return "bg-[#ff453a]/10 text-[#ff453a] border-[#ff453a]/30";
      case 'warning': return "bg-[#ff9f0a]/10 text-[#ff9f0a] border-[#ff9f0a]/30";
      default: return "bg-[#0a84ff]/10 text-[#0a84ff] border-[#0a84ff]/30";
    }
  };

  return (
    <div className="p-3 rounded-lg bg-[#1c1c1e] border border-[#2c2c2e]">
      <div className="flex items-start gap-3">
        {getSeverityIcon(issue.severity)}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge className={cn("text-[10px]", getSeverityColor(issue.severity))}>
              {issue.severity}
            </Badge>
            <span className="text-xs text-[#636366]">{issue.type}</span>
          </div>
          <p className="text-sm text-[#f5f5f7]">{issue.message}</p>
          {issue.suggestion && (
            <p className="text-xs text-[#636366] mt-1">建议: {issue.suggestion}</p>
          )}
          <p className="text-xs text-[#636366] mt-1">对象: {issue.object}</p>
        </div>
      </div>
    </div>
  );
}

export default function DataQualityPage() {
  const [activeTab, setActiveTab] = useState<'overall' | 'tools' | 'reviews'>('overall');
  const { data, loading, error, refresh } = useDataQuality(activeTab);

  return (
    <div className="p-4 lg:p-8 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#0a84ff]/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-[#0a84ff]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#f5f5f7]">数据质量</h1>
            <p className="text-sm text-[#636366]">检查 Ontology 数据质量</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['overall', 'tools', 'reviews'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm transition-all",
              activeTab === tab
                ? "bg-[#0a84ff]/10 text-[#0a84ff] border border-[#0a84ff]/30"
                : "bg-[#1c1c1e] text-[#8e8e93] border border-[#2c2c2e] hover:border-[#3c3c3e]"
            )}
          >
            {tab === 'overall' ? '总体' : tab === 'tools' ? '工具' : '评价'}
          </button>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={refresh}
          disabled={loading}
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : '刷新'}
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#0a84ff] mx-auto mb-3" />
            <p className="text-sm text-[#636366]">检查中...</p>
          </div>
        </div>
      ) : error ? (
        <div className="p-8 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e] text-center">
          <p className="text-sm text-[#ff453a]">检查失败: {error}</p>
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* 总体评分 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <QualityScoreCard
              title="总体评分"
              score={data.score}
              icon={Shield}
            />
            <QualityScoreCard
              title="完整性"
              score={data.breakdown.completeness}
              icon={CheckCircle}
            />
            <QualityScoreCard
              title="准确性"
              score={data.breakdown.accuracy}
              icon={AlertTriangle}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <QualityScoreCard
              title="一致性"
              score={data.breakdown.consistency}
              icon={CheckCircle}
            />
            <QualityScoreCard
              title="唯一性"
              score={data.breakdown.uniqueness}
              icon={CheckCircle}
            />
            <QualityScoreCard
              title="有效性"
              score={data.breakdown.validity}
              icon={CheckCircle}
            />
          </div>

          {/* 统计信息 */}
          <div className="p-4 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-xs text-[#636366]">总对象数</span>
                  <p className="text-lg font-bold text-[#f5f5f7]">{data.totalObjects}</p>
                </div>
                <div>
                  <span className="text-xs text-[#636366]">问题数</span>
                  <p className="text-lg font-bold text-[#ff453a]">{data.issues.length}</p>
                </div>
                <div>
                  <span className="text-xs text-[#636366]">问题率</span>
                  <p className="text-lg font-bold text-[#ff9f0a]">{(data.issueRate * 100).toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* 问题列表 */}
          {data.issues.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-[#f5f5f7] mb-4">问题列表</h3>
              <div className="space-y-2">
                {data.issues.map((issue: any, index: number) => (
                  <IssueCard key={index} issue={issue} />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
