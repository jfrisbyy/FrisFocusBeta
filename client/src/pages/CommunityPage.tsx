import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useDemo } from "@/contexts/DemoContext";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import ProfileHoverCard from "@/components/ProfileHoverCard";
import {
  Users,
  UserPlus,
  Mail,
  Check,
  X,
  Trophy,
  Flame,
  Calendar as CalendarIcon,
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
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Award,
  MessageCircle,
  Send,
  Heart,
  Globe,
  Lock,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowLeft,
  Pencil,
  Trash2,
  Gift,
  ImagePlus,
  Loader2,
  Copy,
  Swords,
} from "lucide-react";
import type { 
  StoredFriend, 
  StoredCircle, 
  StoredCircleMember, 
  StoredCircleTask, 
  VisibilityLevel,
  StoredCircleMessage,
  StoredCirclePost,
  StoredCirclePostComment,
  StoredDirectMessage,
  StoredCommunityPost,
  StoredCircleTaskAdjustmentRequest,
  StoredFriendActivity,
  CircleTaskType,
} from "@/lib/storage";
// Note: localStorage functions removed - API endpoints handle data persistence in non-demo mode

interface FriendRequest {
  id: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
  createdAt: string;
  direction: "incoming" | "outgoing";
}

interface CircleBadgeReward {
  type: "points" | "gift" | "both";
  points?: number;
  gift?: string;
}

interface CircleBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  progress: number;
  required: number;
  earned: boolean;
  reward?: CircleBadgeReward;
  taskId?: string;
}

interface APICommunityPost {
  id: string;
  authorId: string;
  content: string;
  visibility: "public" | "friends";
  imageUrl?: string;
  createdAt: string;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    displayName?: string;
    profileImageUrl?: string;
  } | null;
}

const demoFriends: StoredFriend[] = [
  {
    id: "demo-1",
    friendId: "friend-1",
    firstName: "Alex",
    lastName: "Chen",
    profileImageUrl: undefined,
    todayPoints: 45,
    weeklyPoints: 485,
    totalPoints: 2340,
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
    todayPoints: 30,
    weeklyPoints: 320,
    totalPoints: 1580,
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
    todayPoints: 55,
    weeklyPoints: 560,
    totalPoints: 4250,
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
    todayPoints: 20,
    weeklyPoints: 280,
    totalPoints: 890,
    dayStreak: 5,
    weekStreak: 1,
    totalBadgesEarned: 3,
    visibilityLevel: "points_only",
    hiddenTaskIds: [],
  },
];

const demoFriendActivities: Record<string, StoredFriendActivity> = {
  "friend-1": {
    friendId: "friend-1",
    recentTasks: [
      { taskName: "Morning workout", completedAt: new Date().toISOString() },
      { taskName: "Read 30 minutes", completedAt: new Date(Date.now() - 3600000).toISOString() },
      { taskName: "Meditate", completedAt: new Date(Date.now() - 7200000).toISOString() },
    ],
    todayPoints: 45,
    weeklyBreakdown: [
      { date: "Mon", points: 65 },
      { date: "Tue", points: 80 },
      { date: "Wed", points: 75 },
      { date: "Thu", points: 90 },
      { date: "Fri", points: 85 },
      { date: "Sat", points: 45 },
      { date: "Sun", points: 45 },
    ],
    recentBadges: [
      { name: "Early Bird", earnedAt: new Date(Date.now() - 86400000 * 2).toISOString() },
      { name: "Week Warrior", earnedAt: new Date(Date.now() - 86400000 * 7).toISOString() },
    ],
  },
  "friend-2": {
    friendId: "friend-2",
    recentTasks: [
      { taskName: "Bible study", completedAt: new Date().toISOString() },
      { taskName: "Walk 10k steps", completedAt: new Date(Date.now() - 3600000).toISOString() },
    ],
    todayPoints: 30,
    weeklyBreakdown: [
      { date: "Mon", points: 50 },
      { date: "Tue", points: 45 },
      { date: "Wed", points: 55 },
      { date: "Thu", points: 60 },
      { date: "Fri", points: 50 },
      { date: "Sat", points: 30 },
      { date: "Sun", points: 30 },
    ],
    recentBadges: [
      { name: "Consistency King", earnedAt: new Date(Date.now() - 86400000 * 5).toISOString() },
    ],
  },
  "friend-3": {
    friendId: "friend-3",
    recentTasks: [
      { taskName: "Morning run", completedAt: new Date().toISOString() },
      { taskName: "Meal prep", completedAt: new Date(Date.now() - 7200000).toISOString() },
      { taskName: "Journaling", completedAt: new Date(Date.now() - 10800000).toISOString() },
    ],
    todayPoints: 55,
    weeklyBreakdown: [
      { date: "Mon", points: 85 },
      { date: "Tue", points: 90 },
      { date: "Wed", points: 80 },
      { date: "Thu", points: 95 },
      { date: "Fri", points: 75 },
      { date: "Sat", points: 80 },
      { date: "Sun", points: 55 },
    ],
    recentBadges: [
      { name: "Marathon Runner", earnedAt: new Date(Date.now() - 86400000).toISOString() },
      { name: "Focus Master", earnedAt: new Date(Date.now() - 86400000 * 3).toISOString() },
      { name: "Perfect Week", earnedAt: new Date(Date.now() - 86400000 * 7).toISOString() },
    ],
  },
  "friend-4": {
    friendId: "friend-4",
    recentTasks: [
      { taskName: "Study session", completedAt: new Date().toISOString() },
    ],
    todayPoints: 20,
    weeklyBreakdown: [
      { date: "Mon", points: 40 },
      { date: "Tue", points: 50 },
      { date: "Wed", points: 45 },
      { date: "Thu", points: 55 },
      { date: "Fri", points: 40 },
      { date: "Sat", points: 30 },
      { date: "Sun", points: 20 },
    ],
    recentBadges: [],
  },
};

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
    dailyPointGoal: 30,
    weeklyPointGoal: 150,
    inviteCode: "MARATHON2024",
  },
  {
    id: "circle-2",
    name: "Williams Household",
    description: "Family chore tracking and weekly goal setting for the whole family.",
    iconColor: "hsl(217, 91%, 60%)",
    createdAt: "2024-10-15",
    createdBy: "you",
    memberCount: 5,
    dailyPointGoal: 25,
    weeklyPointGoal: 100,
    inviteCode: "WILLIAMS2024",
  },
  {
    id: "circle-3",
    name: "Book Club Buddies",
    description: "Reading challenges and literary discussions with fellow bookworms.",
    iconColor: "hsl(262, 83%, 58%)",
    createdAt: "2024-09-01",
    createdBy: "user-2",
    memberCount: 12,
    dailyPointGoal: 20,
    weeklyPointGoal: 80,
    inviteCode: "BOOKCLUB2024",
  },
];

type CompetitionType = "targetPoints" | "timed" | "ongoing";

interface DemoCompetition {
  id: string;
  name: string;
  targetPoints: number;
  competitionType: CompetitionType;
  startDate: string;
  endDate?: string;
  status: "active" | "completed";
  myCircle: { id: string; name: string };
  opponentCircle: { id: string; name: string };
  myPoints: number;
  opponentPoints: number;
  winnerId?: string;
  notes?: string;
}

interface DemoCompetitionInvite {
  id: string;
  inviterCircle: { id: string; name: string };
  inviteeCircle: { id: string; name: string };
  targetPoints: number;
  competitionType: CompetitionType;
  endDate?: string;
  name: string;
  status: "pending";
  isIncoming: boolean;
  notes?: string;
}

interface DemoCircleRecord {
  circleId: string;
  wins: number;
  losses: number;
  ties: number;
}

interface DemoMemberTaskStat {
  memberId: string;
  taskId: string;
  taskName: string;
  completionCount: number;
  points: number;
}

interface DemoMemberCompetitionStats {
  memberId: string;
  memberName: string;
  weeklyPoints: number;
  taskStats: DemoMemberTaskStat[];
}

const demoCompetitions: Record<string, DemoCompetition[]> = {
  "circle-1": [
    {
      id: "comp-1",
      name: "Weekly Showdown",
      targetPoints: 500,
      competitionType: "targetPoints",
      startDate: "2024-12-01",
      status: "active",
      myCircle: { id: "circle-1", name: "Marathon Mommy's" },
      opponentCircle: { id: "circle-ext-1", name: "Fitness Fanatics" },
      myPoints: 320,
      opponentPoints: 280,
    },
    {
      id: "comp-2",
      name: "Spring Sprint",
      targetPoints: 1000,
      competitionType: "targetPoints",
      startDate: "2024-11-15",
      status: "completed",
      myCircle: { id: "circle-1", name: "Marathon Mommy's" },
      opponentCircle: { id: "circle-ext-2", name: "Run Club LA" },
      myPoints: 1000,
      opponentPoints: 875,
      winnerId: "circle-1",
    },
    {
      id: "comp-4",
      name: "December Challenge",
      targetPoints: 0,
      competitionType: "timed",
      startDate: "2024-12-01",
      endDate: "2024-12-31",
      status: "active",
      myCircle: { id: "circle-1", name: "Marathon Mommy's" },
      opponentCircle: { id: "circle-ext-6", name: "Yoga Warriors" },
      myPoints: 450,
      opponentPoints: 420,
    },
  ],
  "circle-2": [
    {
      id: "comp-3",
      name: "Family Face-Off",
      targetPoints: 300,
      competitionType: "targetPoints",
      startDate: "2024-12-05",
      status: "active",
      myCircle: { id: "circle-2", name: "Williams Household" },
      opponentCircle: { id: "circle-ext-3", name: "The Johnsons" },
      myPoints: 175,
      opponentPoints: 165,
    },
    {
      id: "comp-5",
      name: "Ongoing Rivalry",
      targetPoints: 0,
      competitionType: "ongoing",
      startDate: "2024-11-01",
      status: "active",
      myCircle: { id: "circle-2", name: "Williams Household" },
      opponentCircle: { id: "circle-ext-7", name: "The Garcias" },
      myPoints: 1250,
      opponentPoints: 1180,
    },
  ],
  "circle-3": [],
};

const demoCompetitionInvites: Record<string, DemoCompetitionInvite[]> = {
  "circle-1": [
    {
      id: "inv-1",
      inviterCircle: { id: "circle-ext-4", name: "CrossFit Crew" },
      inviteeCircle: { id: "circle-1", name: "Marathon Mommy's" },
      targetPoints: 750,
      competitionType: "targetPoints",
      name: "Endurance Challenge",
      status: "pending",
      isIncoming: true,
    },
  ],
  "circle-2": [
    {
      id: "inv-2",
      inviterCircle: { id: "circle-2", name: "Williams Household" },
      inviteeCircle: { id: "circle-ext-5", name: "Smith Family" },
      targetPoints: 400,
      competitionType: "targetPoints",
      name: "Weekend Warrior",
      status: "pending",
      isIncoming: false,
    },
    {
      id: "inv-3",
      inviterCircle: { id: "circle-ext-8", name: "The Martins" },
      inviteeCircle: { id: "circle-2", name: "Williams Household" },
      targetPoints: 0,
      competitionType: "timed",
      endDate: "2024-12-25",
      name: "Holiday Hustle",
      status: "pending",
      isIncoming: true,
    },
  ],
  "circle-3": [],
};

const demoCircleRecords: Record<string, DemoCircleRecord> = {
  "circle-1": { circleId: "circle-1", wins: 5, losses: 2, ties: 1 },
  "circle-2": { circleId: "circle-2", wins: 3, losses: 1, ties: 0 },
  "circle-3": { circleId: "circle-3", wins: 0, losses: 0, ties: 0 },
};

const demoMemberCompetitionStats: Record<string, Record<string, DemoMemberCompetitionStats[]>> = {
  "comp-1": {
    "circle-1": [
      { memberId: "you", memberName: "You", weeklyPoints: 85, taskStats: [
        { memberId: "you", taskId: "ct1", taskName: "5K Training Run", completionCount: 3, points: 60 },
        { memberId: "you", taskId: "ct3", taskName: "Stretching Session", completionCount: 2, points: 20 },
        { memberId: "you", taskId: "ct5", taskName: "Rest Day", completionCount: 1, points: 5 },
      ]},
      { memberId: "u1", memberName: "Sarah M", weeklyPoints: 120, taskStats: [
        { memberId: "u1", taskId: "ct1", taskName: "5K Training Run", completionCount: 4, points: 80 },
        { memberId: "u1", taskId: "ct4", taskName: "Long Run (10K+)", completionCount: 1, points: 30 },
        { memberId: "u1", taskId: "ct3", taskName: "Stretching Session", completionCount: 1, points: 10 },
      ]},
      { memberId: "u2", memberName: "Lisa K", weeklyPoints: 75, taskStats: [
        { memberId: "u2", taskId: "ct2", taskName: "Strength Training", completionCount: 3, points: 45 },
        { memberId: "u2", taskId: "ct4", taskName: "Long Run (10K+)", completionCount: 1, points: 30 },
      ]},
      { memberId: "u3", memberName: "Emma T", weeklyPoints: 40, taskStats: [
        { memberId: "u3", taskId: "ct1", taskName: "5K Training Run", completionCount: 2, points: 40 },
      ]},
    ],
    "circle-ext-1": [
      { memberId: "opp-1", memberName: "Jake M", weeklyPoints: 95, taskStats: [] },
      { memberId: "opp-2", memberName: "Maria S", weeklyPoints: 85, taskStats: [] },
      { memberId: "opp-3", memberName: "Tyler B", weeklyPoints: 65, taskStats: [] },
      { memberId: "opp-4", memberName: "Jen K", weeklyPoints: 35, taskStats: [] },
    ],
  },
  "comp-3": {
    "circle-2": [
      { memberId: "you", memberName: "You", weeklyPoints: 55, taskStats: [
        { memberId: "you", taskId: "ct6", taskName: "Clean Room", completionCount: 3, points: 30 },
        { memberId: "you", taskId: "ct7", taskName: "Do Dishes", completionCount: 3, points: 15 },
        { memberId: "you", taskId: "ct11", taskName: "Walk the Dog", completionCount: 1, points: 10 },
      ]},
      { memberId: "u4", memberName: "Dad", weeklyPoints: 50, taskStats: [
        { memberId: "u4", taskId: "ct9", taskName: "Mow Lawn", completionCount: 1, points: 20 },
        { memberId: "u4", taskId: "ct8", taskName: "Take Out Trash", completionCount: 4, points: 20 },
        { memberId: "u4", taskId: "ct11", taskName: "Walk the Dog", completionCount: 1, points: 10 },
      ]},
      { memberId: "u5", memberName: "Tommy", weeklyPoints: 35, taskStats: [
        { memberId: "u5", taskId: "ct10", taskName: "Homework Done", completionCount: 2, points: 30 },
        { memberId: "u5", taskId: "ct8", taskName: "Take Out Trash", completionCount: 1, points: 5 },
      ]},
      { memberId: "u6", memberName: "Sarah", weeklyPoints: 25, taskStats: [
        { memberId: "u6", taskId: "ct6", taskName: "Clean Room", completionCount: 2, points: 20 },
        { memberId: "u6", taskId: "ct7", taskName: "Do Dishes", completionCount: 1, points: 5 },
      ]},
      { memberId: "u7", memberName: "Baby Jake", weeklyPoints: 10, taskStats: [
        { memberId: "u7", taskId: "ct6", taskName: "Clean Room", completionCount: 1, points: 10 },
      ]},
    ],
    "circle-ext-3": [
      { memberId: "opp-5", memberName: "Mike J", weeklyPoints: 60, taskStats: [
        { memberId: "opp-5", taskId: "opp-t1", taskName: "Family Dinner", completionCount: 4, points: 40 },
        { memberId: "opp-5", taskId: "opp-t2", taskName: "Weekly Cleanup", completionCount: 2, points: 20 },
      ]},
      { memberId: "opp-6", memberName: "Linda J", weeklyPoints: 55, taskStats: [
        { memberId: "opp-6", taskId: "opp-t1", taskName: "Family Dinner", completionCount: 3, points: 30 },
        { memberId: "opp-6", taskId: "opp-t3", taskName: "Grocery Shopping", completionCount: 1, points: 25 },
      ]},
      { memberId: "opp-7", memberName: "Sam J", weeklyPoints: 50, taskStats: [
        { memberId: "opp-7", taskId: "opp-t2", taskName: "Weekly Cleanup", completionCount: 3, points: 30 },
        { memberId: "opp-7", taskId: "opp-t4", taskName: "Yard Work", completionCount: 2, points: 20 },
      ]},
    ],
  },
  "comp-4": {
    "circle-1": [
      { memberId: "you", memberName: "You", weeklyPoints: 110, taskStats: [
        { memberId: "you", taskId: "ct1", taskName: "5K Training Run", completionCount: 4, points: 80 },
        { memberId: "you", taskId: "ct3", taskName: "Stretching Session", completionCount: 3, points: 30 },
      ]},
      { memberId: "u1", memberName: "Sarah M", weeklyPoints: 145, taskStats: [
        { memberId: "u1", taskId: "ct1", taskName: "5K Training Run", completionCount: 5, points: 100 },
        { memberId: "u1", taskId: "ct2", taskName: "Strength Training", completionCount: 3, points: 45 },
      ]},
      { memberId: "u2", memberName: "Lisa K", weeklyPoints: 105, taskStats: [
        { memberId: "u2", taskId: "ct2", taskName: "Strength Training", completionCount: 4, points: 60 },
        { memberId: "u2", taskId: "ct4", taskName: "Long Run (10K+)", completionCount: 1, points: 30 },
        { memberId: "u2", taskId: "ct3", taskName: "Stretching Session", completionCount: 1, points: 15 },
      ]},
      { memberId: "u3", memberName: "Emma T", weeklyPoints: 90, taskStats: [
        { memberId: "u3", taskId: "ct1", taskName: "5K Training Run", completionCount: 3, points: 60 },
        { memberId: "u3", taskId: "ct4", taskName: "Long Run (10K+)", completionCount: 1, points: 30 },
      ]},
    ],
    "circle-ext-6": [
      { memberId: "opp-8", memberName: "Nina Y", weeklyPoints: 125, taskStats: [
        { memberId: "opp-8", taskId: "yoga-t1", taskName: "Morning Flow", completionCount: 6, points: 90 },
        { memberId: "opp-8", taskId: "yoga-t2", taskName: "Power Yoga", completionCount: 1, points: 35 },
      ]},
      { memberId: "opp-9", memberName: "Derek P", weeklyPoints: 100, taskStats: [
        { memberId: "opp-9", taskId: "yoga-t1", taskName: "Morning Flow", completionCount: 5, points: 75 },
        { memberId: "opp-9", taskId: "yoga-t3", taskName: "Meditation", completionCount: 5, points: 25 },
      ]},
      { memberId: "opp-10", memberName: "Zoe L", weeklyPoints: 110, taskStats: [
        { memberId: "opp-10", taskId: "yoga-t2", taskName: "Power Yoga", completionCount: 2, points: 70 },
        { memberId: "opp-10", taskId: "yoga-t3", taskName: "Meditation", completionCount: 8, points: 40 },
      ]},
      { memberId: "opp-11", memberName: "Chris W", weeklyPoints: 85, taskStats: [
        { memberId: "opp-11", taskId: "yoga-t1", taskName: "Morning Flow", completionCount: 4, points: 60 },
        { memberId: "opp-11", taskId: "yoga-t3", taskName: "Meditation", completionCount: 5, points: 25 },
      ]},
    ],
  },
  "comp-5": {
    "circle-2": [
      { memberId: "you", memberName: "You", weeklyPoints: 320, taskStats: [
        { memberId: "you", taskId: "ct6", taskName: "Clean Room", completionCount: 15, points: 150 },
        { memberId: "you", taskId: "ct7", taskName: "Do Dishes", completionCount: 20, points: 100 },
        { memberId: "you", taskId: "ct11", taskName: "Walk the Dog", completionCount: 7, points: 70 },
      ]},
      { memberId: "u4", memberName: "Dad", weeklyPoints: 410, taskStats: [
        { memberId: "u4", taskId: "ct9", taskName: "Mow Lawn", completionCount: 8, points: 160 },
        { memberId: "u4", taskId: "ct8", taskName: "Take Out Trash", completionCount: 30, points: 150 },
        { memberId: "u4", taskId: "ct11", taskName: "Walk the Dog", completionCount: 10, points: 100 },
      ]},
      { memberId: "u5", memberName: "Tommy", weeklyPoints: 260, taskStats: [
        { memberId: "u5", taskId: "ct10", taskName: "Homework Done", completionCount: 14, points: 210 },
        { memberId: "u5", taskId: "ct8", taskName: "Take Out Trash", completionCount: 10, points: 50 },
      ]},
      { memberId: "u6", memberName: "Sarah", weeklyPoints: 160, taskStats: [
        { memberId: "u6", taskId: "ct6", taskName: "Clean Room", completionCount: 10, points: 100 },
        { memberId: "u6", taskId: "ct7", taskName: "Do Dishes", completionCount: 12, points: 60 },
      ]},
      { memberId: "u7", memberName: "Baby Jake", weeklyPoints: 100, taskStats: [
        { memberId: "u7", taskId: "ct6", taskName: "Clean Room", completionCount: 10, points: 100 },
      ]},
    ],
    "circle-ext-7": [
      { memberId: "opp-12", memberName: "Carlos G", weeklyPoints: 380, taskStats: [
        { memberId: "opp-12", taskId: "gar-t1", taskName: "Cook Dinner", completionCount: 18, points: 180 },
        { memberId: "opp-12", taskId: "gar-t2", taskName: "Family Activity", completionCount: 8, points: 200 },
      ]},
      { memberId: "opp-13", memberName: "Maria G", weeklyPoints: 340, taskStats: [
        { memberId: "opp-13", taskId: "gar-t1", taskName: "Cook Dinner", completionCount: 15, points: 150 },
        { memberId: "opp-13", taskId: "gar-t3", taskName: "Laundry", completionCount: 19, points: 190 },
      ]},
      { memberId: "opp-14", memberName: "Juan G", weeklyPoints: 260, taskStats: [
        { memberId: "opp-14", taskId: "gar-t4", taskName: "Study Time", completionCount: 18, points: 180 },
        { memberId: "opp-14", taskId: "gar-t5", taskName: "Pet Care", completionCount: 16, points: 80 },
      ]},
      { memberId: "opp-15", memberName: "Sofia G", weeklyPoints: 200, taskStats: [
        { memberId: "opp-15", taskId: "gar-t4", taskName: "Study Time", completionCount: 12, points: 120 },
        { memberId: "opp-15", taskId: "gar-t5", taskName: "Pet Care", completionCount: 16, points: 80 },
      ]},
    ],
  },
};

const demoOpponentMembers: Record<string, { id: string; firstName: string; lastName: string; weeklyPoints: number }[]> = {
  "circle-ext-1": [
    { id: "opp-1", firstName: "Jake", lastName: "M", weeklyPoints: 95 },
    { id: "opp-2", firstName: "Maria", lastName: "S", weeklyPoints: 85 },
    { id: "opp-3", firstName: "Tyler", lastName: "B", weeklyPoints: 65 },
    { id: "opp-4", firstName: "Jen", lastName: "K", weeklyPoints: 35 },
  ],
  "circle-ext-3": [
    { id: "opp-5", firstName: "Mike", lastName: "J", weeklyPoints: 60 },
    { id: "opp-6", firstName: "Linda", lastName: "J", weeklyPoints: 55 },
    { id: "opp-7", firstName: "Sam", lastName: "J", weeklyPoints: 50 },
  ],
  "circle-ext-6": [
    { id: "opp-8", firstName: "Nina", lastName: "Y", weeklyPoints: 125 },
    { id: "opp-9", firstName: "Derek", lastName: "P", weeklyPoints: 100 },
    { id: "opp-10", firstName: "Zoe", lastName: "L", weeklyPoints: 110 },
    { id: "opp-11", firstName: "Chris", lastName: "W", weeklyPoints: 85 },
  ],
  "circle-ext-7": [
    { id: "opp-12", firstName: "Carlos", lastName: "G", weeklyPoints: 380 },
    { id: "opp-13", firstName: "Maria", lastName: "G", weeklyPoints: 340 },
    { id: "opp-14", firstName: "Juan", lastName: "G", weeklyPoints: 260 },
    { id: "opp-15", firstName: "Sofia", lastName: "G", weeklyPoints: 200 },
  ],
};

const demoCircleMembers: Record<string, StoredCircleMember[]> = {
  "circle-1": [
    { id: "m1", circleId: "circle-1", userId: "you", firstName: "You", lastName: "", role: "admin", joinedAt: "2024-11-05", weeklyPoints: 145 },
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
    { id: "m12", circleId: "circle-3", userId: "u9", firstName: "Emily", lastName: "R", role: "admin", joinedAt: "2024-09-05", weeklyPoints: 60 },
    { id: "m13", circleId: "circle-3", userId: "u10", firstName: "David", lastName: "L", role: "member", joinedAt: "2024-09-10", weeklyPoints: 55 },
    { id: "m14", circleId: "circle-3", userId: "u11", firstName: "Sarah", lastName: "W", role: "member", joinedAt: "2024-09-12", weeklyPoints: 45 },
    { id: "m15", circleId: "circle-3", userId: "u12", firstName: "James", lastName: "H", role: "member", joinedAt: "2024-09-15", weeklyPoints: 50 },
    { id: "m16", circleId: "circle-3", userId: "u13", firstName: "Lisa", lastName: "C", role: "member", joinedAt: "2024-09-18", weeklyPoints: 35 },
    { id: "m17", circleId: "circle-3", userId: "u14", firstName: "Mike", lastName: "T", role: "member", joinedAt: "2024-09-20", weeklyPoints: 30 },
    { id: "m18", circleId: "circle-3", userId: "u15", firstName: "Anna", lastName: "K", role: "member", joinedAt: "2024-09-22", weeklyPoints: 25 },
    { id: "m19", circleId: "circle-3", userId: "u16", firstName: "Tom", lastName: "D", role: "member", joinedAt: "2024-09-25", weeklyPoints: 20 },
    { id: "m20", circleId: "circle-3", userId: "u17", firstName: "Kate", lastName: "M", role: "member", joinedAt: "2024-09-28", weeklyPoints: 15 },
    { id: "m21", circleId: "circle-3", userId: "u18", firstName: "Chris", lastName: "P", role: "member", joinedAt: "2024-10-01", weeklyPoints: 10 },
  ],
};

const demoCircleTasks: Record<string, StoredCircleTask[]> = {
  "circle-1": [
    { id: "ct1", circleId: "circle-1", name: "5K Training Run", value: 20, category: "Cardio", taskType: "per_person", createdById: "u1", requiresApproval: false, approvalStatus: "approved" },
    { id: "ct2", circleId: "circle-1", name: "Strength Training", value: 15, category: "Strength", taskType: "per_person", createdById: "u1", requiresApproval: false, approvalStatus: "approved" },
    { id: "ct3", circleId: "circle-1", name: "Stretching Session", value: 10, category: "Recovery", taskType: "per_person", createdById: "u3", requiresApproval: false, approvalStatus: "approved" },
    { id: "ct4", circleId: "circle-1", name: "Long Run (10K+)", value: 30, category: "Cardio", taskType: "per_person", createdById: "u1", requiresApproval: false, approvalStatus: "approved" },
    { id: "ct5", circleId: "circle-1", name: "Rest Day (Active Recovery)", value: 5, category: "Recovery", taskType: "per_person", createdById: "u1", requiresApproval: false, approvalStatus: "approved" },
  ],
  "circle-2": [
    { id: "ct6", circleId: "circle-2", name: "Clean Room", value: 10, category: "Cleaning", taskType: "per_person", createdById: "you", requiresApproval: false, approvalStatus: "approved" },
    { id: "ct7", circleId: "circle-2", name: "Do Dishes", value: 5, category: "Kitchen", taskType: "circle_task", createdById: "you", requiresApproval: false, approvalStatus: "approved" },
    { id: "ct8", circleId: "circle-2", name: "Take Out Trash", value: 5, category: "Cleaning", taskType: "circle_task", createdById: "you", requiresApproval: false, approvalStatus: "approved" },
    { id: "ct9", circleId: "circle-2", name: "Mow Lawn", value: 20, category: "Yard", taskType: "circle_task", createdById: "u4", requiresApproval: false, approvalStatus: "approved" },
    { id: "ct10", circleId: "circle-2", name: "Homework Done", value: 15, category: "School", taskType: "per_person", createdById: "you", requiresApproval: false, approvalStatus: "approved" },
    { id: "ct11", circleId: "circle-2", name: "Walk the Dog", value: 10, category: "Pets", taskType: "circle_task", createdById: "you", requiresApproval: false, approvalStatus: "approved" },
  ],
  "circle-3": [
    { id: "ct12", circleId: "circle-3", name: "Read 30 minutes", value: 10, category: "Reading", taskType: "per_person", createdById: "u8", requiresApproval: false, approvalStatus: "approved" },
    { id: "ct13", circleId: "circle-3", name: "Write Book Review", value: 25, category: "Writing", taskType: "per_person", createdById: "u8", requiresApproval: false, approvalStatus: "approved" },
    { id: "ct14", circleId: "circle-3", name: "Attend Discussion", value: 15, category: "Social", taskType: "circle_task", createdById: "u8", requiresApproval: false, approvalStatus: "approved" },
    { id: "ct15", circleId: "circle-3", name: "Finish Book Chapter", value: 20, category: "Reading", taskType: "per_person", createdById: "u8", requiresApproval: false, approvalStatus: "approved" },
  ],
};

