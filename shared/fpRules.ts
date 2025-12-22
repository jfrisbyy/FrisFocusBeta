import type { FpEventType } from "./schema";

export interface FpRule {
  eventType: FpEventType;
  fpAmount: number;
  description: string;
}

export const fpRules: Record<FpEventType, FpRule> = {
  join_circle: {
    eventType: "join_circle",
    fpAmount: 1,
    description: "Joined a circle",
  },
  send_cheerline: {
    eventType: "send_cheerline",
    fpAmount: 1,
    description: "Sent a cheerline",
  },
  add_friend: {
    eventType: "add_friend",
    fpAmount: 1,
    description: "Added a friend",
  },
  create_circle: {
    eventType: "create_circle",
    fpAmount: 2,
    description: "Created a circle",
  },
  accept_1v1_challenge: {
    eventType: "accept_1v1_challenge",
    fpAmount: 2,
    description: "Accepted a 1v1 challenge",
  },
  accept_circle_challenge: {
    eventType: "accept_circle_challenge",
    fpAmount: 2,
    description: "Accepted a circle challenge",
  },
  log_day: {
    eventType: "log_day",
    fpAmount: 3,
    description: "Logged the day",
  },
  daily_goal_streak_3: {
    eventType: "daily_goal_streak_3",
    fpAmount: 5,
    description: "3-day daily point goal streak",
  },
  logging_streak_7: {
    eventType: "logging_streak_7",
    fpAmount: 5,
    description: "7-day logging streak",
  },
  hit_daily_goal: {
    eventType: "hit_daily_goal",
    fpAmount: 10,
    description: "Hit daily point goal",
  },
  daily_goal_streak_7: {
    eventType: "daily_goal_streak_7",
    fpAmount: 10,
    description: "7-day daily point goal streak",
  },
  weekly_goal_streak_2: {
    eventType: "weekly_goal_streak_2",
    fpAmount: 10,
    description: "2-week point goal streak",
  },
  win_1v1_challenge: {
    eventType: "win_1v1_challenge",
    fpAmount: 10,
    description: "Won a 1v1 challenge",
  },
  win_circle_challenge: {
    eventType: "win_circle_challenge",
    fpAmount: 10,
    description: "Won a circle challenge",
  },
  earn_badge: {
    eventType: "earn_badge",
    fpAmount: 10,
    description: "Earned a badge",
  },
  earn_circle_award: {
    eventType: "earn_circle_award",
    fpAmount: 10,
    description: "Earned a circle award",
  },
  earn_circle_badge: {
    eventType: "earn_circle_badge",
    fpAmount: 10,
    description: "Earned a circle badge",
  },
  invite_friend_email: {
    eventType: "invite_friend_email",
    fpAmount: 10,
    description: "Invited a friend via email",
  },
  no_penalties_week: {
    eventType: "no_penalties_week",
    fpAmount: 10,
    description: "No penalties all week",
  },
  logging_streak_14: {
    eventType: "logging_streak_14",
    fpAmount: 10,
    description: "14-day logging streak",
  },
  within_5_percent_weekly: {
    eventType: "within_5_percent_weekly",
    fpAmount: 15,
    description: "Came within 5% of weekly goal",
  },
  logging_streak_21: {
    eventType: "logging_streak_21",
    fpAmount: 15,
    description: "21-day logging streak",
  },
  daily_goal_streak_10: {
    eventType: "daily_goal_streak_10",
    fpAmount: 15,
    description: "10-day daily point goal streak",
  },
  complete_all_weekly_daily: {
    eventType: "complete_all_weekly_daily",
    fpAmount: 20,
    description: "Completed all weekly and daily to-dos",
  },
  challenge_win_streak_3: {
    eventType: "challenge_win_streak_3",
    fpAmount: 20,
    description: "3-challenge win streak",
  },
  weekly_goal_streak_3: {
    eventType: "weekly_goal_streak_3",
    fpAmount: 20,
    description: "3-week point goal streak",
  },
  daily_goal_streak_14: {
    eventType: "daily_goal_streak_14",
    fpAmount: 20,
    description: "14-day daily point streak",
  },
  win_streak_1v1_2: {
    eventType: "win_streak_1v1_2",
    fpAmount: 20,
    description: "1v1 2-win streak",
  },
  logging_streak_28: {
    eventType: "logging_streak_28",
    fpAmount: 20,
    description: "28-day logging streak",
  },
  no_penalty_streak_2_weeks: {
    eventType: "no_penalty_streak_2_weeks",
    fpAmount: 25,
    description: "2-week no-penalty streak",
  },
  circle_win_streak_3: {
    eventType: "circle_win_streak_3",
    fpAmount: 25,
    description: "Circle 3-win streak",
  },
  weekly_goal_streak_4: {
    eventType: "weekly_goal_streak_4",
    fpAmount: 30,
    description: "4-week point goal streak",
  },
  daily_goal_streak_21: {
    eventType: "daily_goal_streak_21",
    fpAmount: 30,
    description: "21-day daily streak",
  },
  win_streak_1v1_3: {
    eventType: "win_streak_1v1_3",
    fpAmount: 30,
    description: "1v1 3-win streak",
  },
  logging_streak_50: {
    eventType: "logging_streak_50",
    fpAmount: 35,
    description: "50-day logging streak",
  },
  hit_weekly_goal: {
    eventType: "hit_weekly_goal",
    fpAmount: 40,
    description: "Hit weekly point goal",
  },
  weekly_goal_streak_5: {
    eventType: "weekly_goal_streak_5",
    fpAmount: 40,
    description: "5-week point goal streak",
  },
  no_penalty_streak_4_weeks: {
    eventType: "no_penalty_streak_4_weeks",
    fpAmount: 40,
    description: "4-week no-penalty streak",
  },
  circle_win_streak_5: {
    eventType: "circle_win_streak_5",
    fpAmount: 40,
    description: "Circle 5-win streak",
  },
  weekly_goal_streak_6: {
    eventType: "weekly_goal_streak_6",
    fpAmount: 50,
    description: "6-week point goal streak",
  },
  daily_goal_streak_30: {
    eventType: "daily_goal_streak_30",
    fpAmount: 50,
    description: "30-day daily streak",
  },
  win_streak_1v1_5: {
    eventType: "win_streak_1v1_5",
    fpAmount: 50,
    description: "1v1 5-win streak",
  },
  weekly_goal_streak_7: {
    eventType: "weekly_goal_streak_7",
    fpAmount: 60,
    description: "7-week point goal streak",
  },
  logging_streak_100: {
    eventType: "logging_streak_100",
    fpAmount: 75,
    description: "100-day logging streak",
  },
  weekly_goal_streak_8: {
    eventType: "weekly_goal_streak_8",
    fpAmount: 80,
    description: "8-week point goal streak",
  },
  win_streak_1v1_10: {
    eventType: "win_streak_1v1_10",
    fpAmount: 80,
    description: "1v1 10-win streak",
  },
  no_penalty_streak_6_weeks: {
    eventType: "no_penalty_streak_6_weeks",
    fpAmount: 100,
    description: "6-week no-penalty streak",
  },
  weekly_goal_streak_10: {
    eventType: "weekly_goal_streak_10",
    fpAmount: 100,
    description: "10-week point goal streak",
  },
  logging_streak_200: {
    eventType: "logging_streak_200",
    fpAmount: 100,
    description: "200-day logging streak",
  },
  weekly_goal_streak_15: {
    eventType: "weekly_goal_streak_15",
    fpAmount: 150,
    description: "15-week point goal streak",
  },
  weekly_goal_streak_20: {
    eventType: "weekly_goal_streak_20",
    fpAmount: 250,
    description: "20-week point goal streak",
  },
  logging_streak_365: {
    eventType: "logging_streak_365",
    fpAmount: 250,
    description: "365-day logging streak",
  },
  first_task: {
    eventType: "first_task",
    fpAmount: 10,
    description: "Created your first task",
  },
  first_post: {
    eventType: "first_post",
    fpAmount: 10,
    description: "Posted to the feed for the first time",
  },
  first_journal: {
    eventType: "first_journal",
    fpAmount: 10,
    description: "Wrote your first journal entry",
  },
  first_event: {
    eventType: "first_event",
    fpAmount: 10,
    description: "Added your first event",
  },
  first_due_date: {
    eventType: "first_due_date",
    fpAmount: 10,
    description: "Added your first due date",
  },
  first_milestone: {
    eventType: "first_milestone",
    fpAmount: 10,
    description: "Created your first milestone",
  },
  first_weekly_todo: {
    eventType: "first_weekly_todo",
    fpAmount: 10,
    description: "Added your first weekly to-do item",
  },
  first_friend: {
    eventType: "first_friend",
    fpAmount: 10,
    description: "Added your first friend",
  },
  first_badge: {
    eventType: "first_badge",
    fpAmount: 10,
    description: "Created your first badge",
  },
  first_7_day_streak: {
    eventType: "first_7_day_streak",
    fpAmount: 50,
    description: "Completed your first 7-day logging streak",
  },
  first_challenge_accepted: {
    eventType: "first_challenge_accepted",
    fpAmount: 10,
    description: "Accepted your first challenge",
  },
  first_cheerline_sent: {
    eventType: "first_cheerline_sent",
    fpAmount: 10,
    description: "Sent your first cheerline",
  },
  first_circle_joined: {
    eventType: "first_circle_joined",
    fpAmount: 10,
    description: "Joined your first circle",
  },
  first_circle_created: {
    eventType: "first_circle_created",
    fpAmount: 10,
    description: "Created your first circle",
  },
  task_master: {
    eventType: "task_master",
    fpAmount: 10,
    description: "Task Master: Created 10+ tasks",
  },
  over_achiever: {
    eventType: "over_achiever",
    fpAmount: 10,
    description: "Over Achiever: Exceeded weekly goal by 15%",
  },
  completed_onboarding_tutorial: {
    eventType: "completed_onboarding_tutorial",
    fpAmount: 50,
    description: "Completed the onboarding tutorial",
  },
};

export function getFpRule(eventType: FpEventType): FpRule {
  return fpRules[eventType];
}
