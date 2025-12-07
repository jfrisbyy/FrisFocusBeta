import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface PointsCardProps {
  weekTotal: number;
  weekRange: string;
  boosterPoints?: number;
}

function getPointsStatus(points: number) {
  if (points > 400) return { level: "strong", color: "text-chart-1", bgColor: "bg-chart-1/10", borderColor: "border-chart-1/30", icon: TrendingUp };
  if (points >= 250) return { level: "mid", color: "text-chart-2", bgColor: "bg-chart-2/10", borderColor: "border-chart-2/30", icon: Minus };
  return { level: "weak", color: "text-chart-3", bgColor: "bg-chart-3/10", borderColor: "border-chart-3/30", icon: TrendingDown };
}

export default function PointsCard({ weekTotal, weekRange, boosterPoints = 0 }: PointsCardProps) {
  const status = getPointsStatus(weekTotal);
  const Icon = status.icon;

  return (
    <Card className={cn("border", status.borderColor, status.bgColor)}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Week Total</CardTitle>
        <Icon className={cn("h-5 w-5", status.color)} />
      </CardHeader>
      <CardContent>
        <div className={cn("text-4xl font-mono font-bold", status.color)} data-testid="text-week-total">
          {weekTotal}
        </div>
        <p className="text-sm text-muted-foreground mt-1">{weekRange}</p>
        {boosterPoints > 0 && (
          <p className="text-xs text-chart-1 mt-2 font-medium">
            +{boosterPoints} from boosters
          </p>
        )}
      </CardContent>
    </Card>
  );
}
