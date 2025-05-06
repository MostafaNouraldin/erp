"use client"

import * as React from "react"
import { addDays, format } from "date-fns"
import { arSA } from "date-fns/locale" // For Arabic locale
import { Calendar as CalendarIcon } from "lucide-react"
import type { DateRange } from "react-day-picker"

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
  mode?: "single" | "range";
}

export function DatePickerWithPresets({ className, onDateChange, mode = "single" }: DatePickerWithPresetsProps) {
  const [date, setDate] = React.useState<Date | DateRange | undefined>()

  const handleDateChange = (newDate: Date | DateRange | undefined) => {
    setDate(newDate);
    if (onDateChange) {
      onDateChange(newDate);
    }
  }

  const formatSelectedDate = () => {
    if (!date) return "اختر تاريخاً";
    if (mode === "single" && date instanceof Date) {
      return format(date, "PPP", { locale: arSA });
    }
    if (mode === "range" && typeof date === "object" && date.from) {
      if (date.to) {
        return `${format(date.from, "LLL dd, y", { locale: arSA })} - ${format(date.to, "LLL dd, y", { locale: arSA })}`;
      }
      return format(date.from, "LLL dd, y", { locale: arSA });
    }
    return "اختر تاريخاً";
  }


  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-full sm:w-[280px] justify-start text-left font-normal shadow-sm hover:shadow-md transition-shadow",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="ml-2 h-4 w-4" />
            {formatSelectedDate()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="flex w-auto flex-col space-y-2 p-2" align="start">
          <Select
            onValueChange={(value) => {
                let newSelectedDate: Date | DateRange | undefined;
                if (value === "today") newSelectedDate = new Date();
                else if (value === "yesterday") newSelectedDate = addDays(new Date(), -1);
                else if (value === "3days") newSelectedDate = { from: addDays(new Date(), -2), to: new Date() };
                else if (value === "7days") newSelectedDate = { from: addDays(new Date(), -6), to: new Date() };
                else if (value === "this_month") newSelectedDate = { from: new Date(new Date().getFullYear(), new Date().getMonth(), 1), to: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0) };
                else if (value === "last_month") newSelectedDate = { from: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1), to: new Date(new Date().getFullYear(), new Date().getMonth(), 0) };
                
                if (mode === "single" && newSelectedDate && typeof newSelectedDate === "object" && 'from' in newSelectedDate) {
                    handleDateChange(newSelectedDate.from);
                } else {
                    handleDateChange(newSelectedDate);
                }
            }}
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
              onSelect={handleDateChange}
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