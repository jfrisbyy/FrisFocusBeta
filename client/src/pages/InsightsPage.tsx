import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, Sparkles, Lock } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useDemo } from "@/contexts/DemoContext";
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
  const [messages, setMessages] = useState<AIMessage[]>(isDemo ? sampleMessages : []);
  const [input, setInput] = useState("");

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
    <div className="container mx-auto max-w-3xl px-4 py-6">
      <Card className="flex h-[calc(100vh-12rem)] flex-col">
        <CardHeader className="flex flex-row items-center gap-2 border-b pb-4">
          <Sparkles className="h-5 w-5 text-muted-foreground" />
          <CardTitle>AI Insights</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col p-0">
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
        </CardContent>
      </Card>
    </div>
  );
}
