import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navigation from "@/components/Navigation";
import Dashboard from "@/pages/Dashboard";
import DailyPage from "@/pages/DailyPage";
import TasksPage from "@/pages/TasksPage";
import BadgesPage from "@/pages/BadgesPage";
import JournalPage from "@/pages/JournalPage";
import InsightsPage from "@/pages/InsightsPage";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/daily" component={DailyPage} />
      <Route path="/tasks" component={TasksPage} />
      <Route path="/badges" component={BadgesPage} />
      <Route path="/journal" component={JournalPage} />
      <Route path="/insights" component={InsightsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background">
          <Navigation />
          <main>
            <Router />
          </main>
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
