import {
  users,
  notifications,
  friendChallenges,
  friendChallengeTasks,
  friendChallengeCompletions,
  userMilestones,
  userDueDates,
  aiConversations,
  type User,
  type UpsertUser,
  type Notification,
  type InsertNotification,
  type NotificationWithActor,
  type FriendChallenge,
  type InsertFriendChallenge,
  type FriendChallengeTask,
  type InsertFriendChallengeTask,
  type FriendChallengeCompletion,
  type InsertFriendChallengeCompletion,
  type FriendChallengeWithDetails,
  type UserMilestone,
  type InsertUserMilestone,
  type UserDueDate,
  type InsertUserDueDate,
  type AIConversation,
  type InsertAIConversation,
  type AIMessage,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, or } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  createNotification(data: InsertNotification): Promise<Notification>;
  getNotifications(userId: string): Promise<NotificationWithActor[]>;
  getUnreadNotificationCount(userId: string): Promise<number>;
  markNotificationRead(id: string, userId: string): Promise<Notification | undefined>;
  markAllNotificationsRead(userId: string): Promise<void>;
  deleteNotification(id: string, userId: string): Promise<boolean>;

  // Friend challenges
  createFriendChallenge(data: InsertFriendChallenge, tasks: Omit<InsertFriendChallengeTask, 'challengeId'>[]): Promise<FriendChallenge>;
  getFriendChallenges(userId: string): Promise<FriendChallengeWithDetails[]>;
  getFriendChallenge(id: string): Promise<FriendChallengeWithDetails | undefined>;
  acceptFriendChallenge(id: string, userId: string): Promise<FriendChallenge | undefined>;
  declineFriendChallenge(id: string, userId: string): Promise<FriendChallenge | undefined>;
  completeChallengeTask(challengeId: string, taskId: string, userId: string): Promise<FriendChallengeCompletion | undefined>;
  getChallengeCompletions(challengeId: string): Promise<FriendChallengeCompletion[]>;

  // Milestones
  getMilestones(userId: string): Promise<UserMilestone[]>;
  createMilestone(data: InsertUserMilestone): Promise<UserMilestone>;
  updateMilestone(id: string, userId: string, data: Partial<InsertUserMilestone>): Promise<UserMilestone | undefined>;
  deleteMilestone(id: string, userId: string): Promise<boolean>;

  // Due Dates
  getDueDates(userId: string): Promise<UserDueDate[]>;
  createDueDate(data: InsertUserDueDate): Promise<UserDueDate>;
  updateDueDate(id: string, userId: string, data: Partial<InsertUserDueDate>): Promise<UserDueDate | undefined>;
  deleteDueDate(id: string, userId: string): Promise<boolean>;

  // AI Conversations
  getAIConversations(userId: string): Promise<AIConversation[]>;
  getAIConversation(id: string, userId: string): Promise<AIConversation | undefined>;
  createAIConversation(data: InsertAIConversation): Promise<AIConversation>;
  updateAIConversation(id: string, userId: string, data: { title?: string; messages?: AIMessage[] }): Promise<AIConversation | undefined>;
  deleteAIConversation(id: string, userId: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // Filter out undefined values to preserve existing data in the database
    // This prevents overwriting username/displayName when not provided (e.g., during Firebase auth)
    const updateData: Record<string, any> = { updatedAt: new Date() };
    for (const [key, value] of Object.entries(userData)) {
      if (value !== undefined && key !== 'id') {
        updateData[key] = value;
      }
    }
    
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: updateData,
      })
      .returning();
    return user;
  }

  async createNotification(data: InsertNotification): Promise<Notification> {
    const [notification] = await db.insert(notifications).values(data).returning();
    return notification;
  }

  async getNotifications(userId: string): Promise<NotificationWithActor[]> {
    const results = await db
      .select({
        id: notifications.id,
        userId: notifications.userId,
        type: notifications.type,
        title: notifications.title,
        message: notifications.message,
        read: notifications.read,
        actorId: notifications.actorId,
        resourceId: notifications.resourceId,
        resourceType: notifications.resourceType,
        createdAt: notifications.createdAt,
        actorFirstName: users.firstName,
        actorLastName: users.lastName,
        actorDisplayName: users.displayName,
        actorProfileImageUrl: users.profileImageUrl,
      })
      .from(notifications)
      .leftJoin(users, eq(notifications.actorId, users.id))
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(50);

    return results.map((row) => ({
      id: row.id,
      userId: row.userId,
      type: row.type as any,
      title: row.title,
      message: row.message,
      read: row.read,
      actorId: row.actorId,
      resourceId: row.resourceId,
      resourceType: row.resourceType,
      createdAt: row.createdAt,
      actor: row.actorId
        ? {
            id: row.actorId,
            firstName: row.actorFirstName,
            lastName: row.actorLastName,
            displayName: row.actorDisplayName,
            profileImageUrl: row.actorProfileImageUrl,
          }
        : null,
    }));
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const results = await db
      .select({ id: notifications.id })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
    return results.length;
  }

  async markNotificationRead(id: string, userId: string): Promise<Notification | undefined> {
    const [updated] = await db
      .update(notifications)
      .set({ read: true })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
      .returning();
    return updated;
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.userId, userId));
  }

  async deleteNotification(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(notifications)
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
      .returning();
    return result.length > 0;
  }

  // Friend challenge methods
  async createFriendChallenge(
    data: InsertFriendChallenge,
    tasks: Omit<InsertFriendChallengeTask, 'challengeId'>[]
  ): Promise<FriendChallenge> {
    const [challenge] = await db.insert(friendChallenges).values(data).returning();
    
    if (tasks.length > 0) {
      await db.insert(friendChallengeTasks).values(
        tasks.map((task) => ({
          ...task,
          challengeId: challenge.id,
        }))
      );
    }
    
    return challenge;
  }

  async getFriendChallenges(userId: string): Promise<FriendChallengeWithDetails[]> {
    const challenges = await db
      .select()
      .from(friendChallenges)
      .where(
        or(
          eq(friendChallenges.challengerId, userId),
          eq(friendChallenges.challengeeId, userId)
        )
      )
      .orderBy(desc(friendChallenges.createdAt));

    const results: FriendChallengeWithDetails[] = [];

    for (const challenge of challenges) {
      const [challenger] = await db.select().from(users).where(eq(users.id, challenge.challengerId));
      const [challengee] = await db.select().from(users).where(eq(users.id, challenge.challengeeId));
      const tasks = await db
        .select()
        .from(friendChallengeTasks)
        .where(eq(friendChallengeTasks.challengeId, challenge.id));

      results.push({
        ...challenge,
        challenger: {
          id: challenger.id,
          firstName: challenger.firstName,
          lastName: challenger.lastName,
          displayName: challenger.displayName,
          profileImageUrl: challenger.profileImageUrl,
        },
        challengee: {
          id: challengee.id,
          firstName: challengee.firstName,
          lastName: challengee.lastName,
          displayName: challengee.displayName,
          profileImageUrl: challengee.profileImageUrl,
        },
        tasks: tasks.map((t) => ({
          id: t.id,
          taskName: t.taskName,
          pointValue: t.pointValue,
          isCustom: t.isCustom,
        })),
      });
    }

    return results;
  }

  async getFriendChallenge(id: string): Promise<FriendChallengeWithDetails | undefined> {
    const [challenge] = await db
      .select()
      .from(friendChallenges)
      .where(eq(friendChallenges.id, id));

    if (!challenge) return undefined;

    const [challenger] = await db.select().from(users).where(eq(users.id, challenge.challengerId));
    const [challengee] = await db.select().from(users).where(eq(users.id, challenge.challengeeId));
    const tasks = await db
      .select()
      .from(friendChallengeTasks)
      .where(eq(friendChallengeTasks.challengeId, challenge.id));

    return {
      ...challenge,
      challenger: {
        id: challenger.id,
        firstName: challenger.firstName,
        lastName: challenger.lastName,
        displayName: challenger.displayName,
        profileImageUrl: challenger.profileImageUrl,
      },
      challengee: {
        id: challengee.id,
        firstName: challengee.firstName,
        lastName: challengee.lastName,
        displayName: challengee.displayName,
        profileImageUrl: challengee.profileImageUrl,
      },
      tasks: tasks.map((t) => ({
        id: t.id,
        taskName: t.taskName,
        pointValue: t.pointValue,
        isCustom: t.isCustom,
      })),
    };
  }

  async acceptFriendChallenge(id: string, userId: string): Promise<FriendChallenge | undefined> {
    const [challenge] = await db
      .select()
      .from(friendChallenges)
      .where(eq(friendChallenges.id, id));

    if (!challenge || challenge.challengeeId !== userId || challenge.status !== "pending") {
      return undefined;
    }

    const today = new Date().toISOString().split('T')[0];
    const [updated] = await db
      .update(friendChallenges)
      .set({
        status: "active",
        startDate: today,
        updatedAt: new Date(),
      })
      .where(eq(friendChallenges.id, id))
      .returning();

    return updated;
  }

  async declineFriendChallenge(id: string, userId: string): Promise<FriendChallenge | undefined> {
    const [challenge] = await db
      .select()
      .from(friendChallenges)
      .where(eq(friendChallenges.id, id));

    if (!challenge || challenge.challengeeId !== userId || challenge.status !== "pending") {
      return undefined;
    }

    const [updated] = await db
      .update(friendChallenges)
      .set({
        status: "declined",
        updatedAt: new Date(),
      })
      .where(eq(friendChallenges.id, id))
      .returning();

    return updated;
  }

  async completeChallengeTask(
    challengeId: string,
    taskId: string,
    userId: string
  ): Promise<FriendChallengeCompletion | undefined> {
    const [challenge] = await db
      .select()
      .from(friendChallenges)
      .where(eq(friendChallenges.id, challengeId));

    if (!challenge || challenge.status !== "active") {
      return undefined;
    }

    if (challenge.challengerId !== userId && challenge.challengeeId !== userId) {
      return undefined;
    }

    const [task] = await db
      .select()
      .from(friendChallengeTasks)
      .where(and(eq(friendChallengeTasks.id, taskId), eq(friendChallengeTasks.challengeId, challengeId)));

    if (!task) {
      return undefined;
    }

    // Check for existing completion today (idempotency - one completion per task per day)
    const today = new Date().toISOString().split('T')[0];
    const existingCompletions = await db
      .select()
      .from(friendChallengeCompletions)
      .where(
        and(
          eq(friendChallengeCompletions.challengeId, challengeId),
          eq(friendChallengeCompletions.taskId, taskId),
          eq(friendChallengeCompletions.userId, userId)
        )
      );
    
    // Check if user already completed this task today
    const alreadyCompletedToday = existingCompletions.some(c => 
      c.completedAt && c.completedAt.toISOString().split('T')[0] === today
    );
    if (alreadyCompletedToday) {
      return undefined; // Already completed today
    }

    const [completion] = await db
      .insert(friendChallengeCompletions)
      .values({
        challengeId,
        taskId,
        userId,
      })
      .returning();

    const pointsToAdd = task.pointValue;
    const isChallenger = challenge.challengerId === userId;

    const newChallengerPoints = isChallenger
      ? (challenge.challengerPoints || 0) + pointsToAdd
      : (challenge.challengerPoints || 0);
    const newChallengeePoints = !isChallenger
      ? (challenge.challengeePoints || 0) + pointsToAdd
      : (challenge.challengeePoints || 0);

    // Check if target points reached (for targetPoints type challenges)
    let newStatus = challenge.status;
    let winnerId: string | null = null;
    if (challenge.challengeType === 'targetPoints' && challenge.targetPoints) {
      if (newChallengerPoints >= challenge.targetPoints) {
        newStatus = 'completed';
        winnerId = challenge.challengerId;
      } else if (newChallengeePoints >= challenge.targetPoints) {
        newStatus = 'completed';
        winnerId = challenge.challengeeId;
      }
    }

    await db
      .update(friendChallenges)
      .set({
        challengerPoints: newChallengerPoints,
        challengeePoints: newChallengeePoints,
        status: newStatus,
        winnerId: winnerId,
        updatedAt: new Date(),
      })
      .where(eq(friendChallenges.id, challengeId));

    return completion;
  }

  async getChallengeCompletions(challengeId: string): Promise<FriendChallengeCompletion[]> {
    return db
      .select()
      .from(friendChallengeCompletions)
      .where(eq(friendChallengeCompletions.challengeId, challengeId))
      .orderBy(desc(friendChallengeCompletions.completedAt));
  }

  // ==================== MILESTONES ====================

  async getMilestones(userId: string): Promise<UserMilestone[]> {
    return db
      .select()
      .from(userMilestones)
      .where(eq(userMilestones.userId, userId))
      .orderBy(desc(userMilestones.createdAt));
  }

  async createMilestone(data: InsertUserMilestone): Promise<UserMilestone> {
    const [milestone] = await db.insert(userMilestones).values(data).returning();
    return milestone;
  }

  async updateMilestone(id: string, userId: string, data: Partial<InsertUserMilestone>): Promise<UserMilestone | undefined> {
    const [milestone] = await db
      .update(userMilestones)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(userMilestones.id, id), eq(userMilestones.userId, userId)))
      .returning();
    return milestone;
  }

  async deleteMilestone(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(userMilestones)
      .where(and(eq(userMilestones.id, id), eq(userMilestones.userId, userId)))
      .returning();
    return result.length > 0;
  }

  // ==================== DUE DATES ====================

  async getDueDates(userId: string): Promise<UserDueDate[]> {
    return db
      .select()
      .from(userDueDates)
      .where(eq(userDueDates.userId, userId))
      .orderBy(desc(userDueDates.createdAt));
  }

  async createDueDate(data: InsertUserDueDate): Promise<UserDueDate> {
    const [dueDate] = await db.insert(userDueDates).values(data).returning();
    return dueDate;
  }

  async updateDueDate(id: string, userId: string, data: Partial<InsertUserDueDate>): Promise<UserDueDate | undefined> {
    const [dueDate] = await db
      .update(userDueDates)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(userDueDates.id, id), eq(userDueDates.userId, userId)))
      .returning();
    return dueDate;
  }

  async deleteDueDate(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(userDueDates)
      .where(and(eq(userDueDates.id, id), eq(userDueDates.userId, userId)))
      .returning();
    return result.length > 0;
  }

  // ==================== AI CONVERSATIONS ====================

  async getAIConversations(userId: string): Promise<AIConversation[]> {
    return db
      .select()
      .from(aiConversations)
      .where(eq(aiConversations.userId, userId))
      .orderBy(desc(aiConversations.updatedAt));
  }

  async getAIConversation(id: string, userId: string): Promise<AIConversation | undefined> {
    const [conversation] = await db
      .select()
      .from(aiConversations)
      .where(and(eq(aiConversations.id, id), eq(aiConversations.userId, userId)));
    return conversation;
  }

  async createAIConversation(data: InsertAIConversation): Promise<AIConversation> {
    const [conversation] = await db.insert(aiConversations).values(data).returning();
    return conversation;
  }

  async updateAIConversation(id: string, userId: string, data: { title?: string; messages?: AIMessage[] }): Promise<AIConversation | undefined> {
    const updateData: any = { updatedAt: new Date() };
    if (data.title !== undefined) updateData.title = data.title;
    if (data.messages !== undefined) updateData.messages = data.messages;
    
    const [conversation] = await db
      .update(aiConversations)
      .set(updateData)
      .where(and(eq(aiConversations.id, id), eq(aiConversations.userId, userId)))
      .returning();
    return conversation;
  }

  async deleteAIConversation(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(aiConversations)
      .where(and(eq(aiConversations.id, id), eq(aiConversations.userId, userId)))
      .returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
