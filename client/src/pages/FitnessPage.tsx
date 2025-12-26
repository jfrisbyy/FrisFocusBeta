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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Dumbbell, Utensils, Scale, Target, Trophy, Plus, Minus, Flame, Droplets, 
  TrendingUp, TrendingDown, Calendar, Clock, Activity, Camera, 
  Trash2, Edit, ChevronRight, ChevronLeft, Zap, Star, Award, Calculator, CheckCircle2, Footprints,
  MessageCircle, MessageSquare, Send, Sparkles, Check, Loader2, X, Pencil, HelpCircle, ChevronDown, ChevronUp, RefreshCw
} from "lucide-react";
import { HelpDialog } from "@/components/HelpDialog";
import { useDemo } from "@/contexts/DemoContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { NutritionLog, BodyComposition, StrengthWorkout, SkillWorkout, BasketballRun, NutritionSettings, Meal, CardioRun, LivePlaySettings, DailySteps, SportTemplate, LivePlayField, PracticeSettings, PracticeTemplate, PracticeField, DashboardPreferences, WorkoutRoutine, RoutineExercise } from "@shared/schema";
import { Checkbox } from "@/components/ui/checkbox";
import { Settings, Calendar as CalendarIcon } from "lucide-react";
import { format, subDays, addDays, startOfWeek, parseISO, isToday, isThisWeek, differenceInDays, eachDayOfInterval } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell, Legend, PieChart, Pie, Area, AreaChart } from "recharts";

const mockNutrition: NutritionLog[] = [
  { id: "demo-1", userId: "demo", date: new Date().toISOString().split("T")[0], calories: 2200, protein: 180, carbs: 220, fats: 65, creatine: true, waterGallon: true, deficit: 300, caloriesBurned: null, meals: [{ id: "m1", name: "Breakfast", calories: 500, protein: 30, time: "8:00 AM" }, { id: "m2", name: "Lunch", calories: 800, protein: 50, time: "12:30 PM" }, { id: "m3", name: "Dinner", calories: 900, protein: 100, time: "7:00 PM" }], completedToggles: null },
  { id: "demo-2", userId: "demo", date: subDays(new Date(), 1).toISOString().split("T")[0], calories: 2100, protein: 165, carbs: 200, fats: 70, creatine: true, waterGallon: false, deficit: 400, caloriesBurned: null, meals: null, completedToggles: null },
  { id: "demo-3", userId: "demo", date: subDays(new Date(), 2).toISOString().split("T")[0], calories: 2350, protein: 190, carbs: 240, fats: 60, creatine: true, waterGallon: true, deficit: 150, caloriesBurned: null, meals: null, completedToggles: null },
  { id: "demo-4", userId: "demo", date: subDays(new Date(), 3).toISOString().split("T")[0], calories: 2400, protein: 185, carbs: 250, fats: 65, creatine: true, waterGallon: true, deficit: 100, caloriesBurned: null, meals: null, completedToggles: null },
  { id: "demo-5", userId: "demo", date: subDays(new Date(), 4).toISOString().split("T")[0], calories: 2050, protein: 160, carbs: 180, fats: 75, creatine: false, waterGallon: true, deficit: 450, caloriesBurned: null, meals: null, completedToggles: null },
];

const mockBodyComp: BodyComposition[] = [
  { id: "demo-1", userId: "demo", date: new Date().toISOString().split("T")[0], weight: 185, bodyFat: 15, goalWeight: 180, nextMilestone: 183, photoUrl: null, notes: null },
  { id: "demo-2", userId: "demo", date: subDays(new Date(), 7).toISOString().split("T")[0], weight: 187, bodyFat: 16, goalWeight: 180, nextMilestone: 185, photoUrl: null, notes: null },
  { id: "demo-3", userId: "demo", date: subDays(new Date(), 14).toISOString().split("T")[0], weight: 189, bodyFat: 17, goalWeight: 180, nextMilestone: 187, photoUrl: null, notes: null },
  { id: "demo-4", userId: "demo", date: subDays(new Date(), 21).toISOString().split("T")[0], weight: 191, bodyFat: 18, goalWeight: 180, nextMilestone: 189, photoUrl: null, notes: null },
];

const mockStrength: StrengthWorkout[] = [
  { id: "demo-1", userId: "demo", date: new Date().toISOString().split("T")[0], type: "Strength", primaryFocus: "Push", duration: 60, volume: 15000, effort: 8, exercises: [{ name: "Bench Press", sets: 4, reps: 8, weight: 185 }, { name: "Shoulder Press", sets: 3, reps: 10, weight: 95 }], notes: null },
  { id: "demo-2", userId: "demo", date: subDays(new Date(), 2).toISOString().split("T")[0], type: "Strength", primaryFocus: "Pull", duration: 55, volume: 14200, effort: 7, exercises: [{ name: "Deadlift", sets: 4, reps: 6, weight: 275 }, { name: "Pull-ups", sets: 4, reps: 10, weight: 0 }], notes: null },
  { id: "demo-3", userId: "demo", date: subDays(new Date(), 4).toISOString().split("T")[0], type: "Strength", primaryFocus: "Legs", duration: 70, volume: 18500, effort: 9, exercises: [{ name: "Squat", sets: 5, reps: 5, weight: 225 }, { name: "RDL", sets: 4, reps: 8, weight: 185 }], notes: null },
];

const mockSkills: SkillWorkout[] = [
  { id: "demo-1", userId: "demo", date: new Date().toISOString().split("T")[0], type: "Skill", drillType: "Shooting", effort: 8, skillFocus: ["3-pointers", "Mid-range"], zoneFocus: ["Corner", "Wing"], drillStats: { makes: 45, attempts: 60 }, notes: null, customFields: null },
  { id: "demo-2", userId: "demo", date: subDays(new Date(), 3).toISOString().split("T")[0], type: "Skill", drillType: "Ball Handling", effort: 7, skillFocus: ["Crossovers", "Behind back"], zoneFocus: [], drillStats: null, notes: null, customFields: null },
  { id: "demo-3", userId: "demo", date: subDays(new Date(), 6).toISOString().split("T")[0], type: "Skill", drillType: "Shooting", effort: 9, skillFocus: ["Free throws", "Fadeaways"], zoneFocus: ["Paint", "Elbow"], drillStats: { makes: 38, attempts: 50 }, notes: null, customFields: null },
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
  goalWeight: 175,
  goalTimeframe: 12,
  bmr: 1850,
  goalPace: "moderate",
  strategyBias: "balanced",
  stepGoal: 10000,
  strengthSessionsPerWeek: 4,
};

type ActiveTab = "overview" | "nutrition" | "sports" | "gym" | "body-comp";
type SportsSubTab = "runs" | "drills";
type GymSubTab = "strength" | "cardio";
type ChartPeriod = "weekly" | "monthly";

// Activity Calorie Calculation Helpers
// These calculate calories burned from logged activities to determine dynamic daily calorie target

/**
 * Calculate calories burned from steps
 * Approx 0.04 calories per step for a 180lb person, adjusted by weight
 */
function calculateStepCalories(steps: number, weightLbs: number = 180): number {
  const baseCalPerStep = 0.04;
  const weightFactor = weightLbs / 180;
  return Math.round(steps * baseCalPerStep * weightFactor);
}

/**
 * Calculate calories burned from strength workout
 * Approx 5 calories per minute at moderate intensity
 */
function calculateStrengthCalories(durationMinutes: number, intensity: 'light' | 'moderate' | 'intense' = 'moderate'): number {
  const multipliers = { light: 4, moderate: 5, intense: 7 };
  return Math.round(durationMinutes * multipliers[intensity]);
}

/**
 * Calculate calories burned from cardio run
 * Uses logged caloriesBurned if available, otherwise estimates from duration
 */
function calculateCardioCalories(run: { caloriesBurned?: number | null; duration?: number | null }): number {
  if (run.caloriesBurned) return run.caloriesBurned;
  if (run.duration) return Math.round(run.duration * 10); // ~10 cal/min running
  return 0;
}

/**
 * Calculate calories burned from basketball/sports sessions
 * Approx 8 calories per minute for basketball
 */
function calculateSportsCalories(durationMinutes: number, intensity: 'casual' | 'competitive' | 'intense' = 'competitive'): number {
  const multipliers = { casual: 6, competitive: 8, intense: 10 };
  return Math.round(durationMinutes * multipliers[intensity]);
}

/**
 * Calculate calories burned from skill drills
 * Lower intensity than competitive sports
 */
function calculateDrillCalories(durationMinutes: number): number {
  return Math.round(durationMinutes * 4);
}

/**
 * Calculate BMR using Mifflin-St Jeor equation
 */
function calculateBMR(weightLbs: number, heightIn: number, age: number, gender: 'male' | 'female'): number {
  const weightKg = weightLbs * 0.453592;
  const heightCm = heightIn * 2.54;
  if (gender === "male") {
    return Math.round(10 * weightKg + 6.25 * heightCm - 5 * age + 5);
  }
  return Math.round(10 * weightKg + 6.25 * heightCm - 5 * age - 161);
}

/**
 * Calculate required daily deficit/surplus to reach goal weight in timeframe
 * Returns negative number for cut, positive for bulk
 * @param timeframeDays - number of days (use this for precise date-based calculations)
 */
function calculateDailyDeficitByDays(currentWeight: number, goalWeight: number, timeframeDays: number): number {
  const weightDiff = goalWeight - currentWeight; // negative for cut
  const totalCaloriesNeeded = weightDiff * 3500; // 3500 cal = 1 lb
  return Math.round(totalCaloriesNeeded / Math.max(1, timeframeDays));
}

/**
 * Calculate required daily deficit/surplus to reach goal weight in timeframe
 * Returns negative number for cut, positive for bulk
 * @param timeframeWeeks - number of weeks (converted to days internally)
 */
function calculateDailyDeficit(currentWeight: number, goalWeight: number, timeframeWeeks: number): number {
  return calculateDailyDeficitByDays(currentWeight, goalWeight, timeframeWeeks * 7);
}

// RoutineForm component for creating/editing workout routines
function RoutineForm({ initialData, onSave, onGenerate, isGenerating, isSaving }: {
  initialData: WorkoutRoutine | null;
  onSave: (data: { name: string; description?: string; exercises: RoutineExercise[] }) => void;
  onGenerate: (goals: string) => void;
  isGenerating: boolean;
  isSaving: boolean;
}) {
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [exercises, setExercises] = useState<RoutineExercise[]>(
    (initialData?.exercises as RoutineExercise[]) || []
  );
  const [aiGoals, setAiGoals] = useState("");

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setDescription(initialData.description || "");
      setExercises((initialData.exercises as RoutineExercise[]) || []);
    }
  }, [initialData]);

  const addExercise = () => {
    setExercises([...exercises, { id: crypto.randomUUID(), name: "", sets: 3, reps: 10 }]);
  };

  const updateExercise = (index: number, field: keyof RoutineExercise, value: string | number) => {
    const updated = [...exercises];
    updated[index] = { ...updated[index], [field]: value };
    setExercises(updated);
  };

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!name.trim()) return;
    const validExercises = exercises.filter(ex => ex.name.trim());
    onSave({ name: name.trim(), description: description.trim() || undefined, exercises: validExercises });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Routine Name</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Push Day, Pull Day, Leg Day"
          data-testid="input-routine-name"
        />
      </div>

      <div className="space-y-2">
        <Label>Description (optional)</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description of the routine"
          className="resize-none"
          rows={2}
          data-testid="input-routine-description"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Exercises</Label>
          <Button size="sm" variant="outline" onClick={addExercise} data-testid="button-add-exercise">
            <Plus className="h-3 w-3 mr-1" /> Add
          </Button>
        </div>
        {exercises.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-3">No exercises yet</p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {exercises.map((ex, idx) => (
              <div key={ex.id} className="flex items-center gap-2 p-2 rounded-md border bg-background/50">
                <Input
                  value={ex.name}
                  onChange={(e) => updateExercise(idx, "name", e.target.value)}
                  placeholder="Exercise name"
                  className="flex-1"
                  data-testid={`input-exercise-name-${idx}`}
                />
                <Input
                  type="number"
                  value={ex.sets}
                  onChange={(e) => updateExercise(idx, "sets", parseInt(e.target.value) || 0)}
                  placeholder="Sets"
                  className="w-16"
                  data-testid={`input-exercise-sets-${idx}`}
                />
                <span className="text-muted-foreground">x</span>
                <Input
                  type="number"
                  value={ex.reps}
                  onChange={(e) => updateExercise(idx, "reps", parseInt(e.target.value) || 0)}
                  placeholder="Reps"
                  className="w-16"
                  data-testid={`input-exercise-reps-${idx}`}
                />
                <Button size="icon" variant="ghost" onClick={() => removeExercise(idx)} data-testid={`button-remove-exercise-${idx}`}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t pt-4 space-y-2">
        <Label className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          Generate with AI
        </Label>
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => onGenerate("")}
          disabled={isGenerating}
          data-testid="button-open-ai-wizard"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Start AI Workout Builder
        </Button>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button onClick={handleSave} disabled={!name.trim() || isSaving} data-testid="button-save-routine">
          {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
          Save Routine
        </Button>
      </div>
    </div>
  );
}

