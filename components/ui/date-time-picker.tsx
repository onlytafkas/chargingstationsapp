"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

interface DateTimePickerProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  disabled?: boolean;
}

export function DateTimePicker({ date, setDate, disabled }: DateTimePickerProps) {
  const [selectedDateTime, setSelectedDateTime] = React.useState<Date | undefined>(date);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      // Preserve the time from the current selectedDateTime
      const newDateTime = new Date(selectedDate);
      if (selectedDateTime) {
        newDateTime.setHours(selectedDateTime.getHours());
        newDateTime.setMinutes(selectedDateTime.getMinutes());
      }
      setSelectedDateTime(newDateTime);
      setDate(newDateTime);
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = e.target.value;
    if (time && selectedDateTime) {
      const [hours, minutes] = time.split(':');
      const newDateTime = new Date(selectedDateTime);
      newDateTime.setHours(parseInt(hours, 10));
      newDateTime.setMinutes(parseInt(minutes, 10));
      setSelectedDateTime(newDateTime);
      setDate(newDateTime);
    }
  };

  React.useEffect(() => {
    setSelectedDateTime(date);
  }, [date]);

  return (
    <div className="flex gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "flex-1 justify-start text-left font-normal",
              !selectedDateTime && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedDateTime ? format(selectedDateTime, "PPP") : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDateTime}
            onSelect={handleDateSelect}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      <Input
        type="time"
        value={
          selectedDateTime
            ? `${String(selectedDateTime.getHours()).padStart(2, '0')}:${String(
                selectedDateTime.getMinutes()
              ).padStart(2, '0')}`
            : ''
        }
        onChange={handleTimeChange}
        className="w-32"
        disabled={disabled}
      />
    </div>
  );
}
