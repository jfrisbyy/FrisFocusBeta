import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, Zap, Book, Dumbbell, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface Booster {
  id: string;
  name: string;
  description: string;
  points: number;
  achieved: boolean;
  icon: "tracking" | "bible" | "lifting";
}

interface BoostersPanelProps {
  boosters: Booster[];
}

const iconMap = {
  tracking: Calendar,
  bible: Book,
  lifting: Dumbbell,
};

export default function BoostersPanel({ boosters }: BoostersPanelProps) {
  const totalEarned = boosters.filter(b => b.achieved).reduce((sum, b) => sum + b.points, 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Zap className="h-4 w-4 text-chart-2" />
          Boosters
        </CardTitle>
        {totalEarned > 0 && (
          <Badge variant="secondary" className="font-mono text-chart-1">
            +{totalEarned}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {boosters.map((booster) => {
          const Icon = iconMap[booster.icon];
          return (
            <div
              key={booster.id}
              className={cn(
                "flex items-start gap-3 rounded-md p-3",
                booster.achieved ? "bg-chart-1/10" : "bg-muted/50"
              )}
              data-testid={`booster-${booster.id}`}
            >
              <div className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
                booster.achieved ? "bg-chart-1/20 text-chart-1" : "bg-muted text-muted-foreground"
              )}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn("text-sm font-medium", booster.achieved && "text-chart-1")}>
                    {booster.name}
                  </span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs font-mono",
                      booster.achieved ? "border-chart-1/30 text-chart-1" : "text-muted-foreground"
                    )}
                  >
                    +{booster.points}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{booster.description}</p>
              </div>
              {booster.achieved ? (
                <Check className="h-4 w-4 text-chart-1 shrink-0" />
              ) : (
                <X className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
