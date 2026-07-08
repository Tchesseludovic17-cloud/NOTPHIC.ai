import { useTranslation } from "@/hooks/use-translation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@clerk/react";
import { Link } from "wouter";
import { Globe, LogOut, LayoutDashboard } from "lucide-react";
import { LanguageSwitcher } from "./language-switcher";
import { useUser } from "@clerk/react";
import { UserButton } from "@clerk/react";

export function LandingHeader() {
  const { t } = useTranslation();
  const { isSignedIn } = useAuth();
  const { user } = useUser();

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/">
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">N</span>
            </div>
            <span className="font-serif font-bold text-xl text-foreground">Norphic</span>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          
          {isSignedIn ? (
            <div className="flex items-center gap-3">
              <Link href="/dashboard">
                <Button size="sm" variant="outline" className="gap-2">
                  <LayoutDashboard className="w-4 h-4" />
                  {t("nav.dashboard")}
                </Button>
              </Link>
              <UserButton afterSignOutUrl="/" />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/sign-in">
                <Button size="sm" variant="outline">
                  {t("auth.signIn")}
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button size="sm" className="bg-primary hover:bg-primary/90">
                  {t("auth.signUp")}
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
