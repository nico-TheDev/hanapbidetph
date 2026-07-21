import type { Metadata } from "next";
import { Montserrat, Public_Sans } from "next/font/google";

import { cn } from "@/lib/utils";

import "./globals.css";

const publicSans = Public_Sans({
  subsets: ["latin"],
  variable: "--font-public-sans",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  title: "HanapBidet PH",
  description: "Find bidet-friendly restrooms in Metro Manila",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("font-sans", publicSans.variable, montserrat.variable)}
    >
      <body>{children}</body>
    </html>
  );
}
