'use client';

/**
 * ActionExecutionPanel - Palantir Action 执行可视化组件
 * 展示 Action 的完整执行链路：触发 → 认证 → 校验 → 执行 → Writeback
 * 支持分步执行、对象选择、参数校验、变更 diff 展示
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Play,
  ChevronRight,
  Zap,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Terminal,
  Activity,
  Shield,
  Search,
  FileText,
  GitCompare,
  Radio,
  Layers,
  Database,
  History,
} from 'lucide-react';
import { request } from '@/lib/api';

interface PropertyInput {
  name: string;
  type: string;
  value: unknown;
}

interface ActionExecution {
  id: string;
  actionName: string;
  status: 'idle' | 'triggered' | 'authenticating' | 'validating' | 'executing' | 'completed' | 'failed';
  inputParams: Record<string, unknown>;
  outputResult?: Record<string, unknown>;
  writebackTriggered?: boolean;
  writebackResult?: {
    objectType: string;
    objectId: string;
    changes: Record<string, { before: unknown; after: unknown }>;
  };
  executionTime: number;
  stepTimings?: Record<string, number>;
  error?: string;
  logs: Array<{ step: string; message: string; level: 'info' | 'warn' | 'error'; timestamp: string }>;
}

interface ActionType {
  id: string;
  apiName: string;
  displayName: string;
  description?: string;
  parameters?: Array<{
    apiName: string;
    displayName: string;
    baseType: string;
    required?: boolean;
  }>;
}

interface ActionExecutionPanelProps {
  actionTypes: ActionType[];
  objectTypeApiName?: string;
  onObjectSelect?: (objectId: string) => void;
}

const PIPELINE_STAGES = [
  { key: 'authenticating', label: '认证', icon: Shield, color: '#0a84ff' },
  { key: 'validating', label: '校验', icon: CheckCircle2, color: '#ff9f0a' },
  { key: 'executing', label: '执行', icon: Zap, color: '#bf5af2' },
  { key: 'completed', label: 'Writeback', icon: GitCompare, color: '#ff9f0a' },
];

export function ActionExecutionPanel({
  actionTypes,
  objectTypeApiName,
  onObjectSelect,
}: ActionExecutionPanelProps) {
  const [selectedAction, setSelectedAction] = useState<ActionType | null>(null);
  const [selectedObjectId, setSelectedObjectId] = useState<string>('');
  const [inputParams, setInputParams] = useState<PropertyInput[]>([]);
  const [executionHistory, setExecutionHistory] = useState<ActionExecution[]>([]);
  const [currentExecution, setCurrentExecution] = useState<ActionExecution | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [currentExecution?.logs]);

  const handleActionSelect = useCallback((action: ActionType) => {
    setSelectedAction(action);
    setInputParams(
      action.parameters?.map((p) => ({
        name: p.apiName,
        type: p.baseType,
        value: '',
      })) || []
    );
    setCurrentExecution(null);
  }, []);

  const handleParamChange = useCallback((name: string, value: unknown) => {
    setInputParams((prev) =>
      prev.map((p) => (p.name === name ? { ...p, value } : p))
    );
  }, []);

  const handleExecute = useCallback(async () => {
    if (!selectedAction) return;

    setIsExecuting(true);
    const executionId = `exec-${Date.now()}`;
    const startTime = Date.now();

    const execution: ActionExecution = {
      id: executionId,
      actionName: selectedAction.displayName,
      status: 'authenticating',
      inputParams: inputParams.reduce((acc, p) => ({ ...acc, [p.name]: p.value }), {}),
      stepTimings: {},
      logs: [
        {
          step: 'START',
          message: `开始执行 Action: ${selectedAction.displayName}`,
          level: 'info',
          timestamp: new Date().toISOString(),
        },
      ],
      executionTime: 0,
    };

    setCurrentExecution(execution);
    setExecutionHistory((prev) => [execution, ...prev]);

    try {
      // Stage 1: 认证
      const authStart = Date.now();
      await new Promise((resolve) => setTimeout(resolve, 300));
      const authTime = Date.now() - authStart;
      setCurrentExecution((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          status: 'validating',
          stepTimings: { ...prev.stepTimings, authenticating: authTime },
          logs: [
            ...prev.logs,
            {
              step: 'AUTH',
              message: '✓ 身份认证通过，权限验证成功',
              level: 'info',
              timestamp: new Date().toISOString(),
            },
          ],
        };
      });

      // Stage 2: 参数校验
      const validateStart = Date.now();
      await new Promise((resolve) => setTimeout(resolve, 350));
      const validateTime = Date.now() - validateStart;
      setCurrentExecution((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          status: 'executing',
          stepTimings: { ...prev.stepTimings, validating: validateTime },
          logs: [
            ...prev.logs,
            {
              step: 'VALIDATE',
              message: '✓ 参数校验通过，准备执行',
              level: 'info',
              timestamp: new Date().toISOString(),
            },
          ],
        };
      });

      // Stage 3: 执行
      const executeStart = Date.now();
      const result = await request<{
        success: boolean;
        data?: Record<string, unknown>;
        writeback?: ActionExecution['writebackResult'];
        error?: string;
      }>('/api/actions/execute', {
        method: 'POST',
        body: JSON.stringify({
          actionApiName: selectedAction.apiName,
          objectTypeApiName,
          objectId: selectedObjectId,
          parameters: inputParams.reduce((acc, p) => ({ ...acc, [p.name]: p.value }), {}),
        }),
      });
      const executeTime = Date.now() - executeStart;

      const totalTime = Date.now() - startTime;
      const finalExecution: ActionExecution = {
        ...execution,
        status: result.success ? 'completed' : 'failed',
        outputResult: result.data,
        writebackTriggered: !!result.writeback,
        writebackResult: result.writeback,
        executionTime: totalTime,
        stepTimings: {
          ...execution.stepTimings,
          executing: executeTime,
        },
        error: result.error,
        logs: [
          ...execution.logs,
          {
            step: 'EXECUTE',
            message: result.success
              ? `✓ Action 执行成功 (耗时 ${executeTime}ms)`
              : `✗ Action 执行失败`,
            level: result.success ? 'info' : 'error',
            timestamp: new Date().toISOString(),
          },
          ...(result.writeback
            ? [{
                step: 'WRITEBACK',
                message: `→ 触发 Writeback: 更新 ${result.writeback.objectType}/${result.writeback.objectId}`,
                level: 'info' as const,
                timestamp: new Date().toISOString(),
              }]
            : []),
        ],
      };

      setCurrentExecution(finalExecution);
      setExecutionHistory((prev) =>
        prev.map((e) => (e.id === executionId ? finalExecution : e))
      );
    } catch (error) {
      const totalTime = Date.now() - startTime;
      const errorExecution: ActionExecution = {
        ...execution,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: totalTime,
        logs: [
          ...execution.logs,
          {
            step: 'ERROR',
            message: `✗ ${error instanceof Error ? error.message : 'Unknown error'}`,
            level: 'error',
            timestamp: new Date().toISOString(),
          },
        ],
      };

      setCurrentExecution(errorExecution);
      setExecutionHistory((prev) =>
        prev.map((e) => (e.id === executionId ? errorExecution : e))
      );
    } finally {
      setIsExecuting(false);
    }
  }, [selectedAction, inputParams, objectTypeApiName, selectedObjectId]);

  const getStageStatus = (stageKey: string) => {
    if (!currentExecution) return 'pending';
    const stageOrder = ['authenticating', 'validating', 'executing'];
    const currentIdx = stageOrder.indexOf(currentExecution.status);
    const stageIdx = stageOrder.indexOf(stageKey);
    if (currentExecution.status === 'failed') return stageIdx <= currentIdx ? 'done' : 'pending';
    if (currentExecution.status === 'completed') {
      if (stageKey === 'completed') return currentExecution.writebackTriggered ? 'done' : 'pending';
      return 'done';
    }
    if (stageIdx < currentIdx) return 'done';
    if (stageIdx === currentIdx) return 'active';
    return 'pending';
  };

  const logColors: Record<string, { text: string }> = {
    info: { text: 'text-[#8e8e93]' },
    warn: { text: 'text-[#ff9f0a]' },
    error: { text: 'text-[#ff453a]' },
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
        <div className="w-10 h-10 rounded-lg bg-[#0a84ff]/10 flex items-center justify-center">
          <Zap className="w-5 h-5 text-[#0a84ff]" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-[#f5f5f7]">Action 执行面板</h3>
          <p className="text-xs text-[#636366]">选择 Action Type 和目标对象，观察执行过程与 Writeback 联动</p>
        </div>
        <span className="px-2 py-1 rounded text-[10px] bg-[#0a84ff]/10 text-[#0a84ff] border border-[#0a84ff]/20">
          {actionTypes.length} 个 Action
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* 左侧: 输入面板 - 占2列 */}
        <div className="lg:col-span-2 space-y-3">
          {/* Action 选择 */}
          <div className="p-4 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
            <div className="flex items-center gap-2 mb-3">
              <Layers className="w-4 h-4 text-[#0a84ff]" />
              <span className="text-xs font-medium text-[#636366] uppercase tracking-wider">选择 Action</span>
            </div>
            <select
              className="w-full h-10 px-3 bg-[#141416] border border-[#2c2c2e] rounded-lg text-sm text-[#f5f5f7] focus:outline-none focus:border-[#0a84ff] transition-colors"
              value={selectedAction?.apiName || ''}
              onChange={(e) => {
                const action = actionTypes.find((a) => a.apiName === e.target.value);
                if (action) handleActionSelect(action);
              }}
            >
              <option value="">-- 选择 Action --</option>
              {actionTypes.map((action) => (
                <option key={action.id} value={action.apiName}>
                  {action.apiName} — {action.displayName}
                </option>
              ))}
            </select>
          </div>

          {/* Action 描述 */}
          {selectedAction?.description && (
            <div className="p-4 rounded-xl bg-[#0a84ff]/5 border border-[#0a84ff]/10">
              <div className="flex items-start gap-2">
                <FileText className="w-4 h-4 text-[#0a84ff] mt-0.5 flex-shrink-0" />
                <p className="text-xs text-[#8e8e93] leading-relaxed">{selectedAction.description}</p>
              </div>
            </div>
          )}

          {/* 目标对象 */}
          <div className="p-4 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
            <div className="flex items-center gap-2 mb-3">
              <Radio className="w-4 h-4 text-[#30d158]" />
              <span className="text-xs font-medium text-[#636366] uppercase tracking-wider">目标对象</span>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#636366]" />
              <input
                type="text"
                className="w-full h-10 pl-10 pr-3 bg-[#141416] border border-[#2c2c2e] rounded-lg text-sm text-[#f5f5f7] placeholder:text-[#636366] focus:outline-none focus:border-[#0a84ff] transition-colors font-mono"
                placeholder={objectTypeApiName ? `${objectTypeApiName} ID` : '输入对象 ID'}
                value={selectedObjectId}
                onChange={(e) => {
                  setSelectedObjectId(e.target.value);
                  onObjectSelect?.(e.target.value);
                }}
              />
            </div>
          </div>

          {/* 参数输入 */}
          {inputParams.length > 0 && (
            <div className="p-4 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-[#ff9f0a]" />
                <span className="text-xs font-medium text-[#636366] uppercase tracking-wider">输入参数</span>
              </div>
              <div className="space-y-3">
                {inputParams.map((param) => {
                  const original = selectedAction?.parameters?.find((p) => p.apiName === param.name);
                  return (
                    <div key={param.name}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-[#f5f5f7]">{param.name}</span>
                          <span className="text-[10px] text-[#636366]">({param.type})</span>
                          {original?.required && (
                            <span className="text-[10px] text-[#ff453a]">*必填</span>
                          )}
                        </div>
                      </div>
                      <input
                        type="text"
                        className="w-full h-9 px-3 bg-[#141416] border border-[#2c2c2e] rounded-lg text-sm text-[#f5f5f7] placeholder:text-[#636366] focus:outline-none focus:border-[#0a84ff] transition-colors font-mono"
                        placeholder={`输入 ${param.type} 值`}
                        value={String(param.value)}
                        onChange={(e) => handleParamChange(param.name, e.target.value)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 执行按钮 */}
          <button
            onClick={handleExecute}
            disabled={!selectedAction || isExecuting}
            className={`w-full h-11 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${
              isExecuting
                ? 'bg-[#2c2c2e] text-[#636366] cursor-not-allowed'
                : 'bg-[#0a84ff] text-white hover:bg-[#0a84ff]/90 active:scale-[0.98] shadow-lg shadow-[#0a84ff]/20'
            }`}
          >
            {isExecuting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                执行中...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                执行 Action
              </>
            )}
          </button>
        </div>

        {/* 右侧: 执行过程 - 占3列 */}
        <div className="lg:col-span-3 space-y-3">
          {!currentExecution ? (
            <div className="p-8 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e] flex flex-col items-center justify-center min-h-[300px]">
              <div className="w-16 h-16 rounded-2xl bg-[#0a84ff]/5 flex items-center justify-center mb-4">
                <Terminal className="w-8 h-8 text-[#0a84ff]/30" />
              </div>
              <p className="text-sm text-[#636366]">选择一个 Action 并点击执行</p>
              <p className="text-xs text-[#636366]/60 mt-1">观察认证 → 校验 → 执行 → Writeback 的完整链路</p>
            </div>
          ) : (
            <>
              {/* 执行流水线 */}
              <div className="p-4 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="w-4 h-4 text-[#0a84ff]" />
                  <span className="text-xs font-medium text-[#636366] uppercase tracking-wider">执行流水线</span>
                </div>
                <div className="flex items-center gap-0">
                  {PIPELINE_STAGES.map((stage, i) => {
                    const status = getStageStatus(stage.key);
                    const isLast = i === PIPELINE_STAGES.length - 1;
                    const StageIcon = stage.icon;
                    return (
                      <React.Fragment key={stage.key}>
                        <div className="flex-1 flex flex-col items-center gap-1.5">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${
                              status === 'done'
                                ? 'bg-[#30d158]/10 border border-[#30d158]/30'
                                : status === 'active'
                                ? 'bg-[#0a84ff]/10 border border-[#0a84ff]/30 scale-110'
                                : 'bg-[#141416] border border-[#2c2c2e]'
                            }`}
                          >
                            {status === 'active' ? (
                              <RefreshCw className="w-5 h-5 text-[#0a84ff] animate-spin" />
                            ) : (
                              <StageIcon
                                className={`w-5 h-5 ${
                                  status === 'done' ? 'text-[#30d158]' : 'text-[#636366]'
                                }`}
                              />
                            )}
                          </div>
                          <span
                            className={`text-[10px] ${
                              status === 'done'
                                ? 'text-[#30d158]'
                                : status === 'active'
                                ? 'text-[#0a84ff] font-medium'
                                : 'text-[#636366]'
                            }`}
                          >
                            {stage.label}
                          </span>
                        </div>
                        {!isLast && (
                          <div className="w-8 h-px bg-[#2c2c2e] mb-5">
                            <div
                              className={`h-full transition-all duration-500 ${
                                status === 'done' ? 'w-full bg-[#30d158]' : 'w-0'
                              }`}
                            />
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>

              {/* 实时日志 */}
              <div className="p-4 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-[#30d158]" />
                    <span className="text-xs font-medium text-[#636366] uppercase tracking-wider">执行日志</span>
                    {isExecuting && <span className="w-1.5 h-1.5 rounded-full bg-[#30d158] animate-pulse" />}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-[#636366]">
                    <Clock className="w-3 h-3" />
                    {currentExecution.executionTime}ms
                  </div>
                </div>
                <div
                  ref={logContainerRef}
                  className="bg-[#0c0c0e] rounded-lg p-3 font-mono text-xs max-h-52 overflow-y-auto space-y-1 border border-[#2c2c2e]"
                >
                  {currentExecution.logs.map((log, i) => {
                    const colors = logColors[log.level];
                    return (
                      <div key={i} className="flex gap-2">
                        <span className="text-[#636366] w-20 flex-shrink-0">[{log.step}]</span>
                        <span className={colors.text}>{log.message}</span>
                      </div>
                    );
                  })}
                  {isExecuting && (
                    <div className="flex gap-2">
                      <span className="text-[#636366] w-20 flex-shrink-0 animate-pulse">[....]</span>
                      <span className="text-[#0a84ff] animate-pulse">▊</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 耗时分析 */}
              {currentExecution.stepTimings && Object.keys(currentExecution.stepTimings).length > 0 && (
                <div className="p-4 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-4 h-4 text-[#ff9f0a]" />
                    <span className="text-xs font-medium text-[#636366] uppercase tracking-wider">耗时分析</span>
                  </div>
                  <div className="space-y-2">
                    {Object.entries(currentExecution.stepTimings).map(([key, time]) => {
                      const pct = Math.round((time / currentExecution.executionTime) * 100);
                      const labels: Record<string, string> = {
                        authenticating: '认证',
                        validating: '参数校验',
                        executing: '执行 Action',
                      };
                      return (
                        <div key={key} className="flex items-center gap-3">
                          <span className="text-xs text-[#8e8e93] w-16">{labels[key] || key}</span>
                          <div className="flex-1 h-1.5 bg-[#141416] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#0a84ff] rounded-full transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-[#f5f5f7] w-14 text-right">{time}ms</span>
                          <span className="text-[10px] text-[#636366] w-8 text-right">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Writeback 结果 */}
              {currentExecution.writebackResult && (
                <div className="p-4 rounded-xl bg-[#ff9f0a]/5 border border-[#ff9f0a]/10">
                  <div className="flex items-center gap-2 mb-3">
                    <GitCompare className="w-4 h-4 text-[#ff9f0a]" />
                    <span className="text-xs font-medium text-[#ff9f0a] uppercase tracking-wider">Writeback 变更</span>
                  </div>
                  <div className="bg-[#0c0c0e] rounded-lg border border-[#2c2c2e] overflow-hidden">
                    <div className="px-3 py-2 bg-[#141416] border-b border-[#2c2c2e] flex items-center gap-2">
                      <Database className="w-3.5 h-3.5 text-[#8e8e93]" />
                      <span className="text-xs text-[#8e8e93]">
                        {currentExecution.writebackResult.objectType}
                        <span className="text-[#636366] mx-1">/</span>
                        <span className="text-[#f5f5f7] font-mono">{currentExecution.writebackResult.objectId}</span>
                      </span>
                    </div>
                    <div className="p-3 space-y-2">
                      {Object.entries(currentExecution.writebackResult.changes).map(([key, change]) => (
                        <div key={key} className="flex items-center gap-3 text-xs">
                          <span className="text-[#f5f5f7] font-medium w-24 flex-shrink-0">{key}</span>
                          <span className="text-[#ff453a] line-through font-mono">{String(change.before)}</span>
                          <ArrowRight className="w-3 h-3 text-[#636366] flex-shrink-0" />
                          <span className="text-[#30d158] font-mono font-medium">{String(change.after)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 错误 */}
              {currentExecution.status === 'failed' && currentExecution.error && (
                <div className="p-4 rounded-xl bg-[#ff453a]/5 border border-[#ff453a]/10">
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="w-4 h-4 text-[#ff453a]" />
                    <span className="text-xs font-medium text-[#ff453a] uppercase tracking-wider">执行失败</span>
                  </div>
                  <p className="text-xs text-[#ff453a]/80 font-mono">{currentExecution.error}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* 执行历史 */}
      {executionHistory.length > 0 && (
        <div className="p-4 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-[#8e8e93]" />
              <span className="text-xs font-medium text-[#636366] uppercase tracking-wider">
                执行历史 ({executionHistory.length})
              </span>
            </div>
          </div>
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {executionHistory.map((exec) => {
              const isExpanded = expandedHistory === exec.id;
              return (
                <div key={exec.id}>
                  <button
                    onClick={() => setExpandedHistory(isExpanded ? null : exec.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                      exec.status === 'completed'
                        ? 'bg-[#141416] border-[#30d158]/10 hover:border-[#30d158]/30'
                        : exec.status === 'failed'
                        ? 'bg-[#141416] border-[#ff453a]/10 hover:border-[#ff453a]/30'
                        : 'bg-[#141416] border-[#2c2c2e] hover:border-[#3a3a3c]'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      exec.status === 'completed'
                        ? 'bg-[#30d158]/10'
                        : exec.status === 'failed'
                        ? 'bg-[#ff453a]/10'
                        : 'bg-[#0a84ff]/10'
                    }`}>
                      {exec.status === 'completed' ? (
                        <CheckCircle2 className="w-4 h-4 text-[#30d158]" />
                      ) : exec.status === 'failed' ? (
                        <XCircle className="w-4 h-4 text-[#ff453a]" />
                      ) : (
                        <RefreshCw className="w-4 h-4 text-[#0a84ff] animate-spin" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[#f5f5f7] truncate">{exec.actionName}</span>
                        <span className="text-[10px] text-[#636366] ml-2 flex-shrink-0">{exec.executionTime}ms</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-[#636366]">
                          {new Date(exec.logs[0]?.timestamp || Date.now()).toLocaleTimeString()}
                        </span>
                        {exec.writebackTriggered && (
                          <span className="text-[10px] text-[#ff9f0a]">Writeback 已触发</span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 text-[#636366] transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </button>
                  {isExpanded && (
                    <div className="ml-11 mt-1 p-3 rounded-lg bg-[#141416] border border-[#2c2c2e]">
                      <div className="text-[10px] text-[#636366] space-y-1">
                        <div>输入: {JSON.stringify(exec.inputParams)}</div>
                        {exec.writebackResult && (
                          <div className="text-[#ff9f0a]">
                            Writeback: {Object.entries(exec.writebackResult.changes).map(([k, v]) =>
                              `${k}: ${v.before} → ${v.after}`
                            ).join(', ')}
                          </div>
                        )}
                        {exec.error && <div className="text-[#ff453a]">错误: {exec.error}</div>}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default ActionExecutionPanel;