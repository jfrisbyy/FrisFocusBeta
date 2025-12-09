import { useState } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, CalendarCheck, ListTodo, Award, BookOpen, Sparkles, Dumbbell, Users, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { SiGoogle } from "react-icons/si";
import ProfileDialog from "@/components/ProfileDialog";

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
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    const first = firstName?.charAt(0) || "";
    const last = lastName?.charAt(0) || "";
    return (first + last).toUpperCase() || "U";
  };

  const getProfileImageUrl = () => {
    if (!user?.profileImageUrl) return undefined;
    const timestamp = user.updatedAt ? new Date(user.updatedAt).getTime() : Date.now();
    return `${user.profileImageUrl}?v=${timestamp}`;
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
            <button
              onClick={() => setProfileOpen(true)}
              className="flex items-center gap-2 rounded-md hover-elevate active-elevate-2 p-1 -m-1"
              data-testid="button-open-profile"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={getProfileImageUrl()} alt={user.firstName || "User"} />
                <AvatarFallback>{getInitials(user.firstName, user.lastName)}</AvatarFallback>
              </Avatar>
              <span className="hidden md:inline text-sm text-muted-foreground">
                {user.firstName || user.email?.split("@")[0] || "User"}
              </span>
            </button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              data-testid="button-logout"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
            <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} user={user} />
          </div>
        ) : (
          <Button
            variant="default"
            size="sm"
            onClick={handleLogin}
            data-testid="button-login"
            className="gap-2"
          >
            <SiGoogle className="h-4 w-4" />
            Sign in with Google
          </Button>
        )}
      </div>
    </header>
  );
}
