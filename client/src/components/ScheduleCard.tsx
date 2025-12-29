import { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { timeBlockSchema, insertUserScheduleTemplateSchema, type TimeBlock } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock, Plus, Edit2, Trash2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";


interface ScheduleTemplate {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  timeBlocks: TimeBlock[];
  createdAt: string;
  updatedAt: string;
}

interface DailySchedule {
  id: string;
  userId: string;
  date: string;
  templateId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ScheduleCardProps {
  date: Date;
  isDemo?: boolean;
}

const templateFormSchema = insertUserScheduleTemplateSchema
  .omit({ userId: true })
  .extend({
    name: z.string().min(1, "Template name is required").max(100, "Name too long"),
    description: z.string().max(500, "Description too long").optional().or(z.literal("")),
    timeBlocks: z.array(timeBlockSchema),
  });

type TemplateFormData = z.infer<typeof templateFormSchema>;

const CATEGORY_COLORS: Record<string, string> = {
  work: "bg-primary/10 text-primary border-primary/20 dark:bg-primary/15 dark:border-primary/25",
  health: "bg-accent/50 text-accent-foreground border-accent dark:bg-accent/30",
  personal: "bg-secondary text-secondary-foreground border-border",
  rest: "bg-muted/80 text-muted-foreground border-border/50",
  focus: "bg-primary/5 text-foreground border-primary/15 dark:bg-primary/10 dark:border-primary/20",
  default: "bg-muted text-muted-foreground border-border",
};

function getCategoryColor(category?: string): string {
  if (!category) return CATEGORY_COLORS.default;
  const lower = category.toLowerCase();
  return CATEGORY_COLORS[lower] || CATEGORY_COLORS.default;
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(":");
  const h = parseInt(hours);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${minutes} ${ampm}`;
}

function isCurrentTimeBlock(startTime: string, endTime: string): boolean {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  
  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);
  
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  
  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}

function TimeBlockItem({ block, isActive }: { block: TimeBlock; isActive: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md border transition-colors",
        getCategoryColor(block.category),
        isActive && "ring-2 ring-primary ring-offset-2 ring-offset-background"
      )}
      data-testid={`time-block-${block.id}`}
    >
      <div className="flex items-center gap-1 text-xs font-mono shrink-0">
        <Clock className="h-3 w-3" />
        <span>{formatTime(block.startTime)}</span>
        <span>-</span>
        <span>{formatTime(block.endTime)}</span>
      </div>
      <div className="flex-1 text-sm font-medium truncate">{block.activity}</div>
      {isActive && (
        <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
          Now
        </Badge>
      )}
    </div>
  );
}

function TemplateEditor({
  template,
  onSave,
  onCancel,
  isSaving,
  allTemplates = [],
}: {
  template?: ScheduleTemplate;
  onSave: (data: { name: string; description: string; timeBlocks: TimeBlock[] }) => void;
  onCancel: () => void;
  isSaving: boolean;
  allTemplates?: ScheduleTemplate[];
}) {
  const form = useForm<TemplateFormData>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      name: template?.name || "",
      description: template?.description || "",
      timeBlocks: template?.timeBlocks || [],
    },
  });

  const [newBlock, setNewBlock] = useState({ startTime: "09:00", endTime: "10:00", activity: "", category: "" });
  const [importFromTemplateId, setImportFromTemplateId] = useState<string>("none");
  
  const handleImportFromTemplate = (templateId: string) => {
    setImportFromTemplateId(templateId);
    if (templateId && templateId !== "none") {
      const sourceTemplate = allTemplates.find(t => t.id === templateId);
      if (sourceTemplate) {
        const copiedBlocks = sourceTemplate.timeBlocks.map(block => ({
          ...block,
          id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        }));
        form.setValue("timeBlocks", copiedBlocks);
      }
    }
  };

  useEffect(() => {
    if (template) {
      form.reset({
        name: template.name,
        description: template.description || "",
        timeBlocks: template.timeBlocks,
      });
    }
  }, [template, form]);

  const timeBlocks = form.watch("timeBlocks");

  const addTimeBlock = () => {
    if (!newBlock.activity.trim()) return;
    const currentBlocks = form.getValues("timeBlocks");
    form.setValue("timeBlocks", [
      ...currentBlocks,
      { ...newBlock, id: `block-${Date.now()}` },
    ]);
    setNewBlock({ startTime: "09:00", endTime: "10:00", activity: "", category: "" });
  };

  const removeTimeBlock = (id: string) => {
    const currentBlocks = form.getValues("timeBlocks");
    form.setValue("timeBlocks", currentBlocks.filter((b) => b.id !== id));
  };

  const handleFormSubmit = (data: TemplateFormData) => {
    onSave({
      name: data.name.trim(),
      description: data.description?.trim() || "",
      timeBlocks: data.timeBlocks,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Template Name</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="e.g., Weekday Schedule"
                  data-testid="input-template-name"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (optional)</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Brief description of this schedule..."
                  className="resize-none"
                  rows={2}
                  data-testid="input-template-description"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {!template && allTemplates.length > 0 && (
          <div className="space-y-2">
            <FormLabel>Import Time Blocks From (Optional)</FormLabel>
            <Select value={importFromTemplateId} onValueChange={handleImportFromTemplate}>
              <SelectTrigger data-testid="select-import-schedule-template">
                <SelectValue placeholder="Start from scratch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Start from scratch</SelectItem>
                {allTemplates.map(t => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name} ({t.timeBlocks.length} blocks)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Choose an existing template to copy its time blocks as a starting point
            </p>
          </div>
        )}

        <div className="space-y-2">
          <FormLabel>Time Blocks</FormLabel>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {timeBlocks
              .slice()
              .sort((a, b) => a.startTime.localeCompare(b.startTime))
              .map((block) => (
                <div key={block.id} className="flex items-center gap-2 text-sm bg-muted/50 rounded-md px-2 py-1">
                  <span className="font-mono text-xs">
                    {formatTime(block.startTime)} - {formatTime(block.endTime)}
                  </span>
                  <span className="flex-1 truncate">{block.activity}</span>
                  {block.category && (
                    <Badge variant="outline" className="text-xs">{block.category}</Badge>
                  )}
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => removeTimeBlock(block.id)}
                    className="h-6 w-6"
                    data-testid={`button-remove-block-${block.id}`}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t">
            <div className="space-y-1">
              <FormLabel className="text-xs">Start Time</FormLabel>
              <Input
                type="time"
                value={newBlock.startTime}
                onChange={(e) => setNewBlock({ ...newBlock, startTime: e.target.value })}
                data-testid="input-block-start"
              />
            </div>
            <div className="space-y-1">
              <FormLabel className="text-xs">End Time</FormLabel>
              <Input
                type="time"
                value={newBlock.endTime}
                onChange={(e) => setNewBlock({ ...newBlock, endTime: e.target.value })}
                data-testid="input-block-end"
              />
            </div>
            <div className="space-y-1">
              <FormLabel className="text-xs">Activity</FormLabel>
              <Input
                value={newBlock.activity}
                onChange={(e) => setNewBlock({ ...newBlock, activity: e.target.value })}
                placeholder="What are you doing?"
                data-testid="input-block-activity"
              />
            </div>
            <div className="space-y-1">
              <FormLabel className="text-xs">Category</FormLabel>
              <Select value={newBlock.category} onValueChange={(v) => setNewBlock({ ...newBlock, category: v })}>
                <SelectTrigger data-testid="select-block-category">
                  <SelectValue placeholder="Optional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="work">Work</SelectItem>
                  <SelectItem value="health">Health</SelectItem>
                  <SelectItem value="personal">Personal</SelectItem>
                  <SelectItem value="rest">Rest</SelectItem>
                  <SelectItem value="focus">Focus</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button type="button" size="sm" variant="outline" onClick={addTimeBlock} className="w-full" data-testid="button-add-block">
            <Plus className="h-4 w-4 mr-1" /> Add Time Block
          </Button>
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="submit" disabled={isSaving} className="flex-1" data-testid="button-save-template">
            {isSaving ? "Saving..." : template ? "Update Template" : "Create Template"}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel} data-testid="button-cancel-template">
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default function ScheduleCard({ date, isDemo = false }: ScheduleCardProps) {
  const { toast } = useToast();
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ScheduleTemplate | undefined>();
  const dateStr = format(date, "yyyy-MM-dd");
  const isToday = format(new Date(), "yyyy-MM-dd") === dateStr;

  const { data: templates = [] } = useQuery<ScheduleTemplate[]>({
    queryKey: ["/api/habit/schedule-templates"],
    enabled: !isDemo,
  });

  const { data: dailySchedule } = useQuery<DailySchedule>({
    queryKey: ["/api/habit/daily-schedules", dateStr],
    enabled: !isDemo,
  });

  const assignedTemplate = useMemo(() => {
    if (!dailySchedule?.templateId) return null;
    return templates.find((t) => t.id === dailySchedule.templateId) || null;
  }, [dailySchedule, templates]);

  const createTemplateMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; timeBlocks: TimeBlock[] }) => {
      const response = await apiRequest("POST", "/api/habit/schedule-templates", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habit/schedule-templates"] });
      setIsEditorOpen(false);
      setEditingTemplate(undefined);
      toast({ title: "Template created" });
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name: string; description: string; timeBlocks: TimeBlock[] }) => {
      const response = await apiRequest("PUT", `/api/habit/schedule-templates/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habit/schedule-templates"] });
      setIsEditorOpen(false);
      setEditingTemplate(undefined);
      toast({ title: "Template updated" });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/habit/schedule-templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habit/schedule-templates"] });
      toast({ title: "Template deleted" });
    },
  });

  const assignTemplateMutation = useMutation({
    mutationFn: async (templateId: string | null) => {
      if (templateId) {
        const response = await apiRequest("PUT", `/api/habit/daily-schedules/${dateStr}`, { templateId });
        return response.json();
      } else {
        await apiRequest("DELETE", `/api/habit/daily-schedules/${dateStr}`);
        return null;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habit/daily-schedules", dateStr] });
    },
  });

  const handleSaveTemplate = (data: { name: string; description: string; timeBlocks: TimeBlock[] }) => {
    if (editingTemplate) {
      updateTemplateMutation.mutate({ id: editingTemplate.id, ...data });
    } else {
      createTemplateMutation.mutate(data);
    }
  };

  const handleEditTemplate = (template: ScheduleTemplate) => {
    setEditingTemplate(template);
    setIsEditorOpen(true);
  };

  const handleDeleteTemplate = (id: string) => {
    if (confirm("Delete this template? This cannot be undone.")) {
      deleteTemplateMutation.mutate(id);
    }
  };

  if (isDemo) {
    const demoBlocks: TimeBlock[] = [
      { id: "1", startTime: "06:00", endTime: "07:00", activity: "Morning Routine", category: "personal" },
      { id: "2", startTime: "07:00", endTime: "08:00", activity: "Workout", category: "health" },
      { id: "3", startTime: "08:00", endTime: "12:00", activity: "Deep Work", category: "focus" },
      { id: "4", startTime: "12:00", endTime: "13:00", activity: "Lunch Break", category: "rest" },
      { id: "5", startTime: "13:00", endTime: "17:00", activity: "Work", category: "work" },
    ];

    return (
      <Card data-testid="card-daily-schedule">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Today's Schedule
            </CardTitle>
            <Badge variant="outline">Demo</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {demoBlocks.map((block) => (
            <TimeBlockItem
              key={block.id}
              block={block}
              isActive={isToday && isCurrentTimeBlock(block.startTime, block.endTime)}
            />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="card-daily-schedule">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {isToday ? "Today's Schedule" : "Day Schedule"}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Dialog open={isEditorOpen} onOpenChange={(open) => {
              setIsEditorOpen(open);
              if (!open) setEditingTemplate(undefined);
            }}>
              <DialogTrigger asChild>
                <Button size="icon" variant="outline" data-testid="button-manage-templates">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingTemplate ? "Edit Template" : "Create Schedule Template"}</DialogTitle>
                </DialogHeader>
                <TemplateEditor
                  template={editingTemplate}
                  onSave={handleSaveTemplate}
                  onCancel={() => {
                    setIsEditorOpen(false);
                    setEditingTemplate(undefined);
                  }}
                  isSaving={createTemplateMutation.isPending || updateTemplateMutation.isPending}
                  allTemplates={templates}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {assignedTemplate && assignedTemplate.timeBlocks.length > 0 ? (
          <div className="space-y-2">
            {assignedTemplate.timeBlocks
              .sort((a, b) => a.startTime.localeCompare(b.startTime))
              .map((block) => (
                <TimeBlockItem
                  key={block.id}
                  block={block}
                  isActive={isToday && isCurrentTimeBlock(block.startTime, block.endTime)}
                />
              ))}
            <div className="flex items-center justify-end gap-2 pt-2 border-t mt-3">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleEditTemplate(assignedTemplate)}
                data-testid="button-edit-current-template"
              >
                <Edit2 className="h-3 w-3 mr-1" /> Edit
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDeleteTemplate(assignedTemplate.id)}
                className="text-destructive"
                data-testid="button-delete-current-template"
              >
                <Trash2 className="h-3 w-3 mr-1" /> Delete
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No schedule assigned for this day</p>
            <p className="text-xs mt-1">Select a template above or create a new one</p>
          </div>
        )}

        {templates.length > 0 && (
          <div className="mt-4 pt-3 border-t">
            <p className="text-xs text-muted-foreground mb-2">Available Templates:</p>
            <div className="flex flex-wrap gap-2">
              {templates.map((t) => (
                <Badge
                  key={t.id}
                  variant={assignedTemplate?.id === t.id ? "default" : "outline"}
                  className={`cursor-pointer ${assignedTemplate?.id === t.id ? "" : "hover-elevate"}`}
                  onClick={() => assignTemplateMutation.mutate(assignedTemplate?.id === t.id ? null : t.id)}
                  data-testid={`badge-template-${t.id}`}
                >
                  {t.name}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
