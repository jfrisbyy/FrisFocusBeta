import { useState } from "react";
import { format, parseISO, isBefore, startOfDay } from "date-fns";
import { Plus, Trash2, Calendar, Check, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { StoredDueDateItem } from "@/lib/storage";

interface DueDatesPanelProps {
  items: StoredDueDateItem[];
  onItemsChange: (items: StoredDueDateItem[]) => void;
  isDemo?: boolean;
}

export default function DueDatesPanel({
  items,
  onItemsChange,
  isDemo = false,
}: DueDatesPanelProps) {
  const [newTitle, setNewTitle] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [newPoints, setNewPoints] = useState("10");
  const [newPenalty, setNewPenalty] = useState("10");
  const [showAddForm, setShowAddForm] = useState(false);

  const today = startOfDay(new Date());

  const processedItems = items.map(item => {
    const dueDate = parseISO(item.dueDate);
    const isOverdue = isBefore(dueDate, today) && item.status === "pending";
    if (isOverdue && item.status === "pending") {
      return { ...item, status: "missed" as const };
    }
    return item;
  });

  const upcomingItems = processedItems.filter(item => item.status === "pending");
  const completedItems = processedItems.filter(item => item.status === "completed");
  const missedItems = processedItems.filter(item => item.status === "missed");

  const handleAddItem = () => {
    if (!newTitle.trim() || !newDueDate) return;
    const pointValue = parseInt(newPoints) || 0;
    const penaltyValue = parseInt(newPenalty) || 0;
    const newItem: StoredDueDateItem = {
      id: `due-${Date.now()}`,
      title: newTitle.trim(),
      dueDate: newDueDate,
      pointValue,
      penaltyValue,
      status: "pending",
    };
    onItemsChange([...items, newItem]);
    setNewTitle("");
    setNewDueDate("");
    setNewPoints("10");
    setNewPenalty("10");
    setShowAddForm(false);
  };

  const handleComplete = (id: string) => {
    onItemsChange(
      items.map(item =>
        item.id === id
          ? { ...item, status: "completed" as const, completedAt: new Date().toISOString() }
          : item
      )
    );
  };

  const handleUncomplete = (id: string) => {
    onItemsChange(
      items.map(item =>
        item.id === id
          ? { ...item, status: "pending" as const, completedAt: undefined }
          : item
      )
    );
  };

  const handleDelete = (id: string) => {
    onItemsChange(items.filter(item => item.id !== id));
  };

  const getDaysUntil = (dueDate: string) => {
    const due = parseISO(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const renderItem = (item: StoredDueDateItem) => {
    const daysUntil = getDaysUntil(item.dueDate);
    const isUrgent = item.status === "pending" && daysUntil <= 2 && daysUntil >= 0;
    const isMissed = item.status === "missed";
    const isCompleted = item.status === "completed";

    return (
      <div
        key={item.id}
        className={cn(
          "flex items-center gap-3 py-2 px-2 rounded-md hover-elevate group",
          isCompleted && "opacity-60",
          isMissed && "bg-destructive/10"
        )}
        data-testid={`due-date-item-${item.id}`}
      >
        {isCompleted ? (
          <Button
            size="icon"
            variant="ghost"
            className="h-5 w-5 rounded-full bg-chart-1 hover:bg-chart-1/80 flex items-center justify-center p-0"
            onClick={() => handleUncomplete(item.id)}
            data-testid={`button-uncomplete-due-${item.id}`}
          >
            <Check className="h-3 w-3 text-white" />
          </Button>
        ) : isMissed ? (
          <AlertTriangle className="h-5 w-5 text-destructive" />
        ) : (
          <Button
            size="icon"
            variant="ghost"
            className="h-5 w-5"
            onClick={() => handleComplete(item.id)}
            data-testid={`button-complete-due-${item.id}`}
          >
            <Check className="h-3 w-3" />
          </Button>
        )}
        <div className="flex-1 min-w-0">
          <span
            className={cn(
              "text-sm block truncate",
              isCompleted && "line-through"
            )}
          >
            {item.title}
          </span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {format(parseISO(item.dueDate), "MMM d, yyyy")}
            {item.status === "pending" && (
              <Badge
                variant={isUrgent ? "destructive" : "secondary"}
                className="text-xs ml-1"
              >
                {daysUntil === 0 ? "Today" : daysUntil === 1 ? "Tomorrow" : `${daysUntil}d`}
              </Badge>
            )}
          </span>
        </div>
        <div className="text-right">
          {isCompleted && (
            <span className="font-mono text-sm text-chart-1">+{item.pointValue}</span>
          )}
          {isMissed && (
            <span className="font-mono text-sm text-destructive">-{item.penaltyValue}</span>
          )}
          {item.status === "pending" && (
            <span className="font-mono text-xs text-muted-foreground">
              +{item.pointValue} / -{item.penaltyValue}
            </span>
          )}
        </div>
        {!isDemo && (
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => handleDelete(item.id)}
            data-testid={`button-delete-due-${item.id}`}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  };

  const earnedPoints = completedItems.reduce((sum, item) => sum + item.pointValue, 0);
  const lostPoints = missedItems.reduce((sum, item) => sum + item.penaltyValue, 0);

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base font-medium">Due Dates</CardTitle>
          <div className="flex items-center gap-2">
            {upcomingItems.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {upcomingItems.length} pending
              </Badge>
            )}
            {!isDemo && (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setShowAddForm(!showAddForm)}
                data-testid="button-due-dates-add"
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">Track deadlines and earn points for on-time completion</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {showAddForm && (
          <div className="space-y-2 p-3 bg-muted/50 rounded-md">
            <Input
              placeholder="What's due?"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              data-testid="input-due-date-title"
            />
            <div className="flex gap-2">
              <Input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="flex-1"
                data-testid="input-due-date-date"
              />
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">+</span>
                <Input
                  type="number"
                  placeholder="Pts"
                  value={newPoints}
                  onChange={(e) => setNewPoints(e.target.value)}
                  className="w-14"
                  min={0}
                  data-testid="input-due-date-points"
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">-</span>
                <Input
                  type="number"
                  placeholder="Pen"
                  value={newPenalty}
                  onChange={(e) => setNewPenalty(e.target.value)}
                  className="w-14"
                  min={0}
                  data-testid="input-due-date-penalty"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleAddItem}
                disabled={!newTitle.trim() || !newDueDate}
                data-testid="button-due-date-save"
              >
                Add
              </Button>
            </div>
          </div>
        )}

        {processedItems.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No due dates set
          </p>
        ) : (
          <div className="space-y-3">
            {upcomingItems.length > 0 && (
              <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Upcoming</span>
                {upcomingItems.map(renderItem)}
              </div>
            )}
            {missedItems.length > 0 && (
              <div className="space-y-1">
                <span className="text-xs font-medium text-destructive uppercase tracking-wide">Missed</span>
                {missedItems.map(renderItem)}
              </div>
            )}
            {completedItems.length > 0 && (
              <div className="space-y-1">
                <span className="text-xs font-medium text-chart-1 uppercase tracking-wide">Completed</span>
                {completedItems.map(renderItem)}
              </div>
            )}
          </div>
        )}

        {(earnedPoints > 0 || lostPoints > 0) && (
          <div className="pt-2 border-t space-y-1">
            {earnedPoints > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">On-time completions</span>
                <span className="font-mono font-medium text-chart-1">+{earnedPoints}</span>
              </div>
            )}
            {lostPoints > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Missed deadlines</span>
                <span className="font-mono font-medium text-destructive">-{lostPoints}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm font-medium pt-1 border-t">
              <span>Net</span>
              <span
                className={cn(
                  "font-mono",
                  earnedPoints - lostPoints >= 0 ? "text-chart-1" : "text-destructive"
                )}
              >
                {earnedPoints - lostPoints >= 0 ? "+" : ""}{earnedPoints - lostPoints}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
