import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface DashboardCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  className?: string;
}

export const DashboardCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend = "neutral",
  trendValue,
  className
}: DashboardCardProps) => {
  const trendColors = {
    up: "text-success",
    down: "text-destructive", 
    neutral: "text-muted-foreground"
  };

  return (
    <Card className={cn("bg-gradient-card shadow-soft hover:shadow-medium transition-shadow", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && (
          <Icon className="h-4 w-4 text-muted-foreground" />
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-primary">{value}</div>
        <div className="flex items-center justify-between">
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
          {trendValue && (
            <p className={cn("text-xs font-medium", trendColors[trend])}>
              {trendValue}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};