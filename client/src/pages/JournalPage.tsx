import { useState, useEffect, useMemo } from "react";
import { format, subDays, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BookOpen,
  Calendar,
  Search,
  ChevronLeft,
  ChevronRight,
  Pencil,
  MessageSquare,
  Plus,
  Trash2,
  Folder,
  FolderPlus,
  ClipboardList,
  Settings,
  Star,
  LayoutTemplate,
  FileText,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDemo } from "@/contexts/DemoContext";
import { useAuth } from "@/hooks/useAuth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  loadJournalFromStorage,
  saveJournalToStorage,
  type StoredJournalEntry,
} from "@/lib/storage";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { UserJournalEntry, JournalFolder, JournalTemplate, JournalEntryNew, JournalTemplateField } from "@shared/schema";

type TemplateField = JournalTemplateField;

interface JournalEntry {
  id: string;
  date: string;
  title: string;
  content: string;
  createdAt: string;
}

const FOLDER_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444", "#f97316", 
  "#eab308", "#22c55e", "#14b8a6", "#06b6d4", "#3b82f6"
];

function getSampleEntries(): JournalEntry[] {
  const today = new Date();
  const yesterday = new Date(Date.now() - 86400000);
  const twoDaysAgo = new Date(Date.now() - 172800000);
  const threeDaysAgo = new Date(Date.now() - 259200000);
  const fourDaysAgo = new Date(Date.now() - 345600000);
  const fiveDaysAgo = new Date(Date.now() - 432000000);
  
  return [
    {
      id: "demo-1",
      date: format(today, "yyyy-MM-dd"),
      title: "Morning Reflection",
      content: "Great start to the day. Completed my morning meditation and had a solid workout. Feeling energized and focused for the tasks ahead.",
      createdAt: new Date(new Date().setHours(7, 30)).toISOString(),
    },
    {
      id: "demo-2",
      date: format(today, "yyyy-MM-dd"),
      title: "Evening Review",
      content: "Productive day overall. Hit 85% of my daily goal. Need to work on consistency with meal prep - skipped it again today.",
      createdAt: new Date(new Date().setHours(21, 0)).toISOString(),
    },
    {
      id: "demo-3",
      date: format(yesterday, "yyyy-MM-dd"),
      title: "Weekly Planning",
      content: "Set up goals for the week. Want to focus on maintaining my workout streak and learning something new every day.",
      createdAt: new Date(new Date(Date.now() - 86400000).setHours(9, 0)).toISOString(),
    },
    {
      id: "demo-4",
      date: format(twoDaysAgo, "yyyy-MM-dd"),
      title: "Gratitude Note",
      content: "Thankful for the progress I've made this month. The habit tracker has really helped me stay accountable.",
      createdAt: new Date(new Date(Date.now() - 172800000).setHours(20, 15)).toISOString(),
    },
    {
      id: "demo-5",
      date: format(threeDaysAgo, "yyyy-MM-dd"),
      title: "Workout Progress",
      content: "Hit a new personal record on bench press today. All those consistent sessions are paying off. Also managed to get 8 hours of sleep which really helped my recovery.",
      createdAt: new Date(new Date(Date.now() - 259200000).setHours(18, 30)).toISOString(),
    },
    {
      id: "demo-6",
      date: format(fourDaysAgo, "yyyy-MM-dd"),
      title: "Deep Work Session",
      content: "Finished a major project milestone during my deep work block. No distractions, just pure focus. The meditation practice is definitely helping with concentration.",
      createdAt: new Date(new Date(Date.now() - 345600000).setHours(14, 0)).toISOString(),
    },
    {
      id: "demo-7",
      date: format(fiveDaysAgo, "yyyy-MM-dd"),
      title: "Basketball Run Recap",
      content: "Great pickup games at the gym. Went 4-1 and felt really confident on the court. Need to work on my ball handling during skill sessions.",
      createdAt: new Date(new Date(Date.now() - 432000000).setHours(19, 45)).toISOString(),
    },
  ];
}

