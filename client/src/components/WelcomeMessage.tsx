import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, X, ChevronDown, ChevronUp } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { StoredFriendWelcomeMessage } from "@/lib/storage";

interface WelcomeMessageProps {
  userName: string;
  message: string;
  useCustomMessage?: boolean;
  friendMessages?: StoredFriendWelcomeMessage[];
  savedCustomMessages?: string[];
  selectedMessageIndex?: number;
  onDismissFriendMessage?: (friendId: string) => void;
}

const defaultMessages = [
  "Let's start this week off right, you can do it I believe in you!",
  "Every day is a new opportunity to be better than yesterday!",
  "Stay focused and keep pushing forward!",
  "Small daily improvements lead to stunning results!",
  "You've got this! Stay focused and stay consistent!",
  "Your consistency is your superpower!",
  "Progress, not perfection. Keep going!",
  "Today is another chance to be amazing!",
];

export default function WelcomeMessage({
  userName,
  message,
  useCustomMessage = false,
  friendMessages = [],
  savedCustomMessages = [],
  selectedMessageIndex = -1,
  onDismissFriendMessage,
}: WelcomeMessageProps) {
  const [showCheerlines, setShowCheerlines] = useState(true);
  
  const randomDefaultIndexRef = useRef(Math.floor(Math.random() * defaultMessages.length));
  const randomCustomIndexRef = useRef(Math.floor(Math.random() * 1000));

  const getDisplayMessage = () => {
    if (!useCustomMessage) {
      return defaultMessages[randomDefaultIndexRef.current % defaultMessages.length];
    }
    if (savedCustomMessages.length > 0) {
      if (selectedMessageIndex === -1) {
        return savedCustomMessages[randomCustomIndexRef.current % savedCustomMessages.length];
      }
      if (selectedMessageIndex >= 0 && savedCustomMessages[selectedMessageIndex]) {
        return savedCustomMessages[selectedMessageIndex];
      }
    }
    return message;
  };
  
  const displayMessage = getDisplayMessage();

  const now = new Date();
  const validCheerlines = friendMessages.filter(m => {
    if (!m.message.trim()) return false;
    if (m.expiresAt) {
      return new Date(m.expiresAt) > now;
    }
    return true;
  });

  return (
    <Card className="bg-gradient-to-r from-primary/5 to-chart-1/5 border-primary/20">
      <CardContent className="py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 flex-1">
            <h1 className="text-xl font-semibold" data-testid="text-welcome-name">
              Welcome, {userName}!
            </h1>
            <p className="text-sm text-muted-foreground" data-testid="text-welcome-message">
              {displayMessage}
            </p>
          </div>
        </div>

        {validCheerlines.length > 0 && (
          <div className="mt-4 pt-3 border-t border-primary/10">
            <button
              onClick={() => setShowCheerlines(!showCheerlines)}
              className="flex items-center gap-2 text-sm text-muted-foreground mb-2 hover:text-foreground transition-colors"
              data-testid="button-toggle-cheerlines"
            >
              <Heart className="h-4 w-4" />
              <span>Cheerlines ({validCheerlines.length})</span>
              {showCheerlines ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>

            {showCheerlines && (
              <ScrollArea className="max-h-32">
                <div className="space-y-2">
                  {validCheerlines.map((fm) => (
                    <div
                      key={fm.friendId}
                      className="flex items-start gap-2 p-2 rounded-md bg-background/50"
                      data-testid={`cheerline-${fm.friendId}`}
                    >
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {fm.friendName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium">{fm.friendName}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {fm.message}
                        </p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-5 w-5"
                        onClick={() => onDismissFriendMessage?.(fm.friendId)}
                        data-testid={`button-dismiss-cheerline-${fm.friendId}`}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
