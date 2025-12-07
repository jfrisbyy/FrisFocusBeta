import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  MessageSquare, 
  Target, 
  Pencil, 
  ChevronDown, 
  ChevronRight,
  ChevronUp,
  Zap,
  AlertTriangle,
  Award,
  Flag,
  Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface DayData {
  date: string;
  dayName: string;
  points: number | null;
}

export interface WeekBooster {
  id: string;
  name: string;
  points: number;
  isNegative: boolean;
}

export interface WeekBadge {
  id: string;
  name: string;
  level: number;
  earnedAt: string;
}

export interface WeekMilestone {
  id: string;
  name: string;
  points: number;
  achievedAt: string;
}

export interface WeekData {
  id: string;
  weekStart: string;
  weekEnd: string;
  points: number;
  defaultGoal: number;
  customGoal?: number;
  note?: string;
  days?: DayData[];
  boosters?: WeekBooster[];
  badges?: WeekBadge[];
  milestones?: WeekMilestone[];
}

interface RecentWeeksProps {
  weeks: WeekData[];
  defaultGoal: number;
  onWeekUpdate?: (weekId: string, note: string, customGoal?: number) => void;
  initialDisplayCount?: number;
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

function getDayStatus(points: number | null, dailyGoal: number) {
  if (points === null) return { color: "text-muted-foreground", bgColor: "bg-muted" };
  const percentage = (points / dailyGoal) * 100;
  if (percentage >= 100) return { color: "text-chart-1", bgColor: "bg-chart-1/20" };
  if (percentage >= 70) return { color: "text-chart-2", bgColor: "bg-chart-2/20" };
  return { color: "text-chart-3", bgColor: "bg-chart-3/20" };
}

export default function RecentWeeks({ 
  weeks, 
  defaultGoal, 
  onWeekUpdate,
  initialDisplayCount = 3 
}: RecentWeeksProps) {
  const [editingWeek, setEditingWeek] = useState<WeekData | null>(null);
  const [noteValue, setNoteValue] = useState("");
  const [customGoalValue, setCustomGoalValue] = useState("");
  const [useCustomGoal, setUseCustomGoal] = useState(false);
  const [showAllWeeks, setShowAllWeeks] = useState(false);
  const [expandedWeekId, setExpandedWeekId] = useState<string | null>(null);

  const displayedWeeks = showAllWeeks ? weeks : weeks.slice(0, initialDisplayCount);
  const hasMoreWeeks = weeks.length > initialDisplayCount;
  const dailyGoal = Math.round(defaultGoal / 7);

  const handleEditClick = (e: React.MouseEvent, week: WeekData) => {
    e.stopPropagation();
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
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Calendar className="h-4 w-4" />
            Recent Weeks
          </CardTitle>
          {hasMoreWeeks && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowAllWeeks(!showAllWeeks)}
              data-testid="button-toggle-all-weeks"
            >
              {showAllWeeks ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Show All ({weeks.length})
                </>
              )}
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {displayedWeeks.map((week) => {
              const effectiveGoal = week.customGoal || defaultGoal;
              const status = getWeekStatus(week.points, effectiveGoal);
              const percentage = Math.min((week.points / effectiveGoal) * 100, 100);
              const Icon = status.icon;
              const isExpanded = expandedWeekId === week.id;

              const positiveBoosters = week.boosters?.filter(b => !b.isNegative) || [];
              const negativeBoosters = week.boosters?.filter(b => b.isNegative) || [];
              const hasDetails = (week.days && week.days.length > 0) || 
                                 (week.boosters && week.boosters.length > 0) ||
                                 (week.badges && week.badges.length > 0) ||
                                 (week.milestones && week.milestones.length > 0);

              return (
                <Collapsible
                  key={week.id}
                  open={isExpanded}
                  onOpenChange={(open) => setExpandedWeekId(open ? week.id : null)}
                >
                  <div
                    className="flex flex-col gap-2 px-6 py-4"
                    data-testid={`row-week-${week.id}`}
                  >
                    <CollapsibleTrigger asChild>
                      <div 
                        className={cn(
                          "flex items-center justify-between gap-4 cursor-pointer hover-elevate rounded-md -mx-2 px-2 py-1",
                          hasDetails && "cursor-pointer"
                        )}
                        data-testid={`button-expand-week-${week.id}`}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {hasDetails ? (
                            isExpanded ? (
                              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                            )
                          ) : (
                            <Icon className={cn("h-4 w-4 shrink-0", status.color)} />
                          )}
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
                            onClick={(e) => handleEditClick(e, week)}
                            data-testid={`button-edit-week-${week.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <Progress
                      value={percentage}
                      className="h-1.5"
                      indicatorClassName={getProgressColor(percentage)}
                    />
                  </div>

                  <CollapsibleContent>
                    <div className="px-6 pb-4 space-y-4 border-t pt-4 mx-4 bg-muted/30 rounded-md mb-4">
                      {week.days && week.days.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-muted-foreground">Daily Points</p>
                          <div className="grid grid-cols-7 gap-1">
                            {week.days.map((day, index) => {
                              const dayStatus = getDayStatus(day.points, dailyGoal);
                              return (
                                <div 
                                  key={index}
                                  className={cn(
                                    "flex flex-col items-center p-2 rounded-md",
                                    dayStatus.bgColor
                                  )}
                                  data-testid={`day-${week.id}-${index}`}
                                >
                                  <span className="text-[10px] text-muted-foreground">{day.dayName}</span>
                                  <span className={cn("text-xs font-mono font-semibold", dayStatus.color)}>
                                    {day.points !== null ? day.points : "-"}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {positiveBoosters.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                            <Zap className="h-3 w-3 text-chart-1" />
                            Boosters Earned
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {positiveBoosters.map((booster) => (
                              <Badge 
                                key={booster.id} 
                                variant="secondary"
                                className="text-xs"
                              >
                                {booster.name} <span className="ml-1 text-chart-1">+{booster.points}</span>
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {negativeBoosters.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3 text-chart-3" />
                            Penalties
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {negativeBoosters.map((booster) => (
                              <Badge 
                                key={booster.id} 
                                variant="secondary"
                                className="text-xs"
                              >
                                {booster.name} <span className="ml-1 text-chart-3">{booster.points}</span>
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {week.badges && week.badges.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                            <Award className="h-3 w-3 text-chart-2" />
                            Badges Earned
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {week.badges.map((badge) => (
                              <Badge 
                                key={badge.id} 
                                variant="outline"
                                className="text-xs border-chart-2/30 text-chart-2"
                              >
                                {badge.name} Lv.{badge.level}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {week.milestones && week.milestones.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                            <Flag className="h-3 w-3 text-chart-1" />
                            Milestones Achieved
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {week.milestones.map((milestone) => (
                              <Badge 
                                key={milestone.id} 
                                variant="outline"
                                className="text-xs border-chart-1/30 text-chart-1"
                              >
                                {milestone.name} <span className="ml-1">+{milestone.points}</span>
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {!week.days?.length && !week.boosters?.length && !week.badges?.length && !week.milestones?.length && (
                        <p className="text-xs text-muted-foreground text-center py-2">
                          No detailed data available for this week
                        </p>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
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
