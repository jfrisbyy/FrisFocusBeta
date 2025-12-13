import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { BookOpen, Calendar, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

export default function JournalCard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [date, setDate] = useState<Date>(new Date());
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);

  const createMutation = useMutation({
    mutationFn: async (data: { date: string; title: string; content: string }) => {
      const response = await apiRequest("POST", "/api/habit/journal", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habit/journal"] });
      toast({
        title: "Journal entry saved",
        description: "Your journal entry has been saved successfully.",
      });
      setTitle("");
      setContent("");
    },
    onError: () => {
      toast({
        title: "Failed to save",
        description: "Could not save your journal entry. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!content.trim()) {
      toast({
        title: "Content required",
        description: "Please write something in your journal entry.",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate({
      date: format(date, "yyyy-MM-dd"),
      title: title.trim() || format(date, "MMMM d, yyyy"),
      content: content.trim(),
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="text-sm font-medium">Quick Journal</CardTitle>
        <BookOpen className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
                data-testid="button-journal-date"
              >
                <Calendar className="mr-2 h-4 w-4" />
                {date ? format(date, "MMM d, yyyy") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={date}
                onSelect={(d) => {
                  if (d) {
                    setDate(d);
                    setCalendarOpen(false);
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-1">
          <Input
            placeholder="Entry title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-sm"
            data-testid="input-journal-title"
          />
        </div>

        <div className="space-y-1">
          <Textarea
            placeholder="What's on your mind today?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[80px] text-sm resize-none"
            data-testid="input-journal-content"
          />
        </div>

        <Button
          onClick={handleSave}
          disabled={createMutation.isPending || !content.trim()}
          className="w-full"
          size="sm"
          data-testid="button-save-journal"
        >
          <Save className="mr-2 h-4 w-4" />
          {createMutation.isPending ? "Saving..." : "Save Entry"}
        </Button>
      </CardContent>
    </Card>
  );
}
