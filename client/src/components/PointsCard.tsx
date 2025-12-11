import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TrendingUp, TrendingDown, Minus, Target, Pencil, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { HelpIndicator, helpContent } from "@/components/HelpIndicator";

interface PointsCardProps {
  weekTotal: number;
  weekRange: string;
  boosterPoints?: number;
  weeklyGoal?: number;
  onGoalChange?: (newGoal: number) => void;
}

function getPointsStatus(points: number, goal?: number) {
  if (goal) {
    const percentage = (points / goal) * 100;
    if (percentage >= 100) return { level: "strong", color: "text-chart-1", bgColor: "bg-chart-1/10", borderColor: "border-chart-1/30", icon: TrendingUp };
    if (percentage >= 70) return { level: "mid", color: "text-chart-2", bgColor: "bg-chart-2/10", borderColor: "border-chart-2/30", icon: Minus };
    return { level: "weak", color: "text-chart-3", bgColor: "bg-chart-3/10", borderColor: "border-chart-3/30", icon: TrendingDown };
  }
  if (points > 400) return { level: "strong", color: "text-chart-1", bgColor: "bg-chart-1/10", borderColor: "border-chart-1/30", icon: TrendingUp };
  if (points >= 250) return { level: "mid", color: "text-chart-2", bgColor: "bg-chart-2/10", borderColor: "border-chart-2/30", icon: Minus };
  return { level: "weak", color: "text-chart-3", bgColor: "bg-chart-3/10", borderColor: "border-chart-3/30", icon: TrendingDown };
}

function getProgressColor(percentage: number) {
  if (percentage >= 100) return "bg-chart-1";
  if (percentage >= 70) return "bg-chart-2";
  return "bg-chart-3";
}

export default function PointsCard({ weekTotal, weekRange, boosterPoints = 0, weeklyGoal, onGoalChange }: PointsCardProps) {
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalInputValue, setGoalInputValue] = useState(weeklyGoal?.toString() || "350");
  
  const status = getPointsStatus(weekTotal, weeklyGoal);
  const Icon = status.icon;
  
  const goalPercentage = weeklyGoal ? Math.min((weekTotal / weeklyGoal) * 100, 100) : 0;
  const progressColor = getProgressColor(goalPercentage);

  const handleEditStart = () => {
    setGoalInputValue(weeklyGoal?.toString() || "350");
    setIsEditingGoal(true);
  };

  const handleEditCancel = () => {
    setIsEditingGoal(false);
    setGoalInputValue(weeklyGoal?.toString() || "350");
  };

  const handleEditSave = () => {
    const newGoal = parseInt(goalInputValue, 10);
    if (!isNaN(newGoal) && newGoal > 0) {
      onGoalChange?.(newGoal);
    }
    setIsEditingGoal(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleEditSave();
    } else if (e.key === "Escape") {
      handleEditCancel();
    }
  };

  return (
    <Card className={cn("border", status.borderColor, status.bgColor)}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <div className="flex items-center gap-1">
          <CardTitle className="text-sm font-medium text-muted-foreground">Week Total</CardTitle>
          <HelpIndicator {...helpContent.weeklyPoints} />
        </div>
        <Icon className={cn("h-5 w-5", status.color)} />
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className={cn("text-4xl font-mono font-bold", status.color)} data-testid="text-week-total">
            {weekTotal}
          </div>
          <p className="text-sm text-muted-foreground mt-1">{weekRange}</p>
          {boosterPoints > 0 && (
            <p className="text-xs text-chart-1 mt-2 font-medium">
              +{boosterPoints} from boosters
            </p>
          )}
        </div>

        {weeklyGoal !== undefined && (
          <div className="space-y-2 pt-2 border-t border-border/50">
            <div className="flex items-center justify-between gap-2">
              {isEditingGoal ? (
                <div className="flex items-center gap-1 flex-1">
                  <Target className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Input
                    type="number"
                    value={goalInputValue}
                    onChange={(e) => setGoalInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="h-7 w-20 text-sm font-mono"
                    min={1}
                    autoFocus
                    data-testid="input-weekly-goal"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={handleEditSave}
                    data-testid="button-save-goal"
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={handleEditCancel}
                    data-testid="button-cancel-goal"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Target className="h-4 w-4" />
                    <span>Goal:</span>
                    <span className="font-mono font-medium" data-testid="text-weekly-goal">{weeklyGoal}</span>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={handleEditStart}
                    data-testid="button-edit-goal"
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                </>
              )}
            </div>
            
            <div className="space-y-1.5">
              <Progress 
                value={goalPercentage} 
                className="h-2"
                indicatorClassName={progressColor}
                data-testid="progress-weekly-goal"
              />
              <div className="flex items-center justify-between text-xs">
                <span className={cn("font-medium", status.color)} data-testid="text-goal-percentage">
                  {Math.round(goalPercentage)}% of goal
                </span>
                {weekTotal < weeklyGoal && (
                  <span className="text-muted-foreground" data-testid="text-points-remaining">
                    {weeklyGoal - weekTotal} pts to go
                  </span>
                )}
                {weekTotal >= weeklyGoal && (
                  <span className="text-chart-1 font-medium" data-testid="text-goal-achieved">
                    Goal reached!
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
