import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { ChevronRight, ChevronLeft, MessageCircle, X, Sparkles, Clock, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { OnboardingPage, getCardById, getOnboardingContentForAI } from "@/lib/onboardingCards";
import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { nanoid } from "nanoid";

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
  } = useOnboarding();

  // Inline chat state
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
        <Card 
          className={cn(
            "w-full max-w-md border-l-4 shadow-lg flex flex-col",
            "border-l-amber-500 bg-amber-500/5"
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
