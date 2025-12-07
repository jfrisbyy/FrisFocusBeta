import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Flag, Plus, Check, Pencil, Trash2, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { Milestone } from "@shared/schema";

interface MilestonesPanelProps {
  milestones: Milestone[];
  onAdd: (milestone: Omit<Milestone, "id" | "achieved" | "achievedAt">) => void;
  onEdit: (id: string, milestone: Omit<Milestone, "id" | "achieved" | "achievedAt">) => void;
  onDelete: (id: string) => void;
  onToggleAchieved: (id: string) => void;
}

export default function MilestonesPanel({
  milestones,
  onAdd,
  onEdit,
  onDelete,
  onToggleAchieved,
}: MilestonesPanelProps) {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formPoints, setFormPoints] = useState("50");

  const achievedMilestones = milestones.filter(m => m.achieved);
  const pendingMilestones = milestones.filter(m => !m.achieved);
  const totalPoints = achievedMilestones.reduce((sum, m) => sum + m.points, 0);

  const resetForm = () => {
    setFormName("");
    setFormDescription("");
    setFormPoints("50");
  };

  const handleOpenCreate = () => {
    resetForm();
    setEditingMilestone(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (milestone: Milestone) => {
    setEditingMilestone(milestone);
    setFormName(milestone.name);
    setFormDescription(milestone.description);
    setFormPoints(milestone.points.toString());
    setDialogOpen(true);
  };

  const handleSave = () => {
    const points = parseInt(formPoints, 10) || 50;
    
    if (editingMilestone) {
      onEdit(editingMilestone.id, {
        name: formName,
        description: formDescription,
        points,
      });
      toast({ title: "Milestone updated", description: `"${formName}" has been updated` });
    } else {
      onAdd({
        name: formName,
        description: formDescription,
        points,
      });
      toast({ title: "Milestone added", description: `"${formName}" has been added` });
    }

    setDialogOpen(false);
    resetForm();
    setEditingMilestone(null);
  };

  const handleDelete = () => {
    if (deleteId) {
      const milestone = milestones.find(m => m.id === deleteId);
      onDelete(deleteId);
      toast({ 
        title: "Milestone deleted", 
        description: milestone ? `"${milestone.name}" has been removed` : "Milestone removed" 
      });
      setDeleteId(null);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Flag className="h-4 w-4 text-chart-2" />
          Milestones
        </CardTitle>
        <div className="flex items-center gap-2">
          {totalPoints > 0 && (
            <Badge variant="secondary" className="font-mono text-chart-1">
              +{totalPoints}
            </Badge>
          )}
          <Button size="sm" variant="ghost" onClick={handleOpenCreate} data-testid="button-add-milestone">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {pendingMilestones.length === 0 && achievedMilestones.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-2">
            No milestones yet. Add goals like "Buy a car" or "Run a marathon"!
          </p>
        )}

        {pendingMilestones.map((milestone) => (
          <div
            key={milestone.id}
            className="flex items-start gap-3 rounded-md p-3 bg-muted/50"
            data-testid={`milestone-${milestone.id}`}
          >
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 shrink-0 mt-0.5"
              onClick={() => onToggleAchieved(milestone.id)}
              data-testid={`button-complete-milestone-${milestone.id}`}
            >
              <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />
            </Button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium">{milestone.name}</span>
                <Badge variant="outline" className="text-xs font-mono">
                  +{milestone.points}
                </Badge>
              </div>
              {milestone.description && (
                <p className="text-xs text-muted-foreground mt-0.5">{milestone.description}</p>
              )}
            </div>
            <div className="flex gap-1 shrink-0">
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={() => handleOpenEdit(milestone)}
                data-testid={`button-edit-milestone-${milestone.id}`}
              >
                <Pencil className="h-3 w-3" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={() => setDeleteId(milestone.id)}
                data-testid={`button-delete-milestone-${milestone.id}`}
              >
                <Trash2 className="h-3 w-3 text-chart-3" />
              </Button>
            </div>
          </div>
        ))}

        {achievedMilestones.length > 0 && (
          <>
            {pendingMilestones.length > 0 && <div className="border-t pt-3 mt-3" />}
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Trophy className="h-3 w-3" />
              Achieved ({achievedMilestones.length})
            </p>
            {achievedMilestones.map((milestone) => (
              <div
                key={milestone.id}
                className="flex items-start gap-3 rounded-md p-3 bg-chart-1/10"
                data-testid={`milestone-${milestone.id}`}
              >
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 shrink-0 mt-0.5"
                  onClick={() => onToggleAchieved(milestone.id)}
                  data-testid={`button-uncomplete-milestone-${milestone.id}`}
                >
                  <Check className="h-4 w-4 text-chart-1" />
                </Button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-chart-1">{milestone.name}</span>
                    <Badge variant="outline" className="text-xs font-mono border-chart-1/30 text-chart-1">
                      +{milestone.points}
                    </Badge>
                  </div>
                  {milestone.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{milestone.description}</p>
                  )}
                </div>
              </div>
            ))}
          </>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingMilestone ? "Edit Milestone" : "Add Milestone"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="milestone-name">Name</Label>
              <Input
                id="milestone-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g., Buy a car"
                data-testid="input-milestone-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="milestone-description">Description (optional)</Label>
              <Textarea
                id="milestone-description"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="e.g., Save up and purchase my first vehicle"
                rows={2}
                className="resize-none"
                data-testid="input-milestone-description"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="milestone-points">Points</Label>
              <Input
                id="milestone-points"
                type="number"
                value={formPoints}
                onChange={(e) => setFormPoints(e.target.value)}
                min={1}
                data-testid="input-milestone-points"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formName.trim()}
              data-testid="button-save-milestone"
            >
              {editingMilestone ? "Update" : "Add Milestone"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Milestone</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this milestone? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
