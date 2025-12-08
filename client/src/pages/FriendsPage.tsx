import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useDemo } from "@/contexts/DemoContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Users, UserPlus, Mail, Check, X, Settings, Trophy, Flame, Calendar, Loader2, Star } from "lucide-react";

interface Friend {
  id: string;
  friendId: string;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  weeklyPoints: number | null;
  dayStreak: number | null;
  weekStreak: number | null;
  totalBadgesEarned: number | null;
  sharePoints: boolean;
  shareStreaks: boolean;
  shareBadges: boolean;
}

interface FriendRequest {
  id: string;
  requesterId?: string;
  addresseeId?: string;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  createdAt: string;
}

interface SharingSettings {
  id: string;
  userId: string;
  sharePoints: boolean;
  shareStreaks: boolean;
  shareBadges: boolean;
  profilePublic: boolean;
}

const demoFriends: Friend[] = [
  {
    id: "demo-1",
    friendId: "friend-1",
    firstName: "Alex",
    lastName: "Chen",
    profileImageUrl: null,
    weeklyPoints: 485,
    dayStreak: 12,
    weekStreak: 4,
    totalBadgesEarned: 8,
    sharePoints: true,
    shareStreaks: true,
    shareBadges: true,
  },
  {
    id: "demo-2",
    friendId: "friend-2",
    firstName: "Jordan",
    lastName: "Taylor",
    profileImageUrl: null,
    weeklyPoints: 320,
    dayStreak: 7,
    weekStreak: 2,
    totalBadgesEarned: 5,
    sharePoints: true,
    shareStreaks: true,
    shareBadges: true,
  },
  {
    id: "demo-3",
    friendId: "friend-3",
    firstName: "Sam",
    lastName: "Rivera",
    profileImageUrl: null,
    weeklyPoints: 560,
    dayStreak: 21,
    weekStreak: 6,
    totalBadgesEarned: 12,
    sharePoints: true,
    shareStreaks: true,
    shareBadges: true,
  },
];

