import { db } from "./db";
import { eq, and, gte, lte, sql, desc } from "drizzle-orm";
import { users, fpActivityLog, userDailyLogs, userHabitSettings, type FpEventType, type FpActivityLog } from "@shared/schema";
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

// One-time FP events that can only be awarded once per user ever
const oneTimeEvents: FpEventType[] = [
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
];

async function checkDuplicateAward(
  userId: string,
  eventType: FpEventType,
  resourceId?: string
): Promise<boolean> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // One-time events - check if ever awarded
  if (oneTimeEvents.includes(eventType)) {
    const existing = await db.select({ id: fpActivityLog.id })
      .from(fpActivityLog)
      .where(and(
        eq(fpActivityLog.userId, userId),
        eq(fpActivityLog.eventType, eventType)
      ))
      .limit(1);
    return existing.length > 0;
  }

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

// ==================== STREAK CALCULATION HELPERS ====================

function formatDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const dayOfWeek = d.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function getLoggingStreak(userId: string): Promise<number> {
  const logs = await db.select({ date: userDailyLogs.date })
    .from(userDailyLogs)
    .where(eq(userDailyLogs.userId, userId))
    .orderBy(desc(userDailyLogs.date));
  
  if (logs.length === 0) return 0;
  
  const today = formatDateString(new Date());
  const yesterday = formatDateString(new Date(Date.now() - 86400000));
  
  const firstLogDate = logs[0].date;
  if (firstLogDate !== today && firstLogDate !== yesterday) {
    return 0;
  }
  
  let streak = 1;
  for (let i = 1; i < logs.length; i++) {
    const prevDate = new Date(logs[i - 1].date);
    const currDate = new Date(logs[i].date);
    const diffDays = Math.round((prevDate.getTime() - currDate.getTime()) / 86400000);
    
    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}

export async function getDailyGoalStreak(userId: string): Promise<number> {
  const [settings] = await db.select()
    .from(userHabitSettings)
    .where(eq(userHabitSettings.userId, userId));
  
  if (!settings?.dailyGoal) return 0;
  const dailyGoal = settings.dailyGoal;
  
  const logs = await db.select({ 
    date: userDailyLogs.date, 
    taskPoints: userDailyLogs.taskPoints,
    todoPoints: userDailyLogs.todoPoints,
    penaltyPoints: userDailyLogs.penaltyPoints
  })
    .from(userDailyLogs)
    .where(eq(userDailyLogs.userId, userId))
    .orderBy(desc(userDailyLogs.date));
  
  if (logs.length === 0) return 0;
  
  const today = formatDateString(new Date());
  const yesterday = formatDateString(new Date(Date.now() - 86400000));
  
  const firstLogDate = logs[0].date;
  if (firstLogDate !== today && firstLogDate !== yesterday) {
    return 0;
  }
  
  let streak = 0;
  for (let i = 0; i < logs.length; i++) {
    if (i > 0) {
      const prevDate = new Date(logs[i - 1].date);
      const currDate = new Date(logs[i].date);
      const diffDays = Math.round((prevDate.getTime() - currDate.getTime()) / 86400000);
      if (diffDays !== 1) break;
    }
    
    const totalPoints = (logs[i].taskPoints || 0) + (logs[i].todoPoints || 0) + (logs[i].penaltyPoints || 0);
    if (totalPoints >= dailyGoal) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}

export async function getWeeklyGoalStreak(userId: string): Promise<number> {
  const [settings] = await db.select()
    .from(userHabitSettings)
    .where(eq(userHabitSettings.userId, userId));
  
  if (!settings?.weeklyGoal) return 0;
  const weeklyGoal = settings.weeklyGoal;
  
  const thirtyWeeksAgo = new Date();
  thirtyWeeksAgo.setDate(thirtyWeeksAgo.getDate() - 210);
  
  const logs = await db.select({ 
    date: userDailyLogs.date, 
    taskPoints: userDailyLogs.taskPoints,
    todoPoints: userDailyLogs.todoPoints,
    penaltyPoints: userDailyLogs.penaltyPoints
  })
    .from(userDailyLogs)
    .where(and(
      eq(userDailyLogs.userId, userId),
      gte(userDailyLogs.date, formatDateString(thirtyWeeksAgo))
    ))
    .orderBy(desc(userDailyLogs.date));
  
  if (logs.length === 0) return 0;
  
  const weekTotals = new Map<string, number>();
  for (const log of logs) {
    const weekStart = formatDateString(getStartOfWeek(new Date(log.date)));
    const logTotal = (log.taskPoints || 0) + (log.todoPoints || 0) + (log.penaltyPoints || 0);
    weekTotals.set(weekStart, (weekTotals.get(weekStart) || 0) + logTotal);
  }
  
  const sortedWeeks = Array.from(weekTotals.entries())
    .sort((a, b) => b[0].localeCompare(a[0]));
  
  if (sortedWeeks.length === 0) return 0;
  
  const currentWeekStart = formatDateString(getStartOfWeek(new Date()));
  const lastWeekStart = formatDateString(getStartOfWeek(new Date(Date.now() - 7 * 86400000)));
  
  const mostRecentWeek = sortedWeeks[0][0];
  if (mostRecentWeek !== currentWeekStart && mostRecentWeek !== lastWeekStart) {
    return 0;
  }
  
  let streak = 0;
  for (let i = 0; i < sortedWeeks.length; i++) {
    const [weekStart, total] = sortedWeeks[i];
    
    if (i > 0) {
      const prevWeek = new Date(sortedWeeks[i - 1][0]);
      const currWeek = new Date(weekStart);
      const diffWeeks = Math.round((prevWeek.getTime() - currWeek.getTime()) / (7 * 86400000));
      if (diffWeeks !== 1) break;
    }
    
    if (total >= weeklyGoal) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}

export async function getNoPenaltyStreak(userId: string): Promise<number> {
  const thirtyWeeksAgo = new Date();
  thirtyWeeksAgo.setDate(thirtyWeeksAgo.getDate() - 210);
  
  const logs = await db.select({ date: userDailyLogs.date, penaltyPoints: userDailyLogs.penaltyPoints })
    .from(userDailyLogs)
    .where(and(
      eq(userDailyLogs.userId, userId),
      gte(userDailyLogs.date, formatDateString(thirtyWeeksAgo))
    ))
    .orderBy(desc(userDailyLogs.date));
  
  if (logs.length === 0) return 0;
  
  const weekPenalties = new Map<string, number>();
  for (const log of logs) {
    const weekStart = formatDateString(getStartOfWeek(new Date(log.date)));
    weekPenalties.set(weekStart, (weekPenalties.get(weekStart) || 0) + Math.abs(log.penaltyPoints || 0));
  }
  
  const sortedWeeks = Array.from(weekPenalties.entries())
    .sort((a, b) => b[0].localeCompare(a[0]));
  
  if (sortedWeeks.length === 0) return 0;
  
  const currentWeekStart = formatDateString(getStartOfWeek(new Date()));
  const lastWeekStart = formatDateString(getStartOfWeek(new Date(Date.now() - 7 * 86400000)));
  
  const mostRecentWeek = sortedWeeks[0][0];
  if (mostRecentWeek !== currentWeekStart && mostRecentWeek !== lastWeekStart) {
    return 0;
  }
  
  let streak = 0;
  for (let i = 0; i < sortedWeeks.length; i++) {
    const [weekStart, penalties] = sortedWeeks[i];
    
    if (i > 0) {
      const prevWeek = new Date(sortedWeeks[i - 1][0]);
      const currWeek = new Date(weekStart);
      const diffWeeks = Math.round((prevWeek.getTime() - currWeek.getTime()) / (7 * 86400000));
      if (diffWeeks !== 1) break;
    }
    
    if (penalties === 0) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}

// ==================== STREAK MILESTONE AWARDING ====================

const loggingStreakMilestones: { days: number; event: FpEventType }[] = [
  { days: 7, event: "logging_streak_7" },
  { days: 14, event: "logging_streak_14" },
  { days: 21, event: "logging_streak_21" },
  { days: 28, event: "logging_streak_28" },
  { days: 50, event: "logging_streak_50" },
  { days: 100, event: "logging_streak_100" },
  { days: 200, event: "logging_streak_200" },
  { days: 365, event: "logging_streak_365" },
];

const dailyGoalStreakMilestones: { days: number; event: FpEventType }[] = [
  { days: 3, event: "daily_goal_streak_3" },
  { days: 7, event: "daily_goal_streak_7" },
  { days: 10, event: "daily_goal_streak_10" },
  { days: 14, event: "daily_goal_streak_14" },
  { days: 21, event: "daily_goal_streak_21" },
  { days: 30, event: "daily_goal_streak_30" },
];

const weeklyGoalStreakMilestones: { weeks: number; event: FpEventType }[] = [
  { weeks: 2, event: "weekly_goal_streak_2" },
  { weeks: 3, event: "weekly_goal_streak_3" },
  { weeks: 4, event: "weekly_goal_streak_4" },
  { weeks: 5, event: "weekly_goal_streak_5" },
  { weeks: 6, event: "weekly_goal_streak_6" },
  { weeks: 7, event: "weekly_goal_streak_7" },
  { weeks: 8, event: "weekly_goal_streak_8" },
  { weeks: 10, event: "weekly_goal_streak_10" },
  { weeks: 15, event: "weekly_goal_streak_15" },
  { weeks: 20, event: "weekly_goal_streak_20" },
];

const noPenaltyStreakMilestones: { weeks: number; event: FpEventType }[] = [
  { weeks: 1, event: "no_penalties_week" },
  { weeks: 2, event: "no_penalty_streak_2_weeks" },
  { weeks: 4, event: "no_penalty_streak_4_weeks" },
  { weeks: 6, event: "no_penalty_streak_6_weeks" },
];

async function hasReceivedStreakAward(userId: string, eventType: FpEventType): Promise<boolean> {
  const existing = await db.select({ id: fpActivityLog.id })
    .from(fpActivityLog)
    .where(and(
      eq(fpActivityLog.userId, userId),
      eq(fpActivityLog.eventType, eventType)
    ))
    .limit(1);
  return existing.length > 0;
}

export async function awardLoggingStreakMilestones(userId: string): Promise<FpAwardResult[]> {
  const streak = await getLoggingStreak(userId);
  const results: FpAwardResult[] = [];
  
  for (const milestone of loggingStreakMilestones) {
    if (streak >= milestone.days) {
      const alreadyAwarded = await hasReceivedStreakAward(userId, milestone.event);
      if (!alreadyAwarded) {
        const result = await awardFp(userId, milestone.event);
        if (result.success) results.push(result);
      }
    }
  }
  
  return results;
}

export async function awardDailyGoalStreakMilestones(userId: string): Promise<FpAwardResult[]> {
  const streak = await getDailyGoalStreak(userId);
  const results: FpAwardResult[] = [];
  
  for (const milestone of dailyGoalStreakMilestones) {
    if (streak >= milestone.days) {
      const alreadyAwarded = await hasReceivedStreakAward(userId, milestone.event);
      if (!alreadyAwarded) {
        const result = await awardFp(userId, milestone.event);
        if (result.success) results.push(result);
      }
    }
  }
  
  return results;
}

export async function awardWeeklyGoalStreakMilestones(userId: string): Promise<FpAwardResult[]> {
  const streak = await getWeeklyGoalStreak(userId);
  const results: FpAwardResult[] = [];
  
  for (const milestone of weeklyGoalStreakMilestones) {
    if (streak >= milestone.weeks) {
      const alreadyAwarded = await hasReceivedStreakAward(userId, milestone.event);
      if (!alreadyAwarded) {
        const result = await awardFp(userId, milestone.event);
        if (result.success) results.push(result);
      }
    }
  }
  
  return results;
}

export async function awardNoPenaltyStreakMilestones(userId: string): Promise<FpAwardResult[]> {
  const streak = await getNoPenaltyStreak(userId);
  const results: FpAwardResult[] = [];
  
  for (const milestone of noPenaltyStreakMilestones) {
    if (streak >= milestone.weeks) {
      const alreadyAwarded = await hasReceivedStreakAward(userId, milestone.event);
      if (!alreadyAwarded) {
        const result = await awardFp(userId, milestone.event);
        if (result.success) results.push(result);
      }
    }
  }
  
  return results;
}

export async function checkAndAwardWeeklyTriggers(
  userId: string,
  weeklyTotal: number,
  weeklyGoal: number
): Promise<FpAwardResult[]> {
  const results: FpAwardResult[] = [];
  
  if (weeklyTotal >= weeklyGoal) {
    const hitWeeklyResult = await awardFp(userId, "hit_weekly_goal", { checkDuplicate: true });
    if (hitWeeklyResult.success) results.push(hitWeeklyResult);
    
    const weeklyStreakResults = await awardWeeklyGoalStreakMilestones(userId);
    results.push(...weeklyStreakResults);
  } else if (weeklyGoal > 0 && weeklyTotal >= weeklyGoal * 0.95) {
    const within5Result = await awardFp(userId, "within_5_percent_weekly", { checkDuplicate: true });
    if (within5Result.success) results.push(within5Result);
  }
  
  // Only award no-penalty streak milestones on Monday (after the previous week ends)
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday
  if (dayOfWeek === 1) {
    const noPenaltyResults = await awardNoPenaltyStreakMilestones(userId);
    results.push(...noPenaltyResults);
  }
  
  return results;
}
