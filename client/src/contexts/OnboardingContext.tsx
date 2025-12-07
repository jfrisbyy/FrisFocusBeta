import { createContext, useContext, useState, ReactNode } from "react";
import { clearAllFrisFocusData, STORAGE_KEYS } from "@/lib/storage";

interface OnboardingContextType {
  isOnboarding: boolean;
  hasStartedJourney: boolean;
  startJourney: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [hasStartedJourney, setHasStartedJourney] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(STORAGE_KEYS.ONBOARDING) === "true";
    }
    return false;
  });

  const isOnboarding = !hasStartedJourney;

  const startJourney = () => {
    // Clear all existing data when starting fresh journey
    clearAllFrisFocusData();
    // Then mark as started
    localStorage.setItem(STORAGE_KEYS.ONBOARDING, "true");
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