export default function FitnessPage() {
  const { isDemo } = useDemo();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
  const [sportsSubTab, setSportsSubTab] = useState<SportsSubTab>("runs");
  const [gymSubTab, setGymSubTab] = useState<GymSubTab>("strength");
  const [nutritionDialogOpen, setNutritionDialogOpen] = useState(false);
  const [strengthDialogOpen, setStrengthDialogOpen] = useState(false);
  const [skillDialogOpen, setSkillDialogOpen] = useState(false);
  const [runDialogOpen, setRunDialogOpen] = useState(false);
  const [cardioDialogOpen, setCardioDialogOpen] = useState(false);
  const [bodyCompDialogOpen, setBodyCompDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [calculatorDialogOpen, setCalculatorDialogOpen] = useState(false);
  const [livePlaySettingsOpen, setLivePlaySettingsOpen] = useState(false);
  const [practiceSettingsOpen, setPracticeSettingsOpen] = useState(false);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
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
  const [stepGoalSettingsOpen, setStepGoalSettingsOpen] = useState(false);
  const [bodyTrendPeriod, setBodyTrendPeriod] = useState<30 | 60 | 90 | 365>(30);

  // Editing state for each fitness log type
  const [editingNutrition, setEditingNutrition] = useState<NutritionLog | null>(null);
  const [editingStrength, setEditingStrength] = useState<StrengthWorkout | null>(null);
  const [editingSkill, setEditingSkill] = useState<SkillWorkout | null>(null);
  const [editingRun, setEditingRun] = useState<BasketballRun | null>(null);
  const [editingCardio, setEditingCardio] = useState<CardioRun | null>(null);
  const [editingBodyComp, setEditingBodyComp] = useState<BodyComposition | null>(null);
  const [editingSteps, setEditingSteps] = useState<DailySteps | null>(null);

  // Workout routines state
  const [routinesExpanded, setRoutinesExpanded] = useState(true);
  const [routineDialogOpen, setRoutineDialogOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<WorkoutRoutine | null>(null);
  const [aiRoutineGenerating, setAiRoutineGenerating] = useState(false);
  const [aiRoutineGoals, setAiRoutineGoals] = useState("");
  
  // AI Generated routines preview state
  type GeneratedRoutine = {
    id: string;
    name: string;
    description: string;
    dayOfWeek: string;
    exercises: RoutineExercise[];
    selected: boolean;
  };
  const [generatedRoutinesPreview, setGeneratedRoutinesPreview] = useState<{
    splitName: string;
    splitDescription: string;
    routines: GeneratedRoutine[];
  } | null>(null);
  const [routinePreviewOpen, setRoutinePreviewOpen] = useState(false);

  // AI Wizard state for clarifying questions
  type AIQuestion = {
    id: string;
    question: string;
    type: "choice" | "text" | "number";
    options: string[] | null;
  };
  type AIAnswer = {
    question: string;
    answer: string;
  };
  const [aiWizardOpen, setAiWizardOpen] = useState(false);
  const [aiWizardStep, setAiWizardStep] = useState<"goals" | "questions" | "generating">("goals");
  const [aiWizardGoals, setAiWizardGoals] = useState("");
  const [aiWizardQuestions, setAiWizardQuestions] = useState<AIQuestion[]>([]);
  const [aiWizardAnswers, setAiWizardAnswers] = useState<Record<string, string>>({});
  
  // Persist generation context for feedback/iteration
  const [lastGenerationContext, setLastGenerationContext] = useState<{
    goals: string;
    answers: AIAnswer[];
  } | null>(null);
  const [feedbackMode, setFeedbackMode] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [isRegenerating, setIsRegenerating] = useState(false);

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

  const { data: routinesData = [], isLoading: loadingRoutines } = useQuery<WorkoutRoutine[]>({
    queryKey: ["/api/fitness/routines"],
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

  // Practice/Skill settings
  const DEFAULT_PRACTICE_FIELDS: PracticeField[] = [
    { id: "date", label: "Date", enabled: true, type: "text" },
    { id: "drillType", label: "Drill Type", enabled: true, type: "text" },
    { id: "effort", label: "Effort (1-10)", enabled: true, type: "number" },
    { id: "skillFocus", label: "Skills Focus", enabled: true, type: "multiselect", options: ["Shooting", "Dribbling", "Passing", "Defense", "Footwork", "Conditioning"] },
    { id: "zoneFocus", label: "Zone Focus", enabled: true, type: "multiselect", options: ["Paint", "Mid-Range", "3-Point", "Free Throw", "Post"] },
    { id: "makes", label: "Makes", enabled: true, type: "number" },
    { id: "attempts", label: "Attempts", enabled: true, type: "number" },
    { id: "notes", label: "Notes", enabled: true, type: "textarea" },
  ];

  const { data: practiceSettingsData } = useQuery<PracticeSettings>({
    queryKey: ["/api/fitness/practice-settings"],
    enabled: !isDemo,
  });

  const practiceVisibleFields = practiceSettingsData?.visibleFields as string[] || 
    DEFAULT_PRACTICE_FIELDS.map(f => f.id);

  // Dashboard preferences for step goal
  const { data: dashboardPreferencesData } = useQuery<DashboardPreferences>({
    queryKey: ["/api/dashboard/preferences"],
    enabled: !isDemo,
  });

  const defaultStepGoal = dashboardPreferencesData?.defaultStepGoal || 10000;

  const nutrition = isDemo ? demoNutritionData : nutritionData;
  const nutritionSettings = isDemo ? demoNutritionSettings : (nutritionSettingsData || mockNutritionSettings);
  const bodyComp = isDemo ? mockBodyComp : bodyCompData;
  const strength = isDemo ? mockStrength : strengthData;
  const skills = isDemo ? mockSkills : skillsData;
  const runs = isDemo ? mockRuns : runsData;
  const cardioRuns = isDemo ? mockCardioRuns : cardioData;
  const steps = isDemo ? [] : stepsData;
  
  // Demo workout routines
  const mockRoutines: WorkoutRoutine[] = [
    { id: "demo-1", userId: "demo", name: "Push Day", description: "Chest, shoulders, triceps", exercises: [{ id: "1", name: "Bench Press", sets: 4, reps: 8 }, { id: "2", name: "Shoulder Press", sets: 3, reps: 10 }, { id: "3", name: "Tricep Pushdowns", sets: 3, reps: 12 }], createdAt: new Date(), updatedAt: new Date() },
    { id: "demo-2", userId: "demo", name: "Pull Day", description: "Back and biceps", exercises: [{ id: "1", name: "Deadlift", sets: 4, reps: 6 }, { id: "2", name: "Pull-ups", sets: 4, reps: 10 }, { id: "3", name: "Barbell Rows", sets: 3, reps: 10 }], createdAt: new Date(), updatedAt: new Date() },
    { id: "demo-3", userId: "demo", name: "Leg Day", description: "Quads, hamstrings, glutes", exercises: [{ id: "1", name: "Squat", sets: 5, reps: 5 }, { id: "2", name: "Romanian Deadlift", sets: 4, reps: 8 }, { id: "3", name: "Leg Press", sets: 3, reps: 12 }], createdAt: new Date(), updatedAt: new Date() },
  ];
  const routines = isDemo ? mockRoutines : routinesData;

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
      const res = await apiRequest("POST", "/api/fitness/steps", { date, steps, goal: goal || defaultStepGoal });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fitness/steps"] });
      toast({ title: "Steps saved" });
      setStepsDialogOpen(false);
    },
  });

  const updateStepGoalMutation = useMutation({
    mutationFn: async (newGoal: number) => {
      const currentPrefs = dashboardPreferencesData || {};
      const res = await apiRequest("PUT", "/api/dashboard/preferences", {
        ...currentPrefs,
        defaultStepGoal: newGoal,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/preferences"] });
      toast({ title: "Step goal updated" });
      setStepGoalSettingsOpen(false);
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

  // Workout routine mutations
  const createRoutineMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string; exercises: RoutineExercise[] }) => {
      const res = await apiRequest("POST", "/api/fitness/routines", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fitness/routines"] });
      toast({ title: "Routine created" });
      setRoutineDialogOpen(false);
      setEditingRoutine(null);
    },
    onError: () => {
      toast({ title: "Failed to create routine", variant: "destructive" });
    },
  });

  const updateRoutineMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name: string; description?: string; exercises: RoutineExercise[] } }) => {
      const res = await apiRequest("PUT", `/api/fitness/routines/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fitness/routines"] });
      toast({ title: "Routine updated" });
      setRoutineDialogOpen(false);
      setEditingRoutine(null);
    },
    onError: () => {
      toast({ title: "Failed to update routine", variant: "destructive" });
    },
  });

  const deleteRoutineMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/fitness/routines/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fitness/routines"] });
      toast({ title: "Routine deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete routine", variant: "destructive" });
    },
  });

  // Clarify questions mutation for AI wizard
  const clarifyQuestionsMutation = useMutation({
    mutationFn: async (goals: string) => {
      const res = await apiRequest("POST", "/api/fitness/routines/clarify", { goals });
      return res.json();
    },
    onSuccess: (data: { questions: Array<{ id: string; question: string; type: string; options: string[] | null }> }) => {
      setAiWizardQuestions(data.questions.map(q => ({
        id: q.id,
        question: q.question,
        type: q.type as "choice" | "text" | "number",
        options: q.options,
      })));
      setAiWizardStep("questions");
    },
    onError: () => {
      toast({ title: "Failed to get clarifying questions", variant: "destructive" });
    },
  });

  const generateRoutineMutation = useMutation({
    mutationFn: async ({ goals, answers, feedback }: { goals: string; answers?: Array<{ question: string; answer: string }>; feedback?: string }) => {
      const res = await apiRequest("POST", "/api/fitness/routines/generate", { goals, answers, feedback });
      return res.json();
    },
    onSuccess: (data: { splitName: string; splitDescription: string; routines: Array<{ id: string; name: string; description: string; dayOfWeek: string; exercises: RoutineExercise[] }> }) => {
      // Transform response to include selected state for each routine
      const routinesWithSelection = data.routines.map(r => ({
        ...r,
        selected: true, // Default all to selected
      }));
      setGeneratedRoutinesPreview({
        splitName: data.splitName,
        splitDescription: data.splitDescription,
        routines: routinesWithSelection,
      });
      setRoutineDialogOpen(false);
      setAiWizardOpen(false);
      setRoutinePreviewOpen(true);
      setAiRoutineGoals("");
      // Reset wizard state but keep generation context for feedback
      setAiWizardStep("goals");
      setAiWizardGoals("");
      setAiWizardQuestions([]);
      setAiWizardAnswers({});
      // Reset feedback state
      setFeedbackMode(false);
      setFeedbackText("");
      setIsRegenerating(false);
      toast({ title: `Generated ${data.routines.length} routines! Review and save.` });
    },
    onError: () => {
      toast({ title: "Failed to generate routines", variant: "destructive" });
      setAiWizardStep("questions");
      setIsRegenerating(false);
    },
  });

  const saveGeneratedRoutinesMutation = useMutation({
    mutationFn: async (routines: Array<{ name: string; description?: string; exercises: RoutineExercise[] }>) => {
      const results = await Promise.all(
        routines.map(routine =>
          apiRequest("POST", "/api/fitness/routines", routine).then(res => res.json())
        )
      );
      return results;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/fitness/routines"] });
      toast({ title: `Saved ${data.length} routines!` });
      setRoutinePreviewOpen(false);
      setGeneratedRoutinesPreview(null);
    },
    onError: () => {
      toast({ title: "Failed to save routines", variant: "destructive" });
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
    mutationFn: async (data: { goalType: string; calorieTarget: number; maintenanceCalories: number; weight?: number; height?: number; age?: number; gender?: string; activityLevel?: string; stepGoal?: number }) => {
      const res = await apiRequest("PUT", "/api/fitness/nutrition-settings", data);
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/fitness/nutrition-settings"] });
      // If step goal was provided, also update the step goal setting
      if (variables.stepGoal) {
        updateStepGoalMutation.mutate(variables.stepGoal);
      }
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
    <div className="p-4 md:p-6 max-w-7xl mx-auto" data-testid="page-health">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Health</h1>
          <p className="text-muted-foreground text-sm">Track nutrition, workouts, and body composition</p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setHelpDialogOpen(true)} data-testid="button-health-help">
          <HelpCircle className="h-5 w-5" />
        </Button>
      </div>
      <HelpDialog open={helpDialogOpen} onOpenChange={setHelpDialogOpen} filterCards={[5]} />

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
          <TabsTrigger value="gym" className="flex flex-col gap-1 py-2" data-testid="tab-gym">
            <Dumbbell className="h-4 w-4" />
            <span className="text-xs">Gym</span>
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
            nutritionSettings.goalType === 'maintain' || nutritionSettings.goalType === 'maintenance' ? 'border-blue-500/50 bg-blue-500/5' :
            nutritionSettings.goalType === 'gain' || nutritionSettings.goalType?.includes('bulk') ? 'border-green-500/50 bg-green-500/5' :
            'border-orange-500/50 bg-orange-500/5'
          }`}>
            <CardContent className="py-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-full ${
                    nutritionSettings.goalType === 'maintain' || nutritionSettings.goalType === 'maintenance' ? 'bg-blue-500/20' :
                    nutritionSettings.goalType === 'gain' || nutritionSettings.goalType?.includes('bulk') ? 'bg-green-500/20' :
                    'bg-orange-500/20'
                  }`}>
                    <Target className={`h-5 w-5 ${
                      nutritionSettings.goalType === 'maintain' || nutritionSettings.goalType === 'maintenance' ? 'text-blue-500' :
                      nutritionSettings.goalType === 'gain' || nutritionSettings.goalType?.includes('bulk') ? 'text-green-500' :
                      'text-orange-500'
                    }`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">
                        {nutritionSettings.goalType === 'maintain' || nutritionSettings.goalType === 'maintenance' ? 'Maintenance Mode' :
                         nutritionSettings.goalType === 'gain' || nutritionSettings.goalType?.includes('bulk') ? 'Surplus Mode' :
                         'Deficit Mode'}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {nutritionSettings.calorieTarget || 2000} cal/day
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {nutritionSettings.strategyBias === 'activity' ? 'Activity-focused approach' :
                       nutritionSettings.strategyBias === 'diet' ? 'Diet-focused approach' :
                       'Balanced approach'}
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
                {nutritionSettings.goalWeight && <p className="text-xs text-muted-foreground">Goal: {nutritionSettings.goalWeight} lbs</p>}
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
                  <Button 
                    size="icon" 
                    variant="ghost"
                    onClick={() => setStepGoalSettingsOpen(true)}
                    data-testid="button-step-goal-settings"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {(() => {
                  const today = format(new Date(), "yyyy-MM-dd");
                  const todayEntry = steps.find(s => s.date === today);
                  const todaySteps = todayEntry?.steps || 0;
                  const todayGoal = defaultStepGoal;
                  
                  const weekStart = startOfWeek(subDays(new Date(), stepsWeekOffset * 7), { weekStartsOn: 1 });
                  const weekDays = eachDayOfInterval({ start: weekStart, end: subDays(weekStart, -6) });
                  const weekData = weekDays.map(day => {
                    const dateStr = format(day, "yyyy-MM-dd");
                    const entry = steps.find(s => s.date === dateStr);
                    return {
                      day: format(day, "EEE"),
                      date: dateStr,
                      steps: entry?.steps || 0,
                      goal: defaultStepGoal,
                    };
                  });
                  
                  const avgSteps = weekData.length > 0 
                    ? Math.round(weekData.reduce((sum, d) => sum + d.steps, 0) / weekData.filter(d => d.steps > 0).length || 0) 
                    : 0;
                  const daysOverGoal = weekData.filter(d => d.steps >= defaultStepGoal).length;

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
                          <ReferenceLine y={defaultStepGoal} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
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
            <Button onClick={() => { setActiveTab("gym"); setStrengthDialogOpen(true); }} variant="outline" className="h-auto py-4" data-testid="button-quick-workout">
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

          {/* Dynamic Daily Target - BMR + Activity Calories */}
          {(() => {
            const dateStr = format(selectedNutritionDate, "yyyy-MM-dd");
            const userWeight = nutritionSettings.weight || 180;
            
            // Calculate activity calories for selected date
            const selectedDateSteps = steps.find(s => s.date === dateStr);
            const stepCalories = selectedDateSteps ? calculateStepCalories(selectedDateSteps.steps, userWeight) : 0;
            
            const selectedDateStrength = strength.filter(s => s.date === dateStr);
            const strengthCalories = selectedDateStrength.reduce((sum, w) => {
              const intensity = (w.effort && w.effort >= 8) ? 'intense' : (w.effort && w.effort <= 4) ? 'light' : 'moderate';
              return sum + calculateStrengthCalories(w.duration || 0, intensity);
            }, 0);
            
            const selectedDateCardio = cardioRuns.filter(c => c.date === dateStr);
            const cardioCalories = selectedDateCardio.reduce((sum, c) => sum + calculateCardioCalories(c), 0);
            
            const selectedDateBasketball = runs.filter(r => r.date === dateStr);
            const basketballCalories = selectedDateBasketball.reduce((sum, r) => {
              // Estimate 45 min per game, intensity based on competition level
              const gamesPlayed = r.gamesPlayed || 1;
              const duration = gamesPlayed * 45;
              const intensity = r.competitionLevel === 'intense' ? 'intense' : r.competitionLevel === 'casual' ? 'casual' : 'competitive';
              return sum + calculateSportsCalories(duration, intensity);
            }, 0);
            
            const selectedDateSkills = skills.filter(s => s.date === dateStr);
            const drillCalories = selectedDateSkills.reduce((sum, s) => sum + calculateDrillCalories(30), 0); // Estimate 30 min per drill session
            
            const totalActivityCalories = stepCalories + strengthCalories + cardioCalories + basketballCalories + drillCalories;
            
            // BMR from settings or calculate from body stats
            const bmr = nutritionSettings.bmr || (nutritionSettings.weight && nutritionSettings.height && nutritionSettings.age 
              ? calculateBMR(nutritionSettings.weight, nutritionSettings.height, nutritionSettings.age, (nutritionSettings.gender as 'male' | 'female') || 'male')
              : 1800);
            
            // Total daily burn = BMR + Activity
            const totalBurn = bmr + totalActivityCalories;
            
            // Calculate deficit/surplus adjustment
            const goalWeight = nutritionSettings.goalWeight || nutritionSettings.weight || 175;
            const currentWeight = nutritionSettings.weight || 180;
            const timeframe = nutritionSettings.goalTimeframe || 12;
            const dailyAdjustment = calculateDailyDeficit(currentWeight, goalWeight, timeframe);
            
            // Eating target = Total Burn + Adjustment (negative for deficit, positive for surplus)
            const eatTarget = totalBurn + dailyAdjustment;
            
            const isDeficit = dailyAdjustment < 0;
            const isSurplus = dailyAdjustment > 0;
            
            const targetCalories = nutritionSettings.calorieTarget || eatTarget;
            const strategyLabel = nutritionSettings.strategyBias === 'diet' ? 'diet-focused' : nutritionSettings.strategyBias === 'activity' ? 'activity-focused' : 'balanced';
            const stepGoal = nutritionSettings.stepGoal || 10000;
            const strengthSessions = nutritionSettings.strengthSessionsPerWeek || 3;
            
            return (
              <Card className="border-dashed">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Flame className="h-4 w-4 text-orange-500" />
                    {isToday(selectedNutritionDate) ? "Today's Nutrition Plan" : format(selectedNutritionDate, "MMM d") + " Nutrition Plan"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`text-center p-3 rounded-md ${isDeficit ? 'bg-green-500/10' : isSurplus ? 'bg-blue-500/10' : 'bg-muted/30'}`}>
                      <div className={`text-xl font-bold font-mono ${isDeficit ? 'text-green-500' : isSurplus ? 'text-blue-500' : ''}`}>
                        {targetCalories.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">Target Calories</div>
                    </div>
                    <div className="text-center p-3 bg-muted/30 rounded-md">
                      <div className="text-xl font-bold font-mono">{nutritionSettings.proteinTarget || 150}g</div>
                      <div className="text-xs text-muted-foreground">Target Protein</div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground text-center mt-3">
                    With your <span className="font-medium text-foreground">{strategyLabel}</span> approach, hit your activity target ({stepGoal.toLocaleString()} steps/day, {strengthSessions} strength sessions/week) to eat these calories and hit your weight goal on time.
                  </p>
                  {!nutritionSettings.calorieTarget && (
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      Set your plan in <button type="button" className="text-xs underline text-foreground hover:text-foreground/80" onClick={() => setGoalDialogOpen(true)}>Goal Settings</button> for personalized targets
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })()}

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
            <h2 className="text-xl font-semibold">Sports Session</h2>
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
                settingsData={livePlaySettingsData}
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
              <div className="flex justify-end gap-2">
                <SkillDialog 
                  open={skillDialogOpen} 
                  onOpenChange={(open) => {
                    setSkillDialogOpen(open);
                    if (!open) setEditingSkill(null);
                  }}
                  isDemo={isDemo}
                  editData={editingSkill}
                  onEdit={(id, data) => editSkillMutation.mutate({ id, data })}
                  defaultFields={DEFAULT_PRACTICE_FIELDS}
                  visibleFields={practiceVisibleFields}
                  settingsData={practiceSettingsData}
                />
                <PracticeSettingsDialog
                  open={practiceSettingsOpen}
                  onOpenChange={setPracticeSettingsOpen}
                  isDemo={isDemo}
                  defaultFields={DEFAULT_PRACTICE_FIELDS}
                  currentVisibleFields={practiceVisibleFields}
                  settingsData={practiceSettingsData}
                />
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setPracticeSettingsOpen(true)}
                  data-testid="button-practice-settings"
                >
                  <Settings className="h-4 w-4" />
                </Button>
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

          </Tabs>
        </TabsContent>

        {/* GYM TAB */}
        <TabsContent value="gym" className="space-y-6">
          <Tabs value={gymSubTab} onValueChange={(v) => setGymSubTab(v as GymSubTab)}>
            <TabsList>
              <TabsTrigger value="strength" data-testid="subtab-strength">
                <Dumbbell className="h-4 w-4 mr-2" />
                Strength
              </TabsTrigger>
              <TabsTrigger value="cardio" data-testid="subtab-cardio">
                <Footprints className="h-4 w-4 mr-2" />
                Cardio
              </TabsTrigger>
            </TabsList>

            <TabsContent value="strength" className="space-y-6 mt-4">
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
                  routines={routines}
                />
                <Button onClick={() => { setEditingStrength(null); setStrengthDialogOpen(true); }} data-testid="button-add-strength">
                  <Plus className="h-4 w-4 mr-2" />
                  Log Workout
                </Button>
              </div>

              {/* Strength Training Goal Banner */}
              <Card className={`border-2 ${
                nutritionSettings.goalType === 'maintain' || nutritionSettings.goalType === 'maintenance' ? 'border-blue-500/50 bg-blue-500/5' :
                nutritionSettings.goalType === 'gain' || nutritionSettings.goalType?.includes('bulk') ? 'border-green-500/50 bg-green-500/5' :
                'border-orange-500/50 bg-orange-500/5'
              }`}>
                <CardContent className="py-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${
                        nutritionSettings.goalType === 'maintain' || nutritionSettings.goalType === 'maintenance' ? 'bg-blue-500/20' :
                        nutritionSettings.goalType === 'gain' || nutritionSettings.goalType?.includes('bulk') ? 'bg-green-500/20' :
                        'bg-orange-500/20'
                      }`}>
                        <Dumbbell className={`h-5 w-5 ${
                          nutritionSettings.goalType === 'maintain' || nutritionSettings.goalType === 'maintenance' ? 'text-blue-500' :
                          nutritionSettings.goalType === 'gain' || nutritionSettings.goalType?.includes('bulk') ? 'text-green-500' :
                          'text-orange-500'
                        }`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold">
                            {nutritionSettings.goalType === 'maintain' || nutritionSettings.goalType === 'maintenance' ? 'Maintenance Mode' :
                             nutritionSettings.goalType === 'gain' || nutritionSettings.goalType?.includes('bulk') ? 'Surplus Mode' :
                             'Deficit Mode'}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Your current plan suggests you complete {nutritionSettings.strengthSessionsPerWeek || (nutritionSettings.strategyBias === 'activity' ? 5 : nutritionSettings.strategyBias === 'diet' ? 3 : 4)} strength sessions per week
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

          {/* My Routines Collapsible Section */}
          <Collapsible open={routinesExpanded} onOpenChange={setRoutinesExpanded}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="pb-3 cursor-pointer hover-elevate">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Dumbbell className="h-4 w-4" />
                      My Workout Routines
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{routines.length}</Badge>
                      {routinesExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0 space-y-4">
                  {routines.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No routines saved yet. Create your first workout routine!
                    </p>
                  ) : (
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                      {routines.map((routine) => (
                        <div
                          key={routine.id}
                          className="p-3 rounded-md border bg-background/50 hover-elevate"
                          data-testid={`routine-card-${routine.id}`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <h4 className="font-medium text-sm">{routine.name}</h4>
                              {routine.description && (
                                <p className="text-xs text-muted-foreground">{routine.description}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={() => {
                                  setEditingRoutine(routine);
                                  setRoutineDialogOpen(true);
                                }}
                                data-testid={`button-edit-routine-${routine.id}`}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-destructive"
                                onClick={() => {
                                  if (!isDemo) deleteRoutineMutation.mutate(routine.id);
                                  else toast({ title: "Demo mode - cannot delete" });
                                }}
                                data-testid={`button-delete-routine-${routine.id}`}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="space-y-1">
                            {(routine.exercises as RoutineExercise[]).slice(0, 3).map((ex, idx) => (
                              <div key={ex.id || idx} className="text-xs text-muted-foreground flex items-center gap-2">
                                <span className="font-medium">{ex.name}</span>
                                <span>{ex.sets}x{ex.reps}</span>
                              </div>
                            ))}
                            {(routine.exercises as RoutineExercise[]).length > 3 && (
                              <p className="text-xs text-muted-foreground">
                                +{(routine.exercises as RoutineExercise[]).length - 3} more
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex justify-center pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingRoutine(null);
                        setRoutineDialogOpen(true);
                      }}
                      data-testid="button-add-routine"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Routine
                    </Button>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Routine Dialog */}
          <Dialog open={routineDialogOpen} onOpenChange={(open) => {
            setRoutineDialogOpen(open);
            if (!open) {
              setEditingRoutine(null);
              setAiRoutineGoals("");
            }
          }}>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingRoutine?.id ? "Edit Routine" : "Create Routine"}</DialogTitle>
                <DialogDescription>
                  Build a workout routine with exercises, sets, and reps.
                </DialogDescription>
              </DialogHeader>
              <RoutineForm
                initialData={editingRoutine}
                onSave={(data) => {
                  if (isDemo) {
                    toast({ title: "Demo mode - cannot save" });
                    return;
                  }
                  if (editingRoutine?.id) {
                    updateRoutineMutation.mutate({ id: editingRoutine.id, data });
                  } else {
                    createRoutineMutation.mutate(data);
                  }
                }}
                onGenerate={() => {
                  if (isDemo) {
                    toast({ title: "Demo mode - AI not available" });
                    return;
                  }
                  setRoutineDialogOpen(false);
                  setAiWizardOpen(true);
                  setAiWizardStep("goals");
                  setAiWizardGoals("");
                  setAiWizardQuestions([]);
                  setAiWizardAnswers({});
                }}
                isGenerating={generateRoutineMutation.isPending}
                isSaving={createRoutineMutation.isPending || updateRoutineMutation.isPending}
              />
            </DialogContent>
          </Dialog>

          {/* AI Generated Routines Preview Dialog */}
          <Dialog open={routinePreviewOpen} onOpenChange={setRoutinePreviewOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{generatedRoutinesPreview?.splitName || "Generated Workout Program"}</DialogTitle>
                <DialogDescription>{generatedRoutinesPreview?.splitDescription}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {generatedRoutinesPreview?.routines.map((routine, idx) => (
                  <Card key={routine.id} className={routine.selected ? "border-primary" : "opacity-60"}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={routine.selected}
                          onCheckedChange={(checked) => {
                            setGeneratedRoutinesPreview(prev => prev ? {
                              ...prev,
                              routines: prev.routines.map((r, i) => 
                                i === idx ? { ...r, selected: !!checked } : r
                              )
                            } : null);
                          }}
                          data-testid={`checkbox-routine-${idx}`}
                        />
                        <div className="flex-1">
                          <CardTitle className="text-base">{routine.name}</CardTitle>
                          <p className="text-xs text-muted-foreground">{routine.dayOfWeek} - {routine.description}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-1 text-sm">
                        {routine.exercises.map((ex) => (
                          <div key={ex.id} className="flex items-center gap-2 py-1 border-b last:border-0">
                            <span className="font-medium">{ex.name}</span>
                            <Badge variant="secondary">{ex.sets}x{ex.reps}</Badge>
                            {ex.notes && <span className="text-muted-foreground text-xs">{ex.notes}</span>}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {/* Feedback Section */}
              {feedbackMode && (
                <div className="space-y-3 pt-4 border-t">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      What would you like to change?
                    </Label>
                    <Textarea
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="e.g., Add more leg exercises, reduce to 4 days per week, include more compound movements..."
                      className="resize-none"
                      rows={3}
                      data-testid="input-feedback"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFeedbackMode(false);
                        setFeedbackText("");
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        if (!feedbackText.trim() || !lastGenerationContext) {
                          toast({ title: "Please enter your feedback" });
                          return;
                        }
                        setIsRegenerating(true);
                        generateRoutineMutation.mutate({
                          goals: lastGenerationContext.goals,
                          answers: lastGenerationContext.answers,
                          feedback: feedbackText,
                        });
                      }}
                      disabled={!feedbackText.trim() || isRegenerating}
                      data-testid="button-regenerate-with-feedback"
                    >
                      {isRegenerating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                      Regenerate
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t gap-2">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">
                    {generatedRoutinesPreview?.routines.filter(r => r.selected).length || 0} of {generatedRoutinesPreview?.routines.length || 0} selected
                  </p>
                  {lastGenerationContext && !feedbackMode && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFeedbackMode(true)}
                      data-testid="button-request-changes"
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Request Changes
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => { 
                    setRoutinePreviewOpen(false); 
                    setGeneratedRoutinesPreview(null);
                    setLastGenerationContext(null);
                    setFeedbackMode(false);
                    setFeedbackText("");
                  }}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      const selected = generatedRoutinesPreview?.routines.filter(r => r.selected) || [];
                      if (selected.length === 0) {
                        toast({ title: "Select at least one routine" });
                        return;
                      }
                      saveGeneratedRoutinesMutation.mutate(selected.map(r => ({
                        name: r.name,
                        description: r.description,
                        exercises: r.exercises
                      })));
                    }}
                    disabled={saveGeneratedRoutinesMutation.isPending || isRegenerating}
                    data-testid="button-save-selected-routines"
                  >
                    {saveGeneratedRoutinesMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Save Selected
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* AI Workout Wizard Dialog */}
          <Dialog open={aiWizardOpen} onOpenChange={(open) => {
            setAiWizardOpen(open);
            if (!open) {
              setAiWizardStep("goals");
              setAiWizardGoals("");
              setAiWizardQuestions([]);
              setAiWizardAnswers({});
            }
          }}>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  AI Workout Builder
                </DialogTitle>
                <DialogDescription>
                  {aiWizardStep === "goals" && "Tell me about your fitness goals and I'll create a personalized program."}
                  {aiWizardStep === "questions" && "A few quick questions to customize your program."}
                  {aiWizardStep === "generating" && "Creating your personalized workout program..."}
                </DialogDescription>
              </DialogHeader>

              {/* Step 1: Goals */}
              {aiWizardStep === "goals" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>What are your fitness goals?</Label>
                    <Textarea
                      value={aiWizardGoals}
                      onChange={(e) => setAiWizardGoals(e.target.value)}
                      placeholder="e.g., Build muscle and strength for basketball, lose 15 lbs while maintaining muscle, train for a marathon..."
                      className="resize-none"
                      rows={4}
                      data-testid="input-ai-wizard-goals"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setAiWizardOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={() => clarifyQuestionsMutation.mutate(aiWizardGoals)}
                      disabled={!aiWizardGoals.trim() || clarifyQuestionsMutation.isPending}
                      data-testid="button-get-questions"
                    >
                      {clarifyQuestionsMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      Continue
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 2: Clarifying Questions */}
              {aiWizardStep === "questions" && (
                <div className="space-y-4">
                  <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                    {aiWizardQuestions.map((q, idx) => (
                      <div key={q.id} className="space-y-2">
                        <Label className="text-sm font-medium">{idx + 1}. {q.question}</Label>
                        {q.type === "choice" && q.options ? (
                          <div className="flex flex-wrap gap-2">
                            {q.options.map((option) => (
                              <Button
                                key={option}
                                size="sm"
                                variant={aiWizardAnswers[q.id] === option ? "default" : "outline"}
                                onClick={() => setAiWizardAnswers(prev => ({ ...prev, [q.id]: option }))}
                                data-testid={`button-option-${q.id}-${option}`}
                              >
                                {option}
                              </Button>
                            ))}
                          </div>
                        ) : q.type === "number" ? (
                          <Input
                            type="number"
                            value={aiWizardAnswers[q.id] || ""}
                            onChange={(e) => setAiWizardAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                            placeholder="Enter a number"
                            data-testid={`input-number-${q.id}`}
                          />
                        ) : (
                          <Textarea
                            value={aiWizardAnswers[q.id] || ""}
                            onChange={(e) => setAiWizardAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                            placeholder="Your answer..."
                            className="resize-none"
                            rows={2}
                            data-testid={`input-text-${q.id}`}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between gap-2 pt-2 border-t">
                    <Button variant="ghost" onClick={() => setAiWizardStep("goals")}>
                      Back
                    </Button>
                    <Button
                      onClick={() => {
                        const answers = aiWizardQuestions.map(q => ({
                          question: q.question,
                          answer: aiWizardAnswers[q.id] || "(not answered)",
                        }));
                        // Save context for potential feedback iterations BEFORE generating
                        setLastGenerationContext({ goals: aiWizardGoals, answers });
                        setAiWizardStep("generating");
                        generateRoutineMutation.mutate({ goals: aiWizardGoals, answers });
                      }}
                      disabled={generateRoutineMutation.isPending}
                      data-testid="button-generate-program"
                    >
                      Generate Program
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Generating */}
              {aiWizardStep === "generating" && (
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <p className="text-muted-foreground text-sm">Building your personalized workout program...</p>
                </div>
              )}
            </DialogContent>
          </Dialog>

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

            {/* CARDIO SUB-TAB */}
            <TabsContent value="cardio" className="space-y-6 mt-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Cardio Training</h2>
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
                <Button onClick={() => { setEditingCardio(null); setCardioDialogOpen(true); }} data-testid="button-add-cardio">
                  <Plus className="h-4 w-4 mr-2" />
                  Log Cardio
                </Button>
              </div>

              {/* Cardio Stats Cards */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Total Runs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{cardioRuns.length}</div>
                    <p className="text-xs text-muted-foreground">this month</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Total Distance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{cardioRuns.reduce((sum, r) => sum + (r.distance || 0), 0).toFixed(1)}</div>
                    <p className="text-xs text-muted-foreground">miles</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Avg Pace</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const runsWithPace = cardioRuns.filter(r => r.pace);
                      if (runsWithPace.length === 0) return <div className="text-2xl font-bold">--</div>;
                      // Parse pace strings like "8:30" to decimal minutes (8.5)
                      const parsePace = (p: string): number => {
                        const [mins, secs] = p.split(':').map(Number);
                        return mins + (secs || 0) / 60;
                      };
                      const avgPace = runsWithPace.reduce((sum, r) => sum + parsePace(r.pace!), 0) / runsWithPace.length;
                      const mins = Math.floor(avgPace);
                      const secs = Math.round((avgPace - mins) * 60);
                      return <div className="text-2xl font-bold">{mins}:{secs.toString().padStart(2, '0')}</div>;
                    })()}
                    <p className="text-xs text-muted-foreground">min/mile</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Total Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{Math.round(cardioRuns.reduce((sum, r) => sum + (r.duration || 0), 0))}</div>
                    <p className="text-xs text-muted-foreground">minutes</p>
                  </CardContent>
                </Card>
              </div>

              {/* Cardio Run History */}
              <Card>
                <CardHeader>
                  <CardTitle>Run History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {cardioRuns.length === 0 ? (
                      <p className="text-muted-foreground">No cardio runs logged yet</p>
                    ) : (
                      cardioRuns.sort((a, b) => b.date.localeCompare(a.date)).map((run) => (
                        <div key={run.id} className="border rounded-md p-4" data-testid={`card-cardio-${run.id}`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">{run.terrain || "Run"}</h4>
                              <p className="text-sm text-muted-foreground">{formatDate(run.date)}</p>
                            </div>
                            <div className="flex items-center gap-4">
                              {run.distance && <Badge variant="secondary">{run.distance} mi</Badge>}
                              {run.duration && <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />{run.duration}min</Badge>}
                              {run.pace && (
                                <Badge variant="outline">
                                  {run.pace}/mi
                                </Badge>
                              )}
                              {!isDemo && (
                                <div className="flex gap-1">
                                  <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    onClick={() => {
                                      setEditingCardio(run);
                                      setCardioDialogOpen(true);
                                    }}
                                    data-testid={`button-edit-cardio-${run.id}`}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button size="icon" variant="ghost" onClick={() => deleteCardioMutation.mutate(run.id)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                          {run.notes && <p className="text-sm text-muted-foreground mt-2">{run.notes}</p>}
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
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
                {latestWeight && (() => {
                  const sorted = [...bodyComp].sort((a, b) => b.date.localeCompare(a.date));
                  const daysSinceLast = differenceInDays(new Date(), parseISO(sorted[0]?.date || new Date().toISOString().split("T")[0]));
                  const diff = sorted.length > 1 ? (sorted[0].weight || 0) - (sorted[1].weight || 0) : 0;
                  return (
                    <div className="mt-2 space-y-1">
                      {diff !== 0 && (
                        <div className={`flex items-center gap-1 text-xs ${diff < 0 ? "text-green-500" : diff > 0 ? "text-red-500" : "text-muted-foreground"}`}>
                          {diff < 0 ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                          <span>{diff > 0 ? "+" : ""}{diff.toFixed(1)} lbs from last</span>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {daysSinceLast === 0 ? "Logged today" : daysSinceLast === 1 ? "1 day ago" : `${daysSinceLast} days ago`}
                      </p>
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
                {nutritionSettings.goalWeight && latestWeight?.weight ? (() => {
                  const sortedByDate = [...bodyComp].sort((a, b) => a.date.localeCompare(b.date));
                  const startWeight = sortedByDate[0]?.weight || latestWeight.weight;
                  const currentWeight = latestWeight.weight;
                  const goalWeight = nutritionSettings.goalWeight;
                  const totalToLose = Math.abs(startWeight - goalWeight);
                  const lost = Math.abs(startWeight - currentWeight);
                  const remaining = Math.abs(currentWeight - goalWeight);
                  const progressPercent = totalToLose > 0 ? Math.min(100, (lost / totalToLose) * 100) : 0;
                  
                  const firstDate = sortedByDate[0]?.date ? parseISO(sortedByDate[0].date) : new Date();
                  const daysSinceStart = differenceInDays(new Date(), firstDate) || 1;
                  const weeksSinceStart = daysSinceStart / 7;
                  const currentPace = weeksSinceStart > 0 ? lost / weeksSinceStart : 0;
                  const isDeficit = startWeight > goalWeight;
                  
                  return (
                    <>
                      <div className="text-sm mb-2">
                        <span className="font-medium">{currentWeight}</span> / <span className="text-muted-foreground">{goalWeight} lbs</span>
                      </div>
                      <Progress value={progressPercent} />
                      <div className="mt-2 space-y-1">
                        <p className="text-xs text-muted-foreground">{remaining.toFixed(1)} lbs to go</p>
                        <p className="text-xs text-muted-foreground">
                          Pace: {currentPace.toFixed(2)} lbs/week {isDeficit ? "lost" : "gained"}
                        </p>
                      </div>
                    </>
                  );
                })() : (
                  <p className="text-muted-foreground text-sm">Set a goal weight in Goal Settings</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Body Trend Graph */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
              <CardTitle>Weight Trend</CardTitle>
              <div className="flex gap-1">
                {([30, 60, 90, 365] as const).map((period) => (
                  <Button
                    key={period}
                    size="sm"
                    variant={bodyTrendPeriod === period ? "default" : "outline"}
                    onClick={() => setBodyTrendPeriod(period)}
                    data-testid={`button-trend-${period}d`}
                  >
                    {period === 365 ? "1Y" : `${period}D`}
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              {(() => {
                const cutoffDate = format(subDays(new Date(), bodyTrendPeriod), "yyyy-MM-dd");
                const filteredData = bodyComp
                  .filter(r => r.date >= cutoffDate && r.weight)
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .map(r => ({
                    date: format(parseISO(r.date), bodyTrendPeriod <= 60 ? "MMM d" : "MMM d"),
                    weight: r.weight,
                    fullDate: r.date,
                  }));

                if (filteredData.length === 0) {
                  return <p className="text-muted-foreground text-sm py-8 text-center">No weight data for this period</p>;
                }

                const weights = filteredData.map(d => d.weight || 0);
                const minWeight = Math.floor(Math.min(...weights) - 2);
                const maxWeight = Math.ceil(Math.max(...weights) + 2);

                return (
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={filteredData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                      <defs>
                        <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 11 }} 
                        className="text-muted-foreground"
                        interval="preserveStartEnd"
                      />
                      <YAxis 
                        domain={[minWeight, maxWeight]} 
                        tick={{ fontSize: 11 }} 
                        className="text-muted-foreground"
                        tickFormatter={(v) => `${v}`}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '6px'
                        }}
                        formatter={(value: number) => [`${value} lbs`, 'Weight']}
                      />
                      {latestWeight?.goalWeight && (
                        <ReferenceLine 
                          y={latestWeight.goalWeight} 
                          stroke="hsl(var(--destructive))" 
                          strokeDasharray="5 5"
                          label={{ value: `Goal: ${latestWeight.goalWeight}`, fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                        />
                      )}
                      <Area 
                        type="monotone" 
                        dataKey="weight" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        fill="url(#weightGradient)"
                        dot={{ r: 3, fill: 'hsl(var(--primary))' }}
                        activeDot={{ r: 5 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                );
              })()}
            </CardContent>
          </Card>

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
                      <div key={record.id} className="py-2 border-b last:border-0" data-testid={`record-body-${record.id}`}>
                        <div className="flex items-center justify-between">
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
                        {record.notes && <p className="text-sm text-muted-foreground mt-1 ml-32">{record.notes}</p>}
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
              goal: parseInt(formData.get('goal') as string) || defaultStepGoal,
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
                <Input type="number" name="goal" defaultValue={defaultStepGoal} min="0" data-testid="input-steps-goal" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setStepsDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saveStepsMutation.isPending} data-testid="button-save-steps">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Step Goal Settings Dialog */}
      <Dialog open={stepGoalSettingsOpen} onOpenChange={setStepGoalSettingsOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Step Goal Settings</DialogTitle>
            <DialogDescription>Set your daily step goal target</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target as HTMLFormElement);
            const newGoal = parseInt(formData.get('stepGoal') as string);
            if (newGoal && newGoal >= 100) {
              updateStepGoalMutation.mutate(newGoal);
            }
          }}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Daily Step Goal</Label>
                <Input 
                  type="number" 
                  name="stepGoal" 
                  defaultValue={defaultStepGoal} 
                  min="100" 
                  max="100000"
                  required 
                  data-testid="input-default-step-goal" 
                />
                <p className="text-xs text-muted-foreground">This will be your default goal for new step entries</p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setStepGoalSettingsOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={updateStepGoalMutation.isPending} data-testid="button-save-step-goal">
                {updateStepGoalMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
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
  const [logMode, setLogMode] = useState<"meal" | "total" | "ai" | "photo">("total");
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
  
  // Photo mode state
  const [photoImageData, setPhotoImageData] = useState<string | null>(null);
  const [photoAnalyzing, setPhotoAnalyzing] = useState(false);
  const [photoResult, setPhotoResult] = useState<{
    totalCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFat: number;
    items: { name: string; portion: string; calories: number; protein: number; carbs: number; fat: number }[];
    confidence: "high" | "medium" | "low";
    notes?: string;
  } | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
  // Photo adjustment mode state
  const [adjustMode, setAdjustMode] = useState(false);
  const [adjustMessages, setAdjustMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [adjustInput, setAdjustInput] = useState("");
  const [adjustAnalyzing, setAdjustAnalyzing] = useState(false);
  const adjustChatEndRef = useRef<HTMLDivElement>(null);

  const isEditing = !!editData;

  useEffect(() => {
    // Always reset photo and AI state when dialog opens
    setPhotoImageData(null);
    setPhotoResult(null);
    setPhotoAnalyzing(false);
    setAiChatMessages([]);
    setAiUserInput("");
    setAiResult(null);
    setAdjustMode(false);
    setAdjustMessages([]);
    setAdjustInput("");
    setAdjustAnalyzing(false);
    if (photoInputRef.current) photoInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    
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
    }
  }, [editData]);

  useEffect(() => {
    aiChatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiChatMessages]);

  useEffect(() => {
    adjustChatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [adjustMessages]);

  const sendAdjustMessage = async () => {
    if (!adjustInput.trim() || !photoResult || adjustAnalyzing) return;
    const userMessage = adjustInput.trim();
    const updatedMessages = [...adjustMessages, { role: 'user' as const, content: userMessage }];
    setAdjustMessages(updatedMessages);
    setAdjustInput("");
    setAdjustAnalyzing(true);
    try {
      const res = await apiRequest("POST", "/api/food/analyze/adjust", {
        currentAnalysis: photoResult,
        history: updatedMessages,
      });
      if (!res.ok) {
        throw new Error("Failed to adjust analysis");
      }
      const data = await res.json();
      if (data.updated) {
        setPhotoResult(data.analysis);
        setAdjustMessages([...updatedMessages, { role: 'assistant', content: data.message || "Updated the analysis based on your feedback." }]);
      } else {
        setAdjustMessages([...updatedMessages, { role: 'assistant', content: data.message }]);
      }
    } catch (error) {
      toast({ title: "Failed to adjust analysis", description: "Please try again", variant: "destructive" });
      setAdjustMessages(adjustMessages);
    } finally {
      setAdjustAnalyzing(false);
    }
  };

  const resetAdjustMode = () => {
    setAdjustMode(false);
    setAdjustMessages([]);
    setAdjustInput("");
  };

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

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: "File too large", description: "Please select an image under 10MB", variant: "destructive" });
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPhotoImageData(ev.target?.result as string);
        setPhotoResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoAnalyze = async () => {
    if (!photoImageData) return;
    setPhotoAnalyzing(true);
    try {
      const res = await apiRequest("POST", "/api/food/analyze", { image: photoImageData });
      if (!res.ok) throw new Error("Failed to analyze");
      const data = await res.json();
      if (!data.items || !Array.isArray(data.items)) throw new Error("Invalid response");
      setPhotoResult(data);
    } catch (error) {
      toast({ title: "Analysis failed", variant: "destructive" });
    } finally {
      setPhotoAnalyzing(false);
    }
  };

  const resetPhoto = () => {
    setPhotoImageData(null);
    setPhotoResult(null);
    setAdjustMode(false);
    setAdjustMessages([]);
    setAdjustInput("");
    if (photoInputRef.current) photoInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const applyPhotoResult = () => {
    if (!photoResult) return;
    const meal: Meal = {
      id: `photo-meal-${Date.now()}`,
      name: photoResult.items.length === 1 ? photoResult.items[0].name : `Photo Meal (${photoResult.items.length} items)`,
      calories: photoResult.totalCalories,
      protein: photoResult.totalProtein,
      time: format(new Date(), "h:mm a"),
    };
    const newMeals = [...meals, meal];
    setMeals(newMeals);
    const totalCalories = (parseInt(formData.calories) || 0) + photoResult.totalCalories;
    const totalProtein = (parseInt(formData.protein) || 0) + photoResult.totalProtein;
    const totalCarbs = (parseInt(formData.carbs) || 0) + photoResult.totalCarbs;
    const totalFats = (parseInt(formData.fats) || 0) + photoResult.totalFat;
    setFormData({ ...formData, calories: totalCalories.toString(), protein: totalProtein.toString(), carbs: totalCarbs.toString(), fats: totalFats.toString() });
    setLogMode("meal");
    resetPhoto();
    toast({ title: "Meal added", description: `Added ${meal.name} to your log` });
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
            <Button
              type="button"
              size="sm"
              variant={logMode === "photo" ? "default" : "outline"}
              onClick={() => setLogMode("photo")}
              data-testid="button-log-mode-photo"
            >
              <Camera className="h-4 w-4 mr-1" /> Log by Photo
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

          {/* Photo Mode */}
          {logMode === "photo" && (
          <div className="space-y-3 p-3 border rounded-md">
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoSelect}
              className="hidden"
              data-testid="input-photo-camera"
            />
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoSelect}
              className="hidden"
              data-testid="input-photo-upload"
            />
            
            {!photoImageData ? (
              <div className="space-y-2">
                <div className="text-sm font-medium">Take a photo of your food</div>
                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" onClick={() => cameraInputRef.current?.click()} data-testid="button-take-photo">
                    <Camera className="h-4 w-4 mr-1" /> Take Photo
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => photoInputRef.current?.click()} data-testid="button-upload-photo">
                    Upload Photo
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative">
                  <img src={photoImageData} alt="Food" className="w-full rounded-md object-cover max-h-48" />
                  <Button size="icon" variant="secondary" className="absolute top-2 right-2" onClick={resetPhoto} data-testid="button-clear-photo">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                {!photoResult && (
                  <Button size="sm" onClick={handlePhotoAnalyze} disabled={photoAnalyzing} data-testid="button-analyze-photo">
                    {photoAnalyzing ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Analyzing...</> : "Analyze Food"}
                  </Button>
                )}
                
                {photoResult && (
                  <div className="space-y-3">
                    <div className="p-3 bg-muted/50 rounded-md">
                      <div className="font-medium text-sm mb-2">Found {photoResult.items.length} item(s):</div>
                      {photoResult.items.map((item: { name: string; portion: string; calories: number; protein: number }, i: number) => (
                        <div key={i} className="flex justify-between text-sm py-1 border-b last:border-b-0">
                          <span>{item.name} ({item.portion})</span>
                          <span className="text-muted-foreground">{item.calories} cal, {item.protein}g P</span>
                        </div>
                      ))}
                      <div className="mt-2 pt-2 border-t font-medium text-sm">
                        Total: {photoResult.totalCalories} cal, {photoResult.totalProtein}g P, {photoResult.totalCarbs}g C, {photoResult.totalFat}g F
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Button size="sm" onClick={applyPhotoResult} data-testid="button-apply-photo">
                        <Check className="h-4 w-4 mr-1" /> Add as Meal
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setAdjustMode(!adjustMode)} data-testid="button-adjust-analysis">
                        <MessageSquare className="h-4 w-4 mr-1" /> {adjustMode ? "Hide Adjustment" : "Adjust Analysis"}
                      </Button>
                      <Button size="sm" variant="outline" onClick={resetPhoto} data-testid="button-retake-photo">
                        Retake Photo
                      </Button>
                    </div>
                    
                    {adjustMode && (
                      <div className="space-y-2 border rounded-md p-3">
                        <div className="text-sm font-medium">Adjust the analysis</div>
                        <div className="text-xs text-muted-foreground mb-2">
                          Tell me what to change - portions, food types, or items to add/remove
                        </div>
                        {adjustMessages.length > 0 && (
                          <div className="max-h-32 overflow-y-auto space-y-2 mb-2">
                            {adjustMessages.map((msg, i) => (
                              <div key={i} className={`text-sm p-2 rounded-md ${msg.role === 'user' ? 'bg-primary/10 ml-4' : 'bg-muted mr-4'}`}>
                                {msg.content}
                              </div>
                            ))}
                            <div ref={adjustChatEndRef} />
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Input 
                            placeholder="e.g., 'the rice is actually 2 cups' or 'add a fried egg'" 
                            value={adjustInput} 
                            onChange={(e) => setAdjustInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendAdjustMessage()}
                            disabled={adjustAnalyzing}
                            data-testid="input-adjust-analysis"
                          />
                          <Button size="sm" onClick={sendAdjustMessage} disabled={adjustAnalyzing || !adjustInput.trim()} data-testid="button-send-adjustment">
                            {adjustAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          )}

          {/* Totals - only shown in total or meal mode */}
          {logMode !== "ai" && logMode !== "photo" && (
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
  onSave: (data: { goalType: string; calorieTarget: number; maintenanceCalories: number; weight?: number; height?: number; age?: number; gender?: string; goalWeight?: number; goalTimeframe?: number; bmr?: number; goalPace?: string; strategyBias?: string; stepGoal?: number; proteinTarget?: number; strengthSessionsPerWeek?: number }) => void;
}) {
  const { toast } = useToast();
  const [goalMode, setGoalMode] = useState(nutritionSettings.goalType || 'moderate_cut');
  const [customGoalLabel, setCustomGoalLabel] = useState("");
  const [target, setTarget] = useState(nutritionSettings.calorieTarget?.toString() || '2000');
  const [isCustomMode, setIsCustomMode] = useState(false);
  
  // BMR Calculator state
  const [bmrData, setBmrData] = useState({
    weight: "",
    height: "",
    age: "",
    gender: "male",
  });
  const [bmrResult, setBmrResult] = useState<number | null>(null);
  
  // Goal weight and timeframe state
  const [goalWeight, setGoalWeight] = useState("");
  const [goalTimeframe, setGoalTimeframe] = useState("12");
  const [useTargetDate, setUseTargetDate] = useState(false);
  const [targetDate, setTargetDate] = useState<Date | undefined>(undefined);
  
  // Goal direction and willingness state
  const [goalDirection, setGoalDirection] = useState<"lose" | "maintain" | "gain">("lose");
  const [workoutWillingness, setWorkoutWillingness] = useState<"minimal" | "moderate" | "high">("moderate");
  
  // Pace and strategy state
  const [goalPace, setGoalPace] = useState<"conservative" | "moderate" | "aggressive">("moderate");
  const [strategyBias, setStrategyBias] = useState<"diet" | "balanced" | "activity">("balanced");
  const [activityLevel, setActivityLevel] = useState<"sedentary" | "lightly_active" | "moderately_active" | "very_active">("lightly_active");
  const [activityWillingness, setActivityWillingness] = useState<"minimal" | "moderate" | "very_active">("moderate");
  
  // Computed plan values (auto-sync target and save step goal)
  const [computedPlan, setComputedPlan] = useState<{ 
    dailyCalories: number; 
    steps: number; 
    proteinTarget: number;
    bmr?: number;
    sedentaryTDEE?: number;
    dietaryDeficit?: number;
    stepCalories?: number;
    liftingCalories?: number;
    totalWeeklyDeficit?: number;
    requiredWeeklyDeficit?: number;
    strengthSessions?: number;
  } | null>(null);
  
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
    stepGoal?: number;
    strengthSessionsPerWeek?: number;
    strategyBias?: "diet" | "balanced" | "activity";
    explanation: string;
    weeklyChangeEstimate: string;
    bmr?: number;
    sedentaryTDEE?: number;
    requiredWeeklyDeficit?: number;
    dietaryDeficit?: number;
    stepCalories?: number;
    liftingCalories?: number;
    totalWeeklyDeficit?: number;
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
      setTarget(nutritionSettings.calorieTarget?.toString() || '2000');
      
      // Pre-populate BMR data from saved settings
      setBmrData({
        weight: nutritionSettings.weight?.toString() || "",
        height: nutritionSettings.height?.toString() || "",
        age: nutritionSettings.age?.toString() || "",
        gender: nutritionSettings.gender || "male",
      });
      
      // Pre-populate goal weight and timeframe
      setGoalWeight(nutritionSettings.goalWeight?.toString() || "");
      setGoalTimeframe(nutritionSettings.goalTimeframe?.toString() || "12");
      
      // Pre-populate pace and strategy
      setGoalPace((nutritionSettings.goalPace as "conservative" | "moderate" | "aggressive") || "moderate");
      setStrategyBias((nutritionSettings.strategyBias as "diet" | "balanced" | "activity") || "balanced");
      
      // If we have saved BMR data, recalculate the result
      if (nutritionSettings.weight && nutritionSettings.height && nutritionSettings.age) {
        const gender = nutritionSettings.gender || "male";
        const calculatedBmr = calculateBMR(nutritionSettings.weight, nutritionSettings.height, nutritionSettings.age, gender as 'male' | 'female');
        setBmrResult(calculatedBmr);
      } else if (nutritionSettings.bmr) {
        setBmrResult(nutritionSettings.bmr);
      } else {
        setBmrResult(null);
      }
    }
  }, [open, nutritionSettings]);

  // Calculate recommended daily deficit based on goal weight and timeframe
  // Use exact days when target date is selected for precise calculations
  const calculatedDeficit = (() => {
    if (!bmrData.weight || !goalWeight) return 0;
    
    if (useTargetDate && targetDate) {
      const daysUntil = Math.max(1, differenceInDays(targetDate, new Date()));
      return calculateDailyDeficitByDays(parseFloat(bmrData.weight), parseFloat(goalWeight), daysUntil);
    }
    
    return goalTimeframe 
      ? calculateDailyDeficit(parseFloat(bmrData.weight), parseFloat(goalWeight), parseInt(goalTimeframe))
      : 0;
  })();
  
  // Calculate actual days for display (either from date or weeks)
  const timeframeDays = useTargetDate && targetDate 
    ? Math.max(1, differenceInDays(targetDate, new Date()))
    : parseInt(goalTimeframe || "12") * 7;

  // Auto-update target based on flow selections
  useEffect(() => {
    if (!bmrResult) return;
    
    const multipliers = { sedentary: 1.2, lightly_active: 1.375, moderately_active: 1.55, very_active: 1.725 };
    
    if (goalDirection === "maintain") {
      const tdee = Math.round(bmrResult * multipliers[activityLevel]);
      setTarget(tdee.toString());
    } else if (goalDirection === "gain") {
      const tdee = Math.round(bmrResult * multipliers[activityLevel]);
      const surplus = workoutWillingness === "minimal" ? 250 : workoutWillingness === "moderate" ? 350 : 500;
      setTarget((tdee + surplus).toString());
    } else if (goalDirection === "lose") {
      const strategies = {
        diet: { deficitPct: 0.85, activityMult: 1.3 },
        balanced: { deficitPct: 0.65, activityMult: 1.45 },
        activity: { deficitPct: 0.45, activityMult: 1.6 },
      };
      const config = strategies[strategyBias];
      const tdee = Math.round(bmrResult * config.activityMult);
      const targetDeficit = calculatedDeficit !== 0 ? Math.abs(calculatedDeficit) : 500;
      const foodDeficit = Math.round(targetDeficit * config.deficitPct);
      setTarget((tdee - foodDeficit).toString());
    }
  }, [bmrResult, goalDirection, activityLevel, workoutWillingness, strategyBias, calculatedDeficit]);

  // Compute full plan for "lose" flow to get step goal and sync target
  // Uses BMR × 1.2 (sedentary TDEE) as baseline to avoid double-counting steps
  useEffect(() => {
    if (!bmrResult || goalDirection !== "lose") {
      setComputedPlan(null);
      return;
    }
    
    const CAL_PER_STEP = 0.04;
    const CAL_PER_STRENGTH_SESSION = 250;
    
    const strategyPresets = {
      diet: { baseSteps: 5500, strength: 2 },
      balanced: { baseSteps: 10500, strength: 3 },
      activity: { baseSteps: 15000, strength: 5 },
    };
    
    const requiredDailyDeficit = calculatedDeficit !== 0 ? Math.abs(calculatedDeficit) : 500;
    const requiredWeeklyDeficit = requiredDailyDeficit * 7;
    const gender = bmrData.gender || "male";
    const preset = strategyPresets[strategyBias];
    
    // Use sedentary TDEE (BMR × 1.2) as baseline - steps are ADDITIONAL activity
    const sedentaryTDEE = Math.round(bmrResult * 1.2);
    
    const minCalories = gender === "female" ? 1200 : 1500;
    const maxFoodDeficitDaily = sedentaryTDEE - minCalories;
    
    // Use 0.9g per lb of body weight
    const weightLbs = bmrData.weight ? parseFloat(bmrData.weight) : 180;
    const proteinTarget = Math.round(weightLbs * 0.9);
    
    let finalStrengthSessions = preset.strength;
    let liftingCalories = finalStrengthSessions * CAL_PER_STRENGTH_SESSION;
    let finalSteps = preset.baseSteps;
    
    // Calculate initial activity burn
    let stepCalories = Math.round(finalSteps * 7 * CAL_PER_STEP);
    let activityBurnWeekly = stepCalories + liftingCalories;
    
    // Calculate what food deficit is needed to hit target
    let foodDeficitWeekly = requiredWeeklyDeficit - activityBurnWeekly;
    let foodDeficitDaily = foodDeficitWeekly / 7;
    
    // If food deficit exceeds safety, we need MORE activity
    if (foodDeficitDaily > maxFoodDeficitDaily) {
      const extraDeficitNeeded = (foodDeficitDaily - maxFoodDeficitDaily) * 7;
      const extraStepsNeeded = Math.ceil(extraDeficitNeeded / (CAL_PER_STEP * 7));
      finalSteps = preset.baseSteps + extraStepsNeeded;
      stepCalories = Math.round(finalSteps * 7 * CAL_PER_STEP);
      activityBurnWeekly = stepCalories + liftingCalories;
      foodDeficitWeekly = requiredWeeklyDeficit - activityBurnWeekly;
      foodDeficitDaily = foodDeficitWeekly / 7;
    }
    
    // If food deficit is NEGATIVE (activity alone exceeds target), reduce activity to hit target
    if (foodDeficitDaily < 0) {
      const minSteps = 3000;
      const minStepsBurn = Math.round(minSteps * 7 * CAL_PER_STEP);
      
      if (liftingCalories + minStepsBurn <= requiredWeeklyDeficit) {
        // We can hit target by adjusting steps
        const targetStepsBurn = requiredWeeklyDeficit - liftingCalories;
        finalSteps = Math.max(minSteps, Math.round(targetStepsBurn / (7 * CAL_PER_STEP)));
        stepCalories = Math.round(finalSteps * 7 * CAL_PER_STEP);
        activityBurnWeekly = stepCalories + liftingCalories;
        foodDeficitWeekly = requiredWeeklyDeficit - activityBurnWeekly;
        foodDeficitDaily = foodDeficitWeekly / 7;
      } else {
        // Even minimum steps exceed target - reduce strength sessions too
        finalSteps = minSteps;
        stepCalories = Math.round(finalSteps * 7 * CAL_PER_STEP);
        const remainingDeficit = requiredWeeklyDeficit - stepCalories;
        finalStrengthSessions = Math.max(0, Math.floor(remainingDeficit / CAL_PER_STRENGTH_SESSION));
        liftingCalories = finalStrengthSessions * CAL_PER_STRENGTH_SESSION;
        activityBurnWeekly = stepCalories + liftingCalories;
        foodDeficitWeekly = requiredWeeklyDeficit - activityBurnWeekly;
        foodDeficitDaily = foodDeficitWeekly / 7;
      }
    }
    
    // Calculate from sedentary TDEE
    const rawDailyCalories = sedentaryTDEE - foodDeficitDaily;
    const finalDailyCalories = Math.max(minCalories, Math.round(rawDailyCalories));
    
    // Recalculate actual dietary deficit based on final calories
    const actualDietaryDeficit = (sedentaryTDEE - finalDailyCalories) * 7;
    const totalWeeklyDeficit = actualDietaryDeficit + stepCalories + liftingCalories;
    
    setComputedPlan({ 
      dailyCalories: finalDailyCalories, 
      steps: finalSteps, 
      proteinTarget,
      bmr: bmrResult,
      sedentaryTDEE,
      dietaryDeficit: actualDietaryDeficit,
      stepCalories,
      liftingCalories,
      totalWeeklyDeficit,
      requiredWeeklyDeficit,
      strengthSessions: finalStrengthSessions,
    });
    setTarget(finalDailyCalories.toString());
  }, [bmrResult, goalDirection, strategyBias, calculatedDeficit, bmrData.weight, bmrData.gender]);

  const computeBMR = () => {
    const weight = parseFloat(bmrData.weight);
    const height = parseFloat(bmrData.height);
    const age = parseInt(bmrData.age);
    
    if (!weight || !height || !age) {
      toast({ title: "Please fill in weight, height, and age", variant: "destructive" });
      return;
    }
    
    const bmr = calculateBMR(weight, height, age, bmrData.gender as 'male' | 'female');
    setBmrResult(bmr);
    toast({ title: `BMR calculated: ${bmr} cal/day` });
  };

  const startAIChat = async () => {
    setIsLoading(true);
    setChatMessages([]);
    setAiRecommendation(null);
    
    // Use BMR data if available
    const hasStats = bmrResult || (nutritionSettings.weight && nutritionSettings.height && nutritionSettings.age);
    const currentStats = hasStats ? {
      weight: bmrData.weight || nutritionSettings.weight?.toString() || "",
      height: bmrData.height || nutritionSettings.height?.toString() || "",
      age: bmrData.age || nutritionSettings.age?.toString() || "",
      gender: bmrData.gender || nutritionSettings.gender || "male",
      bmr: bmrResult || nutritionSettings.bmr || null,
      goalWeight: goalWeight || nutritionSettings.goalWeight?.toString() || "",
      goalTimeframe: goalTimeframe || nutritionSettings.goalTimeframe?.toString() || "12",
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
      // Handle both message-only and final recommendation responses
      const assistantContent = data.message || (data.isFinal && data.recommendation 
        ? `Here's my recommendation: ${data.recommendation.calorieTarget} calories/day with ${data.recommendation.stepGoal || 10000} daily steps.`
        : "I'm here to help with your goals.");
      setChatMessages([{ role: 'assistant', content: assistantContent }]);
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
    // Filter out any messages with null/undefined content before adding new message
    const validHistory = chatMessages.filter(msg => msg.content != null && msg.content !== '');
    const updatedHistory = [...validHistory, newUserMessage];
    setChatMessages(updatedHistory);
    setUserInput("");
    setIsLoading(true);
    
    // Use BMR data if available
    const hasStats = bmrResult || (nutritionSettings.weight && nutritionSettings.height && nutritionSettings.age);
    const currentStats = hasStats ? {
      weight: bmrData.weight || nutritionSettings.weight?.toString() || "",
      height: bmrData.height || nutritionSettings.height?.toString() || "",
      age: bmrData.age || nutritionSettings.age?.toString() || "",
      gender: bmrData.gender || nutritionSettings.gender || "male",
      bmr: bmrResult || nutritionSettings.bmr || null,
      goalWeight: goalWeight || nutritionSettings.goalWeight?.toString() || "",
      goalTimeframe: goalTimeframe || nutritionSettings.goalTimeframe?.toString() || "12",
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
      // Handle both message-only and final recommendation responses
      const assistantContent = data.message || (data.isFinal && data.recommendation 
        ? `Updated recommendation: ${data.recommendation.calorieTarget} calories/day with ${data.recommendation.stepGoal || 10000} daily steps.`
        : "Let me know if you'd like any adjustments.");
      setChatMessages([...updatedHistory, { role: 'assistant', content: assistantContent }]);
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
      setTarget(aiRecommendation.calorieTarget.toString());
      
      // Set strategy bias if provided
      if (aiRecommendation.strategyBias) {
        setStrategyBias(aiRecommendation.strategyBias);
      }
      
      // Set computed plan with AI values for display and saving
      // Include bmr and sedentaryTDEE from the recommendation or calculate from current bmrResult
      const bmr = aiRecommendation.bmr || bmrResult || 0;
      const sedentaryTDEE = aiRecommendation.sedentaryTDEE || Math.round(bmr * 1.2);
      
      setComputedPlan({
        dailyCalories: aiRecommendation.calorieTarget,
        steps: aiRecommendation.stepGoal || 10000,
        proteinTarget: aiRecommendation.proteinTarget,
        bmr,
        sedentaryTDEE,
      });
      
      // Close AI chat and show the plan
      setShowAIChat(false);
      toast({ title: "AI recommendation applied" });
    }
  };

  const handleSave = () => {
    if (isDemo) {
      toast({ title: "Demo mode - changes not saved" });
      onOpenChange(false);
      return;
    }
    
    // Use goalDirection as the primary goalType if in guided flow, otherwise use preset/custom mode
    const finalGoalType = goalDirection === "lose" ? "lose" : 
                          goalDirection === "gain" ? "gain" : 
                          goalDirection === "maintain" ? "maintain" :
                          goalMode === 'custom' ? (customGoalLabel || 'custom') : goalMode;
    onSave({
      goalType: finalGoalType,
      calorieTarget: parseInt(target) || 2000,
      maintenanceCalories: bmrResult || nutritionSettings.maintenanceCalories || 2000,
      weight: bmrData.weight ? parseInt(bmrData.weight) : undefined,
      height: bmrData.height ? parseInt(bmrData.height) : undefined,
      age: bmrData.age ? parseInt(bmrData.age) : undefined,
      gender: bmrData.gender || undefined,
      goalWeight: goalWeight ? parseInt(goalWeight) : undefined,
      goalTimeframe: goalTimeframe ? parseInt(goalTimeframe) : undefined,
      bmr: bmrResult || undefined,
      goalPace,
      strategyBias,
      stepGoal: computedPlan?.steps || undefined,
      proteinTarget: computedPlan?.proteinTarget || undefined,
      strengthSessionsPerWeek: strategyBias === 'activity' ? 5 : strategyBias === 'balanced' ? 4 : 3,
    });
  };

  // Calculate implied weekly rate for pace warnings
  const impliedWeeklyRate = bmrData.weight && goalWeight && goalTimeframe
    ? Math.abs((parseFloat(goalWeight) - parseFloat(bmrData.weight)) / parseInt(goalTimeframe))
    : 0;
  
  // Get pace limits (lbs/week)
  const paceLimits = {
    conservative: 0.5,
    moderate: 1.0,
    aggressive: 1.5,
  };
  
  // Check if pace exceeds safe limits
  const isPaceTooAggressive = impliedWeeklyRate > paceLimits[goalPace];
  const isVeryAggressive = impliedWeeklyRate > 2.0;
  
  // Calculate deficit for safety warnings
  const dailyDeficitMagnitude = Math.abs(calculatedDeficit);
  const isBelowBMR = bmrResult && parseInt(target) < bmrResult;
  const isExcessiveDeficit = dailyDeficitMagnitude > 1000;
  const isExcessiveSurplus = calculatedDeficit > 800;

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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Set Your Goal</DialogTitle>
          <DialogDescription>
            Calculate your BMR, set your goal weight, and define your timeline
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-5">
          {/* BMR Calculator Section */}
          <div className="space-y-3 p-4 bg-muted/30 rounded-md">
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="h-4 w-4" />
              <Label className="font-medium">BMR Calculator</Label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Current Weight (lbs)</Label>
                <Input
                  type="number"
                  value={bmrData.weight}
                  onChange={(e) => setBmrData({ ...bmrData, weight: e.target.value })}
                  placeholder="180"
                  data-testid="input-bmr-weight"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Height (in)</Label>
                <Input
                  type="number"
                  value={bmrData.height}
                  onChange={(e) => setBmrData({ ...bmrData, height: e.target.value })}
                  placeholder="70"
                  data-testid="input-bmr-height"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Age</Label>
                <Input
                  type="number"
                  value={bmrData.age}
                  onChange={(e) => setBmrData({ ...bmrData, age: e.target.value })}
                  placeholder="30"
                  data-testid="input-bmr-age"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Gender</Label>
                <Select value={bmrData.gender} onValueChange={(v) => setBmrData({ ...bmrData, gender: v })}>
                  <SelectTrigger data-testid="select-bmr-gender">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={computeBMR} size="sm" variant="secondary" data-testid="button-calculate-bmr">
                Calculate BMR
              </Button>
              {bmrResult && (
                <span className="text-sm text-muted-foreground">
                  BMR: <span className="font-bold text-foreground">{bmrResult} cal/day</span>
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              BMR is calories burned at rest. Activity calories are added dynamically from your logged workouts.
            </p>
          </div>

          {/* Goal Direction Section - greyed out until BMR is calculated */}
          <div className={`space-y-3 p-4 bg-muted/30 rounded-md ${!bmrResult ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4" />
                <Label className="font-medium">What's your goal?</Label>
              </div>
              <div className="flex gap-2">
                {(["lose", "maintain", "gain"] as const).map((direction) => (
                  <Button
                    key={direction}
                    type="button"
                    variant={goalDirection === direction ? "default" : "outline"}
                    size="sm"
                    className="flex-1"
                    onClick={() => setGoalDirection(direction)}
                    data-testid={`button-goal-${direction}`}
                  >
                    {direction === "lose" && "Lose Weight"}
                    {direction === "maintain" && "Maintain"}
                    {direction === "gain" && "Gain Weight"}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {goalDirection === "lose" && "Create a calorie deficit through diet and activity to lose weight."}
                {goalDirection === "maintain" && "Balance calories in vs out to maintain your current weight."}
                {goalDirection === "gain" && "Create a calorie surplus to build muscle and gain weight."}
              </p>
          </div>

          {/* Goal Weight & Timeframe Section - greyed out until BMR, hidden if maintain */}
          {goalDirection !== "maintain" && (
          <div className={`space-y-3 p-4 bg-muted/30 rounded-md ${!bmrResult ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4" />
              <Label className="font-medium">Weight Goal</Label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Goal Weight (lbs)</Label>
                <Input
                  type="number"
                  value={goalWeight}
                  onChange={(e) => setGoalWeight(e.target.value)}
                  placeholder="170"
                  data-testid="input-goal-weight"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Timeframe</Label>
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant={!useTargetDate ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setUseTargetDate(false)}
                    data-testid="button-timeframe-weeks"
                  >
                    Weeks
                  </Button>
                  <Button 
                    type="button" 
                    variant={useTargetDate ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setUseTargetDate(true)}
                    data-testid="button-timeframe-date"
                  >
                    Target Date
                  </Button>
                </div>
                {!useTargetDate ? (
                  <Select value={goalTimeframe} onValueChange={(v) => setGoalTimeframe(v)}>
                    <SelectTrigger data-testid="select-goal-timeframe">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2 weeks</SelectItem>
                      <SelectItem value="4">4 weeks</SelectItem>
                      <SelectItem value="6">6 weeks</SelectItem>
                      <SelectItem value="8">8 weeks</SelectItem>
                      <SelectItem value="10">10 weeks</SelectItem>
                      <SelectItem value="12">12 weeks (3 months)</SelectItem>
                      <SelectItem value="16">16 weeks (4 months)</SelectItem>
                      <SelectItem value="20">20 weeks (5 months)</SelectItem>
                      <SelectItem value="24">24 weeks (6 months)</SelectItem>
                      <SelectItem value="36">36 weeks (9 months)</SelectItem>
                      <SelectItem value="52">52 weeks (1 year)</SelectItem>
                      <SelectItem value="78">78 weeks (1.5 years)</SelectItem>
                      <SelectItem value="104">104 weeks (2 years)</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start text-left font-normal"
                        data-testid="button-select-target-date"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {targetDate ? format(targetDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarPicker
                        mode="single"
                        selected={targetDate}
                        onSelect={(date) => {
                          setTargetDate(date);
                          if (date) {
                            const weeksUntil = Math.max(1, Math.ceil(differenceInDays(date, new Date()) / 7));
                            setGoalTimeframe(weeksUntil.toString());
                          }
                        }}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                )}
                {useTargetDate && targetDate && (
                  <div className="text-xs text-muted-foreground">
                    {differenceInDays(targetDate, new Date())} days ({(differenceInDays(targetDate, new Date()) / 7).toFixed(1)} weeks)
                  </div>
                )}
              </div>
            </div>
            {bmrData.weight && goalWeight && (
              <div className="p-3 bg-background rounded-md border">
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Weight change:</span>
                    <span className={`font-medium ${parseFloat(goalWeight) < parseFloat(bmrData.weight) ? 'text-green-500' : parseFloat(goalWeight) > parseFloat(bmrData.weight) ? 'text-blue-500' : ''}`}>
                      {parseFloat(goalWeight) - parseFloat(bmrData.weight) > 0 ? '+' : ''}{(parseFloat(goalWeight) - parseFloat(bmrData.weight)).toFixed(1)} lbs
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Required daily change:</span>
                    <span className={`font-medium ${calculatedDeficit < 0 ? 'text-green-500' : calculatedDeficit > 0 ? 'text-blue-500' : ''}`}>
                      {calculatedDeficit > 0 ? '+' : ''}{calculatedDeficit} cal/day
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Timeframe:</span>
                    <span className="font-medium">
                      {timeframeDays} days ({(timeframeDays / 7).toFixed(1)} weeks)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Weekly rate:</span>
                    <span className="font-medium">
                      {Math.abs((parseFloat(goalWeight) - parseFloat(bmrData.weight)) / (timeframeDays / 7)).toFixed(2)} lbs/week
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
          )}

          {/* MAINTAIN FLOW */}
          {goalDirection === "maintain" && (
          <div className={`space-y-4 p-4 bg-muted/30 rounded-md ${!bmrResult ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4" />
              <Label className="font-medium">How active are you?</Label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {([
                { key: "sedentary", label: "Sedentary", desc: "Desk job, little exercise" },
                { key: "lightly_active", label: "Lightly Active", desc: "Light exercise 1-3 days/week" },
                { key: "moderately_active", label: "Moderately Active", desc: "Moderate exercise 3-5 days/week" },
                { key: "very_active", label: "Very Active", desc: "Hard exercise 6-7 days/week" },
              ] as const).map((level) => (
                <Button
                  key={level.key}
                  type="button"
                  variant={activityLevel === level.key ? "default" : "outline"}
                  size="sm"
                  className="flex flex-col h-auto py-2"
                  onClick={() => setActivityLevel(level.key)}
                  data-testid={`button-activity-${level.key}`}
                >
                  <span>{level.label}</span>
                  <span className="text-xs opacity-70 font-normal">{level.desc}</span>
                </Button>
              ))}
            </div>
            
            {(() => {
              const multipliers = { sedentary: 1.2, lightly_active: 1.375, moderately_active: 1.55, very_active: 1.725 };
              const bmr = bmrResult ?? 0;
              const tdee = Math.round(bmr * multipliers[activityLevel]);
              return (
                <div className="mt-4 p-3 bg-background rounded-md border">
                  <div className="text-xs text-muted-foreground mb-1">Suggested Daily Calories</div>
                  <div className="text-2xl font-bold">{tdee}</div>
                  <div className="text-xs text-muted-foreground">TDEE = BMR ({bmr}) x {multipliers[activityLevel]}</div>
                </div>
              );
            })()}
          </div>
          )}

          {/* GAIN WEIGHT FLOW */}
          {goalDirection === "gain" && (
          <div className={`space-y-4 p-4 bg-muted/30 rounded-md ${!bmrResult ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4" />
              <Label className="font-medium">How active are you?</Label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {([
                { key: "sedentary", label: "Sedentary", desc: "Desk job, little exercise" },
                { key: "lightly_active", label: "Lightly Active", desc: "Light exercise 1-3 days/week" },
                { key: "moderately_active", label: "Moderately Active", desc: "Moderate exercise 3-5 days/week" },
                { key: "very_active", label: "Very Active", desc: "Hard exercise 6-7 days/week" },
              ] as const).map((level) => (
                <Button
                  key={level.key}
                  type="button"
                  variant={activityLevel === level.key ? "default" : "outline"}
                  size="sm"
                  className="flex flex-col h-auto py-2"
                  onClick={() => setActivityLevel(level.key)}
                  data-testid={`button-gain-activity-${level.key}`}
                >
                  <span>{level.label}</span>
                  <span className="text-xs opacity-70 font-normal">{level.desc}</span>
                </Button>
              ))}
            </div>

            <div className="space-y-3 mt-4">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                <Label className="font-medium">How much are you willing to workout?</Label>
              </div>
              <div className="flex gap-2">
                {(["minimal", "moderate", "high"] as const).map((level) => (
                  <Button
                    key={level}
                    type="button"
                    variant={workoutWillingness === level ? "default" : "outline"}
                    size="sm"
                    className="flex-1"
                    onClick={() => setWorkoutWillingness(level)}
                    data-testid={`button-gain-workout-${level}`}
                  >
                    {level === "minimal" && "Minimal"}
                    {level === "moderate" && "Moderate"}
                    {level === "high" && "Intensive"}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {workoutWillingness === "minimal" && "1-2 light sessions per week."}
                {workoutWillingness === "moderate" && "3-4 sessions per week with strength focus."}
                {workoutWillingness === "high" && "5+ structured strength sessions per week."}
              </p>
            </div>
            
            {(() => {
              const multipliers = { sedentary: 1.2, lightly_active: 1.375, moderately_active: 1.55, very_active: 1.725 };
              const bmr = bmrResult ?? 0;
              const tdee = Math.round(bmr * multipliers[activityLevel]);
              const surplus = workoutWillingness === "minimal" ? 250 : workoutWillingness === "moderate" ? 350 : 500;
              const recommendedCalories = tdee + surplus;
              const weightKg = bmrData.weight ? parseFloat(bmrData.weight) / 2.2 : 80;
              const proteinTarget = Math.round(weightKg * 2.0);
              
              return (
                <div className="mt-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-background rounded-md border">
                      <div className="text-xs text-muted-foreground mb-1">Daily Calories</div>
                      <div className="text-xl font-bold">{recommendedCalories}</div>
                      <div className="text-xs text-muted-foreground">TDEE + {surplus} surplus</div>
                    </div>
                    <div className="p-3 bg-background rounded-md border">
                      <div className="text-xs text-muted-foreground mb-1">Protein Target</div>
                      <div className="text-xl font-bold">{proteinTarget}g</div>
                      <div className="text-xs text-muted-foreground">2g per kg bodyweight</div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
          )}

          {/* LOSE WEIGHT FLOW */}
          {goalDirection === "lose" && (
          <div className={`space-y-4 p-4 bg-muted/30 rounded-md ${!bmrResult ? 'opacity-50 pointer-events-none' : ''}`}>
            {/* Show deficit needed - this is the non-negotiable goal */}
            {calculatedDeficit !== 0 && (
              <div className="p-3 bg-background rounded-md border">
                <div className="text-sm">
                  Required deficit: <span className="font-bold text-green-500">{Math.abs(calculatedDeficit)} cal/day</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  This deficit is fixed based on your goal. The system will determine how to achieve it.
                </div>
              </div>
            )}

            {/* Strategy Bias - controls distribution */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                <Label className="font-medium">Strategy Bias</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                How do you prefer to create your deficit?
              </p>
              <div className="space-y-2">
                {([
                  { key: "diet", label: "Diet Focus", desc: "70% from food, 30% from activity" },
                  { key: "balanced", label: "Balanced", desc: "50% from food, 50% from activity" },
                  { key: "activity", label: "Activity Focus", desc: "35% from food, 65% from activity" },
                ] as const).map((strategy) => (
                  <Button
                    key={strategy.key}
                    type="button"
                    variant={strategyBias === strategy.key ? "default" : "outline"}
                    className="w-full flex flex-col h-auto py-3 items-start"
                    onClick={() => setStrategyBias(strategy.key)}
                    data-testid={`button-lose-strategy-${strategy.key}`}
                  >
                    <span className="font-medium">{strategy.label}</span>
                    <span className="text-xs opacity-70 font-normal">{strategy.desc}</span>
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Calculated Recommendations */}
            {(() => {
              // === CONSTANTS ===
              const CAL_PER_STEP = 0.04;
              const CAL_PER_STRENGTH_SESSION = 250;
              const PROTEIN_TEF_RATE = 0.25;
              
              // Strategy presets (strength is fixed, steps can increase if needed)
              const strategyPresets = {
                diet: { baseSteps: 5500, strength: 2, stepsRange: "3k-8k", strengthRange: "1-2" },
                balanced: { baseSteps: 10500, strength: 3, stepsRange: "8k-13k", strengthRange: "2-4" },
                activity: { baseSteps: 15000, strength: 5, stepsRange: "13k+", strengthRange: "3-6" },
              };
              
              // === INPUTS ===
              const bmr = bmrResult ?? 0;
              const sedentaryTDEE = Math.round(bmr * 1.2);
              const requiredDailyDeficit = calculatedDeficit !== 0 ? Math.abs(calculatedDeficit) : 500;
              const requiredWeeklyDeficit = requiredDailyDeficit * 7;
              const weightKg = bmrData.weight ? parseFloat(bmrData.weight) / 2.2 : 80;
              const gender = bmrData.gender || "male";
              const preset = strategyPresets[strategyBias];
              
              // === SAFETY FLOOR (never go below) ===
              const minCalories = gender === "female" ? 1200 : 1500;
              const maxFoodDeficitDaily = sedentaryTDEE - minCalories;
              
              // === PROTEIN CALCULATION (0.9g per lb of body weight) ===
              const weightLbs = bmrData.weight ? parseFloat(bmrData.weight) : 180;
              const proteinTarget = Math.round(weightLbs * 0.9);
              const proteinCalories = proteinTarget * 4;
              const proteinTEF = Math.round(proteinCalories * PROTEIN_TEF_RATE);
              
              // === STRENGTH BURN (fixed by strategy) ===
              let finalStrengthSessions = preset.strength;
              let strengthBurnWeekly = finalStrengthSessions * CAL_PER_STRENGTH_SESSION;
              
              // === CALCULATE TO HIT TARGET DEFICIT ===
              // Start with base steps, adjust if needed
              let finalSteps = preset.baseSteps;
              let hitSafetyFloor = false;
              
              // Calculate initial activity burn
              let stepsBurnWeekly = Math.round(finalSteps * 7 * CAL_PER_STEP);
              let activityBurnWeekly = stepsBurnWeekly + strengthBurnWeekly;
              
              // Calculate what food deficit is needed to hit target
              let foodDeficitWeekly = requiredWeeklyDeficit - activityBurnWeekly;
              let foodDeficitDaily = foodDeficitWeekly / 7;
              
              // If food deficit exceeds safety, we need MORE activity
              if (foodDeficitDaily > maxFoodDeficitDaily) {
                const extraDeficitNeeded = (foodDeficitDaily - maxFoodDeficitDaily) * 7;
                const extraStepsNeeded = Math.ceil(extraDeficitNeeded / (CAL_PER_STEP * 7));
                finalSteps = preset.baseSteps + extraStepsNeeded;
                stepsBurnWeekly = Math.round(finalSteps * 7 * CAL_PER_STEP);
                activityBurnWeekly = stepsBurnWeekly + strengthBurnWeekly;
                foodDeficitWeekly = requiredWeeklyDeficit - activityBurnWeekly;
                foodDeficitDaily = foodDeficitWeekly / 7;
              }
              
              // If food deficit is NEGATIVE (activity alone exceeds target), reduce activity to hit target
              if (foodDeficitDaily < 0) {
                // We have too much activity - need to reduce to hit target exactly
                // First, try reducing steps
                const neededFoodDeficit = 0; // Aim for zero food deficit, let activity do the work
                const neededActivityBurn = requiredWeeklyDeficit - neededFoodDeficit;
                
                // Calculate minimum reasonable steps (don't go below 3000 for health)
                const minSteps = 3000;
                const minStepsBurn = Math.round(minSteps * 7 * CAL_PER_STEP);
                
                if (strengthBurnWeekly + minStepsBurn <= requiredWeeklyDeficit) {
                  // We can hit target by adjusting steps
                  const targetStepsBurn = requiredWeeklyDeficit - strengthBurnWeekly;
                  finalSteps = Math.max(minSteps, Math.round(targetStepsBurn / (7 * CAL_PER_STEP)));
                  stepsBurnWeekly = Math.round(finalSteps * 7 * CAL_PER_STEP);
                  activityBurnWeekly = stepsBurnWeekly + strengthBurnWeekly;
                  foodDeficitWeekly = requiredWeeklyDeficit - activityBurnWeekly;
                  foodDeficitDaily = foodDeficitWeekly / 7;
                } else {
                  // Even minimum steps exceed target - reduce strength sessions too
                  finalSteps = minSteps;
                  stepsBurnWeekly = Math.round(finalSteps * 7 * CAL_PER_STEP);
                  const remainingDeficit = requiredWeeklyDeficit - stepsBurnWeekly;
                  finalStrengthSessions = Math.max(0, Math.floor(remainingDeficit / CAL_PER_STRENGTH_SESSION));
                  strengthBurnWeekly = finalStrengthSessions * CAL_PER_STRENGTH_SESSION;
                  activityBurnWeekly = stepsBurnWeekly + strengthBurnWeekly;
                  foodDeficitWeekly = requiredWeeklyDeficit - activityBurnWeekly;
                  foodDeficitDaily = foodDeficitWeekly / 7;
                }
              }
              
              // Calculate final calories (use sedentary TDEE as baseline)
              const rawDailyCalories = sedentaryTDEE - foodDeficitDaily;
              const finalDailyCalories = Math.max(minCalories, Math.round(rawDailyCalories));
              hitSafetyFloor = rawDailyCalories < minCalories;
              
              // === DISPLAY VALUES ===
              const finalStrength = finalStrengthSessions;
              const strengthDisplay = `${finalStrength}x/week`;
              
              return (
                <div className="mt-4 space-y-3">
                  <div className="text-sm font-medium">Your Plan</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 bg-background rounded-md border">
                      <div className="text-xs text-muted-foreground">Daily Calories</div>
                      <div className="text-xl font-bold">{finalDailyCalories.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">Min: {minCalories}</div>
                    </div>
                    <div className="p-2 bg-background rounded-md border">
                      <div className="text-xs text-muted-foreground">Daily Steps</div>
                      <div className="text-xl font-bold">{finalSteps.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">{preset.stepsRange} range</div>
                    </div>
                    <div className="p-2 bg-background rounded-md border">
                      <div className="text-xs text-muted-foreground">Strength Training</div>
                      <div className="text-xl font-bold">{strengthDisplay}</div>
                      <div className="text-xs text-muted-foreground">{preset.strengthRange} days</div>
                    </div>
                    <div className="p-2 bg-background rounded-md border">
                      <div className="text-xs text-muted-foreground">Protein Target</div>
                      <div className="text-xl font-bold">{proteinTarget}g</div>
                      <div className="text-xs text-muted-foreground">0.9g per lb</div>
                    </div>
                  </div>
                  
                  {/* Detailed Weekly Deficit Breakdown */}
                  <div className="p-3 bg-background rounded-md border space-y-2">
                    <div className="text-xs font-medium text-muted-foreground">How This Plan Works</div>
                    <div className="text-sm leading-relaxed space-y-2">
                      <p>
                        <span className="font-medium">Timeline:</span>{' '}
                        {timeframeDays} days ({(timeframeDays / 7).toFixed(1)} weeks)
                        {useTargetDate && targetDate && (
                          <span className="text-muted-foreground"> — target: {format(targetDate, "MMM d, yyyy")}</span>
                        )}
                      </p>
                      <p>
                        <span className="font-medium">Your BMR is {bmr.toLocaleString()} cal/day.</span>{' '}
                        Sedentary TDEE = {bmr.toLocaleString()} × 1.2 = <span className="font-medium">{sedentaryTDEE.toLocaleString()} cal/day</span>.
                      </p>
                      {sedentaryTDEE >= finalDailyCalories ? (
                        <p>
                          <span className="text-green-600 font-medium">Dietary Deficit:</span>{' '}
                          Eating {finalDailyCalories.toLocaleString()} cal/day vs {sedentaryTDEE.toLocaleString()} creates a{' '}
                          {Math.round((sedentaryTDEE - finalDailyCalories)).toLocaleString()} cal/day deficit{' '}
                          (<span className="font-medium">{Math.round((sedentaryTDEE - finalDailyCalories) * 7).toLocaleString()} cal/week</span>).
                        </p>
                      ) : (
                        <p>
                          <span className="text-red-500 font-medium">Dietary Surplus:</span>{' '}
                          Eating {finalDailyCalories.toLocaleString()} cal/day vs {sedentaryTDEE.toLocaleString()} creates a{' '}
                          {Math.abs(Math.round((sedentaryTDEE - finalDailyCalories))).toLocaleString()} cal/day surplus{' '}
                          (<span className="font-medium">+{Math.abs(Math.round((sedentaryTDEE - finalDailyCalories) * 7)).toLocaleString()} cal/week</span>).
                        </p>
                      )}
                      <p>
                        <span className="text-blue-500 font-medium">Steps:</span>{' '}
                        {finalSteps.toLocaleString()} steps × 0.04 cal × 7 days ={' '}
                        <span className="font-medium">{stepsBurnWeekly.toLocaleString()} cal/week</span>.
                      </p>
                      <p>
                        <span className="text-orange-500 font-medium">Lifting:</span>{' '}
                        {finalStrength} sessions × 250 cal ={' '}
                        <span className="font-medium">{strengthBurnWeekly.toLocaleString()} cal/week</span>.
                        <span className="text-xs text-muted-foreground block mt-0.5">
                          (Assumes 45-60 min compound lifts like squats, deadlifts, bench, rows with moderate-heavy weight and 60-90s rest)
                        </span>
                      </p>
                      {(() => {
                        // Calculate actual dietary deficit/surplus from TDEE vs intake
                        const actualDietaryWeekly = Math.round((sedentaryTDEE - finalDailyCalories) * 7);
                        const netWeeklyDeficit = actualDietaryWeekly + activityBurnWeekly;
                        const isNetDeficit = netWeeklyDeficit > 0;
                        const dietaryDisplay = actualDietaryWeekly >= 0 
                          ? actualDietaryWeekly.toLocaleString()
                          : `(${Math.abs(actualDietaryWeekly).toLocaleString()})`;
                        return (
                          <>
                            <p className="pt-1 border-t">
                              <span className="font-bold">Total:</span>{' '}
                              {dietaryDisplay} {actualDietaryWeekly < 0 ? '-' : '+'} {stepsBurnWeekly.toLocaleString()} + {strengthBurnWeekly.toLocaleString()} ={' '}
                              {isNetDeficit ? (
                                <>
                                  <span className="font-bold text-primary">{netWeeklyDeficit.toLocaleString()} cal/week deficit</span>,{' '}
                                  achieving <span className="text-green-600 font-medium">~{(netWeeklyDeficit / 3500).toFixed(1)} lbs/week</span> loss.
                                </>
                              ) : (
                                <span className="font-bold text-red-500">{Math.abs(netWeeklyDeficit).toLocaleString()} cal/week surplus</span>
                              )}
                            </p>
                            {isNetDeficit && requiredWeeklyDeficit !== netWeeklyDeficit && (
                              <p className="text-xs text-muted-foreground">
                                (Target was {requiredWeeklyDeficit.toLocaleString()} cal/week based on {requiredDailyDeficit.toLocaleString()} cal/day × 7)
                              </p>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                  
                  {hitSafetyFloor && (
                    <div className="p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-md">
                      <div className="text-xs text-yellow-600 dark:text-yellow-400">
                        Your goal requires eating below the safety minimum. Consider extending your timeframe or choosing a more active strategy.
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
          )}

          {/* Ask AI Button */}
          {!showAIChat && (
            <Button 
              variant="outline" 
              className={`w-full ${!bmrResult ? 'opacity-50 pointer-events-none' : ''}`}
              onClick={() => setShowAIChat(true)}
              data-testid="button-ask-ai-goal"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Ask AI to Help Choose Goal
            </Button>
          )}

          {/* AI Chat UI */}
          {showAIChat && (
            <div className="space-y-3 p-4 bg-muted/30 rounded-md">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  <Label className="font-medium">AI Goal Assistant</Label>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowAIChat(false)}
                  data-testid="button-close-ai-chat"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`p-2 rounded-md text-sm ${msg.role === 'user' ? 'bg-primary/10 ml-8' : 'bg-background mr-8'}`}>
                    {msg.content}
                  </div>
                ))}
                {isLoading && (
                  <div className="p-2 rounded-md text-sm bg-background mr-8 flex items-center gap-2">
                    <div className="animate-pulse flex gap-1">
                      <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-muted-foreground">AI is calculating your plan...</span>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              
              {aiRecommendation && (
                <div className="p-3 bg-background rounded-md border space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">AI Recommendation</div>
                    {aiRecommendation.strategyBias && (
                      <Badge variant="secondary" className="text-xs">
                        {aiRecommendation.strategyBias === 'activity' ? 'Activity-Focused' : 
                         aiRecommendation.strategyBias === 'diet' ? 'Diet-Focused' : 'Balanced'}
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <div className="text-xs text-muted-foreground">Daily Calories</div>
                      <div className="font-bold">{aiRecommendation.calorieTarget?.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Protein Target</div>
                      <div className="font-bold">{aiRecommendation.proteinTarget}g</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Daily Steps</div>
                      <div className="font-bold">{aiRecommendation.stepGoal?.toLocaleString() || '--'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Strength Training</div>
                      <div className="font-bold">{aiRecommendation.strengthSessionsPerWeek || '--'}x/week</div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{aiRecommendation.explanation}</p>
                  <p className="text-xs font-medium">{aiRecommendation.weeklyChangeEstimate}</p>
                  <div className="flex gap-2">
                    <Button 
                      onClick={applyAIRecommendation}
                      variant="default"
                      className="flex-1"
                      data-testid="button-apply-ai-recommendation"
                    >
                      Apply This Plan
                    </Button>
                    <Button 
                      onClick={() => setAiRecommendation(null)}
                      variant="outline"
                      className="flex-1"
                      data-testid="button-refine-recommendation"
                    >
                      Refine It
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="space-y-1">
                {aiRecommendation && (
                  <p className="text-xs text-muted-foreground">
                    Want different targets? Keep chatting below to refine the suggestion.
                  </p>
                )}
                <div className="flex gap-2">
                  <Input
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder={aiRecommendation ? "Ask for adjustments (e.g., 'Can you lower the calories?')..." : "Tell the AI about your goals..."}
                    onKeyDown={(e) => e.key === 'Enter' && !isLoading && sendMessage()}
                    data-testid="input-ai-chat"
                  />
                  <Button 
                    onClick={sendMessage} 
                    disabled={isLoading || !userInput.trim()}
                    data-testid="button-send-ai-chat"
                  >
                    {isLoading ? "..." : "Send"}
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {/* Applied AI Plan Display - shows after applying recommendation */}
          {!showAIChat && aiRecommendation && computedPlan && (
            <div className="p-4 bg-muted/30 rounded-md space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="font-medium">{aiRecommendation.goalLabel || 'AI Plan'}</span>
                </div>
                {aiRecommendation.strategyBias && (
                  <Badge variant="secondary" className="text-xs">
                    {aiRecommendation.strategyBias === 'activity' ? 'Activity-Focused' : 
                     aiRecommendation.strategyBias === 'diet' ? 'Diet-Focused' : 'Balanced'}
                  </Badge>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-background rounded-md border">
                  <div className="text-xs text-muted-foreground">Daily Calories</div>
                  <div className="text-xl font-bold">{computedPlan.dailyCalories.toLocaleString()}</div>
                </div>
                <div className="p-2 bg-background rounded-md border">
                  <div className="text-xs text-muted-foreground">Daily Steps</div>
                  <div className="text-xl font-bold">{computedPlan.steps.toLocaleString()}</div>
                </div>
                <div className="p-2 bg-background rounded-md border">
                  <div className="text-xs text-muted-foreground">Strength Training</div>
                  <div className="text-xl font-bold">{aiRecommendation.strengthSessionsPerWeek || 3}x/week</div>
                </div>
                <div className="p-2 bg-background rounded-md border">
                  <div className="text-xs text-muted-foreground">Protein Target</div>
                  <div className="text-xl font-bold">{computedPlan.proteinTarget}g</div>
                </div>
              </div>
              
              {/* Detailed Deficit Breakdown */}
              <div className="p-3 bg-background rounded-md border space-y-2">
                <div className="text-xs font-medium text-muted-foreground">Weekly Deficit Breakdown</div>
                
                {/* Show BMR and Sedentary TDEE calculation */}
                {(computedPlan.bmr || aiRecommendation.bmr) && (
                  <div className="text-xs text-muted-foreground">
                    BMR: {(computedPlan.bmr || aiRecommendation.bmr)?.toLocaleString()} cal/day | 
                    Sedentary TDEE: {(computedPlan.sedentaryTDEE || aiRecommendation.sedentaryTDEE || Math.round((computedPlan.bmr || aiRecommendation.bmr || 0) * 1.2))?.toLocaleString()} cal/day (BMR × 1.2)
                  </div>
                )}
                
                {/* Deficit Components */}
                {(() => {
                  const sedentaryTDEE = computedPlan.sedentaryTDEE || aiRecommendation.maintenanceCalories || 0;
                  const dietaryDeficitValue = computedPlan.dietaryDeficit ?? aiRecommendation.dietaryDeficit ?? 
                    ((sedentaryTDEE - computedPlan.dailyCalories) * 7);
                  const isDietaryDeficit = dietaryDeficitValue >= 0;
                  
                  return (
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between items-center">
                        <span className={isDietaryDeficit ? "text-green-600" : "text-red-500"}>
                          {isDietaryDeficit ? "Dietary Deficit" : "Dietary Surplus"}
                        </span>
                        <span className="font-medium">
                          {isDietaryDeficit 
                            ? `${dietaryDeficitValue.toLocaleString()} cal/week`
                            : `+${Math.abs(dietaryDeficitValue).toLocaleString()} cal/week`
                          }
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground pl-2">
                        ({sedentaryTDEE.toLocaleString()} - {computedPlan.dailyCalories.toLocaleString()}) × 7 days
                      </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-blue-500">Steps</span>
                    <span className="font-medium">
                      {(computedPlan.stepCalories || Math.round(computedPlan.steps * 0.04 * 7)).toLocaleString()} cal/week
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground pl-2">
                    {computedPlan.steps.toLocaleString()} steps × 0.04 cal × 7 days
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-orange-500">Lifting</span>
                    <span className="font-medium">
                      {(computedPlan.liftingCalories || (aiRecommendation.strengthSessionsPerWeek || 3) * 250).toLocaleString()} cal/week
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground pl-2">
                    {computedPlan.strengthSessions || aiRecommendation.strengthSessionsPerWeek || 3} sessions × 250 cal
                  </div>
                  <div className="text-xs text-muted-foreground pl-2 italic">
                    (45-60 min compound lifts with moderate-heavy weight)
                  </div>
                  
                  <div className="border-t pt-1 mt-1 flex justify-between items-center font-bold">
                    <span>Total Weekly Deficit</span>
                    <span className="text-primary">
                      {(computedPlan.totalWeeklyDeficit || aiRecommendation.totalWeeklyDeficit || 
                        ((computedPlan.dietaryDeficit || 0) + (computedPlan.stepCalories || 0) + (computedPlan.liftingCalories || 0))
                      ).toLocaleString()} cal/week
                    </span>
                  </div>
                  
                  {(computedPlan.requiredWeeklyDeficit || aiRecommendation.requiredWeeklyDeficit) && (
                    <div className="text-xs text-muted-foreground">
                      Target: {(computedPlan.requiredWeeklyDeficit || aiRecommendation.requiredWeeklyDeficit)?.toLocaleString()} cal/week needed for goal
                    </div>
                  )}
                    </div>
                  );
                })()}
              </div>
              
              {aiRecommendation.explanation && (
                <p className="text-xs text-muted-foreground">{aiRecommendation.explanation}</p>
              )}
              <p className="text-sm font-medium text-green-600">{aiRecommendation.weeklyChangeEstimate}</p>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setAiRecommendation(null);
                  setComputedPlan(null);
                  setShowAIChat(true);
                }}
              >
                Get New AI Recommendation
              </Button>
            </div>
          )}
        </div>
        
        <DialogFooter className="pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} data-testid="button-save-goal">Save Goal</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Legacy type for backwards compatibility
type Exercise = { name: string; sets: number; reps: number; weight: number };

// New type supporting per-set weights
type ExerciseSet = { reps: number; weight: number };
type ExerciseWithSets = { name: string; sets: ExerciseSet[] };

function StrengthDialog({ open, onOpenChange, isDemo, editData, onEdit, routines = [] }: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  isDemo: boolean;
  editData?: StrengthWorkout | null;
  onEdit?: (id: string, data: Partial<StrengthWorkout>) => void;
  routines?: WorkoutRoutine[];
}) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    primaryFocus: "Push",
    duration: "",
    notes: "",
  });
  const [selectedRoutineId, setSelectedRoutineId] = useState<string>("");
  const [exercisesWithSets, setExercisesWithSets] = useState<ExerciseWithSets[]>([]);
  const [newExercise, setNewExercise] = useState({ name: "", sets: "", reps: "", weight: "" });

  const isEditing = !!editData;

  // Convert legacy Exercise to ExerciseWithSets format
  const convertLegacyExercise = (ex: Exercise): ExerciseWithSets => ({
    name: ex.name,
    sets: Array.from({ length: ex.sets }, () => ({ reps: ex.reps, weight: ex.weight }))
  });

  // Convert ExerciseWithSets to legacy format for storage (flattened)
  const convertToLegacyFormat = (exs: ExerciseWithSets[]): Exercise[] => {
    return exs.map(ex => ({
      name: ex.name,
      sets: ex.sets.length,
      reps: ex.sets[0]?.reps || 0,
      weight: Math.round(ex.sets.reduce((sum, s) => sum + s.weight, 0) / ex.sets.length) || 0
    }));
  };

  useEffect(() => {
    if (editData) {
      setFormData({
        date: editData.date,
        primaryFocus: editData.primaryFocus || "Push",
        duration: editData.duration?.toString() || "",
        notes: editData.notes || "",
      });
      const exs = Array.isArray(editData.exercises) ? editData.exercises as Exercise[] : [];
      setExercisesWithSets(exs.map(convertLegacyExercise));
      setSelectedRoutineId("");
    } else {
      setFormData({ date: format(new Date(), "yyyy-MM-dd"), primaryFocus: "Push", duration: "", notes: "" });
      setExercisesWithSets([]);
      setSelectedRoutineId("");
    }
  }, [editData, open]);

  // Handle routine selection
  const handleRoutineSelect = (routineId: string) => {
    setSelectedRoutineId(routineId);
    if (routineId === "custom" || !routineId) {
      setExercisesWithSets([]);
      return;
    }
    const routine = routines.find(r => r.id === routineId);
    if (routine && Array.isArray(routine.exercises)) {
      const routineExercises = routine.exercises as Array<{ name: string; sets: number; reps: number }>;
      const converted: ExerciseWithSets[] = routineExercises.map(ex => ({
        name: ex.name,
        sets: Array.from({ length: ex.sets }, () => ({ reps: ex.reps, weight: 0 }))
      }));
      setExercisesWithSets(converted);
    }
  };

  const addExercise = () => {
    if (!newExercise.name || !newExercise.sets || !newExercise.reps) return;
    const numSets = parseInt(newExercise.sets) || 1;
    const reps = parseInt(newExercise.reps) || 0;
    const weight = parseInt(newExercise.weight) || 0;
    const exercise: ExerciseWithSets = {
      name: newExercise.name,
      sets: Array.from({ length: numSets }, () => ({ reps, weight }))
    };
    setExercisesWithSets([...exercisesWithSets, exercise]);
    setNewExercise({ name: "", sets: "", reps: "", weight: "" });
  };

  const removeExercise = (index: number) => {
    setExercisesWithSets(exercisesWithSets.filter((_, i) => i !== index));
  };

  const updateSetField = (exerciseIndex: number, setIndex: number, field: 'weight' | 'reps', value: number) => {
    setExercisesWithSets(prev => prev.map((ex, i) => {
      if (i !== exerciseIndex) return ex;
      return {
        ...ex,
        sets: ex.sets.map((s, j) => j === setIndex ? { ...s, [field]: value } : s)
      };
    }));
  };

  const addSet = (exerciseIndex: number) => {
    setExercisesWithSets(prev => prev.map((ex, i) => {
      if (i !== exerciseIndex) return ex;
      const lastSet = ex.sets[ex.sets.length - 1] || { reps: 10, weight: 0 };
      return {
        ...ex,
        sets: [...ex.sets, { reps: lastSet.reps, weight: lastSet.weight }]
      };
    }));
  };

  const removeSet = (exerciseIndex: number, setIndex: number) => {
    setExercisesWithSets(prev => prev.map((ex, i) => {
      if (i !== exerciseIndex || ex.sets.length <= 1) return ex;
      return {
        ...ex,
        sets: ex.sets.filter((_, j) => j !== setIndex)
      };
    }));
  };

  const calculateVolume = () => {
    return exercisesWithSets.reduce((total, ex) => 
      total + ex.sets.reduce((setTotal, s) => setTotal + (s.reps * s.weight), 0), 0);
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
      setFormData({ date: format(new Date(), "yyyy-MM-dd"), primaryFocus: "Push", duration: "", notes: "" });
      setExercisesWithSets([]);
      setSelectedRoutineId("");
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
    const legacyExercises = convertToLegacyFormat(exercisesWithSets);
    const payload = {
      date: formData.date,
      type: "Strength",
      primaryFocus: formData.primaryFocus,
      duration: formData.duration ? parseInt(formData.duration) : undefined,
      volume: exercisesWithSets.length > 0 ? calculateVolume() : undefined,
      notes: formData.notes || undefined,
      exercises: exercisesWithSets.length > 0 ? legacyExercises : undefined,
    };
    if (isEditing && editData && onEdit) {
      onEdit(editData.id, payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Strength Workout" : "Log Strength Workout"}</DialogTitle>
          <DialogDescription>{isEditing ? "Update your workout" : "Record your exercises and training session"}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Routine Selection - only show when not editing and routines exist */}
          {!isEditing && routines.length > 0 && (
            <div className="space-y-2">
              <Label>Select Routine</Label>
              <Select value={selectedRoutineId} onValueChange={handleRoutineSelect}>
                <SelectTrigger data-testid="select-routine">
                  <SelectValue placeholder="Choose a routine or create custom workout" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Custom Workout</SelectItem>
                  {routines.map(routine => (
                    <SelectItem key={routine.id} value={routine.id}>{routine.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

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

          {/* Exercises with Per-Set Weights */}
          {exercisesWithSets.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-medium">Exercises</div>
                <div className="text-sm text-muted-foreground">Total Volume: {calculateVolume().toLocaleString()} lbs</div>
              </div>
              {exercisesWithSets.map((exercise, exIndex) => (
                <div key={exIndex} className="p-4 border rounded-md space-y-3" data-testid={`exercise-card-${exIndex}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{exercise.name}</span>
                    <Button size="icon" variant="ghost" onClick={() => removeExercise(exIndex)} data-testid={`button-remove-exercise-${exIndex}`}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {exercise.sets.map((set, setIndex) => (
                      <div key={setIndex} className="flex items-center gap-3" data-testid={`set-row-${exIndex}-${setIndex}`}>
                        <span className="text-sm text-muted-foreground w-12 shrink-0">Set {setIndex + 1}</span>
                        <div className="flex items-center gap-2 flex-1">
                          <Input
                            type="number"
                            placeholder="Weight"
                            className="w-24"
                            value={set.weight === 0 ? "" : set.weight}
                            onChange={(e) => updateSetField(exIndex, setIndex, 'weight', parseInt(e.target.value) || 0)}
                            data-testid={`input-weight-${exIndex}-${setIndex}`}
                          />
                          <span className="text-sm text-muted-foreground">lbs</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            placeholder="Reps"
                            className="w-20"
                            value={set.reps}
                            onChange={(e) => updateSetField(exIndex, setIndex, 'reps', parseInt(e.target.value) || 0)}
                            data-testid={`input-reps-${exIndex}-${setIndex}`}
                          />
                          <span className="text-sm text-muted-foreground">reps</span>
                        </div>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => removeSet(exIndex, setIndex)}
                          disabled={exercise.sets.length <= 1}
                          data-testid={`button-remove-set-${exIndex}-${setIndex}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button size="sm" variant="outline" onClick={() => addSet(exIndex)} data-testid={`button-add-set-${exIndex}`}>
                    <Plus className="h-4 w-4 mr-1" /> Add Set
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Add Exercise - for custom workouts */}
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

          <div className="space-y-2">
            <Label>Duration (min)</Label>
            <Input type="number" placeholder="60" value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: e.target.value })} data-testid="input-strength-duration" />
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

function SkillDialog({ 
  open, 
  onOpenChange, 
  isDemo, 
  editData, 
  onEdit,
  defaultFields,
  visibleFields,
  settingsData
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  isDemo: boolean;
  editData?: SkillWorkout | null;
  onEdit?: (id: string, data: Partial<SkillWorkout>) => void;
  defaultFields: PracticeField[];
  visibleFields: string[];
  settingsData: PracticeSettings | undefined;
}) {
  const { toast } = useToast();
  
  const customTemplates = (settingsData?.customTemplates as PracticeTemplate[]) || [];
  const activeTemplateId = (settingsData?.activeTemplateId as string) || "basketball-drills";
  const customFields = (settingsData?.customFields as PracticeField[]) || [];
  
  const DEFAULT_TEMPLATE: PracticeTemplate = {
    id: "basketball-drills",
    name: "Basketball Drills",
    isDefault: true,
    fields: defaultFields,
  };
  
  const allTemplates = [DEFAULT_TEMPLATE, ...customTemplates];
  const activeTemplate = allTemplates.find(t => t.id === activeTemplateId) || DEFAULT_TEMPLATE;
  
  const displayFields = activeTemplate.isDefault 
    ? [...activeTemplate.fields, ...customFields]
    : activeTemplate.fields;
  
  // Filter fields by visibleFields setting for all templates
  const fieldsToShow = displayFields.filter(f => visibleFields.includes(f.id));
  
  const getInitialFormData = () => {
    const initial: Record<string, any> = {
      date: format(new Date(), "yyyy-MM-dd"),
    };
    fieldsToShow.forEach(field => {
      if (field.type === "multiselect") {
        initial[field.id] = [];
      } else if (field.type === "number") {
        initial[field.id] = "";
      } else if (field.type === "toggle") {
        initial[field.id] = false;
      } else {
        initial[field.id] = "";
      }
    });
    return initial;
  };
  
  const [formData, setFormData] = useState<Record<string, any>>(getInitialFormData());
  const isEditing = !!editData;

  useEffect(() => {
    if (editData) {
      const data: Record<string, any> = {
        date: editData.date,
        drillType: editData.drillType || "",
        effort: editData.effort?.toString() || "",
        notes: editData.notes || "",
        skillFocus: Array.isArray(editData.skillFocus) ? editData.skillFocus : [],
        zoneFocus: Array.isArray(editData.zoneFocus) ? editData.zoneFocus : [],
        makes: (editData.drillStats as any)?.makes?.toString() || "",
        attempts: (editData.drillStats as any)?.attempts?.toString() || "",
      };
      if (editData.customFields && typeof editData.customFields === 'object') {
        Object.entries(editData.customFields as Record<string, any>).forEach(([key, value]) => {
          // Find the field to determine its type
          const field = fieldsToShow.find(f => f.id === key);
          if (field?.type === "number") {
            data[key] = value?.toString() || "";
          } else {
            data[key] = value;
          }
        });
      }
      setFormData(data);
    } else {
      setFormData(getInitialFormData());
    }
  }, [editData, open, activeTemplateId]);

  const createMutation = useMutation({
    mutationFn: async (data: Partial<SkillWorkout>) => {
      const res = await apiRequest("POST", "/api/fitness/skill", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fitness/skill"] });
      toast({ title: "Skill workout logged" });
      onOpenChange(false);
      setFormData(getInitialFormData());
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
    
    const customFieldData: Record<string, any> = {};
    fieldsToShow.forEach(field => {
      if (!["date", "drillType", "effort", "notes", "skillFocus", "zoneFocus", "makes", "attempts"].includes(field.id)) {
        const value = formData[field.id];
        // Coerce values to proper types based on field type
        if (field.type === "number") {
          customFieldData[field.id] = value ? parseFloat(value) : null;
        } else if (field.type === "toggle") {
          customFieldData[field.id] = Boolean(value);
        } else {
          customFieldData[field.id] = value;
        }
      }
    });
    
    const data: Partial<SkillWorkout> = {
      date: formData.date,
      type: "Skill" as const,
      drillType: formData.drillType || undefined,
      effort: formData.effort ? parseInt(formData.effort) : undefined,
      notes: formData.notes || undefined,
      skillFocus: formData.skillFocus?.length > 0 ? formData.skillFocus : undefined,
      zoneFocus: formData.zoneFocus?.length > 0 ? formData.zoneFocus : undefined,
      drillStats: (formData.makes || formData.attempts) ? {
        makes: formData.makes ? parseInt(formData.makes) : undefined,
        attempts: formData.attempts ? parseInt(formData.attempts) : undefined,
      } : undefined,
      customFields: Object.keys(customFieldData).length > 0 ? customFieldData : undefined,
    };
    
    if (isEditing && editData && onEdit) {
      onEdit(editData.id, data);
      onOpenChange(false);
    } else {
      createMutation.mutate(data);
    }
  };
  
  const toggleMultiSelect = (fieldId: string, value: string) => {
    const current = formData[fieldId] || [];
    if (current.includes(value)) {
      setFormData({ ...formData, [fieldId]: current.filter((v: string) => v !== value) });
    } else {
      setFormData({ ...formData, [fieldId]: [...current, value] });
    }
  };
  
  const renderField = (field: PracticeField) => {
    switch (field.type) {
      case "text":
        if (field.id === "date") {
          return (
            <Input 
              type="date" 
              value={formData.date || ""} 
              onChange={(e) => setFormData({ ...formData, date: e.target.value })} 
              data-testid={`input-skill-${field.id}`} 
            />
          );
        }
        return (
          <Input 
            type="text" 
            placeholder={field.label}
            value={formData[field.id] || ""} 
            onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })} 
            data-testid={`input-skill-${field.id}`} 
          />
        );
      case "number":
        return (
          <Input 
            type="number" 
            placeholder={field.id === "effort" ? "1-10" : "0"}
            min={field.id === "effort" ? 1 : 0}
            max={field.id === "effort" ? 10 : undefined}
            value={formData[field.id] || ""} 
            onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })} 
            data-testid={`input-skill-${field.id}`} 
          />
        );
      case "textarea":
        return (
          <Textarea 
            placeholder={field.label}
            value={formData[field.id] || ""} 
            onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })} 
            data-testid={`input-skill-${field.id}`} 
          />
        );
      case "select":
        return (
          <Select value={formData[field.id] || ""} onValueChange={(v) => setFormData({ ...formData, [field.id]: v })}>
            <SelectTrigger data-testid={`select-skill-${field.id}`}>
              <SelectValue placeholder={`Select ${field.label}`} />
            </SelectTrigger>
            <SelectContent>
              {(field.options || []).map(opt => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case "multiselect":
        return (
          <div className="flex flex-wrap gap-2">
            {(field.options || []).map(opt => (
              <Badge 
                key={opt}
                variant={(formData[field.id] || []).includes(opt) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleMultiSelect(field.id, opt)}
                data-testid={`badge-skill-${field.id}-${opt}`}
              >
                {opt}
              </Badge>
            ))}
          </div>
        );
      case "toggle":
        return (
          <div className="flex items-center gap-2">
            <Switch 
              checked={formData[field.id] || false}
              onCheckedChange={(checked) => setFormData({ ...formData, [field.id]: checked })}
              data-testid={`switch-skill-${field.id}`}
            />
            <span className="text-sm text-muted-foreground">{formData[field.id] ? "Yes" : "No"}</span>
          </div>
        );
      default:
        return (
          <Input 
            type="text" 
            value={formData[field.id] || ""} 
            onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })} 
            data-testid={`input-skill-${field.id}`} 
          />
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Skill Workout" : "Log Skill Workout"}</DialogTitle>
          <DialogDescription>{isEditing ? "Update your drill session details" : "Record your basketball drill session"}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {fieldsToShow.map(field => (
            <div key={field.id} className="space-y-2">
              <Label>{field.label}</Label>
              {renderField(field)}
            </div>
          ))}
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

type FieldType = "text" | "number" | "select" | "multiselect" | "toggle" | "textarea";

function LivePlaySettingsDialog({ 
  open, 
  onOpenChange, 
  isDemo, 
  defaultFields,
  currentVisibleFields,
  settingsData
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  isDemo: boolean;
  defaultFields: LivePlayField[];
  currentVisibleFields: string[];
  settingsData: LivePlaySettings | undefined;
}) {
  const { toast } = useToast();
  const [selectedFields, setSelectedFields] = useState<string[]>(currentVisibleFields);
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [showAddField, setShowAddField] = useState(false);
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldType, setNewFieldType] = useState<FieldType>("text");
  const [newFieldOptions, setNewFieldOptions] = useState("");
  const [editingField, setEditingField] = useState<LivePlayField | null>(null);
  const [editFieldLabel, setEditFieldLabel] = useState("");
  const [editFieldType, setEditFieldType] = useState<FieldType>("text");
  const [editFieldOptions, setEditFieldOptions] = useState("");

  const customTemplates = (settingsData?.customTemplates as SportTemplate[]) || [];
  const activeTemplateId = (settingsData?.activeTemplateId as string) || "basketball";
  const customFields = (settingsData?.customFields as LivePlayField[]) || [];

  const BASKETBALL_DEFAULT: SportTemplate = {
    id: "basketball",
    name: "Basketball",
    isDefault: true,
    fields: defaultFields,
  };

  const allTemplates = [BASKETBALL_DEFAULT, ...customTemplates];
  const activeTemplate = allTemplates.find(t => t.id === activeTemplateId) || BASKETBALL_DEFAULT;

  // Only sync selectedFields when dialog opens, not on every currentVisibleFields change
  useEffect(() => {
    if (open) {
      setSelectedFields(currentVisibleFields);
    }
  }, [open]);

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<LivePlaySettings>) => {
      const currentSettings = {
        visibleFields: settingsData?.visibleFields || currentVisibleFields,
        customFields: settingsData?.customFields || [],
        customTemplates: settingsData?.customTemplates || [],
        activeTemplateId: settingsData?.activeTemplateId || "basketball",
      };
      const payload = { ...currentSettings, ...data };
      const res = await apiRequest("PUT", "/api/fitness/live-play-settings", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fitness/live-play-settings"] });
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
    updateMutation.mutate({ visibleFields: selectedFields }, {
      onSuccess: () => {
        toast({ title: "Settings saved" });
        onOpenChange(false);
      }
    });
  };

  const handleCreateTemplate = () => {
    if (isDemo) {
      toast({ title: "Demo mode - cannot create templates" });
      return;
    }
    if (!newTemplateName.trim()) {
      toast({ title: "Please enter a template name", variant: "destructive" });
      return;
    }
    const selectedFieldsFromDisplay = displayFields.filter(f => selectedFields.includes(f.id));
    const newTemplate: SportTemplate = {
      id: `custom-${Date.now()}`,
      name: newTemplateName.trim(),
      isDefault: false,
      fields: selectedFieldsFromDisplay,
    };
    const updatedTemplates = [...customTemplates, newTemplate];
    const newFieldIds = selectedFieldsFromDisplay.map(f => f.id);
    updateMutation.mutate({ 
      customTemplates: updatedTemplates,
      activeTemplateId: newTemplate.id,
      visibleFields: newFieldIds
    }, {
      onSuccess: () => {
        toast({ title: `Template "${newTemplate.name}" created` });
        setNewTemplateName("");
        setShowCreateTemplate(false);
        setSelectedFields(newFieldIds);
      }
    });
  };

  const handleSwitchTemplate = (templateId: string) => {
    if (isDemo) {
      toast({ title: "Demo mode - cannot switch templates" });
      return;
    }
    const template = allTemplates.find(t => t.id === templateId);
    let fieldIds: string[] = [];
    if (template) {
      fieldIds = template.fields.map(f => f.id);
      if (template.isDefault) {
        const customFieldIds = customFields.map(f => f.id);
        fieldIds = [...fieldIds, ...customFieldIds];
      }
    }
    updateMutation.mutate({ 
      activeTemplateId: templateId,
      visibleFields: fieldIds
    }, {
      onSuccess: () => {
        setSelectedFields(fieldIds);
      }
    });
  };

  const handleDeleteTemplate = (templateId: string) => {
    if (isDemo) {
      toast({ title: "Demo mode - cannot delete templates" });
      return;
    }
    const template = customTemplates.find(t => t.id === templateId);
    if (!template) return;
    const updatedTemplates = customTemplates.filter(t => t.id !== templateId);
    updateMutation.mutate({ 
      customTemplates: updatedTemplates,
      activeTemplateId: activeTemplateId === templateId ? "basketball" : activeTemplateId
    }, {
      onSuccess: () => {
        toast({ title: `Template "${template.name}" deleted` });
      }
    });
  };

  const handleAddField = () => {
    if (isDemo) {
      toast({ title: "Demo mode - cannot add fields" });
      return;
    }
    if (!newFieldLabel.trim()) {
      toast({ title: "Please enter a field label", variant: "destructive" });
      return;
    }
    const needsOptions = ["select", "multiselect"].includes(newFieldType);
    const optionsArray = needsOptions && newFieldOptions.trim() 
      ? newFieldOptions.split(",").map(o => o.trim()).filter(o => o)
      : undefined;
    if (needsOptions && (!optionsArray || optionsArray.length === 0)) {
      toast({ title: "Please enter at least one option", variant: "destructive" });
      return;
    }
    const newField: LivePlayField = {
      id: `custom-field-${Date.now()}`,
      label: newFieldLabel.trim(),
      enabled: true,
      type: newFieldType,
      options: optionsArray,
    };
    
    if (activeTemplate.isDefault) {
      const existingCustomFields = (settingsData?.customFields as LivePlayField[]) || [];
      updateMutation.mutate({ 
        customFields: [...existingCustomFields, newField],
        visibleFields: [...selectedFields, newField.id]
      }, {
        onSuccess: () => {
          setSelectedFields(prev => [...prev, newField.id]);
          toast({ title: `Field "${newField.label}" added` });
          setNewFieldLabel("");
          setNewFieldType("text");
          setNewFieldOptions("");
          setShowAddField(false);
        }
      });
    } else {
      const updatedTemplates = customTemplates.map(t => 
        t.id === activeTemplateId 
          ? { ...t, fields: [...t.fields, newField] }
          : t
      );
      updateMutation.mutate({ 
        customTemplates: updatedTemplates,
        visibleFields: [...selectedFields, newField.id]
      }, {
        onSuccess: () => {
          setSelectedFields(prev => [...prev, newField.id]);
          toast({ title: `Field "${newField.label}" added` });
          setNewFieldLabel("");
          setNewFieldType("text");
          setNewFieldOptions("");
          setShowAddField(false);
        }
      });
    }
  };

  const handleStartEdit = (field: LivePlayField) => {
    setEditingField(field);
    setEditFieldLabel(field.label);
    setEditFieldType(field.type);
    setEditFieldOptions(field.options?.join(", ") || "");
  };

  const handleSaveEdit = () => {
    if (isDemo) {
      toast({ title: "Demo mode - cannot edit fields" });
      return;
    }
    if (!editingField) return;
    if (!editFieldLabel.trim()) {
      toast({ title: "Please enter a field label", variant: "destructive" });
      return;
    }
    const needsOptions = ["select", "multiselect"].includes(editFieldType);
    const optionsArray = needsOptions && editFieldOptions.trim() 
      ? editFieldOptions.split(",").map(o => o.trim()).filter(o => o)
      : undefined;
    if (needsOptions && (!optionsArray || optionsArray.length === 0)) {
      toast({ title: "Please enter at least one option", variant: "destructive" });
      return;
    }
    const updatedField: LivePlayField = {
      ...editingField,
      label: editFieldLabel.trim(),
      type: editFieldType,
      options: optionsArray,
    };
    
    if (activeTemplate.isDefault) {
      const existingCustomFields = (settingsData?.customFields as LivePlayField[]) || [];
      const updatedFields = existingCustomFields.map(f => 
        f.id === editingField.id ? updatedField : f
      );
      updateMutation.mutate({ customFields: updatedFields }, {
        onSuccess: () => {
          toast({ title: `Field "${updatedField.label}" updated` });
          setEditingField(null);
        }
      });
    } else {
      const updatedTemplates = customTemplates.map(t => 
        t.id === activeTemplateId 
          ? { ...t, fields: t.fields.map(f => f.id === editingField.id ? updatedField : f) }
          : t
      );
      updateMutation.mutate({ customTemplates: updatedTemplates }, {
        onSuccess: () => {
          toast({ title: `Field "${updatedField.label}" updated` });
          setEditingField(null);
        }
      });
    }
  };

  const getFieldTypeBadge = (type: string) => {
    const labels: Record<string, string> = {
      text: "Text",
      number: "Number",
      select: "Dropdown",
      multiselect: "Multi-select",
      toggle: "Toggle",
      textarea: "Text Area",
    };
    return labels[type] || type;
  };

  const handleRemoveField = (fieldId: string) => {
    if (isDemo) {
      toast({ title: "Demo mode - cannot remove fields" });
      return;
    }
    if (activeTemplate.isDefault) {
      const existingCustomFields = (settingsData?.customFields as LivePlayField[]) || [];
      const updatedFields = existingCustomFields.filter(f => f.id !== fieldId);
      updateMutation.mutate({ 
        customFields: updatedFields,
        visibleFields: selectedFields.filter(id => id !== fieldId)
      }, {
        onSuccess: () => {
          setSelectedFields(prev => prev.filter(id => id !== fieldId));
          toast({ title: "Field removed" });
        }
      });
    } else {
      const updatedTemplates = customTemplates.map(t => 
        t.id === activeTemplateId 
          ? { ...t, fields: t.fields.filter(f => f.id !== fieldId) }
          : t
      );
      updateMutation.mutate({ 
        customTemplates: updatedTemplates,
        visibleFields: selectedFields.filter(id => id !== fieldId)
      }, {
        onSuccess: () => {
          setSelectedFields(prev => prev.filter(id => id !== fieldId));
          toast({ title: "Field removed" });
        }
      });
    }
  };

  const displayFields = activeTemplate.isDefault 
    ? [...activeTemplate.fields, ...customFields]
    : activeTemplate.fields;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Live Play Settings</DialogTitle>
          <DialogDescription>Configure your sport template and visible fields</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Current Template</Label>
            <div className="flex gap-2">
              <Select value={activeTemplateId} onValueChange={handleSwitchTemplate}>
                <SelectTrigger data-testid="select-template">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allTemplates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name} {template.isDefault && "(Default)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!activeTemplate.isDefault && (
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={() => handleDeleteTemplate(activeTemplateId)}
                  data-testid="button-delete-template"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          </div>

          {showCreateTemplate ? (
            <div className="space-y-2 p-3 border rounded-md">
              <Label>New Template Name</Label>
              <Input 
                placeholder="e.g., Soccer, Tennis, Volleyball"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                data-testid="input-template-name"
              />
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="outline" onClick={() => setShowCreateTemplate(false)}>Cancel</Button>
                <Button size="sm" onClick={handleCreateTemplate} data-testid="button-confirm-create-template">Create</Button>
              </div>
            </div>
          ) : (
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => setShowCreateTemplate(true)}
              data-testid="button-create-template"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Template
            </Button>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Visible Fields</Label>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {displayFields.map((field) => (
                <div key={field.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <Checkbox 
                      id={field.id}
                      checked={selectedFields.includes(field.id)}
                      onCheckedChange={() => toggleField(field.id)}
                      data-testid={`checkbox-field-${field.id}`}
                    />
                    <Label htmlFor={field.id} className="cursor-pointer text-sm truncate">{field.label}</Label>
                    <Badge variant="secondary" className="text-xs shrink-0">{getFieldTypeBadge(field.type)}</Badge>
                  </div>
                  {field.id.startsWith("custom-field-") && (
                    <div className="flex gap-1 shrink-0">
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => handleStartEdit(field)}
                        data-testid={`button-edit-field-${field.id}`}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => handleRemoveField(field.id)}
                        data-testid={`button-remove-field-${field.id}`}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {editingField && (
            <div className="space-y-2 p-3 border rounded-md bg-muted/50">
              <div className="text-sm font-medium">Edit Field</div>
              <div className="space-y-2">
                <Label>Field Label</Label>
                <Input 
                  placeholder="e.g., Energy Level"
                  value={editFieldLabel}
                  onChange={(e) => setEditFieldLabel(e.target.value)}
                  data-testid="input-edit-field-label"
                />
              </div>
              <div className="space-y-2">
                <Label>Field Type</Label>
                <Select value={editFieldType} onValueChange={(v) => setEditFieldType(v as FieldType)}>
                  <SelectTrigger data-testid="select-edit-field-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="textarea">Text Area</SelectItem>
                    <SelectItem value="select">Dropdown</SelectItem>
                    <SelectItem value="multiselect">Multiple Choice</SelectItem>
                    <SelectItem value="toggle">Toggle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {["select", "multiselect"].includes(editFieldType) && (
                <div className="space-y-2">
                  <Label>Options (comma-separated)</Label>
                  <Input 
                    placeholder="e.g., Low, Medium, High"
                    value={editFieldOptions}
                    onChange={(e) => setEditFieldOptions(e.target.value)}
                    data-testid="input-edit-field-options"
                  />
                </div>
              )}
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="outline" onClick={() => setEditingField(null)}>Cancel</Button>
                <Button size="sm" onClick={handleSaveEdit} data-testid="button-save-edit-field">Save</Button>
              </div>
            </div>
          )}

          {showAddField ? (
            <div className="space-y-2 p-3 border rounded-md">
              <div className="space-y-2">
                <Label>Field Label</Label>
                <Input 
                  placeholder="e.g., Energy Level, Weather"
                  value={newFieldLabel}
                  onChange={(e) => setNewFieldLabel(e.target.value)}
                  data-testid="input-field-label"
                />
              </div>
              <div className="space-y-2">
                <Label>Field Type</Label>
                <Select value={newFieldType} onValueChange={(v) => setNewFieldType(v as FieldType)}>
                  <SelectTrigger data-testid="select-field-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="textarea">Text Area</SelectItem>
                    <SelectItem value="select">Dropdown</SelectItem>
                    <SelectItem value="multiselect">Multiple Choice</SelectItem>
                    <SelectItem value="toggle">Toggle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {["select", "multiselect"].includes(newFieldType) && (
                <div className="space-y-2">
                  <Label>Options (comma-separated)</Label>
                  <Input 
                    placeholder="e.g., Low, Medium, High"
                    value={newFieldOptions}
                    onChange={(e) => setNewFieldOptions(e.target.value)}
                    data-testid="input-field-options"
                  />
                </div>
              )}
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="outline" onClick={() => setShowAddField(false)}>Cancel</Button>
                <Button size="sm" onClick={handleAddField} data-testid="button-confirm-add-field">Add Field</Button>
              </div>
            </div>
          ) : (
            <Button 
              variant="outline" 
              size="sm"
              className="w-full" 
              onClick={() => setShowAddField(true)}
              data-testid="button-add-field"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Custom Field
            </Button>
          )}
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

function PracticeSettingsDialog({ 
  open, 
  onOpenChange, 
  isDemo, 
  defaultFields,
  currentVisibleFields,
  settingsData
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  isDemo: boolean;
  defaultFields: PracticeField[];
  currentVisibleFields: string[];
  settingsData: PracticeSettings | undefined;
}) {
  const { toast } = useToast();
  const [selectedFields, setSelectedFields] = useState<string[]>(currentVisibleFields);
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [showAddField, setShowAddField] = useState(false);
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldType, setNewFieldType] = useState<FieldType>("text");
  const [newFieldOptions, setNewFieldOptions] = useState("");
  const [editingField, setEditingField] = useState<PracticeField | null>(null);
  const [editFieldLabel, setEditFieldLabel] = useState("");
  const [editFieldType, setEditFieldType] = useState<FieldType>("text");
  const [editFieldOptions, setEditFieldOptions] = useState("");

  const customTemplates = (settingsData?.customTemplates as PracticeTemplate[]) || [];
  const activeTemplateId = (settingsData?.activeTemplateId as string) || "basketball-drills";
  const customFields = (settingsData?.customFields as PracticeField[]) || [];

  const DEFAULT_TEMPLATE: PracticeTemplate = {
    id: "basketball-drills",
    name: "Basketball Drills",
    isDefault: true,
    fields: defaultFields,
  };

  const allTemplates = [DEFAULT_TEMPLATE, ...customTemplates];
  const activeTemplate = allTemplates.find(t => t.id === activeTemplateId) || DEFAULT_TEMPLATE;

  // Only sync selectedFields when dialog opens, not on every currentVisibleFields change
  useEffect(() => {
    if (open) {
      setSelectedFields(currentVisibleFields);
    }
  }, [open]);

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<PracticeSettings>) => {
      const currentSettings = {
        visibleFields: settingsData?.visibleFields || currentVisibleFields,
        customFields: settingsData?.customFields || [],
        customTemplates: settingsData?.customTemplates || [],
        activeTemplateId: settingsData?.activeTemplateId || "basketball-drills",
      };
      const res = await apiRequest("PUT", "/api/fitness/practice-settings", { ...currentSettings, ...data });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fitness/practice-settings"] });
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
    updateMutation.mutate({ visibleFields: selectedFields }, {
      onSuccess: () => {
        toast({ title: "Settings saved" });
        onOpenChange(false);
      }
    });
  };

  const displayFields = activeTemplate.isDefault 
    ? [...activeTemplate.fields, ...customFields]
    : activeTemplate.fields;

  const handleCreateTemplate = () => {
    if (isDemo) {
      toast({ title: "Demo mode - cannot create templates" });
      return;
    }
    if (!newTemplateName.trim()) {
      toast({ title: "Please enter a template name", variant: "destructive" });
      return;
    }
    const selectedFieldsFromDisplay = displayFields.filter(f => selectedFields.includes(f.id));
    const newTemplate: PracticeTemplate = {
      id: `custom-${Date.now()}`,
      name: newTemplateName.trim(),
      isDefault: false,
      fields: selectedFieldsFromDisplay,
    };
    const updatedTemplates = [...customTemplates, newTemplate];
    const newFieldIds = selectedFieldsFromDisplay.map(f => f.id);
    updateMutation.mutate({ 
      customTemplates: updatedTemplates,
      activeTemplateId: newTemplate.id,
      visibleFields: newFieldIds
    }, {
      onSuccess: () => {
        toast({ title: `Template "${newTemplate.name}" created` });
        setNewTemplateName("");
        setShowCreateTemplate(false);
        setSelectedFields(newFieldIds);
      }
    });
  };

  const handleSwitchTemplate = (templateId: string) => {
    if (isDemo) {
      toast({ title: "Demo mode - cannot switch templates" });
      return;
    }
    const template = allTemplates.find(t => t.id === templateId);
    let fieldIds: string[] = [];
    if (template) {
      fieldIds = template.fields.map(f => f.id);
      if (template.isDefault) {
        const customFieldIds = customFields.map(f => f.id);
        fieldIds = [...fieldIds, ...customFieldIds];
      }
    }
    updateMutation.mutate({ 
      activeTemplateId: templateId,
      visibleFields: fieldIds
    }, {
      onSuccess: () => {
        setSelectedFields(fieldIds);
      }
    });
  };

  const handleDeleteTemplate = (templateId: string) => {
    if (isDemo) {
      toast({ title: "Demo mode - cannot delete templates" });
      return;
    }
    const template = customTemplates.find(t => t.id === templateId);
    if (!template) return;
    const updatedTemplates = customTemplates.filter(t => t.id !== templateId);
    updateMutation.mutate({ 
      customTemplates: updatedTemplates,
      activeTemplateId: activeTemplateId === templateId ? "basketball-drills" : activeTemplateId
    }, {
      onSuccess: () => {
        toast({ title: `Template "${template.name}" deleted` });
      }
    });
  };

  const handleAddField = () => {
    if (isDemo) {
      toast({ title: "Demo mode - cannot add fields" });
      return;
    }
    if (!newFieldLabel.trim()) {
      toast({ title: "Please enter a field label", variant: "destructive" });
      return;
    }
    const needsOptions = ["select", "multiselect"].includes(newFieldType);
    const optionsArray = needsOptions && newFieldOptions.trim() 
      ? newFieldOptions.split(",").map(o => o.trim()).filter(o => o)
      : undefined;
    if (needsOptions && (!optionsArray || optionsArray.length === 0)) {
      toast({ title: "Please enter at least one option", variant: "destructive" });
      return;
    }
    const newField: PracticeField = {
      id: `custom-field-${Date.now()}`,
      label: newFieldLabel.trim(),
      enabled: true,
      type: newFieldType,
      options: optionsArray,
    };
    
    if (activeTemplate.isDefault) {
      const existingCustomFields = (settingsData?.customFields as PracticeField[]) || [];
      updateMutation.mutate({ 
        customFields: [...existingCustomFields, newField],
        visibleFields: [...selectedFields, newField.id]
      }, {
        onSuccess: () => {
          setSelectedFields(prev => [...prev, newField.id]);
          toast({ title: `Field "${newField.label}" added` });
          setNewFieldLabel("");
          setNewFieldType("text");
          setNewFieldOptions("");
          setShowAddField(false);
        }
      });
    } else {
      const updatedTemplates = customTemplates.map(t => 
        t.id === activeTemplateId 
          ? { ...t, fields: [...t.fields, newField] }
          : t
      );
      updateMutation.mutate({ 
        customTemplates: updatedTemplates,
        visibleFields: [...selectedFields, newField.id]
      }, {
        onSuccess: () => {
          setSelectedFields(prev => [...prev, newField.id]);
          toast({ title: `Field "${newField.label}" added` });
          setNewFieldLabel("");
          setNewFieldType("text");
          setNewFieldOptions("");
          setShowAddField(false);
        }
      });
    }
  };

  const handleStartEdit = (field: PracticeField) => {
    setEditingField(field);
    setEditFieldLabel(field.label);
    setEditFieldType(field.type);
    setEditFieldOptions(field.options?.join(", ") || "");
  };

  const handleSaveEdit = () => {
    if (isDemo) {
      toast({ title: "Demo mode - cannot edit fields" });
      return;
    }
    if (!editingField) return;
    if (!editFieldLabel.trim()) {
      toast({ title: "Please enter a field label", variant: "destructive" });
      return;
    }
    const needsOptions = ["select", "multiselect"].includes(editFieldType);
    const optionsArray = needsOptions && editFieldOptions.trim() 
      ? editFieldOptions.split(",").map(o => o.trim()).filter(o => o)
      : undefined;
    if (needsOptions && (!optionsArray || optionsArray.length === 0)) {
      toast({ title: "Please enter at least one option", variant: "destructive" });
      return;
    }
    const updatedField: PracticeField = {
      ...editingField,
      label: editFieldLabel.trim(),
      type: editFieldType,
      options: optionsArray,
    };
    
    if (activeTemplate.isDefault) {
      const existingCustomFields = (settingsData?.customFields as PracticeField[]) || [];
      const updatedFields = existingCustomFields.map(f => 
        f.id === editingField.id ? updatedField : f
      );
      updateMutation.mutate({ customFields: updatedFields }, {
        onSuccess: () => {
          toast({ title: `Field "${updatedField.label}" updated` });
          setEditingField(null);
        }
      });
    } else {
      const updatedTemplates = customTemplates.map(t => 
        t.id === activeTemplateId 
          ? { ...t, fields: t.fields.map(f => f.id === editingField.id ? updatedField : f) }
          : t
      );
      updateMutation.mutate({ customTemplates: updatedTemplates }, {
        onSuccess: () => {
          toast({ title: `Field "${updatedField.label}" updated` });
          setEditingField(null);
        }
      });
    }
  };

  const handleRemoveField = (fieldId: string) => {
    if (isDemo) {
      toast({ title: "Demo mode - cannot remove fields" });
      return;
    }
    if (activeTemplate.isDefault) {
      const existingCustomFields = (settingsData?.customFields as PracticeField[]) || [];
      const updatedFields = existingCustomFields.filter(f => f.id !== fieldId);
      updateMutation.mutate({ 
        customFields: updatedFields,
        visibleFields: selectedFields.filter(id => id !== fieldId)
      }, {
        onSuccess: () => {
          setSelectedFields(prev => prev.filter(id => id !== fieldId));
          toast({ title: "Field removed" });
        }
      });
    } else {
      const updatedTemplates = customTemplates.map(t => 
        t.id === activeTemplateId 
          ? { ...t, fields: t.fields.filter(f => f.id !== fieldId) }
          : t
      );
      updateMutation.mutate({ 
        customTemplates: updatedTemplates,
        visibleFields: selectedFields.filter(id => id !== fieldId)
      }, {
        onSuccess: () => {
          setSelectedFields(prev => prev.filter(id => id !== fieldId));
          toast({ title: "Field removed" });
        }
      });
    }
  };

  const getFieldTypeBadge = (type: string) => {
    const labels: Record<string, string> = {
      text: "Text",
      number: "Number",
      select: "Dropdown",
      multiselect: "Multi-select",
      toggle: "Toggle",
      textarea: "Text Area",
    };
    return labels[type] || type;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Practice Settings</DialogTitle>
          <DialogDescription>Configure your practice template and visible fields</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Current Template</Label>
            <div className="flex gap-2">
              <Select value={activeTemplateId} onValueChange={handleSwitchTemplate}>
                <SelectTrigger data-testid="select-practice-template">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allTemplates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name} {template.isDefault && "(Default)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!activeTemplate.isDefault && (
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={() => handleDeleteTemplate(activeTemplateId)}
                  data-testid="button-delete-practice-template"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          </div>

          {showCreateTemplate ? (
            <div className="space-y-2 p-3 border rounded-md">
              <Label>New Template Name</Label>
              <Input 
                placeholder="e.g., Yoga, Swimming, Tennis Drills"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                data-testid="input-practice-template-name"
              />
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="outline" onClick={() => setShowCreateTemplate(false)}>Cancel</Button>
                <Button size="sm" onClick={handleCreateTemplate} data-testid="button-confirm-create-practice-template">Create</Button>
              </div>
            </div>
          ) : (
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => setShowCreateTemplate(true)}
              data-testid="button-create-practice-template"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Template
            </Button>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Visible Fields</Label>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {displayFields.map((field) => (
                <div key={field.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <Checkbox 
                      id={`practice-${field.id}`}
                      checked={selectedFields.includes(field.id)}
                      onCheckedChange={() => toggleField(field.id)}
                      data-testid={`checkbox-practice-field-${field.id}`}
                    />
                    <Label htmlFor={`practice-${field.id}`} className="cursor-pointer text-sm truncate">{field.label}</Label>
                    <Badge variant="secondary" className="text-xs shrink-0">{getFieldTypeBadge(field.type)}</Badge>
                  </div>
                  {field.id.startsWith("custom-field-") && (
                    <div className="flex gap-1 shrink-0">
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => handleStartEdit(field)}
                        data-testid={`button-edit-practice-field-${field.id}`}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => handleRemoveField(field.id)}
                        data-testid={`button-remove-practice-field-${field.id}`}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {editingField && (
            <div className="space-y-2 p-3 border rounded-md bg-muted/50">
              <div className="text-sm font-medium">Edit Field</div>
              <div className="space-y-2">
                <Label>Field Label</Label>
                <Input 
                  placeholder="e.g., Energy Level"
                  value={editFieldLabel}
                  onChange={(e) => setEditFieldLabel(e.target.value)}
                  data-testid="input-edit-practice-field-label"
                />
              </div>
              <div className="space-y-2">
                <Label>Field Type</Label>
                <Select value={editFieldType} onValueChange={(v) => setEditFieldType(v as FieldType)}>
                  <SelectTrigger data-testid="select-edit-practice-field-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="textarea">Text Area</SelectItem>
                    <SelectItem value="select">Dropdown</SelectItem>
                    <SelectItem value="multiselect">Multiple Choice</SelectItem>
                    <SelectItem value="toggle">Toggle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {["select", "multiselect"].includes(editFieldType) && (
                <div className="space-y-2">
                  <Label>Options (comma-separated)</Label>
                  <Input 
                    placeholder="e.g., Low, Medium, High"
                    value={editFieldOptions}
                    onChange={(e) => setEditFieldOptions(e.target.value)}
                    data-testid="input-edit-practice-field-options"
                  />
                </div>
              )}
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="outline" onClick={() => setEditingField(null)}>Cancel</Button>
                <Button size="sm" onClick={handleSaveEdit} data-testid="button-save-edit-practice-field">Save</Button>
              </div>
            </div>
          )}

          {showAddField ? (
            <div className="space-y-2 p-3 border rounded-md">
              <div className="space-y-2">
                <Label>Field Label</Label>
                <Input 
                  placeholder="e.g., Duration, Intensity"
                  value={newFieldLabel}
                  onChange={(e) => setNewFieldLabel(e.target.value)}
                  data-testid="input-practice-field-label"
                />
              </div>
              <div className="space-y-2">
                <Label>Field Type</Label>
                <Select value={newFieldType} onValueChange={(v) => setNewFieldType(v as FieldType)}>
                  <SelectTrigger data-testid="select-practice-field-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="textarea">Text Area</SelectItem>
                    <SelectItem value="select">Dropdown</SelectItem>
                    <SelectItem value="multiselect">Multiple Choice</SelectItem>
                    <SelectItem value="toggle">Toggle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {["select", "multiselect"].includes(newFieldType) && (
                <div className="space-y-2">
                  <Label>Options (comma-separated)</Label>
                  <Input 
                    placeholder="e.g., Low, Medium, High"
                    value={newFieldOptions}
                    onChange={(e) => setNewFieldOptions(e.target.value)}
                    data-testid="input-practice-field-options"
                  />
                </div>
              )}
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="outline" onClick={() => setShowAddField(false)}>Cancel</Button>
                <Button size="sm" onClick={handleAddField} data-testid="button-confirm-add-practice-field">Add Field</Button>
              </div>
            </div>
          ) : (
            <Button 
              variant="outline" 
              size="sm"
              className="w-full" 
              onClick={() => setShowAddField(true)}
              data-testid="button-add-practice-field"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Custom Field
            </Button>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={updateMutation.isPending} data-testid="button-save-practice-settings">
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
    notes: "",
  });

  const isEditing = !!editData;

  useEffect(() => {
    if (editData) {
      setFormData({
        date: editData.date,
        weight: editData.weight?.toString() || "",
        bodyFat: editData.bodyFat?.toString() || "",
        notes: editData.notes || "",
      });
    } else {
      setFormData({ date: format(new Date(), "yyyy-MM-dd"), weight: "", bodyFat: "", notes: "" });
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
      setFormData({ date: format(new Date(), "yyyy-MM-dd"), weight: "", bodyFat: "", notes: "" });
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
            <Label>Notes (optional)</Label>
            <Textarea placeholder="e.g., Weighed in after eating, morning weight, etc." value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} data-testid="input-body-notes" />
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
