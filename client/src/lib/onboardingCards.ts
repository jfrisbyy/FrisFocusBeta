export type OnboardingPage = "dashboard" | "tasks" | "daily" | "health" | "community" | "insights" | "journal" | "badges";

export type OnboardingTrigger = 
  | "immediate"
  | "seasonCreated"
  | "categoryCreated"
  | "taskCreated"
  | "penaltyCreated"
  | "todoCreated"
  | "daySaved"
  | "milestoneCreated"
  | "manual";

export interface OnboardingCard {
  id: number;
  page: OnboardingPage;
  title: string;
  content: string[];
  trigger?: OnboardingTrigger;
  showButtons?: {
    primary?: { text: string; action: "next" | "explore" | "navigate" | "complete"; navigateTo?: string };
    secondary?: { text: string; action: "next" | "skip" | "complete" };
  };
  highlightElement?: string;
}

export const onboardingCards: OnboardingCard[] = [
  {
    id: 1,
    page: "dashboard",
    title: "Welcome to FrisFocus",
    content: [
      "FrisFocus helps you organize your life around what actually matters — and follow through with structure, accountability, and visibility.",
      "This isn't about doing more. It's about doing what matters, consistently.",
      "You can start solo, or with others. You can keep things simple, or build something competitive. You can adjust anytime.",
      "There's no \"perfect\" setup — just one that fits you right now."
    ],
  },
  {
    id: 2,
    page: "dashboard",
    title: "Getting Started",
    content: [
      "This platform has a lot to offer and it might seem intimidating to start out, but don't worry! Let's get you comfortable around here so you can use this to its full potential!",
      "Start exploring now for a full walkthrough!",
      "If you'd like to come back to these at a later time, you can always find these cards by **clicking the question mark** under the settings gear."
    ],
    showButtons: {
      primary: { text: "Start Exploring", action: "explore" },
      secondary: { text: "Skip for now", action: "complete" }
    }
  },
  {
    id: 3,
    page: "dashboard",
    title: "Start Exploring",
    content: [
      "Great, you're ready to start exploring! Let's get started by opening up the tasks page — that will help make all of this make sense!",
      "Remember, this is a quick setup walkthrough — most people finish in about 5 minutes. You don't need to get it perfect and you can change anything later."
    ],
    showButtons: {
      primary: { text: "Go to Tasks", action: "navigate", navigateTo: "/tasks" }
    }
  },
  {
    id: 4,
    page: "tasks",
    title: "The Engine Behind Your Goals",
    content: [
      "This right here is the engine behind the person that you strive to be!",
      "All of the habits and routines that will keep you on track live here. Let's start by creating a season."
    ],
  },
  {
    id: 5,
    page: "tasks",
    title: "Understanding Seasons",
    content: [
      "Life doesn't stay static — your goals, responsibilities, and energy change over time. FrisFocus is built to move with you.",
      "A Season represents a phase of your life. You define what matters right now — without locking yourself into a single path.",
      "For example, your priorities and habits as a student will look much different than after you graduate. Both matter!",
      "**Click the + sign** in the Seasons card at the top of this page to create a season. Name it whatever you'd like and describe what this phase of your life represents."
    ],
    trigger: "seasonCreated",
    highlightElement: "button-add-season"
  },
  {
    id: 6,
    page: "tasks",
    title: "Season Created!",
    content: [
      "Nice, you just created your first season!",
      "When you feel your circumstances shifting, you can always create a new one. Don't worry — you'll still be able to look back on this season to reflect!"
    ],
    trigger: "immediate"
  },
  {
    id: 7,
    page: "tasks",
    title: "Building Your Task Library",
    content: [
      "Now, let's get some tasks on the board.",
      "Tasks represent actions you repeat regularly to support your current Season — like workouts, study sessions, journaling, recovery habits, or daily routines.",
      "They form the foundation of your consistency.",
      "Think about the type of person you'd like to be in 6 months, and ask yourself: what actions would I need to take consistently to achieve that goal? Those are the things you should be putting here."
    ],
  },
  {
    id: 8,
    page: "tasks",
    title: "Think Big and Small",
    content: [
      "You're not limited to a fixed number of tasks — create as many as make sense for you!",
      "Don't just think big. Feel free to add the micro habits that will help you along the way that you might not pay too much mind, for example brushing your teeth, or making your bed."
    ],
  },
  {
    id: 9,
    page: "tasks",
    title: "Organizing with Categories",
    content: [
      "We all have different responsibilities that we need to focus on at any given moment.",
      "Tasks are divided into categories to help you organize those items. Categories are fully customizable by you!",
      "Some common examples include: Health, Career, Spiritual, Social — but feel free to tailor them to anything that makes sense to you!",
      "Go ahead and make at least 2 different categories by **clicking on the + sign** within the category card."
    ],
    trigger: "categoryCreated",
    highlightElement: "button-add-category"
  },
  {
    id: 10,
    page: "tasks",
    title: "Understanding Priority Levels",
    content: [
      "Great! Stay with me — you've almost got the hang of this!",
      "Before we start building tasks, you should understand that tasks are also categorized into different priority systems:",
      "**mustDo**: Core actions that directly support your goals. Our system will alert you if you haven't done these tasks after 3 days.",
      "**shouldDo**: Helpful actions that strengthen progress. You'll be alerted if you go 10 days without logging these tasks.",
      "**couldDo**: Tasks that keep you balanced, but won't derail your goals if you skip them. Think of a fun activity or side project!"
    ],
    trigger: "immediate"
  },
  {
    id: 11,
    page: "tasks",
    title: "Understanding Scoring",
    content: [
      "Finally, you need to understand scoring.",
      "You will set both a daily personal point goal and a weekly personal point goal. Each task will be assigned points that roll up towards these goals as you complete them.",
      "This is your private system — designed to keep you aligned and intentional day to day.",
      "The default daily goal is 50, with a weekly goal of 350, but feel free to adjust this to a scale that makes sense for you!"
    ],
  },
  {
    id: 12,
    page: "tasks",
    title: "Scoring Tips",
    content: [
      "When scoring a task, keep in mind the scale of your goal!",
      "For example, if your daily goal is 50 points, it wouldn't make sense for one task to be worth 30 points — this could break your system.",
      "Remember to score tasks based on priority and how difficult it might be for you to complete.",
      "If fitness is a main priority and consistency in the gym has been an issue, this should be worth more points than something that is also important but might be easier for you."
    ],
  },
  {
    id: 13,
    page: "tasks",
    title: "Boosters and Penalties",
    content: [
      "When creating a task you can also add boosters and penalties, rewarding you for consistency!",
      "Using the previous example: if showing up in the gym consistently has been an issue, you could add a booster that says once you go to the gym 3 times in one week, you earn additional points!",
      "On the other hand, you could also say that if you don't go to the gym at least 1 time in a week, you lose points."
    ],
  },
  {
    id: 14,
    page: "tasks",
    title: "Create Your First Task",
    content: [
      "Now that you know all about tasks, go ahead and create your first task by **clicking on the green Add Task button** on this page!"
    ],
    trigger: "taskCreated",
    highlightElement: "button-add-task"
  },
  {
    id: 15,
    page: "tasks",
    title: "Task Created!",
    content: [
      "Great job!",
      "Don't worry — it can be hard sometimes to figure out exactly what tasks you need to properly position yourself.",
      "If you're feeling stuck, feel free to **click the Generate With AI button**. Our system will help you figure out exactly what you need to be focusing on to reach your goals!"
    ],
    trigger: "immediate"
  },
  {
    id: 16,
    page: "tasks",
    title: "Breaking Bad Habits",
    content: [
      "Got any bad habits you need to break? Or maybe distractions that you need to eliminate?",
      "Penalties allow you to hold yourself accountable — losing points for giving in and earning points for time spent without!",
      "Go ahead and think of one bad habit or distraction and **click the Create a Penalty button** underneath the task section."
    ],
    trigger: "penaltyCreated",
    highlightElement: "button-add-penalty"
  },
  {
    id: 17,
    page: "tasks",
    title: "Head to Daily",
    content: [
      "You're almost a pro at this point!",
      "Now let's head over to the Daily page on the top banner, right next to this Tasks page."
    ],
    trigger: "immediate",
    showButtons: {
      primary: { text: "Go to Daily", action: "navigate", navigateTo: "/daily" }
    }
  },
  {
    id: 18,
    page: "daily",
    title: "Your Daily Hub",
    content: [
      "You've created your task library — now this is where you keep track of how you're living.",
      "Every day you'll come here and log what tasks you've completed to earn your points.",
      "On this same page, you can also add your schedule for each day of the week, and even add a daily to-do list."
    ],
  },
  {
    id: 19,
    page: "daily",
    title: "Using To-Do Lists",
    content: [
      "To-do list items can be used however you'd like.",
      "Some people use it to organize which task items they'll be completing that day, while others use it to add one-off items that might not be part of your routine but still need to get done.",
      "Think \"Dentist appointment\" or \"Grocery shopping\".",
      "Go ahead and create one to-do item for today — whatever you'd like! **Click the + button** in the To-Do section."
    ],
    trigger: "todoCreated",
    highlightElement: "button-add-todo"
  },
  {
    id: 20,
    page: "daily",
    title: "To-Do Created!",
    content: [
      "Oh, you're getting the hang of this now!",
      "So now that you've got a task and a to-do list item, once you complete them, you would come to this page, click on them, and **save your day** to lock your points in!"
    ],
    trigger: "immediate"
  },
  {
    id: 21,
    page: "daily",
    title: "Journal Notes",
    content: [
      "On this page you can also add a journal note that will show up directly on the journal page!",
      "Go ahead — write how you're feeling right now and **click Save Day**. Don't forget to check off your first task or to-do list item if you've completed it!"
    ],
    trigger: "daySaved",
  },
  {
    id: 22,
    page: "daily",
    title: "Great Progress!",
    content: [
      "Wow, I'm impressed — you're picking this up fast!",
      "Now that you've got this system figured out, let's navigate back to the dashboard."
    ],
    trigger: "immediate",
    showButtons: {
      primary: { text: "Go to Dashboard", action: "navigate", navigateTo: "/" }
    }
  },
  {
    id: 23,
    page: "dashboard",
    title: "Your Dashboard Hub",
    content: [
      "You've got a lot of knowledge now, so this page should make more sense.",
      "This is your hub to view your progress easily. Here you can track how close you are to hitting your weekly point goal, the breakdown of what you did each day of the week, your streak, and even the alert system for tasks you need to complete."
    ],
  },
  {
    id: 24,
    page: "dashboard",
    title: "Milestones & More",
    content: [
      "This page also allows you to add more items to organize your life, such as due dates, weekly to-do list items, and milestones.",
      "Go ahead — think about one major thing that you'd like to accomplish during this season of life and add it as a milestone. Don't forget to assign points to reward yourself once you complete it!",
      "**Click the + button** in the Milestones section to add your first milestone."
    ],
    trigger: "milestoneCreated",
    highlightElement: "button-add-milestone"
  },
  {
    id: 25,
    page: "dashboard",
    title: "Customize Your Dashboard",
    content: [
      "You're on your way to success!",
      "FrisFocus is designed to tailor to you and your needs, and this dashboard is no different!",
      "**Click on the settings gear** at the top of this page to explore some options. In there you can change colors, adjust your welcome message, decide what cards you'd like to see, and even adjust the order in which you view them!"
    ],
    trigger: "immediate",
    highlightElement: "button-dashboard-settings"
  },
  {
    id: 26,
    page: "dashboard",
    title: "You're All Set!",
    content: [
      "Now you've got all of the basics down, but we've got more!",
      "With FrisFocus you can keep track of your health and fitness, earn Focus Points and Badges, chat with your own personal AI assistant tailored to you and your own goals, compete with friends and motivate each other to achieve your goals, and even post updates on your thoughts or progress to the rest of this community!",
      "Finish your onboarding journey to explore these other features, or go ahead and get started on your journey now!"
    ],
    showButtons: {
      primary: { text: "Finish Onboarding", action: "navigate", navigateTo: "/health" },
      secondary: { text: "Start My Journey", action: "complete" }
    }
  },
  {
    id: 27,
    page: "health",
    title: "Your Health Hub",
    content: [
      "This is your all inclusive Health hub!",
      "Whether you are trying to lose weight, gain weight, or just maintain, our comprehensive system is designed to figure out the best plan for you.",
      "FrisFocus meets you where you are and grows with you as your fitness goals evolve."
    ],
  },
  {
    id: 28,
    page: "health",
    title: "Track Your Nutrition",
    content: [
      "Keep track of your nutrition by **logging meals**, **manually entering macros**, by asking our AI system to estimate by giving a detailed description of your meal, or get an estimate by just **snapping a photo**!"
    ],
  },
  {
    id: 29,
    page: "health",
    title: "Workouts & Progress",
    content: [
      "Build custom workout routines aligned to your goals and track every gym session.",
      "Athletes can log practice sessions and games to watch progress over time.",
      "Runners can track all their runs — whether on the track, trail, or treadmill!",
      "Consistently **log your weight** to make sure that you are on pace to hit your goals."
    ],
  },
  {
    id: 30,
    page: "community",
    title: "Community Page",
    content: [
      "FrisFocus works solo — but becomes more powerful with others.",
      "The community page is your hub for checking in on friends and their progress, and holding each other accountable!"
    ],
  },
  {
    id: 31,
    page: "community",
    title: "Friends: Shared Progress, Personal Support",
    content: [
      "FrisFocus lets you add friends to share progress, stay connected, and support each other along the way — without distracting from your personal system.",
      "Friends don't change your goals. They make consistency easier."
    ],
  },
  {
    id: 32,
    page: "community",
    title: "Sharing Progress",
    content: [
      "When you add friends, you can choose to share what you would like, including task completions, streaks and milestones, progress updates, and fitness data.",
      "Your structure stays personal — visibility is optional and intentional. Not all friends need the same level of visibility."
    ],
  },
  {
    id: 33,
    page: "community",
    title: "Circles",
    content: [
      "Circles are shared spaces where progress is visible and accountability is mutual, transforming goals into shared commitments.",
      "Instead of everyone working alone, members follow a common task list and build consistency together.",
      "Perfect for teams, friends, or families who want accountability to feel collaborative — not forced."
    ],
  },
  {
    id: 34,
    page: "community",
    title: "Awards & Badges in Circles",
    content: [
      "Within a Circle, you can create Awards and Badges to recognize progress and contribution.",
      "Awards and Badges help turn shared effort into something tangible — without losing the focus on growth.",
      "You can tie real life rewards to them if it makes sense for your circle!"
    ],
  },
  {
    id: 35,
    page: "community",
    title: "Competition",
    content: [
      "Go 1v1 with a friend, or compete Circle vs Circle, where groups follow the same task structure and progress is tracked collectively.",
      "It's friendly pressure, designed to push everyone forward."
    ],
  },
  {
    id: 36,
    page: "community",
    title: "Feed: Shared Progress, Not Noise",
    content: [
      "The Feed is a simple space to share progress, reflections, and wins with the FrisFocus community.",
      "It's not about likes or performance — it's about visibility, encouragement, and momentum.",
      "Posts can be quick or thoughtful — whatever fits the moment."
    ],
  },
  {
    id: 37,
    page: "insights",
    title: "Insights: Your Personal AI Assistant",
    content: [
      "Insights is your personal AI assistant — built around your data and your goals.",
      "It analyzes patterns across your tasks, habits, streaks, and seasons to help you understand what's working, what's not, and where small changes can make the biggest difference.",
      "Think of it as a reflective partner that helps you spot trends, stay aligned, and make smarter decisions — without guessing."
    ],
  },
  {
    id: 38,
    page: "insights",
    title: "Customize Your Insights Assistant",
    content: [
      "Your Insights assistant isn't one-size-fits-all — you can shape how it works for you.",
      "By **clicking the settings gear**, you can give it instructions about: how you like feedback delivered, what you want it to prioritize (discipline, balance, flexibility, performance), how strict or supportive you want it to be, and personal context that helps it understand you better.",
      "The more you guide it, the better it reflects your values, goals, and preferences."
    ],
  },
  {
    id: 39,
    page: "journal",
    title: "Journal: Reflection That Connects the Dots",
    content: [
      "The Journal is a space to capture thoughts, reflections, and check-ins as you move through your days.",
      "It's designed to help you slow down, make sense of your progress, and notice patterns that aren't always visible in the moment.",
      "Entries can be quick notes, honest reflections, lessons learned, moments worth remembering — whatever you need it to be!",
      "Your journal stays personal — but it works alongside your tasks, seasons, and insights to give your growth context."
    ],
  },
  {
    id: 40,
    page: "badges",
    title: "Badges: Proof of Consistency",
    content: [
      "Badges represent moments of earned consistency and follow-through. They're not about perfection — they mark effort, commitment, and showing up over time.",
      "Badges are awarded for: sustained habits, meaningful streaks, milestones reached, and growth across a Season.",
      "They serve as quiet proof of the work you've put in — and reminders of what you're capable of when you stay consistent."
    ],
  },
  {
    id: 41,
    page: "dashboard",
    title: "You're All Set!",
    content: [
      "Congratulations, you've officially completed your onboarding journey!",
      "You've got the basics down. You've been introduced to the system, but the real value comes from taking time to shape it around your life.",
      "Explore, adjust, and build it out at your own pace. We'll be here as you make it yours."
    ],
    showButtons: {
      primary: { text: "Start My Journey", action: "complete" }
    }
  },
];

export const keepLearningCards = [1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41];
export const exploringCards = onboardingCards.map(c => c.id);

export function getCardById(id: number): OnboardingCard | undefined {
  return onboardingCards.find(c => c.id === id);
}

export function getCardsForPage(page: OnboardingPage): OnboardingCard[] {
  return onboardingCards.filter(c => c.page === page);
}

export function getOnboardingContentForAI(): string {
  return onboardingCards.map(card => {
    const content = card.content.join("\n");
    return `Card ${card.id} (${card.page}): ${card.title}\n${content}`;
  }).join("\n\n---\n\n");
}
