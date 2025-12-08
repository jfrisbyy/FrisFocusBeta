import { useState, useEffect } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth } from "@/lib/firebase";
import type { User } from "@shared/schema";

export function useAuth() {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      
      if (fbUser) {
        try {
          // Get the ID token to send to backend
          const idToken = await fbUser.getIdToken();
          
          // Sync user with backend
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
            } else {
              setUser(null);
            }
          }
        } catch (error) {
          console.error("Error syncing user:", error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return {
    user,
    firebaseUser,
    isLoading,
    isAuthenticated: !!user,
  };
}
