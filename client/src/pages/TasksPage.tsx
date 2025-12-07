import { useState, useEffect } from "react";
import TaskList from "@/components/TaskList";
import { useToast } from "@/hooks/use-toast";
import { useOnboarding } from "@/contexts/OnboardingContext";
// localStorage persistence - load and save functions
import {
  loadTasksFromStorage,
  saveTasksToStorage,
  loadCategoriesFromStorage,
  saveCategoriesToStorage,
  loadPenaltiesFromStorage,
  savePenaltiesToStorage,
  loadPenaltyBoostFromStorage,
  savePenaltyBoostToStorage,
  loadDailyGoalFromStorage,
  saveDailyGoalToStorage,
  type StoredTask,
  type StoredCategory,
  type StoredPenalty,
} from "@/lib/storage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Target, Pencil, Check, X, Plus, Trash2, AlertTriangle, TrendingDown, Tag } from "lucide-react";
import type { BoosterRule } from "@/components/BoosterRuleConfig";
import type { TaskPriority, PenaltyRule, PenaltyItem, Category } from "@shared/schema";

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

// Sample data for onboarding mode only
const sampleCategories: Category[] = [
  { id: "c1", name: "Health" },
  { id: "c2", name: "Productivity" },
  { id: "c3", name: "Spiritual" },
  { id: "c4", name: "Social" },
];

