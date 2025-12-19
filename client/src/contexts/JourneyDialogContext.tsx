import { createContext, useContext, useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Rocket, User, AtSign, Loader2, AlertCircle } from "lucide-react";
import { useOnboarding } from "@/contexts/OnboardingContext";

interface JourneyDialogContextType {
  openDialog: () => void;
}

const JourneyDialogContext = createContext<JourneyDialogContextType | undefined>(undefined);

export function useJourneyDialog() {
  const context = useContext(JourneyDialogContext);
  if (!context) {
    throw new Error("useJourneyDialog must be used within JourneyDialogProvider");
  }
  return context;
}

function StartJourneyDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const { startJourney } = useOnboarding();
  const { refetchUser } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [displayNameError, setDisplayNameError] = useState("");
  const [usernameError, setUsernameError] = useState("");

  const resetForm = () => {
    setDisplayName("");
    setUsername("");
    setDisplayNameError("");
    setUsernameError("");
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  const validateDisplayName = (value: string): boolean => {
    if (!value.trim()) {
      setDisplayNameError("Display name is required");
      return false;
    }
    if (value.length > 50) {
      setDisplayNameError("Display name must be 50 characters or less");
      return false;
    }
    setDisplayNameError("");
    return true;
  };

  const validateUsername = (value: string): boolean => {
    if (!value.trim()) {
      setUsernameError("Username is required");
      return false;
    }
    if (value.length < 3) {
      setUsernameError("Username must be at least 3 characters");
      return false;
    }
    if (value.length > 20) {
      setUsernameError("Username must be 20 characters or less");
      return false;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      setUsernameError("Username can only contain letters, numbers, and underscores");
      return false;
    }
    setUsernameError("");
    return true;
  };

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { username: string; displayName: string; hasStartedJourney: boolean }) => {
      return apiRequest("PUT", "/api/auth/user", data);
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      // Also refresh the useAuth hook's internal state
      await refetchUser();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleConfirm = async () => {
    const trimmedDisplayName = displayName.trim();
    const trimmedUsername = username.trim();

    const isDisplayNameValid = validateDisplayName(trimmedDisplayName);
    const isUsernameValid = validateUsername(trimmedUsername);

    if (!isDisplayNameValid || !isUsernameValid) {
      return;
    }

    try {
      await updateProfileMutation.mutateAsync({
        username: trimmedUsername,
        displayName: trimmedDisplayName,
        hasStartedJourney: true,
      });
      startJourney();
      onOpenChange(false);
      toast({
        title: "Welcome to FrisFocus!",
        description: "Your journey begins now. Start by setting up your tasks.",
      });
    } catch (error) {
      console.error("Failed to start journey:", error);
    }
  };

  const hasErrors = !!displayNameError || !!usernameError;
  const isFormEmpty = !displayName.trim() || !username.trim();

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            Set Up Your Profile
          </DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-2 p-3 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>
                  You're currently viewing <strong>demo data</strong> to explore how the app works. 
                  When you start your journey, all sample data will be cleared.
                </span>
              </div>
              <p>
                Ready to begin? Fill in your profile below. Or click "Keep Exploring" to 
                continue learning about the app - the "Start My Journey" button will be 
                waiting for you when you're ready.
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="journey-displayName" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Display Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="journey-displayName"
              placeholder="How you want to be called"
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value);
                if (displayNameError) validateDisplayName(e.target.value);
              }}
              onBlur={() => validateDisplayName(displayName)}
              data-testid="input-journey-displayname"
            />
            {displayNameError && (
              <p className="text-sm text-destructive" data-testid="text-journey-displayname-error">{displayNameError}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="journey-username" className="flex items-center gap-2">
              <AtSign className="h-4 w-4" />
              Username <span className="text-destructive">*</span>
            </Label>
            <Input
              id="journey-username"
              placeholder="your_username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (usernameError) validateUsername(e.target.value);
              }}
              onBlur={() => validateUsername(username)}
              data-testid="input-journey-username"
            />
            {usernameError && (
              <p className="text-sm text-destructive" data-testid="text-journey-username-error">{usernameError}</p>
            )}
            <p className="text-xs text-muted-foreground">
              3-20 characters: letters, numbers, or underscores only
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-start-journey">
            Keep Exploring
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={updateProfileMutation.isPending || hasErrors || isFormEmpty}
            data-testid="button-confirm-start-journey"
          >
            {updateProfileMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Rocket className="h-4 w-4 mr-2" />
            )}
            Start My Journey
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function JourneyDialogProvider({ children }: { children: React.ReactNode }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { isOnboarding } = useOnboarding();

  // Auto-open dialog when user is in onboarding mode (hasn't started journey yet)
  useEffect(() => {
    if (isOnboarding) {
      setDialogOpen(true);
    }
  }, [isOnboarding]);

  const openDialog = () => setDialogOpen(true);

  return (
    <JourneyDialogContext.Provider value={{ openDialog }}>
      {children}
      {isOnboarding && <StartJourneyDialog open={dialogOpen} onOpenChange={setDialogOpen} />}
    </JourneyDialogContext.Provider>
  );
}
