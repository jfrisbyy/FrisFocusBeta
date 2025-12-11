import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Zap, AlertTriangle, AlertCircle, Check, Layers, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import TaskForm, { TaskWithBooster } from "./TaskForm";
import { BoosterRule } from "./BoosterRuleConfig";
import { HelpIndicator, helpContent } from "@/components/HelpIndicator";

type ViewMode = "priority" | "category";
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

interface TaskListProps {
  tasks: Task[];
  onAdd: (task: Omit<Task, "id">) => void;
  onEdit: (id: string, task: Omit<Task, "id">) => void;
  onDelete: (id: string) => void;
  categories?: string[];
}

const priorityConfig: Record<TaskPriority, { label: string; variant: "default" | "secondary" | "outline"; icon: typeof AlertTriangle }> = {
  mustDo: { label: "Must Do", variant: "default", icon: AlertTriangle },
  shouldDo: { label: "Should Do", variant: "secondary", icon: AlertCircle },
  couldDo: { label: "Could Do", variant: "outline", icon: Check },
};

const priorityOrder: TaskPriority[] = ["mustDo", "shouldDo", "couldDo"];

export default function TaskList({ tasks, onAdd, onEdit, onDelete, categories: propCategories }: TaskListProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("priority");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<TaskPriority | null>(null);

  const handleEdit = (task: Task) => {
    setEditingTask(task);
  };

  const handleEditSubmit = (values: TaskWithBooster) => {
    if (editingTask) {
      onEdit(editingTask.id, values as Omit<Task, "id">);
      setEditingTask(null);
    }
  };

  const confirmDelete = () => {
    if (deleteId) {
      onDelete(deleteId);
      setDeleteId(null);
    }
  };

  const derivedCategories = Array.from(new Set(tasks.map(t => t.category)));
  const categories = propCategories && propCategories.length > 0 ? propCategories : derivedCategories;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1">
            <CardTitle className="text-lg font-semibold">All Tasks</CardTitle>
            <HelpIndicator {...helpContent.tasks} />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-md border p-1 gap-1" data-testid="view-mode-toggle">
              <button
                onClick={() => setViewMode("priority")}
                className={cn(
                  "flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors",
                  viewMode === "priority"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover-elevate"
                )}
                data-testid="button-view-priority"
              >
                <Layers className="h-3.5 w-3.5" />
                By Priority
              </button>
              <button
                onClick={() => setViewMode("category")}
                className={cn(
                  "flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors",
                  viewMode === "category"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover-elevate"
                )}
                data-testid="button-view-category"
              >
                <Tag className="h-3.5 w-3.5" />
                By Category
              </button>
            </div>
            <Button size="sm" onClick={() => setFormOpen(true)} data-testid="button-add-task">
              <Plus className="h-4 w-4 mr-1" />
              Add Task
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {tasks.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No tasks yet. Add your first task to get started.
            </div>
          ) : viewMode === "priority" ? (
            /* Priority View with Horizontal Tabs */
            <div className="p-4">
              {/* Priority Tabs */}
              <div className="flex flex-wrap gap-2 mb-4" data-testid="priority-tabs">
                {priorityOrder.map((priority) => {
                  const priorityTasks = tasks.filter((t) => t.priority === priority);
                  if (priorityTasks.length === 0) return null;
                  const config = priorityConfig[priority];
                  const Icon = config.icon;
                  const isSelected = selectedPriority === priority;
                  
                  return (
                    <button
                      key={priority}
                      onClick={() => setSelectedPriority(isSelected ? null : priority)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors hover-elevate active-elevate-2",
                        isSelected 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-muted text-muted-foreground"
                      )}
                      data-testid={`priority-tab-${priority}`}
                    >
                      <Icon className={cn(
                        "h-4 w-4",
                        !isSelected && priority === "mustDo" && "text-chart-3",
                        !isSelected && priority === "shouldDo" && "text-chart-2"
                      )} />
                      <span>{config.label}</span>
                      <Badge 
                        variant={isSelected ? "secondary" : "outline"} 
                        className="text-xs"
                      >
                        {priorityTasks.length}
                      </Badge>
                    </button>
                  );
                })}
              </div>
              
              {/* Tasks for Selected Priority */}
              {selectedPriority && tasks.filter(t => t.priority === selectedPriority).length > 0 ? (
                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium mb-3">{priorityConfig[selectedPriority].label} Tasks</h3>
                  <div className="space-y-1">
                    {tasks.filter(t => t.priority === selectedPriority).map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between gap-4 px-3 py-2.5 rounded-md hover-elevate"
                        data-testid={`task-row-${task.id}`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-wrap">
                          <span className="text-sm font-medium truncate">{task.name}</span>
                          <Badge variant="outline" className="text-xs shrink-0">
                            {task.category}
                          </Badge>
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
                          {task.penaltyRule?.enabled && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge variant="outline" className="text-xs text-chart-3 border-chart-3/30 shrink-0 gap-1">
                                  <AlertTriangle className="h-3 w-3" />
                                  -{task.penaltyRule.penaltyPoints}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  Penalty of -{task.penaltyRule.penaltyPoints} if done {task.penaltyRule.condition === "lessThan" ? "less than" : "more than"} {task.penaltyRule.timesThreshold} times/week
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
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Click a priority level above to view tasks
                </p>
              )}
            </div>
          ) : (
            /* Category View with Horizontal Tabs */
            <div className="p-4">
              {/* Category Tabs */}
              <div className="flex flex-wrap gap-2 mb-4" data-testid="category-tabs">
                {categories.map((category) => {
                  const categoryTasks = tasks.filter((t) => t.category === category);
                  if (categoryTasks.length === 0) return null;
                  const isSelected = selectedCategory === category;
                  
                  return (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(isSelected ? null : category)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors hover-elevate active-elevate-2",
                        isSelected 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-muted text-muted-foreground"
                      )}
                      data-testid={`category-tab-${category.toLowerCase().replace(/\s/g, "-")}`}
                    >
                      <span>{category}</span>
                      <Badge 
                        variant={isSelected ? "secondary" : "outline"} 
                        className="text-xs"
                      >
                        {categoryTasks.length}
                      </Badge>
                    </button>
                  );
                })}
              </div>
              
              {/* Tasks for Selected Category */}
              {selectedCategory && tasks.filter(t => t.category === selectedCategory).length > 0 ? (
                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium mb-3">{selectedCategory} Tasks</h3>
                  <div className="space-y-1">
                    {tasks.filter(t => t.category === selectedCategory).map((task) => {
                      const priorityConf = priorityConfig[task.priority];
                      const PriorityIcon = priorityConf.icon;
                      
                      return (
                        <div
                          key={task.id}
                          className="flex items-center justify-between gap-4 px-3 py-2.5 rounded-md hover-elevate"
                          data-testid={`task-row-${task.id}`}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-wrap">
                            <span className="text-sm font-medium truncate">{task.name}</span>
                            <Badge 
                              variant={priorityConf.variant} 
                              className={cn(
                                "text-xs shrink-0 gap-1",
                                task.priority === "mustDo" && "text-chart-3"
                              )}
                            >
                              <PriorityIcon className="h-3 w-3" />
                              {priorityConf.label}
                            </Badge>
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
                            {task.penaltyRule?.enabled && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge variant="outline" className="text-xs text-chart-3 border-chart-3/30 shrink-0 gap-1">
                                    <AlertTriangle className="h-3 w-3" />
                                    -{task.penaltyRule.penaltyPoints}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>
                                    Penalty of -{task.penaltyRule.penaltyPoints} if done {task.penaltyRule.condition === "lessThan" ? "less than" : "more than"} {task.penaltyRule.timesThreshold} times/week
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
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Click a category above to view tasks
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <TaskForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={onAdd as (values: TaskWithBooster) => void}
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
