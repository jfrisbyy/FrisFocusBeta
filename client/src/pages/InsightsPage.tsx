import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Send, Bot, User, Sparkles, Settings, Loader2, Plus, MessageSquare, Trash2, ChevronLeft, ChevronRight, Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useDemo } from "@/contexts/DemoContext";
import { useToast } from "@/hooks/use-toast";
import type { AIMessage, AIConversation } from "@shared/schema";
import { format } from "date-fns";

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
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [editingConversationId, setEditingConversationId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
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

  const conversationsQuery = useQuery<AIConversation[]>({
    queryKey: ["/api/ai/conversations"],
    enabled: !isDemo,
  });

  useEffect(() => {
    if (instructionsQuery.data) {
      setInstructionsInput(instructionsQuery.data.aiInstructions || "");
    }
  }, [instructionsQuery.data]);

  // Load the most recent conversation on mount
  useEffect(() => {
    if (conversationsQuery.data && conversationsQuery.data.length > 0 && !activeConversationId) {
      const mostRecent = conversationsQuery.data[0];
      setActiveConversationId(mostRecent.id);
      setMessages((mostRecent.messages as AIMessage[]) || []);
    }
  }, [conversationsQuery.data, activeConversationId]);

  const createConversationMutation = useMutation({
    mutationFn: async (data: { title?: string; messages?: AIMessage[] }) => {
      const response = await apiRequest("POST", "/api/ai/conversations", data);
      return response.json() as Promise<AIConversation>;
    },
    onSuccess: (newConversation) => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai/conversations"] });
      setActiveConversationId(newConversation.id);
      setMessages((newConversation.messages as AIMessage[]) || []);
    },
  });

  const updateConversationMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { title?: string; messages?: AIMessage[] } }) => {
      const response = await apiRequest("PUT", `/api/ai/conversations/${id}`, data);
      return response.json() as Promise<AIConversation>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai/conversations"] });
    },
  });

  const deleteConversationMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/ai/conversations/${id}`);
    },
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai/conversations"] });
      if (activeConversationId === deletedId) {
        setActiveConversationId(null);
        setMessages([]);
      }
      toast({ title: "Conversation deleted" });
    },
  });

  const handleStartEditingTitle = (e: React.MouseEvent, conversation: AIConversation) => {
    e.stopPropagation();
    setEditingConversationId(conversation.id);
    setEditingTitle(conversation.title || "");
  };

  const handleSaveTitle = (e: React.FormEvent, conversationId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!editingTitle.trim()) return;
    updateConversationMutation.mutate({ 
      id: conversationId, 
      data: { title: editingTitle.trim() } 
    });
    setEditingConversationId(null);
    setEditingTitle("");
    toast({ title: "Conversation renamed" });
  };

  const handleCancelEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingConversationId(null);
    setEditingTitle("");
  };

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
    mutationFn: async ({ message, currentMessages }: { message: string; currentMessages: AIMessage[] }) => {
      const response = await apiRequest("POST", "/api/ai/insights", {
        message,
        history: currentMessages,
      });
      const data = await response.json();
      return { data, currentMessages };
    },
    onSuccess: async ({ data, currentMessages }) => {
      const assistantMessage: AIMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.content,
        timestamp: new Date().toISOString(),
      };
      const updatedMessages = [...currentMessages, assistantMessage];
      setMessages(updatedMessages);
      
      // Save to database
      if (!isDemo && activeConversationId) {
        const firstUserMessage = updatedMessages.find(m => m.role === "user");
        const title = firstUserMessage ? firstUserMessage.content.slice(0, 50) + (firstUserMessage.content.length > 50 ? "..." : "") : "New Conversation";
        updateConversationMutation.mutate({ 
          id: activeConversationId, 
          data: { messages: updatedMessages, title } 
        });
      }
    },
  });

  const handleNewConversation = () => {
    if (isDemo) {
      setMessages(sampleMessages);
      return;
    }
    createConversationMutation.mutate({ title: "New Conversation", messages: [] });
  };

  const handleSelectConversation = (conversation: AIConversation) => {
    setActiveConversationId(conversation.id);
    setMessages((conversation.messages as AIMessage[]) || []);
  };

  const handleSend = async () => {
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

    // If no active conversation, create one first
    if (!activeConversationId) {
      const newConversation = await createConversationMutation.mutateAsync({ 
        title: input.trim().slice(0, 50) + (input.trim().length > 50 ? "..." : ""),
        messages: [userMessage] 
      });
      setActiveConversationId(newConversation.id);
      setMessages([userMessage]);
      setInput("");
      sendMutation.mutate({ message: input.trim(), currentMessages: [userMessage] });
      return;
    }

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    
    // Save user message immediately
    const firstUserMessage = updatedMessages.find(m => m.role === "user");
    const title = firstUserMessage ? firstUserMessage.content.slice(0, 50) + (firstUserMessage.content.length > 50 ? "..." : "") : "New Conversation";
    updateConversationMutation.mutate({ 
      id: activeConversationId, 
      data: { messages: updatedMessages, title } 
    });
    
    sendMutation.mutate({ message: input.trim(), currentMessages: updatedMessages });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full w-full">
      {/* Conversation History Sidebar */}
      {!isDemo && (
        <div 
          className={`flex flex-col border-r bg-muted/30 transition-all duration-200 ${
            sidebarCollapsed ? "w-12" : "w-64"
          }`}
        >
          <div className="flex items-center justify-between gap-1 border-b p-2">
            {!sidebarCollapsed && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-1"
                onClick={handleNewConversation}
                disabled={createConversationMutation.isPending}
                data-testid="button-new-conversation"
              >
                <Plus className="h-4 w-4" />
                New Chat
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              data-testid="button-toggle-sidebar"
            >
              {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>
          
          {!sidebarCollapsed && (
            <ScrollArea className="flex-1">
              <div className="flex flex-col gap-1 p-2">
                {conversationsQuery.isLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                ) : conversationsQuery.data?.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    No conversations yet
                  </p>
                ) : (
                  conversationsQuery.data?.map((conversation) => (
                    <div
                      key={conversation.id}
                      className={`group flex items-center gap-2 rounded-md p-2 cursor-pointer ${
                        activeConversationId === conversation.id ? "bg-accent" : "hover:bg-accent/50"
                      }`}
                      onClick={() => editingConversationId !== conversation.id && handleSelectConversation(conversation)}
                      data-testid={`conversation-item-${conversation.id}`}
                    >
                      <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                      {editingConversationId === conversation.id ? (
                        <form 
                          className="flex flex-1 items-center gap-1"
                          onSubmit={(e) => handleSaveTitle(e, conversation.id)}
                        >
                          <Input
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            className="h-7 text-sm"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => {
                              if (e.key === "Escape") {
                                handleCancelEditing(e as unknown as React.MouseEvent);
                              }
                            }}
                            data-testid={`input-edit-conversation-${conversation.id}`}
                          />
                          <Button
                            type="submit"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            data-testid={`button-save-title-${conversation.id}`}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                        </form>
                      ) : (
                        <>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm break-words">{conversation.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {conversation.createdAt ? format(new Date(conversation.createdAt), "MMM d") : ""}
                            </p>
                          </div>
                          <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100" style={{ visibility: editingConversationId === conversation.id ? "hidden" : "visible" }}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => handleStartEditingTitle(e, conversation)}
                              data-testid={`button-edit-conversation-${conversation.id}`}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteConversationMutation.mutate(conversation.id);
                              }}
                              data-testid={`button-delete-conversation-${conversation.id}`}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          )}
          
          {sidebarCollapsed && (
            <div className="flex flex-col items-center gap-2 py-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNewConversation}
                disabled={createConversationMutation.isPending}
                data-testid="button-new-conversation-collapsed"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col">
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
