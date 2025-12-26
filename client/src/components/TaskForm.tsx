import { useState, useEffect } from "react";
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
import { Plus, X, Layers, ChevronRight, Sparkles, Loader2 } from "lucide-react";
import BoosterRuleConfig, { defaultBoosterRule } from "./BoosterRuleConfig";
import PenaltyRuleConfig, { defaultPenaltyRule } from "./PenaltyRuleConfig";
import type { BoosterRule } from "./BoosterRuleConfig";
import type { TaskPriority, PenaltyRule } from "@shared/schema";
import type { StoredTaskTier, StoredTaskTierBoosterRule } from "@/lib/storage";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Zap } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
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
      </DialogContent>
    </Dialog>
  );
}

export type { TaskWithRules as TaskWithBooster };
