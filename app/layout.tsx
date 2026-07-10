import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { site } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  applicationName: site.name,
  creator: site.legalName,
  publisher: site.legalName,
  category: "books and literature",
  title: {
    default: "Complete Novel Manuscripts | Longstory Short Story",
    template: "%s | Longstory Short Story",
  },
  description:
    "Turn your story idea into a complete novel manuscript with plot development, outlining, writing, and proofreading included.",
  metadataBase: new URL(site.url),
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/brand-icon-512.png",
    shortcut: "/brand-icon-512.png",
    apple: "/brand-icon-512.png",
  },
  manifest: "/manifest.webmanifest",
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    other: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION
      ? { "msvalidate.01": [process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION] }
      : undefined,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    title: "Complete Novel Manuscripts | Longstory Short Story",
    description:
      "Turn your story idea into a complete novel manuscript with one simple price.",
    url: site.url,
    siteName: "Longstory Short Story",
    images: [
      {
        url: "/social-share.jpg",
        width: 1200,
        height: 630,
        alt: "A finished novel and manuscript pages on a library writing desk",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Complete Novel Manuscripts | Longstory Short Story",
    description:
      "Turn your story idea into a complete novel manuscript with one simple price.",
    images: ["/social-share.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
