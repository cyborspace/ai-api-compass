/**
 * Monitoring Page - 性能监控
 */

"use client";

import { useState } from "react";
import { useMonitoring } from "@/hooks/useMonitoring";
import { Activity, Clock, AlertTriangle, TrendingUp, Loader2, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function MetricCard({ title, value, unit, icon: Icon, color }: { title: string; value: string | number; unit?: string; icon: any; color: string }) {
  return (
    <div className="p-4 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={cn("w-4 h-4", color)} />
        <span className="text-xs text-[#636366]">{title}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-[#f5f5f7]">{value}</span>
        {unit && <span className="text-xs text-[#636366]">{unit}</span>}
      </div>
    </div>
  );
}

function SlowQueryCard({ query }: { query: any }) {
  return (
    <div className="p-3 rounded-lg bg-[#1c1c1e] border border-[#2c2c2e]">
      <div className="flex items-center justify-between mb-1">
        <Badge className="bg-[#ff453a]/10 text-[#ff453a] text-[10px]">
          {query.duration}ms
        </Badge>
        <span className="text-xs text-[#636366]">
          {new Date(query.timestamp).toLocaleTimeString()}
        </span>
      </div>
      <p className="text-xs text-[#f5f5f7] font-mono truncate">{query.query}</p>
    </div>
  );
}

export default function MonitoringPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'queries' | 'slow'>('overview');
  const { data, loading, error, refresh } = useMonitoring(activeTab);

  return (
    <div className="p-4 lg:p-8 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#ff9f0a]/10 flex items-center justify-center">
            <Activity className="w-5 h-5 text-[#ff9f0a]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#f5f5f7]">性能监控</h1>
            <p className="text-sm text-[#636366]">监控系统性能指标</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['overview', 'queries', 'slow'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm transition-all",
              activeTab === tab
                ? "bg-[#ff9f0a]/10 text-[#ff9f0a] border border-[#ff9f0a]/30"
                : "bg-[#1c1c1e] text-[#8e8e93] border border-[#2c2c2e] hover:border-[#3c3c3e]"
            )}
          >
            {tab === 'overview' ? '概览' : tab === 'queries' ? '查询统计' : '慢查询'}
          </button>
        ))}
        <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : '刷新'}
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#ff9f0a]" />
        </div>
      ) : error ? (
        <div className="p-8 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e] text-center text-[#ff453a]">
          {error}
        </div>
      ) : data ? (
        <div className="space-y-6">
          {activeTab === 'overview' && (
            <>
              {/* 核心指标 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                  title="API 延迟"
                  value={data.current?.apiLatency?.toFixed(2) || 0}
                  unit="ms"
                  icon={Clock}
                  color="text-[#0a84ff]"
                />
                <MetricCard
                  title="请求数"
                  value={data.current?.queryCount || 0}
                  unit="/min"
                  icon={TrendingUp}
                  color="text-[#30d158]"
                />
                <MetricCard
                  title="错误率"
                  value={((data.current?.errorRate || 0) * 100).toFixed(2)}
                  unit="%"
                  icon={AlertTriangle}
                  color="text-[#ff453a]"
                />
                <MetricCard
                  title="内存使用"
                  value={(data.current?.memoryUsage || 0).toFixed(1)}
                  unit="MB"
                  icon={Database}
                  color="text-[#ff9f0a]"
                />
              </div>

              {/* 历史趋势 */}
              {data.history && data.history.length > 0 && (
                <div className="p-4 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
                  <h3 className="text-sm font-medium text-[#f5f5f7] mb-4">历史趋势</h3>
                  <div className="space-y-2">
                    {data.history.slice(-10).map((m: any, i: number) => (
                      <div key={i} className="flex items-center gap-4 text-xs">
                        <span className="text-[#636366] w-16">
                          {new Date(m.timestamp).toLocaleTimeString()}
                        </span>
                        <div className="flex-1 h-1.5 bg-[#2c2c2e] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#0a84ff] rounded-full"
                            style={{ width: `${Math.min((m.apiLatency / 100) * 100, 100)}%` }}
                          />
                        </div>
                        <span className="text-[#f5f5f7] w-12 text-right">{m.apiLatency.toFixed(1)}ms</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'queries' && (
            <div className="p-4 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
              <h3 className="text-sm font-medium text-[#f5f5f7] mb-4">查询统计</h3>
              {data.length === 0 ? (
                <p className="text-sm text-[#636366] text-center py-8">暂无查询数据</p>
              ) : (
                <div className="space-y-2">
                  {data.map((q: any, i: number) => (
                    <div key={i} className="p-3 rounded-lg bg-[#141416] border border-[#2c2c2e]">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-[#f5f5f7] font-mono truncate">{q.query}</span>
                        <Badge className="text-[10px] bg-[#0a84ff]/10 text-[#0a84ff]">
                          {q.count} 次
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-[#636366]">
                        <span>平均: {q.avgDuration.toFixed(1)}ms</span>
                        <span>最大: {q.maxDuration.toFixed(1)}ms</span>
                        <span>最小: {q.minDuration.toFixed(1)}ms</span>
                        {q.errors > 0 && (
                          <span className="text-[#ff453a]">错误: {q.errors}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'slow' && (
            <div className="p-4 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
              <h3 className="text-sm font-medium text-[#f5f5f7] mb-4">慢查询</h3>
              {data.length === 0 ? (
                <p className="text-sm text-[#636366] text-center py-8">暂无慢查询</p>
              ) : (
                <div className="space-y-2">
                  {data.map((q: any, i: number) => (
                    <SlowQueryCard key={i} query={q} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
