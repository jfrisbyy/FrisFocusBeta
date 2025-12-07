import { useState, useMemo } from "react";
import { format } from "date-fns";
import DatePicker from "@/components/DatePicker";
import TaskGroup from "@/components/TaskGroup";
import DailySummary from "@/components/DailySummary";
import { useToast } from "@/hooks/use-toast";

// todo: remove mock functionality
const mockTasks = [
  { id: "1", name: "Morning workout", value: 15, category: "Health", isBooster: true },
  { id: "2", name: "Evening walk", value: 5, category: "Health" },
  { id: "3", name: "Gym session", value: 20, category: "Health", isBooster: true },
  { id: "4", name: "Read 30 minutes", value: 10, category: "Productivity" },
  { id: "5", name: "Complete work tasks", value: 15, category: "Productivity" },
  { id: "6", name: "Learn something new", value: 10, category: "Productivity" },
  { id: "7", name: "Bible study", value: 15, category: "Spiritual", isBooster: true },
  { id: "8", name: "Prayer time", value: 10, category: "Spiritual" },
  { id: "9", name: "Connect with friend", value: 5, category: "Social" },
  { id: "10", name: "Ate junk food", value: -10, category: "Penalties" },
  { id: "11", name: "Skipped workout", value: -15, category: "Penalties" },
  { id: "12", name: "Wasted time on social media", value: -10, category: "Penalties" },
];

export default function DailyPage() {
  const { toast } = useToast();
  const [date, setDate] = useState(new Date());
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set(["1", "4", "7"]));
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(mockTasks.map(t => t.category)));
    return cats.sort((a, b) => {
      if (a === "Penalties") return 1;
      if (b === "Penalties") return -1;
      return a.localeCompare(b);
    });
  }, []);

  const tasksByCategory = useMemo(() => {
    return categories.reduce((acc, cat) => {
      acc[cat] = mockTasks.filter(t => t.category === cat);
      return acc;
    }, {} as Record<string, typeof mockTasks>);
  }, [categories]);

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

  const positivePoints = mockTasks
    .filter(t => completedIds.has(t.id) && t.value > 0)
    .reduce((sum, t) => sum + t.value, 0);

  const negativePoints = mockTasks
    .filter(t => completedIds.has(t.id) && t.value < 0)
    .reduce((sum, t) => sum + t.value, 0);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast({
        title: "Day saved",
        description: `Logged ${completedIds.size} tasks for ${format(date, "MMM d, yyyy")}`,
      });
      console.log("Saved day:", {
        date: format(date, "yyyy-MM-dd"),
        completedTaskIds: Array.from(completedIds),
        notes,
        dailyPoints: positivePoints + negativePoints,
      });
    }, 500);
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Daily Log</h2>
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
