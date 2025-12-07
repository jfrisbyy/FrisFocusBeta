import { useState, useMemo } from "react";
import { useDemo } from "@/contexts/DemoContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Users,
  UserPlus,
  Mail,
  Check,
  X,
  Trophy,
  Flame,
  Calendar,
  Star,
  Eye,
  EyeOff,
  Settings,
  CircleDot,
  Plus,
  Crown,
  Shield,
  Target,
  ChevronRight,
  Award,
} from "lucide-react";
import type { StoredFriend, StoredCircle, StoredCircleMember, StoredCircleTask, VisibilityLevel } from "@/lib/storage";

interface FriendRequest {
  id: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
  createdAt: string;
  direction: "incoming" | "outgoing";
}

interface CircleBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  progress: number;
  required: number;
  earned: boolean;
}

const demoFriends: StoredFriend[] = [
  {
    id: "demo-1",
    friendId: "friend-1",
    firstName: "Alex",
    lastName: "Chen",
    profileImageUrl: undefined,
    weeklyPoints: 485,
    dayStreak: 12,
    weekStreak: 4,
    totalBadgesEarned: 8,
    visibilityLevel: "full",
    hiddenTaskIds: [],
  },
  {
    id: "demo-2",
    friendId: "friend-2",
    firstName: "Jordan",
    lastName: "Taylor",
    profileImageUrl: undefined,
    weeklyPoints: 320,
    dayStreak: 7,
    weekStreak: 2,
    totalBadgesEarned: 5,
    visibilityLevel: "tasks_only",
    hiddenTaskIds: ["task-3"],
  },
  {
    id: "demo-3",
    friendId: "friend-3",
    firstName: "Sam",
    lastName: "Rivera",
    profileImageUrl: undefined,
    weeklyPoints: 560,
    dayStreak: 21,
    weekStreak: 6,
    totalBadgesEarned: 12,
    visibilityLevel: "full",
    hiddenTaskIds: [],
  },
  {
    id: "demo-4",
    friendId: "friend-4",
    firstName: "Morgan",
    lastName: "Kim",
    profileImageUrl: undefined,
    weeklyPoints: 280,
    dayStreak: 5,
    weekStreak: 1,
    totalBadgesEarned: 3,
    visibilityLevel: "points_only",
    hiddenTaskIds: [],
  },
];

const demoRequests: FriendRequest[] = [
  {
    id: "req-1",
    firstName: "Casey",
    lastName: "Park",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    direction: "incoming",
  },
  {
    id: "req-2",
    firstName: "Riley",
    lastName: "Johnson",
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    direction: "outgoing",
  },
];

const demoCircles: StoredCircle[] = [
  {
    id: "circle-1",
    name: "Marathon Mommy's",
    description: "Training together for our first marathon! Stay motivated and accountable.",
    iconColor: "hsl(142, 76%, 36%)",
    createdAt: "2024-11-01",
    createdBy: "user-1",
    memberCount: 8,
  },
  {
    id: "circle-2",
    name: "Williams Household",
    description: "Family chore tracking and weekly goal setting for the whole family.",
    iconColor: "hsl(217, 91%, 60%)",
    createdAt: "2024-10-15",
    createdBy: "you",
    memberCount: 5,
  },
  {
    id: "circle-3",
    name: "Book Club Buddies",
    description: "Reading challenges and literary discussions with fellow bookworms.",
    iconColor: "hsl(262, 83%, 58%)",
    createdAt: "2024-09-01",
    createdBy: "user-2",
    memberCount: 12,
  },
];

