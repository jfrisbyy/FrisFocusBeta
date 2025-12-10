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
  seasonId?: string;
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
  todoPoints?: number; // Points earned from daily todo list
  penaltyPoints?: number; // Negative points from penalties (stored as negative value)
  taskNotes?: Record<string, string>; // Per-task notes (taskId -> note)
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

/**
 * Update badge progress based on completed tasks.
 * Called when a daily log is saved to update badge progress for taskCompletions badges.
 * Only counts the difference between previous and current completions.
 * @param completedTaskIds - Array of task IDs that are now completed
 * @param previousCompletedTaskIds - Array of task IDs that were previously completed for this date
 * @param tasks - Array of tasks with their names and IDs
 */
export function updateBadgeProgressForTasks(
  completedTaskIds: string[],
  previousCompletedTaskIds: string[],
  tasks: { id: string; name: string }[]
): void {
  const badges = loadBadgesFromStorage();
  if (badges.length === 0) return;

  // Create a map of task ID to task name for quick lookup
  const taskNameMap = new Map(tasks.map(t => [t.id, t.name]));
  
  // Find newly completed tasks (in current but not in previous)
  const previousSet = new Set(previousCompletedTaskIds);
  const currentSet = new Set(completedTaskIds);
  
  const newlyCompleted = completedTaskIds.filter(id => !previousSet.has(id));
  const newlyUncompleted = previousCompletedTaskIds.filter(id => !currentSet.has(id));
  
  // Get task names for newly completed/uncompleted
  const newlyCompletedNames = newlyCompleted
    .map(id => taskNameMap.get(id))
    .filter((name): name is string => !!name);
  
  const newlyUncompletedNames = newlyUncompleted
    .map(id => taskNameMap.get(id))
    .filter((name): name is string => !!name);

  let updated = false;

  for (const badge of badges) {
    // Only process badges that track task completions
    if (badge.conditionType !== "taskCompletions") continue;
    if (!badge.taskName) continue;

    // Count matching tasks that were newly completed
    const addedCount = newlyCompletedNames.filter(
      name => name.toLowerCase() === badge.taskName!.toLowerCase()
    ).length;
    
    // Count matching tasks that were uncompleted (removed)
    const removedCount = newlyUncompletedNames.filter(
      name => name.toLowerCase() === badge.taskName!.toLowerCase()
    ).length;
    
    const netChange = addedCount - removedCount;

    if (netChange !== 0) {
      // Apply net change to progress (can't go below 0)
      const newProgress = Math.max(0, (badge.currentProgress || 0) + netChange);
      badge.currentProgress = newProgress;
      updated = true;

      // Check if any levels should be marked as earned
      for (const level of badge.levels) {
        if (!level.earned && newProgress >= level.required) {
          level.earned = true;
          level.earnedAt = new Date().toISOString();
        }
      }
    }
  }

  if (updated) {
    saveBadgesToStorage(badges);
  }
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
  note?: string; // User note attached to milestone
}

export function loadMilestonesFromStorage(): StoredMilestone[] {
  return loadFromStorage<StoredMilestone[]>(STORAGE_KEYS.MILESTONES, []);
}

export function saveMilestonesToStorage(milestones: StoredMilestone[]): void {
  saveToStorage(STORAGE_KEYS.MILESTONES, milestones);
}

// ============ USER PROFILE ============
export interface StoredFriendWelcomeMessage {
  friendId: string;
  friendName: string;
  message: string;
  createdAt: string;
  expiresAt?: string; // For Cheerlines - expires after 3 days
  cheerlineId?: string; // Database ID for API cheerlines (used for dismiss)
}

