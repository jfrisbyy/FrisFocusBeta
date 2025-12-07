import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
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
import { Users, UserPlus, Mail, Check, X, Settings, Trophy, Flame, Calendar, Loader2 } from "lucide-react";

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

export default function FriendsPage() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");

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
    mutationFn: async (email: string) => {
      return apiRequest("POST", "/api/friends/request", { email });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends/requests/outgoing"] });
      setEmail("");
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
    if (email.trim()) {
      sendRequestMutation.mutate(email.trim());
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

  if (!isAuthenticated) {
    return (
      <div className="container max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="w-12 h-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Sign in to view friends</h2>
            <p className="text-muted-foreground text-center">
              Connect with friends and share your progress together.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

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
            Friends {friends.length > 0 && <Badge variant="secondary" className="ml-2">{friends.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="requests" data-testid="tab-requests">
            Requests {incomingRequests.length > 0 && <Badge variant="default" className="ml-2">{incomingRequests.length}</Badge>}
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
              <CardDescription>Send a friend request by email</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendRequest} className="flex gap-2">
                <Input
                  type="email"
                  placeholder="friend@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  data-testid="input-friend-email"
                />
                <Button type="submit" disabled={sendRequestMutation.isPending} data-testid="button-send-request">
                  {sendRequestMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                  <span className="ml-2">Send</span>
                </Button>
              </form>
            </CardContent>
          </Card>

          {loadingFriends ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : friends.length === 0 ? (
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
              {friends.map((friend) => (
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
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFriendMutation.mutate(friend.id)}
                      disabled={removeFriendMutation.isPending}
                      data-testid={`button-remove-friend-${friend.friendId}`}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="requests" className="space-y-4 mt-4">
          {incomingRequests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Incoming Requests</CardTitle>
                <CardDescription>People who want to be your friend</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {incomingRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between gap-4" data-testid={`request-incoming-${request.id}`}>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={request.profileImageUrl ?? undefined} />
                        <AvatarFallback>{getInitials(request.firstName, request.lastName)}</AvatarFallback>
                      </Avatar>
                      <p className="font-medium">{getName(request.firstName, request.lastName)}</p>
                    </div>
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
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {outgoingRequests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Sent Requests</CardTitle>
                <CardDescription>Waiting for their response</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {outgoingRequests.map((request) => (
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

          {incomingRequests.length === 0 && outgoingRequests.length === 0 && (
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
                  checked={settings?.sharePoints ?? true}
                  onCheckedChange={(checked) => updateSettingsMutation.mutate({ sharePoints: checked })}
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
                  checked={settings?.shareStreaks ?? true}
                  onCheckedChange={(checked) => updateSettingsMutation.mutate({ shareStreaks: checked })}
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
                  checked={settings?.shareBadges ?? true}
                  onCheckedChange={(checked) => updateSettingsMutation.mutate({ shareBadges: checked })}
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
