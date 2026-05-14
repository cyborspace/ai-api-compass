"use client";

import { Suspense } from "react";
import HomeContent from "./HomeContent";

export default function HomePage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-[#636366]">加载中...</div>}>
      <HomeContent />
    </Suspense>
  );
}
