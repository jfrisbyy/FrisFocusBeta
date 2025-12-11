import { createContext, useContext, ReactNode } from "react";
import { clearAllFrisFocusData } from "@/lib/storage";
import { useAuth } from "@/hooks/useAuth";

interface OnboardingContextType {
  isOnboarding: boolean;
  hasStartedJourney: boolean;
  startJourney: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, refetchUser } = useAuth();
  
  // Use the database field directly from user object
  const hasStartedJourney = user?.hasStartedJourney ?? false;
  const isOnboarding = isAuthenticated && !hasStartedJourney;

  const startJourney = async () => {
    if (!user?.id) return;
    clearAllFrisFocusData();
    // Refetch user to get the updated hasStartedJourney from the database
    // The actual update is done in the JourneyDialogContext when saving the profile
    await refetchUser();
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
