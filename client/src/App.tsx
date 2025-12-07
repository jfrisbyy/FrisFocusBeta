import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { OnboardingProvider, useOnboarding } from "@/contexts/OnboardingContext";
import Navigation from "@/components/Navigation";
import StartJourneyButton from "@/components/StartJourneyButton";
import Dashboard from "@/pages/Dashboard";
import DailyPage from "@/pages/DailyPage";
import TasksPage from "@/pages/TasksPage";
import BadgesPage from "@/pages/BadgesPage";
import JournalPage from "@/pages/JournalPage";
import InsightsPage from "@/pages/InsightsPage";
import FitnessPage from "@/pages/FitnessPage";
import NotFound from "@/pages/not-found";

function Router() {
  const { hasStartedJourney } = useOnboarding();
  const routerKey = hasStartedJourney ? "journey" : "onboarding";
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
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <OnboardingProvider>
          <div className="min-h-screen bg-background">
            <Navigation />
            <main>
              <Router />
            </main>
            <StartJourneyButton />
          </div>
          <Toaster />
        </OnboardingProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
