import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Longstory Short Story",
  description:
    "Turn a genre and story idea into a complete novel manuscript delivered by email in about 45 minutes.",
  metadataBase: new URL("https://longstoryshortstory.com"),
  icons: {
    icon: "/logo-cropped.png",
    shortcut: "/logo-cropped.png",
  },
  openGraph: {
    title: "Longstory Short Story",
    description:
      "Complete AI-assisted novel manuscripts from your genre and story idea for one simple price.",
    url: "https://longstoryshortstory.com",
    siteName: "Longstory Short Story",
    images: [{ url: "/hero-manuscript.png", width: 2048, height: 1152 }],
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
