import BoostersPanel from "../BoostersPanel";

// todo: remove mock functionality
const mockBoosters = [
  {
    id: "booster_5of7_tracking",
    name: "5 of 7 Tracking",
    description: "Log at least 5 days this week",
    points: 10,
    achieved: true,
    icon: "tracking" as const,
  },
  {
    id: "booster_finish_bible_book",
    name: "Finish Bible Book",
    description: "Complete a book of the Bible",
    points: 10,
    achieved: false,
    icon: "bible" as const,
  },
  {
    id: "booster_3days_lifting",
    name: "3 Days Lifting",
    description: "Hit the gym at least 3 days",
    points: 10,
    achieved: true,
    icon: "lifting" as const,
  },
];

export default function BoostersPanelExample() {
  return <BoostersPanel boosters={mockBoosters} />;
}
