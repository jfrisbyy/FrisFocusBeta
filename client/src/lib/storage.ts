/**
 * FrisFocus LocalStorage Persistence Layer
 * 
 * This module provides read/write functions for all app data types.
 * Each data type is stored under a stable key prefixed with "frisfocus_".
 */

// Storage keys
const STORAGE_KEYS = {
  TASKS: "frisfocus_tasks",
  CATEGORIES: "frisfocus_categories",
  PENALTIES: "frisfocus_penalties",
  PENALTY_BOOST: "frisfocus_penalty_boost",
  DAILY_GOAL: "frisfocus_daily_goal",
  WEEKLY_GOAL: "frisfocus_weekly_goal",
  DAILY_LOGS: "frisfocus_daily_logs",
  BADGES: "frisfocus_badges",
  JOURNAL: "frisfocus_journal",
  MILESTONES: "frisfocus_milestones",
  USER_PROFILE: "frisfocus_user_profile",
  INSIGHTS_MESSAGES: "frisfocus_insights_messages",
  ONBOARDING: "frisfocus_started",
  DAILY_TODOS: "frisfocus_daily_todos",
  WEEKLY_TODOS: "frisfocus_weekly_todos",
  DUE_DATES: "frisfocus_due_dates",
} as const;

// Generic helper to safely parse JSON from localStorage
function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored) as T;
    }
  } catch (error) {
    console.warn(`Failed to load ${key} from localStorage:`, error);
  }
  return defaultValue;
}

// Generic helper to save JSON to localStorage
function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.warn(`Failed to save ${key} to localStorage:`, error);
  }
}

// ============ TASKS ============
export interface StoredTask {
  id: string;
  name: string;
  value: number;
  category?: string;
  priority?: "mustDo" | "shouldDo" | "couldDo";
  boostEnabled?: boolean;
  boostThreshold?: number;
  boostPeriod?: "week" | "month";
  boostPoints?: number;
}

export function loadTasksFromStorage(): StoredTask[] {
  return loadFromStorage<StoredTask[]>(STORAGE_KEYS.TASKS, []);
}

export function saveTasksToStorage(tasks: StoredTask[]): void {
  saveToStorage(STORAGE_KEYS.TASKS, tasks);
}

// ============ CATEGORIES ============
export interface StoredCategory {
  id: string;
  name: string;
  color?: string;
}

export function loadCategoriesFromStorage(): StoredCategory[] {
  return loadFromStorage<StoredCategory[]>(STORAGE_KEYS.CATEGORIES, []);
}

export function saveCategoriesToStorage(categories: StoredCategory[]): void {
  saveToStorage(STORAGE_KEYS.CATEGORIES, categories);
}

// ============ PENALTIES ============
export interface StoredPenalty {
  id: string;
  name: string;
  value: number;
}

export function loadPenaltiesFromStorage(): StoredPenalty[] {
  return loadFromStorage<StoredPenalty[]>(STORAGE_KEYS.PENALTIES, []);
}

export function savePenaltiesToStorage(penalties: StoredPenalty[]): void {
  saveToStorage(STORAGE_KEYS.PENALTIES, penalties);
}

// ============ PENALTY BOOST SETTINGS ============
export interface StoredPenaltyBoost {
  enabled: boolean;
  threshold: number;
  period: "week" | "month";
  points: number;
}

export function loadPenaltyBoostFromStorage(): StoredPenaltyBoost {
  return loadFromStorage<StoredPenaltyBoost>(STORAGE_KEYS.PENALTY_BOOST, {
    enabled: false,
    threshold: 3,
    period: "week",
    points: 10,
  });
}

export function savePenaltyBoostToStorage(settings: StoredPenaltyBoost): void {
  saveToStorage(STORAGE_KEYS.PENALTY_BOOST, settings);
}

// ============ GOALS ============
export function loadDailyGoalFromStorage(): number {
  return loadFromStorage<number>(STORAGE_KEYS.DAILY_GOAL, 50);
}

