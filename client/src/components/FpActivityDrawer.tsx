import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Flame, Plus } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import type { FpActivityLog } from "@shared/schema";

interface FpActivityDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function FpActivityDrawer({ open, onOpenChange }: FpActivityDrawerProps) {
  const { data: activities, isLoading } = useQuery<FpActivityLog[]>({
    queryKey: ["/api/fp/activity"],
    enabled: open,
  });

  const { data: fpData } = useQuery<{ fpTotal: number }>({
    queryKey: ["/api/fp"],
    enabled: open,
  });

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="border-b">
          <div className="flex items-center justify-between gap-4">
            <DrawerTitle className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              Focus Points Activity
            </DrawerTitle>
            <Badge variant="secondary" className="font-mono">
              {fpData?.fpTotal?.toLocaleString() || 0} FP
            </Badge>
          </div>
        </DrawerHeader>

        <ScrollArea className="flex-1 px-4 py-4 max-h-[60vh]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              Loading activity...
            </div>
          ) : !activities || activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Flame className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">No FP activity yet</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Complete tasks and achievements to earn Focus Points
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-md bg-muted/30"
                  data-testid={`fp-activity-${activity.id}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-orange-500/10 shrink-0">
                      <Plus className="h-4 w-4 text-orange-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {activity.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.createdAt && formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="font-mono shrink-0">
                    +{activity.fpAmount}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );
}
