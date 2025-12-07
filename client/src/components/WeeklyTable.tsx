import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DayData {
  date: string;
  dayName: string;
  points: number | null;
}

interface WeeklyTableProps {
  days: DayData[];
  onDayClick?: (date: string) => void;
}

function getDayStatus(points: number | null) {
  if (points === null) return { color: "text-muted-foreground", dot: "bg-muted" };
  if (points >= 60) return { color: "text-chart-1", dot: "bg-chart-1" };
  if (points >= 30) return { color: "text-chart-2", dot: "bg-chart-2" };
  return { color: "text-chart-3", dot: "bg-chart-3" };
}

export default function WeeklyTable({ days, onDayClick }: WeeklyTableProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Daily Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {days.map((day) => {
            const status = getDayStatus(day.points);
            return (
              <button
                key={day.date}
                onClick={() => onDayClick?.(day.date)}
                className="flex w-full items-center justify-between gap-4 px-6 py-3 text-left hover-elevate active-elevate-2"
                data-testid={`row-day-${day.date}`}
              >
                <div className="flex items-center gap-3">
                  <div className={cn("h-2 w-2 rounded-full", status.dot)} />
                  <span className="text-sm font-medium">{day.dayName}</span>
                  <span className="text-xs text-muted-foreground">{day.date}</span>
                </div>
                <span className={cn("font-mono text-sm font-semibold", status.color)}>
                  {day.points !== null ? day.points : "—"}
                </span>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
