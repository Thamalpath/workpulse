"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, FileText, LayoutDashboard, LineChart, Users, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import logo from "@/assets/Logo.png";

export const navigationItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Visual Insights", href: "/insights", icon: LineChart, managerOnly: true },
  { label: "Projects", href: "/projects", icon: BarChart3 },
  { label: "Reports", href: "/reports", icon: FileText },
  { label: "Users", href: "/users", icon: Users, adminOnly: true },
];

export function SidebarContent({ collapsed = false }: { collapsed?: boolean }) {
  const pathname = usePathname();
  const { permissions } = useAuth();

  const canViewInsights = permissions.includes("report.view.all");
  const canManageUsers =
    permissions.includes("user.view") || permissions.includes("role.view");

  const items = navigationItems.filter(
    (item) =>
      (!item.adminOnly || canManageUsers) &&
      (!item.managerOnly || canViewInsights),
  );

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/dashboard"
        className={`flex items-center gap-2.5 ${collapsed ? "justify-center" : ""}`}
      >
        <Image
          src={logo.src}
          alt="WorkPulse logo"
          unoptimized
          width={40}
          height={20}
          priority
          className="h-10 w-auto object-contain"
        />
        {!collapsed && (
          <span className="text-xl font-bold text-[#18202F]">Workpulse</span>
        )}
      </Link>

      <nav className="space-y-1">
        {items.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                collapsed ? "justify-center px-2" : "px-3",
                isActive
                  ? "bg-[#4263A3] text-white shadow-sm"
                  : "text-[#596273] hover:bg-[#E1E6ED]/60 hover:text-[#18202F]",
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="size-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

type SidebarProps = {
  open: boolean;
  onClose: () => void;
  collapsed?: boolean;
};

export function Sidebar({ open, onClose, collapsed = false }: SidebarProps) {
  return (
    <>
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-[#E1E6ED] bg-white py-6 transition-all duration-300 lg:flex ${
          collapsed ? "w-18 px-2" : "w-64 px-5"
        }`}
      >
        <SidebarContent collapsed={collapsed} />
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close menu"
            className="absolute inset-0 cursor-default bg-[#172033]/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col overflow-y-auto bg-white px-5 py-6 shadow-xl">
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                aria-label="Close menu"
              >
                <X className="size-5" />
              </Button>
            </div>
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  );
}
