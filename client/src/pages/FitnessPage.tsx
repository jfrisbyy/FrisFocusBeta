import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dumbbell, Utensils, Scale, Target, Trophy } from "lucide-react";
import { useDemo } from "@/contexts/DemoContext";
import type { NutritionLog, BodyComposition, StrengthWorkout, SkillWorkout, BasketballRun } from "@shared/schema";

const mockNutrition: NutritionLog[] = [
  { id: "demo-1", date: new Date().toISOString().split("T")[0], calories: 2200, protein: 180, creatine: true, waterGallon: true },
  { id: "demo-2", date: new Date(Date.now() - 86400000).toISOString().split("T")[0], calories: 2100, protein: 165, creatine: true, waterGallon: false },
  { id: "demo-3", date: new Date(Date.now() - 172800000).toISOString().split("T")[0], calories: 2350, protein: 190, creatine: true, waterGallon: true },
];

const mockBodyComp: BodyComposition[] = [
  { id: "demo-1", date: new Date().toISOString().split("T")[0], weight: 185, bodyFat: 15, goalWeight: 180 },
  { id: "demo-2", date: new Date(Date.now() - 604800000).toISOString().split("T")[0], weight: 187, bodyFat: 16, goalWeight: 180 },
];

const mockStrength: StrengthWorkout[] = [
  { id: "demo-1", date: new Date().toISOString().split("T")[0], primaryFocus: "Push", duration: 60, volume: 15000 },
  { id: "demo-2", date: new Date(Date.now() - 172800000).toISOString().split("T")[0], primaryFocus: "Pull", duration: 55, volume: 14200 },
  { id: "demo-3", date: new Date(Date.now() - 345600000).toISOString().split("T")[0], primaryFocus: "Legs", duration: 70, volume: 18500 },
];

const mockSkills: SkillWorkout[] = [
  { id: "demo-1", date: new Date().toISOString().split("T")[0], drillType: "Shooting", effort: 8, skillFocus: ["3-pointers", "Mid-range"], zoneFocus: ["Corner", "Wing"] },
  { id: "demo-2", date: new Date(Date.now() - 259200000).toISOString().split("T")[0], drillType: "Ball Handling", effort: 7, skillFocus: ["Crossovers", "Behind back"], zoneFocus: [] },
];

const mockRuns: BasketballRun[] = [
  { id: "demo-1", date: new Date().toISOString().split("T")[0], gameType: { fullCourt: true }, courtType: "Indoor", gamesPlayed: 5, wins: 3, losses: 2, performanceGrade: "B+", confidence: 7 },
  { id: "demo-2", date: new Date(Date.now() - 432000000).toISOString().split("T")[0], gameType: { halfCourt: true }, courtType: "Outdoor", gamesPlayed: 4, wins: 4, losses: 0, performanceGrade: "A", confidence: 9 },
];

