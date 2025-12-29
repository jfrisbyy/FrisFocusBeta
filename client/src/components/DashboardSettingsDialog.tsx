import { useState, useEffect } from "react";
import { Settings, Sparkles, Plus, Trash2, Shuffle, ChevronUp, ChevronDown, GripVertical, Sun, Moon, Palette } from "lucide-react";
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
import type { DashboardPreferences, DashboardCardKey } from "@shared/schema";
import { dashboardCardKeys } from "@shared/schema";

type ColorScheme = "green" | "blue" | "purple" | "orange" | "rose";

const colorSchemes: { value: ColorScheme; label: string; color: string }[] = [
  { value: "green", label: "Green", color: "bg-green-500" },
  { value: "blue", label: "Blue", color: "bg-blue-500" },
  { value: "purple", label: "Purple", color: "bg-purple-500" },
  { value: "orange", label: "Orange", color: "bg-orange-500" },
  { value: "rose", label: "Rose", color: "bg-rose-500" },
];

type SiteTheme = "default" | "midnight" | "sepia" | "forest" | "ocean" | "rosegold" | "hotpink" | "peach" | "sunrise" | "aurora" | "citrus" | "orchid";

const siteThemes: { value: SiteTheme; label: string; description: string }[] = [
  { value: "default", label: "Default", description: "Standard light/dark theme" },
  { value: "midnight", label: "Midnight", description: "Deep blue tones" },
  { value: "sepia", label: "Sepia", description: "Deep warm brown" },
  { value: "forest", label: "Forest", description: "Deep green tones" },
  { value: "ocean", label: "Ocean", description: "Deep blue-gray" },
  { value: "rosegold", label: "Rose Gold", description: "Bright blush pink" },
  { value: "hotpink", label: "Hot Pink", description: "Bright vibrant pink" },
  { value: "peach", label: "Peach", description: "Bright warm peach" },
  { value: "sunrise", label: "Sunrise", description: "Deep burnt orange" },
  { value: "aurora", label: "Aurora", description: "Deep teal" },
  { value: "citrus", label: "Citrus", description: "Deep golden amber" },
  { value: "orchid", label: "Orchid", description: "Deep violet purple" },
];

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

const cardLabels: Record<DashboardCardKey, { label: string; description: string }> = {
  weekTotal: { label: "Week Total Points", description: "Show weekly points summary card" },
  streaks: { label: "Streaks", description: "Show day and week streak counters" },
  badges: { label: "Earned Badges", description: "Show badges you've earned" },
  weeklyTable: { label: "Weekly Table", description: "Show daily points breakdown" },
  alerts: { label: "Alerts", description: "Show task priority alerts" },
  weeklyTodos: { label: "Weekly To-Do List", description: "Show weekly todo items" },
  dueDates: { label: "Due Dates", description: "Show upcoming due date items" },
  boosters: { label: "Boosters", description: "Show active boosters and penalties" },
  milestones: { label: "Milestones", description: "Show milestone goals" },
  recentWeeks: { label: "Recent Weeks", description: "Show history of recent weeks" },
  circlesOverview: { label: "Circles Overview", description: "Show circles scores and leaderboard" },
  journal: { label: "Quick Journal", description: "Show quick journaling card" },
  feed: { label: "Community Feed", description: "Show recent community posts" },
  insightEngine: { label: "Insight Engine", description: "AI-powered behavior analysis and coaching" },
};

const cardKeysArray = Object.keys(cardLabels) as DashboardCardKey[];

