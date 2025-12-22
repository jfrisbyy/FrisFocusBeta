import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, HelpCircle, Target, CheckSquare, Zap, Dumbbell, Users, Palette, TrendingUp, Sparkles, Rocket, PlayCircle, MessageCircle, Send, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { getOnboardingContentForAI } from "@/lib/onboardingCards";
import { nanoid } from "nanoid";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export type HelpCardId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

interface HelpCard {
  id: HelpCardId;
  title: string;
  subtitle: string;
  icon: typeof HelpCircle;
  content: {
    intro?: string;
    sections: {
      title?: string;
      items?: string[];
      text?: string;
    }[];
    outro?: string;
  };
}

const helpCards: HelpCard[] = [
  {
    id: 1,
    title: "Welcome",
    subtitle: "Welcome to FrisFocus",
    icon: Sparkles,
    content: {
      intro: "FrisFocus helps you organize your life around what actually matters and follow through with structure, accountability, and visibility.",
      sections: [
        {
          text: "This isn't about doing more. It's about doing what matters, consistently.",
        },
        {
          items: [
            "You can start solo or build with others.",
            "You can keep things simple or make it competitive.",
            "You can adjust anytime.",
          ],
        },
      ],
      outro: "There's no perfect setup — just one that fits you right now.",
    },
  },
  {
    id: 2,
    title: "Seasons",
    subtitle: "Seasons Give Direction",
    icon: Target,
    content: {
      intro: "Life doesn't stay static — your goals, responsibilities, and energy change over time. FrisFocus is built to move with you.",
      sections: [
        {
          text: "A Season represents a phase of your life, usually lasting a few months, where you define what matters right now — without locking yourself into a single path.",
        },
        {
          title: "A Season can include multiple priorities:",
          items: [
            "Fitness or body goals",
            "Athletic training or performance",
            "Discipline and consistency",
            "Mental clarity or balance",
            "Career, school, or personal growth",
          ],
        },
        {
          text: "Seasons aren't about narrowing your life down to one thing. They help you organize your effort around what's relevant in this chapter — and adjust as life shifts.",
        },
      ],
      outro: "Your Season doesn't need to be perfect. Clarity comes from action, not overplanning.",
    },
  },
  {
    id: 3,
    title: "Tasks & To-Dos",
    subtitle: "How Your Daily System Works",
    icon: CheckSquare,
    content: {
      intro: "",
      sections: [
        {
          title: "To-Dos, Milestones & Due Dates",
          text: "To-Dos are a flexible way to plan and organize your days. You can use them however it makes sense for you — whether that's tracking one-off items, outlining what you want to work on today, or keeping a running list of things to handle this week.",
        },
        {
          title: "You can create:",
          items: [
            "Daily to-dos for what you plan to tackle today",
            "Weekly to-dos for flexible or non-urgent items",
            "Milestones for larger short-term goals you're working toward",
            "Due dates for time-sensitive items like bills, assignments, or deadlines",
          ],
        },
        {
          text: "These tools give structure to real life without forcing everything into a habit.",
        },
        {
          title: "Daily & Weekly Point Goals",
          text: "You set a daily personal point goal and a weekly personal point goal. Completing repeatable tasks earns personal points that roll up toward those goals. Important actions should carry more weight than optional ones, so your scoring reflects what truly matters — especially on busy days.",
        },
        {
          title: "Breaking Habits & Reinforcing Good Ones",
          items: [
            "Add penalties for habits you're trying to reduce (awareness, not punishment)",
            "Add boosters that reward consistency, streaks, or hitting weekly goals repeatedly",
          ],
        },
        {
          text: "If you're unsure how to structure tasks, scoring, penalties, or milestones, AI can help you explore realistic setups based on your goals and lifestyle.",
        },
      ],
      outro: "You stay in control. AI supports your thinking — it doesn't replace it.",
    },
  },
  {
    id: 4,
    title: "Focus Points",
    subtitle: "The Universal Score",
    icon: Zap,
    content: {
      intro: "Focus Points are a separate, universal point system used to reflect outcomes and compare progress across people and groups. Unlike personal points, Focus Points are not tied to specific tasks.",
      sections: [
        {
          title: "They're earned by:",
          items: [
            "Hitting daily or weekly goals",
            "Staying consistent over time",
            "Completing workouts or training sessions",
            "Participating in Circles",
            "Winning challenges or competitions",
            "Reaching milestones",
          ],
        },
        {
          title: "Focus Points allow you to:",
          items: [
            "Compare progress without exposing your personal task system",
            "Compete fairly across different goals and sports",
            "Track momentum, not micromanagement",
          ],
        },
      ],
      outro: "Personal points are how you work. Focus Points are what the outcome looks like.",
    },
  },
  {
    id: 5,
    title: "Fitness & Sports",
    subtitle: "Built for Everyday Life and Serious Training",
    icon: Dumbbell,
    content: {
      intro: "FrisFocus includes a fully integrated fitness and sports system designed for everyone — from everyday people prioritizing their health to serious athletes training with intent.",
      sections: [
        {
          title: "Whether you're:",
          items: [
            "Focused on general health and movement",
            "Trying to lose, gain, or maintain weight",
            "Rebuilding consistency after time off",
            "Training casually for enjoyment",
            "Preparing for competition or performance",
          ],
        },
        {
          title: "You can track:",
          items: [
            "Workouts and strength training",
            "Cardio, conditioning, and endurance",
            "Nutrition and calorie intake",
            "Body metrics and long-term trends",
            "Sport-specific training and performance sessions",
          ],
        },
        {
          text: "Sports tracking is template-based and fully customizable. Basketball, running, swimming, and other sports use tailored fields — and you can edit or create your own templates to match how you train.",
        },
        {
          title: "AI is available to help you:",
          items: [
            "Clarify fitness or body goals at any level",
            "Estimate calories burned",
            "Estimate calories eaten",
            "Understand patterns in your data",
            "Adjust goals intelligently as training or life demands change",
          ],
        },
      ],
      outro: "Your fitness data stays connected to your broader life system — not isolated in a separate app. FrisFocus meets you where you are — and grows with you as your goals evolve.",
    },
  },
  {
    id: 6,
    title: "Community",
    subtitle: "Accountability, Circles & Competition",
    icon: Users,
    content: {
      intro: "FrisFocus works solo — but becomes more powerful with others.",
      sections: [
        {
          title: "You can create or join Circles with:",
          items: [
            "Friends",
            "Family",
            "Teams",
            "Classrooms",
            "Coaches and athletes",
            "Accountability partners",
          ],
        },
        {
          title: "Circles support:",
          items: [
            "Shared goals and milestones",
            "Badges and recognition",
            "Leaderboards and rankings",
            "One-on-one challenges",
            "Circle vs Circle competitions",
          ],
        },
        {
          title: "FrisFocus is also a full social platform. You can:",
          items: [
            "Post updates, reflections, or wins to the feed",
            "Journal publicly or privately",
            "Interact with friends and Circles",
            "Send direct messages for support, planning, or accountability",
          ],
        },
      ],
      outro: "Competition is optional and fully customizable. Use it when it motivates you. Turn it down when it doesn't. FrisFocus adapts to how you work best — whether that's quiet consistency or visible competition.",
    },
  },
  {
    id: 7,
    title: "Customization",
    subtitle: "Make It Yours",
    icon: Palette,
    content: {
      intro: "FrisFocus is built to adapt to you.",
      sections: [
        {
          title: "You can:",
          items: [
            "Customize your dashboard by adding or removing cards",
            "Focus only on what's relevant to you",
            "Switch between light and dark mode",
            "Personalize your welcome message",
            "Choose what insights appear first",
          ],
        },
        {
          text: "You can also send cheerlines — short encouragement messages — to friends or Circle members. Cheerlines show up directly on their dashboard as a reminder that someone's rooting for them.",
        },
      ],
      outro: "Your system should feel personal, flexible, and supportive — not rigid.",
    },
  },
  {
    id: 8,
    title: "Reflect & Learn",
    subtitle: "Progress Comes From Awareness",
    icon: TrendingUp,
    content: {
      intro: "",
      sections: [
        {
          title: "Use journaling, summaries, and insights to reflect on:",
          items: [
            "What's working",
            "What feels heavy",
            "Where energy is leaking",
            "What needs adjusting",
          ],
        },
      ],
      outro: "FrisFocus is designed to evolve with you. You're allowed to refine your setup, reset goals, and rebuild structure whenever life changes.",
    },
  },
  {
    id: 9,
    title: "Get Started",
    subtitle: "Build the System That Fits Your Life",
    icon: Sparkles,
    content: {
      intro: "",
      sections: [
        {
          items: [
            "You don't need to use every feature.",
            "You don't need to get it perfect.",
            "Start where you are.",
            "Use what helps.",
            "Adjust when needed.",
          ],
        },
      ],
      outro: "FrisFocus is here to support progress — not pressure.",
    },
  },
  {
    id: 10,
    title: "Getting Started",
    subtitle: "Getting Started",
    icon: Rocket,
    content: {
      intro: "You don't need to set everything up at once. Start with the basics — you can always build more later.",
      sections: [
        {
          title: "Step 1: Create Your Season",
          text: "Give your current phase of life a name. This helps anchor your goals without locking you into anything permanent.",
        },
        {
          title: "Step 2: Add Core Tasks",
          text: "Create a set of repeatable habits that matter right now — fitness, routines, focus, or recovery. Score them based on importance, not how often they happen, or use AI to help you figure out what those tasks should look like.",
        },
        {
          title: "Step 3: Set Your Point Goals",
          text: "Choose a realistic daily and weekly personal point goal. This gives you a clear target to aim for each day.",
        },
        {
          title: "Step 4: Use To-Dos, Milestones, and Schedules to Plan Your Days",
          items: [
            "Add daily to-dos for what you plan to work on today",
            "Create weekly to-dos for flexible items you'll get to throughout the week",
            "Track milestones for bigger near-term goals",
            "Set due dates for bills, assignments, or deadlines",
            "Build schedule templates for different types of days — like a Monday routine, work-from-home day, training day, or rest day",
          ],
        },
        {
          text: "These tools help you plan realistically without turning everything into a habit. Use them as lightly or as structured as you want — FrisFocus adapts to how you think and plan.",
        },
        {
          title: "Step 5: Check In Daily",
          items: [
            "Toggle completed tasks",
            "Update your to-do list",
            "Log fitness or training if relevant",
            "See how you're trending toward your goals",
          ],
        },
        {
          text: "That's all you need to begin. From there, feel free to explore. FrisFocus includes a lot of powerful features — fitness tracking, AI support, Circles, competition, journaling, milestones, schedule templates, and more.",
        },
        {
          text: "You don't need to use everything. Explore what's interesting, ignore what isn't, and add tools as they become useful.",
        },
      ],
      outro: "Start simple. Stay consistent. Build the system as your life evolves.",
    },
  },
];

