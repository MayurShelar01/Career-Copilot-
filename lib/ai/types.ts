export type AIProvider = "gemini" | "claude" | "openai";

export interface AIGenerateOptions {
  prompt: string;
  systemPrompt?: string;
  jsonSchema?: object; // optional: for structured output
  temperature?: number;
}

export interface AIClient {
  generate(opts: AIGenerateOptions): Promise<string>;
  generateJSON<T>(opts: AIGenerateOptions): Promise<T>;
}
