import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Settings, Sparkles } from "lucide-react";

interface WelcomeMessageProps {
  userName: string;
  message: string;
  onUpdate?: (userName: string, message: string) => void;
}

const defaultMessages = [
  "Let's start this week off right, you can do it I believe in you!",
  "Every day is a new opportunity to be better than yesterday!",
  "Stay focused and keep pushing forward!",
  "Small daily improvements lead to stunning results!",
  "You've got this! Stay focused and stay consistent!",
];

export default function WelcomeMessage({
  userName,
  message,
  onUpdate,
}: WelcomeMessageProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [nameInput, setNameInput] = useState(userName);
  const [messageInput, setMessageInput] = useState(message);

  const handleOpen = () => {
    setNameInput(userName);
    setMessageInput(message);
    setDialogOpen(true);
  };

  const handleSave = () => {
    onUpdate?.(nameInput.trim() || userName, messageInput.trim() || message);
    setDialogOpen(false);
  };

  const handleRandomMessage = () => {
    const randomIndex = Math.floor(Math.random() * defaultMessages.length);
    setMessageInput(defaultMessages[randomIndex]);
  };

  return (
    <>
      <Card className="bg-gradient-to-r from-primary/5 to-chart-1/5 border-primary/20">
        <CardContent className="py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-xl font-semibold" data-testid="text-welcome-name">
                Welcome, {userName}!
              </h1>
              <p className="text-sm text-muted-foreground" data-testid="text-welcome-message">
                {message}
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
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="encouragement">Encouragement Message</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={handleRandomMessage}
                  className="text-xs gap-1"
                >
                  <Sparkles className="h-3 w-3" />
                  Random
                </Button>
              </div>
              <Textarea
                id="encouragement"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Write something encouraging..."
                rows={3}
                className="resize-none"
                data-testid="input-encouragement"
              />
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
