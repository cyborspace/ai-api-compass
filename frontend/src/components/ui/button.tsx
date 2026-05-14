/**
 * Button UI Component
 */

import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface ButtonProps {
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  onClick,
  disabled,
  type = "button",
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#ff3b30]/50 disabled:opacity-50 disabled:cursor-not-allowed",
        {
          "bg-[#ff3b30] text-white hover:bg-[#ff3b30]/90": variant === "primary",
          "bg-[#2c2c2e] text-[#f5f5f7] hover:bg-[#3c3c3e]": variant === "secondary",
          "border border-[#2c2c2e] text-[#f5f5f7] hover:bg-[#2c2c2e]": variant === "outline",
          "text-[#8e8e93] hover:text-[#f5f5f7] hover:bg-[#2c2c2e]": variant === "ghost",
          "px-3 py-1.5 text-xs": size === "sm",
          "px-4 py-2 text-sm": size === "md",
          "px-6 py-3 text-base": size === "lg",
        },
        className
      )}
    >
      {children}
    </button>
  );
}
