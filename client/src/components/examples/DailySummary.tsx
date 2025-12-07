import { useState } from "react";
import DailySummary from "../DailySummary";

export default function DailySummaryExample() {
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 1000);
    console.log("Saving day with notes:", notes);
  };

  return (
    <div className="max-w-xs">
      <DailySummary
        positivePoints={75}
        negativePoints={-15}
        notes={notes}
        onNotesChange={setNotes}
        onSave={handleSave}
        isSaving={isSaving}
      />
    </div>
  );
}
