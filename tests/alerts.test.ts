import { sendAlert, _resetCooldowns, _getCooldowns } from '../src/utils/alerts';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

// Store original env
const originalEnv = { ...process.env };

beforeEach(() => {
  jest.clearAllMocks();
  _resetCooldowns();
  process.env = {
    ...originalEnv,
    BREVO_API_KEY: 'test-api-key',
    BREVO_SENDER_EMAIL: 'sender@test.com',
    BREVO_SENDER_NAME: 'Test Sender',
    ALERT_RECIPIENT_EMAIL: 'admin@test.com',
  };
});

afterAll(() => {
  process.env = originalEnv;
});

const testPayload = {
  subject: 'Test alert',
  context: 'bookingId: 123',
  error: 'Something went wrong',
  route: '/api/test',
};

describe('sendAlert', () => {
  it('sends alert email via Brevo API', async () => {
    mockFetch.mockResolvedValue({ ok: true });

    await sendAlert(testPayload);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe('https://api.brevo.com/v3/smtp/email');
    expect(options.method).toBe('POST');
    expect(options.headers['api-key']).toBe('test-api-key');

    const body = JSON.parse(options.body);
    expect(body.to[0].email).toBe('admin@test.com');
    expect(body.subject).toBe('[TWISTED ALERT] Test alert');
    expect(body.textContent).toContain('bookingId: 123');
    expect(body.textContent).toContain('Something went wrong');
    expect(body.textContent).toContain('/api/test');
  });

  it('does not throw if Brevo API fails', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    // Should not throw
    await expect(sendAlert(testPayload)).resolves.toBeUndefined();
  });

  it('does not throw on non-ok HTTP response', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500, text: () => Promise.resolve('error') });

    await expect(sendAlert(testPayload)).resolves.toBeUndefined();
  });

  it('rate-limits duplicate alerts within 5 minutes', async () => {
    mockFetch.mockResolvedValue({ ok: true });

    await sendAlert(testPayload);
    await sendAlert(testPayload); // Same subject, should be rate-limited

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('allows different subjects simultaneously', async () => {
    mockFetch.mockResolvedValue({ ok: true });

    await sendAlert({ ...testPayload, subject: 'Alert A' });
    await sendAlert({ ...testPayload, subject: 'Alert B' });

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('allows same subject after rate-limit window expires', async () => {
    mockFetch.mockResolvedValue({ ok: true });

    await sendAlert(testPayload);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Manually expire the cooldown
    const cooldowns = _getCooldowns();
    cooldowns.set(testPayload.subject, Date.now() - 6 * 60 * 1000); // 6 min ago

    await sendAlert(testPayload);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('falls back to BREVO_SENDER_EMAIL when ALERT_RECIPIENT_EMAIL not set', async () => {
    delete process.env.ALERT_RECIPIENT_EMAIL;
    mockFetch.mockResolvedValue({ ok: true });

    await sendAlert(testPayload);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.to[0].email).toBe('sender@test.com');
  });

  it('skips sending if BREVO_API_KEY is not set', async () => {
    delete process.env.BREVO_API_KEY;

    await sendAlert(testPayload);

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('skips sending if no recipient email is configured', async () => {
    delete process.env.ALERT_RECIPIENT_EMAIL;
    delete process.env.BREVO_SENDER_EMAIL;

    await sendAlert(testPayload);

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('includes timestamp in email body', async () => {
    mockFetch.mockResolvedValue({ ok: true });

    await sendAlert(testPayload);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.textContent).toContain('Timestamp:');
  });

  it('includes abort signal for timeout', async () => {
    mockFetch.mockResolvedValue({ ok: true });

    await sendAlert(testPayload);

    const options = mockFetch.mock.calls[0][1];
    expect(options.signal).toBeDefined();
    expect(options.signal).toBeInstanceOf(AbortSignal);
  });
});