export default function JournalPage() {
  const { toast } = useToast();
  const { isDemo } = useDemo();
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [deleteEntry, setDeleteEntry] = useState<JournalEntry | null>(null);
  
  // Folder state
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<JournalFolder | null>(null);
  const [folderName, setFolderName] = useState("");
  const [folderColor, setFolderColor] = useState(FOLDER_COLORS[0]);
  const [deleteFolderId, setDeleteFolderId] = useState<string | null>(null);
  
  // Template state
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<JournalTemplate | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [templateColor, setTemplateColor] = useState(FOLDER_COLORS[4]);
  const [templateFields, setTemplateFields] = useState<TemplateField[]>([]);
  const [deleteTemplateId, setDeleteTemplateId] = useState<string | null>(null);
  
  // Entry type for new entries
  const [newEntryType, setNewEntryType] = useState<"journal" | "tracker">("journal");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [formFolderId, setFormFolderId] = useState<string | null>(null);
  const [formFieldValues, setFormFieldValues] = useState<Record<string, any>>({});
  
  // Sidebar state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Filter by tracker template
  const [filterTemplateId, setFilterTemplateId] = useState<string | null>(null);

  // Fetch journal folders
  const { data: folders = [] } = useQuery<JournalFolder[]>({
    queryKey: ["/api/journal/folders"],
    enabled: !!user && !isDemo,
  });

  // Fetch journal templates
  const { data: templates = [] } = useQuery<JournalTemplate[]>({
    queryKey: ["/api/journal/templates"],
    enabled: !!user && !isDemo,
  });

  // Fetch enhanced journal entries (without folder filter - always fetch all)
  const { data: enhancedEntries = [] } = useQuery<JournalEntryNew[]>({
    queryKey: ["/api/journal/entries"],
    enabled: !!user && !isDemo,
  });

  // Fetch legacy journal entries from API
  const { data: apiEntries } = useQuery<UserJournalEntry[]>({
    queryKey: ["/api/habit/journal"],
    enabled: !!user && !isDemo,
  });

  // Folder mutations
  const createFolderMutation = useMutation({
    mutationFn: async (data: { name: string; color: string }) => {
      const res = await apiRequest("POST", "/api/journal/folders", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journal/folders"] });
      setIsFolderDialogOpen(false);
      setFolderName("");
      setFolderColor(FOLDER_COLORS[0]);
      toast({ title: "Folder created" });
    },
  });

  const updateFolderMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name: string; color: string }) => {
      const res = await apiRequest("PUT", `/api/journal/folders/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journal/folders"] });
      setIsFolderDialogOpen(false);
      setEditingFolder(null);
      toast({ title: "Folder updated" });
    },
  });

  const deleteFolderMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/journal/folders/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journal/folders"] });
      if (selectedFolderId === deleteFolderId) setSelectedFolderId(null);
      setDeleteFolderId(null);
      toast({ title: "Folder deleted" });
    },
  });

  // Template mutations
  const createTemplateMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string; color: string; fields: TemplateField[] }) => {
      const res = await apiRequest("POST", "/api/journal/templates", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journal/templates"] });
      setIsTemplateDialogOpen(false);
      resetTemplateForm();
      toast({ title: "Template created" });
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name: string; description?: string; color: string; fields: TemplateField[] }) => {
      const res = await apiRequest("PUT", `/api/journal/templates/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journal/templates"] });
      setIsTemplateDialogOpen(false);
      setEditingTemplate(null);
      resetTemplateForm();
      toast({ title: "Template updated" });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/journal/templates/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journal/templates"] });
      setDeleteTemplateId(null);
      toast({ title: "Template deleted" });
    },
  });

  // Enhanced entry mutations
  const createEnhancedEntryMutation = useMutation({
    mutationFn: async (data: { 
      folderId?: string; 
      templateId?: string; 
      entryType: string;
      date: string;
      title?: string;
      content?: string;
      fieldValues?: Record<string, any>;
    }) => {
      const res = await apiRequest("POST", "/api/journal/entries", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journal/entries"] });
      setIsCreating(false);
      resetEntryForm();
      toast({ title: "Entry created" });
    },
  });

  const deleteEnhancedEntryMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/journal/entries/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journal/entries"] });
      toast({ title: "Entry deleted" });
    },
  });

  // Legacy entry mutations
  const createMutation = useMutation({
    mutationFn: async (data: { date: string; title: string; content: string }) => {
      const res = await apiRequest("POST", "/api/habit/journal", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habit/journal"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, title, content }: { id: string; title: string; content: string }) => {
      const res = await apiRequest("PUT", `/api/habit/journal/${id}`, { title, content });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habit/journal"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/habit/journal/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habit/journal"] });
    },
  });

  const resetTemplateForm = () => {
    setTemplateName("");
    setTemplateDescription("");
    setTemplateColor(FOLDER_COLORS[4]);
    setTemplateFields([]);
  };

  const resetEntryForm = () => {
    setFormTitle("");
    setFormContent("");
    setFormFolderId(null);
    setSelectedTemplateId(null);
    setFormFieldValues({});
    setNewEntryType("journal");
  };

  // Compute entries based on current state using useMemo to avoid infinite loops
  // Note: We don't include 'entries' in the dependency array to avoid circular updates
  const displayEntries = useMemo((): JournalEntry[] => {
    if (isDemo) {
      return getSampleEntries();
    }
    
    if (!user) {
      // For non-logged-in users, just return empty - they'll use entries state directly
      return [];
    }
    
    // When filtering by folder or template, use enhanced entries only
    if (selectedFolderId || filterTemplateId) {
      let filtered = enhancedEntries;
      
      // Filter by template if selected
      if (filterTemplateId) {
        filtered = filtered.filter(e => e.templateId === filterTemplateId);
      }
      
      return filtered.map((e) => ({
        id: e.id,
        date: e.date,
        title: e.title || "Untitled",
        content: e.content || (e.fieldValues ? JSON.stringify(e.fieldValues) : ""),
        createdAt: e.createdAt ? new Date(e.createdAt).toISOString() : new Date().toISOString(),
      }));
    }
    
    // For "All Entries" view - combine legacy entries AND enhanced entries
    const legacyTransformed: JournalEntry[] = (apiEntries || []).map((e) => ({
      id: e.id,
      date: e.date,
      title: e.title,
      content: e.content,
      createdAt: e.createdAt ? new Date(e.createdAt).toISOString() : new Date().toISOString(),
    }));
    
    const enhancedTransformed: JournalEntry[] = enhancedEntries.map((e) => ({
      id: e.id,
      date: e.date,
      title: e.title || "Untitled",
      content: e.content || (e.fieldValues ? JSON.stringify(e.fieldValues) : ""),
      createdAt: e.createdAt ? new Date(e.createdAt).toISOString() : new Date().toISOString(),
    }));
    
    // Combine both, avoiding duplicates by id
    const seenIds = new Set<string>();
    const combined: JournalEntry[] = [];
    
    for (const entry of [...enhancedTransformed, ...legacyTransformed]) {
      if (!seenIds.has(entry.id)) {
        seenIds.add(entry.id);
        combined.push(entry);
      }
    }
    
    return combined;
  }, [isDemo, user, apiEntries, enhancedEntries, selectedFolderId, filterTemplateId]);
  
  // For display, combine displayEntries with local entries for non-logged-in users
  const allEntries = useMemo(() => {
    // For non-logged-in, non-demo users, use the local entries state
    if (!user && !isDemo) {
      return entries;
    }
    return displayEntries;
  }, [user, isDemo, entries, displayEntries]);

  const saveEntries = (newEntries: JournalEntry[]) => {
    setEntries(newEntries);
    if (!isDemo && !user) {
      saveJournalToStorage(newEntries);
    }
  };

  const entriesPerPage = 10;
  
  const filteredEntries = allEntries.filter(entry => 
    entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    format(parseISO(entry.date), "MMMM d, yyyy").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredEntries.length / entriesPerPage);
  const paginatedEntries = filteredEntries.slice(
    currentPage * entriesPerPage,
    (currentPage + 1) * entriesPerPage
  );

  const groupedEntries = paginatedEntries.reduce((acc, entry) => {
    if (!acc[entry.date]) {
      acc[entry.date] = [];
    }
    acc[entry.date].push(entry);
    return acc;
  }, {} as Record<string, JournalEntry[]>);

  const sortedDates = Object.keys(groupedEntries).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  const handleOpenCreate = () => {
    resetEntryForm();
    setIsCreating(true);
  };

  const handleEditEntry = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setFormTitle(entry.title);
    setFormContent(entry.content);
  };

  const handleSave = async () => {
    if (newEntryType === "journal" && (!formTitle.trim() || !formContent.trim())) {
      toast({
        title: "Missing fields",
        description: "Please enter both a title and content",
        variant: "destructive",
      });
      return;
    }

    if (isCreating) {
      const now = new Date();
      const dateStr = format(now, "yyyy-MM-dd");
      
      if (user && newEntryType === "tracker" && selectedTemplateId) {
        await createEnhancedEntryMutation.mutateAsync({
          folderId: formFolderId || undefined,
          templateId: selectedTemplateId,
          entryType: "tracker",
          date: dateStr,
          title: formTitle.trim() || undefined,
          fieldValues: formFieldValues,
        });
      } else if (user) {
        try {
          await createMutation.mutateAsync({
            date: dateStr,
            title: formTitle.trim(),
            content: formContent.trim(),
          });
          toast({
            title: "Entry created",
            description: "Your journal entry has been added",
          });
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to create journal entry",
            variant: "destructive",
          });
        }
      } else {
        const newEntry: JournalEntry = {
          id: `entry-${Date.now()}`,
          date: dateStr,
          title: formTitle.trim(),
          content: formContent.trim(),
          createdAt: now.toISOString(),
        };
        saveEntries([newEntry, ...entries]);
        toast({
          title: "Entry created",
          description: "Your journal entry has been added",
        });
      }
      setIsCreating(false);
    } else if (editingEntry) {
      if (user) {
        try {
          await updateMutation.mutateAsync({
            id: editingEntry.id,
            title: formTitle.trim(),
            content: formContent.trim(),
          });
          toast({
            title: "Entry updated",
            description: `Entry "${formTitle}" has been updated`,
          });
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to update journal entry",
            variant: "destructive",
          });
        }
      } else {
        saveEntries(entries.map(e =>
          e.id === editingEntry.id 
            ? { ...e, title: formTitle.trim(), content: formContent.trim() } 
            : e
        ));
        toast({
          title: "Entry updated",
          description: `Entry "${formTitle}" has been updated`,
        });
      }
      setEditingEntry(null);
    }

    resetEntryForm();
  };

  const handleDelete = async () => {
    if (!deleteEntry) return;
    
    if (user) {
      try {
        await deleteMutation.mutateAsync(deleteEntry.id);
        toast({
          title: "Entry deleted",
          description: `"${deleteEntry.title}" has been removed`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete journal entry",
          variant: "destructive",
        });
      }
    } else {
      saveEntries(entries.filter(e => e.id !== deleteEntry.id));
      toast({
        title: "Entry deleted",
        description: `"${deleteEntry.title}" has been removed`,
      });
    }
    setDeleteEntry(null);
  };

  const handleSaveFolder = () => {
    if (!folderName.trim()) {
      toast({ title: "Folder name is required", variant: "destructive" });
      return;
    }
    if (editingFolder) {
      updateFolderMutation.mutate({ id: editingFolder.id, name: folderName, color: folderColor });
    } else {
      createFolderMutation.mutate({ name: folderName, color: folderColor });
    }
  };

  const handleSaveTemplate = () => {
    if (!templateName.trim()) {
      toast({ title: "Template name is required", variant: "destructive" });
      return;
    }
    const data = {
      name: templateName,
      description: templateDescription || undefined,
      color: templateColor,
      fields: templateFields,
    };
    if (editingTemplate) {
      updateTemplateMutation.mutate({ id: editingTemplate.id, ...data });
    } else {
      createTemplateMutation.mutate(data);
    }
  };

  const addTemplateField = () => {
    setTemplateFields([
      ...templateFields,
      {
        id: `field-${Date.now()}`,
        label: "",
        type: "text",
        required: false,
      },
    ]);
  };

  const updateTemplateField = (index: number, updates: Partial<TemplateField>) => {
    const newFields = [...templateFields];
    newFields[index] = { ...newFields[index], ...updates };
    setTemplateFields(newFields);
  };

  const removeTemplateField = (index: number) => {
    setTemplateFields(templateFields.filter((_, i) => i !== index));
  };

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  const renderTemplateFieldInput = (field: TemplateField) => {
    const value = formFieldValues[field.id] ?? "";
    
    switch (field.type) {
      case "textarea":
        return (
          <Textarea
            value={value}
            onChange={(e) => setFormFieldValues({ ...formFieldValues, [field.id]: e.target.value })}
            placeholder={field.placeholder}
            rows={3}
          />
        );
      case "number":
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => setFormFieldValues({ ...formFieldValues, [field.id]: e.target.value })}
            placeholder={field.placeholder}
            min={field.min}
            max={field.max}
          />
        );
      case "select":
        return (
          <Select
            value={value}
            onValueChange={(v) => setFormFieldValues({ ...formFieldValues, [field.id]: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((opt) => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case "toggle":
        return (
          <Switch
            checked={!!value}
            onCheckedChange={(v) => setFormFieldValues({ ...formFieldValues, [field.id]: v })}
          />
        );
      case "rating":
        return (
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <Button
                key={n}
                size="icon"
                variant={value >= n ? "default" : "outline"}
                onClick={() => setFormFieldValues({ ...formFieldValues, [field.id]: n })}
                type="button"
              >
                <Star className={`h-4 w-4 ${value >= n ? "fill-current" : ""}`} />
              </Button>
            ))}
          </div>
        );
      case "slider":
        return (
          <div className="space-y-2">
            <Slider
              value={[value || field.min || 0]}
              onValueChange={([v]) => setFormFieldValues({ ...formFieldValues, [field.id]: v })}
              min={field.min || 0}
              max={field.max || 100}
              step={1}
            />
            <div className="text-sm text-muted-foreground text-center">{value || field.min || 0}</div>
          </div>
        );
      default:
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => setFormFieldValues({ ...formFieldValues, [field.id]: e.target.value })}
            placeholder={field.placeholder}
          />
        );
    }
  };

  const uniqueDays = new Set(allEntries.map(e => e.date)).size;
  const thisWeekEntries = allEntries.filter(e => {
    const entryDate = parseISO(e.date);
    const weekAgo = subDays(new Date(), 7);
    return entryDate >= weekAgo;
  }).length;

  return (
    <div className="flex h-full">
      {user && !isDemo && (
        <div className={`border-r bg-muted/30 hidden md:block transition-all duration-200 ${isSidebarCollapsed ? "w-12" : "w-64"}`}>
          <div className="p-2 border-b flex justify-end">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              data-testid="button-toggle-sidebar"
            >
              {isSidebarCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </Button>
          </div>
          
          {!isSidebarCollapsed && (
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Folders</h3>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    setEditingFolder(null);
                    setFolderName("");
                    setFolderColor(FOLDER_COLORS[0]);
                    setIsFolderDialogOpen(true);
                  }}
                  data-testid="button-add-folder"
                >
                  <FolderPlus className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-1">
                <Button
                  variant={selectedFolderId === null && filterTemplateId === null ? "secondary" : "ghost"}
                  className="w-full justify-start gap-2"
                  onClick={() => {
                    setSelectedFolderId(null);
                    setFilterTemplateId(null);
                  }}
                  data-testid="button-folder-all"
                >
                  <BookOpen className="h-4 w-4" />
                  All Entries
                </Button>
                
                {folders.map((folder) => (
                  <div key={folder.id} className="flex items-center group">
                    <Button
                      variant={selectedFolderId === folder.id ? "secondary" : "ghost"}
                      className="flex-1 justify-start gap-2"
                      onClick={() => {
                        setSelectedFolderId(folder.id);
                        setFilterTemplateId(null);
                      }}
                      data-testid={`button-folder-${folder.id}`}
                    >
                      <Folder className="h-4 w-4" style={{ color: folder.color || undefined }} />
                      <span className="truncate">{folder.name}</span>
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="opacity-0 group-hover:opacity-100"
                      onClick={() => {
                        setEditingFolder(folder);
                        setFolderName(folder.name);
                        setFolderColor(folder.color || FOLDER_COLORS[0]);
                        setIsFolderDialogOpen(true);
                      }}
                      data-testid={`button-edit-folder-${folder.id}`}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
              
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium">Trackers</h3>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setEditingTemplate(null);
                      resetTemplateForm();
                      setIsTemplateDialogOpen(true);
                    }}
                    data-testid="button-add-template"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="space-y-1">
                  {templates.length === 0 ? (
                    <p className="text-xs text-muted-foreground px-2">No trackers yet</p>
                  ) : (
                    templates.map((template) => (
                      <div key={template.id} className="flex items-center group">
                        <Button
                          variant={filterTemplateId === template.id ? "secondary" : "ghost"}
                          className="flex-1 justify-start gap-2 text-sm"
                          onClick={() => {
                            setFilterTemplateId(template.id);
                            setSelectedFolderId(null);
                          }}
                          data-testid={`button-template-${template.id}`}
                        >
                          <LayoutTemplate className="h-4 w-4" style={{ color: template.color || undefined }} />
                          <span className="truncate">{template.name}</span>
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="opacity-0 group-hover:opacity-100"
                          onClick={() => {
                            setEditingTemplate(template);
                            setTemplateName(template.name);
                            setTemplateDescription(template.description || "");
                            setTemplateColor(template.color || FOLDER_COLORS[4]);
                            setTemplateFields(template.fields as TemplateField[] || []);
                            setIsTemplateDialogOpen(true);
                          }}
                          data-testid={`button-edit-template-${template.id}`}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="opacity-0 group-hover:opacity-100"
                          onClick={() => setDeleteTemplateId(template.id)}
                          data-testid={`button-delete-template-${template.id}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      <div className="flex-1 p-4 md:p-6 space-y-6 overflow-auto">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Journal</h2>
            <p className="text-muted-foreground text-sm">Record your thoughts and reflections</p>
          </div>
          <Button onClick={handleOpenCreate} data-testid="button-new-entry">
            <Plus className="h-4 w-4 mr-2" />
            New Entry
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <BookOpen className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Entries</p>
                  <p className="text-2xl font-mono font-bold" data-testid="text-total-entries">{allEntries.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Days with Entries</p>
                  <p className="text-2xl font-mono font-bold" data-testid="text-days-count">{uniqueDays}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">This Week</p>
                  <p className="text-2xl font-mono font-bold" data-testid="text-week-entries">{thisWeekEntries}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(0);
              }}
              placeholder="Search entries..."
              className="pl-9"
              data-testid="input-search-journal"
            />
          </div>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Journal Entries
              {searchQuery && (
                <Badge variant="secondary" className="ml-2">
                  {filteredEntries.length} results
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {sortedDates.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground" data-testid="text-no-entries">
                {searchQuery ? "No entries match your search." : "No journal entries yet. Click 'New Entry' to start."}
              </div>
            ) : (
              <div className="divide-y">
                {sortedDates.map((dateStr) => (
                  <div key={dateStr} className="px-6 py-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm font-medium">
                        {format(parseISO(dateStr), "EEEE, MMMM d, yyyy")}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {groupedEntries[dateStr].length} {groupedEntries[dateStr].length === 1 ? 'entry' : 'entries'}
                      </Badge>
                    </div>
                    <div className="space-y-3">
                      {groupedEntries[dateStr].map((entry) => (
                        <div
                          key={entry.id}
                          className="flex items-start gap-4 p-3 rounded-md bg-muted/30"
                          data-testid={`journal-entry-${entry.id}`}
                        >
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{entry.title}</span>
                              <span className="text-xs text-muted-foreground">
                                {format(parseISO(entry.createdAt), "h:mm a")}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {entry.content}
                            </p>
                          </div>

                          <div className="flex items-center gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleEditEntry(entry)}
                              data-testid={`button-edit-entry-${entry.id}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setDeleteEntry(entry)}
                              data-testid={`button-delete-entry-${entry.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              size="icon"
              variant="outline"
              onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              data-testid="button-prev-page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground px-4">
              Page {currentPage + 1} of {totalPages}
            </span>
            <Button
              size="icon"
              variant="outline"
              onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage === totalPages - 1}
              data-testid="button-next-page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Create/Edit Entry Dialog */}
      <Dialog 
        open={isCreating || !!editingEntry} 
        onOpenChange={(open) => {
          if (!open) {
            setIsCreating(false);
            setEditingEntry(null);
            resetEntryForm();
          }
        }}
      >
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isCreating ? "New Journal Entry" : "Edit Entry"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {isCreating && user && !isDemo && (
              <>
                <div className="space-y-2">
                  <Label>Entry Type</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={newEntryType === "journal" ? "default" : "outline"}
                      onClick={() => {
                        setNewEntryType("journal");
                        setSelectedTemplateId(null);
                      }}
                      type="button"
                      className="flex-1"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Journal
                    </Button>
                    <Button
                      variant={newEntryType === "tracker" ? "default" : "outline"}
                      onClick={() => setNewEntryType("tracker")}
                      type="button"
                      className="flex-1"
                    >
                      <ClipboardList className="h-4 w-4 mr-2" />
                      Tracker
                    </Button>
                  </div>
                </div>
                
                {folders.length > 0 && (
                  <div className="space-y-2">
                    <Label>Folder (optional)</Label>
                    <Select
                      value={formFolderId || "none"}
                      onValueChange={(v) => setFormFolderId(v === "none" ? null : v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="No folder" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No folder</SelectItem>
                        {folders.map((folder) => (
                          <SelectItem key={folder.id} value={folder.id}>
                            <div className="flex items-center gap-2">
                              <Folder className="h-4 w-4" style={{ color: folder.color || undefined }} />
                              {folder.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {newEntryType === "tracker" && (
                  <div className="space-y-2">
                    <Label>Template</Label>
                    {templates.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No templates created yet. Create one from the sidebar.</p>
                    ) : (
                      <Select
                        value={selectedTemplateId || ""}
                        onValueChange={setSelectedTemplateId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select template..." />
                        </SelectTrigger>
                        <SelectContent>
                          {templates.map((template) => (
                            <SelectItem key={template.id} value={template.id}>
                              <div className="flex items-center gap-2">
                                <LayoutTemplate className="h-4 w-4" style={{ color: template.color || undefined }} />
                                {template.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                )}
              </>
            )}

            {(newEntryType === "journal" || editingEntry) && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="entry-title">Title</Label>
                  <Input
                    id="entry-title"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Entry title..."
                    data-testid="input-entry-title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="entry-content">Content</Label>
                  <Textarea
                    id="entry-content"
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    placeholder="Write your thoughts..."
                    rows={5}
                    className="resize-none"
                    data-testid="input-entry-content"
                  />
                </div>
              </>
            )}

            {newEntryType === "tracker" && selectedTemplate && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tracker-title">Title (optional)</Label>
                  <Input
                    id="tracker-title"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Entry title..."
                  />
                </div>
                
                {(selectedTemplate.fields as TemplateField[] || []).map((field) => (
                  <div key={field.id} className="space-y-2">
                    <Label>
                      {field.label}
                      {field.required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    {renderTemplateFieldInput(field)}
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsCreating(false);
                setEditingEntry(null);
                resetEntryForm();
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={newEntryType === "tracker" && !selectedTemplateId}
              data-testid="button-save-entry"
            >
              {isCreating ? "Create Entry" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Folder Dialog */}
      <Dialog open={isFolderDialogOpen} onOpenChange={setIsFolderDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingFolder ? "Edit Folder" : "New Folder"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="Folder name..."
                data-testid="input-folder-name"
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {FOLDER_COLORS.map((color) => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded-md border-2 ${folderColor === color ? "border-foreground" : "border-transparent"}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFolderColor(color)}
                    type="button"
                    data-testid={`button-color-${color}`}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            {editingFolder && (
              <Button
                variant="destructive"
                onClick={() => {
                  setDeleteFolderId(editingFolder.id);
                  setIsFolderDialogOpen(false);
                }}
              >
                Delete
              </Button>
            )}
            <Button variant="outline" onClick={() => setIsFolderDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveFolder} data-testid="button-save-folder">
              {editingFolder ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tracker Dialog */}
      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? "Edit Tracker" : "New Tracker"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Template name..."
                data-testid="input-template-name"
              />
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Textarea
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                placeholder="What is this template for?"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {FOLDER_COLORS.map((color) => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded-md border-2 ${templateColor === color ? "border-foreground" : "border-transparent"}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setTemplateColor(color)}
                    type="button"
                  />
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Fields</Label>
                <Button size="sm" variant="outline" onClick={addTemplateField} type="button">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Field
                </Button>
              </div>
              
              {templateFields.length === 0 ? (
                <p className="text-sm text-muted-foreground">No fields added yet. Add fields to create a tracker template.</p>
              ) : (
                <div className="space-y-3">
                  {templateFields.map((field, index) => (
                    <div key={field.id} className="p-3 border rounded-md space-y-2">
                      <div className="flex items-center gap-2">
                        <Input
                          value={field.label}
                          onChange={(e) => updateTemplateField(index, { label: e.target.value })}
                          placeholder="Field name..."
                          className="flex-1"
                        />
                        <Select
                          value={field.type}
                          onValueChange={(v) => updateTemplateField(index, { type: v as any })}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Text</SelectItem>
                            <SelectItem value="textarea">Long Text</SelectItem>
                            <SelectItem value="number">Number</SelectItem>
                            <SelectItem value="select">Dropdown</SelectItem>
                            <SelectItem value="toggle">Toggle</SelectItem>
                            <SelectItem value="rating">Rating</SelectItem>
                            <SelectItem value="slider">Slider</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeTemplateField(index)}
                          type="button"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {field.type === "select" && (
                        <Textarea
                          defaultValue={field.options?.join(", ") || ""}
                          onBlur={(e) => updateTemplateField(index, { options: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
                          placeholder="Options (comma-separated, e.g.: Option 1, Option 2, Option 3)"
                          rows={2}
                          className="text-sm"
                        />
                      )}
                      
                      {(field.type === "number" || field.type === "slider") && (
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            value={field.min ?? ""}
                            onChange={(e) => updateTemplateField(index, { min: e.target.value ? Number(e.target.value) : undefined })}
                            placeholder="Min"
                          />
                          <Input
                            type="number"
                            value={field.max ?? ""}
                            onChange={(e) => updateTemplateField(index, { max: e.target.value ? Number(e.target.value) : undefined })}
                            placeholder="Max"
                          />
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={field.required || false}
                          onCheckedChange={(v) => updateTemplateField(index, { required: v })}
                        />
                        <Label className="text-sm">Required</Label>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTemplate} data-testid="button-save-template">
              {editingTemplate ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Entry Confirmation */}
      <AlertDialog open={!!deleteEntry} onOpenChange={(open) => !open && setDeleteEntry(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteEntry?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} data-testid="button-confirm-delete">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Folder Confirmation */}
      <AlertDialog open={!!deleteFolderId} onOpenChange={(open) => !open && setDeleteFolderId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Folder</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this folder? Entries in this folder will be moved to "All Entries".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteFolderId && deleteFolderMutation.mutate(deleteFolderId)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Template Confirmation */}
      <AlertDialog open={!!deleteTemplateId} onOpenChange={(open) => !open && setDeleteTemplateId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this template? Existing entries using this template will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteTemplateId && deleteTemplateMutation.mutate(deleteTemplateId)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
