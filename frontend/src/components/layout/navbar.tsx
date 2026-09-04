"use client";

import { usePathname, useRouter } from "next/navigation";
import { Activity, LogOut, Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { navigationItems } from "@/components/layout/sidebar";

type NavbarProps = {
  onOpenSidebar: () => void;
};

function UserMenu() {
  const router = useRouter();
  const { user, roles, logout } = useAuth();

  const roleLabel = roles.length > 0 ? roles[0].name : undefined;

  function handleLogout() {
    void logout().then(() => router.push("/login"));
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex size-9 items-center justify-center rounded-full bg-[#38B8C4]/20 font-semibold text-[#0E7C86]">
        {user?.name?.charAt(0) ?? "U"}
      </div>
      <div className="hidden min-w-0 sm:block">
        <p className="truncate text-sm font-semibold text-[#18202F]">
          {user?.name ?? "User"}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {roleLabel ?? user?.email ?? ""}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="text-[#596273] hover:text-[#C85C5C]"
        onClick={handleLogout}
        aria-label="Sign out"
      >
        <LogOut className="size-4.5" />
      </Button>
    </div>
  );
}

export function Navbar({ onOpenSidebar }: NavbarProps) {
  const pathname = usePathname();

  const currentLabel =
    navigationItems.find(
      (item) => pathname === item.href || pathname.startsWith(item.href + "/")
    )?.label ?? "Dashboard";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#E1E6ED] bg-white/90 px-4 backdrop-blur sm:px-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onOpenSidebar}
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </Button>
        <div className="flex items-center gap-2 text-[#596273]">
          <Activity className="size-4 text-[#38B8C4]" />
          <span className="hidden text-sm font-medium sm:block">
            {currentLabel}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 lg:hidden">
        <UserMenu />
      </div>

      <div className="hidden items-center gap-6 lg:flex">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#3C8C7A]/10 px-3 py-1 text-xs font-semibold text-[#3C8C7A]">
          <span className="size-1.5 rounded-full bg-[#3C8C7A]" />
          Online
        </span>
        <UserMenu />
      </div>
    </header>
  );
}
