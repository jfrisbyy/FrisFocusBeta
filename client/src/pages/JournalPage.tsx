import { useState, useEffect } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { useDemo } from "@/contexts/DemoContext";
import { useAuth } from "@/hooks/useAuth";
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
import {
  loadJournalFromStorage,
  saveJournalToStorage,
  type StoredJournalEntry,
} from "@/lib/storage";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { UserJournalEntry } from "@shared/schema";

interface JournalEntry {
  id: string;
  date: string;
  title: string;
  content: string;
  createdAt: string;
}

function getSampleEntries(): JournalEntry[] {
  const today = new Date();
  const yesterday = new Date(Date.now() - 86400000);
  const twoDaysAgo = new Date(Date.now() - 172800000);
  const threeDaysAgo = new Date(Date.now() - 259200000);
  const fourDaysAgo = new Date(Date.now() - 345600000);
  const fiveDaysAgo = new Date(Date.now() - 432000000);
  
  return [
    {
      id: "demo-1",
      date: format(today, "yyyy-MM-dd"),
      title: "Morning Reflection",
      content: "Great start to the day. Completed my morning meditation and had a solid workout. Feeling energized and focused for the tasks ahead.",
      createdAt: new Date(new Date().setHours(7, 30)).toISOString(),
    },
    {
      id: "demo-2",
      date: format(today, "yyyy-MM-dd"),
      title: "Evening Review",
      content: "Productive day overall. Hit 85% of my daily goal. Need to work on consistency with meal prep - skipped it again today.",
      createdAt: new Date(new Date().setHours(21, 0)).toISOString(),
    },
    {
      id: "demo-3",
      date: format(yesterday, "yyyy-MM-dd"),
      title: "Weekly Planning",
      content: "Set up goals for the week. Want to focus on maintaining my workout streak and learning something new every day.",
      createdAt: new Date(new Date(Date.now() - 86400000).setHours(9, 0)).toISOString(),
    },
    {
      id: "demo-4",
      date: format(twoDaysAgo, "yyyy-MM-dd"),
      title: "Gratitude Note",
      content: "Thankful for the progress I've made this month. The habit tracker has really helped me stay accountable.",
      createdAt: new Date(new Date(Date.now() - 172800000).setHours(20, 15)).toISOString(),
    },
    {
      id: "demo-5",
      date: format(threeDaysAgo, "yyyy-MM-dd"),
      title: "Workout Progress",
      content: "Hit a new personal record on bench press today. All those consistent sessions are paying off. Also managed to get 8 hours of sleep which really helped my recovery.",
      createdAt: new Date(new Date(Date.now() - 259200000).setHours(18, 30)).toISOString(),
    },
    {
      id: "demo-6",
      date: format(fourDaysAgo, "yyyy-MM-dd"),
      title: "Deep Work Session",
      content: "Finished a major project milestone during my deep work block. No distractions, just pure focus. The meditation practice is definitely helping with concentration.",
      createdAt: new Date(new Date(Date.now() - 345600000).setHours(14, 0)).toISOString(),
    },
    {
      id: "demo-7",
      date: format(fiveDaysAgo, "yyyy-MM-dd"),
      title: "Basketball Run Recap",
      content: "Great pickup games at the gym. Went 4-1 and felt really confident on the court. Need to work on my ball handling during skill sessions.",
      createdAt: new Date(new Date(Date.now() - 432000000).setHours(19, 45)).toISOString(),
    },
  ];
}

export default function JournalPage() {
  const { toast } = useToast();
  const { isDemo } = useDemo();
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [deleteEntry, setDeleteEntry] = useState<JournalEntry | null>(null);

  // Fetch journal entries from API
  const { data: apiEntries } = useQuery<UserJournalEntry[]>({
    queryKey: ["/api/habit/journal"],
    enabled: !!user && !isDemo,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: { date: string; title: string; content: string }) => {
      const res = await apiRequest("POST", "/api/habit/journal", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habit/journal"] });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, title, content }: { id: string; title: string; content: string }) => {
      const res = await apiRequest("PUT", `/api/habit/journal/${id}`, { title, content });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habit/journal"] });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/habit/journal/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habit/journal"] });
    },
  });

  // Load entries from API or localStorage on mount
  useEffect(() => {
    if (isDemo) {
      setEntries(getSampleEntries());
      return;
    }
    
    // For non-authenticated users, use localStorage
    if (!user) {
      const storedEntries = loadJournalFromStorage();
      setEntries(storedEntries);
      return;
    }
    
    // For authenticated users, use API data when available (including empty arrays)
    if (apiEntries !== undefined) {
      const transformed: JournalEntry[] = apiEntries.map((e) => ({
        id: e.id,
        date: e.date,
        title: e.title,
        content: e.content,
        createdAt: e.createdAt ? new Date(e.createdAt).toISOString() : new Date().toISOString(),
      }));
      setEntries(transformed);
    }
  }, [isDemo, user, apiEntries]);

  // Save entries to localStorage (for non-authenticated users)
  const saveEntries = (newEntries: JournalEntry[]) => {
    setEntries(newEntries);
    if (!isDemo && !user) {
      saveJournalToStorage(newEntries);
    }
  };

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

  const handleSave = async () => {
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
      const dateStr = format(now, "yyyy-MM-dd");
      
      if (user) {
        // Use API for authenticated users
        try {
          await createMutation.mutateAsync({
            date: dateStr,
            title: formTitle.trim(),
            content: formContent.trim(),
          });
          toast({
            title: "Entry created",
            description: "Your journal entry has been added",
          });
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to create journal entry",
            variant: "destructive",
          });
        }
      } else {
        // Use localStorage for non-authenticated users
        const newEntry: JournalEntry = {
          id: `entry-${Date.now()}`,
          date: dateStr,
          title: formTitle.trim(),
          content: formContent.trim(),
          createdAt: now.toISOString(),
        };
        saveEntries([newEntry, ...entries]);
        toast({
          title: "Entry created",
          description: "Your journal entry has been added",
        });
      }
      setIsCreating(false);
    } else if (editingEntry) {
      if (user) {
        // Use API for authenticated users
        try {
          await updateMutation.mutateAsync({
            id: editingEntry.id,
            title: formTitle.trim(),
            content: formContent.trim(),
          });
          toast({
            title: "Entry updated",
            description: `Entry "${formTitle}" has been updated`,
          });
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to update journal entry",
            variant: "destructive",
          });
        }
      } else {
        // Use localStorage for non-authenticated users
        saveEntries(entries.map(e =>
          e.id === editingEntry.id 
            ? { ...e, title: formTitle.trim(), content: formContent.trim() } 
            : e
        ));
        toast({
          title: "Entry updated",
          description: `Entry "${formTitle}" has been updated`,
        });
      }
      setEditingEntry(null);
    }

    setFormTitle("");
    setFormContent("");
  };

  const handleDelete = async () => {
    if (!deleteEntry) return;
    
    if (user) {
      // Use API for authenticated users
      try {
        await deleteMutation.mutateAsync(deleteEntry.id);
        toast({
          title: "Entry deleted",
          description: `"${deleteEntry.title}" has been removed`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete journal entry",
          variant: "destructive",
        });
      }
    } else {
      // Use localStorage for non-authenticated users
      saveEntries(entries.filter(e => e.id !== deleteEntry.id));
      toast({
        title: "Entry deleted",
        description: `"${deleteEntry.title}" has been removed`,
      });
    }
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
            <div className="p-8 text-center text-muted-foreground" data-testid="text-no-entries">
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
                    <Badge variant="secondary" className="text-xs">
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
