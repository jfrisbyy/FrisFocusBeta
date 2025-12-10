import { useState, useEffect, useCallback } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth } from "@/lib/firebase";
import type { User } from "@shared/schema";

export function useAuth() {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Function to fetch user data from backend
  const fetchUserData = useCallback(async (fbUser: FirebaseUser) => {
    try {
      const idToken = await fbUser.getIdToken();
      const res = await fetch("/api/auth/user", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
      });
      
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
        return userData;
      } else {
        // User is authenticated with Firebase but not in our DB yet
        // Create/upsert user
        const upsertRes = await fetch("/api/auth/firebase", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${idToken}`,
            "Content-Type": "application/json",
          },
        });
        
        if (upsertRes.ok) {
          const userData = await upsertRes.json();
          setUser(userData);
          return userData;
        } else {
          setUser(null);
          return null;
        }
      }
    } catch (error) {
      console.error("Error syncing user:", error);
      setUser(null);
      return null;
    }
  }, []);

  // Refetch user data - call this after profile updates
  const refetchUser = useCallback(async () => {
    // Try to use existing firebaseUser first
    if (firebaseUser) {
      return fetchUserData(firebaseUser);
    }
    // Fallback: get current user from Firebase auth directly
    const currentUser = auth.currentUser;
    if (currentUser) {
      return fetchUserData(currentUser);
    }
    console.warn("refetchUser called but no Firebase user available");
    return null;
  }, [firebaseUser, fetchUserData]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      
      if (fbUser) {
        await fetchUserData(fbUser);
      } else {
        setUser(null);
      }
      
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [fetchUserData]);

  return {
    user,
    firebaseUser,
    isLoading,
    isAuthenticated: !!user,
    refetchUser,
  };
}
