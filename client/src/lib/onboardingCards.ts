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
  | "goalSet"
  | "manual";

export type SkipCheckKey = 
  | "hasSeasons"
  | "hasCategories"
  | "hasTasks"
  | "hasPenalties"
  | "hasTodos"
  | "hasDaySaved"
  | "hasMilestones"
  | "hasGoalSet";

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
  skipCheck?: SkipCheckKey;
}

export const onboardingCards: OnboardingCard[] = [
  // ==================== MAIN ONBOARDING FLOW (Cards 1-25) ====================
  // Dashboard Intro (Cards 1-3)
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
      "There's a lot here, and you don't need to learn it all at once.",
      "You can flip through the remaining cards, or start exploring right away and learn as you go. Helpful guidance will appear as you move around the app, and you can always come back to these cards anytime from the question mark under the settings gear."
    ],
    showButtons: {
      primary: { text: "Start Exploring", action: "explore" },
      secondary: { text: "Keep Learning", action: "next" }
    }
  },
  {
    id: 3,
    page: "dashboard",
    title: "Start Exploring",
    content: [
      "You're ready to start exploring.",
      "We'll begin on the Tasks page, where the structure behind everything else lives.",
      "This setup is designed to be quick. Most people finish in about five minutes, and nothing needs to be perfect — you can always adjust things later."
    ],
    showButtons: {
      primary: { text: "Go to Tasks", action: "navigate", navigateTo: "/tasks" }
    }
  },

  // Tasks Page (Cards 4-16)
  {
    id: 4,
    page: "tasks",
    title: "This is Where Your Structure Lives",
    content: [
      "Tasks hold the habits, routines, and commitments that support the direction you're working toward.",
      "Let's start by creating a season — a defined phase of focus that gives everything context."
    ],
  },
  {
    id: 5,
    page: "tasks",
    title: "Understanding Seasons",
    content: [
      "Life doesn't stay static — your goals, responsibilities, and energy change over time. FrisFocus is built to move with you.",
      "A Season represents a phase of your life. You define what matters right now — without locking yourself into a single path.",
      "For example, your priorities and the habits that build you up as a student will look much different than the priorities that you would need after you graduate. Both matter!",
      "You can create a season at any time from the banner at the top of this page.",
      "Let's start one now — give it a name and use the description to capture what this phase of your life looks like or what you're focusing on."
    ],
    trigger: "seasonCreated",
    highlightElement: "button-add-season",
    skipCheck: "hasSeasons"
  },
  {
    id: 6,
    page: "tasks",
    title: "Season Created!",
    content: [
      "Nice work — you've created your first season.",
      "When your priorities or circumstances shift, you can always create a new one.",
      "Don't worry — past seasons are saved so you can look back, reflect, and see how you've grown over time."
    ],
    trigger: "immediate"
  },
  {
    id: 7,
    page: "tasks",
    title: "Now Let's Add Some Tasks",
    content: [
      "Tasks represent actions you repeat regularly to support your current season — things like workouts, study sessions, journaling, recovery habits, or daily routines.",
      "They form the foundation of consistency. Think about the person you want to be six months from now, and ask yourself: What actions would I need to take consistently to get there?",
      "Those actions belong here."
    ],
  },
  {
    id: 8,
    page: "tasks",
    title: "No Fixed Number of Tasks",
    content: [
      "There's no fixed number of tasks.",
      "Create as many as make sense for you. Along with bigger habits, don't overlook the small, repeatable actions that keep your days running smoothly — things you might not normally think to track.",
      "Consistency is often built on the basics."
    ],
  },
  {
    id: 9,
    page: "tasks",
    title: "Organizing with Categories",
    content: [
      "Tasks are organized using categories.",
      "Categories help you group responsibilities based on different areas of your life. They're fully customizable — common examples include health, career, spiritual, or social — but you can tailor them however you'd like.",
      "Go ahead and create your first category by clicking the + icon in the category card."
    ],
    trigger: "categoryCreated",
    highlightElement: "button-add-category",
    skipCheck: "hasCategories"
  },
  {
    id: 10,
    page: "tasks",
    title: "Understanding Priority Levels",
    content: [
      "Tasks also have priority levels. This helps the system understand what matters most right now.",
      "**Must Do**: Core actions that directly support your goals. You'll be alerted if these aren't logged after three days.",
      "**Should Do**: Helpful actions that strengthen progress. You'll be alerted if you go ten days without logging them.",
      "**Could Do**: Supportive actions that add balance but won't derail progress if missed. These are often things you enjoy or personal side projects."
    ],
    trigger: "immediate"
  },
  {
    id: 11,
    page: "tasks",
    title: "Understanding Scoring",
    content: [
      "Finally, let's talk about scoring.",
      "You'll set a personal daily point goal and weekly point goal. Each task is assigned points that roll up toward these goals as you complete them.",
      "This is a private system designed to help you stay intentional and aware day to day.",
      "The default is 50 points per day and 350 points per week, but you're encouraged to adjust the scale as you get more comfortable and tailor it to what feels realistic for you."
    ],
  },
  {
    id: 12,
    page: "tasks",
    title: "Scoring Tips",
    content: [
      "When assigning points to a task, think in context of your overall goal.",
      "If your daily target is 50 points, a single task probably shouldn't be worth 30 — that can throw off the balance of your system.",
      "Score tasks based on both priority and difficulty. Tasks that directly support your main focus — especially ones you know are harder for you to stay consistent with — should be worth more. Tasks that matter but come more easily can be scored lower."
    ],
  },
  {
    id: 13,
    page: "tasks",
    title: "Boosters and Penalties",
    content: [
      "Tasks can also include boosters and penalties to reinforce consistency.",
      "Boosters reward patterns you want to build — for example, earning extra points when you complete a task multiple times within a set period.",
      "Penalties work the opposite way, helping you notice when something important is being avoided or skipped. Both are optional tools meant to support awareness and follow-through, not perfection."
    ],
  },
  {
    id: 14,
    page: "tasks",
    title: "Create Your First Task",
    content: [
      "Now that you're familiar with tasks, let's create your first one.",
      "Click the green New Task button on this page to get started. You can fill everything out manually or have the system guide you through it step by step."
    ],
    trigger: "taskCreated",
    highlightElement: "button-add-task",
    skipCheck: "hasTasks"
  },
  {
    id: 15,
    page: "tasks",
    title: "Task Created!",
    content: [
      "Nice work.",
      "Figuring out the right tasks can take some thought — that's normal. If you're feeling unsure or stuck, you can use the Generate with AI button for help identifying what's worth focusing on based on your goals!"
    ],
    trigger: "immediate"
  },
  {
    id: 16,
    page: "tasks",
    title: "Breaking Bad Habits",
    content: [
      "Have any habits or distractions you want to reduce?",
      "Penalties are a way to bring awareness and accountability to things you're working on changing. You can lose points when a habit shows up — and earn points for time spent without it.",
      "Take a moment to think of one habit or distraction, then click Create a Penalty under the tasks section to get started."
    ],
    trigger: "penaltyCreated",
    highlightElement: "button-add-penalty",
    skipCheck: "hasPenalties"
  },
  {
    id: 17,
    page: "tasks",
    title: "Head to Daily",
    content: [
      "Nice progress so far.",
      "Let's move to the Daily page using the top banner, right next to Tasks."
    ],
    trigger: "immediate",
    showButtons: {
      primary: { text: "Go to Daily", action: "navigate", navigateTo: "/daily" }
    }
  },

  // Daily Page (Cards 18-22)
  {
    id: 18,
    page: "daily",
    title: "Your Daily Hub",
    content: [
      "Now that you've created your task library, each day, you'll come here to log the tasks you completed and track how you're actually spending your time."
    ],
  },
  {
    id: 19,
    page: "daily",
    title: "Daily Schedules",
    content: [
      "You can assign a schedule to each day. Create different schedule templates — like workdays, rest days, travel days, or weekends — and apply them as needed.",
      "This helps your tasks match the reality of your day instead of forcing one routine onto every day."
    ],
  },
  {
    id: 20,
    page: "daily",
    title: "Using To-Do Lists",
    content: [
      "To-do list items are flexible and optional.",
      "Some people use them to organize which tasks they plan to complete that day, while others use them for one-off items that don't belong in their regular routine — things like a dentist appointment or grocery shopping.",
      "You can assign points to to-do items if you'd like, or even attach penalties if something important is skipped. Just be mindful not to double-count points — if a to-do item is already tracked as a task, scoring both can inflate your totals.",
      "If something doesn't get finished, you can also import incomplete items from yesterday into today, so nothing gets lost.",
      "Go ahead and create one to-do item for today — whatever makes sense for you."
    ],
    trigger: "todoCreated",
    highlightElement: "button-add-todo",
    skipCheck: "hasTodos"
  },
  {
    id: 21,
    page: "daily",
    title: "Log As You Go",
    content: [
      "This page is where you log as you go.",
      "As you complete tasks or to-do items throughout the day, you can check them off here at any time.",
      "When you're ready — whether that's immediately or later — click Save Day to record your progress and lock in your points. You can always come back and update things as needed."
    ],
    trigger: "immediate"
  },
  {
    id: 22,
    page: "daily",
    title: "Journal Notes",
    content: [
      "You can also add a journal note from here.",
      "Anything you write will appear directly in your journal — whether it's how you're feeling, a reflection on the day, or a quick check-in.",
      "Go ahead and write a short note, check off a task or to-do if you've completed one, and click Save Day when you're ready."
    ],
    trigger: "daySaved",
    skipCheck: "hasDaySaved"
  },
  {
    id: 23,
    page: "daily",
    title: "Foundation Complete!",
    content: [
      "You've got the foundation down.",
      "Now let's head back to the Dashboard — this is where everything you've set up starts to come together."
    ],
    trigger: "immediate",
    showButtons: {
      primary: { text: "Go to Dashboard", action: "navigate", navigateTo: "/" }
    }
  },

  // Dashboard Final (Cards 24-26)
  {
    id: 24,
    page: "dashboard",
    title: "Your Dashboard Hub",
    content: [
      "The dashboard is your high-level view.",
      "It brings everything together so you can quickly see how you're doing — including progress toward your weekly point goal, a breakdown of each day, your current streak, and alerts for tasks that still need attention."
    ],
  },
  {
    id: 25,
    page: "dashboard",
    title: "Plan Ahead",
    content: [
      "The dashboard lets you add due dates, weekly to-do items, and milestones to organize what you're working toward.",
      "Due dates are for fixed obligations with real deadlines — things like rent, credit card payments, or important submissions. They help make sure nothing critical slips through the cracks.",
      "Weekly to-do items are for things that need to get done at some point during the week, but don't need to be tied to a specific day yet.",
      "Milestones represent the major outcomes and goals you want to achieve during this season. These are the bigger accomplishments you're working toward over time.",
      "Think of one meaningful milestone for this season and add it here. When you complete it, you can reward yourself with points that reflect the effort it took."
    ],
    trigger: "milestoneCreated",
    highlightElement: "button-add-milestone",
    skipCheck: "hasMilestones"
  },
  {
    id: 26,
    page: "dashboard",
    title: "Customize Your Dashboard",
    content: [
      "This dashboard is meant to adapt to you.",
      "Use the settings gear at the top of the page to customize how it looks and works. You can adjust colors, update your welcome message, choose which cards appear, and even change their order — so your dashboard reflects what matters most to you."
    ],
    trigger: "immediate",
    highlightElement: "button-dashboard-settings"
  },
  {
    id: 27,
    page: "dashboard",
    title: "You're All Set!",
    content: [
      "You've got the foundation in place.",
      "From here, you can explore FrisFocus naturally. As you move to different pages, short walkthroughs will appear when needed to help you understand each feature in context.",
      "Use the system at your own pace — the more you engage with it, the more value it provides over time."
    ],
    showButtons: {
      primary: { text: "Start My Journey", action: "complete" }
    }
  },

  // ==================== PAGE-SPECIFIC WALKTHROUGHS ====================
  // These trigger automatically on first page visit after main onboarding

  // Health Page (Cards 28-32)
  {
    id: 28,
    page: "health",
    title: "Your Health Hub",
    content: [
      "This is your all inclusive Health hub!",
      "Whether you are trying to lose weight, gain weight, or just maintain, our comprehensive system is designed to figure out the best plan for you.",
      "FrisFocus meets you where you are and grows with you as your fitness goals evolve."
    ],
  },
  {
    id: 29,
    page: "health",
    title: "Start by Choosing Your Goal",
    content: [
      "Whether you're maintaining, losing weight, or gaining weight, pick what you're working toward — we'll handle the calculations and help you decide what to do next."
    ],
  },
  {
    id: 30,
    page: "health",
    title: "Track Nutrition",
    content: [
      "Now that your goal is set, it's time to track nutrition.",
      "Log meals manually, enter macros, describe your meal, or snap a photo to estimate calories — keep everything organized in one place to easily keep track of your progress."
    ],
  },
  {
    id: 31,
    page: "health",
    title: "Log Training & Track Progress",
    content: [
      "Create workout routines aligned to your goals and log gym sessions, practices, games, or runs — then track weight over time to see if you're staying on pace."
    ],
  },
  {
    id: 32,
    page: "health",
    title: "Connect the Dots",
    content: [
      "Your caloric delta is the balance between what you eat and how much you move. FrisFocus uses it to show whether you're trending toward your goal — without forcing daily perfection.",
      "You can log activity burn manually, or let the system estimate it by briefly describing your workout, practice, or session."
    ],
  },

  // Community Page (Cards 33-39)
  {
    id: 33,
    page: "community",
    title: "Community",
    content: [
      "FrisFocus works solo — but becomes more powerful with others.",
      "The community page is your hub for checking in on friends and their progress, and holding each other accountable!"
    ],
  },
  {
    id: 34,
    page: "community",
    title: "Friends: Shared Progress, Personal Support",
    content: [
      "FrisFocus lets you add friends to share progress, stay connected, and support each other along the way — without distracting from your personal system.",
      "Friends don't change your goals. They make consistency easier."
    ],
  },
  {
    id: 35,
    page: "community",
    title: "Sharing Progress",
    content: [
      "When you add friends, you can choose to share what you would like, including task completions, streaks and milestones, progress updates, and fitness data.",
      "Your structure stays personal — visibility is optional and intentional. Not all friends need the same level of visibility."
    ],
  },
  {
    id: 36,
    page: "community",
    title: "Circles",
    content: [
      "Circles are shared spaces where progress is visible and accountability is mutual, transforming goals into shared commitments.",
      "Instead of everyone working alone, members follow a common task list and build consistency together.",
      "Perfect for teams, friends, or families who want accountability to feel collaborative — not forced."
    ],
  },
  {
    id: 37,
    page: "community",
    title: "Awards & Badges in Circles",
    content: [
      "Within a Circle, you can create Awards and Badges to recognize progress and contribution.",
      "Awards and Badges help turn shared effort into something tangible — without losing the focus on growth.",
      "You can tie real life rewards to them if it makes sense for your circle!"
    ],
  },
  {
    id: 38,
    page: "community",
    title: "Competition",
    content: [
      "Go 1v1 with a friend, or compete Circle vs Circle, where groups follow the same task structure and progress is tracked collectively.",
      "It's friendly pressure, designed to push everyone forward."
    ],
  },
  {
    id: 39,
    page: "community",
    title: "Feed: Shared Progress, Not Noise",
    content: [
      "The Feed is a simple space to share progress, reflections, and wins with the FrisFocus community.",
      "It's not about likes or performance — it's about visibility, encouragement, and momentum.",
      "Posts can be quick or thoughtful — whatever fits the moment."
    ],
  },

  // Insights Page (Cards 40-41)
  {
    id: 40,
    page: "insights",
    title: "Insights: Your Personal Assistant",
    content: [
      "Insights is your personal assistant, grounded in your data and your goals.",
      "It looks across your tasks, habits, streaks, and seasons to help you understand what's working, what's getting in the way, and where small changes can make the biggest difference.",
      "Think of it as a reflective partner that helps you spot patterns, stay aligned over time, and make clearer decisions — without guessing or pressure."
    ],
  },
  {
    id: 41,
    page: "insights",
    title: "Customize Your Insights Assistant",
    content: [
      "Your Insights assistant isn't one-size-fits-all — you can shape how it works for you.",
      "By clicking the settings gear, you can give it instructions about: how you like feedback delivered, what you want it to prioritize (discipline, balance, flexibility, performance), how strict or supportive you want it to be, and personal context that helps it understand you better.",
      "The more you guide it, the better it reflects your values, goals, and preferences."
    ],
  },

  // Journal Page (Cards 42-43)
  {
    id: 42,
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
    id: 43,
    page: "journal",
    title: "Organize Your Reflections",
    content: [
      "Organize reflection in a way that works for you.",
      "Create folders to group related entries, and build custom trackers to log specific things over time — using templates you control.",
      "Trackers can be used for things like mood, energy, habits, symptoms, training notes, spiritual check-ins, creative progress, or anything else you want to notice consistently."
    ],
  },

  // Recognition/Badges Page (Cards 44-47)
  {
    id: 44,
    page: "badges",
    title: "Recognition",
    content: [
      "Recognition highlights the effort behind your progress.",
      "This page brings together focus points, personal badges, and global stamps to highlight outcomes, consistency, and milestones across your journey.",
      "It's designed to show what your effort led to, not just how busy you were."
    ],
  },
  {
    id: 45,
    page: "badges",
    title: "Focus Points",
    content: [
      "Focus points represent achieved outcomes.",
      "Unlike daily or weekly points — which reflect effort, activity, and follow-through — focus points are earned for results that matter across a longer horizon.",
      "They're awarded for things like reaching a milestone, staying consistent over time, winning a competition, completing a defined challenge, or supporting others in your circles.",
      "Focus points exist on a shared scale for everyone. Their purpose isn't to drive day-to-day behavior, but to reflect what your effort ultimately led to — and to give meaningful context to progress over time."
    ],
  },
  {
    id: 46,
    page: "badges",
    title: "Personal Badges",
    content: [
      "Badges are personal milestones you create for yourself.",
      "They're tied to your season, your tasks, and your definition of consistency — not a global standard.",
      "For example, you might create a badge for logging workouts 30 times, with levels that unlock as you continue (20 logs, 40 logs, and beyond). You can design these manually or let AI help generate badge ideas based on your task list.",
      "Badges are meant to make showing up visible — in a way that's motivating, flexible, and uniquely yours."
    ],
  },
  {
    id: 47,
    page: "badges",
    title: "Community Stamps",
    content: [
      "Community stamps are platform-wide achievements.",
      "Stamps are earned through fixed criteria that apply to everyone and are visible across the FrisFocus community.",
      "Stamps recognize major milestones — like completing hundreds of tasks, winning circle competitions, or reaching significant goals. Because the criteria are the same for all users, stamps carry shared meaning wherever they appear."
    ],
  },
];

