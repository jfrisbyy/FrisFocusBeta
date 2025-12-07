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
import { Zap } from "lucide-react";

export interface BoosterRule {
  enabled: boolean;
  timesRequired: number;
  period: "week" | "month";
  bonusPoints: number;
}

interface BoosterRuleConfigProps {
  rule: BoosterRule;
  onChange: (rule: BoosterRule) => void;
  taskName?: string;
}

export const defaultBoosterRule: BoosterRule = {
  enabled: false,
  timesRequired: 3,
  period: "week",
  bonusPoints: 10,
};

export default function BoosterRuleConfig({
  rule,
  onChange,
  taskName,
}: BoosterRuleConfigProps) {
  const updateRule = (updates: Partial<BoosterRule>) => {
    onChange({ ...rule, ...updates });
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-chart-2" />
          <Label htmlFor="booster-enabled" className="text-base font-medium">
            Booster Rule
          </Label>
        </div>
        <Switch
          id="booster-enabled"
          checked={rule.enabled}
          onCheckedChange={(enabled) => updateRule({ enabled })}
          data-testid="switch-booster-rule"
        />
      </div>

      {rule.enabled && (
        <div className="space-y-4 pt-2 border-t">
          <p className="text-sm text-muted-foreground">
            Earn bonus points when you complete this task multiple times
          </p>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="times-required" className="text-sm">
                Times Required
              </Label>
              <Input
                id="times-required"
                type="number"
                min={1}
                max={30}
                value={rule.timesRequired}
                onChange={(e) =>
                  updateRule({ timesRequired: parseInt(e.target.value) || 1 })
                }
                data-testid="input-times-required"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="period" className="text-sm">
                Period
              </Label>
              <Select
                value={rule.period}
                onValueChange={(value: "week" | "month") =>
                  updateRule({ period: value })
                }
              >
                <SelectTrigger id="period" data-testid="select-period">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Per Week</SelectItem>
                  <SelectItem value="month">Per Month</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bonus-points" className="text-sm">
                Bonus Points
              </Label>
              <Input
                id="bonus-points"
                type="number"
                min={1}
                max={100}
                value={rule.bonusPoints}
                onChange={(e) =>
                  updateRule({ bonusPoints: parseInt(e.target.value) || 1 })
                }
                data-testid="input-bonus-points"
              />
            </div>
          </div>

          <div className="rounded-md bg-chart-2/10 p-3 text-sm">
            <span className="text-chart-2 font-medium">Preview: </span>
            <span className="text-muted-foreground">
              Complete {taskName ? `"${taskName}"` : "this task"}{" "}
              <span className="font-mono font-semibold text-foreground">
                {rule.timesRequired}
              </span>{" "}
              times per {rule.period} to earn{" "}
              <span className="font-mono font-semibold text-chart-1">
                +{rule.bonusPoints}
              </span>{" "}
              bonus points
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}