export function saveDailyGoalToStorage(goal: number): void {
  saveToStorage(STORAGE_KEYS.DAILY_GOAL, goal);
}

export function loadWeeklyGoalFromStorage(): number {
  return loadFromStorage<number>(STORAGE_KEYS.WEEKLY_GOAL, 350);
}

export function saveWeeklyGoalToStorage(goal: number): void {
  saveToStorage(STORAGE_KEYS.WEEKLY_GOAL, goal);
}

// ============ DAILY LOGS ============
export interface StoredDailyLog {
  date: string; // YYYY-MM-DD format
  completedTaskIds: string[];
  notes: string;
}

export function loadDailyLogsFromStorage(): Record<string, StoredDailyLog> {
  return loadFromStorage<Record<string, StoredDailyLog>>(STORAGE_KEYS.DAILY_LOGS, {});
}

export function saveDailyLogsToStorage(logs: Record<string, StoredDailyLog>): void {
  saveToStorage(STORAGE_KEYS.DAILY_LOGS, logs);
}

export function loadDailyLogFromStorage(date: string): StoredDailyLog | null {
  const logs = loadDailyLogsFromStorage();
  return logs[date] || null;
}

export function saveDailyLogToStorage(log: StoredDailyLog): void {
  const logs = loadDailyLogsFromStorage();
  logs[log.date] = log;
  saveDailyLogsToStorage(logs);
}

// ============ BADGES ============
export interface StoredBadgeLevel {
  level: number;
  required: number;
  earned: boolean;
  earnedAt?: string;
}

export interface StoredBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  conditionType: string;
  taskName?: string;
  levels: StoredBadgeLevel[];
  currentProgress?: number;
}

export function loadBadgesFromStorage(): StoredBadge[] {
  return loadFromStorage<StoredBadge[]>(STORAGE_KEYS.BADGES, []);
}

export function saveBadgesToStorage(badges: StoredBadge[]): void {
  saveToStorage(STORAGE_KEYS.BADGES, badges);
}

// ============ JOURNAL ENTRIES ============
export interface StoredJournalEntry {
  id: string;
  date: string;
  title: string;
  content: string;
  createdAt: string;
}

export function loadJournalFromStorage(): StoredJournalEntry[] {
  return loadFromStorage<StoredJournalEntry[]>(STORAGE_KEYS.JOURNAL, []);
}

export function saveJournalToStorage(entries: StoredJournalEntry[]): void {
  saveToStorage(STORAGE_KEYS.JOURNAL, entries);
}

// ============ MILESTONES ============
export interface StoredMilestone {
  id: string;
  name: string;
  description?: string;
  points: number;
  deadline?: string;
  achieved: boolean;
  achievedAt?: string;
}

export function loadMilestonesFromStorage(): StoredMilestone[] {
  return loadFromStorage<StoredMilestone[]>(STORAGE_KEYS.MILESTONES, []);
}

export function saveMilestonesToStorage(milestones: StoredMilestone[]): void {
  saveToStorage(STORAGE_KEYS.MILESTONES, milestones);
}

// ============ USER PROFILE ============
export interface StoredUserProfile {
  userName: string;
  encouragementMessage: string;
}

export function loadUserProfileFromStorage(): StoredUserProfile {
  return loadFromStorage<StoredUserProfile>(STORAGE_KEYS.USER_PROFILE, {
    userName: "You",
    encouragementMessage: "Welcome! Set up your tasks and start logging your progress.",
  });
}

export function saveUserProfileToStorage(profile: StoredUserProfile): void {
  saveToStorage(STORAGE_KEYS.USER_PROFILE, profile);
}

// ============ AI INSIGHTS MESSAGES ============
export interface StoredAIMessage {
  role: "user" | "assistant";
  content: string;
}

export function loadInsightsMessagesFromStorage(): StoredAIMessage[] {
  return loadFromStorage<StoredAIMessage[]>(STORAGE_KEYS.INSIGHTS_MESSAGES, []);
}

