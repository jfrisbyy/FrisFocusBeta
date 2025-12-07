import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Settings, Sparkles, MessageCircle, X, ChevronDown, ChevronUp } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { StoredFriendWelcomeMessage } from "@/lib/storage";

interface WelcomeMessageProps {
  userName: string;
  message: string;
  useCustomMessage?: boolean;
  friendMessages?: StoredFriendWelcomeMessage[];
  onUpdate?: (userName: string, message: string, useCustomMessage: boolean) => void;
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
  onUpdate,
  onDismissFriendMessage,
}: WelcomeMessageProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [nameInput, setNameInput] = useState(userName);
  const [messageInput, setMessageInput] = useState(message);
  const [useCustom, setUseCustom] = useState(useCustomMessage);
  const [showFriendMessages, setShowFriendMessages] = useState(true);

  const handleOpen = () => {
    setNameInput(userName);
    setMessageInput(message);
    setUseCustom(useCustomMessage);
    setDialogOpen(true);
  };

  const handleSave = () => {
    onUpdate?.(nameInput.trim() || userName, messageInput.trim() || message, useCustom);
    setDialogOpen(false);
  };

  const handleRandomMessage = () => {
    const randomIndex = Math.floor(Math.random() * defaultMessages.length);
    setMessageInput(defaultMessages[randomIndex]);
  };

  const displayMessage = useCustomMessage ? message : (
    defaultMessages[Math.floor(Math.random() * defaultMessages.length)]
  );

  const unreadFriendMessages = friendMessages.filter(m => m.message.trim() !== "");

  return (
    <>
      <Card className="bg-gradient-to-r from-primary/5 to-chart-1/5 border-primary/20">
        <CardContent className="py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1 flex-1">
              <h1 className="text-xl font-semibold" data-testid="text-welcome-name">
                Welcome, {userName}!
              </h1>
              <p className="text-sm text-muted-foreground" data-testid="text-welcome-message">
                {useCustomMessage ? message : displayMessage}
              </p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleOpen}
              data-testid="button-edit-welcome"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>

          {unreadFriendMessages.length > 0 && (
            <div className="mt-4 pt-3 border-t border-primary/10">
              <button
                onClick={() => setShowFriendMessages(!showFriendMessages)}
                className="flex items-center gap-2 text-sm text-muted-foreground mb-2 hover:text-foreground transition-colors"
                data-testid="button-toggle-friend-messages"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Friend Messages ({unreadFriendMessages.length})</span>
                {showFriendMessages ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </button>

              {showFriendMessages && (
                <ScrollArea className="max-h-32">
                  <div className="space-y-2">
                    {unreadFriendMessages.map((fm) => (
                      <div
                        key={fm.friendId}
                        className="flex items-start gap-2 p-2 rounded-md bg-background/50"
                        data-testid={`friend-message-${fm.friendId}`}
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
                          data-testid={`button-dismiss-message-${fm.friendId}`}
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Personalize Your Welcome</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="user-name">Your Name</Label>
              <Input
                id="user-name"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Your name"
                data-testid="input-user-name"
              />
            </div>

            <div className="flex items-center justify-between gap-4 p-3 rounded-md bg-muted/50">
              <div className="space-y-0.5">
                <Label htmlFor="custom-toggle" className="text-sm font-medium">
                  Use Custom Message
                </Label>
                <p className="text-xs text-muted-foreground">
                  {useCustom ? "Your custom message will show" : "A random motivational message will show each visit"}
                </p>
              </div>
              <Switch
                id="custom-toggle"
                checked={useCustom}
                onCheckedChange={setUseCustom}
                data-testid="switch-custom-message"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="encouragement">
                  {useCustom ? "Your Custom Message" : "Message Template"}
                </Label>
                {!useCustom && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={handleRandomMessage}
                    className="text-xs gap-1"
                    data-testid="button-random-message"
                  >
                    <Sparkles className="h-3 w-3" />
                    Preview Random
                  </Button>
                )}
              </div>
              <Textarea
                id="encouragement"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder={useCustom ? "Write your custom message..." : "Preview a random message..."}
                rows={3}
                className="resize-none"
                data-testid="input-encouragement"
                disabled={!useCustom}
              />
              {!useCustom && (
                <p className="text-xs text-muted-foreground">
                  When disabled, a random motivational message will be shown each time you visit.
                </p>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} data-testid="button-save-welcome">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
