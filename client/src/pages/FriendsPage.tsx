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
import { Users, UserPlus, Mail, Check, X, Settings, Trophy, Flame, Calendar, Loader2, Star, ChevronLeft, ChevronRight, Search, MessageSquare } from "lucide-react";
import ProfileHoverCard from "@/components/ProfileHoverCard";
import { getAvailableUsers, type DemoUser } from "@/lib/demoUsers";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Friend {
  id: string;
  friendId: string;
  displayName: string | null;
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
  displayName: string | null;
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
    displayName: null,
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
    displayName: null,
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
    displayName: null,
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
    displayName: null,
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
    displayName: null,
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
  const [directoryPage, setDirectoryPage] = useState(0);
  const [directorySearch, setDirectorySearch] = useState("");
  const USERS_PER_PAGE = 4;

  const { data: friends = [], isLoading: loadingFriends, isFetched: friendsFetched } = useQuery<Friend[]>({
    queryKey: ["/api/friends"],
    enabled: isAuthenticated,
  });

  const { data: incomingRequests = [], isLoading: loadingIncoming, isFetched: incomingFetched } = useQuery<FriendRequest[]>({
    queryKey: ["/api/friends/requests"],
    enabled: isAuthenticated,
  });

  const { data: outgoingRequests = [], isLoading: loadingOutgoing, isFetched: outgoingFetched } = useQuery<FriendRequest[]>({
    queryKey: ["/api/friends/requests/outgoing"],
    enabled: isAuthenticated,
  });

  const { data: settings, isFetched: settingsFetched } = useQuery<SharingSettings>({
    queryKey: ["/api/friends/settings"],
    enabled: isAuthenticated,
  });

  // Wait for API queries to be fetched before showing API data instead of demo data
  const apiQueriesReady = isDemo || (friendsFetched && incomingFetched && outgoingFetched && settingsFetched);

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

  const getInitials = (displayName: string | null, firstName: string | null, lastName: string | null) => {
    if (displayName) {
      const parts = displayName.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
      }
      return displayName.charAt(0).toUpperCase() || "?";
    }
    const first = firstName?.charAt(0) ?? "";
    const last = lastName?.charAt(0) ?? "";
    return (first + last).toUpperCase() || "?";
  };

  const getName = (displayName: string | null, firstName: string | null, lastName: string | null) => {
    if (displayName) return displayName;
    if (firstName && lastName) return `${firstName} ${lastName}`;
    if (firstName) return firstName;
    if (lastName) return lastName;
    return "Unknown User";
  };

  // Use demo data if in demo mode, or if API queries haven't finished loading yet
  const useDemoData = isDemo || !apiQueriesReady;
  const displayFriends = useDemoData ? demoFriends : friends;
  const displayIncoming = useDemoData ? demoIncomingRequests : incomingRequests;
  const displayOutgoing = useDemoData ? demoOutgoingRequests : outgoingRequests;
  const displaySettings = useDemoData ? demoSettings : settings;

  // User directory for discovering new users (demo mode only)
  const availableUsers = isDemo ? getAvailableUsers() : [];
  const filteredUsers = availableUsers.filter(user => {
    const searchLower = directorySearch.toLowerCase();
    return (
      user.displayName?.toLowerCase().includes(searchLower) ||
      user.username?.toLowerCase().includes(searchLower) ||
      user.firstName?.toLowerCase().includes(searchLower) ||
      user.lastName?.toLowerCase().includes(searchLower)
    );
  });
  const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice(
    directoryPage * USERS_PER_PAGE,
    (directoryPage + 1) * USERS_PER_PAGE
  );

  // Reset page when search changes
  const handleDirectorySearch = (value: string) => {
    setDirectorySearch(value);
    setDirectoryPage(0);
  };

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

          {/* User Directory - Discover new users (demo mode only) */}
          {isDemo && availableUsers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Discover Users
                </CardTitle>
                <CardDescription>Browse active users and connect with them</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search by name or username..."
                    value={directorySearch}
                    onChange={(e) => handleDirectorySearch(e.target.value)}
                    className="pl-9"
                    data-testid="input-directory-search"
                  />
                </div>

                {/* User list */}
                <div className="space-y-3">
                  {paginatedUsers.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      {directorySearch ? "No users match your search" : "No users available"}
                    </p>
                  ) : (
                    paginatedUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between gap-4 p-3 rounded-md bg-muted/30"
                        data-testid={`directory-user-${user.id}`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <ProfileHoverCard userId={user.id}>
                            <Avatar className="cursor-pointer">
                              <AvatarImage src={user.profileImageUrl ?? undefined} />
                              <AvatarFallback>{getInitials(user.displayName, user.firstName, user.lastName)}</AvatarFallback>
                            </Avatar>
                          </ProfileHoverCard>
                          <div className="min-w-0">
                            <ProfileHoverCard userId={user.id}>
                              <p className="font-medium truncate cursor-pointer hover:underline">
                                {getName(user.displayName, user.firstName, user.lastName)}
                              </p>
                            </ProfileHoverCard>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              {user.weeklyPoints !== undefined && (
                                <span className="flex items-center gap-1">
                                  <Trophy className="w-3 h-3" /> {user.weeklyPoints} pts
                                </span>
                              )}
                              {user.dayStreak !== undefined && (
                                <span className="flex items-center gap-1">
                                  <Flame className="w-3 h-3" /> {user.dayStreak}d
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              toast({ title: "Demo Mode", description: "Sign in to send messages" });
                            }}
                            data-testid={`button-message-${user.id}`}
                          >
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              toast({ title: "Demo Mode", description: "Sign in to add friends" });
                            }}
                            data-testid={`button-add-friend-${user.id}`}
                          >
                            <UserPlus className="w-4 h-4 mr-1" />
                            Add
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Pagination controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDirectoryPage(p => Math.max(0, p - 1))}
                      disabled={directoryPage === 0}
                      data-testid="button-directory-prev"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {directoryPage + 1} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDirectoryPage(p => Math.min(totalPages - 1, p + 1))}
                      disabled={directoryPage >= totalPages - 1}
                      data-testid="button-directory-next"
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

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
                        <AvatarFallback>{getInitials(request.displayName, request.firstName, request.lastName)}</AvatarFallback>
                      </Avatar>
                      <p className="font-medium">{getName(request.displayName, request.firstName, request.lastName)}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          if (isDemo) {
                            toast({ title: "Demo Mode", description: "Sign in to accept friend requests" });
                          } else {
                            acceptRequestMutation.mutate(request.id);
                          }
                        }}
                        disabled={!isDemo && acceptRequestMutation.isPending}
                        data-testid={`button-accept-friends-tab-${request.id}`}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (isDemo) {
                            toast({ title: "Demo Mode", description: "Sign in to manage friend requests" });
                          } else {
                            declineRequestMutation.mutate(request.id);
                          }
                        }}
                        disabled={!isDemo && declineRequestMutation.isPending}
                        data-testid={`button-decline-friends-tab-${request.id}`}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
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
                        <AvatarFallback>{getInitials(friend.displayName, friend.firstName, friend.lastName)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{getName(friend.displayName, friend.firstName, friend.lastName)}</p>
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
                        <AvatarFallback>{getInitials(request.displayName, request.firstName, request.lastName)}</AvatarFallback>
                      </Avatar>
                      <p className="font-medium">{getName(request.displayName, request.firstName, request.lastName)}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          if (isDemo) {
                            toast({ title: "Demo Mode", description: "Sign in to accept friend requests" });
                          } else {
                            acceptRequestMutation.mutate(request.id);
                          }
                        }}
                        disabled={!isDemo && acceptRequestMutation.isPending}
                        data-testid={`button-accept-${request.id}`}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (isDemo) {
                            toast({ title: "Demo Mode", description: "Sign in to manage friend requests" });
                          } else {
                            declineRequestMutation.mutate(request.id);
                          }
                        }}
                        disabled={!isDemo && declineRequestMutation.isPending}
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
                        <AvatarFallback>{getInitials(request.displayName, request.firstName, request.lastName)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{getName(request.displayName, request.firstName, request.lastName)}</p>
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
