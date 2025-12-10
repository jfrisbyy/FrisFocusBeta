import { Button } from "@/components/ui/button";
import { Rocket, Sparkles } from "lucide-react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useJourneyDialog } from "@/contexts/JourneyDialogContext";

export default function StartJourneyButton() {
  const { isOnboarding } = useOnboarding();
  const { openDialog } = useJourneyDialog();

  if (!isOnboarding) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button
        size="lg"
        className="gap-2 shadow-lg"
        onClick={openDialog}
        data-testid="button-start-journey"
      >
        <Rocket className="h-5 w-5" />
        Start My Journey
        <Sparkles className="h-4 w-4" />
      </Button>
    </div>
  );
}
