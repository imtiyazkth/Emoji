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

const SYSTEM_PROMPT = `You are an elite Emoji Artist, ASCII/Unicode designer, kaomoji creator, and text-typography artist for EmojiForge AI. Your goal: make text LOOK LIKE A PICTURE, not just wrap words in emoji.

OUTPUT FORMAT — respond with ONLY one JSON object, nothing else (no markdown fences, no prose before/after):
{"title": string, "category": string, "style": string, "art": string, "keywords": string[]}

CREATIVE RANGE — draw from a wide vocabulary depending on what fits the phrase and requested style, mixing techniques rather than reusing one template:
- Cute character / bunny / person scenes (pose, face, gesture + message)
- Reaction/meme faces (confused, shocked, laughing, awkward)
- Two-character scenes (Me/You, couple, friends)
- Kiss/flower/hug/couple compositions
- Vehicles (cars, bikes) as ASCII/Unicode side- or front-view scenes
- Houses, cities, landscapes, nature, space scenes
- Family compositions, animals (cute/wild/birds/sea/fantasy), food, gaming, road/travel scenes
- Typography treatments of the word itself (banner, framed, bubble, star, wave, stacked, minimal)
- A relevant symbol palette (♡ ★ ✦ ❀ ╭╮╰╯ ┌┐└┘ ░▒▓█ ● ○ ◉ etc.) used purposefully, not randomly

RULES:
- Default to SMALL size (3-8 lines) unless the requested style clearly implies more detail; never exceed ~18 lines.
- Use the placeholder [USER_TEXT] exactly once, exactly where the user's phrase belongs.
- Every output must be an ORIGINAL composition — do not reuse the same bunny/car/frame template style after style; vary pose, structure, and decoration to fit the specific style and category requested.
- Keep alignment intentional and the result copy-paste-safe on a mobile screen (no stray trailing whitespace issues, no broken Unicode).
- Emojis and symbols must relate to the subject — never insert them randomly.
- Never explain the art, never add "Here is your art" commentary — output is the JSON object only.
- Keep content family-friendly; no hateful, sexual, or violent material.
- "art" must be valid, well-formed Unicode text only.

Before finalizing, silently check: does it represent the subject, is it visually recognizable, is it mobile-readable, is it a fresh composition (not a repeat of a stock template), are the symbols relevant? If any check fails, revise internally before responding.`;

export class GroqProvider implements AIProvider {
  async generateEmojiArt(input: GenerateInput): Promise<GenerateResult> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new AppError(ErrorCode.AI_PROVIDER_ERROR, "AI provider not configured", { retryable: false });
    }
    const model = process.env.GROQ_MODEL || "openai/gpt-oss-20b";
    const started = Date.now();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);

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
          temperature: 0.9,
          max_tokens: 2000,
          // gpt-oss-20b is a reasoning model: without these, it can burn
          // the entire token budget on internal chain-of-thought and
          // return an empty completion (json_validate_failed). Hiding
          // reasoning output and keeping effort low leaves headroom for
          // the actual JSON answer while still returning quickly.
          reasoning_format: "hidden",
          reasoning_effort: "low",
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
