export type RetryOptions = {
  attempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
};

function jitter(delayMs: number): number {
  return delayMs / 2 + Math.random() * (delayMs / 2);
}

/**
 * Generic exponential-backoff-with-jitter retry helper. Used both for ad-hoc
 * async calls and to mirror the backoff semantics configured on BullMQ jobs,
 * so a single HTTP call and a whole job retry the same way.
 */
export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const { attempts = 3, baseDelayMs = 250, maxDelayMs = 8_000 } = options;
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === attempts) break;
      const delay = jitter(Math.min(maxDelayMs, baseDelayMs * 2 ** (attempt - 1)));
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
