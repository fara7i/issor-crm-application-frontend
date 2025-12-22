"use client";

import { useState } from "react";
import { Order } from "@/types";
import { ordersApi } from "@/lib/api-client";
import { formatDH, getOrderStatusColor } from "@/lib/utils";
import { BarcodeScanner } from "@/components/orders/barcode-scanner";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  ScanLine,
  Package,
  CheckCircle,
  Clock,
  Truck,
  ClipboardList,
} from "lucide-react";

interface ScannedOrder {
  order: Order;
  scannedAt: Date;
  imported: boolean;
}

export default function ScanOrdersPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [scannedOrders, setScannedOrders] = useState<ScannedOrder[]>([]);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);

  const handleBarcodeScan = async (barcode: string) => {
    setIsLoading(true);
    try {
      const response = await ordersApi.getByBarcode(barcode);
      if (response.success && response.data) {
        const order = response.data;
        setCurrentOrder(order);

        const alreadyScanned = scannedOrders.find(
          (s) => s.order.id === order.id
        );
        if (alreadyScanned) {
          toast.info("This order has already been scanned");
        } else {
          toast.success(`Order ${order.orderNumber} found`);
        }
      } else {
        toast.error("Order not found");
        setCurrentOrder(null);
      }
    } catch {
      toast.error("Failed to scan order");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportOrder = () => {
    if (!currentOrder) return;

    const alreadyImported = scannedOrders.find(
      (s) => s.order.id === currentOrder.id
    );

    if (alreadyImported) {
      toast.error("This order has already been imported");
      return;
    }

    setScannedOrders([
      {
        order: currentOrder,
        scannedAt: new Date(),
        imported: true,
      },
      ...scannedOrders,
    ]);

    toast.success(`Order ${currentOrder.orderNumber} imported successfully`);
    setCurrentOrder(null);
  };

  const todayScanned = scannedOrders.filter(
    (s) =>
      new Date(s.scannedAt).toDateString() === new Date().toDateString()
  ).length;

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <ScanLine className="h-6 w-6" />
          Scan Orders
        </h1>
        <p className="text-muted-foreground">
          Scan order barcodes to import order data
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Scanned Today
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayScanned}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Imported
            </CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scannedOrders.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Last Scan
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium">
              {scannedOrders.length > 0
                ? new Date(scannedOrders[0].scannedAt).toLocaleTimeString()
                : "No scans yet"}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Scanner */}
        <div className="space-y-4">
          <BarcodeScanner
            onScan={handleBarcodeScan}
            isLoading={isLoading}
            placeholder="Scan order barcode..."
          />

          {/* Current Order */}
          {currentOrder && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Scanned Order
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <code className="text-lg font-bold">
                      {currentOrder.orderNumber}
                    </code>
                    <Badge
                      variant="outline"
                      className={`ml-2 ${getOrderStatusColor(
                        currentOrder.status
                      )}`}
                    >
                      {currentOrder.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <p className="text-lg font-bold">
                    {formatDH(currentOrder.total)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Customer</p>
                    <p className="font-medium">{currentOrder.customerName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Phone</p>
                    <p className="font-medium">{currentOrder.customerPhone}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Address</p>
                    <p className="font-medium">{currentOrder.customerAddress}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Products</p>
                  <div className="space-y-1">
                    {currentOrder.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between text-sm bg-muted p-2 rounded"
                      >
                        <span>
                          {item.product.name} x{item.quantity}
                        </span>
                        <span className="font-medium">
                          {formatDH(item.totalPrice)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={handleImportOrder}
                    disabled={scannedOrders.some(
                      (s) => s.order.id === currentOrder.id
                    )}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Import Order
                  </Button>
                  <Button variant="outline" onClick={() => setCurrentOrder(null)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recent Scanned Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recently Scanned</CardTitle>
          </CardHeader>
          <CardContent>
            {scannedOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Package className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No orders scanned yet</p>
                <p className="text-xs text-muted-foreground">
                  Scan an order barcode to get started
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Scanned</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scannedOrders.slice(0, 10).map((scanned) => (
                    <TableRow key={scanned.order.id}>
                      <TableCell className="font-mono text-sm">
                        {scanned.order.orderNumber}
                      </TableCell>
                      <TableCell>{scanned.order.customerName}</TableCell>
                      <TableCell className="font-medium">
                        {formatDH(scanned.order.total)}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(scanned.scannedAt).toLocaleTimeString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
