import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { format, startOfWeek, addDays, subWeeks } from "date-fns";
import { useOnboarding } from "@/contexts/OnboardingContext";
import PointsCard from "@/components/PointsCard";
import WeeklyTable from "@/components/WeeklyTable";
import BoostersPanel from "@/components/BoostersPanel";
import RecentWeeks, { WeekData, DayData, WeekBooster, WeekBadge, WeekMilestone } from "@/components/RecentWeeks";
import StreaksCard from "@/components/StreaksCard";
import AlertsPanel from "@/components/AlertsPanel";
import WelcomeMessage from "@/components/WelcomeMessage";
import MilestonesPanel from "@/components/MilestonesPanel";
import EarnedBadgesPanel from "@/components/EarnedBadgesPanel";
import type { TaskAlert, UnifiedBooster, Milestone, BadgeWithLevels } from "@shared/schema";

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

const getMockBoosters = (): UnifiedBooster[] => [
  {
    id: "booster_5of7_tracking",
    name: "5 of 7 Tracking",
    description: "Log at least 5 days this week",
    points: 10,
    achieved: true,
    isNegative: false,
  },
  {
    id: "booster_3days_lifting",
    name: "3 Days Lifting",
    description: "Hit the gym at least 3 days",
    points: 10,
    achieved: true,
    isNegative: false,
  },
  {
    id: "custom-reading",
    name: "Read 30 minutes",
    description: "Complete 4 times per week",
    points: 20,
    achieved: false,
    progress: 3,
    required: 4,
    period: "week",
    isNegative: false,
  },
  {
    id: "custom-workout",
    name: "Morning workout",
    description: "Complete 5 times per week",
    points: 15,
    achieved: true,
    progress: 5,
    required: 5,
    period: "week",
    isNegative: false,
  },
  {
    id: "negative-junkfood",
    name: "Junk Food",
    description: "If eaten 3+ times per week",
    points: -15,
    achieved: false,
    progress: 1,
    required: 3,
    period: "week",
    isNegative: true,
  },
  {
    id: "negative-socialmedia",
    name: "Social Media Binge",
    description: "If wasted 2+ hours twice this week",
    points: -20,
    achieved: true,
    progress: 2,
    required: 2,
    period: "week",
    isNegative: true,
  },
];

