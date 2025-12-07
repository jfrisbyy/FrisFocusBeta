import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TaskAlert } from "@shared/schema";

interface AlertsPanelProps {
  alerts: TaskAlert[];
}

export default function AlertsPanel({ alerts }: AlertsPanelProps) {
  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-chart-1" />
            Task Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle className="h-4 w-4 text-chart-1" />
            <span>All caught up! No overdue tasks.</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-chart-3/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-chart-3" />
          Task Alerts
          <Badge variant="secondary" className="text-xs">
            {alerts.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {alerts.map((alert) => (
            <div
              key={alert.taskId}
              className="flex items-center justify-between gap-4 px-6 py-3"
              data-testid={`alert-${alert.taskId}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <AlertTriangle
                  className={cn(
                    "h-4 w-4 shrink-0",
                    alert.priority === "mustDo" ? "text-chart-3" : "text-chart-2"
                  )}
                />
                <div className="min-w-0">
                  <span className="text-sm font-medium truncate block">
                    {alert.taskName}
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {alert.daysMissing} days since last done
                  </span>
                </div>
              </div>
              <Badge
                variant={alert.priority === "mustDo" ? "destructive" : "secondary"}
                className="shrink-0"
              >
                {alert.priority === "mustDo" ? "Must Do" : "Should Do"}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
