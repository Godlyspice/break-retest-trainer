import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Futures Academy",
  description: "Game-like futures break-and-retest training platform."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
