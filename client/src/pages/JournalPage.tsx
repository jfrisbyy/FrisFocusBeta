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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface JournalEntry {
  id: string;
  date: string;
  points: number;
  note: string;
}

// todo: remove mock functionality
const generateMockEntries = (): JournalEntry[] => {
  const entries: JournalEntry[] = [];
  const today = new Date();
  
  const mockNotes = [
    "Great day! Hit all my goals and felt really productive.",
    "Tough morning but pushed through. Remember why you started.",
    "Travel day, did what I could.",
    "Back on track after yesterday. Feeling motivated!",
    "",
    "Need to focus more on Bible study this week.",
    "Perfect day! Everything clicked.",
    "",
    "Missed gym but made up for it with extra reading time.",
    "Sunday rest day. Spent quality time with family.",
  ];

  for (let i = 0; i < 30; i++) {
    const date = subDays(today, i);
    const hasNote = Math.random() > 0.4;
    entries.push({
      id: `entry-${i}`,
      date: format(date, "yyyy-MM-dd"),
      points: Math.floor(Math.random() * 60) + 20,
      note: hasNote ? mockNotes[i % mockNotes.length] : "",
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
  const [noteInput, setNoteInput] = useState("");

  const entriesPerPage = 10;
  
  const filteredEntries = entries.filter(entry => 
    entry.note.toLowerCase().includes(searchQuery.toLowerCase()) ||
    format(parseISO(entry.date), "MMMM d, yyyy").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredEntries.length / entriesPerPage);
  const paginatedEntries = filteredEntries.slice(
    currentPage * entriesPerPage,
    (currentPage + 1) * entriesPerPage
  );

  const handleEditEntry = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setNoteInput(entry.note);
  };

  const handleSaveNote = () => {
    if (!editingEntry) return;
    
    setEntries(entries.map(e =>
      e.id === editingEntry.id ? { ...e, note: noteInput } : e
    ));
    
    toast({
      title: "Note updated",
      description: `Entry for ${format(parseISO(editingEntry.date), "MMMM d, yyyy")} has been updated`,
    });
    
    setEditingEntry(null);
    setNoteInput("");
  };

  const entriesWithNotes = entries.filter(e => e.note).length;
  const averagePoints = entries.length > 0 
    ? Math.round(entries.reduce((sum, e) => sum + e.points, 0) / entries.length)
    : 0;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Journal</h2>
        <p className="text-muted-foreground text-sm">Review your daily notes and reflections</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Total Entries</p>
                <p className="text-2xl font-mono font-bold">{entries.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Notes Written</p>
                <p className="text-2xl font-mono font-bold">{entriesWithNotes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Average Points</p>
                <p className="text-2xl font-mono font-bold">{averagePoints}</p>
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
            placeholder="Search notes..."
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
          {paginatedEntries.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {searchQuery ? "No entries match your search." : "No journal entries yet."}
            </div>
          ) : (
            <div className="divide-y">
              {paginatedEntries.map((entry) => {
                const pointsColor = entry.points >= 50 ? "text-chart-1" : entry.points >= 30 ? "text-chart-2" : "text-chart-3";
                
                return (
                  <div
                    key={entry.id}
                    className="flex items-start gap-4 px-6 py-4"
                    data-testid={`journal-entry-${entry.id}`}
                  >
                    <div className="flex flex-col items-center shrink-0 w-16">
                      <span className="text-xs text-muted-foreground">
                        {format(parseISO(entry.date), "EEE")}
                      </span>
                      <span className="text-lg font-semibold">
                        {format(parseISO(entry.date), "d")}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(parseISO(entry.date), "MMM")}
                      </span>
                    </div>
                    
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={cn("font-mono font-semibold", pointsColor)}>
                          {entry.points} pts
                        </span>
                      </div>
                      {entry.note ? (
                        <p className="text-sm text-muted-foreground">
                          {entry.note}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground/50 italic">
                          No note for this day
                        </p>
                      )}
                    </div>

                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEditEntry(entry)}
                      data-testid={`button-edit-entry-${entry.id}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
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

      <Dialog open={!!editingEntry} onOpenChange={(open) => !open && setEditingEntry(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingEntry && format(parseISO(editingEntry.date), "EEEE, MMMM d, yyyy")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {editingEntry && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Points:</span>
                <span className="font-mono font-semibold">{editingEntry.points}</span>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="entry-note">Note</Label>
              <Textarea
                id="entry-note"
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder="Write a reflection for this day..."
                rows={4}
                className="resize-none"
                data-testid="input-entry-note"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditingEntry(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveNote} data-testid="button-save-entry">
              Save Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
