import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
import { clearAllFrisFocusData } from "@/lib/storage";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { 
  onboardingCards, 
  keepLearningCards, 
  exploringCards, 
  getCardById,
  OnboardingCard,
  OnboardingTrigger,
  OnboardingPage
} from "@/lib/onboardingCards";

interface OnboardingProgress {
  currentCardId: number | null;
  completedCardIds: number[];
  exploringMode: boolean;
  onboardingComplete: boolean;
  waitingForTrigger: OnboardingTrigger | null;
  isMinimized: boolean;
  dismissedByUser: boolean;
}

const defaultProgress: OnboardingProgress = {
  currentCardId: null,
  completedCardIds: [],
  exploringMode: true,
  onboardingComplete: false,
  waitingForTrigger: null,
  isMinimized: false,
  dismissedByUser: false,
};

interface OnboardingContextType {
  isOnboarding: boolean;
  hasStartedJourney: boolean;
  shouldShowTutorial: boolean;
  startJourney: () => void;
  currentCard: OnboardingCard | null;
  currentCardId: number | null;
  completedCardIds: number[];
  exploringMode: boolean;
  onboardingComplete: boolean;
  dismissedByUser: boolean;
  waitingForTrigger: OnboardingTrigger | null;
  isMinimized: boolean;
  showOnboarding: () => void;
  hideOnboarding: () => void;
  minimizeForAction: () => void;
  goToNextCard: () => void;
  goToCard: (cardId: number) => void;
  setExploringMode: (exploring: boolean) => void;
  triggerAction: (trigger: OnboardingTrigger) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  getCardsForCurrentPage: (page: OnboardingPage) => OnboardingCard[];
  isCardCompleted: (cardId: number) => boolean;
  triggerPenaltyCreated: () => void;
  triggerDaySaved: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, refetchUser } = useAuth();
  
  const hasStartedJourney = user?.hasStartedJourney ?? false;
  const isOnboarding = isAuthenticated && !hasStartedJourney;

  const [progress, setProgress] = useState<OnboardingProgress>(defaultProgress);
  const [rewardGranted, setRewardGranted] = useState(false);
  const [hasLoadedFromServer, setHasLoadedFromServer] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load onboarding progress from API
  const { data: serverData } = useQuery({
    queryKey: ["/api/onboarding/progress"],
    enabled: isAuthenticated,
  });

  // Initialize progress from server data when it loads
  useEffect(() => {
    if (serverData && !hasLoadedFromServer) {
      const serverProgress = serverData.progress as OnboardingProgress | null;
      if (serverProgress) {
        setProgress({ ...defaultProgress, ...serverProgress });
      }
      setRewardGranted(serverData.rewardGranted || false);
      setHasLoadedFromServer(true);
    }
  }, [serverData, hasLoadedFromServer]);

  // Save progress to API when it changes (debounced)
  useEffect(() => {
    if (!isAuthenticated || !hasLoadedFromServer) return;
    
    // Clear any pending save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Debounce save to avoid too many API calls
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await apiRequest("PUT", "/api/onboarding/progress", {
          progress,
        });
      } catch (error) {
        console.error("Failed to save onboarding progress:", error);
      }
    }, 500);
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [progress, isAuthenticated, hasLoadedFromServer]);

  // shouldShowTutorial = user is authenticated, has profile, but hasn't completed/skipped tutorial
  const shouldShowTutorial = isAuthenticated && hasStartedJourney && !progress.onboardingComplete;

  // Auto-start tutorial cards when user has profile but hasn't completed tutorial
  // Don't auto-start if user has manually dismissed the tutorial
  useEffect(() => {
    if (shouldShowTutorial && progress.currentCardId === null && !progress.dismissedByUser) {
      setProgress(prev => ({ ...prev, currentCardId: 1 }));
    }
  }, [shouldShowTutorial, progress.currentCardId, progress.dismissedByUser]);

  const currentCard = progress.currentCardId ? getCardById(progress.currentCardId) ?? null : null;

  const getActiveCardSequence = useCallback((): number[] => {
    return progress.exploringMode ? exploringCards : keepLearningCards;
  }, [progress.exploringMode]);

  const showOnboarding = useCallback(() => {
    if (progress.onboardingComplete || progress.dismissedByUser) {
      setProgress(prev => ({ 
        ...prev, 
        currentCardId: 1, 
        onboardingComplete: false,
        dismissedByUser: false,
        completedCardIds: [],
        waitingForTrigger: null,
        exploringMode: true,
        isMinimized: false,
      }));
    } else if (progress.isMinimized) {
      setProgress(prev => ({ ...prev, isMinimized: false }));
    } else if (progress.currentCardId === null) {
      setProgress(prev => ({ ...prev, currentCardId: 1, isMinimized: false, dismissedByUser: false }));
    }
  }, [progress.onboardingComplete, progress.currentCardId, progress.isMinimized, progress.dismissedByUser]);

  const hideOnboarding = useCallback(() => {
    setProgress(prev => ({ ...prev, currentCardId: null, isMinimized: false, waitingForTrigger: null, dismissedByUser: true }));
  }, []);

  const minimizeForAction = useCallback(() => {
    const card = progress.currentCardId ? getCardById(progress.currentCardId) : null;
    if (card?.trigger && card.trigger !== "immediate" && card.trigger !== "manual") {
      setProgress(prev => ({
        ...prev,
        isMinimized: true,
        waitingForTrigger: card.trigger!,
      }));
    }
  }, [progress.currentCardId]);

  const goToNextCard = useCallback(() => {
    const sequence = getActiveCardSequence();
    const currentIndex = sequence.indexOf(progress.currentCardId ?? 0);
    
    if (progress.currentCardId !== null) {
      setProgress(prev => ({
        ...prev,
        completedCardIds: prev.completedCardIds.includes(progress.currentCardId!)
          ? prev.completedCardIds
          : [...prev.completedCardIds, progress.currentCardId!],
      }));
    }

    if (currentIndex >= 0 && currentIndex < sequence.length - 1) {
      const nextCardId = sequence[currentIndex + 1];
      const nextCard = getCardById(nextCardId);
      
      if (nextCard?.trigger && nextCard.trigger !== "immediate" && nextCard.trigger !== "manual") {
        // Show the card so user can see instructions, and set waiting for trigger
        setProgress(prev => ({
          ...prev,
          currentCardId: nextCardId,
          waitingForTrigger: nextCard.trigger!,
        }));
      } else {
        setProgress(prev => ({
          ...prev,
          currentCardId: nextCardId,
          waitingForTrigger: null,
        }));
      }
    } else {
      setProgress(prev => ({
        ...prev,
        currentCardId: null,
        onboardingComplete: true,
        waitingForTrigger: null,
      }));
    }
  }, [getActiveCardSequence, progress.currentCardId]);

  const goToCard = useCallback((cardId: number) => {
    const card = getCardById(cardId);
    if (card) {
      setProgress(prev => ({
        ...prev,
        currentCardId: cardId,
        waitingForTrigger: null,
        isMinimized: false,
      }));
    }
  }, []);

  const setExploringMode = useCallback((exploring: boolean) => {
    setProgress(prev => ({ ...prev, exploringMode: exploring }));
  }, []);

  const triggerAction = useCallback((trigger: OnboardingTrigger) => {
    const sequence = getActiveCardSequence();
    
    // Check if current card has this trigger - if so, advance to next card
    const currentCard = progress.currentCardId ? getCardById(progress.currentCardId) : null;
    console.log('[Onboarding] triggerAction called:', {
      trigger,
      currentCardId: progress.currentCardId,
      currentCardTrigger: currentCard?.trigger,
      sequence,
      exploringMode: progress.exploringMode,
    });
    if (currentCard?.trigger === trigger) {
      const cardIndex = sequence.indexOf(currentCard.id);
      if (cardIndex >= 0) {
        const nextCardId = cardIndex < sequence.length - 1 ? sequence[cardIndex + 1] : null;
        
        setProgress(prev => ({
          ...prev,
          completedCardIds: prev.completedCardIds.includes(currentCard.id)
            ? prev.completedCardIds
            : [...prev.completedCardIds, currentCard.id],
          currentCardId: nextCardId,
          waitingForTrigger: null,
          isMinimized: false,
        }));
        return;
      }
    }
    
    // Fallback: check waitingForTrigger (for cards that were minimized)
    if (progress.waitingForTrigger === trigger) {
      const waitingCard = sequence
        .map(id => getCardById(id))
        .find(c => c?.trigger === trigger && !progress.completedCardIds.includes(c.id));
      
      if (waitingCard) {
        const cardIndex = sequence.indexOf(waitingCard.id);
        if (cardIndex >= 0) {
          const nextCardId = cardIndex < sequence.length - 1 ? sequence[cardIndex + 1] : null;
          
          setProgress(prev => ({
            ...prev,
            completedCardIds: prev.completedCardIds.includes(waitingCard.id)
              ? prev.completedCardIds
              : [...prev.completedCardIds, waitingCard.id],
            currentCardId: nextCardId,
            waitingForTrigger: null,
            isMinimized: false,
          }));
        }
      }
    }
  }, [progress.currentCardId, progress.waitingForTrigger, progress.completedCardIds, getActiveCardSequence]);

  const completeOnboarding = useCallback(async () => {
    // Award 50 FP on FIRST onboarding completion (not on replay)
    // Use server-side rewardGranted flag that survives tutorial replays
    if (!rewardGranted) {
      try {
        const response = await apiRequest("POST", "/api/fp/award-onetime", {
          activityKey: "completed_onboarding_tutorial",
          points: 50,
          message: "Completed onboarding tutorial",
        });
        
        // Mark reward as granted on success (200) or already claimed (409)
        if (response.ok || response.status === 409) {
          setRewardGranted(true);
          // Persist to server
          await apiRequest("PUT", "/api/onboarding/progress", {
            rewardGranted: true,
          });
        }
        
        if (response.ok) {
          // Invalidate FP-related queries to show the new points
          queryClient.invalidateQueries({ queryKey: ["/api/fp"] });
          queryClient.invalidateQueries({ queryKey: ["/api/fp/history"] });
          // Refresh user to get updated state
          refetchUser();
        }
      } catch (error) {
        // Network or other errors - don't mark as granted so user can retry
        console.error("Failed to award onboarding FP:", error);
      }
    }
    
    setProgress(prev => ({
      ...prev,
      currentCardId: null,
      onboardingComplete: true,
      waitingForTrigger: null,
      isMinimized: false,
    }));
    
    // Refresh user to sync onboarding state
    refetchUser();
  }, [rewardGranted, refetchUser]);

  const resetOnboarding = useCallback(() => {
    setProgress(defaultProgress);
  }, []);

  const getCardsForCurrentPage = useCallback((page: OnboardingPage): OnboardingCard[] => {
    const sequence = getActiveCardSequence();
    return onboardingCards.filter(c => c.page === page && sequence.includes(c.id));
  }, [getActiveCardSequence]);

  const isCardCompleted = useCallback((cardId: number): boolean => {
    return progress.completedCardIds.includes(cardId);
  }, [progress.completedCardIds]);

  const triggerPenaltyCreated = useCallback(() => {
    triggerAction("penaltyCreated");
  }, [triggerAction]);

  const triggerDaySaved = useCallback(() => {
    triggerAction("daySaved");
  }, [triggerAction]);

  const startJourney = async () => {
    if (!user?.id) return;
    clearAllFrisFocusData();
    await refetchUser();
  };

  return (
    <OnboardingContext.Provider value={{ 
      isOnboarding, 
      hasStartedJourney, 
      shouldShowTutorial,
      startJourney,
      currentCard,
      currentCardId: progress.currentCardId,
      completedCardIds: progress.completedCardIds,
      exploringMode: progress.exploringMode,
      onboardingComplete: progress.onboardingComplete,
      dismissedByUser: progress.dismissedByUser,
      waitingForTrigger: progress.waitingForTrigger,
      isMinimized: progress.isMinimized,
      showOnboarding,
      hideOnboarding,
      minimizeForAction,
      goToNextCard,
      goToCard,
      setExploringMode,
      triggerAction,
      completeOnboarding,
      resetOnboarding,
      getCardsForCurrentPage,
      isCardCompleted,
      triggerPenaltyCreated,
      triggerDaySaved,
    }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
}
