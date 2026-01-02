import { useState, useRef, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { ChevronRight, ChevronLeft, MessageCircle, X, Sparkles, Clock, Send, Loader2, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { OnboardingPage, getCardById, getOnboardingContentForAI, SkipCheckKey, mainOnboardingCards, pageWalkthroughCards } from "@/lib/onboardingCards";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { nanoid } from "nanoid";
import confetti from "canvas-confetti";
import type { Season, Category, Task, Milestone } from "@shared/schema";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

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

export function OnboardingOverlay() {
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
    skipCurrentCard,
    activePageWalkthrough,
    isFinalCard,
  } = useOnboarding();

  // Fetch data needed for skip checks - use same endpoints as rest of app
  const { data: seasons = [] } = useQuery<Season[]>({
    queryKey: ["/api/seasons"],
  });
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/habit/categories"],
  });
  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/habit/tasks"],
  });
  const { data: penalties = [] } = useQuery<{ id: string }[]>({
    queryKey: ["/api/habit/penalties"],
  });
  const { data: milestones = [] } = useQuery<Milestone[]>({
    queryKey: ["/api/milestones"],
  });
  const { data: goals = [] } = useQuery<{ id: string }[]>({
    queryKey: ["/api/fitness/goals"],
  });
  
  // For todos and day logs, check ALL historical data (not just today)
  // This ensures users who completed these steps on a previous day can skip during replay
  const { data: allTodos = [] } = useQuery<{ id: string }[]>({
    queryKey: ["/api/habit/all-daily-todos"],
  });
  
  // Check if ANY day log exists (uses existing /api/habit/logs endpoint with no date filter)
  const { data: allDayLogs = [] } = useQuery<{ id: string }[]>({
    queryKey: ["/api/habit/logs"],
  });

  // Check if the current card's skipCheck condition is met
  const canSkipCurrentCard = useMemo(() => {
    if (!currentCard?.skipCheck) return false;
    
    const skipCheckMap: Record<SkipCheckKey, boolean> = {
      hasSeasons: seasons.length > 0,
      hasCategories: categories.length > 0,
      hasTasks: tasks.length > 0,
      hasPenalties: penalties.length > 0,
      hasTodos: allTodos.length > 0,
      hasDaySaved: allDayLogs.length > 0,
      hasMilestones: milestones.length > 0,
      hasGoalSet: goals.length > 0,
    };
    
    return skipCheckMap[currentCard.skipCheck] ?? false;
  }, [currentCard, seasons, categories, tasks, penalties, allTodos, allDayLogs, milestones, goals]);

  // Inline chat state
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Trigger confetti celebration when final card appears (after all walkthrough cards completed)
  useEffect(() => {
    if (isFinalCard) {
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          clearInterval(interval);
          return;
        }

        const particleCount = 50 * (timeLeft / duration);

        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [isFinalCard]);
  
  // Calculate relative card position for display
  const cardDisplayInfo = useMemo(() => {
    if (!currentCardId) return { current: 0, total: 0 };
    
    if (activePageWalkthrough) {
      const pageCards = pageWalkthroughCards[activePageWalkthrough];
      const currentIndex = pageCards.indexOf(currentCardId);
      if (currentIndex >= 0) {
        return {
          current: currentIndex + 1,
          total: pageCards.length,
        };
      }
    }
    
    // For main onboarding, show position in main cards (1-27)
    const mainIndex = mainOnboardingCards.indexOf(currentCardId);
    if (mainIndex >= 0) {
      return {
        current: mainIndex + 1,
        total: mainOnboardingCards.length,
      };
    }
    
    // Fallback for cards not in standard sequences - show just the card number
    return {
      current: currentCardId,
      total: 0, // 0 signals to hide "of X" display
    };
  }, [currentCardId, activePageWalkthrough]);

  const sendMessageMutation = useMutation({
    mutationFn: async ({ message, history }: { message: string; history: ChatMessage[] }) => {
      // Add onboarding context to the message
      const onboardingContext = getOnboardingContentForAI();
      const systemContext = `The user is currently going through onboarding and is on card ${currentCardId}. Here is all the onboarding content for context:\n\n${onboardingContext}\n\nNow answer their question:`;
      
      const response = await apiRequest("POST", "/api/ai/insights", {
        message: `${systemContext}\n\n${message}`,
        history: history.map(m => ({ role: m.role, content: m.content })),
      });
      return response.json();
    },
    onSuccess: (data) => {
      const assistantMessage: ChatMessage = {
        id: nanoid(),
        role: "assistant",
        content: data.message || data.content || "",
      };
      setChatMessages(prev => [...prev, assistantMessage]);
    },
  });

  const handleSendMessage = () => {
    if (!chatInput.trim() || sendMessageMutation.isPending) return;

    const userMessage: ChatMessage = {
      id: nanoid(),
      role: "user",
      content: chatInput.trim(),
    };
    
    const updatedMessages = [...chatMessages, userMessage];
    setChatMessages(updatedMessages);
    setChatInput("");
    
    sendMessageMutation.mutate({ message: chatInput.trim(), history: updatedMessages });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleBackToCards = () => {
    setShowChat(false);
  };

  const handleOpenChat = () => {
    setShowChat(true);
  };

  // Render final card when all walkthroughs completed
  if (isFinalCard) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
        <Card 
          className="w-full max-w-md border-l-4 border-l-primary shadow-xl bg-card"
          data-testid="card-onboarding-final"
        >
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-primary/10">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <CardTitle className="text-lg">Journey Complete!</CardTitle>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 -mt-1 -mr-2"
                onClick={() => completeOnboarding()}
                data-testid="button-onboarding-final-dismiss"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Congratulations!</p>
          </CardHeader>

          <CardContent className="space-y-3">
            <p className="text-sm text-foreground leading-relaxed">
              You've explored every corner of FrisFocus. From building your first season to understanding recognition, you now have the full picture.
            </p>
            <p className="text-sm text-foreground leading-relaxed">
              This isn't the end — it's the beginning. The tools are yours. The structure is set. Now it's about showing up, one day at a time.
            </p>
            <p className="text-sm text-foreground leading-relaxed">
              Go build something you're proud of.
            </p>
          </CardContent>

          <CardFooter className="pt-4 border-t border-border">
            <Button 
              className="w-full"
              onClick={() => {
                completeOnboarding();
              }}
              data-testid="button-onboarding-final-complete"
            >
              Let's Go
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
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

  // Render inline chat view
  if (showChat) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
        <Card 
          className={cn(
            "w-full max-w-md border-l-4 shadow-xl flex flex-col bg-card",
            "border-l-amber-500"
          )}
          style={{ maxHeight: "80vh" }}
          data-testid="card-onboarding-chat"
        >
          <CardHeader className="pb-2 flex-shrink-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleBackToCards}
                  data-testid="button-chat-back"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="p-1.5 rounded-md bg-amber-500/10">
                  <MessageCircle className="h-4 w-4 text-amber-500" />
                </div>
                <CardTitle className="text-lg">Ask Coach</CardTitle>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 -mt-1 -mr-2"
                onClick={handleDismiss}
                data-testid="button-chat-dismiss"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground pl-10">
              Ask me anything about FrisFocus
            </p>
          </CardHeader>

          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-64 px-4">
              {chatMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-8 text-center">
                  <MessageCircle className="h-8 w-8 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Ask me anything about FrisFocus!
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    I can help explain features, give tips, or answer questions.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 py-3">
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex",
                        msg.role === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        )}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {sendMessageMutation.isPending && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-lg px-3 py-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>
          </CardContent>

          <CardFooter className="flex-shrink-0 border-t pt-3">
            <div className="flex w-full gap-2">
              <Textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your question..."
                className="min-h-[40px] max-h-[100px] resize-none text-sm"
                data-testid="input-chat-message"
              />
              <Button
                size="icon"
                onClick={handleSendMessage}
                disabled={!chatInput.trim() || sendMessageMutation.isPending}
                data-testid="button-chat-send"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Render normal onboarding card
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
      <Card 
        className={cn(
          "w-full max-w-md border-l-4 shadow-xl bg-card",
          borderColor
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
            {isFinalCard 
              ? "Congratulations!" 
              : cardDisplayInfo.total > 0 
                ? `Card ${cardDisplayInfo.current} of ${cardDisplayInfo.total}`
                : `Card ${cardDisplayInfo.current}`}
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
            <div className="flex flex-col w-full gap-2">
              <div className="flex items-center justify-between w-full gap-2">
                <p className="text-xs text-muted-foreground">
                  {canSkipCurrentCard ? "You've already done this!" : "Complete the action to continue"}
                </p>
                <Button 
                  onClick={minimizeForAction}
                  data-testid="button-onboarding-do-now"
                >
                  I'll do this now
                </Button>
              </div>
              {canSkipCurrentCard && (
                <Button 
                  variant="secondary"
                  onClick={skipCurrentCard}
                  className="w-full"
                  data-testid="button-onboarding-skip-done"
                >
                  <SkipForward className="h-4 w-4 mr-2" />
                  Skip - Already Done
                </Button>
              )}
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

          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenChat}
            className="w-full mt-2"
            data-testid="button-onboarding-ask-coach"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Ask Coach
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export function OnboardingMinimizedIndicator() {
  const { isMinimized, currentCardId, showOnboarding, waitingForTrigger, skipCurrentCard } = useOnboarding();

  const card = isMinimized && currentCardId ? getCardById(currentCardId) : null;
  const hasSkipCheck = !!card?.skipCheck;

  // Only fetch skip check data when minimized AND current card has a skipCheck
  const { data: seasons = [] } = useQuery<Season[]>({
    queryKey: ["/api/seasons"],
    enabled: isMinimized && hasSkipCheck,
  });
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/habit/categories"],
    enabled: isMinimized && hasSkipCheck,
  });
  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/habit/tasks"],
    enabled: isMinimized && hasSkipCheck,
  });
  const { data: penalties = [] } = useQuery<{ id: string }[]>({
    queryKey: ["/api/habit/penalties"],
    enabled: isMinimized && hasSkipCheck,
  });
  const { data: milestones = [] } = useQuery<Milestone[]>({
    queryKey: ["/api/milestones"],
    enabled: isMinimized && hasSkipCheck,
  });
  const { data: goals = [] } = useQuery<{ id: string }[]>({
    queryKey: ["/api/fitness/goals"],
    enabled: isMinimized && hasSkipCheck,
  });
  const { data: allTodos = [] } = useQuery<{ id: string }[]>({
    queryKey: ["/api/habit/all-daily-todos"],
    enabled: isMinimized && hasSkipCheck,
  });
  const { data: allDayLogs = [] } = useQuery<{ id: string }[]>({
    queryKey: ["/api/habit/logs"],
    enabled: isMinimized && hasSkipCheck,
  });

  if (!isMinimized || !currentCardId || !card) {
    return null;
  }

  // Check if the current card's skipCheck condition is met
  const canSkipCurrentCard = (() => {
    if (!card.skipCheck) return false;
    
    const skipCheckMap: Record<SkipCheckKey, boolean> = {
      hasSeasons: seasons.length > 0,
      hasCategories: categories.length > 0,
      hasTasks: tasks.length > 0,
      hasPenalties: penalties.length > 0,
      hasTodos: allTodos.length > 0,
      hasDaySaved: allDayLogs.length > 0,
      hasMilestones: milestones.length > 0,
      hasGoalSet: goals.length > 0,
    };
    
    return skipCheckMap[card.skipCheck] ?? false;
  })();

  const triggerLabels: Record<string, string> = {
    seasonCreated: "Create a season",
    categoryCreated: "Create a category",
    taskCreated: "Create a task",
    penaltyCreated: "Create a penalty", 
    todoCreated: "Create a to-do",
    daySaved: "Save your day",
    milestoneCreated: "Create a milestone",
    aiTasksGenerated: "Generate tasks with AI",
  };

  const actionLabel = waitingForTrigger ? triggerLabels[waitingForTrigger] || "Complete the action" : "Complete the action";

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {canSkipCurrentCard && (
        <Button
          variant="secondary"
          size="sm"
          onClick={skipCurrentCard}
          className="shadow-lg flex items-center gap-2"
          data-testid="button-onboarding-minimized-skip"
        >
          <SkipForward className="h-4 w-4" />
          <span className="text-xs">Skip - Already Done</span>
        </Button>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={showOnboarding}
        className="shadow-lg flex items-center gap-2"
        data-testid="button-onboarding-minimized"
      >
        <Clock className="h-4 w-4 text-primary animate-pulse" />
        <span className="text-xs">{canSkipCurrentCard ? "View Tutorial" : `Waiting: ${actionLabel}`}</span>
      </Button>
    </div>
  );
}
