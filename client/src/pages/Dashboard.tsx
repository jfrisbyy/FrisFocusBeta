import { useState, useMemo, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { format, startOfWeek, addDays, subWeeks } from "date-fns";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useDemo } from "@/contexts/DemoContext";
import { useAuth } from "@/hooks/useAuth";
import { ChevronLeft, ChevronRight, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HelpDialog } from "@/components/HelpDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PointsCard from "@/components/PointsCard";
import WeeklyTable from "@/components/WeeklyTable";
import BoostersPanel from "@/components/BoostersPanel";
import RecentWeeks, { WeekData, DayData, DayTaskData } from "@/components/RecentWeeks";
import StreaksCard from "@/components/StreaksCard";
import AlertsPanel from "@/components/AlertsPanel";
import WelcomeMessage from "@/components/WelcomeMessage";
import MilestonesPanel from "@/components/MilestonesPanel";
import EarnedBadgesPanel from "@/components/EarnedBadgesPanel";
import TodoListPanel from "@/components/TodoListPanel";
import DueDatesPanel from "@/components/DueDatesPanel";
import DashboardSettingsDialog from "@/components/DashboardSettingsDialog";
import CirclesOverviewCard from "@/components/CirclesOverviewCard";
import JournalCard from "@/components/JournalCard";
import FeedCard from "@/components/FeedCard";
import type { TaskAlert, UnifiedBooster, Milestone, BadgeWithLevels, DashboardPreferences, DashboardCardKey } from "@shared/schema";
import { defaultDashboardPreferences, dashboardCardKeys } from "@shared/schema";
import {
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
  getWeekId,
  StoredTodoItem,
  StoredDueDateItem,
  StoredFriendWelcomeMessage,
} from "@/lib/storage";

const getMockWeekData = (weekOffset: number = 0, isDemo: boolean = false) => {
  const baseWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekStart = addDays(baseWeekStart, weekOffset * 7);
  const today = new Date();
  const todayDayIndex = Math.floor((today.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24));
  
  // Seeded random for consistent values per week offset
  const seed = Math.abs(weekOffset * 7 + 1000);
  const seededRandom = (i: number) => {
    const x = Math.sin(seed + i) * 10000;
    return Math.floor((x - Math.floor(x)) * 50) + 30;
  };
  
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    // For demo mode: show full data for current week and past weeks
    // For non-demo: past weeks have all data, current week only up to today, future weeks empty
    let isLogged = false;
    if (isDemo) {
      // Demo mode: show all days for current and past weeks
      isLogged = weekOffset <= 0;
    } else if (weekOffset < 0) {
      isLogged = true; // Past weeks have all data
    } else if (weekOffset === 0) {
      isLogged = i <= todayDayIndex; // Current week: only up to today
    }
    // Future weeks have no data
    return {
      date: format(date, "MMM d"),
      dayName: format(date, "EEE"),
      points: isLogged ? seededRandom(i) : null,
    };
  });
  return days;
};

const getMockBoosters = (): UnifiedBooster[] => [
  // Positive boosters - achieved
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
    id: "custom-hydration",
    name: "Hydration goal",
    description: "Drink 8 glasses 6 times per week",
    points: 12,
    achieved: true,
    progress: 6,
    required: 6,
    period: "week",
    isNegative: false,
  },
  // Positive boosters - in progress
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
    id: "custom-bible",
    name: "Daily devotion",
    description: "Bible study 6 times per week",
    points: 25,
    achieved: false,
    progress: 4,
    required: 6,
    period: "week",
    isNegative: false,
  },
  {
    id: "custom-meditate",
    name: "Mindfulness streak",
    description: "Meditate 5 times per week",
    points: 15,
    achieved: false,
    progress: 3,
    required: 5,
    period: "week",
    isNegative: false,
  },
  {
    id: "custom-nospend",
    name: "Frugal week",
    description: "No spending day 3 times per week",
    points: 18,
    achieved: false,
    progress: 1,
    required: 3,
    period: "week",
    isNegative: false,
  },
  // Negative boosters (bad habits penalties)
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
    description: "If scrolled 2+ hours 3 times this week",
    points: -18,
    achieved: true,
    progress: 3,
    required: 3,
    period: "week",
    isNegative: true,
  },
  {
    id: "negative-latesleep",
    name: "Late Night",
    description: "If stayed up past midnight 4+ times",
    points: -12,
    achieved: false,
    progress: 2,
    required: 4,
    period: "week",
    isNegative: true,
  },
  {
    id: "negative-alcohol",
    name: "Drank Alcohol",
    description: "If drank 2+ times per week",
    points: -20,
    achieved: false,
    progress: 0,
    required: 2,
    period: "week",
    isNegative: true,
  },
  {
    id: "negative-impulse",
    name: "Impulse Purchase",
    description: "If made 2+ impulse buys this week",
    points: -20,
    achieved: false,
    progress: 1,
    required: 2,
    period: "week",
    isNegative: true,
  },
];

