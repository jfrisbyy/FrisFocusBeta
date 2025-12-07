import { useState, useMemo, useEffect } from "react";
import { useLocation } from "wouter";
import { format, startOfWeek, addDays, subWeeks } from "date-fns";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useDemo } from "@/contexts/DemoContext";
import PointsCard from "@/components/PointsCard";
import WeeklyTable from "@/components/WeeklyTable";
import BoostersPanel from "@/components/BoostersPanel";
import RecentWeeks, { WeekData, DayData } from "@/components/RecentWeeks";
import StreaksCard from "@/components/StreaksCard";
import AlertsPanel from "@/components/AlertsPanel";
import WelcomeMessage from "@/components/WelcomeMessage";
import MilestonesPanel from "@/components/MilestonesPanel";
import EarnedBadgesPanel from "@/components/EarnedBadgesPanel";
import TodoListPanel from "@/components/TodoListPanel";
import DueDatesPanel from "@/components/DueDatesPanel";
import type { TaskAlert, UnifiedBooster, Milestone, BadgeWithLevels } from "@shared/schema";
import {
  loadMilestonesFromStorage,
  saveMilestonesToStorage,
  loadDailyGoalFromStorage,
  saveDailyGoalToStorage,
  loadWeeklyGoalFromStorage,
  saveWeeklyGoalToStorage,
  loadUserProfileFromStorage,
  saveUserProfileToStorage,
  loadDailyLogsFromStorage,
  loadTasksFromStorage,
  loadPenaltiesFromStorage,
  loadBadgesFromStorage,
  loadWeeklyTodoListFromStorage,
  saveWeeklyTodoListToStorage,
  loadDueDatesFromStorage,
  saveDueDatesToStorage,
  getWeekId,
  StoredMilestone,
  StoredTodoItem,
  StoredDueDateItem,
} from "@/lib/storage";

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

const getMockWeeklyTodos = (): StoredTodoItem[] => [
  { id: "wt1", title: "Meal prep for the week", pointValue: 15, completed: true, order: 0 },
  { id: "wt2", title: "Review weekly goals", pointValue: 10, completed: false, order: 1 },
  { id: "wt3", title: "Clean the garage", pointValue: 20, completed: false, order: 2 },
];

