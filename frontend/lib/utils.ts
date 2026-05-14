import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number | string | null | undefined): string {
  if (price === null || price === undefined) return "-";
  const num = typeof price === "string" ? parseFloat(price) : price;
  if (isNaN(num)) return "-";
  return `$${num.toFixed(2)}`;
}

export function formatNumber(num: number | string | null | undefined): string {
  if (num === null || num === undefined) return "-";
  const n = typeof num === "string" ? parseFloat(num) : num;
  if (isNaN(n)) return "-";
  if (n >= 1000000) {
    return (n / 1000000).toFixed(1) + "M";
  }
  if (n >= 1000) {
    return (n / 1000).toFixed(1) + "K";
  }
  return n.toString();
}

export function formatContextWindow(window: number | undefined): string {
  if (!window) return "—";
  if (window >= 1000000) return `${(window / 1000000).toFixed(0)}M`;
  if (window >= 1000) return `${(window / 1000).toFixed(0)}K`;
  return window.toString();
}

export function formatDate(date: string | Date | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function getPricingLabel(type: string | undefined): { label: string; color: string } {
  switch (type) {
    case "free":
      return { label: "免费", color: "#22c55e" };
    case "freemium":
      return { label: "免费增值", color: "#3b82f6" };
    case "paid":
      return { label: "付费", color: "#f59e0b" };
    case "enterprise":
      return { label: "企业", color: "#8b5cf6" };
    case "open_source":
      return { label: "开源", color: "#14b8a6" };
    default:
      return { label: "未知", color: "#6b7280" };
  }
}

export function getCapabilityIcon(capability: string): string {
  const icons: Record<string, string> = {
    "text-generation": "T",
    "image-generation": "I",
    "code-generation": "C",
    vision: "V",
    audio: "A",
    video: "V",
    embedding: "E",
    "function-calling": "F",
    streaming: "S",
    "json-mode": "J",
    "fine-tuning": "FT",
    agents: "AG",
  };
  return icons[capability] || capability.slice(0, 2).toUpperCase();
}

export function getHeatLevel(score: number): { label: string; color: string } {
  if (score >= 96) return { label: "爆款", color: "#bf5af2" };
  if (score >= 81) return { label: "火爆", color: "#ff453a" };
  if (score >= 61) return { label: "热门", color: "#ff9f0a" };
  if (score >= 41) return { label: "关注", color: "#30d158" };
  if (score >= 21) return { label: "一般", color: "#64d2ff" };
  return { label: "冷门", color: "#6e6e73" };
}

export function debounce<T extends (...args: string[]) => void>(
  fn: T,
  delay: number
): (q: string) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (q: string) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(q), delay);
  };
}
