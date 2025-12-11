import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, Calendar, TrendingUp, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { HelpIndicator } from "@/components/HelpIndicator";

interface StreaksCardProps {
  dayStreak: number;
  weekStreak: number;
  longestDayStreak?: number;
  longestWeekStreak?: number;
}

const streakMessages = {
  amazing: [
    "You're absolutely crushing it! Keep going!",
    "Unstoppable momentum! You're on fire!",
    "Legendary consistency! Nothing can stop you now!",
    "You're building something incredible here!",
    "This is what excellence looks like!",
  ],
  great: [
    "Great streak going! Keep the momentum!",
    "You're building solid habits here!",
    "Consistency is your superpower!",
    "Looking strong! Keep pushing!",
    "You're proving what you're capable of!",
  ],
  good: [
    "Nice work! Every day counts!",
    "Building momentum, keep it up!",
    "Good progress! Don't stop now!",
    "You're doing better than you think!",
    "Small steps lead to big changes!",
  ],
  starting: [
    "Every journey starts with day one!",
    "Today is a fresh start. You've got this!",
    "Ready to build something great!",
    "Let's get that streak going!",
    "Your comeback starts now!",
  ],
};

function getStreakMessage(dayStreak: number, weekStreak: number): string {
  const combined = dayStreak + (weekStreak * 7);
  
  let category: keyof typeof streakMessages;
  if (combined >= 21) {
    category = "amazing";
  } else if (combined >= 10) {
    category = "great";
  } else if (combined >= 3) {
    category = "good";
  } else {
    category = "starting";
  }
  
  const messages = streakMessages[category];
  return messages[Math.floor(Math.random() * messages.length)];
}

export default function StreaksCard({
  dayStreak,
  weekStreak,
  longestDayStreak,
  longestWeekStreak,
}: StreaksCardProps) {
  const message = useMemo(() => getStreakMessage(dayStreak, weekStreak), [dayStreak, weekStreak]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-1">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Flame className="h-4 w-4 text-chart-2" />
            Streaks
          </CardTitle>
          <HelpIndicator 
            title="Streaks" 
            content={[
              "Day Streak: Consecutive days you've logged activities.",
              "Week Streak: Consecutive weeks hitting your weekly goal.",
              "Keep your streaks going for motivation boosts!"
            ]} 
          />
        </div>
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

        <div className="pt-2 border-t">
          <div className="flex items-start gap-2">
            <MessageCircle className="h-4 w-4 text-chart-2 mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground" data-testid="text-streak-message">
              {message}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
