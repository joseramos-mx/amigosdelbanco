import type { Metadata } from "next";
import { Albert_Sans } from "next/font/google";
import SmoothScroll from "@/components/SmoothScroll";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getTotals } from "@/lib/queries";
import { percentOfGoal } from "@/lib/donation";
import "./globals.css";

const albertSans = Albert_Sans({
  variable: "--font-albert-sans",
  subsets: ["latin"],
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: "Amigos del Banco de Alimentos",
  description: "Por un Durango sin hambre",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const totals = await getTotals();
  const goalPercent = percentOfGoal(totals.raised_cents);

  return (
    <html lang="es" className={`${albertSans.variable} antialiased`}>
      <body className="flex flex-col">
        <SmoothScroll>
          <Navbar goalPercent={goalPercent} />
          {children}
          <Footer />
        </SmoothScroll>
      </body>
    </html>
  );
}
