import { useState } from "react";
import BrandBootstrapper from "../../features/brand/BrandBootstapper";
import { LastRouteTracker } from "../router/LastRouteTracker";
import { SidebarNav } from "./SidebarNav";
import { Header } from "./Header";
import { ThemeToggle } from "../../components/theme/ThemeToggle";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Bootstraps brand color + theme */}
      <BrandBootstrapper />

      {/* Mobile sidebar (Drawer) */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setSidebarOpen(false)}
          />
          {/* Sidebar content */}
          <div className="relative flex w-64 flex-col bg-card border-r border-border">
            <SidebarNav onClose={() => setSidebarOpen(false)} collapsible />
          </div>
        </div>
      )}

      {/* Desktop layout */}
      <div className="flex flex-1">
        {/* Sidebar (desktop) */}
        <aside className="hidden lg:flex lg:flex-col border-r border-border bg-card">
          <SidebarNav collapsible />
        </aside>

        {/* Main content */}
        <div className="flex flex-1 flex-col">
          {/* Header */}
          <Header onMenuClick={() => setSidebarOpen(true)} />

          {/* Page content */}
          <main className="flex-1 p-4 lg:p-6">
            <LastRouteTracker />
            {children}
          </main>

          {/* Footer */}
          <footer className="border-t border-border bg-card px-4 py-2 text-xs text-muted-foreground text-center">
            © {new Date().getFullYear()} PelPay. All rights reserved.
          </footer>
        </div>
      </div>

      {/* Mobile floating theme toggle */}            
      <ThemeToggle />
    </div>
  );
}
