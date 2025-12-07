import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Award,
  Plus,
  Pencil,
  Trash2,
  Flame,
  Book,
  Zap,
  Heart,
  Star,
  Target,
  Trophy,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useDemo } from "@/contexts/DemoContext";
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
  loadBadgesFromStorage,
  saveBadgesToStorage,
  type StoredBadge,
  type StoredBadgeLevel,
} from "@/lib/storage";

type BadgeConditionType = "taskCompletions" | "perfectDaysStreak" | "negativeFreeStreak" | "weeklyGoalStreak";

interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  conditionType: BadgeConditionType;
  taskName?: string;
  levels: StoredBadgeLevel[];
  progress: number;
}

const iconOptions = [
  { value: "award", icon: Award, label: "Award" },
  { value: "flame", icon: Flame, label: "Flame" },
  { value: "book", icon: Book, label: "Book" },
  { value: "zap", icon: Zap, label: "Lightning" },
  { value: "heart", icon: Heart, label: "Heart" },
  { value: "star", icon: Star, label: "Star" },
  { value: "target", icon: Target, label: "Target" },
  { value: "trophy", icon: Trophy, label: "Trophy" },
  { value: "shield", icon: Shield, label: "Shield" },
];

const getIcon = (iconName: string) => {
  const iconDef = iconOptions.find(i => i.value === iconName);
  return iconDef?.icon || Award;
};

const conditionLabels: Record<BadgeConditionType, string> = {
  taskCompletions: "Complete a task X times",
  perfectDaysStreak: "Perfect days in a row",
  negativeFreeStreak: "Negative-free days in a row",
  weeklyGoalStreak: "Weekly goals hit in a row",
};

const sampleBadges: BadgeDefinition[] = [
  {
    id: "demo-1",
    name: "Scripture Scholar",
    description: "Complete Bible reading consistently",
    icon: "book",
    conditionType: "taskCompletions",
    taskName: "Bible Reading",
    levels: [
      { level: 1, required: 10, earned: true },
      { level: 2, required: 25, earned: true },
      { level: 3, required: 50, earned: false },
    ],
    progress: 32,
  },
  {
    id: "demo-2",
    name: "Iron Will",
    description: "Complete workouts consistently",
    icon: "flame",
    conditionType: "taskCompletions",
    taskName: "Workout",
    levels: [
      { level: 1, required: 10, earned: true },
      { level: 2, required: 30, earned: false },
    ],
    progress: 18,
  },
  {
    id: "demo-3",
    name: "Perfect Week",
    description: "Hit weekly goal multiple weeks in a row",
    icon: "trophy",
    conditionType: "weeklyGoalStreak",
    levels: [
      { level: 1, required: 2, earned: false },
      { level: 2, required: 4, earned: false },
    ],
    progress: 1,
  },
  {
    id: "demo-4",
    name: "Clean Streak",
    description: "Days without penalties",
    icon: "shield",
    conditionType: "negativeFreeStreak",
    levels: [
      { level: 1, required: 7, earned: false },
      { level: 2, required: 14, earned: false },
    ],
    progress: 3,
  },
];

