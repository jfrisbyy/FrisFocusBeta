import { useState, useMemo, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { format, startOfWeek, addDays, subWeeks } from "date-fns";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useDemo } from "@/contexts/DemoContext";
import { useAuth } from "@/hooks/useAuth";
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
import DashboardSettingsDialog from "@/components/DashboardSettingsDialog";
import CirclesOverviewCard from "@/components/CirclesOverviewCard";
import JournalCard from "@/components/JournalCard";
import FeedCard from "@/components/FeedCard";
import type { TaskAlert, UnifiedBooster, Milestone, BadgeWithLevels, DashboardPreferences, DashboardCardKey } from "@shared/schema";
import { defaultDashboardPreferences, dashboardCardKeys } from "@shared/schema";
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

  const activeSeason = seasons.find((s) => s.isActive && !s.isArchived);

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
  
  // Fetch weekly todos from API
  const currentWeekId = getWeekId(new Date());
  const { data: apiWeeklyTodos, isFetched: weeklyTodosFetched } = useQuery<any>({
    queryKey: ["/api/habit/weekly-todos", currentWeekId],
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

  // Load data from localStorage on mount or when API data changes
  useEffect(() => {
    // Use mock data during demo/onboarding, otherwise load from storage
    if (useMockData) {
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

    // Load weekly todos - prefer API data, fall back to localStorage
    if (apiWeeklyTodos) {
      setWeeklyTodos(apiWeeklyTodos.items || []);
      setWeeklyTodoBonusEnabled(apiWeeklyTodos.bonusEnabled ?? false);
      setWeeklyTodoBonusPoints(apiWeeklyTodos.bonusPoints ?? 25);
      setWeeklyTodoBonusAwarded(apiWeeklyTodos.bonusAwarded ?? false);
    } else if (!weeklyTodosFetched) {
      // While fetching, use localStorage as initial state
      const storedWeeklyTodoList = loadWeeklyTodoListFromStorage(currentWeekId);
      if (storedWeeklyTodoList) {
        setWeeklyTodos(storedWeeklyTodoList.items);
        setWeeklyTodoBonusEnabled(storedWeeklyTodoList.bonusEnabled);
        setWeeklyTodoBonusPoints(storedWeeklyTodoList.bonusPoints);
        setWeeklyTodoBonusAwarded(storedWeeklyTodoList.bonusAwarded);
      }
    }

    // Load due dates
    const storedDueDates = loadDueDatesFromStorage();
    setDueDates(storedDueDates);

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
        } else {
          // Never completed - show high number
          daysMissing = 999;
        }
        
        if (daysMissing >= threshold) {
          computedAlerts.push({
            taskId: task.id,
            taskName: task.name,
            priority: task.priority,
            daysMissing: daysMissing > 999 ? 999 : daysMissing,
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

    setBoosters([...taskBoosters, ...negativeBoosters]);
  }, [useMockData, apiTasks, apiPenalties, apiDailyLogs, apiSettings, apiCheerlines, apiWeeklyTodos, weeklyTodosFetched, activeSeason, activeSeasonData, apiQueriesReady, weekOffset, user, currentWeekId]);

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
      saveMilestonesToStorage(updated.map(m => ({
        id: m.id,
        name: m.name,
        description: m.description,
        points: m.points,
        deadline: m.deadline,
        achieved: m.achieved,
        achievedAt: m.achievedAt,
      })));
      // Award first_milestone one-time FP bonus
      try {
        await apiRequest("POST", "/api/fp/award-onetime", { eventType: "first_milestone" });
        queryClient.invalidateQueries({ queryKey: ["/api/fp"] });
      } catch (e) { console.error("FP award error:", e); }
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

  // Weekly todos handlers - save to API
  const handleWeeklyTodosChange = async (items: StoredTodoItem[]) => {
    setWeeklyTodos(items);
    if (!useMockData) {
      try {
        await apiRequest("PUT", `/api/habit/weekly-todos/${currentWeekId}`, {
          items,
          bonusEnabled: weeklyTodoBonusEnabled,
          bonusPoints: weeklyTodoBonusPoints,
          bonusAwarded: weeklyTodoBonusAwarded,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/habit/weekly-todos", currentWeekId] });
      } catch (e) { console.error("Error saving weekly todos:", e); }
    }
  };

  const handleWeeklyTodoBonusEnabledChange = async (enabled: boolean) => {
    setWeeklyTodoBonusEnabled(enabled);
    if (!useMockData) {
      try {
        await apiRequest("PUT", `/api/habit/weekly-todos/${currentWeekId}`, {
          items: weeklyTodos,
          bonusEnabled: enabled,
          bonusPoints: weeklyTodoBonusPoints,
          bonusAwarded: weeklyTodoBonusAwarded,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/habit/weekly-todos", currentWeekId] });
      } catch (e) { console.error("Error saving weekly todos:", e); }
    }
  };

  const handleWeeklyTodoBonusPointsChange = async (points: number) => {
    setWeeklyTodoBonusPoints(points);
    if (!useMockData) {
      try {
        await apiRequest("PUT", `/api/habit/weekly-todos/${currentWeekId}`, {
          items: weeklyTodos,
          bonusEnabled: weeklyTodoBonusEnabled,
          bonusPoints: points,
          bonusAwarded: weeklyTodoBonusAwarded,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/habit/weekly-todos", currentWeekId] });
      } catch (e) { console.error("Error saving weekly todos:", e); }
    }
  };

  // Due dates handlers
  const handleDueDatesChange = async (items: StoredDueDateItem[]) => {
    const wasAdding = items.length > dueDates.length;
    setDueDates(items);
    if (!useMockData) {
      saveDueDatesToStorage(items);
      // Award first_due_date one-time FP bonus when adding
      if (wasAdding) {
        try {
          await apiRequest("POST", "/api/fp/award-onetime", { eventType: "first_due_date" });
          queryClient.invalidateQueries({ queryKey: ["/api/fp"] });
        } catch (e) { console.error("FP award error:", e); }
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
    <div className="p-4 md:p-6 space-y-6">
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
        <DashboardSettingsDialog
          preferences={dashboardPrefs}
          onPreferencesChange={handlePreferencesChange}
          welcomeSettings={welcomeSettings}
          onWelcomeSettingsChange={handleWelcomeSettingsChange}
          isPending={updatePrefsMutation.isPending}
        />
      </div>

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
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
