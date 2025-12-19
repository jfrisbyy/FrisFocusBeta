import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { 
  Dumbbell, Utensils, Scale, Target, Trophy, Plus, Flame, Droplets, 
  TrendingUp, TrendingDown, Calendar, Clock, Activity, Camera, 
  Trash2, Edit, ChevronRight, ChevronLeft, Zap, Star, Award, Calculator, CheckCircle2, Footprints,
  MessageCircle, Send, Sparkles, Check, Loader2
} from "lucide-react";
import { useDemo } from "@/contexts/DemoContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { NutritionLog, BodyComposition, StrengthWorkout, SkillWorkout, BasketballRun, NutritionSettings, Meal, CardioRun, LivePlaySettings, DailySteps, SportTemplate, LivePlayField } from "@shared/schema";
import { Checkbox } from "@/components/ui/checkbox";
import { Settings } from "lucide-react";
import { format, subDays, addDays, startOfWeek, parseISO, isToday, isThisWeek, differenceInDays, eachDayOfInterval } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell, Legend, PieChart, Pie } from "recharts";

const mockNutrition: NutritionLog[] = [
  { id: "demo-1", userId: "demo", date: new Date().toISOString().split("T")[0], calories: 2200, protein: 180, carbs: 220, fats: 65, creatine: true, waterGallon: true, deficit: 300, caloriesBurned: null, meals: [{ id: "m1", name: "Breakfast", calories: 500, protein: 30, time: "8:00 AM" }, { id: "m2", name: "Lunch", calories: 800, protein: 50, time: "12:30 PM" }, { id: "m3", name: "Dinner", calories: 900, protein: 100, time: "7:00 PM" }], completedToggles: null },
  { id: "demo-2", userId: "demo", date: subDays(new Date(), 1).toISOString().split("T")[0], calories: 2100, protein: 165, carbs: 200, fats: 70, creatine: true, waterGallon: false, deficit: 400, caloriesBurned: null, meals: null, completedToggles: null },
  { id: "demo-3", userId: "demo", date: subDays(new Date(), 2).toISOString().split("T")[0], calories: 2350, protein: 190, carbs: 240, fats: 60, creatine: true, waterGallon: true, deficit: 150, caloriesBurned: null, meals: null, completedToggles: null },
  { id: "demo-4", userId: "demo", date: subDays(new Date(), 3).toISOString().split("T")[0], calories: 2400, protein: 185, carbs: 250, fats: 65, creatine: true, waterGallon: true, deficit: 100, caloriesBurned: null, meals: null, completedToggles: null },
  { id: "demo-5", userId: "demo", date: subDays(new Date(), 4).toISOString().split("T")[0], calories: 2050, protein: 160, carbs: 180, fats: 75, creatine: false, waterGallon: true, deficit: 450, caloriesBurned: null, meals: null, completedToggles: null },
];

const mockBodyComp: BodyComposition[] = [
  { id: "demo-1", userId: "demo", date: new Date().toISOString().split("T")[0], weight: 185, bodyFat: 15, goalWeight: 180, nextMilestone: 183, photoUrl: null },
  { id: "demo-2", userId: "demo", date: subDays(new Date(), 7).toISOString().split("T")[0], weight: 187, bodyFat: 16, goalWeight: 180, nextMilestone: 185, photoUrl: null },
  { id: "demo-3", userId: "demo", date: subDays(new Date(), 14).toISOString().split("T")[0], weight: 189, bodyFat: 17, goalWeight: 180, nextMilestone: 187, photoUrl: null },
  { id: "demo-4", userId: "demo", date: subDays(new Date(), 21).toISOString().split("T")[0], weight: 191, bodyFat: 18, goalWeight: 180, nextMilestone: 189, photoUrl: null },
];

const mockStrength: StrengthWorkout[] = [
  { id: "demo-1", userId: "demo", date: new Date().toISOString().split("T")[0], type: "Strength", primaryFocus: "Push", duration: 60, volume: 15000, effort: 8, exercises: [{ name: "Bench Press", sets: 4, reps: 8, weight: 185 }, { name: "Shoulder Press", sets: 3, reps: 10, weight: 95 }], notes: null },
  { id: "demo-2", userId: "demo", date: subDays(new Date(), 2).toISOString().split("T")[0], type: "Strength", primaryFocus: "Pull", duration: 55, volume: 14200, effort: 7, exercises: [{ name: "Deadlift", sets: 4, reps: 6, weight: 275 }, { name: "Pull-ups", sets: 4, reps: 10, weight: 0 }], notes: null },
  { id: "demo-3", userId: "demo", date: subDays(new Date(), 4).toISOString().split("T")[0], type: "Strength", primaryFocus: "Legs", duration: 70, volume: 18500, effort: 9, exercises: [{ name: "Squat", sets: 5, reps: 5, weight: 225 }, { name: "RDL", sets: 4, reps: 8, weight: 185 }], notes: null },
];

const mockSkills: SkillWorkout[] = [
  { id: "demo-1", userId: "demo", date: new Date().toISOString().split("T")[0], type: "Skill", drillType: "Shooting", effort: 8, skillFocus: ["3-pointers", "Mid-range"], zoneFocus: ["Corner", "Wing"], drillStats: { makes: 45, attempts: 60 }, notes: null },
  { id: "demo-2", userId: "demo", date: subDays(new Date(), 3).toISOString().split("T")[0], type: "Skill", drillType: "Ball Handling", effort: 7, skillFocus: ["Crossovers", "Behind back"], zoneFocus: [], drillStats: null, notes: null },
  { id: "demo-3", userId: "demo", date: subDays(new Date(), 6).toISOString().split("T")[0], type: "Skill", drillType: "Shooting", effort: 9, skillFocus: ["Free throws", "Fadeaways"], zoneFocus: ["Paint", "Elbow"], drillStats: { makes: 38, attempts: 50 }, notes: null },
];

const mockRuns: BasketballRun[] = [
  { id: "demo-1", userId: "demo", date: new Date().toISOString().split("T")[0], type: "Run", gameType: { fullCourt: true }, courtType: "Indoor", competitionLevel: "Competitive", gamesPlayed: 5, wins: 3, losses: 2, performanceGrade: "B+", confidence: 7, positivePoints: null, weakPoints: null, matchupNotes: null, challenges: null },
  { id: "demo-2", userId: "demo", date: subDays(new Date(), 5).toISOString().split("T")[0], type: "Run", gameType: { halfCourt: true }, courtType: "Outdoor", competitionLevel: "Pickup", gamesPlayed: 4, wins: 4, losses: 0, performanceGrade: "A", confidence: 9, positivePoints: null, weakPoints: null, matchupNotes: null, challenges: null },
  { id: "demo-3", userId: "demo", date: subDays(new Date(), 10).toISOString().split("T")[0], type: "Run", gameType: { fullCourt: true }, courtType: "Indoor", competitionLevel: "Competitive", gamesPlayed: 6, wins: 4, losses: 2, performanceGrade: "A-", confidence: 8, positivePoints: null, weakPoints: null, matchupNotes: null, challenges: null },
];

const mockCardioRuns: CardioRun[] = [
  { id: "demo-1", userId: "demo", date: new Date().toISOString().split("T")[0], distance: 5000, duration: 28, pace: "9:00", speed: 67, location: "Park Trail", terrain: "trail", effort: 7, notes: null, caloriesBurned: 320 },
  { id: "demo-2", userId: "demo", date: subDays(new Date(), 3).toISOString().split("T")[0], distance: 3200, duration: 18, pace: "9:15", speed: 65, location: "Neighborhood", terrain: "road", effort: 6, notes: null, caloriesBurned: 210 },
  { id: "demo-3", userId: "demo", date: subDays(new Date(), 7).toISOString().split("T")[0], distance: 8000, duration: 45, pace: "9:05", speed: 66, location: "Treadmill", terrain: "treadmill", effort: 8, notes: null, caloriesBurned: 480 },
];

const mockNutritionSettings: NutritionSettings = {
  id: "demo",
  userId: "demo",
  maintenanceCalories: 2500,
  calorieTarget: 2000,
  proteinTarget: 180,
  carbTarget: 200,
  fatTarget: 70,
  goalType: "moderate_cut",
  weight: 185,
  height: 72,
  age: 28,
  gender: "male",
  activityLevel: "moderate",
  customToggles: null,
};

type ActiveTab = "overview" | "nutrition" | "sports" | "strength" | "body-comp";
type SportsSubTab = "runs" | "drills" | "cardio";
type ChartPeriod = "weekly" | "monthly";

