import { useState } from "react";
import TaskList from "../TaskList";

// todo: remove mock functionality
const initialTasks = [
  { id: "1", name: "Morning workout", value: 15, category: "Health", isBooster: true },
  { id: "2", name: "Read 30 minutes", value: 10, category: "Productivity" },
  { id: "3", name: "Bible study", value: 15, category: "Spiritual", isBooster: true },
  { id: "4", name: "Ate junk food", value: -10, category: "Penalties" },
  { id: "5", name: "Skipped workout", value: -15, category: "Penalties" },
];

export default function TaskListExample() {
  const [tasks, setTasks] = useState(initialTasks);

  const handleAdd = (task: Omit<typeof tasks[0], "id">) => {
    const id = String(Date.now());
    setTasks([...tasks, { ...task, id }]);
    console.log("Added task:", task);
  };

  const handleEdit = (id: string, task: Omit<typeof tasks[0], "id">) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...task, id } : t)));
    console.log("Edited task:", id, task);
  };

  const handleDelete = (id: string) => {
    setTasks(tasks.filter((t) => t.id !== id));
    console.log("Deleted task:", id);
  };

  return (
    <TaskList
      tasks={tasks}
      onAdd={handleAdd}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  );
}
