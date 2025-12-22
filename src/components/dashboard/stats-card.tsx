"use client";

import { cn, formatDH, formatPercentage } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  iconColor?: string;
  isCurrency?: boolean;
  isLoading?: boolean;
}

export function StatsCard({
  title,
  value,
  change,
  changeLabel = "from last month",
  icon: Icon,
  iconColor = "text-primary",
  isCurrency = false,
  isLoading = false,
}: StatsCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-24" />
        </CardContent>
      </Card>
    );
  }

  const displayValue = isCurrency
    ? formatDH(typeof value === "number" ? value : parseFloat(value))
    : value;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full bg-muted",
            iconColor
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{displayValue}</div>
        {change !== undefined && (
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            {change >= 0 ? (
              <TrendingUp className="h-3 w-3 text-green-500" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500" />
            )}
            <span
              className={cn(
                "font-medium",
                change >= 0 ? "text-green-500" : "text-red-500"
              )}
            >
              {formatPercentage(change)}
            </span>
            <span>{changeLabel}</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
