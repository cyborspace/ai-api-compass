/**
 * Skeleton 骨架屏组件
 * Palantir 风格：脉冲动画，深色主题
 */

import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-[#2c2c2e]",
        className
      )}
    />
  );
}

export function ToolCardSkeleton() {
  return (
    <div className="rounded-xl bg-[#1c1c1e] border border-[#2c2c2e] p-4 space-y-3">
      <div className="flex items-start gap-3">
        <Skeleton className="w-12 h-12 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <div className="flex gap-2">
        <Skeleton className="h-5 w-16 rounded" />
        <Skeleton className="h-5 w-20 rounded" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Skeleton className="h-8 rounded" />
        <Skeleton className="h-8 rounded" />
        <Skeleton className="h-8 rounded" />
      </div>
    </div>
  );
}

export function ToolCardSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <ToolCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ToolDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Skeleton className="w-16 h-16 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-7 w-1/3" />
          <Skeleton className="h-4 w-1/4" />
        </div>
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Skeleton className="h-20 rounded-lg" />
        <Skeleton className="h-20 rounded-lg" />
        <Skeleton className="h-20 rounded-lg" />
        <Skeleton className="h-20 rounded-lg" />
      </div>
      <Skeleton className="h-40 rounded-lg" />
    </div>
  );
}

export function RankingSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-lg bg-[#1c1c1e] border border-[#2c2c2e]">
          <Skeleton className="w-8 h-8 rounded-lg flex-shrink-0" />
          <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

export function SearchSuggestionsSkeleton() {
  return (
    <div className="space-y-2 p-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-2">
          <Skeleton className="w-8 h-8 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
