import { z } from "zod";

export const orderItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
});

export const orderSchema = z.object({
  items: z
    .array(orderItemSchema)
    .min(1, "At least one product is required"),
  customerName: z
    .string()
    .min(2, "Customer name must be at least 2 characters")
    .max(100, "Customer name must be less than 100 characters"),
  customerPhone: z
    .string()
    .regex(
      /^(\+212|0)[5-7]\d{8}$/,
      "Please enter a valid Moroccan phone number"
    ),
  customerAddress: z
    .string()
    .min(10, "Address must be at least 10 characters")
    .max(300, "Address must be less than 300 characters"),
  deliveryPrice: z
    .number()
    .min(0, "Delivery price cannot be negative")
    .max(1000, "Delivery price must be less than 1000"),
  notes: z
    .string()
    .max(500, "Notes must be less than 500 characters")
    .optional(),
});

export type OrderFormValues = z.infer<typeof orderSchema>;

export const orderStatusSchema = z.enum([
  "PENDING",
  "CONFIRMED",
  "IN_TRANSIT",
  "DELIVERED",
  "RETURNED",
  "CANCELLED",
]);

export const orderFilterSchema = z.object({
  search: z.string().optional(),
  status: orderStatusSchema.optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
});
