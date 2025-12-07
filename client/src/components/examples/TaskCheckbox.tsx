import { useState } from "react";
import TaskCheckbox from "../TaskCheckbox";

export default function TaskCheckboxExample() {
  const [checked1, setChecked1] = useState(true);
  const [checked2, setChecked2] = useState(false);
  const [checked3, setChecked3] = useState(false);

  return (
    <div className="space-y-1 max-w-md">
      <TaskCheckbox
        id="task-1"
        name="Morning workout"
        value={15}
        checked={checked1}
        isBooster
        onChange={setChecked1}
      />
      <TaskCheckbox
        id="task-2"
        name="Read 30 minutes"
        value={10}
        checked={checked2}
        onChange={setChecked2}
      />
      <TaskCheckbox
        id="task-3"
        name="Ate junk food"
        value={-10}
        checked={checked3}
        onChange={setChecked3}
      />
    </div>
  );
}
