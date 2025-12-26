import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Plus, X, Layers, ChevronRight, Sparkles, Loader2, MessageCircle, Settings, Send, Check, Edit2 } from "lucide-react";
import BoosterRuleConfig, { defaultBoosterRule } from "./BoosterRuleConfig";
import PenaltyRuleConfig, { defaultPenaltyRule } from "./PenaltyRuleConfig";
import type { BoosterRule } from "./BoosterRuleConfig";
import type { TaskPriority, PenaltyRule, AITaskAssistMessage, AITaskAssistExtractedData, AITaskAssistResponse } from "@shared/schema";
import type { StoredTaskTier, StoredTaskTierBoosterRule } from "@/lib/storage";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Zap } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const taskFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  value: z.coerce.number().int("Must be a whole number"),
  category: z.string().min(1, "Category is required"),
  priority: z.enum(["mustDo", "shouldDo", "couldDo"]),
  group: z.string().optional(),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

export interface TaskWithRules extends TaskFormValues {
  boosterRule?: BoosterRule;
  penaltyRule?: PenaltyRule;
  tiers?: StoredTaskTier[];
}

interface ExistingTaskForAI {
  name: string;
  value: number;
  priority: string;
}

interface TaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: TaskWithRules) => void;
  defaultValues?: Partial<TaskWithRules>;
  title?: string;
  categories?: string[];
  enableAIPoints?: boolean;
  dailyGoal?: number;
  existingTasks?: ExistingTaskForAI[];
  seasonContext?: string;
  onCategoryCreate?: (categoryName: string) => void;
}

const defaultCategories = ["Health", "Productivity", "Spiritual", "Social", "Finance"];

const priorityLabels: Record<TaskPriority, { label: string; description: string; color: string }> = {
  mustDo: { 
    label: "Must Do", 
    description: "Alert if not done in 3 days",
    color: "text-chart-3" 
  },
  shouldDo: { 
    label: "Should Do", 
    description: "Alert if not done in 10 days",
    color: "text-chart-2" 
  },
  couldDo: { 
    label: "Could Do", 
    description: "No alerts",
    color: "text-muted-foreground" 
  },
};

type FormMode = "manual" | "assist";