const getMockRecentWeeks = (defaultGoal: number): WeekData[] => {
  const today = new Date();
  
  // Comprehensive sample tasks covering different life areas
  const sampleTasks: DayTaskData[][] = [
    // Monday - Strong start
    [
      { id: "t1", name: "Bible study", value: 15 },
      { id: "t2", name: "Morning workout", value: 20 },
      { id: "t3", name: "Read 30 min", value: 10 },
      { id: "t8", name: "Drink 8 glasses water", value: 5 },
      { id: "t9", name: "Take vitamins", value: 3 },
      { id: "t10", name: "No phone first hour", value: 8 },
    ],
    // Tuesday - Balanced day
    [
      { id: "t1", name: "Bible study", value: 15 },
      { id: "t4", name: "Meal prep", value: 12 },
      { id: "t5", name: "Meditate", value: 8 },
      { id: "t8", name: "Drink 8 glasses water", value: 5 },
      { id: "t11", name: "Call family", value: 10 },
      { id: "t12", name: "Budget review", value: 7 },
    ],
    // Wednesday - Midweek focus
    [
      { id: "t2", name: "Morning workout", value: 20 },
      { id: "t5", name: "Meditate", value: 8 },
      { id: "t6", name: "Journal", value: 7 },
      { id: "t13", name: "Deep work 2hrs", value: 15 },
      { id: "t14", name: "Learn new skill", value: 12 },
      { id: "t9", name: "Take vitamins", value: 3 },
    ],
    // Thursday - Productive day
    [
      { id: "t1", name: "Bible study", value: 15 },
      { id: "t2", name: "Morning workout", value: 20 },
      { id: "t3", name: "Read 30 min", value: 10 },
      { id: "t5", name: "Meditate", value: 8 },
      { id: "t15", name: "Gratitude practice", value: 5 },
      { id: "t8", name: "Drink 8 glasses water", value: 5 },
      { id: "t16", name: "Evening walk", value: 8 },
    ],
    // Friday - Lighter day
    [
      { id: "t4", name: "Meal prep", value: 12 },
      { id: "t3", name: "Read 30 min", value: 10 },
      { id: "t6", name: "Journal", value: 7 },
      { id: "t17", name: "Clean room", value: 8 },
      { id: "t18", name: "Review weekly goals", value: 6 },
    ],
    // Saturday - Self-care focus
    [
      { id: "t1", name: "Bible study", value: 15 },
      { id: "t5", name: "Meditate", value: 8 },
      { id: "t7", name: "Stretch routine", value: 5 },
      { id: "t19", name: "Skincare routine", value: 4 },
      { id: "t20", name: "No spending day", value: 10 },
      { id: "t21", name: "Outdoor time 1hr", value: 12 },
    ],
    // Sunday - Rest and reset
    [
      { id: "t1", name: "Bible study", value: 15 },
      { id: "t6", name: "Journal", value: 7 },
      { id: "t4", name: "Meal prep", value: 12 },
      { id: "t22", name: "Plan next week", value: 8 },
      { id: "t15", name: "Gratitude practice", value: 5 },
    ],
  ];
  
  const generateDays = (weekOffset: number, points: number[]): DayData[] => {
    const weekStart = startOfWeek(subWeeks(today, weekOffset), { weekStartsOn: 1 });
    return points.map((p, i) => ({
      date: format(addDays(weekStart, i), "MMM d"),
      dayName: format(addDays(weekStart, i), "EEE"),
      points: p,
      completedTasks: sampleTasks[(i + weekOffset) % sampleTasks.length],
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
  {
    id: "milestone-3",
    name: "Read 12 books",
    description: "Complete one book per month",
    points: 75,
    deadline: "2025-12-31",
    achieved: false,
  },
  {
    id: "milestone-4",
    name: "Emergency fund",
    description: "Save 3 months of expenses",
    points: 150,
    deadline: "2025-06-01",
    achieved: false,
  },
  {
    id: "milestone-5",
    name: "Learn Spanish basics",
    description: "Complete beginner Spanish course",
    points: 60,
    deadline: "2025-04-15",
    achieved: false,
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
  {
    id: "badge-4",
    name: "Early Riser",
    description: "Complete morning routine before 7am",
    icon: "sunrise",
    conditionType: "taskCompletions",
    taskName: "Morning routine",
    levels: [
      { level: 1, required: 7, earned: false },
      { level: 2, required: 30, earned: false },
      { level: 3, required: 90, earned: false },
    ],
    currentProgress: 4,
  },
  {
    id: "badge-5",
    name: "Hydration Hero",
    description: "Drink 8 glasses of water daily",
    icon: "droplet",
    conditionType: "taskCompletions",
    taskName: "Drink water",
    levels: [
      { level: 1, required: 14, earned: false },
      { level: 2, required: 60, earned: false },
    ],
    currentProgress: 9,
  },
  {
    id: "badge-6",
    name: "Goal Getter",
    description: "Hit weekly goal consecutively",
    icon: "target",
    conditionType: "weeklyGoalStreak",
    levels: [
      { level: 1, required: 4, earned: false },
      { level: 2, required: 12, earned: false },
      { level: 3, required: 26, earned: false },
    ],
    currentProgress: 2,
  },
];

const getMockWeeklyTodos = (): StoredTodoItem[] => [
  { id: "wt1", title: "Meal prep for the week", pointValue: 15, completed: true, order: 0 },
  { id: "wt2", title: "Review weekly goals", pointValue: 10, completed: false, order: 1 },
  { id: "wt3", title: "Clean the garage", pointValue: 20, completed: false, order: 2 },
  { id: "wt4", title: "Schedule dentist appointment", pointValue: 8, completed: true, order: 3 },
  { id: "wt5", title: "Organize closet", pointValue: 12, completed: false, order: 4 },
  { id: "wt6", title: "Call mom", pointValue: 5, completed: true, order: 5 },
];

const getMockDueDates = (): StoredDueDateItem[] => [
  { id: "dd1", title: "Submit tax documents", dueDate: "2025-01-15", pointValue: 50, penaltyValue: 25, status: "pending" },
  { id: "dd2", title: "Renew gym membership", dueDate: "2024-12-31", pointValue: 20, penaltyValue: 10, status: "pending" },
  { id: "dd3", title: "Pay credit card bill", dueDate: "2024-12-10", pointValue: 30, penaltyValue: 15, status: "completed", completedAt: "2024-12-08" },
  { id: "dd4", title: "Car insurance renewal", dueDate: "2025-02-15", pointValue: 25, penaltyValue: 15, status: "pending" },
  { id: "dd5", title: "Annual physical checkup", dueDate: "2025-01-30", pointValue: 40, penaltyValue: 20, status: "pending" },
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
  const { user } = useAuth();
  const useMockData = isDemo || isOnboarding;
  
  // Get display name from authenticated user, fallback to "You"
  const authDisplayName = user?.displayName || user?.firstName || null;
  
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
  const [useCustomMessage, setUseCustomMessage] = useState(false);
  const [friendWelcomeMessages, setFriendWelcomeMessages] = useState<StoredFriendWelcomeMessage[]>([]);
  const [savedCustomMessages, setSavedCustomMessages] = useState<string[]>([]);
  const [selectedMessageIndex, setSelectedMessageIndex] = useState<number>(-1);
  const [boosters, setBoosters] = useState<UnifiedBooster[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [badges, setBadges] = useState<BadgeWithLevels[]>([]);
  const [weeklyTodos, setWeeklyTodos] = useState<StoredTodoItem[]>([]);
  const [weeklyTodoBonusEnabled, setWeeklyTodoBonusEnabled] = useState(false);
  const [weeklyTodoBonusPoints, setWeeklyTodoBonusPoints] = useState(25);
  const [weeklyTodoBonusAwarded, setWeeklyTodoBonusAwarded] = useState(false);
  const [dueDates, setDueDates] = useState<StoredDueDateItem[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  
  // Track if we've loaded real data to prevent mock data from overwriting
  const hasLoadedRealDataRef = useRef(false);
  const [weeklyTodoWeekOffset, setWeeklyTodoWeekOffset] = useState(0);
  const [weeklyTodosExpanded, setWeeklyTodosExpanded] = useState(false);
  const [milestonesExpanded, setMilestonesExpanded] = useState(false);
  const [weekStartDate, setWeekStartDate] = useState("");
  const [weekEndDate, setWeekEndDate] = useState("");

  // Season interfaces
  interface Season {
    id: string;
    name: string;
    isActive: boolean;
    isArchived: boolean;
    weeklyGoal?: number;
  }

  interface SeasonWithData {
    id: string;
    name: string;
    tasks: any[];
    categories: any[];
    penalties: any[];
    weeklyGoal?: number;
  }

  // Fetch seasons to check for active season
  const { data: seasons = [] } = useQuery<Season[]>({
    queryKey: ["/api/seasons"],
    enabled: !useMockData,
  });

  const activeSeason = useMockData 
    ? { id: "demo-season", name: "Demo Season", isActive: true, isArchived: false, weeklyGoal: 350 }
    : seasons.find((s) => s.isActive && !s.isArchived);

  // Fetch active season data (tasks/categories/penalties) when a season is active
  const { data: activeSeasonData, isFetched: activeSeasonDataFetched } = useQuery<SeasonWithData>({
    queryKey: ["/api/seasons", activeSeason?.id, "data"],
    enabled: !useMockData && !!activeSeason?.id,
  });

  // API queries for tasks, penalties, daily logs, and settings
  const { data: apiTasks, isFetched: tasksFetched } = useQuery<any[]>({
    queryKey: ["/api/habit/tasks"],
    enabled: !useMockData && !activeSeason,
  });

  const { data: apiPenalties, isFetched: penaltiesFetched } = useQuery<any[]>({
    queryKey: ["/api/habit/penalties"],
    enabled: !useMockData && !activeSeason,
  });

  const { data: apiDailyLogs, isFetched: logsFetched } = useQuery<any[]>({
    queryKey: ["/api/habit/logs"],
    enabled: !useMockData,
  });

  const { data: apiSettings, isFetched: settingsFetched } = useQuery<any>({
    queryKey: ["/api/habit/settings"],
    enabled: !useMockData,
  });

  const { data: apiCheerlines } = useQuery<any[]>({
    queryKey: ["/api/cheerlines"],
    enabled: !useMockData,
  });

  // Fetch milestones and due dates from API for cross-device persistence
  const { data: apiMilestones, isFetched: milestonesFetched } = useQuery<any[]>({
    queryKey: ["/api/milestones"],
    enabled: !useMockData,
  });

  const { data: apiDueDates, isFetched: dueDatesFetched } = useQuery<any[]>({
    queryKey: ["/api/due-dates"],
    enabled: !useMockData,
  });
  
  // Fetch weekly todos from API - support week navigation
  const currentWeekId = getWeekId(new Date());
  const selectedWeekDate = addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), weeklyTodoWeekOffset * 7);
  const selectedWeekId = getWeekId(selectedWeekDate);
  const previousWeekDate = addDays(selectedWeekDate, -7);
  const previousWeekId = getWeekId(previousWeekDate);
  
  const { data: apiWeeklyTodos, isFetched: weeklyTodosFetched } = useQuery<any>({
    queryKey: ["/api/habit/weekly-todos", selectedWeekId],
    enabled: !useMockData,
  });
  
  // Fetch previous week's todos for import functionality
  const { data: apiPreviousWeekTodos } = useQuery<any>({
    queryKey: ["/api/habit/weekly-todos", previousWeekId],
    enabled: !useMockData,
  });

  // Fetch dashboard preferences
  const { data: apiDashboardPrefs } = useQuery<DashboardPreferences>({
    queryKey: ["/api/dashboard/preferences"],
    enabled: !useMockData,
  });

  // Local state for dashboard preferences (supports demo mode and optimistic updates)
  const [localDashboardPrefs, setLocalDashboardPrefs] = useState<DashboardPreferences>(defaultDashboardPreferences);

  // Sync local state with API data when available
  useEffect(() => {
    if (apiDashboardPrefs) {
      setLocalDashboardPrefs(apiDashboardPrefs);
    }
  }, [apiDashboardPrefs]);

  // Auto-trigger help dialog for new users (when hasSeenOnboarding is false)
  const hasTriggeredOnboardingRef = useRef(false);
  useEffect(() => {
    if (!useMockData && apiDashboardPrefs && !apiDashboardPrefs.hasSeenOnboarding && !hasTriggeredOnboardingRef.current) {
      hasTriggeredOnboardingRef.current = true;
      setHelpDialogOpen(true);
    }
  }, [apiDashboardPrefs, useMockData]);

  // Mark onboarding as seen when help dialog closes
  const handleHelpDialogClose = (open: boolean) => {
    setHelpDialogOpen(open);
    if (!open && !useMockData && dashboardPrefs && !dashboardPrefs.hasSeenOnboarding) {
      const updatedPrefs = { ...dashboardPrefs, hasSeenOnboarding: true };
      handlePreferencesChange(updatedPrefs);
    }
  };

  // Mutation for updating dashboard preferences
  const updatePrefsMutation = useMutation({
    mutationFn: async (prefs: DashboardPreferences) => {
      const response = await apiRequest("PUT", "/api/dashboard/preferences", prefs);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/preferences"] });
    },
  });

  const handlePreferencesChange = (prefs: DashboardPreferences) => {
    // Always update local state for immediate feedback
    setLocalDashboardPrefs(prefs);
    // Only persist to API when not in demo mode
    if (!useMockData) {
      updatePrefsMutation.mutate(prefs);
    }
  };

  // Use local state for rendering
  const dashboardPrefs = localDashboardPrefs;
  
  // Check if API queries have completed their initial fetch
  const apiQueriesReady = useMockData || (activeSeason ? activeSeasonDataFetched : (tasksFetched && penaltiesFetched && logsFetched));

  // Mutation for updating settings (weekly goal)
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: { weeklyGoal: number }) => {
      const response = await apiRequest("PUT", "/api/habit/settings", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habit/settings"] });
    },
  });

  // Ref to track last synced stats (declared here so mutation can access it)
  const lastSyncedStatsRef = useRef<string | null>(null);

  // Mutation for syncing user stats to database
  const syncStatsMutation = useMutation({
    mutationFn: async (data: { 
      weeklyPoints?: number; 
      dayStreak?: number; 
      weekStreak?: number; 
      longestDayStreak?: number; 
      longestWeekStreak?: number;
      totalBadgesEarned?: number;
    }) => {
      const response = await apiRequest("PUT", "/api/habit/stats", data);
      return response.json();
    },
    onError: () => {
      // Reset ref on error to allow retry
      lastSyncedStatsRef.current = null;
    },
  });

  // Ref to track last FP bonus check (to prevent duplicate calls)
  const lastFpBonusCheckRef = useRef<string | null>(null);

  // Mutation for checking and awarding FP bonuses (Task Master, Over Achiever)
  const checkFpBonusesMutation = useMutation({
    mutationFn: async (data: { taskCount: number; weeklyTotal: number; weeklyGoal: number }) => {
      const response = await apiRequest("POST", "/api/fp/check-weekly-bonuses", data);
      return response.json();
    },
    onSuccess: () => {
      // Refresh FP total after awarding
      queryClient.invalidateQueries({ queryKey: ["/api/fp"] });
    },
  });

  // Load data from localStorage on mount or when API data changes
  useEffect(() => {
    // Use mock data during demo/onboarding, otherwise load from storage
    // BUT: Don't overwrite with mock data if we've already loaded real user data
    if (useMockData && !hasLoadedRealDataRef.current) {
      setDays(getMockWeekData(weekOffset, true));
      // Update week date strings for mock data too
      const baseWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      const weekStart = addDays(baseWeekStart, weekOffset * 7);
      const weekEnd = addDays(weekStart, 6);
      setWeekStartDate(format(weekStart, "yyyy-MM-dd"));
      setWeekEndDate(format(weekEnd, "yyyy-MM-dd"));
      setRecentWeeks(getMockRecentWeeks(350));
      setMilestones(getMockMilestones());
      setBoosters(getMockBoosters());
      setBadges(getMockBadges());
      setAlerts(getMockAlerts());
      setUserName("Jordan");
      setEncouragementMessage("Let's start this week off right, you can do it I believe in you!");
      setUseCustomMessage(true);
      setFriendWelcomeMessages([
        { friendId: "friend-1", friendName: "Alex Chen", message: "You've got this! Crush it this week!", createdAt: new Date(Date.now() - 3600000).toISOString(), expiresAt: new Date(Date.now() + 86400000 * 2).toISOString() },
        { friendId: "friend-3", friendName: "Sam Rivera", message: "Keep up the amazing streak!", createdAt: new Date(Date.now() - 7200000).toISOString(), expiresAt: new Date(Date.now() + 86400000 * 3).toISOString() },
      ]);
      setSavedCustomMessages([
        "Let's start this week off right, you can do it I believe in you!",
        "You are stronger than you think!",
        "One step at a time leads to great things!",
      ]);
      setSelectedMessageIndex(-1);
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
    
    // If we're in mock mode but have already loaded real data, skip this effect entirely
    if (useMockData) {
      return;
    }
    
    // Mark that we're loading real data
    hasLoadedRealDataRef.current = true;

    // Load user profile - prefer storage name, then auth display name, then first name, then "You"
    const profile = loadUserProfileFromStorage();
    const defaultName = user?.displayName || user?.firstName || "You";
    setUserName(profile.userName !== "You" ? profile.userName : defaultName);
    setEncouragementMessage(profile.encouragementMessage);
    setUseCustomMessage(profile.useCustomMessage ?? false);
    // Use API cheerlines if available, otherwise fall back to localStorage
    if (apiCheerlines && apiCheerlines.length > 0) {
      setFriendWelcomeMessages(apiCheerlines.map((c: any) => ({
        friendId: c.senderId || c.sender?.id || c.id,
        friendName: c.sender?.firstName ? `${c.sender.firstName} ${c.sender.lastName || ''}`.trim() : 'Friend',
        message: c.message,
        createdAt: c.createdAt,
        expiresAt: c.expiresAt,
        cheerlineId: c.id,
      })));
    } else {
      setFriendWelcomeMessages(profile.friendWelcomeMessages ?? []);
    }
    setSavedCustomMessages(profile.savedCustomMessages ?? []);
    setSelectedMessageIndex(profile.selectedMessageIndex ?? -1);

    // Load goals - prefer API settings, fall back to localStorage
    if (apiSettings?.weeklyGoal !== undefined) {
      setWeeklyGoal(apiSettings.weeklyGoal);
    } else {
      setWeeklyGoal(loadWeeklyGoalFromStorage());
    }

    // Load milestones from API (database persistence only)
    if (milestonesFetched) {
      setMilestones((apiMilestones || []).map((m: any) => ({
        id: m.id,
        name: m.name,
        description: m.description || "",
        points: m.points,
        deadline: m.deadline,
        achieved: m.achieved,
        achievedAt: m.achievedAt,
      })));
    }

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

    // Load weekly todos - prefer API data, fall back to localStorage
    if (apiWeeklyTodos) {
      setWeeklyTodos(apiWeeklyTodos.items || []);
      setWeeklyTodoBonusEnabled(apiWeeklyTodos.bonusEnabled ?? false);
      setWeeklyTodoBonusPoints(apiWeeklyTodos.bonusPoints ?? 25);
      setWeeklyTodoBonusAwarded(apiWeeklyTodos.bonusAwarded ?? false);
    } else if (!weeklyTodosFetched) {
      // While fetching, use localStorage as initial state
      const storedWeeklyTodoList = loadWeeklyTodoListFromStorage(selectedWeekId);
      if (storedWeeklyTodoList) {
        setWeeklyTodos(storedWeeklyTodoList.items);
        setWeeklyTodoBonusEnabled(storedWeeklyTodoList.bonusEnabled);
        setWeeklyTodoBonusPoints(storedWeeklyTodoList.bonusPoints);
        setWeeklyTodoBonusAwarded(storedWeeklyTodoList.bonusAwarded);
      } else {
        // Clear state when switching to a week with no data
        setWeeklyTodos([]);
        setWeeklyTodoBonusEnabled(false);
        setWeeklyTodoBonusPoints(25);
        setWeeklyTodoBonusAwarded(false);
      }
    }

    // Load due dates from API (database persistence only)
    if (dueDatesFetched) {
      setDueDates((apiDueDates || []).map((d: any) => ({
        id: d.id,
        title: d.title,
        dueDate: d.dueDate,
        pointValue: d.pointValue,
        penaltyValue: d.penaltyValue,
        status: d.status,
        completedAt: d.completedAt,
        isRecurring: d.isRecurring,
      })));
    }

    // Wait for API queries to complete before processing data
    if (!apiQueriesReady) {
      return;
    }

    // Load tasks and penalties for point calculations
    // Priority: active season data > regular API data > localStorage
    let tasks: any[];
    let penalties: any[];
    
    if (activeSeason && activeSeasonData) {
      // Use season-specific tasks and penalties when an active season exists
      tasks = activeSeasonData.tasks || [];
      penalties = activeSeasonData.penalties || [];
    } else {
      // Fall back to regular API data or localStorage
      const hasApiData = (apiTasks && apiTasks.length > 0) || (apiPenalties && apiPenalties.length > 0);
      if (hasApiData) {
        tasks = apiTasks || [];
        penalties = apiPenalties || [];
      } else {
        // Fallback to localStorage when API returns empty
        tasks = loadTasksFromStorage();
        penalties = loadPenaltiesFromStorage();
      }
    }
    
    // Build daily logs map from API data or localStorage fallback
    // Include todoPoints, penaltyPoints, taskPoints, and checkInBonusAwarded for complete daily summary calculations
    let dailyLogs: Record<string, { completedTaskIds: string[]; todoPoints: number; penaltyPoints: number; taskPoints?: number; checkInBonusAwarded?: boolean }> = {};
    const hasApiLogs = apiDailyLogs && apiDailyLogs.length > 0;
    
    if (hasApiLogs) {
      apiDailyLogs.forEach((log: any) => {
        dailyLogs[log.date] = { 
          completedTaskIds: log.completedTaskIds || [],
          todoPoints: log.todoPoints || 0,
          penaltyPoints: log.penaltyPoints || 0,
          taskPoints: log.taskPoints,
          checkInBonusAwarded: log.checkInBonusAwarded || false
        };
      });
    } else {
      // Fallback to localStorage when API returns empty (no check-in bonus for localStorage data)
      const storedLogs = loadDailyLogsFromStorage();
      Object.values(storedLogs).forEach((log) => {
        dailyLogs[log.date] = { 
          completedTaskIds: log.completedTaskIds || [],
          todoPoints: log.todoPoints || 0,
          penaltyPoints: log.penaltyPoints || 0,
          checkInBonusAwarded: false
        };
      });
    }

    // Compute task alerts based on priority thresholds
    // mustDo: alert if not done in 3+ days
    // shouldDo: alert if not done in 10+ days
    // Only show alerts after user has logged at least one day
    const computedAlerts: TaskAlert[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Only calculate alerts if user has logged at least one day
    const hasLogs = Object.keys(dailyLogs).length > 0;
    
    if (hasLogs) {
      // Find the earliest logged date to use for tasks never completed
      let firstLoggedDate: Date | null = null;
      Object.keys(dailyLogs).forEach(dateStr => {
        const logDate = new Date(dateStr);
        if (!firstLoggedDate || logDate < firstLoggedDate) {
          firstLoggedDate = logDate;
        }
      });
      
      for (const task of tasks) {
        if (task.priority === "couldDo" || !task.priority) continue;
        
        // Find the most recent date this task was completed
        let lastCompletedDate: Date | null = null;
        Object.entries(dailyLogs).forEach(([dateStr, log]) => {
          if (log.completedTaskIds?.includes(task.id)) {
            const logDate = new Date(dateStr);
            if (!lastCompletedDate || logDate > lastCompletedDate) {
              lastCompletedDate = logDate;
            }
          }
        });
        
        const threshold = task.priority === "mustDo" ? 3 : 10;
        let daysMissing: number;
        
        if (lastCompletedDate !== null) {
          const completedDate = new Date(lastCompletedDate);
          completedDate.setHours(0, 0, 0, 0);
          daysMissing = Math.floor((today.getTime() - completedDate.getTime()) / (1000 * 60 * 60 * 24));
        } else if (firstLoggedDate) {
          // Never completed - calculate days since user started logging
          const firstDate = new Date(firstLoggedDate);
          firstDate.setHours(0, 0, 0, 0);
          daysMissing = Math.floor((today.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
        } else {
          // No logs at all - skip this task
          continue;
        }
        
        if (daysMissing >= threshold) {
          computedAlerts.push({
            taskId: task.id,
            taskName: task.name,
            priority: task.priority,
            daysMissing,
            threshold,
          });
        }
      }
      
      // Sort alerts: mustDo first, then by daysMissing descending
      computedAlerts.sort((a, b) => {
        if (a.priority === "mustDo" && b.priority !== "mustDo") return -1;
        if (a.priority !== "mustDo" && b.priority === "mustDo") return 1;
        return b.daysMissing - a.daysMissing;
      });
    }
    
    setAlerts(computedAlerts);

    // Calculate current week data from daily logs (using weekOffset for navigation)
    const baseWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekStart = weekOffset === 0 ? baseWeekStart : addDays(baseWeekStart, weekOffset * 7);
    const weekEnd = addDays(weekStart, 6);
    
    // Set ISO date strings for WeeklyTable
    setWeekStartDate(format(weekStart, "yyyy-MM-dd"));
    setWeekEndDate(format(weekEnd, "yyyy-MM-dd"));
    
    const currentWeekDays = Array.from({ length: 7 }, (_, i) => {
      const date = addDays(weekStart, i);
      const dateKey = format(date, "yyyy-MM-dd");
      const log = dailyLogs[dateKey];
      
      let points: number | null = null;
      if (log) {
        // Use stored taskPoints if available (frozen at save time), otherwise calculate from completedTaskIds
        const taskPoints = log.taskPoints !== undefined ? log.taskPoints : log.completedTaskIds.reduce((sum, taskId) => {
          const task = tasks.find(t => t.id === taskId);
          if (task && task.value > 0) return sum + task.value;
          return sum;
        }, 0);
        // Add todoPoints, subtract penaltyPoints, and add +3 check-in bonus if awarded
        const checkInBonus = log.checkInBonusAwarded ? 3 : 0;
        points = taskPoints + (log.todoPoints || 0) - (log.penaltyPoints || 0) + checkInBonus;
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
        let completedTasks: DayTaskData[] = [];
        if (log) {
          weekHasLogs = true;
          // Use stored taskPoints if available (frozen at save time), otherwise calculate from completedTaskIds
          const taskPoints = log.taskPoints !== undefined ? log.taskPoints : log.completedTaskIds.reduce((sum, taskId) => {
            const task = tasks.find(t => t.id === taskId);
            if (task && task.value > 0) return sum + task.value;
            return sum;
          }, 0);
          // Add todoPoints, subtract penaltyPoints, and add +3 check-in bonus if awarded
          const checkInBonus = log.checkInBonusAwarded ? 3 : 0;
          dayPoints = taskPoints + (log.todoPoints || 0) - (log.penaltyPoints || 0) + checkInBonus;
          
          // Build completed tasks list for day breakdown
          completedTasks = log.completedTaskIds
            .map(taskId => {
              const task = tasks.find(t => t.id === taskId);
              const penalty = penalties.find(p => p.id === taskId);
              if (task) {
                return { id: task.id, name: task.name, value: task.value };
              } else if (penalty) {
                return { id: penalty.id, name: penalty.name, value: -penalty.value };
              }
              return null;
            })
            .filter((t): t is DayTaskData => t !== null);
          
          // Add todo points and penalty points as special items if present
          if (log.todoPoints && log.todoPoints > 0) {
            completedTasks.push({ id: 'todo-points', name: 'Todo Items', value: log.todoPoints });
          }
          if (log.penaltyPoints && log.penaltyPoints > 0) {
            completedTasks.push({ id: 'penalty-points', name: 'Penalties', value: -log.penaltyPoints });
          }
          if (checkInBonus > 0) {
            completedTasks.push({ id: 'checkin-bonus', name: 'Check-in Bonus', value: checkInBonus });
          }
        }
        
        weekDays.push({
          date: format(date, "MMM d"),
          dayName: format(date, "EEE"),
          points: dayPoints,
          completedTasks: completedTasks.length > 0 ? completedTasks : undefined,
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
          defaultGoal: apiSettings?.weeklyGoal ?? loadWeeklyGoalFromStorage(),
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
    // Helper to calculate daily points for a date
    const getDailyPoints = (dateKey: string): number => {
      const log = dailyLogs[dateKey];
      if (!log) return 0;
      return log.completedTaskIds.reduce((sum, taskId) => {
        const task = tasks.find(t => t.id === taskId);
        const penalty = penalties.find(p => p.id === taskId);
        if (task) return sum + task.value;
        if (penalty) return sum - penalty.value;
        return sum;
      }, 0);
    };
    
    // Get daily goal - from API settings or localStorage
    const dailyGoalValue = apiSettings?.dailyGoal ?? loadDailyGoalFromStorage();
    
    // Calculate current day streak (consecutive days WHERE DAILY GOAL WAS MET)
    let currentDayStreakCount = 0;
    let checkDate = new Date();
    // Check if today meets goal, if not start from yesterday
    const todayKey = format(checkDate, "yyyy-MM-dd");
    const todayPoints = getDailyPoints(todayKey);
    if (!dailyLogs[todayKey] || todayPoints < dailyGoalValue) {
      checkDate = addDays(checkDate, -1);
    }
    while (true) {
      const dateKey = format(checkDate, "yyyy-MM-dd");
      const dayPoints = getDailyPoints(dateKey);
      // Only count day if goal was met
      if (dailyLogs[dateKey] && dayPoints >= dailyGoalValue) {
        currentDayStreakCount++;
        checkDate = addDays(checkDate, -1);
      } else {
        break;
      }
    }
    
    // Calculate longest consecutive day streak (days where goal was met)
    const sortedDates = Object.keys(dailyLogs).sort();
    let maxDayStreakCount = 0;
    let tempStreak = 0;
    let prevDate: Date | null = null;
    
    for (const dateStr of sortedDates) {
      const dayPoints = getDailyPoints(dateStr);
      // Only count if daily goal was met
      if (dayPoints >= dailyGoalValue) {
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
      } else {
        // Reset streak on days that don't meet goal
        tempStreak = 0;
        prevDate = null;
      }
    }
    
    setDayStreak(currentDayStreakCount);
    setLongestDayStreak(maxDayStreakCount);

    // Calculate week streaks (weeks where goal was met)
    const weeklyGoalValue = apiSettings?.weeklyGoal ?? loadWeeklyGoalFromStorage();
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

    // Calculate boosters from tasks with boosterRule enabled
    const taskBoosters: UnifiedBooster[] = tasks
      .filter(t => t.boosterRule?.enabled)
      .map(t => {
        const rule = t.boosterRule!;
        // Count completions in the current period
        let completions = 0;
        const periodStart = rule.period === "month" 
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
          description: `Complete ${rule.timesRequired} times per ${rule.period}`,
          points: rule.bonusPoints,
          achieved: completions >= rule.timesRequired,
          progress: completions,
          required: rule.timesRequired,
          period: rule.period,
          isNegative: false,
        };
      });

    // Calculate negative boosters from penalties with negativeBoostEnabled
    const negativeBoosters: UnifiedBooster[] = penalties
      .filter(p => p.negativeBoostEnabled && p.timesThreshold && p.boostPenaltyPoints)
      .map(p => {
        // Count occurrences in the current period
        let occurrences = 0;
        const periodStart = p.period === "month" 
          ? subWeeks(new Date(), 4) 
          : startOfWeek(new Date(), { weekStartsOn: 1 });
        
        Object.entries(dailyLogs).forEach(([dateStr, log]) => {
          const logDate = new Date(dateStr);
          if (logDate >= periodStart && log.completedTaskIds.includes(p.id)) {
            occurrences++;
          }
        });
        
        return {
          id: `neg-boost-${p.id}`,
          name: p.name,
          description: `If done ${p.timesThreshold}+ times per ${p.period}`,
          points: -p.boostPenaltyPoints!,
          achieved: occurrences >= p.timesThreshold!,
          progress: occurrences,
          required: p.timesThreshold!,
          period: p.period as "week" | "month",
          isNegative: true,
        };
      });

    // Calculate task penalty rules (penalties for not completing tasks enough times)
    // Only calculate penalties for past weeks (weekOffset < 0), not the current week
    const taskPenalties: UnifiedBooster[] = weekOffset < 0 
      ? tasks
        .filter(t => t.penaltyRule?.enabled && t.penaltyRule?.timesThreshold !== undefined && t.penaltyRule?.penaltyPoints)
        .map(t => {
          const rule = t.penaltyRule!;
          // Count completions in the viewed week (past week)
          const baseWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
          const periodStart = addDays(baseWeekStart, weekOffset * 7);
          const periodEnd = addDays(periodStart, 7);
          let completions = 0;
          
          Object.entries(dailyLogs).forEach(([dateStr, log]) => {
            const logDate = new Date(dateStr);
            if (logDate >= periodStart && logDate < periodEnd && log.completedTaskIds.includes(t.id)) {
              completions++;
            }
          });
          
          // Check if penalty is triggered based on condition
          const isTriggered = rule.condition === "lessThan" 
            ? completions < rule.timesThreshold
            : completions > rule.timesThreshold;
          
          const conditionText = rule.condition === "lessThan" ? "less than" : "more than";
          
          return {
            id: `task-penalty-${t.id}`,
            name: t.name,
            description: `If done ${conditionText} ${rule.timesThreshold}x per week`,
            points: -rule.penaltyPoints,
            achieved: isTriggered,
            progress: completions,
            required: rule.timesThreshold,
            period: "week" as const,
            isNegative: true,
          };
        })
      : []; // No penalties for current week - only calculated after week ends

    // Task Master and Over Achiever bonuses now award FP instead of weekly points
    // They are handled separately via the /api/fp/check-weekly-bonuses endpoint
    
    setBoosters([...taskBoosters, ...negativeBoosters, ...taskPenalties]);
  }, [useMockData, apiTasks, apiPenalties, apiDailyLogs, apiSettings, apiCheerlines, apiWeeklyTodos, weeklyTodosFetched, activeSeason, activeSeasonData, apiQueriesReady, weekOffset, user, currentWeekId, selectedWeekId]);

  const baseWeekStartForRange = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekStartForRange = addDays(baseWeekStartForRange, weekOffset * 7);
  const weekEndForRange = addDays(weekStartForRange, 6);
  const weekRange = `${format(weekStartForRange, "MMM d")} - ${format(weekEndForRange, "MMM d")}`;

  const weekTotal = days.reduce((sum, d) => sum + (d.points || 0), 0);
  const positiveBoosterPoints = boosters.filter(b => b.achieved && !b.isNegative).reduce((sum, b) => sum + b.points, 0);
  const negativeBoosterPoints = boosters.filter(b => b.achieved && b.isNegative).reduce((sum, b) => sum + Math.abs(b.points), 0);
  const milestonePoints = milestones.filter(m => m.achieved).reduce((sum, m) => sum + m.points, 0);
  const boosterPoints = positiveBoosterPoints - negativeBoosterPoints + milestonePoints;
  
  // Calculate weekly todo points
  const weeklyTodoPoints = useMemo(() => {
    const completedPoints = weeklyTodos
      .filter(t => t.completed)
      .reduce((sum, t) => sum + t.pointValue, 0);
    const bonusPoints = weeklyTodoBonusAwarded ? weeklyTodoBonusPoints : 0;
    return completedPoints + bonusPoints;
  }, [weeklyTodos, weeklyTodoBonusAwarded, weeklyTodoBonusPoints]);

  // Calculate due date points
  const dueDatePoints = useMemo(() => {
    const earnedPoints = dueDates
      .filter(d => d.status === "completed")
      .reduce((sum, d) => sum + d.pointValue, 0);
    const lostPoints = dueDates
      .filter(d => d.status === "missed")
      .reduce((sum, d) => sum + d.penaltyValue, 0);
    return earnedPoints - lostPoints;
  }, [dueDates]);

  // Final total includes all point sources
  const finalTotal = weekTotal + boosterPoints + weeklyTodoPoints + dueDatePoints;

  // Sync calculated stats to database when they change (with deduplication)
  useEffect(() => {
    if (useMockData) return;
    if (!apiQueriesReady) return;
    
    // Calculate total badges earned
    const totalBadgesEarned = badges.reduce((sum, badge) => {
      return sum + badge.levels.filter(l => l.earned).length;
    }, 0);
    
    // Create a payload key to detect changes
    const payload = {
      weeklyPoints: finalTotal,
      dayStreak,
      weekStreak,
      longestDayStreak,
      longestWeekStreak,
      totalBadgesEarned,
    };
    const payloadKey = JSON.stringify(payload);
    
    // Skip if values haven't changed
    if (lastSyncedStatsRef.current === payloadKey) {
      return;
    }
    
    // Update ref and sync
    lastSyncedStatsRef.current = payloadKey;
    syncStatsMutation.mutate(payload);
  }, [useMockData, apiQueriesReady, finalTotal, dayStreak, weekStreak, longestDayStreak, longestWeekStreak, badges]);

  // Check and award FP bonuses (Task Master, Over Achiever) - once per week
  useEffect(() => {
    if (useMockData) return;
    if (!apiQueriesReady) return;
    if (weekOffset !== 0) return; // Only check for current week
    
    // Get tasks from active season or API
    const tasks = activeSeason && activeSeasonData?.tasks 
      ? activeSeasonData.tasks 
      : (apiTasks || []);
    
    // Create a key to detect changes and prevent duplicate calls
    const bonusCheckKey = `${currentWeekId}-${tasks.length}-${weekTotal}-${weeklyGoal}`;
    
    if (lastFpBonusCheckRef.current === bonusCheckKey) {
      return;
    }
    
    // Check if conditions are met for either bonus
    const hasTaskMaster = tasks.length >= 10;
    const hasOverAchiever = weeklyGoal > 0 && weekTotal >= weeklyGoal * 1.15;
    
    if (hasTaskMaster || hasOverAchiever) {
      lastFpBonusCheckRef.current = bonusCheckKey;
      checkFpBonusesMutation.mutate({
        taskCount: tasks.length,
        weeklyTotal: weekTotal,
        weeklyGoal: weeklyGoal,
      });
    }
  }, [useMockData, apiQueriesReady, weekOffset, currentWeekId, weekTotal, weeklyGoal, activeSeason, activeSeasonData, apiTasks]);

  const handleDayClick = () => {
    navigate("/daily");
  };

  const handleGoalChange = (newGoal: number) => {
    setWeeklyGoal(newGoal);
    if (!useMockData) {
      // Save to API, fall back to localStorage on error
      updateSettingsMutation.mutate({ weeklyGoal: newGoal }, {
        onError: () => {
          saveWeeklyGoalToStorage(newGoal);
        },
      });
    }
  };

  const handleWeekUpdate = (weekId: string, note: string, customGoal?: number) => {
    setRecentWeeks(prev => prev.map(week => 
      week.id === weekId 
        ? { ...week, note: note || undefined, customGoal }
        : week
    ));
  };

  const handleWelcomeUpdate = (newName: string, newMessage: string, customMode: boolean, savedMessages?: string[], selectedIndex?: number) => {
    setUserName(newName);
    setEncouragementMessage(newMessage);
    setUseCustomMessage(customMode);
    if (savedMessages !== undefined) {
      setSavedCustomMessages(savedMessages);
    }
    if (selectedIndex !== undefined) {
      setSelectedMessageIndex(selectedIndex);
    }
    if (!useMockData) {
      saveUserProfileToStorage({ 
        userName: newName, 
        encouragementMessage: newMessage,
        useCustomMessage: customMode,
        friendWelcomeMessages,
        savedCustomMessages: savedMessages ?? savedCustomMessages,
        selectedMessageIndex: selectedIndex ?? selectedMessageIndex,
      });
    }
  };

  const handleDismissFriendMessage = async (friendIdOrCheerlineId: string) => {
    // Find the message - could be keyed by friendId (demo) or cheerlineId (API)
    const messageToRemove = friendWelcomeMessages.find(m => 
      m.cheerlineId === friendIdOrCheerlineId || m.friendId === friendIdOrCheerlineId
    );
    const updated = friendWelcomeMessages.filter(m => 
      m.cheerlineId !== friendIdOrCheerlineId && m.friendId !== friendIdOrCheerlineId
    );
    setFriendWelcomeMessages(updated);
    if (!useMockData) {
      if (messageToRemove?.cheerlineId) {
        // API-based cheerline - delete from server
        try {
          await apiRequest("DELETE", `/api/cheerlines/${messageToRemove.cheerlineId}`, {});
          queryClient.invalidateQueries({ queryKey: ["/api/cheerlines"] });
        } catch (error) {
          console.error("Failed to dismiss cheerline:", error);
        }
      } else {
        // localStorage-based message - persist the updated list
        saveUserProfileToStorage({ 
          userName, 
          encouragementMessage,
          useCustomMessage,
          friendWelcomeMessages: updated,
          savedCustomMessages,
          selectedMessageIndex,
        });
      }
    }
  };

  const handleMilestoneAdd = async (milestone: Omit<Milestone, "id" | "achieved" | "achievedAt">) => {
    const newMilestone: Milestone = {
      ...milestone,
      id: String(Date.now()),
      achieved: false,
    };
    const updated = [...milestones, newMilestone];
    setMilestones(updated);
    if (!useMockData) {
      try {
        await apiRequest("POST", "/api/milestones", {
          name: milestone.name,
          description: milestone.description,
          points: milestone.points,
          deadline: milestone.deadline,
          achieved: false,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/milestones"] });
        // Award first_milestone one-time FP bonus
        await apiRequest("POST", "/api/fp/award-onetime", { eventType: "first_milestone" });
        queryClient.invalidateQueries({ queryKey: ["/api/fp"] });
      } catch (e) { console.error("Milestone add error:", e); }
    }
  };

  const handleMilestoneEdit = async (id: string, updates: Omit<Milestone, "id" | "achieved" | "achievedAt">) => {
    const updated = milestones.map(m => 
      m.id === id ? { ...m, ...updates } : m
    );
    setMilestones(updated);
    if (!useMockData) {
      try {
        await apiRequest("PUT", `/api/milestones/${id}`, updates);
        queryClient.invalidateQueries({ queryKey: ["/api/milestones"] });
      } catch (e) { console.error("Milestone edit error:", e); }
    }
  };

  const handleMilestoneDelete = async (id: string) => {
    const updated = milestones.filter(m => m.id !== id);
    setMilestones(updated);
    if (!useMockData) {
      try {
        await apiRequest("DELETE", `/api/milestones/${id}`, {});
        queryClient.invalidateQueries({ queryKey: ["/api/milestones"] });
      } catch (e) { console.error("Milestone delete error:", e); }
    }
  };

  const handleMilestoneToggle = async (id: string) => {
    const milestone = milestones.find(m => m.id === id);
    if (!milestone) return;
    const newAchieved = !milestone.achieved;
    const updated = milestones.map(m => 
      m.id === id 
        ? { 
            ...m, 
            achieved: newAchieved, 
            achievedAt: newAchieved ? new Date().toISOString() : undefined 
          } 
        : m
    );
    setMilestones(updated);
    if (!useMockData) {
      try {
        await apiRequest("PUT", `/api/milestones/${id}`, {
          achieved: newAchieved,
          achievedAt: newAchieved ? new Date().toISOString() : null,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/milestones"] });
      } catch (e) { console.error("Milestone toggle error:", e); }
    }
  };

  // Weekly todos handlers - save to API
  const handleWeeklyTodosChange = async (items: StoredTodoItem[]) => {
    setWeeklyTodos(items);
    if (!useMockData) {
      try {
        await apiRequest("PUT", `/api/habit/weekly-todos/${selectedWeekId}`, {
          items,
          bonusEnabled: weeklyTodoBonusEnabled,
          bonusPoints: weeklyTodoBonusPoints,
          bonusAwarded: weeklyTodoBonusAwarded,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/habit/weekly-todos", selectedWeekId] });
      } catch (e) { console.error("Error saving weekly todos:", e); }
    }
  };

  const handleWeeklyTodoBonusEnabledChange = async (enabled: boolean) => {
    setWeeklyTodoBonusEnabled(enabled);
    if (!useMockData) {
      try {
        await apiRequest("PUT", `/api/habit/weekly-todos/${selectedWeekId}`, {
          items: weeklyTodos,
          bonusEnabled: enabled,
          bonusPoints: weeklyTodoBonusPoints,
          bonusAwarded: weeklyTodoBonusAwarded,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/habit/weekly-todos", selectedWeekId] });
      } catch (e) { console.error("Error saving weekly todos:", e); }
    }
  };

  const handleWeeklyTodoBonusPointsChange = async (points: number) => {
    setWeeklyTodoBonusPoints(points);
    if (!useMockData) {
      try {
        await apiRequest("PUT", `/api/habit/weekly-todos/${selectedWeekId}`, {
          items: weeklyTodos,
          bonusEnabled: weeklyTodoBonusEnabled,
          bonusPoints: points,
          bonusAwarded: weeklyTodoBonusAwarded,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/habit/weekly-todos", selectedWeekId] });
      } catch (e) { console.error("Error saving weekly todos:", e); }
    }
  };
  
  // Get incomplete items from previous week for import
  const previousWeekItems: StoredTodoItem[] = (apiPreviousWeekTodos?.items || []).filter(
    (item: StoredTodoItem) => !item.completed
  );

  const handleImportFromPreviousWeek = async () => {
    if (previousWeekItems.length === 0) return;
    
    // Create new items with fresh IDs, copying essential fields from previous week
    const importedItems: StoredTodoItem[] = previousWeekItems.map((item: StoredTodoItem, index: number) => ({
      id: `todo-${Date.now()}-${index}`,
      title: item.title,
      pointValue: item.pointValue || 0,
      completed: false,
      order: weeklyTodos.length + index,
      note: item.note,
      penaltyEnabled: item.penaltyEnabled,
      penaltyValue: item.penaltyValue,
    }));
    
    const newItems = [...weeklyTodos, ...importedItems];
    await handleWeeklyTodosChange(newItems);
    
    // Show toast
    const { toast } = await import("@/hooks/use-toast");
    toast({
      title: "Items Imported",
      description: `${importedItems.length} incomplete item${importedItems.length > 1 ? "s" : ""} imported from last week`,
    });
  };

  // Due dates handlers - sync with API
  const handleDueDatesChange = async (items: StoredDueDateItem[]) => {
    const wasAdding = items.length > dueDates.length;
    const prevIds = new Set(dueDates.map(d => d.id));
    const newIds = new Set(items.map(d => d.id));
    
    setDueDates(items);
    
    if (!useMockData) {
      try {
        // Find added items (new IDs)
        const addedItems = items.filter(item => !prevIds.has(item.id));
        // Find deleted items (IDs no longer present)
        const deletedIds = dueDates.filter(d => !newIds.has(d.id)).map(d => d.id);
        // Find updated items (existing IDs with changes)
        const updatedItems = items.filter(item => 
          prevIds.has(item.id) && 
          JSON.stringify(item) !== JSON.stringify(dueDates.find(d => d.id === item.id))
        );

        // Process additions
        for (const item of addedItems) {
          await apiRequest("POST", "/api/due-dates", {
            title: item.title,
            dueDate: item.dueDate,
            pointValue: item.pointValue,
            penaltyValue: item.penaltyValue,
            status: item.status,
            isRecurring: item.isRecurring,
          });
        }

        // Process deletions
        for (const id of deletedIds) {
          await apiRequest("DELETE", `/api/due-dates/${id}`, {});
        }

        // Process updates
        for (const item of updatedItems) {
          await apiRequest("PUT", `/api/due-dates/${item.id}`, {
            title: item.title,
            dueDate: item.dueDate,
            pointValue: item.pointValue,
            penaltyValue: item.penaltyValue,
            status: item.status,
            completedAt: item.completedAt,
            isRecurring: item.isRecurring,
          });
        }

        queryClient.invalidateQueries({ queryKey: ["/api/due-dates"] });

        // Award first_due_date one-time FP bonus when adding
        if (wasAdding) {
          await apiRequest("POST", "/api/fp/award-onetime", { eventType: "first_due_date" });
          queryClient.invalidateQueries({ queryKey: ["/api/fp"] });
        }
      } catch (e) { 
        console.error("Due date sync error:", e); 
      }
    }
  };

  const welcomeSettings = {
    userName,
    message: encouragementMessage,
    useCustomMessage,
    savedCustomMessages,
    selectedMessageIndex,
  };

  const handleWelcomeSettingsChange = (settings: typeof welcomeSettings) => {
    setUserName(settings.userName);
    setEncouragementMessage(settings.message);
    setUseCustomMessage(settings.useCustomMessage);
    setSavedCustomMessages(settings.savedCustomMessages);
    setSelectedMessageIndex(settings.selectedMessageIndex);
    if (!useMockData) {
      saveUserProfileToStorage({
        userName: settings.userName,
        encouragementMessage: settings.message,
        useCustomMessage: settings.useCustomMessage,
        friendWelcomeMessages,
        savedCustomMessages: settings.savedCustomMessages,
        selectedMessageIndex: settings.selectedMessageIndex,
      });
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <WelcomeMessage
            userName={userName}
            message={encouragementMessage}
            useCustomMessage={useCustomMessage}
            friendMessages={friendWelcomeMessages}
            savedCustomMessages={savedCustomMessages}
            selectedMessageIndex={selectedMessageIndex}
            onDismissFriendMessage={handleDismissFriendMessage}
          />
        </div>
        <div className="flex flex-col items-center gap-1">
          <DashboardSettingsDialog
            preferences={dashboardPrefs}
            onPreferencesChange={handlePreferencesChange}
            welcomeSettings={welcomeSettings}
            onWelcomeSettingsChange={handleWelcomeSettingsChange}
            isPending={updatePrefsMutation.isPending}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setHelpDialogOpen(true)}
            data-testid="button-dashboard-help"
          >
            <HelpCircle className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <HelpDialog 
        open={helpDialogOpen} 
        onOpenChange={handleHelpDialogClose}
      />

      {(() => {
        const cardOrder = (dashboardPrefs.cardOrder?.length > 0 
          ? dashboardPrefs.cardOrder 
          : [...dashboardCardKeys]) as DashboardCardKey[];

        const renderCard = (key: DashboardCardKey) => {
          if (!dashboardPrefs[key]) return null;
          
          switch (key) {
            case "weekTotal":
              return (
                <PointsCard
                  weekTotal={finalTotal}
                  weekRange={weekRange}
                  boosterPoints={boosterPoints}
                  weeklyGoal={weeklyGoal}
                  onGoalChange={handleGoalChange}
                  days={days.map(d => ({ date: d.date, dayName: d.dayName, points: d.points }))}
                  boosters={[
                    ...boosters.map(b => ({ id: b.id, name: b.name, points: b.points, achieved: b.achieved, isNegative: b.isNegative })),
                    ...milestones.filter(m => m.achieved).map(m => ({ id: m.id, name: m.name, points: m.points, achieved: true, isNegative: false }))
                  ]}
                />
              );
            case "streaks":
              return (
                <StreaksCard
                  dayStreak={dayStreak}
                  weekStreak={weekStreak}
                  longestDayStreak={longestDayStreak}
                  longestWeekStreak={longestWeekStreak}
                />
              );
            case "badges":
              return <EarnedBadgesPanel badges={badges} />;
            case "weeklyTable":
              return (
                <WeeklyTable 
                  days={days} 
                  onDayClick={handleDayClick} 
                  weekOffset={weekOffset}
                  onWeekChange={setWeekOffset}
                  weekStartDate={weekStartDate}
                  weekEndDate={weekEndDate}
                />
              );
            case "alerts":
              return <AlertsPanel alerts={alerts} />;
            case "weeklyTodos":
              return (
                <TodoListPanel
                  title="Weekly To-Do List"
                  prompt="Use this space for things you want to get done at some point this week. Bigger tasks, flexible timing."
                  items={weeklyTodos}
                  onItemsChange={handleWeeklyTodosChange}
                  bonusEnabled={weeklyTodoBonusEnabled}
                  bonusPoints={weeklyTodoBonusPoints}
                  bonusAwarded={weeklyTodoBonusAwarded}
                  onBonusEnabledChange={handleWeeklyTodoBonusEnabledChange}
                  onBonusPointsChange={handleWeeklyTodoBonusPointsChange}
                  isDemo={useMockData}
                  previousItems={previousWeekItems}
                  onImportFromPrevious={handleImportFromPreviousWeek}
                  importLabel="Import from last week"
                  maxItems={4}
                  isExpanded={weeklyTodosExpanded}
                  onExpandToggle={() => setWeeklyTodosExpanded(!weeklyTodosExpanded)}
                />
              );
            case "dueDates":
              return (
                <DueDatesPanel
                  items={dueDates}
                  onItemsChange={handleDueDatesChange}
                />
              );
            case "boosters":
              return <BoostersPanel boosters={boosters} />;
            case "milestones":
              return (
                <MilestonesPanel
                  milestones={milestones}
                  onAdd={handleMilestoneAdd}
                  onEdit={handleMilestoneEdit}
                  onDelete={handleMilestoneDelete}
                  onToggleAchieved={handleMilestoneToggle}
                  maxItems={3}
                  isExpanded={milestonesExpanded}
                  onExpandToggle={() => setMilestonesExpanded(!milestonesExpanded)}
                />
              );
            case "recentWeeks":
              return (
                <RecentWeeks
                  weeks={recentWeeks}
                  defaultGoal={weeklyGoal}
                  onWeekUpdate={handleWeekUpdate}
                />
              );
            case "circlesOverview":
              return (
                <CirclesOverviewCard 
                  useMockData={useMockData} 
                  circleId={dashboardPrefs.selectedCircles?.[0]}
                />
              );
            case "journal":
              return <JournalCard useMockData={useMockData} />;
            case "feed":
              return (
                <FeedCard 
                  useMockData={useMockData} 
                  onViewAll={() => navigate("/community")}
                />
              );
            default:
              return null;
          }
        };

        const getCardSize = (key: DashboardCardKey) => {
          switch (key) {
            case "weeklyTable":
            case "recentWeeks":
              return "lg:col-span-2";
            default:
              return "";
          }
        };

        return (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {cardOrder.map((key) => {
              const card = renderCard(key);
              if (!card) return null;
              return (
                <div key={key} className={getCardSize(key)} data-testid={`dashboard-card-${key}`}>
                  {card}
                </div>
              );
            })}
          </div>
        );
      })()}
    </div>
  );
}
