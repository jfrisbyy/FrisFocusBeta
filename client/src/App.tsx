import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { OnboardingProvider, useOnboarding } from "@/contexts/OnboardingContext";
import { DemoProvider } from "@/contexts/DemoContext";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/Navigation";
import DemoBanner from "@/components/DemoBanner";
import StartJourneyButton from "@/components/StartJourneyButton";
import Dashboard from "@/pages/Dashboard";
import DailyPage from "@/pages/DailyPage";
import TasksPage from "@/pages/TasksPage";
import BadgesPage from "@/pages/BadgesPage";
import JournalPage from "@/pages/JournalPage";
import InsightsPage from "@/pages/InsightsPage";
import FitnessPage from "@/pages/FitnessPage";
import CommunityPage from "@/pages/CommunityPage";
import NotFound from "@/pages/not-found";

function Router() {
  const { hasStartedJourney } = useOnboarding();
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const routerKey = isAuthenticated ? (hasStartedJourney ? "journey" : "onboarding") : "demo";
  return (
    <div key={routerKey}>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/daily" component={DailyPage} />
        <Route path="/tasks" component={TasksPage} />
        <Route path="/badges" component={BadgesPage} />
        <Route path="/journal" component={JournalPage} />
        <Route path="/insights" component={InsightsPage} />
        <Route path="/fitness" component={FitnessPage} />
        <Route path="/community" component={CommunityPage} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function AuthenticatedApp() {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {!isAuthenticated && <DemoBanner />}
      <Navigation />
      <main>
        <Router />
      </main>
      {isAuthenticated && <StartJourneyButton />}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <OnboardingProvider>
          <DemoProvider>
            <AuthenticatedApp />
          </DemoProvider>
          <Toaster />
        </OnboardingProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
