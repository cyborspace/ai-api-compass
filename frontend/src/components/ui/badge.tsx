/**
 * Badge UI Component
 */

import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "default" | "secondary" | "outline" | "destructive";
  className?: string;
}

export function Badge({
  children,
  variant = "default",
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium transition-colors",
        {
          "bg-[#ff3b30] text-white": variant === "default",
          "bg-[#2c2c2e] text-[#8e8e93]": variant === "secondary",
          "border border-[#2c2c2e] text-[#8e8e93]": variant === "outline",
          "bg-[#ff453a]/10 text-[#ff453a]": variant === "destructive",
        },
        className
      )}
    >
      {children}
    </span>
  );
}
