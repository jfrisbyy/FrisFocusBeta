import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Task priority types
export const taskPriorityEnum = z.enum(["mustDo", "shouldDo", "couldDo"]);
export type TaskPriority = z.infer<typeof taskPriorityEnum>;

// Booster rule config
export const boosterRuleSchema = z.object({
  enabled: z.boolean(),
  timesRequired: z.number().int().min(1),
  period: z.enum(["week", "month"]),
  bonusPoints: z.number().int().min(1),
});
export type BoosterRule = z.infer<typeof boosterRuleSchema>;

// Penalty rule config (for mustDo tasks)
export const penaltyRuleSchema = z.object({
  enabled: z.boolean(),
  timesThreshold: z.number().int().min(0),
  penaltyPoints: z.number().int().min(1),
  condition: z.enum(["lessThan", "moreThan"]),
});
export type PenaltyRule = z.infer<typeof penaltyRuleSchema>;

// Task schema (for frontend use)
export const taskSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  value: z.number().int(),
  category: z.string().min(1),
  priority: taskPriorityEnum,
  group: z.string().optional(),
  boosterRule: boosterRuleSchema.optional(),
  penaltyRule: penaltyRuleSchema.optional(),
  lastCompletedAt: z.string().optional(),
});
export type Task = z.infer<typeof taskSchema>;

export const insertTaskSchema = taskSchema.omit({ id: true, lastCompletedAt: true });
export type InsertTask = z.infer<typeof insertTaskSchema>;

// User settings
export const userSettingsSchema = z.object({
  userName: z.string().min(1),
  encouragementMessage: z.string(),
  dailyGoal: z.number().int().min(1),
  weeklyGoal: z.number().int().min(1),
});
export type UserSettings = z.infer<typeof userSettingsSchema>;

// Badge condition types
export const badgeConditionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("taskCompletions"),
    taskName: z.string(),
    completionsRequired: z.number().int().min(1),
  }),
  z.object({
    type: z.literal("perfectDaysStreak"),
    daysRequired: z.number().int().min(1),
  }),
  z.object({
    type: z.literal("negativeFreeStreak"),
    daysRequired: z.number().int().min(1),
  }),
  z.object({
    type: z.literal("weeklyGoalStreak"),
    weeksRequired: z.number().int().min(1),
  }),
]);
export type BadgeCondition = z.infer<typeof badgeConditionSchema>;

// Badge definition
export const badgeSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string(),
  icon: z.string(),
  condition: badgeConditionSchema,
  earned: z.boolean(),
  earnedAt: z.string().optional(),
  progress: z.number().int().min(0),
});
export type Badge = z.infer<typeof badgeSchema>;

export const insertBadgeSchema = badgeSchema.omit({ id: true, earned: true, earnedAt: true, progress: true });
export type InsertBadge = z.infer<typeof insertBadgeSchema>;

// Daily log (for journal)
export const dailyLogSchema = z.object({
  id: z.string(),
  date: z.string(),
  points: z.number().int(),
  note: z.string().optional(),
  completedTasks: z.array(z.string()),
});
export type DailyLog = z.infer<typeof dailyLogSchema>;

// Weekly summary
export const weeklySummarySchema = z.object({
  id: z.string(),
  weekStart: z.string(),
  weekEnd: z.string(),
  points: z.number().int(),
  goal: z.number().int(),
  customGoal: z.number().int().optional(),
  note: z.string().optional(),
  penaltyPoints: z.number().int(),
  metGoal: z.boolean(),
});
export type WeeklySummary = z.infer<typeof weeklySummarySchema>;

// AI conversation message
export const aiMessageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  timestamp: z.string(),
});
export type AIMessage = z.infer<typeof aiMessageSchema>;

// Streaks data
export const streaksSchema = z.object({
  dayStreak: z.number().int().min(0),
  weekStreak: z.number().int().min(0),
  longestDayStreak: z.number().int().min(0),
  longestWeekStreak: z.number().int().min(0),
});
export type Streaks = z.infer<typeof streaksSchema>;

