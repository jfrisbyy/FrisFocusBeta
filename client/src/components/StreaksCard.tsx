import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, Calendar, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreaksCardProps {
  dayStreak: number;
  weekStreak: number;
  longestDayStreak?: number;
  longestWeekStreak?: number;
}

export default function StreaksCard({
  dayStreak,
  weekStreak,
  longestDayStreak,
  longestWeekStreak,
}: StreaksCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Flame className="h-4 w-4 text-chart-2" />
          Streaks
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Day Streak</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span
                className={cn(
                  "text-3xl font-mono font-bold",
                  dayStreak > 0 ? "text-chart-1" : "text-muted-foreground"
                )}
                data-testid="text-day-streak"
              >
                {dayStreak}
              </span>
              <span className="text-sm text-muted-foreground">
                {dayStreak === 1 ? "day" : "days"}
              </span>
            </div>
            {longestDayStreak !== undefined && longestDayStreak > dayStreak && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3" />
                <span>Best: {longestDayStreak} days</span>
              </div>
            )}
          </div>

          <div className="w-px h-16 bg-border" />

          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Week Streak</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span
                className={cn(
                  "text-3xl font-mono font-bold",
                  weekStreak > 0 ? "text-chart-1" : "text-muted-foreground"
                )}
                data-testid="text-week-streak"
              >
                {weekStreak}
              </span>
              <span className="text-sm text-muted-foreground">
                {weekStreak === 1 ? "week" : "weeks"}
              </span>
            </div>
            {longestWeekStreak !== undefined && longestWeekStreak > weekStreak && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3" />
                <span>Best: {longestWeekStreak} weeks</span>
              </div>
            )}
          </div>
        </div>

        <p className="text-xs text-muted-foreground pt-2 border-t">
          Hit your daily goal to build day streaks, and weekly goal for week streaks
        </p>
      </CardContent>
    </Card>
  );
}
