import { GoogleGenerativeAI, Schema } from "@google/generative-ai";
import { AIClient, AIGenerateOptions } from "./types";
import { env } from "@/lib/env";

const GEMINI_API_KEY = env.GEMINI_API_KEY;
const DEFAULT_MODEL = "gemini-2.5-flash";

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export class GeminiClient implements AIClient {
  async generate(opts: AIGenerateOptions): Promise<string> {
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not set.");
    }

    const model = genAI.getGenerativeModel({
      model: DEFAULT_MODEL,
      systemInstruction: opts.systemPrompt,
    });

    try {
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: opts.prompt }] }],
        generationConfig: {
          temperature: opts.temperature ?? 0.7,
        },
      });

      return result.response.text();
    } catch (error: unknown) {
      console.error("Gemini API Error:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Gemini generate failed: ${message}`);
    }
  }

  async generateJSON<T>(opts: AIGenerateOptions): Promise<T> {
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not set.");
    }

    const model = genAI.getGenerativeModel({
      model: DEFAULT_MODEL,
      systemInstruction: opts.systemPrompt,
    });

    try {
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: opts.prompt }] }],
        generationConfig: {
          temperature: opts.temperature ?? 0.2, // Lower temperature for JSON
          responseMimeType: "application/json",
          // Optional: passing JSON schema if provided
          ...(opts.jsonSchema && { responseSchema: opts.jsonSchema as Schema }),
        },
      });

      let text = result.response.text();
      
      // Strip markdown json blocks if Gemini still wraps the response
      text = text.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
      
      return JSON.parse(text) as T;
    } catch (error: unknown) {
      console.error("Gemini API JSON Error:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Gemini generateJSON failed: ${message}`);
    }
  }
}
