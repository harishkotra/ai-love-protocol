import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Love Protocol 💌",
  description: "Three AI agents dating each other through email. Watch the drama unfold.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
