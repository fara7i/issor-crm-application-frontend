"use client";

import { useState, useEffect, useCallback } from "react";
import { Salary } from "@/types";
import { salariesApi } from "@/lib/api-client";
import { formatDH } from "@/lib/utils";
import { months } from "@/lib/mock-data";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  DollarSign,
  Plus,
  MoreHorizontal,
  Edit,
  CheckCircle,
  Trash2,
  Loader2,
  Users,
  TrendingUp,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function SalariesPage() {
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedSalary, setSelectedSalary] = useState<Salary | null>(null);

  // Form state
  const [employeeName, setEmployeeName] = useState("");
  const [employeeRole, setEmployeeRole] = useState("");
  const [baseSalary, setBaseSalary] = useState(0);
  const [bonuses, setBonuses] = useState(0);
  const [deductions, setDeductions] = useState(0);
  const [month, setMonth] = useState(months[new Date().getMonth()]);
  const [year, setYear] = useState(new Date().getFullYear());

  const loadSalaries = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await salariesApi.getAll();
      setSalaries(response.data);
    } catch {
      toast.error("Failed to load salaries");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSalaries();
  }, [loadSalaries]);

  const resetForm = () => {
    setEmployeeName("");
    setEmployeeRole("");
    setBaseSalary(0);
    setBonuses(0);
    setDeductions(0);
    setMonth(months[new Date().getMonth()]);
    setYear(new Date().getFullYear());
    setSelectedSalary(null);
  };

  const handleCreate = () => {
    resetForm();
    setFormOpen(true);
  };

  const handleEdit = (salary: Salary) => {
    setSelectedSalary(salary);
    setEmployeeName(salary.employeeName);
    setEmployeeRole(salary.employeeRole);
    setBaseSalary(salary.baseSalary);
    setBonuses(salary.bonuses);
    setDeductions(salary.deductions);
    setMonth(salary.month);
    setYear(salary.year);
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const data = {
        employeeName,
        employeeRole,
        baseSalary,
        bonuses,
        deductions,
        month,
        year,
      };

      const response = selectedSalary
        ? await salariesApi.update(selectedSalary.id, data)
        : await salariesApi.create(data);

      if (response.success) {
        toast.success(
          selectedSalary
            ? "Salary updated successfully"
            : "Salary record created successfully"
        );
        setFormOpen(false);
        resetForm();
        loadSalaries();
      } else {
        toast.error(response.error || "Failed to save salary");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkAsPaid = async (salary: Salary) => {
    try {
      const response = await salariesApi.markAsPaid(salary.id);
      if (response.success) {
        toast.success("Salary marked as paid");
        loadSalaries();
      }
    } catch {
      toast.error("Failed to update salary");
    }
  };

  const handleDelete = async (salary: Salary) => {
    try {
      const response = await salariesApi.delete(salary.id);
      if (response.success) {
        toast.success("Salary record deleted");
        loadSalaries();
      }
    } catch {
      toast.error("Failed to delete salary");
    }
  };

  const netSalary = baseSalary + bonuses - deductions;
  const totalPending = salaries
    .filter((s) => s.status === "PENDING")
    .reduce((sum, s) => sum + s.netSalary, 0);
  const totalPaid = salaries
    .filter((s) => s.status === "PAID")
    .reduce((sum, s) => sum + s.netSalary, 0);

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <DollarSign className="h-6 w-6" />
            Salaries
          </h1>
          <p className="text-muted-foreground">
            Manage employee salary records
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Salary Record
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Employees
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(salaries.map((s) => s.employeeName)).size}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Payments
            </CardTitle>
            <DollarSign className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {formatDH(totalPending)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Paid
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {formatDH(totalPaid)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Base Salary</TableHead>
                <TableHead>Bonuses</TableHead>
                <TableHead>Deductions</TableHead>
                <TableHead>Net Salary</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 9 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : salaries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-48 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <DollarSign className="h-10 w-10 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        No salary records found
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                salaries.map((salary) => (
                  <TableRow key={salary.id}>
                    <TableCell className="font-medium">
                      {salary.employeeName}
                    </TableCell>
                    <TableCell>{salary.employeeRole}</TableCell>
                    <TableCell>
                      {salary.month} {salary.year}
                    </TableCell>
                    <TableCell>{formatDH(salary.baseSalary)}</TableCell>
                    <TableCell className="text-green-600">
                      +{formatDH(salary.bonuses)}
                    </TableCell>
                    <TableCell className="text-red-600">
                      -{formatDH(salary.deductions)}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatDH(salary.netSalary)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          salary.status === "PAID" ? "default" : "outline"
                        }
                        className={
                          salary.status === "PAID"
                            ? "bg-green-500"
                            : "border-orange-500 text-orange-500"
                        }
                      >
                        {salary.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(salary)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          {salary.status === "PENDING" && (
                            <DropdownMenuItem
                              onClick={() => handleMarkAsPaid(salary)}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Mark as Paid
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleDelete(salary)}
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
              {selectedSalary ? "Edit Salary Record" : "Add Salary Record"}
            </DialogTitle>
            <DialogDescription>
              Enter the salary details for the employee
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Employee Name</Label>
                <Input
                  value={employeeName}
                  onChange={(e) => setEmployeeName(e.target.value)}
                  placeholder="Enter name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Input
                  value={employeeRole}
                  onChange={(e) => setEmployeeRole(e.target.value)}
                  placeholder="Enter role"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Month</Label>
                <Select value={month} onValueChange={setMonth}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Year</Label>
                <Input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Base Salary (DH)</Label>
              <Input
                type="number"
                value={baseSalary}
                onChange={(e) => setBaseSalary(Number(e.target.value))}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Bonuses (DH)</Label>
                <Input
                  type="number"
                  value={bonuses}
                  onChange={(e) => setBonuses(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Deductions (DH)</Label>
                <Input
                  type="number"
                  value={deductions}
                  onChange={(e) => setDeductions(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="bg-muted p-3 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Net Salary:</span>
                <span className="text-lg font-bold">{formatDH(netSalary)}</span>
              </div>
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
                {selectedSalary ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
