import { useState } from "react";
import { useLocation } from "wouter";
import { format, startOfWeek, addDays } from "date-fns";
import PointsCard from "@/components/PointsCard";
import WeeklyTable from "@/components/WeeklyTable";
import BoostersPanel from "@/components/BoostersPanel";

// todo: remove mock functionality
const getMockWeekData = () => {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    const isLogged = i < 5;
    return {
      date: format(date, "MMM d"),
      dayName: format(date, "EEE"),
      points: isLogged ? Math.floor(Math.random() * 50) + 30 : null,
    };
  });
  return days;
};

const mockSystemBoosters = [
  {
    id: "booster_5of7_tracking",
    name: "5 of 7 Tracking",
    description: "Log at least 5 days this week",
    points: 10,
    achieved: true,
    icon: "tracking" as const,
    type: "system" as const,
  },
  {
    id: "booster_finish_bible_book",
    name: "Finish Bible Book",
    description: "Complete a book of the Bible",
    points: 10,
    achieved: false,
    icon: "bible" as const,
    type: "system" as const,
  },
  {
    id: "booster_3days_lifting",
    name: "3 Days Lifting",
    description: "Hit the gym at least 3 days",
    points: 10,
    achieved: true,
    icon: "lifting" as const,
    type: "system" as const,
  },
];

const mockCustomBoosters = [
  {
    id: "custom-1",
    taskName: "Read 30 minutes",
    timesRequired: 4,
    timesCompleted: 3,
    period: "week" as const,
    bonusPoints: 20,
    achieved: false,
    type: "custom" as const,
  },
  {
    id: "custom-2",
    taskName: "Morning workout",
    timesRequired: 5,
    timesCompleted: 5,
    period: "week" as const,
    bonusPoints: 15,
    achieved: true,
    type: "custom" as const,
  },
  {
    id: "custom-3",
    taskName: "Bible study",
    timesRequired: 7,
    timesCompleted: 4,
    period: "week" as const,
    bonusPoints: 25,
    achieved: false,
    type: "custom" as const,
  },
];

export default function Dashboard() {
  const [, navigate] = useLocation();
  const [days] = useState(getMockWeekData);
  // todo: remove mock functionality - weekly goal will come from backend
  const [weeklyGoal, setWeeklyGoal] = useState<number>(350);

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = addDays(weekStart, 6);
  const weekRange = `${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d")}`;

  const weekTotal = days.reduce((sum, d) => sum + (d.points || 0), 0);
  const systemBoosterPoints = mockSystemBoosters.filter(b => b.achieved).reduce((sum, b) => sum + b.points, 0);
  const customBoosterPoints = mockCustomBoosters.filter(b => b.achieved).reduce((sum, b) => sum + b.bonusPoints, 0);
  const boosterPoints = systemBoosterPoints + customBoosterPoints;
  const finalTotal = weekTotal + boosterPoints;

  const handleDayClick = (date: string) => {
    navigate("/daily");
    console.log("Navigate to day:", date);
  };

  const handleGoalChange = (newGoal: number) => {
    setWeeklyGoal(newGoal);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground text-sm">Your weekly progress at a glance</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <PointsCard
            weekTotal={finalTotal}
            weekRange={weekRange}
            boosterPoints={boosterPoints}
            weeklyGoal={weeklyGoal}
            onGoalChange={handleGoalChange}
          />
        </div>
        <div className="lg:col-span-2">
          <WeeklyTable days={days} onDayClick={handleDayClick} />
        </div>
      </div>

      <div className="max-w-md">
        <BoostersPanel 
          systemBoosters={mockSystemBoosters}
          customBoosters={mockCustomBoosters}
        />
      </div>
    </div>
  );
}
