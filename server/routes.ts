import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { isAuthenticated, upsertFirebaseUser, verifyFirebaseToken } from "./firebaseAdmin";
import OpenAI from "openai";
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
  gptAccessTokens,
  gptAuthCodes,
  insertNutritionLogSchema,
  insertBodyCompositionSchema,
  insertStrengthWorkoutSchema,
  insertSkillWorkoutSchema,
  insertBasketballRunSchema,
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
  directMessages,
  insertDirectMessageSchema,
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
  userJournalEntries,
  insertUserJournalEntrySchema,
} from "@shared/schema";
import { and, or, desc, inArray } from "drizzle-orm";
import { lt } from "drizzle-orm";

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

  // Update user profile (username, displayName, profileImageUrl)
  app.put('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { username, displayName, profileImageUrl } = req.body;

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

      // Return public profile info only
      res.json({
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        createdAt: user.createdAt,
      });
    } catch (error) {
      console.error("Error fetching user summary:", error);
      res.status(500).json({ message: "Failed to fetch user summary" });
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

  // Serve uploaded objects
  app.get("/objects/:objectPath(*)", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { ObjectStorageService, ObjectNotFoundError } = await import("./objectStorage");
      const { ObjectPermission } = await import("./objectAcl");
      const objectStorageService = new ObjectStorageService();
      
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId: userId,
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

  // ==================== AI ROUTES (Protected) ====================

  app.post("/api/ai/insights", isAuthenticated, async (req, res) => {
    try {
      const { message, history } = req.body;

      if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "Message is required" });
      }

      const systemPrompt = `You are a helpful and encouraging habit tracking assistant for an app called "FrisFocus". 
Your role is to:
- Provide insights about the user's habits and progress
- Offer encouragement and motivation
- Suggest improvements based on habit science
- Answer questions about productivity, habit formation, and consistency
- Be concise but warm and supportive

Keep responses brief (2-4 sentences usually) unless the user asks for detailed analysis.`;

      const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
        { role: "system", content: systemPrompt },
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
        max_tokens: 500,
      });

      const content = response.choices[0]?.message?.content || "I'm here to help! Could you tell me more about what you'd like to know?";

      res.json({ content });
    } catch (error) {
      console.error("AI insights error:", error);
      res.status(500).json({ error: "Failed to get AI response" });
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

  // Send friend request (by email or username)
  app.post("/api/friends/request", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { email, emailOrUsername } = req.body;

      // Support both old 'email' field and new 'emailOrUsername' field
      const searchValue = emailOrUsername || email;

      if (!searchValue) {
        return res.status(400).json({ error: "Email or username is required" });
      }

      // Determine if input looks like an email
      const isEmail = searchValue.includes("@");
      
      // Find user by email or username
      let targetUser;
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

      res.json(friendship);
    } catch (error) {
      console.error("Error sending friend request:", error);
      res.status(500).json({ error: "Failed to send friend request" });
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

  // Save season tasks (replaces all tasks for a season)
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

      // Delete existing tasks and insert new ones
      await db.delete(seasonTasks).where(eq(seasonTasks.seasonId, id));
      
      if (tasks && tasks.length > 0) {
        const taskValues = tasks.map((t: any) => ({
          seasonId: id,
          name: t.name,
          value: t.value,
          category: t.category || "General",
          priority: t.priority || "shouldDo",
          boosterRule: t.boosterRule || null,
          penaltyRule: t.penaltyRule || null,
        }));
        await db.insert(seasonTasks).values(taskValues);
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

  // Save season penalties (replaces all penalties for a season)
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

      // Delete existing penalties and insert new ones
      await db.delete(seasonPenalties).where(eq(seasonPenalties.seasonId, id));
      
      if (penalties && penalties.length > 0) {
        const penaltyValues = penalties.map((p: any) => ({
          seasonId: id,
          name: p.name,
          value: p.value,
          negativeBoostEnabled: p.negativeBoostEnabled || false,
          timesThreshold: p.timesThreshold || null,
          period: p.period || null,
          boostPenaltyPoints: p.boostPenaltyPoints || null,
        }));
        await db.insert(seasonPenalties).values(penaltyValues);
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

  // Get all community posts (public + friends' posts)
  app.get("/api/community/posts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

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

  // Create a new community post
  app.post("/api/community/posts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const parsed = insertCommunityPostSchema.parse({ ...req.body, authorId: userId });
      const [post] = await db.insert(communityPosts).values(parsed).returning();

      // Get author info for response
      const [author] = await db.select().from(users).where(eq(users.id, userId));

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

  // Get all circles the user is a member of (or public circles)
  app.get("/api/circles", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      // Get circles user is a member of
      const memberships = await db.select().from(circleMembers).where(eq(circleMembers.userId, userId));
      const memberCircleIds = memberships.map(m => m.circleId);

      // Get public circles and circles user is in
      const circleList = await db.select().from(circles).where(
        or(
          eq(circles.isPrivate, false),
          memberCircleIds.length > 0 ? inArray(circles.id, memberCircleIds) : undefined
        )
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
      const [message] = await db.insert(circleMessages).values(parsed).returning();

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
          
          // Count unread messages from this partner
          const unreadCount = messages.filter(
            m => m.senderId === partnerId && m.recipientId === userId && !m.read
          ).length;

          conversations.push({
            partnerId,
            partner: partner ? {
              id: partner.id,
              firstName: partner.firstName,
              lastName: partner.lastName,
              displayName: partner.displayName,
              profileImageUrl: partner.profileImageUrl,
            } : null,
            lastMessage: msg,
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

      res.json(messages);
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

      const parsed = insertDirectMessageSchema.parse({
        ...req.body,
        senderId: currentUserId,
        recipientId,
      });
      const [message] = await db.insert(directMessages).values(parsed).returning();

      res.json(message);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(400).json({ error: "Failed to send message" });
    }
  });

  // ==================== USER HABIT SYNC API ROUTES ====================

  // Get all user tasks
  app.get("/api/habit/tasks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tasks = await db.select().from(userTasks).where(eq(userTasks.userId, userId));
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching user tasks:", error);
      res.status(500).json({ error: "Failed to fetch tasks" });
    }
  });

  // Create a new user task
  app.post("/api/habit/tasks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const parsed = insertUserTaskSchema.parse({ ...req.body, userId });
      const [task] = await db.insert(userTasks).values(parsed).returning();
      res.json(task);
    } catch (error) {
      console.error("Error creating user task:", error);
      res.status(400).json({ error: "Failed to create task" });
    }
  });

  // Update a user task
  app.put("/api/habit/tasks/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const taskId = req.params.id;
      const { name, value, category, priority, boostEnabled, boostThreshold, boostPeriod, boostPoints } = req.body;

      const [task] = await db.update(userTasks)
        .set({ 
          name, 
          value, 
          category, 
          priority, 
          boostEnabled, 
          boostThreshold, 
          boostPeriod, 
          boostPoints,
          updatedAt: new Date() 
        })
        .where(and(eq(userTasks.id, taskId), eq(userTasks.userId, userId)))
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

  // Delete a user task
  app.delete("/api/habit/tasks/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const taskId = req.params.id;

      const [deleted] = await db.delete(userTasks)
        .where(and(eq(userTasks.id, taskId), eq(userTasks.userId, userId)))
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
      const { completedTaskIds, notes, todoPoints } = req.body;

      // Check if log exists for this date
      const [existing] = await db.select().from(userDailyLogs)
        .where(and(eq(userDailyLogs.userId, userId), eq(userDailyLogs.date, date)));

      if (existing) {
        // Update existing log
        const [log] = await db.update(userDailyLogs)
          .set({
            completedTaskIds: completedTaskIds || [],
            todoPoints: todoPoints || 0,
            notes,
            updatedAt: new Date()
          })
          .where(and(eq(userDailyLogs.userId, userId), eq(userDailyLogs.date, date)))
          .returning();
        res.json(log);
      } else {
        // Create new log
        const parsed = insertUserDailyLogSchema.parse({
          userId,
          date,
          completedTaskIds: completedTaskIds || [],
          todoPoints: todoPoints || 0,
          notes
        });
        const [log] = await db.insert(userDailyLogs).values(parsed).returning();
        res.json(log);
      }
    } catch (error) {
      console.error("Error updating daily log:", error);
      res.status(400).json({ error: "Failed to update daily log" });
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

  return httpServer;
}
