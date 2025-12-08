import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { clearAllFrisFocusData } from "@/lib/storage";
import { useAuth } from "@/hooks/useAuth";

interface OnboardingContextType {
  isOnboarding: boolean;
  hasStartedJourney: boolean;
  startJourney: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

function getOnboardingKey(userId: string | undefined): string {
  return userId ? `frisfocus_started_${userId}` : "frisfocus_started";
}

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [hasStartedJourney, setHasStartedJourney] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined" && user?.id) {
      const key = getOnboardingKey(user.id);
      const started = localStorage.getItem(key) === "true";
      setHasStartedJourney(started);
    } else {
      setHasStartedJourney(false);
    }
  }, [user?.id]);

  const isOnboarding = isAuthenticated && !hasStartedJourney;

  const startJourney = () => {
    if (!user?.id) return;
    clearAllFrisFocusData();
    const key = getOnboardingKey(user.id);
    localStorage.setItem(key, "true");
    setHasStartedJourney(true);
  };

  return (
    <OnboardingContext.Provider value={{ isOnboarding, hasStartedJourney, startJourney }}>
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
