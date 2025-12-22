"use client";

import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bell,
  Search,
  Menu,
  User,
  Settings,
  LogOut,
  Package,
  LayoutDashboard,
  Warehouse,
  ShoppingCart,
  DollarSign,
  Receipt,
  Megaphone,
  Users,
  ScanLine,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { UserRole } from "@/types";

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

interface HeaderProps {
  sidebarCollapsed: boolean;
}

export function Header({ sidebarCollapsed }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const filteredNavItems = navItems.filter((item) =>
    user ? item.roles.includes(user.role) : false
  );

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

  const getPageTitle = () => {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length >= 2) {
      const title = segments[segments.length - 1]
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      return title;
    }
    return "Dashboard";
  };

  return (
    <header
      className={cn(
        "fixed right-0 top-0 z-30 flex h-16 items-center justify-between border-b bg-background px-4 transition-all duration-300 lg:px-6",
        sidebarCollapsed ? "left-16" : "left-64"
      )}
    >
      {/* Mobile Menu */}
      <div className="flex items-center gap-4">
        <Sheet>
          <SheetTrigger asChild className="lg:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 bg-sidebar p-0">
            <div className="flex h-full flex-col">
              {/* Logo */}
              <div className="flex h-16 items-center border-b border-white/10 px-4">
                <Link href="/" className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                    <Package className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-lg font-bold text-sidebar-foreground">
                    Inventory
                  </span>
                </Link>
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
                        <span>{item.title}</span>
                      </Link>
                    );
                  })}
                </nav>
              </ScrollArea>

              {/* User Profile */}
              {user && (
                <div className="border-t border-white/10 p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                      <p className="truncate text-sm font-medium text-sidebar-foreground">
                        {user.name}
                      </p>
                      <p className="truncate text-xs text-sidebar-foreground/60">
                        {user.role.replace("_", " ")}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleLogout}
                      className="h-8 w-8 text-sidebar-foreground/80 hover:bg-white/10 hover:text-sidebar-foreground"
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>

        {/* Page Title */}
        <div className="hidden lg:block">
          <h1 className="text-lg font-semibold">{getPageTitle()}</h1>
        </div>
      </div>

      {/* Mobile Title */}
      <div className="lg:hidden">
        <h1 className="text-lg font-semibold">{getPageTitle()}</h1>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-3">
        {/* Search - Hidden on mobile */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="w-64 pl-9"
            disabled
          />
        </div>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
            3
          </span>
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user?.avatar} alt={user?.name} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {user?.name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("") || "U"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem disabled>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
