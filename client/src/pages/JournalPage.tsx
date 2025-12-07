import { useState } from "react";
import { format, subDays, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  BookOpen,
  Calendar,
  Search,
  ChevronLeft,
  ChevronRight,
  Pencil,
  MessageSquare,
  Plus,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
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

interface JournalEntry {
  id: string;
  date: string;
  title: string;
  content: string;
  createdAt: string;
}

// todo: remove mock functionality
const generateMockEntries = (): JournalEntry[] => {
  const entries: JournalEntry[] = [];
  const today = new Date();
  
  const mockTitles = [
    "Morning reflection",
    "Evening thoughts",
    "Gratitude note",
    "Weekly review",
    "Quick thought",
    "Prayer notes",
    "Goal check-in",
  ];

  const mockContents = [
    "Great day! Hit all my goals and felt really productive. The morning workout set a positive tone.",
    "Tough morning but pushed through. Remember why you started. This journey is about growth.",
    "Travel day, did what I could. Sometimes rest is productive too.",
    "Back on track after yesterday. Feeling motivated! Ready to crush this week.",
    "Need to focus more on Bible study this week. Making that a priority.",
    "Perfect day! Everything clicked. Grateful for the energy and focus.",
    "Missed gym but made up for it with extra reading time. Balance is key.",
    "Sunday rest day. Spent quality time with family. These moments matter.",
  ];

  for (let i = 0; i < 15; i++) {
    const date = subDays(today, Math.floor(i / 2));
    const dateStr = format(date, "yyyy-MM-dd");
    const hours = 9 + (i % 3) * 5;
    
    entries.push({
      id: `entry-${i}`,
      date: dateStr,
      title: mockTitles[i % mockTitles.length],
      content: mockContents[i % mockContents.length],
      createdAt: `${dateStr}T${hours.toString().padStart(2, '0')}:00:00Z`,
    });
  }

  return entries;
};

export default function JournalPage() {
  const { toast } = useToast();
  const [entries, setEntries] = useState<JournalEntry[]>(() => generateMockEntries());
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [deleteEntry, setDeleteEntry] = useState<JournalEntry | null>(null);

  const entriesPerPage = 10;
  
  const filteredEntries = entries.filter(entry => 
    entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    format(parseISO(entry.date), "MMMM d, yyyy").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredEntries.length / entriesPerPage);
  const paginatedEntries = filteredEntries.slice(
    currentPage * entriesPerPage,
    (currentPage + 1) * entriesPerPage
  );

  // Group entries by date for display
  const groupedEntries = paginatedEntries.reduce((acc, entry) => {
    if (!acc[entry.date]) {
      acc[entry.date] = [];
    }
    acc[entry.date].push(entry);
    return acc;
  }, {} as Record<string, JournalEntry[]>);

  const sortedDates = Object.keys(groupedEntries).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  const handleOpenCreate = () => {
    setFormTitle("");
    setFormContent("");
    setIsCreating(true);
  };

  const handleEditEntry = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setFormTitle(entry.title);
    setFormContent(entry.content);
  };

  const handleSave = () => {
    if (!formTitle.trim() || !formContent.trim()) {
      toast({
        title: "Missing fields",
        description: "Please enter both a title and content",
        variant: "destructive",
      });
      return;
    }

    if (isCreating) {
      const now = new Date();
      const newEntry: JournalEntry = {
        id: `entry-${Date.now()}`,
        date: format(now, "yyyy-MM-dd"),
        title: formTitle.trim(),
        content: formContent.trim(),
        createdAt: now.toISOString(),
      };
      setEntries([newEntry, ...entries]);
      toast({
        title: "Entry created",
        description: "Your journal entry has been added",
      });
      setIsCreating(false);
    } else if (editingEntry) {
      setEntries(entries.map(e =>
        e.id === editingEntry.id 
          ? { ...e, title: formTitle.trim(), content: formContent.trim() } 
          : e
      ));
      toast({
        title: "Entry updated",
        description: `Entry "${formTitle}" has been updated`,
      });
      setEditingEntry(null);
    }

    setFormTitle("");
    setFormContent("");
  };

  const handleDelete = () => {
    if (!deleteEntry) return;
    
    setEntries(entries.filter(e => e.id !== deleteEntry.id));
    toast({
      title: "Entry deleted",
      description: `"${deleteEntry.title}" has been removed`,
    });
    setDeleteEntry(null);
  };

  const uniqueDays = new Set(entries.map(e => e.date)).size;
  const thisWeekEntries = entries.filter(e => {
    const entryDate = parseISO(e.date);
    const weekAgo = subDays(new Date(), 7);
    return entryDate >= weekAgo;
  }).length;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Journal</h2>
          <p className="text-muted-foreground text-sm">Record your thoughts and reflections</p>
        </div>
        <Button onClick={handleOpenCreate} data-testid="button-new-entry">
          <Plus className="h-4 w-4 mr-2" />
          New Entry
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Total Entries</p>
                <p className="text-2xl font-mono font-bold" data-testid="text-total-entries">{entries.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Days with Entries</p>
                <p className="text-2xl font-mono font-bold" data-testid="text-days-count">{uniqueDays}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">This Week</p>
                <p className="text-2xl font-mono font-bold" data-testid="text-week-entries">{thisWeekEntries}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(0);
            }}
            placeholder="Search entries..."
            className="pl-9"
            data-testid="input-search-journal"
          />
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            Journal Entries
            {searchQuery && (
              <Badge variant="secondary" className="ml-2">
                {filteredEntries.length} results
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {sortedDates.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {searchQuery ? "No entries match your search." : "No journal entries yet. Click 'New Entry' to start."}
            </div>
          ) : (
            <div className="divide-y">
              {sortedDates.map((dateStr) => (
                <div key={dateStr} className="px-6 py-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-medium">
                      {format(parseISO(dateStr), "EEEE, MMMM d, yyyy")}
                    </span>
                    <Badge variant="secondary" size="sm">
                      {groupedEntries[dateStr].length} {groupedEntries[dateStr].length === 1 ? 'entry' : 'entries'}
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    {groupedEntries[dateStr].map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-start gap-4 p-3 rounded-md bg-muted/30"
                        data-testid={`journal-entry-${entry.id}`}
                      >
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{entry.title}</span>
                            <span className="text-xs text-muted-foreground">
                              {format(parseISO(entry.createdAt), "h:mm a")}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {entry.content}
                          </p>
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEditEntry(entry)}
                            data-testid={`button-edit-entry-${entry.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setDeleteEntry(entry)}
                            data-testid={`button-delete-entry-${entry.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            size="icon"
            variant="outline"
            onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            data-testid="button-prev-page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground px-4">
            Page {currentPage + 1} of {totalPages}
          </span>
          <Button
            size="icon"
            variant="outline"
            onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage === totalPages - 1}
            data-testid="button-next-page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog 
        open={isCreating || !!editingEntry} 
        onOpenChange={(open) => {
          if (!open) {
            setIsCreating(false);
            setEditingEntry(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isCreating ? "New Journal Entry" : "Edit Entry"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="entry-title">Title</Label>
              <Input
                id="entry-title"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Entry title..."
                data-testid="input-entry-title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="entry-content">Content</Label>
              <Textarea
                id="entry-content"
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                placeholder="Write your thoughts..."
                rows={5}
                className="resize-none"
                data-testid="input-entry-content"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsCreating(false);
                setEditingEntry(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} data-testid="button-save-entry">
              {isCreating ? "Create Entry" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteEntry} onOpenChange={(open) => !open && setDeleteEntry(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteEntry?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} data-testid="button-confirm-delete">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
