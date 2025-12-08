import { useState } from "react";
import { StickyNote } from "lucide-react";
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

interface TaskCheckboxProps {
  id: string;
  name: string;
  value: number;
  checked: boolean;
  isBooster?: boolean;
  onChange: (checked: boolean) => void;
  note?: string;
  onNoteChange?: (note: string) => void;
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
}: TaskCheckboxProps) {
  const isPositive = value > 0;
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

  return (
    <>
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
          {isPositive ? `+${value}` : value}
        </span>
      </label>

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
