import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import TaskList from "@/components/TaskList";
import { useToast } from "@/hooks/use-toast";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useDemo } from "@/contexts/DemoContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
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
import { Target, Pencil, Check, X, Plus, Trash2, AlertTriangle, TrendingDown, Tag, Calendar, Archive, Download, Loader2, Sparkles, Maximize2, Minimize2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { BoosterRule } from "@/components/BoosterRuleConfig";
import type { TaskPriority, PenaltyRule, PenaltyItem, Category, Season, SeasonWithData, TaskTier, AIGenerateTasksResponse, AIGeneratedTask, AIGeneratedPenalty, AIGeneratedCategory, AIConversationState, AIConversationMessage, AIConversationResponse } from "@shared/schema";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, MessageSquare, User } from "lucide-react";

interface Task {
  id: string;
  name: string;
  value: number;
  category: string;
  priority: TaskPriority;
  group?: string;
  boosterRule?: BoosterRule;
  penaltyRule?: PenaltyRule;
  tiers?: TaskTier[];
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

// API response types for habit data
interface ApiTask {
  id: string;
  userId: string;
  name: string;
  value: number;
  category: string;
  priority: string;
  boostEnabled: boolean | null;
  boostThreshold: number | null;
  boostPeriod: string | null;
  boostPoints: number | null;
}

interface ApiCategory {
  id: string;
  userId: string;
  name: string;
  color: string | null;
}

interface ApiPenalty {
  id: string;
  userId: string;
  name: string;
  value: number;
}

interface ApiSettings {
  id: string;
  userId: string;
  dailyGoal: number;
  weeklyGoal: number;
  userName: string | null;
  encouragementMessage: string | null;
  penaltyBoostEnabled: boolean | null;
  penaltyBoostThreshold: number | null;
  penaltyBoostPeriod: string | null;
  penaltyBoostPoints: number | null;
}

export default function TasksPage() {
  const { toast } = useToast();
  const { isOnboarding } = useOnboarding();
  const { isDemo } = useDemo();
  const useMockData = isDemo || isOnboarding;
  
  // Initialize state - will be populated from API or sample data
  const [tasks, setTasks] = useState<Task[]>(() => useMockData ? sampleTasks : []);
  const [dailyGoal, setDailyGoal] = useState(() => useMockData ? 50 : 50);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState("");
  
  const [penalties, setPenalties] = useState<PenaltyItem[]>(() => useMockData ? samplePenalties : []);
  const [penaltyDialogOpen, setPenaltyDialogOpen] = useState(false);
  const [editingPenalty, setEditingPenalty] = useState<PenaltyItem | null>(null);
  const [penaltyName, setPenaltyName] = useState("");
  const [penaltyValue, setPenaltyValue] = useState("-5");
  const [deletePenaltyId, setDeletePenaltyId] = useState<string | null>(null);
  
  const [penaltyBoostEnabled, setPenaltyBoostEnabled] = useState(false);
  const [penaltyBoostThreshold, setPenaltyBoostThreshold] = useState("3");
  const [penaltyBoostPeriod, setPenaltyBoostPeriod] = useState<"week" | "month">("week");
  const [penaltyBoostPoints, setPenaltyBoostPoints] = useState("10");

  const [categories, setCategories] = useState<Category[]>(() => useMockData ? sampleCategories : []);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);

  // Seasons state
  const [seasonDialogOpen, setSeasonDialogOpen] = useState(false);
  const [seasonName, setSeasonName] = useState("");
  const [seasonDescription, setSeasonDescription] = useState("");
  const [welcomeSeasonDialogOpen, setWelcomeSeasonDialogOpen] = useState(false);
  const [firstSeasonName, setFirstSeasonName] = useState("");
  
  // Track loaded season to prevent auto-save on initial load
  const lastLoadedSeasonIdRef = useRef<string | null>(null);
  const hasUserModifiedDataRef = useRef(false);
  const [seasonCreationMode, setSeasonCreationMode] = useState<"scratch" | "import">("scratch");
  const [importFromSeasonId, setImportFromSeasonId] = useState<string>("");
  const [importTasks, setImportTasks] = useState<string[]>([]);
  const [importCategories, setImportCategories] = useState<string[]>([]);
  const [importPenalties, setImportPenalties] = useState<string[]>([]);
  const [archiveSeasonId, setArchiveSeasonId] = useState<string | null>(null);

