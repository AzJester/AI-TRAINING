import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  const origin = host ? `${protocol}://${host}` : "http://localhost:3000";
  const socialImage = new URL("/og.png", origin).toString();

  return {
    title: {
      default: "AI Practice Lab",
      template: "%s · AI Practice Lab",
    },
    description:
      "Build practical habits for prompting, checking, and protecting information when you use AI at work.",
    applicationName: "AI Practice Lab",
    metadataBase: new URL(origin),
    openGraph: {
      title: "AI Practice Lab",
      description:
        "Think CLEAR. Work responsibly. Practical AI training for Astrion teams.",
      type: "website",
      images: [
        {
          url: socialImage,
          width: 1664,
          height: 946,
          alt: "AI Practice Lab: Think CLEAR. Work responsibly.",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "AI Practice Lab",
      description: "Think CLEAR. Work responsibly.",
      images: [socialImage],
    },
  };
}

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
