import { Link, useLocation } from "wouter";
import { LayoutDashboard, CalendarCheck, ListTodo, Award, BookOpen, Sparkles, Dumbbell, Users, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/daily", label: "Daily", icon: CalendarCheck },
  { path: "/tasks", label: "Tasks", icon: ListTodo },
  { path: "/badges", label: "Badges", icon: Award },
  { path: "/journal", label: "Journal", icon: BookOpen },
  { path: "/insights", label: "Insights", icon: Sparkles },
  { path: "/fitness", label: "Fitness", icon: Dumbbell },
  { path: "/community", label: "Community", icon: Users },
];

export default function Navigation() {
  const [location] = useLocation();
  const { user } = useAuth();

  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    const first = firstName?.charAt(0) || "";
    const last = lastName?.charAt(0) || "";
    return (first + last).toUpperCase() || "U";
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
      <div className="flex items-center justify-between gap-4 px-4 py-3 md:px-6">
        <h1 className="text-xl font-semibold tracking-tight">FrisFocus</h1>
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
        
        {user ? (
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.profileImageUrl || undefined} alt={user.firstName || "User"} />
              <AvatarFallback>{getInitials(user.firstName, user.lastName)}</AvatarFallback>
            </Avatar>
            <span className="hidden md:inline text-sm text-muted-foreground">
              {user.firstName || user.email?.split("@")[0] || "User"}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              data-testid="button-logout"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            variant="default"
            size="sm"
            onClick={handleLogin}
            data-testid="button-login"
          >
            Login
          </Button>
        )}
      </div>
    </header>
  );
}
