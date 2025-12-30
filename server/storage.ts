import {
  users,
  notifications,
  friendChallenges,
  friendChallengeTasks,
  friendChallengeCompletions,
  userMilestones,
  userDueDates,
  aiConversations,
  workoutRoutines,
  journalFolders,
  journalTemplates,
  journalEntries,
  userJournalSettings,
  seasons,
  habitTrains,
  habitTrainSteps,
  userTasks,
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
  type WorkoutRoutine,
  type InsertWorkoutRoutine,
  type JournalFolder,
  type InsertJournalFolder,
  type JournalTemplate,
  type InsertJournalTemplate,
  type JournalEntryNew,
  type InsertJournalEntryNew,
  type UserJournalSettings,
  type InsertUserJournalSettings,
  type Season,
  type InsertSeason,
  type HabitTrain,
  type InsertHabitTrain,
  type HabitTrainStep,
  type InsertHabitTrainStep,
  type HabitTrainWithSteps,
  type CreateHabitTrainRequest,
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

  // Workout Routines
  getWorkoutRoutines(userId: string): Promise<WorkoutRoutine[]>;
  getWorkoutRoutine(id: string, userId: string): Promise<WorkoutRoutine | undefined>;
  createWorkoutRoutine(data: InsertWorkoutRoutine): Promise<WorkoutRoutine>;
  updateWorkoutRoutine(id: string, userId: string, data: Partial<InsertWorkoutRoutine>): Promise<WorkoutRoutine | undefined>;
  deleteWorkoutRoutine(id: string, userId: string): Promise<boolean>;

  // Journal Folders
  getJournalFolders(userId: string): Promise<JournalFolder[]>;
  getJournalFolder(id: string, userId: string): Promise<JournalFolder | undefined>;
  createJournalFolder(data: InsertJournalFolder): Promise<JournalFolder>;
  updateJournalFolder(id: string, userId: string, data: Partial<InsertJournalFolder>): Promise<JournalFolder | undefined>;
  deleteJournalFolder(id: string, userId: string): Promise<boolean>;

  // Journal Templates
  getJournalTemplates(userId: string): Promise<JournalTemplate[]>;
  getJournalTemplate(id: string, userId: string): Promise<JournalTemplate | undefined>;
  createJournalTemplate(data: InsertJournalTemplate): Promise<JournalTemplate>;
  updateJournalTemplate(id: string, userId: string, data: Partial<InsertJournalTemplate>): Promise<JournalTemplate | undefined>;
  deleteJournalTemplate(id: string, userId: string): Promise<boolean>;

  // Journal Entries (new enhanced version)
  getJournalEntriesNew(userId: string, folderId?: string): Promise<JournalEntryNew[]>;
  getJournalEntryNew(id: string, userId: string): Promise<JournalEntryNew | undefined>;
  createJournalEntryNew(data: InsertJournalEntryNew): Promise<JournalEntryNew>;
  updateJournalEntryNew(id: string, userId: string, data: Partial<InsertJournalEntryNew>): Promise<JournalEntryNew | undefined>;
  deleteJournalEntryNew(id: string, userId: string): Promise<boolean>;

  // Journal Settings
  getJournalSettings(userId: string): Promise<UserJournalSettings | undefined>;
  upsertJournalSettings(userId: string, data: Partial<InsertUserJournalSettings>): Promise<UserJournalSettings>;

  // Seasons
  getSeasons(userId: string): Promise<Season[]>;
  getSeason(id: string, userId: string): Promise<Season | undefined>;
  getActiveSeason(userId: string): Promise<Season | undefined>;
  createSeason(data: InsertSeason): Promise<Season>;
  updateSeason(id: string, userId: string, data: Partial<InsertSeason>): Promise<Season | undefined>;
  deleteSeason(id: string, userId: string): Promise<boolean>;

  // Habit Trains
  getHabitTrains(userId: string): Promise<HabitTrainWithSteps[]>;
  getHabitTrain(id: string, userId: string): Promise<HabitTrainWithSteps | undefined>;
  createHabitTrain(userId: string, data: CreateHabitTrainRequest): Promise<HabitTrainWithSteps>;
  updateHabitTrain(id: string, userId: string, data: CreateHabitTrainRequest): Promise<HabitTrainWithSteps | undefined>;
  deleteHabitTrain(id: string, userId: string): Promise<boolean>;
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

  // ==================== WORKOUT ROUTINES ====================

  async getWorkoutRoutines(userId: string): Promise<WorkoutRoutine[]> {
    return db
      .select()
      .from(workoutRoutines)
      .where(eq(workoutRoutines.userId, userId))
      .orderBy(desc(workoutRoutines.createdAt));
  }

  async getWorkoutRoutine(id: string, userId: string): Promise<WorkoutRoutine | undefined> {
    const [routine] = await db
      .select()
      .from(workoutRoutines)
      .where(and(eq(workoutRoutines.id, id), eq(workoutRoutines.userId, userId)));
    return routine;
  }

  async createWorkoutRoutine(data: InsertWorkoutRoutine): Promise<WorkoutRoutine> {
    const [routine] = await db.insert(workoutRoutines).values(data).returning();
    return routine;
  }

  async updateWorkoutRoutine(id: string, userId: string, data: Partial<InsertWorkoutRoutine>): Promise<WorkoutRoutine | undefined> {
    const updateData: any = { updatedAt: new Date() };
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.exercises !== undefined) updateData.exercises = data.exercises;
    
    const [routine] = await db
      .update(workoutRoutines)
      .set(updateData)
      .where(and(eq(workoutRoutines.id, id), eq(workoutRoutines.userId, userId)))
      .returning();
    return routine;
  }

  async deleteWorkoutRoutine(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(workoutRoutines)
      .where(and(eq(workoutRoutines.id, id), eq(workoutRoutines.userId, userId)))
      .returning();
    return result.length > 0;
  }

  // ==================== JOURNAL FOLDERS ====================

  async getJournalFolders(userId: string): Promise<JournalFolder[]> {
    return db
      .select()
      .from(journalFolders)
      .where(eq(journalFolders.userId, userId))
      .orderBy(journalFolders.sortOrder);
  }

  async getJournalFolder(id: string, userId: string): Promise<JournalFolder | undefined> {
    const [folder] = await db
      .select()
      .from(journalFolders)
      .where(and(eq(journalFolders.id, id), eq(journalFolders.userId, userId)));
    return folder;
  }

  async createJournalFolder(data: InsertJournalFolder): Promise<JournalFolder> {
    const [folder] = await db.insert(journalFolders).values(data).returning();
    return folder;
  }

  async updateJournalFolder(id: string, userId: string, data: Partial<InsertJournalFolder>): Promise<JournalFolder | undefined> {
    const updateData: any = { updatedAt: new Date() };
    if (data.name !== undefined) updateData.name = data.name;
    if (data.color !== undefined) updateData.color = data.color;
    if (data.icon !== undefined) updateData.icon = data.icon;
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;
    if (data.isDefault !== undefined) updateData.isDefault = data.isDefault;

    const [folder] = await db
      .update(journalFolders)
      .set(updateData)
      .where(and(eq(journalFolders.id, id), eq(journalFolders.userId, userId)))
      .returning();
    return folder;
  }

  async deleteJournalFolder(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(journalFolders)
      .where(and(eq(journalFolders.id, id), eq(journalFolders.userId, userId)))
      .returning();
    return result.length > 0;
  }

  // ==================== JOURNAL TEMPLATES ====================

  async getJournalTemplates(userId: string): Promise<JournalTemplate[]> {
    return db
      .select()
      .from(journalTemplates)
      .where(eq(journalTemplates.userId, userId))
      .orderBy(desc(journalTemplates.createdAt));
  }

  async getJournalTemplate(id: string, userId: string): Promise<JournalTemplate | undefined> {
    const [template] = await db
      .select()
      .from(journalTemplates)
      .where(and(eq(journalTemplates.id, id), eq(journalTemplates.userId, userId)));
    return template;
  }

  async createJournalTemplate(data: InsertJournalTemplate): Promise<JournalTemplate> {
    const [template] = await db.insert(journalTemplates).values(data).returning();
    return template;
  }

  async updateJournalTemplate(id: string, userId: string, data: Partial<InsertJournalTemplate>): Promise<JournalTemplate | undefined> {
    const updateData: any = { updatedAt: new Date() };
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.icon !== undefined) updateData.icon = data.icon;
    if (data.color !== undefined) updateData.color = data.color;
    if (data.fields !== undefined) updateData.fields = data.fields;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const [template] = await db
      .update(journalTemplates)
      .set(updateData)
      .where(and(eq(journalTemplates.id, id), eq(journalTemplates.userId, userId)))
      .returning();
    return template;
  }

  async deleteJournalTemplate(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(journalTemplates)
      .where(and(eq(journalTemplates.id, id), eq(journalTemplates.userId, userId)))
      .returning();
    return result.length > 0;
  }

  // ==================== JOURNAL ENTRIES (NEW) ====================

  async getJournalEntriesNew(userId: string, folderId?: string): Promise<JournalEntryNew[]> {
    if (folderId) {
      return db
        .select()
        .from(journalEntries)
        .where(and(eq(journalEntries.userId, userId), eq(journalEntries.folderId, folderId)))
        .orderBy(desc(journalEntries.createdAt));
    }
    return db
      .select()
      .from(journalEntries)
      .where(eq(journalEntries.userId, userId))
      .orderBy(desc(journalEntries.createdAt));
  }

  async getJournalEntryNew(id: string, userId: string): Promise<JournalEntryNew | undefined> {
    const [entry] = await db
      .select()
      .from(journalEntries)
      .where(and(eq(journalEntries.id, id), eq(journalEntries.userId, userId)));
    return entry;
  }

  async createJournalEntryNew(data: InsertJournalEntryNew): Promise<JournalEntryNew> {
    const [entry] = await db.insert(journalEntries).values(data).returning();
    return entry;
  }

  async updateJournalEntryNew(id: string, userId: string, data: Partial<InsertJournalEntryNew>): Promise<JournalEntryNew | undefined> {
    const updateData: any = { updatedAt: new Date() };
    if (data.folderId !== undefined) updateData.folderId = data.folderId;
    if (data.templateId !== undefined) updateData.templateId = data.templateId;
    if (data.entryType !== undefined) updateData.entryType = data.entryType;
    if (data.date !== undefined) updateData.date = data.date;
    if (data.title !== undefined) updateData.title = data.title;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.fieldValues !== undefined) updateData.fieldValues = data.fieldValues;
    if (data.mood !== undefined) updateData.mood = data.mood;
    if (data.tags !== undefined) updateData.tags = data.tags;

    const [entry] = await db
      .update(journalEntries)
      .set(updateData)
      .where(and(eq(journalEntries.id, id), eq(journalEntries.userId, userId)))
      .returning();
    return entry;
  }

  async deleteJournalEntryNew(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(journalEntries)
      .where(and(eq(journalEntries.id, id), eq(journalEntries.userId, userId)))
      .returning();
    return result.length > 0;
  }

  // ==================== JOURNAL SETTINGS ====================

  async getJournalSettings(userId: string): Promise<UserJournalSettings | undefined> {
    const [settings] = await db
      .select()
      .from(userJournalSettings)
      .where(eq(userJournalSettings.userId, userId));
    return settings;
  }

  async upsertJournalSettings(userId: string, data: Partial<InsertUserJournalSettings>): Promise<UserJournalSettings> {
    const updateData: any = { updatedAt: new Date() };
    if (data.defaultFolderId !== undefined) updateData.defaultFolderId = data.defaultFolderId;
    if (data.autoAssignDailyToFolder !== undefined) updateData.autoAssignDailyToFolder = data.autoAssignDailyToFolder;
    if (data.showFolderColors !== undefined) updateData.showFolderColors = data.showFolderColors;
    if (data.defaultEntryType !== undefined) updateData.defaultEntryType = data.defaultEntryType;

    const [settings] = await db
      .insert(userJournalSettings)
      .values({ userId, ...data })
      .onConflictDoUpdate({
        target: userJournalSettings.userId,
        set: updateData,
      })
      .returning();
    return settings;
  }

  // ==================== SEASONS ====================

  async getSeasons(userId: string): Promise<Season[]> {
    return db
      .select()
      .from(seasons)
      .where(eq(seasons.userId, userId))
      .orderBy(desc(seasons.createdAt));
  }

  async getSeason(id: string, userId: string): Promise<Season | undefined> {
    const [season] = await db
      .select()
      .from(seasons)
      .where(and(eq(seasons.id, id), eq(seasons.userId, userId)));
    return season;
  }

  async getActiveSeason(userId: string): Promise<Season | undefined> {
    const [season] = await db
      .select()
      .from(seasons)
      .where(and(eq(seasons.userId, userId), eq(seasons.isActive, true)));
    return season;
  }

  async createSeason(data: InsertSeason): Promise<Season> {
    const [season] = await db.insert(seasons).values(data).returning();
    return season;
  }

  async updateSeason(id: string, userId: string, data: Partial<InsertSeason>): Promise<Season | undefined> {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.startDate !== undefined) updateData.startDate = data.startDate;
    if (data.endDate !== undefined) updateData.endDate = data.endDate;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.isArchived !== undefined) updateData.isArchived = data.isArchived;
    if (data.weeklyGoal !== undefined) updateData.weeklyGoal = data.weeklyGoal;
    if (data.bannerColor !== undefined) updateData.bannerColor = data.bannerColor;

    const [season] = await db
      .update(seasons)
      .set(updateData)
      .where(and(eq(seasons.id, id), eq(seasons.userId, userId)))
      .returning();
    return season;
  }

  async deleteSeason(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(seasons)
      .where(and(eq(seasons.id, id), eq(seasons.userId, userId)))
      .returning();
    return result.length > 0;
  }

  // ==================== HABIT TRAINS ====================

  async getHabitTrains(userId: string): Promise<HabitTrainWithSteps[]> {
    const trains = await db
      .select()
      .from(habitTrains)
      .where(eq(habitTrains.userId, userId))
      .orderBy(desc(habitTrains.createdAt));

    const result: HabitTrainWithSteps[] = [];
    for (const train of trains) {
      const steps = await db
        .select({
          id: habitTrainSteps.id,
          trainId: habitTrainSteps.trainId,
          orderIndex: habitTrainSteps.orderIndex,
          stepType: habitTrainSteps.stepType,
          taskId: habitTrainSteps.taskId,
          noteText: habitTrainSteps.noteText,
          taskName: userTasks.name,
          taskValue: userTasks.value,
          taskCategory: userTasks.category,
        })
        .from(habitTrainSteps)
        .leftJoin(userTasks, eq(habitTrainSteps.taskId, userTasks.id))
        .where(eq(habitTrainSteps.trainId, train.id))
        .orderBy(habitTrainSteps.orderIndex);

      result.push({
        id: train.id,
        userId: train.userId,
        name: train.name,
        description: train.description,
        bonusPoints: train.bonusPoints,
        seasonId: train.seasonId,
        createdAt: train.createdAt?.toISOString() ?? null,
        updatedAt: train.updatedAt?.toISOString() ?? null,
        steps: steps.map(s => ({
          id: s.id,
          trainId: s.trainId,
          orderIndex: s.orderIndex,
          stepType: s.stepType as "task" | "note",
          taskId: s.taskId,
          noteText: s.noteText,
          task: s.taskId && s.taskName ? {
            id: s.taskId,
            name: s.taskName,
            value: s.taskValue ?? 0,
            category: s.taskCategory ?? "",
          } : null,
        })),
      });
    }
    return result;
  }

  async getHabitTrain(id: string, userId: string): Promise<HabitTrainWithSteps | undefined> {
    const [train] = await db
      .select()
      .from(habitTrains)
      .where(and(eq(habitTrains.id, id), eq(habitTrains.userId, userId)));
    
    if (!train) return undefined;

    const steps = await db
      .select({
        id: habitTrainSteps.id,
        trainId: habitTrainSteps.trainId,
        orderIndex: habitTrainSteps.orderIndex,
        stepType: habitTrainSteps.stepType,
        taskId: habitTrainSteps.taskId,
        noteText: habitTrainSteps.noteText,
        taskName: userTasks.name,
        taskValue: userTasks.value,
        taskCategory: userTasks.category,
      })
      .from(habitTrainSteps)
      .leftJoin(userTasks, eq(habitTrainSteps.taskId, userTasks.id))
      .where(eq(habitTrainSteps.trainId, train.id))
      .orderBy(habitTrainSteps.orderIndex);

    return {
      id: train.id,
      userId: train.userId,
      name: train.name,
      description: train.description,
      bonusPoints: train.bonusPoints,
      seasonId: train.seasonId,
      createdAt: train.createdAt?.toISOString() ?? null,
      updatedAt: train.updatedAt?.toISOString() ?? null,
      steps: steps.map(s => ({
        id: s.id,
        trainId: s.trainId,
        orderIndex: s.orderIndex,
        stepType: s.stepType as "task" | "note",
        taskId: s.taskId,
        noteText: s.noteText,
        task: s.taskId && s.taskName ? {
          id: s.taskId,
          name: s.taskName,
          value: s.taskValue ?? 0,
          category: s.taskCategory ?? "",
        } : null,
      })),
    };
  }

  async createHabitTrain(userId: string, data: CreateHabitTrainRequest): Promise<HabitTrainWithSteps> {
    const [train] = await db.insert(habitTrains).values({
      userId,
      name: data.name,
      description: data.description,
      bonusPoints: data.bonusPoints ?? 0,
      seasonId: data.seasonId,
    }).returning();

    // Insert steps with order index (ensure empty strings become null for FK constraint)
    const stepsToInsert = data.steps.map((step, index) => ({
      trainId: train.id,
      orderIndex: index,
      stepType: step.stepType,
      taskId: step.stepType === "task" && step.taskId ? step.taskId : null,
      noteText: step.stepType === "note" ? step.noteText : null,
    }));

    if (stepsToInsert.length > 0) {
      await db.insert(habitTrainSteps).values(stepsToInsert);
    }

    return this.getHabitTrain(train.id, userId) as Promise<HabitTrainWithSteps>;
  }

  async updateHabitTrain(id: string, userId: string, data: CreateHabitTrainRequest): Promise<HabitTrainWithSteps | undefined> {
    // Verify ownership
    const [existing] = await db
      .select()
      .from(habitTrains)
      .where(and(eq(habitTrains.id, id), eq(habitTrains.userId, userId)));
    
    if (!existing) return undefined;

    // Update the train
    await db.update(habitTrains).set({
      name: data.name,
      description: data.description,
      bonusPoints: data.bonusPoints ?? 0,
      seasonId: data.seasonId,
      updatedAt: new Date(),
    }).where(eq(habitTrains.id, id));

    // Delete existing steps and re-insert
    await db.delete(habitTrainSteps).where(eq(habitTrainSteps.trainId, id));

    const stepsToInsert = data.steps.map((step, index) => ({
      trainId: id,
      orderIndex: index,
      stepType: step.stepType,
      taskId: step.stepType === "task" && step.taskId ? step.taskId : null,
      noteText: step.stepType === "note" ? step.noteText : null,
    }));

    if (stepsToInsert.length > 0) {
      await db.insert(habitTrainSteps).values(stepsToInsert);
    }

    return this.getHabitTrain(id, userId);
  }

  async deleteHabitTrain(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(habitTrains)
      .where(and(eq(habitTrains.id, id), eq(habitTrains.userId, userId)))
      .returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
