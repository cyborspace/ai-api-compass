"use client";

import { useEffect, useState } from "react";
import { Bell, TrendingUp, TrendingDown, Flame, Star, RefreshCw } from "lucide-react";
import { useAppStore } from "@/stores/app.store";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  type: "rank_up" | "rank_down" | "heat_increase" | "like" | "correction";
  slug: string;
  message: string;
  timestamp: number;
  read: boolean;
}

export function ActivityNotifications() {
  const { clickTracking, dataCorrection, getToolHeat } = useAppStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const newNotifications: Notification[] = [];

    clickTracking.clickHistory.slice(-10).forEach((click) => {
      if (click.type === "like") {
        const heat = getToolHeat(click.slug);
        if (heat && heat.likeCount > 0 && heat.likeCount % 5 === 0) {
          newNotifications.push({
            id: `like-${click.timestamp}`,
            type: "like",
            slug: click.slug,
            message: `${click.slug} 获得第 ${heat.likeCount} 个喜欢！`,
            timestamp: click.timestamp,
            read: false,
          });
        }
      }
    });

    Object.values(clickTracking.heatData).forEach((heat) => {
      if (heat.trendScore > 1.5) {
        newNotifications.push({
          id: `trend-${heat.slug}-${heat.lastClickTime}`,
          type: "heat_increase",
          slug: heat.slug,
          message: `${heat.slug} 热度正在快速上升！趋势指数: ${heat.trendScore.toFixed(2)}`,
          timestamp: heat.lastClickTime,
          read: false,
        });
      }
    });

    dataCorrection.corrections.slice(-5).forEach((correction) => {
      if (!correction.applied) return;
      newNotifications.push({
        id: `correction-${correction.id}`,
        type: "correction",
        slug: correction.slug,
        message: `已修正 ${correction.slug} 的 ${correction.field} 数据`,
        timestamp: correction.timestamp,
        read: false,
      });
    });

    setNotifications(newNotifications.slice(-15));
  }, [clickTracking, dataCorrection, getToolHeat]);

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "rank_up":
        return <TrendingUp className="w-4 h-4 text-[#30d158]" />;
      case "rank_down":
        return <TrendingDown className="w-4 h-4 text-[#ff453a]" />;
      case "heat_increase":
        return <Flame className="w-4 h-4 text-[#ff9f0a]" />;
      case "like":
        return <Star className="w-4 h-4 text-[#ff3b30]" />;
      case "correction":
        return <RefreshCw className="w-4 h-4 text-[#0a84ff]" />;
    }
  };

  const getTypeLabel = (type: Notification["type"]) => {
    switch (type) {
      case "rank_up":
        return "排名上升";
      case "rank_down":
        return "排名下降";
      case "heat_increase":
        return "热度上升";
      case "like":
        return "获得喜欢";
      case "correction":
        return "数据修正";
    }
  };

  const getTypeColor = (type: Notification["type"]) => {
    switch (type) {
      case "rank_up":
        return "bg-[#30d158]/10 text-[#30d158]";
      case "rank_down":
        return "bg-[#ff453a]/10 text-[#ff453a]";
      case "heat_increase":
        return "bg-[#ff9f0a]/10 text-[#ff9f0a]";
      case "like":
        return "bg-[#ff3b30]/10 text-[#ff3b30]";
      case "correction":
        return "bg-[#0a84ff]/10 text-[#0a84ff]";
    }
  };

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return "刚刚";
    if (minutes < 60) return `${minutes} 分钟前`;
    if (hours < 24) return `${hours} 小时前`;
    return new Date(timestamp).toLocaleDateString("zh-CN");
  };

  const displayNotifications = showAll ? notifications : notifications.slice(-5);

  return (
    <div className="p-4 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[#f5f5f7] flex items-center gap-2">
          <Bell className="w-4 h-4 text-[#bf5af2]" />
          活动通知
          {notifications.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-[#bf5af2]/10 text-[#bf5af2] text-[10px]">
              {notifications.length}
            </span>
          )}
        </h3>
        {notifications.length > 5 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-xs text-[#0a84ff] hover:underline"
          >
            {showAll ? "显示较少" : "查看全部"}
          </button>
        )}
      </div>

      {notifications.length > 0 ? (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {displayNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-3 rounded-lg bg-[#141416] border border-[#2c2c2e] transition-all ${
                !notification.read ? "border-[#bf5af2]/30" : ""
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={cn("p-1.5 rounded-lg flex-shrink-0", getTypeColor(notification.type))}>
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded", getTypeColor(notification.type))}>
                      {getTypeLabel(notification.type)}
                    </span>
                    <span className="text-[10px] text-[#636366]">
                      {formatTime(notification.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs text-[#8e8e93]">{notification.message}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Bell className="w-8 h-8 text-[#636366] mx-auto mb-2" />
          <p className="text-sm text-[#636366]">暂无活动通知</p>
        </div>
      )}
    </div>
  );
}
