import * as React from "react";
import { format, addDays, startOfMonth, startOfQuarter, startOfToday } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { useFilters } from "@/contexts/FilterContext";

export function DatePickerWithRange({
    className,
}: React.HTMLAttributes<HTMLDivElement>) {
    const { filters, updateFilter } = useFilters();

    const [date, setDate] = React.useState<DateRange | undefined>(
        filters.dateRange === "all"
            ? undefined
            : {
                from: filters.customStartDate ? new Date(filters.customStartDate) : addDays(new Date(), -30),
                to: filters.customEndDate ? new Date(filters.customEndDate) : new Date(),
            }
    );

    const handleSelect = (range: DateRange | undefined) => {
        setDate(range);
        if (range?.from && range?.to) {
            updateFilter("dateRange", "custom");
            updateFilter("customStartDate", range.from.toISOString());
            updateFilter("customEndDate", range.to.toISOString());
        }
    };

    const setPreset = (preset: string) => {
        updateFilter("dateRange", preset);
        updateFilter("customStartDate", undefined as any);
        updateFilter("customEndDate", undefined as any);

        // Update local date state for the calendar view if needed
        const now = new Date();
        if (preset === "all") setDate(undefined);
        else if (preset === "today") setDate({ from: now, to: now });
        else if (preset === "7d") setDate({ from: addDays(now, -7), to: now });
        else if (preset === "30d") setDate({ from: addDays(now, -30), to: now });
        else if (preset === "mtd") setDate({ from: startOfMonth(now), to: now });
        else if (preset === "qtd") setDate({ from: startOfQuarter(now), to: now });
    };

    return (
        <div className={cn("grid gap-2", className)}>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                            "w-[260px] justify-start text-left font-normal bg-card h-9 border-border hover:border-primary/50",
                            !date && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.dateRange === "all" ? (
                            <span>All Data</span>
                        ) : date?.from ? (
                            date.to ? (
                                <>
                                    {format(date.from, "LLL dd, y")} -{" "}
                                    {format(date.to, "LLL dd, y")}
                                </>
                            ) : (
                                format(date.from, "LLL dd, y")
                            )
                        ) : (
                            <span>Pick a date range</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <div className="flex flex-col sm:flex-row">
                        <div className="p-2 border-r border-border flex flex-col gap-1 min-w-[120px]">
                            <Button variant="ghost" size="sm" className="justify-start font-normal" onClick={() => setPreset("all")}>All Data</Button>
                            <Button variant="ghost" size="sm" className="justify-start font-normal" onClick={() => setPreset("today")}>Today</Button>
                            <Button variant="ghost" size="sm" className="justify-start font-normal" onClick={() => setPreset("7d")}>Last 7 Days</Button>
                            <Button variant="ghost" size="sm" className="justify-start font-normal" onClick={() => setPreset("30d")}>Last 30 Days</Button>
                            <Button variant="ghost" size="sm" className="justify-start font-normal" onClick={() => setPreset("mtd")}>MTD</Button>
                            <Button variant="ghost" size="sm" className="justify-start font-normal" onClick={() => setPreset("qtd")}>QTD</Button>
                        </div>
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={date?.from}
                            selected={date}
                            onSelect={handleSelect}
                            numberOfMonths={2}
                        />
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}
