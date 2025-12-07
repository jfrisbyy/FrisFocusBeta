import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import BoosterRuleConfig, { BoosterRule, defaultBoosterRule } from "./BoosterRuleConfig";

const taskFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  value: z.coerce.number().int("Must be a whole number"),
  category: z.string().min(1, "Category is required"),
  group: z.string().optional(),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

export interface TaskWithBooster extends TaskFormValues {
  boosterRule?: BoosterRule;
}

interface TaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: TaskWithBooster) => void;
  defaultValues?: Partial<TaskWithBooster>;
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
  const [boosterRule, setBoosterRule] = useState<BoosterRule>(
    defaultValues?.boosterRule || defaultBoosterRule
  );

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      name: "",
      value: 0,
      category: "",
      group: "",
      ...defaultValues,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: defaultValues?.name || "",
        value: defaultValues?.value || 0,
        category: defaultValues?.category || "",
        group: defaultValues?.group || "",
      });
      setBoosterRule(defaultValues?.boosterRule || defaultBoosterRule);
    }
  }, [open, defaultValues, form]);

  const taskName = form.watch("name");

  const handleSubmit = (values: TaskFormValues) => {
    onSubmit({
      ...values,
      boosterRule: boosterRule.enabled ? boosterRule : undefined,
    });
    form.reset();
    setBoosterRule(defaultBoosterRule);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 px-6 pb-4">
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
                    <Select onValueChange={field.onChange} value={field.value}>
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
              
              <BoosterRuleConfig
                rule={boosterRule}
                onChange={setBoosterRule}
                taskName={taskName}
              />

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" data-testid="button-submit-task">
                  Save Task
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
