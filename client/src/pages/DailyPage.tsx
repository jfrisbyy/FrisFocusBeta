import { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { useQuery, useMutation } from "@tanstack/react-query";
import DatePicker from "@/components/DatePicker";
import TaskGroup from "@/components/TaskGroup";
import DailySummary from "@/components/DailySummary";
import TodoListPanel from "@/components/TodoListPanel";
import { useToast } from "@/hooks/use-toast";
import { useDemo } from "@/contexts/DemoContext";
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

  const dateStr = format(date, "yyyy-MM-dd");

  // API queries for tasks, penalties, categories
  const { data: apiTasks } = useQuery<any[]>({
    queryKey: ["/api/habit/tasks"],
    enabled: !isDemo,
  });

  const { data: apiPenalties } = useQuery<any[]>({
    queryKey: ["/api/habit/penalties"],
    enabled: !isDemo,
  });

  const { data: apiCategories } = useQuery<any[]>({
    queryKey: ["/api/habit/categories"],
    enabled: !isDemo,
  });

  // API query for daily log of selected date
  const { data: apiDailyLog, refetch: refetchDailyLog } = useQuery<any>({
    queryKey: ["/api/habit/logs", dateStr],
    enabled: !isDemo,
  });

  // Mutation for saving daily log
  const saveDailyLogMutation = useMutation({
    mutationFn: async (data: { date: string; completedTaskIds: string[]; notes: string }) => {
      const response = await apiRequest("PUT", `/api/habit/logs/${data.date}`, {
        completedTaskIds: data.completedTaskIds,
        notes: data.notes,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habit/logs"] });
    },
  });

  // Load tasks and penalties from API or localStorage
  useEffect(() => {
    if (isDemo) {
      setAllTasks(sampleTasks);
      setCompletedIds(new Set(["demo-1", "demo-2", "demo-4", "demo-6", "demo-7", "demo-9", "demo-10"]));
      setTodoItems(sampleDailyTodos);
      setTodoBonusEnabled(true);
      setTodoBonusPoints(15);
      return;
    }

    // If we have API data with actual tasks, use it; otherwise fall back to localStorage
    const hasApiTasks = apiTasks && apiTasks.length > 0;
    const hasApiPenalties = apiPenalties && apiPenalties.length > 0;
    
    if (hasApiTasks || hasApiPenalties) {
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
  }, [isDemo, apiTasks, apiPenalties, apiCategories]);

  // Load daily log from API or localStorage when date changes
  useEffect(() => {
    if (isDemo) return;

    // If we have API data for this date, use it
    if (apiDailyLog) {
      setCompletedIds(new Set(apiDailyLog.completedTaskIds || []));
      setNotes(apiDailyLog.notes || "");
    } else {
      // Fallback to localStorage
      const log = loadDailyLogFromStorage(dateStr);
      if (log) {
        setCompletedIds(new Set(log.completedTaskIds));
        setNotes(log.notes);
      } else {
        setCompletedIds(new Set());
        setNotes("");
      }
    }
  }, [dateStr, isDemo, apiDailyLog]);

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
    
    // If there are notes, create a journal entry with time-based title (still localStorage for now)
    if (hasNotes) {
      const timeTitle = format(now, "h:mm a") + " Note";
      const newJournalEntry: StoredJournalEntry = {
        id: `entry-${Date.now()}`,
        date: format(now, "yyyy-MM-dd"),
        title: timeTitle,
        content: notes.trim(),
        createdAt: now.toISOString(),
      };
      
      const existingEntries = loadJournalFromStorage();
      saveJournalToStorage([newJournalEntry, ...existingEntries]);
    }
    
    try {
      // Save via API
      await saveDailyLogMutation.mutateAsync({
        date: dateStr,
        completedTaskIds: Array.from(completedIds),
        notes: "", // Clear notes from daily log since it's saved to journal
      });

      // Also save to localStorage as backup
      saveDailyLogToStorage({
        date: dateStr,
        completedTaskIds: Array.from(completedIds),
        notes: "",
      });

      // Reset the notes field for next entry
      setNotes("");

      toast({
        title: "Day saved",
        description: hasNotes 
          ? `Logged ${completedIds.size} tasks and added journal entry`
          : `Logged ${completedIds.size} tasks for ${format(date, "MMM d, yyyy")}`,
      });
    } catch (error) {
      // Fallback to localStorage only
      saveDailyLogToStorage({
        date: dateStr,
        completedTaskIds: Array.from(completedIds),
        notes: "",
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
            prompt="Add a task for today"
            items={todoItems}
            onItemsChange={handleTodoItemsChange}
            bonusEnabled={todoBonusEnabled}
            onBonusEnabledChange={handleTodoBonusEnabledChange}
            bonusPoints={todoBonusPoints}
            onBonusPointsChange={handleTodoBonusPointsChange}
            bonusAwarded={todoBonusAwarded}
            data-testid="panel-daily-todos"
          />
          {categories.map((category) => (
            <TaskGroup
              key={category}
              category={category}
              tasks={tasksByCategory[category]}
              completedIds={completedIds}
              onTaskToggle={handleTaskToggle}
              defaultOpen={category !== "Penalties"}
            />
          ))}
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
