"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Order } from "@/types";
import { ordersApi, scanOrdersApi } from "@/lib/api-client";
import { formatDH, getOrderStatusColor } from "@/lib/utils";
import { BarcodeScanner } from "@/components/orders/barcode-scanner";
import { CameraScanner } from "@/components/orders/camera-scanner";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  ScanLine,
  Package,
  CheckCircle,
  Clock,
  Truck,
  ClipboardList,
  Camera,
  Keyboard,
  Loader2,
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
  const [scanMode, setScanMode] = useState<"keyboard" | "camera">("keyboard");

  // Import dialog state
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [deliveryCompany, setDeliveryCompany] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Audio ref for notification sound
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio on mount
  useEffect(() => {
    audioRef.current = new Audio("/sounds/notification.mp3");
  }, []);

  const playNotificationSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((error) => {
        console.warn("Could not play notification sound:", error);
      });
    }
  }, []);

  const handleBarcodeScan = async (barcode: string) => {
    // Prevent scanning while processing
    if (isLoading) return;

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
          // Play notification sound when order is found
          playNotificationSound();
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

  const handleImportOrder = async () => {
    if (!currentOrder) return;

    const alreadyImported = scannedOrders.find(
      (s) => s.order.id === currentOrder.id
    );

    if (alreadyImported) {
      toast.error("This order has already been imported");
      return;
    }

    setIsSubmitting(true);
    try {
      // Save to database
      const response = await scanOrdersApi.create({
        orderId: currentOrder.id,
        deliveryCompany: deliveryCompany || undefined,
        trackingNumber: trackingNumber || undefined,
      });

      if (response.success) {
        // Play notification sound on success
        playNotificationSound();

        // Add to local state
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
        setImportDialogOpen(false);
        setDeliveryCompany("");
        setTrackingNumber("");
      } else {
        toast.error(response.error || "Failed to import order");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickImport = async () => {
    if (!currentOrder) return;

    const alreadyImported = scannedOrders.find(
      (s) => s.order.id === currentOrder.id
    );

    if (alreadyImported) {
      toast.error("This order has already been imported");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await scanOrdersApi.create({
        orderId: currentOrder.id,
      });

      if (response.success) {
        // Play notification sound on success
        playNotificationSound();

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
      } else {
        toast.error(response.error || "Failed to import order");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
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
          Scan order barcodes using keyboard input or camera
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
        {/* Scanner Section */}
        <div className="space-y-4">
          <Tabs value={scanMode} onValueChange={(v) => setScanMode(v as "keyboard" | "camera")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="keyboard" className="flex items-center gap-2">
                <Keyboard className="h-4 w-4" />
                Keyboard
              </TabsTrigger>
              <TabsTrigger value="camera" className="flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Camera
              </TabsTrigger>
            </TabsList>
            <TabsContent value="keyboard" className="mt-4">
              <BarcodeScanner
                onScan={handleBarcodeScan}
                isLoading={isLoading}
                placeholder="Scan order barcode..."
              />
            </TabsContent>
            <TabsContent value="camera" className="mt-4">
              <CameraScanner
                onScan={handleBarcodeScan}
                isProcessing={isLoading}
                title="Order Barcode Scanner"
              />
            </TabsContent>
          </Tabs>

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
                    <p className="font-medium">{currentOrder.customerPhone || "N/A"}</p>
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
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={handleQuickImport}
                    disabled={
                      scannedOrders.some((s) => s.order.id === currentOrder.id) ||
                      isSubmitting
                    }
                  >
                    {isSubmitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="mr-2 h-4 w-4" />
                    )}
                    Quick Import
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setImportDialogOpen(true)}
                    disabled={
                      scannedOrders.some((s) => s.order.id === currentOrder.id) ||
                      isSubmitting
                    }
                  >
                    <Truck className="mr-2 h-4 w-4" />
                    With Details
                  </Button>
                  <Button variant="ghost" onClick={() => setCurrentOrder(null)}>
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

      {/* Import with Details Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Import Order with Details</DialogTitle>
            <DialogDescription>
              Add delivery company and tracking information
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {currentOrder && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-mono font-bold">{currentOrder.orderNumber}</p>
                <p className="text-sm text-muted-foreground">
                  {currentOrder.customerName} - {formatDH(currentOrder.total)}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Delivery Company (Optional)</Label>
              <Input
                value={deliveryCompany}
                onChange={(e) => setDeliveryCompany(e.target.value)}
                placeholder="e.g., DHL, FedEx, Amana Express"
              />
            </div>

            <div className="space-y-2">
              <Label>Tracking Number (Optional)</Label>
              <Input
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Enter tracking number"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setImportDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleImportOrder} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                "Import Order"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
