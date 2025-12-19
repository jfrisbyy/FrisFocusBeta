import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Send, Bot, User, Sparkles, Settings, Loader2 } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useDemo } from "@/contexts/DemoContext";
import { useToast } from "@/hooks/use-toast";
import type { AIMessage } from "@shared/schema";

const sampleMessages: AIMessage[] = [
  {
    id: "demo-1",
    role: "user",
    content: "How am I doing this week?",
    timestamp: new Date().toISOString(),
  },
  {
    id: "demo-2",
    role: "assistant",
    content: "Based on your habit data, you're having a strong week! You've completed 85% of your tasks, which is above your monthly average of 72%.\n\nHighlights:\n- Your spiritual habits are consistent - 6/7 days of Bible reading\n- Workout streak is at 4 days\n- You hit your daily goal 5 times this week\n\nAreas to focus on:\n- Meal prep was only done twice - consider batch cooking on Sundays\n- Sleep schedule has been inconsistent\n\nKeep up the momentum! You're building great habits.",
    timestamp: new Date().toISOString(),
  },
];

export default function InsightsPage() {
  const { isDemo } = useDemo();
  const { toast } = useToast();
  const [messages, setMessages] = useState<AIMessage[]>(isDemo ? sampleMessages : []);
  const [input, setInput] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [instructionsInput, setInstructionsInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const instructionsQuery = useQuery<{ aiInstructions: string }>({
    queryKey: ["/api/ai/instructions"],
    enabled: !isDemo,
  });

  useEffect(() => {
    if (instructionsQuery.data) {
      setInstructionsInput(instructionsQuery.data.aiInstructions || "");
    }
  }, [instructionsQuery.data]);

  const saveInstructionsMutation = useMutation({
    mutationFn: async (aiInstructions: string) => {
      const response = await apiRequest("PUT", "/api/ai/instructions", { aiInstructions });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai/instructions"] });
      toast({ title: "AI instructions saved", description: "Your AI will now follow these custom instructions." });
      setSettingsOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to save", description: "Could not save your AI instructions.", variant: "destructive" });
    },
  });

  const sendMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("POST", "/api/ai/insights", {
        message,
        history: messages,
      });
      return response.json();
    },
    onSuccess: (data) => {
      const assistantMessage: AIMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.content,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    },
  });

  const handleSend = () => {
    if (!input.trim() || sendMutation.isPending) return;
    
    if (isDemo) {
      const userMessage: AIMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: input.trim(),
        timestamp: new Date().toISOString(),
      };
      const demoResponse: AIMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Sign in to get personalized AI insights based on your habit data. In the full version, I can analyze your progress, identify patterns, and give you actionable suggestions.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage, demoResponse]);
      setInput("");
      return;
    }

    const userMessage: AIMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    sendMutation.mutate(input.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between gap-2 border-b p-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-lg font-semibold">AI Insights</h1>
          </div>
          {!isDemo && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSettingsOpen(true)}
              data-testid="button-ai-settings"
            >
              <Settings className="h-4 w-4" />
            </Button>
          )}
        </div>

        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>AI Custom Instructions</DialogTitle>
              <DialogDescription>
                Tell your AI assistant about yourself, your preferences, and how you'd like it to respond. These instructions will be remembered across all conversations.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              value={instructionsInput}
              onChange={(e) => setInstructionsInput(e.target.value)}
              placeholder="Example: I'm a morning person who works out at 6am. I prefer brief, direct responses. Focus on my fitness and reading goals. My name is [Your Name]."
              className="min-h-[150px]"
              data-testid="input-ai-instructions"
            />
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setInstructionsInput(instructionsQuery.data?.aiInstructions || "");
                  setSettingsOpen(false);
                }}
                data-testid="button-cancel-instructions"
              >
                Cancel
              </Button>
              <Button
                onClick={() => saveInstructionsMutation.mutate(instructionsInput)}
                disabled={saveInstructionsMutation.isPending}
                data-testid="button-save-instructions"
              >
                {saveInstructionsMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Save Instructions"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <div className="flex flex-1 flex-col overflow-hidden">
          <ScrollArea className="flex-1 p-4">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-4 text-center text-muted-foreground">
                <Bot className="h-12 w-12" />
                <div>
                  <p className="text-lg font-medium">Ask about your habits</p>
                  <p className="text-sm">
                    Get insights about your progress, patterns, and suggestions for improvement.
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {[
                    "How am I doing this week?",
                    "What habits need attention?",
                    "Tips for staying consistent",
                  ].map((suggestion) => (
                    <Button
                      key={suggestion}
                      variant="outline"
                      size="sm"
                      data-testid={`suggestion-${suggestion.slice(0, 10).replace(/\s/g, "-")}`}
                      onClick={() => setInput(suggestion)}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                    data-testid={`message-${msg.role}-${msg.id}`}
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      {msg.role === "user" ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                    </div>
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                    </div>
                  </div>
                ))}
                {sendMutation.isPending && (
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="flex items-center gap-1 rounded-lg bg-muted px-4 py-2">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "0ms" }} />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "150ms" }} />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>
          <div className="flex gap-2 border-t p-4">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your habits..."
              className="min-h-[44px] max-h-32 resize-none"
              data-testid="input-message"
              disabled={sendMutation.isPending}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || sendMutation.isPending}
              size="icon"
              data-testid="button-send"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
