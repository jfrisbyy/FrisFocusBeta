import BoostersPanel from "../BoostersPanel";

// todo: remove mock functionality
const mockSystemBoosters = [
  {
    id: "booster_5of7_tracking",
    name: "5 of 7 Tracking",
    description: "Log at least 5 days this week",
    points: 10,
    achieved: true,
    icon: "tracking" as const,
    type: "system" as const,
  },
  {
    id: "booster_finish_bible_book",
    name: "Finish Bible Book",
    description: "Complete a book of the Bible",
    points: 10,
    achieved: false,
    icon: "bible" as const,
    type: "system" as const,
  },
  {
    id: "booster_3days_lifting",
    name: "3 Days Lifting",
    description: "Hit the gym at least 3 days",
    points: 10,
    achieved: true,
    icon: "lifting" as const,
    type: "system" as const,
  },
];

const mockCustomBoosters = [
  {
    id: "custom-1",
    taskName: "Read 30 minutes",
    timesRequired: 4,
    timesCompleted: 3,
    period: "week" as const,
    bonusPoints: 20,
    achieved: false,
    type: "custom" as const,
  },
  {
    id: "custom-2",
    taskName: "Morning workout",
    timesRequired: 5,
    timesCompleted: 5,
    period: "week" as const,
    bonusPoints: 15,
    achieved: true,
    type: "custom" as const,
  },
];

export default function BoostersPanelExample() {
  return (
    <div className="max-w-md">
      <BoostersPanel 
        systemBoosters={mockSystemBoosters}
        customBoosters={mockCustomBoosters}
      />
    </div>
  );
}
