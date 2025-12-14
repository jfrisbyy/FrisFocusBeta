import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { MessageSquare, Send, ExternalLink, ChevronRight, Globe, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface PostAuthor {
  id: string;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
}

interface FeedPost {
  id: string;
  authorId: string;
  content: string;
  imageUrl: string | null;
  visibility: string;
  createdAt: string;
  author: PostAuthor;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
}

interface FeedCardProps {
  useMockData?: boolean;
  onViewAll?: () => void;
}

const mockPosts: FeedPost[] = [
  {
    id: "mock-1",
    authorId: "user-1",
    content: "Just hit a 7-day streak! Feeling motivated to keep going.",
    imageUrl: null,
    visibility: "public",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    author: {
      id: "user-1",
      firstName: "Alex",
      lastName: "Chen",
      profileImageUrl: null,
    },
    likeCount: 5,
    commentCount: 2,
    isLiked: false,
  },
  {
    id: "mock-2",
    authorId: "user-2",
    content: "Completed all my morning habits before 7am today!",
    imageUrl: null,
    visibility: "friends",
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    author: {
      id: "user-2",
      firstName: "Jordan",
      lastName: "Lee",
      profileImageUrl: null,
    },
    likeCount: 12,
    commentCount: 4,
    isLiked: true,
  },
  {
    id: "mock-3",
    authorId: "user-3",
    content: "New personal best on my weekly points! Keep pushing everyone.",
    imageUrl: null,
    visibility: "public",
    createdAt: new Date(Date.now() - 14400000).toISOString(),
    author: {
      id: "user-3",
      firstName: "Sam",
      lastName: "Rivera",
      profileImageUrl: null,
    },
    likeCount: 8,
    commentCount: 1,
    isLiked: false,
  },
];

export default function FeedCard({ useMockData = false, onViewAll }: FeedCardProps) {
  const { toast } = useToast();
  const [newPostContent, setNewPostContent] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [viewMode, setViewMode] = useState<"public" | "friends">("public");
  const [postVisibility, setPostVisibility] = useState<"public" | "friends">("public");

  const { data: posts, isLoading: postsLoading, isError } = useQuery<FeedPost[]>({
    queryKey: ["/api/community/feed"],
    enabled: !useMockData,
    retry: 1,
  });

  const createPostMutation = useMutation({
    mutationFn: async (data: { content: string; visibility: string }) => {
      const response = await apiRequest("POST", "/api/community/posts", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/feed"] });
      setNewPostContent("");
      toast({
        title: "Posted!",
        description: "Your post has been shared with the community.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmitPost = () => {
    if (newPostContent.trim()) {
      if (useMockData) {
        toast({
          title: "Demo Mode",
          description: "Sign in to post to the community feed.",
        });
        setNewPostContent("");
      } else {
        createPostMutation.mutate({
          content: newPostContent.trim(),
          visibility: postVisibility,
        });
      }
    }
  };

  const displayPosts = useMockData ? mockPosts : (posts || []);
  
  // Filter posts based on view mode
  const filteredPosts = displayPosts.filter(post => {
    if (viewMode === "public") return post.visibility === "public";
    if (viewMode === "friends") return post.visibility === "friends";
    return true;
  });
  
  const visiblePosts = isExpanded ? filteredPosts.slice(0, 5) : filteredPosts.slice(0, 3);

  const getInitials = (firstName: string | null, lastName: string | null) => {
    const first = firstName?.charAt(0) || "";
    const last = lastName?.charAt(0) || "";
    return (first + last).toUpperCase() || "?";
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return format(date, "MMM d");
  };

  return (
    <Card data-testid="card-feed">
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageSquare className="h-4 w-4" />
          Community Feed
        </CardTitle>
        <div className="flex items-center gap-1">
          {onViewAll && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onViewAll}
              className="text-xs gap-1"
              data-testid="button-view-all-feed"
            >
              View All
              <ExternalLink className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 p-1 bg-muted rounded-md">
          <Button
            size="sm"
            variant={viewMode === "public" ? "default" : "ghost"}
            className="flex-1 gap-1 text-xs"
            onClick={() => setViewMode("public")}
            data-testid="button-feed-public"
          >
            <Globe className="h-3 w-3" />
            Public
          </Button>
          <Button
            size="sm"
            variant={viewMode === "friends" ? "default" : "ghost"}
            className="flex-1 gap-1 text-xs"
            onClick={() => setViewMode("friends")}
            data-testid="button-feed-friends"
          >
            <Users className="h-3 w-3" />
            Friends
          </Button>
        </div>

        {/* Post Input */}
        <div className="space-y-2">
          <Textarea
            placeholder="Share an update with the community..."
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            rows={2}
            className="resize-none text-sm"
            data-testid="input-new-post"
          />
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant={postVisibility === "public" ? "secondary" : "ghost"}
                className="text-xs gap-1"
                onClick={() => setPostVisibility("public")}
                data-testid="button-post-visibility-public"
              >
                <Globe className="h-3 w-3" />
                Public
              </Button>
              <Button
                size="sm"
                variant={postVisibility === "friends" ? "secondary" : "ghost"}
                className="text-xs gap-1"
                onClick={() => setPostVisibility("friends")}
                data-testid="button-post-visibility-friends"
              >
                <Users className="h-3 w-3" />
                Friends
              </Button>
            </div>
            <Button
              size="sm"
              onClick={handleSubmitPost}
              disabled={!newPostContent.trim() || createPostMutation.isPending}
              data-testid="button-submit-post"
            >
              <Send className="h-3 w-3 mr-1" />
              Post
            </Button>
          </div>
        </div>

        <div className="border-t pt-3">
          {postsLoading && !useMockData && !isError ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : isError && !useMockData ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Unable to load feed. Try again later.
            </p>
          ) : visiblePosts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {viewMode === "friends" 
                ? "No posts from friends yet. Add friends to see their updates!"
                : "No public posts yet. Be the first to share!"}
            </p>
          ) : (
            <div className="space-y-3">
              {visiblePosts.map((post) => (
                <div
                  key={post.id}
                  className="flex gap-3 p-2 rounded-md hover-elevate"
                  data-testid={`feed-post-${post.id}`}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={post.author.profileImageUrl || undefined} />
                    <AvatarFallback className="text-xs">
                      {getInitials(post.author.firstName, post.author.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">
                        {post.author.firstName} {post.author.lastName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatTimeAgo(post.createdAt)}
                      </span>
                      {post.visibility === "friends" && (
                        <Users className="h-3 w-3 text-muted-foreground" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {post.content}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span>{post.likeCount} likes</span>
                      <span>{post.commentCount} comments</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {filteredPosts.length > 3 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full mt-2 text-xs"
              data-testid="button-toggle-feed-expand"
            >
              {isExpanded ? "Show Less" : `Show ${filteredPosts.length - 3} More`}
              <ChevronRight className={`h-3 w-3 ml-1 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