const getMockDueDates = (): StoredDueDateItem[] => [
  { id: "dd1", title: "Submit tax documents", dueDate: "2025-01-15", pointValue: 50, penaltyValue: 25, status: "pending" },
  { id: "dd2", title: "Renew gym membership", dueDate: "2024-12-31", pointValue: 20, penaltyValue: 10, status: "pending" },
  { id: "dd3", title: "Pay credit card bill", dueDate: "2024-12-10", pointValue: 30, penaltyValue: 15, status: "completed", completedAt: "2024-12-08" },
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
  const { isDemo } = useDemo();
  const useMockData = isDemo || isOnboarding;
  
  // State initialization
  const [days, setDays] = useState<{ date: string; dayName: string; points: number | null }[]>([]);
  const [weeklyGoal, setWeeklyGoal] = useState<number>(350);
  const [recentWeeks, setRecentWeeks] = useState<WeekData[]>([]);
  const [dayStreak, setDayStreak] = useState(0);
  const [weekStreak, setWeekStreak] = useState(0);
  const [longestDayStreak, setLongestDayStreak] = useState(0);
  const [longestWeekStreak, setLongestWeekStreak] = useState(0);
  const [alerts, setAlerts] = useState<TaskAlert[]>([]);
  const [userName, setUserName] = useState("You");
  const [encouragementMessage, setEncouragementMessage] = useState("Welcome! Set up your tasks and start logging your progress.");
  const [boosters, setBoosters] = useState<UnifiedBooster[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [badges, setBadges] = useState<BadgeWithLevels[]>([]);
  const [weeklyTodos, setWeeklyTodos] = useState<StoredTodoItem[]>([]);
  const [weeklyTodoBonusEnabled, setWeeklyTodoBonusEnabled] = useState(false);
  const [weeklyTodoBonusPoints, setWeeklyTodoBonusPoints] = useState(25);
  const [weeklyTodoBonusAwarded, setWeeklyTodoBonusAwarded] = useState(false);
  const [dueDates, setDueDates] = useState<StoredDueDateItem[]>([]);

  // Load data from localStorage on mount
  useEffect(() => {
    // Use mock data during demo/onboarding, otherwise load from storage
    if (useMockData) {
      setDays(getMockWeekData());
      setRecentWeeks(getMockRecentWeeks(350));
      setMilestones(getMockMilestones());
      setBoosters(getMockBoosters());
      setBadges(getMockBadges());
      setAlerts(getMockAlerts());
      setUserName("Jordan");
      setEncouragementMessage("Let's start this week off right, you can do it I believe in you!");
      setDayStreak(5);
      setWeekStreak(3);
      setLongestDayStreak(14);
      setLongestWeekStreak(8);
      setWeeklyTodos(getMockWeeklyTodos());
      setWeeklyTodoBonusEnabled(true);
      setWeeklyTodoBonusPoints(25);
      setDueDates(getMockDueDates());
      return;
    }

    // Load user profile
    const profile = loadUserProfileFromStorage();
    setUserName(profile.userName);
    setEncouragementMessage(profile.encouragementMessage);

    // Load goals
    setWeeklyGoal(loadWeeklyGoalFromStorage());

    // Load milestones
    const storedMilestones = loadMilestonesFromStorage();
    setMilestones(storedMilestones.map(m => ({
      id: m.id,
      name: m.name,
      description: m.description || "",
      points: m.points,
      deadline: m.deadline,
      achieved: m.achieved,
      achievedAt: m.achievedAt,
    })));

    // Load badges
    const storedBadges = loadBadgesFromStorage();
    setBadges(storedBadges.map(b => ({
      id: b.id,
      name: b.name,
      description: b.description,
      icon: b.icon,
      conditionType: b.conditionType as "taskCompletions" | "perfectDaysStreak" | "negativeFreeStreak" | "weeklyGoalStreak",
      taskName: b.taskName,
      levels: b.levels,
      currentProgress: b.currentProgress || 0,
    })));

    // Load weekly todos
    const currentWeekId = getWeekId(new Date());
    const storedWeeklyTodoList = loadWeeklyTodoListFromStorage(currentWeekId);
    if (storedWeeklyTodoList) {
      setWeeklyTodos(storedWeeklyTodoList.items);
      setWeeklyTodoBonusEnabled(storedWeeklyTodoList.bonusEnabled);
      setWeeklyTodoBonusPoints(storedWeeklyTodoList.bonusPoints);
      setWeeklyTodoBonusAwarded(storedWeeklyTodoList.bonusAwarded);
    }

    // Load due dates
    const storedDueDates = loadDueDatesFromStorage();
    setDueDates(storedDueDates);

    // Load tasks and penalties for point calculations
    const tasks = loadTasksFromStorage();
    const penalties = loadPenaltiesFromStorage();
    const dailyLogs = loadDailyLogsFromStorage();

    // Calculate current week data from daily logs
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const currentWeekDays = Array.from({ length: 7 }, (_, i) => {
      const date = addDays(weekStart, i);
      const dateKey = format(date, "yyyy-MM-dd");
      const log = dailyLogs[dateKey];
      
      let points: number | null = null;
      if (log) {
        points = log.completedTaskIds.reduce((sum, taskId) => {
          const task = tasks.find(t => t.id === taskId);
          const penalty = penalties.find(p => p.id === taskId);
          if (task) return sum + task.value;
          if (penalty) return sum - penalty.value;
          return sum;
        }, 0);
      }
      
      return {
        date: format(date, "MMM d"),
        dayName: format(date, "EEE"),
        points,
      };
    });
    setDays(currentWeekDays);

    // Build recent weeks from daily logs (last 5 weeks)
    const recentWeeksData: WeekData[] = [];
    for (let weekOffset = 1; weekOffset <= 5; weekOffset++) {
      const pastWeekStart = startOfWeek(subWeeks(new Date(), weekOffset), { weekStartsOn: 1 });
      const pastWeekEnd = addDays(pastWeekStart, 6);
      
      const weekDays: DayData[] = [];
      let weekHasLogs = false;
      
      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const date = addDays(pastWeekStart, dayIndex);
        const dateKey = format(date, "yyyy-MM-dd");
        const log = dailyLogs[dateKey];
        
        let dayPoints: number | null = null;
        if (log) {
          weekHasLogs = true;
          dayPoints = log.completedTaskIds.reduce((sum, taskId) => {
            const task = tasks.find(t => t.id === taskId);
            const penalty = penalties.find(p => p.id === taskId);
            if (task) return sum + task.value;
            if (penalty) return sum - penalty.value;
            return sum;
          }, 0);
        }
        
        weekDays.push({
          date: format(date, "MMM d"),
          dayName: format(date, "EEE"),
          points: dayPoints,
        });
      }
      
      // Only add weeks that have at least one log
      if (weekHasLogs) {
        const weekTotal = weekDays.reduce((sum, d) => sum + (d.points || 0), 0);
        recentWeeksData.push({
          id: `week-${weekOffset}`,
          weekStart: format(pastWeekStart, "MMM d"),
          weekEnd: format(pastWeekEnd, "MMM d"),
          points: weekTotal,
          defaultGoal: loadWeeklyGoalFromStorage(),
          note: undefined,
          customGoal: undefined,
          days: weekDays,
          boosters: [],
          badges: [],
          milestones: [],
        });
      }
    }
    setRecentWeeks(recentWeeksData);

    // Calculate streaks from daily logs
    const sortedDates = Object.keys(dailyLogs).sort();
    
    // Calculate current day streak (consecutive days ending at today or yesterday)
    let currentDayStreakCount = 0;
    let checkDate = new Date();
    // Check if today has a log, if not start from yesterday
    if (!dailyLogs[format(checkDate, "yyyy-MM-dd")]) {
      checkDate = addDays(checkDate, -1);
    }
    while (true) {
      const dateKey = format(checkDate, "yyyy-MM-dd");
      if (dailyLogs[dateKey]) {
        currentDayStreakCount++;
        checkDate = addDays(checkDate, -1);
      } else {
        break;
      }
    }
    
    // Calculate longest consecutive day streak
    let maxDayStreakCount = 0;
    let tempStreak = 0;
    let prevDate: Date | null = null;
    
    for (const dateStr of sortedDates) {
      const currentDate = new Date(dateStr);
      if (prevDate === null) {
        tempStreak = 1;
      } else {
        const expectedPrev = addDays(currentDate, -1);
        if (format(prevDate, "yyyy-MM-dd") === format(expectedPrev, "yyyy-MM-dd")) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      }
      if (tempStreak > maxDayStreakCount) maxDayStreakCount = tempStreak;
      prevDate = currentDate;
    }
    
    setDayStreak(currentDayStreakCount);
    setLongestDayStreak(maxDayStreakCount);

    // Calculate week streaks (weeks where goal was met)
    const weeklyGoalValue = loadWeeklyGoalFromStorage();
    let currentWeekStreakCount = 0;
    let maxWeekStreakCount = 0;
    let tempWeekStreak = 0;
    
    // Check recent weeks (up to 52 weeks back)
    for (let weekOffset = 0; weekOffset < 52; weekOffset++) {
      const weekStartDate = startOfWeek(subWeeks(new Date(), weekOffset), { weekStartsOn: 1 });
      let weekTotal = 0;
      
      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const date = addDays(weekStartDate, dayIndex);
        const dateKey = format(date, "yyyy-MM-dd");
        const log = dailyLogs[dateKey];
        
        if (log) {
          weekTotal += log.completedTaskIds.reduce((sum, taskId) => {
            const task = tasks.find(t => t.id === taskId);
            const penalty = penalties.find(p => p.id === taskId);
            if (task) return sum + task.value;
            if (penalty) return sum - penalty.value;
            return sum;
          }, 0);
        }
      }
      
      const goalMet = weekTotal >= weeklyGoalValue;
      
      if (weekOffset === 0 || (weekOffset > 0 && currentWeekStreakCount > 0)) {
        if (goalMet) {
          if (weekOffset === 0) currentWeekStreakCount = 1;
          else currentWeekStreakCount++;
        } else if (weekOffset > 0) {
          // Stop counting current streak
        }
      }
      
      if (goalMet) {
        tempWeekStreak++;
        if (tempWeekStreak > maxWeekStreakCount) maxWeekStreakCount = tempWeekStreak;
      } else {
        tempWeekStreak = 0;
      }
    }
    
    setWeekStreak(currentWeekStreakCount);
    setLongestWeekStreak(maxWeekStreakCount);

    // Calculate boosters from tasks with boost enabled
    const taskBoosters: UnifiedBooster[] = tasks
      .filter(t => t.boostEnabled && t.boostThreshold && t.boostPoints)
      .map(t => {
        // Count completions in the current period
        let completions = 0;
        const periodStart = t.boostPeriod === "month" 
          ? subWeeks(new Date(), 4) 
          : startOfWeek(new Date(), { weekStartsOn: 1 });
        
        Object.entries(dailyLogs).forEach(([dateStr, log]) => {
          const logDate = new Date(dateStr);
          if (logDate >= periodStart && log.completedTaskIds.includes(t.id)) {
            completions++;
          }
        });
        
        return {
          id: `boost-${t.id}`,
          name: t.name,
          description: `Complete ${t.boostThreshold} times per ${t.boostPeriod}`,
          points: t.boostPoints!,
          achieved: completions >= (t.boostThreshold || 0),
          progress: completions,
          required: t.boostThreshold,
          period: t.boostPeriod,
          isNegative: false,
        };
      });
    setBoosters(taskBoosters);
  }, [isOnboarding]);

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
    if (!useMockData) {
      saveWeeklyGoalToStorage(newGoal);
    }
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
    if (!useMockData) {
      saveUserProfileToStorage({ userName: newName, encouragementMessage: newMessage });
    }
  };

  const handleMilestoneAdd = (milestone: Omit<Milestone, "id" | "achieved" | "achievedAt">) => {
    const newMilestone: Milestone = {
      ...milestone,
      id: String(Date.now()),
      achieved: false,
    };
    const updated = [...milestones, newMilestone];
    setMilestones(updated);
    if (!useMockData) {
      saveMilestonesToStorage(updated.map(m => ({
        id: m.id,
        name: m.name,
        description: m.description,
        points: m.points,
        deadline: m.deadline,
        achieved: m.achieved,
        achievedAt: m.achievedAt,
      })));
    }
  };

  const handleMilestoneEdit = (id: string, updates: Omit<Milestone, "id" | "achieved" | "achievedAt">) => {
    const updated = milestones.map(m => 
      m.id === id ? { ...m, ...updates } : m
    );
    setMilestones(updated);
    if (!useMockData) {
      saveMilestonesToStorage(updated.map(m => ({
        id: m.id,
        name: m.name,
        description: m.description,
        points: m.points,
        deadline: m.deadline,
        achieved: m.achieved,
        achievedAt: m.achievedAt,
      })));
    }
  };

  const handleMilestoneDelete = (id: string) => {
    const updated = milestones.filter(m => m.id !== id);
    setMilestones(updated);
    if (!useMockData) {
      saveMilestonesToStorage(updated.map(m => ({
        id: m.id,
        name: m.name,
        description: m.description,
        points: m.points,
        deadline: m.deadline,
        achieved: m.achieved,
        achievedAt: m.achievedAt,
      })));
    }
  };

  const handleMilestoneToggle = (id: string) => {
    const updated = milestones.map(m => 
      m.id === id 
        ? { 
            ...m, 
            achieved: !m.achieved, 
            achievedAt: !m.achieved ? new Date().toISOString() : undefined 
          } 
        : m
    );
    setMilestones(updated);
    if (!useMockData) {
      saveMilestonesToStorage(updated.map(m => ({
        id: m.id,
        name: m.name,
        description: m.description,
        points: m.points,
        deadline: m.deadline,
        achieved: m.achieved,
        achievedAt: m.achievedAt,
      })));
    }
  };

  // Weekly todos handlers
  const handleWeeklyTodosChange = (items: StoredTodoItem[]) => {
    setWeeklyTodos(items);
    if (!useMockData) {
      const weekId = getWeekId(new Date());
      saveWeeklyTodoListToStorage({
        weekId,
        items,
        bonusEnabled: weeklyTodoBonusEnabled,
        bonusPoints: weeklyTodoBonusPoints,
        bonusAwarded: weeklyTodoBonusAwarded,
      });
    }
  };

  const handleWeeklyTodoBonusEnabledChange = (enabled: boolean) => {
    setWeeklyTodoBonusEnabled(enabled);
    if (!useMockData) {
      const weekId = getWeekId(new Date());
      saveWeeklyTodoListToStorage({
        weekId,
        items: weeklyTodos,
        bonusEnabled: enabled,
        bonusPoints: weeklyTodoBonusPoints,
        bonusAwarded: weeklyTodoBonusAwarded,
      });
    }
  };

  const handleWeeklyTodoBonusPointsChange = (points: number) => {
    setWeeklyTodoBonusPoints(points);
    if (!useMockData) {
      const weekId = getWeekId(new Date());
      saveWeeklyTodoListToStorage({
        weekId,
        items: weeklyTodos,
        bonusEnabled: weeklyTodoBonusEnabled,
        bonusPoints: points,
        bonusAwarded: weeklyTodoBonusAwarded,
      });
    }
  };

  // Due dates handlers
  const handleDueDatesChange = (items: StoredDueDateItem[]) => {
    setDueDates(items);
    if (!useMockData) {
      saveDueDatesToStorage(items);
    }
  };

  // Calculate weekly todo points for point summary
  const weeklyTodoPoints = useMemo(() => {
    const completedPoints = weeklyTodos
      .filter(t => t.completed)
      .reduce((sum, t) => sum + t.pointValue, 0);
    const bonusPoints = weeklyTodoBonusAwarded ? weeklyTodoBonusPoints : 0;
    return completedPoints + bonusPoints;
  }, [weeklyTodos, weeklyTodoBonusAwarded, weeklyTodoBonusPoints]);

  // Calculate due date points for point summary
  const dueDatePoints = useMemo(() => {
    const earnedPoints = dueDates
      .filter(d => d.status === "completed")
      .reduce((sum, d) => sum + d.pointValue, 0);
    const lostPoints = dueDates
      .filter(d => d.status === "missed")
      .reduce((sum, d) => sum + d.penaltyValue, 0);
    return earnedPoints - lostPoints;
  }, [dueDates]);

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
          <TodoListPanel
            title="Weekly To-Do List"
            prompt="Add a weekly task..."
            items={weeklyTodos}
            onItemsChange={handleWeeklyTodosChange}
            bonusEnabled={weeklyTodoBonusEnabled}
            bonusPoints={weeklyTodoBonusPoints}
            bonusAwarded={weeklyTodoBonusAwarded}
            onBonusEnabledChange={handleWeeklyTodoBonusEnabledChange}
            onBonusPointsChange={handleWeeklyTodoBonusPointsChange}
            isDemo={useMockData}
          />
        </div>
        <div className="max-w-md">
          <DueDatesPanel
            items={dueDates}
            onItemsChange={handleDueDatesChange}
          />
        </div>
        <div className="max-w-md">
          <BoostersPanel boosters={boosters} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="max-w-md">
          <MilestonesPanel
            milestones={milestones}
            onAdd={handleMilestoneAdd}
            onEdit={handleMilestoneEdit}
            onDelete={handleMilestoneDelete}
            onToggleAchieved={handleMilestoneToggle}
          />
        </div>
        <div className="max-w-lg lg:col-span-2">
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
