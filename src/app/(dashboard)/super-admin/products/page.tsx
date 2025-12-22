"use client";

import { useState, useEffect, useCallback } from "react";
import { Product } from "@/types";
import { ProductFormValues } from "@/lib/validations/product.schema";
import { productsApi } from "@/lib/api-client";
import { downloadCSV } from "@/lib/utils";
import { ProductTable } from "@/components/products/product-table";
import { ProductForm } from "@/components/products/product-form";
import { BarcodeDisplay } from "@/components/products/barcode-display";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { toast } from "sonner";
import { Plus, Package } from "lucide-react";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal states
  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await productsApi.getAll();
      setProducts(response.data);
    } catch {
      toast.error("Failed to load products");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleCreate = () => {
    setSelectedProduct(null);
    setFormOpen(true);
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setFormOpen(true);
  };

  const handleView = (product: Product) => {
    setSelectedProduct(product);
    setViewOpen(true);
  };

  const handleDeleteClick = (product: Product) => {
    setSelectedProduct(product);
    setDeleteOpen(true);
  };

  const handleFormSubmit = async (data: ProductFormValues) => {
    setIsSubmitting(true);
    try {
      if (selectedProduct) {
        const response = await productsApi.update(selectedProduct.id, data);
        if (response.success) {
          toast.success("Product updated successfully");
          setFormOpen(false);
          loadProducts();
        } else {
          toast.error(response.error || "Failed to update product");
        }
      } else {
        const response = await productsApi.create(data);
        if (response.success) {
          toast.success("Product created successfully");
          setFormOpen(false);
          loadProducts();
        } else {
          toast.error(response.error || "Failed to create product");
        }
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedProduct) return;

    setIsSubmitting(true);
    try {
      const response = await productsApi.delete(selectedProduct.id);
      if (response.success) {
        toast.success("Product deleted successfully");
        setDeleteOpen(false);
        loadProducts();
      } else {
        toast.error(response.error || "Failed to delete product");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExport = () => {
    if (products.length === 0) {
      toast.error("No products to export");
      return;
    }

    const exportData = products.map((p) => ({
      Name: p.name,
      SKU: p.sku,
      Barcode: p.barcode,
      Category: p.category,
      "Selling Price": p.sellingPrice,
      "Cost Price": p.costPrice,
      Description: p.description || "",
      "Created At": new Date(p.createdAt).toLocaleDateString(),
    }));

    downloadCSV(exportData, `products-${new Date().toISOString().split("T")[0]}`);
    toast.success("Products exported successfully");
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Package className="h-6 w-6" />
            Products
          </h1>
          <p className="text-muted-foreground">
            Manage your product inventory
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>

      {/* Products Table */}
      <ProductTable
        products={products}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        onView={handleView}
        onExport={handleExport}
      />

      {/* Product Form Dialog */}
      <ProductForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleFormSubmit}
        product={selectedProduct}
        isLoading={isSubmitting}
      />

      {/* Barcode/View Dialog */}
      <BarcodeDisplay
        open={viewOpen}
        onOpenChange={setViewOpen}
        product={selectedProduct}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold">{selectedProduct?.name}</span>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
