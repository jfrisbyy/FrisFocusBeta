import { initializeApp, cert, getApps, getApp } from "firebase-admin/app";
import { getAuth, type DecodedIdToken } from "firebase-admin/auth";
import type { RequestHandler } from "express";
import { storage } from "./storage";

// Initialize Firebase Admin with project ID only (for ID token verification)
// Full admin SDK features would require a service account
const FIREBASE_PROJECT_ID = "frisfocus-f3e5f";

function getFirebaseApp() {
  if (getApps().length === 0) {
    return initializeApp({
      projectId: FIREBASE_PROJECT_ID,
    });
  }
  return getApp();
}

const app = getFirebaseApp();
const adminAuth = getAuth(app);

export async function verifyFirebaseToken(idToken: string): Promise<DecodedIdToken | null> {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error("Error verifying Firebase token:", error);
    return null;
  }
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const idToken = authHeader.substring(7);
  
  try {
    const decodedToken = await verifyFirebaseToken(idToken);
    
    if (!decodedToken) {
      return res.status(401).json({ message: "Invalid token" });
    }

    // Attach user claims to request
    (req as any).user = {
      claims: {
        sub: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name,
        picture: decodedToken.picture,
      },
      decodedToken,
    };

    return next();
  } catch (error) {
    console.error("Auth error:", error);
    return res.status(401).json({ message: "Unauthorized" });
  }
};

export async function upsertFirebaseUser(decodedToken: DecodedIdToken) {
  // Split name into first and last
  const nameParts = (decodedToken.name || "").split(" ");
  const firstName = nameParts[0] || null;
  const lastName = nameParts.slice(1).join(" ") || null;

  return await storage.upsertUser({
    id: decodedToken.uid,
    email: decodedToken.email || null,
    firstName,
    lastName,
    profileImageUrl: decodedToken.picture || null,
  });
}
