import { useLocation } from "wouter";
import { ChevronRight, MessageCircle, X, Sparkles, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { OnboardingPage, getCardById } from "@/lib/onboardingCards";
import { cn } from "@/lib/utils";

function renderTextWithBold(text: string): JSX.Element {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, idx) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={idx}>{part.slice(2, -2)}</strong>;
        }
        return <span key={idx}>{part}</span>;
      })}
    </>
  );
}

const pageColors: Record<OnboardingPage, string> = {
  dashboard: "border-l-primary",
  tasks: "border-l-green-500",
  daily: "border-l-blue-500",
  health: "border-l-rose-500",
  community: "border-l-violet-500",
  insights: "border-l-amber-500",
  journal: "border-l-cyan-500",
  badges: "border-l-yellow-500",
};

const pageBgColors: Record<OnboardingPage, string> = {
  dashboard: "bg-primary/5",
  tasks: "bg-green-500/5",
  daily: "bg-blue-500/5",
  health: "bg-rose-500/5",
  community: "bg-violet-500/5",
  insights: "bg-amber-500/5",
  journal: "bg-cyan-500/5",
  badges: "bg-yellow-500/5",
};

interface OnboardingOverlayProps {
  onAskCoach?: () => void;
}

export function OnboardingOverlay({ onAskCoach }: OnboardingOverlayProps) {
  const [, setLocation] = useLocation();
  const {
    currentCard,
    currentCardId,
    exploringMode,
    isMinimized,
    goToNextCard,
    goToCard,
    setExploringMode,
    hideOnboarding,
    minimizeForAction,
    completeOnboarding,
  } = useOnboarding();

  if (!currentCard || isMinimized) {
    return null;
  }

  const handlePrimaryAction = () => {
    const action = currentCard.showButtons?.primary?.action;
    
    if (action === "explore") {
      setExploringMode(true);
      goToNextCard();
    } else if (action === "navigate" && currentCard.showButtons?.primary?.navigateTo) {
      setLocation(currentCard.showButtons.primary.navigateTo);
      goToNextCard();
    } else if (action === "complete") {
      completeOnboarding();
    } else {
      goToNextCard();
    }
  };

  const handleSecondaryAction = () => {
    const action = currentCard.showButtons?.secondary?.action;
    
    if (action === "skip" || action === "complete") {
      completeOnboarding();
    } else if (action === "next") {
      if (currentCardId === 2) {
        setExploringMode(false);
        goToCard(4);
      } else {
        goToNextCard();
      }
    }
  };

  const handleContinue = () => {
    goToNextCard();
  };

  const handleDismiss = () => {
    hideOnboarding();
  };

  const borderColor = pageColors[currentCard.page];
  const bgColor = pageBgColors[currentCard.page];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <Card 
        className={cn(
          "w-full max-w-md border-l-4 shadow-lg",
          borderColor,
          bgColor
        )}
        data-testid="card-onboarding"
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-primary/10">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <CardTitle className="text-lg">{currentCard.title}</CardTitle>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 -mt-1 -mr-2"
              onClick={handleDismiss}
              data-testid="button-onboarding-dismiss"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Card {currentCardId} of 41
          </p>
        </CardHeader>

        <CardContent className="space-y-3">
          {currentCard.content.map((paragraph, idx) => (
            <p 
              key={idx} 
              className="text-sm text-foreground leading-relaxed"
            >
              {renderTextWithBold(paragraph)}
            </p>
          ))}
        </CardContent>

        <CardFooter className="flex flex-col gap-3 pt-4 border-t border-border">
          {currentCard.showButtons ? (
            <div className="flex flex-col w-full gap-2">
              {currentCard.showButtons.primary && (
                <Button 
                  onClick={handlePrimaryAction}
                  className="w-full"
                  data-testid="button-onboarding-primary"
                >
                  {currentCard.showButtons.primary.text}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
              {currentCard.showButtons.secondary && (
                <Button 
                  variant="ghost"
                  onClick={handleSecondaryAction}
                  className="w-full"
                  data-testid="button-onboarding-secondary"
                >
                  {currentCard.showButtons.secondary.text}
                </Button>
              )}
            </div>
          ) : currentCard.trigger && currentCard.trigger !== "immediate" && currentCard.trigger !== "manual" ? (
            <div className="flex items-center justify-between w-full gap-2">
              <p className="text-xs text-muted-foreground">
                Complete the action to continue
              </p>
              <Button 
                onClick={minimizeForAction}
                data-testid="button-onboarding-do-now"
              >
                I'll do this now
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full gap-2">
              <Button 
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                data-testid="button-onboarding-skip"
              >
                Skip for now
              </Button>
              <Button 
                onClick={handleContinue}
                data-testid="button-onboarding-continue"
              >
                Continue
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}

          {onAskCoach && (
            <Button
              variant="outline"
              size="sm"
              onClick={onAskCoach}
              className="w-full mt-2"
              data-testid="button-onboarding-ask-coach"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Ask Coach
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

export function OnboardingMinimizedIndicator() {
  const { isMinimized, currentCardId, showOnboarding, waitingForTrigger } = useOnboarding();

  if (!isMinimized || !currentCardId) {
    return null;
  }

  const card = getCardById(currentCardId);
  if (!card) return null;

  const triggerLabels: Record<string, string> = {
    seasonCreated: "Create a season",
    taskCreated: "Create a task",
    penaltyCreated: "Create a penalty", 
    daySaved: "Save your day",
    aiTasksGenerated: "Generate tasks with AI",
  };

  const actionLabel = waitingForTrigger ? triggerLabels[waitingForTrigger] || "Complete the action" : "Complete the action";

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        variant="outline"
        size="sm"
        onClick={showOnboarding}
        className="shadow-lg flex items-center gap-2"
        data-testid="button-onboarding-minimized"
      >
        <Clock className="h-4 w-4 text-primary animate-pulse" />
        <span className="text-xs">Waiting: {actionLabel}</span>
      </Button>
    </div>
  );
}
