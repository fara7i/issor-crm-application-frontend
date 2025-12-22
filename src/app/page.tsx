"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && user) {
      const redirectMap: Record<string, string> = {
        SUPER_ADMIN: "/super-admin/dashboard",
        ADMIN: "/admin/dashboard",
        SHOP_AGENT: "/shop-agent/orders",
        WAREHOUSE_AGENT: "/warehouse-agent/scan-orders",
        CONFIRMER: "/confirmer",
      };
      router.push(redirectMap[user.role] || "/login");
    } else {
      router.push("/login");
    }
  }, [isAuthenticated, user, router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
    </div>
  );
}
