import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save, Check, X, Folder } from "lucide-react";
import { cn } from "@/lib/utils";
import { HelpIndicator, helpContent } from "@/components/HelpIndicator";

interface CompletedTask {
  id: string;
  name: string;
  value: number;
}

interface JournalFolderOption {
  id: string;
  name: string;
  color: string;
}

interface DailySummaryProps {
  positivePoints: number;
  negativePoints: number;
  todoPoints?: number;
  checkInBonus?: number;
  completedTasks?: CompletedTask[];
  notes: string;
  onNotesChange: (notes: string) => void;
  onSave: () => void;
  isSaving?: boolean;
  folders?: JournalFolderOption[];
  selectedFolderId?: string | null;
  onFolderChange?: (folderId: string | null) => void;
}

export default function DailySummary({
  positivePoints,
  negativePoints,
  todoPoints = 0,
  checkInBonus = 0,
  completedTasks = [],
  notes,
  onNotesChange,
  onSave,
  isSaving,
  folders = [],
  selectedFolderId,
  onFolderChange,
}: DailySummaryProps) {
  const netTotal = positivePoints + negativePoints + todoPoints + checkInBonus;
  const positiveTasks = completedTasks.filter(t => t.value > 0);
  const negativeTasks = completedTasks.filter(t => t.value < 0);

  return (
    <Card className="sticky top-20">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-1">
          <CardTitle className="text-sm font-medium">Daily Summary</CardTitle>
          <HelpIndicator {...helpContent.dailyGoal} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Tasks</span>
            <span className="font-mono font-semibold text-chart-1">+{positivePoints}</span>
          </div>
          {positiveTasks.length > 0 && (
            <div className="pl-2 space-y-1">
              {positiveTasks.map(task => (
                <div key={task.id} className="flex items-center gap-2 text-xs text-muted-foreground" data-testid={`completed-task-${task.id}`}>
                  <Check className="h-3 w-3 text-chart-1 flex-shrink-0" />
                  <span className="truncate">{task.name}</span>
                  <span className="font-mono text-chart-1 ml-auto flex-shrink-0">+{task.value}</span>
                </div>
              ))}
            </div>
          )}
          {todoPoints > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">To-Do List</span>
              <span className="font-mono font-semibold text-chart-1">+{todoPoints}</span>
            </div>
          )}
          {checkInBonus > 0 && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">Check-in Bonus</span>
                <HelpIndicator {...helpContent.checkInBonus} />
              </div>
              <span className="font-mono font-semibold text-chart-1">+{checkInBonus}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Penalties</span>
            <span className="font-mono font-semibold text-chart-3">{negativePoints}</span>
          </div>
          {negativeTasks.length > 0 && (
            <div className="pl-2 space-y-1">
              {negativeTasks.map(task => (
                <div key={task.id} className="flex items-center gap-2 text-xs text-muted-foreground" data-testid={`penalty-task-${task.id}`}>
                  <X className="h-3 w-3 text-chart-3 flex-shrink-0" />
                  <span className="truncate">{task.name}</span>
                  <span className="font-mono text-chart-3 ml-auto flex-shrink-0">{task.value}</span>
                </div>
              ))}
            </div>
          )}
          <div className="border-t pt-2 flex items-center justify-between">
            <span className="font-medium">Total</span>
            <span
              className={cn(
                "font-mono text-xl font-bold",
                netTotal > 0 ? "text-chart-1" : netTotal < 0 ? "text-chart-3" : "text-foreground"
              )}
              data-testid="text-daily-total"
            >
              {netTotal > 0 ? `+${netTotal}` : netTotal}
            </span>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Journal</label>
          <Textarea
            placeholder="How was your day?"
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            className="resize-none text-sm"
            rows={3}
            data-testid="input-notes"
          />
          {folders.length > 0 && onFolderChange && (
            <Select
              value={selectedFolderId || "none"}
              onValueChange={(v) => onFolderChange(v === "none" ? null : v)}
            >
              <SelectTrigger className="text-sm" data-testid="select-journal-folder">
                <SelectValue placeholder="Save to folder..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none" data-testid="select-folder-none">
                  <span className="text-muted-foreground">No folder</span>
                </SelectItem>
                {folders.map((folder) => (
                  <SelectItem key={folder.id} value={folder.id} data-testid={`select-folder-${folder.id}`}>
                    <div className="flex items-center gap-2">
                      <Folder className="h-3 w-3" style={{ color: folder.color }} />
                      {folder.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <Button
          onClick={onSave}
          disabled={isSaving}
          className="w-full gap-2"
          data-testid="button-save"
        >
          <Save className="h-4 w-4" />
          {isSaving ? "Saving..." : "Save Day"}
        </Button>
      </CardContent>
    </Card>
  );
}
