"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Activity,
  BarChart3,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Sparkles,
  Users,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";

const baseNavItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Projects", href: "/projects", icon: BarChart3 },
  { label: "Reports", href: "/reports", icon: FileText },
  { label: "Users", href: "/users", icon: Users, adminOnly: true },
];

function SidebarContent() {
  const pathname = usePathname();
  const { permissions } = useAuth();

  const canManageUsers =
    permissions.includes("user.view") || permissions.includes("role.view");

  const navItems = baseNavItems.filter(
    (item) => !item.adminOnly || canManageUsers
  );

  return (
    <div className="flex flex-col gap-6">
      <Link href="/dashboard" className="flex items-center gap-2.5">
        <div className="flex size-9 items-center justify-center rounded-xl bg-[#4263A3] shadow-lg shadow-[#4263A3]/30">
          <Sparkles className="size-5 text-white" />
        </div>
        <span className="text-xl font-semibold tracking-tight text-[#18202F]">
          WorkPulse
        </span>
      </Link>

      <nav className="space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-[#4263A3] text-white shadow-sm"
                  : "text-[#596273] hover:bg-[#E1E6ED]/60 hover:text-[#18202F]"
              )}
            >
              <Icon className="size-4.5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

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

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen w-full bg-[#F5F7FA]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col justify-between border-r border-[#E1E6ED] bg-white px-5 py-6 lg:flex">
        <SidebarContent />
        <UserMenu />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-[#172033]/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col justify-between overflow-y-auto bg-white px-5 py-6 shadow-xl">
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
              >
                <X className="size-5" />
              </Button>
            </div>
            <SidebarContent />
            <UserMenu />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#E1E6ED] bg-white/90 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </Button>
            <div className="flex items-center gap-2 text-[#596273]">
              <Activity className="size-4 text-[#38B8C4]" />
              <span className="hidden text-sm font-medium sm:block">
                {baseNavItems.find(
                  (i) =>
                    pathname === i.href || pathname.startsWith(i.href + "/")
                )?.label ?? "Dashboard"}
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

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
