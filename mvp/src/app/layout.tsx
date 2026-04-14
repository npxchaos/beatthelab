import type { Metadata } from "next";
import { Inter, Bricolage_Grotesque, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/nav";
import { Footer } from "@/components/footer";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-bricolage",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono-var",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Global Football Prediction Lab | Powered by Wand",
  description:
    "Independent football intelligence. Tournament champion models, team pathway analysis, player projections, and scenario simulation — powered by Wand's agentic AI.",
  openGraph: {
    title: "Global Football Prediction Lab",
    description: "Real-time football forecasting. Powered by Wand.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${bricolage.variable} ${jetbrainsMono.variable}`}>
      <body>
        <div className="ambient-bg">
          <div className="blob blob-1"></div>
          <div className="blob blob-2"></div>
        </div>
        <div className="noise-overlay"></div>
        <Navigation />
        <main className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6 relative z-10">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