const demoIncomingRequests: FriendRequest[] = [
  {
    id: "req-1",
    requesterId: "user-4",
    firstName: "Morgan",
    lastName: "Kim",
    profileImageUrl: null,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

const demoOutgoingRequests: FriendRequest[] = [
  {
    id: "req-2",
    addresseeId: "user-5",
    firstName: "Casey",
    lastName: "Park",
    profileImageUrl: null,
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
];

const demoSettings: SharingSettings = {
  id: "settings-1",
  userId: "demo-user",
  sharePoints: true,
  shareStreaks: true,
  shareBadges: true,
  profilePublic: false,
};

export default function FriendsPage() {
  const { isAuthenticated } = useAuth();
  const { isDemo } = useDemo();
  const { toast } = useToast();
  const [emailOrUsername, setEmailOrUsername] = useState("");

  const { data: friends = [], isLoading: loadingFriends } = useQuery<Friend[]>({
    queryKey: ["/api/friends"],
    enabled: isAuthenticated,
  });

  const { data: incomingRequests = [], isLoading: loadingIncoming } = useQuery<FriendRequest[]>({
    queryKey: ["/api/friends/requests"],
    enabled: isAuthenticated,
  });

  const { data: outgoingRequests = [], isLoading: loadingOutgoing } = useQuery<FriendRequest[]>({
    queryKey: ["/api/friends/requests/outgoing"],
    enabled: isAuthenticated,
  });

  const { data: settings } = useQuery<SharingSettings>({
    queryKey: ["/api/friends/settings"],
    enabled: isAuthenticated,
  });

  const sendRequestMutation = useMutation({
    mutationFn: async (emailOrUsername: string) => {
      return apiRequest("POST", "/api/friends/request", { emailOrUsername });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends/requests/outgoing"] });
      setEmailOrUsername("");
      toast({ title: "Friend request sent", description: "Your friend request has been sent." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const acceptRequestMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("POST", `/api/friends/accept/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      queryClient.invalidateQueries({ queryKey: ["/api/friends/requests"] });
      toast({ title: "Request accepted", description: "You are now friends!" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const declineRequestMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("POST", `/api/friends/decline/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends/requests"] });
      toast({ title: "Request declined" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const removeFriendMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/friends/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      toast({ title: "Friend removed" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (updates: Partial<SharingSettings>) => {
      return apiRequest("PUT", "/api/friends/settings", updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends/settings"] });
      toast({ title: "Settings updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSendRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailOrUsername.trim()) {
      sendRequestMutation.mutate(emailOrUsername.trim());
    }
  };

  const getInitials = (firstName: string | null, lastName: string | null) => {
    const first = firstName?.charAt(0) ?? "";
    const last = lastName?.charAt(0) ?? "";
    return (first + last).toUpperCase() || "?";
  };

  const getName = (firstName: string | null, lastName: string | null) => {
    if (firstName && lastName) return `${firstName} ${lastName}`;
    if (firstName) return firstName;
    if (lastName) return lastName;
    return "Unknown User";
  };

  const displayFriends = isDemo ? demoFriends : friends;
  const displayIncoming = isDemo ? demoIncomingRequests : incomingRequests;
  const displayOutgoing = isDemo ? demoOutgoingRequests : outgoingRequests;
  const displaySettings = isDemo ? demoSettings : settings;

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Users className="w-8 h-8 text-foreground" />
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Friends</h1>
          <p className="text-muted-foreground">Connect and share your progress with friends</p>
        </div>
      </div>

      <Tabs defaultValue="friends" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="friends" data-testid="tab-friends">
            Friends {displayFriends.length > 0 && <Badge variant="secondary" className="ml-2">{displayFriends.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="requests" data-testid="tab-requests">
            Requests {displayIncoming.length > 0 && <Badge variant="default" className="ml-2">{displayIncoming.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="settings" data-testid="tab-settings">
            <Settings className="w-4 h-4 mr-1" /> Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="friends" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Add Friend
              </CardTitle>
              <CardDescription>Send a friend request by email or username</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendRequest} className="flex gap-2">
                <Input
                  type="text"
                  placeholder="email@example.com or username"
                  value={emailOrUsername}
                  onChange={(e) => setEmailOrUsername(e.target.value)}
                  data-testid="input-friend-email"
                />
                <Button type="submit" disabled={sendRequestMutation.isPending} data-testid="button-send-request">
                  {sendRequestMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                  <span className="ml-2">Send</span>
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Incoming Friend Requests - shown on Friends tab for visibility */}
          {displayIncoming.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  Pending Friend Requests
                  <Badge variant="default">{displayIncoming.length}</Badge>
                </CardTitle>
                <CardDescription>People who want to connect with you</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {displayIncoming.map((request) => (
                  <div key={request.id} className="flex items-center justify-between gap-4" data-testid={`request-incoming-friends-tab-${request.id}`}>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={request.profileImageUrl ?? undefined} />
                        <AvatarFallback>{getInitials(request.firstName, request.lastName)}</AvatarFallback>
                      </Avatar>
                      <p className="font-medium">{getName(request.firstName, request.lastName)}</p>
                    </div>
                    {!isDemo && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => acceptRequestMutation.mutate(request.id)}
                          disabled={acceptRequestMutation.isPending}
                          data-testid={`button-accept-friends-tab-${request.id}`}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => declineRequestMutation.mutate(request.id)}
                          disabled={declineRequestMutation.isPending}
                          data-testid={`button-decline-friends-tab-${request.id}`}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                    {isDemo && (
                      <div className="flex gap-2">
                        <Button size="sm" data-testid={`button-accept-friends-tab-${request.id}`}>
                          <Check className="w-4 h-4 mr-1" />
                          Accept
                        </Button>
                        <Button size="sm" variant="ghost" data-testid={`button-decline-friends-tab-${request.id}`}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {loadingFriends && !isDemo ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : displayFriends.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  No friends yet. Send a friend request to get started!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {displayFriends.map((friend) => (
                <Card key={friend.id} data-testid={`card-friend-${friend.friendId}`}>
                  <CardContent className="flex items-center justify-between gap-4 p-4">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={friend.profileImageUrl ?? undefined} />
                        <AvatarFallback>{getInitials(friend.firstName, friend.lastName)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{getName(friend.firstName, friend.lastName)}</p>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          {friend.weeklyPoints !== null && (
                            <span className="flex items-center gap-1">
                              <Trophy className="w-3 h-3" /> {friend.weeklyPoints} pts
                            </span>
                          )}
                          {friend.dayStreak !== null && (
                            <span className="flex items-center gap-1">
                              <Flame className="w-3 h-3" /> {friend.dayStreak}d
                            </span>
                          )}
                          {friend.weekStreak !== null && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> {friend.weekStreak}w
                            </span>
                          )}
                          {friend.totalBadgesEarned !== null && (
                            <span className="flex items-center gap-1">
                              <Star className="w-3 h-3" /> {friend.totalBadgesEarned} badges
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {!isDemo && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFriendMutation.mutate(friend.id)}
                        disabled={removeFriendMutation.isPending}
                        data-testid={`button-remove-friend-${friend.friendId}`}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="requests" className="space-y-4 mt-4">
          {displayIncoming.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Incoming Requests</CardTitle>
                <CardDescription>People who want to be your friend</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {displayIncoming.map((request) => (
                  <div key={request.id} className="flex items-center justify-between gap-4" data-testid={`request-incoming-${request.id}`}>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={request.profileImageUrl ?? undefined} />
                        <AvatarFallback>{getInitials(request.firstName, request.lastName)}</AvatarFallback>
                      </Avatar>
                      <p className="font-medium">{getName(request.firstName, request.lastName)}</p>
                    </div>
                    {!isDemo && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => acceptRequestMutation.mutate(request.id)}
                          disabled={acceptRequestMutation.isPending}
                          data-testid={`button-accept-${request.id}`}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => declineRequestMutation.mutate(request.id)}
                          disabled={declineRequestMutation.isPending}
                          data-testid={`button-decline-${request.id}`}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                    {isDemo && (
                      <div className="flex gap-2">
                        <Button size="sm" data-testid={`button-accept-${request.id}`}>
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" data-testid={`button-decline-${request.id}`}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {displayOutgoing.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Sent Requests</CardTitle>
                <CardDescription>Waiting for their response</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {displayOutgoing.map((request) => (
                  <div key={request.id} className="flex items-center justify-between gap-4" data-testid={`request-outgoing-${request.id}`}>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={request.profileImageUrl ?? undefined} />
                        <AvatarFallback>{getInitials(request.firstName, request.lastName)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{getName(request.firstName, request.lastName)}</p>
                        <Badge variant="outline">Pending</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {displayIncoming.length === 0 && displayOutgoing.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Mail className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">No pending friend requests</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Sharing Settings</CardTitle>
              <CardDescription>Control what friends can see about you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="share-points">Share Weekly Points</Label>
                  <p className="text-sm text-muted-foreground">Let friends see your weekly points</p>
                </div>
                <Switch
                  id="share-points"
                  checked={displaySettings?.sharePoints ?? true}
                  onCheckedChange={(checked) => !isDemo && updateSettingsMutation.mutate({ sharePoints: checked })}
                  data-testid="switch-share-points"
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="share-streaks">Share Streaks</Label>
                  <p className="text-sm text-muted-foreground">Let friends see your day and week streaks</p>
                </div>
                <Switch
                  id="share-streaks"
                  checked={displaySettings?.shareStreaks ?? true}
                  onCheckedChange={(checked) => !isDemo && updateSettingsMutation.mutate({ shareStreaks: checked })}
                  data-testid="switch-share-streaks"
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="share-badges">Share Badges</Label>
                  <p className="text-sm text-muted-foreground">Let friends see how many badges you have earned</p>
                </div>
                <Switch
                  id="share-badges"
                  checked={displaySettings?.shareBadges ?? true}
                  onCheckedChange={(checked) => !isDemo && updateSettingsMutation.mutate({ shareBadges: checked })}
                  data-testid="switch-share-badges"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
