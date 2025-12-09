import { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, User, AtSign, Mail, Camera, RefreshCw } from "lucide-react";
import { Separator } from "@/components/ui/separator";
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
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setUsername(user.username || "");
    setDisplayName(user.displayName || "");
    setUsernameError("");
    setDisplayNameError("");
    setPreviewUrl(null);
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

  const syncFromDevMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/sync-from-dev", {});
    },
    onSuccess: async (response) => {
      const data = await response.json();
      if (data.synced) {
        queryClient.invalidateQueries({ queryKey: ["/api/seasons"] });
        toast({ 
          title: "Data synced!", 
          description: `Successfully synced ${data.seasonsCount} seasons from development.` 
        });
      } else {
        toast({ 
          title: "Already synced", 
          description: data.message 
        });
      }
    },
    onError: (error: Error) => {
      toast({ title: "Sync failed", description: error.message, variant: "destructive" });
    },
  });

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast({ title: "Invalid file type", description: "Please select a JPG, PNG, GIF, or WebP image.", variant: "destructive" });
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({ title: "File too large", description: "Please select an image under 5MB.", variant: "destructive" });
      return;
    }

    const localPreviewUrl = URL.createObjectURL(file);
    setPreviewUrl(localPreviewUrl);
    setIsUploadingImage(true);

    try {
      const uploadUrlRes = await apiRequest("POST", "/api/media/upload-url", {});
      const { uploadURL } = await uploadUrlRes.json();

      const uploadResponse = await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload file to storage");
      }

      await apiRequest("PUT", "/api/media/profile-image", { imageURL: uploadURL });

      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      URL.revokeObjectURL(localPreviewUrl);
      setPreviewUrl(null);
      toast({ title: "Profile picture updated", description: "Your new profile picture has been saved." });
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      toast({ title: "Upload failed", description: "Failed to upload profile picture. Please try again.", variant: "destructive" });
      URL.revokeObjectURL(localPreviewUrl);
      setPreviewUrl(null);
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
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

  const fullName = user.displayName || [user.firstName, user.lastName].filter(Boolean).join(" ") || "User";
  const avatarSrc = previewUrl || getProfileImageUrl();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Your Profile</DialogTitle>
          <DialogDescription>View and edit your profile information</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          <div className="relative group">
            <Avatar className="h-20 w-20">
              <AvatarImage src={avatarSrc} alt={fullName} />
              <AvatarFallback className="text-2xl">{getInitials(user.firstName, user.lastName)}</AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingImage}
              className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              data-testid="button-change-avatar"
            >
              {isUploadingImage ? (
                <Loader2 className="h-6 w-6 text-white animate-spin" />
              ) : (
                <Camera className="h-6 w-6 text-white" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleFileSelect}
              className="hidden"
              data-testid="input-avatar-file"
            />
          </div>
          <p className="text-xs text-muted-foreground">Click the photo to change</p>

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

        <Separator className="my-4" />
        
        <div className="space-y-2">
          <Label className="text-sm font-medium">Data Sync</Label>
          <p className="text-xs text-muted-foreground">
            If your data isn't showing on this device, sync it from the development environment.
          </p>
          <Button 
            variant="outline" 
            onClick={() => syncFromDevMutation.mutate()}
            disabled={syncFromDevMutation.isPending}
            className="w-full gap-2"
            data-testid="button-sync-from-dev"
          >
            {syncFromDevMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Sync Data from Development
          </Button>
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
