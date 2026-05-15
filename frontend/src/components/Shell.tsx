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
  GripVertical,
} from "lucide-react";
import { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const DEFAULT_NAV_ITEMS: NavItem[] = [
  { href: "/rankings", label: "排行榜", icon: Trophy },
  { href: "/", label: "工具库", icon: Database },
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

const STORAGE_KEY = "nav-items-order";

function SortableNavItem({
  item,
  active,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  onClick?: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.href });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-1 rounded-lg text-sm transition-all group ${
        active
          ? "bg-[#ff3b30]/10 text-[#ff3b30] font-medium"
          : "text-[#8e8e93] hover:text-[#f5f5f7] hover:bg-[#1c1c1e]"
      } ${isDragging ? "opacity-50" : ""}`}
    >
      <Link
        href={item.href}
        onClick={onClick}
        className="flex items-center gap-3 px-3 py-2 flex-1"
      >
        <item.icon className="w-4 h-4" />
        {item.label}
      </Link>
      <button
        {...attributes}
        {...listeners}
        className="p-2 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity hover:text-[#f5f5f7]"
        title="拖动排序"
      >
        <GripVertical className="w-3 h-3" />
      </button>
    </div>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [navItems, setNavItems] = useState<NavItem[]>(DEFAULT_NAV_ITEMS);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const savedOrder: string[] = JSON.parse(saved);
        const orderedItems: NavItem[] = [];
        const remainingItems = [...DEFAULT_NAV_ITEMS];

        savedOrder.forEach((href) => {
          const item = remainingItems.find((i) => i.href === href);
          if (item) {
            orderedItems.push(item);
            const index = remainingItems.indexOf(item);
            remainingItems.splice(index, 1);
          }
        });

        setNavItems([...orderedItems, ...remainingItems]);
      } catch {
        setNavItems(DEFAULT_NAV_ITEMS);
      }
    }
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setNavItems((items) => {
        const oldIndex = items.findIndex((item) => item.href === active.id);
        const newIndex = items.findIndex((item) => item.href === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);

        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(newItems.map((item) => item.href))
        );

        return newItems;
      });
    }
  };

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
          {isClient ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={navItems.map((item) => item.href)}
                strategy={verticalListSortingStrategy}
              >
                {navItems.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <SortableNavItem
                      key={item.href}
                      item={item}
                      active={active}
                    />
                  );
                })}
              </SortableContext>
            </DndContext>
          ) : (
            navItems.map((item) => {
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
            })
          )}
        </nav>

        <div className="p-4 border-t border-[#2c2c2e]">
          <div className="text-[10px] text-[#636366]">
            Palantir Ontology v2.0
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top