const demoTaskRequests: StoredCircleTaskAdjustmentRequest[] = [
  {
    id: "req-1",
    circleId: "circle-2",
    requesterId: "u5",
    requesterName: "Tommy",
    type: "add",
    taskData: { name: "Video Game Time", value: 5, category: "Fun", taskType: "per_person" },
    status: "pending",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "req-2",
    circleId: "circle-2",
    requesterId: "u6",
    requesterName: "Sarah",
    type: "edit",
    taskData: { name: "Clean Room (Quick)", value: 5 },
    existingTaskId: "ct6",
    status: "pending",
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
];

const demoCircleBadges: Record<string, CircleBadge[]> = {
  "circle-1": [
    { id: "cb1", name: "First 5K", description: "Complete your first 5K run", icon: "target", progress: 1, required: 1, earned: true, reward: { type: "points", points: 50 } },
    { id: "cb2", name: "Marathon Ready", description: "Complete 20 long runs", icon: "flame", progress: 12, required: 20, earned: false, reward: { type: "both", points: 200, gift: "Free running shoes" } },
    { id: "cb3", name: "Consistency Queen", description: "Log 7 days in a row", icon: "calendar", progress: 5, required: 7, earned: false, reward: { type: "points", points: 75 } },
  ],
  "circle-2": [
    { id: "cb4", name: "Chore Champion", description: "Complete 50 tasks", icon: "trophy", progress: 38, required: 50, earned: false, reward: { type: "both", points: 100, gift: "Pizza night" } },
    { id: "cb5", name: "Team Player", description: "Everyone hit goal 4 weeks", icon: "users", progress: 2, required: 4, earned: false, reward: { type: "gift", gift: "Family movie night" } },
  ],
  "circle-3": [
    { id: "cb6", name: "Bookworm", description: "Read 5 books", icon: "book", progress: 3, required: 5, earned: false, reward: { type: "gift", gift: "New book of choice" } },
    { id: "cb7", name: "Literary Critic", description: "Write 10 reviews", icon: "star", progress: 7, required: 10, earned: false, reward: { type: "points", points: 150 } },
  ],
};

interface CircleAward {
  id: string;
  name: string;
  description: string;
  type: "first_to" | "most_in_category" | "weekly_champion";
  target?: number;
  category?: string;
  winner?: { userId: string; userName: string; achievedAt: string };
  endDate?: string;
  reward?: CircleBadgeReward;
  taskId?: string;
}

const demoCircleAwards: Record<string, CircleAward[]> = {
  "circle-1": [
    { id: "ca1", name: "Speed Demon", description: "First to 500 points this month", type: "first_to", target: 500, winner: { userId: "u1", userName: "Sarah M", achievedAt: new Date(Date.now() - 172800000).toISOString() }, reward: { type: "both", points: 100, gift: "Champion trophy" } },
    { id: "ca2", name: "Cardio King/Queen", description: "Most points in Cardio category", type: "most_in_category", category: "Cardio", reward: { type: "points", points: 75 } },
    { id: "ca3", name: "Weekly Champion", description: "Highest points this week", type: "weekly_champion", reward: { type: "gift", gift: "Choose next workout" } },
  ],
  "circle-2": [
    { id: "ca4", name: "First to 100", description: "First to reach 100 points", type: "first_to", target: 100, reward: { type: "gift", gift: "Extra screen time" } },
    { id: "ca5", name: "Cleaning Star", description: "Most points in Cleaning tasks", type: "most_in_category", category: "Cleaning", winner: { userId: "u5", userName: "Tommy", achievedAt: new Date(Date.now() - 86400000).toISOString() }, reward: { type: "both", points: 50, gift: "Dessert of choice" } },
  ],
  "circle-3": [
    { id: "ca6", name: "Reading Race", description: "First to finish 3 books", type: "first_to", target: 3, reward: { type: "gift", gift: "Free book purchase" } },
  ],
};

// Full task list for friend dashboard view
const demoFriendFullTasks: Record<string, { id: string; name: string; value: number; completed: boolean; category: string }[]> = {
  "friend-1": [
    { id: "ft1", name: "Morning workout", value: 15, completed: true, category: "Fitness" },
    { id: "ft2", name: "Read 30 minutes", value: 10, completed: true, category: "Personal" },
    { id: "ft3", name: "Meditate", value: 10, completed: true, category: "Wellness" },
    { id: "ft4", name: "Evening walk", value: 10, completed: false, category: "Fitness" },
    { id: "ft5", name: "Journal", value: 5, completed: false, category: "Personal" },
  ],
  "friend-3": [
    { id: "ft6", name: "Morning run", value: 20, completed: true, category: "Fitness" },
    { id: "ft7", name: "Meal prep", value: 15, completed: true, category: "Health" },
    { id: "ft8", name: "Journaling", value: 10, completed: true, category: "Personal" },
    { id: "ft9", name: "Stretching", value: 10, completed: true, category: "Fitness" },
    { id: "ft10", name: "Read book", value: 10, completed: false, category: "Personal" },
    { id: "ft11", name: "Evening workout", value: 15, completed: false, category: "Fitness" },
  ],
};

const demoFriendBadges: Record<string, { id: string; name: string; description: string; earned: boolean }[]> = {
  "friend-1": [
    { id: "b1", name: "Early Bird", description: "Complete tasks before 8am", earned: true },
    { id: "b2", name: "Week Warrior", description: "7-day streak", earned: true },
    { id: "b3", name: "Focus Master", description: "Complete all tasks 3 days", earned: true },
    { id: "b4", name: "Century Club", description: "Earn 100 points in a day", earned: false },
  ],
  "friend-3": [
    { id: "b5", name: "Marathon Runner", description: "Run 50 miles total", earned: true },
    { id: "b6", name: "Focus Master", description: "Complete all tasks 3 days", earned: true },
    { id: "b7", name: "Perfect Week", description: "Complete every task for a week", earned: true },
    { id: "b8", name: "Iron Will", description: "30-day streak", earned: true },
    { id: "b9", name: "Elite Status", description: "Earn 1000 points in a week", earned: false },
  ],
};

const demoCircleMessages: Record<string, StoredCircleMessage[]> = {
  "circle-1": [
    { id: "cm1", circleId: "circle-1", senderId: "u1", senderName: "Sarah M", content: "Great job on the 10K today everyone!", createdAt: new Date(Date.now() - 3600000).toISOString() },
    { id: "cm2", circleId: "circle-1", senderId: "u2", senderName: "Lisa K", content: "Thanks! Feeling stronger every week.", createdAt: new Date(Date.now() - 1800000).toISOString() },
    { id: "cm3", circleId: "circle-1", senderId: "you", senderName: "You", content: "Can't wait for the actual marathon!", createdAt: new Date(Date.now() - 600000).toISOString() },
  ],
  "circle-2": [
    { id: "cm4", circleId: "circle-2", senderId: "u4", senderName: "Dad", content: "Who's doing the dishes tonight?", createdAt: new Date(Date.now() - 7200000).toISOString() },
    { id: "cm5", circleId: "circle-2", senderId: "u5", senderName: "Tommy", content: "I'll do it!", createdAt: new Date(Date.now() - 5400000).toISOString() },
    { id: "cm6", circleId: "circle-2", senderId: "you", senderName: "You", content: "Great job Tommy! 5 points for you.", createdAt: new Date(Date.now() - 3600000).toISOString() },
  ],
  "circle-3": [
    { id: "cm7", circleId: "circle-3", senderId: "u8", senderName: "Marcus B", content: "This month's book is 'Atomic Habits'!", createdAt: new Date(Date.now() - 86400000).toISOString() },
  ],
};

const demoCirclePosts: Record<string, StoredCirclePost[]> = {
  "circle-1": [
    { id: "cp1", circleId: "circle-1", authorId: "u1", authorName: "Sarah M", content: "Just finished my first half marathon! 13.1 miles in 2:15. Couldn't have done it without this group!", createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), likes: ["u2", "u3", "you"], comments: [
      { id: "cpc1", authorId: "u2", authorName: "Lisa K", content: "Amazing achievement! So proud of you!", createdAt: new Date(Date.now() - 86400000 * 2 + 3600000).toISOString(), likes: ["u1", "you"] },
      { id: "cpc2", authorId: "u3", authorName: "Emma T", content: "You're an inspiration!", createdAt: new Date(Date.now() - 86400000 * 2 + 7200000).toISOString(), likes: ["u1"] },
    ] },
    { id: "cp2", circleId: "circle-1", authorId: "u3", authorName: "Emma T", content: "New week, new goals! Let's crush it everyone.", createdAt: new Date(Date.now() - 86400000).toISOString(), likes: ["u1"], comments: [] },
  ],
  "circle-2": [
    { id: "cp3", circleId: "circle-2", authorId: "you", authorName: "You", content: "Family meeting this Sunday! Let's review our weekly points and plan the next week's chores.", createdAt: new Date(Date.now() - 172800000).toISOString(), likes: ["u4", "u5"], comments: [
      { id: "cpc3", authorId: "u4", authorName: "Dad", content: "Great idea! I'll prepare the snacks.", createdAt: new Date(Date.now() - 172800000 + 3600000).toISOString(), likes: [] },
    ] },
  ],
  "circle-3": [],
};

const demoCommunityPosts: StoredCommunityPost[] = [
  { id: "feed-1", authorId: "friend-3", authorName: "Sam Rivera", content: "Just hit a 21-day streak! Consistency is key. Keep pushing everyone!", visibility: "public", createdAt: new Date(Date.now() - 3600000).toISOString(), likes: ["friend-1", "you"], comments: [
    { id: "c0", authorId: "friend-1", authorName: "Alex Chen", content: "Incredible consistency! Keep it up!", createdAt: new Date(Date.now() - 1800000).toISOString(), likes: ["friend-3"] },
  ] },
  { id: "feed-2", authorId: "friend-1", authorName: "Alex Chen", content: "New personal best today - 50 points in one day! Time to celebrate.", visibility: "friends", createdAt: new Date(Date.now() - 7200000).toISOString(), likes: ["friend-2"], comments: [{ id: "c1", authorId: "friend-2", authorName: "Jordan Taylor", content: "Amazing work!", createdAt: new Date(Date.now() - 5400000).toISOString(), likes: ["friend-1", "you"] }] },
  { id: "feed-3", authorId: "you", authorName: "You", content: "Starting my marathon training journey with the Marathon Mommy's circle. Here we go!", visibility: "public", createdAt: new Date(Date.now() - 86400000).toISOString(), likes: ["friend-1", "friend-3"], comments: [] },
];

const demoDirectMessages: Record<string, StoredDirectMessage[]> = {
  "friend-1": [
    { id: "dm1", senderId: "friend-1", senderName: "Alex Chen", recipientId: "you", recipientName: "You", content: "Hey! Want to do a workout challenge this week?", createdAt: new Date(Date.now() - 86400000).toISOString(), read: true },
    { id: "dm2", senderId: "you", senderName: "You", recipientId: "friend-1", recipientName: "Alex Chen", content: "Sure! What did you have in mind?", createdAt: new Date(Date.now() - 82800000).toISOString(), read: true },
    { id: "dm3", senderId: "friend-1", senderName: "Alex Chen", recipientId: "you", recipientName: "You", content: "Let's see who can get the most points by Friday!", createdAt: new Date(Date.now() - 79200000).toISOString(), read: true },
  ],
  "friend-2": [
    { id: "dm4", senderId: "friend-2", senderName: "Jordan Taylor", recipientId: "you", recipientName: "You", content: "Thanks for the motivation yesterday!", createdAt: new Date(Date.now() - 172800000).toISOString(), read: true },
  ],
};

