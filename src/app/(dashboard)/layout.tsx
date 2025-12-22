"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push("/login");
      return;
    }

    // Role-based route protection
    if (mounted && user) {
      const pathSegments = pathname.split("/").filter(Boolean);
      const roleFromPath = pathSegments[0];

      const rolePathMap: Record<string, string[]> = {
        SUPER_ADMIN: ["super-admin"],
        ADMIN: ["admin"],
        SHOP_AGENT: ["shop-agent"],
        WAREHOUSE_AGENT: ["warehouse-agent"],
        CONFIRMER: ["confirmer"],
      };

      const allowedPaths = rolePathMap[user.role] || [];

      if (!allowedPaths.includes(roleFromPath)) {
        // Redirect to appropriate dashboard
        const defaultPaths: Record<string, string> = {
          SUPER_ADMIN: "/super-admin/dashboard",
          ADMIN: "/admin/dashboard",
          SHOP_AGENT: "/shop-agent/orders",
          WAREHOUSE_AGENT: "/warehouse-agent/scan-orders",
          CONFIRMER: "/confirmer",
        };
        router.push(defaultPaths[user.role] || "/login");
      }
    }
  }, [mounted, isAuthenticated, user, router, pathname]);

  if (!mounted || !isAuthenticated || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar - Hidden on mobile */}
      <div className="hidden lg:block">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Header */}
      <Header sidebarCollapsed={sidebarCollapsed} />

      {/* Main Content */}
      <main
        className={cn(
          "min-h-screen pt-16 transition-all duration-300",
          sidebarCollapsed ? "lg:pl-16" : "lg:pl-64"
        )}
      >
        <div className="container mx-auto p-4 lg:p-6">{children}</div>
      </main>

      <Toaster position="top-right" richColors />
    </div>
  );
}
