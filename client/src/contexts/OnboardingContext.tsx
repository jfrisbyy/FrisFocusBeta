import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface OnboardingContextType {
  isOnboarding: boolean;
  hasStartedJourney: boolean;
  startJourney: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const STORAGE_KEY = "trust_the_process_started";

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [hasStartedJourney, setHasStartedJourney] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(STORAGE_KEY) === "true";
    }
    return false;
  });

  const isOnboarding = !hasStartedJourney;

  const startJourney = () => {
    localStorage.setItem(STORAGE_KEY, "true");
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
