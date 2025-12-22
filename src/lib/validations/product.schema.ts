import { z } from "zod";

export const productSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  sku: z
    .string()
    .regex(/^[A-Z]{3}-\d{4}$/, "SKU must be in format XXX-0000")
    .optional()
    .or(z.literal("")),
  barcode: z
    .string()
    .regex(/^\d{13}$/, "Barcode must be 13 digits")
    .optional()
    .or(z.literal("")),
  category: z.enum([
    "Electronics",
    "Clothing",
    "Food",
    "Beauty",
    "Home",
    "Sports",
    "Books",
    "Toys",
    "Other",
  ]),
  sellingPrice: z
    .number()
    .min(0.01, "Selling price must be greater than 0")
    .max(1000000, "Selling price must be less than 1,000,000"),
  costPrice: z
    .number()
    .min(0, "Cost price must be 0 or greater")
    .max(1000000, "Cost price must be less than 1,000,000"),
  imageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
});

export type ProductFormValues = z.infer<typeof productSchema>;

export const productFilterSchema = z.object({
  search: z.string().optional(),
  category: z
    .enum([
      "Electronics",
      "Clothing",
      "Food",
      "Beauty",
      "Home",
      "Sports",
      "Books",
      "Toys",
      "Other",
    ])
    .optional(),
  sortBy: z.enum(["name", "price", "date"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});
