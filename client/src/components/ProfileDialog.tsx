import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, User, AtSign, Mail } from "lucide-react";
import type { User as UserType } from "@shared/schema";

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserType;
}

export default function ProfileDialog({ open, onOpenChange, user }: ProfileDialogProps) {
  const { toast } = useToast();
  const [username, setUsername] = useState(user.username || "");
  const [usernameError, setUsernameError] = useState("");

  useEffect(() => {
    setUsername(user.username || "");
    setUsernameError("");
  }, [user.username, open]);

  const validateUsername = (value: string): boolean => {
    if (!value) {
      setUsernameError("");
      return true;
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
    mutationFn: async (data: { username: string | null }) => {
      return apiRequest("PUT", "/api/auth/user", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Profile updated", description: "Your username has been saved." });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSave = () => {
    const trimmedUsername = username.trim();
    if (trimmedUsername && !validateUsername(trimmedUsername)) {
      return;
    }
    updateProfileMutation.mutate({ username: trimmedUsername || null });
  };

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    const first = firstName?.charAt(0) || "";
    const last = lastName?.charAt(0) || "";
    return (first + last).toUpperCase() || "U";
  };

  const displayName = [user.firstName, user.lastName].filter(Boolean).join(" ") || "User";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Your Profile</DialogTitle>
          <DialogDescription>View and edit your profile information</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={user.profileImageUrl || undefined} alt={displayName} />
            <AvatarFallback className="text-2xl">{getInitials(user.firstName, user.lastName)}</AvatarFallback>
          </Avatar>

          <div className="text-center">
            <p className="text-lg font-medium" data-testid="text-profile-name">{displayName}</p>
            {user.email && (
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-1" data-testid="text-profile-email">
                <Mail className="h-3 w-3" />
                {user.email}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username" className="flex items-center gap-2">
              <AtSign className="h-4 w-4" />
              Username
            </Label>
            <Input
              id="username"
              placeholder="your_username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                validateUsername(e.target.value);
              }}
              data-testid="input-profile-username"
            />
            {usernameError && (
              <p className="text-sm text-destructive" data-testid="text-username-error">{usernameError}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Your username allows friends to find you without sharing your email. Use 3-20 characters: letters, numbers, or underscores.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-profile-cancel">
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={updateProfileMutation.isPending || !!usernameError}
            data-testid="button-profile-save"
          >
            {updateProfileMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Save"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
