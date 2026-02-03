import * as React from "react";
import { format, addDays, startOfMonth, startOfQuarter } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { useFilters } from "@/contexts/FilterContext";

function toDateOnly(value: Date) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

function fromDateOnly(value: string) {
    const [y, m, d] = value.split("-").map((x) => parseInt(x, 10));
    return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function getDateRangeFromFilters(filters: {
    dateRange: string;
    customStartDate?: string;
    customEndDate?: string;
}) {
    const now = new Date();

    if (filters.dateRange === "all") return undefined;

    if (filters.dateRange === "custom" && filters.customStartDate && filters.customEndDate) {
        return { from: fromDateOnly(filters.customStartDate), to: fromDateOnly(filters.customEndDate) };
    }

    if (filters.dateRange === "today") return { from: now, to: now };
    if (filters.dateRange === "7d") return { from: addDays(now, -6), to: now };
    if (filters.dateRange === "15d") return { from: addDays(now, -14), to: now };
    if (filters.dateRange === "30d") return { from: addDays(now, -29), to: now };
    if (filters.dateRange === "mtd") return { from: startOfMonth(now), to: now };
    if (filters.dateRange === "qtd") return { from: startOfQuarter(now), to: now };

    return undefined;
}

export function DatePickerWithRange({
    className,
}: React.HTMLAttributes<HTMLDivElement>) {
    const { filters, updateFilter } = useFilters();

    const [date, setDate] = React.useState<DateRange | undefined>(() =>
        getDateRangeFromFilters({
            dateRange: filters.dateRange,
            customStartDate: filters.customStartDate,
            customEndDate: filters.customEndDate,
        })
    );

    React.useEffect(() => {
        setDate(
            getDateRangeFromFilters({
                dateRange: filters.dateRange,
                customStartDate: filters.customStartDate,
                customEndDate: filters.customEndDate,
            })
        );
    }, [filters.dateRange, filters.customStartDate, filters.customEndDate]);

    const handleSelect = (range: DateRange | undefined) => {
        setDate(range);
        if (range?.from && range?.to) {
            updateFilter("dateRange", "custom");
            updateFilter("customStartDate", toDateOnly(range.from));
            updateFilter("customEndDate", toDateOnly(range.to));
        }
    };

    const setPreset = (preset: string) => {
        updateFilter("dateRange", preset);
        updateFilter("customStartDate", undefined);
        updateFilter("customEndDate", undefined);

        // Update local date state for the calendar view if needed
        setDate(getDateRangeFromFilters({ dateRange: preset }));
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
                            <Button variant="ghost" size="sm" className="justify-start font-normal" onClick={() => setPreset("15d")}>Last 15 Days</Button>
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
