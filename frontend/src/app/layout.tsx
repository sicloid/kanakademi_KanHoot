import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  weight: ["400", "500", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Kahoot Clone",
  description: "Kahoot Clone with Next.js and Go WebSocket",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${montserrat.variable} font-sans h-full antialiased`}
    >
      <body className="min-h-full flex flex-col m-0 p-0">{children}</body>
    </html>
  );
}
