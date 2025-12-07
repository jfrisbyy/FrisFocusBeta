import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import OpenAI from "openai";
import { db } from "./db";
import {
  nutritionLogs,
  bodyComposition,
  strengthWorkouts,
  skillWorkouts,
  basketballRuns,
  insertNutritionLogSchema,
  insertBodyCompositionSchema,
  insertStrengthWorkoutSchema,
  insertSkillWorkoutSchema,
  insertBasketballRunSchema,
} from "@shared/schema";

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // ==================== FITNESS API ROUTES ====================
  
  // Nutrition logs
  app.get("/api/fitness/nutrition", async (_req, res) => {
    try {
      const logs = await db.select().from(nutritionLogs);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching nutrition logs:", error);
      res.status(500).json({ error: "Failed to fetch nutrition logs" });
    }
  });

  app.post("/api/fitness/nutrition", async (req, res) => {
    try {
      const parsed = insertNutritionLogSchema.parse(req.body);
      const [log] = await db.insert(nutritionLogs).values(parsed).returning();
      res.json(log);
    } catch (error) {
      console.error("Error creating nutrition log:", error);
      res.status(400).json({ error: "Failed to create nutrition log" });
    }
  });

  // Body composition (endpoint: /api/fitness/body-comp)
  app.get("/api/fitness/body-comp", async (_req, res) => {
    try {
      const records = await db.select().from(bodyComposition);
      res.json(records);
    } catch (error) {
      console.error("Error fetching body composition:", error);
      res.status(500).json({ error: "Failed to fetch body composition" });
    }
  });

  app.post("/api/fitness/body-comp", async (req, res) => {
    try {
      const parsed = insertBodyCompositionSchema.parse(req.body);
      const [record] = await db.insert(bodyComposition).values(parsed).returning();
      res.json(record);
    } catch (error) {
      console.error("Error creating body composition:", error);
      res.status(400).json({ error: "Failed to create body composition" });
    }
  });

  // Strength workouts
  app.get("/api/fitness/strength", async (_req, res) => {
    try {
      const workouts = await db.select().from(strengthWorkouts);
      res.json(workouts);
    } catch (error) {
      console.error("Error fetching strength workouts:", error);
      res.status(500).json({ error: "Failed to fetch strength workouts" });
    }
  });

  app.post("/api/fitness/strength", async (req, res) => {
    try {
      const parsed = insertStrengthWorkoutSchema.parse(req.body);
      const [workout] = await db.insert(strengthWorkouts).values(parsed).returning();
      res.json(workout);
    } catch (error) {
      console.error("Error creating strength workout:", error);
      res.status(400).json({ error: "Failed to create strength workout" });
    }
  });

  // Skill workouts (basketball drills)
  app.get("/api/fitness/skill", async (_req, res) => {
    try {
      const workouts = await db.select().from(skillWorkouts);
      res.json(workouts);
    } catch (error) {
      console.error("Error fetching skill workouts:", error);
      res.status(500).json({ error: "Failed to fetch skill workouts" });
    }
  });

  app.post("/api/fitness/skill", async (req, res) => {
    try {
      const parsed = insertSkillWorkoutSchema.parse(req.body);
      const [workout] = await db.insert(skillWorkouts).values(parsed).returning();
      res.json(workout);
    } catch (error) {
      console.error("Error creating skill workout:", error);
      res.status(400).json({ error: "Failed to create skill workout" });
    }
  });

  // Basketball runs (pickup games)
  app.get("/api/fitness/runs", async (_req, res) => {
    try {
      const runs = await db.select().from(basketballRuns);
      res.json(runs);
    } catch (error) {
      console.error("Error fetching basketball runs:", error);
      res.status(500).json({ error: "Failed to fetch basketball runs" });
    }
  });

  app.post("/api/fitness/runs", async (req, res) => {
    try {
      const parsed = insertBasketballRunSchema.parse(req.body);
      const [run] = await db.insert(basketballRuns).values(parsed).returning();
      res.json(run);
    } catch (error) {
      console.error("Error creating basketball run:", error);
      res.status(400).json({ error: "Failed to create basketball run" });
    }
  });

  // ==================== AI ROUTES ====================

  app.post("/api/ai/insights", async (req, res) => {
    try {
      const { message, history } = req.body;

      if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "Message is required" });
      }

      const systemPrompt = `You are a helpful and encouraging habit tracking assistant for an app called "FrisFocus". 
Your role is to:
- Provide insights about the user's habits and progress
- Offer encouragement and motivation
- Suggest improvements based on habit science
- Answer questions about productivity, habit formation, and consistency
- Be concise but warm and supportive

Keep responses brief (2-4 sentences usually) unless the user asks for detailed analysis.`;

      const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
        { role: "system", content: systemPrompt },
      ];

      if (Array.isArray(history)) {
        for (const msg of history) {
          if (msg.role === "user" || msg.role === "assistant") {
            messages.push({ role: msg.role, content: msg.content });
          }
        }
      }

      messages.push({ role: "user", content: message });

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages,
        max_tokens: 500,
      });

      const content = response.choices[0]?.message?.content || "I'm here to help! Could you tell me more about what you'd like to know?";

      res.json({ content });
    } catch (error) {
      console.error("AI insights error:", error);
      res.status(500).json({ error: "Failed to get AI response" });
    }
  });

  return httpServer;
}
