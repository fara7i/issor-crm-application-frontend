"use client";

import { useState, useEffect, useCallback } from "react";
import { Order, DashboardStats, SalesData, TopProduct } from "@/types";
import { dashboardApi } from "@/lib/api-client";
import { StatsCard } from "@/components/dashboard/stats-card";
import { RecentOrders } from "@/components/dashboard/recent-orders";
import { SalesChart } from "@/components/dashboard/charts/sales-chart";
import { TopProductsChart } from "@/components/dashboard/charts/top-products-chart";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  DollarSign,
  ShoppingCart,
  Package,
  AlertTriangle,
  Plus,
  RefreshCw,
  Zap,
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [statsRes, salesRes, productsRes, ordersRes] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getSalesData(),
        dashboardApi.getTopProducts(),
        dashboardApi.getRecentOrders(10),
      ]);

      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }
      if (salesRes.success && salesRes.data) {
        setSalesData(salesRes.data);
      }
      if (productsRes.success && productsRes.data) {
        setTopProducts(productsRes.data);
      }
      if (ordersRes.success && ordersRes.data) {
        setRecentOrders(ordersRes.data);
      }
    } catch {
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here&apos;s what&apos;s happening with your store.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadDashboardData}
          disabled={isLoading}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Revenue"
          value={stats?.totalRevenue || 0}
          change={stats?.revenueChange}
          icon={DollarSign}
          iconColor="text-green-600"
          isCurrency
          isLoading={isLoading}
        />
        <StatsCard
          title="Total Orders"
          value={stats?.totalOrders || 0}
          change={stats?.ordersChange}
          icon={ShoppingCart}
          iconColor="text-blue-600"
          isLoading={isLoading}
        />
        <StatsCard
          title="Products"
          value={stats?.productsCount || 0}
          icon={Package}
          iconColor="text-purple-600"
          isLoading={isLoading}
        />
        <StatsCard
          title="Low Stock Items"
          value={stats?.lowStockItems || 0}
          icon={AlertTriangle}
          iconColor={
            (stats?.lowStockItems || 0) > 0 ? "text-orange-600" : "text-gray-600"
          }
          isLoading={isLoading}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-4">
        <SalesChart data={salesData} isLoading={isLoading} />
        <TopProductsChart data={topProducts} isLoading={isLoading} />
      </div>

      {/* Quick Actions and Recent Orders */}
      <div className="grid gap-4 lg:grid-cols-4">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="h-4 w-4" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/super-admin/products" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </Link>
            <Link href="/super-admin/stock" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Package className="mr-2 h-4 w-4" />
                Manage Stock
              </Button>
            </Link>
            <Link href="/super-admin/charges" className="block">
              <Button variant="outline" className="w-full justify-start">
                <DollarSign className="mr-2 h-4 w-4" />
                Add Charge
              </Button>
            </Link>
            <Link href="/super-admin/salaries" className="block">
              <Button variant="outline" className="w-full justify-start">
                <DollarSign className="mr-2 h-4 w-4" />
                Manage Salaries
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <div className="lg:col-span-3">
          <RecentOrders orders={recentOrders} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
