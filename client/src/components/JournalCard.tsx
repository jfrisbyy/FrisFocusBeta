import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

export default function JournalCard() {
  return (
    <Card data-testid="card-journal">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          Quick Journal
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Journaling feature coming soon. Reflect on your day and track your thoughts.
        </p>
      </CardContent>
    </Card>
  );
}
