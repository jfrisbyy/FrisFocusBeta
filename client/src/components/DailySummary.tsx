import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { HelpIndicator, helpContent } from "@/components/HelpIndicator";

interface DailySummaryProps {
  positivePoints: number;
  negativePoints: number;
  todoPoints?: number;
  checkInBonus?: number;
  notes: string;
  onNotesChange: (notes: string) => void;
  onSave: () => void;
  isSaving?: boolean;
}

export default function DailySummary({
  positivePoints,
  negativePoints,
  todoPoints = 0,
  checkInBonus = 0,
  notes,
  onNotesChange,
  onSave,
  isSaving,
}: DailySummaryProps) {
  const netTotal = positivePoints + negativePoints + todoPoints + checkInBonus;

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
