"use client";

import { usePathname, useRouter } from "next/navigation";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import {
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  User,
} from "lucide-react";

import chatSrc from "@/assets/Chatbot.lottie";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { navigationItems } from "@/config/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

type NavbarProps = {
  onOpenSidebar: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onOpenChat: () => void;
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
      <div className="flex size-9 items-center justify-center rounded-full bg-[#4263A3]/20 font-semibold text-[#4263A3]">
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
        variant="outline"
        size="icon"
        className="h-9 w-9 text-[#596273] border-[#E1E6ED] hover:bg-[#FEE2E2] hover:text-[#C85C5C] hover:border-[#FECACA] transition-colors"
        onClick={handleLogout}
        aria-label="Sign out"
      >
        <LogOut className="size-4" />
      </Button>
    </div>
  );
}

export function Navbar({
  onOpenSidebar,
  collapsed,
  onToggleCollapse,
  onOpenChat,
}: NavbarProps) {
  const pathname = usePathname();

  const segments = pathname.split("/").filter(Boolean);
  const currentLabel =
    navigationItems.find((item) => {
      if ("children" in item) {
        return item.children.some(
          (child) =>
            pathname === child.href || pathname.startsWith(child.href + "/"),
        );
      }
      return pathname === item.href || pathname.startsWith(item.href + "/");
    })?.label ?? "Dashboard";

  function getBreadcrumbItems() {
    const items: { label: string; href: string }[] = [];

    if (segments[0] === "dashboard") {
      items.push({ label: "Dashboard", href: "/dashboard" });
    } else if (segments[0] === "projects") {
      items.push({ label: "Projects", href: "/projects" });
    } else if (segments[0] === "reports") {
      items.push({ label: "Reports", href: "/reports" });
      if (segments[1] === "create") {
        items.push({ label: "Create", href: "/reports/create" });
      } else if (segments[1]) {
        items.push({ label: "Details", href: `/reports/${segments[1]}` });
      }
    } else if (segments[0] === "users") {
      items.push({ label: "Users", href: "/users" });
      if (segments[1]) {
        items.push({ label: "Details", href: `/users/${segments[1]}` });
      }
    } else if (segments[0] === "team-members") {
      items.push({ label: "Team Members", href: "/team-members" });
      if (segments[1]) {
        items.push({ label: "Details", href: `/team-members/${segments[1]}` });
      }
    }

    return items;
  }

  const breadcrumbItems = getBreadcrumbItems();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#E1E6ED] bg-white/90 px-4 backdrop-blur sm:px-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="hidden lg:inline-flex text-[#596273] hover:bg-[#E1E6ED]/60 hover:text-[#18202F]"
          onClick={onToggleCollapse}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeftOpen className="size-5" />
          ) : (
            <PanelLeftClose className="size-5" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden text-[#596273] hover:bg-[#E1E6ED]/60 hover:text-[#18202F]"
          onClick={onOpenSidebar}
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </Button>
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbItems.flatMap((item, index) => {
              const isLast = index === breadcrumbItems.length - 1;
              const elements = [
                <BreadcrumbItem key={item.href}>
                  {isLast ? (
                    <BreadcrumbPage>{item.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink href={item.href}>
                      {item.label}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>,
              ];
              if (!isLast) {
                elements.push(
                  <BreadcrumbSeparator key={`sep-${item.href}`} />,
                );
              }
              return elements;
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="size-9 overflow-hidden border-[#E1E6ED] p-0 text-[#596273] transition-colors hover:border-[#4263A3]/40 hover:bg-[#4263A3]/5"
          onClick={onOpenChat}
          aria-label="Open AI chat assistant"
          title="AI Chat Assistant"
        >
          <DotLottieReact
            src={chatSrc}
            autoplay
            loop
            useFrameInterpolation
            style={{ width: 30, height: 30 }}
          />
        </Button>
        <div className="lg:hidden">
          <UserMenu />
        </div>
        <div className="hidden lg:block">
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
