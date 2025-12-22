import { z } from "zod";

export const adSchema = z
  .object({
    name: z
      .string()
      .min(2, "Campaign name must be at least 2 characters")
      .max(100, "Campaign name must be less than 100 characters"),
    platform: z.enum([
      "Facebook",
      "Instagram",
      "Google",
      "TikTok",
      "YouTube",
      "Other",
    ]),
    cost: z
      .number()
      .min(0, "Cost cannot be negative")
      .max(1000000, "Cost must be less than 1,000,000"),
    results: z
      .number()
      .min(0, "Results cannot be negative")
      .max(10000000, "Results must be less than 10,000,000"),
    startDate: z.date({ message: "Start date is required" }),
    endDate: z.date({ message: "End date is required" }),
    status: z.enum(["ACTIVE", "PAUSED", "COMPLETED"]),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "End date must be after start date",
    path: ["endDate"],
  });

export type AdFormValues = z.infer<typeof adSchema>;
