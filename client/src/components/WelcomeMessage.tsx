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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Sparkles, Heart, X, ChevronDown, ChevronUp, Plus, Trash2, Shuffle } from "lucide-react";
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
  onUpdate?: (userName: string, message: string, useCustomMessage: boolean, savedMessages?: string[], selectedIndex?: number) => void;
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
  onUpdate,
  onDismissFriendMessage,
}: WelcomeMessageProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [nameInput, setNameInput] = useState(userName);
  const [messageInput, setMessageInput] = useState(message);
  const [useCustom, setUseCustom] = useState(useCustomMessage);
  const [showCheerlines, setShowCheerlines] = useState(true);
  const [savedMessages, setSavedMessages] = useState<string[]>(savedCustomMessages);
  const [newMessageInput, setNewMessageInput] = useState("");
  const [selectedIndex, setSelectedIndex] = useState<number>(selectedMessageIndex);

  const handleOpen = () => {
    setNameInput(userName);
    setMessageInput(message);
    setUseCustom(useCustomMessage);
    setSavedMessages(savedCustomMessages);
    setSelectedIndex(selectedMessageIndex);
    setNewMessageInput("");
    setDialogOpen(true);
  };

  const handleSave = () => {
    onUpdate?.(
      nameInput.trim() || userName, 
      messageInput.trim() || message, 
      useCustom,
      savedMessages,
      selectedIndex
    );
    setDialogOpen(false);
  };

  const handleAddMessage = () => {
    if (newMessageInput.trim()) {
      setSavedMessages([...savedMessages, newMessageInput.trim()]);
      setNewMessageInput("");
    }
  };

  const handleRemoveMessage = (index: number) => {
    const newMessages = savedMessages.filter((_, i) => i !== index);
    setSavedMessages(newMessages);
    if (selectedIndex === index) {
      setSelectedIndex(-1);
    } else if (selectedIndex > index) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const handleSelectMessage = (value: string) => {
    const idx = parseInt(value);
    setSelectedIndex(idx);
    if (idx >= 0 && savedMessages[idx]) {
      setMessageInput(savedMessages[idx]);
    }
  };

  const getDisplayMessage = () => {
    if (!useCustomMessage) {
      return defaultMessages[Math.floor(Math.random() * defaultMessages.length)];
    }
    if (savedCustomMessages.length > 0) {
      if (selectedMessageIndex === -1) {
        const randomIdx = Math.floor(Math.random() * savedCustomMessages.length);
        return savedCustomMessages[randomIdx];
      }
      if (selectedMessageIndex >= 0 && savedCustomMessages[selectedMessageIndex]) {
        return savedCustomMessages[selectedMessageIndex];
      }
    }
    return message;
  };

  const now = new Date();
  const validCheerlines = friendMessages.filter(m => {
    if (!m.message.trim()) return false;
    if (m.expiresAt) {
      return new Date(m.expiresAt) > now;
    }
    return true;
  });

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
                {getDisplayMessage()}
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
                  Use Custom Messages
                </Label>
                <p className="text-xs text-muted-foreground">
                  {useCustom ? "Select from your saved messages" : "A random motivational message will show each visit"}
                </p>
              </div>
              <Switch
                id="custom-toggle"
                checked={useCustom}
                onCheckedChange={setUseCustom}
                data-testid="switch-custom-message"
              />
            </div>

            {useCustom && (
              <>
                <div className="space-y-2">
                  <Label>Your Saved Messages</Label>
                  {savedMessages.length > 0 ? (
                    <ScrollArea className="max-h-32 border rounded-md p-2">
                      <div className="space-y-1">
                        {savedMessages.map((msg, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 p-2 rounded bg-muted/30"
                            data-testid={`saved-message-${idx}`}
                          >
                            <p className="text-xs flex-1 truncate">{msg}</p>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-5 w-5"
                              onClick={() => handleRemoveMessage(idx)}
                              data-testid={`button-remove-message-${idx}`}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <p className="text-xs text-muted-foreground p-2 border rounded-md">
                      No saved messages yet. Add your first one below!
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-message">Add New Message</Label>
                  <div className="flex gap-2">
                    <Textarea
                      id="new-message"
                      value={newMessageInput}
                      onChange={(e) => setNewMessageInput(e.target.value)}
                      placeholder="Write a motivational message..."
                      rows={2}
                      className="resize-none flex-1"
                      data-testid="input-new-message"
                    />
                    <Button
                      size="icon"
                      onClick={handleAddMessage}
                      disabled={!newMessageInput.trim()}
                      data-testid="button-add-message"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {savedMessages.length > 0 && (
                  <div className="space-y-2">
                    <Label>Message Selection</Label>
                    <Select
                      value={selectedIndex.toString()}
                      onValueChange={handleSelectMessage}
                    >
                      <SelectTrigger data-testid="select-message-mode">
                        <SelectValue placeholder="Choose how to display" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="-1">
                          <div className="flex items-center gap-2">
                            <Shuffle className="h-3 w-3" />
                            <span>Random from saved</span>
                          </div>
                        </SelectItem>
                        {savedMessages.map((msg, idx) => (
                          <SelectItem key={idx} value={idx.toString()}>
                            <span className="truncate max-w-[200px]">{msg.substring(0, 40)}...</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {selectedIndex === -1 
                        ? "A random message from your saved list will show each visit"
                        : "This specific message will always show"}
                    </p>
                  </div>
                )}
              </>
            )}

            {!useCustom && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="encouragement">Preview Default Messages</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      const randomIndex = Math.floor(Math.random() * defaultMessages.length);
                      setMessageInput(defaultMessages[randomIndex]);
                    }}
                    className="text-xs gap-1"
                    data-testid="button-random-message"
                  >
                    <Sparkles className="h-3 w-3" />
                    Preview Random
                  </Button>
                </div>
                <Textarea
                  id="encouragement"
                  value={messageInput}
                  readOnly
                  placeholder="Click Preview Random to see a message..."
                  rows={3}
                  className="resize-none"
                  data-testid="input-encouragement"
                />
                <p className="text-xs text-muted-foreground">
                  A random motivational message will be shown each time you visit.
                </p>
              </div>
            )}
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
