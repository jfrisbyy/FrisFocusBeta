import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { 
  Dumbbell, Utensils, Scale, Target, Trophy, Plus, Flame, Droplets, 
  TrendingUp, TrendingDown, Calendar, Clock, Activity, Camera, 
  Trash2, Edit, ChevronRight, Zap, Star, Award, Calculator
} from "lucide-react";
import { useDemo } from "@/contexts/DemoContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { NutritionLog, BodyComposition, StrengthWorkout, SkillWorkout, BasketballRun, NutritionSettings, Meal } from "@shared/schema";
import { Settings } from "lucide-react";
import { format, subDays, startOfWeek, parseISO, isToday, isThisWeek, differenceInDays } from "date-fns";

const mockNutrition: NutritionLog[] = [
  { id: "demo-1", userId: "demo", date: new Date().toISOString().split("T")[0], calories: 2200, protein: 180, carbs: 220, fats: 65, creatine: true, waterGallon: true, deficit: 300 },
  { id: "demo-2", userId: "demo", date: subDays(new Date(), 1).toISOString().split("T")[0], calories: 2100, protein: 165, carbs: 200, fats: 70, creatine: true, waterGallon: false, deficit: 400 },
  { id: "demo-3", userId: "demo", date: subDays(new Date(), 2).toISOString().split("T")[0], calories: 2350, protein: 190, carbs: 240, fats: 60, creatine: true, waterGallon: true, deficit: 150 },
  { id: "demo-4", userId: "demo", date: subDays(new Date(), 3).toISOString().split("T")[0], calories: 2400, protein: 185, carbs: 250, fats: 65, creatine: true, waterGallon: true, deficit: 100 },
  { id: "demo-5", userId: "demo", date: subDays(new Date(), 4).toISOString().split("T")[0], calories: 2050, protein: 160, carbs: 180, fats: 75, creatine: false, waterGallon: true, deficit: 450 },
];

const mockBodyComp: BodyComposition[] = [
  { id: "demo-1", userId: "demo", date: new Date().toISOString().split("T")[0], weight: 185, bodyFat: 15, goalWeight: 180, nextMilestone: 183 },
  { id: "demo-2", userId: "demo", date: subDays(new Date(), 7).toISOString().split("T")[0], weight: 187, bodyFat: 16, goalWeight: 180, nextMilestone: 185 },
  { id: "demo-3", userId: "demo", date: subDays(new Date(), 14).toISOString().split("T")[0], weight: 189, bodyFat: 17, goalWeight: 180, nextMilestone: 187 },
  { id: "demo-4", userId: "demo", date: subDays(new Date(), 21).toISOString().split("T")[0], weight: 191, bodyFat: 18, goalWeight: 180, nextMilestone: 189 },
];

const mockStrength: StrengthWorkout[] = [
  { id: "demo-1", userId: "demo", date: new Date().toISOString().split("T")[0], type: "Strength", primaryFocus: "Push", duration: 60, volume: 15000, effort: 8, exercises: [{ name: "Bench Press", sets: 4, reps: 8, weight: 185 }, { name: "Shoulder Press", sets: 3, reps: 10, weight: 95 }] },
  { id: "demo-2", userId: "demo", date: subDays(new Date(), 2).toISOString().split("T")[0], type: "Strength", primaryFocus: "Pull", duration: 55, volume: 14200, effort: 7, exercises: [{ name: "Deadlift", sets: 4, reps: 6, weight: 275 }, { name: "Pull-ups", sets: 4, reps: 10, weight: 0 }] },
  { id: "demo-3", userId: "demo", date: subDays(new Date(), 4).toISOString().split("T")[0], type: "Strength", primaryFocus: "Legs", duration: 70, volume: 18500, effort: 9, exercises: [{ name: "Squat", sets: 5, reps: 5, weight: 225 }, { name: "RDL", sets: 4, reps: 8, weight: 185 }] },
];

