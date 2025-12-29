import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOnboarding } from "@/contexts/OnboardingContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
  Sparkles,
  Loader2,
  AlertCircle,
  Check,
  TrendingUp,
  CalendarCheck,
  CheckCircle,
  Crown,
  RotateCw,
  HelpCircle,
} from "lucide-react";
import { HelpDialog } from "@/components/HelpDialog";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useDemo } from "@/contexts/DemoContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Task, AIGenerateBadgesResponse, AIGeneratedBadge, StampDefinition } from "@shared/schema";
import { PLATFORM_STAMPS } from "@shared/schema";
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
  loadStampProgressFromStorage,
  saveStampProgressToStorage,
  type StoredBadge,
  type StoredBadgeLevel,
  type StoredStampProgress,
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
    name: "Iron Will",
    description: "Complete workouts consistently",
    icon: "flame",
    conditionType: "taskCompletions",
    taskName: "Workout",
    levels: [
      { level: 1, required: 10, earned: true },
      { level: 2, required: 30, earned: true },
      { level: 3, required: 60, earned: false },
    ],
    progress: 42,
  },
  {
    id: "demo-2",
    name: "Bookworm",
    description: "Complete reading sessions consistently",
    icon: "book",
    conditionType: "taskCompletions",
    taskName: "Reading",
    levels: [
      { level: 1, required: 10, earned: true },
      { level: 2, required: 25, earned: false },
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
      { level: 1, required: 2, earned: true },
      { level: 2, required: 4, earned: false },
      { level: 3, required: 8, earned: false },
    ],
    progress: 3,
  },
  {
    id: "demo-4",
    name: "Clean Streak",
    description: "Days without penalties",
    icon: "shield",
    conditionType: "negativeFreeStreak",
    levels: [
      { level: 1, required: 7, earned: true },
      { level: 2, required: 14, earned: false },
    ],
    progress: 9,
  },
  {
    id: "demo-5",
    name: "Early Bird",
    description: "Complete morning meditation consistently",
    icon: "star",
    conditionType: "taskCompletions",
    taskName: "Morning Meditation",
    levels: [
      { level: 1, required: 7, earned: true },
      { level: 2, required: 21, earned: true },
      { level: 3, required: 50, earned: false },
    ],
    progress: 28,
  },
  {
    id: "demo-6",
    name: "Deep Focus",
    description: "Complete deep work sessions",
    icon: "target",
    conditionType: "taskCompletions",
    taskName: "Deep Work Session",
    levels: [
      { level: 1, required: 10, earned: true },
      { level: 2, required: 25, earned: false },
    ],
    progress: 15,
  },
  {
    id: "demo-7",
    name: "Hydration Hero",
    description: "Hit hydration goal consistently",
    icon: "heart",
    conditionType: "taskCompletions",
    taskName: "Hydration Goal",
    levels: [
      { level: 1, required: 7, earned: true },
      { level: 2, required: 30, earned: false },
    ],
    progress: 12,
  },
  {
    id: "demo-8",
    name: "Consistency King",
    description: "Perfect days in a row",
    icon: "zap",
    conditionType: "perfectDaysStreak",
    levels: [
      { level: 1, required: 3, earned: true },
      { level: 2, required: 7, earned: false },
      { level: 3, required: 14, earned: false },
    ],
    progress: 5,
  },
];

