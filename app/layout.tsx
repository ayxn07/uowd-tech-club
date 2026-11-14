import type { Metadata } from "next";
import { Archivo, Chakra_Petch, JetBrains_Mono } from "next/font/google";
import { Header } from "@/components/site/Header";
import "./globals.css";

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
        <Header />
        {children}
      </body>
    </html>
  );
}
