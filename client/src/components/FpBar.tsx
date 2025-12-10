import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Flame, Plus } from "lucide-react";
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
  const [fpGain, setFpGain] = useState<number | null>(null);
  const [showGainAnimation, setShowGainAnimation] = useState(false);
  const prevFpRef = useRef<number | null>(null);

  const { isDemo } = useDemo();
  
  const { data: fpData, isLoading } = useQuery<{ fpTotal: number }>({
    queryKey: ["/api/fp"],
    enabled: !!user && !isDemo,
    refetchInterval: 5000,
  });

  const fpTotal = fpData?.fpTotal || 0;

  // Detect FP changes and show animation
  useEffect(() => {
    if (prevFpRef.current !== null && fpTotal > prevFpRef.current) {
      const gain = fpTotal - prevFpRef.current;
      setFpGain(gain);
      setShowGainAnimation(true);
      
      // Hide animation after 2 seconds
      const timer = setTimeout(() => {
        setShowGainAnimation(false);
        setFpGain(null);
      }, 2000);
      
      // Always update the ref to the latest value
      prevFpRef.current = fpTotal;
      
      return () => clearTimeout(timer);
    }
    // Always update the ref to the latest value
    prevFpRef.current = fpTotal;
  }, [fpTotal]);

  if (!user || isDemo) {
    return null;
  }
  const currentTier = getCurrentTier(fpTotal);
  const progress = getProgressToNextTier(fpTotal);
  const nextTierFp = currentTier.maxFp === Infinity ? null : currentTier.maxFp;

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex items-center gap-2 rounded-md hover-elevate active-elevate-2 px-2 py-1 relative"
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
            
            {/* FP Gain Animation */}
            {showGainAnimation && fpGain && (
              <span 
                className="absolute -top-2 -right-2 flex items-center gap-0.5 text-xs font-bold text-green-500 animate-bounce pointer-events-none"
                data-testid="text-fp-gain"
              >
                <Plus className="h-3 w-3" />
                {fpGain}
              </span>
            )}
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
