import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import TaskCheckbox from "./TaskCheckbox";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  name: string;
  value: number;
  isBooster?: boolean;
}

interface TaskGroupProps {
  category: string;
  tasks: Task[];
  completedIds: Set<string>;
  onTaskToggle: (taskId: string, checked: boolean) => void;
  defaultOpen?: boolean;
}

export default function TaskGroup({
  category,
  tasks,
  completedIds,
  onTaskToggle,
  defaultOpen = true,
}: TaskGroupProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const completedCount = tasks.filter(t => completedIds.has(t.id)).length;
  const categoryPoints = tasks
    .filter(t => completedIds.has(t.id))
    .reduce((sum, t) => sum + t.value, 0);

  return (
    <div className="rounded-lg border bg-card">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between gap-2 p-4 text-left hover-elevate"
        data-testid={`group-toggle-${category.toLowerCase().replace(/\s/g, "-")}`}
      >
        <div className="flex items-center gap-2">
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="font-medium">{category}</span>
          <span className="text-xs text-muted-foreground">
            {completedCount}/{tasks.length}
          </span>
        </div>
        {categoryPoints !== 0 && (
          <span
            className={cn(
              "font-mono text-sm font-semibold",
              categoryPoints > 0 ? "text-chart-1" : "text-chart-3"
            )}
          >
            {categoryPoints > 0 ? `+${categoryPoints}` : categoryPoints}
          </span>
        )}
      </button>
      {isOpen && (
        <div className="border-t px-2 py-2">
          {tasks.map((task) => (
            <TaskCheckbox
              key={task.id}
              id={task.id}
              name={task.name}
              value={task.value}
              isBooster={task.isBooster}
              checked={completedIds.has(task.id)}
              onChange={(checked) => onTaskToggle(task.id, checked)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