const demoCircleMembers: Record<string, StoredCircleMember[]> = {
  "circle-1": [
    { id: "m1", circleId: "circle-1", userId: "you", firstName: "You", lastName: "", role: "member", joinedAt: "2024-11-05", weeklyPoints: 145 },
    { id: "m2", circleId: "circle-1", userId: "u1", firstName: "Sarah", lastName: "M", role: "owner", joinedAt: "2024-11-01", weeklyPoints: 210 },
    { id: "m3", circleId: "circle-1", userId: "u2", firstName: "Lisa", lastName: "K", role: "member", joinedAt: "2024-11-03", weeklyPoints: 180 },
    { id: "m4", circleId: "circle-1", userId: "u3", firstName: "Emma", lastName: "T", role: "admin", joinedAt: "2024-11-02", weeklyPoints: 165 },
  ],
  "circle-2": [
    { id: "m5", circleId: "circle-2", userId: "you", firstName: "You", lastName: "", role: "owner", joinedAt: "2024-10-15", weeklyPoints: 85 },
    { id: "m6", circleId: "circle-2", userId: "u4", firstName: "Dad", lastName: "", role: "admin", joinedAt: "2024-10-15", weeklyPoints: 70 },
    { id: "m7", circleId: "circle-2", userId: "u5", firstName: "Tommy", lastName: "", role: "member", joinedAt: "2024-10-16", weeklyPoints: 55 },
    { id: "m8", circleId: "circle-2", userId: "u6", firstName: "Sarah", lastName: "", role: "member", joinedAt: "2024-10-16", weeklyPoints: 60 },
    { id: "m9", circleId: "circle-2", userId: "u7", firstName: "Baby Jake", lastName: "", role: "member", joinedAt: "2024-10-20", weeklyPoints: 25 },
  ],
  "circle-3": [
    { id: "m10", circleId: "circle-3", userId: "you", firstName: "You", lastName: "", role: "member", joinedAt: "2024-09-15", weeklyPoints: 40 },
    { id: "m11", circleId: "circle-3", userId: "u8", firstName: "Marcus", lastName: "B", role: "owner", joinedAt: "2024-09-01", weeklyPoints: 75 },
  ],
};

const demoCircleTasks: Record<string, StoredCircleTask[]> = {
  "circle-1": [
    { id: "ct1", circleId: "circle-1", name: "5K Training Run", value: 20, category: "Cardio" },
    { id: "ct2", circleId: "circle-1", name: "Strength Training", value: 15, category: "Strength" },
    { id: "ct3", circleId: "circle-1", name: "Stretching Session", value: 10, category: "Recovery" },
    { id: "ct4", circleId: "circle-1", name: "Long Run (10K+)", value: 30, category: "Cardio" },
    { id: "ct5", circleId: "circle-1", name: "Rest Day (Active Recovery)", value: 5, category: "Recovery" },
  ],
  "circle-2": [
    { id: "ct6", circleId: "circle-2", name: "Clean Room", value: 10, category: "Cleaning" },
    { id: "ct7", circleId: "circle-2", name: "Do Dishes", value: 5, category: "Kitchen" },
    { id: "ct8", circleId: "circle-2", name: "Take Out Trash", value: 5, category: "Cleaning" },
    { id: "ct9", circleId: "circle-2", name: "Mow Lawn", value: 20, category: "Yard" },
    { id: "ct10", circleId: "circle-2", name: "Homework Done", value: 15, category: "School" },
    { id: "ct11", circleId: "circle-2", name: "Walk the Dog", value: 10, category: "Pets" },
  ],
  "circle-3": [
    { id: "ct12", circleId: "circle-3", name: "Read 30 minutes", value: 10, category: "Reading" },
    { id: "ct13", circleId: "circle-3", name: "Write Book Review", value: 25, category: "Writing" },
    { id: "ct14", circleId: "circle-3", name: "Attend Discussion", value: 15, category: "Social" },
    { id: "ct15", circleId: "circle-3", name: "Finish Book Chapter", value: 20, category: "Reading" },
  ],
};

const demoCircleBadges: Record<string, CircleBadge[]> = {
  "circle-1": [
    { id: "cb1", name: "First 5K", description: "Complete your first 5K run", icon: "target", progress: 1, required: 1, earned: true },
    { id: "cb2", name: "Marathon Ready", description: "Complete 20 long runs", icon: "flame", progress: 12, required: 20, earned: false },
    { id: "cb3", name: "Consistency Queen", description: "Log 7 days in a row", icon: "calendar", progress: 5, required: 7, earned: false },
  ],
  "circle-2": [
    { id: "cb4", name: "Chore Champion", description: "Complete 50 tasks", icon: "trophy", progress: 38, required: 50, earned: false },
    { id: "cb5", name: "Team Player", description: "Everyone hit goal 4 weeks", icon: "users", progress: 2, required: 4, earned: false },
  ],
  "circle-3": [
    { id: "cb6", name: "Bookworm", description: "Read 5 books", icon: "book", progress: 3, required: 5, earned: false },
    { id: "cb7", name: "Literary Critic", description: "Write 10 reviews", icon: "star", progress: 7, required: 10, earned: false },
  ],
};