export default function RecognitionPage() {
  const { toast } = useToast();
  const { isDemo } = useDemo();
  const { triggerPageVisit, mainOnboardingComplete, showPageWalkthrough, visitedPages } = useOnboarding();
  
  useEffect(() => {
    if (mainOnboardingComplete) {
      triggerPageVisit("badges");
    }
  }, [mainOnboardingComplete, triggerPageVisit]);
  
  const [badges, setBadges] = useState<BadgeDefinition[]>([]);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBadge, setEditingBadge] = useState<BadgeDefinition | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formIcon, setFormIcon] = useState("award");
  const [formConditionType, setFormConditionType] = useState<BadgeConditionType>("taskCompletions");
  const [formTaskName, setFormTaskName] = useState("");
  const [formLevels, setFormLevels] = useState<string[]>(["10", "25", "50"]);

  // AI badge generation state
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiGeneratedBadges, setAiGeneratedBadges] = useState<AIGeneratedBadge[] | null>(null);
  const [aiSelectedBadges, setAiSelectedBadges] = useState<Set<number>>(new Set());

  // Fetch tasks for AI badge generation
  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/habit/tasks"],
    enabled: !isDemo,
  });

  // AI badge generation mutation
  const generateBadgesMutation = useMutation({
    mutationFn: async (data: { tasks: { name: string; category: string; priority: string }[]; existingBadges?: string[] }) => {
      const res = await apiRequest("POST", "/api/ai/generate-badges", data);
      return res.json() as Promise<AIGenerateBadgesResponse>;
    },
    onSuccess: (data) => {
      setAiGeneratedBadges(data.badges);
      setAiSelectedBadges(new Set(data.badges.map((_, i) => i)));
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to generate badges. Please try again.", variant: "destructive" });
    },
  });

  const handleOpenAiDialog = () => {
    setAiGeneratedBadges(null);
    setAiSelectedBadges(new Set());
    setAiDialogOpen(true);
  };

  const handleGenerateBadges = () => {
    if (tasks.length === 0) {
      toast({ title: "No tasks found", description: "Please create tasks first before generating badges.", variant: "destructive" });
      return;
    }
    generateBadgesMutation.mutate({
      tasks: tasks.map(t => ({ name: t.name, category: t.category, priority: t.priority })),
      existingBadges: badges.map(b => b.name),
    });
  };

  const toggleAiBadge = (idx: number) => {
    const newSet = new Set(aiSelectedBadges);
    if (newSet.has(idx)) {
      newSet.delete(idx);
    } else {
      newSet.add(idx);
    }
    setAiSelectedBadges(newSet);
  };

  const handleApplyAiBadges = () => {
    if (!aiGeneratedBadges) return;
    
    const newBadges: BadgeDefinition[] = [];
    aiSelectedBadges.forEach((idx) => {
      const badge = aiGeneratedBadges[idx];
      if (badge) {
        newBadges.push({
          id: String(Date.now() + Math.random()),
          name: badge.name,
          description: badge.description,
          icon: badge.icon,
          conditionType: badge.conditionType as BadgeConditionType,
          taskName: badge.taskName,
          levels: badge.levels.map(l => ({ ...l, earned: false })),
          progress: 0,
        });
      }
    });
    
    saveBadges([...badges, ...newBadges]);
    toast({ title: "Badges added!", description: `Added ${newBadges.length} new badges` });
    setAiDialogOpen(false);
    setAiGeneratedBadges(null);
  };

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

  // Stamp progress state
  const [stampProgress, setStampProgress] = useState<StoredStampProgress[]>([]);
  
  // Load stamp progress on mount
  useEffect(() => {
    if (!isDemo) {
      const stored = loadStampProgressFromStorage();
      setStampProgress(stored);
    }
  }, [isDemo]);

  // Helper to get stamp icon component
  const getStampIcon = (iconName: string) => {
    const iconMap: Record<string, typeof Award> = {
      "calendar-check": CalendarCheck,
      "target": Target,
      "flame": Flame,
      "rotate-cw": RotateCw,
      "check-circle": CheckCircle,
      "crown": Crown,
      "star": Star,
      "sparkles": Sparkles,
    };
    return iconMap[iconName] || Award;
  };

  // Get stamp progress for a specific stamp
  const getStampProgress = (stampId: string): { progress: number; earned: boolean } => {
    const found = stampProgress.find(s => s.stampId === stampId);
    return found || { progress: 0, earned: false };
  };

  // Rarity colors
  const rarityColors: Record<string, string> = {
    common: "text-muted-foreground border-muted-foreground/30",
    uncommon: "text-chart-2 border-chart-2/30",
    rare: "text-chart-1 border-chart-1/30",
    epic: "text-purple-500 border-purple-500/30",
    legendary: "text-yellow-500 border-yellow-500/30",
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Recognition</h2>
          <p className="text-muted-foreground text-sm">Track your achievements and community recognition</p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => {
          showPageWalkthrough("badges");
        }} data-testid="button-recognition-help">
          <HelpCircle className="h-5 w-5" />
        </Button>
      </div>
      <HelpDialog open={helpDialogOpen} onOpenChange={setHelpDialogOpen} currentPage="badges" />

      <Tabs defaultValue="focus-points" className="space-y-4">
        <TabsList>
          <TabsTrigger value="focus-points" data-testid="tab-focus-points">
            <TrendingUp className="h-4 w-4 mr-1.5" />
            Focus Points
          </TabsTrigger>
          <TabsTrigger value="badges" data-testid="tab-badges">
            <Award className="h-4 w-4 mr-1.5" />
            Badges
          </TabsTrigger>
          <TabsTrigger value="stamps" data-testid="tab-stamps">
            <Trophy className="h-4 w-4 mr-1.5" />
            Stamps
          </TabsTrigger>
        </TabsList>

        {/* Focus Points Tab */}
        <TabsContent value="focus-points" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                What are Focus Points?
              </CardTitle>
              <CardDescription>
                Your Focus Points (FP) represent your commitment to building better habits
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Focus Points are earned by completing tasks, hitting daily and weekly goals, and triggering boosters. 
                They reflect your dedication to personal growth and habit formation.
              </p>
              <div className="grid gap-4 sm:grid-cols-3">
                <Card className="bg-muted/50">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-sm font-medium mb-1">
                      <CheckCircle className="h-4 w-4 text-chart-2" />
                      Task Completions
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Earn points each time you complete a task. Higher priority tasks earn more points.
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-muted/50">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-sm font-medium mb-1">
                      <Zap className="h-4 w-4 text-chart-1" />
                      Boosters
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Trigger bonus points by hitting task frequency goals (e.g., workout 3x per week).
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-muted/50">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-sm font-medium mb-1">
                      <Target className="h-4 w-4 text-primary" />
                      Goal Streaks
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Build momentum by consistently hitting your daily and weekly point goals.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Badges Tab */}
        <TabsContent value="badges" className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h3 className="text-lg font-medium">Personal Badges</h3>
              <p className="text-sm text-muted-foreground">Create and track achievements tied to your tasks</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {!isDemo && (
                <Button
                  variant="outline"
                  onClick={handleOpenAiDialog}
                  className="bg-gradient-to-r from-primary/10 to-chart-3/10 hover:from-primary/20 hover:to-chart-3/20 border-primary/30"
                  data-testid="button-generate-badges-ai"
                >
                  <Sparkles className="h-4 w-4 mr-1" />
                  Generate with AI
                </Button>
              )}
              <Button onClick={handleOpenCreate} data-testid="button-create-badge">
                <Plus className="h-4 w-4 mr-1" />
                Create Badge
              </Button>
            </div>
          </div>

          {earnedBadges.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Trophy className="h-4 w-4 text-chart-1" />
                Earned ({earnedBadges.length})
              </h4>
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
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              In Progress ({inProgressBadges.length})
            </h4>
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
        </TabsContent>

        {/* Stamps Tab */}
        <TabsContent value="stamps" className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">Community Stamps</h3>
            <p className="text-sm text-muted-foreground">Platform-verified achievements with fixed criteria for all users</p>
          </div>

          {/* Earned Stamps */}
          {stampProgress.filter(s => s.earned).length > 0 && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Trophy className="h-4 w-4 text-chart-1" />
                Earned Stamps
              </h4>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {PLATFORM_STAMPS.filter(stamp => {
                  const progress = getStampProgress(stamp.id);
                  return progress.earned;
                }).map((stamp) => {
                  const Icon = getStampIcon(stamp.icon);
                  return (
                    <Card key={stamp.id} className="border-chart-1/30" data-testid={`stamp-${stamp.id}`}>
                      <CardContent className="pt-4 space-y-2">
                        <div className="flex items-start gap-3">
                          <div className="rounded-full p-2 bg-chart-1/10">
                            <Icon className="h-5 w-5 text-chart-1" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-sm">{stamp.name}</span>
                              <Badge variant="outline" className={cn("text-xs capitalize", rarityColors[stamp.rarity])}>
                                {stamp.rarity}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{stamp.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Available Stamps */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              Available Stamps
            </h4>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {PLATFORM_STAMPS.filter(stamp => {
                const progress = getStampProgress(stamp.id);
                return !progress.earned;
              }).map((stamp) => {
                const Icon = getStampIcon(stamp.icon);
                const progress = getStampProgress(stamp.id);
                const percentage = Math.min((progress.progress / stamp.requirement) * 100, 100);
                return (
                  <Card key={stamp.id} data-testid={`stamp-${stamp.id}`}>
                    <CardContent className="pt-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="rounded-full p-2 bg-muted">
                          <Icon className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">{stamp.name}</span>
                            <Badge variant="outline" className={cn("text-xs capitalize", rarityColors[stamp.rarity])}>
                              {stamp.rarity}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{stamp.description}</p>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-mono">{progress.progress}/{stamp.requirement}</span>
                        </div>
                        <Progress value={percentage} className="h-1.5" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </TabsContent>
      </Tabs>

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

      <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Generate Badges with AI
            </DialogTitle>
            <DialogDescription>
              AI will create achievement badges based on your tasks. Make sure your tasks are finalized before generating badges.
            </DialogDescription>
          </DialogHeader>

          {!aiGeneratedBadges && (
            <div className="py-4 space-y-4">
              <div className="rounded-md bg-chart-2/10 border border-chart-2/30 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-chart-2 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-chart-2">Before generating badges</p>
                    <p className="text-muted-foreground mt-1">
                      Make sure your tasks are finalized. Badges are based on your current tasks - if you change tasks later, 
                      you may want to update your badges to match.
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                <p>You currently have <span className="font-medium text-foreground">{tasks.length}</span> tasks configured.</p>
              </div>
            </div>
          )}

          {generateBadgesMutation.isPending && (
            <div className="py-8 flex flex-col items-center justify-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Generating badges based on your tasks...</p>
            </div>
          )}

          {aiGeneratedBadges && !generateBadgesMutation.isPending && (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Select which badges to add ({aiSelectedBadges.size} of {aiGeneratedBadges.length} selected):
                </p>
                {aiGeneratedBadges.map((badge, idx) => {
                  const Icon = getIcon(badge.icon);
                  const isSelected = aiSelectedBadges.has(idx);
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleAiBadge(idx)}
                      className={cn(
                        "p-3 rounded-md border cursor-pointer transition-colors hover-elevate",
                        isSelected ? "border-primary/50 bg-primary/5" : "border-border"
                      )}
                      data-testid={`ai-badge-suggestion-${idx}`}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleAiBadge(idx)}
                          className="mt-1"
                        />
                        <div className="rounded-full p-2 bg-muted">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{badge.name}</div>
                          <p className="text-xs text-muted-foreground mt-0.5">{badge.description}</p>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <Badge variant="outline" className="text-xs">
                              {badge.conditionType === "taskCompletions" ? "Task completions" :
                               badge.conditionType === "perfectDaysStreak" ? "Perfect days" :
                               badge.conditionType === "negativeFreeStreak" ? "Penalty-free" :
                               "Weekly streak"}
                            </Badge>
                            {badge.taskName && (
                              <Badge variant="secondary" className="text-xs">{badge.taskName}</Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {badge.levels.length} levels
                            </Badge>
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAiDialogOpen(false)}>
              Cancel
            </Button>
            {!aiGeneratedBadges ? (
              <Button
                onClick={handleGenerateBadges}
                disabled={generateBadgesMutation.isPending || tasks.length === 0}
                data-testid="button-ai-generate-badges"
              >
                {generateBadgesMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-1" />
                    Generate Badges
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleApplyAiBadges}
                disabled={aiSelectedBadges.size === 0}
                data-testid="button-apply-ai-badges"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add {aiSelectedBadges.size} Badge{aiSelectedBadges.size !== 1 ? "s" : ""}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
