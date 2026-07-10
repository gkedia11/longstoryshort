import type { Metadata } from "next";
import { AppNav } from "@/components/AppNav";
import { DashboardClient } from "@/components/DashboardClient";

export const metadata: Metadata = {
  title: "Novel Manuscript Dashboard",
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-[#f7faf7]">
      <AppNav />
      <DashboardClient />
    </main>
  );
}
