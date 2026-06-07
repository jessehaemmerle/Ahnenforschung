import type { Metadata } from "next";
import { Nunito, Nunito_Sans } from "next/font/google";

import "./globals.css";
import { Providers } from "./providers";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap"
});

const nunitoSans = Nunito_Sans({
  subsets: ["latin"],
  variable: "--font-nunito-sans",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Ahnenforschung",
  description: "Mandantenfähige Stammbaum-Web-App für Familien, Archive und Arbeitsgruppen."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className={`${nunito.variable} ${nunitoSans.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
