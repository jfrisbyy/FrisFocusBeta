import { useState } from "react";
import { Button } from "@/components/ui/button";
import TaskForm from "../TaskForm";

export default function TaskFormExample() {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <Button onClick={() => setOpen(true)} data-testid="button-open-form">
        Open Task Form
      </Button>
      <TaskForm
        open={open}
        onOpenChange={setOpen}
        onSubmit={(values) => {
          console.log("Task submitted:", values);
        }}
      />
    </div>
  );
}
