"use client";

import { useState, useEffect, useCallback } from "react";
import { Charge, ChargeCategory } from "@/types";
import { chargesApi } from "@/lib/api-client";
import { formatDH, formatDate } from "@/lib/utils";
import { chargeCategories } from "@/lib/mock-data";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Receipt,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Loader2,
  CalendarIcon,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export default function ChargesPage() {
  const [charges, setCharges] = useState<Charge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedCharge, setSelectedCharge] = useState<Charge | null>(null);

  // Form state
  const [category, setCategory] = useState<ChargeCategory>("Electricity");
  const [customCategory, setCustomCategory] = useState("");
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState("");
  const [date, setDate] = useState<Date>(new Date());

  const loadCharges = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await chargesApi.getAll();
      setCharges(response.data);
    } catch {
      toast.error("Failed to load charges");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCharges();
  }, [loadCharges]);

  const resetForm = () => {
    setCategory("Electricity");
    setCustomCategory("");
    setAmount(0);
    setDescription("");
    setDate(new Date());
    setSelectedCharge(null);
  };

  const handleCreate = () => {
    resetForm();
    setFormOpen(true);
  };

  const handleEdit = (charge: Charge) => {
    setSelectedCharge(charge);
    setCategory(charge.category);
    setCustomCategory(charge.customCategory || "");
    setAmount(charge.amount);
    setDescription(charge.description);
    setDate(new Date(charge.date));
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const data = {
        category,
        customCategory: category === "Other" ? customCategory : undefined,
        amount,
        description,
        date,
      };

      const response = selectedCharge
        ? await chargesApi.update(selectedCharge.id, data)
        : await chargesApi.create(data);

      if (response.success) {
        toast.success(
          selectedCharge
            ? "Charge updated successfully"
            : "Charge created successfully"
        );
        setFormOpen(false);
        resetForm();
        loadCharges();
      } else {
        toast.error(response.error || "Failed to save charge");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (charge: Charge) => {
    try {
      const response = await chargesApi.delete(charge.id);
      if (response.success) {
        toast.success("Charge deleted");
        loadCharges();
      }
    } catch {
      toast.error("Failed to delete charge");
    }
  };

  // Calculate totals by category
  const categoryTotals = charges.reduce((acc, charge) => {
    const cat =
      charge.category === "Other" && charge.customCategory
        ? charge.customCategory
        : charge.category;
    acc[cat] = (acc[cat] || 0) + charge.amount;
    return acc;
  }, {} as Record<string, number>);

  const totalCharges = charges.reduce((sum, c) => sum + c.amount, 0);

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Receipt className="h-6 w-6" />
            Charges
          </h1>
          <p className="text-muted-foreground">Track your business expenses</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Charge
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Charges
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDH(totalCharges)}</div>
          </CardContent>
        </Card>
        {Object.entries(categoryTotals)
          .slice(0, 3)
          .map(([cat, total]) => (
            <Card key={cat}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {cat}
                </CardTitle>
                <Receipt className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatDH(total)}</div>
              </CardContent>
            </Card>
          ))}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : charges.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Receipt className="h-10 w-10 text-muted-foreground" />
                      <p className="text-muted-foreground">No charges found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                charges.map((charge) => (
                  <TableRow key={charge.id}>
                    <TableCell>{formatDate(charge.date)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {charge.category === "Other" && charge.customCategory
                          ? charge.customCategory
                          : charge.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {charge.description}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatDH(charge.amount)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {charge.createdBy}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(charge)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(charge)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedCharge ? "Edit Charge" : "Add Charge"}
            </DialogTitle>
            <DialogDescription>
              Enter the charge details
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => d && setDate(d)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as ChargeCategory)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {chargeCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {category === "Other" && (
              <div className="space-y-2">
                <Label>Custom Category</Label>
                <Input
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Enter category name"
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Amount (DH)</Label>
              <Input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter description"
                rows={3}
                required
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {selectedCharge ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
