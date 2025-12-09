import {
  users,
  notifications,
  type User,
  type UpsertUser,
  type Notification,
  type InsertNotification,
  type NotificationWithActor,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  createNotification(data: InsertNotification): Promise<Notification>;
  getNotifications(userId: string): Promise<NotificationWithActor[]>;
  getUnreadNotificationCount(userId: string): Promise<number>;
  markNotificationRead(id: string, userId: string): Promise<Notification | undefined>;
  markAllNotificationsRead(userId: string): Promise<void>;
  deleteNotification(id: string, userId: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
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
}

export const storage = new DatabaseStorage();
