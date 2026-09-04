"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, FileText, LayoutDashboard, Users, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import logo from "@/assets/Logo.png";

export const navigationItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Projects", href: "/projects", icon: BarChart3 },
  { label: "Reports", href: "/reports", icon: FileText },
  { label: "Users", href: "/users", icon: Users, adminOnly: true },
];

export function SidebarContent() {
  const pathname = usePathname();
  const { permissions } = useAuth();

  const canManageUsers =
    permissions.includes("user.view") || permissions.includes("role.view");

  const items = navigationItems.filter(
    (item) => !item.adminOnly || canManageUsers,
  );

  return (
    <div className="flex flex-col gap-6">
      <Link href="/dashboard" className="flex items-center gap-2.5">
        <Image
          src={logo.src}
          alt="WorkPulse logo"
          unoptimized
          width={40}
          height={20}
          priority
          className="h-12 w-auto object-contain"
        />
        <span className="text-xl font-bold text-[#18202F]">Workpulse</span>
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
                isActive
                  ? "bg-[#4263A3] text-white shadow-sm"
                  : "text-[#596273] hover:bg-[#E1E6ED]/60 hover:text-[#18202F]",
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

type SidebarProps = {
  open: boolean;
  onClose: () => void;
};

export function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-[#E1E6ED] bg-white px-5 py-6 lg:flex">
        <SidebarContent />
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
