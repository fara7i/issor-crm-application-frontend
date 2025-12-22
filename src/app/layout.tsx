import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: {
    default: "Inventory Management System",
    template: "%s | Inventory Management",
  },
  description:
    "A comprehensive inventory management system for e-commerce businesses. Manage products, stock, orders, salaries, and more.",
  keywords: [
    "inventory",
    "management",
    "e-commerce",
    "products",
    "stock",
    "orders",
  ],
  authors: [{ name: "Magazine Team" }],
  viewport: "width=device-width, initial-scale=1",
  robots: "noindex, nofollow",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
