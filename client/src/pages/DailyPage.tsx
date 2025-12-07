import { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import DatePicker from "@/components/DatePicker";
import TaskGroup from "@/components/TaskGroup";
import DailySummary from "@/components/DailySummary";
import TodoListPanel from "@/components/TodoListPanel";
import { useToast } from "@/hooks/use-toast";
import { useDemo } from "@/contexts/DemoContext";
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
  type StoredDailyTodoList,
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

  // Load tasks and penalties from localStorage on mount
  useEffect(() => {
    if (isDemo) {
      setAllTasks(sampleTasks);
      setCompletedIds(new Set(["demo-1", "demo-2", "demo-4", "demo-6", "demo-7", "demo-9", "demo-10"]));
      setTodoItems(sampleDailyTodos);
      setTodoBonusEnabled(true);
      setTodoBonusPoints(15);
      return;
    }
    
    const storedTasks = loadTasksFromStorage();
    const storedPenalties = loadPenaltiesFromStorage();
    const storedCategories = loadCategoriesFromStorage();

    // Create a map of category IDs to names
    const categoryMap = new Map(storedCategories.map(c => [c.id, c.name]));

    // Convert tasks to display format
    const taskItems: DisplayTask[] = storedTasks.map((task: StoredTask) => ({
      id: task.id,
      name: task.name,
      value: task.value,
      category: task.category ? (categoryMap.get(task.category) || task.category) : "Uncategorized",
      isBooster: task.boostEnabled,
    }));

    // Convert penalties to display format (always in Penalties category)
    const penaltyItems: DisplayTask[] = storedPenalties.map((penalty: StoredPenalty) => ({
      id: penalty.id,
      name: penalty.name,
      value: -Math.abs(penalty.value), // Ensure negative
      category: "Penalties",
    }));

    setAllTasks([...taskItems, ...penaltyItems]);
  }, [isDemo]);

  // Load daily log and todos when date changes
  useEffect(() => {
    if (isDemo) return;
    
    const dateStr = format(date, "yyyy-MM-dd");
    const log = loadDailyLogFromStorage(dateStr);
    if (log) {
      setCompletedIds(new Set(log.completedTaskIds));
      setNotes(log.notes);
    } else {
      setCompletedIds(new Set());
      setNotes("");
    }

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
  }, [date, isDemo]);

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
      const dateStr = format(date, "yyyy-MM-dd");
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
      const dateStr = format(date, "yyyy-MM-dd");
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
      const dateStr = format(date, "yyyy-MM-dd");
      saveDailyTodoListToStorage({
        date: dateStr,
        items: todoItems,
        bonusEnabled: todoBonusEnabled,
        bonusPoints: points,
        bonusAwarded: todoBonusAwarded,
      });
    }
  };

  const handleSave = () => {
    if (isDemo) {
      toast({
        title: "Demo Mode",
        description: "Sign in to save your progress",
      });
      return;
    }
    
    setIsSaving(true);
    const dateStr = format(date, "yyyy-MM-dd");
    const now = new Date();
    
    // If there are notes, create a journal entry with time-based title
    if (notes.trim()) {
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
    
    // Save the daily log (without notes since it's now in journal)
    saveDailyLogToStorage({
      date: dateStr,
      completedTaskIds: Array.from(completedIds),
      notes: "", // Clear notes from daily log since it's saved to journal
    });

    // Reset the notes field for next entry
    setNotes("");

    setTimeout(() => {
      setIsSaving(false);
      const hasNotes = notes.trim().length > 0;
      toast({
        title: "Day saved",
        description: hasNotes 
          ? `Logged ${completedIds.size} tasks and added journal entry`
          : `Logged ${completedIds.size} tasks for ${format(date, "MMM d, yyyy")}`,
      });
    }, 300);
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
            items={todoItems}
            onItemsChange={handleTodoItemsChange}
            bonusEnabled={todoBonusEnabled}
            onBonusEnabledChange={handleTodoBonusEnabledChange}
            bonusPoints={todoBonusPoints}
            onBonusPointsChange={handleTodoBonusPointsChange}
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
