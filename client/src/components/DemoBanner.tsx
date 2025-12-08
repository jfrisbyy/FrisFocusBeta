import { Button } from "@/components/ui/button";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { SiGoogle } from "react-icons/si";

export default function DemoBanner() {
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  return (
    <div className="bg-primary/10 border-b border-primary/20 px-4 py-2">
      <div className="flex items-center justify-center gap-4 flex-wrap">
        <span className="text-sm text-muted-foreground" data-testid="text-demo-banner">
          You're viewing demo data. Sign in to track your own habits.
        </span>
        <Button 
          size="sm" 
          variant="default"
          onClick={handleLogin}
          data-testid="button-login-banner"
          className="gap-2"
        >
          <SiGoogle className="h-4 w-4" />
          Sign In with Google
        </Button>
      </div>
    </div>
  );
}
