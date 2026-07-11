import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "AI Practice Lab",
    template: "%s · AI Practice Lab",
  },
  description:
    "Build practical habits for prompting, checking, and protecting information when you use AI at work.",
  applicationName: "AI Practice Lab",
  openGraph: {
    title: "AI Practice Lab",
    description:
      "Think CLEAR. Work responsibly. Practical AI training for mission and business teams.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "AI Practice Lab",
    description: "Think CLEAR. Work responsibly.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f4f3f7",
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
