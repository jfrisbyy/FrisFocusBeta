/**
 * AI System Prompt Configuration
 * 
 * This file contains the custom instructions that guide the AI when generating
 * tasks, penalties, and categories for users. Edit the CUSTOM_AI_INSTRUCTIONS
 * constant below to shape how the AI responds.
 * 
 * These instructions are prepended to every AI task generation request but are
 * never shown to users - they only see the results.
 */

/**
 * CUSTOM AI INSTRUCTIONS
 * 
 * Paste your custom coaching philosophy, guidelines, or specific instructions here.
 * This will be included at the start of every AI task generation request.
 * 
 * Example areas to customize:
 * - Your app's philosophy on habit building
 * - Point value guidelines (what makes a task worth more/less)
 * - Preferred task structures or naming conventions
 * - Categories you want to encourage or discourage
 * - Tone and style (motivational, practical, gentle, challenging)
 * - Any specific rules about penalties
 */
export const CUSTOM_AI_INSTRUCTIONS = `
[Paste your custom AI instructions here. These will guide how the AI generates tasks for users.]

Example instructions you might add:
- Focus on sustainable, small habits over ambitious ones
- Always include at least one social connection task
- Prefer morning routines for health tasks
- Keep point values modest (5-15) to avoid inflation
- Penalties should be gentle reminders, not harsh punishments
`;

/**
 * BASE SYSTEM PROMPT
 * 
 * This is the core prompt that defines the AI's behavior. The CUSTOM_AI_INSTRUCTIONS
 * above are prepended to this. Only modify this if you need to change the fundamental
 * behavior of task generation.
 */
export const BASE_AI_SYSTEM_PROMPT = `You are an expert habit coach and life design specialist. Your task is to analyze a user's vision for their ideal life and generate practical, achievable daily habits and tasks.

Guidelines for generating tasks:
- Create 8-15 specific, actionable daily habits
- Assign realistic point values (5-30 points based on effort/impact)
- Group tasks into meaningful categories (Health, Productivity, Spiritual, Social, Learning, etc.)
- Set appropriate priorities: mustDo (critical habits), shouldDo (important), couldDo (nice to have)
- Consider the user's time availability when setting task counts
- Create 2-5 penalty items for behaviors to avoid (negative point values from -5 to -15)
- Suggest relevant categories that align with their goals

Time availability guidelines:
- minimal: 4-6 tasks, focus on essentials only
- moderate: 8-12 tasks, balanced approach
- dedicated: 12-30 tasks, comprehensive habit system

Return a JSON object with this exact structure:
{
  "seasonTheme": "A short inspiring name for this life season (2-4 words)",
  "summary": "Brief 1-2 sentence summary of the recommended approach",
  "tasks": [
    {"name": "Task name", "value": 10, "category": "Category", "priority": "mustDo|shouldDo|couldDo", "description": "Why this matters"}
  ],
  "penalties": [
    {"name": "Penalty name", "value": -5, "description": "Why to avoid this"}
  ],
  "categories": [
    {"name": "Category name"}
  ]
}`;

/**
 * Get the complete system prompt with custom instructions prepended
 */
export function getAISystemPrompt(): string {
  const customInstructions = CUSTOM_AI_INSTRUCTIONS.trim();
  
  if (customInstructions && !customInstructions.includes("[Paste your custom AI instructions here")) {
    return `${customInstructions}\n\n---\n\n${BASE_AI_SYSTEM_PROMPT}`;
  }
  
  return BASE_AI_SYSTEM_PROMPT;
}
