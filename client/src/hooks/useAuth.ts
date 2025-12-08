import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading, isFetching, status } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/auth/user", { credentials: "include" });
        if (res.status === 401) {
          return null;
        }
        if (!res.ok) {
          return null;
        }
        return await res.json();
      } catch {
        return null;
      }
    },
    retry: false,
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  // Never block rendering - if query is taking too long or errored, show demo mode
  const shouldShowLoading = isLoading && isFetching && status === "pending";
  
  return {
    user: user ?? null,
    isLoading: shouldShowLoading,
    isAuthenticated: !!user,
  };
}
