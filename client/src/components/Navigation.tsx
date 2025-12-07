import { Link, useLocation } from "wouter";
import { LayoutDashboard, CalendarCheck, ListTodo, Award, BookOpen, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/daily", label: "Daily", icon: CalendarCheck },
  { path: "/tasks", label: "Tasks", icon: ListTodo },
  { path: "/badges", label: "Badges", icon: Award },
  { path: "/journal", label: "Journal", icon: BookOpen },
  { path: "/insights", label: "Insights", icon: Sparkles },
];

export default function Navigation() {
  const [location] = useLocation();

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
      <div className="flex items-center justify-between gap-4 px-4 py-3 md:px-6">
        <h1 className="text-xl font-semibold tracking-tight">Trust The Process</h1>
        <nav className="flex items-center gap-1 flex-wrap">
          {navItems.map((item) => {
            const isActive = location === item.path;
            return (
              <Link key={item.path} href={item.path}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  size="sm"
                  data-testid={`nav-${item.label.toLowerCase()}`}
                  className="gap-2"
                >
                  <item.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Button>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
