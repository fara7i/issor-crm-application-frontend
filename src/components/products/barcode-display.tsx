"use client";

import Image from "next/image";
import { Product } from "@/types";
import { formatDH, formatDate } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Package,
  Barcode,
  Tag,
  Calendar,
  Copy,
  Printer,
  DollarSign,
} from "lucide-react";
import { toast } from "sonner";

interface BarcodeDisplayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
}

export function BarcodeDisplay({
  open,
  onOpenChange,
  product,
}: BarcodeDisplayProps) {
  if (!product) return null;

  const copyBarcode = () => {
    navigator.clipboard.writeText(product.barcode);
    toast.success("Barcode copied to clipboard");
  };

  const printBarcode = () => {
    toast.info("Print functionality will be available soon");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Product Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Product Info */}
          <div className="flex gap-4">
            <div className="relative h-20 w-20 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
              {product.imageUrl ? (
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  className="rounded-lg object-cover"
                  unoptimized
                />
              ) : (
                <Package className="h-10 w-10 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate">{product.name}</h3>
              <Badge variant="secondary" className="mt-1">
                {product.category}
              </Badge>
              {product.description && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                  {product.description}
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Barcode Display */}
          <div className="bg-white border-2 border-dashed rounded-lg p-6 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Barcode className="h-4 w-4" />
                <span className="text-sm">EAN-13 Barcode</span>
              </div>
              {/* Simple barcode visualization */}
              <div className="flex items-center justify-center gap-[2px] h-16">
                {product.barcode.split("").map((digit, i) => (
                  <div
                    key={i}
                    className="bg-black"
                    style={{
                      width: parseInt(digit) % 2 === 0 ? 2 : 3,
                      height: "100%",
                    }}
                  />
                ))}
              </div>
              <p className="font-mono text-2xl font-bold tracking-wider">
                {product.barcode}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyBarcode}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </Button>
                <Button variant="outline" size="sm" onClick={printBarcode}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          {/* Product Details Grid */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground">SKU</p>
                <p className="font-mono font-medium">{product.sku}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground">Created</p>
                <p className="font-medium">{formatDate(product.createdAt)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground">Selling Price</p>
                <p className="font-medium text-primary">
                  {formatDH(product.sellingPrice)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground">Cost Price</p>
                <p className="font-medium">{formatDH(product.costPrice)}</p>
              </div>
            </div>
          </div>

          {/* Margin */}
          <div className="bg-muted rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Profit Margin</span>
              <span className="font-semibold text-green-600">
                {(
                  ((product.sellingPrice - product.costPrice) /
                    product.costPrice) *
                  100
                ).toFixed(1)}
                %
              </span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-muted-foreground">Profit per Unit</span>
              <span className="font-semibold">
                {formatDH(product.sellingPrice - product.costPrice)}
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
