import { useState } from "react";
import { StickyNote, Layers } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { StoredTaskTier } from "@/lib/storage";

interface TaskCheckboxProps {
  id: string;
  name: string;
  value: number;
  checked: boolean;
  isBooster?: boolean;
  onChange: (checked: boolean) => void;
  note?: string;
  onNoteChange?: (note: string) => void;
  tiers?: StoredTaskTier[];
  selectedTierId?: string;
  onTierChange?: (tierId: string | undefined) => void;
}

export default function TaskCheckbox({
  id,
  name,
  value,
  checked,
  isBooster,
  onChange,
  note,
  onNoteChange,
  tiers,
  selectedTierId,
  onTierChange,
}: TaskCheckboxProps) {
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [tempNote, setTempNote] = useState(note || "");

  const handleNoteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setTempNote(note || "");
    setIsNoteDialogOpen(true);
  };

  const handleSaveNote = () => {
    onNoteChange?.(tempNote);
    setIsNoteDialogOpen(false);
  };

  const hasNote = note && note.trim().length > 0;
  const hasTiers = tiers && tiers.length > 0;
  
  const selectedTier = hasTiers ? tiers.find(t => t.id === selectedTierId) : undefined;
  const displayValue = value + (selectedTier?.bonusPoints || 0);
  const isPositive = displayValue > 0;

  const handleTierClick = (e: React.MouseEvent, tierId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (onTierChange) {
      onTierChange(selectedTierId === tierId ? undefined : tierId);
    }
  };

  return (
    <>
      <div className="space-y-1">
        <label
          htmlFor={id}
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2.5 cursor-pointer hover-elevate active-elevate-2",
            checked && "bg-muted/50"
          )}
          data-testid={`task-checkbox-${id}`}
        >
          <Checkbox
            id={id}
            checked={checked}
            onCheckedChange={onChange}
            className="h-5 w-5"
          />
          <span className={cn("flex-1 text-sm", checked && "text-muted-foreground line-through")}>
            {name}
          </span>
          {onNoteChange && (
            <Button
              size="icon"
              variant="ghost"
              onClick={handleNoteClick}
              className={cn(
                hasNote ? "text-chart-2" : "text-muted-foreground opacity-50"
              )}
              data-testid={`button-task-note-${id}`}
            >
              <StickyNote className="h-4 w-4" />
            </Button>
          )}
          {hasTiers && (
            <Badge variant="outline" className="text-xs text-muted-foreground border-muted-foreground/30">
              <Layers className="h-3 w-3 mr-1" />
              Tiers
            </Badge>
          )}
          {isBooster && (
            <Badge variant="outline" className="text-xs text-chart-2 border-chart-2/30">
              Booster
            </Badge>
          )}
          <span
            className={cn(
              "font-mono text-sm font-semibold",
              isPositive ? "text-chart-1" : "text-chart-3"
            )}
          >
            {isPositive ? `+${displayValue}` : displayValue}
          </span>
        </label>
        
        {hasTiers && checked && (
          <div className="flex flex-wrap gap-2 pl-11 pr-3 pb-2" data-testid={`tier-options-${id}`}>
            {tiers.map((tier) => (
              <Button
                key={tier.id}
                size="sm"
                variant={selectedTierId === tier.id ? "default" : "outline"}
                onClick={(e) => handleTierClick(e, tier.id)}
                className="text-xs"
                data-testid={`tier-button-${tier.id}`}
              >
                {tier.name}
                <span className="ml-1 text-chart-1">+{tier.bonusPoints}</span>
              </Button>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Note for "{name}"</DialogTitle>
          </DialogHeader>
          <Textarea
            value={tempNote}
            onChange={(e) => setTempNote(e.target.value)}
            placeholder="Add a note about this task..."
            className="min-h-[100px]"
            data-testid={`textarea-task-note-${id}`}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNoteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveNote} data-testid={`button-save-task-note-${id}`}>
              Save Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
