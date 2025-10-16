import { useAuthStore } from "../../store/auth";
import { Dropdown } from "../../components/ui/dropdown";
import { LogOut, Settings, User } from "lucide-react";
import { Button } from "../../components/ui/button";

export function UserMenu() {
  const { user, logout } = useAuthStore();

  return (
    <Dropdown.Root>
      <Dropdown.Trigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-2"
        >
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="h-4 w-4 text-primary" />
          </div>
          <span className="hidden lg:block text-sm font-medium">
            {user?.email || "Account"}
          </span>
        </Button>
      </Dropdown.Trigger>

      <Dropdown.Content sideOffset={6} className="bg-card border border-border">
        <Dropdown.Item>
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </Dropdown.Item>
        <Dropdown.Separator />
        <Dropdown.Item
          className="text-red-600"
          onSelect={() => logout()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Dropdown.Item>
      </Dropdown.Content>
    </Dropdown.Root>
  );
}
