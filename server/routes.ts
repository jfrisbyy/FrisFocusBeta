import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { isAuthenticated, upsertFirebaseUser, verifyFirebaseToken } from "./firebaseAdmin";
import OpenAI from "openai";
import { 
  INSIGHTS_ASSISTANT_PROMPT,
  getConversationFlowPrompt,
  getTaskFinalizationPrompt,
  BADGE_GENERATION_PROMPT,
  getSimpleTaskGenerationPrompt
} from "./aiSystemPrompt";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import { z } from "zod";
import {
  nutritionLogs,
  bodyComposition,
  strengthWorkouts,
  skillWorkouts,
  basketballRuns,
  cardioRuns,
  gptAccessTokens,
  gptAuthCodes,
  insertNutritionLogSchema,
  insertBodyCompositionSchema,
  insertStrengthWorkoutSchema,
  insertSkillWorkoutSchema,
  insertBasketballRunSchema,
  insertCardioRunSchema,
  nutritionSettings,
  insertNutritionSettingsSchema,
  livePlaySettings,
  insertLivePlaySettingsSchema,
  friendships,
  userStats,
  sharingSettings,
  users,
  insertFriendshipSchema,
  insertSharingSettingsSchema,
  seasons,
  insertSeasonSchema,
  seasonTasks,
  seasonCategories,
  seasonPenalties,
  insertSeasonTaskSchema,
  insertSeasonCategorySchema,
  insertSeasonPenaltySchema,
  communityPosts,
  postLikes,
  postComments,
  insertCommunityPostSchema,
  insertPostLikeSchema,
  insertPostCommentSchema,
  circles,
  circleMembers,
  circleMessages,
  circlePosts,
  circlePostLikes,
  circlePostComments,
  insertCircleSchema,
  insertCircleMemberSchema,
  insertCircleMessageSchema,
  insertCirclePostSchema,
  insertCirclePostLikeSchema,
  insertCirclePostCommentSchema,
  circleTasks,
  circleTaskCompletions,
  circleBadges,
  circleBadgeProgress,
  circleAwards,
  insertCircleTaskSchema,
  insertCircleTaskCompletionSchema,
  insertCircleBadgeSchema,
  insertCircleAwardSchema,
  directMessages,
  insertDirectMessageSchema,
  cheerlines,
  insertCheerlineSchema,
  userTasks,
  userCategories,
  userPenalties,
  userHabitSettings,
  userDailyLogs,
  insertUserTaskSchema,
  insertUserCategorySchema,
  insertUserPenaltySchema,
  insertUserHabitSettingsSchema,
  insertUserDailyLogSchema,
  userDailyTodos,
  userWeeklyTodos,
  insertUserDailyTodoSchema,
  insertUserWeeklyTodoSchema,
  userJournalEntries,
  insertUserJournalEntrySchema,
  circleMemberStats,
  circleCompetitions,
  circleCompetitionInvites,
  insertCircleCompetitionSchema,
  insertCircleCompetitionInviteSchema,
  competitionMessages,
  insertCompetitionMessageSchema,
  circleMemberInvites,
  insertCircleMemberInviteSchema,
  appointments,
  insertAppointmentSchema,
  insertFriendChallengeSchema,
  insertFriendChallengeTaskSchema,
  emailInvitations,
  userDashboardPreferences,
  insertUserDashboardPreferencesSchema,
  defaultDashboardPreferences,
  dashboardPreferencesSchema,
  userScheduleTemplates,
  userDailySchedules,
  insertUserScheduleTemplateSchema,
  insertUserDailyScheduleSchema,
  timeBlockSchema,
  aiGenerateTasksRequestSchema,
  aiGenerateTasksResponseSchema,
  type AIGenerateTasksResponse,
  userMilestones,
  userDueDates,
  insertUserMilestoneSchema,
  insertUserDueDateSchema,
  dailySteps,
  insertDailyStepsSchema,
} from "@shared/schema";
import { sendInvitationEmail } from "./email";
import { and, or, desc, inArray, gte, sql } from "drizzle-orm";
import { lt } from "drizzle-orm";
import { getGitHubUser, listRepositories, createRepository, getRepository, listCommits } from "./github";

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

// Clean up expired OAuth tokens periodically
setInterval(async () => {
  try {
    const now = new Date();
    await db.delete(gptAuthCodes).where(lt(gptAuthCodes.expiresAt, now));
    await db.delete(gptAccessTokens).where(lt(gptAccessTokens.expiresAt, now));
  } catch (error) {
    console.error("Error cleaning up expired OAuth tokens:", error);
  }
}, 60000); // Run every minute

// GPT OAuth Configuration - Whitelist of allowed redirect URIs for security
// ChatGPT custom GPTs use specific redirect URIs that must be validated
const ALLOWED_GPT_REDIRECT_URIS = [
  "https://chat.openai.com/aip/g-",
  "https://chatgpt.com/aip/g-",
];

// Helper to check if two dates are consecutive
function isConsecutiveDay(date1: string, date2: string): boolean {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  return diffDays === 1;
}

function isValidRedirectUri(redirectUri: string): boolean {
  if (!redirectUri) return false;
  try {
    const url = new URL(redirectUri);
    // Allow any ChatGPT callback URL (they use dynamic paths for GPT IDs)
    return ALLOWED_GPT_REDIRECT_URIS.some(allowed => redirectUri.startsWith(allowed));
  } catch {
    return false;
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Auth user endpoint - get current user
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Update user profile (username, displayName, profileImageUrl, hasStartedJourney)
  app.put('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { username, displayName, profileImageUrl, hasStartedJourney } = req.body;

      // Validate username format if provided
      if (username !== null && username !== undefined) {
        if (typeof username !== "string") {
          return res.status(400).json({ message: "Invalid username format" });
        }
        if (username.length > 0) {
          if (username.length < 3) {
            return res.status(400).json({ message: "Username must be at least 3 characters" });
          }
          if (username.length > 20) {
            return res.status(400).json({ message: "Username must be 20 characters or less" });
          }
          if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            return res.status(400).json({ message: "Username can only contain letters, numbers, and underscores" });
          }

          // Check if username is already taken by another user
          const [existingUser] = await db.select().from(users).where(eq(users.username, username.toLowerCase()));
          if (existingUser && existingUser.id !== userId) {
            return res.status(400).json({ message: "Username is already taken" });
          }
        }
      }

      // Validate displayName if provided
      if (displayName !== null && displayName !== undefined) {
        if (typeof displayName !== "string") {
          return res.status(400).json({ message: "Invalid display name format" });
        }
        if (displayName.length > 50) {
          return res.status(400).json({ message: "Display name must be 50 characters or less" });
        }
      }

      // Validate profileImageUrl if provided
      if (profileImageUrl !== null && profileImageUrl !== undefined) {
        if (typeof profileImageUrl !== "string") {
          return res.status(400).json({ message: "Invalid profile image URL format" });
        }
      }

      // Build update object with only provided fields
      const updateData: Record<string, any> = { updatedAt: new Date() };
      
      if (username !== undefined) {
        updateData.username = username ? username.toLowerCase() : null;
      }
      if (displayName !== undefined) {
        updateData.displayName = displayName || null;
      }
      if (profileImageUrl !== undefined) {
        updateData.profileImageUrl = profileImageUrl || null;
      }
      if (hasStartedJourney === true) {
        updateData.hasStartedJourney = true;
      }

      // Update user
      const [updatedUser] = await db.update(users)
        .set(updateData)
        .where(eq(users.id, userId))
        .returning();

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Firebase auth endpoint - create/update user from Firebase token
  app.post('/api/auth/firebase', isAuthenticated, async (req: any, res) => {
    try {
      const decodedToken = req.user.decodedToken;
      const user = await upsertFirebaseUser(decodedToken);
      
      // Mark any pending email invitations as accepted when user registers
      if (user.email) {
        try {
          await db.update(emailInvitations)
            .set({ 
              status: "accepted",
              acceptedAt: new Date()
            })
            .where(
              and(
                eq(emailInvitations.invitedEmail, user.email),
                eq(emailInvitations.status, "pending")
              )
            );
        } catch (inviteError) {
          console.error("Error updating email invitations:", inviteError);
        }
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error upserting Firebase user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Get user summary for profile cards (public info only)
  app.get('/api/users/:userId/summary', isAuthenticated, async (req: any, res) => {
    try {
      const { userId } = req.params;
      
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Return public profile info with FP total from user record
      res.json({
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        createdAt: user.createdAt,
        fpTotal: user.fpTotal || 0,
      });
    } catch (error) {
      console.error("Error fetching user summary:", error);
      res.status(500).json({ message: "Failed to fetch user summary" });
    }
  });

  // Search users for friend discovery (excludes current user and any existing friendship)
  app.get('/api/users/search', isAuthenticated, async (req: any, res) => {
    try {
      const currentUserId = req.user.claims.sub;
      const { q = '', page = '1', limit = '10' } = req.query;
      const searchTerm = (q as string).trim();
      
      // Require a search term of at least 2 characters to prevent enumeration
      if (searchTerm.length < 2) {
        return res.json({
          users: [],
          pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
        });
      }
      
      const pageNum = parseInt(page as string) || 1;
      const limitNum = Math.min(parseInt(limit as string) || 10, 20);
      const offset = (pageNum - 1) * limitNum;
      const searchPattern = `%${searchTerm.toLowerCase()}%`;
      
      // Get user IDs to exclude:
      // - Accepted friends (both directions)
      // - Incoming pending requests (user is addressee - they appear in requests section)
      // BUT KEEP visible: outgoing pending requests (so green button can show)
      const excludeRelationships = await db.select({
        requesterId: friendships.requesterId,
        addresseeId: friendships.addresseeId,
      }).from(friendships).where(
        or(
          // Exclude accepted friends (both directions)
          and(
            eq(friendships.status, "accepted"),
            or(
              eq(friendships.requesterId, currentUserId),
              eq(friendships.addresseeId, currentUserId)
            )
          ),
          // Exclude incoming pending requests (user is addressee)
          and(
            eq(friendships.status, "pending"),
            eq(friendships.addresseeId, currentUserId)
          )
        )
      );
      
      const excludedIds = new Set<string>([currentUserId]);
      excludeRelationships.forEach(f => {
        excludedIds.add(f.requesterId);
        excludedIds.add(f.addresseeId);
      });
      const excludedArray = Array.from(excludedIds);
      
      // Use raw SQL for ILIKE search with pagination at DB level
      const { sql } = await import("drizzle-orm");
      
      // Get matching users with DB-level filtering and pagination
      const searchResults = await db.execute(sql`
        SELECT id, username, display_name, first_name, last_name, profile_image_url
        FROM users
        WHERE id NOT IN (${sql.raw(excludedArray.map(id => `'${id.replace(/'/g, "''")}'`).join(','))})
          AND (
            LOWER(COALESCE(display_name, '')) LIKE ${searchPattern}
            OR LOWER(COALESCE(username, '')) LIKE ${searchPattern}
            OR LOWER(CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, ''))) LIKE ${searchPattern}
          )
        ORDER BY COALESCE(display_name, first_name, username) ASC
        LIMIT ${limitNum} OFFSET ${offset}
      `);
      
      // Get total count for pagination
      const countResult = await db.execute(sql`
        SELECT COUNT(*) as total
        FROM users
        WHERE id NOT IN (${sql.raw(excludedArray.map(id => `'${id.replace(/'/g, "''")}'`).join(','))})
          AND (
            LOWER(COALESCE(display_name, '')) LIKE ${searchPattern}
            OR LOWER(COALESCE(username, '')) LIKE ${searchPattern}
            OR LOWER(CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, ''))) LIKE ${searchPattern}
          )
      `);
      
      const total = parseInt((countResult.rows[0] as any)?.total || '0');
      const paginatedUsers = (searchResults.rows as any[]).map(row => ({
        id: row.id,
        username: row.username,
        displayName: row.display_name,
        firstName: row.first_name,
        lastName: row.last_name,
        profileImageUrl: row.profile_image_url,
      }));
      
      res.json({
        users: paginatedUsers,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        }
      });
    } catch (error) {
      console.error("Error searching users:", error);
      res.status(500).json({ message: "Failed to search users" });
    }
  });

  // List all users for discovery (paginated, excludes current user and existing friends)
  app.get('/api/users', isAuthenticated, async (req: any, res) => {
    try {
      const currentUserId = req.user.claims.sub;
      const { page = '1', limit = '10' } = req.query;
      
      const pageNum = parseInt(page as string) || 1;
      const limitNum = Math.min(parseInt(limit as string) || 10, 20);
      const offset = (pageNum - 1) * limitNum;
      
      // Get user IDs to exclude:
      // - Accepted friends (both directions)
      // - Incoming pending requests (user is addressee - they appear in requests section)
      // BUT KEEP visible: outgoing pending requests (so green button can show)
      const excludeRelationships = await db.select({
        requesterId: friendships.requesterId,
        addresseeId: friendships.addresseeId,
      }).from(friendships).where(
        or(
          // Exclude accepted friends (both directions)
          and(
            eq(friendships.status, "accepted"),
            or(
              eq(friendships.requesterId, currentUserId),
              eq(friendships.addresseeId, currentUserId)
            )
          ),
          // Exclude incoming pending requests (user is addressee)
          and(
            eq(friendships.status, "pending"),
            eq(friendships.addresseeId, currentUserId)
          )
        )
      );
      
      const excludedIds = new Set<string>([currentUserId]);
      excludeRelationships.forEach(f => {
        excludedIds.add(f.requesterId);
        excludedIds.add(f.addresseeId);
      });
      const excludedArray = Array.from(excludedIds);
      
      const { sql } = await import("drizzle-orm");
      
      // Get all users excluding current user and friends
      const userResults = await db.execute(sql`
        SELECT id, username, display_name, first_name, last_name, profile_image_url
        FROM users
        WHERE id NOT IN (${sql.raw(excludedArray.map(id => `'${id.replace(/'/g, "''")}'`).join(','))})
        ORDER BY COALESCE(display_name, first_name, username) ASC
        LIMIT ${limitNum} OFFSET ${offset}
      `);
      
      // Get total count for pagination
      const countResult = await db.execute(sql`
        SELECT COUNT(*) as total
        FROM users
        WHERE id NOT IN (${sql.raw(excludedArray.map(id => `'${id.replace(/'/g, "''")}'`).join(','))})
      `);
      
      const total = parseInt((countResult.rows[0] as any)?.total || '0');
      const paginatedUsers = (userResults.rows as any[]).map(row => ({
        id: row.id,
        username: row.username,
        displayName: row.display_name,
        firstName: row.first_name,
        lastName: row.last_name,
        profileImageUrl: row.profile_image_url,
      }));
      
      res.json({
        users: paginatedUsers,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        }
      });
    } catch (error) {
      console.error("Error listing users:", error);
      res.status(500).json({ message: "Failed to list users" });
    }
  });

  // ==================== MEDIA UPLOAD ROUTES (Protected) ====================

  // Get upload URL for media files
  app.post('/api/media/upload-url', isAuthenticated, async (req: any, res) => {
    try {
      const { ObjectStorageService } = await import("./objectStorage");
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ message: "Failed to get upload URL" });
    }
  });

  // Update profile image after upload
  app.put('/api/media/profile-image', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { imageURL } = req.body;

      if (!imageURL) {
        return res.status(400).json({ message: "imageURL is required" });
      }

      const { ObjectStorageService } = await import("./objectStorage");
      const objectStorageService = new ObjectStorageService();
      
      // Set ACL policy (public visibility for profile images)
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(imageURL, {
        owner: userId,
        visibility: "public",
      });

      // Update user's profile image URL
      const [updatedUser] = await db.update(users)
        .set({ profileImageUrl: objectPath })
        .where(eq(users.id, userId))
        .returning();

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ objectPath, user: updatedUser });
    } catch (error) {
      console.error("Error updating profile image:", error);
      res.status(500).json({ message: "Failed to update profile image" });
    }
  });

  // Serve uploaded objects - allow public objects without auth
  app.get("/objects/:objectPath(*)", async (req: any, res) => {
    try {
      const { ObjectStorageService, ObjectNotFoundError } = await import("./objectStorage");
      const { ObjectPermission, getObjectAclPolicy } = await import("./objectAcl");
      const objectStorageService = new ObjectStorageService();
      
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      
      // Check ACL - if public, serve without auth
      const aclPolicy = await getObjectAclPolicy(objectFile);
      if (aclPolicy?.visibility === "public") {
        return objectStorageService.downloadObject(objectFile, res);
      }
      
      // For private objects, require authentication
      // Try to get user from Firebase token if present
      let userId: string | undefined;
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        try {
          const token = authHeader.substring(7);
          const decodedToken = await verifyFirebaseToken(token);
          userId = decodedToken?.uid;
        } catch {}
      }
      
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId,
        requestedPermission: ObjectPermission.READ,
      });
      
      if (!canAccess) {
        return res.sendStatus(401);
      }
      
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving object:", error);
      const { ObjectNotFoundError } = await import("./objectStorage");
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // ==================== FITNESS API ROUTES (Protected) ====================
  
  // Nutrition logs - filtered by user
  app.get("/api/fitness/nutrition", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const logs = await db.select().from(nutritionLogs).where(eq(nutritionLogs.userId, userId));
      res.json(logs);
    } catch (error) {
      console.error("Error fetching nutrition logs:", error);
      res.status(500).json({ error: "Failed to fetch nutrition logs" });
    }
  });

  app.post("/api/fitness/nutrition", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const parsed = insertNutritionLogSchema.parse({ ...req.body, userId });
      const [log] = await db.insert(nutritionLogs).values(parsed).returning();
      res.json(log);
    } catch (error) {
      console.error("Error creating nutrition log:", error);
      res.status(400).json({ error: "Failed to create nutrition log" });
    }
  });

  app.put("/api/fitness/nutrition/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const { calories, protein, carbs, fats, creatine, waterGallon, deficit, caloriesBurned, meals, date, completedToggles } = req.body;
      const [log] = await db.update(nutritionLogs)
        .set({ calories, protein, carbs, fats, creatine, waterGallon, deficit, caloriesBurned, meals, date, completedToggles })
        .where(and(eq(nutritionLogs.id, id), eq(nutritionLogs.userId, userId)))
        .returning();
      if (!log) return res.status(404).json({ error: "Nutrition log not found" });
      res.json(log);
    } catch (error) {
      console.error("Error updating nutrition log:", error);
      res.status(400).json({ error: "Failed to update nutrition log" });
    }
  });

  // Quick PATCH endpoint for toggling a single habit
  app.patch("/api/fitness/nutrition/:id/toggle", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const { toggleId, field, value } = req.body;
      
      // First get the current log
      const [currentLog] = await db.select().from(nutritionLogs)
        .where(and(eq(nutritionLogs.id, id), eq(nutritionLogs.userId, userId)));
      
      if (!currentLog) return res.status(404).json({ error: "Nutrition log not found" });
      
      let updateData: any = {};
      
      // Handle built-in toggles (creatine, waterGallon)
      if (field === 'creatine' || field === 'waterGallon') {
        updateData[field] = value;
      } else if (toggleId) {
        // Handle custom toggles
        const currentToggles = (currentLog.completedToggles as string[]) || [];
        if (value) {
          // Add toggle if not already present
          if (!currentToggles.includes(toggleId)) {
            updateData.completedToggles = [...currentToggles, toggleId];
          }
        } else {
          // Remove toggle
          updateData.completedToggles = currentToggles.filter((t: string) => t !== toggleId);
        }
      }
      
      const [log] = await db.update(nutritionLogs)
        .set(updateData)
        .where(and(eq(nutritionLogs.id, id), eq(nutritionLogs.userId, userId)))
        .returning();
      
      res.json(log);
    } catch (error) {
      console.error("Error toggling habit:", error);
      res.status(400).json({ error: "Failed to toggle habit" });
    }
  });

  app.delete("/api/fitness/nutrition/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const [deleted] = await db.delete(nutritionLogs)
        .where(and(eq(nutritionLogs.id, id), eq(nutritionLogs.userId, userId)))
        .returning();
      if (!deleted) return res.status(404).json({ error: "Nutrition log not found" });
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting nutrition log:", error);
      res.status(400).json({ error: "Failed to delete nutrition log" });
    }
  });

  // Nutrition Settings - user's targets and preferences
  app.get("/api/fitness/nutrition-settings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const [settings] = await db.select().from(nutritionSettings).where(eq(nutritionSettings.userId, userId));
      if (!settings) {
        // Return default settings if none exist
        return res.json({
          userId,
          maintenanceCalories: 2500,
          calorieTarget: 2000,
          proteinTarget: 150,
          goalType: "moderate_cut",
          customToggles: [
            { id: "creatine", name: "Creatine Taken", enabled: true },
            { id: "water", name: "Gallon of Water", enabled: true },
          ],
        });
      }
      res.json(settings);
    } catch (error) {
      console.error("Error fetching nutrition settings:", error);
      res.status(500).json({ error: "Failed to fetch nutrition settings" });
    }
  });

  app.put("/api/fitness/nutrition-settings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const [existing] = await db.select().from(nutritionSettings).where(eq(nutritionSettings.userId, userId));
      
      if (existing) {
        const [updated] = await db.update(nutritionSettings)
          .set(req.body)
          .where(eq(nutritionSettings.userId, userId))
          .returning();
        return res.json(updated);
      } else {
        const parsed = insertNutritionSettingsSchema.parse({ ...req.body, userId });
        const [created] = await db.insert(nutritionSettings).values(parsed).returning();
        return res.json(created);
      }
    } catch (error) {
      console.error("Error updating nutrition settings:", error);
      res.status(400).json({ error: "Failed to update nutrition settings" });
    }
  });

  // Live Play settings - field visibility and custom fields
  const DEFAULT_LIVE_PLAY_FIELDS = [
    "date", "courtType", "gameType", "gamesPlayed", "wins", "losses",
    "performanceGrade", "confidence", "notes"
  ];

  app.get("/api/fitness/live-play-settings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const [settings] = await db.select().from(livePlaySettings).where(eq(livePlaySettings.userId, userId));
      if (!settings) {
        return res.json({
          userId,
          visibleFields: DEFAULT_LIVE_PLAY_FIELDS,
          customFields: [],
        });
      }
      res.json(settings);
    } catch (error) {
      console.error("Error fetching live play settings:", error);
      res.status(500).json({ error: "Failed to fetch live play settings" });
    }
  });

  app.put("/api/fitness/live-play-settings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const [existing] = await db.select().from(livePlaySettings).where(eq(livePlaySettings.userId, userId));
      
      if (existing) {
        const [updated] = await db.update(livePlaySettings)
          .set(req.body)
          .where(eq(livePlaySettings.userId, userId))
          .returning();
        return res.json(updated);
      } else {
        const parsed = insertLivePlaySettingsSchema.parse({ ...req.body, userId });
        const [created] = await db.insert(livePlaySettings).values(parsed).returning();
        return res.json(created);
      }
    } catch (error) {
      console.error("Error updating live play settings:", error);
      res.status(400).json({ error: "Failed to update live play settings" });
    }
  });

  // Body composition - filtered by user
  app.get("/api/fitness/body-comp", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const records = await db.select().from(bodyComposition).where(eq(bodyComposition.userId, userId));
      res.json(records);
    } catch (error) {
      console.error("Error fetching body composition:", error);
      res.status(500).json({ error: "Failed to fetch body composition" });
    }
  });

  app.post("/api/fitness/body-comp", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const parsed = insertBodyCompositionSchema.parse({ ...req.body, userId });
      const [record] = await db.insert(bodyComposition).values(parsed).returning();
      res.json(record);
    } catch (error) {
      console.error("Error creating body composition:", error);
      res.status(400).json({ error: "Failed to create body composition" });
    }
  });

  app.put("/api/fitness/body-comp/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      const [updated] = await db.update(bodyComposition)
        .set(req.body)
        .where(and(eq(bodyComposition.id, id), eq(bodyComposition.userId, userId)))
        .returning();
      if (!updated) return res.status(404).json({ error: "Body composition record not found" });
      res.json(updated);
    } catch (error) {
      console.error("Error updating body composition:", error);
      res.status(400).json({ error: "Failed to update body composition" });
    }
  });

  app.delete("/api/fitness/body-comp/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      const [deleted] = await db.delete(bodyComposition)
        .where(and(eq(bodyComposition.id, id), eq(bodyComposition.userId, userId)))
        .returning();
      if (!deleted) return res.status(404).json({ error: "Body composition record not found" });
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting body composition:", error);
      res.status(400).json({ error: "Failed to delete body composition" });
    }
  });

  // Strength workouts - filtered by user
  app.get("/api/fitness/strength", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const workouts = await db.select().from(strengthWorkouts).where(eq(strengthWorkouts.userId, userId));
      res.json(workouts);
    } catch (error) {
      console.error("Error fetching strength workouts:", error);
      res.status(500).json({ error: "Failed to fetch strength workouts" });
    }
  });

  app.post("/api/fitness/strength", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const parsed = insertStrengthWorkoutSchema.parse({ ...req.body, userId });
      const [workout] = await db.insert(strengthWorkouts).values(parsed).returning();
      res.json(workout);
    } catch (error) {
      console.error("Error creating strength workout:", error);
      res.status(400).json({ error: "Failed to create strength workout" });
    }
  });

  app.put("/api/fitness/strength/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      const [updated] = await db.update(strengthWorkouts)
        .set(req.body)
        .where(and(eq(strengthWorkouts.id, id), eq(strengthWorkouts.userId, userId)))
        .returning();
      if (!updated) return res.status(404).json({ error: "Strength workout not found" });
      res.json(updated);
    } catch (error) {
      console.error("Error updating strength workout:", error);
      res.status(400).json({ error: "Failed to update strength workout" });
    }
  });

  app.delete("/api/fitness/strength/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      const [deleted] = await db.delete(strengthWorkouts)
        .where(and(eq(strengthWorkouts.id, id), eq(strengthWorkouts.userId, userId)))
        .returning();
      if (!deleted) return res.status(404).json({ error: "Strength workout not found" });
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting strength workout:", error);
      res.status(400).json({ error: "Failed to delete strength workout" });
    }
  });

  // Skill workouts - filtered by user
  app.get("/api/fitness/skill", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const workouts = await db.select().from(skillWorkouts).where(eq(skillWorkouts.userId, userId));
      res.json(workouts);
    } catch (error) {
      console.error("Error fetching skill workouts:", error);
      res.status(500).json({ error: "Failed to fetch skill workouts" });
    }
  });

  app.post("/api/fitness/skill", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const parsed = insertSkillWorkoutSchema.parse({ ...req.body, userId });
      const [workout] = await db.insert(skillWorkouts).values(parsed).returning();
      res.json(workout);
    } catch (error) {
      console.error("Error creating skill workout:", error);
      res.status(400).json({ error: "Failed to create skill workout" });
    }
  });

  app.put("/api/fitness/skill/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      const [updated] = await db.update(skillWorkouts)
        .set(req.body)
        .where(and(eq(skillWorkouts.id, id), eq(skillWorkouts.userId, userId)))
        .returning();
      if (!updated) return res.status(404).json({ error: "Skill workout not found" });
      res.json(updated);
    } catch (error) {
      console.error("Error updating skill workout:", error);
      res.status(400).json({ error: "Failed to update skill workout" });
    }
  });

  app.delete("/api/fitness/skill/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      const [deleted] = await db.delete(skillWorkouts)
        .where(and(eq(skillWorkouts.id, id), eq(skillWorkouts.userId, userId)))
        .returning();
      if (!deleted) return res.status(404).json({ error: "Skill workout not found" });
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting skill workout:", error);
      res.status(400).json({ error: "Failed to delete skill workout" });
    }
  });

  // Basketball runs - filtered by user
  app.get("/api/fitness/runs", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const runs = await db.select().from(basketballRuns).where(eq(basketballRuns.userId, userId));
      res.json(runs);
    } catch (error) {
      console.error("Error fetching basketball runs:", error);
      res.status(500).json({ error: "Failed to fetch basketball runs" });
    }
  });

  app.post("/api/fitness/runs", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const parsed = insertBasketballRunSchema.parse({ ...req.body, userId });
      const [run] = await db.insert(basketballRuns).values(parsed).returning();
      res.json(run);
    } catch (error) {
      console.error("Error creating basketball run:", error);
      res.status(400).json({ error: "Failed to create basketball run" });
    }
  });

  app.put("/api/fitness/runs/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      const [updated] = await db.update(basketballRuns)
        .set(req.body)
        .where(and(eq(basketballRuns.id, id), eq(basketballRuns.userId, userId)))
        .returning();
      if (!updated) return res.status(404).json({ error: "Basketball run not found" });
      res.json(updated);
    } catch (error) {
      console.error("Error updating basketball run:", error);
      res.status(400).json({ error: "Failed to update basketball run" });
    }
  });

  app.delete("/api/fitness/runs/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      const [deleted] = await db.delete(basketballRuns)
        .where(and(eq(basketballRuns.id, id), eq(basketballRuns.userId, userId)))
        .returning();
      if (!deleted) return res.status(404).json({ error: "Basketball run not found" });
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting basketball run:", error);
      res.status(400).json({ error: "Failed to delete basketball run" });
    }
  });

  // Cardio runs - filtered by user
  app.get("/api/fitness/cardio", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const runs = await db.select().from(cardioRuns).where(eq(cardioRuns.userId, userId));
      res.json(runs);
    } catch (error) {
      console.error("Error fetching cardio runs:", error);
      res.status(500).json({ error: "Failed to fetch cardio runs" });
    }
  });

  app.post("/api/fitness/cardio", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const parsed = insertCardioRunSchema.parse({ ...req.body, userId });
      const [run] = await db.insert(cardioRuns).values(parsed).returning();
      res.json(run);
    } catch (error) {
      console.error("Error creating cardio run:", error);
      res.status(400).json({ error: "Failed to create cardio run" });
    }
  });

  app.put("/api/fitness/cardio/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const [updated] = await db.update(cardioRuns)
        .set(req.body)
        .where(and(eq(cardioRuns.id, id), eq(cardioRuns.userId, userId)))
        .returning();
      if (!updated) return res.status(404).json({ error: "Cardio run not found" });
      res.json(updated);
    } catch (error) {
      console.error("Error updating cardio run:", error);
      res.status(400).json({ error: "Failed to update cardio run" });
    }
  });

  app.delete("/api/fitness/cardio/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const [deleted] = await db.delete(cardioRuns)
        .where(and(eq(cardioRuns.id, id), eq(cardioRuns.userId, userId)))
        .returning();
      if (!deleted) return res.status(404).json({ error: "Cardio run not found" });
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting cardio run:", error);
      res.status(400).json({ error: "Failed to delete cardio run" });
    }
  });

  // Daily Steps - filtered by user
  app.get("/api/fitness/steps", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const steps = await db.select().from(dailySteps).where(eq(dailySteps.userId, userId));
      res.json(steps);
    } catch (error) {
      console.error("Error fetching steps:", error);
      res.status(500).json({ error: "Failed to fetch steps" });
    }
  });

  app.post("/api/fitness/steps", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { date, steps, goal } = req.body;
      
      // Check if entry exists for this date
      const existing = await db.select().from(dailySteps)
        .where(and(eq(dailySteps.userId, userId), eq(dailySteps.date, date)))
        .limit(1);
      
      if (existing.length > 0) {
        // Update existing entry
        const [updated] = await db.update(dailySteps)
          .set({ steps, goal: goal || 10000 })
          .where(eq(dailySteps.id, existing[0].id))
          .returning();
        res.json(updated);
      } else {
        // Create new entry
        const parsed = insertDailyStepsSchema.parse({ userId, date, steps, goal: goal || 10000 });
        const [created] = await db.insert(dailySteps).values(parsed).returning();
        res.json(created);
      }
    } catch (error) {
      console.error("Error creating/updating steps:", error);
      res.status(400).json({ error: "Failed to save steps" });
    }
  });

  app.put("/api/fitness/steps/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const { steps, goal } = req.body;
      const [updated] = await db.update(dailySteps)
        .set({ steps, goal })
        .where(and(eq(dailySteps.id, id), eq(dailySteps.userId, userId)))
        .returning();
      if (!updated) return res.status(404).json({ error: "Steps entry not found" });
      res.json(updated);
    } catch (error) {
      console.error("Error updating steps:", error);
      res.status(400).json({ error: "Failed to update steps" });
    }
  });

  app.delete("/api/fitness/steps/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const [deleted] = await db.delete(dailySteps)
        .where(and(eq(dailySteps.id, id), eq(dailySteps.userId, userId)))
        .returning();
      if (!deleted) return res.status(404).json({ error: "Steps entry not found" });
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting steps:", error);
      res.status(400).json({ error: "Failed to delete steps" });
    }
  });

  // ==================== AI ROUTES (Protected) ====================

  app.post("/api/ai/insights", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { message, history } = req.body;

      if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "Message is required" });
      }

      // Fetch all user data in parallel for personalized context
      const [
        user,
        milestones,
        dueDates,
        tasks,
        penalties,
        dailyLogs,
        journalEntries,
        userCircles,
        activeSeason,
        settings,
        nutritionData,
        strengthData,
        cardioData,
        runsData,
        bodyCompData,
      ] = await Promise.all([
        storage.getUser(userId),
        storage.getMilestones(userId),
        storage.getDueDates(userId),
        db.select().from(userTasks).where(eq(userTasks.userId, userId)),
        db.select().from(userPenalties).where(eq(userPenalties.userId, userId)),
        db.select().from(userDailyLogs).where(eq(userDailyLogs.userId, userId)).orderBy(desc(userDailyLogs.date)).limit(30),
        db.select().from(userJournalEntries).where(eq(userJournalEntries.userId, userId)).orderBy(desc(userJournalEntries.createdAt)).limit(20),
        db.select({ id: circles.id, name: circles.name, description: circles.description })
          .from(circleMembers)
          .innerJoin(circles, eq(circleMembers.circleId, circles.id))
          .where(eq(circleMembers.userId, userId)),
        db.select().from(seasons).where(and(eq(seasons.userId, userId), eq(seasons.isActive, true))).limit(1),
        db.select().from(userHabitSettings).where(eq(userHabitSettings.userId, userId)).limit(1),
        db.select().from(nutritionLogs).where(eq(nutritionLogs.userId, userId)).orderBy(desc(nutritionLogs.date)).limit(14),
        db.select().from(strengthWorkouts).where(eq(strengthWorkouts.userId, userId)).orderBy(desc(strengthWorkouts.date)).limit(10),
        db.select().from(cardioRuns).where(eq(cardioRuns.userId, userId)).orderBy(desc(cardioRuns.date)).limit(10),
        db.select().from(basketballRuns).where(eq(basketballRuns.userId, userId)).orderBy(desc(basketballRuns.date)).limit(10),
        db.select().from(bodyComposition).where(eq(bodyComposition.userId, userId)).orderBy(desc(bodyComposition.date)).limit(5),
      ]);

      // Build personalized context for the AI
      const userName = user?.firstName || user?.displayName || "there";
      const activeSeasonData = activeSeason[0];
      const userSettings = settings[0];

      // Summarize user data for the AI context
      const milestoneSummary = milestones.length > 0 
        ? `User has ${milestones.length} milestones: ${milestones.slice(0, 5).map(m => `"${m.name}" (${m.achieved ? 'achieved' : 'in progress'}${m.deadline ? `, deadline: ${m.deadline}` : ''})`).join(', ')}${milestones.length > 5 ? ` and ${milestones.length - 5} more` : ''}`
        : "No milestones set yet.";

      const dueDateSummary = dueDates.length > 0 
        ? `User has ${dueDates.length} due dates: ${dueDates.slice(0, 5).map(d => `"${d.title}" due ${d.dueDate} (${d.status})`).join(', ')}${dueDates.length > 5 ? ` and ${dueDates.length - 5} more` : ''}`
        : "No due dates set.";

      const taskSummary = tasks.length > 0 
        ? `User tracks ${tasks.length} daily tasks: ${tasks.slice(0, 8).map(t => `"${t.name}" (${t.value} pts, ${t.category || 'uncategorized'})`).join(', ')}${tasks.length > 8 ? ` and ${tasks.length - 8} more` : ''}`
        : "No tasks set up yet.";

      const penaltySummary = penalties.length > 0 
        ? `User has ${penalties.length} penalties to avoid: ${penalties.slice(0, 5).map(p => `"${p.name}" (-${Math.abs(p.value)} pts)`).join(', ')}${penalties.length > 5 ? ` and ${penalties.length - 5} more` : ''}`
        : "No penalties set.";

      // Calculate recent progress from daily logs (guard against null values)
      const recentLogs = dailyLogs.slice(0, 7);
      const recentProgress = recentLogs.length > 0 
        ? `Recent activity (last ${recentLogs.length} days): ${recentLogs.map(log => {
            const taskIds = log.completedTaskIds;
            const completedCount = Array.isArray(taskIds) ? taskIds.length : 0;
            return `${log.date}: ${completedCount} tasks, ${log.taskPoints || 0} pts`;
          }).join('; ')}`
        : "No recent activity logged.";

      const journalSummary = journalEntries.length > 0 
        ? `Recent journal entries: ${journalEntries.slice(0, 3).map(j => `"${j.content?.slice(0, 100)}..." (${j.date})`).join('; ')}`
        : "No journal entries yet.";

      const circleSummary = userCircles.length > 0 
        ? `Member of ${userCircles.length} circles: ${userCircles.map(c => `"${c.name}"`).join(', ')}`
        : "Not part of any circles yet.";

      const seasonSummary = activeSeasonData 
        ? `Active season: "${activeSeasonData.name}" (created ${activeSeasonData.createdAt ? new Date(activeSeasonData.createdAt).toLocaleDateString() : 'recently'})`
        : "No active season.";

      const goalsSummary = userSettings 
        ? `Daily goal: ${userSettings.dailyGoal || 0} pts, Weekly goal: ${userSettings.weeklyGoal || 0} pts`
        : "No goals configured.";

      // Fitness data summaries
      const nutritionSummary = nutritionData.length > 0
        ? `Recent nutrition (${nutritionData.length} entries): ${nutritionData.slice(0, 5).map(n => `${n.date}: ${n.calories || 0} cal, ${n.protein || 0}g protein`).join('; ')}`
        : "No nutrition data logged.";

      const strengthSummary = strengthData.length > 0
        ? `Recent strength workouts (${strengthData.length} sessions): ${strengthData.slice(0, 5).map(s => `${s.date}: ${s.type || 'workout'}${s.duration ? ` (${s.duration} min)` : ''}`).join('; ')}`
        : "No strength workouts logged.";

      const cardioSummary = cardioData.length > 0
        ? `Recent cardio (${cardioData.length} sessions): ${cardioData.slice(0, 5).map(c => `${c.date}: ${c.type || 'cardio'}${c.duration ? ` (${c.duration} min)` : ''}${c.distance ? `, ${c.distance} mi` : ''}`).join('; ')}`
        : "No cardio sessions logged.";

      const runsSummary = runsData.length > 0
        ? `Recent basketball runs (${runsData.length} sessions): ${runsData.slice(0, 5).map(r => `${r.date}: ${r.location || 'session'}${r.duration ? ` (${r.duration} min)` : ''}`).join('; ')}`
        : "No basketball runs logged.";

      const bodySummary = bodyCompData.length > 0
        ? `Body composition (${bodyCompData.length} entries): ${bodyCompData.slice(0, 3).map(b => `${b.date}: ${b.weight ? `${b.weight} lbs` : ''}${b.bodyFat ? `, ${b.bodyFat}% BF` : ''}`).join('; ')}`
        : "No body composition data logged.";

      // Get user's custom AI instructions
      const customInstructions = userSettings?.aiInstructions || "";
      const customInstructionsSection = customInstructions 
        ? `\n\nUSER'S CUSTOM INSTRUCTIONS (follow these carefully):\n${customInstructions}`
        : "";

      // Create the personalized system prompt
      const personalizedContext = `You are a personal habit tracking assistant for ${userName} in the FrisFocus app. You have access to their complete habit data and should provide personalized insights, encouragement, and actionable suggestions.

USER'S CURRENT DATA:

MILESTONES: ${milestoneSummary}

DUE DATES: ${dueDateSummary}

DAILY TASKS: ${taskSummary}

PENALTIES: ${penaltySummary}

RECENT PROGRESS: ${recentProgress}

JOURNAL: ${journalSummary}

CIRCLES: ${circleSummary}

SEASON: ${seasonSummary}

GOALS: ${goalsSummary}

FITNESS DATA:
- ${nutritionSummary}
- ${strengthSummary}
- ${cardioSummary}
- ${runsSummary}
- ${bodySummary}${customInstructionsSection}

GUIDELINES:
- Reference specific tasks, milestones, and data when giving advice
- Celebrate progress and achievements with genuine encouragement
- Identify patterns in their habits (what's working, what needs attention)
- Give specific, actionable suggestions based on their actual data
- Be warm, supportive, and personalized - you know their goals and progress
- If they ask about something not in their data, guide them to set it up
- Keep responses concise but meaningful (2-3 paragraphs max unless they ask for more detail)
- Never make up data - only reference what's in their actual records`;

      const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
        { role: "system", content: personalizedContext },
      ];

      if (Array.isArray(history)) {
        for (const msg of history) {
          if (msg.role === "user" || msg.role === "assistant") {
            messages.push({ role: msg.role, content: msg.content });
          }
        }
      }

      messages.push({ role: "user", content: message });

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages,
        max_tokens: 1000,
      });

      const content = response.choices[0]?.message?.content || "I'm here to help! Could you tell me more about what you'd like to know?";

      res.json({ content });
    } catch (error) {
      console.error("AI insights error:", error);
      res.status(500).json({ error: "Failed to get AI response" });
    }
  });

  // AI-powered task generation from user's vision/goals
  app.post("/api/ai/generate-tasks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Validate request body
      const parseResult = aiGenerateTasksRequestSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: "Invalid request", details: parseResult.error.issues });
      }
      
      const { visionStatement, focusAreas, timeAvailability, existingCategories } = parseResult.data;
      
      // Get the system prompt (includes custom instructions if configured)
      const systemPrompt = getSimpleTaskGenerationPrompt();

      const userPrompt = `Here is my vision for the next 6 months:

${visionStatement}

${focusAreas && focusAreas.length > 0 ? `\nMy key focus areas: ${focusAreas.join(", ")}` : ""}
${timeAvailability ? `\nMy time availability for habits: ${timeAvailability}` : ""}
${existingCategories && existingCategories.length > 0 ? `\nI already have these categories: ${existingCategories.join(", ")}` : ""}

Please analyze my goals and generate a personalized set of daily habits, penalties to avoid, and categories. Return valid JSON only.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 2000,
        response_format: { type: "json_object" },
      });

      const rawContent = response.choices[0]?.message?.content;
      if (!rawContent) {
        return res.status(500).json({ error: "AI did not return a response" });
      }

      // Parse and validate the AI response
      let aiResponse: AIGenerateTasksResponse;
      try {
        const parsed = JSON.parse(rawContent);
        const validated = aiGenerateTasksResponseSchema.safeParse(parsed);
        if (!validated.success) {
          console.error("AI response validation failed:", validated.error.issues);
          return res.status(500).json({ error: "AI response format was invalid", details: validated.error.issues });
        }
        aiResponse = validated.data;
      } catch (parseError) {
        console.error("Failed to parse AI response:", parseError);
        return res.status(500).json({ error: "Failed to parse AI response" });
      }

      res.json(aiResponse);
    } catch (error) {
      console.error("AI task generation error:", error);
      res.status(500).json({ error: "Failed to generate tasks" });
    }
  });

  // AI conversation for task generation - multi-turn guided flow
  app.post("/api/ai/task-conversation", isAuthenticated, async (req: any, res) => {
    try {
      const { aiConversationRequestSchema, aiConversationResponseSchema } = await import("@shared/schema");
      
      const parseResult = aiConversationRequestSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: "Invalid request", details: parseResult.error.issues });
      }
      
      const { message, conversationState, messageHistory } = parseResult.data;
      const currentStep = conversationState.currentStep;
      
      // Build the system prompt for conversational guidance
      const systemPrompt = getConversationFlowPrompt(currentStep);

      // Build message history for context
      const messages: Array<{role: "system" | "user" | "assistant", content: string}> = [
        { role: "system", content: systemPrompt }
      ];
      
      for (const msg of messageHistory) {
        messages.push({ role: msg.role, content: msg.content });
      }
      messages.push({ role: "user", content: message });

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages,
        max_tokens: 800,
        response_format: { type: "json_object" },
      });

      const rawContent = response.choices[0]?.message?.content;
      if (!rawContent) {
        return res.status(500).json({ error: "AI did not return a response" });
      }

      // Parse AI response
      let aiParsed: any;
      try {
        aiParsed = JSON.parse(rawContent);
      } catch {
        return res.status(500).json({ error: "Failed to parse AI response" });
      }

      // Update conversation state with extracted data
      const updatedState = { ...conversationState };
      
      if (aiParsed.extractedData) {
        const ext = aiParsed.extractedData;
        
        // Add new goals
        if (ext.goals && Array.isArray(ext.goals)) {
          const existingDescs = updatedState.goals.map(g => g.description.toLowerCase());
          for (const goal of ext.goals) {
            if (!existingDescs.includes(goal.toLowerCase())) {
              updatedState.goals.push({ description: goal });
            }
          }
        }
        
        // Update priorities if provided
        if (ext.priorities && Array.isArray(ext.priorities)) {
          for (let i = 0; i < ext.priorities.length && i < updatedState.goals.length; i++) {
            const goalIndex = ext.priorities[i];
            if (typeof goalIndex === 'number' && goalIndex < updatedState.goals.length) {
              updatedState.goals[goalIndex].priority = i + 1;
            }
          }
        }
        
        // Add challenges
        if (ext.challenges && Array.isArray(ext.challenges)) {
          for (const c of ext.challenges) {
            if (!updatedState.challenges.includes(c)) {
              updatedState.challenges.push(c);
            }
          }
        }
        
        // Add bad habits
        if (ext.badHabits && Array.isArray(ext.badHabits)) {
          for (const h of ext.badHabits) {
            if (!updatedState.badHabits.includes(h)) {
              updatedState.badHabits.push(h);
            }
          }
        }
        
        // Set time availability
        if (ext.timeAvailability && ["minimal", "moderate", "dedicated"].includes(ext.timeAvailability)) {
          updatedState.timeAvailability = ext.timeAvailability;
        }
        
        // Set aggressiveness
        if (ext.aggressiveness && ["gentle", "moderate", "aggressive", "intense"].includes(ext.aggressiveness)) {
          updatedState.aggressiveness = ext.aggressiveness;
        }
        
        // Add hobbies
        if (ext.hobbies && Array.isArray(ext.hobbies)) {
          if (!updatedState.hobbies) updatedState.hobbies = [];
          for (const hobby of ext.hobbies) {
            if (!updatedState.hobbies.includes(hobby)) {
              updatedState.hobbies.push(hobby);
            }
          }
        }
      }
      
      // Update step
      if (aiParsed.nextStep) {
        updatedState.currentStep = aiParsed.nextStep;
      }

      const responseData: z.infer<typeof aiConversationResponseSchema> = {
        assistantMessage: aiParsed.message || "Could you tell me more?",
        updatedState,
        isComplete: aiParsed.readyToGenerate === true || updatedState.currentStep === "complete",
      };

      res.json(responseData);
    } catch (error) {
      console.error("AI conversation error:", error);
      res.status(500).json({ error: "Failed to process conversation" });
    }
  });

  // Finalize - generate tasks from conversation state
  app.post("/api/ai/task-conversation/finalize", isAuthenticated, async (req: any, res) => {
    try {
      const { aiFinalizeRequestSchema, aiGenerateTasksResponseSchema } = await import("@shared/schema");
      
      const parseResult = aiFinalizeRequestSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: "Invalid request", details: parseResult.error.issues });
      }
      
      const { conversationState, existingCategories } = parseResult.data;
      
      // Build comprehensive prompt from conversation state
      const goalsText = conversationState.goals
        .sort((a, b) => (a.priority || 99) - (b.priority || 99))
        .map((g, i) => `${i + 1}. ${g.description}${g.priority ? ` (priority: ${g.priority})` : ""}`)
        .join("\n");
      
      const challengesText = conversationState.challenges.length > 0 
        ? `\nThings they find difficult: ${conversationState.challenges.join(", ")}`
        : "";
      
      const habitsText = conversationState.badHabits.length > 0
        ? `\nBad habits to break: ${conversationState.badHabits.join(", ")}`
        : "";
      
      const timeText = conversationState.timeAvailability
        ? `\nTime availability: ${conversationState.timeAvailability}`
        : "";
        
      const aggressivenessText = conversationState.aggressiveness
        ? `\nAggressiveness level: ${conversationState.aggressiveness}`
        : "";
        
      const hobbiesText = conversationState.hobbies && conversationState.hobbies.length > 0
        ? `\nHobbies/interests to incorporate: ${conversationState.hobbies.join(", ")}`
        : "";

      const systemPrompt = getTaskFinalizationPrompt();

      const userPrompt = `Here's what I learned from my conversation with this user:

