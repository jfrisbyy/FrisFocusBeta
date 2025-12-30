import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { format, addDays } from "date-fns";
import { useQuery, useMutation } from "@tanstack/react-query";
import DatePicker from "@/components/DatePicker";
import TaskCheckbox from "@/components/TaskCheckbox";
import DailySummary from "@/components/DailySummary";
import TodoListPanel from "@/components/TodoListPanel";
import ScheduleCard from "@/components/ScheduleCard";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useDemo } from "@/contexts/DemoContext";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { HelpCircle, Train, ChevronDown, ChevronUp, FileText, Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HelpDialog } from "@/components/HelpDialog";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  loadTasksFromStorage,
  loadPenaltiesFromStorage,
  loadCategoriesFromStorage,
  loadDailyLogFromStorage,
  saveDailyLogToStorage,
  loadJournalFromStorage,
  saveJournalToStorage,
  loadDailyTodoListFromStorage,
  saveDailyTodoListToStorage,
  updateBadgeProgressForTasks,
  type StoredTask,
  type StoredPenalty,
  type StoredJournalEntry,
  type StoredTodoItem,
  type StoredTaskTier,
} from "@/lib/storage";
import type { JournalFolder, HabitTrainWithSteps } from "@shared/schema";

interface DisplayTask {
  id: string;
  name: string;
  value: number;
  category: string;
  isBooster?: boolean;
  tiers?: StoredTaskTier[];
}

const sampleTasks: DisplayTask[] = [
  // Health & Fitness
  { id: "demo-1", name: "Morning workout", value: 20, category: "Health", isBooster: true },
  { id: "demo-2", name: "Drink 8 glasses water", value: 5, category: "Health", isBooster: true },
  { id: "demo-3", name: "Take vitamins", value: 3, category: "Health" },
  { id: "demo-4", name: "Stretch routine", value: 5, category: "Health" },
  { id: "demo-5", name: "Evening walk", value: 8, category: "Health" },
  // Productivity
  { id: "demo-6", name: "Deep work 2hrs", value: 15, category: "Productivity" },
  { id: "demo-7", name: "Read 30 minutes", value: 10, category: "Productivity", isBooster: true },
  { id: "demo-8", name: "Learn new skill", value: 12, category: "Productivity" },
  { id: "demo-9", name: "No phone first hour", value: 8, category: "Productivity" },
  // Spiritual
  { id: "demo-10", name: "Bible study", value: 15, category: "Spiritual", isBooster: true },
  { id: "demo-11", name: "Prayer time", value: 10, category: "Spiritual" },
  { id: "demo-12", name: "Gratitude practice", value: 5, category: "Spiritual" },
  // Mindfulness & Social
  { id: "demo-13", name: "Meditate", value: 8, category: "Mindfulness", isBooster: true },
  { id: "demo-14", name: "Journal", value: 7, category: "Mindfulness" },
  { id: "demo-15", name: "Call family", value: 10, category: "Social" },
  // Bad Habits (Penalties)
  { id: "demo-p1", name: "Ate junk food", value: -8, category: "Penalties" },
  { id: "demo-p2", name: "Drank alcohol", value: -10, category: "Penalties" },
  { id: "demo-p3", name: "Scrolled social media 2+ hrs", value: -8, category: "Penalties" },
  { id: "demo-p4", name: "Stayed up past midnight", value: -5, category: "Penalties" },
  { id: "demo-p5", name: "Impulse purchase", value: -12, category: "Penalties" },
];

const sampleDailyTodos: StoredTodoItem[] = [
  { id: "demo-todo-1", title: "Pick up medicine from pharmacy", pointValue: 5, completed: true, order: 0 },
  { id: "demo-todo-2", title: "Call Grandma", pointValue: 5, completed: false, order: 1 },
  { id: "demo-todo-3", title: "Grocery shopping", pointValue: 10, completed: true, order: 2 },
  { id: "demo-todo-4", title: "Take out trash", pointValue: 3, completed: false, order: 3 },
];

interface Season {
  id: string;
  name: string;
  isActive: boolean;
  isArchived: boolean;
}

interface SeasonWithData {
  id: string;
  name: string;
  tasks: any[];
  categories: any[];
  penalties: any[];
}

