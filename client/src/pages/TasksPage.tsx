import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import TaskList from "@/components/TaskList";
import { useToast } from "@/hooks/use-toast";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useDemo } from "@/contexts/DemoContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
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
import { Target, Pencil, Check, X, Plus, Trash2, AlertTriangle, TrendingDown, Tag, Calendar, Archive, Download, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { BoosterRule } from "@/components/BoosterRuleConfig";
import type { TaskPriority, PenaltyRule, PenaltyItem, Category, Season, SeasonWithData } from "@shared/schema";

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
  { id: "p1", name: "Missed workout", value: -10, category: "Penalties", negativeBoostEnabled: false, currentCount: 0, triggered: false },
  { id: "p2", name: "Skipped prayer", value: -5, category: "Penalties", negativeBoostEnabled: false, currentCount: 0, triggered: false },
  { id: "p3", name: "Ate junk food", value: -8, category: "Penalties", negativeBoostEnabled: true, timesThreshold: 3, period: "week", boostPenaltyPoints: 15, currentCount: 1, triggered: false },
  { id: "p4", name: "Too much screen time", value: -5, category: "Penalties", negativeBoostEnabled: true, timesThreshold: 4, period: "week", boostPenaltyPoints: 20, currentCount: 2, triggered: false },
];

