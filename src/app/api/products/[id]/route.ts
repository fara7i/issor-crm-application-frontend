import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { products, stock } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUser, hasRole } from '@/lib/auth';
import { updateProductSchema, validateRequest } from '@/lib/api-validations';
import { handleApiError, badRequest, unauthorized, forbidden, notFound, conflict } from '@/lib/api-error';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return unauthorized();
    }

    if (!hasRole(user.role, ['SUPER_ADMIN', 'ADMIN', 'SHOP_AGENT'])) {
      return forbidden();
    }

    const { id } = await params;
    const productId = parseInt(id, 10);

    if (isNaN(productId)) {
      return badRequest('Invalid product ID');
    }

    const product = await db
      .select({
        id: products.id,
        name: products.name,
        sku: products.sku,
        barcode: products.barcode,
        sellingPrice: products.sellingPrice,
        costPrice: products.costPrice,
        description: products.description,
        imageUrl: products.imageUrl,
        isActive: products.isActive,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
        stockQuantity: stock.quantity,
        minStockLevel: stock.minStockLevel,
        warehouseLocation: stock.warehouseLocation,
      })
      .from(products)
      .leftJoin(stock, eq(products.id, stock.productId))
      .where(eq(products.id, productId))
      .limit(1);

    if (product.length === 0) {
      return notFound('Product not found');
    }

    return NextResponse.json({ product: product[0] });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return unauthorized();
    }

    if (!hasRole(user.role, ['SUPER_ADMIN', 'ADMIN'])) {
      return forbidden();
    }

    const { id } = await params;
    const productId = parseInt(id, 10);

    if (isNaN(productId)) {
      return badRequest('Invalid product ID');
    }

    // Check if product exists
    const existingProduct = await db
      .select({ id: products.id, sku: products.sku, barcode: products.barcode })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (existingProduct.length === 0) {
      return notFound('Product not found');
    }

    const body = await request.json();
    const validation = validateRequest(updateProductSchema, body);

    if (!validation.success) {
      return badRequest('Validation error', validation.errors.errors);
    }

    const { name, sku, barcode, sellingPrice, costPrice, description, imageUrl } = validation.data;

    // Check for duplicate SKU if changed
    if (sku && sku !== existingProduct[0].sku) {
      const duplicateSku = await db
        .select({ id: products.id })
        .from(products)
        .where(eq(products.sku, sku))
        .limit(1);

      if (duplicateSku.length > 0) {
        return conflict('A product with this SKU already exists');
      }
    }

    // Check for duplicate barcode if changed
    if (barcode && barcode !== existingProduct[0].barcode) {
      const duplicateBarcode = await db
        .select({ id: products.id })
        .from(products)
        .where(eq(products.barcode, barcode))
        .limit(1);

      if (duplicateBarcode.length > 0) {
        return conflict('A product with this barcode already exists');
      }
    }

    // Update product
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = name;
    if (sku !== undefined) updateData.sku = sku;
    if (barcode !== undefined) updateData.barcode = barcode || null;
    if (sellingPrice !== undefined) updateData.sellingPrice = sellingPrice.toString();
    if (costPrice !== undefined) updateData.costPrice = costPrice.toString();
    if (description !== undefined) updateData.description = description || null;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl || null;

    const updatedProduct = await db
      .update(products)
      .set(updateData)
      .where(eq(products.id, productId))
      .returning();

    return NextResponse.json({ product: updatedProduct[0] });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return unauthorized();
    }

    // Only SUPER_ADMIN can delete products
    if (!hasRole(user.role, ['SUPER_ADMIN'])) {
      return forbidden();
    }

    const { id } = await params;
    const productId = parseInt(id, 10);

    if (isNaN(productId)) {
      return badRequest('Invalid product ID');
    }

    // Check if product exists
    const existingProduct = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (existingProduct.length === 0) {
      return notFound('Product not found');
    }

    // Soft delete - set is_active to false
    await db
      .update(products)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(products.id, productId));

    return NextResponse.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}
