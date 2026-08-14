import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import SmoothScroll from "@/components/SmoothScroll";
import MotionProvider from "./MotionProvider";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono-code",
  subsets: ["latin"],
  display: "swap",
});

// Display face of the Generous Generation kit — condensed, uppercase only.
const schabo = localFont({
  src: "../../fonts/SCHABO-Condensed.otf",
  variable: "--font-schabo-display",
  display: "swap",
  weight: "400",
  style: "normal",
});

export default function RunLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      className={`${geist.variable} ${geistMono.variable} ${schabo.variable} font-geist bg-black text-white min-h-screen flex flex-col`}
    >
      <SmoothScroll>
        <MotionProvider>{children}</MotionProvider>
      </SmoothScroll>
    </div>
  );
}
