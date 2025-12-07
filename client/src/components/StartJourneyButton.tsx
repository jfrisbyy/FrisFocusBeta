import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Rocket, Sparkles } from "lucide-react";
import { useOnboarding } from "@/contexts/OnboardingContext";

export default function StartJourneyButton() {
  const { isOnboarding, startJourney } = useOnboarding();
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!isOnboarding) {
    return null;
  }

  const handleConfirm = () => {
    startJourney();
    setConfirmOpen(false);
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          size="lg"
          className="gap-2 shadow-lg"
          onClick={() => setConfirmOpen(true)}
          data-testid="button-start-journey"
        >
          <Rocket className="h-5 w-5" />
          Start My Journey
          <Sparkles className="h-4 w-4" />
        </Button>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-primary" />
              Ready to Start Your Journey?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  Right now you're seeing sample data to help you understand how the app works.
                </p>
                <p>
                  When you click "Start My Journey", all this sample data will be cleared and you'll start fresh. You'll be responsible for:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Setting up your own tasks and categories</li>
                  <li>Logging your daily activities</li>
                  <li>Creating badges and milestones</li>
                  <li>Adding journal entries</li>
                </ul>
                <p className="font-medium text-foreground">
                  This action cannot be undone. Are you ready to begin?
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-start-journey">
              Keep Exploring
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} data-testid="button-confirm-start-journey">
              <Rocket className="h-4 w-4 mr-2" />
              Start My Journey
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
