export interface RetryOptions {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  retryableStatuses: number[];
  onRetry?: (error: Error, attempt: number) => void;
}

const DEFAULT_OPTIONS: RetryOptions = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
  retryableStatuses: [429, 500, 502, 503, 504],
};

const RETRYABLE_NETWORK_CODES = ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNREFUSED', 'UND_ERR_CONNECT_TIMEOUT'];

function isRetryableError(error: any, retryableStatuses: number[]): boolean {
  // Network errors (axios or Node.js)
  if (error.code && RETRYABLE_NETWORK_CODES.includes(error.code)) {
    return true;
  }

  // AbortError from fetch timeout
  if (error.name === 'AbortError') {
    return true;
  }

  // Axios errors with response status
  const status = error.response?.status ?? error.status;
  if (status && retryableStatuses.includes(status)) {
    return true;
  }

  return false;
}

function calculateDelay(attempt: number, baseDelayMs: number, maxDelayMs: number): number {
  const exponentialDelay = baseDelayMs * Math.pow(2, attempt);
  const jitter = Math.random() * 200;
  return Math.min(exponentialDelay + jitter, maxDelayMs);
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: Partial<RetryOptions>
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      if (attempt === opts.maxRetries) {
        break;
      }

      if (!isRetryableError(error, opts.retryableStatuses)) {
        break;
      }

      opts.onRetry?.(error, attempt + 1);

      const delay = calculateDelay(attempt, opts.baseDelayMs, opts.maxDelayMs);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

// Export for testing
export { isRetryableError, calculateDelay };
