import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  username: varchar("username").unique(),
  displayName: varchar("display_name"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  fpTotal: integer("fp_total").default(0),
  hasStartedJourney: boolean("has_started_journey").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
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

// Task tier schema (for tiered tasks)
export const taskTierSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  bonusPoints: z.number().int().min(1),
});
export type TaskTier = z.infer<typeof taskTierSchema>;

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
  seasonId: z.string().optional(),
  tiers: z.array(taskTierSchema).optional(),
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
  deadline: z.string().optional(),
  achieved: z.boolean(),
  achievedAt: z.string().optional(),
  note: z.string().optional(),
});
export type Milestone = z.infer<typeof milestoneSchema>;

export const insertMilestoneSchema = milestoneSchema.omit({ id: true, achieved: true, achievedAt: true });
export type InsertMilestone = z.infer<typeof insertMilestoneSchema>;

// Penalty item with optional negative boost rule
export const penaltyItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  value: z.number().int().max(-1),
  category: z.string().default("Penalties"),
  negativeBoostEnabled: z.boolean().default(false),
  timesThreshold: z.number().int().min(1).optional(),
  period: z.enum(["week", "month"]).optional(),
  boostPenaltyPoints: z.number().int().min(1).optional(),
  currentCount: z.number().int().min(0).default(0),
  triggered: z.boolean().default(false),
});
export type PenaltyItem = z.infer<typeof penaltyItemSchema>;

export const insertPenaltyItemSchema = penaltyItemSchema.omit({ id: true, currentCount: true, triggered: true });
export type InsertPenaltyItem = z.infer<typeof insertPenaltyItemSchema>;

// Category for tasks
export const categorySchema = z.object({
  id: z.string(),
  name: z.string().min(1),
});
export type Category = z.infer<typeof categorySchema>;

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

// ==================== FITNESS DATA TABLES (FrisFit Integration) ====================

// Nutrition log - with userId for multi-user support
export const nutritionLogs = pgTable("nutrition_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  date: text("date").notNull(),
  calories: integer("calories"),
  protein: integer("protein"),
  carbs: integer("carbs"),
  fats: integer("fats"),
  creatine: boolean("creatine"),
  waterGallon: boolean("water_gallon"),
  deficit: integer("deficit"),
  caloriesBurned: integer("calories_burned"),
  meals: jsonb("meals"),
});

export const insertNutritionLogSchema = createInsertSchema(nutritionLogs).omit({ id: true });
export type InsertNutritionLog = z.infer<typeof insertNutritionLogSchema>;
export type NutritionLog = typeof nutritionLogs.$inferSelect;

// Body composition - with userId for multi-user support
export const bodyComposition = pgTable("body_composition", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  date: text("date").notNull(),
  weight: integer("weight"),
  bodyFat: integer("body_fat"),
  goalWeight: integer("goal_weight"),
  nextMilestone: integer("next_milestone"),
  photoUrl: text("photo_url"),
});

export const insertBodyCompositionSchema = createInsertSchema(bodyComposition).omit({ id: true });
export type InsertBodyComposition = z.infer<typeof insertBodyCompositionSchema>;
export type BodyComposition = typeof bodyComposition.$inferSelect;

// Strength workout - with userId for multi-user support
export const strengthWorkouts = pgTable("strength_workouts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  date: text("date").notNull(),
  type: text("type").default("Strength"),
  duration: integer("duration"),
  volume: integer("volume"),
  primaryFocus: text("primary_focus"),
  notes: text("notes"),
  effort: integer("effort"),
  exercises: jsonb("exercises"),
});

export const insertStrengthWorkoutSchema = createInsertSchema(strengthWorkouts).omit({ id: true });
export type InsertStrengthWorkout = z.infer<typeof insertStrengthWorkoutSchema>;
export type StrengthWorkout = typeof strengthWorkouts.$inferSelect;

// Skill workout (basketball drills) - with userId for multi-user support
export const skillWorkouts = pgTable("skill_workouts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  date: text("date").notNull(),
  type: text("type").default("Skill"),
  drillType: text("drill_type"),
  skillFocus: jsonb("skill_focus"),
  zoneFocus: jsonb("zone_focus"),
  effort: integer("effort"),
  notes: text("notes"),
  drillStats: jsonb("drill_stats"),
});

export const insertSkillWorkoutSchema = createInsertSchema(skillWorkouts).omit({ id: true });
export type InsertSkillWorkout = z.infer<typeof insertSkillWorkoutSchema>;
export type SkillWorkout = typeof skillWorkouts.$inferSelect;

// Basketball runs (pickup games) - with userId for multi-user support
export const basketballRuns = pgTable("basketball_runs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  date: text("date").notNull(),
  type: text("type").default("Run"),
  gameType: jsonb("game_type"),
  courtType: text("court_type"),
  competitionLevel: text("competition_level"),
  gamesPlayed: integer("games_played"),
  wins: integer("wins"),
  losses: integer("losses"),
  performanceGrade: text("performance_grade"),
  confidence: integer("confidence"),
  positivePoints: text("positive_points"),
  weakPoints: text("weak_points"),
  matchupNotes: text("matchup_notes"),
  challenges: jsonb("challenges"),
});

export const insertBasketballRunSchema = createInsertSchema(basketballRuns).omit({ id: true });
export type InsertBasketballRun = z.infer<typeof insertBasketballRunSchema>;
export type BasketballRun = typeof basketballRuns.$inferSelect;

// ==================== GPT OAuth Tables ====================

