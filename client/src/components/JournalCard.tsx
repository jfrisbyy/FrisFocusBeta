import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookOpen, Plus, ChevronDown, ChevronUp, X } from "lucide-react";
import { format } from "date-fns";
import {
  loadJournalFromStorage,
  saveJournalToStorage,
  StoredJournalEntry,
} from "@/lib/storage";

interface JournalCardProps {
  useMockData?: boolean;
}

export default function JournalCard({ useMockData = false }: JournalCardProps) {
  const [entries, setEntries] = useState<StoredJournalEntry[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isWriting, setIsWriting] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    if (useMockData) {
      setEntries([
        {
          id: "mock-1",
          date: format(new Date(), "yyyy-MM-dd"),
          title: "Morning reflections",
          content: "Feeling motivated today. Ready to crush my goals!",
          createdAt: new Date().toISOString(),
        },
        {
          id: "mock-2",
          date: format(new Date(Date.now() - 86400000), "yyyy-MM-dd"),
          title: "Weekly review",
          content: "Great progress on fitness this week. Need to focus more on reading.",
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
      ]);
    } else {
      setEntries(loadJournalFromStorage());
    }
  }, [useMockData]);

  const handleSaveEntry = () => {
    if (!content.trim()) return;

    const newEntry: StoredJournalEntry = {
      id: `journal-${Date.now()}`,
      date: format(new Date(), "yyyy-MM-dd"),
      title: title.trim() || format(new Date(), "MMMM d, yyyy"),
      content: content.trim(),
      createdAt: new Date().toISOString(),
    };

    const updated = [newEntry, ...entries];
    setEntries(updated);
    if (!useMockData) {
      saveJournalToStorage(updated);
    }

    setTitle("");
    setContent("");
    setIsWriting(false);
  };

  const handleDeleteEntry = (id: string) => {
    const updated = entries.filter(e => e.id !== id);
    setEntries(updated);
    if (!useMockData) {
      saveJournalToStorage(updated);
    }
  };

  const recentEntries = entries.slice(0, 3);

  return (
    <Card data-testid="card-journal">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Quick Journal
          </CardTitle>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsWriting(!isWriting)}
            data-testid="button-toggle-journal-write"
          >
            {isWriting ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isWriting && (
          <div className="space-y-2 pb-3 border-b">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Entry title (optional)"
              className="text-sm"
              data-testid="input-journal-title"
            />
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
              rows={3}
              className="resize-none text-sm"
              data-testid="input-journal-content"
            />
            <Button
              size="sm"
              onClick={handleSaveEntry}
              disabled={!content.trim()}
              data-testid="button-save-journal"
            >
              Save Entry
            </Button>
          </div>
        )}

        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No journal entries yet. Click + to write your first one!
          </p>
        ) : (
          <>
            <ScrollArea className={isExpanded ? "max-h-64" : "max-h-32"}>
              <div className="space-y-2">
                {(isExpanded ? entries : recentEntries).map((entry) => (
                  <div
                    key={entry.id}
                    className="p-2 rounded-md bg-muted/30 group"
                    data-testid={`journal-entry-${entry.id}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{entry.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(entry.createdAt), "MMM d, h:mm a")}
                        </p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDeleteEntry(entry.id)}
                        data-testid={`button-delete-journal-${entry.id}`}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {entry.content}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {entries.length > 3 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                data-testid="button-toggle-journal-expand"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-3 w-3" />
                    Show less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3" />
                    Show {entries.length - 3} more
                  </>
                )}
              </button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
