import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Award,
  Flame,
  Book,
  Zap,
  Heart,
  Star,
  Target,
  Trophy,
  Shield,
} from "lucide-react";
import type { BadgeWithLevels } from "@shared/schema";

interface EarnedBadgesPanelProps {
  badges: BadgeWithLevels[];
}

const iconOptions: Record<string, typeof Award> = {
  award: Award,
  flame: Flame,
  book: Book,
  zap: Zap,
  heart: Heart,
  star: Star,
  target: Target,
  trophy: Trophy,
  shield: Shield,
};

function getIcon(iconName: string) {
  return iconOptions[iconName] || Award;
}

export default function EarnedBadgesPanel({ badges }: EarnedBadgesPanelProps) {
  const earnedBadges = badges.filter(b => b.levels.some(l => l.earned));
  
  if (earnedBadges.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Trophy className="h-4 w-4 text-chart-1" />
          Earned Badges
          <Badge variant="secondary" className="text-xs">
            {earnedBadges.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {earnedBadges.map((badge) => {
            const Icon = getIcon(badge.icon);
            const highestEarnedLevel = badge.levels
              .filter(l => l.earned)
              .reduce((max, l) => Math.max(max, l.level), 0);
            
            return (
              <div
                key={badge.id}
                className="flex items-center gap-2 rounded-md bg-chart-1/10 px-3 py-2"
                data-testid={`earned-badge-${badge.id}`}
              >
                <div className="rounded-full p-1.5 bg-chart-1/20">
                  <Icon className="h-3.5 w-3.5 text-chart-1" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-medium text-chart-1">{badge.name}</span>
                  {highestEarnedLevel > 0 && (
                    <Badge 
                      variant="outline" 
                      className="ml-1.5 text-[10px] border-chart-1/30 text-chart-1 px-1 py-0"
                    >
                      Lvl {highestEarnedLevel}
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
