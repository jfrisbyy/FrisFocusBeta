import { useState } from "react";
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

type BadgeConditionType = "taskCompletions" | "perfectDaysStreak" | "negativeFreeStreak" | "weeklyGoalStreak";

interface BadgeLevel {
  level: number;
  required: number;
  earned: boolean;
}

interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  conditionType: BadgeConditionType;
  taskName?: string;
  levels: BadgeLevel[];
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

// todo: remove mock functionality
const initialBadges: BadgeDefinition[] = [
  {
    id: "1",
    name: "Scripture Scholar",
    description: "Read Bible chapters",
    icon: "book",
    conditionType: "taskCompletions",
    taskName: "Bible study",
    levels: [
      { level: 1, required: 30, earned: true },
      { level: 2, required: 100, earned: false },
      { level: 3, required: 300, earned: false },
    ],
    progress: 45,
  },
  {
    id: "2",
    name: "Beast Mode",
    description: "Perfect days in a row",
    icon: "flame",
    conditionType: "perfectDaysStreak",
    levels: [
      { level: 1, required: 3, earned: true },
      { level: 2, required: 7, earned: false },
      { level: 3, required: 14, earned: false },
    ],
    progress: 5,
  },
  {
    id: "3",
    name: "Purified",
    description: "Negative-free days in a row",
    icon: "shield",
    conditionType: "negativeFreeStreak",
    levels: [
      { level: 1, required: 7, earned: false },
      { level: 2, required: 14, earned: false },
      { level: 3, required: 30, earned: false },
    ],
    progress: 6,
  },
  {
    id: "4",
    name: "Consistent Champion",
    description: "Hit weekly goal in a row",
    icon: "trophy",
    conditionType: "weeklyGoalStreak",
    levels: [
      { level: 1, required: 4, earned: false },
      { level: 2, required: 8, earned: false },
      { level: 3, required: 12, earned: false },
    ],
    progress: 3,
  },
  {
    id: "5",
    name: "Gym Warrior",
    description: "Complete gym sessions",
    icon: "zap",
    conditionType: "taskCompletions",
    taskName: "Gym session",
    levels: [
      { level: 1, required: 25, earned: false },
      { level: 2, required: 50, earned: false },
      { level: 3, required: 100, earned: false },
    ],
    progress: 23,
  },
];

export default function BadgesPage() {
  const { toast } = useToast();
  const [badges, setBadges] = useState<BadgeDefinition[]>(initialBadges);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBadge, setEditingBadge] = useState<BadgeDefinition | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formIcon, setFormIcon] = useState("award");
  const [formConditionType, setFormConditionType] = useState<BadgeConditionType>("taskCompletions");
  const [formTaskName, setFormTaskName] = useState("");
  const [formLevel1, setFormLevel1] = useState("10");
  const [formLevel2, setFormLevel2] = useState("25");
  const [formLevel3, setFormLevel3] = useState("50");

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
    setFormLevel1("10");
    setFormLevel2("25");
    setFormLevel3("50");
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
    setFormLevel1(badge.levels[0]?.required.toString() || "10");
    setFormLevel2(badge.levels[1]?.required.toString() || "25");
    setFormLevel3(badge.levels[2]?.required.toString() || "50");
    setDialogOpen(true);
  };

  const handleSave = () => {
    const level1 = parseInt(formLevel1, 10) || 10;
    const level2 = parseInt(formLevel2, 10) || 25;
    const level3 = parseInt(formLevel3, 10) || 50;

    if (editingBadge) {
      setBadges(badges.map(b =>
        b.id === editingBadge.id
          ? {
              ...b,
              name: formName,
              description: formDescription,
              icon: formIcon,
              conditionType: formConditionType,
              taskName: formConditionType === "taskCompletions" ? formTaskName : undefined,
              levels: [
                { level: 1, required: level1, earned: b.levels[0]?.earned || false },
                { level: 2, required: level2, earned: b.levels[1]?.earned || false },
                { level: 3, required: level3, earned: b.levels[2]?.earned || false },
              ],
            }
          : b
      ));
      toast({ title: "Badge updated", description: `"${formName}" has been updated` });
    } else {
      const newBadge: BadgeDefinition = {
        id: String(Date.now()),
        name: formName,
        description: formDescription,
        icon: formIcon,
        conditionType: formConditionType,
        taskName: formConditionType === "taskCompletions" ? formTaskName : undefined,
        levels: [
          { level: 1, required: level1, earned: false },
          { level: 2, required: level2, earned: false },
          { level: 3, required: level3, earned: false },
        ],
        progress: 0,
      };
      setBadges([...badges, newBadge]);
      toast({ title: "Badge created", description: `"${formName}" has been added` });
    }

    setDialogOpen(false);
    resetForm();
    setEditingBadge(null);
  };

  const handleDelete = () => {
    if (deleteId) {
      const badge = badges.find(b => b.id === deleteId);
      setBadges(badges.filter(b => b.id !== deleteId));
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
        {inProgressBadges.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No badges in progress. Create one to start tracking!
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
                <Label>Level Requirements</Label>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">Level 1</span>
                    <Input
                      type="number"
                      value={formLevel1}
                      onChange={(e) => setFormLevel1(e.target.value)}
                      min={1}
                      data-testid="input-level-1"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">Level 2</span>
                    <Input
                      type="number"
                      value={formLevel2}
                      onChange={(e) => setFormLevel2(e.target.value)}
                      min={1}
                      data-testid="input-level-2"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">Level 3</span>
                    <Input
                      type="number"
                      value={formLevel3}
                      onChange={(e) => setFormLevel3(e.target.value)}
                      min={1}
                      data-testid="input-level-3"
                    />
                  </div>
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