export default function FitnessPage() {
  const { isDemo } = useDemo();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
  const [sportsSubTab, setSportsSubTab] = useState<SportsSubTab>("runs");
  const [nutritionDialogOpen, setNutritionDialogOpen] = useState(false);
  const [strengthDialogOpen, setStrengthDialogOpen] = useState(false);
  const [skillDialogOpen, setSkillDialogOpen] = useState(false);
  const [runDialogOpen, setRunDialogOpen] = useState(false);
  const [cardioDialogOpen, setCardioDialogOpen] = useState(false);
  const [bodyCompDialogOpen, setBodyCompDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [calculatorDialogOpen, setCalculatorDialogOpen] = useState(false);
  const [livePlaySettingsOpen, setLivePlaySettingsOpen] = useState(false);
  const [demoNutritionSettings, setDemoNutritionSettings] = useState(mockNutritionSettings);
  const [demoNutritionData, setDemoNutritionData] = useState(mockNutrition);
  const [selectedNutritionDate, setSelectedNutritionDate] = useState(new Date());
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>("weekly");
  const [stepsView, setStepsView] = useState<"today" | "weekly">("today");
  const [stepsDialogOpen, setStepsDialogOpen] = useState(false);
  const [deficitDialogOpen, setDeficitDialogOpen] = useState(false);
  const [stepsWeekOffset, setStepsWeekOffset] = useState(0);
  const [habitsManageOpen, setHabitsManageOpen] = useState(false);
  const [newHabitName, setNewHabitName] = useState("");
  const [volumeChartView, setVolumeChartView] = useState<"weekly" | "monthly">("weekly");
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);

  // Editing state for each fitness log type
  const [editingNutrition, setEditingNutrition] = useState<NutritionLog | null>(null);
  const [editingStrength, setEditingStrength] = useState<StrengthWorkout | null>(null);
  const [editingSkill, setEditingSkill] = useState<SkillWorkout | null>(null);
  const [editingRun, setEditingRun] = useState<BasketballRun | null>(null);
  const [editingCardio, setEditingCardio] = useState<CardioRun | null>(null);
  const [editingBodyComp, setEditingBodyComp] = useState<BodyComposition | null>(null);
  const [editingSteps, setEditingSteps] = useState<DailySteps | null>(null);

  const { data: nutritionData = [], isLoading: loadingNutrition } = useQuery<NutritionLog[]>({
    queryKey: ["/api/fitness/nutrition"],
    enabled: !isDemo,
  });

  const { data: bodyCompData = [], isLoading: loadingBody } = useQuery<BodyComposition[]>({
    queryKey: ["/api/fitness/body-comp"],
    enabled: !isDemo,
  });

  const { data: strengthData = [], isLoading: loadingStrength } = useQuery<StrengthWorkout[]>({
    queryKey: ["/api/fitness/strength"],
    enabled: !isDemo,
  });

  const { data: skillsData = [], isLoading: loadingSkills } = useQuery<SkillWorkout[]>({
    queryKey: ["/api/fitness/skill"],
    enabled: !isDemo,
  });

  const { data: runsData = [], isLoading: loadingRuns } = useQuery<BasketballRun[]>({
    queryKey: ["/api/fitness/runs"],
    enabled: !isDemo,
  });

  const { data: cardioData = [], isLoading: loadingCardio } = useQuery<CardioRun[]>({
    queryKey: ["/api/fitness/cardio"],
    enabled: !isDemo,
  });

  const { data: stepsData = [], isLoading: loadingSteps } = useQuery<DailySteps[]>({
    queryKey: ["/api/fitness/steps"],
    enabled: !isDemo,
  });

  const { data: nutritionSettingsData } = useQuery<NutritionSettings>({
    queryKey: ["/api/fitness/nutrition-settings"],
    enabled: !isDemo,
  });

  // Default Basketball template with all basketball-specific fields
  const BASKETBALL_TEMPLATE: SportTemplate = {
    id: "basketball",
    name: "Basketball",
    isDefault: true,
    fields: [
      { id: "date", label: "Date", enabled: true, type: "text" },
      { id: "courtType", label: "Court Type", enabled: true, type: "select", options: ["Indoor", "Outdoor"] },
      { id: "gameType", label: "Game Type", enabled: true, type: "select", options: ["Full Court", "Half Court"] },
      { id: "gamesPlayed", label: "Games Played", enabled: true, type: "number", placeholder: "5" },
      { id: "wins", label: "Wins", enabled: true, type: "number", placeholder: "3" },
      { id: "losses", label: "Losses", enabled: true, type: "number", placeholder: "2" },
      { id: "performanceGrade", label: "Performance Grade", enabled: true, type: "select", options: ["A+", "A", "A-", "B+", "B", "B-", "C+", "C"] },
      { id: "confidence", label: "Confidence (1-10)", enabled: true, type: "number", placeholder: "7" },
    ],
  };

  // For backwards compatibility
  const DEFAULT_LIVE_PLAY_FIELDS = BASKETBALL_TEMPLATE.fields;

  const { data: livePlaySettingsData } = useQuery<LivePlaySettings>({
    queryKey: ["/api/fitness/live-play-settings"],
    enabled: !isDemo,
  });

  const livePlayVisibleFields = livePlaySettingsData?.visibleFields as string[] || 
    DEFAULT_LIVE_PLAY_FIELDS.map(f => f.id);

  const nutrition = isDemo ? demoNutritionData : nutritionData;
  const nutritionSettings = isDemo ? demoNutritionSettings : (nutritionSettingsData || mockNutritionSettings);
  const bodyComp = isDemo ? mockBodyComp : bodyCompData;
  const strength = isDemo ? mockStrength : strengthData;
  const skills = isDemo ? mockSkills : skillsData;
  const runs = isDemo ? mockRuns : runsData;
  const cardioRuns = isDemo ? mockCardioRuns : cardioData;
  const steps = isDemo ? [] : stepsData;

  const isLoading = !isDemo && (loadingNutrition || loadingBody || loadingStrength || loadingSkills || loadingRuns || loadingCardio || loadingSteps);

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "MMM d, yyyy");
    } catch {
      return dateStr;
    }
  };

  const formatShortDate = (dateStr: string) => {
    try {
      const date = parseISO(dateStr);
      if (isToday(date)) return "Today";
      return format(date, "EEE");
    } catch {
      return dateStr;
    }
  };

  const getWeeklyStreak = () => {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    let streak = 0;
    for (let i = 0; i < 7; i++) {
      const checkDate = subDays(today, i);
      if (checkDate < weekStart) break;
      const dateStr = format(checkDate, "yyyy-MM-dd");
      const hasNutrition = nutrition.some(n => n.date === dateStr);
      const hasWorkout = strength.some(s => s.date === dateStr) || skills.some(s => s.date === dateStr) || runs.some(r => r.date === dateStr);
      if (hasNutrition || hasWorkout) streak++;
      else break;
    }
    return streak;
  };

  const getThisWeekWorkouts = () => {
    return [...strength, ...skills, ...runs].filter(w => {
      try {
        return isThisWeek(parseISO(w.date), { weekStartsOn: 1 });
      } catch {
        return false;
      }
    }).length;
  };

  const getLatestWeight = () => bodyComp.length > 0 ? bodyComp.sort((a, b) => b.date.localeCompare(a.date))[0] : null;
  
  // Aggregate all nutrition logs for a given date
  const aggregateNutritionForDate = (dateStr: string): NutritionLog | null => {
    const logsForDate = nutrition.filter(n => n.date === dateStr);
    if (logsForDate.length === 0) return null;
    if (logsForDate.length === 1) return logsForDate[0];
    
    // Aggregate multiple logs
    const aggregated: NutritionLog = {
      id: logsForDate[0].id,
      date: dateStr,
      userId: logsForDate[0].userId,
      calories: logsForDate.reduce((sum, n) => sum + (n.calories || 0), 0),
      protein: logsForDate.reduce((sum, n) => sum + (n.protein || 0), 0),
      carbs: logsForDate.reduce((sum, n) => sum + (n.carbs || 0), 0),
      fats: logsForDate.reduce((sum, n) => sum + (n.fats || 0), 0),
      creatine: logsForDate.some(n => n.creatine),
      waterGallon: logsForDate.some(n => n.waterGallon),
      deficit: logsForDate.reduce((sum, n) => sum + (n.deficit || 0), 0) || null,
      caloriesBurned: logsForDate.reduce((sum, n) => sum + (n.caloriesBurned || 0), 0) || null,
      meals: logsForDate.flatMap(n => (Array.isArray(n.meals) ? n.meals : []) as Meal[]),
      completedToggles: logsForDate[0].completedToggles,
    };
    return aggregated;
  };
  
  const getTodayCalories = () => aggregateNutritionForDate(format(new Date(), "yyyy-MM-dd"));
  const getSelectedDateCalories = () => aggregateNutritionForDate(format(selectedNutritionDate, "yyyy-MM-dd"));
  const getAvgDeficit = () => {
    const recent = nutrition.filter(n => n.deficit).slice(0, 7);
    if (recent.length === 0) return 0;
    return Math.round(recent.reduce((acc, n) => acc + (n.deficit || 0), 0) / recent.length);
  };

  const deleteNutritionMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/fitness/nutrition/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fitness/nutrition"] });
      toast({ title: "Nutrition log deleted" });
    },
  });

  const deleteStrengthMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/fitness/strength/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fitness/strength"] });
      toast({ title: "Workout deleted" });
    },
  });

  const deleteSkillMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/fitness/skill/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fitness/skill"] });
      toast({ title: "Skill workout deleted" });
    },
  });

  const deleteRunMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/fitness/runs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fitness/runs"] });
      toast({ title: "Run deleted" });
    },
  });

  const deleteCardioMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/fitness/cardio/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fitness/cardio"] });
      toast({ title: "Cardio run deleted" });
    },
  });

  const saveStepsMutation = useMutation({
    mutationFn: async ({ date, steps, goal }: { date: string; steps: number; goal?: number }) => {
      const res = await apiRequest("POST", "/api/fitness/steps", { date, steps, goal: goal || 10000 });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fitness/steps"] });
      toast({ title: "Steps saved" });
      setStepsDialogOpen(false);
    },
  });

  const deleteStepsMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/fitness/steps/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fitness/steps"] });
      toast({ title: "Steps deleted" });
    },
  });

  const deleteBodyCompMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/fitness/body-comp/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fitness/body-comp"] });
      toast({ title: "Record deleted" });
    },
  });

  // Edit mutations for all fitness log types
  const editNutritionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<NutritionLog> }) => {
      const res = await apiRequest("PUT", `/api/fitness/nutrition/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fitness/nutrition"] });
      toast({ title: "Nutrition log updated" });
      setEditingNutrition(null);
      setNutritionDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to update nutrition log", variant: "destructive" });
    },
  });

  const editStrengthMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<StrengthWorkout> }) => {
      const res = await apiRequest("PUT", `/api/fitness/strength/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fitness/strength"] });
      toast({ title: "Strength workout updated" });
      setEditingStrength(null);
      setStrengthDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to update workout", variant: "destructive" });
    },
  });

  const editSkillMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<SkillWorkout> }) => {
      const res = await apiRequest("PUT", `/api/fitness/skill/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fitness/skill"] });
      toast({ title: "Skill workout updated" });
      setEditingSkill(null);
      setSkillDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to update skill workout", variant: "destructive" });
    },
  });

  const editRunMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<BasketballRun> }) => {
      const res = await apiRequest("PUT", `/api/fitness/runs/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fitness/runs"] });
      toast({ title: "Basketball run updated" });
      setEditingRun(null);
      setRunDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to update run", variant: "destructive" });
    },
  });

  const editCardioMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CardioRun> }) => {
      const res = await apiRequest("PUT", `/api/fitness/cardio/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fitness/cardio"] });
      toast({ title: "Cardio run updated" });
      setEditingCardio(null);
      setCardioDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to update cardio run", variant: "destructive" });
    },
  });

  const editBodyCompMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<BodyComposition> }) => {
      const res = await apiRequest("PUT", `/api/fitness/body-comp/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fitness/body-comp"] });
      toast({ title: "Body composition updated" });
      setEditingBodyComp(null);
      setBodyCompDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to update body composition", variant: "destructive" });
    },
  });

  const editStepsMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<DailySteps> }) => {
      const res = await apiRequest("PUT", `/api/fitness/steps/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fitness/steps"] });
      toast({ title: "Steps updated" });
      setEditingSteps(null);
      setStepsDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to update steps", variant: "destructive" });
    },
  });

  const toggleHabitMutation = useMutation({
    mutationFn: async ({ logId, toggleId, field, value }: { logId: string; toggleId?: string; field?: string; value: boolean }) => {
      const res = await apiRequest("PATCH", `/api/fitness/nutrition/${logId}/toggle`, { toggleId, field, value });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fitness/nutrition"] });
    },
  });

  const updateCustomHabitsMutation = useMutation({
    mutationFn: async (customToggles: { id: string; name: string; enabled: boolean }[]) => {
      const res = await apiRequest("PUT", "/api/fitness/nutrition-settings", { customToggles });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fitness/nutrition-settings"] });
      toast({ title: "Habits updated" });
    },
    onError: () => {
      toast({ title: "Failed to update habits", variant: "destructive" });
    },
  });

  const handleAddHabit = (name: string) => {
    if (!name.trim()) return;
    const currentToggles = (nutritionSettings.customToggles as { id: string; name: string; enabled: boolean }[]) || [];
    const newToggle = { id: `habit-${Date.now()}`, name: name.trim(), enabled: true };
    
    if (isDemo) {
      setDemoNutritionSettings(prev => ({
        ...prev,
        customToggles: [...currentToggles, newToggle]
      }));
      setNewHabitName("");
      return;
    }
    
    updateCustomHabitsMutation.mutate([...currentToggles, newToggle]);
    setNewHabitName("");
  };

  const handleRemoveHabit = (habitId: string) => {
    const currentToggles = (nutritionSettings.customToggles as { id: string; name: string; enabled: boolean }[]) || [];
    const updated = currentToggles.filter(t => t.id !== habitId);
    
    if (isDemo) {
      setDemoNutritionSettings(prev => ({
        ...prev,
        customToggles: updated
      }));
      return;
    }
    
    updateCustomHabitsMutation.mutate(updated);
  };

  const updateGoalMutation = useMutation({
    mutationFn: async (data: { goalType: string; calorieTarget: number; maintenanceCalories: number; weight?: number; height?: number; age?: number; gender?: string; activityLevel?: string }) => {
      const res = await apiRequest("PUT", "/api/fitness/nutrition-settings", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fitness/nutrition-settings"] });
      toast({ title: "Goal updated" });
      setGoalDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to update goal", variant: "destructive" });
    },
  });

  const handleToggleHabit = (toggleId: string, field: string | undefined, value: boolean) => {
    const todayLog = getTodayCalories();
    if (!todayLog) {
      toast({ title: "No nutrition log for today", description: "Log your nutrition first to track habits", variant: "destructive" });
      return;
    }
    
    if (isDemo) {
      // Update demo data
      setDemoNutritionData(prev => prev.map(log => {
        if (log.date === format(new Date(), "yyyy-MM-dd")) {
          if (field === 'creatine') return { ...log, creatine: value };
          if (field === 'waterGallon') return { ...log, waterGallon: value };
          // Handle custom toggles
          const current = (log.completedToggles as string[]) || [];
          const updated = value 
            ? [...current, toggleId]
            : current.filter(t => t !== toggleId);
          return { ...log, completedToggles: updated };
        }
        return log;
      }));
      return;
    }
    
    toggleHabitMutation.mutate({ logId: todayLog.id, toggleId, field, value });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="h-12 bg-muted rounded w-full" />
          <div className="grid gap-4 md:grid-cols-3">
            <div className="h-32 bg-muted rounded" />
            <div className="h-32 bg-muted rounded" />
            <div className="h-32 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  const latestWeight = getLatestWeight();
  const todayCalories = getTodayCalories();
  const selectedDateCalories = getSelectedDateCalories();
  const weeklyWorkouts = getThisWeekWorkouts();
  const weeklyStreak = getWeeklyStreak();
  const avgDeficit = getAvgDeficit();

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto" data-testid="page-fitness">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Fitness</h1>
        <p className="text-muted-foreground text-sm">Track nutrition, workouts, and body composition</p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ActiveTab)} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 h-auto">
          <TabsTrigger value="overview" className="flex flex-col gap-1 py-2" data-testid="tab-overview">
            <Activity className="h-4 w-4" />
            <span className="text-xs">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="nutrition" className="flex flex-col gap-1 py-2" data-testid="tab-nutrition">
            <Utensils className="h-4 w-4" />
            <span className="text-xs">Nutrition</span>
          </TabsTrigger>
          <TabsTrigger value="sports" className="flex flex-col gap-1 py-2" data-testid="tab-sports">
            <Trophy className="h-4 w-4" />
            <span className="text-xs">Sports</span>
          </TabsTrigger>
          <TabsTrigger value="strength" className="flex flex-col gap-1 py-2" data-testid="tab-strength">
            <Dumbbell className="h-4 w-4" />
            <span className="text-xs">Strength</span>
          </TabsTrigger>
          <TabsTrigger value="body-comp" className="flex flex-col gap-1 py-2" data-testid="tab-body-comp">
            <Scale className="h-4 w-4" />
            <span className="text-xs">Body</span>
          </TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-6">
          {/* Goal Banner */}
          <Card className={`border-2 ${
            (nutritionSettings.calorieTarget || 2000) === (nutritionSettings.maintenanceCalories || 2500) ? 'border-blue-500/50 bg-blue-500/5' :
            (nutritionSettings.calorieTarget || 2000) > (nutritionSettings.maintenanceCalories || 2500) ? 'border-green-500/50 bg-green-500/5' :
            'border-orange-500/50 bg-orange-500/5'
          }`}>
            <CardContent className="py-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-full ${
                    (nutritionSettings.calorieTarget || 2000) === (nutritionSettings.maintenanceCalories || 2500) ? 'bg-blue-500/20' :
                    (nutritionSettings.calorieTarget || 2000) > (nutritionSettings.maintenanceCalories || 2500) ? 'bg-green-500/20' :
                    'bg-orange-500/20'
                  }`}>
                    <Target className={`h-5 w-5 ${
                      (nutritionSettings.calorieTarget || 2000) === (nutritionSettings.maintenanceCalories || 2500) ? 'text-blue-500' :
                      (nutritionSettings.calorieTarget || 2000) > (nutritionSettings.maintenanceCalories || 2500) ? 'text-green-500' :
                      'text-orange-500'
                    }`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">
                        {(nutritionSettings.calorieTarget || 2000) === (nutritionSettings.maintenanceCalories || 2500) ? 'Maintenance Mode' :
                         (nutritionSettings.calorieTarget || 2000) > (nutritionSettings.maintenanceCalories || 2500) ? 'Surplus Mode' :
                         'Deficit Mode'}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {nutritionSettings.calorieTarget || 2000} cal/day
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {(nutritionSettings.calorieTarget || 2000) === (nutritionSettings.maintenanceCalories || 2500)
                        ? 'Maintaining current weight'
                        : (nutritionSettings.calorieTarget || 2000) > (nutritionSettings.maintenanceCalories || 2500)
                        ? `+${(nutritionSettings.calorieTarget || 2500) - (nutritionSettings.maintenanceCalories || 2500)} cal above maintenance`
                        : `-${(nutritionSettings.maintenanceCalories || 2500) - (nutritionSettings.calorieTarget || 2000)} cal below maintenance`}
                    </p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setGoalDialogOpen(true)}
                  data-testid="button-adjust-goal"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Adjust Goal
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <CardTitle className="text-sm font-medium">Today's Calories</CardTitle>
                <Flame className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{todayCalories?.calories || "--"}</div>
                {todayCalories?.protein && <p className="text-xs text-muted-foreground">{todayCalories.protein}g protein</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <CardTitle className="text-sm font-medium">Current Weight</CardTitle>
                <Scale className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{latestWeight?.weight || "--"} <span className="text-sm font-normal text-muted-foreground">lbs</span></div>
                {latestWeight?.goalWeight && <p className="text-xs text-muted-foreground">Goal: {latestWeight.goalWeight} lbs</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <CardTitle className="text-sm font-medium">Weekly Workouts</CardTitle>
                <Dumbbell className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{weeklyWorkouts}</div>
                <p className="text-xs text-muted-foreground">This week</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <CardTitle className="text-sm font-medium">Streak</CardTitle>
                <Zap className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{weeklyStreak} <span className="text-sm font-normal text-muted-foreground">days</span></div>
                <p className="text-xs text-muted-foreground">Consecutive activity</p>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <div className="flex items-center gap-2">
                  <Footprints className="h-4 w-4 text-emerald-500" />
                  <CardTitle className="text-sm font-medium">Steps</CardTitle>
                </div>
                <div className="flex items-center gap-1">
                  <Button 
                    size="sm" 
                    variant={stepsView === "today" ? "default" : "ghost"}
                    onClick={() => setStepsView("today")}
                    data-testid="button-steps-today"
                  >
                    Today
                  </Button>
                  <Button 
                    size="sm" 
                    variant={stepsView === "weekly" ? "default" : "ghost"}
                    onClick={() => setStepsView("weekly")}
                    data-testid="button-steps-weekly"
                  >
                    Weekly
                  </Button>
                  <Button 
                    size="icon" 
                    variant="ghost"
                    onClick={() => setStepsDialogOpen(true)}
                    data-testid="button-add-steps"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {(() => {
                  const today = format(new Date(), "yyyy-MM-dd");
                  const todayEntry = steps.find(s => s.date === today);
                  const todaySteps = todayEntry?.steps || 0;
                  const todayGoal = todayEntry?.goal || 10000;
                  
                  const weekStart = startOfWeek(subDays(new Date(), stepsWeekOffset * 7), { weekStartsOn: 1 });
                  const weekDays = eachDayOfInterval({ start: weekStart, end: subDays(weekStart, -6) });
                  const weekData = weekDays.map(day => {
                    const dateStr = format(day, "yyyy-MM-dd");
                    const entry = steps.find(s => s.date === dateStr);
                    return {
                      day: format(day, "EEE"),
                      date: dateStr,
                      steps: entry?.steps || 0,
                      goal: entry?.goal || 10000,
                    };
                  });
                  
                  const avgSteps = weekData.length > 0 
                    ? Math.round(weekData.reduce((sum, d) => sum + d.steps, 0) / weekData.filter(d => d.steps > 0).length || 0) 
                    : 0;
                  const daysOverGoal = weekData.filter(d => d.steps >= d.goal).length;

                  if (stepsView === "today") {
                    const progress = Math.min((todaySteps / todayGoal) * 100, 100);
                    return (
                      <div className="space-y-2">
                        <div className="flex items-baseline gap-2">
                          <div className="text-2xl font-bold font-mono">{todaySteps.toLocaleString()}</div>
                          <span className="text-sm text-muted-foreground">/ {todayGoal.toLocaleString()}</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                        <p className="text-xs text-muted-foreground">
                          {todaySteps >= todayGoal ? 'Goal reached!' : `${(todayGoal - todaySteps).toLocaleString()} steps to go`}
                        </p>
                      </div>
                    );
                  }

                  if (steps.length === 0) {
                    return (
                      <div className="flex flex-col items-center justify-center h-24 text-muted-foreground text-sm gap-2">
                        <p>No steps data available</p>
                        <Button size="sm" variant="outline" onClick={() => setStepsDialogOpen(true)} data-testid="button-add-steps-empty">
                          <Plus className="h-3 w-3 mr-1" /> Add Steps
                        </Button>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Button size="icon" variant="ghost" onClick={() => setStepsWeekOffset(o => o + 1)} data-testid="button-steps-prev-week">
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <span className="text-xs text-muted-foreground">
                            {format(weekStart, "MMM d")} - {format(subDays(weekStart, -6), "MMM d")}
                          </span>
                          <Button size="icon" variant="ghost" onClick={() => setStepsWeekOffset(o => Math.max(0, o - 1))} disabled={stepsWeekOffset === 0} data-testid="button-steps-next-week">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                        <Badge variant={daysOverGoal >= 5 ? "default" : "secondary"}>
                          {daysOverGoal}/7 over goal
                        </Badge>
                      </div>
                      <ResponsiveContainer width="100%" height={100}>
                        <BarChart data={weekData}>
                          <XAxis dataKey="day" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                          <Tooltip 
                            formatter={(value: number) => [`${value.toLocaleString()} steps`, '']}
                            contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                          />
                          <ReferenceLine y={10000} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                          <Bar dataKey="steps" radius={[3, 3, 0, 0]}>
                            {weekData.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={entry.steps >= entry.goal ? 'hsl(142 76% 36%)' : 'hsl(var(--muted-foreground))'} 
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                      {avgSteps > 0 && (
                        <div className="text-xs text-muted-foreground text-center">
                          Avg: <span className="font-mono font-medium">{avgSteps.toLocaleString()}</span> steps/day
                        </div>
                      )}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <div className="flex items-center gap-2">
                  {(() => {
                    const target = nutritionSettings.calorieTarget || 2000;
                    const maintenance = nutritionSettings.maintenanceCalories || 2500;
                    const isDeficit = target < maintenance;
                    const isSurplus = target > maintenance;
                    return isDeficit ? (
                      <TrendingDown className="h-4 w-4 text-green-500" />
                    ) : isSurplus ? (
                      <TrendingUp className="h-4 w-4 text-blue-500" />
                    ) : (
                      <Target className="h-4 w-4 text-amber-500" />
                    );
                  })()}
                  <CardTitle className="text-sm font-medium">Calorie Delta</CardTitle>
                </div>
                <Button 
                  size="icon" 
                  variant="ghost"
                  onClick={() => setDeficitDialogOpen(true)}
                  data-testid="button-log-deficit-overview"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                {(() => {
                  const target = nutritionSettings.calorieTarget || 2000;
                  const maintenance = nutritionSettings.maintenanceCalories || 2500;
                  const isDeficit = target < maintenance;
                  const isSurplus = target > maintenance;
                  const dailyCalories = todayCalories?.calories || 0;
                  const delta = maintenance - dailyCalories;
                  const hasDelta = dailyCalories > 0;
                  
                  if (!hasDelta) {
                    return (
                      <div className="flex flex-col items-center justify-center h-16 text-muted-foreground text-sm gap-2">
                        <p>No calories logged for today</p>
                        <Button size="sm" variant="outline" onClick={() => setDeficitDialogOpen(true)} data-testid="button-add-deficit-empty">
                          <Plus className="h-3 w-3 mr-1" /> Log Delta
                        </Button>
                      </div>
                    );
                  }
                  
                  const targetDelta = maintenance - target;
                  const onTarget = isDeficit 
                    ? delta >= targetDelta * 0.9
                    : isSurplus 
                      ? delta <= targetDelta * 0.9
                      : Math.abs(delta) <= 100;
                  
                  const good = isDeficit
                    ? delta >= targetDelta * 0.6
                    : isSurplus
                      ? delta <= targetDelta * 0.6
                      : Math.abs(delta) <= 200;
                  
                  const displayDelta = delta > 0 ? `-${delta}` : `+${Math.abs(delta)}`;
                  const progressValue = isDeficit
                    ? Math.min((delta / targetDelta) * 100, 100)
                    : isSurplus
                      ? Math.min((Math.abs(delta) / Math.abs(targetDelta)) * 100, 100)
                      : Math.max(0, 100 - Math.abs(delta) / 5);
                  
                  return (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold">
                          <span className={delta > 0 ? "text-green-500" : delta < 0 ? "text-red-500" : ""}>{displayDelta}</span>
                          <span className="text-sm font-normal text-muted-foreground"> cal</span>
                        </div>
                        <Badge variant={onTarget ? "default" : good ? "secondary" : "outline"}>
                          {onTarget ? "On Target" : good ? "Good" : isDeficit ? "Low Deficit" : isSurplus ? "Low Surplus" : "Off Target"}
                        </Badge>
                      </div>
                      <Progress value={Math.max(0, progressValue)} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {isDeficit 
                          ? `Target: -${targetDelta} cal/day (${target} cal goal)`
                          : isSurplus
                            ? `Target: +${Math.abs(targetDelta)} cal/day (${target} cal goal)`
                            : `Maintenance: ${maintenance} cal/day`}
                      </p>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </div>

          {avgDeficit > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <CardTitle className="text-sm font-medium">Avg Deficit (7 days)</CardTitle>
                <TrendingDown className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{avgDeficit} <span className="text-sm font-normal text-muted-foreground">cal/day</span></div>
                <Progress value={Math.min((avgDeficit / 500) * 100, 100)} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-1">Target: 500 cal/day for ~1 lb/week</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...nutrition.slice(0, 3).map(n => ({ type: "nutrition" as const, date: n.date, data: n })),
                  ...strength.slice(0, 2).map(s => ({ type: "strength" as const, date: s.date, data: s })),
                  ...runs.slice(0, 2).map(r => ({ type: "run" as const, date: r.date, data: r })),
                  ...skills.slice(0, 2).map(s => ({ type: "skill" as const, date: s.date, data: s }))]
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .slice(0, 6)
                  .map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center gap-3">
                        {item.type === "nutrition" && <Utensils className="h-4 w-4 text-green-500" />}
                        {item.type === "strength" && <Dumbbell className="h-4 w-4 text-blue-500" />}
                        {item.type === "run" && <Trophy className="h-4 w-4 text-yellow-500" />}
                        {item.type === "skill" && <Target className="h-4 w-4 text-orange-500" />}
                        <div>
                          <p className="text-sm font-medium">
                            {item.type === "nutrition" && `${(item.data as NutritionLog).calories} calories logged`}
                            {item.type === "strength" && `${(item.data as StrengthWorkout).primaryFocus} workout`}
                            {item.type === "run" && `Basketball run - ${(item.data as BasketballRun).gamesPlayed} games`}
                            {item.type === "skill" && `${(item.data as SkillWorkout).drillType} drills`}
                          </p>
                          <p className="text-xs text-muted-foreground">{formatDate(item.date)}</p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))}
                {nutrition.length === 0 && strength.length === 0 && runs.length === 0 && skills.length === 0 && (
                  <p className="text-muted-foreground text-sm">No activity logged yet. Start by adding some data!</p>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Button onClick={() => { setActiveTab("nutrition"); setNutritionDialogOpen(true); }} className="h-auto py-4" data-testid="button-quick-nutrition">
              <div className="flex items-center gap-2">
                <Utensils className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Log Nutrition</div>
                  <div className="text-xs opacity-80">Track today's meals</div>
                </div>
              </div>
            </Button>
            <Button onClick={() => { setActiveTab("strength"); setStrengthDialogOpen(true); }} variant="outline" className="h-auto py-4" data-testid="button-quick-workout">
              <div className="flex items-center gap-2">
                <Dumbbell className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Log Workout</div>
                  <div className="text-xs opacity-80">Record a strength session</div>
                </div>
              </div>
            </Button>
          </div>
        </TabsContent>

        {/* NUTRITION TAB */}
        <TabsContent value="nutrition" className="space-y-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h2 className="text-xl font-semibold">Nutrition Tracking</h2>
            <div className="flex items-center gap-2">
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={() => setCalculatorDialogOpen(true)}
                data-testid="button-tdee-calculator"
              >
                <Calculator className="h-4 w-4" />
              </Button>
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={() => setSettingsDialogOpen(true)}
                data-testid="button-nutrition-settings"
              >
                <Settings className="h-4 w-4" />
              </Button>
              <NutritionDialog 
                open={nutritionDialogOpen} 
                onOpenChange={(open) => {
                  setNutritionDialogOpen(open);
                  if (!open) setEditingNutrition(null);
                }}
                isDemo={isDemo}
                editData={editingNutrition}
                onEdit={(id, data) => editNutritionMutation.mutate({ id, data })}
              />
              <Button onClick={() => { setEditingNutrition(null); setNutritionDialogOpen(true); }} data-testid="button-add-nutrition">
                <Plus className="h-4 w-4 mr-2" />
                Log Nutrition
              </Button>
              <Button onClick={() => setDeficitDialogOpen(true)} variant="outline" data-testid="button-add-deficit">
                <TrendingDown className="h-4 w-4 mr-2" />
                Update Calorie Delta
              </Button>
            </div>
          </div>

          {/* Date Navigation */}
          <div className="flex items-center justify-center gap-2">
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={() => setSelectedNutritionDate(subDays(selectedNutritionDate, 1))}
              data-testid="button-prev-date"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="flex items-center gap-2 min-w-[140px] justify-center"
                  data-testid="button-date-picker"
                >
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium" data-testid="text-selected-date">
                    {isToday(selectedNutritionDate) ? "Today" : format(selectedNutritionDate, "MMM d, yyyy")}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center">
                <CalendarPicker
                  mode="single"
                  selected={selectedNutritionDate}
                  onSelect={(date) => date && setSelectedNutritionDate(date)}
                  disabled={(date) => date > new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={() => setSelectedNutritionDate(subDays(selectedNutritionDate, -1))}
              disabled={isToday(selectedNutritionDate)}
              data-testid="button-next-date"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            {!isToday(selectedNutritionDate) && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setSelectedNutritionDate(new Date())}
                data-testid="button-today"
              >
                Today
              </Button>
            )}
          </div>

          {/* Dialogs - mounted at page level */}
          <NutritionSettingsDialog
            open={settingsDialogOpen}
            onOpenChange={setSettingsDialogOpen}
            isDemo={isDemo}
            currentSettings={nutritionSettings}
          />
          <TDEECalculatorDialog
            open={calculatorDialogOpen}
            onOpenChange={setCalculatorDialogOpen}
            isDemo={isDemo}
            onApplyTargets={(maintenance, target, protein) => {
              if (!isDemo) {
                // Update settings with calculated values
                apiRequest("PUT", "/api/fitness/nutrition-settings", {
                  maintenanceCalories: maintenance,
                  calorieTarget: target,
                  proteinTarget: protein,
                }).then(() => {
                  queryClient.invalidateQueries({ queryKey: ["/api/fitness/nutrition-settings"] });
                  toast({ title: "Targets updated from calculator" });
                });
              } else {
                // Update demo state so UI reflects changes
                setDemoNutritionSettings(prev => ({
                  ...prev,
                  maintenanceCalories: maintenance,
                  calorieTarget: target,
                  proteinTarget: protein,
                }));
                toast({ title: "Targets updated (demo mode)" });
              }
            }}
          />

          {/* Steps Dialog */}
          <Dialog open={stepsDialogOpen} onOpenChange={setStepsDialogOpen}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Log Steps</DialogTitle>
                <DialogDescription>Add your daily step count</DialogDescription>
              </DialogHeader>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                saveStepsMutation.mutate({
                  date: formData.get('date') as string,
                  steps: parseInt(formData.get('steps') as string),
                  goal: parseInt(formData.get('goal') as string) || 10000,
                });
              }}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input type="date" name="date" defaultValue={format(new Date(), "yyyy-MM-dd")} required data-testid="input-steps-date" />
                  </div>
                  <div className="space-y-2">
                    <Label>Steps</Label>
                    <Input type="number" name="steps" placeholder="e.g. 10000" required min="0" data-testid="input-steps-count" />
                  </div>
                  <div className="space-y-2">
                    <Label>Goal</Label>
                    <Input type="number" name="goal" defaultValue="10000" min="0" data-testid="input-steps-goal" />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setStepsDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={saveStepsMutation.isPending} data-testid="button-save-steps">Save</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Today's Breakdown - Main Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{isToday(selectedNutritionDate) ? "Today's Breakdown" : format(selectedNutritionDate, "MMM d") + " Breakdown"}</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedDateCalories ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-muted/50 rounded-md">
                      <div className="text-2xl font-bold font-mono">{selectedDateCalories.calories || 0}</div>
                      <div className="text-xs text-muted-foreground">Calories</div>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-md">
                      <div className="text-2xl font-bold font-mono">{selectedDateCalories.protein || 0}g</div>
                      <div className="text-xs text-muted-foreground">Protein</div>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-md">
                      <div className="text-2xl font-bold font-mono">{selectedDateCalories.carbs || 0}g</div>
                      <div className="text-xs text-muted-foreground">Carbs</div>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-md">
                      <div className="text-2xl font-bold font-mono">{selectedDateCalories.fats || 0}g</div>
                      <div className="text-xs text-muted-foreground">Fats</div>
                    </div>
                  </div>
                  {(() => {
                    const meals = selectedDateCalories.meals as Meal[] | null;
                    if (!meals || !Array.isArray(meals) || meals.length === 0) return null;
                    return (
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Meals Logged</div>
                        <div className="space-y-1">
                          {meals.map((meal) => (
                            <div key={meal.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-md text-sm">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{meal.name}</span>
                                {meal.time && <span className="text-muted-foreground text-xs">{meal.time}</span>}
                              </div>
                              <div className="flex items-center gap-3 text-muted-foreground">
                                <span>{meal.calories} cal</span>
                                <span>{meal.protein}g protein</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-4">No data logged for this day. Use "Log Nutrition" above to add meals.</p>
              )}
            </CardContent>
          </Card>

          {/* Macro Progress Bars */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between gap-2">
                  <span>Calories</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {selectedDateCalories?.calories || 0} / {nutritionSettings.calorieTarget}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const eaten = selectedDateCalories?.calories || 0;
                  const target = nutritionSettings.calorieTarget || 2000;
                  const percentage = Math.min((eaten / target) * 100, 150);
                  const isOver = eaten > target;
                  const remaining = target - eaten;
                  return (
                    <div className="space-y-2">
                      <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`absolute left-0 top-0 h-full rounded-full transition-all ${isOver ? 'bg-red-500' : 'bg-green-500'}`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                      <p className={`text-xs ${isOver ? 'text-red-500' : 'text-muted-foreground'}`}>
                        {isOver ? `${Math.abs(remaining)} over target` : `${remaining} remaining`}
                      </p>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between gap-2">
                  <span>Protein</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {selectedDateCalories?.protein || 0}g / {nutritionSettings.proteinTarget}g
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const eaten = selectedDateCalories?.protein || 0;
                  const target = nutritionSettings.proteinTarget || 150;
                  const percentage = Math.min((eaten / target) * 100, 150);
                  const isOver = eaten > target * 1.2; // Over 120% of target
                  const hitTarget = eaten >= target && !isOver;
                  const remaining = target - eaten;
                  const barColor = isOver ? 'bg-red-500' : hitTarget ? 'bg-green-500' : 'bg-amber-500';
                  const textColor = isOver ? 'text-red-500' : hitTarget ? 'text-green-500' : 'text-muted-foreground';
                  return (
                    <div className="space-y-2">
                      <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`absolute left-0 top-0 h-full rounded-full transition-all ${barColor}`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                      <p className={`text-xs ${textColor}`}>
                        {isOver ? `${Math.abs(remaining)}g over target` : hitTarget ? 'Target reached!' : `${remaining}g remaining`}
                      </p>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </div>

          {/* Deficit Bank & Daily Habits */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-sm flex items-center gap-2">
                    {(() => {
                      const target = nutritionSettings.calorieTarget || 2000;
                      const maintenance = nutritionSettings.maintenanceCalories || 2500;
                      const isDeficit = target < maintenance;
                      const isSurplus = target > maintenance;
                      return isDeficit ? (
                        <TrendingDown className="h-4 w-4 text-green-500" />
                      ) : isSurplus ? (
                        <TrendingUp className="h-4 w-4 text-blue-500" />
                      ) : (
                        <Target className="h-4 w-4 text-amber-500" />
                      );
                    })()}
                    Calorie Delta
                  </CardTitle>
                  <CardDescription className="text-xs">Calories vs. maintenance</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {(() => {
                  const target = nutritionSettings.calorieTarget || 2000;
                  const maintenance = nutritionSettings.maintenanceCalories || 2500;
                  const isDeficitMode = target < maintenance;
                  const isSurplusMode = target > maintenance;
                  const dailyCalories = selectedDateCalories?.calories || 0;
                  const delta = maintenance - dailyCalories;
                  const hasDelta = dailyCalories > 0;
                  
                  if (!hasDelta) {
                    return (
                      <div className="flex flex-col items-center justify-center h-16 text-muted-foreground text-sm">
                        <p>No calories logged</p>
                      </div>
                    );
                  }
                  
                  const targetDelta = maintenance - target;
                  const onTarget = isDeficitMode 
                    ? delta >= targetDelta * 0.9
                    : isSurplusMode 
                      ? delta <= targetDelta * 0.9
                      : Math.abs(delta) <= 100;
                  
                  const displayDelta = delta > 0 ? `-${delta}` : `+${Math.abs(delta)}`;
                  
                  return (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className={`text-3xl font-bold font-mono ${delta > 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {displayDelta}
                        </div>
                        <Badge variant={onTarget ? "default" : "outline"} className="text-xs">
                          {onTarget ? "On Target" : isDeficitMode ? "Low" : isSurplusMode ? "Low" : "Off"}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div className="flex justify-between">
                          <span>Maintenance</span>
                          <span className="font-mono">{maintenance}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Eaten</span>
                          <span className="font-mono">{dailyCalories}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Goal</span>
                          <span className="font-mono">{target} ({isDeficitMode ? 'deficit' : isSurplusMode ? 'surplus' : 'maintain'})</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <CardTitle className="text-sm">Daily Habits</CardTitle>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={() => setHabitsManageOpen(!habitsManageOpen)}
                  data-testid="button-manage-habits"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <DailyHabitsContent 
                  todayCalories={selectedDateCalories || undefined}
                  nutritionSettings={nutritionSettings}
                  isDemo={isDemo}
                  onToggleHabit={handleToggleHabit}
                  manageMode={habitsManageOpen}
                  onRemoveHabit={handleRemoveHabit}
                />
                {habitsManageOpen && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex gap-2">
                      <Input 
                        placeholder="New habit name..."
                        value={newHabitName}
                        onChange={(e) => setNewHabitName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddHabit(newHabitName)}
                        data-testid="input-new-habit"
                      />
                      <Button 
                        size="icon"
                        onClick={() => handleAddHabit(newHabitName)}
                        disabled={!newHabitName.trim()}
                        data-testid="button-add-habit"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Weekly/Monthly Chart */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  {chartPeriod === "weekly" ? "Weekly" : "Monthly"} Overview
                </CardTitle>
                <CardDescription>Your nutrition trends over the past {chartPeriod === "weekly" ? "7 days" : "30 days"}</CardDescription>
              </div>
              <div className="flex items-center gap-1">
                <Button 
                  size="sm" 
                  variant={chartPeriod === "weekly" ? "default" : "ghost"}
                  onClick={() => setChartPeriod("weekly")}
                  data-testid="button-chart-weekly"
                >
                  Weekly
                </Button>
                <Button 
                  size="sm" 
                  variant={chartPeriod === "monthly" ? "default" : "ghost"}
                  onClick={() => setChartPeriod("monthly")}
                  data-testid="button-chart-monthly"
                >
                  Monthly
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {(() => {
                const today = new Date();
                const daysBack = chartPeriod === "weekly" ? 6 : 29;
                const periodDays = eachDayOfInterval({
                  start: subDays(today, daysBack),
                  end: today
                });
                
                const chartData = periodDays.map(day => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const log = aggregateNutritionForDate(dateStr);
                  return {
                    day: chartPeriod === "weekly" ? format(day, 'EEE') : format(day, 'd'),
                    fullDate: format(day, 'MMM d'),
                    calories: log?.calories || 0,
                    protein: log?.protein || 0,
                    target: nutritionSettings.calorieTarget || 2000,
                    proteinTarget: nutritionSettings.proteinTarget || 150,
                    hasData: !!log
                  };
                });

                const weeklyAvgCalories = chartData.filter(d => d.hasData).reduce((sum, d) => sum + d.calories, 0) / 
                  Math.max(chartData.filter(d => d.hasData).length, 1);
                const weeklyAvgProtein = chartData.filter(d => d.hasData).reduce((sum, d) => sum + d.protein, 0) / 
                  Math.max(chartData.filter(d => d.hasData).length, 1);
                const daysLogged = chartData.filter(d => d.hasData).length;

                const totalDays = chartPeriod === "weekly" ? 7 : 30;

                if (daysLogged === 0) {
                  return (
                    <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                      No data logged this {chartPeriod === "weekly" ? "week" : "month"}. Start logging to see your trends!
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-3 bg-muted/50 rounded-md">
                        <div className="text-xl font-bold font-mono">{daysLogged}/{totalDays}</div>
                        <div className="text-xs text-muted-foreground">Days Logged</div>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-md">
                        <div className={`text-xl font-bold font-mono ${weeklyAvgCalories <= (nutritionSettings.calorieTarget || 2000) ? 'text-green-500' : 'text-amber-500'}`}>
                          {Math.round(weeklyAvgCalories)}
                        </div>
                        <div className="text-xs text-muted-foreground">Avg Calories</div>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-md">
                        <div className={`text-xl font-bold font-mono ${weeklyAvgProtein >= (nutritionSettings.proteinTarget || 150) ? 'text-green-500' : 'text-amber-500'}`}>
                          {Math.round(weeklyAvgProtein)}g
                        </div>
                        <div className="text-xs text-muted-foreground">Avg Protein</div>
                      </div>
                    </div>

                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis 
                            dataKey="day" 
                            tick={{ fontSize: 12 }} 
                            className="fill-muted-foreground"
                          />
                          <YAxis 
                            tick={{ fontSize: 12 }} 
                            className="fill-muted-foreground"
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--card))', 
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '6px'
                            }}
                            labelFormatter={(value, payload) => payload?.[0]?.payload?.fullDate || value}
                            formatter={(value: number, name: string) => {
                              if (name === 'calories') return [`${value} cal`, 'Calories'];
                              if (name === 'protein') return [`${value}g`, 'Protein'];
                              return [value, name];
                            }}
                          />
                          <Legend />
                          <ReferenceLine 
                            y={nutritionSettings.calorieTarget || 2000} 
                            stroke="hsl(var(--destructive))" 
                            strokeDasharray="3 3" 
                            label={{ value: 'Target', fill: 'hsl(var(--destructive))', fontSize: 10, position: 'right' }}
                          />
                          <Bar 
                            dataKey="calories" 
                            name="calories"
                            radius={[4, 4, 0, 0]}
                          >
                            {chartData.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`}
                                fill={!entry.hasData ? 'hsl(var(--muted))' : 
                                  entry.calories <= (nutritionSettings.calorieTarget || 2000) ? 
                                  'hsl(142 76% 36%)' : 'hsl(0 84% 60%)'}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* Nutrition History */}
          <Card>
            <CardHeader>
              <CardTitle>Nutrition History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {nutrition.length === 0 ? (
                  <p className="text-muted-foreground">No nutrition logs yet</p>
                ) : (
                  nutrition.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10).map((log) => {
                    const calTarget = nutritionSettings.calorieTarget || 2000;
                    const proteinTarget = nutritionSettings.proteinTarget || 150;
                    const calOk = (log.calories || 0) <= calTarget;
                    const proteinOk = (log.protein || 0) >= proteinTarget;
                    return (
                      <div key={log.id} className="flex items-center justify-between py-2 border-b last:border-0" data-testid={`log-nutrition-${log.id}`}>
                        <div className="flex items-center gap-4 flex-wrap">
                          <div className="text-sm font-medium w-20">{formatShortDate(log.date)}</div>
                          <div className="flex gap-3 text-sm">
                            <span className={calOk ? 'text-green-500' : 'text-red-500'}>{log.calories} cal</span>
                            <span className={proteinOk ? 'text-green-500' : 'text-amber-500'}>{log.protein}g P</span>
                            {log.carbs && <span className="text-muted-foreground">{log.carbs}g C</span>}
                            {log.fats && <span className="text-muted-foreground">{log.fats}g F</span>}
                          </div>
                          <div className="flex gap-2">
                            {log.waterGallon && <Badge variant="outline" className="text-xs">Water</Badge>}
                            {log.creatine && <Badge variant="outline" className="text-xs">Creatine</Badge>}
                          </div>
                        </div>
                        {!isDemo && (
                          <div className="flex gap-1">
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              onClick={() => {
                                setEditingNutrition(log);
                                setNutritionDialogOpen(true);
                              }}
                              data-testid={`button-edit-nutrition-${log.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              onClick={() => deleteNutritionMutation.mutate(log.id)}
                              data-testid={`button-delete-nutrition-${log.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SPORTS TAB */}
        <TabsContent value="sports" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Basketball Training</h2>
          </div>

          <Tabs value={sportsSubTab} onValueChange={(v) => setSportsSubTab(v as SportsSubTab)}>
            <TabsList>
              <TabsTrigger value="runs" data-testid="subtab-runs">
                <Trophy className="h-4 w-4 mr-2" />
                Live Play
              </TabsTrigger>
              <TabsTrigger value="drills" data-testid="subtab-drills">
                <Target className="h-4 w-4 mr-2" />
                Practice
              </TabsTrigger>
              <TabsTrigger value="cardio" data-testid="subtab-cardio">
                <Footprints className="h-4 w-4 mr-2" />
                Cardio
              </TabsTrigger>
            </TabsList>

            <TabsContent value="runs" className="space-y-4 mt-4">
              <div className="flex justify-end gap-2">
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={() => setLivePlaySettingsOpen(true)}
                  data-testid="button-live-play-settings"
                >
                  <Settings className="h-4 w-4" />
                </Button>
                <RunDialog 
                  open={runDialogOpen} 
                  onOpenChange={(open) => {
                    setRunDialogOpen(open);
                    if (!open) setEditingRun(null);
                  }}
                  isDemo={isDemo}
                  visibleFields={livePlayVisibleFields}
                  editData={editingRun}
                  onEdit={(id, data) => editRunMutation.mutate({ id, data })}
                />
                <Button onClick={() => { setEditingRun(null); setRunDialogOpen(true); }} data-testid="button-add-run">
                  <Plus className="h-4 w-4 mr-2" />
                  Log Run
                </Button>
              </div>
              <LivePlaySettingsDialog
                open={livePlaySettingsOpen}
                onOpenChange={setLivePlaySettingsOpen}
                isDemo={isDemo}
                defaultFields={DEFAULT_LIVE_PLAY_FIELDS}
                currentVisibleFields={livePlayVisibleFields}
              />

              <div className="grid gap-4 md:grid-cols-3">
                {runs.length === 0 ? (
                  <Card className="md:col-span-3">
                    <CardContent className="py-8 text-center">
                      <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No live play sessions logged yet</p>
                    </CardContent>
                  </Card>
                ) : (
                  runs.sort((a, b) => b.date.localeCompare(a.date)).map((run) => {
                    const gameType = run.gameType as { fullCourt?: boolean; halfCourt?: boolean } | null;
                    return (
                      <Card key={run.id} data-testid={`card-run-${run.id}`}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between gap-2">
                            <CardTitle className="text-sm">{formatDate(run.date)}</CardTitle>
                            {!isDemo && (
                              <div className="flex gap-1">
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  onClick={() => {
                                    setEditingRun(run);
                                    setRunDialogOpen(true);
                                  }}
                                  data-testid={`button-edit-run-${run.id}`}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="ghost" onClick={() => deleteRunMutation.mutate(run.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                          <CardDescription>{gameType?.fullCourt ? "Full Court" : "Half Court"} - {run.courtType}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Games</span>
                              <span>{run.gamesPlayed}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Record</span>
                              <span className="font-medium">{run.wins}W - {run.losses}L</span>
                            </div>
                            {run.performanceGrade && (
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Grade</span>
                                <Badge variant="secondary">{run.performanceGrade}</Badge>
                              </div>
                            )}
                            {run.confidence && (
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Confidence</span>
                                <span>{run.confidence}/10</span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </TabsContent>

            <TabsContent value="drills" className="space-y-4 mt-4">
              <div className="flex justify-end">
                <SkillDialog 
                  open={skillDialogOpen} 
                  onOpenChange={(open) => {
                    setSkillDialogOpen(open);
                    if (!open) setEditingSkill(null);
                  }}
                  isDemo={isDemo}
                  editData={editingSkill}
                  onEdit={(id, data) => editSkillMutation.mutate({ id, data })}
                />
                <Button onClick={() => { setEditingSkill(null); setSkillDialogOpen(true); }} data-testid="button-add-skill">
                  <Plus className="h-4 w-4 mr-2" />
                  Log Drill Session
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {skills.length === 0 ? (
                  <Card className="md:col-span-2">
                    <CardContent className="py-8 text-center">
                      <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No skill workouts logged yet</p>
                    </CardContent>
                  </Card>
                ) : (
                  skills.sort((a, b) => b.date.localeCompare(a.date)).map((workout) => {
                    const skillFocus = Array.isArray(workout.skillFocus) ? workout.skillFocus as string[] : [];
                    const zoneFocus = Array.isArray(workout.zoneFocus) ? workout.zoneFocus as string[] : [];
                    const drillStats = workout.drillStats as { makes?: number; attempts?: number } | null;
                    return (
                      <Card key={workout.id} data-testid={`card-skill-${workout.id}`}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between gap-2">
                            <CardTitle className="text-sm">{formatDate(workout.date)}</CardTitle>
                            {!isDemo && (
                              <div className="flex gap-1">
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  onClick={() => {
                                    setEditingSkill(workout);
                                    setSkillDialogOpen(true);
                                  }}
                                  data-testid={`button-edit-skill-${workout.id}`}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="ghost" onClick={() => deleteSkillMutation.mutate(workout.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                          <CardDescription>{workout.drillType}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {workout.effort && (
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Effort</span>
                                <span>{workout.effort}/10</span>
                              </div>
                            )}
                            {drillStats?.makes && drillStats?.attempts && (
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Shooting</span>
                                <span>{drillStats.makes}/{drillStats.attempts} ({Math.round((drillStats.makes / drillStats.attempts) * 100)}%)</span>
                              </div>
                            )}
                            {skillFocus.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {skillFocus.map((skill, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">{skill}</Badge>
                                ))}
                              </div>
                            )}
                            {zoneFocus.length > 0 && (
                              <p className="text-xs text-muted-foreground">Zones: {zoneFocus.join(", ")}</p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </TabsContent>

            <TabsContent value="cardio" className="space-y-4 mt-4">
              <div className="flex justify-end">
                <Button onClick={() => setCardioDialogOpen(true)} data-testid="button-log-cardio">
                  <Plus className="h-4 w-4 mr-2" />
                  Log Cardio Run
                </Button>
                <CardioRunDialog 
                  open={cardioDialogOpen} 
                  onOpenChange={(open) => {
                    setCardioDialogOpen(open);
                    if (!open) setEditingCardio(null);
                  }}
                  isDemo={isDemo}
                  editData={editingCardio}
                  onEdit={(id, data) => editCardioMutation.mutate({ id, data })}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {cardioRuns.length === 0 ? (
                  <Card className="md:col-span-3">
                    <CardContent className="py-8 text-center">
                      <Footprints className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No cardio runs logged yet</p>
                    </CardContent>
                  </Card>
                ) : (
                  cardioRuns.sort((a, b) => b.date.localeCompare(a.date)).map((run) => (
                    <Card key={run.id} data-testid={`card-cardio-${run.id}`}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between gap-2">
                          <CardTitle className="text-sm">{formatDate(run.date)}</CardTitle>
                          {!isDemo && (
                            <div className="flex items-center gap-1">
                              <Button size="icon" variant="ghost" onClick={() => { setEditingCardio(run); setCardioDialogOpen(true); }} data-testid={`button-edit-cardio-${run.id}`}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="ghost" onClick={() => deleteCardioMutation.mutate(run.id)} data-testid={`button-delete-cardio-${run.id}`}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                        <CardDescription>{run.terrain} - {run.location}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Distance</span>
                            <span>{((run.distance || 0) / 1609.34).toFixed(2)} mi</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Duration</span>
                            <span>{run.duration} min</span>
                          </div>
                          {run.pace && (
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Pace</span>
                              <span>{run.pace}/mi</span>
                            </div>
                          )}
                          {run.effort && (
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Effort</span>
                              <span>{run.effort}/10</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* STRENGTH TAB */}
        <TabsContent value="strength" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Strength Training</h2>
            <StrengthDialog 
              open={strengthDialogOpen} 
              onOpenChange={(open) => {
                setStrengthDialogOpen(open);
                if (!open) setEditingStrength(null);
              }}
              isDemo={isDemo}
              editData={editingStrength}
              onEdit={(id, data) => editStrengthMutation.mutate({ id, data })}
            />
            <Button onClick={() => { setEditingStrength(null); setStrengthDialogOpen(true); }} data-testid="button-add-strength">
              <Plus className="h-4 w-4 mr-2" />
              Log Workout
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">This Week</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{strength.filter(s => {
                  try { return isThisWeek(parseISO(s.date), { weekStartsOn: 1 }); } catch { return false; }
                }).length}</div>
                <p className="text-xs text-muted-foreground">workouts</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Total Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {strength.filter(s => {
                    try { return isThisWeek(parseISO(s.date), { weekStartsOn: 1 }); } catch { return false; }
                  }).reduce((acc, s) => acc + (s.volume || 0), 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">lbs this week</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Avg Duration</CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const recent = strength.slice(0, 5);
                  const avg = recent.length > 0 ? Math.round(recent.reduce((acc, s) => acc + (s.duration || 0), 0) / recent.length) : 0;
                  return (
                    <>
                      <div className="text-2xl font-bold">{avg}</div>
                      <p className="text-xs text-muted-foreground">minutes</p>
                    </>
                  );
                })()}
              </CardContent>
            </Card>
          </div>

          {/* Strength Analytics Section */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Volume Progression Chart */}
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Volume Progression
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {volumeChartView === "weekly" ? "Daily volume this week (lbs)" : "Weekly volume progression (lbs)"}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant={volumeChartView === "weekly" ? "default" : "ghost"}
                    onClick={() => setVolumeChartView("weekly")}
                    data-testid="button-volume-weekly"
                  >
                    Week
                  </Button>
                  <Button
                    size="sm"
                    variant={volumeChartView === "monthly" ? "default" : "ghost"}
                    onClick={() => setVolumeChartView("monthly")}
                    data-testid="button-volume-monthly"
                  >
                    Month
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {(() => {
                  if (volumeChartView === "weekly") {
                    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
                    const days = Array.from({ length: 7 }, (_, i) => {
                      const day = addDays(weekStart, i);
                      const dayWorkouts = strength.filter(s => {
                        try {
                          const d = parseISO(s.date);
                          return format(d, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
                        } catch { return false; }
                      });
                      const totalVolume = dayWorkouts.reduce((sum, w) => sum + (w.volume || 0), 0);
                      return {
                        day: format(day, 'EEE'),
                        volume: totalVolume,
                        workouts: dayWorkouts.length
                      };
                    });

                    if (days.every(d => d.volume === 0)) {
                      return (
                        <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
                          Log workouts to see daily volume
                        </div>
                      );
                    }

                    return (
                      <ResponsiveContainer width="100%" height={160}>
                        <BarChart data={days}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="day" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                          <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v.toString()} />
                          <Tooltip 
                            formatter={(value: number) => [`${value.toLocaleString()} lbs`, 'Volume']}
                            contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                          />
                          <Bar dataKey="volume" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    );
                  } else {
                    const last4Weeks = Array.from({ length: 4 }, (_, i) => {
                      const weekStart = startOfWeek(subDays(new Date(), i * 7), { weekStartsOn: 1 });
                      const weekEnd = subDays(startOfWeek(subDays(new Date(), (i - 1) * 7), { weekStartsOn: 1 }), 1);
                      const weekWorkouts = strength.filter(s => {
                        try {
                          const d = parseISO(s.date);
                          return d >= weekStart && d <= weekEnd;
                        } catch { return false; }
                      });
                      const totalVolume = weekWorkouts.reduce((sum, w) => sum + (w.volume || 0), 0);
                      return {
                        week: i === 0 ? 'This Week' : i === 1 ? 'Last Week' : `${i}w ago`,
                        volume: totalVolume,
                        workouts: weekWorkouts.length
                      };
                    }).reverse();

                    if (last4Weeks.every(w => w.volume === 0)) {
                      return (
                        <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
                          Log workouts to see volume trends
                        </div>
                      );
                    }

                    return (
                      <ResponsiveContainer width="100%" height={160}>
                        <BarChart data={last4Weeks}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="week" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                          <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                          <Tooltip 
                            formatter={(value: number) => [`${value.toLocaleString()} lbs`, 'Volume']}
                            contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                          />
                          <Bar dataKey="volume" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    );
                  }
                })()}
              </CardContent>
            </Card>

            {/* Focus Breakdown Pie Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Focus Breakdown
                </CardTitle>
                <CardDescription className="text-xs">Distribution by muscle group (last 30 days)</CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  const thirtyDaysAgo = subDays(new Date(), 30);
                  const recentWorkouts = strength.filter(s => {
                    try { return parseISO(s.date) >= thirtyDaysAgo; } catch { return false; }
                  });
                  
                  const focusCounts: Record<string, number> = {};
                  recentWorkouts.forEach(w => {
                    const focus = w.primaryFocus || 'Other';
                    focusCounts[focus] = (focusCounts[focus] || 0) + 1;
                  });
                  
                  const pieData = Object.entries(focusCounts).map(([name, value]) => ({ name, value }));
                  
                  const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(142 76% 36%)', 'hsl(48 96% 53%)', 'hsl(280 87% 60%)'];

                  if (pieData.length === 0) {
                    return (
                      <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
                        Log workouts to see focus breakdown
                      </div>
                    );
                  }

                  return (
                    <div className="flex items-center gap-4">
                      <ResponsiveContainer width={120} height={120}>
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={30}
                            outerRadius={50}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {pieData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value: number) => [`${value} workouts`, '']}
                            contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex-1 space-y-1">
                        {pieData.map((entry, index) => (
                          <div key={entry.name} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-sm" 
                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                              />
                              <span>{entry.name}</span>
                            </div>
                            <span className="font-mono text-muted-foreground">{entry.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </div>

          {/* PR Tracker */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-500" />
                Personal Records
              </CardTitle>
              <CardDescription className="text-xs">Your heaviest lifts for each exercise</CardDescription>
            </CardHeader>
            <CardContent>
              {(() => {
                const exercisePRs: Record<string, { weight: number; date: string; sets: number; reps: number }> = {};
                
                strength.forEach(workout => {
                  const exercises = Array.isArray(workout.exercises) ? workout.exercises as Array<{ name: string; sets: number; reps: number; weight: number }> : [];
                  exercises.forEach(ex => {
                    if (!exercisePRs[ex.name] || ex.weight > exercisePRs[ex.name].weight) {
                      exercisePRs[ex.name] = { weight: ex.weight, date: workout.date, sets: ex.sets, reps: ex.reps };
                    }
                  });
                });
                
                const prList = Object.entries(exercisePRs).sort((a, b) => b[1].weight - a[1].weight);
                
                if (prList.length === 0) {
                  return (
                    <div className="flex items-center justify-center h-20 text-muted-foreground text-sm">
                      Log exercises with weights to track PRs
                    </div>
                  );
                }

                return (
                  <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                    {prList.slice(0, 6).map(([name, pr]) => (
                      <div key={name} className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                        <div>
                          <div className="font-medium text-sm">{name}</div>
                          <div className="text-xs text-muted-foreground">{pr.sets}x{pr.reps}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold font-mono">{pr.weight} lbs</div>
                          <div className="text-xs text-muted-foreground">{format(parseISO(pr.date), 'MMM d')}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Workout History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {strength.length === 0 ? (
                  <p className="text-muted-foreground">No workouts logged yet</p>
                ) : (
                  strength.sort((a, b) => b.date.localeCompare(a.date)).map((workout) => {
                    const exercises = Array.isArray(workout.exercises) ? workout.exercises as Array<{ name: string; sets: number; reps: number; weight: number }> : [];
                    return (
                      <div key={workout.id} className="border rounded-md p-4" data-testid={`card-strength-${workout.id}`}>
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-medium">{workout.primaryFocus} Day</h4>
                            <p className="text-sm text-muted-foreground">{formatDate(workout.date)}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {workout.duration && <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />{workout.duration}min</Badge>}
                            {workout.volume && <Badge variant="secondary">{workout.volume.toLocaleString()} vol</Badge>}
                            {!isDemo && (
                              <div className="flex gap-1">
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  onClick={() => {
                                    setEditingStrength(workout);
                                    setStrengthDialogOpen(true);
                                  }}
                                  data-testid={`button-edit-strength-${workout.id}`}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="ghost" onClick={() => deleteStrengthMutation.mutate(workout.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                        {exercises.length > 0 && (
                          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                            {exercises.map((ex, idx) => (
                              <div key={idx} className="bg-muted/50 rounded px-3 py-2 text-sm">
                                <div className="font-medium">{ex.name}</div>
                                <div className="text-muted-foreground">{ex.sets}x{ex.reps} @ {ex.weight}lbs</div>
                              </div>
                            ))}
                          </div>
                        )}
                        {workout.notes && <p className="text-sm text-muted-foreground mt-2">{workout.notes}</p>}
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* BODY COMP TAB */}
        <TabsContent value="body-comp" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Body Composition</h2>
            <BodyCompDialog 
              open={bodyCompDialogOpen} 
              onOpenChange={(open) => {
                setBodyCompDialogOpen(open);
                if (!open) setEditingBodyComp(null);
              }}
              isDemo={isDemo}
              editData={editingBodyComp}
              onEdit={(id, data) => editBodyCompMutation.mutate({ id, data })}
            />
            <Button onClick={() => { setEditingBodyComp(null); setBodyCompDialogOpen(true); }} data-testid="button-add-body-comp">
              <Plus className="h-4 w-4 mr-2" />
              Log Body Comp
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Current Weight</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{latestWeight?.weight || "--"}</div>
                <p className="text-xs text-muted-foreground">lbs</p>
                {latestWeight && bodyComp.length > 1 && (() => {
                  const sorted = [...bodyComp].sort((a, b) => b.date.localeCompare(a.date));
                  const diff = (sorted[0].weight || 0) - (sorted[1].weight || 0);
                  return (
                    <div className={`flex items-center gap-1 mt-1 text-xs ${diff < 0 ? "text-green-500" : diff > 0 ? "text-red-500" : "text-muted-foreground"}`}>
                      {diff < 0 ? <TrendingDown className="h-3 w-3" /> : diff > 0 ? <TrendingUp className="h-3 w-3" /> : null}
                      {diff !== 0 && <span>{Math.abs(diff)} lbs from last</span>}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Body Fat</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{latestWeight?.bodyFat || "--"}</div>
                <p className="text-xs text-muted-foreground">%</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Goal Progress</CardTitle>
              </CardHeader>
              <CardContent>
                {latestWeight?.goalWeight && latestWeight?.weight ? (
                  <>
                    <div className="text-sm mb-2">
                      <span className="font-medium">{latestWeight.weight}</span> / <span className="text-muted-foreground">{latestWeight.goalWeight} lbs</span>
                    </div>
                    <Progress value={Math.max(0, Math.min(100, ((latestWeight.weight - latestWeight.goalWeight) / (bodyComp[bodyComp.length - 1]?.weight || latestWeight.weight) - latestWeight.goalWeight) * 100))} />
                    <p className="text-xs text-muted-foreground mt-1">{Math.abs(latestWeight.weight - latestWeight.goalWeight)} lbs to go</p>
                  </>
                ) : (
                  <p className="text-muted-foreground text-sm">Set a goal weight to track</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Weight History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {bodyComp.length === 0 ? (
                  <p className="text-muted-foreground">No body composition records yet</p>
                ) : (
                  bodyComp.sort((a, b) => b.date.localeCompare(a.date)).map((record, idx, arr) => {
                    const prevRecord = arr[idx + 1];
                    const weightChange = prevRecord ? (record.weight || 0) - (prevRecord.weight || 0) : 0;
                    return (
                      <div key={record.id} className="flex items-center justify-between py-2 border-b last:border-0" data-testid={`record-body-${record.id}`}>
                        <div className="flex items-center gap-4">
                          <div className="text-sm font-medium w-28">{formatDate(record.date)}</div>
                          <div className="flex items-center gap-4">
                            <span className="font-medium">{record.weight} lbs</span>
                            {record.bodyFat && <span className="text-muted-foreground">{record.bodyFat}% BF</span>}
                            {weightChange !== 0 && (
                              <Badge variant={weightChange < 0 ? "secondary" : "outline"} className="text-xs">
                                {weightChange > 0 ? "+" : ""}{weightChange} lbs
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {record.photoUrl && <Camera className="h-4 w-4 text-muted-foreground" />}
                          {!isDemo && (
                            <div className="flex gap-1">
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                onClick={() => {
                                  setEditingBodyComp(record);
                                  setBodyCompDialogOpen(true);
                                }}
                                data-testid={`button-edit-body-${record.id}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="ghost" onClick={() => deleteBodyCompMutation.mutate(record.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <DeficitDialog
        open={deficitDialogOpen}
        onOpenChange={setDeficitDialogOpen}
        isDemo={isDemo}
        nutritionSettings={nutritionSettings}
      />
      
      <GoalDialog
        open={goalDialogOpen}
        onOpenChange={setGoalDialogOpen}
        isDemo={isDemo}
        nutritionSettings={nutritionSettings}
        onSave={(data) => updateGoalMutation.mutate(data)}
      />
    </div>
  );
}

function NutritionDialog({ open, onOpenChange, isDemo, editData, onEdit }: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  isDemo: boolean;
  editData?: NutritionLog | null;
  onEdit?: (id: string, data: Partial<NutritionLog>) => void;
}) {
  const { toast } = useToast();
  const [logMode, setLogMode] = useState<"meal" | "total" | "ai">("total");
  const [formData, setFormData] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    calories: "",
    protein: "",
    carbs: "",
    fats: "",
  });
  const [meals, setMeals] = useState<Meal[]>([]);
  const [newMeal, setNewMeal] = useState({ name: "", calories: "", protein: "", time: "" });
  
  // AI chat mode state
  const [aiChatMessages, setAiChatMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [aiUserInput, setAiUserInput] = useState("");
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<{
    mealName: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    breakdown: string;
  } | null>(null);
  const aiChatEndRef = useRef<HTMLDivElement>(null);

  const isEditing = !!editData;

  useEffect(() => {
    if (editData) {
      setFormData({
        date: editData.date,
        calories: editData.calories?.toString() || "",
        protein: editData.protein?.toString() || "",
        carbs: editData.carbs?.toString() || "",
        fats: editData.fats?.toString() || "",
      });
      const editMeals = Array.isArray(editData.meals) ? editData.meals as Meal[] : [];
      setMeals(editMeals);
      setLogMode(editMeals.length > 0 ? "meal" : "total");
    } else {
      setFormData({ date: format(new Date(), "yyyy-MM-dd"), calories: "", protein: "", carbs: "", fats: "" });
      setMeals([]);
      setLogMode("total");
      setAiChatMessages([]);
      setAiUserInput("");
      setAiResult(null);
    }
  }, [editData]);

  useEffect(() => {
    aiChatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiChatMessages]);

  const sendAiMessage = async () => {
    if (!aiUserInput.trim()) return;
    const userMessage = aiUserInput.trim();
    const updatedMessages = [...aiChatMessages, { role: 'user' as const, content: userMessage }];
    setAiChatMessages(updatedMessages);
    setAiUserInput("");
    setAiAnalyzing(true);
    setAiResult(null);
    try {
      const res = await apiRequest("POST", "/api/fitness/nutrition/analyze", { history: updatedMessages });
      const data = await res.json();
      if (data.isFinal) {
        setAiResult(data);
        setAiChatMessages([...updatedMessages, { role: 'assistant', content: `Got it! Here's my estimate for "${data.mealName}": ${data.calories} cal, ${data.protein}g protein, ${data.carbs}g carbs, ${data.fats}g fat.` }]);
      } else {
        setAiChatMessages([...updatedMessages, { role: 'assistant', content: data.message }]);
      }
    } catch (error) {
      toast({ title: "Failed to analyze food", variant: "destructive" });
    } finally {
      setAiAnalyzing(false);
    }
  };

  const resetAiChat = () => {
    setAiChatMessages([]);
    setAiUserInput("");
    setAiResult(null);
  };

  const applyAiResult = () => {
    if (!aiResult) return;
    // Add as a meal entry so it shows in the meals list
    const meal: Meal = {
      id: `ai-meal-${Date.now()}`,
      name: aiResult.mealName,
      calories: aiResult.calories,
      protein: aiResult.protein,
      time: format(new Date(), "h:mm a"),
    };
    const newMeals = [...meals, meal];
    setMeals(newMeals);
    // Update totals
    const totalCalories = (parseInt(formData.calories) || 0) + aiResult.calories;
    const totalProtein = (parseInt(formData.protein) || 0) + aiResult.protein;
    const totalCarbs = (parseInt(formData.carbs) || 0) + aiResult.carbs;
    const totalFats = (parseInt(formData.fats) || 0) + aiResult.fats;
    setFormData({
      ...formData,
      calories: totalCalories.toString(),
      protein: totalProtein.toString(),
      carbs: totalCarbs.toString(),
      fats: totalFats.toString(),
    });
    setLogMode("meal"); // Switch to meal mode so they can see it and add more
    setAiResult(null);
    setAiChatMessages([]);
    setAiUserInput("");
    toast({ title: `Added "${aiResult.mealName}" to meals` });
  };

  const addMeal = () => {
    if (!newMeal.name || !newMeal.calories) return;
    const meal: Meal = {
      id: `meal-${Date.now()}`,
      name: newMeal.name,
      calories: parseInt(newMeal.calories) || 0,
      protein: parseInt(newMeal.protein) || 0,
      time: newMeal.time || undefined,
    };
    setMeals([...meals, meal]);
    const totalCalories = (parseInt(formData.calories) || 0) + meal.calories;
    const totalProtein = (parseInt(formData.protein) || 0) + meal.protein;
    setFormData({ ...formData, calories: totalCalories.toString(), protein: totalProtein.toString() });
    setNewMeal({ name: "", calories: "", protein: "", time: "" });
  };

  const removeMeal = (mealId: string) => {
    const meal = meals.find(m => m.id === mealId);
    if (meal) {
      const totalCalories = Math.max(0, (parseInt(formData.calories) || 0) - meal.calories);
      const totalProtein = Math.max(0, (parseInt(formData.protein) || 0) - meal.protein);
      setFormData({ ...formData, calories: totalCalories.toString(), protein: totalProtein.toString() });
    }
    setMeals(meals.filter(m => m.id !== mealId));
  };

  const createMutation = useMutation({
    mutationFn: async (data: Partial<NutritionLog>) => {
      const res = await apiRequest("POST", "/api/fitness/nutrition", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fitness/nutrition"] });
      toast({ title: "Nutrition logged" });
      onOpenChange(false);
      setFormData({ date: format(new Date(), "yyyy-MM-dd"), calories: "", protein: "", carbs: "", fats: "" });
      setMeals([]);
      setLogMode("total");
    },
    onError: () => {
      toast({ title: "Failed to log nutrition", variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (isDemo) {
      toast({ title: "Demo mode - data not saved" });
      onOpenChange(false);
      return;
    }
    const payload = {
      date: formData.date,
      calories: formData.calories ? parseInt(formData.calories) : undefined,
      protein: formData.protein ? parseInt(formData.protein) : undefined,
      carbs: formData.carbs ? parseInt(formData.carbs) : undefined,
      fats: formData.fats ? parseInt(formData.fats) : undefined,
      meals: meals.length > 0 ? meals : undefined,
    };
    if (isEditing && editData && onEdit) {
      onEdit(editData.id, payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Nutrition" : "Log Nutrition"}</DialogTitle>
          <DialogDescription>{isEditing ? "Update your nutrition log" : "Track your daily food intake with individual meals"}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Date</Label>
            <Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} data-testid="input-nutrition-date" />
          </div>

          {/* Log Mode Toggle */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant={logMode === "total" ? "default" : "outline"}
              onClick={() => setLogMode("total")}
              data-testid="button-log-mode-total"
            >
              Log Totals
            </Button>
            <Button
              type="button"
              size="sm"
              variant={logMode === "meal" ? "default" : "outline"}
              onClick={() => setLogMode("meal")}
              data-testid="button-log-mode-meal"
            >
              Log by Meal
            </Button>
            <Button
              type="button"
              size="sm"
              variant={logMode === "ai" ? "default" : "outline"}
              onClick={() => setLogMode("ai")}
              data-testid="button-log-mode-ai"
            >
              <Sparkles className="h-4 w-4 mr-1" /> Log by AI
            </Button>
          </div>
          
          {/* Add Individual Meal - only shown in meal mode */}
          {logMode === "meal" && (
          <div className="space-y-3 p-3 border rounded-md">
            <div className="text-sm font-medium">Add Meal</div>
            <div className="grid grid-cols-2 gap-2">
              <Input 
                placeholder="Meal name" 
                value={newMeal.name} 
                onChange={(e) => setNewMeal({ ...newMeal, name: e.target.value })} 
                data-testid="input-meal-name"
              />
              <Input 
                placeholder="Time (optional)" 
                value={newMeal.time} 
                onChange={(e) => setNewMeal({ ...newMeal, time: e.target.value })} 
                data-testid="input-meal-time"
              />
              <Input 
                type="number" 
                placeholder="Calories" 
                value={newMeal.calories} 
                onChange={(e) => setNewMeal({ ...newMeal, calories: e.target.value })} 
                data-testid="input-meal-calories"
              />
              <Input 
                type="number" 
                placeholder="Protein (g)" 
                value={newMeal.protein} 
                onChange={(e) => setNewMeal({ ...newMeal, protein: e.target.value })} 
                data-testid="input-meal-protein"
              />
            </div>
            <Button size="sm" onClick={addMeal} disabled={!newMeal.name || !newMeal.calories} data-testid="button-add-meal">
              <Plus className="h-4 w-4 mr-1" /> Add Meal
            </Button>

            {/* Meals List */}
            {meals.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Meals Added</div>
                {meals.map((meal) => (
                  <div key={meal.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-md text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{meal.name}</span>
                      {meal.time && <span className="text-muted-foreground text-xs">{meal.time}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{meal.calories} cal, {meal.protein}g</span>
                      <Button size="icon" variant="ghost" onClick={() => removeMeal(meal.id)} data-testid={`button-remove-meal-${meal.id}`}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          )}

          {/* AI Mode - Conversational */}
          {logMode === "ai" && (
          <div className="space-y-3 p-3 border rounded-md">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-medium">Chat with AI to log your food</div>
              {aiChatMessages.length > 0 && (
                <Button size="sm" variant="ghost" onClick={resetAiChat} data-testid="button-ai-reset">
                  Start Over
                </Button>
              )}
            </div>
            
            {/* Chat Messages */}
            {aiChatMessages.length > 0 && (
              <div className="max-h-48 overflow-y-auto space-y-2 p-2 bg-muted/30 rounded-md">
                {aiChatMessages.map((msg, i) => (
                  <div key={i} className={`text-sm p-2 rounded-md ${msg.role === 'user' ? 'bg-primary/10 ml-4' : 'bg-muted mr-4'}`}>
                    <span className="text-xs text-muted-foreground">{msg.role === 'user' ? 'You' : 'AI'}:</span>
                    <p>{msg.content}</p>
                  </div>
                ))}
                <div ref={aiChatEndRef} />
              </div>
            )}

            {/* Input Area */}
            <div className="flex gap-2">
              <Input
                placeholder={aiChatMessages.length === 0 ? "What did you eat? e.g., I had a burrito..." : "Type your answer..."}
                value={aiUserInput}
                onChange={(e) => setAiUserInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !aiAnalyzing && sendAiMessage()}
                disabled={aiAnalyzing}
                data-testid="input-ai-chat"
              />
              <Button 
                size="icon" 
                onClick={sendAiMessage} 
                disabled={!aiUserInput.trim() || aiAnalyzing}
                data-testid="button-ai-send"
              >
                {aiAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>

            {/* Result Card */}
            {aiResult && (
              <div className="space-y-2 p-3 bg-muted/50 rounded-md">
                <div className="font-medium">{aiResult.mealName}</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Calories: <span className="font-medium">{aiResult.calories}</span></div>
                  <div>Protein: <span className="font-medium">{aiResult.protein}g</span></div>
                  <div>Carbs: <span className="font-medium">{aiResult.carbs}g</span></div>
                  <div>Fats: <span className="font-medium">{aiResult.fats}g</span></div>
                </div>
                <p className="text-xs text-muted-foreground">{aiResult.breakdown}</p>
                <Button size="sm" onClick={applyAiResult} data-testid="button-ai-apply">
                  <Check className="h-4 w-4 mr-1" /> Use This Estimate
                </Button>
              </div>
            )}
          </div>
          )}

          {/* Totals - only shown in total or meal mode */}
          {logMode !== "ai" && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Total Calories</Label>
              <Input type="number" placeholder="2000" value={formData.calories} onChange={(e) => setFormData({ ...formData, calories: e.target.value })} data-testid="input-nutrition-calories" />
            </div>
            <div className="space-y-2">
              <Label>Total Protein (g)</Label>
              <Input type="number" placeholder="150" value={formData.protein} onChange={(e) => setFormData({ ...formData, protein: e.target.value })} data-testid="input-nutrition-protein" />
            </div>
            <div className="space-y-2">
              <Label>Carbs (g)</Label>
              <Input type="number" placeholder="200" value={formData.carbs} onChange={(e) => setFormData({ ...formData, carbs: e.target.value })} data-testid="input-nutrition-carbs" />
            </div>
            <div className="space-y-2">
              <Label>Fats (g)</Label>
              <Input type="number" placeholder="65" value={formData.fats} onChange={(e) => setFormData({ ...formData, fats: e.target.value })} data-testid="input-nutrition-fats" />
            </div>
          </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={createMutation.isPending} data-testid="button-save-nutrition">
            {createMutation.isPending ? "Saving..." : (isEditing ? "Update" : "Save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeficitDialog({ open, onOpenChange, isDemo, nutritionSettings }: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  isDemo: boolean;
  nutritionSettings: NutritionSettings | null;
}) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    deficit: "",
  });
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [finalEstimate, setFinalEstimate] = useState<{ estimatedDeficit: number; breakdown: { exerciseCalories: number; neatBonus: number; proteinTEF: number; explanation: string } } | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const resetChat = () => {
    setChatMessages([]);
    setUserInput("");
    setShowChat(false);
    setFinalEstimate(null);
  };

  const startAIConversation = async () => {
    setShowChat(true);
    setIsLoading(true);
    setChatMessages([]);
    setFinalEstimate(null);
    
    try {
      const res = await apiRequest("POST", "/api/fitness/deficit/chat", {
        date: formData.date,
        history: [],
        maintenanceCalories: nutritionSettings?.maintenanceCalories || 2500,
        proteinIntake: nutritionSettings?.proteinTarget || 150,
      });
      const data = await res.json();
      
      setChatMessages([{ role: 'assistant', content: data.message }]);
      
      if (data.isFinal && data.estimatedDeficit !== undefined) {
        setFinalEstimate({
          estimatedDeficit: data.estimatedDeficit,
          breakdown: data.breakdown,
        });
      }
    } catch (error) {
      toast({ title: "Failed to start AI conversation", variant: "destructive" });
      setShowChat(false);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!userInput.trim() || isLoading) return;
    
    const newUserMessage = { role: 'user' as const, content: userInput.trim() };
    const updatedHistory = [...chatMessages, newUserMessage];
    setChatMessages(updatedHistory);
    setUserInput("");
    setIsLoading(true);
    
    try {
      const res = await apiRequest("POST", "/api/fitness/deficit/chat", {
        date: formData.date,
        history: updatedHistory,
        maintenanceCalories: nutritionSettings?.maintenanceCalories || 2500,
        proteinIntake: nutritionSettings?.proteinTarget || 150,
      });
      const data = await res.json();
      
      setChatMessages([...updatedHistory, { role: 'assistant', content: data.message }]);
      
      if (data.isFinal && data.estimatedDeficit !== undefined) {
        setFinalEstimate({
          estimatedDeficit: data.estimatedDeficit,
          breakdown: data.breakdown,
        });
      }
    } catch (error) {
      toast({ title: "Failed to get AI response", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const acceptEstimate = () => {
    if (finalEstimate) {
      setFormData(prev => ({ ...prev, deficit: finalEstimate.estimatedDeficit.toString() }));
      setShowChat(false);
    }
  };

  const updateMutation = useMutation({
    mutationFn: async (data: { date: string; deficit: number }) => {
      const res = await apiRequest("POST", "/api/fitness/nutrition/deficit", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fitness/nutrition"] });
      toast({ title: "Deficit logged" });
      onOpenChange(false);
      setFormData({ date: format(new Date(), "yyyy-MM-dd"), deficit: "" });
      resetChat();
    },
    onError: () => {
      toast({ title: "Failed to log deficit", variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (isDemo) {
      toast({ title: "Demo mode - data not saved" });
      onOpenChange(false);
      return;
    }
    if (!formData.deficit) {
      toast({ title: "Please enter a deficit value", variant: "destructive" });
      return;
    }
    updateMutation.mutate({
      date: formData.date,
      deficit: parseInt(formData.deficit),
    });
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { onOpenChange(val); if (!val) resetChat(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log Caloric Deficit</DialogTitle>
          <DialogDescription>Enter your daily caloric deficit manually or use AI to estimate based on your activities</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Date</Label>
            <Input 
              type="date" 
              value={formData.date} 
              onChange={(e) => { setFormData({ ...formData, date: e.target.value }); resetChat(); }} 
              data-testid="input-deficit-date" 
            />
          </div>

          <div className="space-y-2">
            <Label>Deficit (calories)</Label>
            <Input 
              type="number" 
              placeholder="500" 
              value={formData.deficit} 
              onChange={(e) => setFormData({ ...formData, deficit: e.target.value })} 
              data-testid="input-deficit-value" 
            />
          </div>

          <div className="border-t pt-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <Label className="text-base font-medium">AI Estimation</Label>
                <p className="text-sm text-muted-foreground">Chat with AI to estimate your caloric burn for the day</p>
              </div>
              {!showChat && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={startAIConversation} 
                  disabled={isLoading}
                  data-testid="button-start-ai-chat"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  {isLoading ? "Starting..." : "Get AI Estimate"}
                </Button>
              )}
            </div>

            {showChat && (
              <div className="space-y-3">
                <div className="bg-muted/30 rounded-md p-3 max-h-[250px] overflow-y-auto space-y-3">
                  {chatMessages.map((msg, idx) => (
                    <div 
                      key={idx} 
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div 
                        className={`max-w-[85%] rounded-md px-3 py-2 text-sm ${
                          msg.role === 'user' 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted'
                        }`}
                        data-testid={`chat-message-${msg.role}-${idx}`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-md px-3 py-2 text-sm text-muted-foreground">
                        Thinking...
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {finalEstimate ? (
                  <div className="bg-muted/50 rounded-md p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">Estimated Deficit:</span>
                      <Badge variant="secondary" className="text-lg px-3 py-1">{finalEstimate.estimatedDeficit} cal</Badge>
                    </div>
                    {finalEstimate.breakdown && (
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div className="flex justify-between gap-2">
                          <span>Exercise calories:</span>
                          <span>{finalEstimate.breakdown.exerciseCalories} cal</span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span>NEAT bonus:</span>
                          <span>{finalEstimate.breakdown.neatBonus} cal</span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span>Protein TEF:</span>
                          <span>{finalEstimate.breakdown.proteinTEF} cal</span>
                        </div>
                        <p className="pt-2 text-xs">{finalEstimate.breakdown.explanation}</p>
                      </div>
                    )}
                    <div className="flex gap-2 pt-2">
                      <Button 
                        type="button" 
                        size="sm" 
                        onClick={acceptEstimate}
                        data-testid="button-accept-estimate"
                      >
                        Use This Estimate
                      </Button>
                      <Button 
                        type="button" 
                        size="sm" 
                        variant="outline"
                        onClick={startAIConversation}
                        data-testid="button-restart-chat"
                      >
                        Start Over
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type your response..."
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                      disabled={isLoading}
                      data-testid="input-chat-message"
                    />
                    <Button 
                      type="button" 
                      size="icon"
                      onClick={sendMessage}
                      disabled={isLoading || !userInput.trim()}
                      data-testid="button-send-message"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={updateMutation.isPending} data-testid="button-save-deficit">
            {updateMutation.isPending ? "Saving..." : "Save Deficit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function GoalDialog({ open, onOpenChange, isDemo, nutritionSettings, onSave }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isDemo: boolean;
  nutritionSettings: NutritionSettings;
  onSave: (data: { goalType: string; calorieTarget: number; maintenanceCalories: number; weight?: number; height?: number; age?: number; gender?: string; activityLevel?: string }) => void;
}) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("settings");
  const [goalMode, setGoalMode] = useState(nutritionSettings.goalType || 'moderate_cut');
  const [customGoalLabel, setCustomGoalLabel] = useState("");
  const [maintenance, setMaintenance] = useState(nutritionSettings.maintenanceCalories?.toString() || '2500');
  const [target, setTarget] = useState(nutritionSettings.calorieTarget?.toString() || '2000');
  const [isCustomMode, setIsCustomMode] = useState(false);
  
  // TDEE Calculator state
  const [tdeeData, setTdeeData] = useState({
    weight: "",
    height: "",
    age: "",
    gender: "male",
    activityLevel: "moderate",
  });
  const [tdeeResult, setTdeeResult] = useState<{ bmr: number; tdee: number } | null>(null);
  
  // AI Chat state
  const [showAIChat, setShowAIChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState<{
    goalType: string;
    goalLabel: string;
    calorieTarget: number;
    maintenanceCalories: number;
    proteinTarget: number;
    explanation: string;
    weeklyChangeEstimate: string;
  } | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    if (open) {
      const presetModes = ['aggressive_cut', 'moderate_cut', 'light_cut', 'maintenance', 'lean_bulk', 'bulk'];
      const currentGoal = nutritionSettings.goalType || 'moderate_cut';
      setIsCustomMode(!presetModes.includes(currentGoal));
      setGoalMode(presetModes.includes(currentGoal) ? currentGoal : 'custom');
      setCustomGoalLabel(!presetModes.includes(currentGoal) ? currentGoal : "");
      setMaintenance(nutritionSettings.maintenanceCalories?.toString() || '2500');
      setTarget(nutritionSettings.calorieTarget?.toString() || '2000');
      
      // Pre-populate TDEE data from saved settings
      setTdeeData({
        weight: nutritionSettings.weight?.toString() || "",
        height: nutritionSettings.height?.toString() || "",
        age: nutritionSettings.age?.toString() || "",
        gender: nutritionSettings.gender || "male",
        activityLevel: nutritionSettings.activityLevel || "moderate",
      });
      
      // If we have saved TDEE data, recalculate the result
      if (nutritionSettings.weight && nutritionSettings.height && nutritionSettings.age) {
        const weightKg = nutritionSettings.weight * 0.453592;
        const heightCm = nutritionSettings.height * 2.54;
        const gender = nutritionSettings.gender || "male";
        const bmr = gender === "male"
          ? Math.round(10 * weightKg + 6.25 * heightCm - 5 * nutritionSettings.age + 5)
          : Math.round(10 * weightKg + 6.25 * heightCm - 5 * nutritionSettings.age - 161);
        const multipliers: Record<string, number> = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9 };
        const multiplier = multipliers[nutritionSettings.activityLevel || "moderate"] || 1.55;
        const tdee = Math.round(bmr * multiplier);
        setTdeeResult({ bmr, tdee });
      } else {
        setTdeeResult(null);
      }
    }
  }, [open, nutritionSettings]);

  useEffect(() => {
    if (goalMode !== 'custom') {
      const maintenanceCal = parseInt(maintenance) || 2500;
      let newTarget = maintenanceCal;
      
      switch (goalMode) {
        case 'aggressive_cut': newTarget = maintenanceCal - 750; break;
        case 'moderate_cut': newTarget = maintenanceCal - 500; break;
        case 'light_cut': newTarget = maintenanceCal - 250; break;
        case 'maintenance': newTarget = maintenanceCal; break;
        case 'lean_bulk': newTarget = maintenanceCal + 250; break;
        case 'bulk': newTarget = maintenanceCal + 500; break;
      }
      setTarget(newTarget.toString());
    }
  }, [goalMode, maintenance]);

  const calculateBMR = (weight: number, height: number, age: number, gender: string) => {
    const weightKg = weight * 0.453592;
    const heightCm = height * 2.54;
    if (gender === "male") {
      return Math.round(10 * weightKg + 6.25 * heightCm - 5 * age + 5);
    }
    return Math.round(10 * weightKg + 6.25 * heightCm - 5 * age - 161);
  };

  const activityMultipliers: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };

  const calculateTDEE = () => {
    const weight = parseFloat(tdeeData.weight);
    const height = parseFloat(tdeeData.height);
    const age = parseInt(tdeeData.age);
    
    if (!weight || !height || !age) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }
    
    const bmr = calculateBMR(weight, height, age, tdeeData.gender);
    const tdee = Math.round(bmr * (activityMultipliers[tdeeData.activityLevel] || 1.55));
    setTdeeResult({ bmr, tdee });
  };

  const applyTDEE = () => {
    if (tdeeResult) {
      setMaintenance(tdeeResult.tdee.toString());
      setActiveTab("settings");
      toast({ title: "TDEE applied as maintenance calories" });
    }
  };

  const startAIChat = async () => {
    setIsLoading(true);
    setChatMessages([]);
    setAiRecommendation(null);
    
    // Use TDEE result if available, otherwise use saved nutrition settings
    const hasStats = tdeeResult || (nutritionSettings.weight && nutritionSettings.height && nutritionSettings.age);
    const currentStats = hasStats ? {
      weight: tdeeData.weight || nutritionSettings.weight?.toString() || "",
      height: tdeeData.height || nutritionSettings.height?.toString() || "",
      age: tdeeData.age || nutritionSettings.age?.toString() || "",
      gender: tdeeData.gender || nutritionSettings.gender || "male",
      activityLevel: tdeeData.activityLevel || nutritionSettings.activityLevel || "moderate",
      tdee: tdeeResult?.tdee || nutritionSettings.maintenanceCalories || null,
    } : null;
    
    try {
      const res = await apiRequest("POST", "/api/fitness/goal/chat", {
        history: [],
        currentStats,
        currentGoal: {
          goalType: nutritionSettings.goalType,
          calorieTarget: nutritionSettings.calorieTarget,
          maintenanceCalories: nutritionSettings.maintenanceCalories,
        },
      });
      const data = await res.json();
      setChatMessages([{ role: 'assistant', content: data.message }]);
      if (data.isFinal && data.recommendation) {
        setAiRecommendation(data.recommendation);
      }
    } catch {
      toast({ title: "Failed to start AI conversation", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!userInput.trim() || isLoading) return;
    
    const newUserMessage = { role: 'user' as const, content: userInput.trim() };
    const updatedHistory = [...chatMessages, newUserMessage];
    setChatMessages(updatedHistory);
    setUserInput("");
    setIsLoading(true);
    
    // Use TDEE result if available, otherwise use saved nutrition settings
    const hasStats = tdeeResult || (nutritionSettings.weight && nutritionSettings.height && nutritionSettings.age);
    const currentStats = hasStats ? {
      weight: tdeeData.weight || nutritionSettings.weight?.toString() || "",
      height: tdeeData.height || nutritionSettings.height?.toString() || "",
      age: tdeeData.age || nutritionSettings.age?.toString() || "",
      gender: tdeeData.gender || nutritionSettings.gender || "male",
      activityLevel: tdeeData.activityLevel || nutritionSettings.activityLevel || "moderate",
      tdee: tdeeResult?.tdee || nutritionSettings.maintenanceCalories || null,
    } : null;
    
    try {
      const res = await apiRequest("POST", "/api/fitness/goal/chat", {
        history: updatedHistory,
        currentStats,
        currentGoal: {
          goalType: nutritionSettings.goalType,
          calorieTarget: nutritionSettings.calorieTarget,
          maintenanceCalories: nutritionSettings.maintenanceCalories,
        },
      });
      const data = await res.json();
      setChatMessages([...updatedHistory, { role: 'assistant', content: data.message }]);
      if (data.isFinal && data.recommendation) {
        setAiRecommendation(data.recommendation);
      }
    } catch {
      toast({ title: "Failed to get AI response", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const applyAIRecommendation = () => {
    if (aiRecommendation) {
      setGoalMode('custom');
      setIsCustomMode(true);
      setCustomGoalLabel(aiRecommendation.goalLabel);
      setMaintenance(aiRecommendation.maintenanceCalories.toString());
      setTarget(aiRecommendation.calorieTarget.toString());
      setActiveTab("settings");
      toast({ title: "AI recommendation applied" });
    }
  };

  const handleSave = () => {
    if (isDemo) {
      toast({ title: "Demo mode - changes not saved" });
      onOpenChange(false);
      return;
    }
    
    const finalGoalType = goalMode === 'custom' ? (customGoalLabel || 'custom') : goalMode;
    onSave({
      goalType: finalGoalType,
      calorieTarget: parseInt(target) || 2000,
      maintenanceCalories: parseInt(maintenance) || 2500,
      // Include TDEE data if available
      weight: tdeeData.weight ? parseInt(tdeeData.weight) : undefined,
      height: tdeeData.height ? parseInt(tdeeData.height) : undefined,
      age: tdeeData.age ? parseInt(tdeeData.age) : undefined,
      gender: tdeeData.gender || undefined,
      activityLevel: tdeeData.activityLevel || undefined,
    });
  };

  const goalOptions = [
    { value: 'aggressive_cut', label: 'Aggressive Cut', description: '-750 cal/day' },
    { value: 'moderate_cut', label: 'Moderate Cut', description: '-500 cal/day' },
    { value: 'light_cut', label: 'Light Cut', description: '-250 cal/day' },
    { value: 'maintenance', label: 'Maintenance', description: 'No change' },
    { value: 'lean_bulk', label: 'Lean Bulk', description: '+250 cal/day' },
    { value: 'bulk', label: 'Bulk', description: '+500 cal/day' },
    { value: 'custom', label: 'Custom', description: 'Set your own' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adjust Your Goal</DialogTitle>
          <DialogDescription>
            Calculate your TDEE, set your goal, or get AI recommendations
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-5">
          {/* TDEE Calculator Section */}
          <div className="space-y-3 p-4 bg-muted/30 rounded-md">
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="h-4 w-4" />
              <Label className="font-medium">TDEE Calculator</Label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Weight (lbs)</Label>
                <Input
                  type="number"
                  value={tdeeData.weight}
                  onChange={(e) => setTdeeData({ ...tdeeData, weight: e.target.value })}
                  placeholder="180"
                  data-testid="input-tdee-weight"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Height (in)</Label>
                <Input
                  type="number"
                  value={tdeeData.height}
                  onChange={(e) => setTdeeData({ ...tdeeData, height: e.target.value })}
                  placeholder="70"
                  data-testid="input-tdee-height"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Age</Label>
                <Input
                  type="number"
                  value={tdeeData.age}
                  onChange={(e) => setTdeeData({ ...tdeeData, age: e.target.value })}
                  placeholder="30"
                  data-testid="input-tdee-age"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Gender</Label>
                <Select value={tdeeData.gender} onValueChange={(v) => setTdeeData({ ...tdeeData, gender: v })}>
                  <SelectTrigger data-testid="select-tdee-gender">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Activity Level</Label>
              <Select value={tdeeData.activityLevel} onValueChange={(v) => setTdeeData({ ...tdeeData, activityLevel: v })}>
                <SelectTrigger data-testid="select-activity-level">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sedentary">Sedentary (desk job)</SelectItem>
                  <SelectItem value="light">Light (1-3 days/week)</SelectItem>
                  <SelectItem value="moderate">Moderate (3-5 days/week)</SelectItem>
                  <SelectItem value="active">Active (6-7 days/week)</SelectItem>
                  <SelectItem value="very_active">Very Active (athlete)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={calculateTDEE} size="sm" variant="secondary" data-testid="button-calculate-tdee">
                Calculate
              </Button>
              {tdeeResult && (
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground">TDEE: <span className="font-bold text-foreground">{tdeeResult.tdee} cal</span></span>
                  <Button onClick={applyTDEE} size="sm" variant="outline" data-testid="button-apply-tdee">
                    Apply
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Goal Mode Section */}
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Maintenance Calories (TDEE)</Label>
              <Input
                type="number"
                value={maintenance}
                onChange={(e) => setMaintenance(e.target.value)}
                placeholder="2500"
                data-testid="input-maintenance-calories"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Goal Mode</Label>
              <Select value={goalMode} onValueChange={(v) => { setGoalMode(v); setIsCustomMode(v === 'custom'); }}>
                <SelectTrigger data-testid="select-goal-mode">
                  <SelectValue placeholder="Select goal" />
                </SelectTrigger>
                <SelectContent>
                  {goalOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <span>{option.label}</span>
                        <span className="text-xs text-muted-foreground">({option.description})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isCustomMode && (
              <div className="space-y-2">
                <Label>Custom Goal Name</Label>
                <Input
                  value={customGoalLabel}
                  onChange={(e) => setCustomGoalLabel(e.target.value)}
                  placeholder="e.g., Summer Shred, Athletic Recomp"
                  data-testid="input-custom-goal-name"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Daily Calorie Target</Label>
              <Input
                type="number"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="2000"
                data-testid="input-calorie-target"
              />
              <p className="text-xs text-muted-foreground">
                {parseInt(maintenance) === parseInt(target)
                  ? 'Eating at maintenance level'
                  : parseInt(target) < parseInt(maintenance)
                    ? `${parseInt(maintenance) - parseInt(target)} cal deficit per day`
                    : `${parseInt(target) - parseInt(maintenance)} cal surplus per day`}
              </p>
            </div>
            
            {/* Ask AI Button */}
            {!showAIChat ? (
              <Button 
                onClick={() => { setShowAIChat(true); startAIChat(); }} 
                variant="outline" 
                className="w-full"
                disabled={isLoading}
                data-testid="button-ask-ai"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Ask AI to Help Choose Goal
              </Button>
            ) : (
              <div className="space-y-3 p-4 bg-muted/30 rounded-md">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    <Label className="font-medium">AI Goal Advisor</Label>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => { setShowAIChat(false); setChatMessages([]); setAiRecommendation(null); }}>
                    Close
                  </Button>
                </div>
                
                <div className="max-h-[200px] overflow-y-auto space-y-2">
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-md px-3 py-2 text-sm ${
                        msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-background border'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-background border rounded-md px-3 py-2 text-sm text-muted-foreground">
                        Thinking...
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
                
                {aiRecommendation ? (
                  <div className="bg-background border rounded-md p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-sm">{aiRecommendation.goalLabel}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>Target: <span className="font-medium">{aiRecommendation.calorieTarget} cal</span></div>
                      <div>Protein: <span className="font-medium">{aiRecommendation.proteinTarget}g</span></div>
                    </div>
                    <p className="text-xs text-muted-foreground">{aiRecommendation.explanation}</p>
                    <Button onClick={applyAIRecommendation} size="sm" className="w-full" data-testid="button-apply-ai">
                      Apply Recommendation
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type your response..."
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                      disabled={isLoading}
                      data-testid="input-ai-chat"
                    />
                    <Button size="icon" onClick={sendMessage} disabled={isLoading || !userInput.trim()} data-testid="button-send-ai">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter className="pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} data-testid="button-save-goal">Save Goal</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type Exercise = { name: string; sets: number; reps: number; weight: number };

function StrengthDialog({ open, onOpenChange, isDemo, editData, onEdit }: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  isDemo: boolean;
  editData?: StrengthWorkout | null;
  onEdit?: (id: string, data: Partial<StrengthWorkout>) => void;
}) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    primaryFocus: "Push",
    duration: "",
    effort: "",
    notes: "",
  });
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [newExercise, setNewExercise] = useState({ name: "", sets: "", reps: "", weight: "" });

  const isEditing = !!editData;

  useEffect(() => {
    if (editData) {
      setFormData({
        date: editData.date,
        primaryFocus: editData.primaryFocus || "Push",
        duration: editData.duration?.toString() || "",
        effort: editData.effort?.toString() || "",
        notes: editData.notes || "",
      });
      const exs = Array.isArray(editData.exercises) ? editData.exercises as Exercise[] : [];
      setExercises(exs);
    } else {
      setFormData({ date: format(new Date(), "yyyy-MM-dd"), primaryFocus: "Push", duration: "", effort: "", notes: "" });
      setExercises([]);
    }
  }, [editData]);

  const addExercise = () => {
    if (!newExercise.name || !newExercise.sets || !newExercise.reps) return;
    const exercise: Exercise = {
      name: newExercise.name,
      sets: parseInt(newExercise.sets) || 0,
      reps: parseInt(newExercise.reps) || 0,
      weight: parseInt(newExercise.weight) || 0,
    };
    setExercises([...exercises, exercise]);
    setNewExercise({ name: "", sets: "", reps: "", weight: "" });
  };

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const calculateVolume = () => {
    return exercises.reduce((total, ex) => total + (ex.sets * ex.reps * ex.weight), 0);
  };

  const createMutation = useMutation({
    mutationFn: async (data: Partial<StrengthWorkout>) => {
      const res = await apiRequest("POST", "/api/fitness/strength", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fitness/strength"] });
      toast({ title: "Workout logged" });
      onOpenChange(false);
      setFormData({ date: format(new Date(), "yyyy-MM-dd"), primaryFocus: "Push", duration: "", effort: "", notes: "" });
      setExercises([]);
    },
    onError: () => {
      toast({ title: "Failed to log workout", variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (isDemo) {
      toast({ title: "Demo mode - data not saved" });
      onOpenChange(false);
      return;
    }
    const payload = {
      date: formData.date,
      type: "Strength",
      primaryFocus: formData.primaryFocus,
      duration: formData.duration ? parseInt(formData.duration) : undefined,
      volume: exercises.length > 0 ? calculateVolume() : undefined,
      effort: formData.effort ? parseInt(formData.effort) : undefined,
      notes: formData.notes || undefined,
      exercises: exercises.length > 0 ? exercises : undefined,
    };
    if (isEditing && editData && onEdit) {
      onEdit(editData.id, payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Strength Workout" : "Log Strength Workout"}</DialogTitle>
          <DialogDescription>{isEditing ? "Update your workout" : "Record your exercises and training session"}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} data-testid="input-strength-date" />
            </div>
            <div className="space-y-2">
              <Label>Focus</Label>
              <Select value={formData.primaryFocus} onValueChange={(v) => setFormData({ ...formData, primaryFocus: v })}>
                <SelectTrigger data-testid="select-strength-focus">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Push">Push</SelectItem>
                  <SelectItem value="Pull">Pull</SelectItem>
                  <SelectItem value="Legs">Legs</SelectItem>
                  <SelectItem value="Upper">Upper</SelectItem>
                  <SelectItem value="Lower">Lower</SelectItem>
                  <SelectItem value="Full Body">Full Body</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Add Exercise */}
          <div className="space-y-3 p-3 border rounded-md">
            <div className="text-sm font-medium">Add Exercise</div>
            <div className="grid grid-cols-2 gap-2">
              <Input 
                placeholder="Exercise name" 
                value={newExercise.name} 
                onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })} 
                data-testid="input-exercise-name"
              />
              <Input 
                type="number" 
                placeholder="Weight (lbs)" 
                value={newExercise.weight} 
                onChange={(e) => setNewExercise({ ...newExercise, weight: e.target.value })} 
                data-testid="input-exercise-weight"
              />
              <Input 
                type="number" 
                placeholder="Sets" 
                value={newExercise.sets} 
                onChange={(e) => setNewExercise({ ...newExercise, sets: e.target.value })} 
                data-testid="input-exercise-sets"
              />
              <Input 
                type="number" 
                placeholder="Reps" 
                value={newExercise.reps} 
                onChange={(e) => setNewExercise({ ...newExercise, reps: e.target.value })} 
                data-testid="input-exercise-reps"
              />
            </div>
            <Button size="sm" onClick={addExercise} disabled={!newExercise.name || !newExercise.sets || !newExercise.reps} data-testid="button-add-exercise">
              <Plus className="h-4 w-4 mr-1" /> Add Exercise
            </Button>
          </div>

          {/* Exercises List */}
          {exercises.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Exercises</div>
                <div className="text-sm text-muted-foreground">Total Volume: {calculateVolume().toLocaleString()} lbs</div>
              </div>
              {exercises.map((exercise, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded-md text-sm">
                  <span className="font-medium">{exercise.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{exercise.sets}x{exercise.reps} @ {exercise.weight}lbs</span>
                    <Button size="icon" variant="ghost" onClick={() => removeExercise(index)} data-testid={`button-remove-exercise-${index}`}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Duration (min)</Label>
              <Input type="number" placeholder="60" value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: e.target.value })} data-testid="input-strength-duration" />
            </div>
            <div className="space-y-2">
              <Label>Effort (1-10)</Label>
              <Input type="number" min="1" max="10" placeholder="8" value={formData.effort} onChange={(e) => setFormData({ ...formData, effort: e.target.value })} data-testid="input-strength-effort" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea placeholder="How did it go?" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} data-testid="input-strength-notes" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={createMutation.isPending} data-testid="button-save-strength">
            {createMutation.isPending ? "Saving..." : (isEditing ? "Update" : "Save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SkillDialog({ open, onOpenChange, isDemo, editData, onEdit }: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  isDemo: boolean;
  editData?: SkillWorkout | null;
  onEdit?: (id: string, data: Partial<SkillWorkout>) => void;
}) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    drillType: "Shooting",
    effort: "",
    notes: "",
  });
  const isEditing = !!editData;

  useEffect(() => {
    if (editData) {
      setFormData({
        date: editData.date,
        drillType: editData.drillType || "Shooting",
        effort: editData.effort?.toString() || "",
        notes: editData.notes || "",
      });
    } else {
      setFormData({ date: format(new Date(), "yyyy-MM-dd"), drillType: "Shooting", effort: "", notes: "" });
    }
  }, [editData]);

  const createMutation = useMutation({
    mutationFn: async (data: Partial<SkillWorkout>) => {
      const res = await apiRequest("POST", "/api/fitness/skill", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fitness/skill"] });
      toast({ title: "Skill workout logged" });
      onOpenChange(false);
      setFormData({ date: format(new Date(), "yyyy-MM-dd"), drillType: "Shooting", effort: "", notes: "" });
    },
    onError: () => {
      toast({ title: "Failed to log skill workout", variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (isDemo) {
      toast({ title: "Demo mode - data not saved" });
      onOpenChange(false);
      return;
    }
    const data = {
      date: formData.date,
      type: "Skill" as const,
      drillType: formData.drillType,
      effort: formData.effort ? parseInt(formData.effort) : undefined,
      notes: formData.notes || undefined,
    };
    if (isEditing && editData && onEdit) {
      onEdit(editData.id, data);
      onOpenChange(false);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Skill Workout" : "Log Skill Workout"}</DialogTitle>
          <DialogDescription>{isEditing ? "Update your drill session details" : "Record your basketball drill session"}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} data-testid="input-skill-date" />
            </div>
            <div className="space-y-2">
              <Label>Drill Type</Label>
              <Select value={formData.drillType} onValueChange={(v) => setFormData({ ...formData, drillType: v })}>
                <SelectTrigger data-testid="select-skill-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Shooting">Shooting</SelectItem>
                  <SelectItem value="Ball Handling">Ball Handling</SelectItem>
                  <SelectItem value="Defense">Defense</SelectItem>
                  <SelectItem value="Conditioning">Conditioning</SelectItem>
                  <SelectItem value="Mixed">Mixed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Effort (1-10)</Label>
            <Input type="number" min="1" max="10" placeholder="8" value={formData.effort} onChange={(e) => setFormData({ ...formData, effort: e.target.value })} data-testid="input-skill-effort" />
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea placeholder="What did you work on?" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} data-testid="input-skill-notes" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={createMutation.isPending} data-testid="button-save-skill">
            {createMutation.isPending ? "Saving..." : (isEditing ? "Update" : "Save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LivePlaySettingsDialog({ 
  open, 
  onOpenChange, 
  isDemo, 
  defaultFields,
  currentVisibleFields 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  isDemo: boolean;
  defaultFields: { id: string; label: string; enabled: boolean }[];
  currentVisibleFields: string[];
}) {
  const { toast } = useToast();
  const [selectedFields, setSelectedFields] = useState<string[]>(currentVisibleFields);

  useEffect(() => {
    setSelectedFields(currentVisibleFields);
  }, [currentVisibleFields]);

  const updateMutation = useMutation({
    mutationFn: async (visibleFields: string[]) => {
      const res = await apiRequest("PUT", "/api/fitness/live-play-settings", { visibleFields });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fitness/live-play-settings"] });
      toast({ title: "Settings saved" });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Failed to save settings", variant: "destructive" });
    },
  });

  const toggleField = (fieldId: string) => {
    setSelectedFields(prev => 
      prev.includes(fieldId) 
        ? prev.filter(f => f !== fieldId)
        : [...prev, fieldId]
    );
  };

  const handleSave = () => {
    if (isDemo) {
      toast({ title: "Demo mode - settings not saved" });
      onOpenChange(false);
      return;
    }
    updateMutation.mutate(selectedFields);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Live Play Form Fields</DialogTitle>
          <DialogDescription>Choose which fields to show when logging a session</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {defaultFields.map((field) => (
            <div key={field.id} className="flex items-center space-x-3">
              <Checkbox 
                id={field.id}
                checked={selectedFields.includes(field.id)}
                onCheckedChange={() => toggleField(field.id)}
                data-testid={`checkbox-field-${field.id}`}
              />
              <Label htmlFor={field.id} className="cursor-pointer">{field.label}</Label>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={updateMutation.isPending} data-testid="button-save-live-play-settings">
            {updateMutation.isPending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RunDialog({ open, onOpenChange, isDemo, visibleFields, editData, onEdit }: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  isDemo: boolean; 
  visibleFields: string[];
  editData?: BasketballRun | null;
  onEdit?: (id: string, data: Partial<BasketballRun>) => void;
}) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    courtType: "Indoor",
    gameType: "fullCourt",
    gamesPlayed: "",
    wins: "",
    losses: "",
    performanceGrade: "",
    confidence: "",
    notes: "",
  });
  const isEditing = !!editData;

  const isVisible = (fieldId: string) => visibleFields.includes(fieldId);

  useEffect(() => {
    if (editData) {
      const gameTypeVal = editData.gameType === "Full Court" ? "fullCourt" : "halfCourt";
      setFormData({
        date: editData.date,
        courtType: editData.courtType || "Indoor",
        gameType: gameTypeVal,
        gamesPlayed: editData.gamesPlayed?.toString() || "",
        wins: editData.wins?.toString() || "",
        losses: editData.losses?.toString() || "",
        performanceGrade: editData.performanceGrade || "",
        confidence: editData.confidence?.toString() || "",
        notes: editData.matchupNotes || "",
      });
    } else {
      setFormData({ date: format(new Date(), "yyyy-MM-dd"), courtType: "Indoor", gameType: "fullCourt", gamesPlayed: "", wins: "", losses: "", performanceGrade: "", confidence: "", notes: "" });
    }
  }, [editData]);

  const createMutation = useMutation({
    mutationFn: async (data: Partial<BasketballRun>) => {
      const res = await apiRequest("POST", "/api/fitness/runs", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fitness/runs"] });
      toast({ title: "Run logged" });
      onOpenChange(false);
      setFormData({ date: format(new Date(), "yyyy-MM-dd"), courtType: "Indoor", gameType: "fullCourt", gamesPlayed: "", wins: "", losses: "", performanceGrade: "", confidence: "", notes: "" });
    },
    onError: () => {
      toast({ title: "Failed to log run", variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (isDemo) {
      toast({ title: "Demo mode - data not saved" });
      onOpenChange(false);
      return;
    }
    const data = {
      date: formData.date,
      type: "Run" as const,
      courtType: formData.courtType,
      gameType: formData.gameType === "fullCourt" ? { fullCourt: true } : { halfCourt: true },
      gamesPlayed: formData.gamesPlayed ? parseInt(formData.gamesPlayed) : undefined,
      wins: formData.wins ? parseInt(formData.wins) : undefined,
      losses: formData.losses ? parseInt(formData.losses) : undefined,
      performanceGrade: formData.performanceGrade || undefined,
      confidence: formData.confidence ? parseInt(formData.confidence) : undefined,
      matchupNotes: formData.notes || undefined,
    };
    if (isEditing && editData && onEdit) {
      onEdit(editData.id, data);
      onOpenChange(false);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Live Play Session" : "Log Live Play Session"}</DialogTitle>
          <DialogDescription>{isEditing ? "Update your session details" : "Record your live play session"}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            {isVisible("date") && (
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} data-testid="input-run-date" />
              </div>
            )}
            {isVisible("courtType") && (
              <div className="space-y-2">
                <Label>Court Type</Label>
                <Select value={formData.courtType} onValueChange={(v) => setFormData({ ...formData, courtType: v })}>
                  <SelectTrigger data-testid="select-run-court">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Indoor">Indoor</SelectItem>
                    <SelectItem value="Outdoor">Outdoor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          {isVisible("gameType") && (
            <div className="space-y-2">
              <Label>Game Type</Label>
              <Select value={formData.gameType} onValueChange={(v) => setFormData({ ...formData, gameType: v })}>
                <SelectTrigger data-testid="select-run-game-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fullCourt">Full Court</SelectItem>
                  <SelectItem value="halfCourt">Half Court</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid grid-cols-3 gap-4">
            {isVisible("gamesPlayed") && (
              <div className="space-y-2">
                <Label>Games</Label>
                <Input type="number" placeholder="5" value={formData.gamesPlayed} onChange={(e) => setFormData({ ...formData, gamesPlayed: e.target.value })} data-testid="input-run-games" />
              </div>
            )}
            {isVisible("wins") && (
              <div className="space-y-2">
                <Label>Wins</Label>
                <Input type="number" placeholder="3" value={formData.wins} onChange={(e) => setFormData({ ...formData, wins: e.target.value })} data-testid="input-run-wins" />
              </div>
            )}
            {isVisible("losses") && (
              <div className="space-y-2">
                <Label>Losses</Label>
                <Input type="number" placeholder="2" value={formData.losses} onChange={(e) => setFormData({ ...formData, losses: e.target.value })} data-testid="input-run-losses" />
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {isVisible("performanceGrade") && (
              <div className="space-y-2">
                <Label>Grade</Label>
                <Select value={formData.performanceGrade} onValueChange={(v) => setFormData({ ...formData, performanceGrade: v })}>
                  <SelectTrigger data-testid="select-run-grade">
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A+">A+</SelectItem>
                    <SelectItem value="A">A</SelectItem>
                    <SelectItem value="A-">A-</SelectItem>
                    <SelectItem value="B+">B+</SelectItem>
                    <SelectItem value="B">B</SelectItem>
                    <SelectItem value="B-">B-</SelectItem>
                    <SelectItem value="C+">C+</SelectItem>
                    <SelectItem value="C">C</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {isVisible("confidence") && (
              <div className="space-y-2">
                <Label>Confidence (1-10)</Label>
                <Input type="number" min="1" max="10" placeholder="7" value={formData.confidence} onChange={(e) => setFormData({ ...formData, confidence: e.target.value })} data-testid="input-run-confidence" />
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea 
              placeholder="How did you play? Any highlights or areas to improve?" 
              value={formData.notes} 
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })} 
              className="resize-none"
              rows={3}
              data-testid="textarea-run-notes" 
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={createMutation.isPending} data-testid="button-save-run">
            {createMutation.isPending ? "Saving..." : (isEditing ? "Update" : "Save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CardioRunDialog({ open, onOpenChange, isDemo, editData, onEdit }: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  isDemo: boolean;
  editData?: CardioRun | null;
  onEdit?: (id: string, data: Partial<CardioRun>) => void;
}) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    distance: "",
    duration: "",
    terrain: "Road",
    location: "",
    effort: "",
    notes: "",
  });

  const isEditing = !!editData;

  useEffect(() => {
    if (editData) {
      setFormData({
        date: editData.date,
        distance: editData.distance ? (editData.distance / 1609.34).toFixed(2) : "",
        duration: editData.duration?.toString() || "",
        terrain: editData.terrain || "Road",
        location: editData.location || "",
        effort: editData.effort?.toString() || "",
        notes: editData.notes || "",
      });
    } else {
      setFormData({ date: format(new Date(), "yyyy-MM-dd"), distance: "", duration: "", terrain: "Road", location: "", effort: "", notes: "" });
    }
  }, [editData]);

  const createMutation = useMutation({
    mutationFn: async (data: Partial<CardioRun>) => {
      const res = await apiRequest("POST", "/api/fitness/cardio", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fitness/cardio"] });
      toast({ title: "Cardio run logged" });
      onOpenChange(false);
      setFormData({ date: format(new Date(), "yyyy-MM-dd"), distance: "", duration: "", terrain: "Road", location: "", effort: "", notes: "" });
    },
    onError: () => {
      toast({ title: "Failed to log cardio run", variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (isDemo) {
      toast({ title: "Demo mode - data not saved" });
      onOpenChange(false);
      return;
    }
    const distanceMeters = formData.distance ? parseFloat(formData.distance) * 1609.34 : undefined;
    const durationMin = formData.duration ? parseInt(formData.duration) : undefined;
    let pace: string | undefined;
    if (distanceMeters && durationMin && distanceMeters > 0) {
      const paceMinPerMile = durationMin / (distanceMeters / 1609.34);
      const paceMin = Math.floor(paceMinPerMile);
      const paceSec = Math.round((paceMinPerMile - paceMin) * 60);
      pace = `${paceMin}:${paceSec.toString().padStart(2, '0')}`;
    }
    const payload = {
      date: formData.date,
      distance: distanceMeters,
      duration: durationMin,
      terrain: formData.terrain,
      location: formData.location || undefined,
      pace,
      effort: formData.effort ? parseInt(formData.effort) : undefined,
      notes: formData.notes || undefined,
    };
    if (isEditing && editData && onEdit) {
      onEdit(editData.id, payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Cardio Run" : "Log Cardio Run"}</DialogTitle>
          <DialogDescription>{isEditing ? "Update your running session" : "Record your running session"}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} data-testid="input-cardio-date" />
            </div>
            <div className="space-y-2">
              <Label>Terrain</Label>
              <Select value={formData.terrain} onValueChange={(v) => setFormData({ ...formData, terrain: v })}>
                <SelectTrigger data-testid="select-cardio-terrain">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Road">Road</SelectItem>
                  <SelectItem value="Trail">Trail</SelectItem>
                  <SelectItem value="Track">Track</SelectItem>
                  <SelectItem value="Treadmill">Treadmill</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Distance (miles)</Label>
              <Input type="number" step="0.01" placeholder="3.1" value={formData.distance} onChange={(e) => setFormData({ ...formData, distance: e.target.value })} data-testid="input-cardio-distance" />
            </div>
            <div className="space-y-2">
              <Label>Duration (minutes)</Label>
              <Input type="number" placeholder="25" value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: e.target.value })} data-testid="input-cardio-duration" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Location</Label>
            <Input placeholder="Local park, neighborhood, etc." value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} data-testid="input-cardio-location" />
          </div>
          <div className="space-y-2">
            <Label>Effort (1-10)</Label>
            <Input type="number" min="1" max="10" placeholder="7" value={formData.effort} onChange={(e) => setFormData({ ...formData, effort: e.target.value })} data-testid="input-cardio-effort" />
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea placeholder="How did it feel?" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} data-testid="input-cardio-notes" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={createMutation.isPending} data-testid="button-save-cardio">
            {createMutation.isPending ? "Saving..." : (isEditing ? "Update" : "Save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BodyCompDialog({ open, onOpenChange, isDemo, editData, onEdit }: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  isDemo: boolean;
  editData?: BodyComposition | null;
  onEdit?: (id: string, data: Partial<BodyComposition>) => void;
}) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    weight: "",
    bodyFat: "",
    goalWeight: "",
  });

  const isEditing = !!editData;

  useEffect(() => {
    if (editData) {
      setFormData({
        date: editData.date,
        weight: editData.weight?.toString() || "",
        bodyFat: editData.bodyFat?.toString() || "",
        goalWeight: editData.goalWeight?.toString() || "",
      });
    } else {
      setFormData({ date: format(new Date(), "yyyy-MM-dd"), weight: "", bodyFat: "", goalWeight: "" });
    }
  }, [editData]);

  const createMutation = useMutation({
    mutationFn: async (data: Partial<BodyComposition>) => {
      const res = await apiRequest("POST", "/api/fitness/body-comp", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fitness/body-comp"] });
      toast({ title: "Body composition logged" });
      onOpenChange(false);
      setFormData({ date: format(new Date(), "yyyy-MM-dd"), weight: "", bodyFat: "", goalWeight: "" });
    },
    onError: () => {
      toast({ title: "Failed to log body composition", variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (isDemo) {
      toast({ title: "Demo mode - data not saved" });
      onOpenChange(false);
      return;
    }
    const payload = {
      date: formData.date,
      weight: formData.weight ? parseInt(formData.weight) : undefined,
      bodyFat: formData.bodyFat ? parseInt(formData.bodyFat) : undefined,
      goalWeight: formData.goalWeight ? parseInt(formData.goalWeight) : undefined,
    };
    if (isEditing && editData && onEdit) {
      onEdit(editData.id, payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Body Composition" : "Log Body Composition"}</DialogTitle>
          <DialogDescription>{isEditing ? "Update your body composition" : "Track your weight and body fat"}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Date</Label>
            <Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} data-testid="input-body-date" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Weight (lbs)</Label>
              <Input type="number" placeholder="185" value={formData.weight} onChange={(e) => setFormData({ ...formData, weight: e.target.value })} data-testid="input-body-weight" />
            </div>
            <div className="space-y-2">
              <Label>Body Fat (%)</Label>
              <Input type="number" placeholder="15" value={formData.bodyFat} onChange={(e) => setFormData({ ...formData, bodyFat: e.target.value })} data-testid="input-body-fat" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Goal Weight (lbs)</Label>
            <Input type="number" placeholder="180" value={formData.goalWeight} onChange={(e) => setFormData({ ...formData, goalWeight: e.target.value })} data-testid="input-body-goal" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={createMutation.isPending} data-testid="button-save-body-comp">
            {createMutation.isPending ? "Saving..." : (isEditing ? "Update" : "Save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NutritionSettingsDialog({ 
  open, 
  onOpenChange, 
  isDemo,
  currentSettings 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  isDemo: boolean;
  currentSettings: NutritionSettings;
}) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    maintenanceCalories: String(currentSettings.maintenanceCalories || 2500),
    calorieTarget: String(currentSettings.calorieTarget || 2000),
    proteinTarget: String(currentSettings.proteinTarget || 150),
    carbTarget: String(currentSettings.carbTarget || ""),
    fatTarget: String(currentSettings.fatTarget || ""),
  });

  // Update form when settings change
  useEffect(() => {
    setFormData({
      maintenanceCalories: String(currentSettings.maintenanceCalories || 2500),
      calorieTarget: String(currentSettings.calorieTarget || 2000),
      proteinTarget: String(currentSettings.proteinTarget || 150),
      carbTarget: String(currentSettings.carbTarget || ""),
      fatTarget: String(currentSettings.fatTarget || ""),
    });
  }, [currentSettings]);

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<NutritionSettings>) => {
      const res = await apiRequest("PUT", "/api/fitness/nutrition-settings", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fitness/nutrition-settings"] });
      toast({ title: "Nutrition targets updated" });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Failed to update settings", variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (isDemo) {
      toast({ title: "Demo mode - settings not saved" });
      onOpenChange(false);
      return;
    }
    updateMutation.mutate({
      maintenanceCalories: parseInt(formData.maintenanceCalories) || 2500,
      calorieTarget: parseInt(formData.calorieTarget) || 2000,
      proteinTarget: parseInt(formData.proteinTarget) || 150,
      carbTarget: formData.carbTarget ? parseInt(formData.carbTarget) : null,
      fatTarget: formData.fatTarget ? parseInt(formData.fatTarget) : null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nutrition Targets</DialogTitle>
          <DialogDescription>Configure your daily calorie and macro goals</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Maintenance Calories</Label>
            <Input 
              type="number" 
              placeholder="2500" 
              value={formData.maintenanceCalories} 
              onChange={(e) => setFormData({ ...formData, maintenanceCalories: e.target.value })} 
              data-testid="input-maintenance-calories"
            />
            <p className="text-xs text-muted-foreground">Your TDEE - calories to maintain current weight</p>
          </div>
          <div className="space-y-2">
            <Label>Daily Calorie Target</Label>
            <Input 
              type="number" 
              placeholder="2000" 
              value={formData.calorieTarget} 
              onChange={(e) => setFormData({ ...formData, calorieTarget: e.target.value })} 
              data-testid="input-calorie-target"
            />
            <p className="text-xs text-muted-foreground">Target intake for your goal (cut/bulk/maintain)</p>
          </div>
          <div className="space-y-2">
            <Label>Daily Protein Target (g)</Label>
            <Input 
              type="number" 
              placeholder="150" 
              value={formData.proteinTarget} 
              onChange={(e) => setFormData({ ...formData, proteinTarget: e.target.value })} 
              data-testid="input-protein-target"
            />
            <p className="text-xs text-muted-foreground">Recommended: 0.8-1g per lb of body weight</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Daily Carb Target (g)</Label>
              <Input 
                type="number" 
                placeholder="200" 
                value={formData.carbTarget} 
                onChange={(e) => setFormData({ ...formData, carbTarget: e.target.value })} 
                data-testid="input-carb-target"
              />
              <p className="text-xs text-muted-foreground">Optional</p>
            </div>
            <div className="space-y-2">
              <Label>Daily Fat Target (g)</Label>
              <Input 
                type="number" 
                placeholder="65" 
                value={formData.fatTarget} 
                onChange={(e) => setFormData({ ...formData, fatTarget: e.target.value })} 
                data-testid="input-fat-target"
              />
              <p className="text-xs text-muted-foreground">Optional</p>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={updateMutation.isPending} data-testid="button-save-nutrition-settings">
            {updateMutation.isPending ? "Saving..." : "Save Targets"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Activity level multipliers for TDEE calculation
const activityMultipliers: Record<string, { label: string; multiplier: number; description: string }> = {
  sedentary: { label: "Sedentary", multiplier: 1.2, description: "Little or no exercise, desk job" },
  light: { label: "Lightly Active", multiplier: 1.375, description: "Light exercise 1-3 days/week" },
  moderate: { label: "Moderately Active", multiplier: 1.55, description: "Moderate exercise 3-5 days/week" },
  active: { label: "Very Active", multiplier: 1.725, description: "Hard exercise 6-7 days/week" },
  extreme: { label: "Extremely Active", multiplier: 1.9, description: "Hard daily exercise + physical job" },
};

function TDEECalculatorDialog({ 
  open, 
  onOpenChange,
  isDemo,
  onApplyTargets
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  isDemo: boolean;
  onApplyTargets: (maintenance: number, target: number, protein: number) => void;
}) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    weight: "",
    height: "",
    age: "",
    gender: "male",
    activityLevel: "moderate",
    goalType: "moderate_cut",
  });
  
  const [results, setResults] = useState<{
    bmr: number;
    tdee: number;
    targets: { name: string; calories: number; deficit: number }[];
    protein: number;
  } | null>(null);

  // Calculate BMR using Mifflin-St Jeor formula
  const calculateBMR = (weight: number, height: number, age: number, gender: string) => {
    // Weight in lbs, height in inches
    const weightKg = weight * 0.453592;
    const heightCm = height * 2.54;
    
    if (gender === "male") {
      return Math.round(10 * weightKg + 6.25 * heightCm - 5 * age + 5);
    } else {
      return Math.round(10 * weightKg + 6.25 * heightCm - 5 * age - 161);
    }
  };

  const handleCalculate = () => {
    const weight = parseFloat(formData.weight);
    const height = parseFloat(formData.height);
    const age = parseInt(formData.age);

    if (!weight || !height || !age) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }

    const bmr = calculateBMR(weight, height, age, formData.gender);
    const multiplier = activityMultipliers[formData.activityLevel].multiplier;
    const tdee = Math.round(bmr * multiplier);
    
    // Calculate protein target (0.8-1g per lb of body weight)
    const protein = Math.round(weight * 0.9);

    // Generate target options
    const targets = [
      { name: "Maintenance", calories: tdee, deficit: 0 },
      { name: "Mild Cut (-250)", calories: tdee - 250, deficit: 250 },
      { name: "Moderate Cut (-500)", calories: tdee - 500, deficit: 500 },
      { name: "Aggressive Cut (-750)", calories: tdee - 750, deficit: 750 },
      { name: "Mild Bulk (+250)", calories: tdee + 250, deficit: -250 },
      { name: "Moderate Bulk (+500)", calories: tdee + 500, deficit: -500 },
    ];

    setResults({ bmr, tdee, targets, protein });
  };

  const handleApply = (targetCalories: number) => {
    if (!results) return;
    onApplyTargets(results.tdee, targetCalories, results.protein);
    onOpenChange(false);
    setResults(null);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) setResults(null);
    }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>TDEE Calculator</DialogTitle>
          <DialogDescription>Calculate your Total Daily Energy Expenditure</DialogDescription>
        </DialogHeader>
        
        {!results ? (
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Weight (lbs)</Label>
                <Input 
                  type="number" 
                  placeholder="185" 
                  value={formData.weight} 
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })} 
                  data-testid="input-calc-weight"
                />
              </div>
              <div className="space-y-2">
                <Label>Height (inches)</Label>
                <Input 
                  type="number" 
                  placeholder="72" 
                  value={formData.height} 
                  onChange={(e) => setFormData({ ...formData, height: e.target.value })} 
                  data-testid="input-calc-height"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Age</Label>
                <Input 
                  type="number" 
                  placeholder="28" 
                  value={formData.age} 
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })} 
                  data-testid="input-calc-age"
                />
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select value={formData.gender} onValueChange={(v) => setFormData({ ...formData, gender: v })}>
                  <SelectTrigger data-testid="select-calc-gender">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Activity Level</Label>
              <Select value={formData.activityLevel} onValueChange={(v) => setFormData({ ...formData, activityLevel: v })}>
                <SelectTrigger data-testid="select-calc-activity">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(activityMultipliers).map(([key, { label, description }]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex flex-col">
                        <span>{label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {activityMultipliers[formData.activityLevel].description}
              </p>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={handleCalculate} data-testid="button-calculate-tdee">
                Calculate
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">BMR</p>
                    <p className="text-2xl font-bold font-mono">{results.bmr}</p>
                    <p className="text-xs text-muted-foreground">cal/day at rest</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">TDEE</p>
                    <p className="text-2xl font-bold font-mono text-green-500">{results.tdee}</p>
                    <p className="text-xs text-muted-foreground">maintenance</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Suggested Protein: <span className="font-mono">{results.protein}g</span>/day</p>
              <p className="text-xs text-muted-foreground">Based on 0.9g per lb of body weight</p>
            </div>

            <div className="space-y-2">
              <Label>Select a target to apply:</Label>
              <div className="grid gap-2">
                {results.targets.map((target) => (
                  <Button 
                    key={target.name}
                    variant="outline" 
                    className="justify-between font-normal"
                    onClick={() => handleApply(target.calories)}
                    data-testid={`button-apply-${target.name.toLowerCase().replace(/[^a-z]/g, '-')}`}
                  >
                    <span>{target.name}</span>
                    <span className="font-mono">{target.calories} cal</span>
                  </Button>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setResults(null)}>
                Recalculate
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DailyHabitsContent({ 
  todayCalories, 
  nutritionSettings, 
  isDemo,
  onToggleHabit,
  manageMode = false,
  onRemoveHabit
}: { 
  todayCalories: NutritionLog | undefined;
  nutritionSettings: NutritionSettings;
  isDemo: boolean;
  onToggleHabit: (toggleId: string, field: string | undefined, value: boolean) => void;
  manageMode?: boolean;
  onRemoveHabit?: (habitId: string) => void;
}) {
  const customToggles = (nutritionSettings.customToggles as { id: string; name: string; enabled: boolean }[]) || [];
  const completedToggles = (todayCalories?.completedToggles as string[]) || [];
  const enabledCustomToggles = customToggles.filter(t => t.enabled);
  
  const hasNoLog = !todayCalories;
  
  if (enabledCustomToggles.length === 0 && !manageMode) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-muted-foreground">No custom habits configured</p>
      </div>
    );
  }
  
  if (enabledCustomToggles.length === 0 && manageMode) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-muted-foreground">Add your first habit below</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      {enabledCustomToggles.map((toggle) => (
        <div key={toggle.id} className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span className="text-sm">{toggle.name}</span>
          </div>
          <div className="flex items-center gap-2">
            {manageMode && onRemoveHabit && (
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={() => onRemoveHabit(toggle.id)}
                data-testid={`button-remove-habit-${toggle.id}`}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
            {!manageMode && (
              <Switch 
                checked={completedToggles.includes(toggle.id)}
                onCheckedChange={(checked) => onToggleHabit(toggle.id, undefined, checked)}
                disabled={hasNoLog}
                data-testid={`toggle-custom-${toggle.id}`}
              />
            )}
          </div>
        </div>
      ))}
      {hasNoLog && !manageMode && (
        <p className="text-xs text-muted-foreground text-center pt-2">Log nutrition to track habits</p>
      )}
    </div>
  );
}
