import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, User, AtSign, Mail, Pencil } from "lucide-react";
import type { User as UserType } from "@shared/schema";

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserType;
}

export default function ProfileDialog({ open, onOpenChange, user }: ProfileDialogProps) {
  const { toast } = useToast();
  const [username, setUsername] = useState(user.username || "");
  const [displayName, setDisplayName] = useState(user.displayName || "");
  const [usernameError, setUsernameError] = useState("");
  const [displayNameError, setDisplayNameError] = useState("");

  useEffect(() => {
    setUsername(user.username || "");
    setDisplayName(user.displayName || "");
    setUsernameError("");
    setDisplayNameError("");
  }, [user.username, user.displayName, open]);

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

  const validateDisplayName = (value: string): boolean => {
    if (!value) {
      setDisplayNameError("");
      return true;
    }
    if (value.length > 50) {
      setDisplayNameError("Display name must be 50 characters or less");
      return false;
    }
    setDisplayNameError("");
    return true;
  };

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { username: string | null; displayName: string | null }) => {
      return apiRequest("PUT", "/api/auth/user", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Profile updated", description: "Your profile has been saved." });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSave = () => {
    const trimmedUsername = username.trim();
    const trimmedDisplayName = displayName.trim();
    if (trimmedUsername && !validateUsername(trimmedUsername)) {
      return;
    }
    if (trimmedDisplayName && !validateDisplayName(trimmedDisplayName)) {
      return;
    }
    updateProfileMutation.mutate({ 
      username: trimmedUsername || null,
      displayName: trimmedDisplayName || null
    });
  };

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    const first = firstName?.charAt(0) || "";
    const last = lastName?.charAt(0) || "";
    return (first + last).toUpperCase() || "U";
  };

  const fullName = user.displayName || [user.firstName, user.lastName].filter(Boolean).join(" ") || "User";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Your Profile</DialogTitle>
          <DialogDescription>View and edit your profile information</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={user.profileImageUrl || undefined} alt={fullName} />
            <AvatarFallback className="text-2xl">{getInitials(user.firstName, user.lastName)}</AvatarFallback>
          </Avatar>

          <div className="text-center">
            <p className="text-lg font-medium" data-testid="text-profile-name">{fullName}</p>
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
            <Label htmlFor="displayName" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Display Name
            </Label>
            <Input
              id="displayName"
              placeholder="Your name as shown to others"
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value);
                validateDisplayName(e.target.value);
              }}
              data-testid="input-profile-displayname"
            />
            {displayNameError && (
              <p className="text-sm text-destructive" data-testid="text-displayname-error">{displayNameError}</p>
            )}
            <p className="text-xs text-muted-foreground">
              This is the name others will see. Max 50 characters.
            </p>
          </div>

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
              Your unique @username for friends to find you. Use 3-20 characters: letters, numbers, or underscores.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-profile-cancel">
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={updateProfileMutation.isPending || !!usernameError || !!displayNameError}
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
