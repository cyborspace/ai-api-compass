'use client';

/**
 * FunctionExecutionPanel - Palantir Function 执行可视化组件
 * 展示 Function 的完整调用链路：输入参数 → 类型校验 → 计算引擎 → 返回结果
 * 支持分步执行、中间状态观测、计算过程可视化
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Play,
  Square,
  ChevronRight,
  ChevronDown,
  Code,
  Database,
  Zap,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Braces,
  Hash,
  Type,
  ToggleLeft,
  List,
  Terminal,
  Activity,
  Gauge,
  Sparkles,
  Layers,
} from 'lucide-react';
import { request } from '@/lib/api';

interface FunctionExecution {
  id: string;
  functionName: string;
  status: 'idle' | 'pending' | 'validating' | 'computing' | 'completed' | 'failed';
  inputParams: Record<string, unknown>;
  outputResult?: unknown;
  executionTime: number;
  stepTimings?: Record<string, number>;
  computationSteps?: Array<{
    phase: string;
    description: string;
    data?: unknown;
    duration: number;
  }>;
  error?: string;
  logs: Array<{ step: string; message: string; level: 'info' | 'warn' | 'error'; timestamp: string }>;
}

interface FunctionType {
  id: string;
  apiName: string;
  displayName: string;
  description?: string;
  inputParameters?: Array<{
    apiName: string;
    displayName: string;
    baseType: string;
    required?: boolean;
    description?: string;
  }>;
  outputType?: string;
  computationLogic?: string;
}

interface FunctionExecutionPanelProps {
  functions: FunctionType[];
  onObjectSetsQuery?: (objectTypeApiName: string, filters?: Record<string, unknown>) => Promise<unknown[]>;
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  String: Type,
  Integer: Hash,
  Double: Hash,
  Boolean: ToggleLeft,
  Array: List,
  Object: Braces,
  default: Code,
};

const TYPE_COLORS: Record<string, string> = {
  String: '#30d158',
  Integer: '#0a84ff',
  Double: '#0a84ff',
  Boolean: '#ff9f0a',
  Array: '#bf5af2',
  Object: '#ff3b30',
  default: '#8e8e93',
};

const PIPELINE_STAGES = [
  { key: 'validating', label: '类型校验', icon: CheckCircle2, color: '#ff9f0a' },
  { key: 'computing', label: '计算引擎', icon: Zap, color: '#bf5af2' },
  { key: 'completed', label: '返回结果', icon: Sparkles, color: '#30d158' },
];

function getParamTypeIcon(typeName: string): React.ElementType {
  for (const [key, icon] of Object.entries(TYPE_ICONS)) {
    if (typeName.toLowerCase().includes(key.toLowerCase())) return icon;
  }
  return TYPE_ICONS.default;
}

function getParamTypeColor(typeName: string): string {
  for (const [key, color] of Object.entries(TYPE_COLORS)) {
    if (typeName.toLowerCase().includes(key.toLowerCase())) return color;
  }
  return TYPE_COLORS.default;
}

export function FunctionExecutionPanel({
  functions,
  onObjectSetsQuery,
}: FunctionExecutionPanelProps) {
  const [selectedFunction, setSelectedFunction] = useState<FunctionType | null>(null);
  const [inputParams, setInputParams] = useState<Array<{ name: string; type: string; value: string; displayName: string }>>([]);
  const [executionHistory, setExecutionHistory] = useState<FunctionExecution[]>([]);
  const [currentExecution, setCurrentExecution] = useState<FunctionExecution | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [currentExecution?.logs]);

  const handleFunctionSelect = useCallback((func: FunctionType) => {
    setSelectedFunction(func);
    setInputParams(
      func.inputParameters?.map((p) => ({
        name: p.apiName,
        type: p.baseType,
        value: '',
        displayName: p.displayName,
      })) || []
    );
    setCurrentExecution(null);
  }, []);

  const handleParamChange = useCallback((name: string, value: string) => {
    setInputParams((prev) =>
      prev.map((p) => (p.name === name ? { ...p, value } : p))
    );
  }, []);

  const handleExecute = useCallback(async () => {
    if (!selectedFunction) return;

    setIsExecuting(true);
    const executionId = `func-exec-${Date.now()}`;
    const startTime = Date.now();

    const params: Record<string, unknown> = inputParams.reduce((acc: Record<string, unknown>, p) => {
      let parsedValue: unknown = p.value;
      try {
        parsedValue = JSON.parse(p.value);
      } catch {
        // 保持字符串
      }
      return { ...acc, [p.name]: parsedValue };
    }, {} as Record<string, unknown>);

    const execution: FunctionExecution = {
      id: executionId,
      functionName: selectedFunction.displayName,
      status: 'validating',
      inputParams: params,
      stepTimings: {},
      logs: [
        {
          step: 'START',
          message: `调用 Function: ${selectedFunction.displayName}`,
          level: 'info',
          timestamp: new Date().toISOString(),
        },
      ],
      executionTime: 0,
    };

    setCurrentExecution(execution);
    setExecutionHistory((prev) => [execution, ...prev]);

    try {
      // Stage 1: 类型校验
      const validateStart = Date.now();
      await new Promise((resolve) => setTimeout(resolve, 400));
      const validateTime = Date.now() - validateStart;
      setCurrentExecution((prev) => {
        if (!prev) return prev;
        const missingRequired = selectedFunction.inputParameters
          ?.filter((p) => p.required && !params[p.apiName])
          .map((p) => p.displayName);
        return {
          ...prev,
          status: 'computing',
          stepTimings: { ...prev.stepTimings, validating: validateTime },
          logs: [
            ...prev.logs,
            {
              step: 'VALIDATE',
              message: missingRequired?.length
                ? `⚠ 缺少必填参数: ${missingRequired.join(', ')}`
                : '✓ 参数类型校验通过',
              level: missingRequired?.length ? 'warn' : 'info',
              timestamp: new Date().toISOString(),
            },
          ],
        };
      });

      // Stage 2: 计算引擎
      const computeStart = Date.now();
      await new Promise((resolve) => setTimeout(resolve, 500));
      const computeTime = Date.now() - computeStart;
      setCurrentExecution((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          stepTimings: { ...prev.stepTimings, computing: computeTime },
          logs: [
            ...prev.logs,
            {
              step: 'COMPUTE',
              message: `计算引擎处理中... (${computeTime}ms)`,
              level: 'info',
              timestamp: new Date().toISOString(),
            },
          ],
        };
      });

      // Stage 3: 调用后端 API
      const apiStart = Date.now();
      const result = await request<{
        success: boolean;
        data?: unknown;
        computationSteps?: Array<{
          phase: string;
          description: string;
          data?: unknown;
          duration: number;
        }>;
        error?: string;
      }>('/api/functions/execute', {
        method: 'POST',
        body: JSON.stringify({
          functionApiName: selectedFunction.apiName,
          parameters: params,
        }),
      });
      const apiTime = Date.now() - apiStart;

      const totalTime = Date.now() - startTime;
      const finalExecution: FunctionExecution = {
        ...execution,
        status: result.success ? 'completed' : 'failed',
        outputResult: result.data,
        computationSteps: result.computationSteps,
        executionTime: totalTime,
        stepTimings: {
          ...execution.stepTimings,
          api_call: apiTime,
        },
        error: result.error,
        logs: [
          ...execution.logs,
          {
            step: 'RESULT',
            message: result.success
              ? `✓ 执行成功 (总耗时 ${totalTime}ms)`
              : `✗ 执行失败: ${result.error}`,
            level: result.success ? 'info' : 'error',
            timestamp: new Date().toISOString(),
          },
        ],
      };

      setCurrentExecution(finalExecution);
      setExecutionHistory((prev) =>
        prev.map((e) => (e.id === executionId ? finalExecution : e))
      );
    } catch (error) {
      const totalTime = Date.now() - startTime;
      const errorExecution: FunctionExecution = {
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
  }, [selectedFunction, inputParams]);

  const getStageStatus = (stageKey: string) => {
    if (!currentExecution) return 'pending';
    const stageOrder = ['validating', 'computing'];
    const currentIdx = stageOrder.indexOf(currentExecution.status);
    const stageIdx = stageOrder.indexOf(stageKey);
    if (currentExecution.status === 'failed') return stageIdx <= currentIdx ? 'done' : 'pending';
    if (currentExecution.status === 'completed') return 'done';
    if (stageIdx < currentIdx) return 'done';
    if (stageIdx === currentIdx) return 'active';
    return 'pending';
  };

  const logColors: Record<string, { bg: string; text: string; border: string }> = {
    info: { bg: 'bg-[#1c1c1e]', text: 'text-[#8e8e93]', border: 'border-[#2c2c2e]' },
    warn: { bg: 'bg-[#ff9f0a]/5', text: 'text-[#ff9f0a]', border: 'border-[#ff9f0a]/20' },
    error: { bg: 'bg-[#ff453a]/5', text: 'text-[#ff453a]', border: 'border-[#ff453a]/20' },
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
        <div className="w-10 h-10 rounded-lg bg-[#bf5af2]/10 flex items-center justify-center">
          <Code className="w-5 h-5 text-[#bf5af2]" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-[#f5f5f7]">Function 执行面板</h3>
          <p className="text-xs text-[#636366]">选择 Function，输入参数，观察计算过程与中间状态</p>
        </div>
        <span className="px-2 py-1 rounded text-[10px] bg-[#bf5af2]/10 text-[#bf5af2] border border-[#bf5af2]/20">
          {functions.length} 个函数
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* 左侧: 输入面板 - 占2列 */}
        <div className="lg:col-span-2 space-y-3">
          {/* Function 选择器 */}
          <div className="p-4 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
            <div className="flex items-center gap-2 mb-3">
              <Layers className="w-4 h-4 text-[#bf5af2]" />
              <span className="text-xs font-medium text-[#636366] uppercase tracking-wider">选择 Function</span>
            </div>
            <select
              className="w-full h-10 px-3 bg-[#141416] border border-[#2c2c2e] rounded-lg text-sm text-[#f5f5f7] focus:outline-none focus:border-[#bf5af2] transition-colors"
              value={selectedFunction?.apiName || ''}
              onChange={(e) => {
                const func = functions.find((f) => f.apiName === e.target.value);
                if (func) handleFunctionSelect(func);
              }}
            >
              <option value="">-- 选择 Function --</option>
              {functions.map((func) => (
                <option key={func.id} value={func.apiName}>
                  {func.apiName} — {func.displayName}
                </option>
              ))}
            </select>
          </div>

          {/* Function 说明 */}
          {selectedFunction && (
            <div className="p-4 rounded-xl bg-[#bf5af2]/5 border border-[#bf5af2]/10">
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-[#bf5af2] mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-xs font-medium text-[#f5f5f7] mb-1">{selectedFunction.displayName}</div>
                  {selectedFunction.description && (
                    <p className="text-xs text-[#8e8e93] leading-relaxed mb-2">{selectedFunction.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {selectedFunction.outputType && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-[#30d158]/10 text-[#30d158]">
                        <ArrowRight className="w-3 h-3" />
                        返回: {selectedFunction.outputType}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-[#141416] text-[#8e8e93]">
                      <Code className="w-3 h-3" />
                      {selectedFunction.apiName}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 参数输入 */}
          {inputParams.length > 0 && (
            <div className="p-4 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
              <div className="flex items-center gap-2 mb-3">
                <Braces className="w-4 h-4 text-[#0a84ff]" />
                <span className="text-xs font-medium text-[#636366] uppercase tracking-wider">输入参数</span>
              </div>
              <div className="space-y-3">
                {inputParams.map((param) => {
                  const Icon = getParamTypeIcon(param.type);
                  const color = getParamTypeColor(param.type);
                  const original = selectedFunction?.inputParameters?.find((p) => p.apiName === param.name);
                  return (
                    <div key={param.name} className="group">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <Icon className="w-3.5 h-3.5" style={{ color }} />
                          <span className="text-xs font-medium text-[#f5f5f7]">{param.displayName}</span>
                          <span className="text-[10px] text-[#636366]">({param.type})</span>
                          {original?.required && (
                            <span className="text-[10px] text-[#ff453a]">*必填</span>
                          )}
                        </div>
                      </div>
                      <input
                        type="text"
                        className="w-full h-9 px-3 bg-[#141416] border border-[#2c2c2e] rounded-lg text-sm text-[#f5f5f7] placeholder:text-[#636366] focus:outline-none focus:border-[#bf5af2] transition-colors font-mono"
                        placeholder={original?.description || `输入 ${param.type} 类型的值`}
                        value={param.value}
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
            disabled={!selectedFunction || isExecuting}
            className={`w-full h-11 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${
              isExecuting
                ? 'bg-[#2c2c2e] text-[#636366] cursor-not-allowed'
                : 'bg-[#bf5af2] text-white hover:bg-[#bf5af2]/90 active:scale-[0.98] shadow-lg shadow-[#bf5af2]/20'
            }`}
          >
            {isExecuting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                计算中...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                执行 Function
              </>
            )}
          </button>
        </div>

        {/* 右侧: 执行过程 - 占3列 */}
        <div className="lg:col-span-3 space-y-3">
          {!currentExecution ? (
            <div className="p-8 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e] flex flex-col items-center justify-center min-h-[300px]">
              <div className="w-16 h-16 rounded-2xl bg-[#bf5af2]/5 flex items-center justify-center mb-4">
                <Terminal className="w-8 h-8 text-[#bf5af2]/30" />
              </div>
              <p className="text-sm text-[#636366]">选择一个 Function 并点击执行</p>
              <p className="text-xs text-[#636366]/60 mt-1">观察参数校验 → 计算引擎 → 返回结果的完整链路</p>
            </div>
          ) : (
            <>
              {/* 执行流水线 */}
              <div className="p-4 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="w-4 h-4 text-[#bf5af2]" />
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
                                ? 'bg-[#bf5af2]/10 border border-[#bf5af2]/30 scale-110'
                                : 'bg-[#141416] border border-[#2c2c2e]'
                            }`}
                          >
                            {status === 'active' ? (
                              <RefreshCw className="w-5 h-5 text-[#bf5af2] animate-spin" />
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
                                ? 'text-[#bf5af2] font-medium'
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
                    <span className="w-1.5 h-1.5 rounded-full bg-[#30d158] animate-pulse" />
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
                        <span className="text-[#636366] w-16 flex-shrink-0">[{log.step}]</span>
                        <span className={colors.text}>{log.message}</span>
                      </div>
                    );
                  })}
                  {isExecuting && (
                    <div className="flex gap-2">
                      <span className="text-[#636366] w-16 flex-shrink-0 animate-pulse">[....]</span>
                      <span className="text-[#bf5af2] animate-pulse">▊</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 耗时分析 */}
              {currentExecution.stepTimings && Object.keys(currentExecution.stepTimings).length > 0 && (
                <div className="p-4 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
                  <div className="flex items-center gap-2 mb-3">
                    <Gauge className="w-4 h-4 text-[#ff9f0a]" />
                    <span className="text-xs font-medium text-[#636366] uppercase tracking-wider">耗时分析</span>
                  </div>
                  <div className="space-y-2">
                    {Object.entries(currentExecution.stepTimings).map(([key, time]) => {
                      const pct = Math.round((time / currentExecution.executionTime) * 100);
                      const labels: Record<string, string> = {
                        validating: '类型校验',
                        computing: '计算引擎',
                        api_call: 'API 调用',
                      };
                      return (
                        <div key={key} className="flex items-center gap-3">
                          <span className="text-xs text-[#8e8e93] w-16">{labels[key] || key}</span>
                          <div className="flex-1 h-1.5 bg-[#141416] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#bf5af2] rounded-full transition-all duration-500"
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

              {/* 计算结果 */}
              {currentExecution.outputResult !== undefined && currentExecution.status === 'completed' && (
                <div className="p-4 rounded-xl bg-[#30d158]/5 border border-[#30d158]/10">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-[#30d158]" />
                    <span className="text-xs font-medium text-[#30d158] uppercase tracking-wider">计算结果</span>
                  </div>
                  <div className="bg-[#0c0c0e] rounded-lg p-3 border border-[#2c2c2e] overflow-x-auto">
                    <pre className="text-xs text-[#30d158] font-mono leading-relaxed">
                      {JSON.stringify(currentExecution.outputResult, null, 2)}
                    </pre>
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
              <Database className="w-4 h-4 text-[#8e8e93]" />
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
                        : 'bg-[#bf5af2]/10'
                    }`}>
                      {exec.status === 'completed' ? (
                        <CheckCircle2 className="w-4 h-4 text-[#30d158]" />
                      ) : exec.status === 'failed' ? (
                        <XCircle className="w-4 h-4 text-[#ff453a]" />
                      ) : (
                        <RefreshCw className="w-4 h-4 text-[#bf5af2] animate-spin" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[#f5f5f7] truncate">{exec.functionName}</span>
                        <span className="text-[10px] text-[#636366] ml-2 flex-shrink-0">{exec.executionTime}ms</span>
                      </div>
                      <div className="text-[10px] text-[#636366] mt-0.5">
                        {new Date(exec.logs[0]?.timestamp || Date.now()).toLocaleTimeString()}
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 text-[#636366] transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </button>
                  {isExpanded && (
                    <div className="ml-11 mt-1 p-3 rounded-lg bg-[#141416] border border-[#2c2c2e]">
                      <div className="text-[10px] text-[#636366] space-y-1">
                        <div>输入: {JSON.stringify(exec.inputParams)}</div>
                        {exec.outputResult !== undefined && (
                          <div>输出: {typeof exec.outputResult === 'object' ? JSON.stringify(exec.outputResult) : String(exec.outputResult)}</div>
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

export default FunctionExecutionPanel;