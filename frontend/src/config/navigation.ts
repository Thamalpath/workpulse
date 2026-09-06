import {
  BarChart3,
  FileText,
  KeyRound,
  LayoutDashboard,
  LineChart,
  ShieldCheck,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavLeaf = {
  label: string;
  href: string;
  icon: LucideIcon;
  permission?: string;
};

export type NavEntry =
  | NavLeaf
  | {
      label: string;
      icon: LucideIcon;
      children: NavLeaf[];
    };

export const navigationItems: NavEntry[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  {
    label: "Visual Insights",
    href: "/insights",
    icon: LineChart,
    permission: "report.view.all",
  },
  { label: "Projects", href: "/projects", icon: BarChart3 },
  { label: "Reports", href: "/reports", icon: FileText },
  {
    label: "User Management",
    icon: UserCog,
    children: [
      { label: "Users", href: "/users", icon: Users, permission: "user.view" },
      {
        label: "Permissions",
        href: "/permissions",
        icon: ShieldCheck,
        permission: "permission.view",
      },
      {
        label: "Assign Permissions",
        href: "/assign-permissions",
        icon: KeyRound,
        permission: "role.view",
      },
    ],
  },
];
