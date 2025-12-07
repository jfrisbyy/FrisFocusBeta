import { useState } from "react";
import TaskList from "@/components/TaskList";
import { useToast } from "@/hooks/use-toast";
import { BoosterRule } from "@/components/BoosterRuleConfig";

interface Task {
  id: string;
  name: string;
  value: number;
  category: string;
  group?: string;
  boosterRule?: BoosterRule;
}

// todo: remove mock functionality
const initialTasks: Task[] = [
  { id: "1", name: "Morning workout", value: 15, category: "Health", boosterRule: { enabled: true, timesRequired: 5, period: "week", bonusPoints: 15 } },
  { id: "2", name: "Evening walk", value: 5, category: "Health" },
  { id: "3", name: "Gym session", value: 20, category: "Health", boosterRule: { enabled: true, timesRequired: 3, period: "week", bonusPoints: 10 } },
  { id: "4", name: "Read 30 minutes", value: 10, category: "Productivity", boosterRule: { enabled: true, timesRequired: 4, period: "week", bonusPoints: 20 } },
  { id: "5", name: "Complete work tasks", value: 15, category: "Productivity" },
  { id: "6", name: "Learn something new", value: 10, category: "Productivity" },
  { id: "7", name: "Bible study", value: 15, category: "Spiritual", boosterRule: { enabled: true, timesRequired: 7, period: "week", bonusPoints: 25 } },
  { id: "8", name: "Prayer time", value: 10, category: "Spiritual" },
  { id: "9", name: "Connect with friend", value: 5, category: "Social" },
  { id: "10", name: "Ate junk food", value: -10, category: "Penalties" },
  { id: "11", name: "Skipped workout", value: -15, category: "Penalties" },
  { id: "12", name: "Wasted time on social media", value: -10, category: "Penalties" },
];

export default function TasksPage() {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  const handleAdd = (task: Omit<Task, "id">) => {
    const id = String(Date.now());
    setTasks([...tasks, { ...task, id }]);
    toast({
      title: "Task added",
      description: `"${task.name}" has been added to ${task.category}`,
    });
    console.log("Added task:", task);
  };

  const handleEdit = (id: string, task: Omit<Task, "id">) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...task, id } : t)));
    toast({
      title: "Task updated",
      description: `"${task.name}" has been updated`,
    });
    console.log("Edited task:", id, task);
  };

  const handleDelete = (id: string) => {
    const task = tasks.find(t => t.id === id);
    setTasks(tasks.filter((t) => t.id !== id));
    toast({
      title: "Task deleted",
      description: task ? `"${task.name}" has been removed` : "Task removed",
    });
    console.log("Deleted task:", id);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Tasks</h2>
        <p className="text-muted-foreground text-sm">Manage your tasks and point values</p>
      </div>

      <TaskList
        tasks={tasks}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}
