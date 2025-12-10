import { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { useQuery, useMutation } from "@tanstack/react-query";
import DatePicker from "@/components/DatePicker";
import TaskCheckbox from "@/components/TaskCheckbox";
import DailySummary from "@/components/DailySummary";
import TodoListPanel from "@/components/TodoListPanel";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useDemo } from "@/contexts/DemoContext";
import { cn } from "@/lib/utils";
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
} from "@/lib/storage";

interface DisplayTask {
  id: string;
  name: string;
  value: number;
  category: string;
  isBooster?: boolean;
}

const sampleTasks: DisplayTask[] = [
  { id: "demo-1", name: "Morning Meditation", value: 10, category: "Mindfulness" },
  { id: "demo-2", name: "Reading (30 min)", value: 15, category: "Personal Growth", isBooster: true },
  { id: "demo-3", name: "Journal Entry", value: 10, category: "Mindfulness" },
  { id: "demo-4", name: "Workout", value: 20, category: "Health" },
  { id: "demo-5", name: "Meal Prep", value: 10, category: "Health" },
  { id: "demo-6", name: "8 Hours Sleep", value: 15, category: "Health" },
  { id: "demo-7", name: "Deep Work Session", value: 25, category: "Productivity" },
  { id: "demo-8", name: "Project Progress", value: 20, category: "Productivity" },
  { id: "demo-9", name: "Learn Something New", value: 15, category: "Personal Growth" },
  { id: "demo-10", name: "Hydration Goal", value: 10, category: "Health" },
  { id: "demo-11", name: "Skipped workout", value: -15, category: "Penalties" },
  { id: "demo-12", name: "Junk food", value: -10, category: "Penalties" },
  { id: "demo-13", name: "Missed sleep goal", value: -10, category: "Penalties" },
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
  const [date, setDate] = useState(new Date());
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [allTasks, setAllTasks] = useState<DisplayTask[]>([]);
  const [todoItems, setTodoItems] = useState<StoredTodoItem[]>([]);
  const [todoBonusEnabled, setTodoBonusEnabled] = useState(false);
  const [todoBonusPoints, setTodoBonusPoints] = useState(10);
  const [todoBonusAwarded, setTodoBonusAwarded] = useState(false);
  const [taskNotes, setTaskNotes] = useState<Record<string, string>>({});
  const [savedCompletedIds, setSavedCompletedIds] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

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
  
  // Check if API queries have completed their initial fetch
  const apiQueriesReady = isDemo || (activeSeason ? activeSeasonDataFetched : (tasksFetched && penaltiesFetched));

  // Mutation for saving daily log
  const saveDailyLogMutation = useMutation({
    mutationFn: async (data: { date: string; completedTaskIds: string[]; notes: string; todoPoints: number; penaltyPoints: number; taskPoints: number; seasonId: string | null; taskNotes: Record<string, string> }) => {
      const response = await apiRequest("PUT", `/api/habit/logs/${data.date}`, {
        completedTaskIds: data.completedTaskIds,
        notes: data.notes,
        todoPoints: data.todoPoints,
        penaltyPoints: data.penaltyPoints,
        taskPoints: data.taskPoints,
        seasonId: data.seasonId,
        taskNotes: data.taskNotes,
      });
      return response.json();
    },
    onSuccess: (_, variables) => {
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

    // If there's an active season, use its data
    if (activeSeason && activeSeasonData) {
      const categoryMap = new Map(activeSeasonData.categories.map((c: any) => [c.id, c.name]));

      const taskItems: DisplayTask[] = activeSeasonData.tasks.map((task: any) => ({
        id: task.id,
        name: task.name,
        value: task.value,
        category: task.category ? (categoryMap.get(task.category) || task.category) : "Uncategorized",
        isBooster: !!task.boosterRule,
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
      }));

      const penaltyItems: DisplayTask[] = storedPenalties.map((penalty: StoredPenalty) => ({
        id: penalty.id,
        name: penalty.name,
        value: -Math.abs(penalty.value),
        category: "Penalties",
      }));

      setAllTasks([...taskItems, ...penaltyItems]);
    }
  }, [isDemo, apiTasks, apiPenalties, apiCategories, apiQueriesReady, activeSeason, activeSeasonData]);

  // Load daily log from API or localStorage when date changes
  useEffect(() => {
    if (isDemo) return;

    // Wait for the daily log query to complete before deciding data source
    if (!dailyLogFetched) {
      return;
    }

    // If we have API data for this date, use it
    if (apiDailyLog) {
      const savedIds = apiDailyLog.completedTaskIds || [];
      setCompletedIds(new Set(savedIds));
      setSavedCompletedIds(savedIds);
      setNotes(apiDailyLog.notes || "");
      setTaskNotes(apiDailyLog.taskNotes || {});
    } else {
      // API returned null (no log for this date) - start fresh
      setCompletedIds(new Set());
      setSavedCompletedIds([]);
      setNotes("");
      setTaskNotes({});
    }
  }, [dateStr, isDemo, apiDailyLog, dailyLogFetched]);

  // Load todos from localStorage when date changes (todos not in API yet)
  useEffect(() => {
    if (isDemo) return;
    
    const todoList = loadDailyTodoListFromStorage(dateStr);
    if (todoList) {
      setTodoItems(todoList.items);
      setTodoBonusEnabled(todoList.bonusEnabled);
      setTodoBonusPoints(todoList.bonusPoints);
      setTodoBonusAwarded(todoList.bonusAwarded);
    } else {
      setTodoItems([]);
      setTodoBonusEnabled(false);
      setTodoBonusPoints(10);
      setTodoBonusAwarded(false);
    }
  }, [dateStr, isDemo]);

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

  const handleTaskToggle = (taskId: string, checked: boolean) => {
    setCompletedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(taskId);
      } else {
        next.delete(taskId);
      }
      return next;
    });
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

  const positivePoints = allTasks
    .filter(t => completedIds.has(t.id) && t.value > 0)
    .reduce((sum, t) => sum + t.value, 0);

  const negativePoints = allTasks
    .filter(t => completedIds.has(t.id) && t.value < 0)
    .reduce((sum, t) => sum + t.value, 0);

  const todoCompletedPoints = todoItems
    .filter(item => item.completed)
    .reduce((sum, item) => sum + item.pointValue, 0);

  const allTodosCompleted = todoItems.length > 0 && todoItems.every(item => item.completed);
  const todoBonus = allTodosCompleted && todoBonusEnabled ? todoBonusPoints : 0;
  const totalTodoPoints = todoCompletedPoints + todoBonus;

  const handleTodoItemsChange = (items: StoredTodoItem[]) => {
    setTodoItems(items);
    if (!isDemo) {
      const allCompleted = items.length > 0 && items.every(item => item.completed);
      const bonusAwarded = allCompleted && todoBonusEnabled;
      saveDailyTodoListToStorage({
        date: dateStr,
        items,
        bonusEnabled: todoBonusEnabled,
        bonusPoints: todoBonusPoints,
        bonusAwarded,
      });
    }
  };

  const handleTodoBonusEnabledChange = (enabled: boolean) => {
    setTodoBonusEnabled(enabled);
    if (!isDemo) {
      saveDailyTodoListToStorage({
        date: dateStr,
        items: todoItems,
        bonusEnabled: enabled,
        bonusPoints: todoBonusPoints,
        bonusAwarded: todoBonusAwarded,
      });
    }
  };

  const handleTodoBonusPointsChange = (points: number) => {
    setTodoBonusPoints(points);
    if (!isDemo) {
      saveDailyTodoListToStorage({
        date: dateStr,
        items: todoItems,
        bonusEnabled: todoBonusEnabled,
        bonusPoints: points,
        bonusAwarded: todoBonusAwarded,
      });
    }
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
        // Save via API for authenticated users
        await createJournalEntryMutation.mutateAsync({
          date: journalDate,
          title: timeTitle,
          content: notes.trim(),
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
        seasonId: activeSeason?.id || null,
        taskNotes,
      });

      // Also save to localStorage as backup (include todoPoints and penaltyPoints)
      saveDailyLogToStorage({
        date: dateStr,
        completedTaskIds: Array.from(completedIds),
        notes: "",
        todoPoints: totalTodoPoints,
        penaltyPoints: Math.abs(negativePoints),
        taskNotes,
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
    } catch (error) {
      // Fallback to localStorage only (include todoPoints and penaltyPoints)
      saveDailyLogToStorage({
        date: dateStr,
        completedTaskIds: Array.from(completedIds),
        notes: "",
        todoPoints: totalTodoPoints,
        penaltyPoints: Math.abs(negativePoints),
        taskNotes,
      });
      setNotes("");
      toast({
        title: "Saved locally",
        description: "Data saved to this device. Sign in to sync across devices.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Show empty state if no tasks
  if (allTasks.length === 0) {
    return (
      <div className="p-4 md:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight" data-testid="heading-daily-log">Daily Log</h2>
            <p className="text-muted-foreground text-sm">Track your tasks for the day</p>
          </div>
          <DatePicker date={date} onDateChange={setDate} />
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground mb-2" data-testid="text-no-tasks">No tasks or penalties found</p>
          <p className="text-sm text-muted-foreground">
            Go to the Tasks page to add tasks and penalties to track.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight" data-testid="heading-daily-log">Daily Log</h2>
          <p className="text-muted-foreground text-sm">Track your tasks for the day</p>
        </div>
        <DatePicker date={date} onDateChange={setDate} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4">
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
            data-testid="panel-daily-todos"
          />
          
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
            notes={notes}
            onNotesChange={setNotes}
            onSave={handleSave}
            isSaving={isSaving}
          />
        </div>
      </div>
    </div>
  );
}
