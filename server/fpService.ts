import { db } from "./db";
import { eq, and, gte, sql } from "drizzle-orm";
import { users, fpActivityLog, type FpEventType, type FpActivityLog } from "@shared/schema";
import { fpRules } from "@shared/fpRules";

export interface FpAwardResult {
  success: boolean;
  fpAwarded: number;
  newTotal: number;
  message: string;
  activityLogId?: string;
}

export async function awardFp(
  userId: string,
  eventType: FpEventType,
  metadata?: { resourceId?: string; checkDuplicate?: boolean }
): Promise<FpAwardResult> {
  const rule = fpRules[eventType];
  if (!rule) {
    return {
      success: false,
      fpAwarded: 0,
      newTotal: 0,
      message: `Unknown FP event type: ${eventType}`,
    };
  }

  try {
    if (metadata?.checkDuplicate) {
      const isDuplicate = await checkDuplicateAward(userId, eventType, metadata.resourceId);
      if (isDuplicate) {
        const [user] = await db.select({ fpTotal: users.fpTotal }).from(users).where(eq(users.id, userId));
        return {
          success: false,
          fpAwarded: 0,
          newTotal: user?.fpTotal || 0,
          message: `FP already awarded for ${eventType}`,
        };
      }
    }

    const [activity] = await db.insert(fpActivityLog).values({
      userId,
      eventType,
      fpAmount: rule.fpAmount,
      description: rule.description,
    }).returning();

    const [updatedUser] = await db.update(users)
      .set({ 
        fpTotal: sql`COALESCE(${users.fpTotal}, 0) + ${rule.fpAmount}`,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning({ fpTotal: users.fpTotal });

    return {
      success: true,
      fpAwarded: rule.fpAmount,
      newTotal: updatedUser?.fpTotal || rule.fpAmount,
      message: rule.description,
      activityLogId: activity.id,
    };
  } catch (error) {
    console.error(`Error awarding FP for ${eventType}:`, error);
    return {
      success: false,
      fpAwarded: 0,
      newTotal: 0,
      message: `Failed to award FP: ${error}`,
    };
  }
}

async function checkDuplicateAward(
  userId: string,
  eventType: FpEventType,
  resourceId?: string
): Promise<boolean> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dailyEvents: FpEventType[] = ["log_day", "hit_daily_goal"];
  
  if (dailyEvents.includes(eventType)) {
    const existing = await db.select({ id: fpActivityLog.id })
      .from(fpActivityLog)
      .where(and(
        eq(fpActivityLog.userId, userId),
        eq(fpActivityLog.eventType, eventType),
        gte(fpActivityLog.createdAt, today)
      ))
      .limit(1);
    return existing.length > 0;
  }

  const weeklyEvents: FpEventType[] = ["hit_weekly_goal", "no_penalties_week"];
  
  if (weeklyEvents.includes(eventType)) {
    const startOfWeek = new Date(today);
    const dayOfWeek = startOfWeek.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startOfWeek.setDate(startOfWeek.getDate() + diff);
    startOfWeek.setHours(0, 0, 0, 0);
    
    const existing = await db.select({ id: fpActivityLog.id })
      .from(fpActivityLog)
      .where(and(
        eq(fpActivityLog.userId, userId),
        eq(fpActivityLog.eventType, eventType),
        gte(fpActivityLog.createdAt, startOfWeek)
      ))
      .limit(1);
    return existing.length > 0;
  }

  return false;
}

export async function getUserFpTotal(userId: string): Promise<number> {
  const [user] = await db.select({ fpTotal: users.fpTotal })
    .from(users)
    .where(eq(users.id, userId));
  return user?.fpTotal || 0;
}

export async function getUserFpActivity(
  userId: string,
  limit: number = 50,
  offset: number = 0
): Promise<FpActivityLog[]> {
  const activities = await db.select()
    .from(fpActivityLog)
    .where(eq(fpActivityLog.userId, userId))
    .orderBy(sql`${fpActivityLog.createdAt} DESC`)
    .limit(limit)
    .offset(offset);
  return activities;
}

export async function getFpLeaderboard(
  type: "all" | "friends",
  userId?: string,
  limit: number = 20,
  period: "weekly" | "monthly" | "allTime" = "allTime"
): Promise<Array<{
  userId: string;
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  fpTotal: number;
  rank: number;
}>> {
  let userIds: string[] | undefined;
  
  if (type === "friends" && userId) {
    const { friendships } = await import("@shared/schema");
    const friendRecords = await db.select({
      requesterId: friendships.requesterId,
      addresseeId: friendships.addresseeId,
    }).from(friendships).where(and(
      eq(friendships.status, "accepted"),
      sql`(${friendships.requesterId} = ${userId} OR ${friendships.addresseeId} = ${userId})`
    ));
    
    userIds = [userId];
    friendRecords.forEach(f => {
      if (f.requesterId === userId) {
        userIds!.push(f.addresseeId);
      } else {
        userIds!.push(f.requesterId);
      }
    });
  }
  
  if (period === "allTime") {
    const baseQuery = db.select({
      userId: users.id,
      displayName: users.displayName,
      firstName: users.firstName,
      lastName: users.lastName,
      profileImageUrl: users.profileImageUrl,
      fpTotal: users.fpTotal,
    }).from(users);
    
    let results;
    if (userIds && userIds.length > 0) {
      results = await baseQuery
        .where(sql`${users.id} IN (${sql.join(userIds.map(id => sql`${id}`), sql`, `)})`)
        .orderBy(sql`COALESCE(${users.fpTotal}, 0) DESC`)
        .limit(limit);
    } else {
      results = await baseQuery
        .orderBy(sql`COALESCE(${users.fpTotal}, 0) DESC`)
        .limit(limit);
    }
    
    return results.map((r, index) => ({
      ...r,
      fpTotal: r.fpTotal || 0,
      rank: index + 1,
    }));
  }
  
  const now = new Date();
  let startDate: Date;
  
  if (period === "weekly") {
    startDate = new Date(now);
    const dayOfWeek = startDate.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startDate.setDate(startDate.getDate() + diff);
    startDate.setHours(0, 0, 0, 0);
  } else {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    startDate.setHours(0, 0, 0, 0);
  }
  
  let userFilter = sql`1=1`;
  if (userIds && userIds.length > 0) {
    userFilter = sql`${fpActivityLog.userId} IN (${sql.join(userIds.map(id => sql`${id}`), sql`, `)})`;
  }
  
  const periodTotals = await db.select({
    odUserId: fpActivityLog.userId,
    periodFp: sql<number>`COALESCE(SUM(${fpActivityLog.fpAmount}), 0)`.as("periodFp"),
  })
    .from(fpActivityLog)
    .where(and(
      gte(fpActivityLog.createdAt, startDate),
      userFilter
    ))
    .groupBy(fpActivityLog.userId)
    .orderBy(sql`COALESCE(SUM(${fpActivityLog.fpAmount}), 0) DESC`)
    .limit(limit);
  
  if (periodTotals.length === 0) {
    return [];
  }
  
  const userDetails = await db.select({
    userId: users.id,
    displayName: users.displayName,
    firstName: users.firstName,
    lastName: users.lastName,
    profileImageUrl: users.profileImageUrl,
  }).from(users).where(sql`${users.id} IN (${sql.join(periodTotals.map(p => sql`${p.odUserId}`), sql`, `)})`);
  
  const userMap = new Map(userDetails.map(u => [u.userId, u]));
  
  return periodTotals.map((p, index) => {
    const user = userMap.get(p.odUserId);
    return {
      userId: p.odUserId,
      displayName: user?.displayName || null,
      firstName: user?.firstName || null,
      lastName: user?.lastName || null,
      profileImageUrl: user?.profileImageUrl || null,
      fpTotal: Number(p.periodFp),
      rank: index + 1,
    };
  });
}
