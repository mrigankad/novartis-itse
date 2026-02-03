import { cn } from "@/lib/utils";
import { InfoTooltip, type InfoTooltipContent } from "@/components/ui/info-tooltip";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  headerAction?: React.ReactNode;
  info?: InfoTooltipContent;
}

export function ChartCard({
  title,
  subtitle,
  children,
  className,
  headerAction,
  info,
}: ChartCardProps) {
  return (
    <div className={cn(
      "chart-container relative overflow-hidden",
      "bg-gradient-to-br from-card via-card to-card/98",
      "border border-border/60 rounded-xl p-5 lg:p-6",
      "transition-all duration-300 ease-out",
      "hover:shadow-2xl hover:-translate-y-1 hover:border-border/80",
      "backdrop-blur-sm",
      "before:absolute before:inset-0 before:rounded-xl",
      "before:bg-gradient-to-br before:from-white/5 before:via-transparent before:to-transparent",
      "before:pointer-events-none",
      className
    )}>
      {/* Decorative corner accent */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-primary/5 to-transparent rounded-bl-full pointer-events-none" />
      
      <div className="mb-5 lg:mb-6 flex items-start justify-between border-b border-border/50 pb-4 relative z-10">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2 min-w-0">
            <h3 className="text-lg lg:text-xl font-bold text-foreground tracking-tight font-heading min-w-0">
              <span className="truncate block">{title}</span>
            </h3>
            {info && <InfoTooltip content={info} className="mt-0.5 flex-shrink-0" />}
          </div>
          {subtitle && (
            <p className="mt-2 text-sm text-muted-foreground/80 font-medium">
              {subtitle}
            </p>
          )}
          <p className="mt-2 text-xs text-muted-foreground/60 italic font-normal">
            Click on chart elements to drill down
          </p>
        </div>
        {headerAction && (
          <div className="ml-4 flex-shrink-0 relative z-10">
            {headerAction}
          </div>
        )}
      </div>
      <div className="w-full relative z-10">{children}</div>
    </div>
  );
}