export default function FitnessPage() {
  const { isDemo } = useDemo();
  
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

  const nutrition = isDemo ? mockNutrition : nutritionData;
  const bodyComp = isDemo ? mockBodyComp : bodyCompData;
  const strength = isDemo ? mockStrength : strengthData;
  const skills = isDemo ? mockSkills : skillsData;
  const runs = isDemo ? mockRuns : runsData;

  const isLoading = !isDemo && (loadingNutrition || loadingBody || loadingStrength || loadingSkills || loadingRuns);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Fitness Tracker</h1>
        <div className="text-muted-foreground">Loading fitness data...</div>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="container mx-auto p-6" data-testid="page-fitness">
      <h1 className="text-2xl font-bold mb-6">Fitness Tracker</h1>
      <p className="text-muted-foreground mb-8">
        Synced fitness data from FrisFit. Add workouts from the FrisFit app to see them here.
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Utensils className="h-5 w-5 text-green-500" />
              Nutrition Logs
            </CardTitle>
            <Badge variant="secondary">{nutrition.length}</Badge>
          </CardHeader>
          <CardContent>
            {nutrition.length === 0 ? (
              <p className="text-muted-foreground text-sm">No nutrition logs yet</p>
            ) : (
              <div className="space-y-3">
                {nutrition.slice(-5).reverse().map((log) => (
                  <div key={log.id} className="border-b pb-2 last:border-0" data-testid={`log-nutrition-${log.id}`}>
                    <div className="font-medium">{formatDate(log.date)}</div>
                    <div className="text-sm text-muted-foreground flex flex-wrap gap-2">
                      {log.calories && <span>{log.calories} cal</span>}
                      {log.protein && <span>{log.protein}g protein</span>}
                      {log.creatine && <Badge variant="outline" className="text-xs">Creatine</Badge>}
                      {log.waterGallon && <Badge variant="outline" className="text-xs">Gallon</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Scale className="h-5 w-5 text-purple-500" />
              Body Composition
            </CardTitle>
            <Badge variant="secondary">{bodyComp.length}</Badge>
          </CardHeader>
          <CardContent>
            {bodyComp.length === 0 ? (
              <p className="text-muted-foreground text-sm">No body composition records yet</p>
            ) : (
              <div className="space-y-3">
                {bodyComp.slice(-5).reverse().map((record) => (
                  <div key={record.id} className="border-b pb-2 last:border-0" data-testid={`record-body-${record.id}`}>
                    <div className="font-medium">{formatDate(record.date)}</div>
                    <div className="text-sm text-muted-foreground">
                      {record.weight && <span>{record.weight} lbs</span>}
                      {record.bodyFat && <span> | {record.bodyFat}% BF</span>}
                      {record.goalWeight && <span> | Goal: {record.goalWeight}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-blue-500" />
              Strength Workouts
            </CardTitle>
            <Badge variant="secondary">{strength.length}</Badge>
          </CardHeader>
          <CardContent>
            {strength.length === 0 ? (
              <p className="text-muted-foreground text-sm">No strength workouts yet</p>
            ) : (
              <div className="space-y-3">
                {strength.slice(-5).reverse().map((workout) => (
                  <div key={workout.id} className="border-b pb-2 last:border-0" data-testid={`workout-strength-${workout.id}`}>
                    <div className="font-medium">{formatDate(workout.date)}</div>
                    <div className="text-sm text-muted-foreground">
                      {workout.primaryFocus && <span>{workout.primaryFocus}</span>}
                      {workout.duration && <span> | {workout.duration}min</span>}
                      {workout.volume && <span> | {workout.volume} vol</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-orange-500" />
              Skill Workouts
            </CardTitle>
            <Badge variant="secondary">{skills.length}</Badge>
          </CardHeader>
          <CardContent>
            {skills.length === 0 ? (
              <p className="text-muted-foreground text-sm">No skill workouts yet</p>
            ) : (
              <div className="space-y-3">
                {skills.slice(-5).reverse().map((workout) => {
                  const skillFocus = Array.isArray(workout.skillFocus) ? workout.skillFocus as string[] : [];
                  const zoneFocus = Array.isArray(workout.zoneFocus) ? workout.zoneFocus as string[] : [];
                  return (
                    <div key={workout.id} className="border-b pb-2 last:border-0" data-testid={`workout-skill-${workout.id}`}>
                      <div className="font-medium">{formatDate(workout.date)}</div>
                      <div className="text-sm text-muted-foreground">
                        {workout.drillType && <span>{workout.drillType}</span>}
                        {workout.effort && <span> | Effort: {workout.effort}/10</span>}
                      </div>
                      {skillFocus.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {skillFocus.map((skill, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">{skill}</Badge>
                          ))}
                        </div>
                      )}
                      {zoneFocus.length > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Zones: {zoneFocus.join(", ")}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Basketball Runs
            </CardTitle>
            <Badge variant="secondary">{runs.length}</Badge>
          </CardHeader>
          <CardContent>
            {runs.length === 0 ? (
              <p className="text-muted-foreground text-sm">No basketball runs yet</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {runs.slice(-6).reverse().map((run) => {
                  const gameType = run.gameType as { fullCourt?: boolean; halfCourt?: boolean } | null;
                  const gameTypeLabel = gameType?.fullCourt ? "Full Court" : gameType?.halfCourt ? "Half Court" : null;
                  return (
                    <div key={run.id} className="border rounded-md p-3" data-testid={`run-basketball-${run.id}`}>
                      <div className="font-medium mb-1">{formatDate(run.date)}</div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        {gameTypeLabel && <div>{gameTypeLabel}</div>}
                        {run.courtType && <div>{run.courtType}</div>}
                        {run.gamesPlayed && <div>Games: {run.gamesPlayed}</div>}
                        {(run.wins !== null || run.losses !== null) && (
                          <div>Record: {run.wins || 0}W - {run.losses || 0}L</div>
                        )}
                        {run.performanceGrade && (
                          <Badge variant="secondary">{run.performanceGrade}</Badge>
                        )}
                        {run.confidence && (
                          <div className="text-xs">Confidence: {run.confidence}/10</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
