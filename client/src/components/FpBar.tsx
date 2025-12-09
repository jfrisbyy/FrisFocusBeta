import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Flame } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useDemo } from "@/contexts/DemoContext";
import FpActivityDrawer from "./FpActivityDrawer";

const FP_TIERS = [
  { name: "Novice", minFp: 0, maxFp: 100 },
  { name: "Apprentice", minFp: 100, maxFp: 300 },
  { name: "Focused", minFp: 300, maxFp: 600 },
  { name: "Dedicated", minFp: 600, maxFp: 1000 },
  { name: "Master", minFp: 1000, maxFp: 1750 },
  { name: "Elite", minFp: 1750, maxFp: 2750 },
  { name: "Champion", minFp: 2750, maxFp: 4000 },
  { name: "Legend", minFp: 4000, maxFp: Infinity },
];

function getCurrentTier(fp: number) {
  return FP_TIERS.find(tier => fp >= tier.minFp && fp < tier.maxFp) || FP_TIERS[FP_TIERS.length - 1];
}

function getProgressToNextTier(fp: number) {
  const currentTier = getCurrentTier(fp);
  if (currentTier.maxFp === Infinity) {
    return 100;
  }
  const progressInTier = fp - currentTier.minFp;
  const tierRange = currentTier.maxFp - currentTier.minFp;
  return Math.min(100, Math.round((progressInTier / tierRange) * 100));
}

export default function FpBar() {
  const { user } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { isDemo } = useDemo();
  
  const { data: fpData, isLoading } = useQuery<{ fpTotal: number }>({
    queryKey: ["/api/fp"],
    enabled: !!user && !isDemo,
    refetchInterval: 5000,
  });

  if (!user || isDemo) {
    return null;
  }

  const fpTotal = fpData?.fpTotal || 0;
  const currentTier = getCurrentTier(fpTotal);
  const progress = getProgressToNextTier(fpTotal);
  const nextTierFp = currentTier.maxFp === Infinity ? null : currentTier.maxFp;

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex items-center gap-2 rounded-md hover-elevate active-elevate-2 px-2 py-1"
            data-testid="button-fp-bar"
          >
            <Flame className="h-4 w-4 text-orange-500" />
            <div className="flex flex-col items-start gap-0.5">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-mono font-semibold" data-testid="text-fp-total">
                  {isLoading ? "..." : fpTotal.toLocaleString()}
                </span>
                <span className="text-xs text-muted-foreground hidden sm:inline">FP</span>
              </div>
              <Progress 
                value={progress} 
                className="h-1 w-16" 
                data-testid="progress-fp"
              />
            </div>
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-center">
          <p className="font-medium">{currentTier.name}</p>
          {nextTierFp && (
            <p className="text-xs text-muted-foreground">
              {fpTotal}/{nextTierFp} FP to next tier
            </p>
          )}
        </TooltipContent>
      </Tooltip>

      <FpActivityDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
    </>
  );
}