// Main onboarding flow ends at card 27 - these are the core setup cards
export const mainOnboardingCards = onboardingCards.filter(c => c.id <= 27).map(c => c.id);

// Page-specific walkthrough cards (shown on first page visit after main onboarding)
export const pageWalkthroughCards: Record<OnboardingPage, number[]> = {
  dashboard: [], // No additional walkthrough needed - covered in main flow
  tasks: [], // No additional walkthrough needed - covered in main flow
  daily: [], // No additional walkthrough needed - covered in main flow
  health: [28, 29, 30, 31, 32],
  community: [33, 34, 35, 36, 37, 38, 39],
  insights: [40, 41],
  journal: [42, 43],
  badges: [44, 45, 46, 47],
};

// Legacy exports for compatibility
export const keepLearningCards = mainOnboardingCards;
export const exploringCards = mainOnboardingCards;

export function getCardById(id: number): OnboardingCard | undefined {
  return onboardingCards.find(c => c.id === id);
}

export function getCardsForPage(page: OnboardingPage): OnboardingCard[] {
  return onboardingCards.filter(c => c.page === page);
}

export function getPageWalkthroughCards(page: OnboardingPage): OnboardingCard[] {
  const cardIds = pageWalkthroughCards[page];
  return cardIds.map(id => getCardById(id)).filter((c): c is OnboardingCard => c !== undefined);
}

export function getOnboardingContentForAI(): string {
  return onboardingCards.map(card => {
    const content = card.content.join("\n");
    return `Card ${card.id} (${card.page}): ${card.title}\n${content}`;
  }).join("\n\n---\n\n");
}
