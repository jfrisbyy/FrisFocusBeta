import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Calendar, Pencil, Check, X, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CurrentWeekSettingsProps {
  weekRange: string;
  note: string;
  isCustomGoalWeek: boolean;
  customGoal?: number;
  defaultGoal: number;
  onUpdate: (note: string, isCustomGoalWeek: boolean, customGoal?: number) => void;
}

export default function CurrentWeekSettings({
  weekRange,
  note,
  isCustomGoalWeek,
  customGoal,
  defaultGoal,
  onUpdate,
}: CurrentWeekSettingsProps) {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [noteInput, setNoteInput] = useState(note);
  const [customGoalEnabled, setCustomGoalEnabled] = useState(isCustomGoalWeek);
  const [customGoalInput, setCustomGoalInput] = useState(customGoal?.toString() || "");

  const handleEdit = () => {
    setNoteInput(note);
    setCustomGoalEnabled(isCustomGoalWeek);
    setCustomGoalInput(customGoal?.toString() || defaultGoal.toString());
    setEditing(true);
  };

  const handleSave = () => {
    const newCustomGoal = customGoalEnabled ? parseInt(customGoalInput, 10) || defaultGoal : undefined;
    onUpdate(noteInput, customGoalEnabled, newCustomGoal);
    setEditing(false);
    toast({
      title: "Week settings updated",
      description: "Your current week settings have been saved",
    });
  };

  const handleCancel = () => {
    setEditing(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          This Week
          <span className="text-xs text-muted-foreground font-normal">({weekRange})</span>
        </CardTitle>
        {!editing && (
          <Button size="icon" variant="ghost" onClick={handleEdit} data-testid="button-edit-week-settings">
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {editing ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="week-note">Week Note</Label>
              <Textarea
                id="week-note"
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder="e.g., Focus on fitness this week..."
                rows={2}
                className="resize-none"
                data-testid="input-week-note"
              />
            </div>
            
            <div className="flex items-center justify-between gap-4 py-2">
              <div className="space-y-0.5">
                <Label htmlFor="custom-goal-toggle" className="text-sm">Custom Goal Week</Label>
                <p className="text-xs text-muted-foreground">Set a different goal for this week</p>
              </div>
              <Switch
                id="custom-goal-toggle"
                checked={customGoalEnabled}
                onCheckedChange={setCustomGoalEnabled}
                data-testid="switch-custom-goal"
              />
            </div>
            
            {customGoalEnabled && (
              <div className="space-y-2">
                <Label htmlFor="custom-goal-value">Custom Weekly Goal</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="custom-goal-value"
                    type="number"
                    value={customGoalInput}
                    onChange={(e) => setCustomGoalInput(e.target.value)}
                    className="w-24 font-mono"
                    min={1}
                    data-testid="input-custom-goal"
                  />
                  <span className="text-sm text-muted-foreground">points</span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <Button onClick={handleSave} size="sm" data-testid="button-save-week-settings">
                <Check className="h-4 w-4 mr-1" />
                Save
              </Button>
              <Button onClick={handleCancel} size="sm" variant="outline" data-testid="button-cancel-week-settings">
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            </div>
          </>
        ) : (
          <>
            {note ? (
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-sm text-muted-foreground" data-testid="text-week-note">{note}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">No note for this week</p>
            )}
            
            {isCustomGoalWeek && customGoal && (
              <div className="flex items-center gap-2 pt-2 border-t">
                <span className="text-xs text-muted-foreground">Custom Goal:</span>
                <span className="text-sm font-mono font-semibold">{customGoal}</span>
                <span className="text-xs text-muted-foreground">points</span>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
