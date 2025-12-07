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
