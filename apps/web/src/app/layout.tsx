import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SupportWidget } from "../components/SupportWidget";
import "@ajac/ui/tokens.css";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "AUTHENTIC J.A. CONSTRUCTION LTD.",
    template: "%s | AUTHENTIC J.A. CONSTRUCTION LTD.",
  },
  description:
    "AUTHENTIC J.A. CONSTRUCTION LTD. — construction, engineering, real estate, property development, land allocation, building materials and block manufacturing in Ghana.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/app-icon.png", type: "image/png", sizes: "192x192" },
      { url: "/app-icon.png", type: "image/png", sizes: "512x512" },
      { url: "/brand/aja-icon.svg", type: "image/svg+xml", sizes: "any" },
    ],
    apple: "/app-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#14324F",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <SupportWidget />
      </body>
    </html>
  );
}