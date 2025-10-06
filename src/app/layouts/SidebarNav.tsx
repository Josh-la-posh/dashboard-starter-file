import { NavLink } from "react-router-dom";
import { cn } from "../../utils/cn";
import {
  Home,
  CreditCard,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  FileText,
  Scale,
  LifeBuoy,
  Wallet,
} from "lucide-react";
import { useState, useEffect } from "react";
import * as Tooltip from "@radix-ui/react-tooltip";

// Static base items; compliance will be conditionally inserted
type NavItem = { label: string; icon: React.ComponentType<{ className?: string }>; href: string };
function buildNavItems(showCompliance: boolean): NavItem[] {
  const items: (NavItem | false)[] = [
    { label: "Dashboard", icon: Home, href: "/dashboard" },
    showCompliance && { label: "Compliance", icon: ShieldCheck, href: "/compliance" },
    { label: "Settlements", icon: Wallet, href: "/settlements" },
    { label: "Transactions", icon: CreditCard, href: "/transactions" },
    { label: "Invoices", icon: FileText, href: "/invoices" },
    { label: "Disputes", icon: Scale, href: "/disputes" },
    { label: "Settings", icon: Settings, href: "/settings" },
    { label: "Help & Support", icon: LifeBuoy, href: "/support" },
  ];
  return items.filter(Boolean) as NavItem[];
}

export function SidebarNav({
  onClose,
  collapsible = false,
}: {
  onClose?: () => void;
  collapsible?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(false);

  // Restore collapse state
  useEffect(() => {
    const saved = localStorage.getItem("sidebar:collapsed");
    if (saved) setCollapsed(saved === "true");
  }, []);

  const toggleCollapse = () => {
    const newVal = !collapsed;
    setCollapsed(newVal);
    localStorage.setItem("sidebar:collapsed", String(newVal));
  };

  // Placeholder: read compliance progress from localStorage (will be replaced by global store/react-query later)
  const complianceComplete = localStorage.getItem("compliance:progress") === "6";
  const navItems = buildNavItems(!complianceComplete);

  return (
    <div
      className={cn(
        "flex h-full flex-col transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Brand + Collapse Button */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-border">
        {!collapsed && (
          <span className="text-lg font-bold text-primary truncate">
            PelPay
          </span>
        )}
        {collapsible && (
          <button
            onClick={toggleCollapse}
            className="p-1 text-muted-foreground hover:text-primary transition-colors"
          >
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-1">
        {navItems.map(({ label, icon: Icon, href }) => {
          const link = (
            <NavLink
              key={href}
              to={href}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-md",
                  "hover:bg-primary/10 transition-colors",
                  isActive
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground",
                  collapsed && "justify-center px-2"
                )
              }
              onClick={onClose}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </NavLink>
          );

          return collapsed ? (
            <Tooltip.Provider key={href}>
              <Tooltip.Root>
                <Tooltip.Trigger asChild>{link}</Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content
                    side="right"
                    className="rounded bg-gray-800 text-white text-xs px-2 py-1 shadow-md"
                  >
                    {label}
                    <Tooltip.Arrow className="fill-gray-800" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            </Tooltip.Provider>
          ) : (
            link
          );
        })}
      </nav>
    </div>
  );
}
