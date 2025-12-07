import { useState } from "react";
import { useLocation } from "wouter";
import { format, startOfWeek, addDays, subWeeks, subDays } from "date-fns";
import PointsCard from "@/components/PointsCard";
import WeeklyTable from "@/components/WeeklyTable";
import BoostersPanel from "@/components/BoostersPanel";
import RecentWeeks, { WeekData } from "@/components/RecentWeeks";
import StreaksCard from "@/components/StreaksCard";
import AlertsPanel from "@/components/AlertsPanel";
import WelcomeMessage from "@/components/WelcomeMessage";
import type { TaskAlert } from "@shared/schema";

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

// todo: remove mock functionality
const getMockRecentWeeks = (defaultGoal: number): WeekData[] => {
  const today = new Date();
  return [
    {
      id: "week-1",
      weekStart: format(startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 }), "MMM d"),
      weekEnd: format(addDays(startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 }), 6), "MMM d"),
      points: 385,
      defaultGoal,
      note: undefined,
      customGoal: undefined,
    },
    {
      id: "week-2",
      weekStart: format(startOfWeek(subWeeks(today, 2), { weekStartsOn: 1 }), "MMM d"),
      weekEnd: format(addDays(startOfWeek(subWeeks(today, 2), { weekStartsOn: 1 }), 6), "MMM d"),
      points: 280,
      defaultGoal,
      note: "Travel week",
      customGoal: 250,
    },
    {
      id: "week-3",
      weekStart: format(startOfWeek(subWeeks(today, 3), { weekStartsOn: 1 }), "MMM d"),
      weekEnd: format(addDays(startOfWeek(subWeeks(today, 3), { weekStartsOn: 1 }), 6), "MMM d"),
      points: 365,
      defaultGoal,
      note: undefined,
      customGoal: undefined,
    },
    {
      id: "week-4",
      weekStart: format(startOfWeek(subWeeks(today, 4), { weekStartsOn: 1 }), "MMM d"),
      weekEnd: format(addDays(startOfWeek(subWeeks(today, 4), { weekStartsOn: 1 }), 6), "MMM d"),
      points: 195,
      defaultGoal,
      note: "Vacation week",
      customGoal: 200,
    },
  ];
};

// todo: remove mock functionality
const getMockAlerts = (): TaskAlert[] => [
  {
    taskId: "alert-1",
    taskName: "Bible study",
    priority: "mustDo",
    daysMissing: 4,
    threshold: 3,
  },
  {
    taskId: "alert-2",
    taskName: "Read 30 minutes",
    priority: "shouldDo",
    daysMissing: 12,
    threshold: 10,
  },
];

export default function Dashboard() {
  const [, navigate] = useLocation();
  const [days] = useState(getMockWeekData);
  // todo: remove mock functionality - weekly goal will come from backend
  const [weeklyGoal, setWeeklyGoal] = useState<number>(350);
  // todo: remove mock functionality - recent weeks will come from backend
  const [recentWeeks, setRecentWeeks] = useState<WeekData[]>(() => getMockRecentWeeks(350));
  // todo: remove mock functionality - streaks will come from backend
  const [dayStreak] = useState(5);
  const [weekStreak] = useState(3);
  const [longestDayStreak] = useState(14);
  const [longestWeekStreak] = useState(8);
  // todo: remove mock functionality - alerts will come from backend
  const [alerts] = useState<TaskAlert[]>(getMockAlerts);
  // todo: remove mock functionality - user settings will come from backend
  const [userName, setUserName] = useState("Jordan");
  const [encouragementMessage, setEncouragementMessage] = useState(
    "Let's start this week off right, you can do it I believe in you!"
  );

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
  };

  const handleGoalChange = (newGoal: number) => {
    setWeeklyGoal(newGoal);
  };

  const handleWeekUpdate = (weekId: string, note: string, customGoal?: number) => {
    setRecentWeeks(prev => prev.map(week => 
      week.id === weekId 
        ? { ...week, note: note || undefined, customGoal }
        : week
    ));
  };

  const handleWelcomeUpdate = (newName: string, newMessage: string) => {
    setUserName(newName);
    setEncouragementMessage(newMessage);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <WelcomeMessage
        userName={userName}
        message={encouragementMessage}
        onUpdate={handleWelcomeUpdate}
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-6">
          <PointsCard
            weekTotal={finalTotal}
            weekRange={weekRange}
            boosterPoints={boosterPoints}
            weeklyGoal={weeklyGoal}
            onGoalChange={handleGoalChange}
          />
          <StreaksCard
            dayStreak={dayStreak}
            weekStreak={weekStreak}
            longestDayStreak={longestDayStreak}
            longestWeekStreak={longestWeekStreak}
          />
        </div>
        <div className="lg:col-span-2 space-y-6">
          <WeeklyTable days={days} onDayClick={handleDayClick} />
          <AlertsPanel alerts={alerts} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="max-w-md">
          <BoostersPanel 
            systemBoosters={mockSystemBoosters}
            customBoosters={mockCustomBoosters}
          />
        </div>
        <div className="max-w-lg">
          <RecentWeeks
            weeks={recentWeeks}
            defaultGoal={weeklyGoal}
            onWeekUpdate={handleWeekUpdate}
          />
        </div>
      </div>
    </div>
  );
}