export interface StoredUserProfile {
  userName: string;
  encouragementMessage: string;
  useCustomMessage?: boolean;
  friendWelcomeMessages?: StoredFriendWelcomeMessage[];
  savedCustomMessages?: string[]; // User's saved custom messages list
  selectedMessageIndex?: number; // -1 for random, or index of selected message
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
  note?: string; // User note attached to this to-do item
  penaltyEnabled?: boolean; // Whether this item deducts points if not completed
  penaltyValue?: number; // Points to deduct if not completed
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

// ============ FRIENDS (LOCAL STORAGE FOR DEMO) ============
export type VisibilityLevel = "full" | "tasks_only" | "points_only" | "hidden";

export interface StoredFriend {
  id: string;
  friendId: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
  todayPoints: number;
  weeklyPoints: number;
  totalPoints: number;
  totalFP: number;
  dayStreak: number;
  weekStreak: number;
  totalBadgesEarned: number;
  visibilityLevel: VisibilityLevel;
  hiddenTaskIds: string[]; // Tasks hidden from this friend
}

export interface StoredFriendRequest {
  id: string;
  requesterId?: string;
  addresseeId?: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
  createdAt: string;
  direction: "incoming" | "outgoing";
}

// ============ CIRCLES ============
export interface StoredCircle {
  id: string;
  name: string;
  description: string;
  iconColor: string;
  createdAt: string;
  createdBy: string;
  memberCount: number;
  dailyPointGoal?: number;
  weeklyPointGoal?: number;
  isPrivate?: boolean;
}

export interface StoredCircleMember {
  id: string;
  circleId: string;
  userId: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
  role: "owner" | "admin" | "member";
  joinedAt: string;
  weeklyPoints: number;
}

export type CircleTaskType = "per_person" | "circle_task";
export type ApprovalStatus = "approved" | "pending" | "rejected";

export interface StoredCircleTask {
  id: string;
  circleId: string;
  name: string;
  value: number;
  category?: string;
  taskType: CircleTaskType;
  createdById: string;
  requiresApproval: boolean;
  approvalStatus: ApprovalStatus;
}

export interface StoredCircleDailySubmission {
  id: string;
  circleId: string;
  userId: string;
  firstName: string;
  date: string;
  completedTaskIds: string[];
  points: number;
}

export interface StoredCircleTaskCompletion {
  id: string;
  circleId: string;
  taskId: string;
  completedById: string;
  completedByName: string;
  completedAt: string;
}

export interface StoredCircleTaskAdjustmentRequest {
  id: string;
  circleId: string;
  requesterId: string;
  requesterName: string;
  type: "add" | "edit" | "delete";
  taskData: Partial<StoredCircleTask>;
  existingTaskId?: string;
  status: ApprovalStatus;
  createdAt: string;
  reviewedById?: string;
  reviewedAt?: string;
}

export interface StoredCircleMessage {
  id: string;
  circleId: string;
  senderId: string;
  senderName: string;
  content: string;
  imageUrl?: string;
  createdAt: string;
}

export interface StoredCirclePostComment {
  id: string;
  authorId: string;
  authorName: string;
  authorProfileImageUrl?: string;
  content: string;
  createdAt: string;
  likes: string[];
}

export interface StoredCirclePost {
  id: string;
  circleId: string;
  authorId: string;
  authorName: string;
  authorProfileImageUrl?: string;
  content: string;
  imageUrl?: string;
  createdAt: string;
  likes: string[];
  comments: StoredCirclePostComment[];
}

export interface StoredDirectMessage {
  id: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  recipientName: string;
  content: string;
  imageUrl?: string;
  createdAt: string;
  read: boolean;
}

export type PostVisibility = "public" | "friends";

export interface StoredCommunityPost {
  id: string;
  authorId: string;
  authorName: string;
  authorProfileImageUrl?: string;
  content: string;
  imageUrl?: string;
  visibility: PostVisibility;
  createdAt: string;
  likes: string[];
  comments: StoredPostComment[];
  commentCount?: number;
  likeCount?: number;
  isLiked?: boolean;
}

export interface StoredPostComment {
  id: string;
  authorId: string;
  authorName: string;
  authorProfileImageUrl?: string;
  content: string;
  createdAt: string;
  likes: string[];
}

export interface StoredFriendActivity {
  friendId: string;
  recentTasks: { taskName: string; completedAt: string }[];
  todayPoints: number;
  weeklyBreakdown: { date: string; points: number }[];
  recentBadges: { name: string; earnedAt: string }[];
}

export interface StoredCircleBadge {
  id: string;
  circleId: string;
  name: string;
  description: string;
  icon: string;
  conditionType: string;
  levels: StoredBadgeLevel[];
  currentProgress?: number;
}

export interface StoredCircleLog {
  id: string;
  circleId: string;
  date: string;
  userId: string;
  firstName: string;
  completedTaskIds: string[];
  points: number;
}

const COMMUNITY_STORAGE_KEYS = {
  FRIENDS: "frisfocus_friends",
  FRIEND_REQUESTS: "frisfocus_friend_requests",
  CIRCLES: "frisfocus_circles",
  CIRCLE_MEMBERS: "frisfocus_circle_members",
  CIRCLE_TASKS: "frisfocus_circle_tasks",
  CIRCLE_BADGES: "frisfocus_circle_badges",
  CIRCLE_LOGS: "frisfocus_circle_logs",
  CIRCLE_DAILY_SUBMISSIONS: "frisfocus_circle_daily_submissions",
  CIRCLE_TASK_COMPLETIONS: "frisfocus_circle_task_completions",
  CIRCLE_TASK_REQUESTS: "frisfocus_circle_task_requests",
  CIRCLE_MESSAGES: "frisfocus_circle_messages",
  CIRCLE_POSTS: "frisfocus_circle_posts",
  DIRECT_MESSAGES: "frisfocus_direct_messages",
  COMMUNITY_POSTS: "frisfocus_community_posts",
  FRIEND_ACTIVITIES: "frisfocus_friend_activities",
} as const;

// Friends storage functions
export function loadFriendsFromStorage(): StoredFriend[] {
  return loadFromStorage<StoredFriend[]>(COMMUNITY_STORAGE_KEYS.FRIENDS, []);
}

export function saveFriendsToStorage(friends: StoredFriend[]): void {
  saveToStorage(COMMUNITY_STORAGE_KEYS.FRIENDS, friends);
}

export function loadFriendRequestsFromStorage(): StoredFriendRequest[] {
  return loadFromStorage<StoredFriendRequest[]>(COMMUNITY_STORAGE_KEYS.FRIEND_REQUESTS, []);
}

export function saveFriendRequestsToStorage(requests: StoredFriendRequest[]): void {
  saveToStorage(COMMUNITY_STORAGE_KEYS.FRIEND_REQUESTS, requests);
}

// Circles storage functions
export function loadCirclesFromStorage(): StoredCircle[] {
  return loadFromStorage<StoredCircle[]>(COMMUNITY_STORAGE_KEYS.CIRCLES, []);
}

export function saveCirclesToStorage(circles: StoredCircle[]): void {
  saveToStorage(COMMUNITY_STORAGE_KEYS.CIRCLES, circles);
}

export function loadCircleMembersFromStorage(): StoredCircleMember[] {
  return loadFromStorage<StoredCircleMember[]>(COMMUNITY_STORAGE_KEYS.CIRCLE_MEMBERS, []);
}

export function saveCircleMembersToStorage(members: StoredCircleMember[]): void {
  saveToStorage(COMMUNITY_STORAGE_KEYS.CIRCLE_MEMBERS, members);
}

export function loadCircleTasksFromStorage(): StoredCircleTask[] {
  return loadFromStorage<StoredCircleTask[]>(COMMUNITY_STORAGE_KEYS.CIRCLE_TASKS, []);
}

export function saveCircleTasksToStorage(tasks: StoredCircleTask[]): void {
  saveToStorage(COMMUNITY_STORAGE_KEYS.CIRCLE_TASKS, tasks);
}

export function loadCircleBadgesFromStorage(): StoredCircleBadge[] {
  return loadFromStorage<StoredCircleBadge[]>(COMMUNITY_STORAGE_KEYS.CIRCLE_BADGES, []);
}

export function saveCircleBadgesToStorage(badges: StoredCircleBadge[]): void {
  saveToStorage(COMMUNITY_STORAGE_KEYS.CIRCLE_BADGES, badges);
}

export function loadCircleLogsFromStorage(): StoredCircleLog[] {
  return loadFromStorage<StoredCircleLog[]>(COMMUNITY_STORAGE_KEYS.CIRCLE_LOGS, []);
}

export function saveCircleLogsToStorage(logs: StoredCircleLog[]): void {
  saveToStorage(COMMUNITY_STORAGE_KEYS.CIRCLE_LOGS, logs);
}

// Circle daily submissions
export function loadCircleDailySubmissionsFromStorage(): StoredCircleDailySubmission[] {
  return loadFromStorage<StoredCircleDailySubmission[]>(COMMUNITY_STORAGE_KEYS.CIRCLE_DAILY_SUBMISSIONS, []);
}

export function saveCircleDailySubmissionsToStorage(submissions: StoredCircleDailySubmission[]): void {
  saveToStorage(COMMUNITY_STORAGE_KEYS.CIRCLE_DAILY_SUBMISSIONS, submissions);
}

// Circle task completions (for circle tasks completed once by anyone)
export function loadCircleTaskCompletionsFromStorage(): StoredCircleTaskCompletion[] {
  return loadFromStorage<StoredCircleTaskCompletion[]>(COMMUNITY_STORAGE_KEYS.CIRCLE_TASK_COMPLETIONS, []);
}

export function saveCircleTaskCompletionsToStorage(completions: StoredCircleTaskCompletion[]): void {
  saveToStorage(COMMUNITY_STORAGE_KEYS.CIRCLE_TASK_COMPLETIONS, completions);
}

// Circle task adjustment requests
export function loadCircleTaskRequestsFromStorage(): StoredCircleTaskAdjustmentRequest[] {
  return loadFromStorage<StoredCircleTaskAdjustmentRequest[]>(COMMUNITY_STORAGE_KEYS.CIRCLE_TASK_REQUESTS, []);
}

export function saveCircleTaskRequestsToStorage(requests: StoredCircleTaskAdjustmentRequest[]): void {
  saveToStorage(COMMUNITY_STORAGE_KEYS.CIRCLE_TASK_REQUESTS, requests);
}

// Circle messages
export function loadCircleMessagesFromStorage(): StoredCircleMessage[] {
  return loadFromStorage<StoredCircleMessage[]>(COMMUNITY_STORAGE_KEYS.CIRCLE_MESSAGES, []);
}

export function saveCircleMessagesToStorage(messages: StoredCircleMessage[]): void {
  saveToStorage(COMMUNITY_STORAGE_KEYS.CIRCLE_MESSAGES, messages);
}

// Circle posts
export function loadCirclePostsFromStorage(): StoredCirclePost[] {
  return loadFromStorage<StoredCirclePost[]>(COMMUNITY_STORAGE_KEYS.CIRCLE_POSTS, []);
}

export function saveCirclePostsToStorage(posts: StoredCirclePost[]): void {
  saveToStorage(COMMUNITY_STORAGE_KEYS.CIRCLE_POSTS, posts);
}

// Direct messages
export function loadDirectMessagesFromStorage(): StoredDirectMessage[] {
  return loadFromStorage<StoredDirectMessage[]>(COMMUNITY_STORAGE_KEYS.DIRECT_MESSAGES, []);
}

export function saveDirectMessagesToStorage(messages: StoredDirectMessage[]): void {
  saveToStorage(COMMUNITY_STORAGE_KEYS.DIRECT_MESSAGES, messages);
}

// Community posts (feed)
export function loadCommunityPostsFromStorage(): StoredCommunityPost[] {
  return loadFromStorage<StoredCommunityPost[]>(COMMUNITY_STORAGE_KEYS.COMMUNITY_POSTS, []);
}

export function saveCommunityPostsToStorage(posts: StoredCommunityPost[]): void {
  saveToStorage(COMMUNITY_STORAGE_KEYS.COMMUNITY_POSTS, posts);
}

// Friend activities (for friend profile view)
export function loadFriendActivitiesFromStorage(): Record<string, StoredFriendActivity> {
  return loadFromStorage<Record<string, StoredFriendActivity>>(COMMUNITY_STORAGE_KEYS.FRIEND_ACTIVITIES, {});
}

export function saveFriendActivitiesToStorage(activities: Record<string, StoredFriendActivity>): void {
  saveToStorage(COMMUNITY_STORAGE_KEYS.FRIEND_ACTIVITIES, activities);
}

// Export storage keys for reference
export { STORAGE_KEYS, COMMUNITY_STORAGE_KEYS };
