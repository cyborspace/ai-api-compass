"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = "加载失败", onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <AlertTriangle className="w-8 h-8 text-[#ff9f0a] mb-3" />
      <p className="text-sm text-[#f5f5f7] mb-2">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1c1c1e] border border-[#2c2c2e] text-sm text-[#8e8e93] hover:text-[#f5f5f7] hover:border-[#3a3a3c] transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          重试
        </button>
      )}
    </div>
  );
}
