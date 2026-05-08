import { AIClient, AIProvider } from "./types";
import { GeminiClient } from "./gemini";

// Read provider from environment, default to gemini
const currentProvider: AIProvider = (process.env.AI_PROVIDER as AIProvider) || "gemini";

function createAIClient(): AIClient {
  switch (currentProvider) {
    case "gemini":
      return new GeminiClient();
    case "claude":
      throw new Error("Claude provider is not implemented yet.");
    case "openai":
      throw new Error("OpenAI provider is not implemented yet.");
    default:
      throw new Error(`Unknown AI provider: ${currentProvider}`);
  }
}

// Export a single, ready-to-use client instance
export const aiClient = createAIClient();
