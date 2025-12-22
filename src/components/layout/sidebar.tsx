"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import { UserRole } from "@/types";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  LayoutDashboard,
  Package,
  Warehouse,
  ShoppingCart,
  DollarSign,
  Receipt,
  Megaphone,
  Users,
  ScanLine,
  CheckCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/super-admin/dashboard",
    icon: LayoutDashboard,
    roles: ["SUPER_ADMIN", "ADMIN"],
  },
  {
    title: "Products",
    href: "/super-admin/products",
    icon: Package,
    roles: ["SUPER_ADMIN", "ADMIN"],
  },
  {
    title: "Stock",
    href: "/super-admin/stock",
    icon: Warehouse,
    roles: ["SUPER_ADMIN", "ADMIN"],
  },
  {
    title: "Salaries",
    href: "/super-admin/salaries",
    icon: DollarSign,
    roles: ["SUPER_ADMIN", "ADMIN"],
  },
  {
    title: "Charges",
    href: "/super-admin/charges",
    icon: Receipt,
    roles: ["SUPER_ADMIN", "ADMIN"],
  },
  {
    title: "Ads Costs",
    href: "/super-admin/ads-costs",
    icon: Megaphone,
    roles: ["SUPER_ADMIN", "ADMIN"],
  },
  {
    title: "Admins",
    href: "/super-admin/admins",
    icon: Users,
    roles: ["SUPER_ADMIN"],
  },
  {
    title: "Orders",
    href: "/shop-agent/orders",
    icon: ShoppingCart,
    roles: ["SHOP_AGENT"],
  },
  {
    title: "Scan Orders",
    href: "/warehouse-agent/scan-orders",
    icon: ScanLine,
    roles: ["WAREHOUSE_AGENT"],
  },
  {
    title: "Dashboard",
    href: "/confirmer",
    icon: CheckCircle,
    roles: ["CONFIRMER"],
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const filteredNavItems = navItems.filter((item) =>
    user ? item.roles.includes(user.role) : false
  );

  const getBasePath = () => {
    switch (user?.role) {
      case "SUPER_ADMIN":
        return "/super-admin";
      case "ADMIN":
        return "/admin";
      case "SHOP_AGENT":
        return "/shop-agent";
      case "WAREHOUSE_AGENT":
        return "/warehouse-agent";
      case "CONFIRMER":
        return "/confirmer";
      default:
        return "/";
    }
  };

  const getHref = (item: NavItem) => {
    if (user?.role === "ADMIN" && item.href.startsWith("/super-admin")) {
      return item.href.replace("/super-admin", "/admin");
    }
    return item.href;
  };

  const isActive = (href: string) => {
    const adjustedHref = getHref({ href } as NavItem);
    return pathname === adjustedHref || pathname.startsWith(adjustedHref + "/");
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar text-sidebar-foreground transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
          {!collapsed && (
            <Link href={getBasePath()} className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Package className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold">Inventory</span>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="h-8 w-8 text-sidebar-foreground hover:bg-white/10"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="space-y-1">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const href = getHref(item);
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-sidebar-foreground/80 hover:bg-white/10 hover:text-sidebar-foreground"
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span>{item.title}</span>}
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

        {/* User Profile */}
        <div className="border-t border-white/10 p-4">
          {user && (
            <div
              className={cn(
                "flex items-center gap-3",
                collapsed && "justify-center"
              )}
            >
              <Avatar className="h-9 w-9">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-sm font-medium">{user.name}</p>
                  <p className="truncate text-xs text-sidebar-foreground/60">
                    {user.role.replace("_", " ")}
                  </p>
                </div>
              )}
              {!collapsed && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={logout}
                  className="h-8 w-8 text-sidebar-foreground/80 hover:bg-white/10 hover:text-sidebar-foreground"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
