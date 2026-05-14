"use client";

import { useState, useEffect } from "react";
import { Heart, Flame } from "lucide-react";
import { useAppStore, type ToolHeatData } from "@/stores/app.store";
import { cn } from "@/lib/utils";

interface InteractiveLikeButtonProps {
  slug: string;
  initialCount?: number;
  showLabel?: boolean;
  variant?: "heart" | "flame";
  size?: "sm" | "md" | "lg";
}

export function InteractiveLikeButton({
  slug,
  initialCount = 0,
  showLabel = true,
  variant = "heart",
  size = "md",
}: InteractiveLikeButtonProps) {
  const { getToolHeat, simulateImpact } = useAppStore();
  const [heatData, setHeatData] = useState<ToolHeatData | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number }[]>([]);

  useEffect(() => {
    const data = getToolHeat(slug);
    setHeatData(data);
  }, [slug, getToolHeat]);

  const handleClick = () => {
    setIsAnimating(true);
    
    // 创建粒子效果
    const newParticles = Array.from({ length: 6 }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 40 - 20,
      y: Math.random() * -40 - 20,
    }));
    setParticles(newParticles);

    // 模拟影响
    simulateImpact(slug, "like");

    setTimeout(() => {
      setIsAnimating(false);
      setParticles([]);
    }, 600);
  };

  const displayCount = heatData?.clickCount || initialCount;
  const heatScore = heatData?.totalHeat || 0;
  const Icon = variant === "heart" ? Heart : Flame;
  const color = variant === "heart" ? "#ff3b30" : "#ff9f0a";

  return (
    <button
      onClick={handleClick}
      className={cn(
        "relative flex items-center gap-2 rounded-xl border transition-all duration-200",
        "hover:scale-105 active:scale-95",
        size === "sm" && "px-2.5 py-1.5",
        size === "md" && "px-3 py-2",
        size === "lg" && "px-4 py-2.5",
        isAnimating && "scale-110"
      )}
      style={{
        backgroundColor: `${color}10`,
        borderColor: `${color}30`,
      }}
    >
      {/* 粒子效果 */}
      {particles.map((particle) => (
        <Icon
          key={particle.id}
          className="absolute pointer-events-none animate-particle"
          style={{
            width: size === "sm" ? 12 : size === "md" ? 16 : 20,
            height: size === "sm" ? 12 : size === "md" ? 16 : 20,
            color,
            left: "50%",
            top: "50%",
            transform: `translate(calc(-50% + ${particle.x}px), calc(-50% + ${particle.y}px))`,
            opacity: 0,
            animation: "particle-fly 0.6s ease-out forwards",
          }}
        />
      ))}

      <Icon
        className={cn(
          "transition-all duration-200",
          size === "sm" && "w-4 h-4",
          size === "md" && "w-5 h-5",
          size === "lg" && "w-6 h-6",
          isAnimating && "fill-current"
        )}
        style={{ color }}
      />

      {showLabel && (
        <>
          <span
            className={cn(
              "font-semibold",
              size === "sm" && "text-xs",
              size === "md" && "text-sm",
              size === "lg" && "text-base"
            )}
            style={{ color }}
          >
            {displayCount > 999
              ? `${(displayCount / 1000).toFixed(1)}k`
              : displayCount}
          </span>
          {heatScore > 0 && (
            <span
              className={cn(
                "px-1.5 py-0.5 rounded-full",
                size === "sm" && "text-[10px]",
                size === "md" && "text-xs",
                size === "lg" && "text-sm"
              )}
              style={{ backgroundColor: `${color}20`, color }}
            >
              {heatScore.toFixed(0)}°
            </span>
          )}
        </>
      )}
    </button>
  );
}