export default function TaskForm({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  title = "Add Task",
  categories = defaultCategories,
  enableAIPoints = false,
  dailyGoal = 50,
  existingTasks = [],
  seasonContext,
  onCategoryCreate,
}: TaskFormProps) {
  const [boosterRule, setBoosterRule] = useState<BoosterRule>(
    defaultValues?.boosterRule || defaultBoosterRule
  );
  const [penaltyRule, setPenaltyRule] = useState<PenaltyRule>(
    defaultValues?.penaltyRule || defaultPenaltyRule
  );
  const [tiersEnabled, setTiersEnabled] = useState<boolean>(
    (defaultValues?.tiers && defaultValues.tiers.length > 0) || false
  );
  const [tiers, setTiers] = useState<StoredTaskTier[]>(
    defaultValues?.tiers || []
  );
  const [aiReasoning, setAiReasoning] = useState<string | null>(null);

  // Assist mode state
  const [formMode, setFormMode] = useState<FormMode>("manual");
  const [assistTaskName, setAssistTaskName] = useState("");
  const [assistStarted, setAssistStarted] = useState(false);
  const [assistMessages, setAssistMessages] = useState<AITaskAssistMessage[]>([]);
  const [assistStep, setAssistStep] = useState("taskName");
  const [assistExtractedData, setAssistExtractedData] = useState<AITaskAssistExtractedData>({});
  const [assistOptions, setAssistOptions] = useState<string[] | null>(null);
  const [assistComplete, setAssistComplete] = useState(false);
  const [assistUserInput, setAssistUserInput] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // AI Assist mutation
  const assistMutation = useMutation({
    mutationFn: async (data: { userMessage?: string; isStart?: boolean }) => {
      const res = await apiRequest("POST", "/api/ai/task-assist", {
        taskName: assistTaskName,
        userMessage: data.userMessage,
        currentStep: assistStep,
        conversationHistory: assistMessages,
        extractedData: assistExtractedData,
        categories,
        seasonName: seasonContext || "Current Season",
        dailyGoal,
      });
      return res.json() as Promise<AITaskAssistResponse>;
    },
    onSuccess: (data) => {
      // Add AI message to chat
      setAssistMessages(prev => [...prev, { role: "assistant", content: data.message }]);
      setAssistStep(data.nextStep);
      
      // Merge new extractedData with previous, preserving all collected data
      // This prevents losing tier/booster/penalty data from earlier steps
      setAssistExtractedData(prev => {
        const merged = { ...prev, ...data.extractedData };
        // Sanitize penaltyPoints to be positive
        if (merged.penaltyRule?.penaltyPoints) {
          merged.penaltyRule = {
            ...merged.penaltyRule,
            penaltyPoints: Math.abs(merged.penaltyRule.penaltyPoints),
          };
        }
        return merged;
      });
      
      setAssistOptions(data.options || null);
      setAssistComplete(data.isComplete);
      
      if (data.isComplete) {
        setShowPreview(true);
      }
    },
  });

  // Scroll to bottom of chat when new messages arrive
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [assistMessages]);

  const startAssist = () => {
    if (!assistTaskName.trim()) return;
    setAssistStarted(true);
    setAssistMessages([]);
    setAssistStep("taskName");
    setAssistExtractedData({});
    setAssistOptions(null);
    setAssistComplete(false);
    setShowPreview(false);
    assistMutation.mutate({ isStart: true });
  };

  const sendAssistMessage = (message: string) => {
    if (!message.trim()) return;
    setAssistMessages(prev => [...prev, { role: "user", content: message }]);
    setAssistUserInput("");
    setAssistOptions(null);
    assistMutation.mutate({ userMessage: message });
  };

  const handleOptionSelect = (option: string) => {
    sendAssistMessage(option);
  };

  const resetAssistMode = () => {
    setAssistTaskName("");
    setAssistStarted(false);
    setAssistMessages([]);
    setAssistStep("taskName");
    setAssistExtractedData({});
    setAssistOptions(null);
    setAssistComplete(false);
    setShowPreview(false);
    setAssistUserInput("");
  };

  const applyAssistDataToForm = () => {
    // Apply extracted data to the form with defensive defaults
    const finalName = assistExtractedData.suggestedTaskName || assistTaskName;
    form.setValue("name", finalName);
    form.setValue("priority", assistExtractedData.priority || "shouldDo");
    form.setValue("category", assistExtractedData.category || categories[0] || "General");
    form.setValue("value", assistExtractedData.suggestedPoints || 5);

    // Apply booster rule
    if (assistExtractedData.hasBooster && assistExtractedData.boosterRule?.enabled) {
      setBoosterRule(assistExtractedData.boosterRule);
    } else {
      setBoosterRule(defaultBoosterRule);
    }

    // Apply penalty rule
    if (assistExtractedData.hasPenalty && assistExtractedData.penaltyRule?.enabled) {
      setPenaltyRule(assistExtractedData.penaltyRule);
    } else {
      setPenaltyRule(defaultPenaltyRule);
    }

    // Apply tiers
    if (assistExtractedData.hasTiers && assistExtractedData.tiers && assistExtractedData.tiers.length > 0) {
      setTiersEnabled(true);
      setTiers(assistExtractedData.tiers.map((t, i) => ({
        id: `tier-${Date.now()}-${i}`,
        name: t.name || `Tier ${i + 1}`,
        bonusPoints: t.bonusPoints || 5,
      })));
    } else {
      setTiersEnabled(false);
      setTiers([]);
    }

    // Switch to manual mode with data filled
    setFormMode("manual");
    resetAssistMode();
  };

  const saveAssistTask = () => {
    // Defensive defaults for all extracted data
    const finalName = assistExtractedData.suggestedTaskName || assistTaskName;
    const finalCategory = assistExtractedData.category || categories[0] || "General";
    const finalPriority = assistExtractedData.priority || "shouldDo";
    const finalPoints = assistExtractedData.suggestedPoints || 5;

    // Create new category if needed - verify it doesn't already exist
    const categoryExists = categories.some(
      c => c.toLowerCase() === finalCategory.toLowerCase()
    );
    if (assistExtractedData.isNewCategory && finalCategory && onCategoryCreate && !categoryExists) {
      onCategoryCreate(finalCategory);
    }

    const taskData: TaskWithRules = {
      name: finalName,
      value: finalPoints,
      category: finalCategory,
      priority: finalPriority,
      boosterRule: assistExtractedData.hasBooster && assistExtractedData.boosterRule?.enabled
        ? assistExtractedData.boosterRule 
        : undefined,
      penaltyRule: assistExtractedData.hasPenalty && assistExtractedData.penaltyRule?.enabled
        ? assistExtractedData.penaltyRule 
        : undefined,
      tiers: assistExtractedData.hasTiers && assistExtractedData.tiers && assistExtractedData.tiers.length > 0
        ? assistExtractedData.tiers.map((t, i) => ({
            id: `tier-${Date.now()}-${i}`,
            name: t.name || `Tier ${i + 1}`,
            bonusPoints: t.bonusPoints || 5,
          }))
        : undefined,
    };
    
    onSubmit(taskData);
    resetAssistMode();
    setFormMode("manual");
    onOpenChange(false);
  };

  const aiPointsMutation = useMutation({
    mutationFn: async (data: { taskName: string; category?: string; priority?: string }) => {
      const res = await apiRequest("POST", "/api/ai/assign-points", {
        taskName: data.taskName,
        category: data.category,
        priority: data.priority,
        dailyGoal,
        existingTasks: existingTasks.length > 0 ? existingTasks : undefined,
        seasonContext,
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.suggestedPoints) {
        form.setValue("value", data.suggestedPoints);
        setAiReasoning(data.reasoning || null);
      }
    },
  });

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      name: "",
      value: 0,
      category: "",
      priority: "shouldDo",
      group: "",
      ...defaultValues,
    },
  });

  const priority = form.watch("priority");

  useEffect(() => {
    if (open) {
      form.reset({
        name: defaultValues?.name || "",
        value: defaultValues?.value || 0,
        category: defaultValues?.category || "",
        priority: defaultValues?.priority || "shouldDo",
        group: defaultValues?.group || "",
      });
      setBoosterRule(defaultValues?.boosterRule || defaultBoosterRule);
      setPenaltyRule(defaultValues?.penaltyRule || defaultPenaltyRule);
      setTiersEnabled((defaultValues?.tiers && defaultValues.tiers.length > 0) || false);
      setTiers(defaultValues?.tiers || []);
      setAiReasoning(null);
      // Reset assist mode when dialog opens
      resetAssistMode();
      // If editing, stay in manual mode
      if (defaultValues?.name) {
        setFormMode("manual");
      }
    }
  }, [open, defaultValues, form]);

  const taskName = form.watch("name");

  const defaultTierBoosterRule: StoredTaskTierBoosterRule = {
    enabled: false,
    timesRequired: 3,
    period: "week",
    bonusPoints: 10,
  };

  const addTier = () => {
    const newTier: StoredTaskTier = {
      id: `tier-${Date.now()}`,
      name: "",
      bonusPoints: 5,
    };
    setTiers([...tiers, newTier]);
  };

  const updateTier = (index: number, field: keyof StoredTaskTier, value: string | number | StoredTaskTierBoosterRule | undefined) => {
    const updated = [...tiers];
    updated[index] = { ...updated[index], [field]: value };
    setTiers(updated);
  };

  const updateTierBooster = (index: number, boosterRule: StoredTaskTierBoosterRule | undefined) => {
    const updated = [...tiers];
    updated[index] = { ...updated[index], boosterRule };
    setTiers(updated);
  };

  const removeTier = (index: number) => {
    setTiers(tiers.filter((_, i) => i !== index));
  };

  const handleSubmit = (values: TaskFormValues) => {
    onSubmit({
      ...values,
      boosterRule: boosterRule.enabled ? boosterRule : undefined,
      penaltyRule: priority === "mustDo" && penaltyRule.enabled ? penaltyRule : undefined,
      tiers: tiersEnabled && tiers.length > 0 ? tiers.filter(t => t.name.trim() !== "") : undefined,
    });
    form.reset();
    setBoosterRule(defaultBoosterRule);
    setPenaltyRule(defaultPenaltyRule);
    setTiersEnabled(false);
    setTiers([]);
    setAiReasoning(null);
    onOpenChange(false);
  };

  // Only show mode toggle for new tasks (not editing) and when AI is enabled
  const showModeToggle = enableAIPoints && !defaultValues?.name;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="sr-only">
            {formMode === "manual" ? "Fill in the task details manually" : "Let AI guide you through creating a task"}
          </DialogDescription>
        </DialogHeader>
        
        {/* Mode Toggle */}
        {showModeToggle && (
          <div className="px-6 pb-2">
            <Tabs value={formMode} onValueChange={(v) => setFormMode(v as FormMode)}>
              <TabsList className="w-full">
                <TabsTrigger value="manual" className="flex-1 gap-2" data-testid="tab-manual-mode">
                  <Settings className="h-4 w-4" />
                  Manual
                </TabsTrigger>
                <TabsTrigger value="assist" className="flex-1 gap-2" data-testid="tab-assist-mode">
                  <MessageCircle className="h-4 w-4" />
                  AI Assist
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        )}

        {/* Assist Mode UI */}
        {formMode === "assist" && showModeToggle ? (
          <div className="flex flex-col h-[calc(90vh-180px)]">
            {!assistStarted ? (
              // Task name input to start assist
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label>What task would you like to create?</Label>
                  <Input
                    placeholder="e.g., Morning workout, Read for 30 minutes..."
                    value={assistTaskName}
                    onChange={(e) => setAssistTaskName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        startAssist();
                      }
                    }}
                    data-testid="input-assist-task-name"
                  />
                </div>
                <Button 
                  onClick={startAssist} 
                  disabled={!assistTaskName.trim() || assistMutation.isPending}
                  className="w-full"
                  data-testid="button-start-assist"
                >
                  {assistMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  Start AI Conversation
                </Button>
              </div>
            ) : showPreview ? (
              // Task Preview
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-lg font-semibold">
                    <Check className="h-5 w-5 text-green-500" />
                    Task Ready
                  </div>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">
                        {assistExtractedData.suggestedTaskName || assistTaskName}
                      </CardTitle>
                      {assistExtractedData.suggestedTaskName && assistExtractedData.suggestedTaskName !== assistTaskName && (
                        <p className="text-xs text-muted-foreground">
                          Originally: "{assistTaskName}"
                        </p>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Points:</span>{" "}
                          <span className="font-medium">{assistExtractedData.suggestedPoints || 5}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Priority:</span>{" "}
                          <Badge variant="secondary" className="ml-1">
                            {assistExtractedData.priority ? priorityLabels[assistExtractedData.priority]?.label : "Should Do"}
                          </Badge>
                        </div>
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Category:</span>{" "}
                          <span className="font-medium">{assistExtractedData.category || "General"}</span>
                          {assistExtractedData.isNewCategory && (
                            <Badge variant="outline" className="ml-2">New</Badge>
                          )}
                        </div>
                      </div>

                      {assistExtractedData.hasTiers && assistExtractedData.tiers && (
                        <div className="border-t pt-3">
                          <div className="text-sm font-medium mb-2 flex items-center gap-1">
                            <Layers className="h-4 w-4" />
                            Tiers
                          </div>
                          <div className="space-y-1">
                            {assistExtractedData.tiers.map((tier, i) => (
                              <div key={i} className="text-sm flex justify-between">
                                <span>{tier.name}</span>
                                <span className="text-muted-foreground">+{tier.bonusPoints} pts</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {assistExtractedData.hasBooster && assistExtractedData.boosterRule && (
                        <div className="border-t pt-3">
                          <div className="text-sm font-medium mb-1 flex items-center gap-1">
                            <Zap className="h-4 w-4 text-yellow-500" />
                            Booster
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Complete {assistExtractedData.boosterRule.timesRequired}x per {assistExtractedData.boosterRule.period} for +{assistExtractedData.boosterRule.bonusPoints} bonus points
                          </p>
                        </div>
                      )}

                      {assistExtractedData.hasPenalty && assistExtractedData.penaltyRule && (
                        <div className="border-t pt-3">
                          <div className="text-sm font-medium mb-1 text-destructive">Penalty</div>
                          <p className="text-sm text-muted-foreground">
                            -{assistExtractedData.penaltyRule.penaltyPoints} points if completed less than {assistExtractedData.penaltyRule.timesThreshold} times per week
                          </p>
                        </div>
                      )}

                      {assistExtractedData.pointsReasoning && (
                        <div className="border-t pt-3">
                          <p className="text-xs text-muted-foreground italic">{assistExtractedData.pointsReasoning}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={applyAssistDataToForm}
                      className="flex-1"
                      data-testid="button-edit-task"
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit Details
                    </Button>
                    <Button 
                      onClick={saveAssistTask}
                      className="flex-1"
                      data-testid="button-save-assist-task"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Save Task
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            ) : (
              // Chat Interface
              <>
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {/* Task name header */}
                    <div className="text-center pb-2 border-b">
                      <p className="text-sm text-muted-foreground">Creating task:</p>
                      <p className="font-medium">{assistExtractedData.suggestedTaskName || assistTaskName}</p>
                      {assistExtractedData.suggestedTaskName && assistExtractedData.suggestedTaskName !== assistTaskName && (
                        <p className="text-xs text-muted-foreground">Originally: "{assistTaskName}"</p>
                      )}
                    </div>

                    {/* Messages */}
                    {assistMessages.map((msg, i) => (
                      <div
                        key={i}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-lg px-4 py-2 ${
                            msg.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      </div>
                    ))}

                    {/* Loading indicator */}
                    {assistMutation.isPending && (
                      <div className="flex justify-start">
                        <div className="bg-muted rounded-lg px-4 py-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      </div>
                    )}

                    <div ref={chatEndRef} />
                  </div>
                </ScrollArea>

                {/* Options or Input */}
                <div className="border-t p-4 space-y-3">
                  {assistOptions && assistOptions.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {assistOptions.map((option, i) => (
                        <Button
                          key={i}
                          variant="outline"
                          size="sm"
                          onClick={() => handleOptionSelect(option)}
                          disabled={assistMutation.isPending}
                          data-testid={`button-option-${i}`}
                        >
                          {option}
                        </Button>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type your response..."
                      value={assistUserInput}
                      onChange={(e) => setAssistUserInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendAssistMessage(assistUserInput);
                        }
                      }}
                      disabled={assistMutation.isPending}
                      data-testid="input-assist-response"
                    />
                    <Button
                      size="icon"
                      onClick={() => sendAssistMessage(assistUserInput)}
                      disabled={!assistUserInput.trim() || assistMutation.isPending}
                      data-testid="button-send-message"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          // Manual Mode UI (existing form)
          <ScrollArea className="max-h-[calc(90vh-120px)]">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 px-6 pb-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Task Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Morning workout" {...field} data-testid="input-task-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between gap-2">
                      <FormLabel>Point Value</FormLabel>
                      {enableAIPoints && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="gap-1"
                              disabled={!taskName.trim() || aiPointsMutation.isPending}
                              onClick={() => {
                                const currentCategory = form.getValues("category");
                                const currentPriority = form.getValues("priority");
                                setAiReasoning(null);
                                aiPointsMutation.mutate({
                                  taskName: taskName.trim(),
                                  category: currentCategory || undefined,
                                  priority: currentPriority,
                                });
                              }}
                              data-testid="button-ai-assign-points"
                            >
                              {aiPointsMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Sparkles className="h-4 w-4" />
                              )}
                              AI Suggest
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <p>Let AI suggest an appropriate point value based on task type and difficulty</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="e.g., 15 or -10"
                        {...field}
                        data-testid="input-task-value"
                      />
                    </FormControl>
                    {aiReasoning && (
                      <p className="text-xs text-muted-foreground bg-muted/50 rounded-md px-2 py-1 mt-1">
                        {aiReasoning}
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-priority">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(["mustDo", "shouldDo", "couldDo"] as const).map((p) => (
                          <SelectItem key={p} value={p}>
                            <div className="flex items-center gap-2">
                              <span className={priorityLabels[p].color}>
                                {priorityLabels[p].label}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {priorityLabels[p].description}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {priorityLabels[field.value as TaskPriority]?.description}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-category">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="group"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Group (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Morning Routine" {...field} data-testid="input-task-group" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Card className="border-dashed">
                <CardHeader className="py-3 px-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-muted-foreground" />
                      <CardTitle className="text-sm font-medium">Tiers</CardTitle>
                    </div>
                    <Switch
                      checked={tiersEnabled}
                      onCheckedChange={setTiersEnabled}
                      data-testid="switch-tiers-enabled"
                    />
                  </div>
                </CardHeader>
                {tiersEnabled && (
                  <CardContent className="pt-0 px-4 pb-4 space-y-3">
                    <p className="text-xs text-muted-foreground">
                      Add higher achievement levels for bonus points (e.g., 15k steps for +5 pts)
                    </p>
                    {tiers.map((tier, index) => (
                      <div key={tier.id} className="space-y-2 border rounded-md p-3">
                        <div className="flex items-center gap-2">
                          <Input
                            placeholder={`Tier ${index + 1} name (e.g., 15k steps)`}
                            value={tier.name}
                            onChange={(e) => updateTier(index, "name", e.target.value)}
                            className="flex-1"
                            data-testid={`input-tier-name-${index}`}
                          />
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground">+</span>
                            <Input
                              type="number"
                              value={tier.bonusPoints}
                              onChange={(e) => updateTier(index, "bonusPoints", parseInt(e.target.value) || 0)}
                              className="w-16"
                              data-testid={`input-tier-bonus-${index}`}
                            />
                            <span className="text-xs text-muted-foreground">pts</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeTier(index)}
                            data-testid={`button-remove-tier-${index}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <Switch
                            checked={tier.boosterRule?.enabled || false}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                updateTierBooster(index, { ...defaultTierBoosterRule, enabled: true });
                              } else {
                                updateTierBooster(index, undefined);
                              }
                            }}
                            data-testid={`switch-tier-booster-${index}`}
                          />
                          <Label className="text-xs text-muted-foreground flex items-center gap-1">
                            <Zap className="h-3 w-3" />
                            Tier Booster
                          </Label>
                        </div>
                        {tier.boosterRule?.enabled && (
                          <div className="flex flex-wrap items-center gap-2 text-xs pl-1">
                            <span className="text-muted-foreground">If hit</span>
                            <Input
                              type="number"
                              value={tier.boosterRule.timesRequired}
                              onChange={(e) => updateTierBooster(index, { ...tier.boosterRule!, timesRequired: parseInt(e.target.value) || 1 })}
                              className="w-14 h-7 text-xs"
                              min={1}
                              data-testid={`input-tier-booster-times-${index}`}
                            />
                            <span className="text-muted-foreground">times per</span>
                            <Select
                              value={tier.boosterRule.period}
                              onValueChange={(val) => updateTierBooster(index, { ...tier.boosterRule!, period: val as "week" | "month" })}
                            >
                              <SelectTrigger className="w-20 h-7 text-xs" data-testid={`select-tier-booster-period-${index}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="week">week</SelectItem>
                                <SelectItem value="month">month</SelectItem>
                              </SelectContent>
                            </Select>
                            <span className="text-muted-foreground">earn</span>
                            <Input
                              type="number"
                              value={tier.boosterRule.bonusPoints}
                              onChange={(e) => updateTierBooster(index, { ...tier.boosterRule!, bonusPoints: parseInt(e.target.value) || 1 })}
                              className="w-14 h-7 text-xs"
                              min={1}
                              data-testid={`input-tier-booster-bonus-${index}`}
                            />
                            <span className="text-muted-foreground">bonus pts</span>
                          </div>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addTier}
                      className="w-full"
                      data-testid="button-add-tier"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Tier
                    </Button>
                  </CardContent>
                )}
              </Card>
              
              <BoosterRuleConfig
                rule={boosterRule}
                onChange={setBoosterRule}
                taskName={taskName}
              />

              {priority === "mustDo" && (
                <PenaltyRuleConfig
                  rule={penaltyRule}
                  onChange={setPenaltyRule}
                  taskName={taskName}
                />
              )}

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" data-testid="button-submit-task">
                  Save Task
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}

export type { TaskWithRules as TaskWithBooster };
