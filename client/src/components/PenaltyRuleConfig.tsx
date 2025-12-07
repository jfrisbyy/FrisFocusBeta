import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import type { PenaltyRule } from "@shared/schema";

interface PenaltyRuleConfigProps {
  rule: PenaltyRule;
  onChange: (rule: PenaltyRule) => void;
  taskName?: string;
}

export const defaultPenaltyRule: PenaltyRule = {
  enabled: false,
  timesThreshold: 2,
  penaltyPoints: 10,
  condition: "lessThan",
};

export default function PenaltyRuleConfig({
  rule,
  onChange,
  taskName,
}: PenaltyRuleConfigProps) {
  const updateRule = (updates: Partial<PenaltyRule>) => {
    onChange({ ...rule, ...updates });
  };

  return (
    <Card className="p-4 space-y-4 border-chart-3/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-chart-3" />
          <Label htmlFor="penalty-enabled" className="text-base font-medium">
            Weekly Penalty
          </Label>
        </div>
        <Switch
          id="penalty-enabled"
          checked={rule.enabled}
          onCheckedChange={(enabled) => updateRule({ enabled })}
          data-testid="switch-penalty-rule"
        />
      </div>

      {rule.enabled && (
        <div className="space-y-4 pt-2 border-t">
          <p className="text-sm text-muted-foreground">
            Apply a penalty if this task is not completed enough times per week
          </p>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="penalty-condition" className="text-sm">
                Condition
              </Label>
              <Select
                value={rule.condition}
                onValueChange={(value: "lessThan" | "moreThan") =>
                  updateRule({ condition: value })
                }
              >
                <SelectTrigger id="penalty-condition" data-testid="select-penalty-condition">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lessThan">Less than</SelectItem>
                  <SelectItem value="moreThan">More than</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="times-threshold" className="text-sm">
                Times Per Week
              </Label>
              <Input
                id="times-threshold"
                type="number"
                min={0}
                max={7}
                value={rule.timesThreshold}
                onChange={(e) =>
                  updateRule({ timesThreshold: parseInt(e.target.value) || 0 })
                }
                data-testid="input-times-threshold"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="penalty-points" className="text-sm">
                Penalty Points
              </Label>
              <Input
                id="penalty-points"
                type="number"
                min={1}
                max={100}
                value={rule.penaltyPoints}
                onChange={(e) =>
                  updateRule({ penaltyPoints: parseInt(e.target.value) || 1 })
                }
                data-testid="input-penalty-points"
              />
            </div>
          </div>

          <div className="rounded-md bg-chart-3/10 p-3 text-sm">
            <span className="text-chart-3 font-medium">Preview: </span>
            <span className="text-muted-foreground">
              If {taskName ? `"${taskName}"` : "this task"} is completed{" "}
              <span className="font-medium text-foreground">
                {rule.condition === "lessThan" ? "less than" : "more than"}
              </span>{" "}
              <span className="font-mono font-semibold text-foreground">
                {rule.timesThreshold}
              </span>{" "}
              times per week, apply{" "}
              <span className="font-mono font-semibold text-chart-3">
                -{rule.penaltyPoints}
              </span>{" "}
              penalty
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}
