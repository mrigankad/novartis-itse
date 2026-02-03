import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Info } from "lucide-react";
import { type ReactNode } from "react";

export type InfoTooltipContent = {
  what: ReactNode;
  how: ReactNode;
  where: ReactNode;
};

export function InfoTooltip({
  content,
  className,
  iconClassName,
}: {
  content: InfoTooltipContent;
  className?: string;
  iconClassName?: string;
}) {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label="Info"
            className={cn(
              "inline-flex items-center justify-center rounded-md p-1 text-muted-foreground/80 hover:text-foreground hover:bg-muted/50 transition-colors",
              className,
            )}
          >
            <Info className={cn("h-4 w-4", iconClassName)} />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={8} className="sm:max-w-[560px]">
          <div className="space-y-3">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-foreground/70">What It Shows</div>
              <div className="mt-1 text-sm text-foreground/90 leading-snug">{content.what}</div>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-foreground/70">How To Read It</div>
              <div className="mt-1 text-sm text-foreground/90 leading-snug">{content.how}</div>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-foreground/70">Data Source</div>
              <div className="mt-1 text-sm text-foreground/90 leading-snug">{content.where}</div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
