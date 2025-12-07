import PointsCard from "../PointsCard";

export default function PointsCardExample() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <PointsCard weekTotal={485} weekRange="Dec 2 - Dec 8" boosterPoints={30} />
      <PointsCard weekTotal={320} weekRange="Dec 2 - Dec 8" boosterPoints={10} />
      <PointsCard weekTotal={180} weekRange="Dec 2 - Dec 8" />
    </div>
  );
}
