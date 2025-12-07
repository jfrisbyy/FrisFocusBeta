import { useState } from "react";
import TaskList from "@/components/TaskList";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Target, Pencil, Check, X, Plus, Trash2, AlertTriangle, TrendingDown } from "lucide-react";
import type { BoosterRule } from "@/components/BoosterRuleConfig";
import type { TaskPriority, PenaltyRule, PenaltyItem, NegativeBooster } from "@shared/schema";

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

// Mock penalties
const initialPenalties: PenaltyItem[] = [
  { id: "p1", name: "Missed workout", value: -10, category: "Penalties" },
  { id: "p2", name: "Skipped prayer", value: -5, category: "Penalties" },
  { id: "p3", name: "Ate junk food", value: -8, category: "Penalties" },
];

// Mock negative boosters
const initialNegativeBoosters: NegativeBooster[] = [
  { id: "nb1", name: "Too much screen time", description: "If done 3+ times per week", timesThreshold: 3, period: "week", penaltyPoints: 15, currentCount: 1, triggered: false },
  { id: "nb2", name: "Skipped gym", description: "If skipped 2+ times per week", timesThreshold: 2, period: "week", penaltyPoints: 20, currentCount: 0, triggered: false },
];

export default function TasksPage() {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  // todo: remove mock functionality - daily goal will come from backend
  const [dailyGoal, setDailyGoal] = useState(50);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState("");
  
  // Penalties state
  const [penalties, setPenalties] = useState<PenaltyItem[]>(initialPenalties);
  const [penaltyDialogOpen, setPenaltyDialogOpen] = useState(false);
  const [editingPenalty, setEditingPenalty] = useState<PenaltyItem | null>(null);
  const [penaltyName, setPenaltyName] = useState("");
  const [penaltyValue, setPenaltyValue] = useState("-5");
  const [deletePenaltyId, setDeletePenaltyId] = useState<string | null>(null);

  // Negative boosters state
  const [negativeBoosters, setNegativeBoosters] = useState<NegativeBooster[]>(initialNegativeBoosters);
  const [boosterDialogOpen, setBoosterDialogOpen] = useState(false);
  const [editingBooster, setEditingBooster] = useState<NegativeBooster | null>(null);
  const [boosterName, setBoosterName] = useState("");
  const [boosterDescription, setBoosterDescription] = useState("");
  const [boosterThreshold, setBoosterThreshold] = useState("3");
  const [boosterPeriod, setBoosterPeriod] = useState<"week" | "month">("week");
  const [boosterPoints, setBoosterPoints] = useState("10");
  const [deleteBoosterId, setDeleteBoosterId] = useState<string | null>(null);

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

  // Penalty handlers
  const resetPenaltyForm = () => {
    setPenaltyName("");
    setPenaltyValue("-5");
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
    setPenaltyDialogOpen(true);
  };

  const handleSavePenalty = () => {
    const value = parseInt(penaltyValue, 10);
    const finalValue = value > 0 ? -value : value;

    if (editingPenalty) {
      setPenalties(penalties.map(p =>
        p.id === editingPenalty.id
          ? { ...p, name: penaltyName, value: finalValue }
          : p
      ));
      toast({ title: "Penalty updated", description: `"${penaltyName}" has been updated` });
    } else {
      const newPenalty: PenaltyItem = {
        id: `p${Date.now()}`,
        name: penaltyName,
        value: finalValue,
        category: "Penalties",
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

  // Negative booster handlers
  const resetBoosterForm = () => {
    setBoosterName("");
    setBoosterDescription("");
    setBoosterThreshold("3");
    setBoosterPeriod("week");
    setBoosterPoints("10");
  };

  const handleOpenCreateBooster = () => {
    resetBoosterForm();
    setEditingBooster(null);
    setBoosterDialogOpen(true);
  };

  const handleOpenEditBooster = (booster: NegativeBooster) => {
    setEditingBooster(booster);
    setBoosterName(booster.name);
    setBoosterDescription(booster.description);
    setBoosterThreshold(booster.timesThreshold.toString());
    setBoosterPeriod(booster.period);
    setBoosterPoints(booster.penaltyPoints.toString());
    setBoosterDialogOpen(true);
  };

  const handleSaveBooster = () => {
    const threshold = parseInt(boosterThreshold, 10) || 3;
    const points = parseInt(boosterPoints, 10) || 10;

    if (editingBooster) {
      setNegativeBoosters(negativeBoosters.map(b =>
        b.id === editingBooster.id
          ? { ...b, name: boosterName, description: boosterDescription, timesThreshold: threshold, period: boosterPeriod, penaltyPoints: points }
          : b
      ));
      toast({ title: "Negative booster updated", description: `"${boosterName}" has been updated` });
    } else {
      const newBooster: NegativeBooster = {
        id: `nb${Date.now()}`,
        name: boosterName,
        description: boosterDescription,
        timesThreshold: threshold,
        period: boosterPeriod,
        penaltyPoints: points,
        currentCount: 0,
        triggered: false,
      };
      setNegativeBoosters([...negativeBoosters, newBooster]);
      toast({ title: "Negative booster added", description: `"${boosterName}" has been added` });
    }

    setBoosterDialogOpen(false);
    resetBoosterForm();
    setEditingBooster(null);
  };

  const handleDeleteBooster = () => {
    if (deleteBoosterId) {
      const booster = negativeBoosters.find(b => b.id === deleteBoosterId);
      setNegativeBoosters(negativeBoosters.filter(b => b.id !== deleteBoosterId));
      toast({ title: "Negative booster deleted", description: booster ? `"${booster.name}" has been removed` : "Negative booster removed" });
      setDeleteBoosterId(null);
    }
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

      {/* Penalties Section */}
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
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between gap-2">
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
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Negative Boosters Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-chart-3" />
            <h3 className="text-lg font-medium">Negative Boosters</h3>
            <span className="text-sm text-muted-foreground">({negativeBoosters.length})</span>
          </div>
          <Button onClick={handleOpenCreateBooster} data-testid="button-add-negative-booster">
            <Plus className="h-4 w-4 mr-1" />
            Add Negative Booster
          </Button>
        </div>

        {negativeBoosters.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No negative boosters configured. Add one to penalize repeated bad behaviors.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {negativeBoosters.map((booster) => (
              <Card key={booster.id} data-testid={`negative-booster-${booster.id}`}>
                <CardContent className="pt-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-sm">{booster.name}</span>
                      <p className="text-xs text-muted-foreground">{booster.description}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleOpenEditBooster(booster)}
                        data-testid={`button-edit-booster-${booster.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setDeleteBoosterId(booster.id)}
                        data-testid={`button-delete-booster-${booster.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-chart-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {booster.timesThreshold}+ times per {booster.period}
                    </span>
                    <span className="font-mono text-chart-3">-{booster.penaltyPoints} pts</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Penalty Dialog */}
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

      {/* Negative Booster Dialog */}
      <Dialog open={boosterDialogOpen} onOpenChange={setBoosterDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingBooster ? "Edit Negative Booster" : "Add Negative Booster"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="booster-name">Name</Label>
              <Input
                id="booster-name"
                value={boosterName}
                onChange={(e) => setBoosterName(e.target.value)}
                placeholder="e.g., Too much screen time"
                data-testid="input-booster-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="booster-description">Description</Label>
              <Textarea
                id="booster-description"
                value={boosterDescription}
                onChange={(e) => setBoosterDescription(e.target.value)}
                placeholder="e.g., If done 3+ times per week"
                rows={2}
                className="resize-none"
                data-testid="input-booster-description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="booster-threshold">Times Threshold</Label>
                <Input
                  id="booster-threshold"
                  type="number"
                  value={boosterThreshold}
                  onChange={(e) => setBoosterThreshold(e.target.value)}
                  min={1}
                  data-testid="input-booster-threshold"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="booster-period">Period</Label>
                <Select value={boosterPeriod} onValueChange={(v) => setBoosterPeriod(v as "week" | "month")}>
                  <SelectTrigger data-testid="select-booster-period">
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
              <Label htmlFor="booster-points">Penalty Points</Label>
              <Input
                id="booster-points"
                type="number"
                value={boosterPoints}
                onChange={(e) => setBoosterPoints(e.target.value)}
                min={1}
                data-testid="input-booster-points"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setBoosterDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveBooster} disabled={!boosterName.trim()} data-testid="button-save-booster">
              {editingBooster ? "Update" : "Add"} Negative Booster
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Penalty Confirmation */}
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

      {/* Delete Negative Booster Confirmation */}
      <AlertDialog open={!!deleteBoosterId} onOpenChange={(open) => !open && setDeleteBoosterId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Negative Booster</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this negative booster? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteBooster} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
