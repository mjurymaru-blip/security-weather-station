import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SettingsPanel } from "@/components/SettingsPanel";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// GitHub Pages用のベースパス
const basePath = process.env.NODE_ENV === 'production' ? '/security-weather-station' : '';

export const metadata: Metadata = {
  title: "Security Weather Station",
  description: "今日のインターネットは荒れ模様です - セキュリティ気象予報AI",
  manifest: `${basePath}/manifest.json`,
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SecWeather",
  },
};

export const viewport: Viewport = {
  themeColor: "#4a90d9",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <link rel="apple-touch-icon" href={`${basePath}/icons/icon-192.png`} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <SettingsPanel />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
