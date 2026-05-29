import type { Metadata } from "next";
import { Be_Vietnam_Pro, EB_Garamond } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
});

const ebGaramond = EB_Garamond({
  subsets: ["latin", "vietnamese"],
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: "Trạm Đọc Xanh - Chia sẻ & Khám phá sách sinh thái",
  description: "Cộng đồng chia sẻ cảm nhận sách, review sách hướng đến lối sống bền vững và nâng tầm tâm hồn.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={cn(
        "h-full",
        "antialiased",
        beVietnamPro.variable,
        ebGaramond.variable,
        "font-sans"
      )}
    >
      <body className="min-h-full flex flex-col bg-[#fcfbf9] text-[#121c2a]">
        {children}
      </body>
    </html>
  );
}