const mockSkills: SkillWorkout[] = [
  { id: "demo-1", userId: "demo", date: new Date().toISOString().split("T")[0], type: "Skill", drillType: "Shooting", effort: 8, skillFocus: ["3-pointers", "Mid-range"], zoneFocus: ["Corner", "Wing"], drillStats: { makes: 45, attempts: 60 } },
  { id: "demo-2", userId: "demo", date: subDays(new Date(), 3).toISOString().split("T")[0], type: "Skill", drillType: "Ball Handling", effort: 7, skillFocus: ["Crossovers", "Behind back"], zoneFocus: [] },
  { id: "demo-3", userId: "demo", date: subDays(new Date(), 6).toISOString().split("T")[0], type: "Skill", drillType: "Shooting", effort: 9, skillFocus: ["Free throws", "Fadeaways"], zoneFocus: ["Paint", "Elbow"], drillStats: { makes: 38, attempts: 50 } },
];

const mockRuns: BasketballRun[] = [
  { id: "demo-1", userId: "demo", date: new Date().toISOString().split("T")[0], type: "Run", gameType: { fullCourt: true }, courtType: "Indoor", competitionLevel: "Competitive", gamesPlayed: 5, wins: 3, losses: 2, performanceGrade: "B+", confidence: 7 },
  { id: "demo-2", userId: "demo", date: subDays(new Date(), 5).toISOString().split("T")[0], type: "Run", gameType: { halfCourt: true }, courtType: "Outdoor", competitionLevel: "Pickup", gamesPlayed: 4, wins: 4, losses: 0, performanceGrade: "A", confidence: 9 },
  { id: "demo-3", userId: "demo", date: subDays(new Date(), 10).toISOString().split("T")[0], type: "Run", gameType: { fullCourt: true }, courtType: "Indoor", competitionLevel: "Competitive", gamesPlayed: 6, wins: 4, losses: 2, performanceGrade: "A-", confidence: 8 },
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
type SportsSubTab = "runs" | "drills";

export default function FitnessPage() {
  const { isDemo } = useDemo();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
  const [sportsSubTab, setSportsSubTab] = useState<SportsSubTab>("runs");
  const [nutritionDialogOpen, setNutritionDialogOpen] = useState(false);
  const [strengthDialogOpen, setStrengthDialogOpen] = useState(false);
  const [skillDialogOpen, setSkillDialogOpen] = useState(false);
  const [runDialogOpen, setRunDialogOpen] = useState(false);
  const [bodyCompDialogOpen, setBodyCompDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [calculatorDialogOpen, setCalculatorDialogOpen] = useState(false);
  const [demoNutritionSettings, setDemoNutritionSettings] = useState(mockNutritionSettings);

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

  const { data: nutritionSettingsData } = useQuery<NutritionSettings>({
    queryKey: ["/api/fitness/nutrition-settings"],
    enabled: !isDemo,
  });

  const nutrition = isDemo ? mockNutrition : nutritionData;
  const nutritionSettings = isDemo ? demoNutritionSettings : (nutritionSettingsData || mockNutritionSettings);
  const bodyComp = isDemo ? mockBodyComp : bodyCompData;
  const strength = isDemo ? mockStrength : strengthData;
  const skills = isDemo ? mockSkills : skillsData;
  const runs = isDemo ? mockRuns : runsData;

  const isLoading = !isDemo && (loadingNutrition || loadingBody || loadingStrength || loadingSkills || loadingRuns);

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
  const getTodayCalories = () => nutrition.find(n => n.date === format(new Date(), "yyyy-MM-dd"));
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

  const deleteBodyCompMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/fitness/body-comp/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fitness/body-comp"] });
      toast({ title: "Record deleted" });
    },
  });

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
  const weeklyWorkouts = getThisWeekWorkouts();
  const weeklyStreak = getWeeklyStreak();
  const avgDeficit = getAvgDeficit();

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto" data-testid="page-fitness">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">FrisFit Dashboard</h1>
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
                onOpenChange={setNutritionDialogOpen}
                isDemo={isDemo}
              />
            </div>
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

          {/* Macro Progress Bars */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between gap-2">
                  <span>Calories</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {todayCalories?.calories || 0} / {nutritionSettings.calorieTarget}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const eaten = todayCalories?.calories || 0;
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
                    {todayCalories?.protein || 0}g / {nutritionSettings.proteinTarget}g
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const eaten = todayCalories?.protein || 0;
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
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Deficit Bank</CardTitle>
                <CardDescription className="text-xs">Net calorie balance for the day</CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  const maintenance = nutritionSettings.maintenanceCalories || 2500;
                  const eaten = todayCalories?.calories || 0;
                  const burned = todayCalories?.deficit ? todayCalories.deficit : 0;
                  const netBalance = maintenance - eaten + burned;
                  const isDeficit = netBalance > 0;
                  return (
                    <div className="space-y-3">
                      <div className={`text-3xl font-bold font-mono ${isDeficit ? 'text-green-500' : 'text-red-500'}`}>
                        {isDeficit ? '+' : ''}{netBalance}
                      </div>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div className="flex justify-between">
                          <span>Maintenance</span>
                          <span className="font-mono">{maintenance}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Eaten</span>
                          <span className="font-mono text-red-400">-{eaten}</span>
                        </div>
                        {burned > 0 && (
                          <div className="flex justify-between">
                            <span>Burned</span>
                            <span className="font-mono text-green-400">+{burned}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Daily Habits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Droplets className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">Gallon of Water</span>
                    </div>
                    <Switch 
                      checked={todayCalories?.waterGallon || false} 
                      disabled={true}
                      data-testid="toggle-water"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-purple-500" />
                      <span className="text-sm">Creatine</span>
                    </div>
                    <Switch 
                      checked={todayCalories?.creatine || false} 
                      disabled={true}
                      data-testid="toggle-creatine"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Today's Quick Stats */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Today's Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {todayCalories ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-muted/50 rounded-md">
                    <div className="text-2xl font-bold font-mono">{todayCalories.calories}</div>
                    <div className="text-xs text-muted-foreground">Calories</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-md">
                    <div className="text-2xl font-bold font-mono">{todayCalories.protein}g</div>
                    <div className="text-xs text-muted-foreground">Protein</div>
                  </div>
                  {todayCalories.carbs !== null && todayCalories.carbs !== undefined && (
                    <div className="text-center p-3 bg-muted/50 rounded-md">
                      <div className="text-2xl font-bold font-mono">{todayCalories.carbs}g</div>
                      <div className="text-xs text-muted-foreground">Carbs</div>
                    </div>
                  )}
                  {todayCalories.fats !== null && todayCalories.fats !== undefined && (
                    <div className="text-center p-3 bg-muted/50 rounded-md">
                      <div className="text-2xl font-bold font-mono">{todayCalories.fats}g</div>
                      <div className="text-xs text-muted-foreground">Fats</div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-4">No data logged today. Use the button above to log your nutrition.</p>
              )}
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
                    const calOk = log.calories <= calTarget;
                    const proteinOk = log.protein >= proteinTarget;
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
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={() => deleteNutritionMutation.mutate(log.id)}
                            data-testid={`button-delete-nutrition-${log.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
                Pickup Games
              </TabsTrigger>
              <TabsTrigger value="drills" data-testid="subtab-drills">
                <Target className="h-4 w-4 mr-2" />
                Skill Drills
              </TabsTrigger>
            </TabsList>

            <TabsContent value="runs" className="space-y-4 mt-4">
              <div className="flex justify-end">
                <RunDialog 
                  open={runDialogOpen} 
                  onOpenChange={setRunDialogOpen}
                  isDemo={isDemo}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {runs.length === 0 ? (
                  <Card className="md:col-span-3">
                    <CardContent className="py-8 text-center">
                      <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No pickup games logged yet</p>
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
                              <Button size="icon" variant="ghost" onClick={() => deleteRunMutation.mutate(run.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
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
                  onOpenChange={setSkillDialogOpen}
                  isDemo={isDemo}
                />
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
                              <Button size="icon" variant="ghost" onClick={() => deleteSkillMutation.mutate(workout.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
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

        {/* STRENGTH TAB */}
        <TabsContent value="strength" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Strength Training</h2>
            <StrengthDialog 
              open={strengthDialogOpen} 
              onOpenChange={setStrengthDialogOpen}
              isDemo={isDemo}
            />
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
                              <Button size="icon" variant="ghost" onClick={() => deleteStrengthMutation.mutate(workout.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
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
              onOpenChange={setBodyCompDialogOpen}
              isDemo={isDemo}
            />
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
                            <Button size="icon" variant="ghost" onClick={() => deleteBodyCompMutation.mutate(record.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
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
    </div>
  );
}

function NutritionDialog({ open, onOpenChange, isDemo }: { open: boolean; onOpenChange: (open: boolean) => void; isDemo: boolean }) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    calories: "",
    protein: "",
    carbs: "",
    fats: "",
    deficit: "",
    creatine: false,
    waterGallon: false,
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<NutritionLog>) => {
      const res = await apiRequest("POST", "/api/fitness/nutrition", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fitness/nutrition"] });
      toast({ title: "Nutrition logged" });
      onOpenChange(false);
      setFormData({ date: format(new Date(), "yyyy-MM-dd"), calories: "", protein: "", carbs: "", fats: "", deficit: "", creatine: false, waterGallon: false });
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
    createMutation.mutate({
      date: formData.date,
      calories: formData.calories ? parseInt(formData.calories) : undefined,
      protein: formData.protein ? parseInt(formData.protein) : undefined,
      carbs: formData.carbs ? parseInt(formData.carbs) : undefined,
      fats: formData.fats ? parseInt(formData.fats) : undefined,
      deficit: formData.deficit ? parseInt(formData.deficit) : undefined,
      creatine: formData.creatine,
      waterGallon: formData.waterGallon,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button data-testid="button-add-nutrition">
          <Plus className="h-4 w-4 mr-2" />
          Log Nutrition
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log Nutrition</DialogTitle>
          <DialogDescription>Track your daily food intake and habits</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Date</Label>
            <Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} data-testid="input-nutrition-date" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Calories</Label>
              <Input type="number" placeholder="2000" value={formData.calories} onChange={(e) => setFormData({ ...formData, calories: e.target.value })} data-testid="input-nutrition-calories" />
            </div>
            <div className="space-y-2">
              <Label>Protein (g)</Label>
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
          <div className="space-y-2">
            <Label>Deficit (cal below maintenance)</Label>
            <Input type="number" placeholder="500" value={formData.deficit} onChange={(e) => setFormData({ ...formData, deficit: e.target.value })} data-testid="input-nutrition-deficit" />
          </div>
          <div className="flex items-center justify-between">
            <Label>Drank Gallon of Water</Label>
            <Switch checked={formData.waterGallon} onCheckedChange={(c) => setFormData({ ...formData, waterGallon: c })} data-testid="switch-nutrition-water" />
          </div>
          <div className="flex items-center justify-between">
            <Label>Took Creatine</Label>
            <Switch checked={formData.creatine} onCheckedChange={(c) => setFormData({ ...formData, creatine: c })} data-testid="switch-nutrition-creatine" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={createMutation.isPending} data-testid="button-save-nutrition">
            {createMutation.isPending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StrengthDialog({ open, onOpenChange, isDemo }: { open: boolean; onOpenChange: (open: boolean) => void; isDemo: boolean }) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    primaryFocus: "Push",
    duration: "",
    volume: "",
    effort: "",
    notes: "",
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<StrengthWorkout>) => {
      const res = await apiRequest("POST", "/api/fitness/strength", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fitness/strength"] });
      toast({ title: "Workout logged" });
      onOpenChange(false);
      setFormData({ date: format(new Date(), "yyyy-MM-dd"), primaryFocus: "Push", duration: "", volume: "", effort: "", notes: "" });
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
    createMutation.mutate({
      date: formData.date,
      type: "Strength",
      primaryFocus: formData.primaryFocus,
      duration: formData.duration ? parseInt(formData.duration) : undefined,
      volume: formData.volume ? parseInt(formData.volume) : undefined,
      effort: formData.effort ? parseInt(formData.effort) : undefined,
      notes: formData.notes || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button data-testid="button-add-strength">
          <Plus className="h-4 w-4 mr-2" />
          Log Workout
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log Strength Workout</DialogTitle>
          <DialogDescription>Record your strength training session</DialogDescription>
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
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Duration (min)</Label>
              <Input type="number" placeholder="60" value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: e.target.value })} data-testid="input-strength-duration" />
            </div>
            <div className="space-y-2">
              <Label>Volume (lbs)</Label>
              <Input type="number" placeholder="15000" value={formData.volume} onChange={(e) => setFormData({ ...formData, volume: e.target.value })} data-testid="input-strength-volume" />
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
            {createMutation.isPending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SkillDialog({ open, onOpenChange, isDemo }: { open: boolean; onOpenChange: (open: boolean) => void; isDemo: boolean }) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    drillType: "Shooting",
    effort: "",
    notes: "",
  });

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
    createMutation.mutate({
      date: formData.date,
      type: "Skill",
      drillType: formData.drillType,
      effort: formData.effort ? parseInt(formData.effort) : undefined,
      notes: formData.notes || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button data-testid="button-add-skill">
          <Plus className="h-4 w-4 mr-2" />
          Log Drill Session
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log Skill Workout</DialogTitle>
          <DialogDescription>Record your basketball drill session</DialogDescription>
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
            {createMutation.isPending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RunDialog({ open, onOpenChange, isDemo }: { open: boolean; onOpenChange: (open: boolean) => void; isDemo: boolean }) {
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
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<BasketballRun>) => {
      const res = await apiRequest("POST", "/api/fitness/runs", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fitness/runs"] });
      toast({ title: "Run logged" });
      onOpenChange(false);
      setFormData({ date: format(new Date(), "yyyy-MM-dd"), courtType: "Indoor", gameType: "fullCourt", gamesPlayed: "", wins: "", losses: "", performanceGrade: "", confidence: "" });
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
    createMutation.mutate({
      date: formData.date,
      type: "Run",
      courtType: formData.courtType,
      gameType: formData.gameType === "fullCourt" ? { fullCourt: true } : { halfCourt: true },
      gamesPlayed: formData.gamesPlayed ? parseInt(formData.gamesPlayed) : undefined,
      wins: formData.wins ? parseInt(formData.wins) : undefined,
      losses: formData.losses ? parseInt(formData.losses) : undefined,
      performanceGrade: formData.performanceGrade || undefined,
      confidence: formData.confidence ? parseInt(formData.confidence) : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button data-testid="button-add-run">
          <Plus className="h-4 w-4 mr-2" />
          Log Run
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log Basketball Run</DialogTitle>
          <DialogDescription>Record your pickup games</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} data-testid="input-run-date" />
            </div>
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
          </div>
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
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Games</Label>
              <Input type="number" placeholder="5" value={formData.gamesPlayed} onChange={(e) => setFormData({ ...formData, gamesPlayed: e.target.value })} data-testid="input-run-games" />
            </div>
            <div className="space-y-2">
              <Label>Wins</Label>
              <Input type="number" placeholder="3" value={formData.wins} onChange={(e) => setFormData({ ...formData, wins: e.target.value })} data-testid="input-run-wins" />
            </div>
            <div className="space-y-2">
              <Label>Losses</Label>
              <Input type="number" placeholder="2" value={formData.losses} onChange={(e) => setFormData({ ...formData, losses: e.target.value })} data-testid="input-run-losses" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
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
            <div className="space-y-2">
              <Label>Confidence (1-10)</Label>
              <Input type="number" min="1" max="10" placeholder="7" value={formData.confidence} onChange={(e) => setFormData({ ...formData, confidence: e.target.value })} data-testid="input-run-confidence" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={createMutation.isPending} data-testid="button-save-run">
            {createMutation.isPending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BodyCompDialog({ open, onOpenChange, isDemo }: { open: boolean; onOpenChange: (open: boolean) => void; isDemo: boolean }) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    weight: "",
    bodyFat: "",
    goalWeight: "",
  });

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
    createMutation.mutate({
      date: formData.date,
      weight: formData.weight ? parseInt(formData.weight) : undefined,
      bodyFat: formData.bodyFat ? parseInt(formData.bodyFat) : undefined,
      goalWeight: formData.goalWeight ? parseInt(formData.goalWeight) : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button data-testid="button-add-body-comp">
          <Plus className="h-4 w-4 mr-2" />
          Log Weigh-In
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log Body Composition</DialogTitle>
          <DialogDescription>Track your weight and body fat</DialogDescription>
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
            {createMutation.isPending ? "Saving..." : "Save"}
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
  });

  // Update form when settings change
  useEffect(() => {
    setFormData({
      maintenanceCalories: String(currentSettings.maintenanceCalories || 2500),
      calorieTarget: String(currentSettings.calorieTarget || 2000),
      proteinTarget: String(currentSettings.proteinTarget || 150),
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
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nutrition Targets</DialogTitle>
          <DialogDescription>Configure your daily calorie and protein goals</DialogDescription>
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
