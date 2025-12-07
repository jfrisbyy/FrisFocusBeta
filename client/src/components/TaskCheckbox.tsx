import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TaskCheckboxProps {
  id: string;
  name: string;
  value: number;
  checked: boolean;
  isBooster?: boolean;
  onChange: (checked: boolean) => void;
}

export default function TaskCheckbox({
  id,
  name,
  value,
  checked,
  isBooster,
  onChange,
}: TaskCheckboxProps) {
  const isPositive = value > 0;

  return (
    <label
      htmlFor={id}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2.5 cursor-pointer hover-elevate active-elevate-2",
        checked && "bg-muted/50"
      )}
      data-testid={`task-checkbox-${id}`}
    >
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        className="h-5 w-5"
      />
      <span className={cn("flex-1 text-sm", checked && "text-muted-foreground line-through")}>
        {name}
      </span>
      {isBooster && (
        <Badge variant="outline" className="text-xs text-chart-2 border-chart-2/30">
          Booster
        </Badge>
      )}
      <span
        className={cn(
          "font-mono text-sm font-semibold",
          isPositive ? "text-chart-1" : "text-chart-3"
        )}
      >
        {isPositive ? `+${value}` : value}
      </span>
    </label>
  );
}
