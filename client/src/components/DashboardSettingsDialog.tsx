import { useState, useEffect } from "react";
import { Settings, Sparkles, Plus, Trash2, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { DashboardPreferences } from "@shared/schema";

interface WelcomeSettings {
  userName: string;
  message: string;
  useCustomMessage: boolean;
  savedCustomMessages: string[];
  selectedMessageIndex: number;
}

interface DashboardSettingsDialogProps {
  preferences: DashboardPreferences;
  onPreferencesChange: (preferences: DashboardPreferences) => void;
  welcomeSettings: WelcomeSettings;
  onWelcomeSettingsChange: (settings: WelcomeSettings) => void;
  isPending?: boolean;
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

const cardLabels: { key: keyof DashboardPreferences; label: string; description: string }[] = [
  { key: "weekTotal", label: "Week Total Points", description: "Show weekly points summary card" },
  { key: "streaks", label: "Streaks", description: "Show day and week streak counters" },
  { key: "badges", label: "Earned Badges", description: "Show badges you've earned" },
  { key: "weeklyTable", label: "Weekly Table", description: "Show daily points breakdown" },
  { key: "alerts", label: "Alerts", description: "Show task priority alerts" },
  { key: "weeklyTodos", label: "Weekly To-Do List", description: "Show weekly todo items" },
  { key: "dueDates", label: "Due Dates", description: "Show upcoming due date items" },
  { key: "boosters", label: "Boosters", description: "Show active boosters and penalties" },
  { key: "milestones", label: "Milestones", description: "Show milestone goals" },
  { key: "recentWeeks", label: "Recent Weeks", description: "Show history of recent weeks" },
  { key: "circlesOverview", label: "Circles Overview", description: "Show circles scores and leaderboard" },
  { key: "journal", label: "Quick Journal", description: "Show quick journaling card" },
  { key: "feed", label: "Community Feed", description: "Show recent community posts" },
];

export default function DashboardSettingsDialog({
  preferences,
  onPreferencesChange,
  welcomeSettings,
  onWelcomeSettingsChange,
  isPending = false,
}: DashboardSettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("welcome");

  const [nameInput, setNameInput] = useState(welcomeSettings.userName);
  const [messageInput, setMessageInput] = useState(welcomeSettings.message);
  const [useCustom, setUseCustom] = useState(welcomeSettings.useCustomMessage);
  const [savedMessages, setSavedMessages] = useState<string[]>(welcomeSettings.savedCustomMessages);
  const [newMessageInput, setNewMessageInput] = useState("");
  const [selectedIndex, setSelectedIndex] = useState<number>(welcomeSettings.selectedMessageIndex);

  useEffect(() => {
    if (open) {
      setNameInput(welcomeSettings.userName);
      setMessageInput(welcomeSettings.message);
      setUseCustom(welcomeSettings.useCustomMessage);
      setSavedMessages(welcomeSettings.savedCustomMessages);
      setSelectedIndex(welcomeSettings.selectedMessageIndex);
      setNewMessageInput("");
    }
  }, [open, welcomeSettings]);

  const handleCardToggle = (key: keyof DashboardPreferences) => {
    onPreferencesChange({
      ...preferences,
      [key]: !preferences[key],
    });
  };

  const handleShowAll = () => {
    const allTrue = cardLabels.reduce((acc, { key }) => {
      acc[key] = true;
      return acc;
    }, {} as DashboardPreferences);
    onPreferencesChange(allTrue);
  };

  const handleHideAll = () => {
    const allFalse = cardLabels.reduce((acc, { key }) => {
      acc[key] = false;
      return acc;
    }, {} as DashboardPreferences);
    onPreferencesChange(allFalse);
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

  const handleSaveWelcome = () => {
    onWelcomeSettingsChange({
      userName: nameInput.trim() || welcomeSettings.userName,
      message: messageInput.trim() || welcomeSettings.message,
      useCustomMessage: useCustom,
      savedCustomMessages: savedMessages,
      selectedMessageIndex: selectedIndex,
    });
    setOpen(false);
  };

  const visibleCount = Object.values(preferences).filter(Boolean).length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          data-testid="button-dashboard-settings"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Dashboard Settings</DialogTitle>
          <DialogDescription>
            Customize your welcome message and dashboard layout
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="welcome" data-testid="tab-welcome">Welcome</TabsTrigger>
            <TabsTrigger value="cards" data-testid="tab-cards">Cards</TabsTrigger>
          </TabsList>

          <TabsContent value="welcome" className="flex-1 overflow-auto mt-4">
            <div className="space-y-4">
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
                  <div className="flex items-center justify-between gap-2 flex-wrap">
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
          </TabsContent>

          <TabsContent value="cards" className="flex-1 overflow-auto mt-4">
            <div className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShowAll}
                  disabled={isPending}
                  data-testid="button-show-all-cards"
                >
                  Show All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleHideAll}
                  disabled={isPending}
                  data-testid="button-hide-all-cards"
                >
                  Hide All
                </Button>
                <span className="text-xs text-muted-foreground self-center ml-auto">
                  {visibleCount} of {cardLabels.length} visible
                </span>
              </div>
              <div className="space-y-3">
                {cardLabels.map(({ key, label, description }) => (
                  <div
                    key={key}
                    className="flex items-center justify-between gap-4"
                  >
                    <div className="flex-1">
                      <Label htmlFor={`toggle-${key}`} className="text-sm font-medium">
                        {label}
                      </Label>
                      <p className="text-xs text-muted-foreground">{description}</p>
                    </div>
                    <Switch
                      id={`toggle-${key}`}
                      checked={preferences[key]}
                      onCheckedChange={() => handleCardToggle(key)}
                      disabled={isPending}
                      data-testid={`switch-card-${key}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveWelcome} data-testid="button-save-settings">
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
