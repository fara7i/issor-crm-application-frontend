"use client";

import { useState } from "react";
import Image from "next/image";
import { Stock } from "@/types";
import { cn, formatDate } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  MoreHorizontal,
  Plus,
  Minus,
  Package,
  AlertTriangle,
  ArrowUpDown,
} from "lucide-react";

interface StockTableProps {
  stock: Stock[];
  isLoading: boolean;
  onAddStock: (stock: Stock) => void;
  onRemoveStock: (stock: Stock) => void;
}

export function StockTable({
  stock,
  isLoading,
  onAddStock,
  onRemoveStock,
}: StockTableProps) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "quantity" | "date">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  // Filter and sort stock
  const filteredStock = stock
    .filter((s) => {
      const matchesSearch =
        s.product.name.toLowerCase().includes(search.toLowerCase()) ||
        s.product.sku.toLowerCase().includes(search.toLowerCase());
      const matchesLowStock = showLowStockOnly
        ? s.quantity <= s.lowStockThreshold
        : true;
      return matchesSearch && matchesLowStock;
    })
    .sort((a, b) => {
      const order = sortOrder === "asc" ? 1 : -1;
      switch (sortBy) {
        case "name":
          return a.product.name.localeCompare(b.product.name) * order;
        case "quantity":
          return (a.quantity - b.quantity) * order;
        case "date":
          return (
            (new Date(a.lastUpdated).getTime() -
              new Date(b.lastUpdated).getTime()) *
            order
          );
        default:
          return 0;
      }
    });

  const toggleSort = (column: "name" | "quantity" | "date") => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const lowStockCount = stock.filter(
    (s) => s.quantity <= s.lowStockThreshold
  ).length;

  if (isLoading) {
    return <StockTableSkeleton />;
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant={showLowStockOnly ? "default" : "outline"}
          size="sm"
          onClick={() => setShowLowStockOnly(!showLowStockOnly)}
        >
          <AlertTriangle className="mr-2 h-4 w-4" />
          Low Stock ({lowStockCount})
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Image</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-3 h-8"
                  onClick={() => toggleSort("name")}
                >
                  Product
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-3 h-8"
                  onClick={() => toggleSort("quantity")}
                >
                  Quantity
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-3 h-8"
                  onClick={() => toggleSort("date")}
                >
                  Last Updated
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStock.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-48 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Package className="h-10 w-10 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      {showLowStockOnly
                        ? "No low stock items"
                        : "No stock found"}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredStock.map((stockItem) => {
                const isLowStock =
                  stockItem.quantity <= stockItem.lowStockThreshold;
                const isOutOfStock = stockItem.quantity === 0;

                return (
                  <TableRow key={stockItem.id}>
                    <TableCell>
                      <div className="relative h-10 w-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                        {stockItem.product.imageUrl ? (
                          <Image
                            src={stockItem.product.imageUrl}
                            alt={stockItem.product.name}
                            fill
                            className="rounded-lg object-cover"
                            unoptimized
                          />
                        ) : (
                          <Package className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{stockItem.product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {stockItem.product.category}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="rounded bg-muted px-1.5 py-0.5 text-sm">
                        {stockItem.product.sku}
                      </code>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "font-semibold text-lg",
                          isOutOfStock
                            ? "text-destructive"
                            : isLowStock
                            ? "text-orange-500"
                            : "text-foreground"
                        )}
                      >
                        {stockItem.quantity}
                      </span>
                      <span className="text-xs text-muted-foreground ml-1">
                        units
                      </span>
                    </TableCell>
                    <TableCell>
                      {isOutOfStock ? (
                        <Badge variant="destructive">Out of Stock</Badge>
                      ) : isLowStock ? (
                        <Badge
                          variant="outline"
                          className="border-orange-500 text-orange-500"
                        >
                          Low Stock
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-green-500 text-green-500"
                        >
                          In Stock
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(stockItem.lastUpdated)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => onAddStock(stockItem)}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Stock
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onRemoveStock(stockItem)}
                            disabled={stockItem.quantity === 0}
                          >
                            <Minus className="mr-2 h-4 w-4" />
                            Remove Stock
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function StockTableSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-64" />
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              {Array.from({ length: 6 }).map((_, i) => (
                <TableHead key={i}>
                  <Skeleton className="h-4 w-20" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 6 }).map((_, j) => (
                  <TableCell key={j}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
