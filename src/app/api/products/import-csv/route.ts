import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { products, stock, productDeliveryStats } from '@/db/schema';
import { getCurrentUser, hasRole } from '@/lib/auth';
import { handleApiError, badRequest, unauthorized, forbidden } from '@/lib/api-error';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return unauthorized();
    }

    if (!hasRole(user.role, ['SUPER_ADMIN', 'ADMIN'])) {
      return forbidden();
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return badRequest('No file provided');
    }

    if (!file.name.endsWith('.csv')) {
      return badRequest('File must be a CSV');
    }

    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());

    if (lines.length < 2) {
      return badRequest('CSV file is empty or has no data rows');
    }

    // Parse header
    const header = lines[0].split(',').map(h => h.trim().toLowerCase());
    const requiredFields = ['name', 'sku', 'sellingprice', 'costprice'];
    const missingFields = requiredFields.filter(f => !header.includes(f));

    if (missingFields.length > 0) {
      return badRequest(`Missing required columns: ${missingFields.join(', ')}`);
    }

    const imported: { sku: string; name: string }[] = [];
    const errors: { row: number; error: string }[] = [];

    // Process data rows
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row: Record<string, string> = {};

      header.forEach((h, idx) => {
        row[h] = values[idx] || '';
      });

      try {
        const name = row['name'];
        const sku = row['sku'];
        const barcode = row['barcode'] || null;
        const sellingPrice = parseFloat(row['sellingprice']);
        const costPrice = parseFloat(row['costprice']);
        const description = row['description'] || null;

        if (!name || !sku) {
          errors.push({ row: i + 1, error: 'Name and SKU are required' });
          continue;
        }

        if (isNaN(sellingPrice) || isNaN(costPrice)) {
          errors.push({ row: i + 1, error: 'Invalid price values' });
          continue;
        }

        // Insert product
        const newProduct = await db
          .insert(products)
          .values({
            name,
            sku,
            barcode,
            sellingPrice: sellingPrice.toString(),
            costPrice: costPrice.toString(),
            description,
            createdBy: user.id,
          })
          .onConflictDoNothing()
          .returning();

        if (newProduct.length > 0) {
          // Create stock record
          await db.insert(stock).values({
            productId: newProduct[0].id,
            quantity: 0,
            minStockLevel: 10,
          });

          // Create delivery stats record
          await db.insert(productDeliveryStats).values({
            productId: newProduct[0].id,
            totalOrders: 0,
            deliveredOrders: 0,
            cancelledOrders: 0,
            returnedOrders: 0,
            inTransitOrders: 0,
          });

          imported.push({ sku, name });
        } else {
          errors.push({ row: i + 1, error: `SKU '${sku}' already exists` });
        }
      } catch (error) {
        errors.push({ row: i + 1, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }

    return NextResponse.json({
      imported: imported.length,
      products: imported,
      errors,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