export default function CommunityPage() {
  const { isDemo } = useDemo();
  const { user } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [friends, setFriends] = useState<StoredFriend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [circles, setCircles] = useState<StoredCircle[]>([]);
  const [selectedCircle, setSelectedCircle] = useState<StoredCircle | null>(null);
  const [selectedTaskDate, setSelectedTaskDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingFriend, setEditingFriend] = useState<StoredFriend | null>(null);
  const [showCreateCircle, setShowCreateCircle] = useState(false);
  const [newCircleName, setNewCircleName] = useState("");
  const [newCircleDescription, setNewCircleDescription] = useState("");
  const [selectedFriend, setSelectedFriend] = useState<StoredFriend | null>(null);
  const [dmFriend, setDmFriend] = useState<StoredFriend | null>(null);
  const [dmMessage, setDmMessage] = useState("");
  const [cheerlineFriend, setCheerlineFriend] = useState<StoredFriend | null>(null);
  const [cheerlineMessage, setCheerlineMessage] = useState("");
  const [directMessages, setDirectMessages] = useState<Record<string, StoredDirectMessage[]>>({});
  const [communityPosts, setCommunityPosts] = useState<StoredCommunityPost[]>([]);
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostVisibility, setNewPostVisibility] = useState<"public" | "friends">("friends");
  const [circleMessages, setCircleMessages] = useState<Record<string, StoredCircleMessage[]>>({});
  const [circlePosts, setCirclePosts] = useState<Record<string, StoredCirclePost[]>>({});
  const [circleMembers, setCircleMembers] = useState<Record<string, StoredCircleMember[]>>({});
  const [newCircleMessage, setNewCircleMessage] = useState("");
  const [newCirclePost, setNewCirclePost] = useState("");
  const [dataLoaded, setDataLoaded] = useState(false);
  
  // Competition state (must be declared before queries that use it)
  const [showOpponentLeaderboard, setShowOpponentLeaderboard] = useState<string | null>(null);
  const [expandedCompetition, setExpandedCompetition] = useState<string | null>(null);
  const [expandedMember, setExpandedMember] = useState<string | null>(null);
  const [expandedOpponentMember, setExpandedOpponentMember] = useState<string | null>(null);

  // API queries and mutations for non-demo mode
  const postsQuery = useQuery<APICommunityPost[]>({
    queryKey: ['/api/community/posts'],
    enabled: !isDemo,
  });

  const createPostMutation = useMutation({
    mutationFn: async (data: { content: string; visibility: string; imageUrl?: string }) => {
      const res = await apiRequest("POST", "/api/community/posts", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/community/posts'] });
    },
  });

  const likePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const res = await apiRequest("POST", `/api/community/posts/${postId}/like`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/community/posts'] });
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async ({ postId, content }: { postId: string; content: string }) => {
      const res = await apiRequest("POST", `/api/community/posts/${postId}/comments`, { content });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/community/posts'] });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const res = await apiRequest("DELETE", `/api/community/posts/${postId}`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/community/posts'] });
    },
  });

  // Friend request queries and mutations
  const friendRequestsQuery = useQuery<FriendRequest[]>({
    queryKey: ['/api/friends/requests'],
    enabled: !isDemo,
    staleTime: 0, // Always refetch to get latest friend requests
    refetchOnMount: 'always',
    queryFn: async () => {
      try {
        const [incomingRes, outgoingRes] = await Promise.all([
          apiRequest("GET", '/api/friends/requests'),
          apiRequest("GET", '/api/friends/requests/outgoing')
        ]);
        const incoming = await incomingRes.json();
        const outgoing = await outgoingRes.json();
        return [
          ...incoming.map((r: any) => ({ ...r, direction: 'incoming' as const })),
          ...outgoing.map((r: any) => ({ ...r, direction: 'outgoing' as const }))
        ];
      } catch {
        return [];
      }
    },
  });

  const sendFriendRequestMutation = useMutation({
    mutationFn: async (emailOrUsername: string) => {
      const res = await apiRequest("POST", "/api/friends/request", { emailOrUsername });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to send friend request');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/friends/requests'] });
      toast({ title: "Friend request sent!" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to send request", description: error.message, variant: "destructive" });
    },
  });

  const acceptFriendRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const res = await apiRequest("POST", `/api/friends/accept/${requestId}`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/friends/requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/friends'] });
      toast({ title: "Friend request accepted!" });
    },
  });

  const declineFriendRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const res = await apiRequest("POST", `/api/friends/decline/${requestId}`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/friends/requests'] });
      toast({ title: "Friend request declined" });
    },
  });

  const sendCheerlineMutation = useMutation({
    mutationFn: async ({ userId, message }: { userId: string; message: string }) => {
      const res = await apiRequest("POST", `/api/cheerlines/${userId}`, { message });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to send cheerline');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cheerlines'] });
      toast({ title: "Cheerline sent!", description: "Your encouraging message was sent!" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to send cheerline", description: error.message, variant: "destructive" });
    },
  });

  // Create circle mutation for non-demo mode
  const createCircleMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string; iconColor?: string }) => {
      const res = await apiRequest("POST", "/api/circles", data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create circle');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/circles'] });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create circle", description: error.message, variant: "destructive" });
    },
  });

  // Friends list query for non-demo mode
  const friendsQuery = useQuery<StoredFriend[]>({
    queryKey: ['/api/friends'],
    enabled: !isDemo,
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", '/api/friends');
        const data = await res.json();
        return data.map((f: any) => ({
          id: f.id,
          friendId: f.friendId || f.id,
          firstName: f.firstName || '',
          lastName: f.lastName || '',
          profileImageUrl: f.profileImageUrl,
          todayPoints: f.todayPoints || 0,
          weeklyPoints: f.weeklyPoints || 0,
          totalPoints: f.totalPoints || 0,
          dayStreak: f.dayStreak || 0,
          weekStreak: f.weekStreak || 0,
          totalBadgesEarned: f.totalBadgesEarned || 0,
          visibilityLevel: f.visibilityLevel || 'full',
          hiddenTaskIds: f.hiddenTaskIds || [],
        }));
      } catch {
        return [];
      }
    },
  });

  // Circles list query for non-demo mode
  const circlesQuery = useQuery<StoredCircle[]>({
    queryKey: ['/api/circles'],
    enabled: !isDemo,
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", '/api/circles');
        const data = await res.json();
        return data.map((c: any) => ({
          id: c.id,
          name: c.name || '',
          description: c.description || '',
          iconColor: c.iconColor || 'hsl(217, 91%, 60%)',
          createdAt: c.createdAt || new Date().toISOString(),
          createdBy: c.createdBy || '',
          memberCount: c.memberCount || 1,
        }));
      } catch {
        return [];
      }
    },
  });

  // Circle tasks query for selected circle
  const circleTasksQuery = useQuery<StoredCircleTask[]>({
    queryKey: ['/api/circles', selectedCircle?.id, 'tasks'],
    enabled: !isDemo && !!selectedCircle,
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", `/api/circles/${selectedCircle!.id}/tasks`);
        if (!res.ok) return [];
        return await res.json();
      } catch {
        return [];
      }
    },
  });

  // Circle badges query for selected circle
  const circleBadgesQuery = useQuery<CircleBadge[]>({
    queryKey: ['/api/circles', selectedCircle?.id, 'badges'],
    enabled: !isDemo && !!selectedCircle,
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", `/api/circles/${selectedCircle!.id}/badges`);
        if (!res.ok) return [];
        const data = await res.json();
        return data.map((b: any) => ({
          id: b.id,
          name: b.name,
          description: b.description || '',
          icon: b.icon || 'target',
          progress: b.progress || 0,
          required: b.required || 10,
          earned: b.earned || false,
          reward: b.reward,
        }));
      } catch {
        return [];
      }
    },
  });

  // Circle awards query for selected circle
  const circleAwardsQuery = useQuery<CircleAward[]>({
    queryKey: ['/api/circles', selectedCircle?.id, 'awards'],
    enabled: !isDemo && !!selectedCircle,
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", `/api/circles/${selectedCircle!.id}/awards`);
        if (!res.ok) return [];
        const data = await res.json();
        return data.map((a: any) => ({
          id: a.id,
          name: a.name,
          description: a.description || '',
          type: a.type || 'first_to',
          target: a.target,
          category: a.category,
          winner: a.winner,
          endDate: a.endDate,
          reward: a.reward,
        }));
      } catch {
        return [];
      }
    },
  });

  // Circle posts query for selected circle
  const circlePostsQuery = useQuery<StoredCirclePost[]>({
    queryKey: ['/api/circles', selectedCircle?.id, 'posts'],
    enabled: !isDemo && !!selectedCircle,
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", `/api/circles/${selectedCircle!.id}/posts`);
        if (!res.ok) return [];
        const data = await res.json();
        return data.map((p: any) => ({
          id: p.id,
          circleId: p.circleId,
          authorId: p.authorId,
          authorName: p.author ? `${p.author.firstName || ''} ${p.author.lastName || ''}`.trim() || 'Unknown' : 'Unknown',
          content: p.content || '',
          createdAt: p.createdAt,
          likes: p.likes || [],
          comments: (p.comments || []).map((c: any) => ({
            id: c.id,
            authorId: c.authorId,
            authorName: c.author ? `${c.author.firstName || ''} ${c.author.lastName || ''}`.trim() || 'Unknown' : 'Unknown',
            content: c.content || '',
            createdAt: c.createdAt,
            likes: c.likes || [],
          })),
          imageUrl: p.imageUrl,
        }));
      } catch {
        return [];
      }
    },
  });

  // Circle task completions query for selected circle
  const circleCompletionsQuery = useQuery<{ taskId: string; userId: string; userName: string; completedAt: string }[]>({
    queryKey: ['/api/circles', selectedCircle?.id, 'completions'],
    enabled: !isDemo && !!selectedCircle,
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", `/api/circles/${selectedCircle!.id}/completions`);
        if (!res.ok) return [];
        return await res.json();
      } catch {
        return [];
      }
    },
  });

  // Circle leaderboard query - fetches member stats including streaks, totals, and weekly history
  interface LeaderboardMemberStats {
    id: string;
    userId: string;
    firstName: string;
    lastName: string;
    profileImageUrl: string | null;
    role: string;
    totalPoints: number;
    goalStreak: number;
    longestStreak: number;
    weeklyHistory: { week: string; points: number }[];
    taskTotals: { taskName: string; count: number }[];
  }
  const circleLeaderboardQuery = useQuery<LeaderboardMemberStats[]>({
    queryKey: ['/api/circles', selectedCircle?.id, 'leaderboard'],
    enabled: !isDemo && !!selectedCircle,
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/circles/${selectedCircle!.id}/leaderboard`);
      if (!res.ok) {
        throw new Error('Failed to fetch leaderboard');
      }
      return await res.json();
    },
  });

  // Circle task mutations
  const createCircleTaskMutation = useMutation({
    mutationFn: async (data: { circleId: string; task: { name: string; value: number; taskType: CircleTaskType; category?: string } }) => {
      const res = await apiRequest("POST", `/api/circles/${data.circleId}/tasks`, data.task);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create task');
      }
      return res.json();
    },
    onSuccess: (_, { circleId }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/circles', circleId, 'tasks'] });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create task", description: error.message, variant: "destructive" });
    },
  });

  const updateCircleTaskMutation = useMutation({
    mutationFn: async (data: { circleId: string; taskId: string; updates: { name?: string; value?: number; taskType?: CircleTaskType } }) => {
      const res = await apiRequest("PUT", `/api/circles/${data.circleId}/tasks/${data.taskId}`, data.updates);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update task');
      }
      return res.json();
    },
    onSuccess: (_, { circleId }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/circles', circleId, 'tasks'] });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update task", description: error.message, variant: "destructive" });
    },
  });

  const deleteCircleTaskMutation = useMutation({
    mutationFn: async (data: { circleId: string; taskId: string }) => {
      const res = await apiRequest("DELETE", `/api/circles/${data.circleId}/tasks/${data.taskId}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete task');
      }
      return res.json();
    },
    onSuccess: (_, { circleId }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/circles', circleId, 'tasks'] });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete task", description: error.message, variant: "destructive" });
    },
  });

  const toggleCircleTaskCompleteMutation = useMutation({
    mutationFn: async (data: { circleId: string; taskId: string; date?: string }) => {
      // Use today's date in YYYY-MM-DD format if not provided
      const dateToUse = data.date || new Date().toISOString().split('T')[0];
      const res = await apiRequest("POST", `/api/circles/${data.circleId}/tasks/${data.taskId}/complete`, { date: dateToUse });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to toggle task completion');
      }
      return res.json();
    },
    onSuccess: (_, { circleId }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/circles', circleId, 'completions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/circles', circleId, 'members'] });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update task", description: error.message, variant: "destructive" });
    },
  });

  // Circle badge mutations
  const createCircleBadgeMutation = useMutation({
    mutationFn: async (data: { circleId: string; badge: { name: string; description: string; icon?: string; required: number; reward?: CircleBadgeReward } }) => {
      const res = await apiRequest("POST", `/api/circles/${data.circleId}/badges`, data.badge);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create badge');
      }
      return res.json();
    },
    onSuccess: (_, { circleId }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/circles', circleId, 'badges'] });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create badge", description: error.message, variant: "destructive" });
    },
  });

  const updateCircleBadgeMutation = useMutation({
    mutationFn: async (data: { circleId: string; badgeId: string; updates: { name?: string; description?: string; required?: number; reward?: CircleBadgeReward } }) => {
      const res = await apiRequest("PUT", `/api/circles/${data.circleId}/badges/${data.badgeId}`, data.updates);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update badge');
      }
      return res.json();
    },
    onSuccess: (_, { circleId }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/circles', circleId, 'badges'] });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update badge", description: error.message, variant: "destructive" });
    },
  });

  const deleteCircleBadgeMutation = useMutation({
    mutationFn: async (data: { circleId: string; badgeId: string }) => {
      const res = await apiRequest("DELETE", `/api/circles/${data.circleId}/badges/${data.badgeId}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete badge');
      }
      return res.json();
    },
    onSuccess: (_, { circleId }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/circles', circleId, 'badges'] });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete badge", description: error.message, variant: "destructive" });
    },
  });

  // Circle award mutations
  const createCircleAwardMutation = useMutation({
    mutationFn: async (data: { circleId: string; award: { name: string; description: string; type: string; target?: number; category?: string; reward?: CircleBadgeReward } }) => {
      const res = await apiRequest("POST", `/api/circles/${data.circleId}/awards`, data.award);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create award');
      }
      return res.json();
    },
    onSuccess: (_, { circleId }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/circles', circleId, 'awards'] });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create award", description: error.message, variant: "destructive" });
    },
  });

  const updateCircleAwardMutation = useMutation({
    mutationFn: async (data: { circleId: string; awardId: string; updates: { name?: string; description?: string; type?: string; target?: number; category?: string; reward?: CircleBadgeReward } }) => {
      const res = await apiRequest("PUT", `/api/circles/${data.circleId}/awards/${data.awardId}`, data.updates);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update award');
      }
      return res.json();
    },
    onSuccess: (_, { circleId }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/circles', circleId, 'awards'] });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update award", description: error.message, variant: "destructive" });
    },
  });

  const deleteCircleAwardMutation = useMutation({
    mutationFn: async (data: { circleId: string; awardId: string }) => {
      const res = await apiRequest("DELETE", `/api/circles/${data.circleId}/awards/${data.awardId}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete award');
      }
      return res.json();
    },
    onSuccess: (_, { circleId }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/circles', circleId, 'awards'] });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete award", description: error.message, variant: "destructive" });
    },
  });

  // Circle post mutations
  const createCirclePostMutation = useMutation({
    mutationFn: async (data: { circleId: string; post: { content: string; imageUrl?: string } }) => {
      const res = await apiRequest("POST", `/api/circles/${data.circleId}/posts`, data.post);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create post');
      }
      return res.json();
    },
    onSuccess: (_, { circleId }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/circles', circleId, 'posts'] });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create post", description: error.message, variant: "destructive" });
    },
  });

  const likeCirclePostMutation = useMutation({
    mutationFn: async (data: { circleId: string; postId: string }) => {
      const res = await apiRequest("POST", `/api/circles/${data.circleId}/posts/${data.postId}/like`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to like post');
      }
      return res.json();
    },
    onSuccess: (_, { circleId }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/circles', circleId, 'posts'] });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to like post", description: error.message, variant: "destructive" });
    },
  });

  const addCirclePostCommentMutation = useMutation({
    mutationFn: async (data: { circleId: string; postId: string; comment: { content: string } }) => {
      const res = await apiRequest("POST", `/api/circles/${data.circleId}/posts/${data.postId}/comments`, data.comment);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to add comment');
      }
      return res.json();
    },
    onSuccess: (_, { circleId }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/circles', circleId, 'posts'] });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to add comment", description: error.message, variant: "destructive" });
    },
  });

  // Conversations query for non-demo mode - fetches all DM threads
  const conversationsQuery = useQuery<{
    partnerId: string;
    partnerName: string;
    lastMessage: StoredDirectMessage;
    unreadCount: number;
  }[]>({
    queryKey: ['/api/messages/conversations'],
    enabled: !isDemo,
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", '/api/messages/conversations');
        if (!res.ok) return [];
        return await res.json();
      } catch {
        return [];
      }
    },
  });

  // Competition queries and mutations
  const competitionInvitesQuery = useQuery<{
    id: string;
    inviterCircleId: string;
    inviteeCircleId: string;
    targetPoints: number;
    name?: string;
    description?: string;
    status: string;
    createdAt: string;
    inviterCircle?: { id: string; name: string };
    inviteeCircle?: { id: string; name: string };
    isIncoming: boolean;
  }[]>({
    queryKey: ['/api/circles', selectedCircle?.id, 'competitions', 'invites'],
    enabled: !isDemo && !!selectedCircle?.id,
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", `/api/circles/${selectedCircle?.id}/competitions/invites`);
        if (!res.ok) return [];
        return await res.json();
      } catch {
        return [];
      }
    },
  });

  const competitionsQuery = useQuery<{
    id: string;
    name?: string;
    description?: string;
    startDate: string;
    endDate?: string;
    targetPoints: number;
    status: string;
    myCircle: { id: string; name: string };
    opponentCircle: { id: string; name: string };
    myPoints: number;
    opponentPoints: number;
    winnerId?: string;
  }[]>({
    queryKey: ['/api/circles', selectedCircle?.id, 'competitions'],
    enabled: !isDemo && !!selectedCircle?.id,
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", `/api/circles/${selectedCircle?.id}/competitions`);
        if (!res.ok) return [];
        return await res.json();
      } catch {
        return [];
      }
    },
  });

  const opponentLeaderboardQuery = useQuery<{
    id: string;
    firstName: string;
    lastName: string;
    weeklyPoints: number;
  }[]>({
    queryKey: ['/api/circles', selectedCircle?.id, 'competitions', showOpponentLeaderboard, 'opponent-leaderboard'],
    enabled: !isDemo && !!selectedCircle?.id && !!showOpponentLeaderboard,
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", `/api/circles/${selectedCircle?.id}/competitions/${showOpponentLeaderboard}/opponent-leaderboard`);
        if (!res.ok) return [];
        return await res.json();
      } catch {
        return [];
      }
    },
  });

  const generateInviteCodeMutation = useMutation({
    mutationFn: async (circleId: string) => {
      const res = await apiRequest("PUT", `/api/circles/${circleId}/invite-code`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to generate invite code');
      }
      return res.json();
    },
    onSuccess: (data: { inviteCode: string }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/circles'] });
      if (selectedCircle) {
        setSelectedCircle({ ...selectedCircle, inviteCode: data.inviteCode });
      }
      toast({ title: "Invite code generated" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to generate invite code", description: error.message, variant: "destructive" });
    },
  });

  const sendCompetitionInviteMutation = useMutation({
    mutationFn: async (data: { circleId: string; inviteeInviteCode: string; targetPoints: number; name?: string; notes?: string }) => {
      const res = await apiRequest("POST", `/api/circles/${data.circleId}/competitions/invites`, {
        inviteeInviteCode: data.inviteeInviteCode,
        targetPoints: data.targetPoints,
        name: data.name,
        notes: data.notes,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to send challenge');
      }
      return res.json();
    },
    onSuccess: (_, { circleId }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/circles', circleId, 'competitions', 'invites'] });
      setChallengeInviteCode("");
      setChallengeTargetPoints("1000");
      setChallengeName("");
      setChallengeNotes("");
      toast({ title: "Challenge sent!" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to send challenge", description: error.message, variant: "destructive" });
    },
  });

  const respondToInviteMutation = useMutation({
    mutationFn: async (data: { circleId: string; inviteId: string; action: "accept" | "decline" }) => {
      const res = await apiRequest("PUT", `/api/circles/${data.circleId}/competitions/invites/${data.inviteId}`, {
        action: data.action,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to respond to invite');
      }
      return res.json();
    },
    onSuccess: (_, { circleId }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/circles', circleId, 'competitions', 'invites'] });
      queryClient.invalidateQueries({ queryKey: ['/api/circles', circleId, 'competitions'] });
      toast({ title: "Response sent" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to respond", description: error.message, variant: "destructive" });
    },
  });
  
  const [taskRequests, setTaskRequests] = useState<StoredCircleTaskAdjustmentRequest[]>([]);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskValue, setNewTaskValue] = useState("10");
  const [newTaskType, setNewTaskType] = useState<CircleTaskType>("per_person");
  const [circleTasks, setCircleTasks] = useState<Record<string, StoredCircleTask[]>>({});
  const [circleDetailTab, setCircleDetailTab] = useState("tasks");
  
  // Circle badges and awards state (mutable versions of demo data)
  const [circleBadges, setCircleBadges] = useState<Record<string, CircleBadge[]>>({});
  const [circleAwards, setCircleAwards] = useState<Record<string, CircleAward[]>>({});
  
  // Task completion tracking - who completed what tasks today
  const [myCompletedTasks, setMyCompletedTasks] = useState<Record<string, string[]>>({});
  
  // Data: who completed which tasks today
  const [circleTaskCompletions, setCircleTaskCompletions] = useState<Record<string, Record<string, { userId: string; userName: string; completedAt: string }[]>>>({});
  
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  
  // Leaderboard view mode (day/week/all time)
  const [leaderboardViewMode, setLeaderboardViewMode] = useState<"day" | "week" | "alltime">("week");
  const [friendsLeaderboardViewMode, setFriendsLeaderboardViewMode] = useState<"day" | "week" | "alltime">("week");
  const [expandedDMFriend, setExpandedDMFriend] = useState<string | null>(null);
  const [dmMessages, setDmMessages] = useState<Record<string, string>>({});
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);
  
  // Image upload state for messages and posts
  const [circleMessageImage, setCircleMessageImage] = useState<string | null>(null);
  const [circleMessageImagePreview, setCircleMessageImagePreview] = useState<string | null>(null);
  const [circleMessageUploading, setCircleMessageUploading] = useState(false);
  const [circlePostImage, setCirclePostImage] = useState<string | null>(null);
  const [circlePostImagePreview, setCirclePostImagePreview] = useState<string | null>(null);
  const [circlePostUploading, setCirclePostUploading] = useState(false);
  const [feedPostImage, setFeedPostImage] = useState<string | null>(null);
  const [feedPostImagePreview, setFeedPostImagePreview] = useState<string | null>(null);
  const [feedPostUploading, setFeedPostUploading] = useState(false);
  const [feedViewFilter, setFeedViewFilter] = useState<"all" | "friends" | "public">("all");
  const [communityTab, setCommunityTab] = useState<"friends" | "circles" | "feed">("friends");
  
  // Competition state (showOpponentLeaderboard declared earlier with other state)
  const [challengeInviteCode, setChallengeInviteCode] = useState("");
  const [challengeTargetPoints, setChallengeTargetPoints] = useState("1000");
  const [challengeName, setChallengeName] = useState("");
  const [challengeCompetitionType, setChallengeCompetitionType] = useState<CompetitionType>("targetPoints");
  const [challengeEndDate, setChallengeEndDate] = useState<Date | undefined>(undefined);
  const [challengeNotes, setChallengeNotes] = useState("");
  const [dmImages, setDmImages] = useState<Record<string, string | null>>({});
  const [dmImagePreviews, setDmImagePreviews] = useState<Record<string, string | null>>({});
  const [dmUploading, setDmUploading] = useState<Record<string, boolean>>({});
  
  // File input refs for image uploads
  const circleMessageFileRef = useRef<HTMLInputElement>(null);
  const circlePostFileRef = useRef<HTMLInputElement>(null);
  const feedPostFileRef = useRef<HTMLInputElement>(null);
  const dmFileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Load data based on demo mode
  useEffect(() => {
    if (isDemo) {
      // Load demo data
      setFriends(demoFriends);
      setRequests(demoRequests);
      setCircles(demoCircles);
      setCircleMembers(demoCircleMembers);
      setCircleTasks(demoCircleTasks);
      setCircleMessages(demoCircleMessages);
      setCirclePosts(demoCirclePosts);
      setCommunityPosts(demoCommunityPosts);
      setDirectMessages(demoDirectMessages);
      setCircleBadges(demoCircleBadges);
      setCircleAwards(demoCircleAwards);
      setTaskRequests(demoTaskRequests);
      setMyCompletedTasks({
        "circle-1": ["ct1", "ct3"],
        "circle-2": ["ct6", "ct7"],
      });
      setCircleTaskCompletions({
        "circle-1": {
          "ct1": [
            { userId: "u1", userName: "Sarah M", completedAt: new Date(Date.now() - 7200000).toISOString() },
            { userId: "u2", userName: "Lisa K", completedAt: new Date(Date.now() - 3600000).toISOString() },
            { userId: "you", userName: "You", completedAt: new Date(Date.now() - 1800000).toISOString() },
          ],
          "ct2": [
            { userId: "u3", userName: "Emma T", completedAt: new Date(Date.now() - 5400000).toISOString() },
          ],
          "ct3": [
            { userId: "you", userName: "You", completedAt: new Date(Date.now() - 900000).toISOString() },
            { userId: "u1", userName: "Sarah M", completedAt: new Date(Date.now() - 600000).toISOString() },
          ],
        },
        "circle-2": {
          "ct6": [
            { userId: "you", userName: "You", completedAt: new Date(Date.now() - 3600000).toISOString() },
            { userId: "u5", userName: "Tommy", completedAt: new Date(Date.now() - 1800000).toISOString() },
          ],
          "ct7": [
            { userId: "you", userName: "You", completedAt: new Date(Date.now() - 7200000).toISOString() },
          ],
          "ct9": [
            { userId: "u4", userName: "Dad", completedAt: new Date(Date.now() - 86400000).toISOString() },
          ],
        },
      });
    } else {
      // Non-demo mode: Initialize empty state, let API queries populate data
      // Community posts are loaded via postsQuery
      // Friend requests are loaded via friendRequestsQuery
      setFriends([]);
      setCircles([]);
      setCommunityPosts([]);
      setDirectMessages({});
      setCircleMessages({});
      setCirclePosts({});
      setRequests([]);
      setCircleMembers({});
      setCircleTasks({});
      setCircleBadges({});
      setCircleAwards({});
      setTaskRequests([]);
      setMyCompletedTasks({});
      setCircleTaskCompletions({});
    }
    setDataLoaded(true);
  }, [isDemo]);

  // Note: localStorage saving removed - in non-demo mode, API mutations handle persistence
  // In demo mode, state changes are ephemeral and not persisted

  // Sync friend requests from API query to state (not in demo mode)
  useEffect(() => {
    if (!isDemo && friendRequestsQuery.data) {
      setRequests(friendRequestsQuery.data);
    }
  }, [isDemo, friendRequestsQuery.data]);

  // Sync friends from API query to state (not in demo mode)
  useEffect(() => {
    if (!isDemo && friendsQuery.data) {
      setFriends(friendsQuery.data);
    }
  }, [isDemo, friendsQuery.data]);

  // Sync circles from API query to state (not in demo mode)
  useEffect(() => {
    if (!isDemo && circlesQuery.data) {
      setCircles(circlesQuery.data);
    }
  }, [isDemo, circlesQuery.data]);

  // Fetch circle details including members when a circle is selected (non-demo mode)
  useEffect(() => {
    if (isDemo || !selectedCircle) return;
    
    const fetchCircleDetails = async () => {
      try {
        const res = await apiRequest("GET", `/api/circles/${selectedCircle.id}`);
        if (!res.ok) return;
        
        const data = await res.json();
        
        // Update circle members from API response
        if (data.members && Array.isArray(data.members)) {
          const membersForState: StoredCircleMember[] = data.members.map((m: any) => ({
            id: m.id,
            circleId: m.circleId,
            userId: m.userId,
            firstName: m.user?.firstName || m.user?.displayName || 'Unknown',
            lastName: m.user?.lastName || '',
            role: m.role || 'member',
            joinedAt: m.joinedAt || new Date().toISOString(),
            weeklyPoints: m.weeklyPoints || 0,
            profileImageUrl: m.user?.profileImageUrl,
          }));
          setCircleMembers(prev => ({ ...prev, [selectedCircle.id]: membersForState }));
        }
      } catch (error) {
        console.error("Error fetching circle details:", error);
      }
    };
    
    fetchCircleDetails();
  }, [isDemo, selectedCircle?.id]);

  // Populate direct messages from conversations query (non-demo mode)
  useEffect(() => {
    if (isDemo || !conversationsQuery.data) return;
    
    // Initialize the directMessages state with conversation partner IDs
    // Each conversation has a lastMessage which we use to show in the list
    const dmState: Record<string, StoredDirectMessage[]> = {};
    conversationsQuery.data.forEach(convo => {
      if (convo.lastMessage) {
        dmState[convo.partnerId] = [convo.lastMessage];
      }
    });
    setDirectMessages(dmState);
  }, [isDemo, conversationsQuery.data]);

  // Sync circle tasks from API query to local state
  useEffect(() => {
    if (isDemo || !selectedCircle || !circleTasksQuery.data) return;
    setCircleTasks(prev => ({ ...prev, [selectedCircle.id]: circleTasksQuery.data }));
  }, [isDemo, selectedCircle?.id, circleTasksQuery.data]);

  // Sync circle badges from API query to local state
  useEffect(() => {
    if (isDemo || !selectedCircle || !circleBadgesQuery.data) return;
    setCircleBadges(prev => ({ ...prev, [selectedCircle.id]: circleBadgesQuery.data }));
  }, [isDemo, selectedCircle?.id, circleBadgesQuery.data]);

  // Sync circle awards from API query to local state
  useEffect(() => {
    if (isDemo || !selectedCircle || !circleAwardsQuery.data) return;
    setCircleAwards(prev => ({ ...prev, [selectedCircle.id]: circleAwardsQuery.data }));
  }, [isDemo, selectedCircle?.id, circleAwardsQuery.data]);

  // Sync circle posts from API query to local state
  useEffect(() => {
    if (isDemo || !selectedCircle || !circlePostsQuery.data) return;
    setCirclePosts(prev => ({ ...prev, [selectedCircle.id]: circlePostsQuery.data }));
  }, [isDemo, selectedCircle?.id, circlePostsQuery.data]);

  // Sync circle task completions from API query to local state
  useEffect(() => {
    if (isDemo || !selectedCircle || !circleCompletionsQuery.data) return;
    const circleId = selectedCircle.id;
    
    // Filter to selected date's completions and group by taskId
    const dateCompletions = circleCompletionsQuery.data.filter((c: any) => c.date === selectedTaskDate);
    const completionsByTask: Record<string, { userId: string; userName: string; completedAt: string }[]> = {};
    const myTaskIds: string[] = [];
    const currentUserId = user?.id;
    
    dateCompletions.forEach((c: any) => {
      if (!completionsByTask[c.taskId]) {
        completionsByTask[c.taskId] = [];
      }
      completionsByTask[c.taskId].push({
        userId: c.userId,
        userName: c.userName || 'Unknown',
        completedAt: c.completedAt || c.createdAt || new Date().toISOString(),
      });
      if (c.userId === currentUserId) {
        myTaskIds.push(c.taskId);
      }
    });
    
    setCircleTaskCompletions(prev => ({ ...prev, [circleId]: completionsByTask }));
    setMyCompletedTasks(prev => ({ ...prev, [circleId]: myTaskIds }));
    
    // Calculate weekly points for each member from all completions this week
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Monday
    weekStart.setHours(0, 0, 0, 0);
    const weekStartStr = weekStart.toISOString().split('T')[0];
    
    const weeklyCompletions = circleCompletionsQuery.data.filter((c: any) => c.date >= weekStartStr);
    const memberPointsMap: Record<string, number> = {};
    
    const tasks = circleTasks[circleId] || circleTasksQuery.data || [];
    weeklyCompletions.forEach((c: any) => {
      const task = tasks.find((t: any) => t.id === c.taskId);
      if (task) {
        memberPointsMap[c.userId] = (memberPointsMap[c.userId] || 0) + (task.value || 0);
      }
    });
    
    // Update member points in state
    setCircleMembers(prev => {
      const members = prev[circleId] || [];
      const updatedMembers = members.map(m => ({
        ...m,
        weeklyPoints: memberPointsMap[m.userId] || 0,
      }));
      return { ...prev, [circleId]: updatedMembers };
    });
  }, [isDemo, selectedCircle?.id, circleCompletionsQuery.data, circleTasksQuery.data, circleTasks, user?.id, selectedTaskDate]);

  // Demo data for member daily completions (today)
  const demoMemberDailyCompletions: Record<string, Record<string, { taskId: string; taskName: string; completedAt: string }[]>> = {
    "circle-1": {
      "you": [
        { taskId: "ct1", taskName: "5K Training Run", completedAt: new Date(Date.now() - 3600000).toISOString() },
        { taskId: "ct3", taskName: "Stretching Session", completedAt: new Date(Date.now() - 7200000).toISOString() },
      ],
      "u1": [
        { taskId: "ct1", taskName: "5K Training Run", completedAt: new Date(Date.now() - 5400000).toISOString() },
        { taskId: "ct2", taskName: "Strength Training", completedAt: new Date(Date.now() - 3600000).toISOString() },
        { taskId: "ct4", taskName: "Long Run (10K+)", completedAt: new Date(Date.now() - 1800000).toISOString() },
      ],
      "u2": [
        { taskId: "ct1", taskName: "5K Training Run", completedAt: new Date(Date.now() - 7200000).toISOString() },
        { taskId: "ct2", taskName: "Strength Training", completedAt: new Date(Date.now() - 5400000).toISOString() },
      ],
      "u3": [
        { taskId: "ct3", taskName: "Stretching Session", completedAt: new Date(Date.now() - 3600000).toISOString() },
        { taskId: "ct5", taskName: "Rest Day (Active Recovery)", completedAt: new Date(Date.now() - 1800000).toISOString() },
      ],
    },
    "circle-2": {
      "you": [
        { taskId: "ct6", taskName: "Clean Room", completedAt: new Date(Date.now() - 3600000).toISOString() },
        { taskId: "ct7", taskName: "Do Dishes", completedAt: new Date(Date.now() - 7200000).toISOString() },
      ],
      "u4": [
        { taskId: "ct9", taskName: "Mow Lawn", completedAt: new Date(Date.now() - 5400000).toISOString() },
      ],
      "u5": [
        { taskId: "ct6", taskName: "Clean Room", completedAt: new Date(Date.now() - 1800000).toISOString() },
        { taskId: "ct10", taskName: "Homework Done", completedAt: new Date(Date.now() - 3600000).toISOString() },
      ],
      "u6": [
        { taskId: "ct6", taskName: "Clean Room", completedAt: new Date(Date.now() - 5400000).toISOString() },
      ],
      "u7": [],
    },
    "circle-3": {
      "you": [
        { taskId: "ct12", taskName: "Read 30 minutes", completedAt: new Date(Date.now() - 3600000).toISOString() },
      ],
      "u8": [
        { taskId: "ct12", taskName: "Read 30 minutes", completedAt: new Date(Date.now() - 1800000).toISOString() },
        { taskId: "ct15", taskName: "Finish Book Chapter", completedAt: new Date(Date.now() - 5400000).toISOString() },
      ],
    },
  };
  
  // Demo data for weekly task counts
  const demoMemberWeeklyCompletions: Record<string, Record<string, { taskName: string; count: number }[]>> = {
    "circle-1": {
      "you": [
        { taskName: "5K Training Run", count: 3 },
        { taskName: "Stretching Session", count: 5 },
        { taskName: "Strength Training", count: 2 },
      ],
      "u1": [
        { taskName: "5K Training Run", count: 5 },
        { taskName: "Strength Training", count: 4 },
        { taskName: "Long Run (10K+)", count: 2 },
      ],
      "u2": [
        { taskName: "5K Training Run", count: 4 },
        { taskName: "Strength Training", count: 3 },
        { taskName: "Stretching Session", count: 2 },
      ],
      "u3": [
        { taskName: "Stretching Session", count: 6 },
        { taskName: "Rest Day (Active Recovery)", count: 2 },
        { taskName: "Strength Training", count: 1 },
      ],
    },
    "circle-2": {
      "you": [
        { taskName: "Clean Room", count: 3 },
        { taskName: "Do Dishes", count: 5 },
        { taskName: "Take Out Trash", count: 2 },
      ],
      "u4": [
        { taskName: "Mow Lawn", count: 1 },
        { taskName: "Take Out Trash", count: 3 },
      ],
      "u5": [
        { taskName: "Clean Room", count: 4 },
        { taskName: "Homework Done", count: 5 },
        { taskName: "Walk the Dog", count: 3 },
      ],
      "u6": [
        { taskName: "Clean Room", count: 3 },
        { taskName: "Homework Done", count: 4 },
      ],
      "u7": [
        { taskName: "Walk the Dog", count: 2 },
      ],
    },
    "circle-3": {
      "you": [
        { taskName: "Read 30 minutes", count: 4 },
        { taskName: "Finish Book Chapter", count: 1 },
      ],
      "u8": [
        { taskName: "Read 30 minutes", count: 6 },
        { taskName: "Finish Book Chapter", count: 3 },
        { taskName: "Write Book Review", count: 1 },
      ],
    },
  };
  
  // Demo data for all-time stats (including goal streaks)
  const demoMemberAllTimeStats: Record<string, Record<string, { weeklyHistory: { week: string; points: number }[]; taskTotals: { taskName: string; count: number }[]; totalPoints: number; goalStreak: number }>> = {
    "circle-1": {
      "you": {
        weeklyHistory: [
          { week: "Nov 25", points: 145 },
          { week: "Nov 18", points: 120 },
          { week: "Nov 11", points: 95 },
          { week: "Nov 4", points: 110 },
        ],
        taskTotals: [
          { taskName: "5K Training Run", count: 15 },
          { taskName: "Stretching Session", count: 22 },
          { taskName: "Strength Training", count: 8 },
        ],
        totalPoints: 470,
        goalStreak: 5,
      },
      "u1": {
        weeklyHistory: [
          { week: "Nov 25", points: 210 },
          { week: "Nov 18", points: 195 },
          { week: "Nov 11", points: 180 },
          { week: "Nov 4", points: 175 },
        ],
        taskTotals: [
          { taskName: "5K Training Run", count: 28 },
          { taskName: "Strength Training", count: 20 },
          { taskName: "Long Run (10K+)", count: 12 },
        ],
        totalPoints: 760,
        goalStreak: 14,
      },
      "u2": {
        weeklyHistory: [],
        taskTotals: [],
        totalPoints: 520,
        goalStreak: 7,
      },
      "u3": {
        weeklyHistory: [],
        taskTotals: [],
        totalPoints: 480,
        goalStreak: 3,
      },
    },
    "circle-2": {
      "you": {
        weeklyHistory: [
          { week: "Nov 25", points: 85 },
          { week: "Nov 18", points: 90 },
          { week: "Nov 11", points: 75 },
        ],
        taskTotals: [
          { taskName: "Clean Room", count: 12 },
          { taskName: "Do Dishes", count: 18 },
          { taskName: "Take Out Trash", count: 8 },
        ],
        totalPoints: 250,
        goalStreak: 8,
      },
      "u4": {
        weeklyHistory: [],
        taskTotals: [],
        totalPoints: 200,
        goalStreak: 6,
      },
      "u5": {
        weeklyHistory: [
          { week: "Nov 25", points: 55 },
          { week: "Nov 18", points: 60 },
          { week: "Nov 11", points: 45 },
        ],
        taskTotals: [
          { taskName: "Clean Room", count: 15 },
          { taskName: "Homework Done", count: 20 },
          { taskName: "Walk the Dog", count: 10 },
        ],
        totalPoints: 160,
        goalStreak: 4,
      },
      "u6": {
        weeklyHistory: [],
        taskTotals: [],
        totalPoints: 180,
        goalStreak: 2,
      },
      "u7": {
        weeklyHistory: [],
        taskTotals: [],
        totalPoints: 75,
        goalStreak: 1,
      },
    },
    "circle-3": {
      "you": {
        weeklyHistory: [],
        taskTotals: [],
        totalPoints: 120,
        goalStreak: 3,
      },
      "u8": {
        weeklyHistory: [],
        taskTotals: [],
        totalPoints: 225,
        goalStreak: 10,
      },
    },
  };
  
  // Badge/Award creation state
  const [showAddBadge, setShowAddBadge] = useState(false);
  const [newBadgeName, setNewBadgeName] = useState("");
  const [newBadgeDescription, setNewBadgeDescription] = useState("");
  const [newBadgeRequired, setNewBadgeRequired] = useState("10");
  const [newBadgeRewardType, setNewBadgeRewardType] = useState<"none" | "points" | "gift" | "both">("none");
  const [newBadgeRewardPoints, setNewBadgeRewardPoints] = useState("50");
  const [newBadgeRewardGift, setNewBadgeRewardGift] = useState("");
  const [newBadgeTaskId, setNewBadgeTaskId] = useState<string>("");
  
  const [showAddAward, setShowAddAward] = useState(false);
  const [newAwardName, setNewAwardName] = useState("");
  const [newAwardDescription, setNewAwardDescription] = useState("");
  const [newAwardType, setNewAwardType] = useState<"first_to" | "most_in_category" | "weekly_champion">("first_to");
  const [newAwardTarget, setNewAwardTarget] = useState("100");
  const [newAwardCategory, setNewAwardCategory] = useState("");
  const [newAwardRewardType, setNewAwardRewardType] = useState<"none" | "points" | "gift" | "both">("none");
  const [newAwardRewardPoints, setNewAwardRewardPoints] = useState("50");
  const [newAwardRewardGift, setNewAwardRewardGift] = useState("");
  const [newAwardTaskId, setNewAwardTaskId] = useState<string>("");
  
  // Badge/Award requests for approval
  const [badgeRequests, setBadgeRequests] = useState<{ id: string; circleId: string; requesterId: string; requesterName: string; type: "badge" | "award"; data: any; status: string; createdAt: string }[]>([]);

  // Edit state for tasks, badges, awards
  const [editingTask, setEditingTask] = useState<StoredCircleTask | null>(null);
  const [editTaskName, setEditTaskName] = useState("");
  const [editTaskValue, setEditTaskValue] = useState("10");
  const [editTaskType, setEditTaskType] = useState<CircleTaskType>("per_person");

  const [editingBadge, setEditingBadge] = useState<CircleBadge | null>(null);
  const [editBadgeName, setEditBadgeName] = useState("");
  const [editBadgeDescription, setEditBadgeDescription] = useState("");
  const [editBadgeRequired, setEditBadgeRequired] = useState("10");
  const [editBadgeRewardType, setEditBadgeRewardType] = useState<"none" | "points" | "gift" | "both">("none");
  const [editBadgeRewardPoints, setEditBadgeRewardPoints] = useState("50");
  const [editBadgeRewardGift, setEditBadgeRewardGift] = useState("");
  const [editBadgeTaskId, setEditBadgeTaskId] = useState<string>("");

  const [editingAward, setEditingAward] = useState<CircleAward | null>(null);
  const [editAwardName, setEditAwardName] = useState("");
  const [editAwardDescription, setEditAwardDescription] = useState("");
  const [editAwardType, setEditAwardType] = useState<"first_to" | "most_in_category" | "weekly_champion">("first_to");
  const [editAwardTarget, setEditAwardTarget] = useState("100");
  const [editAwardCategory, setEditAwardCategory] = useState("");
  const [editAwardRewardType, setEditAwardRewardType] = useState<"none" | "points" | "gift" | "both">("none");
  const [editAwardRewardPoints, setEditAwardRewardPoints] = useState("50");
  const [editAwardRewardGift, setEditAwardRewardGift] = useState("");
  const [editAwardTaskId, setEditAwardTaskId] = useState<string>("");

  // Circle Settings (goals) state
  const [showCircleSettings, setShowCircleSettings] = useState(false);
  const [editDailyGoal, setEditDailyGoal] = useState("");
  const [editWeeklyGoal, setEditWeeklyGoal] = useState("");

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

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const isOwnerOrAdmin = (circleId: string) => {
    const members = circleMembers[circleId] || [];
    const currentUserId = isDemo ? "you" : user?.id;
    const me = members.find(m => m.userId === currentUserId);
    return me?.role === "owner" || me?.role === "admin";
  };

  const getUserRole = (circleId: string) => {
    const members = circleMembers[circleId] || [];
    const currentUserId = isDemo ? "you" : user?.id;
    const me = members.find(m => m.userId === currentUserId);
    return me?.role || "member";
  };

  const sortedLeaderboard = useMemo(() => {
    return [...friends].sort((a, b) => {
      switch (friendsLeaderboardViewMode) {
        case "day":
          return b.todayPoints - a.todayPoints;
        case "alltime":
          return b.totalPoints - a.totalPoints;
        case "week":
        default:
          return b.weeklyPoints - a.weeklyPoints;
      }
    });
  }, [friends, friendsLeaderboardViewMode]);

  const filteredFriends = useMemo(() => {
    if (!searchQuery) return friends;
    const query = searchQuery.toLowerCase();
    return friends.filter(
      (f) =>
        f.firstName.toLowerCase().includes(query) ||
        f.lastName.toLowerCase().includes(query)
    );
  }, [friends, searchQuery]);

  const pendingRequestsForCircle = useMemo(() => {
    if (!selectedCircle) return [];
    return taskRequests.filter(r => r.circleId === selectedCircle.id && r.status === "pending");
  }, [selectedCircle, taskRequests]);

  // Compute display posts from API data in non-demo mode
  const displayPosts: StoredCommunityPost[] = useMemo(() => {
    let posts: StoredCommunityPost[];
    
    if (isDemo) {
      posts = communityPosts;
    } else if (!postsQuery.data) {
      posts = [];
    } else {
      // Convert API posts to StoredCommunityPost format
      // Store isLiked and likeCount directly from API for accurate state
      posts = postsQuery.data.map((post): StoredCommunityPost => ({
        id: post.id,
        authorId: post.authorId,
        authorName: post.author 
          ? (post.author.displayName || `${post.author.firstName} ${post.author.lastName}`.trim())
          : "Unknown User",
        content: post.content,
        visibility: post.visibility,
        createdAt: post.createdAt,
        likes: post.isLiked ? ["you"] : [],
        comments: [],
        commentCount: post.commentCount || 0,
        likeCount: post.likeCount || 0,
        isLiked: post.isLiked,
        imageUrl: post.imageUrl,
      }));
    }
    
    // Apply visibility filter
    if (feedViewFilter === "friends") {
      return posts.filter(post => post.visibility === "friends");
    } else if (feedViewFilter === "public") {
      return posts.filter(post => post.visibility === "public");
    }
    return posts;
  }, [isDemo, communityPosts, postsQuery.data, feedViewFilter]);

  // Image upload handler
  const handleImageUpload = async (
    file: File,
    setImageUrl: (url: string | null) => void,
    setPreview: (url: string | null) => void,
    setUploading: (uploading: boolean) => void
  ): Promise<string | null> => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast({ title: "Invalid file type", description: "Please select a JPG, PNG, GIF, or WebP image.", variant: "destructive" });
      return null;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({ title: "File too large", description: "Please select an image under 5MB.", variant: "destructive" });
      return null;
    }

    const localPreviewUrl = URL.createObjectURL(file);
    setPreview(localPreviewUrl);
    setUploading(true);

    try {
      const uploadUrlRes = await apiRequest("POST", "/api/media/upload-url", {});
      const { uploadURL } = await uploadUrlRes.json();

      const uploadResponse = await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload file to storage");
      }

      setImageUrl(uploadURL);
      return uploadURL;
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({ title: "Upload failed", description: "Failed to upload image. Please try again.", variant: "destructive" });
      URL.revokeObjectURL(localPreviewUrl);
      setPreview(null);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSendRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      if (isDemo) {
        toast({ title: "Friend request sent", description: `Request sent to ${email}` });
        setEmail("");
      } else {
        sendFriendRequestMutation.mutate(email.trim());
        setEmail("");
      }
    }
  };

  const handleAcceptRequest = (id: string) => {
    if (isDemo) {
      const request = requests.find((r) => r.id === id);
      if (request) {
        const newFriend: StoredFriend = {
          id: `friend-${Date.now()}`,
          friendId: id,
          firstName: request.firstName,
          lastName: request.lastName,
          todayPoints: Math.floor(Math.random() * 50),
          weeklyPoints: Math.floor(Math.random() * 300) + 100,
          totalPoints: Math.floor(Math.random() * 2000) + 500,
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
    } else {
      acceptFriendRequestMutation.mutate(id);
    }
  };

  const handleDeclineRequest = (id: string) => {
    if (isDemo) {
      setRequests(requests.filter((r) => r.id !== id));
      toast({ title: "Request declined" });
    } else {
      declineFriendRequestMutation.mutate(id);
    }
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

  const handleCreateCircle = () => {
    if (newCircleName.trim()) {
      const iconColor = `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`;
      
      if (!isDemo) {
        // In non-demo mode, call the API to persist the circle
        createCircleMutation.mutate({
          name: newCircleName.trim(),
          description: newCircleDescription.trim() || "A new circle to share goals",
          iconColor,
        }, {
          onSuccess: () => {
            toast({
              title: "Circle created",
              description: `"${newCircleName}" has been created. Invite members to get started!`,
            });
            setShowCreateCircle(false);
            setNewCircleName("");
            setNewCircleDescription("");
          },
        });
      } else {
        // Demo mode - only update local state
        const newCircle: StoredCircle = {
          id: `circle-${Date.now()}`,
          name: newCircleName.trim(),
          description: newCircleDescription.trim() || "A new circle to share goals",
          iconColor,
          createdAt: new Date().toISOString().split("T")[0],
          createdBy: "you",
          memberCount: 1,
        };
        setCircles([...circles, newCircle]);
        setCircleMembers({ 
          ...circleMembers, 
          [newCircle.id]: [
            { id: `m-${Date.now()}`, circleId: newCircle.id, userId: "you", firstName: "You", lastName: "", role: "owner", joinedAt: new Date().toISOString().split("T")[0], weeklyPoints: 0 }
          ]
        });
        setCircleTasks({ ...circleTasks, [newCircle.id]: [] });
        setCircleMessages({ ...circleMessages, [newCircle.id]: [] });
        setCirclePosts({ ...circlePosts, [newCircle.id]: [] });
        toast({
          title: "Circle created",
          description: `"${newCircleName}" has been created. Invite members to get started!`,
        });
        setShowCreateCircle(false);
        setNewCircleName("");
        setNewCircleDescription("");
      }
    }
  };

  const openCircleSettings = () => {
    if (!selectedCircle) return;
    setEditDailyGoal(selectedCircle.dailyPointGoal?.toString() || "");
    setEditWeeklyGoal(selectedCircle.weeklyPointGoal?.toString() || "");
    setShowCircleSettings(true);
  };

  const handleSaveCircleSettings = () => {
    if (!selectedCircle) return;
    
    const dailyGoal = editDailyGoal ? parseInt(editDailyGoal) : undefined;
    const weeklyGoal = editWeeklyGoal ? parseInt(editWeeklyGoal) : undefined;
    
    const updatedCircle: StoredCircle = {
      ...selectedCircle,
      dailyPointGoal: dailyGoal,
      weeklyPointGoal: weeklyGoal,
    };
    
    setCircles(circles.map(c => c.id === selectedCircle.id ? updatedCircle : c));
    setSelectedCircle(updatedCircle);
    setShowCircleSettings(false);
    
    toast({
      title: "Circle settings updated",
      description: "Point goals have been saved successfully.",
    });
  };

  const handleSendDM = async () => {
    if (!dmFriend || (!dmMessage.trim() && !dmImages[dmFriend.friendId])) return;
    const imageUrl = dmImages[dmFriend.friendId] || undefined;
    const friendId = dmFriend.friendId;
    const message = dmMessage.trim();
    
    // Non-demo mode: call API
    if (!isDemo && user) {
      try {
        const res = await apiRequest("POST", `/api/messages/${friendId}`, {
          content: message,
          imageUrl: imageUrl || undefined,
        });
        const newMessage = await res.json();
        const currentDMs = directMessages[friendId] || [];
        setDirectMessages({ ...directMessages, [friendId]: [...currentDMs, newMessage] });
        setDmMessage("");
        clearDmImage(friendId);
        toast({ title: "Message sent" });
      } catch (error) {
        console.error("Error sending message:", error);
        toast({ title: "Failed to send message", variant: "destructive" });
      }
      return;
    }
    
    // Demo mode: local state only
    const newDM: StoredDirectMessage = {
      id: `dm-${Date.now()}`,
      senderId: "you",
      senderName: "You",
      recipientId: friendId,
      recipientName: getName(dmFriend.firstName, dmFriend.lastName),
      content: message,
      createdAt: new Date().toISOString(),
      read: true,
      imageUrl,
    };
    const currentDMs = directMessages[friendId] || [];
    setDirectMessages({ ...directMessages, [friendId]: [...currentDMs, newDM] });
    setDmMessage("");
    clearDmImage(friendId);
    toast({ title: "Message sent" });
  };

  const handleCreateFeedPost = () => {
    if (!newPostContent.trim() && !feedPostImage) return;
    
    if (!isDemo) {
      createPostMutation.mutate({
        content: newPostContent.trim(),
        visibility: newPostVisibility,
        imageUrl: feedPostImage || undefined,
      }, {
        onSuccess: () => {
          setNewPostContent("");
          clearFeedPostImage();
          toast({ title: "Post shared" });
        },
        onError: () => {
          toast({ title: "Failed to create post", variant: "destructive" });
        }
      });
      return;
    }
    
    const newPost: StoredCommunityPost = {
      id: `feed-${Date.now()}`,
      authorId: "you",
      authorName: "You",
      content: newPostContent.trim(),
      visibility: newPostVisibility,
      createdAt: new Date().toISOString(),
      likes: [],
      comments: [],
      imageUrl: feedPostImage || undefined,
    };
    setCommunityPosts([newPost, ...communityPosts]);
    setNewPostContent("");
    clearFeedPostImage();
    toast({ title: "Post shared" });
  };

  const handleLikeFeedPost = (postId: string) => {
    if (!isDemo) {
      likePostMutation.mutate(postId);
      return;
    }
    
    setCommunityPosts(communityPosts.map(post => {
      if (post.id !== postId) return post;
      const liked = post.likes.includes("you");
      return {
        ...post,
        likes: liked ? post.likes.filter(id => id !== "you") : [...post.likes, "you"]
      };
    }));
  };

  const [commentingPostId, setCommentingPostId] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");

  const handleAddComment = (postId: string) => {
    if (!newComment.trim()) return;
    
    if (!isDemo) {
      addCommentMutation.mutate({ postId, content: newComment.trim() }, {
        onSuccess: () => {
          setNewComment("");
          setCommentingPostId(null);
          toast({ title: "Comment added" });
        },
        onError: () => {
          toast({ title: "Failed to add comment", variant: "destructive" });
        }
      });
      return;
    }
    
    setCommunityPosts(communityPosts.map(post => {
      if (post.id !== postId) return post;
      const comment = {
        id: `c-${Date.now()}`,
        authorId: "you",
        authorName: "You",
        content: newComment.trim(),
        createdAt: new Date().toISOString(),
        likes: [],
      };
      return { ...post, comments: [...post.comments, comment] };
    }));
    setNewComment("");
    setCommentingPostId(null);
    toast({ title: "Comment added" });
  };

  const handleLikeComment = (postId: string, commentId: string) => {
    setCommunityPosts(communityPosts.map(post => {
      if (post.id !== postId) return post;
      return {
        ...post,
        comments: post.comments.map(comment => {
          if (comment.id !== commentId) return comment;
          const liked = comment.likes.includes("you");
          return {
            ...comment,
            likes: liked ? comment.likes.filter(id => id !== "you") : [...comment.likes, "you"]
          };
        })
      };
    }));
  };

  const handleDeletePost = (postId: string) => {
    if (!isDemo) {
      deletePostMutation.mutate(postId, {
        onSuccess: () => {
          toast({ title: "Post deleted" });
        },
        onError: () => {
          toast({ title: "Failed to delete post", variant: "destructive" });
        }
      });
      return;
    }
    
    setCommunityPosts(communityPosts.filter(post => post.id !== postId));
    toast({ title: "Post deleted" });
  };

  const handleDeleteComment = (postId: string, commentId: string) => {
    setCommunityPosts(communityPosts.map(post => {
      if (post.id !== postId) return post;
      return { ...post, comments: post.comments.filter(c => c.id !== commentId) };
    }));
    toast({ title: "Comment deleted" });
  };

  const handleSendDirectMessage = async (friendId: string, friendName: string) => {
    const message = dmMessages[friendId] || "";
    const imageUrl = dmImages[friendId] || null;
    if (!message.trim() && !imageUrl) return;
    
    if (!isDemo && user) {
      try {
        const res = await apiRequest("POST", `/api/messages/${friendId}`, {
          content: message.trim(),
          imageUrl: imageUrl || undefined,
        });
        const newMessage = await res.json();
        const currentMsgs = directMessages[friendId] || [];
        setDirectMessages({ ...directMessages, [friendId]: [...currentMsgs, newMessage] });
        setDmMessages({ ...dmMessages, [friendId]: "" });
        clearDmImage(friendId);
        toast({ title: "Message sent" });
      } catch (error) {
        console.error("Error sending message:", error);
        toast({ title: "Failed to send message", variant: "destructive" });
      }
      return;
    }
    
    const msg: StoredDirectMessage = {
      id: `dm-${Date.now()}`,
      senderId: "you",
      senderName: "You",
      recipientId: friendId,
      recipientName: friendName,
      content: message.trim(),
      createdAt: new Date().toISOString(),
      read: true,
      imageUrl: imageUrl || undefined,
    };
    const currentMsgs = directMessages[friendId] || [];
    setDirectMessages({ ...directMessages, [friendId]: [...currentMsgs, msg] });
    setDmMessages({ ...dmMessages, [friendId]: "" });
    clearDmImage(friendId);
    toast({ title: "Message sent" });
  };
  
  const fetchDirectMessages = useCallback(async (friendId: string) => {
    if (isDemo || !user) return;
    try {
      const res = await apiRequest("GET", `/api/messages/${friendId}`);
      const messages = await res.json();
      setDirectMessages(prev => ({ ...prev, [friendId]: messages.reverse() }));
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  }, [isDemo, user]);

  // Image upload handler for circle messages and posts
  const handleCircleImageUpload = async (
    file: File,
    type: "message" | "post"
  ) => {
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

    const previewUrl = URL.createObjectURL(file);
    if (type === "message") {
      setCircleMessageImagePreview(previewUrl);
      setCircleMessageUploading(true);
    } else {
      setCirclePostImagePreview(previewUrl);
      setCirclePostUploading(true);
    }

    try {
      const uploadUrlRes = await apiRequest("POST", "/api/media/upload-url", {});
      const { uploadURL } = await uploadUrlRes.json();

      const uploadResponse = await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload file to storage");
      }

      if (type === "message") {
        setCircleMessageImage(uploadURL);
      } else {
        setCirclePostImage(uploadURL);
      }
      toast({ title: "Image uploaded", description: "Image attached successfully." });
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({ title: "Upload failed", description: "Failed to upload image. Please try again.", variant: "destructive" });
      URL.revokeObjectURL(previewUrl);
      if (type === "message") {
        setCircleMessageImagePreview(null);
      } else {
        setCirclePostImagePreview(null);
      }
    } finally {
      if (type === "message") {
        setCircleMessageUploading(false);
        if (circleMessageFileRef.current) circleMessageFileRef.current.value = "";
      } else {
        setCirclePostUploading(false);
        if (circlePostFileRef.current) circlePostFileRef.current.value = "";
      }
    }
  };

  const clearMessageImage = () => {
    if (circleMessageImagePreview) URL.revokeObjectURL(circleMessageImagePreview);
    setCircleMessageImage(null);
    setCircleMessageImagePreview(null);
    if (circleMessageFileRef.current) circleMessageFileRef.current.value = "";
  };

  const clearPostImage = () => {
    if (circlePostImagePreview) URL.revokeObjectURL(circlePostImagePreview);
    setCirclePostImage(null);
    setCirclePostImagePreview(null);
    if (circlePostFileRef.current) circlePostFileRef.current.value = "";
  };

  const clearFeedPostImage = () => {
    if (feedPostImagePreview) URL.revokeObjectURL(feedPostImagePreview);
    setFeedPostImage(null);
    setFeedPostImagePreview(null);
    if (feedPostFileRef.current) feedPostFileRef.current.value = "";
  };

  const clearDmImage = (friendId: string) => {
    if (dmImagePreviews[friendId]) URL.revokeObjectURL(dmImagePreviews[friendId]!);
    setDmImages({ ...dmImages, [friendId]: null });
    setDmImagePreviews({ ...dmImagePreviews, [friendId]: null });
    const ref = dmFileRefs.current[friendId];
    if (ref) ref.value = "";
  };

  const handleFeedImageUpload = async (file: File) => {
    await handleImageUpload(
      file,
      setFeedPostImage,
      setFeedPostImagePreview,
      setFeedPostUploading
    );
    if (feedPostFileRef.current) feedPostFileRef.current.value = "";
  };

  const handleDmImageUpload = async (friendId: string, file: File) => {
    await handleImageUpload(
      file,
      (url) => setDmImages({ ...dmImages, [friendId]: url }),
      (url) => setDmImagePreviews({ ...dmImagePreviews, [friendId]: url }),
      (uploading) => setDmUploading({ ...dmUploading, [friendId]: uploading })
    );
    const ref = dmFileRefs.current[friendId];
    if (ref) ref.value = "";
  };

  const handleSendCircleMessage = () => {
    if (!selectedCircle || (!newCircleMessage.trim() && !circleMessageImage)) return;
    const newMsg: StoredCircleMessage = {
      id: `cm-${Date.now()}`,
      circleId: selectedCircle.id,
      senderId: "you",
      senderName: "You",
      content: newCircleMessage.trim(),
      createdAt: new Date().toISOString(),
      imageUrl: circleMessageImage || undefined,
    };
    const current = circleMessages[selectedCircle.id] || [];
    setCircleMessages({ ...circleMessages, [selectedCircle.id]: [...current, newMsg] });
    setNewCircleMessage("");
    clearMessageImage();
  };

  const handleCreateCirclePost = () => {
    if (!selectedCircle || (!newCirclePost.trim() && !circlePostImage)) return;
    
    // Use API for non-demo mode
    if (!isDemo) {
      createCirclePostMutation.mutate({
        circleId: selectedCircle.id,
        post: {
          content: newCirclePost.trim(),
          imageUrl: circlePostImage || undefined,
        }
      }, {
        onSuccess: () => {
          toast({ title: "Post added to board" });
        }
      });
      setNewCirclePost("");
      clearPostImage();
      return;
    }
    
    const newPost: StoredCirclePost = {
      id: `cp-${Date.now()}`,
      circleId: selectedCircle.id,
      authorId: "you",
      authorName: "You",
      content: newCirclePost.trim(),
      createdAt: new Date().toISOString(),
      likes: [],
      comments: [],
      imageUrl: circlePostImage || undefined,
    };
    const current = circlePosts[selectedCircle.id] || [];
    setCirclePosts({ ...circlePosts, [selectedCircle.id]: [newPost, ...current] });
    setNewCirclePost("");
    clearPostImage();
    toast({ title: "Post added to board" });
  };

  const [circlePostCommentingId, setCirclePostCommentingId] = useState<string | null>(null);
  const [newCirclePostComment, setNewCirclePostComment] = useState("");

  const handleLikeCirclePost = (postId: string) => {
    if (!selectedCircle) return;
    
    // Use API for non-demo mode
    if (!isDemo) {
      likeCirclePostMutation.mutate({
        circleId: selectedCircle.id,
        postId: postId,
      });
      return;
    }
    
    setCirclePosts({
      ...circlePosts,
      [selectedCircle.id]: (circlePosts[selectedCircle.id] || []).map(post => {
        if (post.id !== postId) return post;
        const liked = post.likes.includes("you");
        return {
          ...post,
          likes: liked ? post.likes.filter(id => id !== "you") : [...post.likes, "you"]
        };
      })
    });
  };

  const handleAddCirclePostComment = (postId: string) => {
    if (!selectedCircle || !newCirclePostComment.trim()) return;
    
    // Use API for non-demo mode
    if (!isDemo) {
      addCirclePostCommentMutation.mutate({
        circleId: selectedCircle.id,
        postId: postId,
        comment: {
          content: newCirclePostComment.trim(),
        }
      }, {
        onSuccess: () => {
          toast({ title: "Comment added" });
        }
      });
      setNewCirclePostComment("");
      setCirclePostCommentingId(null);
      return;
    }
    
    const comment: StoredCirclePostComment = {
      id: `cpc-${Date.now()}`,
      authorId: "you",
      authorName: "You",
      content: newCirclePostComment.trim(),
      createdAt: new Date().toISOString(),
      likes: [],
    };
    setCirclePosts({
      ...circlePosts,
      [selectedCircle.id]: (circlePosts[selectedCircle.id] || []).map(post => {
        if (post.id !== postId) return post;
        return { ...post, comments: [...post.comments, comment] };
      })
    });
    setNewCirclePostComment("");
    setCirclePostCommentingId(null);
    toast({ title: "Comment added" });
  };

  const handleLikeCirclePostComment = (postId: string, commentId: string) => {
    if (!selectedCircle) return;
    setCirclePosts({
      ...circlePosts,
      [selectedCircle.id]: (circlePosts[selectedCircle.id] || []).map(post => {
        if (post.id !== postId) return post;
        return {
          ...post,
          comments: post.comments.map(comment => {
            if (comment.id !== commentId) return comment;
            const liked = comment.likes.includes("you");
            return {
              ...comment,
              likes: liked ? comment.likes.filter(id => id !== "you") : [...comment.likes, "you"]
            };
          })
        };
      })
    });
  };

  const handleDeleteCirclePostComment = (postId: string, commentId: string) => {
    if (!selectedCircle) return;
    setCirclePosts({
      ...circlePosts,
      [selectedCircle.id]: (circlePosts[selectedCircle.id] || []).map(post => {
        if (post.id !== postId) return post;
        return { ...post, comments: post.comments.filter(c => c.id !== commentId) };
      })
    });
    toast({ title: "Comment deleted" });
  };

  const handleDeleteCirclePost = (postId: string) => {
    if (!selectedCircle) return;
    setCirclePosts({
      ...circlePosts,
      [selectedCircle.id]: (circlePosts[selectedCircle.id] || []).filter(p => p.id !== postId)
    });
    toast({ title: "Post deleted" });
  };

  const handleAddTask = () => {
    if (!selectedCircle || !newTaskName.trim()) return;
    const canApproveInstantly = isOwnerOrAdmin(selectedCircle.id);
    
    // Use API for non-demo mode
    if (!isDemo) {
      createCircleTaskMutation.mutate({
        circleId: selectedCircle.id,
        task: {
          name: newTaskName.trim(),
          value: parseInt(newTaskValue) || 10,
          taskType: newTaskType,
        }
      }, {
        onSuccess: () => {
          toast({ title: "Task added" });
        }
      });
      setShowAddTask(false);
      setNewTaskName("");
      setNewTaskValue("10");
      setNewTaskType("per_person");
      return;
    }
    
    if (canApproveInstantly) {
      const newTask: StoredCircleTask = {
        id: `ct-${Date.now()}`,
        circleId: selectedCircle.id,
        name: newTaskName.trim(),
        value: parseInt(newTaskValue) || 10,
        taskType: newTaskType,
        createdById: "you",
        requiresApproval: false,
        approvalStatus: "approved",
      };
      const current = circleTasks[selectedCircle.id] || [];
      setCircleTasks({ ...circleTasks, [selectedCircle.id]: [...current, newTask] });
      toast({ title: "Task added" });
    } else {
      const request: StoredCircleTaskAdjustmentRequest = {
        id: `req-${Date.now()}`,
        circleId: selectedCircle.id,
        requesterId: "you",
        requesterName: "You",
        type: "add",
        taskData: { name: newTaskName.trim(), value: parseInt(newTaskValue) || 10, taskType: newTaskType },
        status: "pending",
        createdAt: new Date().toISOString(),
      };
      setTaskRequests([...taskRequests, request]);
      toast({ title: "Task request submitted", description: "Waiting for owner/admin approval" });
    }
    
    setShowAddTask(false);
    setNewTaskName("");
    setNewTaskValue("10");
    setNewTaskType("per_person");
  };

  const handleApproveRequest = (requestId: string) => {
    const request = taskRequests.find(r => r.id === requestId);
    if (!request || !selectedCircle) return;
    
    if (request.type === "add") {
      const newTask: StoredCircleTask = {
        id: `ct-${Date.now()}`,
        circleId: selectedCircle.id,
        name: request.taskData.name || "New Task",
        value: request.taskData.value || 10,
        taskType: request.taskData.taskType || "per_person",
        createdById: request.requesterId,
        requiresApproval: false,
        approvalStatus: "approved",
      };
      const current = circleTasks[selectedCircle.id] || [];
      setCircleTasks({ ...circleTasks, [selectedCircle.id]: [...current, newTask] });
    }
    
    setTaskRequests(taskRequests.map(r => 
      r.id === requestId ? { ...r, status: "approved", reviewedById: "you", reviewedAt: new Date().toISOString() } : r
    ));
    toast({ title: "Request approved" });
  };

  const handleRejectRequest = (requestId: string) => {
    setTaskRequests(taskRequests.map(r => 
      r.id === requestId ? { ...r, status: "rejected", reviewedById: "you", reviewedAt: new Date().toISOString() } : r
    ));
    toast({ title: "Request rejected" });
  };

  const handleChangeMemberRole = async (memberId: string, memberUserId: string, newRole: "admin" | "member") => {
    if (!selectedCircle) return;
    const currentUserId = isDemo ? "you" : user?.id;
    
    // Can't change your own role or owner's role
    const members = circleMembers[selectedCircle.id] || [];
    const targetMember = members.find(m => m.id === memberId);
    if (!targetMember) return;
    if (targetMember.role === "owner") {
      toast({ title: "Cannot change owner role", variant: "destructive" });
      return;
    }
    if (targetMember.userId === currentUserId) {
      toast({ title: "Cannot change your own role", variant: "destructive" });
      return;
    }
    
    if (!isDemo) {
      try {
        const res = await apiRequest("PUT", `/api/circles/${selectedCircle.id}/members/${memberId}/role`, { role: newRole });
        if (!res.ok) {
          const err = await res.json();
          toast({ title: "Failed to update role", description: err.error || "Unknown error", variant: "destructive" });
          return;
        }
      } catch (error) {
        console.error("Error updating member role:", error);
        toast({ title: "Failed to update role", variant: "destructive" });
        return;
      }
    }
    
    // Update local state
    const updatedMembers = members.map(m => 
      m.id === memberId ? { ...m, role: newRole } : m
    );
    setCircleMembers({ ...circleMembers, [selectedCircle.id]: updatedMembers });
    toast({ title: `Role updated to ${newRole}` });
  };

  const handleAddBadge = () => {
    if (!selectedCircle || !newBadgeName.trim()) return;
    const canApproveInstantly = isOwnerOrAdmin(selectedCircle.id);
    
    // Build reward if applicable
    let reward: CircleBadgeReward | undefined;
    if (newBadgeRewardType !== "none") {
      reward = { type: newBadgeRewardType };
      if (newBadgeRewardType === "points" || newBadgeRewardType === "both") {
        reward.points = parseInt(newBadgeRewardPoints) || 50;
      }
      if (newBadgeRewardType === "gift" || newBadgeRewardType === "both") {
        reward.gift = newBadgeRewardGift.trim() || undefined;
      }
    }

    // Use API for non-demo mode
    if (!isDemo) {
      createCircleBadgeMutation.mutate({
        circleId: selectedCircle.id,
        badge: {
          name: newBadgeName.trim(),
          description: newBadgeDescription.trim() || "Complete this challenge",
          icon: "target",
          required: parseInt(newBadgeRequired) || 10,
          reward,
          taskId: newBadgeTaskId && newBadgeTaskId !== "_none" ? newBadgeTaskId : undefined,
        }
      }, {
        onSuccess: () => {
          toast({ title: "Badge created" });
        }
      });
      setShowAddBadge(false);
      setNewBadgeName("");
      setNewBadgeDescription("");
      setNewBadgeRequired("10");
      setNewBadgeRewardType("none");
      setNewBadgeRewardPoints("50");
      setNewBadgeRewardGift("");
      setNewBadgeTaskId("");
      return;
    }

    if (canApproveInstantly) {
      const newBadge: CircleBadge = {
        id: `cb-${Date.now()}`,
        name: newBadgeName.trim(),
        description: newBadgeDescription.trim() || "Complete this challenge",
        icon: "target",
        progress: 0,
        required: parseInt(newBadgeRequired) || 10,
        earned: false,
        reward,
        taskId: newBadgeTaskId && newBadgeTaskId !== "_none" ? newBadgeTaskId : undefined,
      };
      const current = circleBadges[selectedCircle.id] || [];
      setCircleBadges({ ...circleBadges, [selectedCircle.id]: [...current, newBadge] });
      toast({ title: "Badge created" });
    } else {
      const request = {
        id: `br-${Date.now()}`,
        circleId: selectedCircle.id,
        requesterId: "you",
        requesterName: "You",
        type: "badge" as const,
        data: { name: newBadgeName.trim(), description: newBadgeDescription.trim(), required: parseInt(newBadgeRequired) || 10, reward, taskId: newBadgeTaskId || undefined },
        status: "pending",
        createdAt: new Date().toISOString(),
      };
      setBadgeRequests([...badgeRequests, request]);
      toast({ title: "Badge request submitted", description: "Waiting for owner/admin approval" });
    }
    
    setShowAddBadge(false);
    setNewBadgeName("");
    setNewBadgeDescription("");
    setNewBadgeRequired("10");
    setNewBadgeRewardType("none");
    setNewBadgeRewardPoints("50");
    setNewBadgeRewardGift("");
    setNewBadgeTaskId("");
  };

  const handleAddAward = () => {
    if (!selectedCircle || !newAwardName.trim()) return;
    const canApproveInstantly = isOwnerOrAdmin(selectedCircle.id);
    
    // Build reward if applicable
    let awardReward: CircleBadgeReward | undefined;
    if (newAwardRewardType !== "none") {
      awardReward = { type: newAwardRewardType };
      if (newAwardRewardType === "points" || newAwardRewardType === "both") {
        awardReward.points = parseInt(newAwardRewardPoints) || 50;
      }
      if (newAwardRewardType === "gift" || newAwardRewardType === "both") {
        awardReward.gift = newAwardRewardGift.trim() || undefined;
      }
    }

    // Use API for non-demo mode
    if (!isDemo) {
      createCircleAwardMutation.mutate({
        circleId: selectedCircle.id,
        award: {
          name: newAwardName.trim(),
          description: newAwardDescription.trim() || "Win this challenge",
          type: newAwardType,
          target: newAwardType === "first_to" ? parseInt(newAwardTarget) || 100 : undefined,
          category: newAwardType === "most_in_category" ? newAwardCategory || "General" : undefined,
          reward: awardReward,
          taskId: newAwardTaskId && newAwardTaskId !== "_none" ? newAwardTaskId : undefined,
        }
      }, {
        onSuccess: () => {
          toast({ title: "Award created" });
        }
      });
      setShowAddAward(false);
      setNewAwardName("");
      setNewAwardDescription("");
      setNewAwardType("first_to");
      setNewAwardTarget("100");
      setNewAwardCategory("");
      setNewAwardRewardType("none");
      setNewAwardRewardPoints("50");
      setNewAwardRewardGift("");
      setNewAwardTaskId("");
      return;
    }

    if (canApproveInstantly) {
      const newAward: CircleAward = {
        id: `ca-${Date.now()}`,
        name: newAwardName.trim(),
        description: newAwardDescription.trim() || "Win this challenge",
        type: newAwardType,
        target: newAwardType === "first_to" ? parseInt(newAwardTarget) || 100 : undefined,
        category: newAwardType === "most_in_category" ? newAwardCategory || "General" : undefined,
        reward: awardReward,
        taskId: newAwardTaskId && newAwardTaskId !== "_none" ? newAwardTaskId : undefined,
      };
      const current = circleAwards[selectedCircle.id] || [];
      setCircleAwards({ ...circleAwards, [selectedCircle.id]: [...current, newAward] });
      toast({ title: "Award created" });
    } else {
      const request = {
        id: `ar-${Date.now()}`,
        circleId: selectedCircle.id,
        requesterId: "you",
        requesterName: "You",
        type: "award" as const,
        data: { name: newAwardName.trim(), description: newAwardDescription.trim(), awardType: newAwardType, target: parseInt(newAwardTarget), category: newAwardCategory, reward: awardReward, taskId: newAwardTaskId || undefined },
        status: "pending",
        createdAt: new Date().toISOString(),
      };
      setBadgeRequests([...badgeRequests, request]);
      toast({ title: "Award request submitted", description: "Waiting for owner/admin approval" });
    }
    
    setShowAddAward(false);
    setNewAwardName("");
    setNewAwardDescription("");
    setNewAwardType("first_to");
    setNewAwardTarget("100");
    setNewAwardCategory("");
    setNewAwardRewardType("none");
    setNewAwardRewardPoints("50");
    setNewAwardRewardGift("");
    setNewAwardTaskId("");
  };

  const handleApproveBadgeRequest = (requestId: string) => {
    const request = badgeRequests.find(r => r.id === requestId);
    if (!request || !selectedCircle) return;
    
    if (request.type === "badge") {
      const newBadge: CircleBadge = {
        id: `cb-${Date.now()}`,
        name: request.data.name || "New Badge",
        description: request.data.description || "Complete this challenge",
        icon: "target",
        progress: 0,
        required: request.data.required || 10,
        earned: false,
        reward: request.data.reward,
      };
      const current = circleBadges[selectedCircle.id] || [];
      setCircleBadges({ ...circleBadges, [selectedCircle.id]: [...current, newBadge] });
    } else if (request.type === "award") {
      const newAward: CircleAward = {
        id: `ca-${Date.now()}`,
        name: request.data.name || "New Award",
        description: request.data.description || "Win this challenge",
        type: request.data.awardType || "first_to",
        target: request.data.target,
        category: request.data.category,
        reward: request.data.reward,
      };
      const current = circleAwards[selectedCircle.id] || [];
      setCircleAwards({ ...circleAwards, [selectedCircle.id]: [...current, newAward] });
    }
    
    setBadgeRequests(badgeRequests.filter(r => r.id !== requestId));
    toast({ title: "Request approved" });
  };

  const handleRejectBadgeRequest = (requestId: string) => {
    setBadgeRequests(badgeRequests.filter(r => r.id !== requestId));
    toast({ title: "Request rejected" });
  };

  const startEditTask = (task: StoredCircleTask) => {
    setEditingTask(task);
    setEditTaskName(task.name);
    setEditTaskValue(task.value.toString());
    setEditTaskType(task.taskType);
  };

  const handleEditTask = () => {
    if (!selectedCircle || !editingTask || !editTaskName.trim()) return;
    
    // Use API for non-demo mode
    if (!isDemo) {
      updateCircleTaskMutation.mutate({
        circleId: selectedCircle.id,
        taskId: editingTask.id,
        updates: {
          name: editTaskName.trim(),
          value: parseInt(editTaskValue) || 10,
          taskType: editTaskType,
        }
      }, {
        onSuccess: () => {
          toast({ title: "Task updated" });
        }
      });
      setEditingTask(null);
      return;
    }
    
    const updatedTasks = (circleTasks[selectedCircle.id] || []).map(t =>
      t.id === editingTask.id
        ? { ...t, name: editTaskName.trim(), value: parseInt(editTaskValue) || 10, taskType: editTaskType }
        : t
    );
    setCircleTasks({ ...circleTasks, [selectedCircle.id]: updatedTasks });
    setEditingTask(null);
    toast({ title: "Task updated" });
  };

  const handleDeleteTask = (taskId: string) => {
    if (!selectedCircle) return;
    
    // Use API for non-demo mode
    if (!isDemo) {
      deleteCircleTaskMutation.mutate({
        circleId: selectedCircle.id,
        taskId: taskId,
      }, {
        onSuccess: () => {
          toast({ title: "Task deleted" });
        }
      });
      return;
    }
    
    const updatedTasks = (circleTasks[selectedCircle.id] || []).filter(t => t.id !== taskId);
    setCircleTasks({ ...circleTasks, [selectedCircle.id]: updatedTasks });
    toast({ title: "Task deleted" });
  };

  const startEditBadge = (badge: CircleBadge) => {
    setEditingBadge(badge);
    setEditBadgeName(badge.name);
    setEditBadgeDescription(badge.description);
    setEditBadgeRequired(badge.required.toString());
    setEditBadgeTaskId(badge.taskId || "");
    if (badge.reward) {
      setEditBadgeRewardType(badge.reward.type);
      setEditBadgeRewardPoints(badge.reward.points?.toString() || "50");
      setEditBadgeRewardGift(badge.reward.gift || "");
    } else {
      setEditBadgeRewardType("none");
      setEditBadgeRewardPoints("50");
      setEditBadgeRewardGift("");
    }
  };

  const handleEditBadge = () => {
    if (!selectedCircle || !editingBadge || !editBadgeName.trim()) return;
    let reward: CircleBadgeReward | undefined;
    if (editBadgeRewardType !== "none") {
      reward = { type: editBadgeRewardType };
      if (editBadgeRewardType === "points" || editBadgeRewardType === "both") {
        reward.points = parseInt(editBadgeRewardPoints) || 50;
      }
      if (editBadgeRewardType === "gift" || editBadgeRewardType === "both") {
        reward.gift = editBadgeRewardGift.trim() || undefined;
      }
    }
    
    // Use API for non-demo mode
    if (!isDemo) {
      updateCircleBadgeMutation.mutate({
        circleId: selectedCircle.id,
        badgeId: editingBadge.id,
        updates: {
          name: editBadgeName.trim(),
          description: editBadgeDescription.trim(),
          required: parseInt(editBadgeRequired) || 10,
          reward,
          taskId: editBadgeTaskId && editBadgeTaskId !== "_none" ? editBadgeTaskId : undefined,
        }
      }, {
        onSuccess: () => {
          toast({ title: "Badge updated" });
        }
      });
      setEditingBadge(null);
      return;
    }
    
    const updatedBadges = (circleBadges[selectedCircle.id] || []).map(b =>
      b.id === editingBadge.id
        ? { ...b, name: editBadgeName.trim(), description: editBadgeDescription.trim(), required: parseInt(editBadgeRequired) || 10, reward, taskId: editBadgeTaskId && editBadgeTaskId !== "_none" ? editBadgeTaskId : undefined }
        : b
    );
    setCircleBadges({ ...circleBadges, [selectedCircle.id]: updatedBadges });
    setEditingBadge(null);
    toast({ title: "Badge updated" });
  };

  const handleDeleteBadge = (badgeId: string) => {
    if (!selectedCircle) return;
    
    // Use API for non-demo mode
    if (!isDemo) {
      deleteCircleBadgeMutation.mutate({
        circleId: selectedCircle.id,
        badgeId: badgeId,
      }, {
        onSuccess: () => {
          toast({ title: "Badge deleted" });
        }
      });
      return;
    }
    
    const updatedBadges = (circleBadges[selectedCircle.id] || []).filter(b => b.id !== badgeId);
    setCircleBadges({ ...circleBadges, [selectedCircle.id]: updatedBadges });
    toast({ title: "Badge deleted" });
  };

  const startEditAward = (award: CircleAward) => {
    setEditingAward(award);
    setEditAwardName(award.name);
    setEditAwardDescription(award.description);
    setEditAwardType(award.type);
    setEditAwardTarget(award.target?.toString() || "100");
    setEditAwardCategory(award.category || "");
    setEditAwardTaskId(award.taskId || "");
    if (award.reward) {
      setEditAwardRewardType(award.reward.type);
      setEditAwardRewardPoints(award.reward.points?.toString() || "50");
      setEditAwardRewardGift(award.reward.gift || "");
    } else {
      setEditAwardRewardType("none");
      setEditAwardRewardPoints("50");
      setEditAwardRewardGift("");
    }
  };

  const handleEditAward = () => {
    if (!selectedCircle || !editingAward || !editAwardName.trim()) return;
    let reward: CircleBadgeReward | undefined;
    if (editAwardRewardType !== "none") {
      reward = { type: editAwardRewardType };
      if (editAwardRewardType === "points" || editAwardRewardType === "both") {
        reward.points = parseInt(editAwardRewardPoints) || 50;
      }
      if (editAwardRewardType === "gift" || editAwardRewardType === "both") {
        reward.gift = editAwardRewardGift.trim() || undefined;
      }
    }
    
    // Use API for non-demo mode
    if (!isDemo) {
      updateCircleAwardMutation.mutate({
        circleId: selectedCircle.id,
        awardId: editingAward.id,
        updates: {
          name: editAwardName.trim(),
          description: editAwardDescription.trim(),
          type: editAwardType,
          target: editAwardType === "first_to" ? parseInt(editAwardTarget) || 100 : undefined,
          category: editAwardType === "most_in_category" ? editAwardCategory : undefined,
          reward,
          taskId: editAwardTaskId && editAwardTaskId !== "_none" ? editAwardTaskId : undefined,
        }
      }, {
        onSuccess: () => {
          toast({ title: "Award updated" });
        }
      });
      setEditingAward(null);
      return;
    }
    
    const updatedAwards = (circleAwards[selectedCircle.id] || []).map(a =>
      a.id === editingAward.id
        ? { ...a, name: editAwardName.trim(), description: editAwardDescription.trim(), type: editAwardType, target: editAwardType === "first_to" ? parseInt(editAwardTarget) || 100 : undefined, category: editAwardType === "most_in_category" ? editAwardCategory : undefined, reward, taskId: editAwardTaskId && editAwardTaskId !== "_none" ? editAwardTaskId : undefined }
        : a
    );
    setCircleAwards({ ...circleAwards, [selectedCircle.id]: updatedAwards });
    setEditingAward(null);
    toast({ title: "Award updated" });
  };

  const handleDeleteAward = (awardId: string) => {
    if (!selectedCircle) return;
    
    // Use API for non-demo mode
    if (!isDemo) {
      deleteCircleAwardMutation.mutate({
        circleId: selectedCircle.id,
        awardId: awardId,
      }, {
        onSuccess: () => {
          toast({ title: "Award deleted" });
        }
      });
      return;
    }
    
    const updatedAwards = (circleAwards[selectedCircle.id] || []).filter(a => a.id !== awardId);
    setCircleAwards({ ...circleAwards, [selectedCircle.id]: updatedAwards });
    toast({ title: "Award deleted" });
  };

  const pendingBadgeRequestsForCircle = useMemo(() => {
    if (!selectedCircle) return [];
    return badgeRequests.filter(r => r.circleId === selectedCircle.id && r.status === "pending");
  }, [selectedCircle, badgeRequests]);

  const handleToggleTaskComplete = (circleId: string, taskId: string, task: StoredCircleTask) => {
    const today = new Date().toISOString().split('T')[0];
    if (selectedTaskDate !== today) {
      return;
    }
    
    const myCompleted = myCompletedTasks[circleId] || [];
    const isCompleted = myCompleted.includes(taskId);
    const currentUserId = isDemo ? "you" : user?.id;
    const currentUserName = isDemo ? "You" : (user?.displayName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || "You");
    
    // Use API for non-demo mode
    if (!isDemo) {
      // For circle tasks, only one person can complete per day - check locally first
      if (task.taskType === "circle_task" && !isCompleted) {
        const completions = circleTaskCompletions[circleId]?.[taskId] || [];
        if (completions.length > 0) {
          toast({ title: "Already completed", description: "This circle task was already done today" });
          return;
        }
      }
      
      toggleCircleTaskCompleteMutation.mutate({
        circleId: circleId,
        taskId: taskId,
      }, {
        onSuccess: () => {
          if (!isCompleted) {
            toast({ title: "Task completed!", description: `+${task.value} points` });
          }
        }
      });
      return;
    }
    
    // For circle tasks, only one person can complete per day
    if (task.taskType === "circle_task" && !isCompleted) {
      const completions = circleTaskCompletions[circleId]?.[taskId] || [];
      if (completions.length > 0) {
        toast({ title: "Already completed", description: "This circle task was already done today" });
        return;
      }
    }
    
    // Update the member's weeklyPoints in the leaderboard
    const updateMemberPoints = (delta: number) => {
      const members = circleMembers[circleId] || [];
      const updatedMembers = members.map(member => 
        member.userId === currentUserId 
          ? { ...member, weeklyPoints: member.weeklyPoints + delta }
          : member
      );
      setCircleMembers({ ...circleMembers, [circleId]: updatedMembers });
    };
    
    if (isCompleted) {
      // Remove completion
      setMyCompletedTasks({ ...myCompletedTasks, [circleId]: myCompleted.filter(id => id !== taskId) });
      const circleCompletions = circleTaskCompletions[circleId] || {};
      const taskCompletions = (circleCompletions[taskId] || []).filter(c => c.userId !== currentUserId);
      setCircleTaskCompletions({ ...circleTaskCompletions, [circleId]: { ...circleCompletions, [taskId]: taskCompletions } });
      updateMemberPoints(-task.value);
    } else {
      // Add completion
      setMyCompletedTasks({ ...myCompletedTasks, [circleId]: [...myCompleted, taskId] });
      const circleCompletions = circleTaskCompletions[circleId] || {};
      const taskCompletions = circleCompletions[taskId] || [];
      setCircleTaskCompletions({
        ...circleTaskCompletions,
        [circleId]: {
          ...circleCompletions,
          [taskId]: [...taskCompletions, { userId: currentUserId || "you", userName: currentUserName, completedAt: new Date().toISOString() }]
        }
      });
      updateMemberPoints(task.value);
      toast({ title: "Task completed!", description: `+${task.value} points` });
    }
  };

  const getTaskCompletions = (circleId: string, taskId: string) => {
    return circleTaskCompletions[circleId]?.[taskId] || [];
  };

  const isTaskCompletedByMe = (circleId: string, taskId: string) => {
    return (myCompletedTasks[circleId] || []).includes(taskId);
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

  const renderFriendProfile = () => {
    if (!selectedFriend) return null;
    const activity = demoFriendActivities[selectedFriend.friendId];
    const visibility = selectedFriend.visibilityLevel;
    
    return (
      <Dialog open={!!selectedFriend} onOpenChange={() => setSelectedFriend(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-xl">
                  {getInitials(selectedFriend.firstName, selectedFriend.lastName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle data-testid="text-friend-profile-name">
                  {getName(selectedFriend.firstName, selectedFriend.lastName)}
                </DialogTitle>
                <DialogDescription className="flex items-center gap-2 mt-1">
                  <Flame className="w-4 h-4 text-orange-500" />
                  {selectedFriend.dayStreak} day streak
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {visibility !== "hidden" && (
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 rounded-md bg-muted">
                  <p className="text-2xl font-bold">{selectedFriend.weeklyPoints}</p>
                  <p className="text-sm text-muted-foreground">Weekly pts</p>
                </div>
                <div className="text-center p-3 rounded-md bg-muted">
                  <p className="text-2xl font-bold">{selectedFriend.weekStreak}</p>
                  <p className="text-sm text-muted-foreground">Week streak</p>
                </div>
                <div className="text-center p-3 rounded-md bg-muted">
                  <p className="text-2xl font-bold">{selectedFriend.totalBadgesEarned}</p>
                  <p className="text-sm text-muted-foreground">Badges</p>
                </div>
              </div>
            )}
            
            {visibility === "full" && (
              <>
                {/* Full Task List */}
                {demoFriendFullTasks[selectedFriend.friendId] && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Today's Tasks
                    </h4>
                    <div className="space-y-2">
                      {demoFriendFullTasks[selectedFriend.friendId].map((task) => (
                        <div 
                          key={task.id} 
                          className={`flex items-center justify-between text-sm p-2 rounded ${task.completed ? "bg-green-500/10" : "bg-muted"}`}
                          data-testid={`friend-task-${task.id}`}
                        >
                          <div className="flex items-center gap-2">
                            {task.completed ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <Clock className="w-4 h-4 text-muted-foreground" />
                            )}
                            <span className={task.completed ? "text-muted-foreground" : ""}>{task.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">{task.category}</Badge>
                            <span className="text-muted-foreground">{task.value} pts</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Weekly Breakdown Chart */}
                {activity && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4" />
                      This Week
                    </h4>
                    <div className="flex items-end gap-1" style={{ height: '80px' }}>
                      {(() => {
                        const maxPoints = Math.max(...activity.weeklyBreakdown.map(d => d.points));
                        return activity.weeklyBreakdown.map((day, i) => {
                          const heightPx = maxPoints > 0 ? Math.max(4, (day.points / maxPoints) * 60) : 4;
                          return (
                            <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1 h-full">
                              <span className="text-xs font-medium">{day.points}</span>
                              <div 
                                className="w-full bg-primary rounded-t-sm"
                                style={{ height: `${heightPx}px` }}
                              />
                              <span className="text-xs text-muted-foreground">{day.date}</span>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                )}
                
                {/* All Badges */}
                {demoFriendBadges[selectedFriend.friendId] && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Award className="w-4 h-4" />
                      Badges ({demoFriendBadges[selectedFriend.friendId].filter(b => b.earned).length}/{demoFriendBadges[selectedFriend.friendId].length})
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {demoFriendBadges[selectedFriend.friendId].map((badge) => (
                        <div 
                          key={badge.id} 
                          className={`flex items-center gap-2 p-2 rounded ${badge.earned ? "bg-yellow-500/10" : "bg-muted opacity-50"}`}
                          data-testid={`friend-badge-${badge.id}`}
                        >
                          {badge.earned ? (
                            <Trophy className="w-4 h-4 text-yellow-500" />
                          ) : (
                            <Trophy className="w-4 h-4 text-muted-foreground" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{badge.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{badge.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
            
            {visibility === "tasks_only" && activity && (
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Recent Tasks
                </h4>
                <div className="space-y-2">
                  {activity.recentTasks.map((task, i) => (
                    <div key={i} className="flex items-center justify-between text-sm p-2 rounded bg-muted">
                      <span>{task.taskName}</span>
                      <span className="text-muted-foreground">{formatTime(task.completedAt)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {visibility === "hidden" && (
              <div className="text-center py-8 text-muted-foreground">
                <EyeOff className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>This friend's activity is hidden</p>
              </div>
            )}
            
            {visibility === "points_only" && (
              <div className="text-center py-4 text-muted-foreground">
                <p className="text-sm">Only points data is visible for this friend</p>
              </div>
            )}
          </div>
          
          <DialogFooter className="mt-4 flex-wrap gap-2">
            <Button variant="outline" onClick={() => setSelectedFriend(null)}>
              Close
            </Button>
            <Button variant="secondary" onClick={() => { setCheerlineFriend(selectedFriend); setSelectedFriend(null); }} data-testid="button-send-cheerline">
              <Heart className="w-4 h-4 mr-2" />
              Send Cheerline
            </Button>
            <Button onClick={() => { setDmFriend(selectedFriend); setSelectedFriend(null); }} data-testid="button-dm-from-profile">
              <MessageCircle className="w-4 h-4 mr-2" />
              Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  const renderCheerlineDialog = () => {
    if (!cheerlineFriend) return null;
    
    const handleSendCheerline = () => {
      if (!cheerlineMessage.trim()) {
        toast({ title: "Message required", description: "Please enter a cheerline message", variant: "destructive" });
        return;
      }
      
      if (isDemo) {
        toast({ 
          title: "Cheerline sent!", 
          description: `Your encouraging message was sent to ${cheerlineFriend.firstName}. It will appear on their dashboard for 3 days.` 
        });
      } else {
        sendCheerlineMutation.mutate({ userId: cheerlineFriend.friendId, message: cheerlineMessage.trim() });
      }
      setCheerlineMessage("");
      setCheerlineFriend(null);
    };
    
    return (
      <Dialog open={!!cheerlineFriend} onOpenChange={() => { setCheerlineFriend(null); setCheerlineMessage(""); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-500" />
              Send Cheerline to {cheerlineFriend.firstName}
            </DialogTitle>
            <DialogDescription>
              Send an encouraging message that will appear on their dashboard for 3 days.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Textarea
              placeholder="You're doing amazing! Keep up the great work..."
              value={cheerlineMessage}
              onChange={(e) => setCheerlineMessage(e.target.value)}
              className="min-h-[100px]"
              data-testid="input-cheerline-message"
            />
            <p className="text-sm text-muted-foreground">
              Cheerlines are short, encouraging messages to motivate your friends. They expire after 3 days.
            </p>
          </div>
          
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setCheerlineFriend(null); setCheerlineMessage(""); }}>
              Cancel
            </Button>
            <Button onClick={handleSendCheerline} data-testid="button-confirm-cheerline">
              <Send className="w-4 h-4 mr-2" />
              Send Cheerline
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  const renderDMDialog = () => {
    if (!dmFriend) return null;
    const messages = directMessages[dmFriend.friendId] || [];
    
    return (
      <Dialog open={!!dmFriend} onOpenChange={() => setDmFriend(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  {getInitials(dmFriend.firstName, dmFriend.lastName)}
                </AvatarFallback>
              </Avatar>
              {getName(dmFriend.firstName, dmFriend.lastName)}
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="h-64 pr-4">
            <div className="space-y-3">
              {messages.map((msg) => {
                const isOwnMessage = isDemo ? msg.senderId === "you" : msg.senderId === user?.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        isOwnMessage
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      {msg.imageUrl && (
                        <img 
                          src={msg.imageUrl} 
                          alt="Shared image" 
                          className="max-w-full rounded-md mb-2"
                          style={{ maxHeight: "150px" }}
                        />
                      )}
                      <p className="text-sm">{msg.content}</p>
                      <p className={`text-xs mt-1 ${isOwnMessage ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                        {formatTime(msg.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
          
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={(el) => { dmFileRefs.current[dmFriend.friendId] = el; }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleDmImageUpload(dmFriend.friendId, file);
            }}
            data-testid="input-dm-dialog-image"
          />
          
          {dmImagePreviews[dmFriend.friendId] && (
            <div className="relative inline-block mb-2">
              <img 
                src={dmImagePreviews[dmFriend.friendId]!} 
                alt="Preview" 
                className="max-h-20 rounded-md"
              />
              <Button
                size="icon"
                variant="destructive"
                className="absolute -top-2 -right-2 h-5 w-5"
                onClick={() => clearDmImage(dmFriend.friendId)}
                data-testid="button-clear-dm-dialog-image"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
          
          <div className="flex gap-2 mt-4">
            <Button 
              size="icon" 
              variant="ghost"
              onClick={() => dmFileRefs.current[dmFriend.friendId]?.click()}
              disabled={dmUploading[dmFriend.friendId]}
              data-testid="button-attach-dm-dialog-image"
            >
              {dmUploading[dmFriend.friendId] ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ImagePlus className="w-4 h-4" />
              )}
            </Button>
            <Input
              placeholder="Type a message..."
              value={dmMessage}
              onChange={(e) => setDmMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendDM()}
              data-testid="input-dm-message"
            />
            <Button size="icon" onClick={handleSendDM} data-testid="button-send-dm">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
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

      <Tabs value={communityTab} onValueChange={(v) => {
        setCommunityTab(v as "friends" | "circles" | "feed");
        // Refetch friend requests when switching to friends tab
        if (v === "friends" && !isDemo) {
          friendRequestsQuery.refetch();
          friendsQuery.refetch();
        }
      }} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
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
          <TabsTrigger value="feed" data-testid="tab-feed">
            <Globe className="w-4 h-4 mr-2" />
            Feed
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
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5" />
                    Leaderboard
                  </CardTitle>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant={friendsLeaderboardViewMode === "day" ? "default" : "ghost"}
                      onClick={() => setFriendsLeaderboardViewMode("day")}
                      data-testid="button-leaderboard-day"
                    >
                      Today
                    </Button>
                    <Button
                      size="sm"
                      variant={friendsLeaderboardViewMode === "week" ? "default" : "ghost"}
                      onClick={() => setFriendsLeaderboardViewMode("week")}
                      data-testid="button-leaderboard-week"
                    >
                      Week
                    </Button>
                    <Button
                      size="sm"
                      variant={friendsLeaderboardViewMode === "alltime" ? "default" : "ghost"}
                      onClick={() => setFriendsLeaderboardViewMode("alltime")}
                      data-testid="button-leaderboard-alltime"
                    >
                      All Time
                    </Button>
                  </div>
                </div>
                <CardDescription>
                  {friendsLeaderboardViewMode === "day" ? "Today's" : friendsLeaderboardViewMode === "week" ? "This week's" : "All-time"} top performers
                </CardDescription>
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
                      <Badge variant="outline">
                        {friendsLeaderboardViewMode === "day" 
                          ? friend.todayPoints 
                          : friendsLeaderboardViewMode === "week" 
                            ? friend.weeklyPoints 
                            : friend.totalPoints} pts
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Messages
              </CardTitle>
              <CardDescription>Recent conversations with friends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(directMessages).filter(([_, msgs]) => msgs.length > 0).map(([friendId, msgs]) => {
                  const friend = friends.find(f => f.friendId === friendId);
                  const lastMsg = msgs[msgs.length - 1];
                  const isExpanded = expandedDMFriend === friendId;
                  return (
                    <div key={friendId} className="border rounded-md p-3" data-testid={`dm-card-${friendId}`}>
                      <div 
                        className="flex items-center justify-between gap-2 cursor-pointer"
                        onClick={() => {
                          if (!isExpanded) {
                            fetchDirectMessages(friendId);
                          }
                          setExpandedDMFriend(isExpanded ? null : friendId);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-sm">
                              {friend ? getInitials(friend.firstName, friend.lastName) : "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{friend ? getName(friend.firstName, friend.lastName) : "Unknown"}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[180px]">{lastMsg.content}</p>
                          </div>
                        </div>
                        <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                      </div>
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t space-y-2">
                          <ScrollArea className="h-[150px]">
                            {msgs.map((msg) => {
                              const isOwnMessage = isDemo ? msg.senderId === "you" : msg.senderId === user?.id;
                              return (
                              <div key={msg.id} className={`flex mb-2 ${isOwnMessage ? "justify-end" : "justify-start"}`}>
                                <div className={`max-w-[80%] p-2 rounded-md text-sm ${isOwnMessage ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                                  {msg.imageUrl && (
                                    <img 
                                      src={msg.imageUrl} 
                                      alt="Shared image" 
                                      className="max-w-full rounded-md mb-1"
                                      style={{ maxHeight: "150px" }}
                                    />
                                  )}
                                  {msg.content}
                                </div>
                              </div>
                              );
                            })}
                          </ScrollArea>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            ref={(el) => { dmFileRefs.current[friendId] = el; }}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleDmImageUpload(friendId, file);
                            }}
                            data-testid={`input-dm-image-${friendId}`}
                          />
                          {dmImagePreviews[friendId] && (
                            <div className="relative inline-block mb-2">
                              <img 
                                src={dmImagePreviews[friendId]!} 
                                alt="Preview" 
                                className="max-h-20 rounded-md"
                              />
                              <Button
                                size="icon"
                                variant="destructive"
                                className="absolute -top-2 -right-2 h-5 w-5"
                                onClick={() => clearDmImage(friendId)}
                                data-testid={`button-clear-dm-image-${friendId}`}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                          <div className="flex gap-2 mt-2">
                            <Button 
                              size="icon" 
                              variant="ghost"
                              onClick={() => dmFileRefs.current[friendId]?.click()}
                              disabled={dmUploading[friendId]}
                              data-testid={`button-attach-dm-image-${friendId}`}
                            >
                              {dmUploading[friendId] ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <ImagePlus className="w-4 h-4" />
                              )}
                            </Button>
                            <Input
                              placeholder="Type a message..."
                              value={dmMessages[friendId] || ""}
                              onChange={(e) => setDmMessages({ ...dmMessages, [friendId]: e.target.value })}
                              onKeyDown={(e) => e.key === "Enter" && handleSendDirectMessage(friendId, friend?.firstName || "Friend")}
                              data-testid={`input-dm-${friendId}`}
                            />
                            <Button size="icon" onClick={() => handleSendDirectMessage(friendId, friend?.firstName || "Friend")} data-testid={`button-send-dm-${friendId}`}>
                              <Send className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {Object.entries(directMessages).filter(([_, msgs]) => msgs.length > 0).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No conversations yet</p>
                )}
              </div>
            </CardContent>
          </Card>

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
                    Click on a friend to view their profile and stats
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
                      className="flex items-center justify-between gap-4 p-3 rounded-md border hover-elevate cursor-pointer"
                      onClick={() => setSelectedFriend(friend)}
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
                              <Flame className="w-3 h-3" /> {friend.dayStreak} days
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => { e.stopPropagation(); setDmFriend(friend); }}
                          data-testid={`button-dm-${friend.friendId}`}
                        >
                          <MessageCircle className="w-4 h-4" />
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={(e) => { e.stopPropagation(); setEditingFriend(friend); }}
                              data-testid={`button-settings-${friend.friendId}`}
                            >
                              <Settings className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Visibility Settings</DialogTitle>
                              <DialogDescription>
                                Control what {friend.firstName} can see about your activity
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label>Visibility Level</Label>
                                <Select
                                  value={friend.visibilityLevel}
                                  onValueChange={(v) => handleUpdateVisibility(friend.id, v as VisibilityLevel)}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="full">Full Access - See all activity</SelectItem>
                                    <SelectItem value="tasks_only">Tasks Only - See tasks but not badges</SelectItem>
                                    <SelectItem value="points_only">Points Only - Only weekly points</SelectItem>
                                    <SelectItem value="hidden">Hidden - No visibility</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="destructive" onClick={() => handleRemoveFriend(friend.id)}>
                                Remove Friend
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
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
                <h2 className="text-lg font-semibold">Your Circles</h2>
                <Dialog open={showCreateCircle} onOpenChange={setShowCreateCircle}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-create-circle">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Circle
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Circle</DialogTitle>
                      <DialogDescription>
                        Start a group to share goals and track progress together
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="circle-name">Circle Name</Label>
                        <Input
                          id="circle-name"
                          placeholder="e.g., Fitness Buddies"
                          value={newCircleName}
                          onChange={(e) => setNewCircleName(e.target.value)}
                          data-testid="input-circle-name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="circle-description">Description</Label>
                        <Textarea
                          id="circle-description"
                          placeholder="What is this circle about?"
                          value={newCircleDescription}
                          onChange={(e) => setNewCircleDescription(e.target.value)}
                          data-testid="input-circle-description"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowCreateCircle(false)} data-testid="button-create-circle-cancel">
                        Cancel
                      </Button>
                      <Button onClick={handleCreateCircle} data-testid="button-create-circle-submit">
                        Create Circle
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {circles.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <CircleDot className="w-12 h-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground text-center">
                      No circles yet. Create one to start collaborating!
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {circles.map((circle) => (
                    <Card
                      key={circle.id}
                      className="hover-elevate cursor-pointer"
                      onClick={() => { setSelectedCircle(circle); setCircleDetailTab("tasks"); }}
                      data-testid={`card-circle-${circle.id}`}
                    >
                      <CardHeader>
                        <div className="flex items-start gap-3">
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: circle.iconColor }}
                          >
                            <CircleDot className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-lg">{circle.name}</CardTitle>
                              {circle.createdBy === "you" && (
                                <Crown className="w-4 h-4 text-yellow-500" />
                              )}
                            </div>
                            <CardDescription className="line-clamp-2">
                              {circle.description}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Users className="w-4 h-4" />
                            {circle.memberCount} members
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Circle vs Circle Competition Rankings */}
              {circles.length >= 2 && (
                <Card className="mt-6">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-yellow-500" />
                      <CardTitle>Circle Competition</CardTitle>
                    </div>
                    <CardDescription>
                      See how your circles rank against each other by total weekly points
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {(() => {
                        const circleRankings = circles.map(circle => {
                          const members = circleMembers[circle.id] || [];
                          const memberPoints = members.reduce((sum, m) => sum + (m.weeklyPoints || 0), 0);
                          
                          const awards = circleAwards[circle.id] || [];
                          const awardBonusPoints = awards.reduce((sum, award) => {
                            if (award.winner && award.reward && (award.reward.type === "points" || award.reward.type === "both") && award.reward.points) {
                              return sum + award.reward.points;
                            }
                            return sum;
                          }, 0);
                          
                          const totalPoints = memberPoints + awardBonusPoints;
                          const memberCount = members.length;
                          const avgPoints = memberCount > 0 ? Math.round(memberPoints / memberCount) : 0;
                          return {
                            ...circle,
                            totalPoints,
                            memberPoints,
                            awardBonusPoints,
                            memberCount: members.length || circle.memberCount,
                            avgPoints,
                          };
                        }).sort((a, b) => b.totalPoints - a.totalPoints);

                        return circleRankings.map((circle, index) => {
                          const rank = index + 1;
                          const getMedalColor = (r: number) => {
                            if (r === 1) return "text-yellow-500";
                            if (r === 2) return "text-gray-400";
                            if (r === 3) return "text-amber-600";
                            return "text-muted-foreground";
                          };

                          return (
                            <div
                              key={circle.id}
                              className="flex items-center gap-3 p-3 rounded-md bg-muted/50 hover-elevate cursor-pointer"
                              onClick={() => { setSelectedCircle(circle); setCircleDetailTab("leaderboard"); }}
                              data-testid={`ranking-circle-${circle.id}`}
                            >
                              <div className="flex items-center justify-center w-8">
                                {rank <= 3 ? (
                                  <Trophy className={`w-5 h-5 ${getMedalColor(rank)}`} />
                                ) : (
                                  <span className="text-sm font-medium text-muted-foreground">#{rank}</span>
                                )}
                              </div>
                              <div
                                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: circle.iconColor }}
                              >
                                <CircleDot className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium truncate">{circle.name}</span>
                                  {circle.createdBy === "you" && (
                                    <Crown className="w-3 h-3 text-yellow-500 flex-shrink-0" />
                                  )}
                                </div>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    {circle.memberCount}
                                  </span>
                                  <span>Avg: {circle.avgPoints} pts/member</span>
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <div className="text-lg font-bold text-primary" data-testid={`text-competition-points-${circle.id}`}>
                                  {circle.totalPoints}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {circle.awardBonusPoints > 0 ? (
                                    <span><span className="text-green-500">+{circle.awardBonusPoints}</span> bonus</span>
                                  ) : (
                                    "total pts"
                                  )}
                                </div>
                              </div>
                              <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => setSelectedCircle(null)} data-testid="button-back-to-circles">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: selectedCircle.iconColor }}
                >
                  <CircleDot className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold flex items-center gap-2" data-testid="text-circle-name">
                    {selectedCircle.name}
                    {selectedCircle.createdBy === "you" && <Crown className="w-5 h-5 text-yellow-500" />}
                  </h2>
                  <p className="text-muted-foreground">{selectedCircle.description}</p>
                </div>
                {isOwnerOrAdmin(selectedCircle.id) && pendingRequestsForCircle.length > 0 && (
                  <Badge variant="destructive">
                    {pendingRequestsForCircle.length} pending
                  </Badge>
                )}
                {isOwnerOrAdmin(selectedCircle.id) && (
                  <Button variant="ghost" size="icon" onClick={openCircleSettings} data-testid="button-circle-settings">
                    <Settings className="w-5 h-5" />
                  </Button>
                )}
              </div>

              {/* Circle Points Summary */}
              {(() => {
                const currentUserId = isDemo ? "you" : user?.id;
                const members = circleMembers[selectedCircle.id] || [];
                const memberPoints = members.reduce((sum, m) => sum + (m.weeklyPoints || 0), 0);
                
                const awards = circleAwards[selectedCircle.id] || [];
                const awardBonusPoints = awards.reduce((sum, award) => {
                  if (award.winner && award.reward && (award.reward.type === "points" || award.reward.type === "both") && award.reward.points) {
                    return sum + award.reward.points;
                  }
                  return sum;
                }, 0);
                
                const totalCirclePoints = memberPoints + awardBonusPoints;
                const memberCount = members.length;
                const avgPointsPerMember = memberCount > 0 ? Math.round(memberPoints / memberCount) : 0;
                const yourPoints = members.find(m => m.userId === currentUserId)?.weeklyPoints || 0;
                
                return (
                  <Card className="mb-4">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Trophy className="w-5 h-5 text-muted-foreground" />
                        <span className="font-medium">Circle Points Summary</span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-3 rounded-md bg-muted/50">
                          <div className="text-2xl font-bold text-primary" data-testid="text-total-circle-points">{totalCirclePoints}</div>
                          <div className="text-xs text-muted-foreground">Total Circle Points</div>
                          {awardBonusPoints > 0 && (
                            <div className="text-xs text-muted-foreground mt-1">
                              <span className="text-green-500">+{awardBonusPoints}</span> from awards
                            </div>
                          )}
                        </div>
                        <div className="text-center p-3 rounded-md bg-muted/50">
                          <div className="text-2xl font-bold" data-testid="text-member-count">{memberCount}</div>
                          <div className="text-xs text-muted-foreground">Members</div>
                        </div>
                        <div className="text-center p-3 rounded-md bg-muted/50">
                          <div className="text-2xl font-bold" data-testid="text-avg-points">{avgPointsPerMember}</div>
                          <div className="text-xs text-muted-foreground">Avg per Member</div>
                        </div>
                        <div className="text-center p-3 rounded-md bg-muted/50">
                          <div className="text-2xl font-bold" data-testid="text-your-points">{yourPoints}</div>
                          <div className="text-xs text-muted-foreground">Your Points</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })()}

              {/* Goal Progress Display */}
              {(selectedCircle.dailyPointGoal || selectedCircle.weeklyPointGoal) && (() => {
                const currentUserId = isDemo ? "you" : user?.id;
                const yourWeeklyPoints = circleMembers[selectedCircle.id]?.find(m => m.userId === currentUserId)?.weeklyPoints || 0;
                
                // Calculate actual daily points from today's completions
                const yourDailyCompletions = isDemo
                  ? demoMemberDailyCompletions[selectedCircle.id]?.[currentUserId || ""] || []
                  : (circleCompletionsQuery.data || []).filter(c => c.userId === currentUserId);
                
                const yourDailyPoints = yourDailyCompletions.reduce((sum, t) => {
                  const task = (circleTasks[selectedCircle.id] || []).find(ct => ct.id === t.taskId);
                  return sum + (task?.value || 0);
                }, 0);
                
                return (
                  <Card className="mb-4">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Target className="w-5 h-5 text-muted-foreground" />
                        <span className="font-medium">Your Goal Progress</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedCircle.dailyPointGoal && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Daily Goal</span>
                              <span className="font-medium">{yourDailyPoints} / {selectedCircle.dailyPointGoal} pts</span>
                            </div>
                            <Progress 
                              value={Math.min(100, (yourDailyPoints / selectedCircle.dailyPointGoal) * 100)} 
                              className="h-2"
                            />
                          </div>
                        )}
                        {selectedCircle.weeklyPointGoal && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Weekly Goal</span>
                              <span className="font-medium">{yourWeeklyPoints} / {selectedCircle.weeklyPointGoal} pts</span>
                            </div>
                            <Progress 
                              value={Math.min(100, (yourWeeklyPoints / selectedCircle.weeklyPointGoal) * 100)} 
                              className="h-2"
                            />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })()}

              {/* Circle Settings Dialog */}
              <Dialog open={showCircleSettings} onOpenChange={setShowCircleSettings}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Circle Settings</DialogTitle>
                    <DialogDescription>
                      Configure point goals for circle members. These goals help motivate everyone to stay on track.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="dailyGoal">Daily Point Goal (per member)</Label>
                      <Input
                        id="dailyGoal"
                        type="number"
                        placeholder="e.g., 30"
                        value={editDailyGoal}
                        onChange={(e) => setEditDailyGoal(e.target.value)}
                        data-testid="input-daily-goal"
                      />
                      <p className="text-xs text-muted-foreground">
                        Leave empty to disable daily goals
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="weeklyGoal">Weekly Point Goal (per member)</Label>
                      <Input
                        id="weeklyGoal"
                        type="number"
                        placeholder="e.g., 150"
                        value={editWeeklyGoal}
                        onChange={(e) => setEditWeeklyGoal(e.target.value)}
                        data-testid="input-weekly-goal"
                      />
                      <p className="text-xs text-muted-foreground">
                        Leave empty to disable weekly goals
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowCircleSettings(false)} data-testid="button-cancel-settings">
                      Cancel
                    </Button>
                    <Button onClick={handleSaveCircleSettings} data-testid="button-save-settings">
                      Save Goals
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Tabs value={circleDetailTab} onValueChange={setCircleDetailTab}>
                <TabsList className="flex w-full overflow-x-auto">
                  <TabsTrigger value="tasks">Tasks</TabsTrigger>
                  <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
                  <TabsTrigger value="badges">Badges</TabsTrigger>
                  <TabsTrigger value="awards">Awards</TabsTrigger>
                  <TabsTrigger value="messages">Chat</TabsTrigger>
                  <TabsTrigger value="posts">Board</TabsTrigger>
                  <TabsTrigger value="members">Members</TabsTrigger>
                  <TabsTrigger value="compete" data-testid="tab-compete">
                    <Swords className="w-4 h-4 mr-1" />
                    Compete
                  </TabsTrigger>
                  {isOwnerOrAdmin(selectedCircle.id) && (
                    <TabsTrigger value="approvals">
                      Approvals
                      {pendingRequestsForCircle.length > 0 && (
                        <Badge variant="destructive" className="ml-1">{pendingRequestsForCircle.length}</Badge>
                      )}
                    </TabsTrigger>
                  )}
                </TabsList>

                <TabsContent value="tasks" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div>
                          <CardTitle>Circle Tasks</CardTitle>
                          <CardDescription>
                            Daily tasks for members and shared circle tasks
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => {
                              const date = new Date(selectedTaskDate);
                              date.setDate(date.getDate() - 1);
                              setSelectedTaskDate(date.toISOString().split('T')[0]);
                            }}
                            data-testid="button-prev-day"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </Button>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="min-w-[140px] justify-center gap-2"
                                data-testid="button-date-picker"
                              >
                                <CalendarIcon className="w-4 h-4" />
                                {selectedTaskDate === new Date().toISOString().split('T')[0] 
                                  ? "Today" 
                                  : new Date(selectedTaskDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="center">
                              <CalendarComponent
                                mode="single"
                                selected={new Date(selectedTaskDate + 'T12:00:00')}
                                onSelect={(date) => {
                                  if (date) {
                                    const dateStr = date.toISOString().split('T')[0];
                                    const today = new Date().toISOString().split('T')[0];
                                    if (dateStr <= today) {
                                      setSelectedTaskDate(dateStr);
                                    }
                                  }
                                }}
                                disabled={(date) => date > new Date()}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => {
                              const date = new Date(selectedTaskDate);
                              date.setDate(date.getDate() + 1);
                              const today = new Date().toISOString().split('T')[0];
                              if (date.toISOString().split('T')[0] <= today) {
                                setSelectedTaskDate(date.toISOString().split('T')[0]);
                              }
                            }}
                            disabled={selectedTaskDate === new Date().toISOString().split('T')[0]}
                            data-testid="button-next-day"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                          {selectedTaskDate !== new Date().toISOString().split('T')[0] && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSelectedTaskDate(new Date().toISOString().split('T')[0])}
                              data-testid="button-today"
                            >
                              Today
                            </Button>
                          )}
                        </div>
                        <Dialog open={showAddTask} onOpenChange={setShowAddTask}>
                          <DialogTrigger asChild>
                            <Button data-testid="button-add-task">
                              <Plus className="w-4 h-4 mr-2" />
                              Add Task
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Add New Task</DialogTitle>
                              <DialogDescription>
                                {isOwnerOrAdmin(selectedCircle.id)
                                  ? "Create a new task for this circle"
                                  : "Submit a task request for approval"}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label>Task Name</Label>
                                <Input
                                  placeholder="e.g., Morning workout"
                                  value={newTaskName}
                                  onChange={(e) => setNewTaskName(e.target.value)}
                                  data-testid="input-new-task-name"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Point Value</Label>
                                <Input
                                  type="number"
                                  value={newTaskValue}
                                  onChange={(e) => setNewTaskValue(e.target.value)}
                                  data-testid="input-new-task-value"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Task Type</Label>
                                <Select value={newTaskType} onValueChange={(v) => setNewTaskType(v as CircleTaskType)}>
                                  <SelectTrigger data-testid="select-task-type">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="per_person">Per-Person Daily - Each member logs individually</SelectItem>
                                    <SelectItem value="circle_task">Circle Task - Only needs to be done once</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setShowAddTask(false)}>Cancel</Button>
                              <Button onClick={handleAddTask} data-testid="button-submit-task">
                                {isOwnerOrAdmin(selectedCircle.id) ? "Add Task" : "Submit Request"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardHeader>

                    {/* Edit Task Dialog */}
                    <Dialog open={!!editingTask} onOpenChange={(open) => !open && setEditingTask(null)}>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Task</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>Task Name</Label>
                            <Input value={editTaskName} onChange={(e) => setEditTaskName(e.target.value)} data-testid="input-edit-task-name" />
                          </div>
                          <div className="space-y-2">
                            <Label>Point Value</Label>
                            <Input type="number" value={editTaskValue} onChange={(e) => setEditTaskValue(e.target.value)} data-testid="input-edit-task-value" />
                          </div>
                          <div className="space-y-2">
                            <Label>Task Type</Label>
                            <Select value={editTaskType} onValueChange={(v) => setEditTaskType(v as CircleTaskType)}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="per_person">Per-Person Daily</SelectItem>
                                <SelectItem value="circle_task">Circle Task</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setEditingTask(null)}>Cancel</Button>
                          <Button onClick={handleEditTask} data-testid="button-save-edit-task">Save Changes</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <CardContent>
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">Per-Person Daily Tasks</h4>
                        {(circleTasks[selectedCircle.id] || [])
                          .filter(t => t.taskType === "per_person" && t.approvalStatus === "approved")
                          .map((task) => {
                            const completions = getTaskCompletions(selectedCircle.id, task.id);
                            const isCompleted = isTaskCompletedByMe(selectedCircle.id, task.id);
                            const isExpanded = expandedTaskId === task.id;
                            return (
                              <div key={task.id} className="space-y-1">
                                <div
                                  className={`flex items-center justify-between p-3 rounded-md border cursor-pointer hover-elevate ${isCompleted ? "bg-green-500/10 border-green-500/30" : ""}`}
                                  onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                                  data-testid={`task-${task.id}`}
                                >
                                  <div className="flex items-center gap-3">
                                    <Checkbox
                                      checked={isCompleted}
                                      disabled={selectedTaskDate !== new Date().toISOString().split('T')[0]}
                                      onClick={(e) => { e.stopPropagation(); handleToggleTaskComplete(selectedCircle.id, task.id, task); }}
                                      data-testid={`checkbox-${task.id}`}
                                    />
                                    <span className={isCompleted ? "line-through text-muted-foreground" : ""}>{task.name}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {completions.length > 0 && (
                                      <div className="flex -space-x-2">
                                        {completions.slice(0, 3).map((c, i) => (
                                          <Avatar key={i} className="h-6 w-6 border-2 border-background">
                                            <AvatarFallback className="text-xs">{c.userName.charAt(0)}</AvatarFallback>
                                          </Avatar>
                                        ))}
                                        {completions.length > 3 && (
                                          <span className="text-xs text-muted-foreground ml-2">+{completions.length - 3}</span>
                                        )}
                                      </div>
                                    )}
                                    <Badge variant="outline">{task.value} pts</Badge>
                                    {isOwnerOrAdmin(selectedCircle.id) && (
                                      <div className="flex gap-1">
                                        <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); startEditTask(task); }} data-testid={`button-edit-task-${task.id}`}>
                                          <Pencil className="w-4 h-4" />
                                        </Button>
                                        <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }} data-testid={`button-delete-task-${task.id}`}>
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {isExpanded && completions.length > 0 && (
                                  <div className="ml-8 p-2 rounded bg-muted/50 space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground mb-1">Completed by:</p>
                                    {completions.map((c, i) => (
                                      <div key={i} className="flex items-center gap-2 text-sm">
                                        <Avatar className="h-5 w-5">
                                          <AvatarFallback className="text-xs">{c.userName.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <span>{c.userName}</span>
                                        <span className="text-muted-foreground text-xs">{formatTime(c.completedAt)}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        
                        <h4 className="text-sm font-medium text-muted-foreground mb-2 mt-6">Circle Tasks (One Person Completes for All)</h4>
                        {(circleTasks[selectedCircle.id] || [])
                          .filter(t => t.taskType === "circle_task" && t.approvalStatus === "approved")
                          .map((task) => {
                            const completions = getTaskCompletions(selectedCircle.id, task.id);
                            const isCompletedByAnyone = completions.length > 0;
                            const isCompletedByMe = (myCompletedTasks[selectedCircle.id] || []).includes(task.id);
                            const isExpanded = expandedTaskId === task.id;
                            return (
                              <div key={task.id} className="space-y-1">
                                <div
                                  className={`flex items-center justify-between p-3 rounded-md border cursor-pointer hover-elevate ${isCompletedByAnyone ? "bg-green-500/10 border-green-500/30" : "bg-muted/50"}`}
                                  onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                                  data-testid={`task-${task.id}`}
                                >
                                  <div className="flex items-center gap-3">
                                    <Checkbox
                                      checked={isCompletedByMe}
                                      disabled={(isCompletedByAnyone && !isCompletedByMe) || selectedTaskDate !== new Date().toISOString().split('T')[0]}
                                      onClick={(e) => { e.stopPropagation(); handleToggleTaskComplete(selectedCircle.id, task.id, task); }}
                                      data-testid={`checkbox-${task.id}`}
                                    />
                                    <div>
                                      <span className={isCompletedByAnyone ? "line-through text-muted-foreground" : ""}>{task.name}</span>
                                      <p className="text-xs text-muted-foreground">
                                        {isCompletedByAnyone ? `Done by ${completions[0].userName}` : "One completion per day"}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {isCompletedByAnyone && (
                                      <Avatar className="h-6 w-6 border-2 border-background">
                                        <AvatarFallback className="text-xs">{completions[0].userName.charAt(0)}</AvatarFallback>
                                      </Avatar>
                                    )}
                                    <Badge variant="outline">{task.value} pts</Badge>
                                    {isOwnerOrAdmin(selectedCircle.id) && (
                                      <div className="flex gap-1">
                                        <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); startEditTask(task); }} data-testid={`button-edit-task-${task.id}`}>
                                          <Pencil className="w-4 h-4" />
                                        </Button>
                                        <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }} data-testid={`button-delete-task-${task.id}`}>
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {isExpanded && isCompletedByAnyone && (
                                  <div className="ml-8 p-2 rounded bg-muted/50">
                                    <p className="text-xs font-medium text-muted-foreground mb-1">Completed by:</p>
                                    <div className="flex items-center gap-2 text-sm">
                                      <Avatar className="h-5 w-5">
                                        <AvatarFallback className="text-xs">{completions[0].userName.charAt(0)}</AvatarFallback>
                                      </Avatar>
                                      <span>{completions[0].userName}</span>
                                      <span className="text-muted-foreground text-xs">{formatTime(completions[0].completedAt)}</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="leaderboard" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Trophy className="w-5 h-5" />
                            Circle Leaderboard
                          </CardTitle>
                          <CardDescription>
                            {leaderboardViewMode === "day" && "Today's activity"}
                            {leaderboardViewMode === "week" && "This week's top performers"}
                            {leaderboardViewMode === "alltime" && "All-time statistics"}
                          </CardDescription>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant={leaderboardViewMode === "day" ? "default" : "outline"}
                            size="sm"
                            onClick={() => { setLeaderboardViewMode("day"); setExpandedMemberId(null); }}
                            data-testid="button-leaderboard-day"
                          >
                            Day
                          </Button>
                          <Button
                            variant={leaderboardViewMode === "week" ? "default" : "outline"}
                            size="sm"
                            onClick={() => { setLeaderboardViewMode("week"); setExpandedMemberId(null); }}
                            data-testid="button-leaderboard-week"
                          >
                            Week
                          </Button>
                          <Button
                            variant={leaderboardViewMode === "alltime" ? "default" : "outline"}
                            size="sm"
                            onClick={() => { setLeaderboardViewMode("alltime"); setExpandedMemberId(null); }}
                            data-testid="button-leaderboard-alltime"
                          >
                            All Time
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Total Points Banner */}
                      {(() => {
                        const members = circleMembers[selectedCircle.id] || [];
                        const memberPoints = members.reduce((sum, m) => sum + (m.weeklyPoints || 0), 0);
                        const awards = circleAwards[selectedCircle.id] || [];
                        const awardBonusPoints = awards.reduce((sum, award) => {
                          if (award.winner && award.reward && (award.reward.type === "points" || award.reward.type === "both") && award.reward.points) {
                            return sum + award.reward.points;
                          }
                          return sum;
                        }, 0);
                        const totalCirclePoints = memberPoints + awardBonusPoints;
                        return (
                          <div className="flex items-center justify-between p-3 mb-4 rounded-md bg-primary/10 border border-primary/20">
                            <div className="flex items-center gap-2">
                              <Users className="w-5 h-5 text-primary" />
                              <span className="font-medium">Combined Circle Total</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-xl font-bold text-primary" data-testid="text-leaderboard-total-points">
                                {totalCirclePoints} pts
                              </div>
                              {awardBonusPoints > 0 && (
                                <span className="text-xs text-green-500">+{awardBonusPoints} from awards</span>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                      <div className="space-y-2">
                        {(circleMembers[selectedCircle.id] || [])
                          .sort((a, b) => {
                            const getTodayPoints = (m: StoredCircleMember) => {
                              const dailyTasks = demoMemberDailyCompletions[selectedCircle.id]?.[m.userId] || [];
                              return dailyTasks.reduce((sum, t) => {
                                const task = (circleTasks[selectedCircle.id] || []).find(ct => ct.id === t.taskId);
                                return sum + (task?.value || 0);
                              }, 0);
                            };
                            const getAllTimePoints = (m: StoredCircleMember) => {
                              // Use API data for authenticated users, demo data ONLY for demo mode
                              if (!isDemo && circleLeaderboardQuery.data) {
                                const apiStats = circleLeaderboardQuery.data.find(s => s.userId === m.userId);
                                return apiStats?.totalPoints || m.weeklyPoints;
                              }
                              if (isDemo) {
                                return demoMemberAllTimeStats[selectedCircle.id]?.[m.userId]?.totalPoints || m.weeklyPoints;
                              }
                              return m.weeklyPoints;
                            };
                            switch (leaderboardViewMode) {
                              case "day":
                                return getTodayPoints(b) - getTodayPoints(a);
                              case "alltime":
                                return getAllTimePoints(b) - getAllTimePoints(a);
                              case "week":
                              default:
                                return b.weeklyPoints - a.weeklyPoints;
                            }
                          })
                          .map((member, index) => {
                            const isExpanded = expandedMemberId === member.userId;
                            
                            // Use API data for authenticated users, demo data ONLY for demo mode
                            const apiMemberStats = !isDemo && circleLeaderboardQuery.data
                              ? circleLeaderboardQuery.data.find(s => s.userId === member.userId)
                              : null;
                            const allTimeStats = apiMemberStats || (isDemo ? demoMemberAllTimeStats[selectedCircle.id]?.[member.userId] : null);
                            
                            // Get daily completions from API for authenticated users
                            const dailyTasks = isDemo
                              ? demoMemberDailyCompletions[selectedCircle.id]?.[member.userId] || []
                              : (circleCompletionsQuery.data || [])
                                  .filter(c => c.userId === member.userId)
                                  .map(c => {
                                    const task = (circleTasks[selectedCircle.id] || []).find(ct => ct.id === c.taskId);
                                    return { taskId: c.taskId, taskName: task?.name || 'Unknown', completedAt: c.completedAt };
                                  });
                            
                            // Use API taskTotals for weekly view for authenticated users
                            const weeklyTasks = isDemo
                              ? demoMemberWeeklyCompletions[selectedCircle.id]?.[member.userId] || []
                              : (apiMemberStats?.taskTotals || []);
                            
                            const todayPoints = dailyTasks.reduce((sum, t) => {
                              const task = (circleTasks[selectedCircle.id] || []).find(ct => ct.id === t.taskId);
                              return sum + (task?.value || 0);
                            }, 0);
                            
                            return (
                              <div key={member.id}>
                                <div
                                  className="flex items-center justify-between gap-4 p-3 rounded-md border hover-elevate cursor-pointer"
                                  onClick={() => setExpandedMemberId(isExpanded ? null : member.userId)}
                                  data-testid={`leaderboard-member-${index}`}
                                >
                                  <div className="flex items-center gap-3">
                                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                      index === 0 ? "bg-yellow-500 text-white" :
                                      index === 1 ? "bg-gray-400 text-white" :
                                      index === 2 ? "bg-amber-600 text-white" : "bg-muted"
                                    }`}>
                                      {index + 1}
                                    </span>
                                    <ProfileHoverCard 
                                      userId={member.userId}
                                      showActions={member.userId !== (isDemo ? "you" : user?.id)}
                                      onMessageClick={(id) => {
                                        toast({ title: "Opening DM", description: `Starting conversation with ${member.firstName}` });
                                      }}
                                      onAddFriendClick={(id) => {
                                        toast({ title: "Friend request sent", description: `Request sent to ${member.firstName}` });
                                      }}
                                    >
                                      <Avatar className="cursor-pointer">
                                        <AvatarFallback>
                                          {getInitials(member.firstName, member.lastName)}
                                        </AvatarFallback>
                                      </Avatar>
                                    </ProfileHoverCard>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium">{member.firstName} {member.lastName}</span>
                                        {getRoleIcon(member.role)}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="secondary">
                                      {leaderboardViewMode === "day" && `${todayPoints} pts today`}
                                      {leaderboardViewMode === "week" && `${member.weeklyPoints} pts`}
                                      {leaderboardViewMode === "alltime" && `${allTimeStats?.totalPoints || member.weeklyPoints} pts total`}
                                    </Badge>
                                    {allTimeStats?.goalStreak && allTimeStats.goalStreak > 0 && (
                                      <div className="flex items-center gap-1 text-orange-500" title={`${allTimeStats.goalStreak} day goal streak`}>
                                        <Flame className="w-4 h-4" />
                                        <span className="text-xs font-medium">{allTimeStats.goalStreak}</span>
                                      </div>
                                    )}
                                    <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                                  </div>
                                </div>
                                
                                {isExpanded && (
                                  <div className="ml-11 mt-2 p-3 rounded-md bg-muted/50 space-y-2">
                                    {leaderboardViewMode === "day" && (
                                      <>
                                        <p className="text-xs font-medium text-muted-foreground mb-2">Tasks completed today:</p>
                                        {dailyTasks.length > 0 ? (
                                          dailyTasks.map((task, i) => (
                                            <div key={i} className="flex items-center justify-between text-sm py-1">
                                              <div className="flex items-center gap-2">
                                                <CheckCircle className="w-4 h-4 text-green-500" />
                                                <span>{task.taskName}</span>
                                              </div>
                                              <span className="text-xs text-muted-foreground">{formatTime(task.completedAt)}</span>
                                            </div>
                                          ))
                                        ) : (
                                          <p className="text-sm text-muted-foreground">No tasks completed today</p>
                                        )}
                                      </>
                                    )}
                                    
                                    {leaderboardViewMode === "week" && (
                                      <>
                                        <p className="text-xs font-medium text-muted-foreground mb-2">Tasks this week:</p>
                                        {weeklyTasks.length > 0 ? (
                                          weeklyTasks.map((task, i) => (
                                            <div key={i} className="flex items-center justify-between text-sm py-1">
                                              <div className="flex items-center gap-2">
                                                <Target className="w-4 h-4 text-primary" />
                                                <span>{task.taskName}</span>
                                              </div>
                                              <Badge variant="outline" className="text-xs">x{task.count}</Badge>
                                            </div>
                                          ))
                                        ) : (
                                          <p className="text-sm text-muted-foreground">No tasks completed this week</p>
                                        )}
                                      </>
                                    )}
                                    
                                    {leaderboardViewMode === "alltime" && (
                                      <>
                                        {allTimeStats ? (
                                          <>
                                            <p className="text-xs font-medium text-muted-foreground mb-2">Weekly history:</p>
                                            <div className="space-y-1 mb-4">
                                              {allTimeStats.weeklyHistory.map((week, i) => (
                                                <div key={i} className="flex items-center justify-between text-sm py-1">
                                                  <span className="text-muted-foreground">{week.week}</span>
                                                  <Badge variant="outline">{week.points} pts</Badge>
                                                </div>
                                              ))}
                                            </div>
                                            <Separator className="my-2" />
                                            <p className="text-xs font-medium text-muted-foreground mb-2">All-time task totals:</p>
                                            {allTimeStats.taskTotals.map((task, i) => (
                                              <div key={i} className="flex items-center justify-between text-sm py-1">
                                                <span>{task.taskName}</span>
                                                <Badge variant="secondary">x{task.count}</Badge>
                                              </div>
                                            ))}
                                          </>
                                        ) : (
                                          <p className="text-sm text-muted-foreground">No historical data available</p>
                                        )}
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="badges" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Star className="w-5 h-5" />
                            Circle Badges
                          </CardTitle>
                          <CardDescription>Shared goals everyone works towards together</CardDescription>
                        </div>
                        <Dialog open={showAddBadge} onOpenChange={setShowAddBadge}>
                          <DialogTrigger asChild>
                            <Button data-testid="button-add-badge">
                              <Plus className="w-4 h-4 mr-2" />
                              Add Badge
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Add New Badge</DialogTitle>
                              <DialogDescription>
                                {isOwnerOrAdmin(selectedCircle.id)
                                  ? "Create a new badge for this circle"
                                  : "Submit a badge request for approval"}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label>Badge Name</Label>
                                <Input
                                  placeholder="e.g., Marathon Ready"
                                  value={newBadgeName}
                                  onChange={(e) => setNewBadgeName(e.target.value)}
                                  data-testid="input-new-badge-name"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea
                                  placeholder="What do members need to do to earn this badge?"
                                  value={newBadgeDescription}
                                  onChange={(e) => setNewBadgeDescription(e.target.value)}
                                  data-testid="input-new-badge-description"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Required Count</Label>
                                <Input
                                  type="number"
                                  value={newBadgeRequired}
                                  onChange={(e) => setNewBadgeRequired(e.target.value)}
                                  data-testid="input-new-badge-required"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Reward (Optional)</Label>
                                <Select value={newBadgeRewardType} onValueChange={(v) => setNewBadgeRewardType(v as "none" | "points" | "gift" | "both")}>
                                  <SelectTrigger data-testid="select-badge-reward-type">
                                    <SelectValue placeholder="Select reward type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">No Reward</SelectItem>
                                    <SelectItem value="points">Bonus Points</SelectItem>
                                    <SelectItem value="gift">Gift/Prize</SelectItem>
                                    <SelectItem value="both">Points + Gift</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              {(newBadgeRewardType === "points" || newBadgeRewardType === "both") && (
                                <div className="space-y-2">
                                  <Label>Bonus Points</Label>
                                  <Input
                                    type="number"
                                    placeholder="e.g., 50"
                                    value={newBadgeRewardPoints}
                                    onChange={(e) => setNewBadgeRewardPoints(e.target.value)}
                                    data-testid="input-badge-reward-points"
                                  />
                                </div>
                              )}
                              {(newBadgeRewardType === "gift" || newBadgeRewardType === "both") && (
                                <div className="space-y-2">
                                  <Label>Gift/Prize</Label>
                                  <Input
                                    placeholder="e.g., Pizza night, Free movie"
                                    value={newBadgeRewardGift}
                                    onChange={(e) => setNewBadgeRewardGift(e.target.value)}
                                    data-testid="input-badge-reward-gift"
                                  />
                                </div>
                              )}
                              <div className="space-y-2">
                                <Label>Linked Task (Optional)</Label>
                                <Select value={newBadgeTaskId} onValueChange={setNewBadgeTaskId}>
                                  <SelectTrigger data-testid="select-badge-task">
                                    <SelectValue placeholder="Select a task to track" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="_none">No specific task</SelectItem>
                                    {(circleTasks[selectedCircle.id] || []).map(task => (
                                      <SelectItem key={task.id} value={task.id}>{task.name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setShowAddBadge(false)}>Cancel</Button>
                              <Button onClick={handleAddBadge} data-testid="button-submit-badge">
                                {isOwnerOrAdmin(selectedCircle.id) ? "Add Badge" : "Submit Request"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardHeader>

                    {/* Edit Badge Dialog */}
                    <Dialog open={!!editingBadge} onOpenChange={(open) => !open && setEditingBadge(null)}>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Badge</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>Badge Name</Label>
                            <Input value={editBadgeName} onChange={(e) => setEditBadgeName(e.target.value)} data-testid="input-edit-badge-name" />
                          </div>
                          <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea value={editBadgeDescription} onChange={(e) => setEditBadgeDescription(e.target.value)} data-testid="input-edit-badge-description" />
                          </div>
                          <div className="space-y-2">
                            <Label>Required Count</Label>
                            <Input type="number" value={editBadgeRequired} onChange={(e) => setEditBadgeRequired(e.target.value)} data-testid="input-edit-badge-required" />
                          </div>
                          <div className="space-y-2">
                            <Label>Reward Type</Label>
                            <Select value={editBadgeRewardType} onValueChange={(v) => setEditBadgeRewardType(v as "none" | "points" | "gift" | "both")}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">No Reward</SelectItem>
                                <SelectItem value="points">Bonus Points</SelectItem>
                                <SelectItem value="gift">Gift/Prize</SelectItem>
                                <SelectItem value="both">Points + Gift</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          {(editBadgeRewardType === "points" || editBadgeRewardType === "both") && (
                            <div className="space-y-2">
                              <Label>Bonus Points</Label>
                              <Input type="number" value={editBadgeRewardPoints} onChange={(e) => setEditBadgeRewardPoints(e.target.value)} data-testid="input-edit-badge-reward-points" />
                            </div>
                          )}
                          {(editBadgeRewardType === "gift" || editBadgeRewardType === "both") && (
                            <div className="space-y-2">
                              <Label>Gift/Prize</Label>
                              <Input value={editBadgeRewardGift} onChange={(e) => setEditBadgeRewardGift(e.target.value)} data-testid="input-edit-badge-reward-gift" />
                            </div>
                          )}
                          <div className="space-y-2">
                            <Label>Linked Task (Optional)</Label>
                            <Select value={editBadgeTaskId} onValueChange={setEditBadgeTaskId}>
                              <SelectTrigger data-testid="select-edit-badge-task">
                                <SelectValue placeholder="Select a task to track" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="_none">No specific task</SelectItem>
                                {(circleTasks[selectedCircle.id] || []).map(task => (
                                  <SelectItem key={task.id} value={task.id}>{task.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setEditingBadge(null)}>Cancel</Button>
                          <Button onClick={handleEditBadge} data-testid="button-save-edit-badge">Save Changes</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <CardContent>
                      {isOwnerOrAdmin(selectedCircle.id) && pendingBadgeRequestsForCircle.filter(r => r.type === "badge").length > 0 && (
                        <div className="mb-6 p-4 rounded-md border border-yellow-500/30 bg-yellow-500/10">
                          <h4 className="font-medium flex items-center gap-2 mb-3">
                            <AlertCircle className="w-4 h-4 text-yellow-500" />
                            Pending Badge Requests
                          </h4>
                          <div className="space-y-3">
                            {pendingBadgeRequestsForCircle.filter(r => r.type === "badge").map((request) => (
                              <div key={request.id} className="flex items-center justify-between gap-4 p-3 rounded-md bg-background border">
                                <div>
                                  <p className="font-medium">{request.data.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    Requested by {request.requesterName} - {request.data.description || "No description"}
                                  </p>
                                  <p className="text-xs text-muted-foreground">Required: {request.data.required}</p>
                                </div>
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => handleApproveBadgeRequest(request.id)} data-testid={`button-approve-badge-${request.id}`}>
                                    <Check className="w-4 h-4" />
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => handleRejectBadgeRequest(request.id)} data-testid={`button-reject-badge-${request.id}`}>
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="space-y-4">
                        {(circleBadges[selectedCircle.id] || []).map((badge) => (
                          <div 
                            key={badge.id} 
                            className={`p-4 rounded-md border ${badge.earned ? "bg-yellow-500/10 border-yellow-500/30" : ""}`}
                            data-testid={`circle-badge-${badge.id}`}
                          >
                            <div className="flex items-center justify-between gap-4 mb-2">
                              <div className="flex items-center gap-2">
                                {badge.earned ? (
                                  <Trophy className="w-5 h-5 text-yellow-500" />
                                ) : (
                                  <Target className="w-5 h-5 text-muted-foreground" />
                                )}
                                <span className="font-medium">{badge.name}</span>
                                {badge.earned && <Badge variant="secondary">Earned</Badge>}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">{badge.progress}/{badge.required}</span>
                                {isOwnerOrAdmin(selectedCircle.id) && (
                                  <div className="flex gap-1">
                                    <Button size="icon" variant="ghost" onClick={() => startEditBadge(badge)} data-testid={`button-edit-badge-${badge.id}`}>
                                      <Pencil className="w-4 h-4" />
                                    </Button>
                                    <Button size="icon" variant="ghost" onClick={() => handleDeleteBadge(badge.id)} data-testid={`button-delete-badge-${badge.id}`}>
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{badge.description}</p>
                            {badge.reward && (
                              <div className="flex items-center gap-2 mb-2 p-2 rounded bg-muted/50">
                                <Gift className="w-4 h-4 text-primary" />
                                <span className="text-sm font-medium">Reward:</span>
                                {badge.reward.points && (
                                  <Badge variant="outline" className="text-xs">+{badge.reward.points} pts</Badge>
                                )}
                                {badge.reward.gift && (
                                  <span className="text-sm text-muted-foreground">{badge.reward.gift}</span>
                                )}
                              </div>
                            )}
                            <Progress value={(badge.progress / badge.required) * 100} className="h-2" />
                          </div>
                        ))}
                        {(!circleBadges[selectedCircle.id] || circleBadges[selectedCircle.id].length === 0) && (
                          <div className="text-center py-8 text-muted-foreground">
                            <Star className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>No badges set up for this circle yet</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="awards" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Award className="w-5 h-5" />
                            Circle Awards
                          </CardTitle>
                          <CardDescription>Competitive challenges and races</CardDescription>
                        </div>
                        <Dialog open={showAddAward} onOpenChange={setShowAddAward}>
                          <DialogTrigger asChild>
                            <Button data-testid="button-add-award">
                              <Plus className="w-4 h-4 mr-2" />
                              Add Award
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Add New Award</DialogTitle>
                              <DialogDescription>
                                {isOwnerOrAdmin(selectedCircle.id)
                                  ? "Create a new award for this circle"
                                  : "Submit an award request for approval"}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label>Award Name</Label>
                                <Input
                                  placeholder="e.g., Speed Demon"
                                  value={newAwardName}
                                  onChange={(e) => setNewAwardName(e.target.value)}
                                  data-testid="input-new-award-name"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea
                                  placeholder="What's the challenge about?"
                                  value={newAwardDescription}
                                  onChange={(e) => setNewAwardDescription(e.target.value)}
                                  data-testid="input-new-award-description"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Award Type</Label>
                                <Select value={newAwardType} onValueChange={(v) => setNewAwardType(v as "first_to" | "most_in_category" | "weekly_champion")}>
                                  <SelectTrigger data-testid="select-award-type">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="first_to">First To - First to reach a target</SelectItem>
                                    <SelectItem value="most_in_category">Most In Category - Highest in a category</SelectItem>
                                    <SelectItem value="weekly_champion">Weekly Champion - Best performer each week</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              {newAwardType === "first_to" && (
                                <div className="space-y-2">
                                  <Label>Target Points</Label>
                                  <Input
                                    type="number"
                                    value={newAwardTarget}
                                    onChange={(e) => setNewAwardTarget(e.target.value)}
                                    data-testid="input-new-award-target"
                                  />
                                </div>
                              )}
                              {newAwardType === "most_in_category" && (
                                <div className="space-y-2">
                                  <Label>Category</Label>
                                  <Input
                                    placeholder="e.g., Cardio, Reading"
                                    value={newAwardCategory}
                                    onChange={(e) => setNewAwardCategory(e.target.value)}
                                    data-testid="input-new-award-category"
                                  />
                                </div>
                              )}
                              <div className="space-y-2">
                                <Label>Reward (Optional)</Label>
                                <Select value={newAwardRewardType} onValueChange={(v) => setNewAwardRewardType(v as "none" | "points" | "gift" | "both")}>
                                  <SelectTrigger data-testid="select-award-reward-type">
                                    <SelectValue placeholder="Select reward type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">No Reward</SelectItem>
                                    <SelectItem value="points">Bonus Points</SelectItem>
                                    <SelectItem value="gift">Gift/Prize</SelectItem>
                                    <SelectItem value="both">Points + Gift</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              {(newAwardRewardType === "points" || newAwardRewardType === "both") && (
                                <div className="space-y-2">
                                  <Label>Bonus Points</Label>
                                  <Input
                                    type="number"
                                    placeholder="e.g., 50"
                                    value={newAwardRewardPoints}
                                    onChange={(e) => setNewAwardRewardPoints(e.target.value)}
                                    data-testid="input-award-reward-points"
                                  />
                                </div>
                              )}
                              {(newAwardRewardType === "gift" || newAwardRewardType === "both") && (
                                <div className="space-y-2">
                                  <Label>Gift/Prize</Label>
                                  <Input
                                    placeholder="e.g., Extra screen time, Gift card"
                                    value={newAwardRewardGift}
                                    onChange={(e) => setNewAwardRewardGift(e.target.value)}
                                    data-testid="input-award-reward-gift"
                                  />
                                </div>
                              )}
                              <div className="space-y-2">
                                <Label>Linked Task (Optional)</Label>
                                <Select value={newAwardTaskId} onValueChange={setNewAwardTaskId}>
                                  <SelectTrigger data-testid="select-award-task">
                                    <SelectValue placeholder="Select a task to track" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="_none">No specific task</SelectItem>
                                    {(circleTasks[selectedCircle.id] || []).map(task => (
                                      <SelectItem key={task.id} value={task.id}>{task.name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setShowAddAward(false)}>Cancel</Button>
                              <Button onClick={handleAddAward} data-testid="button-submit-award">
                                {isOwnerOrAdmin(selectedCircle.id) ? "Add Award" : "Submit Request"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardHeader>

                    {/* Edit Award Dialog */}
                    <Dialog open={!!editingAward} onOpenChange={(open) => !open && setEditingAward(null)}>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Award</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>Award Name</Label>
                            <Input value={editAwardName} onChange={(e) => setEditAwardName(e.target.value)} data-testid="input-edit-award-name" />
                          </div>
                          <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea value={editAwardDescription} onChange={(e) => setEditAwardDescription(e.target.value)} data-testid="input-edit-award-description" />
                          </div>
                          <div className="space-y-2">
                            <Label>Award Type</Label>
                            <Select value={editAwardType} onValueChange={(v) => setEditAwardType(v as "first_to" | "most_in_category" | "weekly_champion")}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="first_to">First To</SelectItem>
                                <SelectItem value="most_in_category">Most In Category</SelectItem>
                                <SelectItem value="weekly_champion">Weekly Champion</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          {editAwardType === "first_to" && (
                            <div className="space-y-2">
                              <Label>Target Points</Label>
                              <Input type="number" value={editAwardTarget} onChange={(e) => setEditAwardTarget(e.target.value)} data-testid="input-edit-award-target" />
                            </div>
                          )}
                          {editAwardType === "most_in_category" && (
                            <div className="space-y-2">
                              <Label>Category</Label>
                              <Input value={editAwardCategory} onChange={(e) => setEditAwardCategory(e.target.value)} data-testid="input-edit-award-category" />
                            </div>
                          )}
                          <div className="space-y-2">
                            <Label>Reward Type</Label>
                            <Select value={editAwardRewardType} onValueChange={(v) => setEditAwardRewardType(v as "none" | "points" | "gift" | "both")}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">No Reward</SelectItem>
                                <SelectItem value="points">Bonus Points</SelectItem>
                                <SelectItem value="gift">Gift/Prize</SelectItem>
                                <SelectItem value="both">Points + Gift</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          {(editAwardRewardType === "points" || editAwardRewardType === "both") && (
                            <div className="space-y-2">
                              <Label>Bonus Points</Label>
                              <Input type="number" value={editAwardRewardPoints} onChange={(e) => setEditAwardRewardPoints(e.target.value)} data-testid="input-edit-award-reward-points" />
                            </div>
                          )}
                          {(editAwardRewardType === "gift" || editAwardRewardType === "both") && (
                            <div className="space-y-2">
                              <Label>Gift/Prize</Label>
                              <Input value={editAwardRewardGift} onChange={(e) => setEditAwardRewardGift(e.target.value)} data-testid="input-edit-award-reward-gift" />
                            </div>
                          )}
                          <div className="space-y-2">
                            <Label>Linked Task (Optional)</Label>
                            <Select value={editAwardTaskId} onValueChange={setEditAwardTaskId}>
                              <SelectTrigger data-testid="select-edit-award-task">
                                <SelectValue placeholder="Select a task to track" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="_none">No specific task</SelectItem>
                                {(circleTasks[selectedCircle.id] || []).map(task => (
                                  <SelectItem key={task.id} value={task.id}>{task.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setEditingAward(null)}>Cancel</Button>
                          <Button onClick={handleEditAward} data-testid="button-save-edit-award">Save Changes</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <CardContent>
                      {isOwnerOrAdmin(selectedCircle.id) && pendingBadgeRequestsForCircle.filter(r => r.type === "award").length > 0 && (
                        <div className="mb-6 p-4 rounded-md border border-yellow-500/30 bg-yellow-500/10">
                          <h4 className="font-medium flex items-center gap-2 mb-3">
                            <AlertCircle className="w-4 h-4 text-yellow-500" />
                            Pending Award Requests
                          </h4>
                          <div className="space-y-3">
                            {pendingBadgeRequestsForCircle.filter(r => r.type === "award").map((request) => (
                              <div key={request.id} className="flex items-center justify-between gap-4 p-3 rounded-md bg-background border">
                                <div>
                                  <p className="font-medium">{request.data.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    Requested by {request.requesterName} - {request.data.description || "No description"}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Type: {request.data.awardType}
                                    {request.data.target && ` - Target: ${request.data.target}`}
                                    {request.data.category && ` - Category: ${request.data.category}`}
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => handleApproveBadgeRequest(request.id)} data-testid={`button-approve-award-${request.id}`}>
                                    <Check className="w-4 h-4" />
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => handleRejectBadgeRequest(request.id)} data-testid={`button-reject-award-${request.id}`}>
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="space-y-4">
                        {(circleAwards[selectedCircle.id] || []).map((award) => (
                          <div 
                            key={award.id} 
                            className={`p-4 rounded-md border ${award.winner ? "bg-green-500/10 border-green-500/30" : "bg-muted/50"}`}
                            data-testid={`circle-award-${award.id}`}
                          >
                            <div className="flex items-center justify-between gap-4 mb-2">
                              <div className="flex items-center gap-2">
                                {award.type === "first_to" && <Flame className="w-5 h-5 text-orange-500" />}
                                {award.type === "most_in_category" && <Trophy className="w-5 h-5 text-purple-500" />}
                                {award.type === "weekly_champion" && <Crown className="w-5 h-5 text-yellow-500" />}
                                <span className="font-medium">{award.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={award.winner ? "default" : "outline"}>
                                  {award.type === "first_to" && `First to ${award.target}`}
                                  {award.type === "most_in_category" && award.category}
                                  {award.type === "weekly_champion" && "Weekly"}
                                </Badge>
                                {isOwnerOrAdmin(selectedCircle.id) && (
                                  <div className="flex gap-1">
                                    <Button size="icon" variant="ghost" onClick={() => startEditAward(award)} data-testid={`button-edit-award-${award.id}`}>
                                      <Pencil className="w-4 h-4" />
                                    </Button>
                                    <Button size="icon" variant="ghost" onClick={() => handleDeleteAward(award.id)} data-testid={`button-delete-award-${award.id}`}>
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{award.description}</p>
                            {award.reward && (
                              <div className="flex items-center gap-2 mb-2 p-2 rounded bg-muted/50">
                                <Gift className="w-4 h-4 text-primary" />
                                <span className="text-sm font-medium">Prize:</span>
                                {award.reward.points && (
                                  <Badge variant="outline" className="text-xs">+{award.reward.points} pts</Badge>
                                )}
                                {award.reward.gift && (
                                  <span className="text-sm text-muted-foreground">{award.reward.gift}</span>
                                )}
                              </div>
                            )}
                            {award.winner ? (
                              <div className="flex items-center gap-2 p-2 rounded bg-green-500/20">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span className="text-sm font-medium">{award.winner.userName} won!</span>
                                <span className="text-xs text-muted-foreground">{formatTime(award.winner.achievedAt)}</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="w-4 h-4" />
                                <span>Challenge in progress</span>
                              </div>
                            )}
                          </div>
                        ))}
                        {(!circleAwards[selectedCircle.id] || circleAwards[selectedCircle.id].length === 0) && (
                          <div className="text-center py-8 text-muted-foreground">
                            <Award className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>No awards or challenges set up yet</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="messages" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MessageCircle className="w-5 h-5" />
                        Circle Chat
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-64 mb-4 pr-4">
                        <div className="space-y-3">
                          {(circleMessages[selectedCircle.id] || []).map((msg) => (
                            <div key={msg.id} className="flex gap-3">
                              <ProfileHoverCard
                                userId={msg.senderId}
                                showActions={msg.senderId !== "you"}
                                onMessageClick={() => toast({ title: "Opening DM", description: `Starting conversation with ${msg.senderName}` })}
                                onAddFriendClick={() => toast({ title: "Friend request sent", description: `Request sent to ${msg.senderName}` })}
                              >
                                <Avatar className="h-8 w-8 cursor-pointer">
                                  <AvatarFallback className="text-xs">{msg.senderName.charAt(0)}</AvatarFallback>
                                </Avatar>
                              </ProfileHoverCard>
                              <div className="flex-1">
                                <div className="flex items-baseline gap-2">
                                  <span className="font-medium text-sm">{msg.senderName}</span>
                                  <span className="text-xs text-muted-foreground">{formatTime(msg.createdAt)}</span>
                                </div>
                                <p className="text-sm">{msg.content}</p>
                                {msg.imageUrl && (
                                  <img 
                                    src={msg.imageUrl} 
                                    alt="Attached" 
                                    className="mt-2 max-w-xs rounded-md border" 
                                    data-testid={`img-circle-message-${msg.id}`}
                                  />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                      {circleMessageImagePreview && (
                        <div className="mb-2 relative inline-block">
                          <img src={circleMessageImagePreview} alt="Preview" className="max-h-24 rounded-md border" />
                          <Button
                            size="icon"
                            variant="destructive"
                            className="absolute -top-2 -right-2 h-6 w-6"
                            onClick={clearMessageImage}
                            data-testid="button-clear-circle-message-image"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <input
                          type="file"
                          accept="image/*"
                          ref={circleMessageFileRef}
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleCircleImageUpload(file, "message");
                          }}
                          data-testid="input-circle-message-file"
                        />
                        <Button 
                          size="icon" 
                          variant="outline"
                          onClick={() => circleMessageFileRef.current?.click()}
                          disabled={circleMessageUploading}
                          data-testid="button-attach-circle-message-image"
                        >
                          {circleMessageUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
                        </Button>
                        <Input
                          placeholder="Type a message..."
                          value={newCircleMessage}
                          onChange={(e) => setNewCircleMessage(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleSendCircleMessage()}
                          data-testid="input-circle-message"
                        />
                        <Button size="icon" onClick={handleSendCircleMessage} data-testid="button-send-circle-message">
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="posts" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Circle Post Board</CardTitle>
                      <CardDescription>Share updates and announcements with the circle</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Textarea
                          placeholder="Share something with the circle..."
                          value={newCirclePost}
                          onChange={(e) => setNewCirclePost(e.target.value)}
                          className="min-h-[80px]"
                          data-testid="input-circle-post"
                        />
                        {circlePostImagePreview && (
                          <div className="relative inline-block">
                            <img src={circlePostImagePreview} alt="Preview" className="max-h-32 rounded-md border" />
                            <Button
                              size="icon"
                              variant="destructive"
                              className="absolute -top-2 -right-2 h-6 w-6"
                              onClick={clearPostImage}
                              data-testid="button-clear-circle-post-image"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          ref={circlePostFileRef}
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleCircleImageUpload(file, "post");
                          }}
                          data-testid="input-circle-post-file"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline"
                          onClick={() => circlePostFileRef.current?.click()}
                          disabled={circlePostUploading}
                          data-testid="button-attach-circle-post-image"
                        >
                          {circlePostUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ImagePlus className="w-4 h-4 mr-2" />}
                          Add Image
                        </Button>
                        <Button onClick={handleCreateCirclePost} className="flex-1" data-testid="button-create-circle-post">
                          Post to Board
                        </Button>
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-4">
                        {(circlePosts[selectedCircle.id] || []).map((post) => (
                          <div key={post.id} className="p-4 rounded-md border" data-testid={`circle-post-${post.id}`}>
                            <div className="flex items-start gap-3">
                              <ProfileHoverCard
                                userId={post.authorId}
                                showActions={post.authorId !== "you"}
                                onMessageClick={() => toast({ title: "Opening DM", description: `Starting conversation with ${post.authorName}` })}
                                onAddFriendClick={() => toast({ title: "Friend request sent", description: `Request sent to ${post.authorName}` })}
                              >
                                <Avatar className="cursor-pointer">
                                  <AvatarFallback>{post.authorName.charAt(0)}</AvatarFallback>
                                </Avatar>
                              </ProfileHoverCard>
                              <div className="flex-1">
                                <div className="flex items-baseline gap-2">
                                  <span className="font-medium">{post.authorName}</span>
                                  <span className="text-sm text-muted-foreground">{formatTime(post.createdAt)}</span>
                                </div>
                                <p className="mt-2">{post.content}</p>
                                {post.imageUrl && (
                                  <img 
                                    src={post.imageUrl} 
                                    alt="Post image" 
                                    className="mt-2 max-w-md rounded-md border" 
                                    data-testid={`img-circle-post-${post.id}`}
                                  />
                                )}
                                <div className="flex items-center gap-4 mt-3">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleLikeCirclePost(post.id)}
                                    data-testid={`button-like-circle-post-${post.id}`}
                                  >
                                    <Heart className={`w-4 h-4 mr-1 ${post.likes.includes("you") ? "fill-red-500 text-red-500" : ""}`} />
                                    {post.likes.length}
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => setCirclePostCommentingId(circlePostCommentingId === post.id ? null : post.id)}
                                    data-testid={`button-comment-circle-post-${post.id}`}
                                  >
                                    <MessageCircle className="w-4 h-4 mr-1" />
                                    {post.comments.length}
                                  </Button>
                                  {(post.authorId === "you" || isOwnerOrAdmin(selectedCircle.id)) && (
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => handleDeleteCirclePost(post.id)}
                                      data-testid={`button-delete-circle-post-${post.id}`}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                                
                                {circlePostCommentingId === post.id && (
                                  <div className="mt-4 flex gap-2">
                                    <Input
                                      placeholder="Write a comment..."
                                      value={newCirclePostComment}
                                      onChange={(e) => setNewCirclePostComment(e.target.value)}
                                      onKeyDown={(e) => e.key === "Enter" && handleAddCirclePostComment(post.id)}
                                      data-testid={`input-circle-post-comment-${post.id}`}
                                    />
                                    <Button size="icon" onClick={() => handleAddCirclePostComment(post.id)} data-testid={`button-submit-circle-post-comment-${post.id}`}>
                                      <Send className="w-4 h-4" />
                                    </Button>
                                  </div>
                                )}
                                
                                {post.comments.length > 0 && (
                                  <div className="mt-4 space-y-3 pl-4 border-l-2 border-muted">
                                    {post.comments.map((comment) => (
                                      <div key={comment.id} className="flex gap-2" data-testid={`circle-post-comment-${comment.id}`}>
                                        <Avatar className="h-6 w-6">
                                          <AvatarFallback className="text-xs">{comment.authorName.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                          <div className="flex items-baseline gap-2 flex-wrap">
                                            <span className="font-medium text-sm">{comment.authorName}</span>
                                            <span className="text-xs text-muted-foreground">{formatTime(comment.createdAt)}</span>
                                            {comment.authorId === "you" && (
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-5 w-5"
                                                onClick={() => handleDeleteCirclePostComment(post.id, comment.id)}
                                                data-testid={`button-delete-circle-comment-${comment.id}`}
                                              >
                                                <Trash2 className="w-3 h-3 text-muted-foreground" />
                                              </Button>
                                            )}
                                          </div>
                                          <p className="text-sm">{comment.content}</p>
                                          <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="h-6 px-2 mt-1"
                                            onClick={() => handleLikeCirclePostComment(post.id, comment.id)}
                                            data-testid={`button-like-circle-comment-${comment.id}`}
                                          >
                                            <Heart className={`w-3 h-3 mr-1 ${comment.likes.includes("you") ? "fill-red-500 text-red-500" : ""}`} />
                                            <span className="text-xs">{comment.likes.length}</span>
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        {(circlePosts[selectedCircle.id] || []).length === 0 && (
                          <p className="text-center text-muted-foreground py-8">No posts yet. Be the first to share!</p>
                        )}
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
                        {(circleMembers[selectedCircle.id] || []).map((member) => {
                          const currentUserId = isDemo ? "you" : user?.id;
                          const isCurrentUser = member.userId === currentUserId;
                          const canManageRoles = getUserRole(selectedCircle.id) === "owner" && member.role !== "owner" && !isCurrentUser;
                          
                          return (
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
                                    {isCurrentUser && <Badge variant="secondary" className="text-xs">You</Badge>}
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    Joined {new Date(member.joinedAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {canManageRoles ? (
                                  <Select
                                    value={member.role}
                                    onValueChange={(value: "admin" | "member") => handleChangeMemberRole(member.id, member.userId, value)}
                                  >
                                    <SelectTrigger className="w-28" data-testid={`select-role-${member.id}`}>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="admin">Admin</SelectItem>
                                      <SelectItem value="member">Member</SelectItem>
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <Badge variant="outline" className="capitalize">
                                    {member.role}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="compete" className="space-y-4 mt-4">
                  {isDemo ? (
                    <div className="space-y-4">
                      {(() => {
                        const demoIsOwnerOrAdmin = selectedCircle.createdBy === "you" || 
                          demoCircleMembers[selectedCircle.id]?.find(m => m.userId === "you")?.role === "admin";
                        const demoCircleCompetitions = demoCompetitions[selectedCircle.id] || [];
                        const demoCircleInvites = demoCompetitionInvites[selectedCircle.id] || [];
                        
                        return (
                          <>
                            {demoIsOwnerOrAdmin && (
                              <>
                                <Card>
                                  <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                      <Copy className="w-5 h-5" />
                                      Your Circle's Invite Code
                                    </CardTitle>
                                    <CardDescription>
                                      Share this code with other circles to receive competition challenges
                                    </CardDescription>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="flex items-center gap-2">
                                      <code className="flex-1 bg-muted px-4 py-2 rounded-md font-mono text-lg" data-testid="text-demo-invite-code">
                                        {selectedCircle.inviteCode}
                                      </code>
                                      <Button
                                        variant="outline"
                                        onClick={() => {
                                          toast({ title: "Demo Mode", description: "Sign in to copy invite codes" });
                                        }}
                                        data-testid="button-demo-copy-invite-code"
                                      >
                                        <Copy className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </CardContent>
                                </Card>

                                <Card>
                                  <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                      <Swords className="w-5 h-5" />
                                      Challenge Another Circle
                                    </CardTitle>
                                    <CardDescription>
                                      Enter another circle's invite code to send them a competition challenge
                                    </CardDescription>
                                  </CardHeader>
                                  <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                      <Label>Opponent's Invite Code</Label>
                                      <Input
                                        placeholder="Enter their invite code"
                                        disabled
                                        data-testid="input-demo-challenge-invite-code"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Competition Type</Label>
                                      <Select
                                        value={challengeCompetitionType}
                                        onValueChange={(value) => setChallengeCompetitionType(value as CompetitionType)}
                                        data-testid="select-demo-competition-type"
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select competition type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="targetPoints">
                                            <div className="flex items-center gap-2">
                                              <Target className="w-3 h-3" />
                                              Target Points - First to reach wins
                                            </div>
                                          </SelectItem>
                                          <SelectItem value="timed">
                                            <div className="flex items-center gap-2">
                                              <Clock className="w-3 h-3" />
                                              Timed - Most points by end date wins
                                            </div>
                                          </SelectItem>
                                          <SelectItem value="ongoing">
                                            <div className="flex items-center gap-2">
                                              <Flame className="w-3 h-3" />
                                              Ongoing - Continuous competition
                                            </div>
                                          </SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    {challengeCompetitionType === "targetPoints" && (
                                      <div className="space-y-2">
                                        <Label>Target Points</Label>
                                        <Input
                                          type="number"
                                          placeholder="e.g., 1000"
                                          disabled
                                          data-testid="input-demo-challenge-target-points"
                                        />
                                      </div>
                                    )}
                                    {challengeCompetitionType === "timed" && (
                                      <div className="space-y-2">
                                        <Label>End Date</Label>
                                        <Popover>
                                          <PopoverTrigger asChild>
                                            <Button
                                              variant="outline"
                                              className="w-full justify-start text-left font-normal"
                                              disabled
                                              data-testid="button-demo-end-date"
                                            >
                                              <CalendarIcon className="mr-2 h-4 w-4" />
                                              {challengeEndDate ? challengeEndDate.toLocaleDateString() : "Pick an end date"}
                                            </Button>
                                          </PopoverTrigger>
                                          <PopoverContent className="w-auto p-0" align="start">
                                            <CalendarComponent
                                              mode="single"
                                              selected={challengeEndDate}
                                              onSelect={setChallengeEndDate}
                                              disabled={(date) => date < new Date()}
                                            />
                                          </PopoverContent>
                                        </Popover>
                                      </div>
                                    )}
                                    <div className="space-y-2">
                                      <Label>Competition Name (optional)</Label>
                                      <Input
                                        placeholder="e.g., Weekly Showdown"
                                        disabled
                                        data-testid="input-demo-challenge-name"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Notes (optional)</Label>
                                      <Textarea
                                        placeholder="Add any rules, context, or details about this competition..."
                                        disabled
                                        className="min-h-[80px]"
                                        data-testid="textarea-demo-challenge-notes"
                                      />
                                    </div>
                                    <Button
                                      onClick={() => {
                                        toast({ title: "Demo Mode", description: "Sign in to challenge other circles" });
                                      }}
                                      data-testid="button-demo-send-challenge"
                                    >
                                      <Send className="w-4 h-4 mr-2" />
                                      Send Challenge
                                    </Button>
                                  </CardContent>
                                </Card>
                              </>
                            )}

                            {/* Win/Loss Record */}
                            {(() => {
                              const record = demoCircleRecords[selectedCircle.id];
                              if (!record || (record.wins === 0 && record.losses === 0 && record.ties === 0)) return null;
                              return (
                                <Card>
                                  <CardHeader className="pb-2">
                                    <CardTitle className="flex items-center gap-2">
                                      <Trophy className="w-5 h-5" />
                                      Competition Record
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="flex items-center justify-center gap-8">
                                      <div className="text-center">
                                        <p className="text-3xl font-bold text-green-500" data-testid="text-wins">{record.wins}</p>
                                        <p className="text-sm text-muted-foreground">Wins</p>
                                      </div>
                                      <div className="text-center">
                                        <p className="text-3xl font-bold text-red-500" data-testid="text-losses">{record.losses}</p>
                                        <p className="text-sm text-muted-foreground">Losses</p>
                                      </div>
                                      {record.ties > 0 && (
                                        <div className="text-center">
                                          <p className="text-3xl font-bold text-muted-foreground" data-testid="text-ties">{record.ties}</p>
                                          <p className="text-sm text-muted-foreground">Ties</p>
                                        </div>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                              );
                            })()}

                            {demoCircleInvites.length > 0 && (
                              <Card>
                                <CardHeader>
                                  <CardTitle className="flex items-center gap-2">
                                    <Mail className="w-5 h-5" />
                                    Pending Challenges
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                  {demoCircleInvites.map((invite) => (
                                    <div key={invite.id} className="p-4 rounded-md border">
                                      <div className="flex items-start justify-between gap-4 flex-wrap">
                                        <div>
                                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <Badge variant={invite.isIncoming ? "default" : "secondary"}>
                                              {invite.isIncoming ? "INCOMING" : "SENT"}
                                            </Badge>
                                            <Badge variant="outline">
                                              {invite.competitionType === "targetPoints" ? "Race to Points" :
                                               invite.competitionType === "timed" ? "Timed" : "Ongoing"}
                                            </Badge>
                                            {invite.name && <span className="font-medium">{invite.name}</span>}
                                          </div>
                                          <p className="text-sm text-muted-foreground">
                                            {invite.isIncoming
                                              ? `From: ${invite.inviterCircle.name}`
                                              : `To: ${invite.inviteeCircle.name}`}
                                          </p>
                                          <p className="text-sm">
                                            {invite.competitionType === "targetPoints" && (
                                              <><Target className="w-3 h-3 inline mr-1" />Race to {invite.targetPoints.toLocaleString()} points</>
                                            )}
                                            {invite.competitionType === "timed" && invite.endDate && (
                                              <><CalendarIcon className="w-3 h-3 inline mr-1" />Ends {new Date(invite.endDate).toLocaleDateString()}</>
                                            )}
                                            {invite.competitionType === "ongoing" && (
                                              <><Flame className="w-3 h-3 inline mr-1" />Ongoing competition</>
                                            )}
                                          </p>
                                        </div>
                                        {invite.isIncoming && demoIsOwnerOrAdmin && (
                                          <div className="flex gap-2">
                                            <Button
                                              size="sm"
                                              onClick={() => {
                                                toast({ title: "Demo Mode", description: "Sign in to accept challenges" });
                                              }}
                                              data-testid={`button-demo-accept-invite-${invite.id}`}
                                            >
                                              <Check className="w-4 h-4" />
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              onClick={() => {
                                                toast({ title: "Demo Mode", description: "Sign in to decline challenges" });
                                              }}
                                              data-testid={`button-demo-decline-invite-${invite.id}`}
                                            >
                                              <X className="w-4 h-4" />
                                            </Button>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </CardContent>
                              </Card>
                            )}

                            <Card>
                              <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                  <Trophy className="w-5 h-5" />
                                  Active Competitions
                                </CardTitle>
                                <CardDescription>
                                  Race to the target points before your opponent
                                </CardDescription>
                              </CardHeader>
                              <CardContent>
                                {demoCircleCompetitions.filter(c => c.status === "active").length === 0 ? (
                                  <div className="text-center py-8 text-muted-foreground">
                                    <Swords className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    <p>No active competitions</p>
                                    <p className="text-sm mt-1">Challenge another circle to start competing!</p>
                                  </div>
                                ) : (
                                  <div className="space-y-4">
                                    {demoCircleCompetitions.filter(c => c.status === "active").map((competition) => {
                                      const isTargetPoints = competition.competitionType === "targetPoints";
                                      const myProgress = isTargetPoints 
                                        ? (competition.myPoints / competition.targetPoints) * 100
                                        : 50;
                                      const opponentProgress = isTargetPoints
                                        ? (competition.opponentPoints / competition.targetPoints) * 100
                                        : 50;
                                      const isExpanded = expandedCompetition === competition.id;
                                      const myCircleStats = demoMemberCompetitionStats[competition.id]?.[competition.myCircle.id] || [];
                                      const opponentCircleStats = demoMemberCompetitionStats[competition.id]?.[competition.opponentCircle.id] || [];
                                      
                                      const getCompetitionTypeBadge = () => {
                                        switch (competition.competitionType) {
                                          case "targetPoints":
                                            return (
                                              <Badge variant="outline">
                                                <Target className="w-3 h-3 mr-1" />
                                                {competition.targetPoints.toLocaleString()} pts goal
                                              </Badge>
                                            );
                                          case "timed":
                                            return (
                                              <Badge variant="outline">
                                                <Clock className="w-3 h-3 mr-1" />
                                                {competition.endDate ? `Ends ${new Date(competition.endDate).toLocaleDateString()}` : "Timed"}
                                              </Badge>
                                            );
                                          case "ongoing":
                                            return (
                                              <Badge variant="outline">
                                                <Flame className="w-3 h-3 mr-1" />
                                                Ongoing rivalry
                                              </Badge>
                                            );
                                          default:
                                            return (
                                              <Badge variant="outline">
                                                <Trophy className="w-3 h-3 mr-1" />
                                                Competition
                                              </Badge>
                                            );
                                        }
                                      };
                                      
                                      return (
                                        <div key={competition.id} className="rounded-md border overflow-visible">
                                          <div
                                            role="button"
                                            tabIndex={0}
                                            className="w-full p-4 text-left hover-elevate active-elevate-2 cursor-pointer"
                                            onClick={() => { setExpandedCompetition(isExpanded ? null : competition.id); setExpandedMember(null); setExpandedOpponentMember(null); }}
                                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setExpandedCompetition(isExpanded ? null : competition.id); setExpandedMember(null); setExpandedOpponentMember(null); } }}
                                            data-testid={`button-expand-competition-${competition.id}`}
                                          >
                                            <div className="flex items-center justify-between gap-4 flex-wrap">
                                              <div className="flex items-center gap-3 flex-wrap">
                                                <div>
                                                  <p className="font-medium">{competition.name || "Competition"}</p>
                                                  <p className="text-sm text-muted-foreground">
                                                    vs {competition.opponentCircle.name}
                                                  </p>
                                                </div>
                                                {getCompetitionTypeBadge()}
                                              </div>
                                              <div className="flex items-center gap-2">
                                                <span className="font-mono text-sm">
                                                  {competition.myPoints} - {competition.opponentPoints}
                                                </span>
                                                {isExpanded ? (
                                                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                                                ) : (
                                                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                                )}
                                              </div>
                                            </div>
                                            
                                            {!isExpanded && isTargetPoints && (
                                              <div className="mt-3 space-y-2">
                                                <div className="space-y-1">
                                                  <div className="flex items-center justify-between gap-2 text-sm">
                                                    <span className="font-medium">{competition.myCircle.name}</span>
                                                    <span>{competition.myPoints.toLocaleString()}</span>
                                                  </div>
                                                  <Progress value={Math.min(myProgress, 100)} className="h-2" />
                                                </div>
                                                <div className="space-y-1">
                                                  <div className="flex items-center justify-between gap-2 text-sm">
                                                    <span className="text-muted-foreground">{competition.opponentCircle.name}</span>
                                                    <span className="text-muted-foreground">{competition.opponentPoints.toLocaleString()}</span>
                                                  </div>
                                                  <Progress value={Math.min(opponentProgress, 100)} className="h-2" />
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                          
                                          {isExpanded && (
                                            <div className="px-4 pb-4 space-y-4">
                                              <Separator />
                                              
                                              <div className="grid gap-4 md:grid-cols-2">
                                                <div className="p-3 bg-muted/50 rounded-md">
                                                  <div className="flex items-center justify-between gap-2 mb-3">
                                                    <p className="font-medium text-sm">{competition.myCircle.name}</p>
                                                    <Badge variant="secondary" className="font-mono">
                                                      {competition.myPoints} pts
                                                    </Badge>
                                                  </div>
                                                  {myCircleStats.length > 0 ? (
                                                    <div className="space-y-2">
                                                      {myCircleStats.map((memberStat) => (
                                                        <div key={memberStat.memberId}>
                                                          <button
                                                            type="button"
                                                            className="w-full flex items-center justify-between text-sm py-1 hover-elevate rounded px-1"
                                                            onClick={() => setExpandedMember(expandedMember === memberStat.memberId ? null : memberStat.memberId)}
                                                            data-testid={`button-expand-member-${memberStat.memberId}`}
                                                          >
                                                            <span className="flex items-center gap-2">
                                                              {memberStat.memberName}
                                                              {memberStat.taskStats.length > 0 && (
                                                                expandedMember === memberStat.memberId 
                                                                  ? <ChevronUp className="w-3 h-3 text-muted-foreground" />
                                                                  : <ChevronDown className="w-3 h-3 text-muted-foreground" />
                                                              )}
                                                            </span>
                                                            <span className="font-mono">{memberStat.weeklyPoints}</span>
                                                          </button>
                                                          {expandedMember === memberStat.memberId && memberStat.taskStats.length > 0 && (
                                                            <div className="ml-4 mt-1 space-y-1 text-xs text-muted-foreground">
                                                              {memberStat.taskStats.map((task) => (
                                                                <div key={task.taskId} className="flex items-center justify-between gap-2">
                                                                  <span>{task.taskName} ({task.completionCount}x)</span>
                                                                  <span className="font-mono">+{task.points}</span>
                                                                </div>
                                                              ))}
                                                            </div>
                                                          )}
                                                        </div>
                                                      ))}
                                                    </div>
                                                  ) : (
                                                    <p className="text-sm text-muted-foreground">No member data available</p>
                                                  )}
                                                </div>
                                                
                                                <div className="p-3 bg-muted/50 rounded-md">
                                                  <div className="flex items-center justify-between gap-2 mb-3">
                                                    <p className="font-medium text-sm">{competition.opponentCircle.name}</p>
                                                    <Badge variant="secondary" className="font-mono">
                                                      {competition.opponentPoints} pts
                                                    </Badge>
                                                  </div>
                                                  {opponentCircleStats.length > 0 ? (
                                                    <div className="space-y-2">
                                                      {opponentCircleStats.map((memberStat) => (
                                                        <div key={memberStat.memberId}>
                                                          <button
                                                            type="button"
                                                            className="w-full flex items-center justify-between text-sm py-1 hover-elevate rounded px-1"
                                                            onClick={() => setExpandedOpponentMember(expandedOpponentMember === memberStat.memberId ? null : memberStat.memberId)}
                                                            data-testid={`button-expand-opponent-member-${memberStat.memberId}`}
                                                          >
                                                            <span className="flex items-center gap-2">
                                                              {memberStat.memberName}
                                                              {memberStat.taskStats.length > 0 && (
                                                                expandedOpponentMember === memberStat.memberId 
                                                                  ? <ChevronUp className="w-3 h-3 text-muted-foreground" />
                                                                  : <ChevronDown className="w-3 h-3 text-muted-foreground" />
                                                              )}
                                                            </span>
                                                            <span className="font-mono">{memberStat.weeklyPoints}</span>
                                                          </button>
                                                          {expandedOpponentMember === memberStat.memberId && memberStat.taskStats.length > 0 && (
                                                            <div className="ml-4 mt-1 space-y-1 text-xs text-muted-foreground">
                                                              {memberStat.taskStats.map((task) => (
                                                                <div key={task.taskId} className="flex items-center justify-between gap-2">
                                                                  <span>{task.taskName} ({task.completionCount}x)</span>
                                                                  <span className="font-mono">+{task.points}</span>
                                                                </div>
                                                              ))}
                                                            </div>
                                                          )}
                                                        </div>
                                                      ))}
                                                    </div>
                                                  ) : (
                                                    <p className="text-sm text-muted-foreground">No member data available</p>
                                                  )}
                                                </div>
                                              </div>
                                              
                                              {isTargetPoints && (
                                                <div className="space-y-2">
                                                  <div className="flex items-center justify-between gap-2 text-sm">
                                                    <span>Progress to {competition.targetPoints.toLocaleString()} pts</span>
                                                  </div>
                                                  <div className="space-y-1">
                                                    <div className="flex items-center justify-between gap-2 text-xs">
                                                      <span>{competition.myCircle.name}</span>
                                                      <span>{Math.round(myProgress)}%</span>
                                                    </div>
                                                    <Progress value={Math.min(myProgress, 100)} className="h-2" />
                                                  </div>
                                                  <div className="space-y-1">
                                                    <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                                                      <span>{competition.opponentCircle.name}</span>
                                                      <span>{Math.round(opponentProgress)}%</span>
                                                    </div>
                                                    <Progress value={Math.min(opponentProgress, 100)} className="h-2" />
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </CardContent>
                            </Card>

                            {demoCircleCompetitions.filter(c => c.status === "completed").length > 0 && (
                              <Card>
                                <CardHeader>
                                  <CardTitle className="flex items-center gap-2">
                                    <Award className="w-5 h-5" />
                                    Completed Competitions
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="space-y-3">
                                    {demoCircleCompetitions.filter(c => c.status === "completed").map((competition) => {
                                      const isWinner = competition.winnerId === selectedCircle.id;
                                      return (
                                        <div key={competition.id} className="p-4 rounded-md border">
                                          <div className="flex items-center justify-between gap-4 flex-wrap">
                                            <div>
                                              <div className="flex items-center gap-2">
                                                <p className="font-medium">{competition.name || "Competition"}</p>
                                                {isWinner ? (
                                                  <Badge className="bg-green-600">
                                                    <Trophy className="w-3 h-3 mr-1" />
                                                    Winner
                                                  </Badge>
                                                ) : (
                                                  <Badge variant="secondary">Lost</Badge>
                                                )}
                                              </div>
                                              <p className="text-sm text-muted-foreground">
                                                vs {competition.opponentCircle.name}
                                              </p>
                                            </div>
                                            <div className="text-right text-sm">
                                              <p className="font-mono">{competition.myPoints} - {competition.opponentPoints}</p>
                                              <p className="text-muted-foreground">Target: {competition.targetPoints}</p>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </CardContent>
                              </Card>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {isOwnerOrAdmin(selectedCircle.id) && (
                        <>
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <Copy className="w-5 h-5" />
                                Your Circle's Invite Code
                              </CardTitle>
                              <CardDescription>
                                Share this code with other circles to receive competition challenges
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              {selectedCircle.inviteCode ? (
                                <div className="flex items-center gap-2">
                                  <code className="flex-1 bg-muted px-4 py-2 rounded-md font-mono text-lg" data-testid="text-invite-code">
                                    {selectedCircle.inviteCode}
                                  </code>
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      navigator.clipboard.writeText(selectedCircle.inviteCode || "");
                                      toast({ title: "Copied to clipboard" });
                                    }}
                                    data-testid="button-copy-invite-code"
                                  >
                                    <Copy className="w-4 h-4" />
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  onClick={() => generateInviteCodeMutation.mutate(selectedCircle.id)}
                                  disabled={generateInviteCodeMutation.isPending}
                                  data-testid="button-generate-invite-code"
                                >
                                  {generateInviteCodeMutation.isPending ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  ) : null}
                                  Generate Invite Code
                                </Button>
                              )}
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <Swords className="w-5 h-5" />
                                Challenge Another Circle
                              </CardTitle>
                              <CardDescription>
                                Enter another circle's invite code to send them a competition challenge
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="challengeInviteCode">Opponent's Invite Code</Label>
                                <Input
                                  id="challengeInviteCode"
                                  placeholder="Enter their invite code"
                                  value={challengeInviteCode}
                                  onChange={(e) => setChallengeInviteCode(e.target.value)}
                                  data-testid="input-challenge-invite-code"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Competition Type</Label>
                                <Select
                                  value={challengeCompetitionType}
                                  onValueChange={(value) => setChallengeCompetitionType(value as CompetitionType)}
                                  data-testid="select-competition-type"
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select competition type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="targetPoints">
                                      <div className="flex items-center gap-2">
                                        <Target className="w-3 h-3" />
                                        Target Points - First to reach wins
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="timed">
                                      <div className="flex items-center gap-2">
                                        <Clock className="w-3 h-3" />
                                        Timed - Most points by end date wins
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="ongoing">
                                      <div className="flex items-center gap-2">
                                        <Flame className="w-3 h-3" />
                                        Ongoing - Continuous competition
                                      </div>
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              {challengeCompetitionType === "targetPoints" && (
                                <div className="space-y-2">
                                  <Label htmlFor="challengeTargetPoints">Target Points</Label>
                                  <Input
                                    id="challengeTargetPoints"
                                    type="number"
                                    placeholder="e.g., 1000"
                                    value={challengeTargetPoints}
                                    onChange={(e) => setChallengeTargetPoints(e.target.value)}
                                    data-testid="input-challenge-target-points"
                                  />
                                </div>
                              )}
                              {challengeCompetitionType === "timed" && (
                                <div className="space-y-2">
                                  <Label>End Date</Label>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button
                                        variant="outline"
                                        className="w-full justify-start text-left font-normal"
                                        data-testid="button-challenge-end-date"
                                      >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {challengeEndDate ? challengeEndDate.toLocaleDateString() : "Pick an end date"}
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                      <CalendarComponent
                                        mode="single"
                                        selected={challengeEndDate}
                                        onSelect={setChallengeEndDate}
                                        disabled={(date) => date < new Date()}
                                      />
                                    </PopoverContent>
                                  </Popover>
                                </div>
                              )}
                              <div className="space-y-2">
                                <Label htmlFor="challengeName">Competition Name (optional)</Label>
                                <Input
                                  id="challengeName"
                                  placeholder="e.g., Weekly Showdown"
                                  value={challengeName}
                                  onChange={(e) => setChallengeName(e.target.value)}
                                  data-testid="input-challenge-name"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="challengeNotes">Notes (optional)</Label>
                                <Textarea
                                  id="challengeNotes"
                                  placeholder="Add any rules, context, or details about this competition..."
                                  value={challengeNotes}
                                  onChange={(e) => setChallengeNotes(e.target.value)}
                                  className="min-h-[80px]"
                                  data-testid="textarea-challenge-notes"
                                />
                              </div>
                              <Button
                                onClick={() => {
                                  if (!challengeInviteCode.trim()) {
                                    toast({ title: "Please enter an invite code", variant: "destructive" });
                                    return;
                                  }
                                  if (challengeCompetitionType === "targetPoints") {
                                    const targetPoints = parseInt(challengeTargetPoints);
                                    if (!targetPoints || targetPoints <= 0) {
                                      toast({ title: "Please enter a valid target points value", variant: "destructive" });
                                      return;
                                    }
                                  }
                                  if (challengeCompetitionType === "timed" && !challengeEndDate) {
                                    toast({ title: "Please select an end date", variant: "destructive" });
                                    return;
                                  }
                                  sendCompetitionInviteMutation.mutate({
                                    circleId: selectedCircle.id,
                                    inviteeInviteCode: challengeInviteCode,
                                    targetPoints: challengeCompetitionType === "targetPoints" ? parseInt(challengeTargetPoints) : 0,
                                    name: challengeName || undefined,
                                    notes: challengeNotes || undefined,
                                  });
                                }}
                                disabled={sendCompetitionInviteMutation.isPending}
                                data-testid="button-send-challenge"
                              >
                                {sendCompetitionInviteMutation.isPending ? (
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                  <Send className="w-4 h-4 mr-2" />
                                )}
                                Send Challenge
                              </Button>
                            </CardContent>
                          </Card>
                        </>
                      )}

                      {(competitionInvitesQuery.data?.length || 0) > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Mail className="w-5 h-5" />
                              Pending Challenges
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {competitionInvitesQuery.data?.map((invite) => (
                              <div key={invite.id} className="p-4 rounded-md border">
                                <div className="flex items-start justify-between gap-4 flex-wrap">
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <Badge variant={invite.isIncoming ? "default" : "secondary"}>
                                        {invite.isIncoming ? "INCOMING" : "SENT"}
                                      </Badge>
                                      {invite.name && <span className="font-medium">{invite.name}</span>}
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                      {invite.isIncoming
                                        ? `From: ${invite.inviterCircle?.name || "Unknown"}`
                                        : `To: ${invite.inviteeCircle?.name || "Unknown"}`}
                                    </p>
                                    <p className="text-sm">
                                      <Target className="w-3 h-3 inline mr-1" />
                                      Race to {invite.targetPoints.toLocaleString()} points
                                    </p>
                                    {invite.notes && (
                                      <p className="text-sm text-muted-foreground mt-2 italic" data-testid={`text-invite-notes-${invite.id}`}>
                                        "{invite.notes}"
                                      </p>
                                    )}
                                  </div>
                                  {invite.isIncoming && isOwnerOrAdmin(selectedCircle.id) && (
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        onClick={() => respondToInviteMutation.mutate({
                                          circleId: selectedCircle.id,
                                          inviteId: invite.id,
                                          action: "accept",
                                        })}
                                        disabled={respondToInviteMutation.isPending}
                                        data-testid={`button-accept-invite-${invite.id}`}
                                      >
                                        <Check className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => respondToInviteMutation.mutate({
                                          circleId: selectedCircle.id,
                                          inviteId: invite.id,
                                          action: "decline",
                                        })}
                                        disabled={respondToInviteMutation.isPending}
                                        data-testid={`button-decline-invite-${invite.id}`}
                                      >
                                        <X className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      )}

                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Trophy className="w-5 h-5" />
                            Active Competitions
                          </CardTitle>
                          <CardDescription>
                            Race to the target points before your opponent
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          {competitionsQuery.isLoading ? (
                            <div className="flex items-center justify-center py-8">
                              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                            </div>
                          ) : (competitionsQuery.data?.filter(c => c.status === "active").length || 0) === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                              <Swords className="w-12 h-12 mx-auto mb-2 opacity-50" />
                              <p>No active competitions</p>
                              <p className="text-sm mt-1">Challenge another circle to start competing!</p>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {competitionsQuery.data?.filter(c => c.status === "active").map((competition) => {
                                const myProgress = (competition.myPoints / competition.targetPoints) * 100;
                                const opponentProgress = (competition.opponentPoints / competition.targetPoints) * 100;
                                return (
                                  <div key={competition.id} className="p-4 rounded-md border space-y-3">
                                    <div className="flex items-center justify-between gap-4 flex-wrap">
                                      <div>
                                        <p className="font-medium">{competition.name || "Competition"}</p>
                                        <p className="text-sm text-muted-foreground">
                                          vs {competition.opponentCircle.name}
                                        </p>
                                      </div>
                                      <Badge variant="outline">
                                        <Target className="w-3 h-3 mr-1" />
                                        {competition.targetPoints.toLocaleString()} pts
                                      </Badge>
                                    </div>
                                    <div className="space-y-2">
                                      <div className="flex items-center justify-between gap-2 text-sm">
                                        <span className="font-medium">{competition.myCircle.name}</span>
                                        <span>{competition.myPoints.toLocaleString()}</span>
                                      </div>
                                      <Progress value={Math.min(myProgress, 100)} className="h-2" />
                                    </div>
                                    <div className="space-y-2">
                                      <div className="flex items-center justify-between gap-2 text-sm">
                                        <span className="text-muted-foreground">{competition.opponentCircle.name}</span>
                                        <span className="text-muted-foreground">{competition.opponentPoints.toLocaleString()}</span>
                                      </div>
                                      <Progress value={Math.min(opponentProgress, 100)} className="h-2" />
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setShowOpponentLeaderboard(
                                        showOpponentLeaderboard === competition.id ? null : competition.id
                                      )}
                                      data-testid={`button-view-opponent-${competition.id}`}
                                    >
                                      <Eye className="w-4 h-4 mr-2" />
                                      {showOpponentLeaderboard === competition.id ? "Hide" : "View"} Opponent Leaderboard
                                    </Button>
                                    {showOpponentLeaderboard === competition.id && (
                                      <div className="mt-2 p-3 bg-muted rounded-md">
                                        <p className="text-sm font-medium mb-2">{competition.opponentCircle.name} Members</p>
                                        {opponentLeaderboardQuery.isLoading ? (
                                          <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (opponentLeaderboardQuery.data?.length || 0) === 0 ? (
                                          <p className="text-sm text-muted-foreground">No members found</p>
                                        ) : (
                                          <div className="space-y-1">
                                            {opponentLeaderboardQuery.data?.map((member, idx) => (
                                              <div key={member.id} className="flex items-center justify-between text-sm">
                                                <span className="flex items-center gap-2">
                                                  <span className="text-muted-foreground">{idx + 1}.</span>
                                                  {member.firstName} {member.lastName}
                                                </span>
                                                <span className="font-mono">{member.weeklyPoints}</span>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {(competitionsQuery.data?.filter(c => c.status === "completed").length || 0) > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Award className="w-5 h-5" />
                              Completed Competitions
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {competitionsQuery.data?.filter(c => c.status === "completed").map((competition) => {
                                const isWinner = competition.winnerId === selectedCircle.id;
                                return (
                                  <div key={competition.id} className="p-4 rounded-md border">
                                    <div className="flex items-center justify-between gap-4 flex-wrap">
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <p className="font-medium">{competition.name || "Competition"}</p>
                                          {isWinner ? (
                                            <Badge className="bg-green-600">
                                              <Trophy className="w-3 h-3 mr-1" />
                                              Winner
                                            </Badge>
                                          ) : (
                                            <Badge variant="secondary">Lost</Badge>
                                          )}
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                          vs {competition.opponentCircle.name}
                                        </p>
                                      </div>
                                      <div className="text-right text-sm">
                                        <p className="font-mono">{competition.myPoints} - {competition.opponentPoints}</p>
                                        <p className="text-muted-foreground">Target: {competition.targetPoints}</p>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}
                </TabsContent>

                {isOwnerOrAdmin(selectedCircle.id) && (
                  <TabsContent value="approvals" className="space-y-4 mt-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <AlertCircle className="w-5 h-5" />
                          Task Adjustment Requests
                        </CardTitle>
                        <CardDescription>
                          Review and approve task changes from members
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {pendingRequestsForCircle.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <Check className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>No pending requests</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {pendingRequestsForCircle.map((request) => (
                              <div key={request.id} className="p-4 rounded-md border">
                                <div className="flex items-start justify-between gap-4">
                                  <div>
                                    <div className="flex items-center gap-2 mb-2">
                                      <Badge variant={request.type === "add" ? "default" : request.type === "edit" ? "secondary" : "destructive"}>
                                        {request.type.toUpperCase()}
                                      </Badge>
                                      <span className="text-sm text-muted-foreground">
                                        from {request.requesterName} - {formatTime(request.createdAt)}
                                      </span>
                                    </div>
                                    <p className="font-medium">{request.taskData.name}</p>
                                    {request.taskData.value && (
                                      <p className="text-sm text-muted-foreground">
                                        {request.taskData.value} points - {request.taskData.taskType === "circle_task" ? "Circle Task" : "Per-Person"}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex gap-2">
                                    <Button size="sm" onClick={() => handleApproveRequest(request.id)} data-testid={`button-approve-${request.id}`}>
                                      <Check className="w-4 h-4" />
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => handleRejectRequest(request.id)} data-testid={`button-reject-${request.id}`}>
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                )}
              </Tabs>
            </div>
          )}
        </TabsContent>

        <TabsContent value="feed" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Share an Update</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="What's on your mind? Share your progress..."
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                className="min-h-[100px]"
                data-testid="input-feed-post"
              />
              {feedPostImagePreview && (
                <div className="relative inline-block">
                  <img src={feedPostImagePreview} alt="Preview" className="max-w-xs rounded-md" />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-1 right-1 bg-background/80"
                    onClick={clearFeedPostImage}
                    data-testid="button-clear-feed-image"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                ref={feedPostFileRef}
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFeedImageUpload(file);
                }}
              />
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => feedPostFileRef.current?.click()}
                    disabled={feedPostUploading}
                    data-testid="button-attach-feed-image"
                  >
                    {feedPostUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
                  </Button>
                  <Label className="text-sm">Visibility:</Label>
                  <Select value={newPostVisibility} onValueChange={(v) => setNewPostVisibility(v as "public" | "friends")}>
                    <SelectTrigger className="w-[160px]" data-testid="select-post-visibility">
                      <SelectValue placeholder="Visibility" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="friends">Friends Only</SelectItem>
                      <SelectItem value="public">Public</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreateFeedPost} data-testid="button-post-feed">
                  Post
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between gap-4 flex-wrap">
            <span className="text-sm text-muted-foreground">Filter posts:</span>
            <div className="flex gap-1">
              <Button
                variant={feedViewFilter === "all" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setFeedViewFilter("all")}
                data-testid="button-feed-filter-all"
              >
                All
              </Button>
              <Button
                variant={feedViewFilter === "friends" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setFeedViewFilter("friends")}
                data-testid="button-feed-filter-friends"
              >
                <Lock className="w-3 h-3 mr-1" />
                Friends
              </Button>
              <Button
                variant={feedViewFilter === "public" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setFeedViewFilter("public")}
                data-testid="button-feed-filter-public"
              >
                <Globe className="w-3 h-3 mr-1" />
                Public
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {!isDemo && postsQuery.isLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            )}
            {!isDemo && postsQuery.isError && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                  <p>Failed to load posts. Please try again.</p>
                  <Button variant="outline" className="mt-4" onClick={() => postsQuery.refetch()}>
                    Retry
                  </Button>
                </CardContent>
              </Card>
            )}
            {displayPosts.map((post) => (
              <Card key={post.id} data-testid={`feed-post-${post.id}`}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Avatar>
                      <AvatarFallback>{post.authorName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="font-medium">{post.authorName}</span>
                        <span className="text-sm text-muted-foreground">{formatTime(post.createdAt)}</span>
                        {post.visibility === "friends" ? (
                          <Badge variant="outline" className="text-xs"><Lock className="w-3 h-3 mr-1" />Friends</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs"><Globe className="w-3 h-3 mr-1" />Public</Badge>
                        )}
                        {post.authorId === "you" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 ml-auto"
                            onClick={() => handleDeletePost(post.id)}
                            data-testid={`button-delete-post-${post.id}`}
                          >
                            <Trash2 className="w-3 h-3 text-muted-foreground" />
                          </Button>
                        )}
                      </div>
                      <p className="mt-2">{post.content}</p>
                      {post.imageUrl && (
                        <img src={post.imageUrl} alt="Post attachment" className="mt-2 max-w-md rounded-md" />
                      )}
                      <div className="flex items-center gap-4 mt-4">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleLikeFeedPost(post.id)}
                          data-testid={`button-like-${post.id}`}
                        >
                          <Heart className={`w-4 h-4 mr-1 ${post.likes.includes("you") ? "fill-red-500 text-red-500" : ""}`} />
                          {post.likes.length}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setCommentingPostId(commentingPostId === post.id ? null : post.id)}
                          data-testid={`button-comment-${post.id}`}
                        >
                          <MessageCircle className="w-4 h-4 mr-1" />
                          {post.commentCount !== undefined ? post.commentCount : post.comments.length}
                        </Button>
                      </div>
                      
                      {commentingPostId === post.id && (
                        <div className="mt-4 flex gap-2">
                          <Input
                            placeholder="Write a comment..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleAddComment(post.id)}
                            data-testid={`input-comment-${post.id}`}
                          />
                          <Button size="icon" onClick={() => handleAddComment(post.id)} data-testid={`button-submit-comment-${post.id}`}>
                            <Send className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                      
                      {post.comments.length > 0 && (
                        <div className="mt-4 space-y-3 pl-4 border-l-2 border-muted">
                          {post.comments.map((comment) => (
                            <div key={comment.id} className="flex gap-2" data-testid={`feed-comment-${comment.id}`}>
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs">{comment.authorName.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-baseline gap-2 flex-wrap">
                                  <span className="font-medium text-sm">{comment.authorName}</span>
                                  <span className="text-xs text-muted-foreground">{formatTime(comment.createdAt)}</span>
                                  {comment.authorId === "you" && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-5 w-5"
                                      onClick={() => handleDeleteComment(post.id, comment.id)}
                                      data-testid={`button-delete-comment-${comment.id}`}
                                    >
                                      <Trash2 className="w-3 h-3 text-muted-foreground" />
                                    </Button>
                                  )}
                                </div>
                                <p className="text-sm">{comment.content}</p>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-6 px-2 mt-1"
                                  onClick={() => handleLikeComment(post.id, comment.id)}
                                  data-testid={`button-like-comment-${comment.id}`}
                                >
                                  <Heart className={`w-3 h-3 mr-1 ${comment.likes.includes("you") ? "fill-red-500 text-red-500" : ""}`} />
                                  <span className="text-xs">{comment.likes.length}</span>
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {renderFriendProfile()}
      {renderDMDialog()}
      {renderCheerlineDialog()}
    </div>
  );
}