export default function DailyPage() {
  const { toast } = useToast();
  const { isDemo } = useDemo();
  const { user } = useAuth();
  const { triggerDaySaved } = useOnboarding();
  const [date, setDate] = useState(new Date());
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [allTasks, setAllTasks] = useState<DisplayTask[]>([]);
  const [todoItems, setTodoItems] = useState<StoredTodoItem[]>([]);
  const [todoBonusEnabled, setTodoBonusEnabled] = useState(false);
  const [todoBonusPoints, setTodoBonusPoints] = useState(10);
  const [todoBonusAwarded, setTodoBonusAwarded] = useState(false);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const [taskNotes, setTaskNotes] = useState<Record<string, string>>({});
  const [taskTiers, setTaskTiers] = useState<Record<string, string>>({});
  const [savedCompletedIds, setSavedCompletedIds] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedJournalFolderId, setSelectedJournalFolderId] = useState<string | null>(null);
  
  // Track which date we've already loaded log data for to prevent re-running
  const loadedLogDateRef = useRef<string | null>(null);
  
  // Debounce timeout for auto-saving task toggles
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingCompletedIdsRef = useRef<Set<string> | null>(null);

  const dateStr = format(date, "yyyy-MM-dd");

  // Fetch seasons to check for active season
  const { data: seasons = [] } = useQuery<Season[]>({
    queryKey: ["/api/seasons"],
    enabled: !isDemo,
  });

  const activeSeason = seasons.find((s) => s.isActive && !s.isArchived);

  // Fetch active season data (tasks/categories/penalties) when a season is active
  const { data: activeSeasonData, isFetched: activeSeasonDataFetched } = useQuery<SeasonWithData>({
    queryKey: ["/api/seasons", activeSeason?.id, "data"],
    enabled: !isDemo && !!activeSeason?.id,
  });

  // API queries for tasks, penalties, categories (only when no active season)
  const { data: apiTasks, isLoading: loadingTasks, isFetched: tasksFetched } = useQuery<any[]>({
    queryKey: ["/api/habit/tasks"],
    enabled: !isDemo && !activeSeason,
  });

  const { data: apiPenalties, isLoading: loadingPenalties, isFetched: penaltiesFetched } = useQuery<any[]>({
    queryKey: ["/api/habit/penalties"],
    enabled: !isDemo && !activeSeason,
  });

  const { data: apiCategories, isFetched: categoriesFetched } = useQuery<any[]>({
    queryKey: ["/api/habit/categories"],
    enabled: !isDemo && !activeSeason,
  });

  // API query for daily log of selected date
  const { data: apiDailyLog, refetch: refetchDailyLog, isFetched: dailyLogFetched } = useQuery<any>({
    queryKey: ["/api/habit/logs", dateStr],
    enabled: !isDemo,
  });

  // Determine if we need to load a historical season's tasks
  // (when the log's seasonId differs from the current active season)
  const logSeasonId = apiDailyLog?.seasonId;
  const needsHistoricalSeason = logSeasonId && logSeasonId !== activeSeason?.id;
  
  // Fetch the historical season's data if needed
  const { data: historicalSeasonData, isFetched: historicalSeasonFetched } = useQuery<SeasonWithData>({
    queryKey: ["/api/seasons", logSeasonId, "data"],
    enabled: !isDemo && !!needsHistoricalSeason,
  });

  // Fetch daily todos from API
  const { data: apiDailyTodos, isFetched: dailyTodosFetched } = useQuery<any>({
    queryKey: ["/api/habit/daily-todos", dateStr],
    enabled: !isDemo,
  });

  // Fetch previous day's todos for import feature
  const previousDayStr = format(addDays(date, -1), "yyyy-MM-dd");
  const { data: apiPreviousDayTodos } = useQuery<any>({
    queryKey: ["/api/habit/daily-todos", previousDayStr],
    enabled: !isDemo,
  });

  // Fetch journal folders for folder selection
  const { data: journalFolders = [] } = useQuery<JournalFolder[]>({
    queryKey: ["/api/journal/folders"],
    enabled: !isDemo && !!user,
  });

  // Fetch habit trains for train display and completion sync
  const { data: habitTrains = [] } = useQuery<HabitTrainWithSteps[]>({
    queryKey: ["/api/habit-trains"],
    enabled: !isDemo && !!user,
  });

  // State for expanded habit trains
  const [expandedTrains, setExpandedTrains] = useState<Set<string>>(new Set());

  const toggleTrainExpanded = (trainId: string) => {
    setExpandedTrains(prev => {
      const next = new Set(prev);
      if (next.has(trainId)) {
        next.delete(trainId);
      } else {
        next.add(trainId);
      }
      return next;
    });
  };

  // Calculate train completion status
  const getTrainCompletionStatus = (train: HabitTrainWithSteps) => {
    const taskSteps = train.steps.filter(s => s.stepType === "task" && s.taskId);
    const completedCount = taskSteps.filter(s => completedIds.has(s.taskId!)).length;
    return { total: taskSteps.length, completed: completedCount };
  };
  
  // Check if API queries have completed their initial fetch
  // Also wait for historical season data if needed
  const apiQueriesReady = isDemo || (
    dailyLogFetched && (
      needsHistoricalSeason 
        ? historicalSeasonFetched 
        : (activeSeason ? activeSeasonDataFetched : (tasksFetched && penaltiesFetched))
    )
  );

  // Mutation for saving daily log
  const saveDailyLogMutation = useMutation({
    mutationFn: async (data: { date: string; completedTaskIds: string[]; notes: string; todoPoints: number; penaltyPoints: number; taskPoints: number; seasonId: string | null; taskNotes: Record<string, string>; taskTiers: Record<string, string> }) => {
      const response = await apiRequest("PUT", `/api/habit/logs/${data.date}`, {
        completedTaskIds: data.completedTaskIds,
        notes: data.notes,
        todoPoints: data.todoPoints,
        penaltyPoints: data.penaltyPoints,
        taskPoints: data.taskPoints,
        seasonId: data.seasonId,
        taskNotes: data.taskNotes,
        taskTiers: data.taskTiers,
      });
      return response.json();
    },
    onSuccess: (result, variables) => {
      // Update local state immediately from the returned data
      // This prevents the ref guard from blocking the update after cache invalidation
      if (result && result.completedTaskIds) {
        setCompletedIds(new Set(result.completedTaskIds));
        setSavedCompletedIds(result.completedTaskIds);
      }
      // Invalidate both the list query and the date-specific query
      queryClient.invalidateQueries({ queryKey: ["/api/habit/logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/habit/logs", variables.date] });
    },
  });

  // Mutation for creating journal entry via API
  const createJournalEntryMutation = useMutation({
    mutationFn: async (data: { date: string; title: string; content: string }) => {
      const response = await apiRequest("POST", "/api/habit/journal", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habit/journal"] });
    },
  });

  // Mutation for creating enhanced journal entry (with folder and season support)
  const createEnhancedJournalEntryMutation = useMutation({
    mutationFn: async (data: { date: string; title: string; content: string; folderId?: string; seasonId?: string }) => {
      const response = await apiRequest("POST", "/api/journal/entries", {
        date: data.date,
        title: data.title,
        content: data.content,
        folderId: data.folderId || null,
        seasonId: data.seasonId || null,
        entryType: "journal",
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journal/entries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/habit/journal"] });
    },
  });

  // Load tasks and penalties from API (season or user tasks) or localStorage
  useEffect(() => {
    if (isDemo) {
      setAllTasks(sampleTasks);
      setCompletedIds(new Set(["demo-1", "demo-2", "demo-4", "demo-6", "demo-7", "demo-9", "demo-10"]));
      setTodoItems(sampleDailyTodos);
      setTodoBonusEnabled(true);
      setTodoBonusPoints(15);
      return;
    }

    // Wait for API queries to complete before deciding data source
    if (!apiQueriesReady) {
      return;
    }

    // Priority 1: Use historical season data if viewing an old day with different season
    if (needsHistoricalSeason && historicalSeasonData) {
      const categoryMap = new Map(historicalSeasonData.categories.map((c: any) => [c.id, c.name]));

      const taskItems: DisplayTask[] = historicalSeasonData.tasks.map((task: any) => ({
        id: task.id,
        name: task.name,
        value: task.value,
        category: task.category ? (categoryMap.get(task.category) || task.category) : "Uncategorized",
        isBooster: !!task.boosterRule,
        tiers: task.tiers,
      }));

      const penaltyItems: DisplayTask[] = historicalSeasonData.penalties.map((penalty: any) => ({
        id: penalty.id,
        name: penalty.name,
        value: -Math.abs(penalty.value),
        category: "Penalties",
      }));

      setAllTasks([...taskItems, ...penaltyItems]);
      return;
    }

    // Priority 2: Use active season data for current/new days
    if (activeSeason && activeSeasonData && !needsHistoricalSeason) {
      const categoryMap = new Map(activeSeasonData.categories.map((c: any) => [c.id, c.name]));

      const taskItems: DisplayTask[] = activeSeasonData.tasks.map((task: any) => ({
        id: task.id,
        name: task.name,
        value: task.value,
        category: task.category ? (categoryMap.get(task.category) || task.category) : "Uncategorized",
        isBooster: !!task.boosterRule,
        tiers: task.tiers,
      }));

      const penaltyItems: DisplayTask[] = activeSeasonData.penalties.map((penalty: any) => ({
        id: penalty.id,
        name: penalty.name,
        value: -Math.abs(penalty.value),
        category: "Penalties",
      }));

      setAllTasks([...taskItems, ...penaltyItems]);
      return;
    }

    // No active season - use user tasks/penalties or localStorage
    const hasApiData = (apiTasks && apiTasks.length > 0) || (apiPenalties && apiPenalties.length > 0);
    
    if (hasApiData) {
      const categoryMap = apiCategories ? new Map(apiCategories.map((c: any) => [c.id, c.name])) : new Map();

      const taskItems: DisplayTask[] = (apiTasks || []).map((task: any) => ({
        id: task.id,
        name: task.name,
        value: task.value,
        category: task.category ? (categoryMap.get(task.category) || task.category) : "Uncategorized",
        isBooster: task.boostEnabled,
        tiers: task.tiers,
      }));

      const penaltyItems: DisplayTask[] = (apiPenalties || []).map((penalty: any) => ({
        id: penalty.id,
        name: penalty.name,
        value: -Math.abs(penalty.value),
        category: "Penalties",
      }));

      setAllTasks([...taskItems, ...penaltyItems]);
    } else {
      // Fallback to localStorage
      const storedTasks = loadTasksFromStorage();
      const storedPenalties = loadPenaltiesFromStorage();
      const storedCategories = loadCategoriesFromStorage();

      const categoryMap = new Map(storedCategories.map(c => [c.id, c.name]));

      const taskItems: DisplayTask[] = storedTasks.map((task: StoredTask) => ({
        id: task.id,
        name: task.name,
        value: task.value,
        category: task.category ? (categoryMap.get(task.category) || task.category) : "Uncategorized",
        isBooster: task.boostEnabled,
        tiers: task.tiers,
      }));

      const penaltyItems: DisplayTask[] = storedPenalties.map((penalty: StoredPenalty) => ({
        id: penalty.id,
        name: penalty.name,
        value: -Math.abs(penalty.value),
        category: "Penalties",
      }));

      setAllTasks([...taskItems, ...penaltyItems]);
    }
  }, [isDemo, apiTasks, apiPenalties, apiCategories, apiQueriesReady, activeSeason, activeSeasonData, needsHistoricalSeason, historicalSeasonData]);

  // Reset the loaded log date ref when date changes
  useEffect(() => {
    loadedLogDateRef.current = null;
  }, [dateStr]);

  // Load daily log from API or localStorage when date changes
  useEffect(() => {
    if (isDemo) return;

    // Wait for the daily log query to complete before deciding data source
    if (!dailyLogFetched) {
      return;
    }

    // Only load once per date to prevent race conditions from resetting state
    if (loadedLogDateRef.current === dateStr) {
      return;
    }
    loadedLogDateRef.current = dateStr;

    // If we have API data for this date, use it
    if (apiDailyLog) {
      const savedIds = apiDailyLog.completedTaskIds || [];
      setCompletedIds(new Set(savedIds));
      setSavedCompletedIds(savedIds);
      setNotes(apiDailyLog.notes || "");
      setTaskNotes(apiDailyLog.taskNotes || {});
      setTaskTiers(apiDailyLog.taskTiers || {});
    } else {
      // API returned null (no log for this date) - start fresh
      setCompletedIds(new Set());
      setSavedCompletedIds([]);
      setNotes("");
      setTaskNotes({});
      setTaskTiers({});
    }
  }, [dateStr, isDemo, apiDailyLog, dailyLogFetched]);

  // Load todos from API when date changes
  useEffect(() => {
    if (isDemo) return;
    
    if (apiDailyTodos) {
      setTodoItems(apiDailyTodos.items || []);
      setTodoBonusEnabled(apiDailyTodos.bonusEnabled ?? false);
      setTodoBonusPoints(apiDailyTodos.bonusPoints ?? 10);
      setTodoBonusAwarded(apiDailyTodos.bonusAwarded ?? false);
    } else if (dailyTodosFetched) {
      // API returned null (no todos for this date) - start fresh
      setTodoItems([]);
      setTodoBonusEnabled(false);
      setTodoBonusPoints(10);
      setTodoBonusAwarded(false);
    } else {
      // While fetching, use localStorage as initial state
      const todoList = loadDailyTodoListFromStorage(dateStr);
      if (todoList) {
        setTodoItems(todoList.items);
        setTodoBonusEnabled(todoList.bonusEnabled);
        setTodoBonusPoints(todoList.bonusPoints);
        setTodoBonusAwarded(todoList.bonusAwarded);
      }
    }
  }, [dateStr, isDemo, apiDailyTodos, dailyTodosFetched]);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(allTasks.map(t => t.category)));
    return cats.sort((a, b) => {
      if (a === "Penalties") return 1;
      if (b === "Penalties") return -1;
      return a.localeCompare(b);
    });
  }, [allTasks]);

  const tasksByCategory = useMemo(() => {
    return categories.reduce((acc, cat) => {
      acc[cat] = allTasks.filter(t => t.category === cat);
      return acc;
    }, {} as Record<string, DisplayTask[]>);
  }, [categories, allTasks]);

  // Helper to calculate comprehensive task points including train bonuses
  const calculateTotalPositivePoints = useCallback((idsToCheck: Set<string>) => {
    // Task points + tier bonuses
    const basePoints = allTasks
      .filter(t => idsToCheck.has(t.id) && t.value > 0)
      .reduce((sum, t) => sum + t.value + (taskTiers[t.id] ? (t.tiers?.find(tier => tier.id === taskTiers[t.id])?.bonusPoints || 0) : 0), 0);
    
    // Train bonuses for fully completed trains
    const trainBonuses = habitTrains.reduce((sum, train) => {
      const taskSteps = train.steps.filter(s => s.stepType === "task" && s.taskId);
      const allTasksComplete = taskSteps.length > 0 && taskSteps.every(s => idsToCheck.has(s.taskId!));
      return sum + (allTasksComplete ? (train.bonusPoints || 0) : 0);
    }, 0);
    
    return basePoints + trainBonuses;
  }, [allTasks, taskTiers, habitTrains]);

  const handleTaskToggle = (taskId: string, checked: boolean) => {
    // Update local state immediately for visual feedback
    const newCompletedIds = new Set(completedIds);
    if (checked) {
      newCompletedIds.add(taskId);
    } else {
      newCompletedIds.delete(taskId);
    }
    setCompletedIds(newCompletedIds);
    
    // Store pending state and debounce auto-save
    pendingCompletedIdsRef.current = newCompletedIds;
    
    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Debounce save by 500ms to batch rapid toggles
    if (!isDemo) {
      saveTimeoutRef.current = setTimeout(async () => {
        const idsToSave = pendingCompletedIdsRef.current;
        if (!idsToSave) return;
        
        try {
          // Calculate points with the pending completed set (including train bonuses)
          const newPositivePoints = calculateTotalPositivePoints(idsToSave);
          const newNegativePoints = allTasks
            .filter(t => idsToSave.has(t.id) && t.value < 0)
            .reduce((sum, t) => sum + t.value, 0);
          
          await saveDailyLogMutation.mutateAsync({
            date: dateStr,
            completedTaskIds: Array.from(idsToSave),
            notes: "",
            todoPoints: totalTodoPoints,
            penaltyPoints: Math.abs(newNegativePoints),
            taskPoints: newPositivePoints,
            seasonId: logSeasonId || activeSeason?.id || null,
            taskNotes,
            taskTiers,
          });
          
          // Also save to localStorage as backup
          saveDailyLogToStorage({
            date: dateStr,
            completedTaskIds: Array.from(idsToSave),
            notes: "",
            todoPoints: totalTodoPoints,
            penaltyPoints: Math.abs(newNegativePoints),
            taskNotes,
            taskTiers,
          });
        } catch (e) {
          console.error("Error auto-saving task toggle:", e);
          // Fallback to localStorage - recalculate penalty points
          const fallbackNegativePoints = allTasks
            .filter(t => idsToSave.has(t.id) && t.value < 0)
            .reduce((sum, t) => sum + t.value, 0);
          saveDailyLogToStorage({
            date: dateStr,
            completedTaskIds: Array.from(idsToSave),
            notes: "",
            todoPoints: totalTodoPoints,
            penaltyPoints: Math.abs(fallbackNegativePoints),
            taskNotes,
            taskTiers,
          });
        }
      }, 500);
    }
  };

  const handleTaskNoteChange = (taskId: string, note: string) => {
    setTaskNotes((prev) => {
      const next = { ...prev };
      if (note.trim()) {
        next[taskId] = note;
      } else {
        delete next[taskId];
      }
      return next;
    });
  };

  const handleTierChange = (taskId: string, tierId: string | undefined) => {
    setTaskTiers((prev) => {
      const next = { ...prev };
      if (tierId) {
        next[taskId] = tierId;
      } else {
        delete next[taskId];
      }
      return next;
    });
  };

  // Calculate tier bonus for a task
  const getTierBonus = (task: DisplayTask): number => {
    const selectedTierId = taskTiers[task.id];
    if (!selectedTierId || !task.tiers) return 0;
    const tier = task.tiers.find(t => t.id === selectedTierId);
    return tier?.bonusPoints || 0;
  };

  // Calculate train bonus points for fully completed trains
  const trainBonusPoints = useMemo(() => {
    return habitTrains.reduce((sum, train) => {
      const taskSteps = train.steps.filter(s => s.stepType === "task" && s.taskId);
      const allTasksComplete = taskSteps.length > 0 && taskSteps.every(s => completedIds.has(s.taskId!));
      return sum + (allTasksComplete ? (train.bonusPoints || 0) : 0);
    }, 0);
  }, [habitTrains, completedIds]);

  const positivePoints = allTasks
    .filter(t => completedIds.has(t.id) && t.value > 0)
    .reduce((sum, t) => sum + t.value + getTierBonus(t), 0) + trainBonusPoints;

  const negativePoints = allTasks
    .filter(t => completedIds.has(t.id) && t.value < 0)
    .reduce((sum, t) => sum + t.value, 0);

  const todoCompletedPoints = todoItems
    .filter(item => item.completed)
    .reduce((sum, item) => sum + item.pointValue, 0);

  const allTodosCompleted = todoItems.length > 0 && todoItems.every(item => item.completed);
  const todoBonus = allTodosCompleted && todoBonusEnabled ? todoBonusPoints : 0;
  const totalTodoPoints = todoCompletedPoints + todoBonus;

  const handleTodoItemsChange = async (items: StoredTodoItem[]) => {
    setTodoItems(items);
    if (!isDemo) {
      const allCompleted = items.length > 0 && items.every(item => item.completed);
      const bonusAwarded = allCompleted && todoBonusEnabled;
      try {
        await apiRequest("PUT", `/api/habit/daily-todos/${dateStr}`, {
          items,
          bonusEnabled: todoBonusEnabled,
          bonusPoints: todoBonusPoints,
          bonusAwarded,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/habit/daily-todos", dateStr] });
      } catch (e) { console.error("Error saving daily todos:", e); }
    }
  };

  const handleTodoBonusEnabledChange = async (enabled: boolean) => {
    setTodoBonusEnabled(enabled);
    if (!isDemo) {
      try {
        await apiRequest("PUT", `/api/habit/daily-todos/${dateStr}`, {
          items: todoItems,
          bonusEnabled: enabled,
          bonusPoints: todoBonusPoints,
          bonusAwarded: todoBonusAwarded,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/habit/daily-todos", dateStr] });
      } catch (e) { console.error("Error saving daily todos:", e); }
    }
  };

  const handleTodoBonusPointsChange = async (points: number) => {
    setTodoBonusPoints(points);
    if (!isDemo) {
      try {
        await apiRequest("PUT", `/api/habit/daily-todos/${dateStr}`, {
          items: todoItems,
          bonusEnabled: todoBonusEnabled,
          bonusPoints: points,
          bonusAwarded: todoBonusAwarded,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/habit/daily-todos", dateStr] });
      } catch (e) { console.error("Error saving daily todos:", e); }
    }
  };

  // Get incomplete items from previous day for import
  const previousDayItems: StoredTodoItem[] = (apiPreviousDayTodos?.items || []).filter(
    (item: StoredTodoItem) => !item.completed
  );

  const handleImportFromPreviousDay = async () => {
    if (previousDayItems.length === 0) return;
    
    // Create new items with fresh IDs, copying essential fields from previous day
    const importedItems: StoredTodoItem[] = previousDayItems.map((item: StoredTodoItem, index: number) => ({
      id: `todo-${Date.now()}-${index}`,
      title: item.title,
      pointValue: item.pointValue || 0,
      completed: false,
      order: todoItems.length + index,
      note: item.note,
      penaltyEnabled: item.penaltyEnabled,
      penaltyValue: item.penaltyValue,
    }));
    
    const newItems = [...todoItems, ...importedItems];
    await handleTodoItemsChange(newItems);
    
    // Refetch to ensure persistence
    queryClient.invalidateQueries({ queryKey: ["/api/habit/daily-todos", dateStr] });
    
    toast({
      title: "Items Imported",
      description: `${importedItems.length} incomplete item${importedItems.length > 1 ? "s" : ""} imported from yesterday`,
    });
  };

  const handleSave = async () => {
    if (isDemo) {
      toast({
        title: "Demo Mode",
        description: "Sign in to save your progress",
      });
      return;
    }
    
    setIsSaving(true);
    const now = new Date();
    const hasNotes = notes.trim().length > 0;
    
    // If there are notes, create a journal entry with time-based title
    if (hasNotes) {
      const timeTitle = format(now, "h:mm a") + " Note";
      const journalDate = format(now, "yyyy-MM-dd");
      
      try {
        // Always use enhanced API with season support
        await createEnhancedJournalEntryMutation.mutateAsync({
          date: journalDate,
          title: timeTitle,
          content: notes.trim(),
          folderId: selectedJournalFolderId || undefined,
          seasonId: activeSeason?.id,
        });
      } catch (error) {
        // Fallback to localStorage if API fails
        const newJournalEntry: StoredJournalEntry = {
          id: `entry-${Date.now()}`,
          date: journalDate,
          title: timeTitle,
          content: notes.trim(),
          createdAt: now.toISOString(),
        };
        const existingEntries = loadJournalFromStorage();
        saveJournalToStorage([newJournalEntry, ...existingEntries]);
      }
    }
    
    try {
      // Compute task points (positive points only) to freeze at save time
      const computedTaskPoints = positivePoints;
      
      // Save via API (include taskPoints and seasonId for frozen point calculations)
      await saveDailyLogMutation.mutateAsync({
        date: dateStr,
        completedTaskIds: Array.from(completedIds),
        notes: "", // Clear notes from daily log since it's saved to journal
        todoPoints: totalTodoPoints,
        penaltyPoints: Math.abs(negativePoints),
        taskPoints: computedTaskPoints,
        seasonId: logSeasonId || activeSeason?.id || null,
        taskNotes,
        taskTiers,
      });

      // Also save to localStorage as backup (include todoPoints and penaltyPoints)
      saveDailyLogToStorage({
        date: dateStr,
        completedTaskIds: Array.from(completedIds),
        notes: "",
        todoPoints: totalTodoPoints,
        penaltyPoints: Math.abs(negativePoints),
        taskNotes,
        taskTiers,
      });

      // Update badge progress for completed tasks (only count the difference)
      const currentCompletedArray = Array.from(completedIds);
      const tasksForBadges = allTasks.map(t => ({ id: t.id, name: t.name }));
      updateBadgeProgressForTasks(currentCompletedArray, savedCompletedIds, tasksForBadges);
      
      // Update saved state to match what was just saved
      setSavedCompletedIds(currentCompletedArray);

      // Reset the notes field for next entry
      setNotes("");

      toast({
        title: "Day saved",
        description: hasNotes 
          ? `Logged ${completedIds.size} tasks and added journal entry`
          : `Logged ${completedIds.size} tasks for ${format(date, "MMM d, yyyy")}`,
      });
      triggerDaySaved();
    } catch (error) {
      // Fallback to localStorage only (include todoPoints and penaltyPoints)
      saveDailyLogToStorage({
        date: dateStr,
        completedTaskIds: Array.from(completedIds),
        notes: "",
        todoPoints: totalTodoPoints,
        penaltyPoints: Math.abs(negativePoints),
        taskNotes,
        taskTiers,
      });
      setNotes("");
      toast({
        title: "Saved locally",
        description: "Data saved to this device. Sign in to sync across devices.",
      });
      triggerDaySaved();
    } finally {
      setIsSaving(false);
    }
  };

  // Show empty state if no tasks
  if (allTasks.length === 0) {
    return (
      <div className="p-4 md:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="flex items-center gap-2">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight" data-testid="heading-daily-log">Daily Log</h2>
              <p className="text-muted-foreground text-sm">Track your tasks for the day</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setHelpDialogOpen(true)} data-testid="button-daily-help">
              <HelpCircle className="h-5 w-5" />
            </Button>
          </div>
          <DatePicker date={date} onDateChange={setDate} />
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground mb-2" data-testid="text-no-tasks">No tasks or penalties found</p>
          <p className="text-sm text-muted-foreground">
            Go to the Tasks page to add tasks and penalties to track.
          </p>
        </div>
        <HelpDialog open={helpDialogOpen} onOpenChange={setHelpDialogOpen} filterCards={[3]} currentPage="daily" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex items-center gap-2">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight" data-testid="heading-daily-log">Daily Log</h2>
            <p className="text-muted-foreground text-sm">Track your tasks for the day</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setHelpDialogOpen(true)} data-testid="button-daily-help">
            <HelpCircle className="h-5 w-5" />
          </Button>
        </div>
        <DatePicker date={date} onDateChange={setDate} />
      </div>
      <HelpDialog open={helpDialogOpen} onOpenChange={setHelpDialogOpen} filterCards={[3]} currentPage="daily" />

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          <ScheduleCard date={date} isDemo={isDemo} />
          
          <TodoListPanel
            title="Today's To-Do List"
            prompt="Add tasks that aren't recurring habits but still matter today. Think: &quot;Call Debby,&quot; &quot;Order new headphones,&quot; &quot;Schedule dentist,&quot; or &quot;Hit the farmer's market.&quot;"
            items={todoItems}
            onItemsChange={handleTodoItemsChange}
            bonusEnabled={todoBonusEnabled}
            onBonusEnabledChange={handleTodoBonusEnabledChange}
            bonusPoints={todoBonusPoints}
            onBonusPointsChange={handleTodoBonusPointsChange}
            bonusAwarded={todoBonusAwarded}
            previousItems={previousDayItems}
            onImportFromPrevious={handleImportFromPreviousDay}
            importLabel="Import from yesterday"
            data-testid="panel-daily-todos"
          />

          {/* Habit Trains Section */}
          {!isDemo && habitTrains.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Train className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-medium">Habit Trains</h3>
                </div>
                <div className="space-y-3">
                  {habitTrains.map((train) => {
                    const isExpanded = expandedTrains.has(train.id);
                    const { total, completed } = getTrainCompletionStatus(train);
                    const isComplete = total > 0 && completed === total;
                    const taskPoints = train.steps
                      .filter(s => s.stepType === "task" && s.taskId && completedIds.has(s.taskId))
                      .reduce((sum, s) => {
                        const task = allTasks.find(t => t.id === s.taskId);
                        return sum + (task?.value || 0);
                      }, 0);
                    const totalPossiblePoints = train.steps
                      .filter(s => s.stepType === "task" && s.task)
                      .reduce((sum, s) => sum + (s.task?.value || 0), 0) + (train.bonusPoints || 0);

                    return (
                      <div 
                        key={train.id} 
                        className={cn(
                          "border rounded-lg transition-colors",
                          isComplete && "border-chart-1/50 bg-chart-1/5"
                        )}
                        data-testid={`daily-train-${train.id}`}
                      >
                        <button
                          onClick={() => toggleTrainExpanded(train.id)}
                          className="w-full flex items-center justify-between gap-2 p-3 hover-elevate rounded-lg text-left"
                          data-testid={`button-toggle-daily-train-${train.id}`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {isComplete ? (
                              <Check className="h-4 w-4 text-chart-1 flex-shrink-0" />
                            ) : (
                              <Train className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            )}
                            <span className={cn("font-medium truncate", isComplete && "text-chart-1")}>{train.name}</span>
                            <Badge variant={isComplete ? "default" : "secondary"} className="text-xs">
                              {completed}/{total}
                            </Badge>
                            {(train.bonusPoints ?? 0) > 0 && (
                              <Badge 
                                variant="outline" 
                                className={cn("text-xs", isComplete ? "text-chart-1 border-chart-1/50" : "")}
                              >
                                <Sparkles className="h-3 w-3 mr-1" />
                                +{train.bonusPoints}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "text-sm font-mono",
                              taskPoints > 0 ? "text-chart-1" : "text-muted-foreground"
                            )}>
                              {taskPoints}/{totalPossiblePoints} pts
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="px-3 pb-3 border-t">
                            {train.description && (
                              <p className="text-xs text-muted-foreground mt-2 mb-3">{train.description}</p>
                            )}
                            <div className="space-y-1">
                              {train.steps.map((step, idx) => (
                                <div key={step.id}>
                                  {step.stepType === "note" ? (
                                    <div className="flex items-center gap-2 py-2 pl-2 text-muted-foreground italic">
                                      <FileText className="h-3 w-3 flex-shrink-0" />
                                      <span className="text-xs">{step.noteText}</span>
                                    </div>
                                  ) : step.taskId && step.task ? (
                                    <TaskCheckbox
                                      id={step.taskId}
                                      name={step.task.name}
                                      value={step.task.value}
                                      checked={completedIds.has(step.taskId)}
                                      onChange={(checked) => handleTaskToggle(step.taskId!, checked)}
                                      note={taskNotes?.[step.taskId]}
                                      onNoteChange={(note) => handleTaskNoteChange(step.taskId!, note)}
                                    />
                                  ) : null}
                                </div>
                              ))}
                            </div>
                            {isComplete && (train.bonusPoints ?? 0) > 0 && (
                              <div className="mt-3 pt-2 border-t flex items-center gap-2 text-chart-1">
                                <Sparkles className="h-4 w-4" />
                                <span className="text-sm font-medium">Train complete! +{train.bonusPoints} bonus points</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Horizontal Category Tabs */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-2 mb-4" data-testid="category-tabs">
                {categories.map((category) => {
                  const categoryTasks = tasksByCategory[category] || [];
                  const completedCount = categoryTasks.filter(t => completedIds.has(t.id)).length;
                  const categoryPoints = categoryTasks
                    .filter(t => completedIds.has(t.id))
                    .reduce((sum, t) => sum + t.value, 0);
                  const isSelected = selectedCategory === category;
                  
                  return (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(isSelected ? null : category)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors hover-elevate active-elevate-2",
                        isSelected 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-muted text-muted-foreground"
                      )}
                      data-testid={`category-tab-${category.toLowerCase().replace(/\s/g, "-")}`}
                    >
                      <span>{category}</span>
                      <Badge 
                        variant={isSelected ? "secondary" : "outline"} 
                        className="text-xs"
                      >
                        {completedCount}/{categoryTasks.length}
                      </Badge>
                      {categoryPoints !== 0 && (
                        <span
                          className={cn(
                            "font-mono text-xs font-semibold",
                            categoryPoints > 0 ? "text-chart-1" : "text-chart-3"
                          )}
                        >
                          {categoryPoints > 0 ? `+${categoryPoints}` : categoryPoints}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              
              {/* Tasks for Selected Category */}
              {selectedCategory && tasksByCategory[selectedCategory] && (
                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium mb-3">{selectedCategory} Tasks</h3>
                  <div className="space-y-1">
                    {tasksByCategory[selectedCategory].map((task) => (
                      <TaskCheckbox
                        key={task.id}
                        id={task.id}
                        name={task.name}
                        value={task.value}
                        isBooster={task.isBooster}
                        checked={completedIds.has(task.id)}
                        onChange={(checked) => handleTaskToggle(task.id, checked)}
                        note={taskNotes?.[task.id]}
                        onNoteChange={(note) => handleTaskNoteChange(task.id, note)}
                        tiers={task.tiers}
                        selectedTierId={taskTiers[task.id]}
                        onTierChange={(tierId) => handleTierChange(task.id, tierId)}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {!selectedCategory && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Click a category above to view and complete tasks
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="order-first lg:order-last">
          <DailySummary
            positivePoints={positivePoints}
            negativePoints={negativePoints}
            todoPoints={totalTodoPoints}
            checkInBonus={apiDailyLog?.checkInBonusAwarded ? 3 : 0}
            completedTasks={allTasks.filter(t => completedIds.has(t.id)).map(t => ({ id: t.id, name: t.name, value: t.value }))}
            notes={notes}
            onNotesChange={setNotes}
            onSave={handleSave}
            isSaving={isSaving}
            folders={journalFolders.map(f => ({ id: f.id, name: f.name, color: f.color || "#6366f1" }))}
            selectedFolderId={selectedJournalFolderId}
            onFolderChange={setSelectedJournalFolderId}
          />
        </div>
      </div>
    </div>
  );
}
