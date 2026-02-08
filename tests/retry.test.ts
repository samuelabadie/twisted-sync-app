import { withRetry, isRetryableError, calculateDelay } from '../src/utils/retry';

// Speed up tests by using short delays
const fastOptions = { baseDelayMs: 10, maxDelayMs: 50 };

describe('withRetry', () => {
  it('succeeds on first try without retrying', async () => {
    const fn = jest.fn().mockResolvedValue('success');

    const result = await withRetry(fn, fastOptions);

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on transient failure then succeeds', async () => {
    const fn = jest.fn()
      .mockRejectedValueOnce({ code: 'ECONNRESET' })
      .mockResolvedValue('success');

    const result = await withRetry(fn, fastOptions);

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('retries up to maxRetries then throws', async () => {
    const error = { code: 'ETIMEDOUT', message: 'timeout' };
    const fn = jest.fn().mockRejectedValue(error);

    await expect(withRetry(fn, { ...fastOptions, maxRetries: 2 })).rejects.toEqual(error);
    expect(fn).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
  });

  it('does not retry on non-retryable error (e.g. 400)', async () => {
    const error = { response: { status: 400 }, message: 'Bad Request' };
    const fn = jest.fn().mockRejectedValue(error);

    await expect(withRetry(fn, fastOptions)).rejects.toEqual(error);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on 429 Too Many Requests', async () => {
    const fn = jest.fn()
      .mockRejectedValueOnce({ response: { status: 429 } })
      .mockRejectedValueOnce({ response: { status: 429 } })
      .mockResolvedValue('ok');

    const result = await withRetry(fn, fastOptions);

    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('retries on 500 Internal Server Error', async () => {
    const fn = jest.fn()
      .mockRejectedValueOnce({ response: { status: 500 } })
      .mockResolvedValue('recovered');

    const result = await withRetry(fn, fastOptions);

    expect(result).toBe('recovered');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('calls onRetry callback with attempt number', async () => {
    const onRetry = jest.fn();
    const fn = jest.fn()
      .mockRejectedValueOnce({ code: 'ECONNRESET' })
      .mockRejectedValueOnce({ code: 'ECONNRESET' })
      .mockResolvedValue('ok');

    await withRetry(fn, { ...fastOptions, onRetry });

    expect(onRetry).toHaveBeenCalledTimes(2);
    expect(onRetry).toHaveBeenNthCalledWith(1, expect.anything(), 1);
    expect(onRetry).toHaveBeenNthCalledWith(2, expect.anything(), 2);
  });

  it('does not retry on 401 Unauthorized', async () => {
    const error = { response: { status: 401 }, message: 'Unauthorized' };
    const fn = jest.fn().mockRejectedValue(error);

    await expect(withRetry(fn, fastOptions)).rejects.toEqual(error);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on AbortError (fetch timeout)', async () => {
    const fn = jest.fn()
      .mockRejectedValueOnce({ name: 'AbortError', message: 'The operation was aborted' })
      .mockResolvedValue('ok');

    const result = await withRetry(fn, fastOptions);

    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe('isRetryableError', () => {
  const statuses = [429, 500, 502, 503, 504];

  it('returns true for network error codes', () => {
    expect(isRetryableError({ code: 'ECONNRESET' }, statuses)).toBe(true);
    expect(isRetryableError({ code: 'ETIMEDOUT' }, statuses)).toBe(true);
    expect(isRetryableError({ code: 'ENOTFOUND' }, statuses)).toBe(true);
    expect(isRetryableError({ code: 'ECONNREFUSED' }, statuses)).toBe(true);
  });

  it('returns true for retryable HTTP statuses', () => {
    expect(isRetryableError({ response: { status: 429 } }, statuses)).toBe(true);
    expect(isRetryableError({ response: { status: 500 } }, statuses)).toBe(true);
    expect(isRetryableError({ response: { status: 503 } }, statuses)).toBe(true);
  });

  it('returns false for non-retryable errors', () => {
    expect(isRetryableError({ response: { status: 400 } }, statuses)).toBe(false);
    expect(isRetryableError({ response: { status: 404 } }, statuses)).toBe(false);
    expect(isRetryableError({ message: 'some error' }, statuses)).toBe(false);
  });
});

describe('calculateDelay', () => {
  it('increases delay exponentially', () => {
    // With jitter, we can only test the range
    const delay0 = calculateDelay(0, 1000, 30000);
    const delay1 = calculateDelay(1, 1000, 30000);
    const delay2 = calculateDelay(2, 1000, 30000);

    // Attempt 0: 1000 + jitter (0-200)
    expect(delay0).toBeGreaterThanOrEqual(1000);
    expect(delay0).toBeLessThanOrEqual(1200);

    // Attempt 1: 2000 + jitter
    expect(delay1).toBeGreaterThanOrEqual(2000);
    expect(delay1).toBeLessThanOrEqual(2200);

    // Attempt 2: 4000 + jitter
    expect(delay2).toBeGreaterThanOrEqual(4000);
    expect(delay2).toBeLessThanOrEqual(4200);
  });

  it('caps delay at maxDelayMs', () => {
    const delay = calculateDelay(10, 1000, 5000);
    expect(delay).toBeLessThanOrEqual(5000);
  });
});
