import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Footer } from "@/shared/layout/Footer";
import { Header } from "@/shared/layout/Header";
import { LanguageSwitcher } from "@/shared/ui/LanguageSwitcher";
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
  metadataBase: new URL("https://storiesbehindsongs.com"),
  title: {
    default: "Stories Behind Songs",
    template: "%s | Stories Behind Songs",
  },
  description:
    "Discover the true stories behind popular songs: who wrote them, why, and what inspired the lyrics.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <Header />
        <div className="flex-1">{children}</div>
        <Footer />
        <LanguageSwitcher />
      </body>
    </html>
  );
}
