import { useLocation } from "wouter";
import { ChevronRight, MessageCircle, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { OnboardingPage } from "@/lib/onboardingCards";
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
};

const pageBgColors: Record<OnboardingPage, string> = {
  dashboard: "bg-primary/5",
  tasks: "bg-green-500/5",
  daily: "bg-blue-500/5",
  health: "bg-rose-500/5",
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
    goToNextCard,
    goToCard,
    setExploringMode,
    hideOnboarding,
    completeOnboarding,
  } = useOnboarding();

  if (!currentCard) {
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
            Card {currentCardId} of 29
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
                Complete the action above to continue
              </p>
              <Button 
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                data-testid="button-onboarding-later"
              >
                I'll do it later
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
