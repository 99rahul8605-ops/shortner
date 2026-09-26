
import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "BingoLink — Short links",
  description:
    "Secure private link manager with informational pages and clearly labeled advertising.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <Script
          id="monetag-multitag"
          src="https://quge5.com/88/tag.min.js"
          data-zone="286925"
          data-cfasync="false"
          strategy="beforeInteractive"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