// OAuth access tokens for GPT integration
export const gptAccessTokens = pgTable("gpt_access_tokens", {
  token: varchar("token").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type GptAccessToken = typeof gptAccessTokens.$inferSelect;

// OAuth authorization codes (short-lived, for exchange)
export const gptAuthCodes = pgTable("gpt_auth_codes", {
  code: varchar("code").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  redirectUri: text("redirect_uri").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type GptAuthCode = typeof gptAuthCodes.$inferSelect;

// ==================== FRIENDS & SOCIAL TABLES ====================

// Friendship status enum
export const friendshipStatusEnum = z.enum(["pending", "accepted", "declined"]);
export type FriendshipStatus = z.infer<typeof friendshipStatusEnum>;

// Friendships table - tracks friend requests and connections
export const friendships = pgTable("friendships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requesterId: varchar("requester_id").notNull().references(() => users.id),
  addresseeId: varchar("addressee_id").notNull().references(() => users.id),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertFriendshipSchema = createInsertSchema(friendships).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertFriendship = z.infer<typeof insertFriendshipSchema>;
export type Friendship = typeof friendships.$inferSelect;

// User stats table - stores computed stats for sharing with friends
export const userStats = pgTable("user_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  weeklyPoints: integer("weekly_points").default(0),
  dayStreak: integer("day_streak").default(0),
  weekStreak: integer("week_streak").default(0),
  longestDayStreak: integer("longest_day_streak").default(0),
  longestWeekStreak: integer("longest_week_streak").default(0),
  totalBadgesEarned: integer("total_badges_earned").default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserStatsSchema = createInsertSchema(userStats).omit({ id: true, updatedAt: true });
export type InsertUserStats = z.infer<typeof insertUserStatsSchema>;
export type UserStats = typeof userStats.$inferSelect;

// Sharing settings table - controls what data is visible to friends
export const sharingSettings = pgTable("sharing_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  sharePoints: boolean("share_points").default(true),
  shareStreaks: boolean("share_streaks").default(true),
  shareBadges: boolean("share_badges").default(true),
  profilePublic: boolean("profile_public").default(false),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSharingSettingsSchema = createInsertSchema(sharingSettings).omit({ id: true, updatedAt: true });
export type InsertSharingSettings = z.infer<typeof insertSharingSettingsSchema>;
export type SharingSettings = typeof sharingSettings.$inferSelect;

// Friend with stats for display
export const friendWithStatsSchema = z.object({
  id: z.string(),
  friendId: z.string(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  profileImageUrl: z.string().nullable(),
  weeklyPoints: z.number().nullable(),
  dayStreak: z.number().nullable(),
  weekStreak: z.number().nullable(),
  totalBadgesEarned: z.number().nullable(),
  sharePoints: z.boolean(),
  shareStreaks: z.boolean(),
  shareBadges: z.boolean(),
});
export type FriendWithStats = z.infer<typeof friendWithStatsSchema>;

// ==================== SEASONS TABLE ====================

// Seasons table - archives tasks into time periods
export const seasons = pgTable("seasons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: varchar("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(false),
  isArchived: boolean("is_archived").default(false),
  weeklyGoal: integer("weekly_goal").default(100),
  createdAt: timestamp("created_at").defaultNow(),
  archivedAt: timestamp("archived_at"),
});

export const insertSeasonSchema = createInsertSchema(seasons).omit({ id: true, createdAt: true, archivedAt: true });
export type InsertSeason = z.infer<typeof insertSeasonSchema>;
export type Season = typeof seasons.$inferSelect;

// Season tasks table - stores tasks for each season
export const seasonTasks = pgTable("season_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  seasonId: varchar("season_id").notNull().references(() => seasons.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  value: integer("value").notNull().default(10),
  category: varchar("category").notNull().default("General"),
  priority: varchar("priority").notNull().default("shouldDo"),
  boosterRule: jsonb("booster_rule"),
  penaltyRule: jsonb("penalty_rule"),
  tiers: jsonb("tiers"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSeasonTaskSchema = createInsertSchema(seasonTasks).omit({ id: true, createdAt: true });
export type InsertSeasonTask = z.infer<typeof insertSeasonTaskSchema>;
export type SeasonTask = typeof seasonTasks.$inferSelect;

// Season categories table - stores categories for each season
export const seasonCategories = pgTable("season_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  seasonId: varchar("season_id").notNull().references(() => seasons.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSeasonCategorySchema = createInsertSchema(seasonCategories).omit({ id: true, createdAt: true });
export type InsertSeasonCategory = z.infer<typeof insertSeasonCategorySchema>;
export type SeasonCategory = typeof seasonCategories.$inferSelect;

// Season penalties table - stores penalties for each season
export const seasonPenalties = pgTable("season_penalties", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  seasonId: varchar("season_id").notNull().references(() => seasons.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  value: integer("value").notNull().default(-5),
  negativeBoostEnabled: boolean("negative_boost_enabled").default(false),
  timesThreshold: integer("times_threshold"),
  period: varchar("period"),
  boostPenaltyPoints: integer("boost_penalty_points"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSeasonPenaltySchema = createInsertSchema(seasonPenalties).omit({ id: true, createdAt: true });
export type InsertSeasonPenalty = z.infer<typeof insertSeasonPenaltySchema>;
export type SeasonPenalty = typeof seasonPenalties.$inferSelect;

// Full season data type for API responses
export const seasonWithDataSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  isActive: z.boolean().nullable(),
  isArchived: z.boolean().nullable(),
  weeklyGoal: z.number().nullable(),
  createdAt: z.date().nullable(),
  archivedAt: z.date().nullable(),
  tasks: z.array(z.object({
    id: z.string(),
    name: z.string(),
    value: z.number(),
    category: z.string(),
    priority: z.string(),
    boosterRule: z.any().nullable(),
    penaltyRule: z.any().nullable(),
    tiers: z.array(taskTierSchema).nullable().optional(),
  })),
  categories: z.array(z.object({
    id: z.string(),
    name: z.string(),
  })),
  penalties: z.array(z.object({
    id: z.string(),
    name: z.string(),
    value: z.number(),
    negativeBoostEnabled: z.boolean().nullable(),
    timesThreshold: z.number().nullable(),
    period: z.string().nullable(),
    boostPenaltyPoints: z.number().nullable(),
  })),
});
export type SeasonWithData = z.infer<typeof seasonWithDataSchema>;

// ==================== COMMUNITY SOCIAL FEATURES ====================

// Community posts - visible to all users or friends only
export const communityPosts = pgTable("community_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  authorId: varchar("author_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  visibility: varchar("visibility").notNull().default("public"), // "public" or "friends"
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCommunityPostSchema = createInsertSchema(communityPosts).omit({ id: true, createdAt: true });
export type InsertCommunityPost = z.infer<typeof insertCommunityPostSchema>;
export type CommunityPost = typeof communityPosts.$inferSelect;

// Post likes - tracks who liked a post
export const postLikes = pgTable("post_likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").notNull().references(() => communityPosts.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPostLikeSchema = createInsertSchema(postLikes).omit({ id: true, createdAt: true });
export type InsertPostLike = z.infer<typeof insertPostLikeSchema>;
export type PostLike = typeof postLikes.$inferSelect;

// Post comments
export const postComments = pgTable("post_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").notNull().references(() => communityPosts.id, { onDelete: "cascade" }),
  authorId: varchar("author_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPostCommentSchema = createInsertSchema(postComments).omit({ id: true, createdAt: true });
export type InsertPostComment = z.infer<typeof insertPostCommentSchema>;
export type PostComment = typeof postComments.$inferSelect;

// Comment likes
export const commentLikes = pgTable("comment_likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  commentId: varchar("comment_id").notNull().references(() => postComments.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCommentLikeSchema = createInsertSchema(commentLikes).omit({ id: true, createdAt: true });
export type InsertCommentLike = z.infer<typeof insertCommentLikeSchema>;
export type CommentLike = typeof commentLikes.$inferSelect;

// Direct messages between users
export const directMessages = pgTable("direct_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  recipientId: varchar("recipient_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDirectMessageSchema = createInsertSchema(directMessages).omit({ id: true, createdAt: true });
export type InsertDirectMessage = z.infer<typeof insertDirectMessageSchema>;
export type DirectMessage = typeof directMessages.$inferSelect;

// Circles (groups)
export const circles = pgTable("circles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  ownerId: varchar("owner_id").notNull().references(() => users.id),
  isPrivate: boolean("is_private").default(false),
  dailyPointGoal: integer("daily_point_goal"),
  weeklyPointGoal: integer("weekly_point_goal"),
  totalCirclePoints: integer("total_circle_points").default(0),
  inviteCode: varchar("invite_code").unique(), // Unique code for joining circle competitions
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCircleSchema = createInsertSchema(circles).omit({ id: true, createdAt: true });
export type InsertCircle = z.infer<typeof insertCircleSchema>;
export type Circle = typeof circles.$inferSelect;

// Circle members
export const circleMembers = pgTable("circle_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  circleId: varchar("circle_id").notNull().references(() => circles.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  role: varchar("role").notNull().default("member"), // "owner", "admin", "member"
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const insertCircleMemberSchema = createInsertSchema(circleMembers).omit({ id: true, joinedAt: true });
export type InsertCircleMember = z.infer<typeof insertCircleMemberSchema>;
export type CircleMember = typeof circleMembers.$inferSelect;

// Circle member invites - invitations to join a circle
export const circleMemberInvites = pgTable("circle_member_invites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  circleId: varchar("circle_id").notNull().references(() => circles.id, { onDelete: "cascade" }),
  inviterId: varchar("inviter_id").notNull().references(() => users.id),
  inviteeId: varchar("invitee_id").notNull().references(() => users.id),
  status: varchar("status").notNull().default("pending"), // "pending", "accepted", "declined"
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCircleMemberInviteSchema = createInsertSchema(circleMemberInvites).omit({ id: true, createdAt: true });
export type InsertCircleMemberInvite = z.infer<typeof insertCircleMemberInviteSchema>;
export type CircleMemberInvite = typeof circleMemberInvites.$inferSelect;

// Circle messages (chat)
export const circleMessages = pgTable("circle_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  circleId: varchar("circle_id").notNull().references(() => circles.id, { onDelete: "cascade" }),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCircleMessageSchema = createInsertSchema(circleMessages).omit({ id: true, createdAt: true });
export type InsertCircleMessage = z.infer<typeof insertCircleMessageSchema>;
export type CircleMessage = typeof circleMessages.$inferSelect;

// Circle posts (announcements/updates within a circle)
export const circlePosts = pgTable("circle_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  circleId: varchar("circle_id").notNull().references(() => circles.id, { onDelete: "cascade" }),
  authorId: varchar("author_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCirclePostSchema = createInsertSchema(circlePosts).omit({ id: true, createdAt: true });
export type InsertCirclePost = z.infer<typeof insertCirclePostSchema>;
export type CirclePost = typeof circlePosts.$inferSelect;

// Circle post likes
export const circlePostLikes = pgTable("circle_post_likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").notNull().references(() => circlePosts.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCirclePostLikeSchema = createInsertSchema(circlePostLikes).omit({ id: true, createdAt: true });
export type InsertCirclePostLike = z.infer<typeof insertCirclePostLikeSchema>;
export type CirclePostLike = typeof circlePostLikes.$inferSelect;

// Circle post comments
export const circlePostComments = pgTable("circle_post_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").notNull().references(() => circlePosts.id, { onDelete: "cascade" }),
  authorId: varchar("author_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCirclePostCommentSchema = createInsertSchema(circlePostComments).omit({ id: true, createdAt: true });
export type InsertCirclePostComment = z.infer<typeof insertCirclePostCommentSchema>;
export type CirclePostComment = typeof circlePostComments.$inferSelect;

// Circle post comment likes
export const circlePostCommentLikes = pgTable("circle_post_comment_likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  commentId: varchar("comment_id").notNull().references(() => circlePostComments.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCirclePostCommentLikeSchema = createInsertSchema(circlePostCommentLikes).omit({ id: true, createdAt: true });
export type InsertCirclePostCommentLike = z.infer<typeof insertCirclePostCommentLikeSchema>;
export type CirclePostCommentLike = typeof circlePostCommentLikes.$inferSelect;

// Circle tasks - tasks that belong to a circle
export const circleTasks = pgTable("circle_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  circleId: varchar("circle_id").notNull().references(() => circles.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  value: integer("value").notNull().default(10),
  category: varchar("category"),
  taskType: varchar("task_type").notNull().default("per_person"), // "per_person" or "circle_task"
  createdById: varchar("created_by_id").notNull().references(() => users.id),
  requiresApproval: boolean("requires_approval").default(false),
  approvalStatus: varchar("approval_status").notNull().default("approved"), // "approved", "pending", "rejected"
  isPenalty: boolean("is_penalty").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCircleTaskSchema = createInsertSchema(circleTasks).omit({ id: true, createdAt: true });
export type InsertCircleTask = z.infer<typeof insertCircleTaskSchema>;
export type CircleTask = typeof circleTasks.$inferSelect;

// Circle task completions - tracks who completed which task on which day
export const circleTaskCompletions = pgTable("circle_task_completions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  circleId: varchar("circle_id").notNull().references(() => circles.id, { onDelete: "cascade" }),
  taskId: varchar("task_id").notNull().references(() => circleTasks.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  date: varchar("date").notNull(), // YYYY-MM-DD format
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCircleTaskCompletionSchema = createInsertSchema(circleTaskCompletions).omit({ id: true, createdAt: true });
export type InsertCircleTaskCompletion = z.infer<typeof insertCircleTaskCompletionSchema>;
export type CircleTaskCompletion = typeof circleTaskCompletions.$inferSelect;

// Circle task requests - pending requests to add/edit/delete tasks
export const circleTaskRequests = pgTable("circle_task_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  circleId: varchar("circle_id").notNull().references(() => circles.id, { onDelete: "cascade" }),
  requesterId: varchar("requester_id").notNull().references(() => users.id),
  type: varchar("type").notNull(), // "add", "edit", "delete"
  taskData: jsonb("task_data").notNull(), // Partial task data for the request
  existingTaskId: varchar("existing_task_id"),
  status: varchar("status").notNull().default("pending"), // "pending", "approved", "rejected"
  reviewedById: varchar("reviewed_by_id").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCircleTaskRequestSchema = createInsertSchema(circleTaskRequests).omit({ id: true, createdAt: true, reviewedAt: true });
export type InsertCircleTaskRequest = z.infer<typeof insertCircleTaskRequestSchema>;
export type CircleTaskRequest = typeof circleTaskRequests.$inferSelect;

// Circle badges - achievement badges for circles
export const circleBadges = pgTable("circle_badges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  circleId: varchar("circle_id").notNull().references(() => circles.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  description: text("description"),
  icon: varchar("icon").default("star"),
  progress: integer("progress").default(0),
  required: integer("required").notNull().default(1),
  taskId: varchar("task_id"), // Optional: link badge to specific task
  rewardType: varchar("reward_type"), // "points", "gift", "both"
  rewardPoints: integer("reward_points"),
  rewardGift: text("reward_gift"),
  createdById: varchar("created_by_id").notNull().references(() => users.id),
  approvalStatus: varchar("approval_status").notNull().default("approved"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCircleBadgeSchema = createInsertSchema(circleBadges).omit({ id: true, createdAt: true });
export type InsertCircleBadge = z.infer<typeof insertCircleBadgeSchema>;
export type CircleBadge = typeof circleBadges.$inferSelect;

// Circle badge progress per user
export const circleBadgeProgress = pgTable("circle_badge_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  badgeId: varchar("badge_id").notNull().references(() => circleBadges.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  progress: integer("progress").default(0),
  earned: boolean("earned").default(false),
  earnedAt: timestamp("earned_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCircleBadgeProgressSchema = createInsertSchema(circleBadgeProgress).omit({ id: true, createdAt: true });
export type InsertCircleBadgeProgress = z.infer<typeof insertCircleBadgeProgressSchema>;
export type CircleBadgeProgress = typeof circleBadgeProgress.$inferSelect;

// Circle awards - competitive awards for circles
export const circleAwards = pgTable("circle_awards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  circleId: varchar("circle_id").notNull().references(() => circles.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  description: text("description"),
  type: varchar("type").notNull(), // "first_to", "most_in_category", "weekly_champion"
  target: integer("target"), // For "first_to" type
  category: varchar("category"), // For "most_in_category" type
  taskId: varchar("task_id"), // Optional: link award to specific task
  winnerId: varchar("winner_id").references(() => users.id),
  winnerAchievedAt: timestamp("winner_achieved_at"),
  rewardType: varchar("reward_type"), // "points", "gift", "both"
  rewardPoints: integer("reward_points"),
  rewardGift: text("reward_gift"),
  createdById: varchar("created_by_id").notNull().references(() => users.id),
  approvalStatus: varchar("approval_status").notNull().default("approved"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCircleAwardSchema = createInsertSchema(circleAwards).omit({ id: true, createdAt: true });
export type InsertCircleAward = z.infer<typeof insertCircleAwardSchema>;
export type CircleAward = typeof circleAwards.$inferSelect;

// Competition type enum
export const competitionTypeEnum = z.enum(["targetPoints", "timed", "ongoing"]);
export type CompetitionType = z.infer<typeof competitionTypeEnum>;

// Circle competitions - circle vs circle competitions
export const circleCompetitions = pgTable("circle_competitions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  competitionType: varchar("competition_type").notNull().default("targetPoints"), // "targetPoints", "timed", "ongoing"
  circleOneId: varchar("circle_one_id").notNull().references(() => circles.id, { onDelete: "cascade" }),
  circleTwoId: varchar("circle_two_id").notNull().references(() => circles.id, { onDelete: "cascade" }),
  startDate: varchar("start_date").notNull(), // YYYY-MM-DD format
  endDate: varchar("end_date"), // YYYY-MM-DD format (required for "timed", null for "ongoing" and "targetPoints")
  targetPoints: integer("target_points"), // Target points to win (race-to-points mode, null for other types)
  circleOnePoints: integer("circle_one_points").default(0),
  circleTwoPoints: integer("circle_two_points").default(0),
  winnerId: varchar("winner_id"),
  status: varchar("status").notNull().default("pending"), // "pending", "active", "completed"
  createdById: varchar("created_by_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCircleCompetitionSchema = createInsertSchema(circleCompetitions).omit({ id: true, createdAt: true });
export type InsertCircleCompetition = z.infer<typeof insertCircleCompetitionSchema>;
export type CircleCompetition = typeof circleCompetitions.$inferSelect;

// Circle competition records - win/loss tracking per circle
export const circleCompetitionRecords = pgTable("circle_competition_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  circleId: varchar("circle_id").notNull().references(() => circles.id, { onDelete: "cascade" }).unique(),
  wins: integer("wins").notNull().default(0),
  losses: integer("losses").notNull().default(0),
  ties: integer("ties").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCircleCompetitionRecordSchema = createInsertSchema(circleCompetitionRecords).omit({ id: true, updatedAt: true });
export type InsertCircleCompetitionRecord = z.infer<typeof insertCircleCompetitionRecordSchema>;
export type CircleCompetitionRecord = typeof circleCompetitionRecords.$inferSelect;

// Competition member stats - tracks each member's contribution to a competition
export const competitionMemberStats = pgTable("competition_member_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  competitionId: varchar("competition_id").notNull().references(() => circleCompetitions.id, { onDelete: "cascade" }),
  circleId: varchar("circle_id").notNull().references(() => circles.id, { onDelete: "cascade" }),
  memberId: varchar("member_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  totalPoints: integer("total_points").notNull().default(0),
  lastSyncedAt: timestamp("last_synced_at").defaultNow(),
});

export const insertCompetitionMemberStatsSchema = createInsertSchema(competitionMemberStats).omit({ id: true, lastSyncedAt: true });
export type InsertCompetitionMemberStats = z.infer<typeof insertCompetitionMemberStatsSchema>;
export type CompetitionMemberStats = typeof competitionMemberStats.$inferSelect;

// Competition member task stats - tracks tasks completed by each member in a competition
export const competitionMemberTaskStats = pgTable("competition_member_task_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  memberStatsId: varchar("member_stats_id").notNull().references(() => competitionMemberStats.id, { onDelete: "cascade" }),
  taskId: varchar("task_id").notNull(),
  taskName: varchar("task_name").notNull(), // Snapshot of task name at time of completion
  completionCount: integer("completion_count").notNull().default(0),
  pointsAwarded: integer("points_awarded").notNull().default(0),
});

export const insertCompetitionMemberTaskStatsSchema = createInsertSchema(competitionMemberTaskStats).omit({ id: true });
export type InsertCompetitionMemberTaskStats = z.infer<typeof insertCompetitionMemberTaskStatsSchema>;
export type CompetitionMemberTaskStats = typeof competitionMemberTaskStats.$inferSelect;

// Competition messages - chat messages in competitions
export const competitionMessages = pgTable("competition_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  competitionId: varchar("competition_id").notNull().references(() => circleCompetitions.id, { onDelete: "cascade" }),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  senderCircleId: varchar("sender_circle_id").notNull().references(() => circles.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCompetitionMessageSchema = createInsertSchema(competitionMessages).omit({ id: true, createdAt: true });
export type InsertCompetitionMessage = z.infer<typeof insertCompetitionMessageSchema>;
export type CompetitionMessage = typeof competitionMessages.$inferSelect;

// Circle competition invites - pending invitations to compete
export const circleCompetitionInvites = pgTable("circle_competition_invites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  inviterCircleId: varchar("inviter_circle_id").notNull().references(() => circles.id, { onDelete: "cascade" }),
  inviteeCircleId: varchar("invitee_circle_id").notNull().references(() => circles.id, { onDelete: "cascade" }),
  competitionType: varchar("competition_type").notNull().default("targetPoints"), // "targetPoints", "timed", "ongoing"
  targetPoints: integer("target_points"), // Required for "targetPoints" type, null otherwise
  endDate: varchar("end_date"), // Required for "timed" type, null otherwise
  name: varchar("name"),
  description: text("description"),
  status: varchar("status").notNull().default("pending"), // "pending", "accepted", "declined"
  createdById: varchar("created_by_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCircleCompetitionInviteSchema = createInsertSchema(circleCompetitionInvites).omit({ id: true, createdAt: true });
export type InsertCircleCompetitionInvite = z.infer<typeof insertCircleCompetitionInviteSchema>;
export type CircleCompetitionInvite = typeof circleCompetitionInvites.$inferSelect;

// Cheerlines - encouraging messages sent from one user to another
export const cheerlines = pgTable("cheerlines", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  recipientId: varchar("recipient_id").notNull().references(() => users.id),
  message: text("message").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCheerlineSchema = createInsertSchema(cheerlines).omit({ id: true, createdAt: true });
export type InsertCheerline = z.infer<typeof insertCheerlineSchema>;
export type Cheerline = typeof cheerlines.$inferSelect;

// ==================== USER HABIT DATA TABLES (Cross-Device Sync) ====================

// User tasks - personal task definitions that sync across devices
export const userTasks = pgTable("user_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  value: integer("value").notNull().default(10),
  category: varchar("category").notNull().default("General"),
  priority: varchar("priority").notNull().default("shouldDo"),
  boostEnabled: boolean("boost_enabled").default(false),
  boostThreshold: integer("boost_threshold"),
  boostPeriod: varchar("boost_period"),
  boostPoints: integer("boost_points"),
  tiers: jsonb("tiers"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserTaskSchema = createInsertSchema(userTasks).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUserTask = z.infer<typeof insertUserTaskSchema>;
export type UserTask = typeof userTasks.$inferSelect;

// User categories - personal task categories
export const userCategories = pgTable("user_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  color: varchar("color"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserCategorySchema = createInsertSchema(userCategories).omit({ id: true, createdAt: true });
export type InsertUserCategory = z.infer<typeof insertUserCategorySchema>;
export type UserCategory = typeof userCategories.$inferSelect;

// User penalties - personal penalty items
export const userPenalties = pgTable("user_penalties", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  value: integer("value").notNull().default(-5),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserPenaltySchema = createInsertSchema(userPenalties).omit({ id: true, createdAt: true });
export type InsertUserPenalty = z.infer<typeof insertUserPenaltySchema>;
export type UserPenalty = typeof userPenalties.$inferSelect;

// User habit settings - goals and preferences per user
export const userHabitSettings = pgTable("user_habit_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  dailyGoal: integer("daily_goal").default(50),
  weeklyGoal: integer("weekly_goal").default(350),
  userName: varchar("user_name").default("You"),
  encouragementMessage: text("encouragement_message"),
  penaltyBoostEnabled: boolean("penalty_boost_enabled").default(false),
  penaltyBoostThreshold: integer("penalty_boost_threshold").default(3),
  penaltyBoostPeriod: varchar("penalty_boost_period").default("week"),
  penaltyBoostPoints: integer("penalty_boost_points").default(10),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserHabitSettingsSchema = createInsertSchema(userHabitSettings).omit({ id: true, updatedAt: true });
export type InsertUserHabitSettings = z.infer<typeof insertUserHabitSettingsSchema>;
export type UserHabitSettings = typeof userHabitSettings.$inferSelect;

// Daily logs - task completions per day per user
export const userDailyLogs = pgTable("user_daily_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: varchar("date").notNull(), // YYYY-MM-DD format
  completedTaskIds: text("completed_task_ids").array().default([]),
  taskPoints: integer("task_points").default(0), // Computed points from tasks - frozen at save time
  todoPoints: integer("todo_points").default(0), // Points earned from todo list items
  penaltyPoints: integer("penalty_points").default(0), // Negative points from penalties (stored as negative)
  checkInBonusAwarded: boolean("check_in_bonus_awarded").default(false), // +3 FP daily check-in bonus
  seasonId: varchar("season_id"), // Season active when log was created (for reference)
  notes: text("notes"),
  taskNotes: jsonb("task_notes"), // Per-task notes (taskId -> note string)
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserDailyLogSchema = createInsertSchema(userDailyLogs).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUserDailyLog = z.infer<typeof insertUserDailyLogSchema>;
export type UserDailyLog = typeof userDailyLogs.$inferSelect;

// User journal entries - personal reflections and notes
export const userJournalEntries = pgTable("user_journal_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: varchar("date").notNull(),
  title: varchar("title").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserJournalEntrySchema = createInsertSchema(userJournalEntries).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUserJournalEntry = z.infer<typeof insertUserJournalEntrySchema>;
export type UserJournalEntry = typeof userJournalEntries.$inferSelect;

// ==================== CIRCLE MEMBER STATS (Analytics) ====================

// Circle member stats - aggregated all-time stats per member per circle
export const circleMemberStats = pgTable("circle_member_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  circleId: varchar("circle_id").notNull().references(() => circles.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  totalPoints: integer("total_points").default(0),
  goalStreak: integer("goal_streak").default(0), // Consecutive days hitting daily goal
  longestStreak: integer("longest_streak").default(0),
  weeklyHistory: jsonb("weekly_history").default([]), // Array of { week: string, points: number }
  taskTotals: jsonb("task_totals").default([]), // Array of { taskName: string, count: number }
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const insertCircleMemberStatsSchema = createInsertSchema(circleMemberStats).omit({ id: true, lastUpdated: true });
export type InsertCircleMemberStats = z.infer<typeof insertCircleMemberStatsSchema>;
export type CircleMemberStats = typeof circleMemberStats.$inferSelect;

// Type for weekly history entries
export const weeklyHistoryEntrySchema = z.object({
  week: z.string(), // e.g., "2024-W49"
  points: z.number(),
});
export type WeeklyHistoryEntry = z.infer<typeof weeklyHistoryEntrySchema>;

// Type for task totals entries
export const taskTotalEntrySchema = z.object({
  taskName: z.string(),
  count: z.number(),
});
export type TaskTotalEntry = z.infer<typeof taskTotalEntrySchema>;

// ==================== APPOINTMENTS (Calendar) ====================

// Appointments - calendar appointments for users
export const appointments = pgTable("appointments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: varchar("date").notNull(), // YYYY-MM-DD format
  startTime: varchar("start_time").notNull(), // HH:MM format (24-hour)
  endTime: varchar("end_time"), // HH:MM format (optional)
  title: varchar("title").notNull(),
  description: text("description"),
  category: varchar("category"), // Optional category/color coding
  isAllDay: boolean("is_all_day").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Appointment = typeof appointments.$inferSelect;

// ==================== NOTIFICATIONS ====================

// ==================== FRIEND CHALLENGES ====================

// Friend challenge status enum
export const challengeStatusEnum = z.enum(["pending", "active", "completed", "declined", "cancelled"]);
export type ChallengeStatus = z.infer<typeof challengeStatusEnum>;

// Friend challenges - 1v1 competitions between friends
export const friendChallenges = pgTable("friend_challenges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  challengerId: varchar("challenger_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  challengeeId: varchar("challengee_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  description: text("description"),
  challengeType: varchar("challenge_type").notNull().default("targetPoints"), // "targetPoints", "timed", "ongoing"
  startDate: varchar("start_date"), // YYYY-MM-DD format (set when accepted)
  endDate: varchar("end_date"), // YYYY-MM-DD format (for "timed" type)
  targetPoints: integer("target_points"), // Target points to win (for "targetPoints" type)
  challengerPoints: integer("challenger_points").default(0),
  challengeePoints: integer("challengee_points").default(0),
  winnerId: varchar("winner_id").references(() => users.id),
  status: varchar("status").notNull().default("pending"), // "pending", "active", "completed", "declined", "cancelled"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertFriendChallengeSchema = createInsertSchema(friendChallenges).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertFriendChallenge = z.infer<typeof insertFriendChallengeSchema>;
export type FriendChallenge = typeof friendChallenges.$inferSelect;

// Friend challenge tasks - tasks for a specific challenge
export const friendChallengeTasks = pgTable("friend_challenge_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  challengeId: varchar("challenge_id").notNull().references(() => friendChallenges.id, { onDelete: "cascade" }),
  taskName: varchar("task_name").notNull(),
  pointValue: integer("point_value").notNull().default(10),
  isCustom: boolean("is_custom").default(true), // True if created for challenge, false if selected from existing
  sourceTaskId: varchar("source_task_id"), // Reference to original userTask if not custom
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFriendChallengeTaskSchema = createInsertSchema(friendChallengeTasks).omit({ id: true, createdAt: true });
export type InsertFriendChallengeTask = z.infer<typeof insertFriendChallengeTaskSchema>;
export type FriendChallengeTask = typeof friendChallengeTasks.$inferSelect;

// Friend challenge completions - task completions within a challenge
export const friendChallengeCompletions = pgTable("friend_challenge_completions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  challengeId: varchar("challenge_id").notNull().references(() => friendChallenges.id, { onDelete: "cascade" }),
  taskId: varchar("task_id").notNull().references(() => friendChallengeTasks.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  completedAt: timestamp("completed_at").defaultNow(),
});

export const insertFriendChallengeCompletionSchema = createInsertSchema(friendChallengeCompletions).omit({ id: true, completedAt: true });
export type InsertFriendChallengeCompletion = z.infer<typeof insertFriendChallengeCompletionSchema>;
export type FriendChallengeCompletion = typeof friendChallengeCompletions.$inferSelect;

// Friend challenge with tasks and user details for display
export const friendChallengeWithDetailsSchema = z.object({
  id: z.string(),
  challengerId: z.string(),
  challengeeId: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  challengeType: z.string(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  targetPoints: z.number().nullable(),
  challengerPoints: z.number().nullable(),
  challengeePoints: z.number().nullable(),
  winnerId: z.string().nullable(),
  status: z.string(),
  createdAt: z.date().nullable(),
  challenger: z.object({
    id: z.string(),
    firstName: z.string().nullable(),
    lastName: z.string().nullable(),
    displayName: z.string().nullable(),
    profileImageUrl: z.string().nullable(),
  }),
  challengee: z.object({
    id: z.string(),
    firstName: z.string().nullable(),
    lastName: z.string().nullable(),
    displayName: z.string().nullable(),
    profileImageUrl: z.string().nullable(),
  }),
  tasks: z.array(z.object({
    id: z.string(),
    taskName: z.string(),
    pointValue: z.number(),
    isCustom: z.boolean().nullable(),
  })),
});
export type FriendChallengeWithDetails = z.infer<typeof friendChallengeWithDetailsSchema>;

// ==================== EMAIL INVITATIONS ====================

// Pending email invitations for users not in the system
export const emailInvitations = pgTable("email_invitations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  inviterUserId: varchar("inviter_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  invitedEmail: varchar("invited_email").notNull(),
  inviteCode: varchar("invite_code").notNull().unique(),
  status: varchar("status").notNull().default("pending"), // pending, accepted, expired
  sentAt: timestamp("sent_at").defaultNow(),
  acceptedAt: timestamp("accepted_at"),
  expiresAt: timestamp("expires_at"),
});

export const insertEmailInvitationSchema = createInsertSchema(emailInvitations).omit({ id: true, sentAt: true, acceptedAt: true });
export type InsertEmailInvitation = z.infer<typeof insertEmailInvitationSchema>;
export type EmailInvitation = typeof emailInvitations.$inferSelect;

// ==================== NOTIFICATIONS ====================

// Notification types enum
export const notificationTypeEnum = z.enum([
  "friend_request",
  "friend_accepted",
  "task_request",
  "task_approved",
  "instant_message",
  "post_like",
  "post_comment",
  "circle_invitation",
  "circle_compete_invite",
  "task_alert",
  "friend_challenge",
  "challenge_accepted",
  "challenge_declined",
  "challenge_completed"
]);
export type NotificationType = z.infer<typeof notificationTypeEnum>;

// Notifications table - user notifications for various events
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type").notNull(), // NotificationType
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  read: boolean("read").default(false),
  actorId: varchar("actor_id").references(() => users.id), // The user who triggered the notification (optional)
  resourceId: varchar("resource_id"), // ID of related resource (post, circle, etc.)
  resourceType: varchar("resource_type"), // Type of resource (post, circle, friendship, etc.)
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

// Notification with actor details for display
export const notificationWithActorSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: notificationTypeEnum,
  title: z.string(),
  message: z.string(),
  read: z.boolean().nullable(),
  actorId: z.string().nullable(),
  resourceId: z.string().nullable(),
  resourceType: z.string().nullable(),
  createdAt: z.date().nullable(),
  actor: z.object({
    id: z.string(),
    firstName: z.string().nullable(),
    lastName: z.string().nullable(),
    displayName: z.string().nullable(),
    profileImageUrl: z.string().nullable(),
  }).nullable(),
});
export type NotificationWithActor = z.infer<typeof notificationWithActorSchema>;

// ==================== FP (FOCUS POINTS) SYSTEM ====================

// FP event types for tracking what action earned FP
export const fpEventTypeEnum = z.enum([
  "join_circle",
  "send_cheerline",
  "add_friend",
  "create_circle",
  "accept_1v1_challenge",
  "accept_circle_challenge",
  "log_day",
  "daily_goal_streak_3",
  "logging_streak_7",
  "hit_daily_goal",
  "daily_goal_streak_7",
  "weekly_goal_streak_2",
  "win_1v1_challenge",
  "win_circle_challenge",
  "earn_badge",
  "earn_circle_award",
  "earn_circle_badge",
  "invite_friend_email",
  "no_penalties_week",
  "logging_streak_14",
  "within_5_percent_weekly",
  "logging_streak_21",
  "daily_goal_streak_10",
  "complete_all_weekly_daily",
  "challenge_win_streak_3",
  "weekly_goal_streak_3",
  "daily_goal_streak_14",
  "win_streak_1v1_2",
  "logging_streak_28",
  "no_penalty_streak_2_weeks",
  "circle_win_streak_3",
  "weekly_goal_streak_4",
  "daily_goal_streak_21",
  "win_streak_1v1_3",
  "logging_streak_50",
  "hit_weekly_goal",
  "weekly_goal_streak_5",
  "no_penalty_streak_4_weeks",
  "circle_win_streak_5",
  "weekly_goal_streak_6",
  "daily_goal_streak_30",
  "win_streak_1v1_5",
  "weekly_goal_streak_7",
  "logging_streak_100",
  "weekly_goal_streak_8",
  "win_streak_1v1_10",
  "no_penalty_streak_6_weeks",
  "weekly_goal_streak_10",
  "logging_streak_200",
  "weekly_goal_streak_15",
  "weekly_goal_streak_20",
  "logging_streak_365",
  "first_task",
  "first_post",
  "first_journal",
  "first_event",
  "first_due_date",
  "first_milestone",
  "first_weekly_todo",
  "first_friend",
  "first_badge",
  "first_7_day_streak",
  "first_challenge_accepted",
  "first_cheerline_sent",
  "first_circle_joined",
  "first_circle_created",
  "task_master",
  "over_achiever"
]);
export type FpEventType = z.infer<typeof fpEventTypeEnum>;

// ==================== TO-DO LISTS (Daily & Weekly) ====================

// To-do item schema (for both daily and weekly items)
export const todoItemSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  completed: z.boolean(),
  points: z.number().int().default(0),
  hasPenalty: z.boolean().default(false),
  penaltyValue: z.number().int().default(0),
  notes: z.string().optional(),
});
export type TodoItem = z.infer<typeof todoItemSchema>;

// Daily to-do lists - tasks for a specific day
export const userDailyTodos = pgTable("user_daily_todos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: varchar("date").notNull(), // YYYY-MM-DD format
  items: jsonb("items").default([]), // Array of TodoItem
  bonusEnabled: boolean("bonus_enabled").default(false),
  bonusPoints: integer("bonus_points").default(10),
  bonusAwarded: boolean("bonus_awarded").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserDailyTodoSchema = createInsertSchema(userDailyTodos).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUserDailyTodo = z.infer<typeof insertUserDailyTodoSchema>;
export type UserDailyTodo = typeof userDailyTodos.$inferSelect;

// Weekly to-do lists - tasks for a specific week
export const userWeeklyTodos = pgTable("user_weekly_todos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  weekId: varchar("week_id").notNull(), // YYYY-WXX format (e.g., 2024-W49)
  items: jsonb("items").default([]), // Array of TodoItem
  bonusEnabled: boolean("bonus_enabled").default(false),
  bonusPoints: integer("bonus_points").default(25),
  bonusAwarded: boolean("bonus_awarded").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserWeeklyTodoSchema = createInsertSchema(userWeeklyTodos).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUserWeeklyTodo = z.infer<typeof insertUserWeeklyTodoSchema>;
export type UserWeeklyTodo = typeof userWeeklyTodos.$inferSelect;

// FP Activity Log table - tracks all FP awards
export const fpActivityLog = pgTable("fp_activity_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  eventType: varchar("event_type").notNull(),
  fpAmount: integer("fp_amount").notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFpActivityLogSchema = createInsertSchema(fpActivityLog).omit({ id: true, createdAt: true });
export type InsertFpActivityLog = z.infer<typeof insertFpActivityLogSchema>;
export type FpActivityLog = typeof fpActivityLog.$inferSelect;

// FP Activity with formatted data for display
export const fpActivityDisplaySchema = z.object({
  id: z.string(),
  eventType: fpEventTypeEnum,
  fpAmount: z.number(),
  description: z.string(),
  createdAt: z.date().nullable(),
});
export type FpActivityDisplay = z.infer<typeof fpActivityDisplaySchema>;

// ==================== DASHBOARD PREFERENCES ====================

// Dashboard card keys for ordering
export const dashboardCardKeys = [
  "weekTotal",
  "streaks", 
  "badges",
  "weeklyTable",
  "alerts",
  "weeklyTodos",
  "dueDates",
  "boosters",
  "milestones",
  "recentWeeks",
  "circlesOverview",
  "journal",
  "feed",
] as const;
export type DashboardCardKey = typeof dashboardCardKeys[number];

// Dashboard card visibility preferences
export const dashboardPreferencesSchema = z.object({
  weekTotal: z.boolean().default(true),
  streaks: z.boolean().default(true),
  badges: z.boolean().default(true),
  weeklyTable: z.boolean().default(true),
  alerts: z.boolean().default(true),
  weeklyTodos: z.boolean().default(true),
  dueDates: z.boolean().default(true),
  boosters: z.boolean().default(true),
  milestones: z.boolean().default(true),
  recentWeeks: z.boolean().default(true),
  circlesOverview: z.boolean().default(true),
  journal: z.boolean().default(true),
  feed: z.boolean().default(true),
  selectedCircles: z.array(z.string()).default([]),
  cardOrder: z.array(z.string()).default([]),
});
export type DashboardPreferences = z.infer<typeof dashboardPreferencesSchema>;

// Default dashboard preferences
export const defaultDashboardPreferences: DashboardPreferences = {
  weekTotal: true,
  streaks: true,
  badges: true,
  weeklyTable: true,
  alerts: true,
  weeklyTodos: true,
  dueDates: true,
  boosters: true,
  milestones: true,
  recentWeeks: true,
  circlesOverview: true,
  journal: true,
  feed: true,
  selectedCircles: [],
  cardOrder: [...dashboardCardKeys],
};

// Dashboard preferences table - stores user dashboard card visibility settings
export const userDashboardPreferences = pgTable("user_dashboard_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  preferences: jsonb("preferences").default(defaultDashboardPreferences).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserDashboardPreferencesSchema = createInsertSchema(userDashboardPreferences).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUserDashboardPreferences = z.infer<typeof insertUserDashboardPreferencesSchema>;
export type UserDashboardPreferences = typeof userDashboardPreferences.$inferSelect;

// ==================== DAILY SCHEDULES ====================

// Time block schema for schedule templates
export const timeBlockSchema = z.object({
  id: z.string(),
  startTime: z.string(), // HH:MM format (24-hour)
  endTime: z.string(), // HH:MM format (24-hour)
  activity: z.string(),
  category: z.string().optional(), // Optional color/category
});
export type TimeBlock = z.infer<typeof timeBlockSchema>;

// Schedule templates - reusable day templates
export const userScheduleTemplates = pgTable("user_schedule_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  description: text("description"),
  timeBlocks: jsonb("time_blocks").default([]), // Array of TimeBlock
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserScheduleTemplateSchema = createInsertSchema(userScheduleTemplates).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUserScheduleTemplate = z.infer<typeof insertUserScheduleTemplateSchema>;
export type UserScheduleTemplate = typeof userScheduleTemplates.$inferSelect;

// Daily schedule assignments - which template to use for a specific day
export const userDailySchedules = pgTable("user_daily_schedules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: varchar("date").notNull(), // YYYY-MM-DD format
  templateId: varchar("template_id").references(() => userScheduleTemplates.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserDailyScheduleSchema = createInsertSchema(userDailySchedules).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUserDailySchedule = z.infer<typeof insertUserDailyScheduleSchema>;
export type UserDailySchedule = typeof userDailySchedules.$inferSelect;
