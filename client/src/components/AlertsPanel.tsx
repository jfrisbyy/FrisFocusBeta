import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, CheckCircle, MessageCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TaskAlert } from "@shared/schema";

const ALERTS_PER_PAGE = 4;

interface AlertsPanelProps {
  alerts: TaskAlert[];
}

const alertMessages = {
  none: [
    "All caught up! No overdue tasks.",
    "Clean slate! Keep up the great work!",
    "Everything's on track. Nice job!",
    "No alerts today. You're crushing it!",
  ],
  few: [
    "Just a couple things to address. You've got this!",
    "Minor items to catch up on. Easy wins!",
    "A quick focus session will clear these!",
    "Almost perfect! Just a few to tackle.",
  ],
  some: [
    "Time to refocus. You can catch up!",
    "Let's get back on track today!",
    "A fresh start awaits. Tackle these first!",
    "Don't let these pile up. Start now!",
  ],
  many: [
    "Let's reset and prioritize what matters most.",
    "Take a deep breath. One task at a time.",
    "Focus on the must-do items first.",
    "You can turn this around. Start with one.",
  ],
};

function getAlertMessage(alerts: TaskAlert[]): string {
  const mustDoCount = alerts.filter(a => a.priority === "mustDo").length;
  const total = alerts.length;
  
  let category: keyof typeof alertMessages;
  if (total === 0) {
    category = "none";
  } else if (total <= 2 && mustDoCount === 0) {
    category = "few";
  } else if (total <= 4 || mustDoCount <= 1) {
    category = "some";
  } else {
    category = "many";
  }
  
  const messages = alertMessages[category];
  return messages[Math.floor(Math.random() * messages.length)];
}

export default function AlertsPanel({ alerts }: AlertsPanelProps) {
  const message = useMemo(() => getAlertMessage(alerts), [alerts]);
  const [currentPage, setCurrentPage] = useState(0);
  
  const totalPages = Math.ceil(alerts.length / ALERTS_PER_PAGE);
  const paginatedAlerts = alerts.slice(
    currentPage * ALERTS_PER_PAGE,
    (currentPage + 1) * ALERTS_PER_PAGE
  );

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-chart-1" />
            Task Alerts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle className="h-4 w-4 text-chart-1" />
            <span data-testid="text-alert-message">{message}</span>
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
        <div className="px-6 py-3 border-b bg-muted/30">
          <div className="flex items-start gap-2">
            <MessageCircle className="h-4 w-4 text-chart-2 mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground" data-testid="text-alert-message">
              {message}
            </p>
          </div>
        </div>
        <div className="divide-y">
          {paginatedAlerts.map((alert) => (
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
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-2 border-t bg-muted/20">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              data-testid="button-alerts-prev"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs text-muted-foreground">
              {currentPage + 1} of {totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage === totalPages - 1}
              data-testid="button-alerts-next"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
