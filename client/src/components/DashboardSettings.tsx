import { useState, useEffect } from "react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import type { DashboardPreferences } from "@shared/schema";

interface DashboardSettingsProps {
  preferences: DashboardPreferences;
  onPreferencesChange: (preferences: DashboardPreferences) => void;
  isPending?: boolean;
}

const cardLabels: Record<keyof DashboardPreferences, { label: string; description: string }> = {
  weekTotal: {
    label: "Week Total",
    description: "Shows your total points for the current week",
  },
  streaks: {
    label: "Streaks",
    description: "Shows your current day and week streaks",
  },
  badges: {
    label: "Earned Badges",
    description: "Shows badges you've earned and your progress",
  },
  weeklyTable: {
    label: "Weekly Table",
    description: "Shows daily points breakdown for the week",
  },
  alerts: {
    label: "Task Alerts",
    description: "Shows tasks you haven't completed recently",
  },
  weeklyTodos: {
    label: "Weekly To-Do List",
    description: "Shows your weekly to-do items",
  },
  dueDates: {
    label: "Due Dates",
    description: "Shows upcoming due dates and deadlines",
  },
  boosters: {
    label: "Boosters",
    description: "Shows bonus points from consistent habits",
  },
  milestones: {
    label: "Milestones",
    description: "Shows your life milestones and achievements",
  },
  recentWeeks: {
    label: "Recent Weeks",
    description: "Shows history of your recent weeks",
  },
  circlesOverview: {
    label: "Circles Overview",
    description: "Shows stats and activity from your circles",
  },
  journal: {
    label: "Quick Journal",
    description: "Write quick journal entries from the dashboard",
  },
};

export default function DashboardSettings({
  preferences,
  onPreferencesChange,
  isPending = false,
}: DashboardSettingsProps) {
  const [open, setOpen] = useState(false);
  const [localPrefs, setLocalPrefs] = useState<DashboardPreferences>(preferences);

  useEffect(() => {
    setLocalPrefs(preferences);
  }, [preferences]);

  const handleToggle = (key: keyof DashboardPreferences, checked: boolean) => {
    const newPrefs = { ...localPrefs, [key]: checked };
    setLocalPrefs(newPrefs);
    onPreferencesChange(newPrefs);
  };

  const cardKeys = Object.keys(cardLabels) as (keyof DashboardPreferences)[];

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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Dashboard Settings</DialogTitle>
          <DialogDescription>
            Choose which cards to display on your dashboard
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4 py-2">
            {cardKeys.map((key) => (
              <div
                key={key}
                className="flex items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <Label
                    htmlFor={`toggle-${key}`}
                    className="text-sm font-medium"
                  >
                    {cardLabels[key].label}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {cardLabels[key].description}
                  </p>
                </div>
                <Switch
                  id={`toggle-${key}`}
                  checked={localPrefs[key]}
                  onCheckedChange={(checked) => handleToggle(key, checked)}
                  disabled={isPending}
                  data-testid={`switch-${key}`}
                />
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