const demoTasks = [
  { id: "task-1", name: "Morning workout" },
  { id: "task-2", name: "Bible study" },
  { id: "task-3", name: "Read 30 minutes" },
  { id: "task-4", name: "Drink 8 glasses of water" },
  { id: "task-5", name: "Meditate" },
];

export default function CommunityPage() {
  const { isDemo } = useDemo();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [friends, setFriends] = useState<StoredFriend[]>(demoFriends);
  const [requests, setRequests] = useState<FriendRequest[]>(demoRequests);
  const [circles, setCircles] = useState<StoredCircle[]>(demoCircles);
  const [selectedCircle, setSelectedCircle] = useState<StoredCircle | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingFriend, setEditingFriend] = useState<StoredFriend | null>(null);
  const [showCreateCircle, setShowCreateCircle] = useState(false);
  const [newCircleName, setNewCircleName] = useState("");
  const [newCircleDescription, setNewCircleDescription] = useState("");

  const getInitials = (firstName: string, lastName: string) => {
    const first = firstName?.charAt(0) ?? "";
    const last = lastName?.charAt(0) ?? "";
    return (first + last).toUpperCase() || "?";
  };

  const getName = (firstName: string, lastName: string) => {
    if (firstName && lastName) return `${firstName} ${lastName}`;
    if (firstName) return firstName;
    if (lastName) return lastName;
    return "Unknown User";
  };

  const sortedLeaderboard = useMemo(() => {
    return [...friends].sort((a, b) => b.weeklyPoints - a.weeklyPoints);
  }, [friends]);

  const filteredFriends = useMemo(() => {
    if (!searchQuery) return friends;
    const query = searchQuery.toLowerCase();
    return friends.filter(
      (f) =>
        f.firstName.toLowerCase().includes(query) ||
        f.lastName.toLowerCase().includes(query)
    );
  }, [friends, searchQuery]);

  const handleSendRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      toast({ title: "Friend request sent", description: `Request sent to ${email}` });
      setEmail("");
    }
  };

  const handleAcceptRequest = (id: string) => {
    const request = requests.find((r) => r.id === id);
    if (request) {
      const newFriend: StoredFriend = {
        id: `friend-${Date.now()}`,
        friendId: id,
        firstName: request.firstName,
        lastName: request.lastName,
        weeklyPoints: Math.floor(Math.random() * 300) + 100,
        dayStreak: Math.floor(Math.random() * 10),
        weekStreak: Math.floor(Math.random() * 4),
        totalBadgesEarned: Math.floor(Math.random() * 5),
        visibilityLevel: "full",
        hiddenTaskIds: [],
      };
      setFriends([...friends, newFriend]);
      setRequests(requests.filter((r) => r.id !== id));
      toast({ title: "Request accepted", description: "You are now friends!" });
    }
  };

  const handleDeclineRequest = (id: string) => {
    setRequests(requests.filter((r) => r.id !== id));
    toast({ title: "Request declined" });
  };

  const handleRemoveFriend = (id: string) => {
    setFriends(friends.filter((f) => f.id !== id));
    toast({ title: "Friend removed" });
  };

  const handleUpdateVisibility = (friendId: string, level: VisibilityLevel) => {
    setFriends(
      friends.map((f) =>
        f.id === friendId ? { ...f, visibilityLevel: level } : f
      )
    );
    setEditingFriend(null);
    toast({ title: "Visibility updated" });
  };

  const handleToggleTaskVisibility = (friendId: string, taskId: string) => {
    setFriends(
      friends.map((f) => {
        if (f.id !== friendId) return f;
        const hiddenTaskIds = f.hiddenTaskIds.includes(taskId)
          ? f.hiddenTaskIds.filter((id) => id !== taskId)
          : [...f.hiddenTaskIds, taskId];
        return { ...f, hiddenTaskIds };
      })
    );
  };

  const handleCreateCircle = () => {
    if (newCircleName.trim()) {
      const newCircle: StoredCircle = {
        id: `circle-${Date.now()}`,
        name: newCircleName.trim(),
        description: newCircleDescription.trim() || "A new circle to share goals",
        iconColor: `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`,
        createdAt: new Date().toISOString().split("T")[0],
        createdBy: "you",
        memberCount: 1,
      };
      setCircles([...circles, newCircle]);
      toast({
        title: "Circle created",
        description: `"${newCircleName}" has been created. Invite members to get started!`,
      });
      setShowCreateCircle(false);
      setNewCircleName("");
      setNewCircleDescription("");
    }
  };

  const incomingRequests = requests.filter((r) => r.direction === "incoming");
  const outgoingRequests = requests.filter((r) => r.direction === "outgoing");

  const visibilityLabels: Record<VisibilityLevel, string> = {
    full: "Full Access",
    tasks_only: "Tasks Only",
    points_only: "Points Only",
    hidden: "Hidden",
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <Crown className="w-3 h-3 text-yellow-500" />;
      case "admin":
        return <Shield className="w-3 h-3 text-blue-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="container max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Users className="w-8 h-8 text-foreground" />
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">
            Community
          </h1>
          <p className="text-muted-foreground">
            Connect with friends and join circles to stay motivated together
          </p>
        </div>
      </div>

      <Tabs defaultValue="friends" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="friends" data-testid="tab-friends">
            <Users className="w-4 h-4 mr-2" />
            Friends
            {friends.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {friends.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="circles" data-testid="tab-circles">
            <CircleDot className="w-4 h-4 mr-2" />
            Circles
            {circles.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {circles.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="friends" className="space-y-6 mt-4">
          <div className="grid gap-6 md:grid-cols-2">
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
                  <Button type="submit" data-testid="button-send-request">
                    <Mail className="w-4 h-4 mr-2" />
                    Send
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Leaderboard
                </CardTitle>
                <CardDescription>This week's top performers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {sortedLeaderboard.slice(0, 5).map((friend, index) => (
                    <div
                      key={friend.id}
                      className="flex items-center justify-between gap-2"
                      data-testid={`leaderboard-entry-${index}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 text-sm font-medium text-muted-foreground">
                          {index + 1}.
                        </span>
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {getInitials(friend.firstName, friend.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">
                          {getName(friend.firstName, friend.lastName)}
                        </span>
                      </div>
                      <Badge variant="outline">{friend.weeklyPoints} pts</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {incomingRequests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Incoming Requests</CardTitle>
                <CardDescription>People who want to connect with you</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {incomingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between gap-4"
                    data-testid={`request-incoming-${request.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {getInitials(request.firstName, request.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <p className="font-medium">
                        {getName(request.firstName, request.lastName)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleAcceptRequest(request.id)}
                        data-testid={`button-accept-${request.id}`}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeclineRequest(request.id)}
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
                <CardTitle>Pending Requests</CardTitle>
                <CardDescription>Waiting for their response</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {outgoingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center gap-3"
                    data-testid={`request-outgoing-${request.id}`}
                  >
                    <Avatar>
                      <AvatarFallback>
                        {getInitials(request.firstName, request.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {getName(request.firstName, request.lastName)}
                      </p>
                      <Badge variant="outline">Pending</Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle>Your Friends</CardTitle>
                  <CardDescription>
                    Manage visibility and see their progress
                  </CardDescription>
                </div>
                <Input
                  placeholder="Search friends..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-xs"
                  data-testid="input-search-friends"
                />
              </div>
            </CardHeader>
            <CardContent>
              {filteredFriends.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Users className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center">
                    {searchQuery
                      ? "No friends match your search"
                      : "No friends yet. Send a friend request to get started!"}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredFriends.map((friend) => (
                    <div
                      key={friend.id}
                      className="flex items-center justify-between gap-4 p-3 rounded-md border"
                      data-testid={`card-friend-${friend.friendId}`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {getInitials(friend.firstName, friend.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {getName(friend.firstName, friend.lastName)}
                          </p>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1">
                              <Trophy className="w-3 h-3" /> {friend.weeklyPoints} pts
                            </span>
                            <span className="flex items-center gap-1">
                              <Flame className="w-3 h-3" /> {friend.dayStreak}d
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> {friend.weekStreak}w
                            </span>
                            <span className="flex items-center gap-1">
                              <Star className="w-3 h-3" /> {friend.totalBadgesEarned} badges
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="gap-1">
                          {friend.visibilityLevel === "hidden" ? (
                            <EyeOff className="w-3 h-3" />
                          ) : (
                            <Eye className="w-3 h-3" />
                          )}
                          {visibilityLabels[friend.visibilityLevel]}
                        </Badge>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditingFriend(friend)}
                              data-testid={`button-edit-visibility-${friend.id}`}
                            >
                              <Settings className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>
                                Visibility for {getName(friend.firstName, friend.lastName)}
                              </DialogTitle>
                              <DialogDescription>
                                Control what this friend can see about your progress
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label>Visibility Level</Label>
                                <Select
                                  value={friend.visibilityLevel}
                                  onValueChange={(value: VisibilityLevel) =>
                                    handleUpdateVisibility(friend.id, value)
                                  }
                                >
                                  <SelectTrigger data-testid="select-visibility">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="full">
                                      Full Access - See all tasks and points
                                    </SelectItem>
                                    <SelectItem value="tasks_only">
                                      Tasks Only - See task list but not points
                                    </SelectItem>
                                    <SelectItem value="points_only">
                                      Points Only - See points but not tasks
                                    </SelectItem>
                                    <SelectItem value="hidden">
                                      Hidden - Cannot see your profile
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              {(friend.visibilityLevel === "full" ||
                                friend.visibilityLevel === "tasks_only") && (
                                <div className="space-y-2">
                                  <Label>Hide Specific Tasks</Label>
                                  <p className="text-sm text-muted-foreground">
                                    Select tasks you don't want this friend to see
                                  </p>
                                  <div className="space-y-2 mt-2">
                                    {demoTasks.map((task) => (
                                      <div
                                        key={task.id}
                                        className="flex items-center gap-2"
                                      >
                                        <Checkbox
                                          id={`hide-${task.id}`}
                                          checked={friend.hiddenTaskIds.includes(task.id)}
                                          onCheckedChange={() =>
                                            handleToggleTaskVisibility(friend.id, task.id)
                                          }
                                          data-testid={`checkbox-hide-${task.id}`}
                                        />
                                        <label
                                          htmlFor={`hide-${task.id}`}
                                          className="text-sm"
                                        >
                                          {task.name}
                                        </label>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                            <DialogFooter>
                              <Button
                                variant="destructive"
                                onClick={() => handleRemoveFriend(friend.id)}
                                data-testid="button-remove-friend"
                              >
                                Remove Friend
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="circles" className="space-y-6 mt-4">
          {!selectedCircle ? (
            <>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">Your Circles</h2>
                  <p className="text-sm text-muted-foreground">
                    Join circles to share goals and compete with groups
                  </p>
                </div>
                <Dialog open={showCreateCircle} onOpenChange={setShowCreateCircle}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-create-circle">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Circle
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create a New Circle</DialogTitle>
                      <DialogDescription>
                        Start a group with shared tasks and goals
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="circle-name">Circle Name</Label>
                        <Input
                          id="circle-name"
                          placeholder="e.g., Marathon Runners, Book Club"
                          value={newCircleName}
                          onChange={(e) => setNewCircleName(e.target.value)}
                          data-testid="input-circle-name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="circle-desc">Description</Label>
                        <Input
                          id="circle-desc"
                          placeholder="What is this circle about?"
                          value={newCircleDescription}
                          onChange={(e) => setNewCircleDescription(e.target.value)}
                          data-testid="input-circle-description"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setShowCreateCircle(false)}
                        data-testid="button-cancel-create-circle"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleCreateCircle}
                        data-testid="button-confirm-create-circle"
                      >
                        Create Circle
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {circles.map((circle) => (
                  <Card
                    key={circle.id}
                    className="cursor-pointer hover-elevate"
                    onClick={() => setSelectedCircle(circle)}
                    data-testid={`card-circle-${circle.id}`}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div
                          className="w-10 h-10 rounded-md flex items-center justify-center"
                          style={{ backgroundColor: circle.iconColor }}
                        >
                          <CircleDot className="w-5 h-5 text-white" />
                        </div>
                        <Badge variant="outline">{circle.memberCount} members</Badge>
                      </div>
                      <CardTitle className="mt-2">{circle.name}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {circle.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>
                          {circle.createdBy === "you" ? "You created this" : "Member"}
                        </span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  onClick={() => setSelectedCircle(null)}
                  data-testid="button-back-to-circles"
                >
                  <X className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <div
                  className="w-10 h-10 rounded-md flex items-center justify-center"
                  style={{ backgroundColor: selectedCircle.iconColor }}
                >
                  <CircleDot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{selectedCircle.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {selectedCircle.description}
                  </p>
                </div>
              </div>

              <Tabs defaultValue="tasks" className="w-full">
                <TabsList>
                  <TabsTrigger value="tasks" data-testid="tab-circle-tasks">
                    <Target className="w-4 h-4 mr-2" />
                    Tasks
                  </TabsTrigger>
                  <TabsTrigger value="leaderboard" data-testid="tab-circle-leaderboard">
                    <Trophy className="w-4 h-4 mr-2" />
                    Leaderboard
                  </TabsTrigger>
                  <TabsTrigger value="badges" data-testid="tab-circle-badges">
                    <Award className="w-4 h-4 mr-2" />
                    Badges
                  </TabsTrigger>
                  <TabsTrigger value="members" data-testid="tab-circle-members">
                    <Users className="w-4 h-4 mr-2" />
                    Members
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="tasks" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Circle Tasks</CardTitle>
                      <CardDescription>
                        Shared tasks for all circle members to complete
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {(demoCircleTasks[selectedCircle.id] || []).map((task) => (
                          <div
                            key={task.id}
                            className="flex items-center justify-between p-3 rounded-md border"
                            data-testid={`circle-task-${task.id}`}
                          >
                            <div className="flex items-center gap-3">
                              <Checkbox data-testid={`checkbox-task-${task.id}`} />
                              <div>
                                <p className="font-medium">{task.name}</p>
                                {task.category && (
                                  <Badge variant="outline" className="text-xs">
                                    {task.category}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Badge>{task.value} pts</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="leaderboard" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>This Week's Leaderboard</CardTitle>
                      <CardDescription>
                        See who's leading in {selectedCircle.name}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {(demoCircleMembers[selectedCircle.id] || [])
                          .sort((a, b) => b.weeklyPoints - a.weeklyPoints)
                          .map((member, index) => (
                            <div
                              key={member.id}
                              className="flex items-center justify-between gap-4 p-3 rounded-md border"
                              data-testid={`leaderboard-member-${member.id}`}
                            >
                              <div className="flex items-center gap-3">
                                <span
                                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                                    index === 0
                                      ? "bg-yellow-500/20 text-yellow-600"
                                      : index === 1
                                      ? "bg-gray-400/20 text-gray-600"
                                      : index === 2
                                      ? "bg-orange-500/20 text-orange-600"
                                      : "bg-muted text-muted-foreground"
                                  }`}
                                >
                                  {index + 1}
                                </span>
                                <Avatar>
                                  <AvatarFallback>
                                    {getInitials(member.firstName, member.lastName)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">
                                    {member.firstName} {member.lastName}
                                  </span>
                                  {getRoleIcon(member.role)}
                                </div>
                              </div>
                              <Badge variant="secondary">
                                {member.weeklyPoints} pts
                              </Badge>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="badges" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Circle Badges</CardTitle>
                      <CardDescription>
                        Earn badges by completing circle challenges
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-2">
                        {(demoCircleBadges[selectedCircle.id] || []).map((badge) => (
                          <div
                            key={badge.id}
                            className={`p-4 rounded-md border ${
                              badge.earned ? "bg-primary/10 border-primary/30" : ""
                            }`}
                            data-testid={`circle-badge-${badge.id}`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                    badge.earned
                                      ? "bg-primary text-primary-foreground"
                                      : "bg-muted"
                                  }`}
                                >
                                  <Award className="w-5 h-5" />
                                </div>
                                <div>
                                  <p className="font-medium">{badge.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {badge.description}
                                  </p>
                                </div>
                              </div>
                              {badge.earned && (
                                <Badge variant="default">Earned</Badge>
                              )}
                            </div>
                            {!badge.earned && (
                              <div className="mt-3">
                                <div className="flex justify-between text-sm mb-1">
                                  <span>Progress</span>
                                  <span>
                                    {badge.progress}/{badge.required}
                                  </span>
                                </div>
                                <Progress
                                  value={(badge.progress / badge.required) * 100}
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="members" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <CardTitle>Circle Members</CardTitle>
                          <CardDescription>
                            {selectedCircle.memberCount} members in this circle
                          </CardDescription>
                        </div>
                        <Button variant="outline" data-testid="button-invite-member">
                          <UserPlus className="w-4 h-4 mr-2" />
                          Invite
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {(demoCircleMembers[selectedCircle.id] || []).map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center justify-between gap-4 p-3 rounded-md border"
                            data-testid={`member-${member.id}`}
                          >
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarFallback>
                                  {getInitials(member.firstName, member.lastName)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">
                                    {member.firstName} {member.lastName}
                                  </span>
                                  {getRoleIcon(member.role)}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  Joined{" "}
                                  {new Date(member.joinedAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <Badge variant="outline" className="capitalize">
                              {member.role}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
