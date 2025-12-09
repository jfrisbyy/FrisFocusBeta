import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Bell, UserPlus, UserCheck, ListTodo, CheckCircle, MessageCircle, Heart, MessageSquare, Users, Swords, AlertTriangle, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useDemo } from "@/contexts/DemoContext";
import type { NotificationWithActor } from "@shared/schema";
import { formatDistanceToNow, subHours, subMinutes, subDays } from "date-fns";

const notificationIcons: Record<string, typeof Bell> = {
  friend_request: UserPlus,
  friend_accepted: UserCheck,
  task_request: ListTodo,
  task_approved: CheckCircle,
  instant_message: MessageCircle,
  post_like: Heart,
  post_comment: MessageSquare,
  circle_invitation: Users,
  circle_compete_invite: Swords,
  task_alert: AlertTriangle,
};

const notificationRoutes: Record<string, string> = {
  friend_request: "/community",
  friend_accepted: "/community",
  task_request: "/tasks",
  task_approved: "/tasks",
  instant_message: "/community",
  post_like: "/community",
  post_comment: "/community",
  circle_invitation: "/community",
  circle_compete_invite: "/community",
  task_alert: "/daily",
};

const demoNotifications: NotificationWithActor[] = [
  {
    id: "demo-1",
    userId: "demo",
    type: "friend_request",
    title: "New Friend Request",
    message: "Alex Chen wants to be your friend! Check your pending requests.",
    read: false,
    actorId: "friend-1",
    resourceId: "demo-friend-1",
    resourceType: "friendship",
    createdAt: subMinutes(new Date(), 5),
    actor: { id: "friend-1", firstName: "Alex", lastName: "Chen", displayName: "Alex Chen", profileImageUrl: null },
  },
  {
    id: "demo-2",
    userId: "demo",
    type: "post_like",
    title: "Someone liked your post",
    message: "Jordan Taylor liked your post: 'Great workout session today!'",
    read: false,
    actorId: "friend-2",
    resourceId: "demo-post-1",
    resourceType: "post",
    createdAt: subMinutes(new Date(), 30),
    actor: { id: "friend-2", firstName: "Jordan", lastName: "Taylor", displayName: "Jordan Taylor", profileImageUrl: null },
  },
  {
    id: "demo-3",
    userId: "demo",
    type: "post_comment",
    title: "New Comment",
    message: "Sam Rivera commented: 'Keep up the amazing work!'",
    read: false,
    actorId: "friend-3",
    resourceId: "demo-post-2",
    resourceType: "post",
    createdAt: subHours(new Date(), 2),
    actor: { id: "friend-3", firstName: "Sam", lastName: "Rivera", displayName: "Sam Rivera", profileImageUrl: null },
  },
  {
    id: "demo-4",
    userId: "demo",
    type: "circle_invitation",
    title: "Circle Invitation",
    message: "You've been invited to join 'Morning Warriors' fitness circle.",
    read: false,
    actorId: "friend-4",
    resourceId: "demo-circle-1",
    resourceType: "circle",
    createdAt: subHours(new Date(), 5),
    actor: { id: "friend-4", firstName: "Morgan", lastName: "Kim", displayName: "Morgan Kim", profileImageUrl: null },
  },
  {
    id: "demo-5",
    userId: "demo",
    type: "circle_compete_invite",
    title: "Challenge Invite",
    message: "Emily Roberts challenged you to a 7-day workout challenge!",
    read: true,
    actorId: "available-3",
    resourceId: "demo-challenge-1",
    resourceType: "challenge",
    createdAt: subDays(new Date(), 1),
    actor: { id: "available-3", firstName: "Emily", lastName: "Roberts", displayName: "Emily Roberts", profileImageUrl: null },
  },
  {
    id: "demo-6",
    userId: "demo",
    type: "instant_message",
    title: "New Message",
    message: "David Lee: 'Hey! Want to join our step challenge?'",
    read: true,
    actorId: "available-4",
    resourceId: "demo-dm-1",
    resourceType: "direct_message",
    createdAt: subDays(new Date(), 1),
    actor: { id: "available-4", firstName: "David", lastName: "Lee", displayName: "David Lee", profileImageUrl: null },
  },
  {
    id: "demo-7",
    userId: "demo",
    type: "friend_accepted",
    title: "Friend Request Accepted",
    message: "Sarah Williams accepted your friend request!",
    read: true,
    actorId: "available-5",
    resourceId: "demo-friend-2",
    resourceType: "friendship",
    createdAt: subDays(new Date(), 2),
    actor: { id: "available-5", firstName: "Sarah", lastName: "Williams", displayName: "Sarah Williams", profileImageUrl: null },
  },
  {
    id: "demo-8",
    userId: "demo",
    type: "task_alert",
    title: "Daily Reminder",
    message: "Don't forget to complete your morning meditation!",
    read: true,
    actorId: null,
    resourceId: "demo-task-1",
    resourceType: "task",
    createdAt: subDays(new Date(), 3),
    actor: null,
  },
];

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { isDemo } = useDemo();
  const [demoReadIds, setDemoReadIds] = useState<Set<string>>(new Set());

  const { data: apiNotifications = [], isLoading } = useQuery<NotificationWithActor[]>({
    queryKey: ["/api/notifications"],
    refetchInterval: 30000,
    enabled: !isDemo,
  });

  const { data: countData } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/count"],
    refetchInterval: 30000,
    enabled: !isDemo,
  });

  const notifications = isDemo 
    ? demoNotifications.map(n => ({ ...n, read: n.read || demoReadIds.has(n.id) }))
    : apiNotifications;

  const unreadCount = isDemo 
    ? demoNotifications.filter(n => !n.read && !demoReadIds.has(n.id)).length
    : (countData?.count || 0);

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("PATCH", `/api/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/count"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", "/api/notifications/read-all");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/count"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/notifications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/count"] });
    },
  });

  const handleNotificationClick = (notification: NotificationWithActor) => {
    if (isDemo) {
      setDemoReadIds(prev => new Set(Array.from(prev).concat(notification.id)));
    } else if (!notification.read) {
      markReadMutation.mutate(notification.id);
    }
    const route = notificationRoutes[notification.type] || "/";
    setOpen(false);
    setLocation(route);
  };

  const handleMarkAllRead = () => {
    if (isDemo) {
      setDemoReadIds(new Set(demoNotifications.map(n => n.id)));
    } else {
      markAllReadMutation.mutate();
    }
  };

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    const first = firstName?.charAt(0) || "";
    const last = lastName?.charAt(0) || "";
    return (first + last).toUpperCase() || "?";
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          data-testid="button-notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-4 min-w-4 p-0 flex items-center justify-center text-[10px]"
              data-testid="badge-notification-count"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
          <h4 className="font-medium text-sm">Notifications</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={!isDemo && markAllReadMutation.isPending}
              className="h-7 text-xs"
              data-testid="button-mark-all-read"
            >
              <Check className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-80">
          {isLoading && !isDemo ? (
            <div className="flex items-center justify-center h-20">
              <span className="text-sm text-muted-foreground">Loading...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-20 text-muted-foreground">
              <Bell className="h-6 w-6 mb-2 opacity-50" />
              <span className="text-sm">No notifications</span>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => {
                const Icon = notificationIcons[notification.type] || Bell;
                return (
                  <div
                    key={notification.id}
                    className={`flex items-start gap-3 p-3 hover-elevate cursor-pointer ${
                      !notification.read ? "bg-muted/30" : ""
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                    data-testid={`notification-item-${notification.id}`}
                  >
                    {notification.actor ? (
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage
                          src={notification.actor.profileImageUrl || undefined}
                          alt={notification.actor.firstName || "User"}
                        />
                        <AvatarFallback className="text-xs">
                          {getInitials(notification.actor.firstName, notification.actor.lastName)}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-tight truncate">
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {notification.createdAt
                          ? formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })
                          : "Just now"}
                      </p>
                    </div>
                    {!isDemo && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 flex-shrink-0 opacity-0 group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteMutation.mutate(notification.id);
                        }}
                        data-testid={`button-delete-notification-${notification.id}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
