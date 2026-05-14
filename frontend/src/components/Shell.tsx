"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Database,
  Trophy,
  BarChart3,
  Hexagon,
  Star,
  Box,
  Wand2,
  Calculator,
  Activity,
  Shield,
  Menu,
  X,
  BookOpen,
} from "lucide-react";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/", label: "工具库", icon: Database },
  { href: "/rankings", label: "排行榜", icon: Trophy },
  { href: "/compare", label: "对比", icon: BarChart3 },
  { href: "/categories", label: "分类", icon: Hexagon },
  { href: "/favorites", label: "收藏", icon: Star },
  { href: "/scenarios", label: "场景推荐", icon: Wand2 },
  { href: "/cost-calculator", label: "成本计算", icon: Calculator },
  { href: "/data-quality", label: "数据质量", icon: Shield },
  { href: "/monitoring", label: "性能监控", icon: Activity },
  { href: "/ontology-manager", label: "Ontology", icon: Box },
  { href: "/chapters", label: "学习章节", icon: BookOpen },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0c0c0e] text-[#f5f5f7] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-56 flex-col border-r border-[#2c2c2e] bg-[#141416] fixed h-screen z-30">
        <div className="p-4 border-b border-[#2c2c2e]">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#ff3b30] flex items-center justify-center">
              <Database className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-sm font-semibold text-[#f5f5f7]">AI Compass</div>
              <div className="text-[10px] text-[#636366] tracking-wider">ONTOLOGY EXPLORER</div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                  active
                    ? "bg-[#ff3b30]/10 text-[#ff3b30] font-medium"
                    : "text-[#8e8e93] hover:text-[#f5f5f7] hover:bg-[#1c1c1e]"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#2c2c2e]">
          <div className="text-[10px] text-[#636366]">
            Palantir Ontology v2.0
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-[#141416] border-b border-[#2c2c2e] z-40 flex items-center px-4">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 -ml-2 text-[#8e8e93]"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <Link href="/" className="ml-3 flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-[#ff3b30] flex items-center justify-center">
            <Database className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold">AI Compass</span>
        </Link>
      </header>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-[#0c0c0e]/95 pt-14">
          <nav className="p-4 space-y-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-[#8e8e93] hover:text-[#f5f5f7] hover:bg-[#1c1c1e]"
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 lg:ml-56 pt-14 lg:pt-0 min-h-screen">
        {children}
      </main>
    </div>
  );
}