const sampleTasks: Task[] = [
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

const samplePenalties: PenaltyItem[] = [
  { id: "p1", name: "Missed workout", value: -10, category: "Penalties", negativeBoostEnabled: false },
  { id: "p2", name: "Skipped prayer", value: -5, category: "Penalties", negativeBoostEnabled: false },
  { id: "p3", name: "Ate junk food", value: -8, category: "Penalties", negativeBoostEnabled: true, timesThreshold: 3, period: "week", boostPenaltyPoints: 15, currentCount: 1, triggered: false },
  { id: "p4", name: "Too much screen time", value: -5, category: "Penalties", negativeBoostEnabled: true, timesThreshold: 4, period: "week", boostPenaltyPoints: 20, currentCount: 2, triggered: false },
];

export default function TasksPage() {
  const { toast } = useToast();
  const { isOnboarding } = useOnboarding();
  
  // Initialize state from localStorage or use sample data during onboarding
  const [tasks, setTasks] = useState<Task[]>(() => {
    if (isOnboarding) return sampleTasks;
    const stored = loadTasksFromStorage();
    return stored.length > 0 ? stored.map(t => ({
      id: t.id,
      name: t.name,
      value: t.value,
      category: t.category || "General",
      priority: (t.priority || "shouldDo") as TaskPriority,
      boosterRule: t.boostEnabled ? {
        enabled: true,
        timesRequired: t.boostThreshold || 3,
        period: t.boostPeriod || "week",
        bonusPoints: t.boostPoints || 10,
      } : undefined,
    })) : [];
  });
  
  const [dailyGoal, setDailyGoal] = useState(() => {
    if (isOnboarding) return 50;
    return loadDailyGoalFromStorage();
  });
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState("");
  
  const [penalties, setPenalties] = useState<PenaltyItem[]>(() => {
    if (isOnboarding) return samplePenalties;
    const stored = loadPenaltiesFromStorage();
    return stored.map(p => ({
      id: p.id,
      name: p.name,
      value: p.value,
      category: "Penalties",
      negativeBoostEnabled: false,
      currentCount: 0,
      triggered: false,
    }));
  });
  const [penaltyDialogOpen, setPenaltyDialogOpen] = useState(false);
  const [editingPenalty, setEditingPenalty] = useState<PenaltyItem | null>(null);
  const [penaltyName, setPenaltyName] = useState("");
  const [penaltyValue, setPenaltyValue] = useState("-5");
  const [deletePenaltyId, setDeletePenaltyId] = useState<string | null>(null);
  
  const [penaltyBoostEnabled, setPenaltyBoostEnabled] = useState(false);
  const [penaltyBoostThreshold, setPenaltyBoostThreshold] = useState("3");
  const [penaltyBoostPeriod, setPenaltyBoostPeriod] = useState<"week" | "month">("week");
  const [penaltyBoostPoints, setPenaltyBoostPoints] = useState("10");

  const [categories, setCategories] = useState<Category[]>(() => {
    if (isOnboarding) return sampleCategories;
    const stored = loadCategoriesFromStorage();
    return stored.length > 0 ? stored : [];
  });
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);

  // Persist tasks to localStorage whenever they change (skip during onboarding)
  useEffect(() => {
    if (isOnboarding) return;
    const storedTasks: StoredTask[] = tasks.map(t => ({
      id: t.id,
      name: t.name,
      value: t.value,
      category: t.category,
      priority: t.priority,
      boostEnabled: t.boosterRule?.enabled,
      boostThreshold: t.boosterRule?.timesRequired,
      boostPeriod: t.boosterRule?.period,
      boostPoints: t.boosterRule?.bonusPoints,
    }));
    saveTasksToStorage(storedTasks);
  }, [tasks, isOnboarding]);

  // Persist categories to localStorage whenever they change
  useEffect(() => {
    if (isOnboarding) return;
    const storedCategories: StoredCategory[] = categories.map(c => ({
      id: c.id,
      name: c.name,
    }));
    saveCategoriesToStorage(storedCategories);
  }, [categories, isOnboarding]);

  // Persist penalties to localStorage whenever they change
  useEffect(() => {
    if (isOnboarding) return;
    const storedPenalties: StoredPenalty[] = penalties.map(p => ({
      id: p.id,
      name: p.name,
      value: p.value,
    }));
    savePenaltiesToStorage(storedPenalties);
  }, [penalties, isOnboarding]);

  // Persist daily goal to localStorage whenever it changes
  useEffect(() => {
    if (isOnboarding) return;
    saveDailyGoalToStorage(dailyGoal);
  }, [dailyGoal, isOnboarding]);

  const usedCategoryNames = new Set(tasks.map(t => t.category));
  const categoryNames = categories.map(c => c.name);

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

  const resetPenaltyForm = () => {
    setPenaltyName("");
    setPenaltyValue("-5");
    setPenaltyBoostEnabled(false);
    setPenaltyBoostThreshold("3");
    setPenaltyBoostPeriod("week");
    setPenaltyBoostPoints("10");
  };

  const handleOpenCreatePenalty = () => {
    resetPenaltyForm();
    setEditingPenalty(null);
    setPenaltyDialogOpen(true);
  };

  const handleOpenEditPenalty = (penalty: PenaltyItem) => {
    setEditingPenalty(penalty);
    setPenaltyName(penalty.name);
    setPenaltyValue(penalty.value.toString());
    setPenaltyBoostEnabled(penalty.negativeBoostEnabled || false);
    setPenaltyBoostThreshold(penalty.timesThreshold?.toString() || "3");
    setPenaltyBoostPeriod(penalty.period || "week");
    setPenaltyBoostPoints(penalty.boostPenaltyPoints?.toString() || "10");
    setPenaltyDialogOpen(true);
  };

  const handleSavePenalty = () => {
    const value = parseInt(penaltyValue, 10);
    const finalValue = value > 0 ? -value : value;
    const threshold = parseInt(penaltyBoostThreshold, 10) || 3;
    const boostPoints = parseInt(penaltyBoostPoints, 10) || 10;

    if (editingPenalty) {
      setPenalties(penalties.map(p =>
        p.id === editingPenalty.id
          ? {
              ...p,
              name: penaltyName,
              value: finalValue,
              negativeBoostEnabled: penaltyBoostEnabled,
              timesThreshold: penaltyBoostEnabled ? threshold : undefined,
              period: penaltyBoostEnabled ? penaltyBoostPeriod : undefined,
              boostPenaltyPoints: penaltyBoostEnabled ? boostPoints : undefined,
            }
          : p
      ));
      toast({ title: "Penalty updated", description: `"${penaltyName}" has been updated` });
    } else {
      const newPenalty: PenaltyItem = {
        id: `p${Date.now()}`,
        name: penaltyName,
        value: finalValue,
        category: "Penalties",
        negativeBoostEnabled: penaltyBoostEnabled,
        timesThreshold: penaltyBoostEnabled ? threshold : undefined,
        period: penaltyBoostEnabled ? penaltyBoostPeriod : undefined,
        boostPenaltyPoints: penaltyBoostEnabled ? boostPoints : undefined,
        currentCount: 0,
        triggered: false,
      };
      setPenalties([...penalties, newPenalty]);
      toast({ title: "Penalty added", description: `"${penaltyName}" has been added` });
    }

    setPenaltyDialogOpen(false);
    resetPenaltyForm();
    setEditingPenalty(null);
  };

  const handleDeletePenalty = () => {
    if (deletePenaltyId) {
      const penalty = penalties.find(p => p.id === deletePenaltyId);
      setPenalties(penalties.filter(p => p.id !== deletePenaltyId));
      toast({ title: "Penalty deleted", description: penalty ? `"${penalty.name}" has been removed` : "Penalty removed" });
      setDeletePenaltyId(null);
    }
  };

  const resetCategoryForm = () => {
    setCategoryName("");
  };

  const handleOpenCreateCategory = () => {
    resetCategoryForm();
    setEditingCategory(null);
    setCategoryDialogOpen(true);
  };

  const handleOpenEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setCategoryDialogOpen(true);
  };

  const handleSaveCategory = () => {
    if (editingCategory) {
      const oldName = editingCategory.name;
      setCategories(categories.map(c =>
        c.id === editingCategory.id ? { ...c, name: categoryName } : c
      ));
      if (oldName !== categoryName) {
        setTasks(tasks.map(t =>
          t.category === oldName ? { ...t, category: categoryName } : t
        ));
      }
      toast({ title: "Category updated", description: `"${categoryName}" has been updated` });
    } else {
      const newCategory: Category = {
        id: `c${Date.now()}`,
        name: categoryName,
      };
      setCategories([...categories, newCategory]);
      toast({ title: "Category added", description: `"${categoryName}" has been added` });
    }

    setCategoryDialogOpen(false);
    resetCategoryForm();
    setEditingCategory(null);
  };

  const handleDeleteCategory = () => {
    if (deleteCategoryId) {
      const category = categories.find(c => c.id === deleteCategoryId);
      setCategories(categories.filter(c => c.id !== deleteCategoryId));
      toast({ title: "Category deleted", description: category ? `"${category.name}" has been removed` : "Category removed" });
      setDeleteCategoryId(null);
    }
  };

  const isCategoryInUse = (categoryName: string) => usedCategoryNames.has(categoryName);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Tasks</h2>
        <p className="text-muted-foreground text-sm">Manage your tasks and point values</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 max-w-2xl">
        <Card>
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

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                Categories
              </div>
              <Button size="sm" variant="ghost" onClick={handleOpenCreateCategory} data-testid="button-add-category">
                <Plus className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-xs"
                  data-testid={`category-${category.id}`}
                >
                  <span>{category.name}</span>
                  <button
                    type="button"
                    className="hover:text-foreground"
                    onClick={() => handleOpenEditCategory(category)}
                    data-testid={`button-edit-category-${category.id}`}
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  {!isCategoryInUse(category.name) && (
                    <button
                      type="button"
                      className="hover:text-foreground"
                      onClick={() => setDeleteCategoryId(category.id)}
                      data-testid={`button-delete-category-${category.id}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
              {categories.length === 0 && (
                <span className="text-sm text-muted-foreground">No categories yet</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <TaskList
        tasks={tasks}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        categories={categoryNames}
      />

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-chart-3" />
            <h3 className="text-lg font-medium">Penalties</h3>
            <span className="text-sm text-muted-foreground">({penalties.length})</span>
          </div>
          <Button onClick={handleOpenCreatePenalty} data-testid="button-add-penalty">
            <Plus className="h-4 w-4 mr-1" />
            Add Penalty
          </Button>
        </div>

        {penalties.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No penalties configured. Add one to track negative behaviors.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {penalties.map((penalty) => (
              <Card key={penalty.id} data-testid={`penalty-${penalty.id}`}>
                <CardContent className="pt-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-sm">{penalty.name}</span>
                      <p className="font-mono text-chart-3 text-sm">{penalty.value} pts</p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleOpenEditPenalty(penalty)}
                        data-testid={`button-edit-penalty-${penalty.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setDeletePenaltyId(penalty.id)}
                        data-testid={`button-delete-penalty-${penalty.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-chart-3" />
                      </Button>
                    </div>
                  </div>
                  {penalty.negativeBoostEnabled && penalty.timesThreshold && penalty.period && penalty.boostPenaltyPoints && (
                    <div className="flex items-center gap-2 text-xs border-t pt-2">
                      <TrendingDown className="h-3 w-3 text-chart-3" />
                      <span className="text-muted-foreground">
                        {penalty.timesThreshold}+ times/{penalty.period}:
                      </span>
                      <span className="font-mono text-chart-3">-{penalty.boostPenaltyPoints} pts</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={penaltyDialogOpen} onOpenChange={setPenaltyDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingPenalty ? "Edit Penalty" : "Add Penalty"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="penalty-name">Name</Label>
              <Input
                id="penalty-name"
                value={penaltyName}
                onChange={(e) => setPenaltyName(e.target.value)}
                placeholder="e.g., Missed workout"
                data-testid="input-penalty-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="penalty-value">Point Value (negative)</Label>
              <Input
                id="penalty-value"
                type="number"
                value={penaltyValue}
                onChange={(e) => setPenaltyValue(e.target.value)}
                max={-1}
                data-testid="input-penalty-value"
              />
            </div>
            
            <div className="border-t pt-4 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <Label htmlFor="boost-enabled" className="text-sm font-medium">Negative Boost</Label>
                  <p className="text-xs text-muted-foreground">Extra penalty for repeated offenses</p>
                </div>
                <Switch
                  id="boost-enabled"
                  checked={penaltyBoostEnabled}
                  onCheckedChange={setPenaltyBoostEnabled}
                  data-testid="switch-penalty-boost"
                />
              </div>
              
              {penaltyBoostEnabled && (
                <div className="space-y-4 pl-4 border-l-2 border-muted">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="boost-threshold">Times Threshold</Label>
                      <Input
                        id="boost-threshold"
                        type="number"
                        value={penaltyBoostThreshold}
                        onChange={(e) => setPenaltyBoostThreshold(e.target.value)}
                        min={1}
                        data-testid="input-penalty-boost-threshold"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="boost-period">Period</Label>
                      <Select value={penaltyBoostPeriod} onValueChange={(v) => setPenaltyBoostPeriod(v as "week" | "month")}>
                        <SelectTrigger data-testid="select-penalty-boost-period">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="week">Week</SelectItem>
                          <SelectItem value="month">Month</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="boost-points">Extra Penalty Points</Label>
                    <Input
                      id="boost-points"
                      type="number"
                      value={penaltyBoostPoints}
                      onChange={(e) => setPenaltyBoostPoints(e.target.value)}
                      min={1}
                      data-testid="input-penalty-boost-points"
                    />
                    <p className="text-xs text-muted-foreground">
                      If this penalty is logged {penaltyBoostThreshold}+ times per {penaltyBoostPeriod}, you lose an extra {penaltyBoostPoints} points
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPenaltyDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePenalty} disabled={!penaltyName.trim()} data-testid="button-save-penalty">
              {editingPenalty ? "Update" : "Add"} Penalty
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Edit Category" : "Add Category"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="category-name">Name</Label>
              <Input
                id="category-name"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="e.g., Fitness"
                data-testid="input-category-name"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCategory} disabled={!categoryName.trim()} data-testid="button-save-category">
              {editingCategory ? "Update" : "Add"} Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletePenaltyId} onOpenChange={(open) => !open && setDeletePenaltyId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Penalty</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this penalty? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePenalty} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteCategoryId} onOpenChange={(open) => !open && setDeleteCategoryId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this category? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCategory} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
