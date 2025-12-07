import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import TaskForm, { TaskWithBooster } from "./TaskForm";
import { BoosterRule } from "./BoosterRuleConfig";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Task {
  id: string;
  name: string;
  value: number;
  category: string;
  group?: string;
  boosterRule?: BoosterRule;
}

interface TaskListProps {
  tasks: Task[];
  onAdd: (task: Omit<Task, "id">) => void;
  onEdit: (id: string, task: Omit<Task, "id">) => void;
  onDelete: (id: string) => void;
}

export default function TaskList({ tasks, onAdd, onEdit, onDelete }: TaskListProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const categories = Array.from(new Set(tasks.map(t => t.category)));

  const handleEdit = (task: Task) => {
    setEditingTask(task);
  };

  const handleEditSubmit = (values: TaskWithBooster) => {
    if (editingTask) {
      onEdit(editingTask.id, values);
      setEditingTask(null);
    }
  };

  const confirmDelete = () => {
    if (deleteId) {
      onDelete(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-lg font-semibold">All Tasks</CardTitle>
          <Button size="sm" onClick={() => setFormOpen(true)} data-testid="button-add-task">
            <Plus className="h-4 w-4 mr-1" />
            Add Task
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {categories.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No tasks yet. Add your first task to get started.
            </div>
          ) : (
            <div className="divide-y">
              {categories.map((category) => (
                <div key={category}>
                  <div className="bg-muted/30 px-6 py-2">
                    <span className="text-sm font-medium text-muted-foreground">{category}</span>
                  </div>
                  {tasks
                    .filter((t) => t.category === category)
                    .map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between gap-4 px-6 py-3 hover-elevate"
                        data-testid={`task-row-${task.id}`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-wrap">
                          <span className="text-sm font-medium truncate">{task.name}</span>
                          {task.boosterRule?.enabled && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge variant="outline" className="text-xs text-chart-2 border-chart-2/30 shrink-0 gap-1">
                                  <Zap className="h-3 w-3" />
                                  {task.boosterRule.timesRequired}x/{task.boosterRule.period === "week" ? "wk" : "mo"}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  Complete {task.boosterRule.timesRequired} times per {task.boosterRule.period} for +{task.boosterRule.bonusPoints} bonus
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                          {task.group && (
                            <Badge variant="secondary" className="text-xs shrink-0">
                              {task.group}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={cn(
                              "font-mono text-sm font-semibold w-12 text-right",
                              task.value > 0 ? "text-chart-1" : "text-chart-3"
                            )}
                          >
                            {task.value > 0 ? `+${task.value}` : task.value}
                          </span>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEdit(task)}
                            data-testid={`button-edit-${task.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setDeleteId(task.id)}
                            data-testid={`button-delete-${task.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-chart-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <TaskForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={onAdd}
        title="Add Task"
        categories={categories.length > 0 ? categories : undefined}
      />

      <TaskForm
        open={!!editingTask}
        onOpenChange={(open) => !open && setEditingTask(null)}
        onSubmit={handleEditSubmit}
        defaultValues={editingTask || undefined}
        title="Edit Task"
        categories={categories.length > 0 ? categories : undefined}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
