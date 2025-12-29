import { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo, ReactNode } from "react";
import { clearAllFrisFocusData } from "@/lib/storage";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { 
  onboardingCards, 
  mainOnboardingCards,
  pageWalkthroughCards,
  getCardById,
  getPageWalkthroughCards,
  OnboardingCard,
  OnboardingTrigger,
  OnboardingPage,
  SkipCheckKey
} from "@/lib/onboardingCards";

interface OnboardingProgress {
  currentCardId: number | null;
  completedCardIds: number[];
  exploringMode: boolean;
  onboardingComplete: boolean;
  mainOnboardingComplete: boolean;
  waitingForTrigger: OnboardingTrigger | null;
  isMinimized: boolean;
  dismissedByUser: boolean;
  visitedPages: OnboardingPage[];
  activePageWalkthrough: OnboardingPage | null;
  finalCardShown: boolean;
  showingFinalCard: boolean;
}

const defaultProgress: OnboardingProgress = {
  currentCardId: null,
  completedCardIds: [],
  exploringMode: true,
  onboardingComplete: false,
  mainOnboardingComplete: false,
  waitingForTrigger: null,
  isMinimized: false,
  dismissedByUser: false,
  visitedPages: [],
  activePageWalkthrough: null,
  finalCardShown: false,
  showingFinalCard: false,
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
  mainOnboardingComplete: boolean;
  dismissedByUser: boolean;
  waitingForTrigger: OnboardingTrigger | null;
  isMinimized: boolean;
  showOnboarding: (forceReplay?: boolean) => void;
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
  triggerGoalSet: () => void;
  skipCurrentCard: () => void;
  triggerPageVisit: (page: OnboardingPage) => void;
  showPageWalkthrough: (page: OnboardingPage) => void;
  visitedPages: OnboardingPage[];
  activePageWalkthrough: OnboardingPage | null;
  isFinalCard: boolean;
  showFinalCard: () => void;
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

  const { data: serverData } = useQuery<{ progress: OnboardingProgress | null; rewardGranted: boolean }>({
    queryKey: ["/api/onboarding/progress"],
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (serverData && !hasLoadedFromServer) {
      const serverProgress = serverData.progress;
      if (serverProgress) {
        setProgress({ ...defaultProgress, ...serverProgress });
      }
      setRewardGranted(serverData.rewardGranted || false);
      setHasLoadedFromServer(true);
    }
  }, [serverData, hasLoadedFromServer]);

  useEffect(() => {
    if (!isAuthenticated || !hasLoadedFromServer) return;
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
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

  const shouldShowTutorial = isAuthenticated && hasStartedJourney && !progress.onboardingComplete;

  useEffect(() => {
    if (shouldShowTutorial && progress.currentCardId === null && !progress.dismissedByUser && !progress.mainOnboardingComplete) {
      setProgress(prev => ({ ...prev, currentCardId: 1 }));
    }
  }, [shouldShowTutorial, progress.currentCardId, progress.dismissedByUser, progress.mainOnboardingComplete]);

  const currentCard = progress.currentCardId ? getCardById(progress.currentCardId) ?? null : null;

  const getActiveCardSequence = useCallback((): number[] => {
    if (progress.activePageWalkthrough) {
      return pageWalkthroughCards[progress.activePageWalkthrough];
    }
    return mainOnboardingCards;
  }, [progress.activePageWalkthrough]);

  const showOnboarding = useCallback((forceReplay: boolean = false) => {
    if (progress.mainOnboardingComplete && !forceReplay) {
      return;
    }
    
    if (forceReplay || progress.onboardingComplete || progress.dismissedByUser) {
      setProgress(prev => ({ 
        ...prev, 
        currentCardId: 1, 
        onboardingComplete: false,
        dismissedByUser: false,
        completedCardIds: [],
        waitingForTrigger: null,
        exploringMode: true,
        isMinimized: false,
        activePageWalkthrough: null,
      }));
    } else if (progress.isMinimized) {
      setProgress(prev => ({ ...prev, isMinimized: false }));
    } else if (progress.currentCardId === null) {
      setProgress(prev => ({ ...prev, currentCardId: 1, isMinimized: false, dismissedByUser: false }));
    }
  }, [progress.onboardingComplete, progress.currentCardId, progress.isMinimized, progress.dismissedByUser, progress.mainOnboardingComplete]);

  const showPageWalkthrough = useCallback((page: OnboardingPage) => {
    const pageCards = pageWalkthroughCards[page];
    if (pageCards.length === 0) return;
    
    setProgress(prev => ({
      ...prev,
      currentCardId: pageCards[0],
      activePageWalkthrough: page,
      isMinimized: false,
      dismissedByUser: false,
      waitingForTrigger: null,
    }));
  }, []);

  const hideOnboarding = useCallback(() => {
    setProgress(prev => ({ 
      ...prev, 
      currentCardId: null, 
      isMinimized: false, 
      waitingForTrigger: null, 
      dismissedByUser: true,
      activePageWalkthrough: null,
    }));
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
      if (progress.activePageWalkthrough) {
        setProgress(prev => ({
          ...prev,
          currentCardId: null,
          activePageWalkthrough: null,
          waitingForTrigger: null,
        }));
      } else {
        setProgress(prev => ({
          ...prev,
          currentCardId: null,
          onboardingComplete: true,
          mainOnboardingComplete: true,
          waitingForTrigger: null,
        }));
      }
    }
  }, [getActiveCardSequence, progress.currentCardId, progress.activePageWalkthrough]);

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
        
        if (nextCardId === null && progress.activePageWalkthrough) {
          const newCompletedIds = progress.completedCardIds.includes(currentCard.id)
            ? progress.completedCardIds
            : [...progress.completedCardIds, currentCard.id];
          
          // Check if all cards completed to show final card
          const allCardIds = [...mainOnboardingCards];
          Object.values(pageWalkthroughCards).forEach(cards => {
            allCardIds.push(...cards);
          });
          const allDone = allCardIds.every(id => newCompletedIds.includes(id));
          
          if (allDone && !progress.finalCardShown) {
            setProgress(prev => ({
              ...prev,
              completedCardIds: newCompletedIds,
              currentCardId: null,
              waitingForTrigger: null,
              isMinimized: false,
              activePageWalkthrough: null,
              showingFinalCard: true,
            }));
          } else {
            setProgress(prev => ({
              ...prev,
              completedCardIds: newCompletedIds,
              currentCardId: null,
              waitingForTrigger: null,
              isMinimized: false,
              activePageWalkthrough: null,
            }));
          }
        } else if (nextCardId === null) {
          setProgress(prev => ({
            ...prev,
            completedCardIds: prev.completedCardIds.includes(currentCard.id)
              ? prev.completedCardIds
              : [...prev.completedCardIds, currentCard.id],
            currentCardId: null,
            waitingForTrigger: null,
            isMinimized: false,
            onboardingComplete: true,
            mainOnboardingComplete: true,
          }));
        } else {
          setProgress(prev => ({
            ...prev,
            completedCardIds: prev.completedCardIds.includes(currentCard.id)
              ? prev.completedCardIds
              : [...prev.completedCardIds, currentCard.id],
            currentCardId: nextCardId,
            waitingForTrigger: null,
            isMinimized: false,
          }));
        }
        return;
      }
    }
    
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
  }, [progress.currentCardId, progress.waitingForTrigger, progress.completedCardIds, progress.activePageWalkthrough, getActiveCardSequence]);

  const triggerPageVisit = useCallback((page: OnboardingPage) => {
    if (!progress.mainOnboardingComplete) return;
    
    if (progress.visitedPages.includes(page)) return;
    
    const pageCards = pageWalkthroughCards[page];
    if (pageCards.length === 0) return;
    
    setProgress(prev => ({
      ...prev,
      visitedPages: [...prev.visitedPages, page],
      currentCardId: pageCards[0],
      activePageWalkthrough: page,
      isMinimized: false,
      dismissedByUser: false,
    }));
  }, [progress.mainOnboardingComplete, progress.visitedPages]);

  const completeOnboarding = useCallback(async () => {
    if (!rewardGranted) {
      try {
        const response = await apiRequest("POST", "/api/fp/award-onetime", {
          eventType: "completed_onboarding_tutorial",
        });
        
        if (response.ok || response.status === 409) {
          setRewardGranted(true);
          await apiRequest("PUT", "/api/onboarding/progress", {
            rewardGranted: true,
          });
        }
        
        if (response.ok) {
          queryClient.invalidateQueries({ queryKey: ["/api/fp"] });
          queryClient.invalidateQueries({ queryKey: ["/api/fp/history"] });
          refetchUser();
        }
      } catch (error) {
        console.error("Failed to award onboarding FP:", error);
      }
    }
    
    setProgress(prev => ({
      ...prev,
      currentCardId: null,
      onboardingComplete: true,
      mainOnboardingComplete: true,
      waitingForTrigger: null,
      isMinimized: false,
      activePageWalkthrough: null,
      showingFinalCard: false,
      finalCardShown: true,
    }));
    
    refetchUser();
  }, [rewardGranted, refetchUser]);

  const resetOnboarding = useCallback(() => {
    setProgress(defaultProgress);
  }, []);

  const getCardsForCurrentPage = useCallback((page: OnboardingPage): OnboardingCard[] => {
    return getPageWalkthroughCards(page);
  }, []);

  const isCardCompleted = useCallback((cardId: number): boolean => {
    return progress.completedCardIds.includes(cardId);
  }, [progress.completedCardIds]);

  const triggerPenaltyCreated = useCallback(() => {
    triggerAction("penaltyCreated");
  }, [triggerAction]);

  const triggerDaySaved = useCallback(() => {
    triggerAction("daySaved");
  }, [triggerAction]);

  const triggerGoalSet = useCallback(() => {
    triggerAction("goalSet");
  }, [triggerAction]);

  // Check if all onboarding cards have been completed (to show final card)
  const allCardsCompleted = useMemo(() => {
    // All cards from 1-47 should be completed
    const allCardIds = [...mainOnboardingCards];
    Object.values(pageWalkthroughCards).forEach(cards => {
      allCardIds.push(...cards);
    });
    return allCardIds.every(id => progress.completedCardIds.includes(id));
  }, [progress.completedCardIds]);

  // Show final card when all cards completed and hasn't been shown before
  const showFinalCard = useCallback(() => {
    if (progress.finalCardShown) return;
    
    setProgress(prev => ({
      ...prev,
      showingFinalCard: true,
      isMinimized: false,
    }));
  }, [progress.finalCardShown]);

  // Dismiss final card
  const dismissFinalCard = useCallback(() => {
    setProgress(prev => ({
      ...prev,
      showingFinalCard: false,
      finalCardShown: true,
    }));
  }, []);

  const isFinalCard = progress.showingFinalCard && !progress.finalCardShown;
  
  // Automatically trigger final card when all cards are completed
  useEffect(() => {
    if (allCardsCompleted && !progress.finalCardShown && !progress.showingFinalCard && hasLoadedFromServer) {
      setProgress(prev => ({
        ...prev,
        showingFinalCard: true,
      }));
    }
  }, [allCardsCompleted, progress.finalCardShown, progress.showingFinalCard, hasLoadedFromServer]);

  const skipCurrentCard = useCallback(() => {
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
        setProgress(prev => ({
          ...prev,
          currentCardId: nextCardId,
          waitingForTrigger: nextCard.trigger!,
          isMinimized: false,
        }));
      } else {
        setProgress(prev => ({
          ...prev,
          currentCardId: nextCardId,
          waitingForTrigger: null,
          isMinimized: false,
        }));
      }
    } else {
      if (progress.activePageWalkthrough) {
        // Check if all cards will be completed after this skip
        const newCompletedIds = progress.currentCardId !== null && !progress.completedCardIds.includes(progress.currentCardId)
          ? [...progress.completedCardIds, progress.currentCardId]
          : progress.completedCardIds;
        
        const allCardIds = [...mainOnboardingCards];
        Object.values(pageWalkthroughCards).forEach(cards => {
          allCardIds.push(...cards);
        });
        const allDone = allCardIds.every(id => newCompletedIds.includes(id));
        
        if (allDone && !progress.finalCardShown) {
          setProgress(prev => ({
            ...prev,
            currentCardId: null,
            activePageWalkthrough: null,
            waitingForTrigger: null,
            isMinimized: false,
            showingFinalCard: true,
          }));
        } else {
          setProgress(prev => ({
            ...prev,
            currentCardId: null,
            activePageWalkthrough: null,
            waitingForTrigger: null,
            isMinimized: false,
          }));
        }
      } else {
        setProgress(prev => ({
          ...prev,
          currentCardId: null,
          onboardingComplete: true,
          mainOnboardingComplete: true,
          waitingForTrigger: null,
          isMinimized: false,
        }));
      }
    }
  }, [getActiveCardSequence, progress.currentCardId, progress.activePageWalkthrough, progress.completedCardIds, progress.finalCardShown]);

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
      mainOnboardingComplete: progress.mainOnboardingComplete,
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
      triggerGoalSet,
      skipCurrentCard,
      triggerPageVisit,
      showPageWalkthrough,
      visitedPages: progress.visitedPages,
      activePageWalkthrough: progress.activePageWalkthrough,
      isFinalCard,
      showFinalCard,
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
