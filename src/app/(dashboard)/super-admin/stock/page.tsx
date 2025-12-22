"use client";

import { useState, useEffect, useCallback } from "react";
import { Stock } from "@/types";
import { stockApi } from "@/lib/api-client";
import { StockTable } from "@/components/stock/stock-table";
import { StockForm } from "@/components/stock/stock-form";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Warehouse, Package, AlertTriangle, TrendingUp } from "lucide-react";

export default function StockPage() {
  const [stock, setStock] = useState<Stock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal states
  const [formOpen, setFormOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [formMode, setFormMode] = useState<"add" | "remove">("add");

  const loadStock = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await stockApi.getAll();
      setStock(response.data);
    } catch {
      toast.error("Failed to load stock data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStock();
  }, [loadStock]);

  const handleAddStock = (stockItem: Stock) => {
    setSelectedStock(stockItem);
    setFormMode("add");
    setFormOpen(true);
  };

  const handleRemoveStock = (stockItem: Stock) => {
    setSelectedStock(stockItem);
    setFormMode("remove");
    setFormOpen(true);
  };

  const handleFormSubmit = async (data: {
    productId: string;
    quantity: number;
    changeType: "ADD" | "REMOVE";
    reason?: string;
  }) => {
    setIsSubmitting(true);
    try {
      const response = await stockApi.updateQuantity(data);
      if (response.success) {
        toast.success(
          `Stock ${data.changeType === "ADD" ? "added" : "removed"} successfully`
        );
        setFormOpen(false);
        loadStock();
      } else {
        toast.error(response.error || "Failed to update stock");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate stats
  const totalProducts = stock.length;
  const totalUnits = stock.reduce((sum, s) => sum + s.quantity, 0);
  const lowStockCount = stock.filter(
    (s) => s.quantity <= s.lowStockThreshold
  ).length;
  const outOfStockCount = stock.filter((s) => s.quantity === 0).length;

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Warehouse className="h-6 w-6" />
          Stock Management
        </h1>
        <p className="text-muted-foreground">
          Manage your inventory stock levels
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Products
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Units
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUnits.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Low Stock
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {lowStockCount}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Out of Stock
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {outOfStockCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stock Table */}
      <StockTable
        stock={stock}
        isLoading={isLoading}
        onAddStock={handleAddStock}
        onRemoveStock={handleRemoveStock}
      />

      {/* Stock Form Dialog */}
      <StockForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleFormSubmit}
        stock={selectedStock}
        mode={formMode}
        isLoading={isSubmitting}
      />
    </div>
  );
}
