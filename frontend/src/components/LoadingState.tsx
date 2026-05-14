"use client";

import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = "加载中..." }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <Loader2 className="w-8 h-8 text-[#ff3b30] animate-spin mb-3" />
      <p className="text-sm text-[#636366]">{message}</p>
    </div>
  );
}
