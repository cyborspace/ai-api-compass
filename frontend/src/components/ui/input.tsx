/**
 * Input UI Component
 */

import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full px-4 py-2 bg-[#1c1c1e] border border-[#2c2c2e] rounded-lg text-sm text-[#f5f5f7] placeholder:text-[#636366] focus:outline-none focus:border-[#ff3b30] transition-colors",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