const getMockRecentWeeks = (defaultGoal: number): WeekData[] => {
  const today = new Date();
  
  const generateDays = (weekOffset: number, points: number[]): DayData[] => {
    const weekStart = startOfWeek(subWeeks(today, weekOffset), { weekStartsOn: 1 });
    return points.map((p, i) => ({
      date: format(addDays(weekStart, i), "MMM d"),
      dayName: format(addDays(weekStart, i), "EEE"),
      points: p,
    }));
  };

  return [
    {
      id: "week-1",
      weekStart: format(startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 }), "MMM d"),
      weekEnd: format(addDays(startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 }), 6), "MMM d"),
      points: 385,
      defaultGoal,
      note: undefined,
      customGoal: undefined,
      days: generateDays(1, [55, 60, 45, 70, 65, 50, 40]),
      boosters: [
        { id: "b1", name: "5 of 7 Tracking", points: 10, isNegative: false },
        { id: "b2", name: "Morning Workout", points: 15, isNegative: false },
      ],
      badges: [
        { id: "badge1", name: "Beast Mode", level: 2, earnedAt: "2024-12-01" },
      ],
      milestones: [],
    },
    {
      id: "week-2",
      weekStart: format(startOfWeek(subWeeks(today, 2), { weekStartsOn: 1 }), "MMM d"),
      weekEnd: format(addDays(startOfWeek(subWeeks(today, 2), { weekStartsOn: 1 }), 6), "MMM d"),
      points: 280,
      defaultGoal,
      note: "Travel week",
      customGoal: 250,
      days: generateDays(2, [40, 35, 30, 45, 50, 40, 40]),
      boosters: [
        { id: "b3", name: "Junk Food", points: -15, isNegative: true },
      ],
      badges: [],
      milestones: [],
    },
    {
      id: "week-3",
      weekStart: format(startOfWeek(subWeeks(today, 3), { weekStartsOn: 1 }), "MMM d"),
      weekEnd: format(addDays(startOfWeek(subWeeks(today, 3), { weekStartsOn: 1 }), 6), "MMM d"),
      points: 365,
      defaultGoal,
      note: undefined,
      customGoal: undefined,
      days: generateDays(3, [50, 55, 48, 60, 52, 55, 45]),
      boosters: [
        { id: "b4", name: "3 Days Lifting", points: 10, isNegative: false },
        { id: "b5", name: "Read 30 minutes", points: 20, isNegative: false },
      ],
      badges: [],
      milestones: [
        { id: "m1", name: "Run a 5K", points: 50, achievedAt: "2024-11-15" },
      ],
    },
    {
      id: "week-4",
      weekStart: format(startOfWeek(subWeeks(today, 4), { weekStartsOn: 1 }), "MMM d"),
      weekEnd: format(addDays(startOfWeek(subWeeks(today, 4), { weekStartsOn: 1 }), 6), "MMM d"),
      points: 320,
      defaultGoal,
      note: undefined,
      customGoal: undefined,
      days: generateDays(4, [45, 50, 40, 55, 48, 42, 40]),
      boosters: [],
      badges: [
        { id: "badge2", name: "Purified", level: 1, earnedAt: "2024-11-01" },
      ],
      milestones: [],
    },
    {
      id: "week-5",
      weekStart: format(startOfWeek(subWeeks(today, 5), { weekStartsOn: 1 }), "MMM d"),
      weekEnd: format(addDays(startOfWeek(subWeeks(today, 5), { weekStartsOn: 1 }), 6), "MMM d"),
      points: 290,
      defaultGoal,
      note: "Busy week at work",
      customGoal: undefined,
      days: generateDays(5, [35, 40, 45, 50, 45, 40, 35]),
      boosters: [
        { id: "b6", name: "Social Media Binge", points: -20, isNegative: true },
      ],
      badges: [],
      milestones: [],
    },
  ];
};

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

const getMockMilestones = (): Milestone[] => [
  {
    id: "milestone-1",
    name: "Buy a car",
    description: "Save up and purchase first vehicle",
    points: 100,
    deadline: "2025-03-01",
    achieved: false,
  },
  {
    id: "milestone-2",
    name: "Run a 5K",
    description: "Complete first 5K race",
    points: 50,
    deadline: "2024-11-20",
    achieved: true,
    achievedAt: "2024-11-15",
  },
];

const getMockBadges = (): BadgeWithLevels[] => [
  {
    id: "badge-1",
    name: "Purified",
    description: "Negative-free days streak",
    icon: "shield",
    conditionType: "negativeFreeStreak",
    levels: [
      { level: 1, required: 10, earned: true, earnedAt: "2024-11-01" },
      { level: 2, required: 30, earned: false },
      { level: 3, required: 60, earned: false },
    ],
    currentProgress: 18,
  },
  {
    id: "badge-2",
    name: "Beast Mode",
    description: "Perfect days in a row",
    icon: "flame",
    conditionType: "perfectDaysStreak",
    levels: [
      { level: 1, required: 3, earned: true, earnedAt: "2024-11-05" },
      { level: 2, required: 7, earned: true, earnedAt: "2024-11-12" },
      { level: 3, required: 14, earned: false },
    ],
    currentProgress: 10,
  },
  {
    id: "badge-3",
    name: "Scripture Scholar",
    description: "Bible study completions",
    icon: "book",
    conditionType: "taskCompletions",
    taskName: "Bible study",
    levels: [
      { level: 1, required: 30, earned: false },
      { level: 2, required: 100, earned: false },
    ],
    currentProgress: 18,
  },
];

