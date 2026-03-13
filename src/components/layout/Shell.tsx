import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import ImpersonationBanner from "./ImpersonationBanner";
import AppBreadcrumb from "./AppBreadcrumb";
import GlobalSearch from "./GlobalSearch";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import SidebarNav from "./SidebarNav";
import { useCallNotifications } from "@/hooks/useCallNotifications";

export default function Shell() {
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Real-time toast notifications for call status changes
  useCallNotifications();

  return (
    <div className="min-h-screen flex bg-muted/30">
      {/* Desktop sidebar */}
      {!isMobile && <Sidebar />}

      {/* Mobile drawer */}
      {isMobile && (
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="p-0 w-[260px]">
            <SidebarNav onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>
      )}

      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <ImpersonationBanner />
        <Topbar onMenuOpen={() => setMobileOpen(true)} />
        <main className="flex-1 p-4 md:p-6 pb-safe overflow-auto">
          <AppBreadcrumb />
          <Outlet />
        </main>
      </div>

      <GlobalSearch />
    </div>
  );
}
