import type { Metadata, Viewport } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/layout/BottomNav";
import { TopBar } from "@/components/layout/TopBar";
import { Providers } from "@/components/providers";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  weight: ["300", "400", "500", "700", "900"],
  variable: "--font-heebo",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "המתבן – גמח כלי עבודה חקלאיים",
    template: "%s | המתבן",
  },
  description:
    "פלטפורמה לניהול גמחי כלי עבודה חקלאיים – השאלה, פיקדון וניהול קהילתי. מזרח הגוש, תלם, דרום הר חברון.",
  applicationName: "המתבן",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "המתבן",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
      { url: "/icon-512.svg", sizes: "512x512", type: "image/svg+xml" },
    ],
    shortcut: "/icon-192.svg",
    apple: "/icon-192.svg",
  },
  formatDetection: {
    telephone: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#4A7C59",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="he" dir="rtl" className={heebo.variable}>
      <body className="font-sans antialiased min-h-screen bg-bg text-text">
        <Providers>
          <div className="mx-auto max-w-screen-sm min-h-screen flex flex-col">
            <TopBar />
            <main className="flex-1 pb-20 pt-2">{children}</main>
            <BottomNav />
          </div>
        </Providers>
      </body>
    </html>
  );
}
