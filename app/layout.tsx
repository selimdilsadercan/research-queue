import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Research Queue - Organize Your Research",
  description:
    "A modern research queue application to organize and manage your research items across multiple boards. Collect, categorize, and search through websites, articles, videos, and more.",
  keywords: [
    "research",
    "queue",
    "organization",
    "bookmarks",
    "research tools",
    "productivity",
  ],
  authors: [{ name: "Research Queue Team" }],
  creator: "Research Queue",
  publisher: "Research Queue",
  robots: "index, follow",
  openGraph: {
    title: "Research Queue - Organize Your Research",
    description:
      "A modern research queue application to organize and manage your research items across multiple boards.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Research Queue - Organize Your Research",
    description:
      "A modern research queue application to organize and manage your research items across multiple boards.",
  },
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#3b82f6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
