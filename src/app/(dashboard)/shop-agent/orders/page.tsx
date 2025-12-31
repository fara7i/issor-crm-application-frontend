"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Order, OrderStatus, Product } from "@/types";
import { ordersApi, productsApi } from "@/lib/api-client";
import { formatDH } from "@/lib/utils";
import { OrderTable } from "@/components/orders/order-table";
import { BarcodeScanner } from "@/components/orders/barcode-scanner";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Package,
  Loader2,
  Check,
  Truck,
} from "lucide-react";

interface CartItem {
  product: Product;
  quantity: number;
}

export default function ShopAgentOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScanLoading, setIsScanLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isDeliveryOrder, setIsDeliveryOrder] = useState(false);
  const [orderFormOpen, setOrderFormOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [deliveryPrice, setDeliveryPrice] = useState(30);

  // View order dialog
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

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

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await ordersApi.getAll();
      setOrders(response.data);
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleBarcodeScan = async (barcode: string) => {
    setIsScanLoading(true);
    try {
      const response = await productsApi.getByBarcode(barcode);
      if (response.success && response.data) {
        const product = response.data;
        const existingItem = cart.find((item) => item.product.id === product.id);

        if (existingItem) {
          setCart(
            cart.map((item) =>
              item.product.id === product.id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            )
          );
          toast.success(`Added another ${product.name} to cart`);
        } else {
          setCart([...cart, { product, quantity: 1 }]);
          toast.success(`${product.name} added to cart`);
        }
      } else {
        toast.error("Product not found");
      }
    } catch {
      toast.error("Failed to scan product");
    } finally {
      setIsScanLoading(false);
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(
      cart
        .map((item) =>
          item.product.id === productId
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + item.product.sellingPrice * item.quantity,
    0
  );
  const total = subtotal + (isDeliveryOrder ? deliveryPrice : 0);

  // Quick create order for in-store sales (no customer details needed)
  const handleQuickCreateOrder = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await ordersApi.create({
        items: cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        customerName: "Walk-in Customer",
        customerAddress: "In-store",
        deliveryPrice: 0,
      });

      if (response.success) {
        // Play notification sound on success
        playNotificationSound();
        toast.success("Order created successfully!");
        clearCart();
        loadOrders();
      } else {
        toast.error(response.error || "Failed to create order");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Create order with customer details (for delivery)
  const handleCreateDeliveryOrder = async () => {
    if (!customerName || !customerAddress) {
      toast.error("Please fill in customer name and address");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await ordersApi.create({
        items: cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        customerName,
        customerPhone: customerPhone || undefined,
        customerAddress,
        deliveryPrice,
      });

      if (response.success) {
        // Play notification sound on success
        playNotificationSound();
        toast.success("Delivery order created successfully!");
        setOrderFormOpen(false);
        clearCart();
        setCustomerName("");
        setCustomerPhone("");
        setCustomerAddress("");
        loadOrders();
      } else {
        toast.error(response.error || "Failed to create order");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setViewOpen(true);
  };

  const handleUpdateStatus = async (order: Order, status: OrderStatus) => {
    try {
      const response = await ordersApi.updateStatus(order.id, status);
      if (response.success) {
        toast.success(`Order status updated to ${status.replace("_", " ")}`);
        loadOrders();
      } else {
        toast.error(response.error || "Failed to update status");
      }
    } catch {
      toast.error("An error occurred");
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <ShoppingCart className="h-6 w-6" />
          Orders
        </h1>
        <p className="text-muted-foreground">
          Scan products and create orders quickly
        </p>
      </div>

      {/* Scanner and Cart */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Barcode Scanner */}
        <BarcodeScanner
          onScan={handleBarcodeScan}
          isLoading={isScanLoading}
          placeholder="Scan product barcode..."
        />

        {/* Cart */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Current Cart ({cart.length} items)
            </CardTitle>
            {cart.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearCart}>
                Clear Cart
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Package className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">Cart is empty</p>
                <p className="text-xs text-muted-foreground">
                  Scan a product barcode to add items
                </p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cart.map((item) => (
                      <TableRow key={item.product.id}>
                        <TableCell>
                          <p className="font-medium">{item.product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.product.sku}
                          </p>
                        </TableCell>
                        <TableCell>{formatDH(item.product.sellingPrice)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => updateQuantity(item.product.id, -1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => updateQuantity(item.product.id, 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatDH(item.product.sellingPrice * item.quantity)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive"
                            onClick={() => removeFromCart(item.product.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Order Type Toggle */}
                <div className="mt-4 flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    <span className="text-sm font-medium">Delivery Order</span>
                  </div>
                  <Switch
                    checked={isDeliveryOrder}
                    onCheckedChange={setIsDeliveryOrder}
                  />
                </div>

                {/* Totals and Actions */}
                <div className="mt-4 flex justify-between items-center">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      Subtotal: {formatDH(subtotal)}
                    </p>
                    {isDeliveryOrder && (
                      <p className="text-sm text-muted-foreground">
                        Delivery: {formatDH(deliveryPrice)}
                      </p>
                    )}
                    <p className="text-lg font-bold">
                      Total: {formatDH(total)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {isDeliveryOrder ? (
                      <Button onClick={() => setOrderFormOpen(true)}>
                        <Truck className="mr-2 h-4 w-4" />
                        Create Delivery Order
                      </Button>
                    ) : (
                      <Button
                        onClick={handleQuickCreateOrder}
                        disabled={isSubmitting}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            Quick Sale
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Recent Orders</h2>
        <OrderTable
          orders={orders}
          isLoading={isLoading}
          onView={handleViewOrder}
          onUpdateStatus={handleUpdateStatus}
        />
      </div>

      {/* Create Delivery Order Dialog */}
      <Dialog open={orderFormOpen} onOpenChange={setOrderFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create Delivery Order</DialogTitle>
            <DialogDescription>
              Enter customer details for delivery
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Customer Name *</Label>
              <Input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter customer name"
              />
            </div>

            <div className="space-y-2">
              <Label>Phone Number (Optional)</Label>
              <Input
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="+212 600 000 000"
              />
            </div>

            <div className="space-y-2">
              <Label>Delivery Address *</Label>
              <Input
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                placeholder="Enter delivery address"
              />
            </div>

            <div className="space-y-2">
              <Label>Delivery Price (DH)</Label>
              <Input
                type="number"
                value={deliveryPrice}
                onChange={(e) => setDeliveryPrice(Number(e.target.value))}
              />
            </div>

            <div className="bg-muted p-3 rounded-lg">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>{formatDH(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Delivery:</span>
                <span>{formatDH(deliveryPrice)}</span>
              </div>
              <div className="flex justify-between font-bold mt-2 pt-2 border-t">
                <span>Total:</span>
                <span>{formatDH(total)}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOrderFormOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateDeliveryOrder} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Order"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Order Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              {selectedOrder?.orderNumber}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Customer</p>
                  <p className="font-medium">{selectedOrder.customerName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Phone</p>
                  <p className="font-medium">{selectedOrder.customerPhone || "N/A"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">Address</p>
                  <p className="font-medium">{selectedOrder.customerAddress}</p>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedOrder.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.product.name}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{formatDH(item.totalPrice)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="bg-muted p-3 rounded-lg text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatDH(selectedOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery:</span>
                  <span>{formatDH(selectedOrder.deliveryPrice)}</span>
                </div>
                <div className="flex justify-between font-bold mt-2 pt-2 border-t">
                  <span>Total:</span>
                  <span>{formatDH(selectedOrder.total)}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
