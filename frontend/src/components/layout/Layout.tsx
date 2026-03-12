import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar, { SIDEBAR_COLLAPSED_WIDTH, SIDEBAR_EXPANDED_WIDTH } from "./Sidebar";
import TopBar from "./TopBar";

const TOPBAR_HEIGHT = 64;

export default function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);

  const sidebarWidth = sidebarCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_EXPANDED_WIDTH;

  return (
    <div
      className="flex h-screen w-full overflow-hidden text-[var(--color-text)] tracking-tight"
      style={{ background: "var(--surface-dashboard)", color: "var(--color-text)" }}
    >
      <div className="h-full flex-shrink-0" style={{ width: sidebarWidth }}>
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggleCollapsed={() => setSidebarCollapsed((prev) => !prev)}
          mobileOpen={sidebarMobileOpen}
          onMobileClose={() => setSidebarMobileOpen(false)}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col" style={{ backgroundColor: "transparent" }}>
        <div className="flex-shrink-0" style={{ height: TOPBAR_HEIGHT }}>
          <TopBar onOpenSidebar={() => setSidebarMobileOpen(true)} fullWidth />
        </div>

        <main className="flex min-h-0 flex-1 flex-col overflow-hidden" style={{ background: "var(--surface-dashboard)" }}>
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-6" style={{ background: "var(--surface-dashboard-secondary)" }}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
