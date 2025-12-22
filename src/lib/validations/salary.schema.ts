import { z } from "zod";

export const salarySchema = z.object({
  employeeName: z
    .string()
    .min(2, "Employee name must be at least 2 characters")
    .max(100, "Employee name must be less than 100 characters"),
  employeeRole: z
    .string()
    .min(2, "Role must be at least 2 characters")
    .max(50, "Role must be less than 50 characters"),
  baseSalary: z
    .number()
    .min(0, "Base salary cannot be negative")
    .max(100000, "Base salary must be less than 100,000"),
  bonuses: z
    .number()
    .min(0, "Bonuses cannot be negative")
    .max(50000, "Bonuses must be less than 50,000"),
  deductions: z
    .number()
    .min(0, "Deductions cannot be negative")
    .max(50000, "Deductions must be less than 50,000"),
  month: z.enum([
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]),
  year: z
    .number()
    .min(2020, "Year must be 2020 or later")
    .max(2100, "Year must be before 2100"),
});

export type SalaryFormValues = z.infer<typeof salarySchema>;