interface HelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filterCards?: HelpCardId[];
  startCard?: HelpCardId;
  showReplayTutorial?: boolean;
  simplified?: boolean;
}

export function HelpDialog({ open, onOpenChange, filterCards, startCard, showReplayTutorial = true, simplified = false }: HelpDialogProps) {
  const { showOnboarding, onboardingComplete, completedCardIds, hasStartedJourney } = useOnboarding();
  const displayCards = filterCards 
    ? helpCards.filter(card => filterCards.includes(card.id))
    : helpCards;
  
  // Chat state for simplified mode
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (showChat) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, showChat]);

  const sendMessageMutation = useMutation({
    mutationFn: async ({ message, history }: { message: string; history: ChatMessage[] }) => {
      const onboardingContext = getOnboardingContentForAI();
      const systemContext = `The user is viewing the help dialog and wants to learn more about FrisFocus. Here is all the app content for context:\n\n${onboardingContext}\n\nNow answer their question:`;
      
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

  const handleReplayTutorial = () => {
    onOpenChange(false);
    showOnboarding();
  };

  const handleAskAI = () => {
    setShowChat(true);
  };

  const handleBackFromChat = () => {
    setShowChat(false);
  };
  
  const initialIndex = startCard 
    ? displayCards.findIndex(card => card.id === startCard)
    : 0;
  
  const [currentIndex, setCurrentIndex] = useState(Math.max(0, initialIndex));
  
  // Reset to initial index when dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      const newIndex = startCard 
        ? displayCards.findIndex(card => card.id === startCard)
        : 0;
      setCurrentIndex(Math.max(0, newIndex));
      setShowChat(false);
    }
    onOpenChange(newOpen);
  };

  const currentCard = displayCards[currentIndex];
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < displayCards.length - 1;
  const Icon = currentCard?.icon || HelpCircle;

  // Get welcome card (card 1) for simplified mode
  const welcomeCard = helpCards.find(c => c.id === 1);

  // Simplified mode with inline chat
  if (simplified) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col" data-testid="dialog-help-simplified">
          {showChat ? (
            <>
              <DialogHeader className="flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleBackFromChat}
                    data-testid="button-help-chat-back"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div className="p-2 rounded-md bg-amber-500/10">
                    <MessageCircle className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <DialogTitle className="text-lg">Ask AI Coach</DialogTitle>
                    <p className="text-xs text-muted-foreground">
                      Ask me anything about FrisFocus
                    </p>
                  </div>
                </div>
              </DialogHeader>

              <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-64">
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
                    <div className="space-y-3 py-3 px-1">
                      {chatMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                              msg.role === "user"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            }`}
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
              </div>

              <div className="flex gap-2 pt-4 border-t border-border flex-shrink-0">
                <Textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your question..."
                  className="min-h-[40px] max-h-[100px] resize-none text-sm"
                  data-testid="input-help-chat-message"
                />
                <Button
                  size="icon"
                  onClick={handleSendMessage}
                  disabled={!chatInput.trim() || sendMessageMutation.isPending}
                  data-testid="button-help-chat-send"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <>
              <DialogHeader className="flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-md bg-primary/10">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <DialogTitle className="text-lg">{welcomeCard?.subtitle || "Welcome to FrisFocus"}</DialogTitle>
                    <p className="text-xs text-muted-foreground">
                      Need help getting started?
                    </p>
                  </div>
                </div>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                {welcomeCard?.content.intro && (
                  <p className="text-sm text-foreground leading-relaxed">
                    {welcomeCard.content.intro}
                  </p>
                )}

                {welcomeCard?.content.sections.map((section, idx) => (
                  <div key={idx} className="space-y-2">
                    {section.title && (
                      <h4 className="text-sm font-medium text-foreground">{section.title}</h4>
                    )}
                    {section.text && (
                      <p className="text-sm text-muted-foreground leading-relaxed">{section.text}</p>
                    )}
                    {section.items && (
                      <ul className="space-y-1 ml-1">
                        {section.items.map((item, itemIdx) => (
                          <li key={itemIdx} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-primary mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}

                {welcomeCard?.content.outro && (
                  <p className="text-sm text-foreground font-medium leading-relaxed pt-2 border-t border-border">
                    {welcomeCard.content.outro}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2 pt-4 border-t border-border flex-shrink-0">
                <Button
                  onClick={handleReplayTutorial}
                  className="w-full"
                  data-testid="button-help-simplified-replay"
                >
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Replay Getting Started Tutorial
                </Button>
                <Button
                  variant="outline"
                  onClick={handleAskAI}
                  className="w-full"
                  data-testid="button-help-simplified-ask-ai"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Ask AI
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    );
  }

  // Normal mode (full help cards with navigation)
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col" data-testid="dialog-help">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-md bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-lg">{currentCard?.subtitle}</DialogTitle>
              <p className="text-xs text-muted-foreground">
                {currentIndex + 1} of {displayCards.length}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 space-y-4">
          {currentCard?.content.intro && (
            <p className="text-sm text-foreground leading-relaxed">
              {currentCard.content.intro}
            </p>
          )}

          {currentCard?.content.sections.map((section, idx) => (
            <div key={idx} className="space-y-2">
              {section.title && (
                <h4 className="text-sm font-medium text-foreground">{section.title}</h4>
              )}
              {section.text && (
                <p className="text-sm text-muted-foreground leading-relaxed">{section.text}</p>
              )}
              {section.items && (
                <ul className="space-y-1 ml-1">
                  {section.items.map((item, itemIdx) => (
                    <li key={itemIdx} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}

          {currentCard?.content.outro && (
            <p className="text-sm text-foreground font-medium leading-relaxed pt-2 border-t border-border">
              {currentCard.content.outro}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3 pt-4 border-t border-border flex-shrink-0">
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentIndex(i => i - 1)}
              disabled={!hasPrev}
              data-testid="button-help-prev"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>

            <div className="flex gap-1">
              {displayCards.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-2 w-2 rounded-full transition-colors ${
                    idx === currentIndex ? "bg-primary" : "bg-muted-foreground/30"
                  }`}
                  data-testid={`button-help-dot-${idx}`}
                />
              ))}
            </div>

            {hasNext ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentIndex(i => i + 1)}
                data-testid="button-help-next"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={() => onOpenChange(false)}
                data-testid="button-help-done"
              >
                Got it
              </Button>
            )}
          </div>

          {showReplayTutorial && (hasStartedJourney || onboardingComplete || completedCardIds.length > 0) && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleReplayTutorial}
              className="w-full"
              data-testid="button-help-replay-tutorial"
            >
              <PlayCircle className="h-4 w-4 mr-2" />
              Replay Getting Started Tutorial
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface HelpButtonProps {
  onClick: () => void;
  className?: string;
}

export function HelpButton({ onClick, className }: HelpButtonProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className={className}
      data-testid="button-help"
    >
      <HelpCircle className="h-5 w-5" />
    </Button>
  );
}
