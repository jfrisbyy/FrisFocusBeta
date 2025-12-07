import WeeklyTable from "../WeeklyTable";

// todo: remove mock functionality
const mockDays = [
  { date: "Dec 2", dayName: "Mon", points: 72 },
  { date: "Dec 3", dayName: "Tue", points: 45 },
  { date: "Dec 4", dayName: "Wed", points: 68 },
  { date: "Dec 5", dayName: "Thu", points: 25 },
  { date: "Dec 6", dayName: "Fri", points: 55 },
  { date: "Dec 7", dayName: "Sat", points: null },
  { date: "Dec 8", dayName: "Sun", points: null },
];

export default function WeeklyTableExample() {
  return (
    <WeeklyTable
      days={mockDays}
      onDayClick={(date) => console.log("Navigate to:", date)}
    />
  );
}
