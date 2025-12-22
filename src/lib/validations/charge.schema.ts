import { z } from "zod";

export const chargeSchema = z
  .object({
    category: z.enum([
      "Lawyer",
      "Water Bill",
      "Electricity",
      "Broken Parts",
      "Other",
    ]),
    customCategory: z
      .string()
      .min(2, "Custom category must be at least 2 characters")
      .max(50, "Custom category must be less than 50 characters")
      .optional(),
    amount: z
      .number()
      .min(0.01, "Amount must be greater than 0")
      .max(1000000, "Amount must be less than 1,000,000"),
    description: z
      .string()
      .min(5, "Description must be at least 5 characters")
      .max(300, "Description must be less than 300 characters"),
    date: z.date({ message: "Date is required" }),
  })
  .refine(
    (data) => {
      if (data.category === "Other") {
        return data.customCategory && data.customCategory.length >= 2;
      }
      return true;
    },
    {
      message: "Custom category is required when 'Other' is selected",
      path: ["customCategory"],
    }
  );

export type ChargeFormValues = z.infer<typeof chargeSchema>;

export const chargeFilterSchema = z.object({
  category: z
    .enum(["Lawyer", "Water Bill", "Electricity", "Broken Parts", "Other"])
    .optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
});
