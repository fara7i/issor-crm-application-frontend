"use client";

import { Stock } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Package, Plus, Minus, Loader2 } from "lucide-react";
import { useState } from "react";

interface StockFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    productId: string;
    quantity: number;
    changeType: "ADD" | "REMOVE";
    reason?: string;
  }) => Promise<void>;
  stock: Stock | null;
  mode: "add" | "remove";
  isLoading?: boolean;
}

export function StockForm({
  open,
  onOpenChange,
  onSubmit,
  stock,
  mode,
  isLoading,
}: StockFormProps) {
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState("");

  if (!stock) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      productId: stock.productId,
      quantity,
      changeType: mode === "add" ? "ADD" : "REMOVE",
      reason: reason || undefined,
    });
    setQuantity(1);
    setReason("");
  };

  const maxRemove = stock.quantity;
  const isRemoveDisabled = mode === "remove" && quantity > maxRemove;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === "add" ? (
              <>
                <Plus className="h-5 w-5 text-green-500" />
                Add Stock
              </>
            ) : (
              <>
                <Minus className="h-5 w-5 text-orange-500" />
                Remove Stock
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {mode === "add"
              ? "Add more units to your inventory"
              : "Remove units from your inventory"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Product Info */}
          <div className="flex items-center gap-4 p-4 rounded-lg bg-muted">
            <div className="h-12 w-12 rounded-lg bg-background flex items-center justify-center">
              {stock.product.imageUrl ? (
                <img
                  src={stock.product.imageUrl}
                  alt={stock.product.name}
                  className="h-12 w-12 rounded-lg object-cover"
                />
              ) : (
                <Package className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{stock.product.name}</p>
              <p className="text-sm text-muted-foreground">
                Current stock:{" "}
                <span className="font-semibold">{stock.quantity} units</span>
              </p>
            </div>
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label htmlFor="quantity">
              Quantity to {mode === "add" ? "Add" : "Remove"}
            </Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                id="quantity"
                type="number"
                min={1}
                max={mode === "remove" ? maxRemove : undefined}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="text-center"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() =>
                  setQuantity(
                    mode === "remove"
                      ? Math.min(maxRemove, quantity + 1)
                      : quantity + 1
                  )
                }
                disabled={mode === "remove" && quantity >= maxRemove}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {mode === "remove" && (
              <p className="text-xs text-muted-foreground">
                Maximum: {maxRemove} units
              </p>
            )}
          </div>

          {/* New Stock Preview */}
          <div className="p-3 rounded-lg bg-muted">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Stock after {mode === "add" ? "addition" : "removal"}:
              </span>
              <span
                className={`font-semibold ${
                  mode === "add" ? "text-green-600" : "text-orange-600"
                }`}
              >
                {mode === "add"
                  ? stock.quantity + quantity
                  : stock.quantity - quantity}{" "}
                units
              </span>
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason (Optional)</Label>
            <Textarea
              id="reason"
              placeholder={
                mode === "add"
                  ? "e.g., New shipment received"
                  : "e.g., Damaged goods, Sold offline"
              }
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || isRemoveDisabled || quantity < 1}
              className={
                mode === "add"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-orange-600 hover:bg-orange-700"
              }
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === "add" ? "Adding..." : "Removing..."}
                </>
              ) : mode === "add" ? (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add {quantity} Units
                </>
              ) : (
                <>
                  <Minus className="mr-2 h-4 w-4" />
                  Remove {quantity} Units
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
