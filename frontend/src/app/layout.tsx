import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

// kanakademi.com.tr ile aynı yazı tipi
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  title: "Kanhoot!",
  description: "Interactive learning platform",
};

// tema sayfa çizilmeden önce: kanakademi.com.tr ile ortak "kk-tema" (alt alan adları arası çerez), yoksa sistem tercihi
const temaBetigi = `(function(){var m=document.cookie.match(/(?:^|; )kk-tema=(koyu|acik)/);var t=m&&m[1];if(!t)t=matchMedia('(prefers-color-scheme: dark)').matches?'koyu':'acik';document.documentElement.dataset.tema=t})()`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${jakarta.variable} font-sans h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: temaBetigi }} />
      </head>
      <body className="min-h-full flex flex-col m-0 p-0">{children}</body>
    </html>
  );
}
