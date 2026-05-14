'use client';

/**
 * WritebackVisualizationPanel - Palantir Writeback 可视化组件
 * 展示 Writeback 的完整执行流程：Action 触发 → Webhook 接收 → 事务处理 → 数据写入 → 下游通知
 * 支持实时事件流、统计概览、链路追踪、变更 diff 展示
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Activity,
  ChevronRight,
  Zap,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Terminal,
  Radio,
  Webhook,
  Database,
  Send,
  Layers,
  Play,
  Pause,
  BarChart3,
  TrendingUp,
  Hash,
  GitCompare,
  Bell,
} from 'lucide-react';
import { request } from '@/lib/api';

interface WebhookEvent {
  id: string;
  objectType: string;
  objectId: string;
  action: string;
  timestamp: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  changes?: Record<string, { before: unknown; after: unknown }>;
  triggeredBy?: string;
  executionLog?: string[];
  downstreamNotifications?: string[];
  error?: string;
}

interface WritebackStats {
  totalEvents: number;
  pendingEvents: number;
  completedToday: number;
  failedToday: number;
  averageProcessingTime: number;
}

interface WritebackVisualizationPanelProps {
  ontologyRid: string;
  onObjectUpdate?: (objectType: string, objectId: string) => void;
}

const FLOW_STAGES = [
  { key: 'action', label: 'Action 触发', icon: Zap, color: '#ff3b30' },
  { key: 'webhook', label: 'Webhook 接收', icon: Webhook, color: '#bf5af2' },
  { key: 'transaction', label: '事务处理', icon: RefreshCw, color: '#ff9f0a' },
  { key: 'database', label: '数据写入', icon: Database, color: '#30d158' },
  { key: 'notify', label: '下游通知', icon: Bell, color: '#0a84ff' },
];

export function WritebackVisualizationPanel({
  ontologyRid,
  onObjectUpdate,
}: WritebackVisualizationPanelProps) {
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [stats, setStats] = useState<WritebackStats | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<WebhookEvent | null>(null);
  const [isPolling, setIsPolling] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'processing' | 'completed' | 'failed'>('all');
  const [showSimPanel, setShowSimPanel] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logContainerRef.current && selectedEvent?.executionLog) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [selectedEvent?.executionLog]);

  const fetchEvents = useCallback(async () => {
    try {
      const response = await request<{
        data: WebhookEvent[];
        stats: WritebackStats;
      }>('/api/webhooks/events', {
        headers: { 'Cache-Control': 'no-cache' },
      });
      setEvents(response.data || []);
      setStats(response.stats);
    } catch (error) {
      console.error('Failed to fetch webhook events:', error);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
    if (!isPolling) return;
    const interval = setInterval(fetchEvents, 5000);
    return () => clearInterval(interval);
  }, [fetchEvents, isPolling]);

  const simulateWriteback = useCallback(async () => {
    const simulatedEvent: WebhookEvent = {
      id: `wb-${Date.now()}`,
      objectType: 'AIGCTool',
      objectId: `obj-${Math.floor(Math.random() * 1000)}`,
      action: 'UpdateToolRating',
      timestamp: new Date().toISOString(),
      status: 'processing',
      changes: {
        rating: { before: 4.2, after: 4.5 },
        ratingCount: { before: 128, after: 129 },
      },
      triggeredBy: 'RatingSubmissionAction',
      executionLog: [
        `[${new Date().toISOString()}] Webhook 收到事件`,
      ],
      downstreamNotifications: [],
    };

    setEvents((prev) => [simulatedEvent, ...prev]);

    const steps = [
      '验证负载签名',
      '解析变更数据: rating, ratingCount',
      '开始事务处理',
      '更新对象属性: rating 4.2 → 4.5',
      '更新对象属性: ratingCount 128 → 129',
      '提交事务',
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      simulatedEvent.executionLog!.push(`[${new Date().toISOString()}] ${steps[i]}`);
      if (i === steps.length - 2) {
        simulatedEvent.downstreamNotifications = ['HeatCalculationService', 'RankingUpdateService'];
      }
      if (i === steps.length - 1) {
        simulatedEvent.executionLog!.push(`[${new Date().toISOString()}] 通知下游系统 (${simulatedEvent.downstreamNotifications!.length} 个订阅者)`);
        simulatedEvent.status = 'completed';
      }
      setEvents((prev) =>
        prev.map((e) => (e.id === simulatedEvent.id ? { ...simulatedEvent } : e))
      );
      if (selectedEvent?.id === simulatedEvent.id) {
        setSelectedEvent({ ...simulatedEvent });
      }
    }

    onObjectUpdate?.(simulatedEvent.objectType, simulatedEvent.objectId);
  }, [selectedEvent, onObjectUpdate]);

  const filteredEvents = events.filter((event) => {
    if (filter === 'all') return true;
    return event.status === filter;
  });

  const statusConfig: Record<string, { label: string; bg: string; text: string; border: string; icon: React.ElementType }> = {
    pending: { label: '待处理', bg: 'bg-[#ff9f0a]/10', text: 'text-[#ff9f0a]', border: 'border-[#ff9f0a]/20', icon: Clock },
    processing: { label: '处理中', bg: 'bg-[#0a84ff]/10', text: 'text-[#0a84ff]', border: 'border-[#0a84ff]/20', icon: RefreshCw },
    completed: { label: '已完成', bg: 'bg-[#30d158]/10', text: 'text-[#30d158]', border: 'border-[#30d158]/20', icon: CheckCircle2 },
    failed: { label: '失败', bg: 'bg-[#ff453a]/10', text: 'text-[#ff453a]', border: 'border-[#ff453a]/20', icon: XCircle },
  };

  const filterCounts = {
    all: events.length,
    pending: events.filter((e) => e.status === 'pending').length,
    processing: events.filter((e) => e.status === 'processing').length,
    completed: events.filter((e) => e.status === 'completed').length,
    failed: events.filter((e) => e.status === 'failed').length,
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
        <div className="w-10 h-10 rounded-lg bg-[#ff9f0a]/10 flex items-center justify-center">
          <Activity className="w-5 h-5 text-[#ff9f0a]" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-[#f5f5f7]">Writeback 可视化</h3>
          <p className="text-xs text-[#636366]">实时追踪 Writeback 事件，观察数据变更如何传播到下游系统</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#141416] border border-[#2c2c2e] text-xs text-[#8e8e93] cursor-pointer hover:border-[#3a3a3c] transition-colors">
            <div className={`w-2 h-2 rounded-full ${isPolling ? 'bg-[#30d158]' : 'bg-[#636366]'}`} />
            <input
              type="checkbox"
              checked={isPolling}
              onChange={(e) => setIsPolling(e.target.checked)}
              className="hidden"
            />
            {isPolling ? '轮询中' : '已暂停'}
          </label>
          <button
            onClick={() => setShowSimPanel(!showSimPanel)}
            className="px-3 py-1.5 rounded-lg bg-[#141416] border border-[#2c2c2e] text-xs text-[#8e8e93] hover:border-[#3a3a3c] hover:text-[#f5f5f7] transition-all flex items-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5" />
            模拟
          </button>
        </div>
      </div>

      {/* 模拟触发面板 */}
      {showSimPanel && (
        <div className="p-4 rounded-xl bg-[#141416] border border-[#2c2c2e]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-[#ff9f0a]" />
              <span className="text-xs font-medium text-[#636366] uppercase tracking-wider">模拟 Writeback 事件</span>
            </div>
          </div>
          <p className="text-xs text-[#8e8e93] mb-3">
            模拟一个「用户提交评分」的 Writeback 场景：Action 触发 → Webhook 接收 → 事务处理 → 数据写入 → 通知下游
          </p>
          <button
            onClick={simulateWriteback}
            className="px-4 py-2 rounded-lg bg-[#ff9f0a] text-white text-sm font-medium hover:bg-[#ff9f0a]/90 transition-all active:scale-[0.98] flex items-center gap-2 shadow-lg shadow-[#ff9f0a]/20"
          >
            <Play className="w-4 h-4" />
            触发模拟事件
          </button>
        </div>
      )}

      {/* 统计卡片 */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { label: '总事件', value: stats.totalEvents, color: '#8e8e93', icon: Hash },
            { label: '待处理', value: stats.pendingEvents, color: '#ff9f0a', icon: Clock },
            { label: '今日完成', value: stats.completedToday, color: '#30d158', icon: CheckCircle2 },
            { label: '今日失败', value: stats.failedToday, color: '#ff453a', icon: XCircle },
            { label: '平均耗时', value: `${stats.averageProcessingTime}ms`, color: '#0a84ff', icon: TrendingUp },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className="p-3 rounded-xl border transition-all hover:border-[#3a3a3c]"
                style={{
                  backgroundColor: `${card.color}08`,
                  borderColor: `${card.color}20`,
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-3.5 h-3.5" style={{ color: card.color }} />
                  <span className="text-[10px] text-[#636366]">{card.label}</span>
                </div>
                <div className="text-xl font-bold text-[#f5f5f7]">{card.value}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* 流程图 */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-[#ff3b30]/5 via-[#bf5af2]/5 to-[#0a84ff]/5 border border-[#2c2c2e]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#bf5af2]" />
            <span className="text-xs font-medium text-[#636366] uppercase tracking-wider">Writeback 执行流程</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          {FLOW_STAGES.map((stage, i) => {
            const Icon = stage.icon;
            const isLast = i === FLOW_STAGES.length - 1;
            return (
              <React.Fragment key={stage.key}>
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${stage.color}15` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: stage.color }} />
                  </div>
                  <span className="text-[10px] text-[#8e8e93]">{stage.label}</span>
                </div>
                {!isLast && (
                  <ArrowRight className="w-4 h-4 text-[#636366] flex-shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* 事件列表 - 占2列 */}
        <div className="lg:col-span-2">
          <div className="p-4 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e] h-full">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#ff9f0a]" />
                <span className="text-xs font-medium text-[#636366] uppercase tracking-wider">事件流</span>
              </div>
              <div className="flex gap-1">
                {(Object.keys(filterCounts) as Array<keyof typeof filterCounts>).map((key) => {
                  const label = key === 'all' ? '全部' : statusConfig[key]?.label || key;
                  return (
                    <button
                      key={key}
                      onClick={() => setFilter(key)}
                      className={`px-2 py-1 rounded text-[10px] transition-all ${
                        filter === key
                          ? 'bg-[#ff9f0a]/10 text-[#ff9f0a] border border-[#ff9f0a]/20'
                          : 'bg-[#141416] text-[#636366] border border-[#2c2c2e] hover:border-[#3a3a3c]'
                      }`}
                    >
                      {label}
                      <span className="ml-1 text-[#636366]">{filterCounts[key]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
              {filteredEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-[#636366]">
                  <Radio className="w-8 h-8 mb-2 opacity-30" />
                  <p className="text-xs">暂无 Writeback 事件</p>
                  <p className="text-[10px] mt-1">点击「模拟」按钮生成测试事件</p>
                </div>
              ) : (
                filteredEvents.map((event) => {
                  const config = statusConfig[event.status];
                  const isSelected = selectedEvent?.id === event.id;
                  const StatusIcon = config.icon;
                  return (
                    <button
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        isSelected
                          ? 'bg-[#141416] border-[#ff9f0a]/30'
                          : 'bg-[#141416] border-[#2c2c2e] hover:border-[#3a3a3c]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <StatusIcon className={`w-3.5 h-3.5 ${config.text}`} />
                          <span className="text-xs font-medium text-[#f5f5f7]">{event.action}</span>
                        </div>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${config.bg} ${config.text}`}>
                          {config.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-[#636366]">
                        <span>{event.objectType}/{event.objectId}</span>
                        <span>·</span>
                        <span>{new Date(event.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* 事件详情 - 占3列 */}
        <div className="lg:col-span-3">
          {selectedEvent ? (
            <div className="space-y-3">
              {/* 事件头部 */}
              <div className="p-4 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      selectedEvent.status === 'completed' ? 'bg-[#30d158]' :
                      selectedEvent.status === 'failed' ? 'bg-[#ff453a]' :
                      selectedEvent.status === 'processing' ? 'bg-[#0a84ff]' :
                      'bg-[#ff9f0a]'
                    } ${selectedEvent.status === 'processing' ? 'animate-pulse' : ''}`} />
                    <span className="text-sm font-semibold text-[#f5f5f7]">{selectedEvent.action}</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusConfig[selectedEvent.status].bg} ${statusConfig[selectedEvent.status].text}`}>
                    {statusConfig[selectedEvent.status].label}
                  </span>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-[#636366]">对象类型</span>
                    <p className="text-[#f5f5f7] font-medium mt-0.5">{selectedEvent.objectType}</p>
                  </div>
                  <div>
                    <span className="text-[#636366]">对象 ID</span>
                    <p className="text-[#f5f5f7] font-mono mt-0.5">{selectedEvent.objectId}</p>
                  </div>
                  <div>
                    <span className="text-[#636366]">触发者</span>
                    <p className="text-[#f5f5f7] mt-0.5">{selectedEvent.triggeredBy || '-'}</p>
                  </div>
                  <div>
                    <span className="text-[#636366]">时间</span>
                    <p className="text-[#f5f5f7] mt-0.5">{new Date(selectedEvent.timestamp).toLocaleTimeString()}</p>
                  </div>
                </div>
              </div>

              {/* 数据变更 */}
              {selectedEvent.changes && Object.keys(selectedEvent.changes).length > 0 && (
                <div className="p-4 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
                  <div className="flex items-center gap-2 mb-3">
                    <GitCompare className="w-4 h-4 text-[#ff9f0a]" />
                    <span className="text-xs font-medium text-[#636366] uppercase tracking-wider">数据变更</span>
                  </div>
                  <div className="bg-[#0c0c0e] rounded-lg border border-[#2c2c2e] overflow-hidden">
                    {Object.entries(selectedEvent.changes).map(([key, change]) => (
                      <div key={key} className="flex items-center gap-4 px-4 py-3 border-b border-[#2c2c2e] last:border-b-0 text-xs">
                        <span className="text-[#f5f5f7] font-medium w-28 flex-shrink-0">{key}</span>
                        <span className="text-[#ff453a] line-through font-mono">{JSON.stringify(change.before)}</span>
                        <ArrowRight className="w-3 h-3 text-[#636366] flex-shrink-0" />
                        <span className="text-[#30d158] font-mono font-medium">{JSON.stringify(change.after)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 执行日志 */}
              {selectedEvent.executionLog && selectedEvent.executionLog.length > 0 && (
                <div className="p-4 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-[#30d158]" />
                      <span className="text-xs font-medium text-[#636366] uppercase tracking-wider">执行日志</span>
                      {selectedEvent.status === 'processing' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#30d158] animate-pulse" />
                      )}
                    </div>
                    <span className="text-[10px] text-[#636366]">{selectedEvent.executionLog.length} 条</span>
                  </div>
                  <div
                    ref={logContainerRef}
                    className="bg-[#0c0c0e] rounded-lg p-3 font-mono text-xs max-h-64 overflow-y-auto space-y-0.5 border border-[#2c2c2e]"
                  >
                    {selectedEvent.executionLog.map((log, i) => {
                      const isLast = i === selectedEvent.executionLog!.length - 1;
                      return (
                        <div key={i} className={`text-[#8e8e93] ${isLast && selectedEvent.status === 'processing' ? 'animate-pulse text-[#0a84ff]' : ''}`}>
                          {log}
                          {isLast && selectedEvent.status === 'processing' && ' ▊'}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 下游通知 */}
              {selectedEvent.downstreamNotifications && selectedEvent.downstreamNotifications.length > 0 && (
                <div className="p-4 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
                  <div className="flex items-center gap-2 mb-3">
                    <Bell className="w-4 h-4 text-[#bf5af2]" />
                    <span className="text-xs font-medium text-[#636366] uppercase tracking-wider">
                      下游通知 ({selectedEvent.downstreamNotifications.length})
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedEvent.downstreamNotifications.map((service) => (
                      <div
                        key={service}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#bf5af2]/10 border border-[#bf5af2]/20"
                      >
                        <Send className="w-3.5 h-3.5 text-[#bf5af2]" />
                        <span className="text-xs text-[#bf5af2]">{service}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 错误 */}
              {selectedEvent.error && (
                <div className="p-4 rounded-xl bg-[#ff453a]/5 border border-[#ff453a]/10">
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="w-4 h-4 text-[#ff453a]" />
                    <span className="text-xs font-medium text-[#ff453a] uppercase tracking-wider">处理失败</span>
                  </div>
                  <p className="text-xs text-[#ff453a]/80 font-mono">{selectedEvent.error}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e] flex flex-col items-center justify-center min-h-[400px]">
              <div className="w-16 h-16 rounded-2xl bg-[#ff9f0a]/5 flex items-center justify-center mb-4">
                <Activity className="w-8 h-8 text-[#ff9f0a]/30" />
              </div>
              <p className="text-sm text-[#636366]">选择一个事件查看详情</p>
              <p className="text-xs text-[#636366]/60 mt-1">左侧事件流展示所有 Writeback 事件及其处理状态</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default WritebackVisualizationPanel;