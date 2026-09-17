import { AppError, ErrorCode } from "../utils/errors";

/**
 * Thin wrapper around the GitHub Contents API. This is the ONLY place
 * that talks to GitHub's REST API directly. It never runs in the
 * browser — GITHUB_TOKEN is read from server-only env vars.
 */

interface GhFileResponse {
  content: string; // base64
  sha: string;
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new AppError(ErrorCode.INTERNAL_ERROR, `Missing required env var ${name}`, { status: 500 });
  }
  return v;
}

function ghConfigured(): boolean {
  return Boolean(process.env.GITHUB_TOKEN && process.env.GITHUB_OWNER && process.env.GITHUB_REPO);
}

export function isGithubConfigured(): boolean {
  return ghConfigured();
}

async function ghFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = requireEnv("GITHUB_TOKEN");
  const owner = requireEnv("GITHUB_OWNER");
  const repo = requireEnv("GITHUB_REPO");
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init?.headers ?? {}),
    },
  });
  return res;
}

/** Read a JSON file + its current SHA (needed for safe writes). */
export async function readJsonFile<T>(path: string): Promise<{ data: T; sha: string }> {
  const branch = process.env.GITHUB_BRANCH || "main";
  const res = await ghFetch(`${path}?ref=${branch}`);
  if (!res.ok) {
    throw new AppError(ErrorCode.GITHUB_READ_ERROR, `Failed to read ${path} from GitHub (${res.status})`, {
      retryable: res.status >= 500 || res.status === 429,
    });
  }
  const body = (await res.json()) as GhFileResponse;
  const json = Buffer.from(body.content, "base64").toString("utf-8");
  return { data: JSON.parse(json) as T, sha: body.sha };
}

/**
 * Write a JSON file using optimistic concurrency (the caller must pass
 * the SHA it last read). On a 409 conflict the caller is expected to
 * refetch, re-apply its mutation, and retry (see write-queue.ts).
 */
export async function writeJsonFile(
  path: string,
  data: unknown,
  sha: string,
  message: string
): Promise<{ sha: string }> {
  const branch = process.env.GITHUB_BRANCH || "main";
  const content = Buffer.from(JSON.stringify(data, null, 2), "utf-8").toString("base64");
  const res = await ghFetch(path, {
    method: "PUT",
    body: JSON.stringify({ message, content, sha, branch }),
  });
  if (res.status === 409) {
    throw new AppError(ErrorCode.GITHUB_WRITE_ERROR, `Conflict writing ${path} (stale SHA)`, {
      retryable: true,
      status: 409,
    });
  }
  if (!res.ok) {
    throw new AppError(ErrorCode.GITHUB_WRITE_ERROR, `Failed to write ${path} (${res.status})`, {
      retryable: res.status >= 500 || res.status === 429,
    });
  }
  const body = (await res.json()) as { content: GhFileResponse };
  return { sha: body.content.sha };
}
