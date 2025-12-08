import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, TrendingUp, Award, Calendar } from "lucide-react";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { SiGoogle } from "react-icons/si";

export default function LandingPage() {
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4" data-testid="text-hero-title">
            FrisFocus
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto" data-testid="text-hero-description">
            Build consistent habits through a point-based tracking system. 
            Earn rewards, track progress, and achieve your goals.
          </p>
          <Button 
            size="lg" 
            onClick={handleLogin}
            data-testid="button-login-hero"
            className="gap-2"
          >
            <SiGoogle className="h-5 w-5" />
            Sign In with Google
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          <Card>
            <CardHeader className="pb-2">
              <Target className="h-8 w-8 text-muted-foreground mb-2" />
              <CardTitle className="text-lg">Daily Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Create custom tasks with point values and track your daily completions.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <TrendingUp className="h-8 w-8 text-muted-foreground mb-2" />
              <CardTitle className="text-lg">Boosters</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Earn bonus points through achievement-based rewards for hitting milestones.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <Award className="h-8 w-8 text-muted-foreground mb-2" />
              <CardTitle className="text-lg">Badges</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Unlock badges as you build streaks and achieve consistency.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <Calendar className="h-8 w-8 text-muted-foreground mb-2" />
              <CardTitle className="text-lg">Weekly Goals</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Set weekly point goals and track your progress over time.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-16">
          <p className="text-sm text-muted-foreground">
            Sign in with Google to sync your data across all devices.
          </p>
        </div>
      </div>
    </div>
  );
}
