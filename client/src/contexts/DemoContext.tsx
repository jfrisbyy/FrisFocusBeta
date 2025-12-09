import { createContext, useContext, ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useOnboarding } from "@/contexts/OnboardingContext";

interface DemoContextType {
  isDemo: boolean;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export function DemoProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const { isOnboarding } = useOnboarding();
  
  // Show demo data if not authenticated OR during onboarding (before pressing "Start your journey")
  const isDemo = !isAuthenticated || isOnboarding;

  return (
    <DemoContext.Provider value={{ isDemo }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (context === undefined) {
    throw new Error("useDemo must be used within a DemoProvider");
  }
  return context;
}
