import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, addDays, isSameDay, startOfToday } from "date-fns";
import { TimeSlot, timeSlots } from "@/data/servicesData";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface DateTimeSelectorProps {
  selectedDate: Date | null;
  selectedTimeSlot: TimeSlot | null;
  onDateSelect: (date: Date) => void;
  onTimeSlotSelect: (slot: TimeSlot) => void;
}

const DateTimeSelector: React.FC<DateTimeSelectorProps> = ({
  selectedDate,
  selectedTimeSlot,
  onDateSelect,
  onTimeSlotSelect,
}) => {
  const today = startOfToday();
  const [startIndex, setStartIndex] = useState(0);
  const daysToShow = 7;
  const maxDays = 14;

  const dates = Array.from({ length: maxDays }, (_, i) => addDays(today, i));
  const visibleDates = dates.slice(startIndex, startIndex + daysToShow);

  const canGoBack = startIndex > 0;
  const canGoForward = startIndex + daysToShow < maxDays;

  return (
    <div className="p-5 space-y-6">
      {/* Date Selection */}
      <div>
        <h4 className="font-medium text-foreground mb-4">Select Date</h4>
        <div className="flex items-center gap-2">
          <button
            onClick={() => canGoBack && setStartIndex(s => s - 1)}
            disabled={!canGoBack}
            className={cn(
              "p-2 rounded-lg transition-colors",
              canGoBack ? "hover:bg-secondary text-foreground" : "text-muted-foreground/30"
            )}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex-1 flex gap-2 overflow-hidden">
            {visibleDates.map((date) => {
              const isSelected = selectedDate && isSameDay(date, selectedDate);
              const isToday = isSameDay(date, today);

              return (
                <button
                  key={date.toISOString()}
                  onClick={() => onDateSelect(date)}
                  className={cn(
                    "flex-1 flex flex-col items-center py-3 px-2 rounded-xl",
                    "border transition-all duration-200",
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground shadow-md"
                      : "border-border bg-card hover:border-muted-foreground/30"
                  )}
                >
                  <span className={cn(
                    "text-xs font-medium uppercase",
                    isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
                  )}>
                    {format(date, "EEE")}
                  </span>
                  <span className={cn(
                    "text-lg font-semibold mt-1",
                    isSelected ? "text-primary-foreground" : "text-foreground"
                  )}>
                    {format(date, "d")}
                  </span>
                  {isToday && (
                    <span className={cn(
                      "text-xs mt-0.5",
                      isSelected ? "text-primary-foreground/80" : "text-primary"
                    )}>
                      Today
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => canGoForward && setStartIndex(s => s + 1)}
            disabled={!canGoForward}
            className={cn(
              "p-2 rounded-lg transition-colors",
              canGoForward ? "hover:bg-secondary text-foreground" : "text-muted-foreground/30"
            )}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Time Slot Selection */}
      <div>
        <h4 className="font-medium text-foreground mb-4">Select Time Slot</h4>
        <div className="grid grid-cols-4 gap-2">
          {timeSlots.map((slot) => {
            const isSelected = selectedTimeSlot?.id === slot.id;

            return (
              <button
                key={slot.id}
                onClick={() => slot.available && onTimeSlotSelect(slot)}
                disabled={!slot.available}
                className={cn(
                  "py-3 px-2 rounded-xl text-sm font-medium",
                  "border transition-all duration-200",
                  !slot.available && "opacity-40 cursor-not-allowed",
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground shadow-md"
                    : slot.available
                    ? "border-border bg-card hover:border-muted-foreground/30 text-foreground"
                    : "border-border bg-muted text-muted-foreground"
                )}
              >
                {slot.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DateTimeSelector;
