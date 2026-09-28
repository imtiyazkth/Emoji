import { isGithubConfigured, readJsonFile, writeJsonFile } from "./client";
import { localReadJson, localWriteJson } from "./local-store";
import { githubPath, localFileName } from "./paths";
import { AppError, ErrorCode } from "../utils/errors";

/**
 * Generic read/write for low-frequency, admin-only config files
 * (data/projects.json, data/categories.json, data/feature_flags.json,
 * etc.) — as opposed to lib/github/write-queue.ts, which exists
 * specifically for high-frequency AI-cache writes and batches them.
 *
 * Admin edits are naturally low-frequency and single-actor (only an
 * authenticated admin can call these), so a batching queue would just
 * add latency for no real benefit — a direct SHA-based write with one
 * retry-on-conflict is simpler and correct for this use case.
 */

export async function readConfigFile<T>(fileName: string): Promise<T> {
  try {
    const { data } = isGithubConfigured()
      ? await readJsonFile<T>(githubPath(fileName))
      : await localReadJson<T>(localFileName(fileName));
    return data;
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(ErrorCode.GITHUB_READ_ERROR, `Could not read ${fileName}`, { retryable: true });
  }
}

/**
 * Read the current file, apply `mutate`, write it back. On a stale-SHA
 * conflict (409, GitHub only), refetch once and retry the mutation —
 * if it conflicts again, surface the error rather than looping forever.
 */
export async function writeConfigFile<T>(fileName: string, mutate: (current: T) => T): Promise<T> {
  const path = githubPath(fileName);
  const localName = localFileName(fileName);

  for (let attempt = 0; attempt < 2; attempt++) {
    if (isGithubConfigured()) {
      const { data, sha } = await readJsonFile<T>(path);
      const next = mutate(data);
      try {
        await writeJsonFile(path, next, sha, `chore(admin): update ${fileName}`);
        return next;
      } catch (err) {
        if (err instanceof AppError && err.status === 409 && attempt === 0) {
          continue; // stale SHA — refetch and retry once
        }
        throw err;
      }
    } else {
      const { data } = await localReadJson<T>(localName);
      const next = mutate(data);
      await localWriteJson(localName, next);
      return next;
    }
  }
  throw new AppError(ErrorCode.GITHUB_WRITE_ERROR, `Failed to write ${fileName} after retry`, { retryable: true });
}
