import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "第二十五小时",
  description: "建筑生模拟器",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
