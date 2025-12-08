import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { isAuthenticated, upsertFirebaseUser, verifyFirebaseToken } from "./firebaseAdmin";
import OpenAI from "openai";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";
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
} from "@shared/schema";
import { and, or } from "drizzle-orm";
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

  // Update user profile (username)
  app.put('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { username } = req.body;

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

      // Update user
      const [updatedUser] = await db.update(users)
        .set({ 
          username: username ? username.toLowerCase() : null,
          updatedAt: new Date()
        })
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

      // Get pending requests where user is the addressee
      const pendingRequests = await db.select().from(friendships).where(
        and(
          eq(friendships.status, "pending"),
          eq(friendships.addresseeId, userId)
        )
      );

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

  return httpServer;
}
