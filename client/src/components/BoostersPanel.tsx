import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, Zap, TrendingDown, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UnifiedBooster } from "@shared/schema";

interface BoostersPanelProps {
  boosters: UnifiedBooster[];
}

export default function BoostersPanel({ boosters }: BoostersPanelProps) {
  const positiveBoosters = boosters.filter(b => !b.isNegative);
  const negativeBoosters = boosters.filter(b => b.isNegative);
  
  const totalEarned = positiveBoosters.filter(b => b.achieved).reduce((sum, b) => sum + b.points, 0);
  const totalPenalty = negativeBoosters.filter(b => b.achieved).reduce((sum, b) => sum + Math.abs(b.points), 0);

  const renderBooster = (booster: UnifiedBooster) => {
    const hasProgress = booster.progress !== undefined && booster.required !== undefined;
    const progressPercent = hasProgress 
      ? Math.min(100, (booster.progress! / booster.required!) * 100) 
      : 100;
    
    return (
      <div
        key={booster.id}
        className={cn(
          "flex items-start gap-3 rounded-md p-3",
          booster.isNegative 
            ? (booster.achieved ? "bg-chart-3/10" : "bg-muted/50")
            : (booster.achieved ? "bg-chart-1/10" : "bg-muted/50")
        )}
        data-testid={`booster-${booster.id}`}
      >
        <div className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
          booster.isNegative
            ? (booster.achieved ? "bg-chart-3/20 text-chart-3" : "bg-muted text-muted-foreground")
            : (booster.achieved ? "bg-chart-1/20 text-chart-1" : "bg-muted text-muted-foreground")
        )}>
          {booster.isNegative ? <TrendingDown className="h-4 w-4" /> : <Target className="h-4 w-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn(
              "text-sm font-medium",
              booster.isNegative ? (booster.achieved && "text-chart-3") : (booster.achieved && "text-chart-1")
            )}>
              {booster.name}
            </span>
            <Badge
              variant="outline"
              className={cn(
                "text-xs font-mono",
                booster.isNegative
                  ? (booster.achieved ? "border-chart-3/30 text-chart-3" : "text-muted-foreground")
                  : (booster.achieved ? "border-chart-1/30 text-chart-1" : "text-muted-foreground")
              )}
            >
              {booster.isNegative ? "" : "+"}{booster.points}
            </Badge>
          </div>
          
          {hasProgress && !booster.achieved && (
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full transition-all",
                    booster.isNegative ? "bg-chart-3" : "bg-chart-2"
                  )}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-xs font-mono text-muted-foreground">
                {booster.progress}/{booster.required}
              </span>
            </div>
          )}
          
          <p className="text-xs text-muted-foreground mt-0.5">{booster.description}</p>
        </div>
        {booster.achieved ? (
          booster.isNegative 
            ? <X className="h-4 w-4 text-chart-3 shrink-0" />
            : <Check className="h-4 w-4 text-chart-1 shrink-0" />
        ) : (
          <div className="h-4 w-4 shrink-0" />
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Zap className="h-4 w-4 text-chart-2" />
          Boosters
        </CardTitle>
        <div className="flex items-center gap-2">
          {totalEarned > 0 && (
            <Badge variant="secondary" className="font-mono text-chart-1">
              +{totalEarned}
            </Badge>
          )}
          {totalPenalty > 0 && (
            <Badge variant="secondary" className="font-mono text-chart-3">
              -{totalPenalty}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {positiveBoosters.map(renderBooster)}
        
        {negativeBoosters.length > 0 && (
          <>
            <div className="border-t pt-3 mt-3">
              <p className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-1">
                <TrendingDown className="h-3 w-3" />
                Negative Boosters
              </p>
            </div>
            {negativeBoosters.map(renderBooster)}
          </>
        )}
        
        {boosters.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No boosters configured yet.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
