import { AppNav } from "@/components/AppNav";
import { DashboardClient } from "@/components/DashboardClient";

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-[#f7faf7]">
      <AppNav />
      <DashboardClient />
    </main>
  );
}
