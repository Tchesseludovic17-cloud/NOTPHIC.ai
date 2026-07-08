import { useAuth, useClerk } from "@clerk/react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";
import { LayoutDashboard, LogOut, Settings } from "lucide-react";
import { Link } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export function AdminReturn() {
  const { isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const { t } = useTranslation();

  if (!isSignedIn) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 fixed bottom-6 right-6 z-40">
          <LayoutDashboard className="w-4 h-4" />
          Admin
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <Link href="/dashboard">
          <DropdownMenuItem className="cursor-pointer flex items-center gap-2">
            <LayoutDashboard className="w-4 h-4" />
            <span>{t("nav.dashboard")}</span>
          </DropdownMenuItem>
        </Link>
        <Link href="/parametres">
          <DropdownMenuItem className="cursor-pointer flex items-center gap-2">
            <Settings className="w-4 h-4" />
            <span>{t("nav.settings")}</span>
          </DropdownMenuItem>
        </Link>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer flex items-center gap-2 text-destructive"
          onClick={() => signOut({ redirectUrl: "/" })}
        >
          <LogOut className="w-4 h-4" />
          <span>{t("nav.logout")}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
