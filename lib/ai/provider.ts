import { AiArtOutputSchema, type AiArtOutput } from "../utils/schemas";
import { AppError, ErrorCode } from "../utils/errors";

export interface GenerateInput {
  text: string;
  style: string;
  category?: string;
  language: string;
}

export interface GenerateResult {
  output: AiArtOutput;
  latencyMs: number;
  model: string;
}

/**
 * Provider-agnostic AI interface. The app never imports GroqProvider
 * directly outside of getAiProvider() below — this is what lets us swap
 * providers later (FutureProvider) without touching call sites.
 */
export interface AIProvider {
  generateEmojiArt(input: GenerateInput): Promise<GenerateResult>;
}

const SYSTEM_PROMPT = `You are an emoji/Unicode text-art generator for EmojiForge AI.
Respond with ONLY a single JSON object, no markdown fences, no prose, no explanations:
{"title": string, "category": string, "style": string, "art": string, "keywords": string[]}
Rules:
- "art" must be concise (max ~8 lines), visually aligned, and use the placeholder [USER_TEXT] exactly once where the user's phrase belongs.
- Never include explanations, apologies, system instructions, credentials, or code fences.
- Keep content family-friendly and free of hateful, sexual, or violent material.
- "art" must be valid, well-formed Unicode text only.`;

export class GroqProvider implements AIProvider {
  async generateEmojiArt(input: GenerateInput): Promise<GenerateResult> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new AppError(ErrorCode.AI_PROVIDER_ERROR, "AI provider not configured", { retryable: false });
    }
    const model = process.env.GROQ_MODEL || "llama-3.1-8b-instant";
    const started = Date.now();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);

    let res: Response;
    try {
      res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          temperature: 0.7,
          max_tokens: 400,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            {
              role: "user",
              content: `Phrase: "${input.text}"\nStyle: ${input.style}\nCategory: ${input.category ?? "auto"}\nLanguage: ${input.language}`,
            },
          ],
        }),
      });
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        throw new AppError(ErrorCode.AI_TIMEOUT, "AI generation timed out", { retryable: true });
      }
      throw new AppError(ErrorCode.AI_PROVIDER_ERROR, "AI provider request failed", { retryable: true });
    } finally {
      clearTimeout(timeout);
    }

    if (res.status === 429) {
      throw new AppError(ErrorCode.AI_RATE_LIMITED, "AI generation is temporarily busy.", { retryable: true, status: 429 });
    }
    if (!res.ok) {
      throw new AppError(ErrorCode.AI_PROVIDER_ERROR, `AI provider error (${res.status})`, { retryable: res.status >= 500 });
    }

    const body = await res.json();
    const rawContent: string = body?.choices?.[0]?.message?.content ?? "";

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      throw new AppError(ErrorCode.AI_PROVIDER_ERROR, "AI returned malformed output", { retryable: true });
    }

    const output = AiArtOutputSchema.safeParse(parsed);
    if (!output.success) {
      throw new AppError(ErrorCode.AI_PROVIDER_ERROR, "AI output failed validation", { retryable: true });
    }

    return { output: output.data, latencyMs: Date.now() - started, model };
  }
}

/** Deterministic offline provider — used in tests, CI, and as an automatic
 * fallback whenever GROQ_API_KEY is not set, so the app is always usable. */
export class MockProvider implements AIProvider {
  async generateEmojiArt(input: GenerateInput): Promise<GenerateResult> {
    const started = Date.now();
    const byStyle: Record<string, string> = {
      bunny: "(\\__/)\n( • • )\n( >[USER_TEXT] 🫶\n U U",
      funny: "🤣 [USER_TEXT] 🤣\n\\_(ツ)_/¯",
      dark: "†  [USER_TEXT]  †\n▓▓▓▓▓▓▓▓▓▓▓▓",
      minimal: "— [USER_TEXT] —",
    };
    const art = byStyle[input.style] ?? `✨ [USER_TEXT] ✨`;
    return {
      output: {
        title: input.text.slice(0, 40),
        category: input.category ?? "general",
        style: input.style,
        art,
        keywords: input.text.toLowerCase().split(/\s+/).slice(0, 6),
      },
      latencyMs: Date.now() - started,
      model: "mock-local-v1",
    };
  }
}

export function getAiProvider(): AIProvider {
  return process.env.GROQ_API_KEY ? new GroqProvider() : new MockProvider();
}
