import { HelpCircle } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

interface HelpIndicatorProps {
  title: string;
  content: string | string[];
  className?: string;
}

export function HelpIndicator({ title, content, className = "" }: HelpIndicatorProps) {
  const contentItems = Array.isArray(content) ? content : [content];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`h-5 w-5 rounded-full text-muted-foreground hover:text-foreground ${className}`}
          data-testid="button-help-indicator"
        >
          <HelpCircle className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-4" align="start">
        <div className="space-y-2">
          <h4 className="font-medium text-sm">{title}</h4>
          <div className="text-xs text-muted-foreground space-y-1.5">
            {contentItems.map((item, index) => (
              <p key={index}>{item}</p>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Pre-defined help content for different features
export const helpContent = {
  weeklyPoints: {
    title: "Weekly Points",
    content: [
      "Your total Focus Points (FP) earned this week from completing tasks.",
      "Points reset each week to keep you motivated for fresh starts.",
    ],
  },
  dailyGoal: {
    title: "Daily Goal",
    content: [
      "Aim for 50 FP each day to maintain consistent progress.",
      "Green means you've hit your goal, yellow is close, red needs more focus.",
    ],
  },
  checkInBonus: {
    title: "Check-in Bonus",
    content: [
      "Log any activity each day to earn a +3 FP bonus.",
      "This rewards consistency - even small progress counts!",
    ],
  },
  tasks: {
    title: "Tasks",
    content: [
      "Create habits you want to track with custom point values.",
      "Higher points for harder tasks keeps you motivated.",
      "Check off tasks daily to accumulate Focus Points.",
    ],
  },
  boosters: {
    title: "Boosters",
    content: [
      "Special one-time bonuses for hitting milestones.",
      "Examples: Complete a book, hit the gym 3x/week, 5/7 day streaks.",
      "Boosters add extra points when you achieve specific goals.",
    ],
  },
  seasons: {
    title: "Seasons",
    content: [
      "Seasons are time periods (like quarters) to track progress.",
      "Compare your performance across different seasons.",
      "Start fresh each season while keeping your historical data.",
    ],
  },
  circles: {
    title: "Circles",
    content: [
      "Join or create groups with friends for accountability.",
      "See how your circle members are progressing.",
      "Compete together and motivate each other!",
    ],
  },
  challenges: {
    title: "1v1 Challenges",
    content: [
      "Challenge friends to friendly competitions.",
      "Set a time period and see who earns more points.",
      "Great for extra motivation and friendly rivalry!",
    ],
  },
  dueDates: {
    title: "Due Dates",
    content: [
      "Set deadlines for important one-time tasks.",
      "Recurring due dates auto-renew after completion.",
      "Late tasks can have point penalties to stay accountable.",
    ],
  },
  todos: {
    title: "To-Do Lists",
    content: [
      "Daily and weekly to-do items for non-recurring tasks.",
      "These sync across all your devices automatically.",
      "Perfect for one-off items that don't repeat.",
    ],
  },
  fitness: {
    title: "Fitness Tracking",
    content: [
      "Log your workouts and physical activities.",
      "Track different exercise types and durations.",
      "Earn points for staying active!",
    ],
  },
  github: {
    title: "GitHub Integration",
    content: [
      "Connect your GitHub to track coding contributions.",
      "Earn points for commits, pull requests, and more.",
      "Great for developers building consistent coding habits.",
    ],
  },
  journal: {
    title: "Journal",
    content: [
      "Write daily reflections and notes.",
      "Track your thoughts, wins, and lessons learned.",
      "Build self-awareness alongside your habits.",
    ],
  },
  insights: {
    title: "Insights",
    content: [
      "View charts and stats about your progress.",
      "See trends, streaks, and patterns in your habits.",
      "Use data to understand what's working best.",
    ],
  },
  badges: {
    title: "Badges",
    content: [
      "Unlock achievements for hitting milestones.",
      "Badges are permanent rewards for your accomplishments.",
      "Collect them all to show your dedication!",
    ],
  },
  posts: {
    title: "Posts",
    content: [
      "Share updates and wins with your circles.",
      "React and comment on friends' posts.",
      "Celebrate progress together!",
    ],
  },
};