Their goals for the next 6 months:
${goalsText}
${challengesText}
${habitsText}
${aggressivenessText}
${hobbiesText}
${timeText}
${conversationState.additionalContext ? `\nAdditional context: ${conversationState.additionalContext}` : ""}
${existingCategories && existingCategories.length > 0 ? `\nExisting categories to reuse if relevant: ${existingCategories.join(", ")}` : ""}

Generate personalized habits and penalties based on this detailed understanding. Remember: target 50-point daily goal, make all tasks actionable and specific, add boosters for mustDo tasks. Return valid JSON only.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 2000,
        response_format: { type: "json_object" },
      });

      const rawContent = response.choices[0]?.message?.content;
      if (!rawContent) {
        return res.status(500).json({ error: "AI did not return a response" });
      }

      let aiResponse: AIGenerateTasksResponse;
      try {
        const parsed = JSON.parse(rawContent);
        const validated = aiGenerateTasksResponseSchema.safeParse(parsed);
        if (!validated.success) {
          console.error("AI finalize validation failed:", validated.error.issues);
          return res.status(500).json({ error: "AI response format was invalid" });
        }
        aiResponse = validated.data;
      } catch {
        return res.status(500).json({ error: "Failed to parse AI response" });
      }

      res.json(aiResponse);
    } catch (error) {
      console.error("AI finalize error:", error);
      res.status(500).json({ error: "Failed to generate tasks" });
    }
  });

  // AI badge generation endpoint
  app.post("/api/ai/generate-badges", isAuthenticated, async (req: any, res) => {
    try {
      const { aiGenerateBadgesRequestSchema, aiGenerateBadgesResponseSchema } = await import("@shared/schema");
      
      const parseResult = aiGenerateBadgesRequestSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: "Invalid request", details: parseResult.error.issues });
      }
      
      const { tasks, existingBadges } = parseResult.data;
      
      if (tasks.length === 0) {
        return res.status(400).json({ error: "No tasks provided. Please create tasks first before generating badges." });
      }
      
      const tasksText = tasks.map(t => `- ${t.name} (${t.category}, ${t.priority})`).join("\n");
      
      const systemPrompt = BADGE_GENERATION_PROMPT;

      const userPrompt = `Generate achievement badges for this user's tasks:

${tasksText}

${existingBadges && existingBadges.length > 0 ? `\nExisting badges to avoid duplicating: ${existingBadges.join(", ")}` : ""}

Create motivating badges that will encourage consistency. Return valid JSON only.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 1500,
        response_format: { type: "json_object" },
      });

      const rawContent = response.choices[0]?.message?.content;
      if (!rawContent) {
        return res.status(500).json({ error: "AI did not return a response" });
      }

      let aiResponse: any;
      try {
        const parsed = JSON.parse(rawContent);
        const validated = aiGenerateBadgesResponseSchema.safeParse(parsed);
        if (!validated.success) {
          console.error("AI badge validation failed:", validated.error.issues);
          return res.status(500).json({ error: "AI response format was invalid" });
        }
        aiResponse = validated.data;
      } catch {
        return res.status(500).json({ error: "Failed to parse AI response" });
      }

      res.json(aiResponse);
    } catch (error) {
      console.error("AI badge generation error:", error);
      res.status(500).json({ error: "Failed to generate badges" });
    }
  });

  // ==================== FRIENDS API ROUTES ====================

  // Get all friends (accepted friendships)
  app.get("/api/friends", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      // Get all accepted friendships where user is either requester or addressee
      const friendshipsList = await db.select().from(friendships).where(
        and(
          eq(friendships.status, "accepted"),
          or(
            eq(friendships.requesterId, userId),
            eq(friendships.addresseeId, userId)
          )
        )
      );

      // Get friend IDs
      const friendIds = friendshipsList.map(f => 
        f.requesterId === userId ? f.addresseeId : f.requesterId
      );

      if (friendIds.length === 0) {
        return res.json([]);
      }

      // Get friend details with stats and sharing settings
      const friendsWithStats = await Promise.all(
        friendIds.map(async (friendId) => {
          const friendship = friendshipsList.find(f => 
            f.requesterId === friendId || f.addresseeId === friendId
          );
          
          const [user] = await db.select().from(users).where(eq(users.id, friendId));
          const [stats] = await db.select().from(userStats).where(eq(userStats.userId, friendId));
          const [settings] = await db.select().from(sharingSettings).where(eq(sharingSettings.userId, friendId));

          // Default to sharing if no settings exist (sharePoints !== false means true or undefined)
          const sharePoints = settings?.sharePoints !== false;
          const shareStreaks = settings?.shareStreaks !== false;
          const shareBadges = settings?.shareBadges !== false;

          return {
            id: friendship?.id,
            friendId,
            displayName: user?.displayName ?? null,
            firstName: user?.firstName ?? null,
            lastName: user?.lastName ?? null,
            profileImageUrl: user?.profileImageUrl ?? null,
            weeklyPoints: sharePoints ? (stats?.weeklyPoints ?? 0) : null,
            dayStreak: shareStreaks ? (stats?.dayStreak ?? 0) : null,
            weekStreak: shareStreaks ? (stats?.weekStreak ?? 0) : null,
            totalBadgesEarned: shareBadges ? (stats?.totalBadgesEarned ?? 0) : null,
            sharePoints,
            shareStreaks,
            shareBadges,
          };
        })
      );

      res.json(friendsWithStats);
    } catch (error) {
      console.error("Error fetching friends:", error);
      res.status(500).json({ error: "Failed to fetch friends" });
    }
  });

  // Get pending friend requests (incoming)
  app.get("/api/friends/requests", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      console.log("[DEBUG] Fetching incoming friend requests for userId:", userId);

      // Get pending requests where user is the addressee
      const pendingRequests = await db.select().from(friendships).where(
        and(
          eq(friendships.status, "pending"),
          eq(friendships.addresseeId, userId)
        )
      );
      console.log("[DEBUG] Found pending requests:", pendingRequests.length, pendingRequests);

      // Get requester details
      const requestsWithDetails = await Promise.all(
        pendingRequests.map(async (request) => {
          const [requester] = await db.select().from(users).where(eq(users.id, request.requesterId));
          return {
            id: request.id,
            requesterId: request.requesterId,
            displayName: requester?.displayName ?? null,
            firstName: requester?.firstName ?? null,
            lastName: requester?.lastName ?? null,
            profileImageUrl: requester?.profileImageUrl ?? null,
            createdAt: request.createdAt,
          };
        })
      );

      console.log("[DEBUG] Returning requests with details:", requestsWithDetails);
      res.json(requestsWithDetails);
    } catch (error) {
      console.error("Error fetching friend requests:", error);
      res.status(500).json({ error: "Failed to fetch friend requests" });
    }
  });

  // Get outgoing friend requests
  app.get("/api/friends/requests/outgoing", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      // Get pending requests where user is the requester
      const outgoingRequests = await db.select().from(friendships).where(
        and(
          eq(friendships.status, "pending"),
          eq(friendships.requesterId, userId)
        )
      );

      // Get addressee details
      const requestsWithDetails = await Promise.all(
        outgoingRequests.map(async (request) => {
          const [addressee] = await db.select().from(users).where(eq(users.id, request.addresseeId));
          return {
            id: request.id,
            addresseeId: request.addresseeId,
            displayName: addressee?.displayName ?? null,
            firstName: addressee?.firstName ?? null,
            lastName: addressee?.lastName ?? null,
            profileImageUrl: addressee?.profileImageUrl ?? null,
            createdAt: request.createdAt,
          };
        })
      );

      res.json(requestsWithDetails);
    } catch (error) {
      console.error("Error fetching outgoing requests:", error);
      res.status(500).json({ error: "Failed to fetch outgoing friend requests" });
    }
  });

  // Send friend request (by email, username, or userId)
  app.post("/api/friends/request", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { email, emailOrUsername, userId: targetUserId } = req.body;

      // Support userId for discovery list, email, or username
      let targetUser;
      
      if (targetUserId) {
        // Find user by ID directly
        const [user] = await db.select().from(users).where(eq(users.id, targetUserId));
        targetUser = user;
        if (!targetUser) {
          return res.status(404).json({ error: "User not found" });
        }
      } else {
        // Support both old 'email' field and new 'emailOrUsername' field
        const searchValue = emailOrUsername || email;

        if (!searchValue) {
          return res.status(400).json({ error: "Email, username, or userId is required" });
        }

        // Determine if input looks like an email
        const isEmail = searchValue.includes("@");
        
        // Find user by email or username
        if (isEmail) {
          const [user] = await db.select().from(users).where(eq(users.email, searchValue));
          targetUser = user;
        } else {
          // Search by username (case-insensitive by using lowercase)
          const [user] = await db.select().from(users).where(eq(users.username, searchValue.toLowerCase()));
          targetUser = user;
        }
        
        if (!targetUser) {
          return res.status(404).json({ error: isEmail ? "User not found with that email" : "User not found with that username" });
        }
      }

      if (targetUser.id === userId) {
        return res.status(400).json({ error: "Cannot send friend request to yourself" });
      }

      // Check if friendship already exists
      const existingFriendship = await db.select().from(friendships).where(
        or(
          and(eq(friendships.requesterId, userId), eq(friendships.addresseeId, targetUser.id)),
          and(eq(friendships.requesterId, targetUser.id), eq(friendships.addresseeId, userId))
        )
      );

      if (existingFriendship.length > 0) {
        const status = existingFriendship[0].status;
        if (status === "accepted") {
          return res.status(400).json({ error: "Already friends" });
        }
        if (status === "pending") {
          return res.status(400).json({ error: "Friend request already pending" });
        }
      }

      // Create friend request
      const [friendship] = await db.insert(friendships).values({
        requesterId: userId,
        addresseeId: targetUser.id,
        status: "pending",
      }).returning();

      // Create notification for the addressee
      const [requester] = await db.select().from(users).where(eq(users.id, userId));
      const requesterName = requester?.displayName || `${requester?.firstName || ''} ${requester?.lastName || ''}`.trim() || "Someone";
      await storage.createNotification({
        userId: targetUser.id,
        type: "friend_request",
        title: "New Friend Request",
        message: `${requesterName} sent you a friend request`,
        actorId: userId,
        resourceId: friendship.id,
        resourceType: "friendship",
      });

      res.json(friendship);
    } catch (error) {
      console.error("Error sending friend request:", error);
      res.status(500).json({ error: "Failed to send friend request" });
    }
  });

  // Send email invitation to someone not in the system
  app.post("/api/friends/invite", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { email } = req.body;

      if (!email || !email.includes("@")) {
        return res.status(400).json({ error: "Valid email address is required" });
      }

      // Check if user already exists with this email
      const [existingUser] = await db.select().from(users).where(eq(users.email, email));
      if (existingUser) {
        return res.status(400).json({ 
          error: "User already exists", 
          existingUser: true,
          message: "This email is already registered. You can send a friend request instead." 
        });
      }

      // Check if invitation already sent
      const [existingInvite] = await db.select().from(emailInvitations).where(
        and(
          eq(emailInvitations.inviterUserId, userId),
          eq(emailInvitations.invitedEmail, email),
          eq(emailInvitations.status, "pending")
        )
      );
      if (existingInvite) {
        return res.status(400).json({ error: "Invitation already sent to this email" });
      }

      // Generate unique invite code
      const inviteCode = randomBytes(16).toString("hex");
      
      // Set expiration to 30 days from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      // Get inviter details for the email
      const [inviter] = await db.select().from(users).where(eq(users.id, userId));
      const inviterName = inviter?.displayName || `${inviter?.firstName || ''} ${inviter?.lastName || ''}`.trim() || "A FrisFocus user";

      // Get app URL - always use frisfocus.com domain
      const appUrl = 'https://frisfocus.com';

      // Send invitation email
      const emailSent = await sendInvitationEmail({
        toEmail: email,
        inviterName,
        inviteCode,
        appUrl
      });

      if (!emailSent) {
        return res.status(500).json({ error: "Failed to send invitation email" });
      }

      // Store invitation in database
      const [invitation] = await db.insert(emailInvitations).values({
        inviterUserId: userId,
        invitedEmail: email,
        inviteCode,
        status: "pending",
        expiresAt,
      }).returning();

      // Award FP for sending email invitation (non-blocking)
      try {
        const { awardFp } = await import("./fpService");
        await awardFp(userId, "invite_friend_email");
      } catch (fpError) {
        console.error("Failed to award FP for email invitation:", fpError);
      }

      res.json({ 
        success: true, 
        message: `Invitation sent to ${email}`,
        invitationId: invitation.id 
      });
    } catch (error) {
      console.error("Error sending email invitation:", error);
      res.status(500).json({ error: "Failed to send invitation" });
    }
  });

  // Get pending invitations sent by the user
  app.get("/api/friends/invitations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const invitations = await db.select().from(emailInvitations).where(
        and(
          eq(emailInvitations.inviterUserId, userId),
          eq(emailInvitations.status, "pending")
        )
      );

      res.json(invitations);
    } catch (error) {
      console.error("Error fetching invitations:", error);
      res.status(500).json({ error: "Failed to fetch invitations" });
    }
  });

  // Cancel/delete a pending invitation
  app.delete("/api/friends/invitations/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;

      const [invitation] = await db.select().from(emailInvitations).where(
        and(
          eq(emailInvitations.id, id),
          eq(emailInvitations.inviterUserId, userId)
        )
      );

      if (!invitation) {
        return res.status(404).json({ error: "Invitation not found" });
      }

      await db.delete(emailInvitations).where(eq(emailInvitations.id, id));

      res.json({ success: true, message: "Invitation cancelled" });
    } catch (error) {
      console.error("Error cancelling invitation:", error);
      res.status(500).json({ error: "Failed to cancel invitation" });
    }
  });

  // Accept friend request
  app.post("/api/friends/accept/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;

      // Find the friendship
      const [friendship] = await db.select().from(friendships).where(eq(friendships.id, id));

      if (!friendship) {
        return res.status(404).json({ error: "Friend request not found" });
      }

      // Only addressee can accept
      if (friendship.addresseeId !== userId) {
        return res.status(403).json({ error: "Not authorized to accept this request" });
      }

      if (friendship.status !== "pending") {
        return res.status(400).json({ error: "Request already processed" });
      }

      // Update status to accepted
      const [updated] = await db.update(friendships)
        .set({ status: "accepted", updatedAt: new Date() })
        .where(eq(friendships.id, id))
        .returning();

      // Create notification for the original requester
      const [accepter] = await db.select().from(users).where(eq(users.id, userId));
      const accepterName = accepter?.displayName || `${accepter?.firstName || ''} ${accepter?.lastName || ''}`.trim() || "Someone";
      await storage.createNotification({
        userId: friendship.requesterId,
        type: "friend_accepted",
        title: "Friend Request Accepted",
        message: `${accepterName} accepted your friend request`,
        actorId: userId,
        resourceId: friendship.id,
        resourceType: "friendship",
      });

      // Award FP to both users for adding a friend
      const { awardFp } = await import("./fpService");
      await awardFp(userId, "add_friend");
      await awardFp(friendship.requesterId, "add_friend");
      
      // Award first_friend one-time bonus to both users
      await awardFp(userId, "first_friend", { checkDuplicate: true });
      await awardFp(friendship.requesterId, "first_friend", { checkDuplicate: true });

      res.json(updated);
    } catch (error) {
      console.error("Error accepting friend request:", error);
      res.status(500).json({ error: "Failed to accept friend request" });
    }
  });

  // Decline friend request
  app.post("/api/friends/decline/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;

      // Find the friendship
      const [friendship] = await db.select().from(friendships).where(eq(friendships.id, id));

      if (!friendship) {
        return res.status(404).json({ error: "Friend request not found" });
      }

      // Only addressee can decline
      if (friendship.addresseeId !== userId) {
        return res.status(403).json({ error: "Not authorized to decline this request" });
      }

      if (friendship.status !== "pending") {
        return res.status(400).json({ error: "Request already processed" });
      }

      // Delete the request
      await db.delete(friendships).where(eq(friendships.id, id));

      res.json({ success: true });
    } catch (error) {
      console.error("Error declining friend request:", error);
      res.status(500).json({ error: "Failed to decline friend request" });
    }
  });

  // Cancel outgoing friend request (requester can cancel their own request)
  app.post("/api/friends/cancel/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;

      // Find the friendship
      const [friendship] = await db.select().from(friendships).where(eq(friendships.id, id));

      if (!friendship) {
        return res.status(404).json({ error: "Friend request not found" });
      }

      // Only requester can cancel
      if (friendship.requesterId !== userId) {
        return res.status(403).json({ error: "Not authorized to cancel this request" });
      }

      if (friendship.status !== "pending") {
        return res.status(400).json({ error: "Request already processed" });
      }

      // Delete the request
      await db.delete(friendships).where(eq(friendships.id, id));

      res.json({ success: true });
    } catch (error) {
      console.error("Error canceling friend request:", error);
      res.status(500).json({ error: "Failed to cancel friend request" });
    }
  });

  // Remove friend
  app.delete("/api/friends/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;

      // Find the friendship
      const [friendship] = await db.select().from(friendships).where(eq(friendships.id, id));

      if (!friendship) {
        return res.status(404).json({ error: "Friendship not found" });
      }

      // Either party can remove
      if (friendship.requesterId !== userId && friendship.addresseeId !== userId) {
        return res.status(403).json({ error: "Not authorized to remove this friend" });
      }

      // Delete friendship
      await db.delete(friendships).where(eq(friendships.id, id));

      res.json({ success: true });
    } catch (error) {
      console.error("Error removing friend:", error);
      res.status(500).json({ error: "Failed to remove friend" });
    }
  });

  // Get sharing settings
  app.get("/api/friends/settings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      let [settings] = await db.select().from(sharingSettings).where(eq(sharingSettings.userId, userId));

      // Create default settings if none exist
      if (!settings) {
        [settings] = await db.insert(sharingSettings).values({
          userId,
          sharePoints: true,
          shareStreaks: true,
          shareBadges: true,
          profilePublic: false,
        }).returning();
      }

      res.json(settings);
    } catch (error) {
      console.error("Error fetching sharing settings:", error);
      res.status(500).json({ error: "Failed to fetch sharing settings" });
    }
  });

  // Update sharing settings
  app.put("/api/friends/settings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { sharePoints, shareStreaks, shareBadges, profilePublic } = req.body;

      // Check if settings exist
      let [settings] = await db.select().from(sharingSettings).where(eq(sharingSettings.userId, userId));

      if (settings) {
        // Update existing
        [settings] = await db.update(sharingSettings)
          .set({
            sharePoints: sharePoints ?? settings.sharePoints,
            shareStreaks: shareStreaks ?? settings.shareStreaks,
            shareBadges: shareBadges ?? settings.shareBadges,
            profilePublic: profilePublic ?? settings.profilePublic,
            updatedAt: new Date(),
          })
          .where(eq(sharingSettings.userId, userId))
          .returning();
      } else {
        // Create new
        [settings] = await db.insert(sharingSettings).values({
          userId,
          sharePoints: sharePoints ?? true,
          shareStreaks: shareStreaks ?? true,
          shareBadges: shareBadges ?? true,
          profilePublic: profilePublic ?? false,
        }).returning();
      }

      res.json(settings);
    } catch (error) {
      console.error("Error updating sharing settings:", error);
      res.status(500).json({ error: "Failed to update sharing settings" });
    }
  });

  // Update user stats (called when stats change)
  app.put("/api/friends/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { weeklyPoints, dayStreak, weekStreak, longestDayStreak, longestWeekStreak, totalBadgesEarned } = req.body;

      // Check if stats exist
      let [stats] = await db.select().from(userStats).where(eq(userStats.userId, userId));

      if (stats) {
        // Update existing
        [stats] = await db.update(userStats)
          .set({
            weeklyPoints: weeklyPoints ?? stats.weeklyPoints,
            dayStreak: dayStreak ?? stats.dayStreak,
            weekStreak: weekStreak ?? stats.weekStreak,
            longestDayStreak: longestDayStreak ?? stats.longestDayStreak,
            longestWeekStreak: longestWeekStreak ?? stats.longestWeekStreak,
            totalBadgesEarned: totalBadgesEarned ?? stats.totalBadgesEarned,
            updatedAt: new Date(),
          })
          .where(eq(userStats.userId, userId))
          .returning();
      } else {
        // Create new
        [stats] = await db.insert(userStats).values({
          userId,
          weeklyPoints: weeklyPoints ?? 0,
          dayStreak: dayStreak ?? 0,
          weekStreak: weekStreak ?? 0,
          longestDayStreak: longestDayStreak ?? 0,
          longestWeekStreak: longestWeekStreak ?? 0,
          totalBadgesEarned: totalBadgesEarned ?? 0,
        }).returning();
      }

      res.json(stats);
    } catch (error) {
      console.error("Error updating user stats:", error);
      res.status(500).json({ error: "Failed to update user stats" });
    }
  });

  // ==================== GPT OAuth Endpoints ====================
  // These endpoints allow a ChatGPT custom GPT to access user fitness data via OAuth

  // Authorization endpoint - GPT redirects users here
  app.get("/api/gpt/authorize", async (req: any, res) => {
    const { redirect_uri, state, client_id } = req.query;

    // Validate redirect_uri against whitelist
    if (!isValidRedirectUri(redirect_uri as string)) {
      return res.status(400).json({ error: "invalid_redirect_uri", error_description: "Redirect URI not allowed" });
    }

    // If user is not authenticated, redirect to login first
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      // Store OAuth params in session for after login
      req.session.gptOAuth = { redirect_uri, state, client_id };
      return res.redirect("/api/login");
    }

    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      // Generate authorization code
      const code = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await db.insert(gptAuthCodes).values({
        code,
        userId,
        redirectUri: redirect_uri as string,
        expiresAt,
      });

      // Redirect back to GPT with the code
      const redirectUrl = new URL(redirect_uri as string);
      redirectUrl.searchParams.set("code", code);
      if (state) {
        redirectUrl.searchParams.set("state", state as string);
      }
      res.redirect(redirectUrl.toString());
    } catch (error) {
      console.error("Error creating auth code:", error);
      res.status(500).json({ error: "Failed to create authorization code" });
    }
  });

  // Callback after login to continue OAuth flow
  app.get("/api/gpt/callback", async (req: any, res) => {
    const gptOAuth = req.session?.gptOAuth;
    if (!gptOAuth) {
      return res.status(400).json({ error: "No OAuth session found" });
    }

    // Validate redirect_uri from session
    if (!isValidRedirectUri(gptOAuth.redirect_uri)) {
      delete req.session.gptOAuth;
      return res.status(400).json({ error: "invalid_redirect_uri", error_description: "Redirect URI not allowed" });
    }

    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      // Generate authorization code
      const code = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await db.insert(gptAuthCodes).values({
        code,
        userId,
        redirectUri: gptOAuth.redirect_uri,
        expiresAt,
      });

      // Clear OAuth session
      delete req.session.gptOAuth;

      // Redirect back to GPT with the code
      const redirectUrl = new URL(gptOAuth.redirect_uri);
      redirectUrl.searchParams.set("code", code);
      if (gptOAuth.state) {
        redirectUrl.searchParams.set("state", gptOAuth.state);
      }
      res.redirect(redirectUrl.toString());
    } catch (error) {
      console.error("Error creating auth code:", error);
      res.status(500).json({ error: "Failed to create authorization code" });
    }
  });

  // Token endpoint - GPT exchanges authorization code for access token
  app.post("/api/gpt/token", async (req, res) => {
    const { code, redirect_uri, grant_type } = req.body;

    if (grant_type !== "authorization_code") {
      return res.status(400).json({ error: "unsupported_grant_type" });
    }

    try {
      // Find the auth code
      const [authCode] = await db.select().from(gptAuthCodes).where(eq(gptAuthCodes.code, code));

      if (!authCode) {
        return res.status(400).json({ error: "invalid_grant", error_description: "Invalid or expired authorization code" });
      }

      if (authCode.expiresAt < new Date()) {
        await db.delete(gptAuthCodes).where(eq(gptAuthCodes.code, code));
        return res.status(400).json({ error: "invalid_grant", error_description: "Authorization code expired" });
      }

      // Validate redirect_uri matches the one used during authorization
      if (redirect_uri && authCode.redirectUri !== redirect_uri) {
        await db.delete(gptAuthCodes).where(eq(gptAuthCodes.code, code));
        return res.status(400).json({ error: "invalid_grant", error_description: "Redirect URI mismatch" });
      }

      // Delete the code (single use)
      await db.delete(gptAuthCodes).where(eq(gptAuthCodes.code, code));

      // Generate access token
      const accessToken = randomBytes(32).toString("hex");
      const expiresIn = 3600 * 24; // 24 hours
      const expiresAt = new Date(Date.now() + expiresIn * 1000);

      await db.insert(gptAccessTokens).values({
        token: accessToken,
        userId: authCode.userId,
        expiresAt,
      });

      res.json({
        access_token: accessToken,
        token_type: "Bearer",
        expires_in: expiresIn,
      });
    } catch (error) {
      console.error("Error exchanging auth code for token:", error);
      res.status(500).json({ error: "server_error", error_description: "Failed to exchange authorization code" });
    }
  });

  // Middleware to verify GPT access token
  const verifyGptToken = async (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or invalid authorization header" });
    }

    const token = authHeader.substring(7);

    try {
      const [tokenData] = await db.select().from(gptAccessTokens).where(eq(gptAccessTokens.token, token));

      if (!tokenData) {
        return res.status(401).json({ error: "Invalid access token" });
      }

      if (tokenData.expiresAt < new Date()) {
        await db.delete(gptAccessTokens).where(eq(gptAccessTokens.token, token));
        return res.status(401).json({ error: "Access token expired" });
      }

      req.gptUserId = tokenData.userId;
      next();
    } catch (error) {
      console.error("Error verifying GPT token:", error);
      res.status(500).json({ error: "Failed to verify access token" });
    }
  };

  // GPT Data endpoint - Returns all fitness data for the authenticated user
  app.get("/api/gpt/data", verifyGptToken, async (req: any, res) => {
    try {
      const userId = req.gptUserId;

      // Fetch all fitness data for the user
      const [nutrition, bodyComp, strength, skill, runs] = await Promise.all([
        db.select().from(nutritionLogs).where(eq(nutritionLogs.userId, userId)),
        db.select().from(bodyComposition).where(eq(bodyComposition.userId, userId)),
        db.select().from(strengthWorkouts).where(eq(strengthWorkouts.userId, userId)),
        db.select().from(skillWorkouts).where(eq(skillWorkouts.userId, userId)),
        db.select().from(basketballRuns).where(eq(basketballRuns.userId, userId)),
      ]);

      res.json({
        nutritionLogs: nutrition,
        bodyComposition: bodyComp,
        strengthWorkouts: strength,
        skillWorkouts: skill,
        basketballRuns: runs,
      });
    } catch (error) {
      console.error("Error fetching GPT data:", error);
      res.status(500).json({ error: "Failed to fetch fitness data" });
    }
  });

  // ==================== GPT HABITS DATA ENDPOINTS ====================
  // These endpoints allow ChatGPT to access the user's habit tracking data

  // Get user habit stats (points, streaks)
  app.get("/api/gpt/habits/stats", verifyGptToken, async (req: any, res) => {
    try {
      const userId = req.gptUserId;

      const [stats] = await db.select().from(userStats).where(eq(userStats.userId, userId));
      const [user] = await db.select().from(users).where(eq(users.id, userId));

      if (!stats) {
        return res.json({
          userName: user?.firstName ?? "User",
          weeklyPoints: 0,
          dayStreak: 0,
          weekStreak: 0,
          longestDayStreak: 0,
          longestWeekStreak: 0,
          totalBadgesEarned: 0,
        });
      }

      res.json({
        userName: user?.firstName ?? "User",
        weeklyPoints: stats.weeklyPoints ?? 0,
        dayStreak: stats.dayStreak ?? 0,
        weekStreak: stats.weekStreak ?? 0,
        longestDayStreak: stats.longestDayStreak ?? 0,
        longestWeekStreak: stats.longestWeekStreak ?? 0,
        totalBadgesEarned: stats.totalBadgesEarned ?? 0,
      });
    } catch (error) {
      console.error("Error fetching GPT habits stats:", error);
      res.status(500).json({ error: "Failed to fetch habits stats" });
    }
  });

  // Get summary of user's habits for GPT context
  app.get("/api/gpt/habits/summary", verifyGptToken, async (req: any, res) => {
    try {
      const userId = req.gptUserId;

      const [stats] = await db.select().from(userStats).where(eq(userStats.userId, userId));
      const [user] = await db.select().from(users).where(eq(users.id, userId));

      const summary = {
        user: {
          name: user?.firstName ?? "User",
        },
        stats: {
          weeklyPoints: stats?.weeklyPoints ?? 0,
          dayStreak: stats?.dayStreak ?? 0,
          weekStreak: stats?.weekStreak ?? 0,
          longestDayStreak: stats?.longestDayStreak ?? 0,
          longestWeekStreak: stats?.longestWeekStreak ?? 0,
          totalBadgesEarned: stats?.totalBadgesEarned ?? 0,
        },
        message: `${user?.firstName ?? "User"} has earned ${stats?.weeklyPoints ?? 0} points this week. ` +
          `Current day streak: ${stats?.dayStreak ?? 0} days. ` +
          `Current week streak: ${stats?.weekStreak ?? 0} weeks. ` +
          `Total badges earned: ${stats?.totalBadgesEarned ?? 0}.`,
      };

      res.json(summary);
    } catch (error) {
      console.error("Error fetching GPT habits summary:", error);
      res.status(500).json({ error: "Failed to fetch habits summary" });
    }
  });

  // GPT endpoint to get specific data type
  app.get("/api/gpt/data/:type", verifyGptToken, async (req: any, res) => {
    try {
      const userId = req.gptUserId;
      const { type } = req.params;

      let data;
      switch (type) {
        case "nutrition":
          data = await db.select().from(nutritionLogs).where(eq(nutritionLogs.userId, userId));
          break;
        case "body-composition":
          data = await db.select().from(bodyComposition).where(eq(bodyComposition.userId, userId));
          break;
        case "strength":
          data = await db.select().from(strengthWorkouts).where(eq(strengthWorkouts.userId, userId));
          break;
        case "skill":
          data = await db.select().from(skillWorkouts).where(eq(skillWorkouts.userId, userId));
          break;
        case "runs":
          data = await db.select().from(basketballRuns).where(eq(basketballRuns.userId, userId));
          break;
        default:
          return res.status(400).json({ error: `Unknown data type: ${type}` });
      }

      res.json(data);
    } catch (error) {
      console.error("Error fetching GPT data:", error);
      res.status(500).json({ error: "Failed to fetch fitness data" });
    }
  });

  // ==================== SEASONS API ROUTES ====================

  // Get all seasons for current user
  app.get("/api/seasons", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userSeasons = await db.select().from(seasons).where(eq(seasons.userId, userId));
      res.json(userSeasons);
    } catch (error) {
      console.error("Error fetching seasons:", error);
      res.status(500).json({ error: "Failed to fetch seasons" });
    }
  });

  // Create a new season
  app.post("/api/seasons", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const parsed = insertSeasonSchema.parse({ ...req.body, userId });
      const [season] = await db.insert(seasons).values(parsed).returning();
      res.json(season);
    } catch (error) {
      console.error("Error creating season:", error);
      res.status(400).json({ error: "Failed to create season" });
    }
  });

  // Activate a season (deactivates all others for this user)
  app.put("/api/seasons/:id/activate", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;

      // Verify season belongs to user
      const [season] = await db.select().from(seasons).where(
        and(eq(seasons.id, id), eq(seasons.userId, userId))
      );
      if (!season) {
        return res.status(404).json({ error: "Season not found" });
      }

      // Deactivate all seasons for this user
      await db.update(seasons)
        .set({ isActive: false })
        .where(eq(seasons.userId, userId));

      // Activate the selected season
      const [updated] = await db.update(seasons)
        .set({ isActive: true })
        .where(eq(seasons.id, id))
        .returning();

      res.json(updated);
    } catch (error) {
      console.error("Error activating season:", error);
      res.status(500).json({ error: "Failed to activate season" });
    }
  });

  // Deactivate a season (sets isActive to false)
  app.put("/api/seasons/:id/deactivate", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;

      // Verify season belongs to user
      const [season] = await db.select().from(seasons).where(
        and(eq(seasons.id, id), eq(seasons.userId, userId))
      );
      if (!season) {
        return res.status(404).json({ error: "Season not found" });
      }

      // Deactivate the season
      const [updated] = await db.update(seasons)
        .set({ isActive: false })
        .where(eq(seasons.id, id))
        .returning();

      res.json(updated);
    } catch (error) {
      console.error("Error deactivating season:", error);
      res.status(500).json({ error: "Failed to deactivate season" });
    }
  });

  // Delete a season
  app.delete("/api/seasons/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;

      // Verify season belongs to user
      const [season] = await db.select().from(seasons).where(
        and(eq(seasons.id, id), eq(seasons.userId, userId))
      );
      if (!season) {
        return res.status(404).json({ error: "Season not found" });
      }

      await db.delete(seasons).where(eq(seasons.id, id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting season:", error);
      res.status(500).json({ error: "Failed to delete season" });
    }
  });

  // Get season with all data (tasks, categories, penalties)
  app.get("/api/seasons/:id/data", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;

      // Verify season belongs to user
      const [season] = await db.select().from(seasons).where(
        and(eq(seasons.id, id), eq(seasons.userId, userId))
      );
      if (!season) {
        return res.status(404).json({ error: "Season not found" });
      }

      // Get all associated data
      const tasks = await db.select().from(seasonTasks).where(eq(seasonTasks.seasonId, id));
      const categories = await db.select().from(seasonCategories).where(eq(seasonCategories.seasonId, id));
      const penalties = await db.select().from(seasonPenalties).where(eq(seasonPenalties.seasonId, id));

      res.json({
        ...season,
        tasks,
        categories,
        penalties,
      });
    } catch (error) {
      console.error("Error fetching season data:", error);
      res.status(500).json({ error: "Failed to fetch season data" });
    }
  });

  // Save season tasks (preserves IDs for existing tasks, generates new IDs for new tasks)
  app.put("/api/seasons/:id/tasks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const { tasks } = req.body;

      // Verify season belongs to user and is not archived
      const [season] = await db.select().from(seasons).where(
        and(eq(seasons.id, id), eq(seasons.userId, userId))
      );
      if (!season) {
        return res.status(404).json({ error: "Season not found" });
      }
      if (season.isArchived) {
        return res.status(400).json({ error: "Cannot modify an archived season" });
      }

      // Get existing tasks to determine which to update vs insert
      const existingTasks = await db.select().from(seasonTasks).where(eq(seasonTasks.seasonId, id));
      const existingIds = new Set(existingTasks.map(t => t.id));
      
      // Separate tasks into updates (have ID that exists) and inserts (new or no ID)
      const tasksToUpdate: any[] = [];
      const tasksToInsert: any[] = [];
      const incomingIds = new Set<string>();
      
      if (tasks && tasks.length > 0) {
        for (const t of tasks) {
          if (t.id && existingIds.has(t.id)) {
            // Existing task - update it
            tasksToUpdate.push(t);
            incomingIds.add(t.id);
          } else {
            // New task - insert with new ID (don't include client-side ID if it doesn't exist in DB)
            tasksToInsert.push({
              seasonId: id,
              name: t.name,
              value: t.value,
              category: t.category || "General",
              priority: t.priority || "shouldDo",
              boosterRule: t.boosterRule || null,
              penaltyRule: t.penaltyRule || null,
              tiers: t.tiers || null,
            });
          }
        }
      }
      
      // Delete tasks that were removed (not in incoming list)
      const idsToDelete = existingTasks.filter(t => !incomingIds.has(t.id)).map(t => t.id);
      if (idsToDelete.length > 0) {
        await db.delete(seasonTasks).where(
          and(eq(seasonTasks.seasonId, id), inArray(seasonTasks.id, idsToDelete))
        );
      }
      
      // Update existing tasks
      for (const t of tasksToUpdate) {
        await db.update(seasonTasks)
          .set({
            name: t.name,
            value: t.value,
            category: t.category || "General",
            priority: t.priority || "shouldDo",
            boosterRule: t.boosterRule || null,
            penaltyRule: t.penaltyRule || null,
            tiers: t.tiers || null,
          })
          .where(eq(seasonTasks.id, t.id));
      }
      
      // Insert new tasks
      if (tasksToInsert.length > 0) {
        await db.insert(seasonTasks).values(tasksToInsert);
      }

      const updatedTasks = await db.select().from(seasonTasks).where(eq(seasonTasks.seasonId, id));
      res.json(updatedTasks);
    } catch (error) {
      console.error("Error saving season tasks:", error);
      res.status(500).json({ error: "Failed to save season tasks" });
    }
  });

  // Save season categories (replaces all categories for a season)
  app.put("/api/seasons/:id/categories", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const { categories } = req.body;

      // Verify season belongs to user and is not archived
      const [season] = await db.select().from(seasons).where(
        and(eq(seasons.id, id), eq(seasons.userId, userId))
      );
      if (!season) {
        return res.status(404).json({ error: "Season not found" });
      }
      if (season.isArchived) {
        return res.status(400).json({ error: "Cannot modify an archived season" });
      }

      // Delete existing categories and insert new ones
      await db.delete(seasonCategories).where(eq(seasonCategories.seasonId, id));
      
      if (categories && categories.length > 0) {
        const categoryValues = categories.map((c: any) => ({
          seasonId: id,
          name: c.name,
        }));
        await db.insert(seasonCategories).values(categoryValues);
      }

      const updatedCategories = await db.select().from(seasonCategories).where(eq(seasonCategories.seasonId, id));
      res.json(updatedCategories);
    } catch (error) {
      console.error("Error saving season categories:", error);
      res.status(500).json({ error: "Failed to save season categories" });
    }
  });

  // Save season penalties (preserves IDs for existing penalties, generates new IDs for new penalties)
  app.put("/api/seasons/:id/penalties", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const { penalties } = req.body;

      // Verify season belongs to user and is not archived
      const [season] = await db.select().from(seasons).where(
        and(eq(seasons.id, id), eq(seasons.userId, userId))
      );
      if (!season) {
        return res.status(404).json({ error: "Season not found" });
      }
      if (season.isArchived) {
        return res.status(400).json({ error: "Cannot modify an archived season" });
      }

      // Get existing penalties to determine which to update vs insert
      const existingPenalties = await db.select().from(seasonPenalties).where(eq(seasonPenalties.seasonId, id));
      const existingIds = new Set(existingPenalties.map(p => p.id));
      
      // Separate penalties into updates (have ID that exists) and inserts (new or no ID)
      const penaltiesToUpdate: any[] = [];
      const penaltiesToInsert: any[] = [];
      const incomingIds = new Set<string>();
      
      if (penalties && penalties.length > 0) {
        for (const p of penalties) {
          if (p.id && existingIds.has(p.id)) {
            // Existing penalty - update it
            penaltiesToUpdate.push(p);
            incomingIds.add(p.id);
          } else {
            // New penalty - insert with new ID
            penaltiesToInsert.push({
              seasonId: id,
              name: p.name,
              value: p.value,
              negativeBoostEnabled: p.negativeBoostEnabled || false,
              timesThreshold: p.timesThreshold || null,
              period: p.period || null,
              boostPenaltyPoints: p.boostPenaltyPoints || null,
            });
          }
        }
      }
      
      // Delete penalties that were removed (not in incoming list)
      const idsToDelete = existingPenalties.filter(p => !incomingIds.has(p.id)).map(p => p.id);
      if (idsToDelete.length > 0) {
        await db.delete(seasonPenalties).where(
          and(eq(seasonPenalties.seasonId, id), inArray(seasonPenalties.id, idsToDelete))
        );
      }
      
      // Update existing penalties
      for (const p of penaltiesToUpdate) {
        await db.update(seasonPenalties)
          .set({
            name: p.name,
            value: p.value,
            negativeBoostEnabled: p.negativeBoostEnabled || false,
            timesThreshold: p.timesThreshold || null,
            period: p.period || null,
            boostPenaltyPoints: p.boostPenaltyPoints || null,
          })
          .where(eq(seasonPenalties.id, p.id));
      }
      
      // Insert new penalties
      if (penaltiesToInsert.length > 0) {
        await db.insert(seasonPenalties).values(penaltiesToInsert);
      }

      const updatedPenalties = await db.select().from(seasonPenalties).where(eq(seasonPenalties.seasonId, id));
      res.json(updatedPenalties);
    } catch (error) {
      console.error("Error saving season penalties:", error);
      res.status(500).json({ error: "Failed to save season penalties" });
    }
  });

  // Update season settings (weekly goal, etc.)
  app.put("/api/seasons/:id/settings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const { weeklyGoal } = req.body;

      // Verify season belongs to user and is not archived
      const [season] = await db.select().from(seasons).where(
        and(eq(seasons.id, id), eq(seasons.userId, userId))
      );
      if (!season) {
        return res.status(404).json({ error: "Season not found" });
      }
      if (season.isArchived) {
        return res.status(400).json({ error: "Cannot modify an archived season" });
      }

      const [updated] = await db.update(seasons)
        .set({ weeklyGoal })
        .where(eq(seasons.id, id))
        .returning();

      res.json(updated);
    } catch (error) {
      console.error("Error updating season settings:", error);
      res.status(500).json({ error: "Failed to update season settings" });
    }
  });

  // Archive a season
  app.put("/api/seasons/:id/archive", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;

      // Verify season belongs to user
      const [season] = await db.select().from(seasons).where(
        and(eq(seasons.id, id), eq(seasons.userId, userId))
      );
      if (!season) {
        return res.status(404).json({ error: "Season not found" });
      }

      const [updated] = await db.update(seasons)
        .set({ isArchived: true, isActive: false, archivedAt: new Date() })
        .where(eq(seasons.id, id))
        .returning();

      res.json(updated);
    } catch (error) {
      console.error("Error archiving season:", error);
      res.status(500).json({ error: "Failed to archive season" });
    }
  });

  // Import tasks from another season
  app.post("/api/seasons/:id/import", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const { sourceSeasonId, taskIds, categoryNames } = req.body;

      // Verify target season belongs to user and is not archived
      const [targetSeason] = await db.select().from(seasons).where(
        and(eq(seasons.id, id), eq(seasons.userId, userId))
      );
      if (!targetSeason) {
        return res.status(404).json({ error: "Target season not found" });
      }
      if (targetSeason.isArchived) {
        return res.status(400).json({ error: "Cannot modify an archived season" });
      }

      // Verify source season belongs to user
      const [sourceSeason] = await db.select().from(seasons).where(
        and(eq(seasons.id, sourceSeasonId), eq(seasons.userId, userId))
      );
      if (!sourceSeason) {
        return res.status(404).json({ error: "Source season not found" });
      }

      // Get source tasks and categories
      const sourceTasks = await db.select().from(seasonTasks).where(eq(seasonTasks.seasonId, sourceSeasonId));
      const sourceCategories = await db.select().from(seasonCategories).where(eq(seasonCategories.seasonId, sourceSeasonId));

      // Filter and import selected tasks
      const tasksToImport = taskIds 
        ? sourceTasks.filter(t => taskIds.includes(t.id))
        : sourceTasks;

      if (tasksToImport.length > 0) {
        const taskValues = tasksToImport.map(t => ({
          seasonId: id,
          name: t.name,
          value: t.value,
          category: t.category,
          priority: t.priority,
          boosterRule: t.boosterRule,
          penaltyRule: t.penaltyRule,
        }));
        await db.insert(seasonTasks).values(taskValues);
      }

      // Filter and import selected categories
      const categoriesToImport = categoryNames
        ? sourceCategories.filter(c => categoryNames.includes(c.name))
        : sourceCategories;

      if (categoriesToImport.length > 0) {
        // Get existing categories in target season to avoid duplicates
        const existingCategories = await db.select().from(seasonCategories).where(eq(seasonCategories.seasonId, id));
        const existingNames = new Set(existingCategories.map(c => c.name));
        
        const newCategories = categoriesToImport.filter(c => !existingNames.has(c.name));
        if (newCategories.length > 0) {
          const categoryValues = newCategories.map(c => ({
            seasonId: id,
            name: c.name,
          }));
          await db.insert(seasonCategories).values(categoryValues);
        }
      }

      // Return updated data
      const updatedTasks = await db.select().from(seasonTasks).where(eq(seasonTasks.seasonId, id));
      const updatedCategories = await db.select().from(seasonCategories).where(eq(seasonCategories.seasonId, id));

      res.json({ tasks: updatedTasks, categories: updatedCategories });
    } catch (error) {
      console.error("Error importing from season:", error);
      res.status(500).json({ error: "Failed to import from season" });
    }
  });

  // Sync data from development to production
  // This endpoint allows users to seed their production database with their dev data
  app.post("/api/sync-from-dev", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Check if user has any seasons in the current database
      const existingSeasons = await db.select().from(seasons).where(eq(seasons.userId, userId));
      
      if (existingSeasons.length > 0) {
        return res.json({ 
          message: "Data already exists", 
          synced: false,
          seasonsCount: existingSeasons.length 
        });
      }
      
      // Development data to sync - this is exported from the dev database
      // User: jfrisby@udel.edu (JSfNqxtDjvbLu9JuFJ0INVxV0lI3)
      const devSeasons = [
        {
          id: "3baabada-5d96-40c1-be0d-9975561620e1",
          userId: "JSfNqxtDjvbLu9JuFJ0INVxV0lI3",
          name: "ih",
          description: "iuhub",
          isActive: false,
          isArchived: true,
          weeklyGoal: 100,
          createdAt: new Date("2025-12-08T02:17:35.147Z"),
          archivedAt: new Date("2025-12-08T02:45:17.424Z"),
        },
        {
          id: "8f022acc-cc6a-4263-af6e-1a4bee0df45f",
          userId: "JSfNqxtDjvbLu9JuFJ0INVxV0lI3",
          name: "Q2",
          description: "simss",
          isActive: true,
          isArchived: false,
          weeklyGoal: 100,
          createdAt: new Date("2025-12-08T02:45:28.780Z"),
          archivedAt: null,
        }
      ];
      
      // Only sync if the user ID matches
      if (userId !== "JSfNqxtDjvbLu9JuFJ0INVxV0lI3") {
        return res.json({ 
          message: "No development data found for this user", 
          synced: false 
        });
      }
      
      // Insert the seasons
      for (const season of devSeasons) {
        await db.insert(seasons).values(season).onConflictDoNothing();
      }
      
      res.json({ 
        message: "Successfully synced development data to production", 
        synced: true,
        seasonsCount: devSeasons.length 
      });
    } catch (error) {
      console.error("Error syncing from dev:", error);
      res.status(500).json({ error: "Failed to sync from development" });
    }
  });

  // ==================== COMMUNITY POSTS API ====================

  // Get community feed (simplified endpoint for dashboard FeedCard)
  app.get("/api/community/feed", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get friends for filtering friends-only posts
      const userFriendships = await db.select().from(friendships).where(
        and(
          eq(friendships.status, "accepted"),
          or(
            eq(friendships.requesterId, userId),
            eq(friendships.addresseeId, userId)
          )
        )
      );
      const friendIds = userFriendships.map(f => 
        f.requesterId === userId ? f.addresseeId : f.requesterId
      );

      // Get all posts that are either public or from friends with friends visibility
      const allPosts = await db.select().from(communityPosts).orderBy(desc(communityPosts.createdAt)).limit(20);
      
      // Filter posts based on visibility
      const visiblePosts = allPosts.filter(post => {
        if (post.authorId === userId) return true;
        if (post.visibility === "public") return true;
        if (post.visibility === "friends" && friendIds.includes(post.authorId)) return true;
        return false;
      });

      // Enrich with author info, like counts, and isLiked status
      const enrichedPosts = await Promise.all(
        visiblePosts.map(async (post) => {
          const [author] = await db.select().from(users).where(eq(users.id, post.authorId));
          const likes = await db.select().from(postLikes).where(eq(postLikes.postId, post.id));
          const comments = await db.select().from(postComments).where(eq(postComments.postId, post.id));
          const userLike = likes.find(l => l.userId === userId);

          return {
            ...post,
            author: author ? {
              id: author.id,
              firstName: author.firstName,
              lastName: author.lastName,
              displayName: author.displayName,
              profileImageUrl: author.profileImageUrl,
            } : null,
            likeCount: likes.length,
            commentCount: comments.length,
            isLiked: !!userLike,
          };
        })
      );

      res.json(enrichedPosts);
    } catch (error) {
      console.error("Error fetching community feed:", error);
      res.status(500).json({ error: "Failed to fetch community feed" });
    }
  });

  // Get all community posts (public + friends' posts)
  app.get("/api/community/posts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Auto-fix ACLs for post images (runs in background, doesn't block response)
      (async () => {
        try {
          const { ObjectStorageService } = await import("./objectStorage");
          const { setObjectAclPolicy, getObjectAclPolicy } = await import("./objectAcl");
          const objectStorageService = new ObjectStorageService();
          
          // Get user's posts with images
          const userPostsWithImages = await db.select().from(communityPosts).where(
            eq(communityPosts.authorId, userId)
          );
          
          for (const post of userPostsWithImages) {
            if (post.imageUrl && post.imageUrl.startsWith('/objects/')) {
              try {
                const objectFile = await objectStorageService.getObjectEntityFile(post.imageUrl);
                const existingAcl = await getObjectAclPolicy(objectFile);
                if (!existingAcl || existingAcl.visibility !== "public") {
                  await setObjectAclPolicy(objectFile, {
                    owner: post.authorId,
                    visibility: "public",
                  });
                  console.log(`[ACL] Fixed public ACL for post image: ${post.imageUrl}`);
                }
              } catch (err) {
                // Silently ignore - file may not exist
              }
            }
          }
          
          // Also fix user's profile image ACL
          const [currentUser] = await db.select().from(users).where(eq(users.id, userId));
          if (currentUser?.profileImageUrl?.startsWith('/objects/')) {
            try {
              const objectFile = await objectStorageService.getObjectEntityFile(currentUser.profileImageUrl);
              const existingAcl = await getObjectAclPolicy(objectFile);
              if (!existingAcl || existingAcl.visibility !== "public") {
                await setObjectAclPolicy(objectFile, {
                  owner: userId,
                  visibility: "public",
                });
                console.log(`[ACL] Fixed public ACL for profile image: ${currentUser.profileImageUrl}`);
              }
            } catch (err) {
              // Silently ignore
            }
          }
        } catch (err) {
          console.error("[ACL] Background ACL fix error:", err);
        }
      })();

      // Get user's friend IDs
      const friendshipsList = await db.select().from(friendships).where(
        and(
          eq(friendships.status, "accepted"),
          or(
            eq(friendships.requesterId, userId),
            eq(friendships.addresseeId, userId)
          )
        )
      );

      const friendIds = friendshipsList.map(f => 
        f.requesterId === userId ? f.addresseeId : f.requesterId
      );

      // Get all posts: public posts OR posts by friends OR own posts
      // Build conditions array, filtering out undefined values
      const conditions = [
        eq(communityPosts.visibility, "public"),
        eq(communityPosts.authorId, userId),
      ];
      if (friendIds.length > 0) {
        conditions.push(inArray(communityPosts.authorId, friendIds));
      }
      
      const posts = await db.select().from(communityPosts)
        .where(or(...conditions))
        .orderBy(desc(communityPosts.createdAt));

      // Get like counts and user's likes for each post
      const postsWithData = await Promise.all(
        posts.map(async (post) => {
          const likes = await db.select().from(postLikes).where(eq(postLikes.postId, post.id));
          const commentsList = await db.select().from(postComments).where(eq(postComments.postId, post.id));
          const [author] = await db.select().from(users).where(eq(users.id, post.authorId));

          return {
            ...post,
            likeCount: likes.length,
            commentCount: commentsList.length,
            isLiked: likes.some(l => l.userId === userId),
            author: author ? {
              id: author.id,
              firstName: author.firstName,
              lastName: author.lastName,
              displayName: author.displayName,
              profileImageUrl: author.profileImageUrl,
            } : null,
          };
        })
      );

      res.json(postsWithData);
    } catch (error) {
      console.error("Error fetching community posts:", error);
      res.status(500).json({ error: "Failed to fetch posts" });
    }
  });

  // Fix ACL policies on existing post images (admin utility)
  app.post("/api/community/fix-image-acls", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { ObjectStorageService } = await import("./objectStorage");
      const { setObjectAclPolicy } = await import("./objectAcl");
      const objectStorageService = new ObjectStorageService();
      
      // Get all posts with image URLs
      const postsWithImages = await db.select().from(communityPosts).where(
        and(
          eq(communityPosts.authorId, userId),
          // Has imageUrl that starts with /objects/
        )
      );
      
      const fixed: string[] = [];
      for (const post of postsWithImages) {
        if (post.imageUrl && post.imageUrl.startsWith('/objects/')) {
          try {
            const objectFile = await objectStorageService.getObjectEntityFile(post.imageUrl);
            await setObjectAclPolicy(objectFile, {
              owner: post.authorId,
              visibility: "public",
            });
            fixed.push(post.id);
          } catch (error) {
            console.error(`Failed to fix ACL for post ${post.id}:`, error);
          }
        }
      }
      
      res.json({ message: `Fixed ACL for ${fixed.length} post images`, fixed });
    } catch (error) {
      console.error("Error fixing image ACLs:", error);
      res.status(500).json({ error: "Failed to fix image ACLs" });
    }
  });

  // Create a new community post
  app.post("/api/community/posts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const parsed = insertCommunityPostSchema.parse({ ...req.body, authorId: userId });
      
      // Normalize image URL if provided (convert signed GCS URL to /objects/ path)
      let normalizedImageUrl = parsed.imageUrl;
      if (normalizedImageUrl) {
        const { ObjectStorageService } = await import("./objectStorage");
        const objectStorageService = new ObjectStorageService();
        try {
          normalizedImageUrl = await objectStorageService.trySetObjectEntityAclPolicy(normalizedImageUrl, {
            owner: userId,
            visibility: "public", // Posts are visible to friends/public
          });
        } catch (error) {
          console.error("Error normalizing image URL:", error);
          // Keep the original URL if normalization fails
        }
      }
      
      const [post] = await db.insert(communityPosts).values({
        ...parsed,
        imageUrl: normalizedImageUrl,
      }).returning();

      // Get author info for response
      const [author] = await db.select().from(users).where(eq(users.id, userId));

      // Award first_post one-time bonus
      try {
        const { awardFp } = await import("./fpService");
        await awardFp(userId, "first_post", { checkDuplicate: true });
      } catch (e) { console.error("FP award error:", e); }

      res.json({
        ...post,
        likeCount: 0,
        commentCount: 0,
        isLiked: false,
        author: author ? {
          id: author.id,
          firstName: author.firstName,
          lastName: author.lastName,
          displayName: author.displayName,
          profileImageUrl: author.profileImageUrl,
        } : null,
      });
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(400).json({ error: "Failed to create post" });
    }
  });

  // Toggle like on a post
  app.post("/api/community/posts/:id/like", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const postId = req.params.id;

      // Check if already liked
      const [existingLike] = await db.select().from(postLikes).where(
        and(eq(postLikes.postId, postId), eq(postLikes.userId, userId))
      );

      if (existingLike) {
        // Unlike
        await db.delete(postLikes).where(eq(postLikes.id, existingLike.id));
        res.json({ liked: false });
      } else {
        // Like
        await db.insert(postLikes).values({ postId, userId });

        // Create notification for post author (but not if liking own post)
        const [post] = await db.select().from(communityPosts).where(eq(communityPosts.id, postId));
        if (post && post.authorId !== userId) {
          const [liker] = await db.select().from(users).where(eq(users.id, userId));
          const likerName = liker?.displayName || `${liker?.firstName || ''} ${liker?.lastName || ''}`.trim() || "Someone";
          await storage.createNotification({
            userId: post.authorId,
            type: "post_like",
            title: "New Like",
            message: `${likerName} liked your post`,
            actorId: userId,
            resourceId: postId,
            resourceType: "post",
          });
        }

        res.json({ liked: true });
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      res.status(500).json({ error: "Failed to toggle like" });
    }
  });

  // Get comments for a post
  app.get("/api/community/posts/:id/comments", isAuthenticated, async (req: any, res) => {
    try {
      const postId = req.params.id;
      const comments = await db.select().from(postComments)
        .where(eq(postComments.postId, postId))
        .orderBy(desc(postComments.createdAt));

      // Get author info for each comment
      const commentsWithAuthor = await Promise.all(
        comments.map(async (comment) => {
          const [author] = await db.select().from(users).where(eq(users.id, comment.authorId));
          return {
            ...comment,
            author: author ? {
              id: author.id,
              firstName: author.firstName,
              lastName: author.lastName,
              displayName: author.displayName,
              profileImageUrl: author.profileImageUrl,
            } : null,
          };
        })
      );

      res.json(commentsWithAuthor);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ error: "Failed to fetch comments" });
    }
  });

  // Add a comment to a post
  app.post("/api/community/posts/:id/comments", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const postId = req.params.id;
      const parsed = insertPostCommentSchema.parse({ ...req.body, postId, authorId: userId });
      const [comment] = await db.insert(postComments).values(parsed).returning();

      // Create notification for post author (but not if commenting on own post)
      const [post] = await db.select().from(communityPosts).where(eq(communityPosts.id, postId));
      if (post && post.authorId !== userId) {
        const [commenter] = await db.select().from(users).where(eq(users.id, userId));
        const commenterName = commenter?.displayName || `${commenter?.firstName || ''} ${commenter?.lastName || ''}`.trim() || "Someone";
        await storage.createNotification({
          userId: post.authorId,
          type: "post_comment",
          title: "New Comment",
          message: `${commenterName} commented on your post`,
          actorId: userId,
          resourceId: postId,
          resourceType: "post",
        });
      }

      // Get author info for response
      const [author] = await db.select().from(users).where(eq(users.id, userId));

      res.json({
        ...comment,
        author: author ? {
          id: author.id,
          firstName: author.firstName,
          lastName: author.lastName,
          displayName: author.displayName,
          profileImageUrl: author.profileImageUrl,
        } : null,
      });
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(400).json({ error: "Failed to create comment" });
    }
  });

  // Delete a post (only author can delete)
  app.delete("/api/community/posts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const postId = req.params.id;

      // Check if user is the author
      const [post] = await db.select().from(communityPosts).where(eq(communityPosts.id, postId));
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }
      if (post.authorId !== userId) {
        return res.status(403).json({ error: "You can only delete your own posts" });
      }

      await db.delete(communityPosts).where(eq(communityPosts.id, postId));
      res.json({ deleted: true });
    } catch (error) {
      console.error("Error deleting post:", error);
      res.status(500).json({ error: "Failed to delete post" });
    }
  });

  // ==================== CIRCLES API ====================

  // Get all circles the user is a member of
  app.get("/api/circles", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      // Get circles user is a member of
      const memberships = await db.select().from(circleMembers).where(eq(circleMembers.userId, userId));
      const memberCircleIds = memberships.map(m => m.circleId);

      // Only return circles user is actually a member of
      if (memberCircleIds.length === 0) {
        return res.json([]);
      }

      const circleList = await db.select().from(circles).where(
        inArray(circles.id, memberCircleIds)
      );

      // Add member count and user's role for each circle
      const circlesWithData = await Promise.all(
        circleList.map(async (circle) => {
          const members = await db.select().from(circleMembers).where(eq(circleMembers.circleId, circle.id));
          const userMembership = members.find(m => m.userId === userId);
          const [owner] = await db.select().from(users).where(eq(users.id, circle.ownerId));

          return {
            ...circle,
            memberCount: members.length,
            isMember: !!userMembership,
            userRole: userMembership?.role || null,
            owner: owner ? {
              id: owner.id,
              firstName: owner.firstName,
              lastName: owner.lastName,
              displayName: owner.displayName,
              profileImageUrl: owner.profileImageUrl,
            } : null,
          };
        })
      );

      res.json(circlesWithData);
    } catch (error) {
      console.error("Error fetching circles:", error);
      res.status(500).json({ error: "Failed to fetch circles" });
    }
  });

  // Get user's circles (simplified list for dashboard selection)
  app.get("/api/circles/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      // Get circles user is a member of
      const memberships = await db.select().from(circleMembers).where(eq(circleMembers.userId, userId));
      const memberCircleIds = memberships.map(m => m.circleId);

      if (memberCircleIds.length === 0) {
        return res.json([]);
      }

      const circleList = await db.select().from(circles).where(
        inArray(circles.id, memberCircleIds)
      );

      // Return simplified list with just id and name
      const simplifiedCircles = circleList.map(circle => ({
        id: circle.id,
        name: circle.name,
      }));

      res.json(simplifiedCircles);
    } catch (error) {
      console.error("Error fetching user circles:", error);
      res.status(500).json({ error: "Failed to fetch user circles" });
    }
  });

  // Get circle overview data for dashboard card
  app.get("/api/circles/:circleId/overview", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { circleId } = req.params;

      // Get circle by id
      const [circle] = await db.select().from(circles).where(eq(circles.id, circleId));
      if (!circle) {
        return res.status(404).json({ error: "Circle not found" });
      }

      // Check if user is a member of this circle
      const [membership] = await db.select().from(circleMembers)
        .where(and(eq(circleMembers.circleId, circleId), eq(circleMembers.userId, userId)));
      if (!membership) {
        return res.status(403).json({ error: "Not a member of this circle" });
      }

      // Get all members of the circle
      const members = await db.select().from(circleMembers).where(eq(circleMembers.circleId, circleId));
      const memberIds = members.map(m => m.userId);

      // Calculate current ISO week string (e.g., "2024-W50")
      // Use ISO week: week 1 is the week containing the first Thursday of the year
      const now = new Date();
      const { getISOWeek, getISOWeekYear } = await import("date-fns");
      const isoWeekNum = getISOWeek(now);
      const isoYear = getISOWeekYear(now);
      const currentWeek = `${isoYear}-W${isoWeekNum.toString().padStart(2, '0')}`;

      // Get member stats for this circle - only for current members
      const memberStatsRecords = memberIds.length > 0
        ? await db.select().from(circleMemberStats)
            .where(and(
              eq(circleMemberStats.circleId, circleId),
              inArray(circleMemberStats.userId, memberIds)
            ))
        : [];

      // Get user info for all members
      const memberUsers = memberIds.length > 0
        ? await db.select().from(users).where(inArray(users.id, memberIds))
        : [];

      // Calculate weekly points for each member and total
      let totalWeeklyPoints = 0;
      const memberWeeklyPoints: Array<{
        id: string;
        firstName: string | null;
        lastName: string | null;
        profileImageUrl: string | null;
        weeklyPoints: number;
      }> = [];

      for (const user of memberUsers) {
        const stats = memberStatsRecords.find(s => s.userId === user.id);
        let weeklyPoints = 0;

        if (stats && stats.weeklyHistory) {
          const weeklyHistory = stats.weeklyHistory as Array<{ week: string; points: number }>;
          const currentWeekEntry = weeklyHistory.find(w => w.week === currentWeek);
          weeklyPoints = currentWeekEntry?.points || 0;
        }

        totalWeeklyPoints += weeklyPoints;
        memberWeeklyPoints.push({
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.profileImageUrl,
          weeklyPoints,
        });
      }

      // Sort by weekly points and get top 3
      memberWeeklyPoints.sort((a, b) => b.weeklyPoints - a.weeklyPoints);
      const leaderboard = memberWeeklyPoints.slice(0, 3);

      res.json({
        id: circle.id,
        name: circle.name,
        description: circle.description,
        memberCount: members.length,
        weeklyPoints: totalWeeklyPoints,
        leaderboard,
      });
    } catch (error) {
      console.error("Error fetching circle overview:", error);
      res.status(500).json({ error: "Failed to fetch circle overview" });
    }
  });

  // Get public circles for browsing (circles user can join)
  app.get("/api/circles/public", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const searchQuery = req.query.search as string || "";

      // Get user's current memberships
      const memberships = await db.select().from(circleMembers).where(eq(circleMembers.userId, userId));
      const memberCircleIds = memberships.map(m => m.circleId);

      // Get public circles that user is NOT a member of
      let publicCircles = await db.select().from(circles).where(eq(circles.isPrivate, false));

      // Filter out circles user is already a member of
      publicCircles = publicCircles.filter(c => !memberCircleIds.includes(c.id));

      // Apply search filter if provided
      if (searchQuery) {
        const lowerSearch = searchQuery.toLowerCase();
        publicCircles = publicCircles.filter(c => 
          c.name.toLowerCase().includes(lowerSearch) || 
          (c.description?.toLowerCase().includes(lowerSearch))
        );
      }

      // Add member count and owner info for each circle
      const circlesWithData = await Promise.all(
        publicCircles.map(async (circle) => {
          const members = await db.select().from(circleMembers).where(eq(circleMembers.circleId, circle.id));
          const [owner] = await db.select().from(users).where(eq(users.id, circle.ownerId));

          return {
            ...circle,
            memberCount: members.length,
            owner: owner ? {
              id: owner.id,
              firstName: owner.firstName,
              lastName: owner.lastName,
              displayName: owner.displayName,
              profileImageUrl: owner.profileImageUrl,
            } : null,
          };
        })
      );

      res.json(circlesWithData);
    } catch (error) {
      console.error("Error fetching public circles:", error);
      res.status(500).json({ error: "Failed to fetch public circles" });
    }
  });

  // Join a public circle
  app.post("/api/circles/:id/join", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const circleId = req.params.id;

      // Check if circle exists and is public
      const [circle] = await db.select().from(circles).where(eq(circles.id, circleId));
      if (!circle) {
        return res.status(404).json({ error: "Circle not found" });
      }
      if (circle.isPrivate) {
        return res.status(403).json({ error: "Cannot join private circle without an invite" });
      }

      // Check if user is already a member
      const [existingMembership] = await db.select().from(circleMembers)
        .where(and(eq(circleMembers.circleId, circleId), eq(circleMembers.userId, userId)));
      if (existingMembership) {
        return res.status(400).json({ error: "Already a member of this circle" });
      }

      // Add user as member
      await db.insert(circleMembers).values({
        circleId,
        userId,
        role: "member",
      });

      // Award FP for joining a circle
      const { awardFp } = await import("./fpService");
      await awardFp(userId, "join_circle");
      await awardFp(userId, "first_circle_joined", { checkDuplicate: true });

      res.json({ success: true, message: "Joined circle successfully" });
    } catch (error) {
      console.error("Error joining circle:", error);
      res.status(500).json({ error: "Failed to join circle" });
    }
  });

  // Create a new circle
  app.post("/api/circles", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const parsed = insertCircleSchema.parse({ ...req.body, ownerId: userId });
      const [circle] = await db.insert(circles).values(parsed).returning();

      // Add creator as owner member
      await db.insert(circleMembers).values({
        circleId: circle.id,
        userId: userId,
        role: "owner",
      });

      // Award FP for creating a circle
      const { awardFp } = await import("./fpService");
      await awardFp(userId, "create_circle");
      await awardFp(userId, "first_circle_created", { checkDuplicate: true });

      res.json({ ...circle, memberCount: 1, isMember: true, userRole: "owner" });
    } catch (error) {
      console.error("Error creating circle:", error);
      res.status(400).json({ error: "Failed to create circle" });
    }
  });

  // Get a specific circle with details
  app.get("/api/circles/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const circleId = req.params.id;

      const [circle] = await db.select().from(circles).where(eq(circles.id, circleId));
      if (!circle) {
        return res.status(404).json({ error: "Circle not found" });
      }

      const members = await db.select().from(circleMembers).where(eq(circleMembers.circleId, circleId));
      const userMembership = members.find(m => m.userId === userId);

      // Check access for private circles
      if (circle.isPrivate && !userMembership) {
        return res.status(403).json({ error: "Access denied to private circle" });
      }

      // Get member details
      const membersWithDetails = await Promise.all(
        members.map(async (member) => {
          const [user] = await db.select().from(users).where(eq(users.id, member.userId));
          return {
            ...member,
            user: user ? {
              id: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
              displayName: user.displayName,
              profileImageUrl: user.profileImageUrl,
            } : null,
          };
        })
      );

      res.json({
        ...circle,
        members: membersWithDetails,
        memberCount: members.length,
        isMember: !!userMembership,
        userRole: userMembership?.role || null,
      });
    } catch (error) {
      console.error("Error fetching circle:", error);
      res.status(500).json({ error: "Failed to fetch circle" });
    }
  });

  // Join a circle
  app.post("/api/circles/:id/join", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const circleId = req.params.id;

      const [circle] = await db.select().from(circles).where(eq(circles.id, circleId));
      if (!circle) {
        return res.status(404).json({ error: "Circle not found" });
      }

      if (circle.isPrivate) {
        return res.status(403).json({ error: "Cannot join private circle without invite" });
      }

      // Check if already a member
      const [existing] = await db.select().from(circleMembers).where(
        and(eq(circleMembers.circleId, circleId), eq(circleMembers.userId, userId))
      );
      if (existing) {
        return res.status(400).json({ error: "Already a member" });
      }

      await db.insert(circleMembers).values({
        circleId,
        userId,
        role: "member",
      });

      // Award FP for joining a circle
      const { awardFp } = await import("./fpService");
      await awardFp(userId, "join_circle");
      await awardFp(userId, "first_circle_joined", { checkDuplicate: true });

      res.json({ joined: true });
    } catch (error) {
      console.error("Error joining circle:", error);
      res.status(500).json({ error: "Failed to join circle" });
    }
  });

  // Leave a circle
  app.post("/api/circles/:id/leave", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const circleId = req.params.id;

      const [circle] = await db.select().from(circles).where(eq(circles.id, circleId));
      if (!circle) {
        return res.status(404).json({ error: "Circle not found" });
      }

      if (circle.ownerId === userId) {
        return res.status(400).json({ error: "Owner cannot leave circle. Transfer ownership or delete the circle." });
      }

      await db.delete(circleMembers).where(
        and(eq(circleMembers.circleId, circleId), eq(circleMembers.userId, userId))
      );

      res.json({ left: true });
    } catch (error) {
      console.error("Error leaving circle:", error);
      res.status(500).json({ error: "Failed to leave circle" });
    }
  });

  // Update member role (owner only)
  app.put("/api/circles/:id/members/:memberId/role", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const circleId = req.params.id;
      const memberId = req.params.memberId;
      const { role } = req.body;

      if (!role || !["admin", "member"].includes(role)) {
        return res.status(400).json({ error: "Invalid role. Must be 'admin' or 'member'" });
      }

      // Check if current user is the owner
      const [circle] = await db.select().from(circles).where(eq(circles.id, circleId));
      if (!circle) {
        return res.status(404).json({ error: "Circle not found" });
      }

      if (circle.ownerId !== userId) {
        return res.status(403).json({ error: "Only the owner can change member roles" });
      }

      // Get the target member and verify they belong to this circle
      const [targetMember] = await db.select().from(circleMembers).where(
        and(eq(circleMembers.id, memberId), eq(circleMembers.circleId, circleId))
      );
      if (!targetMember) {
        return res.status(404).json({ error: "Member not found in this circle" });
      }

      // Can't change owner's role
      if (targetMember.role === "owner") {
        return res.status(400).json({ error: "Cannot change owner's role" });
      }

      // Update the role
      await db.update(circleMembers)
        .set({ role })
        .where(eq(circleMembers.id, memberId));

      res.json({ success: true, role });
    } catch (error) {
      console.error("Error updating member role:", error);
      res.status(500).json({ error: "Failed to update member role" });
    }
  });

  // Remove member from circle (owner or admin only)
  app.delete("/api/circles/:id/members/:memberId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const circleId = req.params.id;
      const memberId = req.params.memberId;

      // Check if current user is owner or admin
      const [circle] = await db.select().from(circles).where(eq(circles.id, circleId));
      if (!circle) {
        return res.status(404).json({ error: "Circle not found" });
      }

      const isOwner = circle.ownerId === userId;
      const [currentUserMember] = await db.select().from(circleMembers).where(
        and(eq(circleMembers.circleId, circleId), eq(circleMembers.userId, userId))
      );
      const isAdmin = currentUserMember?.role === "admin";

      if (!isOwner && !isAdmin) {
        return res.status(403).json({ error: "Only owners or admins can remove members" });
      }

      // Get the target member
      const [targetMember] = await db.select().from(circleMembers).where(
        and(eq(circleMembers.id, memberId), eq(circleMembers.circleId, circleId))
      );
      if (!targetMember) {
        return res.status(404).json({ error: "Member not found in this circle" });
      }

      // Can't remove the owner
      if (targetMember.role === "owner") {
        return res.status(400).json({ error: "Cannot remove the owner" });
      }

      // Admins can only remove regular members, not other admins
      if (isAdmin && !isOwner && targetMember.role === "admin") {
        return res.status(403).json({ error: "Admins cannot remove other admins" });
      }

      await db.delete(circleMembers).where(eq(circleMembers.id, memberId));

      res.json({ removed: true });
    } catch (error) {
      console.error("Error removing member:", error);
      res.status(500).json({ error: "Failed to remove member" });
    }
  });

  // ==================== CIRCLE MEMBER INVITES API ====================

  // Send circle member invite
  app.post("/api/circles/:id/invites", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const circleId = req.params.id;
      const { inviteeId } = req.body;

      if (!inviteeId) {
        return res.status(400).json({ error: "inviteeId is required" });
      }

      // Check if user is a member of the circle
      const [membership] = await db.select().from(circleMembers).where(
        and(eq(circleMembers.circleId, circleId), eq(circleMembers.userId, userId))
      );
      if (!membership) {
        return res.status(403).json({ error: "Must be a member to invite others" });
      }

      // Check if invitee already is a member
      const [existingMember] = await db.select().from(circleMembers).where(
        and(eq(circleMembers.circleId, circleId), eq(circleMembers.userId, inviteeId))
      );
      if (existingMember) {
        return res.status(400).json({ error: "User is already a member of this circle" });
      }

      // Check if there's already a pending invite
      const [existingInvite] = await db.select().from(circleMemberInvites).where(
        and(
          eq(circleMemberInvites.circleId, circleId),
          eq(circleMemberInvites.inviteeId, inviteeId),
          eq(circleMemberInvites.status, "pending")
        )
      );
      if (existingInvite) {
        return res.status(400).json({ error: "An invite is already pending for this user" });
      }

      // Create the invite
      const [invite] = await db.insert(circleMemberInvites).values({
        circleId,
        inviterId: userId,
        inviteeId,
        status: "pending",
      }).returning();

      // Create notification for the invitee
      const [circle] = await db.select().from(circles).where(eq(circles.id, circleId));
      const [inviter] = await db.select().from(users).where(eq(users.id, userId));
      const inviterName = inviter?.displayName || `${inviter?.firstName || ''} ${inviter?.lastName || ''}`.trim() || "Someone";
      const circleName = circle?.name || "a circle";
      await storage.createNotification({
        userId: inviteeId,
        type: "circle_invitation",
        title: "Circle Invitation",
        message: `${inviterName} invited you to join ${circleName}`,
        actorId: userId,
        resourceId: circleId,
        resourceType: "circle",
      });

      res.json(invite);
    } catch (error) {
      console.error("Error sending circle invite:", error);
      res.status(500).json({ error: "Failed to send invite" });
    }
  });

  // Get pending circle invites for current user (invites they received)
  app.get("/api/circle-invites", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      const invites = await db.select().from(circleMemberInvites).where(
        and(eq(circleMemberInvites.inviteeId, userId), eq(circleMemberInvites.status, "pending"))
      );

      // Enrich with circle and inviter info
      const invitesWithInfo = await Promise.all(invites.map(async (invite) => {
        const [circle] = await db.select().from(circles).where(eq(circles.id, invite.circleId));
        const [inviter] = await db.select().from(users).where(eq(users.id, invite.inviterId));
        return {
          ...invite,
          circle: circle ? { id: circle.id, name: circle.name, description: circle.description } : null,
          inviter: inviter ? {
            id: inviter.id,
            firstName: inviter.firstName,
            lastName: inviter.lastName,
            displayName: inviter.displayName,
            profileImageUrl: inviter.profileImageUrl,
          } : null,
        };
      }));

      res.json(invitesWithInfo);
    } catch (error) {
      console.error("Error fetching circle invites:", error);
      res.status(500).json({ error: "Failed to fetch invites" });
    }
  });

  // Get pending outgoing invites for a circle (invites sent from the circle)
  app.get("/api/circles/:id/invites", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const circleId = req.params.id;

      // Check if user is a member
      const [membership] = await db.select().from(circleMembers).where(
        and(eq(circleMembers.circleId, circleId), eq(circleMembers.userId, userId))
      );
      if (!membership) {
        return res.status(403).json({ error: "Must be a member to view invites" });
      }

      const invites = await db.select().from(circleMemberInvites).where(
        and(eq(circleMemberInvites.circleId, circleId), eq(circleMemberInvites.status, "pending"))
      );

      // Enrich with invitee info
      const invitesWithInfo = await Promise.all(invites.map(async (invite) => {
        const [invitee] = await db.select().from(users).where(eq(users.id, invite.inviteeId));
        return {
          ...invite,
          invitee: invitee ? {
            id: invitee.id,
            firstName: invitee.firstName,
            lastName: invitee.lastName,
            displayName: invitee.displayName,
            profileImageUrl: invitee.profileImageUrl,
          } : null,
        };
      }));

      res.json(invitesWithInfo);
    } catch (error) {
      console.error("Error fetching circle invites:", error);
      res.status(500).json({ error: "Failed to fetch invites" });
    }
  });

  // Respond to a circle invite (accept/decline)
  app.put("/api/circle-invites/:inviteId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const inviteId = req.params.inviteId;
      const { action } = req.body;

      if (!action || (action !== "accept" && action !== "decline")) {
        return res.status(400).json({ error: "Action must be 'accept' or 'decline'" });
      }

      const [invite] = await db.select().from(circleMemberInvites).where(eq(circleMemberInvites.id, inviteId));
      if (!invite) {
        return res.status(404).json({ error: "Invite not found" });
      }

      if (invite.inviteeId !== userId) {
        return res.status(403).json({ error: "Not authorized to respond to this invite" });
      }

      if (invite.status !== "pending") {
        return res.status(400).json({ error: "Invite is no longer pending" });
      }

      if (action === "accept") {
        // Add user as member
        await db.insert(circleMembers).values({
          circleId: invite.circleId,
          userId: userId,
          role: "member",
        });
        await db.update(circleMemberInvites).set({ status: "accepted" }).where(eq(circleMemberInvites.id, inviteId));
        res.json({ success: true, action: "accepted" });
      } else {
        await db.update(circleMemberInvites).set({ status: "declined" }).where(eq(circleMemberInvites.id, inviteId));
        res.json({ success: true, action: "declined" });
      }
    } catch (error) {
      console.error("Error responding to circle invite:", error);
      res.status(500).json({ error: "Failed to respond to invite" });
    }
  });

  // Cancel a circle invite (inviter can cancel)
  app.delete("/api/circles/:id/invites/:inviteId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const circleId = req.params.id;
      const inviteId = req.params.inviteId;

      const [invite] = await db.select().from(circleMemberInvites).where(
        and(eq(circleMemberInvites.id, inviteId), eq(circleMemberInvites.circleId, circleId))
      );
      if (!invite) {
        return res.status(404).json({ error: "Invite not found" });
      }

      // Check if user is a member of the circle (any member can cancel)
      const [membership] = await db.select().from(circleMembers).where(
        and(eq(circleMembers.circleId, circleId), eq(circleMembers.userId, userId))
      );
      if (!membership) {
        return res.status(403).json({ error: "Not authorized to cancel this invite" });
      }

      await db.delete(circleMemberInvites).where(eq(circleMemberInvites.id, inviteId));
      res.json({ success: true });
    } catch (error) {
      console.error("Error canceling circle invite:", error);
      res.status(500).json({ error: "Failed to cancel invite" });
    }
  });

  // Get circle messages
  app.get("/api/circles/:id/messages", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const circleId = req.params.id;

      // Check membership
      const [membership] = await db.select().from(circleMembers).where(
        and(eq(circleMembers.circleId, circleId), eq(circleMembers.userId, userId))
      );
      if (!membership) {
        return res.status(403).json({ error: "Must be a member to view messages" });
      }

      const messages = await db.select().from(circleMessages)
        .where(eq(circleMessages.circleId, circleId))
        .orderBy(desc(circleMessages.createdAt));

      const messagesWithSender = await Promise.all(
        messages.map(async (msg) => {
          const [sender] = await db.select().from(users).where(eq(users.id, msg.senderId));
          return {
            ...msg,
            sender: sender ? {
              id: sender.id,
              firstName: sender.firstName,
              lastName: sender.lastName,
              displayName: sender.displayName,
              profileImageUrl: sender.profileImageUrl,
            } : null,
          };
        })
      );

      res.json(messagesWithSender);
    } catch (error) {
      console.error("Error fetching circle messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // Send a message to a circle
  app.post("/api/circles/:id/messages", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const circleId = req.params.id;

      // Check membership
      const [membership] = await db.select().from(circleMembers).where(
        and(eq(circleMembers.circleId, circleId), eq(circleMembers.userId, userId))
      );
      if (!membership) {
        return res.status(403).json({ error: "Must be a member to send messages" });
      }

      const parsed = insertCircleMessageSchema.parse({ ...req.body, circleId, senderId: userId });

      // Normalize image URL if provided (convert signed GCS URL to /objects/ path)
      let normalizedImageUrl = parsed.imageUrl;
      if (normalizedImageUrl) {
        const { ObjectStorageService } = await import("./objectStorage");
        const objectStorageService = new ObjectStorageService();
        try {
          normalizedImageUrl = await objectStorageService.trySetObjectEntityAclPolicy(normalizedImageUrl, {
            owner: userId,
            visibility: "public",
          });
        } catch (error) {
          console.error("Error normalizing image URL:", error);
        }
      }

      const [message] = await db.insert(circleMessages).values({
        ...parsed,
        imageUrl: normalizedImageUrl,
      }).returning();

      const [sender] = await db.select().from(users).where(eq(users.id, userId));
      res.json({
        ...message,
        sender: sender ? {
          id: sender.id,
          firstName: sender.firstName,
          lastName: sender.lastName,
          displayName: sender.displayName,
          profileImageUrl: sender.profileImageUrl,
        } : null,
      });
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(400).json({ error: "Failed to send message" });
    }
  });

  // ==================== CIRCLE TASKS API ====================

  // Get all tasks for a circle
  app.get("/api/circles/:id/tasks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const circleId = req.params.id;

      // Check membership
      const [membership] = await db.select().from(circleMembers).where(
        and(eq(circleMembers.circleId, circleId), eq(circleMembers.userId, userId))
      );
      if (!membership) {
        return res.status(403).json({ error: "Must be a member to view tasks" });
      }

      const tasks = await db.select().from(circleTasks)
        .where(eq(circleTasks.circleId, circleId))
        .orderBy(desc(circleTasks.createdAt));

      res.json(tasks);
    } catch (error) {
      console.error("Error fetching circle tasks:", error);
      res.status(500).json({ error: "Failed to fetch tasks" });
    }
  });

  // Create a new task for a circle
  app.post("/api/circles/:id/tasks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const circleId = req.params.id;

      // Check membership
      const [membership] = await db.select().from(circleMembers).where(
        and(eq(circleMembers.circleId, circleId), eq(circleMembers.userId, userId))
      );
      if (!membership) {
        return res.status(403).json({ error: "Must be a member to create tasks" });
      }

      const parsed = insertCircleTaskSchema.parse({
        ...req.body,
        circleId,
        createdById: userId,
        approvalStatus: membership.role === "owner" || membership.role === "admin" ? "approved" : "pending",
      });
      const [task] = await db.insert(circleTasks).values(parsed).returning();
      res.json(task);
    } catch (error) {
      console.error("Error creating circle task:", error);
      res.status(400).json({ error: "Failed to create task" });
    }
  });

  // Update a circle task
  app.put("/api/circles/:id/tasks/:taskId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id: circleId, taskId } = req.params;

      // Check membership and role
      const [membership] = await db.select().from(circleMembers).where(
        and(eq(circleMembers.circleId, circleId), eq(circleMembers.userId, userId))
      );
      if (!membership) {
        return res.status(403).json({ error: "Must be a member to update tasks" });
      }

      // Get the task to check ownership
      const [existingTask] = await db.select().from(circleTasks).where(eq(circleTasks.id, taskId));
      if (!existingTask) {
        return res.status(404).json({ error: "Task not found" });
      }

      // Only owner/admin or task creator can update
      const canUpdate = membership.role === "owner" || membership.role === "admin" || existingTask.createdById === userId;
      if (!canUpdate) {
        return res.status(403).json({ error: "Not authorized to update this task" });
      }

      const { name, value, category, taskType, requiresApproval, tiers } = req.body;
      // Build update data, only including tiers if explicitly provided
      const updateData: Record<string, any> = { name, value, category, taskType, requiresApproval };
      if (tiers !== undefined) {
        const tiersValidation = insertCircleTaskSchema.pick({ tiers: true }).safeParse({ tiers });
        if (tiersValidation.success) {
          updateData.tiers = tiersValidation.data.tiers ?? null;
        }
      }
      const [task] = await db.update(circleTasks)
        .set(updateData)
        .where(eq(circleTasks.id, taskId))
        .returning();
      res.json(task);
    } catch (error) {
      console.error("Error updating circle task:", error);
      res.status(400).json({ error: "Failed to update task" });
    }
  });

  // Delete a circle task
  app.delete("/api/circles/:id/tasks/:taskId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id: circleId, taskId } = req.params;

      // Check membership and role
      const [membership] = await db.select().from(circleMembers).where(
        and(eq(circleMembers.circleId, circleId), eq(circleMembers.userId, userId))
      );
      if (!membership) {
        return res.status(403).json({ error: "Must be a member to delete tasks" });
      }

      // Get the task to check ownership
      const [existingTask] = await db.select().from(circleTasks).where(eq(circleTasks.id, taskId));
      if (!existingTask) {
        return res.status(404).json({ error: "Task not found" });
      }

      // Only owner/admin or task creator can delete
      const canDelete = membership.role === "owner" || membership.role === "admin" || existingTask.createdById === userId;
      if (!canDelete) {
        return res.status(403).json({ error: "Not authorized to delete this task" });
      }

      await db.delete(circleTasks).where(eq(circleTasks.id, taskId));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting circle task:", error);
      res.status(400).json({ error: "Failed to delete task" });
    }
  });

  // Toggle task completion for a user on a specific date
  app.post("/api/circles/:id/tasks/:taskId/complete", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id: circleId, taskId } = req.params;
      const { date } = req.body; // YYYY-MM-DD format

      // Check membership
      const [membership] = await db.select().from(circleMembers).where(
        and(eq(circleMembers.circleId, circleId), eq(circleMembers.userId, userId))
      );
      if (!membership) {
        return res.status(403).json({ error: "Must be a member to complete tasks" });
      }

      // Check if already completed
      const [existing] = await db.select().from(circleTaskCompletions).where(
        and(
          eq(circleTaskCompletions.circleId, circleId),
          eq(circleTaskCompletions.taskId, taskId),
          eq(circleTaskCompletions.userId, userId),
          eq(circleTaskCompletions.date, date)
        )
      );

      if (existing) {
        // Toggle off - delete completion
        await db.delete(circleTaskCompletions).where(eq(circleTaskCompletions.id, existing.id));
        res.json({ completed: false });
      } else {
        // Toggle on - create completion
        const parsed = insertCircleTaskCompletionSchema.parse({
          circleId,
          taskId,
          userId,
          date,
        });
        await db.insert(circleTaskCompletions).values(parsed);
        
        // Check if this completion triggers a circle competition win
        try {
          const { sql, gte } = await import("drizzle-orm");
          
          // Find active competitions involving this circle
          const activeComps = await db.select().from(circleCompetitions).where(
            and(
              eq(circleCompetitions.status, "active"),
              or(
                eq(circleCompetitions.circleOneId, circleId),
                eq(circleCompetitions.circleTwoId, circleId)
              )
            )
          );
          
          for (const comp of activeComps) {
            if (comp.competitionType === 'targetPoints' && comp.targetPoints) {
              // Calculate current points for both circles
              const circleOneTasks = await db.select().from(circleTasks).where(eq(circleTasks.circleId, comp.circleOneId));
              const circleTwoTasks = await db.select().from(circleTasks).where(eq(circleTasks.circleId, comp.circleTwoId));
              const taskOneMap = new Map(circleOneTasks.map(t => [t.id, t.value || 0]));
              const taskTwoMap = new Map(circleTwoTasks.map(t => [t.id, t.value || 0]));
              
              const circleOneCompletions = await db.select().from(circleTaskCompletions).where(
                and(eq(circleTaskCompletions.circleId, comp.circleOneId), gte(circleTaskCompletions.date, comp.startDate))
              );
              const circleTwoCompletions = await db.select().from(circleTaskCompletions).where(
                and(eq(circleTaskCompletions.circleId, comp.circleTwoId), gte(circleTaskCompletions.date, comp.startDate))
              );
              
              let circleOnePoints = circleOneCompletions.reduce((sum, c) => sum + (taskOneMap.get(c.taskId) || 0), 0);
              let circleTwoPoints = circleTwoCompletions.reduce((sum, c) => sum + (taskTwoMap.get(c.taskId) || 0), 0);
              
              let winnerId: string | null = null;
              if (circleOnePoints >= comp.targetPoints) {
                winnerId = comp.circleOneId;
              } else if (circleTwoPoints >= comp.targetPoints) {
                winnerId = comp.circleTwoId;
              }
              
              if (winnerId && !comp.winnerId) {
                // Mark competition as completed with winner
                await db.update(circleCompetitions)
                  .set({ status: "completed", winnerId, circleOnePoints, circleTwoPoints })
                  .where(eq(circleCompetitions.id, comp.id));
                
                // Award FP to all members of winning circle
                const { awardFp } = await import("./fpService");
                const winningMembers = await db.select().from(circleMembers).where(eq(circleMembers.circleId, winnerId));
                for (const member of winningMembers) {
                  await awardFp(member.userId, "win_circle_challenge", { checkDuplicate: true });
                }
              }
            }
          }
        } catch (compError) {
          console.error("Error checking circle competition:", compError);
        }
        
        res.json({ completed: true });
      }
    } catch (error) {
      console.error("Error toggling task completion:", error);
      res.status(400).json({ error: "Failed to toggle task completion" });
    }
  });

  // Get task completions for a circle on a date range
  app.get("/api/circles/:id/completions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const circleId = req.params.id;
      const { from, to } = req.query;

      // Check membership
      const [membership] = await db.select().from(circleMembers).where(
        and(eq(circleMembers.circleId, circleId), eq(circleMembers.userId, userId))
      );
      if (!membership) {
        return res.status(403).json({ error: "Must be a member to view completions" });
      }

      const completions = await db.select({
        id: circleTaskCompletions.id,
        circleId: circleTaskCompletions.circleId,
        taskId: circleTaskCompletions.taskId,
        userId: circleTaskCompletions.userId,
        date: circleTaskCompletions.date,
        createdAt: circleTaskCompletions.createdAt,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          displayName: users.displayName,
        },
      }).from(circleTaskCompletions)
        .leftJoin(users, eq(circleTaskCompletions.userId, users.id))
        .where(eq(circleTaskCompletions.circleId, circleId));

      // Transform to include userName
      const completionsWithUserName = completions.map(c => ({
        id: c.id,
        circleId: c.circleId,
        taskId: c.taskId,
        userId: c.userId,
        date: c.date,
        completedAt: c.createdAt,
        userName: c.user ? `${c.user.firstName || ''} ${c.user.lastName || ''}`.trim() || c.user.displayName || 'Unknown' : 'Unknown',
      }));

      res.json(completionsWithUserName);
    } catch (error) {
      console.error("Error fetching completions:", error);
      res.status(500).json({ error: "Failed to fetch completions" });
    }
  });

  // ==================== CIRCLE BADGES API ====================

  // Get all badges for a circle
  app.get("/api/circles/:id/badges", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const circleId = req.params.id;

      // Check membership
      const [membership] = await db.select().from(circleMembers).where(
        and(eq(circleMembers.circleId, circleId), eq(circleMembers.userId, userId))
      );
      if (!membership) {
        return res.status(403).json({ error: "Must be a member to view badges" });
      }

      const badges = await db.select().from(circleBadges)
        .where(eq(circleBadges.circleId, circleId))
        .orderBy(desc(circleBadges.createdAt));

      res.json(badges);
    } catch (error) {
      console.error("Error fetching circle badges:", error);
      res.status(500).json({ error: "Failed to fetch badges" });
    }
  });

  // Create a new badge for a circle
  app.post("/api/circles/:id/badges", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const circleId = req.params.id;

      // Check membership
      const [membership] = await db.select().from(circleMembers).where(
        and(eq(circleMembers.circleId, circleId), eq(circleMembers.userId, userId))
      );
      if (!membership) {
        return res.status(403).json({ error: "Must be a member to create badges" });
      }

      const parsed = insertCircleBadgeSchema.parse({
        ...req.body,
        circleId,
        createdById: userId,
        approvalStatus: membership.role === "owner" || membership.role === "admin" ? "approved" : "pending",
      });
      const [badge] = await db.insert(circleBadges).values(parsed).returning();
      res.json(badge);
    } catch (error) {
      console.error("Error creating circle badge:", error);
      res.status(400).json({ error: "Failed to create badge" });
    }
  });

  // Update a circle badge
  app.put("/api/circles/:id/badges/:badgeId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id: circleId, badgeId } = req.params;

      // Check membership and role
      const [membership] = await db.select().from(circleMembers).where(
        and(eq(circleMembers.circleId, circleId), eq(circleMembers.userId, userId))
      );
      if (!membership) {
        return res.status(403).json({ error: "Must be a member to update badges" });
      }

      // Only owner/admin can update badges
      if (membership.role !== "owner" && membership.role !== "admin") {
        return res.status(403).json({ error: "Only owner or admin can update badges" });
      }

      const { name, description, icon, required, rewardType, rewardPoints, rewardGift } = req.body;
      const [badge] = await db.update(circleBadges)
        .set({ name, description, icon, required, rewardType, rewardPoints, rewardGift })
        .where(eq(circleBadges.id, badgeId))
        .returning();
      res.json(badge);
    } catch (error) {
      console.error("Error updating circle badge:", error);
      res.status(400).json({ error: "Failed to update badge" });
    }
  });

  // Delete a circle badge
  app.delete("/api/circles/:id/badges/:badgeId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id: circleId, badgeId } = req.params;

      // Check membership and role
      const [membership] = await db.select().from(circleMembers).where(
        and(eq(circleMembers.circleId, circleId), eq(circleMembers.userId, userId))
      );
      if (!membership) {
        return res.status(403).json({ error: "Must be a member to delete badges" });
      }

      // Only owner/admin can delete badges
      if (membership.role !== "owner" && membership.role !== "admin") {
        return res.status(403).json({ error: "Only owner or admin can delete badges" });
      }

      await db.delete(circleBadges).where(eq(circleBadges.id, badgeId));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting circle badge:", error);
      res.status(400).json({ error: "Failed to delete badge" });
    }
  });

  // ==================== CIRCLE AWARDS API ====================

  // Get all awards for a circle
  app.get("/api/circles/:id/awards", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const circleId = req.params.id;

      // Check membership
      const [membership] = await db.select().from(circleMembers).where(
        and(eq(circleMembers.circleId, circleId), eq(circleMembers.userId, userId))
      );
      if (!membership) {
        return res.status(403).json({ error: "Must be a member to view awards" });
      }

      const awards = await db.select().from(circleAwards)
        .where(eq(circleAwards.circleId, circleId))
        .orderBy(desc(circleAwards.createdAt));

      res.json(awards);
    } catch (error) {
      console.error("Error fetching circle awards:", error);
      res.status(500).json({ error: "Failed to fetch awards" });
    }
  });

  // Create a new award for a circle
  app.post("/api/circles/:id/awards", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const circleId = req.params.id;

      // Check membership
      const [membership] = await db.select().from(circleMembers).where(
        and(eq(circleMembers.circleId, circleId), eq(circleMembers.userId, userId))
      );
      if (!membership) {
        return res.status(403).json({ error: "Must be a member to create awards" });
      }

      const parsed = insertCircleAwardSchema.parse({
        ...req.body,
        circleId,
        createdById: userId,
        approvalStatus: membership.role === "owner" || membership.role === "admin" ? "approved" : "pending",
      });
      const [award] = await db.insert(circleAwards).values(parsed).returning();
      res.json(award);
    } catch (error) {
      console.error("Error creating circle award:", error);
      res.status(400).json({ error: "Failed to create award" });
    }
  });

  // Update a circle award
  app.put("/api/circles/:id/awards/:awardId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id: circleId, awardId } = req.params;

      // Check membership and role
      const [membership] = await db.select().from(circleMembers).where(
        and(eq(circleMembers.circleId, circleId), eq(circleMembers.userId, userId))
      );
      if (!membership) {
        return res.status(403).json({ error: "Must be a member to update awards" });
      }

      // Only owner/admin can update awards
      if (membership.role !== "owner" && membership.role !== "admin") {
        return res.status(403).json({ error: "Only owner or admin can update awards" });
      }

      const { name, description, type, target, category, rewardType, rewardPoints, rewardGift } = req.body;
      const [award] = await db.update(circleAwards)
        .set({ name, description, type, target, category, rewardType, rewardPoints, rewardGift })
        .where(eq(circleAwards.id, awardId))
        .returning();
      res.json(award);
    } catch (error) {
      console.error("Error updating circle award:", error);
      res.status(400).json({ error: "Failed to update award" });
    }
  });

  // Delete a circle award
  app.delete("/api/circles/:id/awards/:awardId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id: circleId, awardId } = req.params;

      // Check membership and role
      const [membership] = await db.select().from(circleMembers).where(
        and(eq(circleMembers.circleId, circleId), eq(circleMembers.userId, userId))
      );
      if (!membership) {
        return res.status(403).json({ error: "Must be a member to delete awards" });
      }

      // Only owner/admin can delete awards
      if (membership.role !== "owner" && membership.role !== "admin") {
        return res.status(403).json({ error: "Only owner or admin can delete awards" });
      }

      await db.delete(circleAwards).where(eq(circleAwards.id, awardId));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting circle award:", error);
      res.status(400).json({ error: "Failed to delete award" });
    }
  });

  // ==================== CIRCLE POSTS API ====================

  // Get all posts for a circle
  app.get("/api/circles/:id/posts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const circleId = req.params.id;

      // Check membership
      const [membership] = await db.select().from(circleMembers).where(
        and(eq(circleMembers.circleId, circleId), eq(circleMembers.userId, userId))
      );
      if (!membership) {
        return res.status(403).json({ error: "Must be a member to view posts" });
      }

      const posts = await db.select().from(circlePosts)
        .where(eq(circlePosts.circleId, circleId))
        .orderBy(desc(circlePosts.createdAt));

      // Get author info, likes, and comments for each post
      const postsWithDetails = await Promise.all(
        posts.map(async (post) => {
          const [author] = await db.select().from(users).where(eq(users.id, post.authorId));
          const likes = await db.select().from(circlePostLikes).where(eq(circlePostLikes.postId, post.id));
          const comments = await db.select().from(circlePostComments).where(eq(circlePostComments.postId, post.id));
          
          // Get comment authors
          const commentsWithAuthors = await Promise.all(
            comments.map(async (comment) => {
              const [commentAuthor] = await db.select().from(users).where(eq(users.id, comment.authorId));
              return {
                ...comment,
                author: commentAuthor ? {
                  id: commentAuthor.id,
                  firstName: commentAuthor.firstName,
                  lastName: commentAuthor.lastName,
                  displayName: commentAuthor.displayName,
                  profileImageUrl: commentAuthor.profileImageUrl,
                } : null,
              };
            })
          );

          return {
            ...post,
            author: author ? {
              id: author.id,
              firstName: author.firstName,
              lastName: author.lastName,
              displayName: author.displayName,
              profileImageUrl: author.profileImageUrl,
            } : null,
            likes: likes.map(l => l.userId),
            comments: commentsWithAuthors,
            likedByMe: likes.some(l => l.userId === userId),
          };
        })
      );

      res.json(postsWithDetails);
    } catch (error) {
      console.error("Error fetching circle posts:", error);
      res.status(500).json({ error: "Failed to fetch posts" });
    }
  });

  // Create a new post in a circle
  app.post("/api/circles/:id/posts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const circleId = req.params.id;

      // Check membership
      const [membership] = await db.select().from(circleMembers).where(
        and(eq(circleMembers.circleId, circleId), eq(circleMembers.userId, userId))
      );
      if (!membership) {
        return res.status(403).json({ error: "Must be a member to create posts" });
      }

      const parsed = insertCirclePostSchema.parse({
        ...req.body,
        circleId,
        authorId: userId,
      });

      // Normalize image URL if provided (convert signed GCS URL to /objects/ path)
      let normalizedImageUrl = parsed.imageUrl;
      if (normalizedImageUrl) {
        const { ObjectStorageService } = await import("./objectStorage");
        const objectStorageService = new ObjectStorageService();
        try {
          normalizedImageUrl = await objectStorageService.trySetObjectEntityAclPolicy(normalizedImageUrl, {
            owner: userId,
            visibility: "public",
          });
        } catch (error) {
          console.error("Error normalizing image URL:", error);
        }
      }

      const [post] = await db.insert(circlePosts).values({
        ...parsed,
        imageUrl: normalizedImageUrl,
      }).returning();

      const [author] = await db.select().from(users).where(eq(users.id, userId));
      res.json({
        ...post,
        author: author ? {
          id: author.id,
          firstName: author.firstName,
          lastName: author.lastName,
          displayName: author.displayName,
          profileImageUrl: author.profileImageUrl,
        } : null,
        likes: [],
        comments: [],
        likedByMe: false,
      });
    } catch (error) {
      console.error("Error creating circle post:", error);
      res.status(400).json({ error: "Failed to create post" });
    }
  });

  // Like/unlike a post
  app.post("/api/circles/:id/posts/:postId/like", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id: circleId, postId } = req.params;

      // Check membership
      const [membership] = await db.select().from(circleMembers).where(
        and(eq(circleMembers.circleId, circleId), eq(circleMembers.userId, userId))
      );
      if (!membership) {
        return res.status(403).json({ error: "Must be a member to like posts" });
      }

      // Check if already liked
      const [existing] = await db.select().from(circlePostLikes).where(
        and(eq(circlePostLikes.postId, postId), eq(circlePostLikes.userId, userId))
      );

      if (existing) {
        // Unlike
        await db.delete(circlePostLikes).where(eq(circlePostLikes.id, existing.id));
        res.json({ liked: false });
      } else {
        // Like
        const parsed = insertCirclePostLikeSchema.parse({ postId, userId });
        await db.insert(circlePostLikes).values(parsed);
        res.json({ liked: true });
      }
    } catch (error) {
      console.error("Error toggling post like:", error);
      res.status(400).json({ error: "Failed to toggle like" });
    }
  });

  // Add a comment to a post
  app.post("/api/circles/:id/posts/:postId/comments", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id: circleId, postId } = req.params;

      // Check membership
      const [membership] = await db.select().from(circleMembers).where(
        and(eq(circleMembers.circleId, circleId), eq(circleMembers.userId, userId))
      );
      if (!membership) {
        return res.status(403).json({ error: "Must be a member to comment" });
      }

      const parsed = insertCirclePostCommentSchema.parse({
        ...req.body,
        postId,
        authorId: userId,
      });
      const [comment] = await db.insert(circlePostComments).values(parsed).returning();

      const [author] = await db.select().from(users).where(eq(users.id, userId));
      res.json({
        ...comment,
        author: author ? {
          id: author.id,
          firstName: author.firstName,
          lastName: author.lastName,
          displayName: author.displayName,
          profileImageUrl: author.profileImageUrl,
        } : null,
      });
    } catch (error) {
      console.error("Error adding comment:", error);
      res.status(400).json({ error: "Failed to add comment" });
    }
  });

  // ==================== CIRCLE ANALYTICS API ====================

  // Get circle leaderboard with member stats
  app.get("/api/circles/:id/leaderboard", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const circleId = req.params.id;

      // Check membership
      const [membership] = await db.select().from(circleMembers).where(
        and(eq(circleMembers.circleId, circleId), eq(circleMembers.userId, userId))
      );
      if (!membership) {
        return res.status(403).json({ error: "Must be a member to view leaderboard" });
      }

      // Get all members
      const members = await db.select().from(circleMembers).where(eq(circleMembers.circleId, circleId));
      
      // Get all completions for this circle
      const completions = await db.select().from(circleTaskCompletions).where(eq(circleTaskCompletions.circleId, circleId));
      
      // Get all tasks for point values
      const tasks = await db.select().from(circleTasks).where(eq(circleTasks.circleId, circleId));
      const taskMap = new Map(tasks.map(t => [t.id, t]));

      // Get circle for goal info
      const [circle] = await db.select().from(circles).where(eq(circles.id, circleId));
      const dailyGoal = circle?.dailyPointGoal || 30;

      // Calculate stats for each member
      const memberStats = await Promise.all(members.map(async (member) => {
        const [user] = await db.select().from(users).where(eq(users.id, member.userId));
        
        // Filter completions for this member
        const memberCompletions = completions.filter(c => c.userId === member.userId);
        
        // Calculate total points
        let totalPoints = 0;
        const taskCounts: Record<string, number> = {};
        
        for (const comp of memberCompletions) {
          const task = taskMap.get(comp.taskId);
          if (task) {
            totalPoints += task.value || 0;
            taskCounts[task.name] = (taskCounts[task.name] || 0) + 1;
          }
        }

        // Calculate goal streak (consecutive days hitting daily goal)
        const datePoints: Record<string, number> = {};
        for (const comp of memberCompletions) {
          const task = taskMap.get(comp.taskId);
          if (task) {
            datePoints[comp.date] = (datePoints[comp.date] || 0) + (task.value || 0);
          }
        }

        // Sort dates and count streak
        const sortedDates = Object.keys(datePoints).sort().reverse();
        let goalStreak = 0;
        let longestStreak = 0;
        let currentStreak = 0;

        for (let i = 0; i < sortedDates.length; i++) {
          const date = sortedDates[i];
          if (datePoints[date] >= dailyGoal) {
            currentStreak++;
            if (i === 0 || isConsecutiveDay(sortedDates[i - 1], date)) {
              if (i === 0) goalStreak = currentStreak;
            } else {
              longestStreak = Math.max(longestStreak, currentStreak - 1);
              currentStreak = 1;
            }
          } else {
            longestStreak = Math.max(longestStreak, currentStreak);
            currentStreak = 0;
            if (i === 0) goalStreak = 0;
          }
        }
        longestStreak = Math.max(longestStreak, currentStreak);
        if (goalStreak === 0 && currentStreak > 0) goalStreak = currentStreak;

        // Build weekly history (last 12 weeks)
        const weeklyHistory: { week: string; points: number }[] = [];
        const now = new Date();
        for (let w = 0; w < 12; w++) {
          const weekStart = new Date(now);
          weekStart.setDate(weekStart.getDate() - weekStart.getDay() - (w * 7));
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 6);
          
          const weekStartStr = weekStart.toISOString().split('T')[0];
          const weekEndStr = weekEnd.toISOString().split('T')[0];
          
          let weekPoints = 0;
          for (const comp of memberCompletions) {
            if (comp.date >= weekStartStr && comp.date <= weekEndStr) {
              const task = taskMap.get(comp.taskId);
              if (task) weekPoints += task.value || 0;
            }
          }
          
          weeklyHistory.unshift({ week: weekStartStr, points: weekPoints });
        }

        // Top tasks
        const taskTotals = Object.entries(taskCounts)
          .map(([taskName, count]) => ({ taskName, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        return {
          id: member.id,
          oderId: member.userId,
          userId: member.userId,
          firstName: user?.firstName || 'Unknown',
          lastName: user?.lastName || '',
          profileImageUrl: user?.profileImageUrl,
          role: member.role,
          totalPoints,
          goalStreak,
          longestStreak,
          weeklyHistory,
          taskTotals,
        };
      }));

      // Sort by total points descending
      memberStats.sort((a, b) => b.totalPoints - a.totalPoints);

      res.json(memberStats);
    } catch (error) {
      console.error("Error fetching circle leaderboard:", error);
      res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
  });

  // ==================== CIRCLE COMPETITION API ====================

  // Generate or get invite code for a circle
  app.put("/api/circles/:id/invite-code", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const circleId = req.params.id;

      // Check if user is owner or admin
      const [membership] = await db.select().from(circleMembers).where(
        and(eq(circleMembers.circleId, circleId), eq(circleMembers.userId, userId))
      );
      if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
        return res.status(403).json({ error: "Only owner or admin can generate invite code" });
      }

      // Check if circle already has invite code
      const [circle] = await db.select().from(circles).where(eq(circles.id, circleId));
      if (!circle) {
        return res.status(404).json({ error: "Circle not found" });
      }

      if (circle.inviteCode) {
        return res.json({ inviteCode: circle.inviteCode });
      }

      // Generate unique 8-character invite code
      let inviteCode: string;
      let attempts = 0;
      do {
        inviteCode = randomBytes(4).toString("hex").toUpperCase();
        const [existing] = await db.select().from(circles).where(eq(circles.inviteCode, inviteCode));
        if (!existing) break;
        attempts++;
      } while (attempts < 10);

      // Update circle with invite code
      const [updated] = await db.update(circles)
        .set({ inviteCode })
        .where(eq(circles.id, circleId))
        .returning();

      res.json({ inviteCode: updated.inviteCode });
    } catch (error) {
      console.error("Error generating invite code:", error);
      res.status(500).json({ error: "Failed to generate invite code" });
    }
  });

  // Find circle by invite code
  app.get("/api/circles/by-invite-code/:code", isAuthenticated, async (req: any, res) => {
    try {
      const code = req.params.code.toUpperCase();

      const [circle] = await db.select().from(circles).where(eq(circles.inviteCode, code));
      if (!circle) {
        return res.status(404).json({ error: "Circle not found with that invite code" });
      }

      // Return basic circle info
      res.json({
        id: circle.id,
        name: circle.name,
        description: circle.description,
      });
    } catch (error) {
      console.error("Error finding circle by invite code:", error);
      res.status(500).json({ error: "Failed to find circle" });
    }
  });

  // Send competition invite to another circle
  app.post("/api/circles/:id/competitions/invites", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const inviterCircleId = req.params.id;
      const { inviteeInviteCode, targetPoints, name, description } = req.body;

      // Check if user is owner or admin of the inviter circle
      const [membership] = await db.select().from(circleMembers).where(
        and(eq(circleMembers.circleId, inviterCircleId), eq(circleMembers.userId, userId))
      );
      if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
        return res.status(403).json({ error: "Only owner or admin can send competition invites" });
      }

      // Find invitee circle by invite code
      const [inviteeCircle] = await db.select().from(circles).where(eq(circles.inviteCode, inviteeInviteCode.toUpperCase()));
      if (!inviteeCircle) {
        return res.status(404).json({ error: "Circle not found with that invite code" });
      }

      // Can't invite yourself
      if (inviteeCircle.id === inviterCircleId) {
        return res.status(400).json({ error: "Cannot invite your own circle" });
      }

      // Check if there's already a pending invite between these circles
      const [existingInvite] = await db.select().from(circleCompetitionInvites).where(
        and(
          or(
            and(eq(circleCompetitionInvites.inviterCircleId, inviterCircleId), eq(circleCompetitionInvites.inviteeCircleId, inviteeCircle.id)),
            and(eq(circleCompetitionInvites.inviterCircleId, inviteeCircle.id), eq(circleCompetitionInvites.inviteeCircleId, inviterCircleId))
          ),
          eq(circleCompetitionInvites.status, "pending")
        )
      );
      if (existingInvite) {
        return res.status(400).json({ error: "There's already a pending invite between these circles" });
      }

      // Create the invite
      const [invite] = await db.insert(circleCompetitionInvites).values({
        inviterCircleId,
        inviteeCircleId: inviteeCircle.id,
        targetPoints: targetPoints || 1000,
        name: name || "Circle Competition",
        description,
        createdById: userId,
        status: "pending",
      }).returning();

      // Get inviter circle info for response
      const [inviterCircle] = await db.select().from(circles).where(eq(circles.id, inviterCircleId));

      res.json({
        ...invite,
        inviterCircle: {
          id: inviterCircle?.id,
          name: inviterCircle?.name,
        },
        inviteeCircle: {
          id: inviteeCircle.id,
          name: inviteeCircle.name,
        },
      });
    } catch (error) {
      console.error("Error sending competition invite:", error);
      res.status(500).json({ error: "Failed to send competition invite" });
    }
  });

  // Get pending competition invites for a circle (both sent and received)
  app.get("/api/circles/:id/competitions/invites", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const circleId = req.params.id;

      // Check membership
      const [membership] = await db.select().from(circleMembers).where(
        and(eq(circleMembers.circleId, circleId), eq(circleMembers.userId, userId))
      );
      if (!membership) {
        return res.status(403).json({ error: "Must be a member to view invites" });
      }

      // Get invites where this circle is inviter or invitee
      const invites = await db.select().from(circleCompetitionInvites).where(
        and(
          or(
            eq(circleCompetitionInvites.inviterCircleId, circleId),
            eq(circleCompetitionInvites.inviteeCircleId, circleId)
          ),
          eq(circleCompetitionInvites.status, "pending")
        )
      );

      // Enrich with circle info
      const invitesWithCircleInfo = await Promise.all(invites.map(async (invite) => {
        const [inviterCircle] = await db.select().from(circles).where(eq(circles.id, invite.inviterCircleId));
        const [inviteeCircle] = await db.select().from(circles).where(eq(circles.id, invite.inviteeCircleId));
        return {
          ...invite,
          inviterCircle: inviterCircle ? { id: inviterCircle.id, name: inviterCircle.name } : null,
          inviteeCircle: inviteeCircle ? { id: inviteeCircle.id, name: inviteeCircle.name } : null,
          isIncoming: invite.inviteeCircleId === circleId,
        };
      }));

      res.json(invitesWithCircleInfo);
    } catch (error) {
      console.error("Error fetching competition invites:", error);
      res.status(500).json({ error: "Failed to fetch competition invites" });
    }
  });

  // Accept or decline competition invite
  app.put("/api/circles/:id/competitions/invites/:inviteId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const circleId = req.params.id;
      const inviteId = req.params.inviteId;
      const { action } = req.body; // "accept" or "decline"

      if (!action || (action !== "accept" && action !== "decline")) {
        return res.status(400).json({ error: "Action must be 'accept' or 'decline'" });
      }

      // Check if user is owner or admin
      const [membership] = await db.select().from(circleMembers).where(
        and(eq(circleMembers.circleId, circleId), eq(circleMembers.userId, userId))
      );
      if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
        return res.status(403).json({ error: "Only owner or admin can respond to invites" });
      }

      // Get the invite
      const [invite] = await db.select().from(circleCompetitionInvites).where(
        and(
          eq(circleCompetitionInvites.id, inviteId),
          eq(circleCompetitionInvites.inviteeCircleId, circleId), // Can only respond to invites sent to your circle
          eq(circleCompetitionInvites.status, "pending")
        )
      );
      if (!invite) {
        return res.status(404).json({ error: "Invite not found or already processed" });
      }

      if (action === "decline") {
        // Update invite status
        await db.update(circleCompetitionInvites)
          .set({ status: "declined" })
          .where(eq(circleCompetitionInvites.id, inviteId));
        return res.json({ message: "Invite declined" });
      }

      // Accept: create competition
      const today = new Date().toISOString().split('T')[0];
      const [competition] = await db.insert(circleCompetitions).values({
        name: invite.name || "Circle Competition",
        description: invite.description,
        circleOneId: invite.inviterCircleId,
        circleTwoId: invite.inviteeCircleId,
        startDate: today,
        targetPoints: invite.targetPoints,
        circleOnePoints: 0,
        circleTwoPoints: 0,
        status: "active",
        createdById: invite.createdById,
      }).returning();

      // Update invite status
      await db.update(circleCompetitionInvites)
        .set({ status: "accepted" })
        .where(eq(circleCompetitionInvites.id, inviteId));

      // Get circle info for response
      const [circleOne] = await db.select().from(circles).where(eq(circles.id, competition.circleOneId));
      const [circleTwo] = await db.select().from(circles).where(eq(circles.id, competition.circleTwoId));

      res.json({
        ...competition,
        circleOne: circleOne ? { id: circleOne.id, name: circleOne.name } : null,
        circleTwo: circleTwo ? { id: circleTwo.id, name: circleTwo.name } : null,
      });
    } catch (error) {
      console.error("Error responding to competition invite:", error);
      res.status(500).json({ error: "Failed to respond to invite" });
    }
  });

  // Get all competitions for a circle
  app.get("/api/circles/:id/competitions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const circleId = req.params.id;

      // Check membership
      const [membership] = await db.select().from(circleMembers).where(
        and(eq(circleMembers.circleId, circleId), eq(circleMembers.userId, userId))
      );
      if (!membership) {
        return res.status(403).json({ error: "Must be a member to view competitions" });
      }

      // Get competitions where this circle is involved
      const competitions = await db.select().from(circleCompetitions).where(
        or(
          eq(circleCompetitions.circleOneId, circleId),
          eq(circleCompetitions.circleTwoId, circleId)
        )
      ).orderBy(desc(circleCompetitions.createdAt));

      // Enrich with circle info and calculate live points
      const competitionsWithInfo = await Promise.all(competitions.map(async (comp) => {
        const [circleOne] = await db.select().from(circles).where(eq(circles.id, comp.circleOneId));
        const [circleTwo] = await db.select().from(circles).where(eq(circles.id, comp.circleTwoId));
        
        // Calculate live points from task completions since start date
        const circleOneCompletions = await db.select().from(circleTaskCompletions).where(
          and(
            eq(circleTaskCompletions.circleId, comp.circleOneId),
            // Only include completions after start date
          )
        );
        const circleTwoCompletions = await db.select().from(circleTaskCompletions).where(
          and(
            eq(circleTaskCompletions.circleId, comp.circleTwoId),
          )
        );

        // Get task values
        const circleOneTasks = await db.select().from(circleTasks).where(eq(circleTasks.circleId, comp.circleOneId));
        const circleTwoTasks = await db.select().from(circleTasks).where(eq(circleTasks.circleId, comp.circleTwoId));
        const taskOneMap = new Map(circleOneTasks.map(t => [t.id, t.value || 0]));
        const taskTwoMap = new Map(circleTwoTasks.map(t => [t.id, t.value || 0]));

        // Calculate points from completions after start date
        let circleOnePoints = 0;
        for (const c of circleOneCompletions) {
          if (c.date >= comp.startDate) {
            circleOnePoints += taskOneMap.get(c.taskId) || 0;
          }
        }
        let circleTwoPoints = 0;
        for (const c of circleTwoCompletions) {
          if (c.date >= comp.startDate) {
            circleTwoPoints += taskTwoMap.get(c.taskId) || 0;
          }
        }

        // Determine if my circle
        const isCircleOne = comp.circleOneId === circleId;
        const myCircle = isCircleOne ? circleOne : circleTwo;
        const opponentCircle = isCircleOne ? circleTwo : circleOne;
        const myPoints = isCircleOne ? circleOnePoints : circleTwoPoints;
        const opponentPoints = isCircleOne ? circleTwoPoints : circleOnePoints;

        return {
          ...comp,
          circleOne: circleOne ? { id: circleOne.id, name: circleOne.name } : null,
          circleTwo: circleTwo ? { id: circleTwo.id, name: circleTwo.name } : null,
          circleOnePoints,
          circleTwoPoints,
          myCircle: myCircle ? { id: myCircle.id, name: myCircle.name } : null,
          opponentCircle: opponentCircle ? { id: opponentCircle.id, name: opponentCircle.name } : null,
          myPoints,
          opponentPoints,
          isCircleOne,
        };
      }));

      res.json(competitionsWithInfo);
    } catch (error) {
      console.error("Error fetching competitions:", error);
      res.status(500).json({ error: "Failed to fetch competitions" });
    }
  });

  // Get opponent circle's leaderboard for a competition
  app.get("/api/circles/:id/competitions/:competitionId/opponent-leaderboard", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const circleId = req.params.id;
      const competitionId = req.params.competitionId;

      // Check membership in requesting circle
      const [membership] = await db.select().from(circleMembers).where(
        and(eq(circleMembers.circleId, circleId), eq(circleMembers.userId, userId))
      );
      if (!membership) {
        return res.status(403).json({ error: "Must be a member to view opponent leaderboard" });
      }

      // Get competition
      const [competition] = await db.select().from(circleCompetitions).where(eq(circleCompetitions.id, competitionId));
      if (!competition) {
        return res.status(404).json({ error: "Competition not found" });
      }

      // Verify this circle is in the competition
      if (competition.circleOneId !== circleId && competition.circleTwoId !== circleId) {
        return res.status(403).json({ error: "Your circle is not part of this competition" });
      }

      // Get opponent circle ID
      const opponentCircleId = competition.circleOneId === circleId ? competition.circleTwoId : competition.circleOneId;

      // Get opponent circle
      const [opponentCircle] = await db.select().from(circles).where(eq(circles.id, opponentCircleId));
      const dailyGoal = opponentCircle?.dailyPointGoal || 30;

      // Get all members of opponent circle
      const members = await db.select().from(circleMembers).where(eq(circleMembers.circleId, opponentCircleId));

      // Get all completions for opponent circle since competition start
      const completions = await db.select().from(circleTaskCompletions).where(eq(circleTaskCompletions.circleId, opponentCircleId));
      
      // Get all tasks for point values
      const tasks = await db.select().from(circleTasks).where(eq(circleTasks.circleId, opponentCircleId));
      const taskMap = new Map(tasks.map(t => [t.id, t]));

      // Calculate stats for each member
      const memberStats = await Promise.all(members.map(async (member) => {
        const [user] = await db.select().from(users).where(eq(users.id, member.userId));
        
        // Filter completions for this member since competition start
        const memberCompletions = completions.filter(c => c.userId === member.userId && c.date >= competition.startDate);
        
        // Calculate total points
        let totalPoints = 0;
        for (const comp of memberCompletions) {
          const task = taskMap.get(comp.taskId);
          if (task) {
            totalPoints += task.value || 0;
          }
        }

        return {
          userId: member.userId,
          firstName: user?.firstName || 'Unknown',
          lastName: user?.lastName || '',
          profileImageUrl: user?.profileImageUrl,
          role: member.role,
          totalPoints,
        };
      }));

      // Sort by total points descending
      memberStats.sort((a, b) => b.totalPoints - a.totalPoints);

      res.json({
        circle: opponentCircle ? { id: opponentCircle.id, name: opponentCircle.name } : null,
        leaderboard: memberStats,
      });
    } catch (error) {
      console.error("Error fetching opponent leaderboard:", error);
      res.status(500).json({ error: "Failed to fetch opponent leaderboard" });
    }
  });

  // ==================== COMPETITION MESSAGES API ====================

  // Get messages for a competition
  app.get("/api/competitions/:competitionId/messages", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const competitionId = req.params.competitionId;

      // Get competition
      const [competition] = await db.select().from(circleCompetitions).where(eq(circleCompetitions.id, competitionId));
      if (!competition) {
        return res.status(404).json({ error: "Competition not found" });
      }

      // Verify user is a member of one of the competing circles
      const [membershipOne] = await db.select().from(circleMembers).where(
        and(eq(circleMembers.circleId, competition.circleOneId), eq(circleMembers.userId, userId))
      );
      const [membershipTwo] = await db.select().from(circleMembers).where(
        and(eq(circleMembers.circleId, competition.circleTwoId), eq(circleMembers.userId, userId))
      );
      
      if (!membershipOne && !membershipTwo) {
        return res.status(403).json({ error: "Must be a member of one of the competing circles" });
      }

      // Get messages ordered by creation date
      const messages = await db.select().from(competitionMessages)
        .where(eq(competitionMessages.competitionId, competitionId))
        .orderBy(competitionMessages.createdAt);

      // Enrich with sender info and circle names
      const enrichedMessages = await Promise.all(messages.map(async (msg) => {
        const [sender] = await db.select().from(users).where(eq(users.id, msg.senderId));
        const [senderCircle] = await db.select().from(circles).where(eq(circles.id, msg.senderCircleId));
        
        return {
          id: msg.id,
          competitionId: msg.competitionId,
          senderId: msg.senderId,
          senderName: sender ? `${sender.firstName || ''} ${sender.lastName || ''}`.trim() || 'Unknown' : 'Unknown',
          senderCircleId: msg.senderCircleId,
          senderCircleName: senderCircle?.name || 'Unknown Circle',
          content: msg.content,
          createdAt: msg.createdAt,
        };
      }));

      res.json(enrichedMessages);
    } catch (error) {
      console.error("Error fetching competition messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // Send a message to a competition
  app.post("/api/competitions/:competitionId/messages", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const competitionId = req.params.competitionId;
      const { content } = req.body;

      if (!content || typeof content !== "string" || content.trim().length === 0) {
        return res.status(400).json({ error: "Message content is required" });
      }

      // Get competition
      const [competition] = await db.select().from(circleCompetitions).where(eq(circleCompetitions.id, competitionId));
      if (!competition) {
        return res.status(404).json({ error: "Competition not found" });
      }

      // Verify user is a member of one of the competing circles and get their circle
      const [membershipOne] = await db.select().from(circleMembers).where(
        and(eq(circleMembers.circleId, competition.circleOneId), eq(circleMembers.userId, userId))
      );
      const [membershipTwo] = await db.select().from(circleMembers).where(
        and(eq(circleMembers.circleId, competition.circleTwoId), eq(circleMembers.userId, userId))
      );
      
      if (!membershipOne && !membershipTwo) {
        return res.status(403).json({ error: "Must be a member of one of the competing circles" });
      }

      const senderCircleId = membershipOne ? competition.circleOneId : competition.circleTwoId;

      // Insert the message
      const [newMessage] = await db.insert(competitionMessages).values({
        competitionId,
        senderId: userId,
        senderCircleId,
        content: content.trim(),
      }).returning();

      // Get sender info for response
      const [sender] = await db.select().from(users).where(eq(users.id, userId));
      const [senderCircle] = await db.select().from(circles).where(eq(circles.id, senderCircleId));

      res.json({
        id: newMessage.id,
        competitionId: newMessage.competitionId,
        senderId: newMessage.senderId,
        senderName: sender ? `${sender.firstName || ''} ${sender.lastName || ''}`.trim() || 'Unknown' : 'Unknown',
        senderCircleId: newMessage.senderCircleId,
        senderCircleName: senderCircle?.name || 'Unknown Circle',
        content: newMessage.content,
        createdAt: newMessage.createdAt,
      });
    } catch (error) {
      console.error("Error sending competition message:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  // ==================== DIRECT MESSAGES API ====================

  // Get all conversations (unique senders/recipients)
  app.get("/api/messages/conversations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      // Get all messages involving user
      const messages = await db.select().from(directMessages).where(
        or(
          eq(directMessages.senderId, userId),
          eq(directMessages.recipientId, userId)
        )
      ).orderBy(desc(directMessages.createdAt));

      // Group by conversation partner
      const conversationPartners = new Set<string>();
      const conversations: any[] = [];

      for (const msg of messages) {
        const partnerId = msg.senderId === userId ? msg.recipientId : msg.senderId;
        if (!conversationPartners.has(partnerId)) {
          conversationPartners.add(partnerId);
          const [partner] = await db.select().from(users).where(eq(users.id, partnerId));
          const [sender] = await db.select().from(users).where(eq(users.id, msg.senderId));
          const [recipient] = await db.select().from(users).where(eq(users.id, msg.recipientId));
          
          // Count unread messages from this partner
          const unreadCount = messages.filter(
            m => m.senderId === partnerId && m.recipientId === userId && !m.read
          ).length;

          // Build lastMessage with senderName and recipientName for frontend compatibility
          const lastMessageWithNames = {
            ...msg,
            senderName: sender ? `${sender.firstName || ''} ${sender.lastName || ''}`.trim() || 'Unknown' : 'Unknown',
            recipientName: recipient ? `${recipient.firstName || ''} ${recipient.lastName || ''}`.trim() || 'Unknown' : 'Unknown',
          };

          conversations.push({
            partnerId,
            partnerName: partner ? `${partner.firstName || ''} ${partner.lastName || ''}`.trim() || 'Unknown' : 'Unknown',
            partner: partner ? {
              id: partner.id,
              firstName: partner.firstName,
              lastName: partner.lastName,
              displayName: partner.displayName,
              profileImageUrl: partner.profileImageUrl,
            } : null,
            lastMessage: lastMessageWithNames,
            unreadCount,
          });
        }
      }

      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  // Get messages with a specific user
  app.get("/api/messages/:userId", isAuthenticated, async (req: any, res) => {
    try {
      const currentUserId = req.user.claims.sub;
      const partnerId = req.params.userId;

      const messages = await db.select().from(directMessages).where(
        or(
          and(eq(directMessages.senderId, currentUserId), eq(directMessages.recipientId, partnerId)),
          and(eq(directMessages.senderId, partnerId), eq(directMessages.recipientId, currentUserId))
        )
      ).orderBy(desc(directMessages.createdAt));

      // Mark messages as read
      await db.update(directMessages)
        .set({ read: true })
        .where(
          and(
            eq(directMessages.senderId, partnerId),
            eq(directMessages.recipientId, currentUserId),
            eq(directMessages.read, false)
          )
        );

      // Get user details for sender/recipient names
      const [currentUser] = await db.select().from(users).where(eq(users.id, currentUserId));
      const [partner] = await db.select().from(users).where(eq(users.id, partnerId));
      
      const currentUserName = currentUser ? `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || 'Unknown' : 'Unknown';
      const partnerName = partner ? `${partner.firstName || ''} ${partner.lastName || ''}`.trim() || 'Unknown' : 'Unknown';

      // Add senderName and recipientName to each message
      const messagesWithNames = messages.map(msg => ({
        ...msg,
        senderName: msg.senderId === currentUserId ? currentUserName : partnerName,
        recipientName: msg.recipientId === currentUserId ? currentUserName : partnerName,
      }));

      res.json(messagesWithNames);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // Send a direct message
  app.post("/api/messages/:userId", isAuthenticated, async (req: any, res) => {
    try {
      const currentUserId = req.user.claims.sub;
      const recipientId = req.params.userId;

      // Verify recipient exists
      const [recipient] = await db.select().from(users).where(eq(users.id, recipientId));
      if (!recipient) {
        return res.status(404).json({ error: "Recipient not found" });
      }

      // Get sender details
      const [sender] = await db.select().from(users).where(eq(users.id, currentUserId));

      const parsed = insertDirectMessageSchema.parse({
        ...req.body,
        senderId: currentUserId,
        recipientId,
      });
      const [message] = await db.insert(directMessages).values(parsed).returning();

      // Create notification for the recipient
      const senderName = sender?.displayName || `${sender?.firstName || ''} ${sender?.lastName || ''}`.trim() || "Someone";
      await storage.createNotification({
        userId: recipientId,
        type: "instant_message",
        title: "New Message",
        message: `${senderName} sent you a message`,
        actorId: currentUserId,
        resourceId: message.id,
        resourceType: "message",
      });

      // Return message with sender and recipient names for frontend compatibility
      const messageWithNames = {
        ...message,
        senderName: sender ? `${sender.firstName || ''} ${sender.lastName || ''}`.trim() || 'Unknown' : 'Unknown',
        recipientName: `${recipient.firstName || ''} ${recipient.lastName || ''}`.trim() || 'Unknown',
      };

      res.json(messageWithNames);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(400).json({ error: "Failed to send message" });
    }
  });

  // ==================== CHEERLINES API ROUTES ====================

  // Get cheerlines received by the current user (not expired)
  app.get("/api/cheerlines", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const now = new Date();
      console.log("[CHEERLINES] Fetching cheerlines for user:", userId);

      // Get all cheerlines for this recipient - we filter by expiration in JS
      const receivedCheerlines = await db.select().from(cheerlines).where(
        eq(cheerlines.recipientId, userId)
      ).orderBy(desc(cheerlines.createdAt));

      // Filter out expired cheerlines in JS since SQL comparison can be tricky
      const validCheerlines = receivedCheerlines.filter(c => 
        !c.expiresAt || new Date(c.expiresAt) > now
      );
      console.log("[CHEERLINES] Found", receivedCheerlines.length, "total,", validCheerlines.length, "valid for user:", userId);

      // Get sender details for each cheerline
      const cheerlinesWithSender = await Promise.all(
        validCheerlines.map(async (cheerline) => {
          const [sender] = await db.select().from(users).where(eq(users.id, cheerline.senderId));
          return {
            ...cheerline,
            sender: sender ? {
              id: sender.id,
              firstName: sender.firstName,
              lastName: sender.lastName,
              displayName: sender.displayName,
              profileImageUrl: sender.profileImageUrl,
            } : null,
          };
        })
      );

      res.json(cheerlinesWithSender);
    } catch (error) {
      console.error("Error fetching cheerlines:", error);
      res.status(500).json({ error: "Failed to fetch cheerlines" });
    }
  });

  // Send a cheerline to a friend
  app.post("/api/cheerlines/:userId", isAuthenticated, async (req: any, res) => {
    try {
      const senderId = req.user.claims.sub;
      const recipientId = req.params.userId;

      // Verify recipient exists
      const [recipient] = await db.select().from(users).where(eq(users.id, recipientId));
      if (!recipient) {
        return res.status(404).json({ error: "Recipient not found" });
      }

      // Verify they are friends (both directions)
      const [friendship] = await db.select().from(friendships).where(
        and(
          eq(friendships.status, "accepted"),
          or(
            and(eq(friendships.requesterId, senderId), eq(friendships.addresseeId, recipientId)),
            and(eq(friendships.requesterId, recipientId), eq(friendships.addresseeId, senderId))
          )
        )
      );

      if (!friendship) {
        return res.status(403).json({ error: "You can only send cheerlines to friends" });
      }

      // Calculate expiration date (3 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 3);

      const parsed = insertCheerlineSchema.parse({
        senderId,
        recipientId,
        message: req.body.message,
        expiresAt,
        read: false,
      });

      const [cheerline] = await db.insert(cheerlines).values(parsed).returning();

      // Award FP for sending a cheerline
      const { awardFp } = await import("./fpService");
      await awardFp(senderId, "send_cheerline");
      
      // Award first_cheerline_sent one-time bonus
      await awardFp(senderId, "first_cheerline_sent", { checkDuplicate: true });

      res.json(cheerline);
    } catch (error) {
      console.error("Error sending cheerline:", error);
      res.status(400).json({ error: "Failed to send cheerline" });
    }
  });

  // Mark a cheerline as read
  app.put("/api/cheerlines/:id/read", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const cheerlineId = req.params.id;

      const [updated] = await db.update(cheerlines)
        .set({ read: true })
        .where(and(eq(cheerlines.id, cheerlineId), eq(cheerlines.recipientId, userId)))
        .returning();

      if (!updated) {
        return res.status(404).json({ error: "Cheerline not found" });
      }

      res.json(updated);
    } catch (error) {
      console.error("Error marking cheerline as read:", error);
      res.status(400).json({ error: "Failed to update cheerline" });
    }
  });

  // Dismiss/delete a cheerline
  app.delete("/api/cheerlines/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const cheerlineId = req.params.id;

      const [deleted] = await db.delete(cheerlines)
        .where(and(eq(cheerlines.id, cheerlineId), eq(cheerlines.recipientId, userId)))
        .returning();

      if (!deleted) {
        return res.status(404).json({ error: "Cheerline not found" });
      }

      res.json({ deleted: true });
    } catch (error) {
      console.error("Error deleting cheerline:", error);
      res.status(400).json({ error: "Failed to delete cheerline" });
    }
  });

  // ==================== USER HABIT SYNC API ROUTES ====================

  // Get all user tasks (from active season)
  app.get("/api/habit/tasks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // First, find the user's active season
      const [activeSeason] = await db.select().from(seasons).where(
        and(eq(seasons.userId, userId), eq(seasons.isActive, true), eq(seasons.isArchived, false))
      );
      
      if (!activeSeason) {
        // No active season, return empty array
        return res.json([]);
      }
      
      // Get tasks from the active season
      const tasks = await db.select().from(seasonTasks).where(eq(seasonTasks.seasonId, activeSeason.id));
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching user tasks:", error);
      res.status(500).json({ error: "Failed to fetch tasks" });
    }
  });

  // Create a new user task (in active season)
  app.post("/api/habit/tasks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Find the user's active season
      const [activeSeason] = await db.select().from(seasons).where(
        and(eq(seasons.userId, userId), eq(seasons.isActive, true), eq(seasons.isArchived, false))
      );
      
      if (!activeSeason) {
        return res.status(400).json({ error: "No active season. Please create a season first." });
      }
      
      const { name, value, category, priority, boosterRule, penaltyRule, tiers } = req.body;
      const [task] = await db.insert(seasonTasks).values({
        seasonId: activeSeason.id,
        name,
        value: value || 0,
        category: category || "General",
        priority: priority || "shouldDo",
        boosterRule: boosterRule || null,
        penaltyRule: penaltyRule || null,
        tiers: tiers || null,
      }).returning();
      
      // Award first_task one-time bonus
      try {
        const { awardFp } = await import("./fpService");
        await awardFp(userId, "first_task", { checkDuplicate: true });
      } catch (e) { console.error("FP award error:", e); }
      
      res.json(task);
    } catch (error) {
      console.error("Error creating user task:", error);
      res.status(400).json({ error: "Failed to create task" });
    }
  });

  // Update a user task (in active season)
  app.put("/api/habit/tasks/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const taskId = req.params.id;
      
      // Verify the task belongs to user's active season
      const [activeSeason] = await db.select().from(seasons).where(
        and(eq(seasons.userId, userId), eq(seasons.isActive, true), eq(seasons.isArchived, false))
      );
      
      if (!activeSeason) {
        return res.status(400).json({ error: "No active season" });
      }
      
      const { name, value, category, priority, boosterRule, penaltyRule, tiers } = req.body;

      const [task] = await db.update(seasonTasks)
        .set({ 
          name, 
          value, 
          category, 
          priority,
          boosterRule,
          penaltyRule,
          tiers
        })
        .where(and(eq(seasonTasks.id, taskId), eq(seasonTasks.seasonId, activeSeason.id)))
        .returning();

      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      console.error("Error updating user task:", error);
      res.status(400).json({ error: "Failed to update task" });
    }
  });

  // Delete a user task (from active season)
  app.delete("/api/habit/tasks/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const taskId = req.params.id;
      
      // Verify the task belongs to user's active season
      const [activeSeason] = await db.select().from(seasons).where(
        and(eq(seasons.userId, userId), eq(seasons.isActive, true), eq(seasons.isArchived, false))
      );
      
      if (!activeSeason) {
        return res.status(400).json({ error: "No active season" });
      }

      const [deleted] = await db.delete(seasonTasks)
        .where(and(eq(seasonTasks.id, taskId), eq(seasonTasks.seasonId, activeSeason.id)))
        .returning();

      if (!deleted) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting user task:", error);
      res.status(400).json({ error: "Failed to delete task" });
    }
  });

  // Get all user categories
  app.get("/api/habit/categories", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const categories = await db.select().from(userCategories).where(eq(userCategories.userId, userId));
      res.json(categories);
    } catch (error) {
      console.error("Error fetching user categories:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  // Create a new user category
  app.post("/api/habit/categories", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const parsed = insertUserCategorySchema.parse({ ...req.body, userId });
      const [category] = await db.insert(userCategories).values(parsed).returning();
      res.json(category);
    } catch (error) {
      console.error("Error creating user category:", error);
      res.status(400).json({ error: "Failed to create category" });
    }
  });

  // Update a user category
  app.put("/api/habit/categories/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const categoryId = req.params.id;
      const { name, color } = req.body;

      const [category] = await db.update(userCategories)
        .set({ name, color })
        .where(and(eq(userCategories.id, categoryId), eq(userCategories.userId, userId)))
        .returning();

      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      console.error("Error updating user category:", error);
      res.status(400).json({ error: "Failed to update category" });
    }
  });

  // Delete a user category
  app.delete("/api/habit/categories/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const categoryId = req.params.id;

      const [deleted] = await db.delete(userCategories)
        .where(and(eq(userCategories.id, categoryId), eq(userCategories.userId, userId)))
        .returning();

      if (!deleted) {
        return res.status(404).json({ error: "Category not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting user category:", error);
      res.status(400).json({ error: "Failed to delete category" });
    }
  });

  // Get all user penalties
  app.get("/api/habit/penalties", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const penalties = await db.select().from(userPenalties).where(eq(userPenalties.userId, userId));
      res.json(penalties);
    } catch (error) {
      console.error("Error fetching user penalties:", error);
      res.status(500).json({ error: "Failed to fetch penalties" });
    }
  });

  // Create a new user penalty
  app.post("/api/habit/penalties", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const parsed = insertUserPenaltySchema.parse({ ...req.body, userId });
      const [penalty] = await db.insert(userPenalties).values(parsed).returning();
      res.json(penalty);
    } catch (error) {
      console.error("Error creating user penalty:", error);
      res.status(400).json({ error: "Failed to create penalty" });
    }
  });

  // Update a user penalty
  app.put("/api/habit/penalties/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const penaltyId = req.params.id;
      const { name, value } = req.body;

      const [penalty] = await db.update(userPenalties)
        .set({ name, value })
        .where(and(eq(userPenalties.id, penaltyId), eq(userPenalties.userId, userId)))
        .returning();

      if (!penalty) {
        return res.status(404).json({ error: "Penalty not found" });
      }
      res.json(penalty);
    } catch (error) {
      console.error("Error updating user penalty:", error);
      res.status(400).json({ error: "Failed to update penalty" });
    }
  });

  // Delete a user penalty
  app.delete("/api/habit/penalties/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const penaltyId = req.params.id;

      const [deleted] = await db.delete(userPenalties)
        .where(and(eq(userPenalties.id, penaltyId), eq(userPenalties.userId, userId)))
        .returning();

      if (!deleted) {
        return res.status(404).json({ error: "Penalty not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting user penalty:", error);
      res.status(400).json({ error: "Failed to delete penalty" });
    }
  });

  // Get user habit settings
  app.get("/api/habit/settings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const [settings] = await db.select().from(userHabitSettings).where(eq(userHabitSettings.userId, userId));
      res.json(settings || null);
    } catch (error) {
      console.error("Error fetching user settings:", error);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  // Create or update user habit settings (upsert)
  app.put("/api/habit/settings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { dailyGoal, weeklyGoal, userName, encouragementMessage, penaltyBoostEnabled, penaltyBoostThreshold, penaltyBoostPeriod, penaltyBoostPoints } = req.body;

      // Check if settings exist
      const [existing] = await db.select().from(userHabitSettings).where(eq(userHabitSettings.userId, userId));

      if (existing) {
        // Update existing settings
        const [settings] = await db.update(userHabitSettings)
          .set({
            dailyGoal,
            weeklyGoal,
            userName,
            encouragementMessage,
            penaltyBoostEnabled,
            penaltyBoostThreshold,
            penaltyBoostPeriod,
            penaltyBoostPoints,
            updatedAt: new Date()
          })
          .where(eq(userHabitSettings.userId, userId))
          .returning();
        res.json(settings);
      } else {
        // Create new settings
        const parsed = insertUserHabitSettingsSchema.parse({
          userId,
          dailyGoal,
          weeklyGoal,
          userName,
          encouragementMessage,
          penaltyBoostEnabled,
          penaltyBoostThreshold,
          penaltyBoostPeriod,
          penaltyBoostPoints
        });
        const [settings] = await db.insert(userHabitSettings).values(parsed).returning();
        res.json(settings);
      }
    } catch (error) {
      console.error("Error updating user settings:", error);
      res.status(400).json({ error: "Failed to update settings" });
    }
  });

  // Get user AI instructions
  app.get("/api/ai/instructions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const [settings] = await db.select({ aiInstructions: userHabitSettings.aiInstructions })
        .from(userHabitSettings)
        .where(eq(userHabitSettings.userId, userId));
      res.json({ aiInstructions: settings?.aiInstructions || "" });
    } catch (error) {
      console.error("Error fetching AI instructions:", error);
      res.status(500).json({ error: "Failed to fetch AI instructions" });
    }
  });

  // Save user AI instructions
  app.put("/api/ai/instructions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { aiInstructions } = req.body;

      if (typeof aiInstructions !== "string") {
        return res.status(400).json({ error: "aiInstructions must be a string" });
      }

      // Check if settings exist
      const [existing] = await db.select().from(userHabitSettings).where(eq(userHabitSettings.userId, userId));

      if (existing) {
        // Update existing settings
        const [settings] = await db.update(userHabitSettings)
          .set({ aiInstructions, updatedAt: new Date() })
          .where(eq(userHabitSettings.userId, userId))
          .returning();
        res.json({ aiInstructions: settings.aiInstructions || "" });
      } else {
        // Create new settings with AI instructions and required defaults
        const [settings] = await db.insert(userHabitSettings)
          .values({ 
            userId, 
            aiInstructions,
            dailyGoal: 50,
            weeklyGoal: 350,
            userName: "You"
          })
          .returning();
        res.json({ aiInstructions: settings.aiInstructions || "" });
      }
    } catch (error) {
      console.error("Error saving AI instructions:", error);
      res.status(400).json({ error: "Failed to save AI instructions" });
    }
  });

  // ==================== AI CONVERSATIONS ====================

  // Get all AI conversations for the user
  app.get("/api/ai/conversations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const conversations = await storage.getAIConversations(userId);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching AI conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  // Get a single AI conversation
  app.get("/api/ai/conversations/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const conversation = await storage.getAIConversation(id, userId);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      res.json(conversation);
    } catch (error) {
      console.error("Error fetching AI conversation:", error);
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });

  // Create a new AI conversation
  app.post("/api/ai/conversations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { title, messages } = req.body;
      const conversation = await storage.createAIConversation({
        userId,
        title: title || "New Conversation",
        messages: messages || [],
      });
      res.json(conversation);
    } catch (error) {
      console.error("Error creating AI conversation:", error);
      res.status(400).json({ error: "Failed to create conversation" });
    }
  });

  // Update an AI conversation (add messages or rename)
  app.put("/api/ai/conversations/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const { title, messages } = req.body;
      const conversation = await storage.updateAIConversation(id, userId, { title, messages });
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      res.json(conversation);
    } catch (error) {
      console.error("Error updating AI conversation:", error);
      res.status(400).json({ error: "Failed to update conversation" });
    }
  });

  // Delete an AI conversation
  app.delete("/api/ai/conversations/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const deleted = await storage.deleteAIConversation(id, userId);
      if (!deleted) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting AI conversation:", error);
      res.status(400).json({ error: "Failed to delete conversation" });
    }
  });

  // Get user dashboard preferences
  app.get("/api/dashboard/preferences", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const [prefs] = await db.select().from(userDashboardPreferences).where(eq(userDashboardPreferences.userId, userId));
      
      if (prefs) {
        res.json(prefs.preferences);
      } else {
        res.json(defaultDashboardPreferences);
      }
    } catch (error) {
      console.error("Error fetching dashboard preferences:", error);
      res.status(500).json({ error: "Failed to fetch dashboard preferences" });
    }
  });

  // Update user dashboard preferences
  app.put("/api/dashboard/preferences", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const preferences = dashboardPreferencesSchema.parse(req.body);

      // Check if preferences exist
      const [existing] = await db.select().from(userDashboardPreferences).where(eq(userDashboardPreferences.userId, userId));

      if (existing) {
        // Update existing preferences
        const [updated] = await db.update(userDashboardPreferences)
          .set({
            preferences,
            updatedAt: new Date()
          })
          .where(eq(userDashboardPreferences.userId, userId))
          .returning();
        res.json(updated.preferences);
      } else {
        // Create new preferences
        const [created] = await db.insert(userDashboardPreferences)
          .values({
            userId,
            preferences,
          })
          .returning();
        res.json(created.preferences);
      }
    } catch (error) {
      console.error("Error updating dashboard preferences:", error);
      res.status(400).json({ error: "Failed to update dashboard preferences" });
    }
  });

  // ==================== SCHEDULE TEMPLATES ROUTES ====================

  // Get all schedule templates for user
  app.get("/api/habit/schedule-templates", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const templates = await db.select().from(userScheduleTemplates)
        .where(eq(userScheduleTemplates.userId, userId))
        .orderBy(userScheduleTemplates.name);
      res.json(templates);
    } catch (error) {
      console.error("Error fetching schedule templates:", error);
      res.status(500).json({ error: "Failed to fetch schedule templates" });
    }
  });

  // Get a single schedule template
  app.get("/api/habit/schedule-templates/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const templateId = req.params.id;
      const [template] = await db.select().from(userScheduleTemplates)
        .where(and(eq(userScheduleTemplates.id, templateId), eq(userScheduleTemplates.userId, userId)));
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }
      res.json(template);
    } catch (error) {
      console.error("Error fetching schedule template:", error);
      res.status(500).json({ error: "Failed to fetch schedule template" });
    }
  });

  // Create a new schedule template
  app.post("/api/habit/schedule-templates", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { name, description, timeBlocks } = req.body;
      
      // Validate time blocks if provided
      if (timeBlocks) {
        z.array(timeBlockSchema).parse(timeBlocks);
      }

      const parsed = insertUserScheduleTemplateSchema.parse({
        userId,
        name,
        description,
        timeBlocks: timeBlocks || [],
      });
      const [template] = await db.insert(userScheduleTemplates).values(parsed).returning();
      res.json(template);
    } catch (error) {
      console.error("Error creating schedule template:", error);
      res.status(400).json({ error: "Failed to create schedule template" });
    }
  });

  // Update a schedule template
  app.put("/api/habit/schedule-templates/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const templateId = req.params.id;
      
      // Validate the entire body using the schema
      const updateSchema = z.object({
        name: z.string().min(1, "Name is required"),
        description: z.string().optional(),
        timeBlocks: z.array(timeBlockSchema).optional(),
      });
      
      const parsed = updateSchema.parse(req.body);

      const [template] = await db.update(userScheduleTemplates)
        .set({ 
          name: parsed.name, 
          description: parsed.description || null, 
          timeBlocks: parsed.timeBlocks || [], 
          updatedAt: new Date() 
        })
        .where(and(eq(userScheduleTemplates.id, templateId), eq(userScheduleTemplates.userId, userId)))
        .returning();

      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }
      res.json(template);
    } catch (error) {
      console.error("Error updating schedule template:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0]?.message || "Validation failed" });
      }
      res.status(400).json({ error: "Failed to update schedule template" });
    }
  });

  // Delete a schedule template
  app.delete("/api/habit/schedule-templates/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const templateId = req.params.id;

      // First, clear references in daily schedules to prevent dangling references
      await db.update(userDailySchedules)
        .set({ templateId: null, updatedAt: new Date() })
        .where(and(eq(userDailySchedules.userId, userId), eq(userDailySchedules.templateId, templateId)));

      const [deleted] = await db.delete(userScheduleTemplates)
        .where(and(eq(userScheduleTemplates.id, templateId), eq(userScheduleTemplates.userId, userId)))
        .returning();

      if (!deleted) {
        return res.status(404).json({ error: "Template not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting schedule template:", error);
      res.status(400).json({ error: "Failed to delete schedule template" });
    }
  });

  // ==================== DAILY SCHEDULE ASSIGNMENT ROUTES ====================

  // Get daily schedule for a specific date
  app.get("/api/habit/daily-schedules/:date", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const date = req.params.date;

      const [schedule] = await db.select().from(userDailySchedules)
        .where(and(eq(userDailySchedules.userId, userId), eq(userDailySchedules.date, date)));
      
      if (!schedule) {
        return res.json(null);
      }

      // If there's a template ID, fetch the template details
      if (schedule.templateId) {
        const [template] = await db.select().from(userScheduleTemplates)
          .where(eq(userScheduleTemplates.id, schedule.templateId));
        return res.json({ ...schedule, template });
      }

      res.json(schedule);
    } catch (error) {
      console.error("Error fetching daily schedule:", error);
      res.status(500).json({ error: "Failed to fetch daily schedule" });
    }
  });

  // Assign or update schedule for a specific date
  app.put("/api/habit/daily-schedules/:date", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const date = req.params.date;
      const { templateId } = req.body;

      // Check if an assignment already exists for this date
      const [existing] = await db.select().from(userDailySchedules)
        .where(and(eq(userDailySchedules.userId, userId), eq(userDailySchedules.date, date)));

      let schedule;
      if (existing) {
        // Update existing
        [schedule] = await db.update(userDailySchedules)
          .set({ templateId, updatedAt: new Date() })
          .where(eq(userDailySchedules.id, existing.id))
          .returning();
      } else {
        // Create new
        const parsed = insertUserDailyScheduleSchema.parse({ userId, date, templateId });
        [schedule] = await db.insert(userDailySchedules).values(parsed).returning();
      }

      // Fetch the template details if assigned
      if (schedule.templateId) {
        const [template] = await db.select().from(userScheduleTemplates)
          .where(eq(userScheduleTemplates.id, schedule.templateId));
        return res.json({ ...schedule, template });
      }

      res.json(schedule);
    } catch (error) {
      console.error("Error assigning daily schedule:", error);
      res.status(400).json({ error: "Failed to assign daily schedule" });
    }
  });

  // Remove schedule assignment for a date
  app.delete("/api/habit/daily-schedules/:date", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const date = req.params.date;

      const [deleted] = await db.delete(userDailySchedules)
        .where(and(eq(userDailySchedules.userId, userId), eq(userDailySchedules.date, date)))
        .returning();

      res.json({ success: true });
    } catch (error) {
      console.error("Error removing daily schedule:", error);
      res.status(400).json({ error: "Failed to remove daily schedule" });
    }
  });

  // Get daily logs for a date range
  app.get("/api/habit/logs", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { from, to } = req.query;
      
      let logs;
      if (from && to) {
        // Filter by date range
        logs = await db.select().from(userDailyLogs)
          .where(and(
            eq(userDailyLogs.userId, userId),
            // Date is stored as YYYY-MM-DD string, so we can use string comparison
          ));
        // Filter in memory for date range (more flexible)
        logs = logs.filter(log => log.date >= from && log.date <= to);
      } else {
        logs = await db.select().from(userDailyLogs).where(eq(userDailyLogs.userId, userId));
      }
      
      res.json(logs);
    } catch (error) {
      console.error("Error fetching daily logs:", error);
      res.status(500).json({ error: "Failed to fetch daily logs" });
    }
  });

  // Get daily log for a specific date
  app.get("/api/habit/logs/:date", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const date = req.params.date;

      const [log] = await db.select().from(userDailyLogs)
        .where(and(eq(userDailyLogs.userId, userId), eq(userDailyLogs.date, date)));
      
      res.json(log || null);
    } catch (error) {
      console.error("Error fetching daily log:", error);
      res.status(500).json({ error: "Failed to fetch daily log" });
    }
  });

  // Create or update daily log for a specific date (upsert)
  app.put("/api/habit/logs/:date", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const date = req.params.date;
      const { completedTaskIds, notes, todoPoints, penaltyPoints, taskPoints, seasonId, taskNotes, taskTiers } = req.body;

      // Check if log exists for this date
      const [existing] = await db.select().from(userDailyLogs)
        .where(and(eq(userDailyLogs.userId, userId), eq(userDailyLogs.date, date)));

      if (existing) {
        // Update existing log
        const [log] = await db.update(userDailyLogs)
          .set({
            completedTaskIds: completedTaskIds || [],
            todoPoints: todoPoints || 0,
            penaltyPoints: penaltyPoints || 0,
            taskPoints: taskPoints || 0,
            seasonId: seasonId || null,
            notes,
            taskNotes: taskNotes || null,
            taskTiers: taskTiers || null,
            updatedAt: new Date()
          })
          .where(and(eq(userDailyLogs.userId, userId), eq(userDailyLogs.date, date)))
          .returning();
        
        // Check if user hit daily goal and award FP + streak milestones
        try {
          const { awardFp, awardLoggingStreakMilestones, awardDailyGoalStreakMilestones, checkAndAwardWeeklyTriggers } = await import("./fpService");
          const [settings] = await db.select().from(userHabitSettings).where(eq(userHabitSettings.userId, userId));
          const dailyGoal = settings?.dailyGoal || 50;
          const totalPoints = (todoPoints || 0) + (taskPoints || 0) - (penaltyPoints || 0);
          if (totalPoints >= dailyGoal) {
            await awardFp(userId, "hit_daily_goal", { checkDuplicate: true });
            await awardDailyGoalStreakMilestones(userId);
          }
          await awardLoggingStreakMilestones(userId);
          
          // Check weekly FP triggers - calculate weekly total
          const logDate = new Date(date);
          const dayOfWeek = logDate.getDay();
          const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
          const weekStart = new Date(logDate);
          weekStart.setDate(logDate.getDate() + mondayOffset);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          const weekStartStr = weekStart.toISOString().split('T')[0];
          const weekEndStr = weekEnd.toISOString().split('T')[0];
          
          const { sql, gte, lte } = await import("drizzle-orm");
          const weekLogs = await db.select({
            taskPoints: userDailyLogs.taskPoints,
            todoPoints: userDailyLogs.todoPoints,
            penaltyPoints: userDailyLogs.penaltyPoints
          }).from(userDailyLogs).where(and(
            eq(userDailyLogs.userId, userId),
            gte(userDailyLogs.date, weekStartStr),
            lte(userDailyLogs.date, weekEndStr)
          ));
          
          const weeklyTotal = weekLogs.reduce((sum, log) => {
            return sum + (log.taskPoints || 0) + (log.todoPoints || 0) + (log.penaltyPoints || 0);
          }, 0);
          const weeklyGoal = settings?.weeklyGoal || 100;
          
          await checkAndAwardWeeklyTriggers(userId, weeklyTotal, weeklyGoal);
        } catch (fpError) {
          console.error("Error awarding FP for hit_daily_goal:", fpError);
        }
        
        res.json(log);
      } else {
        // Create new log - set checkInBonusAwarded to true since FP is awarded on first save
        const parsed = insertUserDailyLogSchema.parse({
          userId,
          date,
          completedTaskIds: completedTaskIds || [],
          todoPoints: todoPoints || 0,
          penaltyPoints: penaltyPoints || 0,
          taskPoints: taskPoints || 0,
          checkInBonusAwarded: true,
          seasonId: seasonId || null,
          notes,
          taskNotes: taskNotes || null,
          taskTiers: taskTiers || null
        });
        const [log] = await db.insert(userDailyLogs).values(parsed).returning();
        
        // Award FP for logging a day (first log of the day only) + streak milestones
        try {
          const { awardFp, awardLoggingStreakMilestones, awardDailyGoalStreakMilestones, checkAndAwardWeeklyTriggers } = await import("./fpService");
          await awardFp(userId, "log_day", { checkDuplicate: true });
          await awardLoggingStreakMilestones(userId);
          
          // Check if user hit daily goal and award FP
          const [settings] = await db.select().from(userHabitSettings).where(eq(userHabitSettings.userId, userId));
          const dailyGoal = settings?.dailyGoal || 50;
          const totalPoints = (todoPoints || 0) + (taskPoints || 0) - (penaltyPoints || 0);
          if (totalPoints >= dailyGoal) {
            await awardFp(userId, "hit_daily_goal", { checkDuplicate: true });
            await awardDailyGoalStreakMilestones(userId);
          }
          
          // Check weekly FP triggers - calculate weekly total
          const logDate = new Date(date);
          const dayOfWeek = logDate.getDay();
          const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
          const weekStart = new Date(logDate);
          weekStart.setDate(logDate.getDate() + mondayOffset);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          const weekStartStr = weekStart.toISOString().split('T')[0];
          const weekEndStr = weekEnd.toISOString().split('T')[0];
          
          const { gte, lte } = await import("drizzle-orm");
          const weekLogs = await db.select({
            taskPoints: userDailyLogs.taskPoints,
            todoPoints: userDailyLogs.todoPoints,
            penaltyPoints: userDailyLogs.penaltyPoints
          }).from(userDailyLogs).where(and(
            eq(userDailyLogs.userId, userId),
            gte(userDailyLogs.date, weekStartStr),
            lte(userDailyLogs.date, weekEndStr)
          ));
          
          const weeklyTotal = weekLogs.reduce((sum, log) => {
            return sum + (log.taskPoints || 0) + (log.todoPoints || 0) + (log.penaltyPoints || 0);
          }, 0);
          const weeklyGoal = settings?.weeklyGoal || 100;
          
          await checkAndAwardWeeklyTriggers(userId, weeklyTotal, weeklyGoal);
        } catch (fpError) {
          console.error("Error awarding FP for log_day/hit_daily_goal:", fpError);
        }
        
        res.json(log);
      }
    } catch (error) {
      console.error("Error updating daily log:", error);
      res.status(400).json({ error: "Failed to update daily log" });
    }
  });

  // ==================== DAILY TO-DO LIST API ====================

  // Get daily to-do list for a specific date
  app.get("/api/habit/daily-todos/:date", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const date = req.params.date;

      const [todo] = await db.select().from(userDailyTodos)
        .where(and(eq(userDailyTodos.userId, userId), eq(userDailyTodos.date, date)));
      
      res.json(todo || null);
    } catch (error) {
      console.error("Error fetching daily to-do list:", error);
      res.status(500).json({ error: "Failed to fetch daily to-do list" });
    }
  });

  // Create or update daily to-do list for a specific date (upsert)
  app.put("/api/habit/daily-todos/:date", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const date = req.params.date;
      const { items, bonusEnabled, bonusPoints, bonusAwarded } = req.body;

      // Check if to-do list exists for this date
      const [existing] = await db.select().from(userDailyTodos)
        .where(and(eq(userDailyTodos.userId, userId), eq(userDailyTodos.date, date)));

      if (existing) {
        // Update existing to-do list
        const [todo] = await db.update(userDailyTodos)
          .set({
            items: items || [],
            bonusEnabled: bonusEnabled ?? false,
            bonusPoints: bonusPoints ?? 10,
            bonusAwarded: bonusAwarded ?? false,
            updatedAt: new Date()
          })
          .where(and(eq(userDailyTodos.userId, userId), eq(userDailyTodos.date, date)))
          .returning();
        
        res.json(todo);
      } else {
        // Create new to-do list
        const parsed = insertUserDailyTodoSchema.parse({
          userId,
          date,
          items: items || [],
          bonusEnabled: bonusEnabled ?? false,
          bonusPoints: bonusPoints ?? 10,
          bonusAwarded: bonusAwarded ?? false
        });
        const [todo] = await db.insert(userDailyTodos).values(parsed).returning();
        res.json(todo);
      }
    } catch (error) {
      console.error("Error updating daily to-do list:", error);
      res.status(400).json({ error: "Failed to update daily to-do list" });
    }
  });

  // ==================== WEEKLY TO-DO LIST API ====================

  // Get weekly to-do list for a specific week
  app.get("/api/habit/weekly-todos/:weekId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const weekId = req.params.weekId;

      const [todo] = await db.select().from(userWeeklyTodos)
        .where(and(eq(userWeeklyTodos.userId, userId), eq(userWeeklyTodos.weekId, weekId)));
      
      res.json(todo || null);
    } catch (error) {
      console.error("Error fetching weekly to-do list:", error);
      res.status(500).json({ error: "Failed to fetch weekly to-do list" });
    }
  });

  // Create or update weekly to-do list for a specific week (upsert)
  app.put("/api/habit/weekly-todos/:weekId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const weekId = req.params.weekId;
      const { items, bonusEnabled, bonusPoints, bonusAwarded } = req.body;

      // Check if to-do list exists for this week
      const [existing] = await db.select().from(userWeeklyTodos)
        .where(and(eq(userWeeklyTodos.userId, userId), eq(userWeeklyTodos.weekId, weekId)));

      if (existing) {
        // Update existing to-do list
        const [todo] = await db.update(userWeeklyTodos)
          .set({
            items: items || [],
            bonusEnabled: bonusEnabled ?? false,
            bonusPoints: bonusPoints ?? 25,
            bonusAwarded: bonusAwarded ?? false,
            updatedAt: new Date()
          })
          .where(and(eq(userWeeklyTodos.userId, userId), eq(userWeeklyTodos.weekId, weekId)))
          .returning();
        
        // Award first_weekly_todo one-time FP bonus when adding first item
        if (items && items.length > 0 && (!existing.items || (existing.items as any[]).length === 0)) {
          try {
            const { awardFp } = await import("./fpService");
            await awardFp(userId, "first_weekly_todo", { checkDuplicate: true });
          } catch (e) { console.error("FP award error:", e); }
        }
        
        res.json(todo);
      } else {
        // Create new to-do list
        const parsed = insertUserWeeklyTodoSchema.parse({
          userId,
          weekId,
          items: items || [],
          bonusEnabled: bonusEnabled ?? false,
          bonusPoints: bonusPoints ?? 25,
          bonusAwarded: bonusAwarded ?? false
        });
        const [todo] = await db.insert(userWeeklyTodos).values(parsed).returning();
        
        // Award first_weekly_todo one-time FP bonus
        if (items && items.length > 0) {
          try {
            const { awardFp } = await import("./fpService");
            await awardFp(userId, "first_weekly_todo", { checkDuplicate: true });
          } catch (e) { console.error("FP award error:", e); }
        }
        
        res.json(todo);
      }
    } catch (error) {
      console.error("Error updating weekly to-do list:", error);
      res.status(400).json({ error: "Failed to update weekly to-do list" });
    }
  });

  // ==================== JOURNAL API ====================

  // Get all journal entries for the user
  app.get("/api/habit/journal", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const entries = await db.select().from(userJournalEntries)
        .where(eq(userJournalEntries.userId, userId))
        .orderBy(desc(userJournalEntries.createdAt));
      res.json(entries);
    } catch (error) {
      console.error("Error fetching journal entries:", error);
      res.status(500).json({ error: "Failed to fetch journal entries" });
    }
  });

  // Get journal entries for a specific date
  app.get("/api/habit/journal/:date", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const date = req.params.date;
      const entries = await db.select().from(userJournalEntries)
        .where(and(eq(userJournalEntries.userId, userId), eq(userJournalEntries.date, date)))
        .orderBy(desc(userJournalEntries.createdAt));
      res.json(entries);
    } catch (error) {
      console.error("Error fetching journal entries for date:", error);
      res.status(500).json({ error: "Failed to fetch journal entries" });
    }
  });

  // Create a new journal entry
  app.post("/api/habit/journal", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { date, title, content } = req.body;
      
      const parsed = insertUserJournalEntrySchema.parse({
        userId,
        date,
        title,
        content,
      });
      
      const [entry] = await db.insert(userJournalEntries).values(parsed).returning();
      
      // Award first_journal one-time bonus
      try {
        const { awardFp } = await import("./fpService");
        await awardFp(userId, "first_journal", { checkDuplicate: true });
      } catch (e) { console.error("FP award error:", e); }
      
      res.json(entry);
    } catch (error) {
      console.error("Error creating journal entry:", error);
      res.status(400).json({ error: "Failed to create journal entry" });
    }
  });

  // Update a journal entry
  app.put("/api/habit/journal/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const entryId = req.params.id;
      const { title, content } = req.body;

      // Verify ownership
      const [existing] = await db.select().from(userJournalEntries)
        .where(and(eq(userJournalEntries.id, entryId), eq(userJournalEntries.userId, userId)));
      
      if (!existing) {
        return res.status(404).json({ error: "Journal entry not found" });
      }

      const [entry] = await db.update(userJournalEntries)
        .set({ title, content, updatedAt: new Date() })
        .where(eq(userJournalEntries.id, entryId))
        .returning();
      
      res.json(entry);
    } catch (error) {
      console.error("Error updating journal entry:", error);
      res.status(400).json({ error: "Failed to update journal entry" });
    }
  });

  // Delete a journal entry
  app.delete("/api/habit/journal/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const entryId = req.params.id;

      // Verify ownership
      const [existing] = await db.select().from(userJournalEntries)
        .where(and(eq(userJournalEntries.id, entryId), eq(userJournalEntries.userId, userId)));
      
      if (!existing) {
        return res.status(404).json({ error: "Journal entry not found" });
      }

      await db.delete(userJournalEntries).where(eq(userJournalEntries.id, entryId));
      res.json({ deleted: true });
    } catch (error) {
      console.error("Error deleting journal entry:", error);
      res.status(500).json({ error: "Failed to delete journal entry" });
    }
  });

  // ==================== USER STATS SYNC API ====================

  // Schema for validating stats sync payload
  // weeklyPoints can be negative when penalties outweigh task points
  const statsUpdateSchema = z.object({
    weeklyPoints: z.number().int().min(-100000).max(100000).optional(),
    dayStreak: z.number().int().min(0).max(10000).optional(),
    weekStreak: z.number().int().min(0).max(1000).optional(),
    longestDayStreak: z.number().int().min(0).max(10000).optional(),
    longestWeekStreak: z.number().int().min(0).max(1000).optional(),
    totalBadgesEarned: z.number().int().min(0).max(1000).optional(),
  });

  // Sync calculated user stats (upsert)
  app.put("/api/habit/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Validate request body
      const parseResult = statsUpdateSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: "Invalid stats data", details: parseResult.error.issues });
      }
      
      const { weeklyPoints, dayStreak, weekStreak, longestDayStreak, longestWeekStreak, totalBadgesEarned } = parseResult.data;

      // Check if stats exist for this user
      const [existing] = await db.select().from(userStats).where(eq(userStats.userId, userId));

      if (existing) {
        // Update existing stats
        const [stats] = await db.update(userStats)
          .set({
            weeklyPoints: weeklyPoints ?? existing.weeklyPoints,
            dayStreak: dayStreak ?? existing.dayStreak,
            weekStreak: weekStreak ?? existing.weekStreak,
            longestDayStreak: longestDayStreak ?? existing.longestDayStreak,
            longestWeekStreak: longestWeekStreak ?? existing.longestWeekStreak,
            totalBadgesEarned: totalBadgesEarned ?? existing.totalBadgesEarned,
            updatedAt: new Date()
          })
          .where(eq(userStats.userId, userId))
          .returning();
        res.json(stats);
      } else {
        // Create new stats record
        const [stats] = await db.insert(userStats)
          .values({
            userId,
            weeklyPoints: weeklyPoints ?? 0,
            dayStreak: dayStreak ?? 0,
            weekStreak: weekStreak ?? 0,
            longestDayStreak: longestDayStreak ?? 0,
            longestWeekStreak: longestWeekStreak ?? 0,
            totalBadgesEarned: totalBadgesEarned ?? 0,
          })
          .returning();
        res.json(stats);
      }
    } catch (error) {
      console.error("Error syncing user stats:", error);
      res.status(400).json({ error: "Failed to sync user stats" });
    }
  });

  // Get user stats
  app.get("/api/habit/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const [stats] = await db.select().from(userStats).where(eq(userStats.userId, userId));
      res.json(stats || null);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ error: "Failed to fetch user stats" });
    }
  });

  // ==================== APPOINTMENTS API ====================

  // Get appointments for a date range
  app.get("/api/appointments", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { startDate, endDate } = req.query;
      
      let query = db.select().from(appointments).where(eq(appointments.userId, userId));
      
      if (startDate && endDate) {
        query = db.select().from(appointments).where(
          and(
            eq(appointments.userId, userId),
            and(
              or(eq(appointments.date, startDate as string), and(eq(appointments.date, startDate as string), eq(appointments.date, endDate as string))),
              or(eq(appointments.date, endDate as string), and(eq(appointments.date, startDate as string), eq(appointments.date, endDate as string)))
            )
          )
        );
        // Simple approach: fetch all and filter in JS for date range
        const allAppointments = await db.select().from(appointments).where(eq(appointments.userId, userId));
        const filtered = allAppointments.filter(apt => apt.date >= (startDate as string) && apt.date <= (endDate as string));
        return res.json(filtered.sort((a, b) => {
          if (a.date !== b.date) return a.date.localeCompare(b.date);
          return a.startTime.localeCompare(b.startTime);
        }));
      }
      
      const result = await query.orderBy(desc(appointments.date));
      res.json(result);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      res.status(500).json({ error: "Failed to fetch appointments" });
    }
  });

  // Create a new appointment
  app.post("/api/appointments", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const parsed = insertAppointmentSchema.parse({
        ...req.body,
        userId,
      });
      const [appointment] = await db.insert(appointments).values(parsed).returning();
      
      // Award first_event one-time bonus
      try {
        const { awardFp } = await import("./fpService");
        await awardFp(userId, "first_event", { checkDuplicate: true });
      } catch (e) { console.error("FP award error:", e); }
      
      res.json(appointment);
    } catch (error) {
      console.error("Error creating appointment:", error);
      res.status(400).json({ error: "Failed to create appointment" });
    }
  });

  // Update an appointment
  app.put("/api/appointments/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const appointmentId = req.params.id;
      
      // Verify ownership
      const [existing] = await db.select().from(appointments).where(
        and(eq(appointments.id, appointmentId), eq(appointments.userId, userId))
      );
      if (!existing) {
        return res.status(404).json({ error: "Appointment not found" });
      }
      
      const { title, description, date, startTime, endTime, category, isAllDay } = req.body;
      const [updated] = await db.update(appointments)
        .set({ title, description, date, startTime, endTime, category, isAllDay, updatedAt: new Date() })
        .where(eq(appointments.id, appointmentId))
        .returning();
      res.json(updated);
    } catch (error) {
      console.error("Error updating appointment:", error);
      res.status(400).json({ error: "Failed to update appointment" });
    }
  });

  // Delete an appointment
  app.delete("/api/appointments/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const appointmentId = req.params.id;
      
      // Verify ownership
      const [existing] = await db.select().from(appointments).where(
        and(eq(appointments.id, appointmentId), eq(appointments.userId, userId))
      );
      if (!existing) {
        return res.status(404).json({ error: "Appointment not found" });
      }
      
      await db.delete(appointments).where(eq(appointments.id, appointmentId));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting appointment:", error);
      res.status(400).json({ error: "Failed to delete appointment" });
    }
  });

  // ==================== NOTIFICATIONS ROUTES ====================

  // Get notifications for the current user
  app.get("/api/notifications", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const notifications = await storage.getNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  // Get unread notification count
  app.get("/api/notifications/count", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const count = await storage.getUnreadNotificationCount(userId);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching notification count:", error);
      res.status(500).json({ error: "Failed to fetch notification count" });
    }
  });

  // Mark a notification as read
  app.patch("/api/notifications/:id/read", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const notificationId = req.params.id;
      const notification = await storage.markNotificationRead(notificationId, userId);
      if (!notification) {
        return res.status(404).json({ error: "Notification not found" });
      }
      res.json(notification);
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  // Mark all notifications as read
  app.patch("/api/notifications/read-all", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.markAllNotificationsRead(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ error: "Failed to mark all notifications as read" });
    }
  });

  // Delete a notification
  app.delete("/api/notifications/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const notificationId = req.params.id;
      const deleted = await storage.deleteNotification(notificationId, userId);
      if (!deleted) {
        return res.status(404).json({ error: "Notification not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ error: "Failed to delete notification" });
    }
  });

  // ==================== FRIEND CHALLENGES ROUTES ====================

  // Create a new friend challenge
  app.post("/api/friend-challenges", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { tasks, ...challengeData } = req.body;

      const parsed = insertFriendChallengeSchema.parse({
        ...challengeData,
        challengerId: userId,
        status: "pending",
      });

      if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
        return res.status(400).json({ error: "At least one task is required" });
      }

      const parsedTasks = tasks.map((task: any) => ({
        taskName: task.taskName,
        pointValue: task.pointValue || 0,
        isCustom: task.isCustom || false,
        sourceTaskId: task.sourceTaskId || null,
      }));

      const challenge = await storage.createFriendChallenge(parsed, parsedTasks);

      // Create notification for challengee
      await storage.createNotification({
        userId: parsed.challengeeId,
        type: "friend_challenge",
        title: "New Challenge",
        message: `You've been challenged to "${parsed.name}"!`,
        actorId: userId,
        resourceId: challenge.id,
        resourceType: "friend_challenge",
      });

      res.json(challenge);
    } catch (error) {
      console.error("Error creating friend challenge:", error);
      res.status(400).json({ error: "Failed to create friend challenge" });
    }
  });

  // List challenges for current user
  app.get("/api/friend-challenges", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const challenges = await storage.getFriendChallenges(userId);
      res.json(challenges);
    } catch (error) {
      console.error("Error fetching friend challenges:", error);
      res.status(500).json({ error: "Failed to fetch friend challenges" });
    }
  });

  // Get a specific challenge
  app.get("/api/friend-challenges/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const challengeId = req.params.id;
      const challenge = await storage.getFriendChallenge(challengeId);

      if (!challenge) {
        return res.status(404).json({ error: "Challenge not found" });
      }

      // Only allow challenger or challengee to view
      if (challenge.challengerId !== userId && challenge.challengeeId !== userId) {
        return res.status(403).json({ error: "Not authorized to view this challenge" });
      }

      // Get completions for this challenge
      const completions = await storage.getChallengeCompletions(challengeId);

      res.json({ ...challenge, completions });
    } catch (error) {
      console.error("Error fetching friend challenge:", error);
      res.status(500).json({ error: "Failed to fetch friend challenge" });
    }
  });

  // Accept a challenge
  app.post("/api/friend-challenges/:id/accept", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const challengeId = req.params.id;

      const challenge = await storage.acceptFriendChallenge(challengeId, userId);
      if (!challenge) {
        return res.status(400).json({ error: "Cannot accept this challenge" });
      }

      // Notify the challenger
      await storage.createNotification({
        userId: challenge.challengerId,
        type: "challenge_accepted",
        title: "Challenge Accepted",
        message: `Your challenge "${challenge.name}" has been accepted!`,
        actorId: userId,
        resourceId: challenge.id,
        resourceType: "friend_challenge",
      });

      // Award first_challenge_accepted one-time bonus
      const { awardFp } = await import("./fpService");
      await awardFp(userId, "first_challenge_accepted", { checkDuplicate: true });

      res.json(challenge);
    } catch (error) {
      console.error("Error accepting friend challenge:", error);
      res.status(500).json({ error: "Failed to accept friend challenge" });
    }
  });

  // Decline a challenge
  app.post("/api/friend-challenges/:id/decline", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const challengeId = req.params.id;

      const challenge = await storage.declineFriendChallenge(challengeId, userId);
      if (!challenge) {
        return res.status(400).json({ error: "Cannot decline this challenge" });
      }

      // Notify the challenger
      await storage.createNotification({
        userId: challenge.challengerId,
        type: "challenge_declined",
        title: "Challenge Declined",
        message: `Your challenge "${challenge.name}" was declined.`,
        actorId: userId,
        resourceId: challenge.id,
        resourceType: "friend_challenge",
      });

      res.json(challenge);
    } catch (error) {
      console.error("Error declining friend challenge:", error);
      res.status(500).json({ error: "Failed to decline friend challenge" });
    }
  });

  // Complete a task in a challenge
  app.post("/api/friend-challenges/:id/complete-task", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const challengeId = req.params.id;
      const { taskId } = req.body;

      if (!taskId) {
        return res.status(400).json({ error: "taskId is required" });
      }

      const completion = await storage.completeChallengeTask(challengeId, taskId, userId);
      if (!completion) {
        return res.status(400).json({ error: "Cannot complete this task" });
      }

      // Check if challenge was just completed and award FP to winner
      try {
        const challenge = await storage.getFriendChallenge(challengeId);
        if (challenge && challenge.status === 'completed' && challenge.winnerId) {
          const { awardFp } = await import("./fpService");
          await awardFp(challenge.winnerId, "win_1v1_challenge", { checkDuplicate: true });
        }
      } catch (fpError) {
        console.error("Error awarding FP for 1v1 challenge win:", fpError);
      }

      res.json(completion);
    } catch (error) {
      console.error("Error completing challenge task:", error);
      res.status(500).json({ error: "Failed to complete challenge task" });
    }
  });

  // ==================== FP (FOCUS POINTS) ROUTES ====================

  // Get current user's FP total
  app.get("/api/fp", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { getUserFpTotal } = await import("./fpService");
      const fpTotal = await getUserFpTotal(userId);
      res.json({ fpTotal });
    } catch (error) {
      console.error("Error fetching FP total:", error);
      res.status(500).json({ error: "Failed to fetch FP total" });
    }
  });

  // Get user's FP activity log
  app.get("/api/fp/activity", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { limit = "50", offset = "0" } = req.query;
      const { getUserFpActivity } = await import("./fpService");
      const activities = await getUserFpActivity(
        userId,
        parseInt(limit as string),
        parseInt(offset as string)
      );
      res.json(activities);
    } catch (error) {
      console.error("Error fetching FP activity:", error);
      res.status(500).json({ error: "Failed to fetch FP activity" });
    }
  });

  // Trigger a one-time FP award (for features stored in local storage)
  app.post("/api/fp/award-onetime", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { eventType } = req.body;
      
      // Only allow specific one-time event types that are stored client-side
      const allowedEvents = [
        "first_milestone",
        "first_due_date", 
        "first_weekly_todo",
        "first_badge",
      ];
      
      if (!allowedEvents.includes(eventType)) {
        return res.status(400).json({ error: "Invalid event type" });
      }
      
      const { awardFp } = await import("./fpService");
      const result = await awardFp(userId, eventType, { checkDuplicate: true });
      
      res.json(result);
    } catch (error) {
      console.error("Error awarding one-time FP:", error);
      res.status(500).json({ error: "Failed to award FP" });
    }
  });

  // Get FP leaderboard (friends or all users)
  app.get("/api/fp/leaderboard", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { type = "all", limit = "20", period = "allTime" } = req.query;
      const { getFpLeaderboard } = await import("./fpService");
      const leaderboard = await getFpLeaderboard(
        type as "all" | "friends",
        userId,
        parseInt(limit as string),
        period as "weekly" | "monthly" | "allTime"
      );
      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching FP leaderboard:", error);
      res.status(500).json({ error: "Failed to fetch FP leaderboard" });
    }
  });

  // Check and award weekly FP bonuses (Task Master, Over Achiever)
  // Server verifies eligibility from database to prevent forged requests
  app.post("/api/fp/check-weekly-bonuses", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const { awardFp } = await import("./fpService");
      const results: any[] = [];
      
      // Get task count from database (check active season first, then regular tasks)
      const activeSeasonResult = await db.select()
        .from(seasons)
        .where(and(eq(seasons.userId, userId), eq(seasons.isActive, true), eq(seasons.isArchived, false)))
        .limit(1);
      
      let serverTaskCount = 0;
      if (activeSeasonResult.length > 0) {
        // Count tasks from the active season's seasonTasks table
        const seasonId = activeSeasonResult[0].id;
        const seasonTaskCountResult = await db.select({ count: sql<number>`count(*)` })
          .from(seasonTasks)
          .where(eq(seasonTasks.seasonId, seasonId));
        serverTaskCount = Number(seasonTaskCountResult[0]?.count || 0);
      } else {
        // Fall back to user's non-season tasks
        const taskCountResult = await db.select({ count: sql<number>`count(*)` })
          .from(userTasks)
          .where(eq(userTasks.userId, userId));
        serverTaskCount = Number(taskCountResult[0]?.count || 0);
      }
      
      // Get weekly goal from settings
      const settingsResult = await db.select({ weeklyGoal: userHabitSettings.weeklyGoal })
        .from(userHabitSettings)
        .where(eq(userHabitSettings.userId, userId))
        .limit(1);
      const serverWeeklyGoal = settingsResult[0]?.weeklyGoal || 0;
      
      // Calculate current week's total from daily logs
      const today = new Date();
      const dayOfWeek = today.getDay();
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() + diff);
      weekStart.setHours(0, 0, 0, 0);
      const weekStartStr = weekStart.toISOString().split('T')[0];
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      const weekEndStr = weekEnd.toISOString().split('T')[0];
      
      const logsResult = await db.select({
        taskPoints: userDailyLogs.taskPoints,
        todoPoints: userDailyLogs.todoPoints,
        penaltyPoints: userDailyLogs.penaltyPoints
      })
        .from(userDailyLogs)
        .where(and(
          eq(userDailyLogs.userId, userId),
          gte(userDailyLogs.date, weekStartStr),
          sql`${userDailyLogs.date} < ${weekEndStr}`
        ));
      
      const serverWeeklyTotal = logsResult.reduce((sum, log) => {
        return sum + (log.taskPoints || 0) + (log.todoPoints || 0) + (log.penaltyPoints || 0);
      }, 0);
      
      // Task Master: Award +10 FP when user has 10+ tasks (once per week)
      if (serverTaskCount >= 10) {
        const taskMasterResult = await awardFp(userId, "task_master", { checkDuplicate: true });
        if (taskMasterResult.success) {
          results.push(taskMasterResult);
        }
      }
      
      // Over Achiever: Award +10 FP when week total >= goal * 1.15 (once per week)
      if (serverWeeklyGoal > 0 && serverWeeklyTotal >= serverWeeklyGoal * 1.15) {
        const overAchieverResult = await awardFp(userId, "over_achiever", { checkDuplicate: true });
        if (overAchieverResult.success) {
          results.push(overAchieverResult);
        }
      }
      
      res.json({ success: true, awards: results });
    } catch (error) {
      console.error("Error checking weekly FP bonuses:", error);
      res.status(500).json({ error: "Failed to check weekly bonuses" });
    }
  });

  // ==================== GITHUB ROUTES ====================

  // Get GitHub authenticated user
  app.get("/api/github/user", isAuthenticated, async (req: any, res) => {
    try {
      const user = await getGitHubUser();
      res.json(user);
    } catch (error: any) {
      console.error("Error fetching GitHub user:", error);
      res.status(500).json({ error: error.message || "Failed to fetch GitHub user" });
    }
  });

  // List user's GitHub repositories
  app.get("/api/github/repos", isAuthenticated, async (req: any, res) => {
    try {
      const { page = "1", perPage = "30" } = req.query;
      const repos = await listRepositories(parseInt(page as string), parseInt(perPage as string));
      res.json(repos);
    } catch (error: any) {
      console.error("Error listing GitHub repos:", error);
      res.status(500).json({ error: error.message || "Failed to list GitHub repositories" });
    }
  });

  // Create a new GitHub repository
  app.post("/api/github/repos", isAuthenticated, async (req: any, res) => {
    try {
      const { name, description, isPrivate = true } = req.body;
      if (!name) {
        return res.status(400).json({ error: "Repository name is required" });
      }
      const repo = await createRepository(name, description, isPrivate);
      res.json(repo);
    } catch (error: any) {
      console.error("Error creating GitHub repo:", error);
      res.status(500).json({ error: error.message || "Failed to create GitHub repository" });
    }
  });

  // Get a specific repository
  app.get("/api/github/repos/:owner/:repo", isAuthenticated, async (req: any, res) => {
    try {
      const { owner, repo } = req.params;
      const repoData = await getRepository(owner, repo);
      res.json(repoData);
    } catch (error: any) {
      console.error("Error fetching GitHub repo:", error);
      res.status(500).json({ error: error.message || "Failed to fetch GitHub repository" });
    }
  });

  // List commits for a repository
  app.get("/api/github/repos/:owner/:repo/commits", isAuthenticated, async (req: any, res) => {
    try {
      const { owner, repo } = req.params;
      const { page = "1", perPage = "30" } = req.query;
      const commits = await listCommits(owner, repo, parseInt(page as string), parseInt(perPage as string));
      res.json(commits);
    } catch (error: any) {
      console.error("Error listing GitHub commits:", error);
      res.status(500).json({ error: error.message || "Failed to list GitHub commits" });
    }
  });

  // ==================== MILESTONES API ====================

  // Get all milestones for user
  app.get("/api/milestones", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const milestones = await storage.getMilestones(userId);
      res.json(milestones);
    } catch (error: any) {
      console.error("Error fetching milestones:", error);
      res.status(500).json({ error: error.message || "Failed to fetch milestones" });
    }
  });

  // Create a new milestone
  app.post("/api/milestones", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validated = insertUserMilestoneSchema.parse({ ...req.body, userId });
      const milestone = await storage.createMilestone(validated);
      res.json(milestone);
    } catch (error: any) {
      console.error("Error creating milestone:", error);
      res.status(500).json({ error: error.message || "Failed to create milestone" });
    }
  });

  // Update a milestone
  app.put("/api/milestones/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const milestone = await storage.updateMilestone(id, userId, req.body);
      if (!milestone) {
        return res.status(404).json({ error: "Milestone not found" });
      }
      res.json(milestone);
    } catch (error: any) {
      console.error("Error updating milestone:", error);
      res.status(500).json({ error: error.message || "Failed to update milestone" });
    }
  });

  // Delete a milestone
  app.delete("/api/milestones/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const deleted = await storage.deleteMilestone(id, userId);
      if (!deleted) {
        return res.status(404).json({ error: "Milestone not found" });
      }
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting milestone:", error);
      res.status(500).json({ error: error.message || "Failed to delete milestone" });
    }
  });

  // ==================== DUE DATES API ====================

  // Get all due dates for user
  app.get("/api/due-dates", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const dueDates = await storage.getDueDates(userId);
      res.json(dueDates);
    } catch (error: any) {
      console.error("Error fetching due dates:", error);
      res.status(500).json({ error: error.message || "Failed to fetch due dates" });
    }
  });

  // Create a new due date
  app.post("/api/due-dates", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validated = insertUserDueDateSchema.parse({ ...req.body, userId });
      const dueDate = await storage.createDueDate(validated);
      res.json(dueDate);
    } catch (error: any) {
      console.error("Error creating due date:", error);
      res.status(500).json({ error: error.message || "Failed to create due date" });
    }
  });

  // Update a due date
  app.put("/api/due-dates/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const dueDate = await storage.updateDueDate(id, userId, req.body);
      if (!dueDate) {
        return res.status(404).json({ error: "Due date not found" });
      }
      res.json(dueDate);
    } catch (error: any) {
      console.error("Error updating due date:", error);
      res.status(500).json({ error: error.message || "Failed to update due date" });
    }
  });

  // Delete a due date
  app.delete("/api/due-dates/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const deleted = await storage.deleteDueDate(id, userId);
      if (!deleted) {
        return res.status(404).json({ error: "Due date not found" });
      }
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting due date:", error);
      res.status(500).json({ error: error.message || "Failed to delete due date" });
    }
  });

  return httpServer;
}
