import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PwaRegistration } from "./PwaRegistration";

export const metadata: Metadata = {
  metadataBase: new URL("https://ai-training.st-dba.com"),
  title: {
    default: "AI Practice Lab",
    template: "%s · AI Practice Lab",
  },
  description:
    "Build practical habits for prompting, checking, and protecting information when you use AI at work.",
  applicationName: "AI Practice Lab",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AI Practice Lab",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title: "AI Practice Lab",
    description:
      "Think CLEAR. Work responsibly. Practical AI training for mission and business teams.",
    type: "website",
    images: [
      {
        url: "/og-skills.png",
        width: 1200,
        height: 630,
        alt: "AI Practice Lab with a three-stage build, test, and govern learning path",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Practice Lab",
    description: "Think CLEAR. Work responsibly.",
    images: ["/og-skills.png"],
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
      <body>
        {children}
        <PwaRegistration />
      </body>
    </html>
  );
}
