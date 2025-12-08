import { useState } from "react";
import { Plus, Trash2, Gift, Settings, StickyNote, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { StoredTodoItem } from "@/lib/storage";

interface TodoListPanelProps {
  title: string;
  prompt: string;
  items: StoredTodoItem[];
  onItemsChange: (items: StoredTodoItem[]) => void;
  bonusEnabled: boolean;
  bonusPoints: number;
  onBonusEnabledChange: (enabled: boolean) => void;
  onBonusPointsChange: (points: number) => void;
  bonusAwarded: boolean;
  readOnly?: boolean;
  isDemo?: boolean;
}

export default function TodoListPanel({
  title,
  prompt,
  items,
  onItemsChange,
  bonusEnabled,
  bonusPoints,
  onBonusEnabledChange,
  onBonusPointsChange,
  bonusAwarded,
  readOnly = false,
  isDemo = false,
}: TodoListPanelProps) {
  const [newTitle, setNewTitle] = useState("");
  const [newPoints, setNewPoints] = useState("5");
  const [showSettings, setShowSettings] = useState(false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [tempNote, setTempNote] = useState("");
  const [tempEditTitle, setTempEditTitle] = useState("");
  const [tempEditPoints, setTempEditPoints] = useState("");

  const completedCount = items.filter(item => item.completed).length;
  const allCompleted = items.length > 0 && completedCount === items.length;
  const totalPoints = items
    .filter(item => item.completed)
    .reduce((sum, item) => sum + item.pointValue, 0);
  const effectiveBonus = allCompleted && bonusEnabled ? bonusPoints : 0;

  const handleAddItem = () => {
    if (!newTitle.trim()) return;
    const pointValue = parseInt(newPoints) || 0;
    const newItem: StoredTodoItem = {
      id: `todo-${Date.now()}`,
      title: newTitle.trim(),
      pointValue,
      completed: false,
      order: items.length,
    };
    onItemsChange([...items, newItem]);
    setNewTitle("");
    setNewPoints("5");
  };

  const handleToggleItem = (id: string) => {
    if (readOnly && !isDemo) return;
    onItemsChange(
      items.map(item =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const handleDeleteItem = (id: string) => {
    onItemsChange(items.filter(item => item.id !== id));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddItem();
    }
  };

  const handleOpenNoteDialog = (itemId: string, currentNote: string) => {
    if (readOnly && !isDemo) return;
    setEditingItemId(itemId);
    setTempNote(currentNote);
    setNoteDialogOpen(true);
  };

  const handleSaveNote = () => {
    if (editingItemId) {
      onItemsChange(
        items.map(item =>
          item.id === editingItemId ? { ...item, note: tempNote } : item
        )
      );
    }
    setNoteDialogOpen(false);
    setEditingItemId(null);
    setTempNote("");
  };

  const handleOpenEditDialog = (item: StoredTodoItem) => {
    if (readOnly && !isDemo) return;
    setEditingItemId(item.id);
    setTempEditTitle(item.title);
    setTempEditPoints(item.pointValue.toString());
    setEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (editingItemId && tempEditTitle.trim()) {
      onItemsChange(
        items.map(item =>
          item.id === editingItemId
            ? { ...item, title: tempEditTitle.trim(), pointValue: parseInt(tempEditPoints) || 0 }
            : item
        )
      );
    }
    setEditDialogOpen(false);
    setEditingItemId(null);
    setTempEditTitle("");
    setTempEditPoints("");
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base font-medium">{title}</CardTitle>
          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {completedCount}/{items.length}
              </Badge>
            )}
            {!readOnly && (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setShowSettings(!showSettings)}
                data-testid={`button-${title.toLowerCase().replace(/\s/g, "-")}-settings`}
              >
                <Settings className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{prompt}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {!readOnly && (
          <Collapsible open={showSettings} onOpenChange={setShowSettings}>
            <CollapsibleContent className="space-y-3 pb-3 border-b mb-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor={`bonus-${title}`} className="text-sm">Completion Bonus</Label>
                  <p className="text-xs text-muted-foreground">Earn extra points for completing all items</p>
                </div>
                <Switch
                  id={`bonus-${title}`}
                  checked={bonusEnabled}
                  onCheckedChange={onBonusEnabledChange}
                  data-testid={`switch-${title.toLowerCase().replace(/\s/g, "-")}-bonus`}
                />
              </div>
              {bonusEnabled && (
                <div className="flex items-center gap-2">
                  <Label className="text-sm whitespace-nowrap">Bonus points:</Label>
                  <Input
                    type="number"
                    value={bonusPoints}
                    onChange={(e) => onBonusPointsChange(parseInt(e.target.value) || 0)}
                    className="w-20"
                    min={1}
                    data-testid={`input-${title.toLowerCase().replace(/\s/g, "-")}-bonus-points`}
                  />
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        )}

        {!readOnly && (
          <div className="flex gap-2">
            <Input
              placeholder="Add a to-do item..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={handleKeyPress}
              className="flex-1"
              data-testid={`input-${title.toLowerCase().replace(/\s/g, "-")}-new-item`}
            />
            <Input
              type="number"
              placeholder="Pts"
              value={newPoints}
              onChange={(e) => setNewPoints(e.target.value)}
              className="w-16"
              min={0}
              data-testid={`input-${title.toLowerCase().replace(/\s/g, "-")}-new-points`}
            />
            <Button
              size="icon"
              onClick={handleAddItem}
              disabled={!newTitle.trim()}
              data-testid={`button-${title.toLowerCase().replace(/\s/g, "-")}-add`}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        )}

        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No items yet
          </p>
        ) : (
          <div className="space-y-1">
            {items.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "flex items-center gap-3 py-2 px-2 rounded-md hover-elevate group",
                  item.completed && "opacity-60"
                )}
                data-testid={`todo-item-${item.id}`}
              >
                <Checkbox
                  checked={item.completed}
                  onCheckedChange={() => handleToggleItem(item.id)}
                  disabled={readOnly && !isDemo}
                  data-testid={`checkbox-todo-${item.id}`}
                />
                <span
                  className={cn(
                    "flex-1 text-sm",
                    item.completed && "line-through"
                  )}
                >
                  {item.title}
                </span>
                <span className="font-mono text-sm text-muted-foreground">
                  +{item.pointValue}
                </span>
                {(!readOnly || isDemo) && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className={cn(
                      "h-7 w-7",
                      item.note && item.note.trim() ? "text-chart-2" : "text-muted-foreground opacity-50"
                    )}
                    onClick={() => handleOpenNoteDialog(item.id, item.note || "")}
                    data-testid={`button-note-todo-${item.id}`}
                  >
                    <StickyNote className="h-3 w-3" />
                  </Button>
                )}
                {readOnly && !isDemo && item.note && item.note.trim() && (
                  <StickyNote className="h-3 w-3 text-chart-2" />
                )}
                {!readOnly && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleOpenEditDialog(item)}
                    data-testid={`button-edit-todo-${item.id}`}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                )}
                {!readOnly && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDeleteItem(item.id)}
                    data-testid={`button-delete-todo-${item.id}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {(totalPoints > 0 || effectiveBonus > 0) && (
          <div className="pt-2 border-t space-y-1">
            {totalPoints > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Completed items</span>
                <span className="font-mono font-medium text-chart-1">+{totalPoints}</span>
              </div>
            )}
            {bonusEnabled && (
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Gift className="h-3 w-3" />
                  All complete bonus
                </span>
                <span
                  className={cn(
                    "font-mono font-medium",
                    allCompleted ? "text-chart-1" : "text-muted-foreground"
                  )}
                >
                  {allCompleted ? `+${bonusPoints}` : `(+${bonusPoints})`}
                </span>
              </div>
            )}
            {(totalPoints > 0 || effectiveBonus > 0) && (
              <div className="flex items-center justify-between text-sm font-medium pt-1 border-t">
                <span>Total</span>
                <span className="font-mono text-chart-1">+{totalPoints + effectiveBonus}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>

      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Note for "{items.find(i => i.id === editingItemId)?.title || "item"}"
            </DialogTitle>
          </DialogHeader>
          <Textarea
            value={tempNote}
            onChange={(e) => setTempNote(e.target.value)}
            placeholder="Add a note for this to-do item..."
            className="min-h-[100px]"
            data-testid={`textarea-todo-note-${editingItemId}`}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveNote} data-testid={`button-save-todo-note-${editingItemId}`}>
              Save Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit To-Do Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={tempEditTitle}
                onChange={(e) => setTempEditTitle(e.target.value)}
                placeholder="To-do item title..."
                data-testid={`input-edit-todo-title-${editingItemId}`}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-points">Point Value</Label>
              <Input
                id="edit-points"
                type="number"
                value={tempEditPoints}
                onChange={(e) => setTempEditPoints(e.target.value)}
                min={0}
                data-testid={`input-edit-todo-points-${editingItemId}`}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveEdit} 
              disabled={!tempEditTitle.trim()}
              data-testid={`button-save-todo-edit-${editingItemId}`}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
