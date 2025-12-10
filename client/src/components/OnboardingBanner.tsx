import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Rocket, Sparkles, AlertCircle } from "lucide-react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useJourneyDialog } from "./StartJourneyButton";

export default function OnboardingBanner() {
  const { isOnboarding } = useOnboarding();
  const { openDialog } = useJourneyDialog();

  if (!isOnboarding) {
    return null;
  }

  return (
    <div className="bg-primary/15 border-b border-primary/30 px-4 py-3">
      <div className="flex items-center justify-between gap-4 flex-wrap max-w-7xl mx-auto">
        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant="outline" className="border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400 gap-1">
            <AlertCircle className="h-3 w-3" />
            Demo Mode
          </Badge>
          <span className="text-sm text-muted-foreground" data-testid="text-onboarding-banner">
            You're viewing sample data to explore the app. This is not your real data.
          </span>
        </div>
        <Button 
          size="sm"
          onClick={openDialog}
          data-testid="button-start-journey-banner"
          className="gap-2"
        >
          <Rocket className="h-4 w-4" />
          Start My Journey
          <Sparkles className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
