import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://ai-training.st-dba.com"),
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
      <body>{children}</body>
    </html>
  );
}
