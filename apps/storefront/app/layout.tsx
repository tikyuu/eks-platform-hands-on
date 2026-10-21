import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DAILY PROTEIN | 自分に合うプロテインを見つけよう",
  description: "種類・メーカー・価格から探せるプロテインストアの学習用デモです。",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
