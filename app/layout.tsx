import type { Metadata } from "next";
import { Space_Grotesk, Syncopate } from "next/font/google";
import Link from "next/link";
import { Menu } from "lucide-react";
import Header from "@/components/Header";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space",
  subsets: ["latin"],
});

const syncopate = Syncopate({
  variable: "--font-syncopate",
  weight: ["400", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Project Zenith: The Celestial Eye",
  description: "Real-time cosmic radar for tracking celestial objects near your zenith.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${syncopate.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans">
        <Header />

        <main className="flex-1 flex flex-col z-10 relative">
          {children}
        </main>
      </body>
    </html>
  );
}
