
"use client"

import * as React from "react"
import { addDays, format } from "date-fns"
import { arSA } from "date-fns/locale" // For Arabic locale
import { Calendar as CalendarIcon } from "lucide-react"
import type { DateRange, SelectSingleEventHandler, SelectRangeEventHandler } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface DatePickerWithPresetsProps {
  className?: string;
  onDateChange?: (date: Date | DateRange | undefined) => void;
  selectedDate?: Date | DateRange | undefined; // Added selectedDate prop
  mode?: "single" | "range";
}

export function DatePickerWithPresets({ className, onDateChange, selectedDate, mode = "single" }: DatePickerWithPresetsProps) {
  const [date, setDate] = React.useState<Date | DateRange | undefined>(selectedDate)

  React.useEffect(() => { // Effect to sync with external changes to selectedDate
    setDate(selectedDate);
  }, [selectedDate]);

  const handleDateSelect: SelectSingleEventHandler | SelectRangeEventHandler = (newSelectedDate) => {
    setDate(newSelectedDate as Date | DateRange | undefined); // Keep internal state
    if (onDateChange) {
      onDateChange(newSelectedDate as Date | DateRange | undefined); // Notify parent
    }
  }

  const formatSelectedDate = () => {
    if (!date) return "اختر تاريخاً";
    if (mode === "single" && date instanceof Date) {
      return format(date, "PPP", { locale: arSA });
    }
    if (mode === "range" && typeof date === "object" && 'from' in date && date.from) {
      if (date.to) {
        return `${format(date.from, "LLL dd, y", { locale: arSA })} - ${format(date.to, "LLL dd, y", { locale: arSA })}`;
      }
      return format(date.from, "LLL dd, y", { locale: arSA });
    }
    return "اختر تاريخاً";
  }


  return (
    <div className={cn("grid gap-2", className)} dir="rtl">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-full sm:w-[280px] justify-start text-left font-normal shadow-sm hover:shadow-md transition-shadow",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" /> {/* Changed ml-2 to mr-2 for RTL */}
            {formatSelectedDate()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="flex w-auto flex-col space-y-2 p-2" align="start">
          <Select
            onValueChange={(value) => {
                let newSelectedDateRange: Date | DateRange | undefined;
                const today = new Date();
                if (value === "today") newSelectedDateRange = today;
                else if (value === "yesterday") newSelectedDateRange = addDays(today, -1);
                else if (value === "3days") newSelectedDateRange = { from: addDays(today, -2), to: today };
                else if (value === "7days") newSelectedDateRange = { from: addDays(today, -6), to: today };
                else if (value === "this_month") newSelectedDateRange = { from: new Date(today.getFullYear(), today.getMonth(), 1), to: new Date(today.getFullYear(), today.getMonth() + 1, 0) };
                else if (value === "last_month") newSelectedDateRange = { from: new Date(today.getFullYear(), today.getMonth() - 1, 1), to: new Date(today.getFullYear(), today.getMonth(), 0) };
                
                if (mode === "single" && newSelectedDateRange && typeof newSelectedDateRange === "object" && 'from' in newSelectedDateRange) {
                     handleDateSelect(newSelectedDateRange.from);
                } else {
                     handleDateSelect(newSelectedDateRange);
                }
            }}
            dir="rtl"
          >
            <SelectTrigger>
              <SelectValue placeholder="اختر فترة محددة" />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value="today">اليوم</SelectItem>
              <SelectItem value="yesterday">الأمس</SelectItem>
              {mode === "range" && (
                <>
                    <SelectItem value="3days">آخر 3 أيام</SelectItem>
                    <SelectItem value="7days">آخر 7 أيام</SelectItem>
                    <SelectItem value="this_month">هذا الشهر</SelectItem>
                    <SelectItem value="last_month">الشهر الماضي</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
          <div className="rounded-md border">
            <Calendar
              initialFocus
              mode={mode}
              selected={date as any} // Type assertion due to react-day-picker flexibility
              onSelect={handleDateSelect}
              numberOfMonths={mode === "range" ? 2 : 1}
              locale={arSA} // Set locale to Arabic
              dir="rtl" // Set direction to RTL
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
