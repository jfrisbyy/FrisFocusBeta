import { format, addDays, subDays, isToday } from "date-fns";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
  date: Date;
  onDateChange: (date: Date) => void;
}

export default function DatePicker({ date, onDateChange }: DatePickerProps) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={() => onDateChange(subDays(date, 1))}
        data-testid="button-prev-day"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="min-w-[180px] justify-start gap-2"
            data-testid="button-date-picker"
          >
            <CalendarDays className="h-4 w-4" />
            <span className="font-medium">{format(date, "EEE, MMM d, yyyy")}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="center">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => d && onDateChange(d)}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      <Button
        variant="outline"
        size="icon"
        onClick={() => onDateChange(addDays(date, 1))}
        data-testid="button-next-day"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {!isToday(date) && (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onDateChange(new Date())}
          data-testid="button-today"
        >
          Today
        </Button>
      )}
    </div>
  );
}