const getEmptyWeekData = () => {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    return {
      date: format(date, "MMM d"),
      dayName: format(date, "EEE"),
      points: null,
    };
  });
  return days;
};

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { isOnboarding } = useOnboarding();
  
  const initialDays = useMemo(() => isOnboarding ? getMockWeekData() : getEmptyWeekData(), [isOnboarding]);
  const initialWeeks = useMemo(() => isOnboarding ? getMockRecentWeeks(350) : [], [isOnboarding]);
  const initialMilestones = useMemo(() => isOnboarding ? getMockMilestones() : [], [isOnboarding]);
  const initialBoosters = useMemo(() => isOnboarding ? getMockBoosters() : [], [isOnboarding]);
  const initialBadges = useMemo(() => isOnboarding ? getMockBadges() : [], [isOnboarding]);
  const initialAlerts = useMemo(() => isOnboarding ? getMockAlerts() : [], [isOnboarding]);
  
  const [days] = useState(initialDays);
  const [weeklyGoal, setWeeklyGoal] = useState<number>(350);
  const [recentWeeks, setRecentWeeks] = useState<WeekData[]>(initialWeeks);
  const [dayStreak] = useState(isOnboarding ? 5 : 0);
  const [weekStreak] = useState(isOnboarding ? 3 : 0);
  const [longestDayStreak] = useState(isOnboarding ? 14 : 0);
  const [longestWeekStreak] = useState(isOnboarding ? 8 : 0);
  const [alerts] = useState<TaskAlert[]>(initialAlerts);
  const [userName, setUserName] = useState(isOnboarding ? "Jordan" : "You");
  const [encouragementMessage, setEncouragementMessage] = useState(
    isOnboarding 
      ? "Let's start this week off right, you can do it I believe in you!"
      : "Welcome! Set up your tasks and start logging your progress."
  );
  const [boosters] = useState<UnifiedBooster[]>(initialBoosters);
  const [milestones, setMilestones] = useState<Milestone[]>(initialMilestones);
  const [badges] = useState<BadgeWithLevels[]>(initialBadges);

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = addDays(weekStart, 6);
  const weekRange = `${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d")}`;

  const weekTotal = days.reduce((sum, d) => sum + (d.points || 0), 0);
  const positiveBoosterPoints = boosters.filter(b => b.achieved && !b.isNegative).reduce((sum, b) => sum + b.points, 0);
  const negativeBoosterPoints = boosters.filter(b => b.achieved && b.isNegative).reduce((sum, b) => sum + Math.abs(b.points), 0);
  const milestonePoints = milestones.filter(m => m.achieved).reduce((sum, m) => sum + m.points, 0);
  const boosterPoints = positiveBoosterPoints - negativeBoosterPoints + milestonePoints;
  const finalTotal = weekTotal + boosterPoints;

  const handleDayClick = () => {
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

  const handleMilestoneAdd = (milestone: Omit<Milestone, "id" | "achieved" | "achievedAt">) => {
    const newMilestone: Milestone = {
      ...milestone,
      id: String(Date.now()),
      achieved: false,
    };
    setMilestones([...milestones, newMilestone]);
  };

  const handleMilestoneEdit = (id: string, updates: Omit<Milestone, "id" | "achieved" | "achievedAt">) => {
    setMilestones(milestones.map(m => 
      m.id === id ? { ...m, ...updates } : m
    ));
  };

  const handleMilestoneDelete = (id: string) => {
    setMilestones(milestones.filter(m => m.id !== id));
  };

  const handleMilestoneToggle = (id: string) => {
    setMilestones(milestones.map(m => 
      m.id === id 
        ? { 
            ...m, 
            achieved: !m.achieved, 
            achievedAt: !m.achieved ? new Date().toISOString() : undefined 
          } 
        : m
    ));
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
          <EarnedBadgesPanel badges={badges} />
        </div>
        <div className="lg:col-span-2 space-y-6">
          <WeeklyTable days={days} onDayClick={handleDayClick} />
          <AlertsPanel alerts={alerts} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="max-w-md">
          <BoostersPanel boosters={boosters} />
        </div>
        <div className="max-w-md">
          <MilestonesPanel
            milestones={milestones}
            onAdd={handleMilestoneAdd}
            onEdit={handleMilestoneEdit}
            onDelete={handleMilestoneDelete}
            onToggleAchieved={handleMilestoneToggle}
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
