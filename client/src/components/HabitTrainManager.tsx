import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Train, Plus, Trash2, GripVertical, FileText, ChevronDown, ChevronUp, Pencil, Sparkles } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { HabitTrainWithSteps, CreateHabitTrainRequest } from "@shared/schema";

interface Task {
  id: string;
  name: string;
  value: number;
  category: string;
}

interface HabitTrainManagerProps {
  tasks: Task[];
  seasonId?: string;
  disabled?: boolean;
}

type StepInput = {
  stepType: "task" | "note";
  taskId?: string;
  noteText?: string;
};

export default function HabitTrainManager({ tasks, seasonId, disabled }: HabitTrainManagerProps) {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTrain, setEditingTrain] = useState<HabitTrainWithSteps | null>(null);
  const [deleteTrainId, setDeleteTrainId] = useState<string | null>(null);
  const [expandedTrains, setExpandedTrains] = useState<Set<string>>(new Set());

  const [trainName, setTrainName] = useState("");
  const [trainDescription, setTrainDescription] = useState("");
  const [trainBonusPoints, setTrainBonusPoints] = useState("0");
  const [steps, setSteps] = useState<StepInput[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const { data: habitTrains = [], isLoading } = useQuery<HabitTrainWithSteps[]>({
    queryKey: ["/api/habit-trains"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateHabitTrainRequest) => {
      return apiRequest("POST", "/api/habit-trains", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habit-trains"] });
      toast({ title: "Habit Train created", description: "Your new habit train is ready" });
      closeDialog();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create habit train", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CreateHabitTrainRequest }) => {
      return apiRequest("PUT", `/api/habit-trains/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habit-trains"] });
      toast({ title: "Habit Train updated" });
      closeDialog();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update habit train", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/habit-trains/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habit-trains"] });
      toast({ title: "Habit Train deleted" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete habit train", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setTrainName("");
    setTrainDescription("");
    setTrainBonusPoints("0");
    setSteps([]);
    setEditingTrain(null);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    resetForm();
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (train: HabitTrainWithSteps) => {
    setEditingTrain(train);
    setTrainName(train.name);
    setTrainDescription(train.description || "");
    setTrainBonusPoints(String(train.bonusPoints || 0));
    setSteps(
      train.steps.map((s) => ({
        stepType: s.stepType,
        taskId: s.taskId || undefined,
        noteText: s.noteText || undefined,
      }))
    );
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!trainName.trim()) {
      toast({ title: "Name required", description: "Please enter a name for your habit train", variant: "destructive" });
      return;
    }

    if (steps.length === 0) {
      toast({ title: "Steps required", description: "Add at least one task or note to your train", variant: "destructive" });
      return;
    }

    const validSteps = steps.filter((s) => {
      if (s.stepType === "task") return !!s.taskId;
      if (s.stepType === "note") return !!s.noteText?.trim();
      return false;
    });

    if (validSteps.length === 0) {
      toast({ title: "Invalid steps", description: "Each step must have a task selected or note text", variant: "destructive" });
      return;
    }

    const data: CreateHabitTrainRequest = {
      name: trainName.trim(),
      description: trainDescription.trim() || undefined,
      bonusPoints: parseInt(trainBonusPoints) || 0,
      seasonId: seasonId || undefined,
      steps: validSteps,
    };

    if (editingTrain) {
      updateMutation.mutate({ id: editingTrain.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const addTaskStep = () => {
    setSteps([...steps, { stepType: "task", taskId: undefined }]);
  };

  const addNoteStep = () => {
    setSteps([...steps, { stepType: "note", noteText: "" }]);
  };

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const updateStep = (index: number, updates: Partial<StepInput>) => {
    setSteps(steps.map((s, i) => (i === index ? { ...s, ...updates } : s)));
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newSteps = [...steps];
    const draggedStep = newSteps[draggedIndex];
    newSteps.splice(draggedIndex, 1);
    newSteps.splice(index, 0, draggedStep);
    setSteps(newSteps);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const toggleExpanded = (trainId: string) => {
    setExpandedTrains((prev) => {
      const next = new Set(prev);
      if (next.has(trainId)) {
        next.delete(trainId);
      } else {
        next.add(trainId);
      }
      return next;
    });
  };

  const getTotalPoints = (train: HabitTrainWithSteps) => {
    const taskPoints = train.steps
      .filter((s) => s.stepType === "task")
      .reduce((sum, s) => {
        const taskData = s.task || (s.taskId ? tasks.find(t => t.id === s.taskId) : null);
        return sum + (taskData?.value || 0);
      }, 0);
    return taskPoints + (train.bonusPoints || 0);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Train className="h-4 w-4 text-muted-foreground" />
            Habit Trains
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Train className="h-4 w-4 text-muted-foreground" />
              Habit Trains
            </CardTitle>
            <Button size="sm" onClick={openCreateDialog} disabled={disabled} data-testid="button-create-habit-train">
              <Plus className="h-4 w-4 mr-1" />
              New Train
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {habitTrains.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Train className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No habit trains yet</p>
              <p className="text-xs">Create a train to link tasks into a sequence</p>
            </div>
          ) : (
            habitTrains.map((train) => {
              const isExpanded = expandedTrains.has(train.id);
              const totalPoints = getTotalPoints(train);

              return (
                <div key={train.id} className="border rounded-lg" data-testid={`habit-train-${train.id}`}>
                  <div
                    className="flex items-center justify-between gap-2 p-3 cursor-pointer hover-elevate rounded-t-lg"
                    onClick={() => toggleExpanded(train.id)}
                    data-testid={`button-toggle-train-${train.id}`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Train className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="font-medium truncate">{train.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {train.steps.filter((s) => s.stepType === "task").length} tasks
                      </Badge>
                      {(train.bonusPoints ?? 0) > 0 && (
                        <Badge variant="outline" className="text-xs text-chart-1">
                          <Sparkles className="h-3 w-3 mr-1" />
                          +{train.bonusPoints} bonus
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono text-chart-1">{totalPoints} pts</span>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-3 pb-3 space-y-2 border-t">
                      {train.description && (
                        <p className="text-xs text-muted-foreground mt-2">{train.description}</p>
                      )}
                      <div className="space-y-1 mt-2">
                        {train.steps.map((step, idx) => {
                          const taskData = step.task || (step.stepType === "task" && step.taskId ? tasks.find(t => t.id === step.taskId) : null);
                          return (
                            <div key={step.id} className="flex items-center gap-2 pl-4 text-sm">
                              <span className="text-muted-foreground text-xs w-4">{idx + 1}.</span>
                              {step.stepType === "task" && taskData ? (
                                <div className="flex items-center gap-2 flex-1">
                                  <span>{taskData.name}</span>
                                  <Badge variant="secondary" className="text-xs">
                                    {taskData.category}
                                  </Badge>
                                  <span className="text-xs font-mono text-chart-1">+{taskData.value}</span>
                                </div>
                              ) : step.stepType === "task" && step.taskId ? (
                                <div className="flex items-center gap-2 flex-1 text-muted-foreground">
                                  <span className="text-xs italic">Task not found</span>
                                </div>
                              ) : step.stepType === "note" ? (
                                <div className="flex items-center gap-2 flex-1 text-muted-foreground italic">
                                  <FileText className="h-3 w-3" />
                                  <span className="text-xs">{step.noteText}</span>
                                </div>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex items-center justify-end gap-2 mt-3 pt-2 border-t">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditDialog(train);
                          }}
                          disabled={disabled}
                          data-testid={`button-edit-train-${train.id}`}
                        >
                          <Pencil className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTrainId(train.id);
                          }}
                          disabled={disabled}
                          data-testid={`button-delete-train-${train.id}`}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTrain ? "Edit Habit Train" : "Create Habit Train"}</DialogTitle>
            <DialogDescription>
              Link tasks into a sequence and earn bonus points for completing the full train.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="train-name">Name</Label>
              <Input
                id="train-name"
                value={trainName}
                onChange={(e) => setTrainName(e.target.value)}
                placeholder="Morning Routine"
                data-testid="input-train-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="train-description">Description (optional)</Label>
              <Textarea
                id="train-description"
                value={trainDescription}
                onChange={(e) => setTrainDescription(e.target.value)}
                placeholder="A sequence of tasks to start my day right"
                className="resize-none"
                rows={2}
                data-testid="input-train-description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="train-bonus">Bonus Points (for completing all tasks)</Label>
              <Input
                id="train-bonus"
                type="number"
                min={0}
                value={trainBonusPoints}
                onChange={(e) => setTrainBonusPoints(e.target.value)}
                className="w-24"
                data-testid="input-train-bonus"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Steps</Label>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={addTaskStep} data-testid="button-add-task-step">
                    <Plus className="h-3 w-3 mr-1" />
                    Task
                  </Button>
                  <Button size="sm" variant="outline" onClick={addNoteStep} data-testid="button-add-note-step">
                    <FileText className="h-3 w-3 mr-1" />
                    Note
                  </Button>
                </div>
              </div>

              {steps.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground border rounded-lg border-dashed">
                  <p className="text-sm">No steps yet</p>
                  <p className="text-xs">Add tasks and notes to build your train</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {steps.map((step, idx) => (
                    <div
                      key={idx}
                      draggable
                      onDragStart={() => handleDragStart(idx)}
                      onDragOver={(e) => handleDragOver(e, idx)}
                      onDragEnd={handleDragEnd}
                      className={`flex items-center gap-2 p-2 border rounded-lg bg-card ${
                        draggedIndex === idx ? "opacity-50" : ""
                      }`}
                      data-testid={`step-${idx}`}
                    >
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab flex-shrink-0" />
                      <span className="text-xs text-muted-foreground w-4">{idx + 1}.</span>

                      {step.stepType === "task" ? (
                        <Select
                          value={step.taskId || ""}
                          onValueChange={(value) => updateStep(idx, { taskId: value })}
                        >
                          <SelectTrigger className="flex-1" data-testid={`select-task-${idx}`}>
                            <SelectValue placeholder="Select a task" />
                          </SelectTrigger>
                          <SelectContent>
                            {tasks.map((task) => (
                              <SelectItem key={task.id} value={task.id}>
                                {task.name} ({task.category}) - +{task.value}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          value={step.noteText || ""}
                          onChange={(e) => updateStep(idx, { noteText: e.target.value })}
                          placeholder="Add a note..."
                          className="flex-1"
                          data-testid={`input-note-${idx}`}
                        />
                      )}

                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeStep(idx)}
                        data-testid={`button-remove-step-${idx}`}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              data-testid="button-save-train"
            >
              {createMutation.isPending || updateMutation.isPending ? "Saving..." : editingTrain ? "Save Changes" : "Create Train"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTrainId} onOpenChange={(open) => !open && setDeleteTrainId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Habit Train?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this habit train. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTrainId) {
                  deleteMutation.mutate(deleteTrainId);
                  setDeleteTrainId(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-train"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
