import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, Trophy, Target, ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Circle {
  id: string;
  name: string;
  memberCount?: number;
}

interface CircleMember {
  id: string;
  userId: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  weeklyPoints?: number;
  role?: string;
}

interface Competition {
  id: string;
  name: string;
  status: string;
  startDate?: string;
  endDate?: string;
}

export default function CirclesOverviewCard() {
  const [selectedCircleId, setSelectedCircleId] = useState<string | null>(null);

  const { data: circles = [], isLoading: circlesLoading } = useQuery<Circle[]>({
    queryKey: ["/api/circles"],
  });

  const selectedCircle = circles.find((c) => c.id === selectedCircleId);

  const { data: members = [], isLoading: membersLoading } = useQuery<CircleMember[]>({
    queryKey: ["/api/circles", selectedCircleId, "members"],
    enabled: !!selectedCircleId,
  });

  const { data: competitions = [] } = useQuery<Competition[]>({
    queryKey: ["/api/circles", selectedCircleId, "competitions"],
    enabled: !!selectedCircleId,
  });

  const activeCompetitions = competitions.filter((c) => c.status === "active");

  const sortedMembers = [...members].sort(
    (a, b) => (b.weeklyPoints || 0) - (a.weeklyPoints || 0)
  );

  const getInitials = (member: CircleMember) => {
    if (member.displayName) {
      return member.displayName.slice(0, 2).toUpperCase();
    }
    if (member.firstName) {
      return (member.firstName[0] + (member.lastName?.[0] || "")).toUpperCase();
    }
    return "?";
  };

  if (circlesLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
          <CardTitle className="text-sm font-medium">Circles Overview</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (circles.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
          <CardTitle className="text-sm font-medium">Circles Overview</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No circles yet. Join or create a circle to see stats here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="text-sm font-medium">Circles Overview</CardTitle>
        <Users className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Select
          value={selectedCircleId || ""}
          onValueChange={(val) => setSelectedCircleId(val)}
        >
          <SelectTrigger data-testid="select-circle">
            <SelectValue placeholder="Select a circle" />
          </SelectTrigger>
          <SelectContent>
            {circles.map((circle) => (
              <SelectItem key={circle.id} value={circle.id}>
                {circle.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedCircleId && (
          <>
            {membersLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Leaderboard</span>
                  </div>
                  <ScrollArea className="max-h-40">
                    <div className="space-y-2">
                      {sortedMembers.slice(0, 5).map((member, index) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between gap-2"
                          data-testid={`leaderboard-member-${member.id}`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground w-4">
                              {index + 1}.
                            </span>
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={member.profileImageUrl || undefined} />
                              <AvatarFallback className="text-xs">
                                {getInitials(member)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm truncate max-w-[100px]">
                              {member.displayName || member.firstName || "Member"}
                            </span>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {member.weeklyPoints || 0} pts
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                {activeCompetitions.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Active Competitions</span>
                    </div>
                    <div className="space-y-1">
                      {activeCompetitions.slice(0, 3).map((comp) => (
                        <div
                          key={comp.id}
                          className="text-sm text-muted-foreground"
                          data-testid={`competition-${comp.id}`}
                        >
                          {comp.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
