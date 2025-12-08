import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, MessageCircle, UserPlus, AtSign } from "lucide-react";
import { format } from "date-fns";

interface UserSummary {
  id: string;
  username: string | null;
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  createdAt: string | null;
}

interface ProfileHoverCardProps {
  userId: string;
  children: React.ReactNode;
  onMessageClick?: (userId: string) => void;
  onAddFriendClick?: (userId: string) => void;
  showActions?: boolean;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
}

export default function ProfileHoverCard({
  userId,
  children,
  onMessageClick,
  onAddFriendClick,
  showActions = true,
  side = "top",
  align = "center",
}: ProfileHoverCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  const { data: userSummary, isLoading, isError } = useQuery<UserSummary>({
    queryKey: ['/api/users', userId, 'summary'],
    enabled: isOpen && !!userId,
  });

  const getInitials = (firstName?: string | null, lastName?: string | null, displayName?: string | null) => {
    if (displayName) {
      const parts = displayName.split(" ");
      return (parts[0]?.charAt(0) || "") + (parts[1]?.charAt(0) || "");
    }
    const first = firstName?.charAt(0) || "";
    const last = lastName?.charAt(0) || "";
    return (first + last).toUpperCase() || "U";
  };

  const getDisplayName = (user: UserSummary) => {
    if (user.displayName) return user.displayName;
    const parts = [user.firstName, user.lastName].filter(Boolean);
    return parts.length > 0 ? parts.join(" ") : "User";
  };

  const formatJoinDate = (dateStr: string | null) => {
    if (!dateStr) return "Unknown";
    try {
      return format(new Date(dateStr), "MMMM yyyy");
    } catch {
      return "Unknown";
    }
  };

  return (
    <HoverCard openDelay={300} closeDelay={100} open={isOpen} onOpenChange={setIsOpen}>
      <HoverCardTrigger asChild>
        {children}
      </HoverCardTrigger>
      <HoverCardContent side={side} align={align} className="w-72">
        {isLoading ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-3 w-32" />
          </div>
        ) : isError || !userSummary ? (
          <div className="text-sm text-muted-foreground" data-testid="text-profile-error">
            Could not load profile
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={userSummary.profileImageUrl || undefined} alt={getDisplayName(userSummary)} />
                <AvatarFallback>
                  {getInitials(userSummary.firstName, userSummary.lastName, userSummary.displayName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="font-medium" data-testid={`text-hover-displayname-${userId}`}>
                  {getDisplayName(userSummary)}
                </span>
                {userSummary.username && (
                  <span className="text-sm text-muted-foreground flex items-center gap-1" data-testid={`text-hover-username-${userId}`}>
                    <AtSign className="h-3 w-3" />
                    {userSummary.username}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground" data-testid={`text-hover-joined-${userId}`}>
              <Calendar className="h-3.5 w-3.5" />
              <span>Joined {formatJoinDate(userSummary.createdAt)}</span>
            </div>

            {showActions && (
              <div className="flex gap-2 pt-1">
                {onMessageClick && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onMessageClick(userId)}
                    data-testid={`button-hover-dm-${userId}`}
                  >
                    <MessageCircle className="h-4 w-4 mr-1" />
                    Message
                  </Button>
                )}
                {onAddFriendClick && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onAddFriendClick(userId)}
                    data-testid={`button-hover-addfriend-${userId}`}
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    Add Friend
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </HoverCardContent>
    </HoverCard>
  );
}