export default function TasksPage() {
  const { toast } = useToast();
  const { isOnboarding } = useOnboarding();
  const { isDemo } = useDemo();
  const useMockData = isDemo || isOnboarding;
  
  // Initialize state from localStorage or use sample data during demo/onboarding
  const [tasks, setTasks] = useState<Task[]>(() => {
    if (useMockData) return sampleTasks;
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
    if (useMockData) return 50;
    return loadDailyGoalFromStorage();
  });
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState("");
  
  const [penalties, setPenalties] = useState<PenaltyItem[]>(() => {
    if (useMockData) return samplePenalties;
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
    if (useMockData) return sampleCategories;
    const stored = loadCategoriesFromStorage();
    return stored.length > 0 ? stored : [];
  });
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);

  // Seasons state
  const [seasonDialogOpen, setSeasonDialogOpen] = useState(false);
  const [seasonName, setSeasonName] = useState("");
  const [seasonDescription, setSeasonDescription] = useState("");
  
  // Track loaded season to prevent auto-save on initial load
  const lastLoadedSeasonIdRef = useRef<string | null>(null);
  const hasUserModifiedDataRef = useRef(false);
  const [seasonCreationMode, setSeasonCreationMode] = useState<"scratch" | "import">("scratch");
  const [importFromSeasonId, setImportFromSeasonId] = useState<string>("");
  const [importTasks, setImportTasks] = useState<string[]>([]);
  const [importCategories, setImportCategories] = useState<string[]>([]);
  const [importPenalties, setImportPenalties] = useState<string[]>([]);
  const [archiveSeasonId, setArchiveSeasonId] = useState<string | null>(null);

  // Fetch seasons from API (available to all authenticated users)
  const { data: seasons = [], isLoading: seasonsLoading } = useQuery<Season[]>({
    queryKey: ["/api/seasons"],
    enabled: !isDemo,
  });

  const activeSeason = seasons.find((s) => s.isActive);
  const isActiveSeasonArchived = activeSeason?.isArchived === true;
  const nonArchivedSeasons = seasons.filter((s) => !s.isArchived);
  const archivedSeasons = seasons.filter((s) => s.isArchived);

  // Fetch season data when a season is selected for import
  const { data: importSeasonData, isLoading: importSeasonDataLoading } = useQuery<SeasonWithData>({
    queryKey: ["/api/seasons", importFromSeasonId, "data"],
    enabled: !!importFromSeasonId && seasonCreationMode === "import",
  });

  // Fetch active season data to load tasks/categories/penalties from it
  const { data: activeSeasonData, isLoading: activeSeasonDataLoading } = useQuery<SeasonWithData>({
    queryKey: ["/api/seasons", activeSeason?.id, "data"],
    enabled: !!activeSeason?.id && !isDemo,
  });

  // Create season mutation
  const createSeasonMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      const res = await apiRequest("POST", "/api/seasons", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seasons"] });
      toast({ title: "Season created", description: `"${seasonName}" has been created` });
      setSeasonDialogOpen(false);
      setSeasonName("");
      setSeasonDescription("");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create season", variant: "destructive" });
    },
  });

  // Activate season mutation
  const activateSeasonMutation = useMutation({
    mutationFn: async (seasonId: string) => {
      const res = await apiRequest("PUT", `/api/seasons/${seasonId}/activate`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seasons"] });
      toast({ title: "Season activated", description: "Your active season has been changed" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to activate season", variant: "destructive" });
    },
  });

  // Deactivate season mutation
  const deactivateSeasonMutation = useMutation({
    mutationFn: async (seasonId: string) => {
      const res = await apiRequest("PUT", `/api/seasons/${seasonId}/deactivate`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seasons"] });
      toast({ title: "Season deactivated", description: "No season is now active" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to deactivate season", variant: "destructive" });
    },
  });

  // Archive season mutation
  const archiveSeasonMutation = useMutation({
    mutationFn: async (seasonId: string) => {
      const res = await apiRequest("PUT", `/api/seasons/${seasonId}/archive`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seasons"] });
      toast({ title: "Season archived", description: "The season is now read-only" });
      setArchiveSeasonId(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to archive season", variant: "destructive" });
    },
  });

  // Import tasks to season mutation
  const importToSeasonMutation = useMutation({
    mutationFn: async (data: { seasonId: string; fromSeasonId: string; taskIds: string[]; categoryIds: string[]; penaltyIds: string[] }) => {
      const res = await apiRequest("POST", `/api/seasons/${data.seasonId}/import`, {
        fromSeasonId: data.fromSeasonId,
        taskIds: data.taskIds,
        categoryIds: data.categoryIds,
        penaltyIds: data.penaltyIds,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seasons"] });
      toast({ title: "Tasks imported", description: "Selected items have been imported to your new season" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to import tasks", variant: "destructive" });
    },
  });

  // Save tasks to season mutation
  const saveTasksToSeasonMutation = useMutation({
    mutationFn: async (data: { seasonId: string; tasks: any[] }) => {
      const res = await apiRequest("PUT", `/api/seasons/${data.seasonId}/tasks`, { tasks: data.tasks });
      return res.json();
    },
  });

  // Save categories to season mutation
  const saveCategoriesToSeasonMutation = useMutation({
    mutationFn: async (data: { seasonId: string; categories: any[] }) => {
      const res = await apiRequest("PUT", `/api/seasons/${data.seasonId}/categories`, { categories: data.categories });
      return res.json();
    },
  });

  // Save penalties to season mutation
  const savePenaltiesToSeasonMutation = useMutation({
    mutationFn: async (data: { seasonId: string; penalties: any[] }) => {
      const res = await apiRequest("PUT", `/api/seasons/${data.seasonId}/penalties`, { penalties: data.penalties });
      return res.json();
    },
  });

  const handleOpenCreateSeason = () => {
    setSeasonName("");
    setSeasonDescription("");
    setSeasonCreationMode("scratch");
    setImportFromSeasonId("");
    setImportTasks([]);
    setImportCategories([]);
    setImportPenalties([]);
    setSeasonDialogOpen(true);
  };

  const handleSaveSeason = async () => {
    if (!seasonName.trim()) return;
    
    try {
      // Create the season first
      const res = await apiRequest("POST", "/api/seasons", {
        name: seasonName.trim(),
        description: seasonDescription.trim() || undefined,
      });
      const newSeason = await res.json();
      
      // If import mode with selected items, import them
      if (seasonCreationMode === "import" && importFromSeasonId && (importTasks.length > 0 || importCategories.length > 0 || importPenalties.length > 0)) {
        await importToSeasonMutation.mutateAsync({
          seasonId: newSeason.id,
          fromSeasonId: importFromSeasonId,
          taskIds: importTasks,
          categoryIds: importCategories,
          penaltyIds: importPenalties,
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/seasons"] });
      toast({ title: "Season created", description: `"${seasonName}" has been created` });
      setSeasonDialogOpen(false);
      setSeasonName("");
      setSeasonDescription("");
      setSeasonCreationMode("scratch");
      setImportFromSeasonId("");
      setImportTasks([]);
      setImportCategories([]);
      setImportPenalties([]);
    } catch (error) {
      toast({ title: "Error", description: "Failed to create season", variant: "destructive" });
    }
  };

  const handleArchiveSeason = () => {
    if (archiveSeasonId) {
      archiveSeasonMutation.mutate(archiveSeasonId);
    }
  };

  const toggleImportTask = (taskId: string) => {
    setImportTasks(prev => 
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
  };

  const toggleImportCategory = (categoryId: string) => {
    setImportCategories(prev => 
      prev.includes(categoryId) ? prev.filter(id => id !== categoryId) : [...prev, categoryId]
    );
  };

  const toggleImportPenalty = (penaltyId: string) => {
    setImportPenalties(prev => 
      prev.includes(penaltyId) ? prev.filter(id => id !== penaltyId) : [...prev, penaltyId]
    );
  };

  const selectAllImports = () => {
    if (importSeasonData) {
      setImportTasks(importSeasonData.tasks.map(t => t.id));
      setImportCategories(importSeasonData.categories.map(c => c.id));
      setImportPenalties(importSeasonData.penalties.map(p => p.id));
    }
  };

  const clearAllImports = () => {
    setImportTasks([]);
    setImportCategories([]);
    setImportPenalties([]);
  };

  const handleSeasonChange = (value: string) => {
    if (value === "none") {
      if (activeSeason) {
        deactivateSeasonMutation.mutate(activeSeason.id);
      }
    } else {
      activateSeasonMutation.mutate(value);
    }
  };

  // Persist tasks to localStorage whenever they change (skip during demo/onboarding)
  useEffect(() => {
    if (useMockData) return;
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
  }, [tasks, useMockData]);

  // Persist categories to localStorage whenever they change (skip during demo/onboarding)
  useEffect(() => {
    if (useMockData) return;
    const storedCategories: StoredCategory[] = categories.map(c => ({
      id: c.id,
      name: c.name,
    }));
    saveCategoriesToStorage(storedCategories);
  }, [categories, useMockData]);

  // Persist penalties to localStorage whenever they change (skip during demo/onboarding)
  useEffect(() => {
    if (useMockData) return;
    const storedPenalties: StoredPenalty[] = penalties.map(p => ({
      id: p.id,
      name: p.name,
      value: p.value,
    }));
    savePenaltiesToStorage(storedPenalties);
  }, [penalties, useMockData]);

  // Persist daily goal to localStorage whenever it changes (skip during demo/onboarding)
  useEffect(() => {
    if (useMockData) return;
    saveDailyGoalToStorage(dailyGoal);
  }, [dailyGoal, useMockData]);

  // Load tasks/categories/penalties from active season when it changes
  useEffect(() => {
    if (useMockData || !activeSeasonData) return;
    
    // Mark this season as loaded to prevent auto-save
    lastLoadedSeasonIdRef.current = activeSeasonData.id;
    hasUserModifiedDataRef.current = false;
    
    // Load tasks from season
    const seasonTasks: Task[] = activeSeasonData.tasks.map(t => ({
      id: t.id,
      name: t.name,
      value: t.value,
      category: t.category,
      priority: t.priority as TaskPriority,
      boosterRule: t.boosterRule as BoosterRule | undefined,
      penaltyRule: t.penaltyRule as PenaltyRule | undefined,
    }));
    setTasks(seasonTasks);
    
    // Load categories from season
    const seasonCategories: Category[] = activeSeasonData.categories.map(c => ({
      id: c.id,
      name: c.name,
    }));
    setCategories(seasonCategories);
    
    // Load penalties from season
    const seasonPenalties: PenaltyItem[] = activeSeasonData.penalties.map(p => ({
      id: p.id,
      name: p.name,
      value: p.value,
      category: "Penalties",
      negativeBoostEnabled: p.negativeBoostEnabled || false,
      timesThreshold: p.timesThreshold || undefined,
      period: p.period as "week" | "month" | undefined,
      boostPenaltyPoints: p.boostPenaltyPoints || undefined,
      currentCount: 0,
      triggered: false,
    }));
    setPenalties(seasonPenalties);
    
    // Load weekly goal from season
    if (activeSeasonData.weeklyGoal) {
      setDailyGoal(Math.round(activeSeasonData.weeklyGoal / 7));
    }
  }, [activeSeasonData, useMockData]);

  // Save tasks to active season when they change (only if user has modified data)
  useEffect(() => {
    if (useMockData || !activeSeason?.id || isActiveSeasonArchived || activeSeasonDataLoading) return;
    if (!hasUserModifiedDataRef.current) return;
    
    const tasksToSave = tasks.map(t => ({
      name: t.name,
      value: t.value,
      category: t.category,
      priority: t.priority,
      boosterRule: t.boosterRule,
      penaltyRule: t.penaltyRule,
    }));
    
    saveTasksToSeasonMutation.mutate({ seasonId: activeSeason.id, tasks: tasksToSave });
  }, [tasks, activeSeason?.id, isActiveSeasonArchived, activeSeasonDataLoading, useMockData]);

  // Save categories to active season when they change (only if user has modified data)
  useEffect(() => {
    if (useMockData || !activeSeason?.id || isActiveSeasonArchived || activeSeasonDataLoading) return;
    if (!hasUserModifiedDataRef.current) return;
    
    const categoriesToSave = categories.map(c => ({ name: c.name }));
    saveCategoriesToSeasonMutation.mutate({ seasonId: activeSeason.id, categories: categoriesToSave });
  }, [categories, activeSeason?.id, isActiveSeasonArchived, activeSeasonDataLoading, useMockData]);

  // Save penalties to active season when they change (only if user has modified data)
  useEffect(() => {
    if (useMockData || !activeSeason?.id || isActiveSeasonArchived || activeSeasonDataLoading) return;
    if (!hasUserModifiedDataRef.current) return;
    
    const penaltiesToSave = penalties.map(p => ({
      name: p.name,
      value: p.value,
      negativeBoostEnabled: p.negativeBoostEnabled,
      timesThreshold: p.timesThreshold,
      period: p.period,
      boostPenaltyPoints: p.boostPenaltyPoints,
    }));
    savePenaltiesToSeasonMutation.mutate({ seasonId: activeSeason.id, penalties: penaltiesToSave });
  }, [penalties, activeSeason?.id, isActiveSeasonArchived, activeSeasonDataLoading, useMockData]);

  const usedCategoryNames = new Set(tasks.map(t => t.category));
  const categoryNames = categories.map(c => c.name);

  const handleAdd = (task: Omit<Task, "id">) => {
    if (isActiveSeasonArchived) return;
    hasUserModifiedDataRef.current = true;
    const id = String(Date.now());
    setTasks([...tasks, { ...task, id }]);
    toast({
      title: "Task added",
      description: `"${task.name}" has been added as ${task.priority.replace(/([A-Z])/g, " $1").toLowerCase()}`,
    });
  };

  const handleEdit = (id: string, task: Omit<Task, "id">) => {
    if (isActiveSeasonArchived) return;
    hasUserModifiedDataRef.current = true;
    setTasks(tasks.map((t) => (t.id === id ? { ...task, id } : t)));
    toast({
      title: "Task updated",
      description: `"${task.name}" has been updated`,
    });
  };

  const handleDelete = (id: string) => {
    if (isActiveSeasonArchived) return;
    hasUserModifiedDataRef.current = true;
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
    if (isActiveSeasonArchived) return;
    hasUserModifiedDataRef.current = true;
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
    if (isActiveSeasonArchived) return;
    if (deletePenaltyId) {
      hasUserModifiedDataRef.current = true;
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
    if (isActiveSeasonArchived) return;
    hasUserModifiedDataRef.current = true;
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
    if (isActiveSeasonArchived) return;
    if (deleteCategoryId) {
      hasUserModifiedDataRef.current = true;
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl">
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

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Season
              </div>
              {!isDemo && (
                <Button size="sm" variant="ghost" onClick={handleOpenCreateSeason} data-testid="button-add-season">
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isDemo ? (
              <span className="text-sm text-muted-foreground">Sign in to use seasons</span>
            ) : seasonsLoading ? (
              <span className="text-sm text-muted-foreground">Loading...</span>
            ) : (
              <div className="space-y-2">
                <Select
                  value={activeSeason?.id || "none"}
                  onValueChange={handleSeasonChange}
                  disabled={activateSeasonMutation.isPending || deactivateSeasonMutation.isPending}
                >
                  <SelectTrigger data-testid="select-season">
                    <SelectValue placeholder="Select a season" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No active season</SelectItem>
                    {nonArchivedSeasons.length > 0 && (
                      <>
                        {nonArchivedSeasons.map((season) => (
                          <SelectItem key={season.id} value={season.id}>
                            {season.name} {season.isActive ? "(Active)" : ""}
                          </SelectItem>
                        ))}
                      </>
                    )}
                    {archivedSeasons.length > 0 && (
                      <>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Archived</div>
                        {archivedSeasons.map((season) => (
                          <SelectItem key={season.id} value={season.id} className="text-muted-foreground">
                            {season.name} (Archived)
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
                {isActiveSeasonArchived && (
                  <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                    <Archive className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">This season is archived (read-only)</span>
                  </div>
                )}
                {activeSeason?.description && (
                  <p className="text-xs text-muted-foreground">{activeSeason.description}</p>
                )}
                {activeSeason && !isActiveSeasonArchived && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => setArchiveSeasonId(activeSeason.id)}
                    data-testid="button-archive-season"
                  >
                    <Archive className="h-4 w-4 mr-1" />
                    Archive Season
                  </Button>
                )}
                {seasons.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Create seasons to organize your tasks by time periods
                  </p>
                )}
              </div>
            )}
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

      <Dialog open={seasonDialogOpen} onOpenChange={setSeasonDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Season</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="season-name">Name</Label>
              <Input
                id="season-name"
                value={seasonName}
                onChange={(e) => setSeasonName(e.target.value)}
                placeholder="e.g., Q1 2025, Summer Focus"
                data-testid="input-season-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="season-description">Description (optional)</Label>
              <Textarea
                id="season-description"
                value={seasonDescription}
                onChange={(e) => setSeasonDescription(e.target.value)}
                placeholder="What's the focus of this season?"
                rows={2}
                data-testid="input-season-description"
              />
            </div>
            
            <div className="space-y-3 border-t pt-4">
              <Label>How would you like to start?</Label>
              <RadioGroup
                value={seasonCreationMode}
                onValueChange={(v) => setSeasonCreationMode(v as "scratch" | "import")}
                className="space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="scratch" id="mode-scratch" data-testid="radio-scratch" />
                  <Label htmlFor="mode-scratch" className="font-normal cursor-pointer">
                    Start from scratch (empty season)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="import" id="mode-import" data-testid="radio-import" />
                  <Label htmlFor="mode-import" className="font-normal cursor-pointer">
                    Import from a previous season
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {seasonCreationMode === "import" && (
              <div className="space-y-4 border-l-2 border-muted pl-4">
                <div className="space-y-2">
                  <Label>Select season to import from</Label>
                  <Select value={importFromSeasonId} onValueChange={setImportFromSeasonId}>
                    <SelectTrigger data-testid="select-import-season">
                      <SelectValue placeholder="Choose a season" />
                    </SelectTrigger>
                    <SelectContent>
                      {seasons.map((season) => (
                        <SelectItem key={season.id} value={season.id}>
                          {season.name} {season.isArchived && "(Archived)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {importFromSeasonId && (
                  <>
                    {importSeasonDataLoading ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading season data...
                      </div>
                    ) : importSeasonData ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium">Select items to import</span>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={selectAllImports}>
                              Select All
                            </Button>
                            <Button size="sm" variant="outline" onClick={clearAllImports}>
                              Clear
                            </Button>
                          </div>
                        </div>

                        {importSeasonData.categories.length > 0 && (
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Categories</Label>
                            <div className="flex flex-wrap gap-2">
                              {importSeasonData.categories.map((cat) => (
                                <div
                                  key={cat.id}
                                  className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs cursor-pointer border ${
                                    importCategories.includes(cat.id)
                                      ? "bg-primary text-primary-foreground border-primary"
                                      : "bg-secondary border-transparent"
                                  }`}
                                  onClick={() => toggleImportCategory(cat.id)}
                                >
                                  <Checkbox
                                    checked={importCategories.includes(cat.id)}
                                    className="h-3 w-3"
                                  />
                                  <span>{cat.name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {importSeasonData.tasks.length > 0 && (
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Tasks ({importTasks.length}/{importSeasonData.tasks.length})</Label>
                            <div className="max-h-40 overflow-y-auto space-y-1 border rounded-md p-2">
                              {importSeasonData.tasks.map((task) => (
                                <div
                                  key={task.id}
                                  className={`flex items-center gap-2 px-2 py-1.5 rounded text-sm cursor-pointer ${
                                    importTasks.includes(task.id) ? "bg-muted" : ""
                                  }`}
                                  onClick={() => toggleImportTask(task.id)}
                                >
                                  <Checkbox checked={importTasks.includes(task.id)} className="h-4 w-4" />
                                  <span className="flex-1">{task.name}</span>
                                  <span className="text-xs text-muted-foreground">{task.value} pts</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {importSeasonData.penalties.length > 0 && (
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Penalties ({importPenalties.length}/{importSeasonData.penalties.length})</Label>
                            <div className="max-h-32 overflow-y-auto space-y-1 border rounded-md p-2">
                              {importSeasonData.penalties.map((penalty) => (
                                <div
                                  key={penalty.id}
                                  className={`flex items-center gap-2 px-2 py-1.5 rounded text-sm cursor-pointer ${
                                    importPenalties.includes(penalty.id) ? "bg-muted" : ""
                                  }`}
                                  onClick={() => toggleImportPenalty(penalty.id)}
                                >
                                  <Checkbox checked={importPenalties.includes(penalty.id)} className="h-4 w-4" />
                                  <span className="flex-1">{penalty.name}</span>
                                  <span className="text-xs text-chart-3">{penalty.value} pts</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : null}
                  </>
                )}
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSeasonDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveSeason}
              disabled={!seasonName.trim() || createSeasonMutation.isPending || importToSeasonMutation.isPending}
              data-testid="button-save-season"
            >
              {createSeasonMutation.isPending || importToSeasonMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Season"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!archiveSeasonId} onOpenChange={(open) => !open && setArchiveSeasonId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Season</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive this season? Archived seasons become read-only and cannot be edited. You can still view them and import tasks from them into new seasons.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchiveSeason} disabled={archiveSeasonMutation.isPending}>
              {archiveSeasonMutation.isPending ? "Archiving..." : "Archive Season"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
