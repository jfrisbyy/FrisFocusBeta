import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const taskFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  value: z.coerce.number().int("Must be a whole number"),
  category: z.string().min(1, "Category is required"),
  group: z.string().optional(),
  isBooster: z.boolean().default(false),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

interface TaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: TaskFormValues) => void;
  defaultValues?: Partial<TaskFormValues>;
  title?: string;
  categories?: string[];
}

const defaultCategories = ["Health", "Productivity", "Spiritual", "Social", "Finance", "Penalties"];

export default function TaskForm({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  title = "Add Task",
  categories = defaultCategories,
}: TaskFormProps) {
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      name: "",
      value: 0,
      category: "",
      group: "",
      isBooster: false,
      ...defaultValues,
    },
  });

  const handleSubmit = (values: TaskFormValues) => {
    onSubmit(values);
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Morning workout" {...field} data-testid="input-task-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Point Value</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g., 15 or -10"
                      {...field}
                      data-testid="input-task-value"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-category">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="group"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Group (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Morning Routine" {...field} data-testid="input-task-group" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isBooster"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <FormLabel className="text-base">Booster Task</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      This task contributes to booster achievements
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="switch-booster"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" data-testid="button-submit-task">
                Save Task
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
