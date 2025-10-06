import { useLocation } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Menu } from "lucide-react";
import { UserMenu } from "./UserMenu";
import EnvModeToggle from "../../components/theme/EnvModeToggle";

const routeTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/merchants": "Merchants",
  "/transactions": "Transactions",
  "/settings": "Settings",
};

export function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const { pathname } = useLocation();
  const title = routeTitles[pathname] || "PelPay";

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4">
      <div className="flex items-center gap-2">
        {/* Mobile toggle button */}
        <Button
          variant="ghost"
          size="md"
          className="lg:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-base lg:text-lg font-semibold">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <EnvModeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
