import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Trophy, ChevronRight, Crown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";

interface CircleMember {
  id: string;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  weeklyPoints: number;
}

interface CircleData {
  id: string;
  name: string;
  description: string | null;
  memberCount: number;
  weeklyPoints: number;
  leaderboard: CircleMember[];
}

interface CirclesOverviewCardProps {
  circleId?: string;
  useMockData?: boolean;
}

const mockCircles: CircleData[] = [
  {
    id: "circle-1",
    name: "Fitness Squad",
    description: "Crushing fitness goals together",
    memberCount: 8,
    weeklyPoints: 2450,
    leaderboard: [
      { id: "u1", firstName: "Alex", lastName: "Chen", profileImageUrl: null, weeklyPoints: 385 },
      { id: "u2", firstName: "Jordan", lastName: "Lee", profileImageUrl: null, weeklyPoints: 360 },
      { id: "u3", firstName: "Sam", lastName: "Rivera", profileImageUrl: null, weeklyPoints: 340 },
    ],
  },
  {
    id: "circle-2",
    name: "Book Lovers",
    description: "Reading 30 minutes daily",
    memberCount: 5,
    weeklyPoints: 1850,
    leaderboard: [
      { id: "u4", firstName: "Maya", lastName: "Patel", profileImageUrl: null, weeklyPoints: 420 },
      { id: "u5", firstName: "Chris", lastName: "Wong", profileImageUrl: null, weeklyPoints: 380 },
      { id: "u6", firstName: "Taylor", lastName: "Kim", profileImageUrl: null, weeklyPoints: 350 },
    ],
  },
  {
    id: "circle-3",
    name: "Morning Warriors",
    description: "Early risers unite",
    memberCount: 12,
    weeklyPoints: 3200,
    leaderboard: [
      { id: "u7", firstName: "Jamie", lastName: "Smith", profileImageUrl: null, weeklyPoints: 410 },
      { id: "u8", firstName: "Riley", lastName: "Brown", profileImageUrl: null, weeklyPoints: 395 },
      { id: "u9", firstName: "Casey", lastName: "Davis", profileImageUrl: null, weeklyPoints: 370 },
    ],
  },
];

export default function CirclesOverviewCard({ circleId, useMockData = false }: CirclesOverviewCardProps) {
  const [selectedCircleId, setSelectedCircleId] = useState<string | undefined>(circleId);

  // Fetch user's circles list
  const { data: userCircles, isLoading: userCirclesLoading } = useQuery<{ id: string; name: string }[]>({
    queryKey: ["/api/circles/user"],
    enabled: !useMockData,
  });

  // Determine which circle to show - use selected, provided, or first user circle
  const effectiveCircleId = selectedCircleId || circleId || (userCircles && userCircles.length > 0 ? userCircles[0].id : undefined);

  // Fetch circle overview data
  const { data: circleData, isLoading: circleDataLoading } = useQuery<CircleData>({
    queryKey: ["/api/circles", effectiveCircleId, "overview"],
    enabled: !useMockData && !!effectiveCircleId,
  });

  const circle = useMockData
    ? mockCircles.find(c => c.id === (selectedCircleId || circleId)) || mockCircles[0]
    : circleData;

  const circlesList = useMockData ? mockCircles : userCircles;
  const hasMultipleCircles = circlesList && circlesList.length > 1;
  const isLoading = userCirclesLoading || circleDataLoading;

  // Show "no circles" message if user has no circles
  if (!useMockData && !userCirclesLoading && (!userCircles || userCircles.length === 0)) {
    return (
      <Card data-testid="card-circles-overview">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Users className="h-4 w-4" />
            Circles Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Join or create a circle to see scores and compete with friends.
          </p>
          <Button size="sm" variant="outline" asChild>
            <Link href="/community">
              <Users className="h-3 w-3 mr-1" />
              Explore Circles
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading && !useMockData) {
    return (
      <Card data-testid="card-circles-overview">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Users className="h-4 w-4" />
            Loading...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!circle) {
    return (
      <Card data-testid="card-circles-overview">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Users className="h-4 w-4" />
            Circle Not Found
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This circle could not be loaded.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid={`card-circles-overview-${circle.id}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Users className="h-4 w-4" />
            {hasMultipleCircles ? (
              <Select
                value={effectiveCircleId}
                onValueChange={setSelectedCircleId}
              >
                <SelectTrigger 
                  className="h-auto py-0 px-1 border-0 bg-transparent text-sm font-medium"
                  data-testid="select-circle"
                >
                  <SelectValue placeholder="Select circle" />
                </SelectTrigger>
                <SelectContent>
                  {circlesList.map((c) => (
                    <SelectItem 
                      key={c.id} 
                      value={c.id}
                      data-testid={`select-circle-option-${c.id}`}
                    >
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              circle.name
            )}
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {circle.memberCount} members
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-chart-1" />
            <span className="text-sm font-medium">{circle.weeklyPoints.toLocaleString()} pts</span>
          </div>
          <span className="text-xs text-muted-foreground">this week</span>
        </div>

        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground font-medium">Top 3</p>
          {circle.leaderboard.slice(0, 3).map((member, idx) => (
            <div
              key={member.id}
              className="flex items-center gap-2 p-1.5 rounded-md bg-muted/30"
              data-testid={`leaderboard-member-${member.id}`}
            >
              <span className="text-xs font-mono w-4 text-center">
                {idx === 0 ? <Crown className="h-3 w-3 text-yellow-500" /> : `${idx + 1}`}
              </span>
              <Avatar className="h-5 w-5">
                <AvatarImage src={member.profileImageUrl || undefined} />
                <AvatarFallback className="text-[10px]">
                  {member.firstName?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs flex-1 truncate">
                {member.firstName} {member.lastName?.charAt(0)}.
              </span>
              <span className="text-xs font-medium">{member.weeklyPoints}</span>
            </div>
          ))}
        </div>

        <Button
          size="sm"
          variant="ghost"
          className="w-full text-xs"
          asChild
        >
          <Link href={`/community?circle=${circle.id}`}>
            View Full Leaderboard
            <ChevronRight className="h-3 w-3 ml-1" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
