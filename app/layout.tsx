import type { Metadata } from "next";
import localFont from "next/font/local";
import { Noto_Sans, Noto_Sans_Tamil, Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});
const notoSans = Noto_Sans({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-noto-sans",
  display: "swap",
});
const notoSansTamil = Noto_Sans_Tamil({
  subsets: ["tamil"],
  weight: ["400"],
  variable: "--font-noto-sans-tamil",
  display: "swap",
});
const notoSansDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  weight: ["400"],
  variable: "--font-noto-sans-devanagari",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Mask — Faceless Co-host",
  description: "AI co-host for Faceless campus sessions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${notoSans.variable} ${notoSansTamil.variable} ${notoSansDevanagari.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
