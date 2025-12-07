import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dumbbell, Heart, Utensils, Activity, Scale } from "lucide-react";
import type { BasketballWorkout, RunSession, StrengthWorkout, NutritionLog, BodyComposition } from "@shared/schema";

export default function FitnessPage() {
  const { data: basketball = [], isLoading: loadingBasketball } = useQuery<BasketballWorkout[]>({
    queryKey: ["/api/fitness/basketball"],
  });

  const { data: runs = [], isLoading: loadingRuns } = useQuery<RunSession[]>({
    queryKey: ["/api/fitness/runs"],
  });

  const { data: strength = [], isLoading: loadingStrength } = useQuery<StrengthWorkout[]>({
    queryKey: ["/api/fitness/strength"],
  });

  const { data: nutrition = [], isLoading: loadingNutrition } = useQuery<NutritionLog[]>({
    queryKey: ["/api/fitness/nutrition"],
  });

  const { data: body = [], isLoading: loadingBody } = useQuery<BodyComposition[]>({
    queryKey: ["/api/fitness/body"],
  });

  const isLoading = loadingBasketball || loadingRuns || loadingStrength || loadingNutrition || loadingBody;

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

  const formatDuration = (mins: number) => {
    if (mins >= 60) {
      const hours = Math.floor(mins / 60);
      const remaining = mins % 60;
      return remaining > 0 ? `${hours}h ${remaining}m` : `${hours}h`;
    }
    return `${mins}m`;
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
              <Activity className="h-5 w-5 text-orange-500" />
              Basketball Workouts
            </CardTitle>
            <Badge variant="secondary">{basketball.length}</Badge>
          </CardHeader>
          <CardContent>
            {basketball.length === 0 ? (
              <p className="text-muted-foreground text-sm">No basketball workouts yet</p>
            ) : (
              <div className="space-y-3">
                {basketball.slice(-5).reverse().map((workout) => (
                  <div key={workout.id} className="flex items-center justify-between border-b pb-2 last:border-0" data-testid={`workout-basketball-${workout.id}`}>
                    <div>
                      <div className="font-medium">{formatDate(workout.date)}</div>
                      <div className="text-sm text-muted-foreground">{formatDuration(workout.duration)}</div>
                    </div>
                    {workout.notes && <span className="text-sm text-muted-foreground">{workout.notes}</span>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              Run Sessions
            </CardTitle>
            <Badge variant="secondary">{runs.length}</Badge>
          </CardHeader>
          <CardContent>
            {runs.length === 0 ? (
              <p className="text-muted-foreground text-sm">No run sessions yet</p>
            ) : (
              <div className="space-y-3">
                {runs.slice(-5).reverse().map((run) => (
                  <div key={run.id} className="flex items-center justify-between border-b pb-2 last:border-0" data-testid={`workout-run-${run.id}`}>
                    <div>
                      <div className="font-medium">{formatDate(run.date)}</div>
                      <div className="text-sm text-muted-foreground">
                        {(run.distance / 1000).toFixed(2)} km in {formatDuration(run.duration)}
                      </div>
                    </div>
                    {run.pace && <span className="text-sm text-muted-foreground">{run.pace}</span>}
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
                      {Array.isArray(workout.exercises) ? `${workout.exercises.length} exercises` : "Exercises logged"}
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
                    {log.notes && <div className="text-sm text-muted-foreground">{log.notes}</div>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Scale className="h-5 w-5 text-purple-500" />
              Body Composition
            </CardTitle>
            <Badge variant="secondary">{body.length}</Badge>
          </CardHeader>
          <CardContent>
            {body.length === 0 ? (
              <p className="text-muted-foreground text-sm">No body composition records yet</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {body.slice(-6).reverse().map((record) => (
                  <div key={record.id} className="border rounded-md p-3" data-testid={`record-body-${record.id}`}>
                    <div className="font-medium mb-1">{formatDate(record.date)}</div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      {record.weight && <div>Weight: {record.weight} lbs</div>}
                      {record.bodyFat && <div>Body Fat: {record.bodyFat}%</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
