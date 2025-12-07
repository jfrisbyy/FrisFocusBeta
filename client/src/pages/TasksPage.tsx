import { useState } from "react";
import TaskList from "@/components/TaskList";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Target, Pencil, Check, X } from "lucide-react";
import type { BoosterRule } from "@/components/BoosterRuleConfig";
import type { TaskPriority, PenaltyRule } from "@shared/schema";

interface Task {
  id: string;
  name: string;
  value: number;
  category: string;
  priority: TaskPriority;
  group?: string;
  boosterRule?: BoosterRule;
  penaltyRule?: PenaltyRule;
}

// todo: remove mock functionality
const initialTasks: Task[] = [
  { id: "1", name: "Morning workout", value: 15, category: "Health", priority: "shouldDo", boosterRule: { enabled: true, timesRequired: 5, period: "week", bonusPoints: 15 } },
  { id: "2", name: "Evening walk", value: 5, category: "Health", priority: "couldDo" },
  { id: "3", name: "Gym session", value: 20, category: "Health", priority: "mustDo", boosterRule: { enabled: true, timesRequired: 3, period: "week", bonusPoints: 10 }, penaltyRule: { enabled: true, timesThreshold: 1, penaltyPoints: 20, condition: "lessThan" } },
  { id: "4", name: "Read 30 minutes", value: 10, category: "Productivity", priority: "shouldDo", boosterRule: { enabled: true, timesRequired: 4, period: "week", bonusPoints: 20 } },
  { id: "5", name: "Complete work tasks", value: 15, category: "Productivity", priority: "mustDo" },
  { id: "6", name: "Learn something new", value: 10, category: "Productivity", priority: "couldDo" },
  { id: "7", name: "Bible study", value: 15, category: "Spiritual", priority: "mustDo", boosterRule: { enabled: true, timesRequired: 7, period: "week", bonusPoints: 25 }, penaltyRule: { enabled: true, timesThreshold: 2, penaltyPoints: 10, condition: "lessThan" } },
  { id: "8", name: "Prayer time", value: 10, category: "Spiritual", priority: "shouldDo" },
  { id: "9", name: "Connect with friend", value: 5, category: "Social", priority: "couldDo" },
];

export default function TasksPage() {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  // todo: remove mock functionality - daily goal will come from backend
  const [dailyGoal, setDailyGoal] = useState(50);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState("");

  const handleAdd = (task: Omit<Task, "id">) => {
    const id = String(Date.now());
    setTasks([...tasks, { ...task, id }]);
    toast({
      title: "Task added",
      description: `"${task.name}" has been added as ${task.priority.replace(/([A-Z])/g, " $1").toLowerCase()}`,
    });
  };

  const handleEdit = (id: string, task: Omit<Task, "id">) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...task, id } : t)));
    toast({
      title: "Task updated",
      description: `"${task.name}" has been updated`,
    });
  };

  const handleDelete = (id: string) => {
    const task = tasks.find(t => t.id === id);
    setTasks(tasks.filter((t) => t.id !== id));
    toast({
      title: "Task deleted",
      description: task ? `"${task.name}" has been removed` : "Task removed",
    });
  };

  const handleEditGoal = () => {
    setGoalInput(dailyGoal.toString());
    setEditingGoal(true);
  };

  const handleSaveGoal = () => {
    const newGoal = parseInt(goalInput, 10);
    if (!isNaN(newGoal) && newGoal > 0) {
      setDailyGoal(newGoal);
      toast({
        title: "Daily goal updated",
        description: `Your daily goal is now ${newGoal} points`,
      });
    }
    setEditingGoal(false);
  };

  const handleCancelGoal = () => {
    setEditingGoal(false);
    setGoalInput("");
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Tasks</h2>
        <p className="text-muted-foreground text-sm">Manage your tasks and point values</p>
      </div>

      <Card className="max-w-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Target className="h-4 w-4 text-muted-foreground" />
            Daily Point Goal
          </CardTitle>
        </CardHeader>
        <CardContent>
          {editingGoal ? (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                className="w-24 font-mono"
                min={1}
                autoFocus
                data-testid="input-daily-goal"
              />
              <span className="text-sm text-muted-foreground">points</span>
              <Button size="icon" variant="ghost" onClick={handleSaveGoal} data-testid="button-save-daily-goal">
                <Check className="h-4 w-4 text-chart-1" />
              </Button>
              <Button size="icon" variant="ghost" onClick={handleCancelGoal} data-testid="button-cancel-daily-goal">
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-2xl font-mono font-bold">{dailyGoal}</span>
              <span className="text-sm text-muted-foreground">points per day</span>
              <Button size="icon" variant="ghost" onClick={handleEditGoal} data-testid="button-edit-daily-goal">
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            Hit this goal each day to build your day streak
          </p>
        </CardContent>
      </Card>

      <TaskList
        tasks={tasks}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}