export default function BadgesPage() {
  const { toast } = useToast();
  const { isDemo } = useDemo();
  const [badges, setBadges] = useState<BadgeDefinition[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBadge, setEditingBadge] = useState<BadgeDefinition | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formIcon, setFormIcon] = useState("award");
  const [formConditionType, setFormConditionType] = useState<BadgeConditionType>("taskCompletions");
  const [formTaskName, setFormTaskName] = useState("");
  const [formLevels, setFormLevels] = useState<string[]>(["10", "25", "50"]);

  // Load badges from localStorage on mount
  useEffect(() => {
    if (isDemo) {
      setBadges(sampleBadges);
      return;
    }
    
    const storedBadges = loadBadgesFromStorage();
    const converted: BadgeDefinition[] = storedBadges.map((b: StoredBadge) => ({
      id: b.id,
      name: b.name,
      description: b.description,
      icon: b.icon,
      conditionType: b.conditionType as BadgeConditionType,
      taskName: b.taskName,
      levels: b.levels,
      progress: b.currentProgress || 0,
    }));
    setBadges(converted);
  }, [isDemo]);

  // Save badges to localStorage whenever they change
  const saveBadges = (newBadges: BadgeDefinition[]) => {
    setBadges(newBadges);
    if (isDemo) return;
    
    const toStore: StoredBadge[] = newBadges.map(b => ({
      id: b.id,
      name: b.name,
      description: b.description,
      icon: b.icon,
      conditionType: b.conditionType,
      taskName: b.taskName,
      levels: b.levels,
      currentProgress: b.progress,
    }));
    saveBadgesToStorage(toStore);
  };

  const getHighestEarnedLevel = (badge: BadgeDefinition) => {
    const earnedLevels = badge.levels.filter(l => l.earned);
    return earnedLevels.length > 0 ? Math.max(...earnedLevels.map(l => l.level)) : 0;
  };

  const getNextLevel = (badge: BadgeDefinition) => {
    return badge.levels.find(l => !l.earned);
  };

  const earnedBadges = badges.filter(b => b.levels.some(l => l.earned));
  const inProgressBadges = badges.filter(b => !b.levels.some(l => l.earned));

  const resetForm = () => {
    setFormName("");
    setFormDescription("");
    setFormIcon("award");
    setFormConditionType("taskCompletions");
    setFormTaskName("");
    setFormLevels(["10", "25", "50"]);
  };

  const handleAddLevel = () => {
    const lastValue = parseInt(formLevels[formLevels.length - 1] || "0", 10);
    const newValue = lastValue > 0 ? Math.round(lastValue * 2).toString() : "100";
    setFormLevels([...formLevels, newValue]);
  };

  const handleRemoveLevel = (index: number) => {
    if (formLevels.length > 1) {
      setFormLevels(formLevels.filter((_, i) => i !== index));
    }
  };

  const handleLevelChange = (index: number, value: string) => {
    const newLevels = [...formLevels];
    newLevels[index] = value;
    setFormLevels(newLevels);
  };

  const handleOpenCreate = () => {
    resetForm();
    setEditingBadge(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (badge: BadgeDefinition) => {
    setEditingBadge(badge);
    setFormName(badge.name);
    setFormDescription(badge.description);
    setFormIcon(badge.icon);
    setFormConditionType(badge.conditionType);
    setFormTaskName(badge.taskName || "");
    setFormLevels(badge.levels.map(l => l.required.toString()));
    setDialogOpen(true);
  };

  const handleSave = () => {
    const parsedLevels: StoredBadgeLevel[] = formLevels.map((val, idx) => ({
      level: idx + 1,
      required: parseInt(val, 10) || (idx + 1) * 10,
      earned: false,
    }));

    if (editingBadge) {
      const updated = badges.map(b =>
        b.id === editingBadge.id
          ? {
              ...b,
              name: formName,
              description: formDescription,
              icon: formIcon,
              conditionType: formConditionType,
              taskName: formConditionType === "taskCompletions" ? formTaskName : undefined,
              levels: parsedLevels.map((pl, idx) => ({
                ...pl,
                earned: b.levels[idx]?.earned || false,
              })),
            }
          : b
      );
      saveBadges(updated);
      toast({ title: "Badge updated", description: `"${formName}" has been updated` });
    } else {
      const newBadge: BadgeDefinition = {
        id: String(Date.now()),
        name: formName,
        description: formDescription,
        icon: formIcon,
        conditionType: formConditionType,
        taskName: formConditionType === "taskCompletions" ? formTaskName : undefined,
        levels: parsedLevels,
        progress: 0,
      };
      saveBadges([...badges, newBadge]);
      toast({ title: "Badge created", description: `"${formName}" has been added` });
    }

    setDialogOpen(false);
    resetForm();
    setEditingBadge(null);
  };

  const handleDelete = () => {
    if (deleteId) {
      const badge = badges.find(b => b.id === deleteId);
      saveBadges(badges.filter(b => b.id !== deleteId));
      toast({ title: "Badge deleted", description: badge ? `"${badge.name}" has been removed` : "Badge removed" });
      setDeleteId(null);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Badges</h2>
          <p className="text-muted-foreground text-sm">Create and track achievement badges</p>
        </div>
        <Button onClick={handleOpenCreate} data-testid="button-create-badge">
          <Plus className="h-4 w-4 mr-1" />
          Create Badge
        </Button>
      </div>

      {earnedBadges.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Trophy className="h-5 w-5 text-chart-1" />
            Earned ({earnedBadges.length})
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {earnedBadges.map((badge) => {
              const Icon = getIcon(badge.icon);
              const highestLevel = getHighestEarnedLevel(badge);
              const nextLevel = getNextLevel(badge);
              const percentage = nextLevel 
                ? Math.min((badge.progress / nextLevel.required) * 100, 100)
                : 100;
              return (
                <Card key={badge.id} className="border-chart-1/30" data-testid={`badge-${badge.id}`}>
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="rounded-full p-2 bg-chart-1/10">
                        <Icon className="h-5 w-5 text-chart-1" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{badge.name}</span>
                          <Badge variant="outline" className="text-xs text-chart-1 border-chart-1/30">
                            Level {highestLevel}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{badge.description}</p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleOpenEdit(badge)}
                        data-testid={`button-edit-badge-${badge.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                    {nextLevel && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Next: Level {nextLevel.level}</span>
                          <span className="font-mono">
                            {badge.progress}/{nextLevel.required}
                          </span>
                        </div>
                        <Progress value={percentage} className="h-1.5" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <Target className="h-5 w-5 text-muted-foreground" />
          In Progress ({inProgressBadges.length})
        </h3>
        {badges.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground" data-testid="text-no-badges">
              No badges yet. Create one to start tracking achievements!
            </CardContent>
          </Card>
        ) : inProgressBadges.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              All badges earned! Create more to continue tracking.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {inProgressBadges.map((badge) => {
              const Icon = getIcon(badge.icon);
              const nextLevel = getNextLevel(badge);
              const percentage = nextLevel 
                ? Math.min((badge.progress / nextLevel.required) * 100, 100)
                : 0;
              return (
                <Card key={badge.id} data-testid={`badge-${badge.id}`}>
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="rounded-full p-2 bg-muted">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-sm">{badge.name}</span>
                        <p className="text-xs text-muted-foreground mt-1">{badge.description}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleOpenEdit(badge)}
                          data-testid={`button-edit-badge-${badge.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setDeleteId(badge.id)}
                          data-testid={`button-delete-badge-${badge.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-chart-3" />
                        </Button>
                      </div>
                    </div>
                    {nextLevel && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Level {nextLevel.level}</span>
                          <span className="font-mono">
                            {badge.progress}/{nextLevel.required}
                          </span>
                        </div>
                        <Progress value={percentage} className="h-1.5" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] p-0">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle>{editingBadge ? "Edit Badge" : "Create Badge"}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[calc(90vh-120px)]">
            <div className="space-y-4 px-6 pb-4">
              <div className="space-y-2">
                <Label htmlFor="badge-name">Badge Name</Label>
                <Input
                  id="badge-name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g., Scripture Scholar I"
                  data-testid="input-badge-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="badge-description">Description</Label>
                <Textarea
                  id="badge-description"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="e.g., Read 30 Bible chapters"
                  rows={2}
                  className="resize-none"
                  data-testid="input-badge-description"
                />
              </div>

              <div className="space-y-2">
                <Label>Icon</Label>
                <div className="flex flex-wrap gap-2">
                  {iconOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <Button
                        key={option.value}
                        type="button"
                        size="icon"
                        variant={formIcon === option.value ? "default" : "outline"}
                        onClick={() => setFormIcon(option.value)}
                        data-testid={`button-icon-${option.value}`}
                      >
                        <Icon className="h-4 w-4" />
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="condition-type">Condition Type</Label>
                <Select
                  value={formConditionType}
                  onValueChange={(v) => setFormConditionType(v as BadgeConditionType)}
                >
                  <SelectTrigger data-testid="select-condition-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(conditionLabels) as BadgeConditionType[]).map((type) => (
                      <SelectItem key={type} value={type}>
                        {conditionLabels[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formConditionType === "taskCompletions" && (
                <div className="space-y-2">
                  <Label htmlFor="task-name">Task Name</Label>
                  <Input
                    id="task-name"
                    value={formTaskName}
                    onChange={(e) => setFormTaskName(e.target.value)}
                    placeholder="e.g., Bible study"
                    data-testid="input-task-name-badge"
                  />
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label>Level Requirements</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleAddLevel}
                    data-testid="button-add-level"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Level
                  </Button>
                </div>
                <div className="space-y-2">
                  {formLevels.map((levelValue, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-16">Level {index + 1}</span>
                      <Input
                        type="number"
                        value={levelValue}
                        onChange={(e) => handleLevelChange(index, e.target.value)}
                        min={1}
                        className="flex-1"
                        data-testid={`input-level-${index + 1}`}
                      />
                      {formLevels.length > 1 && (
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => handleRemoveLevel(index)}
                          data-testid={`button-remove-level-${index + 1}`}
                        >
                          <Trash2 className="h-4 w-4 text-chart-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!formName.trim()}
                  data-testid="button-save-badge"
                >
                  {editingBadge ? "Update Badge" : "Create Badge"}
                </Button>
              </DialogFooter>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Badge</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this badge? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
