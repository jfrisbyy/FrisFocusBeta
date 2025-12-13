import { useState } from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { DashboardPreferences } from "@shared/schema";

interface DashboardSettingsProps {
  preferences: DashboardPreferences;
  onPreferencesChange: (preferences: DashboardPreferences) => void;
  isPending?: boolean;
}

const cardLabels: { key: keyof DashboardPreferences; label: string; description: string }[] = [
  { key: "weekTotal", label: "Week Total Points", description: "Show weekly points summary card" },
  { key: "streaks", label: "Streaks", description: "Show day and week streak counters" },
  { key: "badges", label: "Earned Badges", description: "Show badges you've earned" },
  { key: "weeklyTable", label: "Weekly Table", description: "Show daily points breakdown" },
  { key: "alerts", label: "Alerts", description: "Show task priority alerts" },
  { key: "weeklyTodos", label: "Weekly To-Do List", description: "Show weekly todo items" },
  { key: "dueDates", label: "Due Dates", description: "Show upcoming due date items" },
  { key: "boosters", label: "Boosters", description: "Show active boosters and penalties" },
  { key: "milestones", label: "Milestones", description: "Show milestone goals" },
  { key: "recentWeeks", label: "Recent Weeks", description: "Show history of recent weeks" },
  { key: "circlesOverview", label: "Circles Overview", description: "Show circles scores and leaderboard" },
  { key: "journal", label: "Quick Journal", description: "Show quick journaling card" },
];

export default function DashboardSettings({
  preferences,
  onPreferencesChange,
  isPending = false,
}: DashboardSettingsProps) {
  const [open, setOpen] = useState(false);

  const handleToggle = (key: keyof DashboardPreferences) => {
    onPreferencesChange({
      ...preferences,
      [key]: !preferences[key],
    });
  };

  const handleShowAll = () => {
    const allTrue = cardLabels.reduce((acc, { key }) => {
      acc[key] = true;
      return acc;
    }, {} as DashboardPreferences);
    onPreferencesChange(allTrue);
  };

  const handleHideAll = () => {
    const allFalse = cardLabels.reduce((acc, { key }) => {
      acc[key] = false;
      return acc;
    }, {} as DashboardPreferences);
    onPreferencesChange(allFalse);
  };

  const visibleCount = Object.values(preferences).filter(Boolean).length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          data-testid="button-dashboard-settings"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Customize Dashboard</DialogTitle>
          <DialogDescription>
            Choose which cards to show on your dashboard ({visibleCount} of {cardLabels.length} visible)
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleShowAll}
            disabled={isPending}
            data-testid="button-show-all-cards"
          >
            Show All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleHideAll}
            disabled={isPending}
            data-testid="button-hide-all-cards"
          >
            Hide All
          </Button>
        </div>
        <div className="space-y-4">
          {cardLabels.map(({ key, label, description }) => (
            <div
              key={key}
              className="flex items-center justify-between gap-4"
            >
              <div className="flex-1">
                <Label htmlFor={`toggle-${key}`} className="text-sm font-medium">
                  {label}
                </Label>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
              <Switch
                id={`toggle-${key}`}
                checked={preferences[key]}
                onCheckedChange={() => handleToggle(key)}
                disabled={isPending}
                data-testid={`switch-card-${key}`}
              />
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