  // AI task generation state - conversational flow
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiDialogStep, setAiDialogStep] = useState<"chat" | "preview">("chat");
  const [aiDialogFullscreen, setAiDialogFullscreen] = useState(false);
  const [aiMessages, setAiMessages] = useState<AIConversationMessage[]>([]);
  const [aiConversationState, setAiConversationState] = useState<AIConversationState>({
    currentStep: "vision",
    goals: [],
    challenges: [],
    badHabits: [],
    hobbies: [],
  });
  const [aiUserInput, setAiUserInput] = useState("");
  const [aiGeneratedData, setAiGeneratedData] = useState<AIGenerateTasksResponse | null>(null);
  const [aiSelectedTasks, setAiSelectedTasks] = useState<Set<number>>(new Set());
  const [aiSelectedPenalties, setAiSelectedPenalties] = useState<Set<number>>(new Set());
  const [aiSelectedCategories, setAiSelectedCategories] = useState<Set<number>>(new Set());
  const aiChatEndRef = useRef<HTMLDivElement>(null);

  // Fetch seasons from API (available to all authenticated users)
  const { data: seasons = [], isLoading: seasonsLoading } = useQuery<Season[]>({
    queryKey: ["/api/seasons"],
    enabled: !isDemo,
  });

  const activeSeason = seasons.find((s) => s.isActive);
  const isActiveSeasonArchived = activeSeason?.isArchived === true;
  const nonArchivedSeasons = seasons.filter((s) => !s.isArchived);
  const archivedSeasons = seasons.filter((s) => s.isArchived);

  // Show welcome season dialog for new users with no seasons
  useEffect(() => {
    if (!useMockData && !seasonsLoading && seasons.length === 0) {
      setWelcomeSeasonDialogOpen(true);
    }
  }, [useMockData, seasonsLoading, seasons.length]);

  // Create first season mutation (with auto-activate)
  const createFirstSeasonMutation = useMutation({
    mutationFn: async (data: { name: string }) => {
      const res = await apiRequest("POST", "/api/seasons", data);
      const newSeason = await res.json();
      // Auto-activate the first season
      await apiRequest("PUT", `/api/seasons/${newSeason.id}/activate`);
      return newSeason;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seasons"] });
      toast({ title: "Season created!", description: "Your first season is ready. Start adding your tasks!" });
      setWelcomeSeasonDialogOpen(false);
      setFirstSeasonName("");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create season", variant: "destructive" });
    },
  });

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

  // Update season settings mutation (for weeklyGoal)
  const updateSeasonSettingsMutation = useMutation({
    mutationFn: async (data: { seasonId: string; weeklyGoal: number }) => {
      const res = await apiRequest("PUT", `/api/seasons/${data.seasonId}/settings`, { weeklyGoal: data.weeklyGoal });
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/seasons"] });
      queryClient.invalidateQueries({ queryKey: ["/api/seasons", variables.seasonId, "data"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update season goal", variant: "destructive" });
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
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/seasons"] });
      queryClient.invalidateQueries({ queryKey: ["/api/seasons", variables.seasonId, "data"] });
      queryClient.invalidateQueries({ queryKey: ["/api/habit/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/habit/penalties"] });
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
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/seasons"] });
      queryClient.invalidateQueries({ queryKey: ["/api/seasons", variables.seasonId, "data"] });
      queryClient.invalidateQueries({ queryKey: ["/api/habit/tasks"] });
    },
  });

  // Save categories to season mutation
  const saveCategoriesToSeasonMutation = useMutation({
    mutationFn: async (data: { seasonId: string; categories: any[] }) => {
      const res = await apiRequest("PUT", `/api/seasons/${data.seasonId}/categories`, { categories: data.categories });
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/seasons"] });
      queryClient.invalidateQueries({ queryKey: ["/api/seasons", variables.seasonId, "data"] });
    },
  });

  // Save penalties to season mutation
  const savePenaltiesToSeasonMutation = useMutation({
    mutationFn: async (data: { seasonId: string; penalties: any[] }) => {
      const res = await apiRequest("PUT", `/api/seasons/${data.seasonId}/penalties`, { penalties: data.penalties });
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/seasons"] });
      queryClient.invalidateQueries({ queryKey: ["/api/seasons", variables.seasonId, "data"] });
      queryClient.invalidateQueries({ queryKey: ["/api/habit/penalties"] });
    },
  });

  // AI conversation mutation - for multi-turn chat
  const aiConversationMutation = useMutation({
    mutationFn: async (data: { message: string; conversationState: AIConversationState; messageHistory: AIConversationMessage[] }) => {
      const res = await apiRequest("POST", "/api/ai/task-conversation", data);
      return res.json() as Promise<AIConversationResponse>;
    },
    onSuccess: (data) => {
      // Add assistant response to messages
      setAiMessages(prev => [...prev, { role: "assistant", content: data.assistantMessage, timestamp: Date.now() }]);
      setAiConversationState(data.updatedState);
      
      // Scroll to bottom
      setTimeout(() => aiChatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to get AI response. Please try again.", variant: "destructive" });
    },
  });

  // AI finalize mutation - generate tasks from conversation
  const aiFinalizeMutation = useMutation({
    mutationFn: async (data: { conversationState: AIConversationState; existingCategories?: string[] }) => {
      const res = await apiRequest("POST", "/api/ai/task-conversation/finalize", data);
      return res.json() as Promise<AIGenerateTasksResponse>;
    },
    onSuccess: (data) => {
      setAiGeneratedData(data);
      setAiSelectedTasks(new Set(data.tasks.map((_, i) => i)));
      setAiSelectedPenalties(new Set(data.penalties.map((_, i) => i)));
      setAiSelectedCategories(new Set(data.categories.map((_, i) => i)));
      setAiDialogStep("preview");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to generate tasks. Please try again.", variant: "destructive" });
    },
  });

  const handleOpenAiDialog = () => {
    // Reset all AI state for a fresh conversation
    setAiMessages([{
      role: "assistant",
      content: "Hi! I'm here to help you design habits that will shape your ideal life over the next 6 months. Let's start with the big picture - what does your ideal life look like? What goals are you working toward? Tell me about the areas that matter most to you.",
      timestamp: Date.now(),
    }]);
    setAiConversationState({
      currentStep: "vision",
      goals: [],
      challenges: [],
      badHabits: [],
      hobbies: [],
    });
    setAiUserInput("");
    setAiGeneratedData(null);
    setAiDialogStep("chat");
    setAiSelectedTasks(new Set());
    setAiSelectedPenalties(new Set());
    setAiSelectedCategories(new Set());
    setAiDialogOpen(true);
  };

  const handleSendMessage = () => {
    const trimmed = aiUserInput.trim();
    if (!trimmed || aiConversationMutation.isPending) return;
    
    // Add user message to list
    const userMessage: AIConversationMessage = { role: "user", content: trimmed, timestamp: Date.now() };
    setAiMessages(prev => [...prev, userMessage]);
    setAiUserInput("");
    
    // Send to API
    aiConversationMutation.mutate({
      message: trimmed,
      conversationState: aiConversationState,
      messageHistory: aiMessages,
    });
    
    // Scroll to bottom
    setTimeout(() => aiChatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const handleGenerateFromConversation = () => {
    aiFinalizeMutation.mutate({
      conversationState: aiConversationState,
      existingCategories: categories.map(c => c.name),
    });
  };

  const handleApplyAiResults = async () => {
    if (!aiGeneratedData || !activeSeason) return;
    
    // Build new data from AI selections
    const newCategories: Category[] = [];
    aiSelectedCategories.forEach((idx) => {
      const cat = aiGeneratedData.categories[idx];
      if (cat && !categories.some(c => c.name === cat.name)) {
        newCategories.push({ id: String(Date.now() + Math.random()), name: cat.name });
      }
    });
    
    const newTasks: Task[] = [];
    aiSelectedTasks.forEach((idx) => {
      const task = aiGeneratedData.tasks[idx];
      if (task) {
        newTasks.push({
          id: String(Date.now() + Math.random()),
          name: task.name,
          value: task.value,
          category: task.category,
          priority: task.priority,
          boosterRule: task.boosterRule || undefined,
        });
      }
    });
    
    const newPenalties: PenaltyItem[] = [];
    aiSelectedPenalties.forEach((idx) => {
      const penalty = aiGeneratedData.penalties[idx];
      if (penalty) {
        newPenalties.push({
          id: String(Date.now() + Math.random()),
          name: penalty.name,
          value: penalty.value,
          category: "Penalties",
          negativeBoostEnabled: false,
          currentCount: 0,
          triggered: false,
        });
      }
    });
    
    // Update local state
    const updatedCategories = [...categories, ...newCategories];
    const updatedTasks = [...tasks, ...newTasks];
    const updatedPenalties = [...penalties, ...newPenalties];
    
    setCategories(updatedCategories);
    setTasks(updatedTasks);
    setPenalties(updatedPenalties);
    
    // Directly call mutations to persist data (don't rely on auto-save)
    try {
      if (newCategories.length > 0) {
        const categoriesToSave = updatedCategories.map(c => ({ name: c.name }));
        await saveCategoriesToSeasonMutation.mutateAsync({ seasonId: activeSeason.id, categories: categoriesToSave });
      }
      
      if (newTasks.length > 0) {
        const tasksToSave = updatedTasks.map(t => ({
          name: t.name,
          value: t.value,
          category: t.category,
          priority: t.priority,
          boosterRule: t.boosterRule,
          penaltyRule: t.penaltyRule,
          tiers: t.tiers,
        }));
        await saveTasksToSeasonMutation.mutateAsync({ seasonId: activeSeason.id, tasks: tasksToSave });
      }
      
      if (newPenalties.length > 0) {
        const penaltiesToSave = updatedPenalties.map(p => ({
          name: p.name,
          value: p.value,
          negativeBoostEnabled: p.negativeBoostEnabled,
          timesThreshold: p.timesThreshold,
          period: p.period,
          boostPenaltyPoints: p.boostPenaltyPoints,
        }));
        await savePenaltiesToSeasonMutation.mutateAsync({ seasonId: activeSeason.id, penalties: penaltiesToSave });
      }
      
      toast({ 
        title: "Tasks added", 
        description: `Added ${newTasks.length} tasks, ${newPenalties.length} penalties, and ${newCategories.length} categories from AI suggestions` 
      });
    } catch (error) {
      toast({ 
        title: "Error saving", 
        description: "Some items may not have been saved. Please try again.", 
        variant: "destructive" 
      });
    }
    
    setAiDialogOpen(false);
  };

  const toggleAiTask = (idx: number) => {
    const newSet = new Set(aiSelectedTasks);
    if (newSet.has(idx)) {
      newSet.delete(idx);
    } else {
      newSet.add(idx);
    }
    setAiSelectedTasks(newSet);
  };

  const toggleAiPenalty = (idx: number) => {
    const newSet = new Set(aiSelectedPenalties);
    if (newSet.has(idx)) {
      newSet.delete(idx);
    } else {
      newSet.add(idx);
    }
    setAiSelectedPenalties(newSet);
  };

  const toggleAiCategory = (idx: number) => {
    const newSet = new Set(aiSelectedCategories);
    if (newSet.has(idx)) {
      newSet.delete(idx);
    } else {
      newSet.add(idx);
    }
    setAiSelectedCategories(newSet);
  };

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

  // Fetch tasks from API (when no active season)
  const { data: apiTasks = [], isLoading: apiTasksLoading } = useQuery<ApiTask[]>({
    queryKey: ["/api/habit/tasks"],
    enabled: !useMockData && !activeSeason,
  });

  // Fetch categories from API (when no active season)
  const { data: apiCategories = [], isLoading: apiCategoriesLoading } = useQuery<ApiCategory[]>({
    queryKey: ["/api/habit/categories"],
    enabled: !useMockData && !activeSeason,
  });

  // Fetch penalties from API (when no active season)
  const { data: apiPenalties = [], isLoading: apiPenaltiesLoading } = useQuery<ApiPenalty[]>({
    queryKey: ["/api/habit/penalties"],
    enabled: !useMockData && !activeSeason,
  });

  // Fetch settings from API (for daily goal)
  const { data: apiSettings, isLoading: apiSettingsLoading } = useQuery<ApiSettings>({
    queryKey: ["/api/habit/settings"],
    enabled: !useMockData && !activeSeason,
  });

  // API mutations for tasks (when no active season)
  const createTaskMutation = useMutation({
    mutationFn: async (task: Omit<Task, "id">) => {
      const res = await apiRequest("POST", "/api/habit/tasks", {
        name: task.name,
        value: task.value,
        category: task.category,
        priority: task.priority,
        boostEnabled: task.boosterRule?.enabled || false,
        boostThreshold: task.boosterRule?.timesRequired || null,
        boostPeriod: task.boosterRule?.period || null,
        boostPoints: task.boosterRule?.bonusPoints || null,
        tiers: task.tiers || null,
      });
      return res.json();
    },
    onMutate: async (newTask) => {
      // Optimistically add the task to local state immediately
      const tempId = `temp-${Date.now()}`;
      setTasks(prev => [...prev, { ...newTask, id: tempId }]);
      return { tempId };
    },
    onSuccess: (data, _variables, context) => {
      // Replace temp task with real one from server
      if (context?.tempId && data?.id) {
        setTasks(prev => prev.map(t => t.id === context.tempId ? { ...t, id: data.id } : t));
      }
      queryClient.invalidateQueries({ queryKey: ["/api/habit/tasks"] });
    },
    onError: (_error, _variables, context) => {
      // Remove the temp task on error
      if (context?.tempId) {
        setTasks(prev => prev.filter(t => t.id !== context.tempId));
      }
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, task }: { id: string; task: Omit<Task, "id"> }) => {
      const res = await apiRequest("PUT", `/api/habit/tasks/${id}`, {
        name: task.name,
        value: task.value,
        category: task.category,
        priority: task.priority,
        boostEnabled: task.boosterRule?.enabled || false,
        boostThreshold: task.boosterRule?.timesRequired || null,
        boostPeriod: task.boosterRule?.period || null,
        boostPoints: task.boosterRule?.bonusPoints || null,
        tiers: task.tiers || null,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habit/tasks"] });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/habit/tasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habit/tasks"] });
    },
  });

  // API mutations for categories (when no active season)
  const createCategoryMutation = useMutation({
    mutationFn: async (category: { name: string }) => {
      const res = await apiRequest("POST", "/api/habit/categories", category);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habit/categories"] });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const res = await apiRequest("PUT", `/api/habit/categories/${id}`, { name });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habit/categories"] });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/habit/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habit/categories"] });
    },
  });

  // API mutations for penalties (when no active season)
  const createPenaltyMutation = useMutation({
    mutationFn: async (penalty: { name: string; value: number }) => {
      const res = await apiRequest("POST", "/api/habit/penalties", penalty);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habit/penalties"] });
    },
  });

  const updatePenaltyMutation = useMutation({
    mutationFn: async ({ id, name, value }: { id: string; name: string; value: number }) => {
      const res = await apiRequest("PUT", `/api/habit/penalties/${id}`, { name, value });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habit/penalties"] });
    },
  });

  const deletePenaltyMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/habit/penalties/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habit/penalties"] });
    },
  });

  // API mutation for settings (daily goal)
  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: { dailyGoal?: number; weeklyGoal?: number }) => {
      const res = await apiRequest("PUT", "/api/habit/settings", settings);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habit/settings"] });
    },
  });

  // Load data from API when no active season (sync API data to local state)
  useEffect(() => {
    if (useMockData || activeSeason || apiTasksLoading) return;
    
    const tasksFromApi: Task[] = apiTasks.map(t => ({
      id: t.id,
      name: t.name,
      value: t.value,
      category: t.category,
      priority: t.priority as TaskPriority,
      boosterRule: t.boostEnabled ? {
        enabled: true,
        timesRequired: t.boostThreshold || 1,
        period: (t.boostPeriod as "week" | "month") || "week",
        bonusPoints: t.boostPoints || 0,
      } : undefined,
    }));
    setTasks(tasksFromApi);
  }, [apiTasks, apiTasksLoading, activeSeason, useMockData]);

  useEffect(() => {
    if (useMockData || activeSeason || apiCategoriesLoading) return;
    
    const categoriesFromApi: Category[] = apiCategories.map(c => ({
      id: c.id,
      name: c.name,
    }));
    setCategories(categoriesFromApi);
  }, [apiCategories, apiCategoriesLoading, activeSeason, useMockData]);

  useEffect(() => {
    if (useMockData || activeSeason || apiPenaltiesLoading) return;
    
    const penaltiesFromApi: PenaltyItem[] = apiPenalties.map(p => ({
      id: p.id,
      name: p.name,
      value: p.value,
      category: "Penalties",
      negativeBoostEnabled: false,
      currentCount: 0,
      triggered: false,
    }));
    setPenalties(penaltiesFromApi);
  }, [apiPenalties, apiPenaltiesLoading, activeSeason, useMockData]);

  useEffect(() => {
    if (useMockData || activeSeason || apiSettingsLoading || !apiSettings) return;
    setDailyGoal(apiSettings.dailyGoal || 50);
  }, [apiSettings, apiSettingsLoading, activeSeason, useMockData]);

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
      tiers: (t as any).tiers as TaskTier[] | undefined,
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
      tiers: t.tiers,
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
    
    if (activeSeason) {
      hasUserModifiedDataRef.current = true;
      const id = String(Date.now());
      setTasks([...tasks, { ...task, id }]);
    } else if (!useMockData) {
      createTaskMutation.mutate(task);
    } else {
      const id = String(Date.now());
      setTasks([...tasks, { ...task, id }]);
    }
    toast({
      title: "Task added",
      description: `"${task.name}" has been added as ${task.priority.replace(/([A-Z])/g, " $1").toLowerCase()}`,
    });
  };

  const handleEdit = (id: string, task: Omit<Task, "id">) => {
    if (isActiveSeasonArchived) return;
    
    if (activeSeason) {
      hasUserModifiedDataRef.current = true;
      setTasks(tasks.map((t) => (t.id === id ? { ...task, id } : t)));
    } else if (!useMockData) {
      updateTaskMutation.mutate({ id, task });
    } else {
      setTasks(tasks.map((t) => (t.id === id ? { ...task, id } : t)));
    }
    toast({
      title: "Task updated",
      description: `"${task.name}" has been updated`,
    });
  };

  const handleDelete = (id: string) => {
    if (isActiveSeasonArchived) return;
    const task = tasks.find(t => t.id === id);
    
    if (activeSeason) {
      hasUserModifiedDataRef.current = true;
      setTasks(tasks.filter((t) => t.id !== id));
    } else if (!useMockData) {
      deleteTaskMutation.mutate(id);
    } else {
      setTasks(tasks.filter((t) => t.id !== id));
    }
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
      if (activeSeason && !useMockData) {
        // Update season's weeklyGoal when a season is active
        updateSeasonSettingsMutation.mutate({ seasonId: activeSeason.id, weeklyGoal: newGoal * 7 });
      } else if (!useMockData) {
        // Update global settings when no season is active
        updateSettingsMutation.mutate({ dailyGoal: newGoal, weeklyGoal: newGoal * 7 });
      }
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
    const value = parseInt(penaltyValue, 10);
    const finalValue = value > 0 ? -value : value;
    const threshold = parseInt(penaltyBoostThreshold, 10) || 3;
    const boostPoints = parseInt(penaltyBoostPoints, 10) || 10;

    if (editingPenalty) {
      if (activeSeason) {
        hasUserModifiedDataRef.current = true;
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
      } else if (!useMockData) {
        updatePenaltyMutation.mutate({ id: editingPenalty.id, name: penaltyName, value: finalValue });
      } else {
        setPenalties(penalties.map(p =>
          p.id === editingPenalty.id
            ? { ...p, name: penaltyName, value: finalValue }
            : p
        ));
      }
      toast({ title: "Penalty updated", description: `"${penaltyName}" has been updated` });
    } else {
      if (activeSeason) {
        hasUserModifiedDataRef.current = true;
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
      } else if (!useMockData) {
        createPenaltyMutation.mutate({ name: penaltyName, value: finalValue });
      } else {
        const newPenalty: PenaltyItem = {
          id: `p${Date.now()}`,
          name: penaltyName,
          value: finalValue,
          category: "Penalties",
          negativeBoostEnabled: false,
          currentCount: 0,
          triggered: false,
        };
        setPenalties([...penalties, newPenalty]);
      }
      toast({ title: "Penalty added", description: `"${penaltyName}" has been added` });
    }

    setPenaltyDialogOpen(false);
    resetPenaltyForm();
    setEditingPenalty(null);
  };

  const handleDeletePenalty = () => {
    if (isActiveSeasonArchived) return;
    if (deletePenaltyId) {
      const penalty = penalties.find(p => p.id === deletePenaltyId);
      
      if (activeSeason) {
        hasUserModifiedDataRef.current = true;
        setPenalties(penalties.filter(p => p.id !== deletePenaltyId));
      } else if (!useMockData) {
        deletePenaltyMutation.mutate(deletePenaltyId);
      } else {
        setPenalties(penalties.filter(p => p.id !== deletePenaltyId));
      }
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
    
    if (editingCategory) {
      const oldName = editingCategory.name;
      
      if (activeSeason) {
        hasUserModifiedDataRef.current = true;
        setCategories(categories.map(c =>
          c.id === editingCategory.id ? { ...c, name: categoryName } : c
        ));
        if (oldName !== categoryName) {
          setTasks(tasks.map(t =>
            t.category === oldName ? { ...t, category: categoryName } : t
          ));
        }
      } else if (!useMockData) {
        updateCategoryMutation.mutate({ id: editingCategory.id, name: categoryName });
      } else {
        setCategories(categories.map(c =>
          c.id === editingCategory.id ? { ...c, name: categoryName } : c
        ));
      }
      toast({ title: "Category updated", description: `"${categoryName}" has been updated` });
    } else {
      if (activeSeason) {
        hasUserModifiedDataRef.current = true;
        const newCategory: Category = {
          id: `c${Date.now()}`,
          name: categoryName,
        };
        setCategories([...categories, newCategory]);
      } else if (!useMockData) {
        createCategoryMutation.mutate({ name: categoryName });
      } else {
        const newCategory: Category = {
          id: `c${Date.now()}`,
          name: categoryName,
        };
        setCategories([...categories, newCategory]);
      }
      toast({ title: "Category added", description: `"${categoryName}" has been added` });
    }

    setCategoryDialogOpen(false);
    resetCategoryForm();
    setEditingCategory(null);
  };

  const handleDeleteCategory = () => {
    if (isActiveSeasonArchived) return;
    if (deleteCategoryId) {
      const category = categories.find(c => c.id === deleteCategoryId);
      
      if (activeSeason) {
        hasUserModifiedDataRef.current = true;
        setCategories(categories.filter(c => c.id !== deleteCategoryId));
      } else if (!useMockData) {
        deleteCategoryMutation.mutate(deleteCategoryId);
      } else {
        setCategories(categories.filter(c => c.id !== deleteCategoryId));
      }
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

      {activeSeason && !isActiveSeasonArchived && !isDemo && (
        <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-primary/10 to-chart-4/10 rounded-lg border border-primary/20">
          <Button
            size="lg"
            className="bg-gradient-to-r from-primary to-chart-4 hover:from-primary/90 hover:to-chart-4/90 text-primary-foreground shadow-md"
            onClick={handleOpenAiDialog}
            disabled={aiConversationMutation.isPending || aiFinalizeMutation.isPending}
            data-testid="button-generate-ai"
          >
            <Sparkles className="h-5 w-5 mr-2" />
            Generate with AI
          </Button>
          <span className="text-sm text-muted-foreground">
            Describe your ideal life and let AI create personalized tasks for you
          </span>
        </div>
      )}

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

      <Dialog open={welcomeSeasonDialogOpen} onOpenChange={(open) => {
        // Only allow closing if user has at least one season
        if (!open && seasons.length === 0) return;
        setWelcomeSeasonDialogOpen(open);
      }}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => {
          // Prevent closing by clicking outside when no seasons exist
          if (seasons.length === 0) e.preventDefault();
        }} onEscapeKeyDown={(e) => {
          // Prevent closing with Escape when no seasons exist
          if (seasons.length === 0) e.preventDefault();
        }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Create Your First Season
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                Life changes, and so do our priorities. Your system should grow with you!
              </p>
              <p>
                This <span className="font-medium text-foreground">Season</span> saves your tasks and progress for this moment in your life.
              </p>
              <p>
                Create a new Season anytime your circumstances shift or you want a fresh start.
              </p>
            </div>
            <div className="space-y-2 pt-2">
              <Label htmlFor="first-season-name">Season Name</Label>
              <Input
                id="first-season-name"
                value={firstSeasonName}
                onChange={(e) => setFirstSeasonName(e.target.value)}
                placeholder="e.g., Winter 2025, New Job, Post-Grad Life"
                data-testid="input-first-season-name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                if (firstSeasonName.trim()) {
                  createFirstSeasonMutation.mutate({ name: firstSeasonName.trim() });
                }
              }}
              disabled={!firstSeasonName.trim() || createFirstSeasonMutation.isPending}
              data-testid="button-create-first-season"
            >
              {createFirstSeasonMutation.isPending ? (
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

      <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
        <DialogContent className={`flex flex-col ${aiDialogFullscreen ? "!w-[95vw] !max-w-[95vw] !h-[95vh] !max-h-[95vh]" : "sm:max-w-2xl max-h-[85vh]"}`}>
          <DialogHeader className="flex flex-row items-center justify-between gap-4">
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {aiDialogStep === "chat" ? "Design Your Habits" : "Review AI Suggestions"}
            </DialogTitle>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setAiDialogFullscreen(!aiDialogFullscreen)}
              data-testid="button-toggle-fullscreen"
            >
              {aiDialogFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </DialogHeader>

          {aiDialogStep === "chat" ? (
            <div className="flex flex-col flex-1 min-h-0">
              {/* Conversation progress indicator */}
              {aiConversationState.goals.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pb-3 border-b mb-3">
                  {aiConversationState.goals.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {aiConversationState.goals.length} goals
                    </Badge>
                  )}
                  {aiConversationState.challenges.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {aiConversationState.challenges.length} challenges
                    </Badge>
                  )}
                  {aiConversationState.badHabits.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {aiConversationState.badHabits.length} habits to break
                    </Badge>
                  )}
                  {aiConversationState.timeAvailability && (
                    <Badge variant="outline" className="text-xs">
                      {aiConversationState.timeAvailability} time
                    </Badge>
                  )}
                </div>
              )}

              {/* Chat messages */}
              <ScrollArea className={`flex-1 pr-4 ${aiDialogFullscreen ? "min-h-[50vh]" : "min-h-[300px] max-h-[400px]"}`}>
                <div className="space-y-4">
                  {aiMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {msg.role === "assistant" && (
                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <MessageSquare className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-2.5 ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                        data-testid={`ai-message-${idx}`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      </div>
                      {msg.role === "user" && (
                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                          <User className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  ))}
                  {aiConversationMutation.isPending && (
                    <div className="flex gap-3 justify-start">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <MessageSquare className="h-4 w-4 text-primary" />
                      </div>
                      <div className="bg-muted rounded-lg px-4 py-2.5">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    </div>
                  )}
                  <div ref={aiChatEndRef} />
                </div>
              </ScrollArea>

              {/* Input area */}
              <div className="pt-4 border-t mt-4 space-y-3">
                <div className="flex gap-2">
                  <Textarea
                    value={aiUserInput}
                    onChange={(e) => setAiUserInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Type your response..."
                    rows={2}
                    className="flex-1 resize-none"
                    disabled={aiConversationMutation.isPending}
                    data-testid="input-ai-chat"
                  />
                  <Button
                    size="icon"
                    onClick={handleSendMessage}
                    disabled={!aiUserInput.trim() || aiConversationMutation.isPending}
                    data-testid="button-send-message"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex justify-between items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setAiDialogOpen(false)}>
                    Cancel
                  </Button>
                  {(aiConversationState.goals.length >= 2 || aiConversationState.currentStep === "confirm" || aiConversationState.currentStep === "complete") && (
                    <Button
                      onClick={handleGenerateFromConversation}
                      disabled={aiFinalizeMutation.isPending}
                      data-testid="button-generate-tasks"
                    >
                      {aiFinalizeMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Generate My Tasks
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ) : aiGeneratedData ? (
            <div className="flex flex-col flex-1 min-h-0">
              <ScrollArea className={`flex-1 pr-4 ${aiDialogFullscreen ? "max-h-[70vh]" : "max-h-[55vh]"}`}>
                <div className="space-y-4 py-2">
                  {aiGeneratedData.seasonTheme && (
                    <div className="bg-muted p-3 rounded-md">
                      <p className="text-sm font-medium">Suggested Season Theme</p>
                      <p className="text-lg font-semibold">{aiGeneratedData.seasonTheme}</p>
                    </div>
                  )}

                  <p className="text-sm text-muted-foreground">{aiGeneratedData.summary}</p>

                  {aiGeneratedData.categories.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Categories</Label>
                      <div className="flex flex-wrap gap-2">
                        {aiGeneratedData.categories.map((cat, idx) => (
                          <div
                            key={idx}
                            className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs cursor-pointer border ${
                              aiSelectedCategories.has(idx)
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-secondary border-transparent"
                            }`}
                            onClick={() => toggleAiCategory(idx)}
                            data-testid={`ai-category-${idx}`}
                          >
                            <Checkbox checked={aiSelectedCategories.has(idx)} className="h-3 w-3" />
                            <span>{cat.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {aiGeneratedData.tasks.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <Label className="text-sm font-medium">Tasks ({aiSelectedTasks.size}/{aiGeneratedData.tasks.length} selected)</Label>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => setAiSelectedTasks(new Set(aiGeneratedData.tasks.map((_, i) => i)))}>
                            Select All
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setAiSelectedTasks(new Set())}>
                            Clear
                          </Button>
                        </div>
                      </div>
                      <div className="grid gap-2">
                        {aiGeneratedData.tasks.map((task, idx) => (
                          <div
                            key={idx}
                            className={`flex items-start gap-3 p-2 rounded-md cursor-pointer border ${
                              aiSelectedTasks.has(idx) ? "bg-secondary border-primary/50" : "border-transparent"
                            }`}
                            onClick={() => toggleAiTask(idx)}
                            data-testid={`ai-task-${idx}`}
                          >
                            <Checkbox checked={aiSelectedTasks.has(idx)} className="mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-sm">{task.name}</span>
                                <Badge variant="secondary" className="text-xs">{task.category}</Badge>
                                <span className="text-xs text-muted-foreground">{task.priority}</span>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs font-mono text-chart-1">+{task.value} pts</span>
                                {task.description && (
                                  <span className="text-xs text-muted-foreground">{task.description}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {aiGeneratedData.penalties.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Penalties ({aiSelectedPenalties.size}/{aiGeneratedData.penalties.length} selected)</Label>
                      </div>
                      <div className="grid gap-2">
                        {aiGeneratedData.penalties.map((penalty, idx) => (
                          <div
                            key={idx}
                            className={`flex items-start gap-3 p-2 rounded-md cursor-pointer border ${
                              aiSelectedPenalties.has(idx) ? "bg-secondary border-chart-3/50" : "border-transparent"
                            }`}
                            onClick={() => toggleAiPenalty(idx)}
                            data-testid={`ai-penalty-${idx}`}
                          >
                            <Checkbox checked={aiSelectedPenalties.has(idx)} className="mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{penalty.name}</span>
                                <span className="text-xs font-mono text-chart-3">{penalty.value} pts</span>
                              </div>
                              {penalty.description && (
                                <span className="text-xs text-muted-foreground">{penalty.description}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <DialogFooter className="gap-2 pt-4 border-t mt-4">
                <Button variant="outline" onClick={() => setAiDialogStep("chat")}>
                  Back to Chat
                </Button>
                <Button
                  onClick={handleApplyAiResults}
                  disabled={aiSelectedTasks.size === 0 && aiSelectedPenalties.size === 0 && aiSelectedCategories.size === 0}
                  data-testid="button-apply-ai-results"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Add {aiSelectedTasks.size} Tasks, {aiSelectedPenalties.size} Penalties
                </Button>
              </DialogFooter>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
