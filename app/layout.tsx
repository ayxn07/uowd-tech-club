import type { Metadata } from "next";
import { Archivo, Chakra_Petch, JetBrains_Mono } from "next/font/google";
import { Header } from "@/components/site/Header";
import { StartupIntro } from "@/components/site/StartupIntro";
import { DirectionalCursor } from "@/components/site/DirectionalCursor";
import { AdaptiveScrollbar } from "@/components/site/AdaptiveScrollbar";
import "./globals.css";
import "@/components/site/DirectionalCursor.css";

// Square, chamfered letterforms closest to the UTC mark.
const chakraPetch = Chakra_Petch({
  variable: "--font-chakra-petch",
  subsets: ["latin"],
  weight: ["700"],
});

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["400"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["500"],
});

export const metadata: Metadata = {
  title: "UOWD Tech Club",
  description: "UOWD Tech Club",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${chakraPetch.variable} ${archivo.variable} ${jetbrainsMono.variable} h-full antialiased`}>
      <body className="min-h-full">
        <DirectionalCursor />
        <AdaptiveScrollbar />
        <StartupIntro />
        <noscript>
          <style>{`
            .startup-intro { display: none !important; }
            body { overflow: auto !important; }
            .site-shell { pointer-events: auto !important; }
            .site-brand { visibility: visible !important; }
          `}</style>
        </noscript>
        <div className="site-shell" id="site-content">
          <Header />
          {children}
        </div>
      </body>
    </html>
  );
}
