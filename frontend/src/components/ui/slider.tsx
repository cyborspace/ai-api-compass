/**
 * Slider UI Component
 */

import { cn } from "@/lib/utils";

interface SliderProps {
  value: number[];
  onValueChange: (value: number[]) => void;
  max?: number;
  step?: number;
  className?: string;
}

export function Slider({
  value,
  onValueChange,
  max = 100,
  step = 1,
  className,
}: SliderProps) {
  const currentValue = value[0] || 0;
  const percentage = (currentValue / max) * 100;

  return (
    <div className={cn("relative flex items-center w-full h-5", className)}>
      <div className="relative w-full h-1.5 bg-[#2c2c2e] rounded-full">
        <div
          className="absolute h-full bg-[#ff3b30] rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <input
        type="range"
        min={0}
        max={max}
        step={step}
        value={currentValue}
        onChange={(e) => onValueChange([Number(e.target.value)])}
        className="absolute w-full h-5 opacity-0 cursor-pointer"
      />
      <div
        className="absolute w-4 h-4 bg-[#ff3b30] rounded-full shadow-lg pointer-events-none"
        style={{ left: `calc(${percentage}% - 8px)` }}
      />
    </div>
  );
}
