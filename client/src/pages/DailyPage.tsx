import { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import DatePicker from "@/components/DatePicker";
import TaskGroup from "@/components/TaskGroup";
import DailySummary from "@/components/DailySummary";
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
  type StoredTask,
  type StoredPenalty,
  type StoredJournalEntry,
} from "@/lib/storage";

interface DisplayTask {
  id: string;
  name: string;
  value: number;
  category: string;
  isBooster?: boolean;
}

const sampleTasks: DisplayTask[] = [
  { id: "demo-1", name: "Morning Prayer", value: 10, category: "Spiritual" },
  { id: "demo-2", name: "Bible Reading", value: 15, category: "Spiritual", isBooster: true },
  { id: "demo-3", name: "Scripture Memory", value: 10, category: "Spiritual" },
  { id: "demo-4", name: "Workout", value: 20, category: "Health" },
  { id: "demo-5", name: "Meal Prep", value: 10, category: "Health" },
  { id: "demo-6", name: "8 Hours Sleep", value: 15, category: "Health" },
  { id: "demo-7", name: "Deep Work Session", value: 25, category: "Productivity" },
  { id: "demo-8", name: "Project Progress", value: 20, category: "Productivity" },
  { id: "demo-9", name: "Skipped workout", value: -15, category: "Penalties" },
  { id: "demo-10", name: "Missed devotions", value: -10, category: "Penalties" },
];

export default function DailyPage() {
  const { toast } = useToast();
  const { isDemo } = useDemo();
  const [date, setDate] = useState(new Date());
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [allTasks, setAllTasks] = useState<DisplayTask[]>([]);

  // Load tasks and penalties from localStorage on mount
  useEffect(() => {
    if (isDemo) {
      setAllTasks(sampleTasks);
      setCompletedIds(new Set(["demo-1", "demo-2", "demo-4", "demo-7"]));
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

  // Load daily log when date changes
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
