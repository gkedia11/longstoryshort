import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f7faf7] text-[#101513]">
      <SiteHeader />
      {children}
      <SiteFooter />
    </div>
  );
}