export function saveInsightsMessagesToStorage(messages: StoredAIMessage[]): void {
  saveToStorage(STORAGE_KEYS.INSIGHTS_MESSAGES, messages);
}

// ============ CLEAR ALL DATA ============
/**
 * Clears all FrisFocus data from localStorage.
 * Called when user clicks "Start My Journey" to reset everything.
 */
export function clearAllFrisFocusData(): void {
  Object.values(STORAGE_KEYS).forEach((key) => {
    localStorage.removeItem(key);
  });
}

// ============ DAILY TO-DO ITEMS ============
export interface StoredTodoItem {
  id: string;
  title: string;
  pointValue: number;
  completed: boolean;
  order: number;
}

export interface StoredDailyTodoList {
  date: string; // YYYY-MM-DD format
  items: StoredTodoItem[];
  bonusEnabled: boolean;
  bonusPoints: number;
  bonusAwarded: boolean;
}

export function loadDailyTodosFromStorage(): Record<string, StoredDailyTodoList> {
  return loadFromStorage<Record<string, StoredDailyTodoList>>(STORAGE_KEYS.DAILY_TODOS, {});
}

export function saveDailyTodosToStorage(todos: Record<string, StoredDailyTodoList>): void {
  saveToStorage(STORAGE_KEYS.DAILY_TODOS, todos);
}

export function loadDailyTodoListFromStorage(date: string): StoredDailyTodoList | null {
  const todos = loadDailyTodosFromStorage();
  return todos[date] || null;
}

export function saveDailyTodoListToStorage(list: StoredDailyTodoList): void {
  const todos = loadDailyTodosFromStorage();
  todos[list.date] = list;
  saveDailyTodosToStorage(todos);
}

// ============ WEEKLY TO-DO ITEMS ============
export interface StoredWeeklyTodoList {
  weekId: string; // YYYY-WNN format (year-week number)
  items: StoredTodoItem[];
  bonusEnabled: boolean;
  bonusPoints: number;
  bonusAwarded: boolean;
}

export function loadWeeklyTodosFromStorage(): Record<string, StoredWeeklyTodoList> {
  return loadFromStorage<Record<string, StoredWeeklyTodoList>>(STORAGE_KEYS.WEEKLY_TODOS, {});
}

export function saveWeeklyTodosToStorage(todos: Record<string, StoredWeeklyTodoList>): void {
  saveToStorage(STORAGE_KEYS.WEEKLY_TODOS, todos);
}

export function loadWeeklyTodoListFromStorage(weekId: string): StoredWeeklyTodoList | null {
  const todos = loadWeeklyTodosFromStorage();
  return todos[weekId] || null;
}

export function saveWeeklyTodoListToStorage(list: StoredWeeklyTodoList): void {
  const todos = loadWeeklyTodosFromStorage();
  todos[list.weekId] = list;
  saveWeeklyTodosToStorage(todos);
}

// ============ DUE DATE ITEMS ============
export interface StoredDueDateItem {
  id: string;
  title: string;
  dueDate: string; // YYYY-MM-DD format
  pointValue: number;
  penaltyValue: number;
  status: "pending" | "completed" | "missed";
  completedAt?: string;
}

export function loadDueDatesFromStorage(): StoredDueDateItem[] {
  return loadFromStorage<StoredDueDateItem[]>(STORAGE_KEYS.DUE_DATES, []);
}

export function saveDueDatesToStorage(dueDates: StoredDueDateItem[]): void {
  saveToStorage(STORAGE_KEYS.DUE_DATES, dueDates);
}

// Helper to get week ID from date (YYYY-WNN format)
export function getWeekId(date: Date): string {
  const year = date.getFullYear();
  const oneJan = new Date(year, 0, 1);
  const dayOfYear = Math.floor((date.getTime() - oneJan.getTime()) / 86400000) + 1;
  const weekNum = Math.ceil((dayOfYear + oneJan.getDay()) / 7);
  return `${year}-W${weekNum.toString().padStart(2, '0')}`;
}

// Export storage keys for reference
export { STORAGE_KEYS };