// Alert for missing tasks
export const taskAlertSchema = z.object({
  taskId: z.string(),
  taskName: z.string(),
  priority: taskPriorityEnum,
  daysMissing: z.number().int(),
  threshold: z.number().int(),
});
export type TaskAlert = z.infer<typeof taskAlertSchema>;

// Negative booster (e.g., if done 2+ times per week, minus points)
export const negativeBoosterSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string(),
  timesThreshold: z.number().int().min(1),
  period: z.enum(["week", "month"]),
  penaltyPoints: z.number().int().min(1),
  currentCount: z.number().int().min(0),
  triggered: z.boolean(),
});
export type NegativeBooster = z.infer<typeof negativeBoosterSchema>;

export const insertNegativeBoosterSchema = negativeBoosterSchema.omit({ id: true, currentCount: true, triggered: true });
export type InsertNegativeBooster = z.infer<typeof insertNegativeBoosterSchema>;

// Milestone (non-task based achievements with points)
export const milestoneSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string(),
  points: z.number().int().min(1),
  achieved: z.boolean(),
  achievedAt: z.string().optional(),
});
export type Milestone = z.infer<typeof milestoneSchema>;

export const insertMilestoneSchema = milestoneSchema.omit({ id: true, achieved: true, achievedAt: true });
export type InsertMilestone = z.infer<typeof insertMilestoneSchema>;

// Penalty item (editable negative tasks)
export const penaltyItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  value: z.number().int().max(-1),
  category: z.string().default("Penalties"),
});
export type PenaltyItem = z.infer<typeof penaltyItemSchema>;

export const insertPenaltyItemSchema = penaltyItemSchema.omit({ id: true });
export type InsertPenaltyItem = z.infer<typeof insertPenaltyItemSchema>;

// Badge level definition
export const badgeLevelSchema = z.object({
  level: z.number().int().min(1),
  required: z.number().int().min(1),
  earned: z.boolean(),
  earnedAt: z.string().optional(),
});
export type BadgeLevel = z.infer<typeof badgeLevelSchema>;

// Badge definition with levels
export const badgeWithLevelsSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string(),
  icon: z.string(),
  conditionType: z.enum(["taskCompletions", "perfectDaysStreak", "negativeFreeStreak", "weeklyGoalStreak"]),
  taskName: z.string().optional(),
  levels: z.array(badgeLevelSchema),
  currentProgress: z.number().int().min(0),
});
export type BadgeWithLevels = z.infer<typeof badgeWithLevelsSchema>;

export const insertBadgeWithLevelsSchema = badgeWithLevelsSchema.omit({ id: true, currentProgress: true }).extend({
  levels: z.array(badgeLevelSchema.omit({ earned: true, earnedAt: true })),
});
export type InsertBadgeWithLevels = z.infer<typeof insertBadgeWithLevelsSchema>;

// Journal entry (multiple per day)
export const journalEntrySchema = z.object({
  id: z.string(),
  date: z.string(),
  title: z.string(),
  content: z.string(),
  createdAt: z.string(),
});
export type JournalEntry = z.infer<typeof journalEntrySchema>;

export const insertJournalEntrySchema = journalEntrySchema.omit({ id: true, createdAt: true });
export type InsertJournalEntry = z.infer<typeof insertJournalEntrySchema>;

// Current week settings
export const currentWeekSettingsSchema = z.object({
  note: z.string().optional(),
  isCustomGoalWeek: z.boolean(),
  customGoal: z.number().int().min(1).optional(),
});
export type CurrentWeekSettings = z.infer<typeof currentWeekSettingsSchema>;

// Unified booster for display
export const unifiedBoosterSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  points: z.number().int(),
  achieved: z.boolean(),
  progress: z.number().int().optional(),
  required: z.number().int().optional(),
  period: z.enum(["week", "month"]).optional(),
  isNegative: z.boolean().default(false),
});
export type UnifiedBooster = z.infer<typeof unifiedBoosterSchema>;
