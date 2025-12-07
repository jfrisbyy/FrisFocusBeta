import { useState } from "react";
import TaskGroup from "../TaskGroup";

// todo: remove mock functionality
const mockTasks = [
  { id: "1", name: "Morning workout", value: 15, isBooster: true },
  { id: "2", name: "Evening walk", value: 5 },
  { id: "3", name: "Gym session", value: 20, isBooster: true },
];

export default function TaskGroupExample() {
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set(["1"]));

  const handleToggle = (taskId: string, checked: boolean) => {
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

  return (
    <TaskGroup
      category="Exercise"
      tasks={mockTasks}
      completedIds={completedIds}
      onTaskToggle={handleToggle}
    />
  );
}
