import type { Metadata } from "next";
import { I18nProvider } from "@/lib/i18n";
import "./globals.css";

export const metadata: Metadata = {
  title: "阿瓦隆笔记本 | Avalon Notepad",
  description: "阿瓦隆现场笔记与任务记录工具 · A local-first companion for The Resistance: Avalon"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body><I18nProvider>{children}</I18nProvider></body>
    </html>
  );
}
