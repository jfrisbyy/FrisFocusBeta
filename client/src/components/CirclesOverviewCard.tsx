import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

export default function CirclesOverviewCard() {
  return (
    <Card data-testid="card-circles-overview">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Users className="h-4 w-4" />
          Circles Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Join or create a circle to see scores and compete with friends.
        </p>
      </CardContent>
    </Card>
  );
}
