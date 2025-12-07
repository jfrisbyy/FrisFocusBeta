import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TrendingUp, TrendingDown, Minus, MessageSquare, Target, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

export interface WeekData {
  id: string;
  weekStart: string;
  weekEnd: string;
  points: number;
  defaultGoal: number;
  customGoal?: number;
  note?: string;
}

interface RecentWeeksProps {
  weeks: WeekData[];
  defaultGoal: number;
  onWeekUpdate?: (weekId: string, note: string, customGoal?: number) => void;
}

function getWeekStatus(points: number, goal: number) {
  const percentage = (points / goal) * 100;
  if (percentage >= 100) return { level: "strong", color: "text-chart-1", bgColor: "bg-chart-1", icon: TrendingUp };
  if (percentage >= 70) return { level: "mid", color: "text-chart-2", bgColor: "bg-chart-2", icon: Minus };
  return { level: "weak", color: "text-chart-3", bgColor: "bg-chart-3", icon: TrendingDown };
}

function getProgressColor(percentage: number) {
  if (percentage >= 100) return "bg-chart-1";
  if (percentage >= 70) return "bg-chart-2";
  return "bg-chart-3";
}

export default function RecentWeeks({ weeks, defaultGoal, onWeekUpdate }: RecentWeeksProps) {
  const [editingWeek, setEditingWeek] = useState<WeekData | null>(null);
  const [noteValue, setNoteValue] = useState("");
  const [customGoalValue, setCustomGoalValue] = useState("");
  const [useCustomGoal, setUseCustomGoal] = useState(false);

  const handleEditClick = (week: WeekData) => {
    setEditingWeek(week);
    setNoteValue(week.note || "");
    setCustomGoalValue(week.customGoal?.toString() || "");
    setUseCustomGoal(!!week.customGoal);
  };

  const handleSave = () => {
    if (!editingWeek) return;
    const customGoal = useCustomGoal && customGoalValue ? parseInt(customGoalValue, 10) : undefined;
    onWeekUpdate?.(editingWeek.id, noteValue, customGoal);
    setEditingWeek(null);
  };

  const handleCancel = () => {
    setEditingWeek(null);
    setNoteValue("");
    setCustomGoalValue("");
    setUseCustomGoal(false);
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Recent Weeks</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {weeks.map((week) => {
              const effectiveGoal = week.customGoal || defaultGoal;
              const status = getWeekStatus(week.points, effectiveGoal);
              const percentage = Math.min((week.points / effectiveGoal) * 100, 100);
              const Icon = status.icon;

              return (
                <div
                  key={week.id}
                  className="flex flex-col gap-2 px-6 py-4"
                  data-testid={`row-week-${week.id}`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Icon className={cn("h-4 w-4 shrink-0", status.color)} />
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium truncate">
                          {week.weekStart} - {week.weekEnd}
                        </span>
                        {week.note && (
                          <span className="text-xs text-muted-foreground truncate flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {week.note}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex flex-col items-end">
                        <span className={cn("font-mono text-sm font-semibold", status.color)}>
                          {week.points}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Target className="h-3 w-3" />
                          <span className="font-mono">{effectiveGoal}</span>
                          {week.customGoal && (
                            <Badge variant="secondary" className="text-[10px]">
                              custom
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEditClick(week)}
                        data-testid={`button-edit-week-${week.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Progress
                    value={percentage}
                    className="h-1.5"
                    indicatorClassName={getProgressColor(percentage)}
                  />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!editingWeek} onOpenChange={(open) => !open && handleCancel()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Week of {editingWeek?.weekStart} - {editingWeek?.weekEnd}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="week-note">Note (optional)</Label>
              <Textarea
                id="week-note"
                placeholder="e.g., Vacation week, Sick days, Travel..."
                value={noteValue}
                onChange={(e) => setNoteValue(e.target.value)}
                className="resize-none"
                rows={2}
                data-testid="input-week-note"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="use-custom-goal"
                  checked={useCustomGoal}
                  onCheckedChange={(checked) => setUseCustomGoal(checked === true)}
                  data-testid="checkbox-use-custom-goal"
                />
                <Label htmlFor="use-custom-goal" className="text-sm font-normal cursor-pointer">
                  Set custom goal for this week
                </Label>
              </div>
              {useCustomGoal && (
                <div className="flex items-center gap-2 pl-6">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    value={customGoalValue}
                    onChange={(e) => setCustomGoalValue(e.target.value)}
                    placeholder={defaultGoal.toString()}
                    className="w-24 font-mono"
                    min={1}
                    data-testid="input-custom-goal"
                  />
                  <span className="text-sm text-muted-foreground">
                    (default: {defaultGoal})
                  </span>
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleCancel} data-testid="button-cancel-week-edit">
              Cancel
            </Button>
            <Button onClick={handleSave} data-testid="button-save-week-edit">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
