import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string | number;
  trend?: {
    value: number;
    direction: "up" | "down" | "neutral";
    label?: string;
  };
  trendIsGood?: boolean; // Whether 'up' is considered a good trend (default: true)
  status?: "critical" | "high" | "moderate" | "low" | "neutral";
  icon?: React.ReactNode;
  suffix?: string;
  className?: string;
  delay?: number;
}

const statusStyles = {
  critical: "border-l-4 border-l-priority-critical",
  high: "border-l-4 border-l-priority-high",
  moderate: "border-l-4 border-l-priority-moderate",
  low: "border-l-4 border-l-priority-low",
  neutral: "border-l-4 border-l-muted",
};

const trendIcons = {
  up: TrendingUp,
  down: TrendingDown,
  neutral: Minus,
};

export function KPICard({
  title,
  value,
  trend,
  trendIsGood = true,
  status = "neutral",
  icon,
  suffix,
  className,
  delay = 0,
}: KPICardProps) {
  const TrendIcon = trend ? trendIcons[trend.direction] : null;

  const getTrendColorClass = (direction: "up" | "down" | "neutral") => {
    if (direction === "neutral") return "text-trend-neutral";

    const isUp = direction === "up";
    const isPositiveEffect = trendIsGood ? isUp : !isUp;

    return isPositiveEffect ? "text-trend-up" : "text-trend-down";
  };

  return (
    <div
      className={cn(
        "kpi-card relative overflow-hidden",
        "bg-gradient-to-br from-card via-card to-card/98",
        "border border-border/60 rounded-xl p-5 lg:p-6",
        "transition-all duration-300 ease-out",
        "hover:shadow-2xl hover:-translate-y-1 hover:border-border/80",
        "backdrop-blur-sm",
        "before:absolute before:inset-0 before:rounded-xl",
        "before:bg-gradient-to-br before:from-white/5 before:via-transparent before:to-transparent",
        "before:pointer-events-none",
        statusStyles[status],
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Decorative corner accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/5 to-transparent rounded-bl-full pointer-events-none" />
      
      <div className="flex items-start justify-between relative z-10">
        <div className="space-y-2.5 flex-1 min-w-0">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl lg:text-4xl font-bold tracking-tight text-foreground bg-gradient-to-br from-foreground to-foreground/80 bg-clip-text">
              {value}
            </span>
            {suffix && (
              <span className="text-base font-medium text-muted-foreground/80">
                {suffix}
              </span>
            )}
          </div>
          {trend && (
            <div className="flex items-center gap-2 flex-wrap pt-1">
              {TrendIcon && (
                <TrendIcon
                  className={cn(
                    "h-4 w-4 flex-shrink-0",
                    getTrendColorClass(trend.direction)
                  )}
                />
              )}
              <span
                className={cn(
                  "text-xs font-bold tracking-wide",
                  getTrendColorClass(trend.direction)
                )}
              >
                {trend.value > 0 ? "+" : ""}
                {trend.value}%
              </span>
              {trend.label && (
                <span className="text-xs text-muted-foreground/70">
                  {trend.label}
                </span>
              )}
            </div>
          )}
        </div>
        {icon && (
          <div className="rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 p-3 text-primary ml-4 flex-shrink-0 shadow-sm border border-primary/10">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
