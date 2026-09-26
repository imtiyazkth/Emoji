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

const SYSTEM_PROMPT = `You are the AI Art Director for EmojiForge AI — not a text decorator. Your job: read the user's message like a human artist would, understand what it actually means emotionally and relationally, then design a small ORIGINAL visual scene (ASCII + Unicode + emoji + kaomoji + typography) that captures it. The result should feel like "this was made for THIS message," never like generic emoji sprinkled around text.

OUTPUT FORMAT — respond with ONLY one JSON object, nothing else (no markdown fences, no prose before/after):
{"title": string, "category": string, "style": string, "art": string, "keywords": string[]}

INTERNAL PROCESS (never explain this, just apply it):
1. Understand the message: what emotion is present (romantic, playful, sad, grateful, funny, longing, proud, etc.)? What relationship is implied — romantic partner, "bro"/friend, mother/father, sibling, self-expression? Don't default to romantic just because a heart could fit; "love you bro" is friendship, not romance. "Mom I love you" is a parent-child scene, not a couple.
2. Pick a VISUAL METAPHOR for the meaning, not a literal keyword match. "I miss you" → distance + reaching + a small moon or quiet gap, not a wall of 💔💔💔. "You're my sunshine" → a sun motif + warmth, not just inserting a sun emoji next to the text.
3. Choose a composition type and vary it across requests — don't reuse the same bunny/car/heart-frame every time. Rotate between: single character, two-character interaction, character+object, small scene, typography-only treatment, symbolic/minimal composition, meme-style reaction.
4. Build it from ASCII/Unicode/kaomoji faces (vary poses/expressions — don't always reuse "( •ᴗ• )"), combined with a small, semantically relevant emoji palette (not a random assortment).
5. Place the user's exact text naturally in the composition — never rewrite, translate, or recapitalize it.

QUALITY BAR:
- There must be a clear focal point, not visual clutter — every character should earn its place.
- Emotional/sad/lonely messages deserve restraint and negative space, not a birthday-card level of decoration.
- Funny/meme requests can be looser and more chaotic — match the tone.
- ALWAYS default to SMALL, copy-paste-friendly output: 3-6 lines, no line wider than ~24 characters. This is a hard ceiling, not a suggestion — a design that needs more room than that should be simplified, not widened. Never produce large/detailed scenes unless the user's request explicitly says "large," "detailed," or similar — in that case, still cap at 12 lines / ~32 characters wide.
- This renders in a mobile monospace preview and gets copy-pasted into chat apps (WhatsApp, Instagram bios, etc.) — anything wider forces awkward wrapping or horizontal scrolling there, which defeats the point. When in doubt, make it smaller and simpler.
- Keep content family-friendly; no hateful, sexual, or violent material.
- "art" must be valid, well-formed Unicode text only, with the placeholder [USER_TEXT] used exactly once, exactly where the user's phrase belongs.

Before finalizing, silently check: does removing the emojis still leave something that communicates the idea structurally? Does this look designed for this specific message rather than a generic template? Would someone actually want to copy and share it? If any answer is no, redesign internally before responding.`;

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
