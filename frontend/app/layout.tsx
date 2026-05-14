import type { Metadata } from "next";
import "./globals.css";
import { Shell } from "@/components/Shell";
import { CompareBar } from "@/components/CompareBar";

export const metadata: Metadata = {
  title: "AI Compass - AI 工具导航",
  description: "发现、对比、选择最适合的 AI 工具",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        <Shell>
          {children}
        </Shell>
        <CompareBar />
      </body>
    </html>
  );
}