export default function DashboardSettingsDialog({
  preferences,
  onPreferencesChange,
  welcomeSettings,
  onWelcomeSettingsChange,
  isPending = false,
}: DashboardSettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("welcome");
  
  const isLightMode = preferences.theme === "light";

  useEffect(() => {
    if (preferences.theme === "light") {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("frisfocus-theme", "light");
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("frisfocus-theme", "dark");
    }
  }, [preferences.theme]);

  useEffect(() => {
    const scheme = preferences.colorScheme || "green";
    colorSchemes.forEach(({ value }) => {
      document.documentElement.classList.remove(`scheme-${value}`);
    });
    document.documentElement.classList.add(`scheme-${scheme}`);
    localStorage.setItem("frisfocus-color-scheme", scheme);
  }, [preferences.colorScheme]);

  useEffect(() => {
    const siteTheme = preferences.siteTheme || "default";
    siteThemes.forEach(({ value }) => {
      document.documentElement.classList.remove(`theme-${value}`);
    });
    if (siteTheme !== "default") {
      document.documentElement.classList.add(`theme-${siteTheme}`);
    }
    localStorage.setItem("frisfocus-site-theme", siteTheme);
  }, [preferences.siteTheme]);

  const handleSiteThemeChange = (theme: SiteTheme) => {
    onPreferencesChange({
      ...preferences,
      siteTheme: theme,
    });
  };

  const handleColorSchemeChange = (scheme: ColorScheme) => {
    onPreferencesChange({
      ...preferences,
      colorScheme: scheme,
    });
  };

  const handleThemeToggle = (checked: boolean) => {
    onPreferencesChange({
      ...preferences,
      theme: checked ? "light" : "dark",
    });
  };

  const [nameInput, setNameInput] = useState(welcomeSettings.userName);
  const [messageInput, setMessageInput] = useState(welcomeSettings.message);
  const [useCustom, setUseCustom] = useState(welcomeSettings.useCustomMessage);
  const [savedMessages, setSavedMessages] = useState<string[]>(welcomeSettings.savedCustomMessages);
  const [newMessageInput, setNewMessageInput] = useState("");
  const [selectedIndex, setSelectedIndex] = useState<number>(welcomeSettings.selectedMessageIndex);
  const getValidCardOrder = (order: string[] | undefined): DashboardCardKey[] => {
    const existingKeys = new Set(cardKeysArray);
    const validOrder = (order || []).filter(key => existingKeys.has(key as DashboardCardKey)) as DashboardCardKey[];
    const missingKeys = cardKeysArray.filter(key => !validOrder.includes(key));
    return [...validOrder, ...missingKeys];
  };

  const [cardOrder, setCardOrder] = useState<DashboardCardKey[]>(
    getValidCardOrder(preferences.cardOrder)
  );

  useEffect(() => {
    if (open) {
      setNameInput(welcomeSettings.userName);
      setMessageInput(welcomeSettings.message);
      setUseCustom(welcomeSettings.useCustomMessage);
      setSavedMessages(welcomeSettings.savedCustomMessages);
      setSelectedIndex(welcomeSettings.selectedMessageIndex);
      setNewMessageInput("");
      setCardOrder(getValidCardOrder(preferences.cardOrder));
    }
  }, [open, welcomeSettings, preferences.cardOrder]);

  const handleCardToggle = (key: keyof DashboardPreferences) => {
    onPreferencesChange({
      ...preferences,
      [key]: !preferences[key],
    });
  };

  const handleShowAll = () => {
    const allTrue = cardKeysArray.reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {} as DashboardPreferences);
    onPreferencesChange({ ...preferences, ...allTrue });
  };

  const handleHideAll = () => {
    const allFalse = cardKeysArray.reduce((acc, key) => {
      acc[key] = false;
      return acc;
    }, {} as DashboardPreferences);
    onPreferencesChange({ ...preferences, ...allFalse });
  };

  const handleMoveCard = (key: DashboardCardKey, direction: "up" | "down") => {
    const idx = cardOrder.indexOf(key);
    if (idx === -1) return;
    const newOrder = [...cardOrder];
    if (direction === "up" && idx > 0) {
      [newOrder[idx - 1], newOrder[idx]] = [newOrder[idx], newOrder[idx - 1]];
    } else if (direction === "down" && idx < newOrder.length - 1) {
      [newOrder[idx], newOrder[idx + 1]] = [newOrder[idx + 1], newOrder[idx]];
    }
    setCardOrder(newOrder);
    onPreferencesChange({ ...preferences, cardOrder: newOrder });
  };

  const handleResetOrder = () => {
    const defaultOrder = [...dashboardCardKeys] as DashboardCardKey[];
    setCardOrder(defaultOrder);
    onPreferencesChange({ ...preferences, cardOrder: defaultOrder });
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

  const visibleCount = cardKeysArray.filter(key => preferences[key] === true).length;

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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="welcome" data-testid="tab-welcome">Welcome</TabsTrigger>
            <TabsTrigger value="cards" data-testid="tab-cards">Cards</TabsTrigger>
            <TabsTrigger value="order" data-testid="tab-order">Order</TabsTrigger>
            <TabsTrigger value="appearance" data-testid="tab-appearance">Theme</TabsTrigger>
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
                  {visibleCount} of {cardKeysArray.length} visible
                </span>
              </div>
              <div className="space-y-3">
                {cardKeysArray.map((key) => (
                  <div
                    key={key}
                    className="flex items-center justify-between gap-4"
                  >
                    <div className="flex-1">
                      <Label htmlFor={`toggle-${key}`} className="text-sm font-medium">
                        {cardLabels[key].label}
                      </Label>
                      <p className="text-xs text-muted-foreground">{cardLabels[key].description}</p>
                    </div>
                    <Switch
                      id={`toggle-${key}`}
                      checked={preferences[key] as boolean}
                      onCheckedChange={() => handleCardToggle(key)}
                      disabled={isPending}
                      data-testid={`switch-card-${key}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="order" className="flex-1 overflow-auto mt-4">
            <div className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetOrder}
                  disabled={isPending}
                  data-testid="button-reset-order"
                >
                  Reset Order
                </Button>
                <span className="text-xs text-muted-foreground self-center ml-auto">
                  Drag or use arrows to reorder
                </span>
              </div>
              <ScrollArea className="h-[300px]">
                <div className="space-y-2 pr-4">
                  {cardOrder.map((key, idx) => (
                    <div
                      key={key}
                      className="flex items-center gap-2 p-2 rounded-md bg-muted/50"
                      data-testid={`order-item-${key}`}
                    >
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <span className="text-sm font-medium">{cardLabels[key].label}</span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleMoveCard(key, "up")}
                          disabled={idx === 0 || isPending}
                          data-testid={`button-move-up-${key}`}
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleMoveCard(key, "down")}
                          disabled={idx === cardOrder.length - 1 || isPending}
                          data-testid={`button-move-down-${key}`}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="appearance" className="flex-1 overflow-auto mt-4">
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-4 p-3 rounded-md bg-muted/50">
                <div className="space-y-0.5">
                  <Label htmlFor="toggle-theme" className="text-sm font-medium flex items-center gap-2">
                    {isLightMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    Light Mode
                  </Label>
                  <p className="text-xs text-muted-foreground">Switch between dark and light themes</p>
                </div>
                <Switch
                  id="toggle-theme"
                  checked={isLightMode}
                  onCheckedChange={handleThemeToggle}
                  disabled={isPending}
                  data-testid="switch-light-mode"
                />
              </div>
              
              <div className="p-3 rounded-md bg-muted/50">
                <Label className="text-sm font-medium flex items-center gap-2 mb-2">
                  <Palette className="h-4 w-4" />
                  Color Scheme
                </Label>
                <p className="text-xs text-muted-foreground mb-3">Choose your accent color</p>
                <div className="flex gap-2 flex-wrap">
                  {colorSchemes.map(({ value, label, color }) => (
                    <button
                      key={value}
                      onClick={() => handleColorSchemeChange(value)}
                      disabled={isPending}
                      className={`w-8 h-8 rounded-full ${color} transition-all ${
                        preferences.colorScheme === value 
                          ? "ring-2 ring-offset-2 ring-offset-background ring-foreground scale-110" 
                          : "opacity-70 hover:opacity-100"
                      }`}
                      title={label}
                      data-testid={`button-scheme-${value}`}
                    />
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-md bg-muted/50">
                <Label className="text-sm font-medium flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4" />
                  Site Theme
                </Label>
                <p className="text-xs text-muted-foreground mb-3">Choose a full color palette for the entire site</p>
                <div className="grid grid-cols-1 gap-2">
                  {siteThemes.map(({ value, label, description }) => (
                    <button
                      key={value}
                      onClick={() => handleSiteThemeChange(value)}
                      disabled={isPending}
                      className={`flex items-center gap-3 p-2 rounded-md transition-all text-left ${
                        preferences.siteTheme === value 
                          ? "ring-2 ring-primary bg-primary/10" 
                          : "bg-muted/50 hover:bg-muted"
                      }`}
                      data-testid={`button-site-theme-${value}`}
                    >
                      <div className="flex-1">
                        <div className="text-sm font-medium">{label}</div>
                        <div className="text-xs text-muted-foreground">{description}</div>
                      </div>
                    </button>
                  ))}
                </div>
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
