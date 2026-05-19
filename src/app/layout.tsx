import type { Metadata, Viewport } from "next";
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

const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") ??
  "https://bancodealimentosdurango.org";

const DESCRIPTION =
  "Apoya al Banco de Alimentos de Durango. Cada peso se convierte en despensas para las familias que más lo necesitan. Dona en línea con tarjeta, OXXO o SPEI — una vez o mensual.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Banco de Alimentos de Durango — Por un Durango sin hambre",
    template: "%s · Banco de Alimentos de Durango",
  },
  description: DESCRIPTION,
  applicationName: "Banco de Alimentos de Durango",
  keywords: [
    "banco de alimentos durango",
    "donar durango",
    "donación deducible",
    "amigos del banco",
    "donar comida",
    "voluntariado durango",
    "OSC durango",
    "ayudar familias durango",
    "despensas durango",
    "donataria autorizada",
    "ONG durango",
    "filantropía durango",
  ],
  authors: [{ name: "Banco de Alimentos de Durango A.C." }],
  creator: "Banco de Alimentos de Durango A.C.",
  publisher: "Banco de Alimentos de Durango A.C.",
  category: "Nonprofit",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "es_MX",
    url: SITE_URL,
    siteName: "Banco de Alimentos de Durango",
    title: "Banco de Alimentos de Durango — Por un Durango sin hambre",
    description: DESCRIPTION,
    images: [
      {
        url: "/imagen2.png",
        width: 1200,
        height: 630,
        alt: "Voluntarios del Banco de Alimentos de Durango",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Banco de Alimentos de Durango",
    description:
      "Apoya con una donación única o mensual. Tarjeta, OXXO o SPEI.",
    images: ["/imagen2.png"],
  },
  alternates: {
    canonical: SITE_URL,
  },
  icons: {
    icon: [
      { url: "/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    shortcut: "/favicon/favicon.ico",
    apple: [
      { url: "/favicon/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/favicon/site.webmanifest",
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#1d4dfc",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

// Schema.org JSON-LD for Knowledge Graph — helps Google show the org card
// in search results with logo, contact, and address.
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "NGO",
  name: "Banco de Alimentos de Durango A.C.",
  alternateName: "BA Durango",
  url: SITE_URL,
  logo: `${SITE_URL}/logo.svg`,
  email: "informacion@bancodealimentosdurango.org",
  description: DESCRIPTION,
  address: {
    "@type": "PostalAddress",
    addressLocality: "Durango",
    addressRegion: "Dgo.",
    addressCountry: "MX",
  },
  sameAs: [],
} as const;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const totals = await getTotals();
  const goalPercent = percentOfGoal(totals.raised_cents);

  return (
    <html lang="es-MX" className={`${albertSans.variable} antialiased`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
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
