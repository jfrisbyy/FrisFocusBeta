import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Plus, Clock, Calendar, Pencil, Trash2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format, startOfWeek, addDays, subWeeks, addWeeks, parse, differenceInWeeks } from "date-fns";
import type { Appointment } from "@shared/schema";

interface DayData {
  date: string;
  dayName: string;
  points: number | null;
}

interface WeeklyTableProps {
  days: DayData[];
  onDayClick?: (date: string) => void;
  weekOffset?: number;
  onWeekChange?: (offset: number) => void;
  weekStartDate?: string; // ISO format YYYY-MM-DD
  weekEndDate?: string;   // ISO format YYYY-MM-DD
}

function getDayStatus(points: number | null) {
  if (points === null) return { color: "text-muted-foreground", dot: "bg-muted" };
  if (points >= 60) return { color: "text-chart-1", dot: "bg-chart-1" };
  if (points >= 30) return { color: "text-chart-2", dot: "bg-chart-2" };
  return { color: "text-chart-3", dot: "bg-chart-3" };
}

function formatTimeDisplay(time: string): string {
  if (!time || !time.includes(":")) return "";
  const [hours, minutes] = time.split(":").map(Number);
  if (isNaN(hours) || isNaN(minutes)) return "";
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${minutes.toString().padStart(2, "0")} ${ampm}`;
}

function getDateKeyByIndex(index: number, firstDayDate: Date): string {
  // Calculate date by adding index offset to firstDayDate - handles year boundaries correctly
  const targetDate = addDays(firstDayDate, index);
  return format(targetDate, "yyyy-MM-dd");
}

export default function WeeklyTable({ days, onDayClick, weekOffset = 0, onWeekChange, weekStartDate, weekEndDate }: WeeklyTableProps) {
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [weekPickerOpen, setWeekPickerOpen] = useState(false);
  const [newAppointment, setNewAppointment] = useState({
    title: "",
    startTime: "09:00",
    endTime: "",
    description: "",
  });

  // Use explicit ISO dates - these are required for correct year boundary handling
  const now = new Date();
  // When props not provided, derive from weekOffset to preserve week navigation
  const baseWeekStart = addWeeks(startOfWeek(now, { weekStartsOn: 1 }), weekOffset);
  const startDateStr = weekStartDate || format(baseWeekStart, "yyyy-MM-dd");
  const endDateStr = weekEndDate || format(addDays(baseWeekStart, 6), "yyyy-MM-dd");
  const firstDayDate = parse(startDateStr, "yyyy-MM-dd", now);
  const lastDayDate = parse(endDateStr, "yyyy-MM-dd", now);

  // Fetch appointments for the current week
  const { data: appointments = [] } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments", startDateStr, endDateStr],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/appointments?startDate=${startDateStr}&endDate=${endDateStr}`);
      return response.json();
    },
  });

  // Create appointment mutation
  const createMutation = useMutation({
    mutationFn: async (data: { title: string; date: string; startTime: string; endTime?: string; description?: string }) => {
      const response = await apiRequest("POST", "/api/appointments", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      setDialogOpen(false);
      setNewAppointment({ title: "", startTime: "09:00", endTime: "", description: "" });
    },
  });

  // Delete appointment mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/appointments/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
    },
  });

  // Update appointment mutation
  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; title: string; date: string; startTime: string; endTime?: string; description?: string }) => {
      const { id, ...rest } = data;
      const response = await apiRequest("PUT", `/api/appointments/${id}`, rest);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      setDialogOpen(false);
      setEditingAppointment(null);
      setNewAppointment({ title: "", startTime: "09:00", endTime: "", description: "" });
    },
  });

  const handleDayExpand = (index: number) => {
    const dateKey = getDateKeyByIndex(index, firstDayDate);
    setExpandedDate(expandedDate === dateKey ? null : dateKey);
  };

  const handleAddAppointment = (index: number) => {
    const dateKey = getDateKeyByIndex(index, firstDayDate);
    setSelectedDate(dateKey);
    setEditingAppointment(null);
    setNewAppointment({ title: "", startTime: "09:00", endTime: "", description: "" });
    setDialogOpen(true);
  };

  const handleEditAppointment = (apt: Appointment) => {
    setEditingAppointment(apt);
    setSelectedDate(apt.date);
    setNewAppointment({
      title: apt.title,
      startTime: apt.startTime || "09:00",
      endTime: apt.endTime || "",
      description: apt.description || "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!newAppointment.title.trim() || !selectedDate) return;
    
    if (editingAppointment) {
      updateMutation.mutate({
        id: editingAppointment.id,
        title: newAppointment.title,
        date: selectedDate,
        startTime: newAppointment.startTime,
        endTime: newAppointment.endTime || undefined,
        description: newAppointment.description || undefined,
      });
    } else {
      createMutation.mutate({
        title: newAppointment.title,
        date: selectedDate,
        startTime: newAppointment.startTime,
        endTime: newAppointment.endTime || undefined,
        description: newAppointment.description || undefined,
      });
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingAppointment(null);
    setNewAppointment({ title: "", startTime: "09:00", endTime: "", description: "" });
  };

  const getAppointmentsForDate = (index: number): Appointment[] => {
    const dateKey = getDateKeyByIndex(index, firstDayDate);
    return appointments.filter(apt => apt.date === dateKey);
  };

  const handleWeekSelect = (date: Date | undefined) => {
    if (!date) return;
    const selectedWeekStart = startOfWeek(date, { weekStartsOn: 1 });
    const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 });
    const newOffset = differenceInWeeks(selectedWeekStart, currentWeekStart);
    onWeekChange?.(newOffset);
    setWeekPickerOpen(false);
  };

  const weekLabel = `${format(firstDayDate, "MMM d")} - ${format(lastDayDate, "MMM d, yyyy")}`;

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <CardTitle className="text-sm font-medium">Daily Breakdown</CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onWeekChange?.(weekOffset - 1)}
                data-testid="button-prev-week"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Popover open={weekPickerOpen} onOpenChange={setWeekPickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground min-w-[140px] font-normal"
                    data-testid="button-week-picker"
                  >
                    <Calendar className="h-3 w-3 mr-1" />
                    {weekLabel}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="center">
                  <div className="p-2 border-b">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        onWeekChange?.(0);
                        setWeekPickerOpen(false);
                      }}
                      data-testid="button-go-today"
                    >
                      Today
                    </Button>
                  </div>
                  <CalendarPicker
                    mode="single"
                    selected={firstDayDate}
                    onSelect={handleWeekSelect}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onWeekChange?.(weekOffset + 1)}
                data-testid="button-next-week"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {days.map((day, index) => {
              const status = getDayStatus(day.points);
              const dateKey = getDateKeyByIndex(index, firstDayDate);
              const isExpanded = expandedDate === dateKey;
              const dayAppointments = getAppointmentsForDate(index);
              const hasAppointments = dayAppointments.length > 0;

              return (
                <Collapsible key={day.date} open={isExpanded} onOpenChange={() => handleDayExpand(index)}>
                  <div className="flex flex-col">
                    <div className="flex items-center">
                      <CollapsibleTrigger asChild>
                        <button
                          className="flex flex-1 items-center justify-between gap-4 px-6 py-3 text-left hover-elevate active-elevate-2"
                          data-testid={`row-day-${day.date}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn("h-2 w-2 rounded-full", status.dot)} />
                            <span className="text-sm font-medium">{day.dayName}</span>
                            <span className="text-xs text-muted-foreground">{day.date}</span>
                            {hasAppointments && (
                              <span className="text-xs text-muted-foreground">
                                ({dayAppointments.length})
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={cn("font-mono text-sm font-semibold", status.color)}>
                              {day.points !== null ? day.points : "—"}
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </button>
                      </CollapsibleTrigger>
                    </div>
                    <CollapsibleContent>
                      <div className="bg-muted/30 px-6 py-3 space-y-2">
                        {dayAppointments.length === 0 ? (
                          <p className="text-xs text-muted-foreground">No events</p>
                        ) : (
                          <div className="space-y-2">
                            {dayAppointments.map((apt) => {
                              const isEventExpanded = expandedEventId === apt.id;
                              const timeDisplay = formatTimeDisplay(apt.startTime);
                              const endTimeDisplay = apt.endTime ? formatTimeDisplay(apt.endTime) : "";
                              
                              return (
                                <div
                                  key={apt.id}
                                  className="bg-background rounded-md overflow-hidden"
                                  data-testid={`appointment-${apt.id}`}
                                >
                                  <div 
                                    className="flex items-center justify-between gap-2 p-2 cursor-pointer hover-elevate"
                                    onClick={() => setExpandedEventId(isEventExpanded ? null : apt.id)}
                                  >
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                      {timeDisplay && (
                                        <>
                                          <Clock className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                          <span className="text-xs text-muted-foreground">
                                            {timeDisplay}
                                            {endTimeDisplay && ` - ${endTimeDisplay}`}
                                          </span>
                                        </>
                                      )}
                                      <span className="text-sm font-medium truncate">{apt.title}</span>
                                      {apt.description && (
                                        <span className="text-xs text-muted-foreground">(has notes)</span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                      {isEventExpanded ? (
                                        <ChevronUp className="h-3 w-3 text-muted-foreground" />
                                      ) : (
                                        <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                      )}
                                    </div>
                                  </div>
                                  {isEventExpanded && (
                                    <div className="px-2 pb-2 space-y-2">
                                      {apt.description ? (
                                        <div className="text-sm text-muted-foreground bg-muted/50 rounded p-2">
                                          {apt.description}
                                        </div>
                                      ) : (
                                        <p className="text-xs text-muted-foreground italic">No notes</p>
                                      )}
                                      <div className="flex items-center gap-2">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleEditAppointment(apt);
                                          }}
                                          data-testid={`button-edit-appointment-${apt.id}`}
                                        >
                                          <Pencil className="h-3 w-3 mr-1" />
                                          Edit
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            deleteMutation.mutate(apt.id);
                                          }}
                                          disabled={deleteMutation.isPending}
                                          data-testid={`button-delete-appointment-${apt.id}`}
                                        >
                                          <Trash2 className="h-3 w-3 mr-1 text-destructive" />
                                          Delete
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => handleAddAppointment(index)}
                          data-testid={`button-add-appointment-${day.date}`}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Event
                        </Button>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {editingAppointment ? "Edit Event" : "Add Event"}
            </DialogTitle>
            <DialogDescription>
              {editingAppointment ? "Update the event details below." : "Add a new event to your schedule."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="apt-title">Title</Label>
              <Input
                id="apt-title"
                placeholder="Appointment title"
                value={newAppointment.title}
                onChange={(e) => setNewAppointment(prev => ({ ...prev, title: e.target.value }))}
                data-testid="input-appointment-title"
              />
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <div className="text-sm text-muted-foreground">{selectedDate}</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="apt-start">Start Time</Label>
                <Input
                  id="apt-start"
                  type="time"
                  value={newAppointment.startTime}
                  onChange={(e) => setNewAppointment(prev => ({ ...prev, startTime: e.target.value }))}
                  data-testid="input-appointment-start"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apt-end">End Time (optional)</Label>
                <Input
                  id="apt-end"
                  type="time"
                  value={newAppointment.endTime}
                  onChange={(e) => setNewAppointment(prev => ({ ...prev, endTime: e.target.value }))}
                  data-testid="input-appointment-end"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="apt-description">Description (optional)</Label>
              <Textarea
                id="apt-description"
                placeholder="Add details..."
                value={newAppointment.description}
                onChange={(e) => setNewAppointment(prev => ({ ...prev, description: e.target.value }))}
                data-testid="input-appointment-description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog} data-testid="button-cancel-appointment">
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!newAppointment.title.trim() || createMutation.isPending || updateMutation.isPending}
              data-testid="button-save-appointment"
            >
              {(createMutation.isPending || updateMutation.isPending) ? "Saving..." : (editingAppointment ? "Update" : "Save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
