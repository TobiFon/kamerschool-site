import React, { useState, useEffect } from "react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CustomCalendarProps {
  value: Date;
  onChange: (date: Date) => void;
  disableFutureDates?: boolean;
  disablePastDates?: boolean;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
}

const CustomCalendar: React.FC<CustomCalendarProps> = ({
  value,
  onChange,
  disableFutureDates = false,
  disablePastDates = false,
  minDate,
  maxDate,
  className,
}) => {
  // State for the current month being displayed
  const [currentMonth, setCurrentMonth] = useState(
    startOfMonth(value || new Date())
  );
  const [isOpen, setIsOpen] = useState(false);

  // Generate days for the current month view
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Navigation functions
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  // Determine if a date should be disabled
  const isDateDisabled = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (disableFutureDates && date > today) return true;
    if (disablePastDates && date < today) return true;
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;

    return false;
  };

  // Update current month when value changes
  useEffect(() => {
    if (value) {
      setCurrentMonth(startOfMonth(value));
    }
  }, [value]);

  // Handle date selection
  const handleDateSelect = (date: Date) => {
    if (!isDateDisabled(date)) {
      onChange(date);
    }
  };

  // Toggle calendar visibility
  const toggleCalendar = () => {
    setIsOpen(!isOpen);
  };

  // Format days of week
  const daysOfWeek = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  return (
    <div className={cn("relative w-full", className)}>
      {/* Date display button */}
      <Button
        type="button"
        variant="outline"
        onClick={toggleCalendar}
        className="w-full justify-between text-left font-normal"
      >
        {value ? format(value, "PPP") : "Select date"}
        <span className="ml-auto opacity-50">📅</span>
      </Button>

      {/* Calendar dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-background border rounded-md shadow-md p-3">
          {/* Calendar header */}
          <div className="flex justify-between items-center mb-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={prevMonth}
              className="h-7 w-7 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="font-medium">
              {format(currentMonth, "MMMM yyyy")}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={nextMonth}
              className="h-7 w-7 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Days of week */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {daysOfWeek.map((day) => (
              <div
                key={day}
                className="text-center text-xs font-medium text-muted-foreground h-8 flex items-center justify-center"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1">
            {daysInMonth.map((day) => {
              const isSelected = value && isSameDay(day, value);
              const isDisabled = isDateDisabled(day);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isDayToday = isToday(day);

              return (
                <Button
                  key={day.toString()}
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={isDisabled}
                  className={cn(
                    "h-8 w-full p-0 font-normal",
                    !isCurrentMonth && "text-muted-foreground opacity-50",
                    isSelected &&
                      "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                    isDayToday && !isSelected && "border border-primary",
                    isDisabled && "opacity-50 cursor-not-allowed"
                  )}
                  onClick={() => {
                    handleDateSelect(day);
                    setIsOpen(false);
                  }}
                >
                  {format(day, "d")}
                </Button>
              );
            })}
          </div>

          {/* Today button */}
          <div className="mt-2 flex justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const today = new Date();
                if (!isDateDisabled(today)) {
                  handleDateSelect(today);
                  setIsOpen(false);
                }
              }}
              disabled={isDateDisabled(new Date())}
              className="text-xs"
            >
              Today
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-xs"
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomCalendar;
