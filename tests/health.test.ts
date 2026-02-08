jest.mock('../src/lib/database');

import { DatabaseService } from '../src/lib/database';

let GET: () => Promise<any>;

const mockDb = {
  countServices: jest.fn(),
};

beforeAll(async () => {
  const mod = await import('../app/api/health/route');
  GET = mod.GET;
});

beforeEach(() => {
  jest.clearAllMocks();
  process.env.DATABASE_URL = 'postgresql://test';
  (DatabaseService as jest.Mock).mockImplementation(() => mockDb);
});

describe('GET /api/health', () => {
  it('returns healthy when DB is reachable', async () => {
    mockDb.countServices.mockResolvedValue(42);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('healthy');
    expect(data.checks.database.status).toBe('ok');
    expect(typeof data.checks.database.latencyMs).toBe('number');
    expect(data.checks.database.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it('returns degraded when DB is unreachable', async () => {
    mockDb.countServices.mockRejectedValue(new Error('Connection refused'));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.status).toBe('degraded');
    expect(data.checks.database.status).toBe('error');
    expect(data.checks.database.error).toBe('Connection refused');
  });

  it('includes timestamp in response', async () => {
    mockDb.countServices.mockResolvedValue(0);

    const response = await GET();
    const data = await response.json();

    expect(data.timestamp).toBeDefined();
    // Verify it's a valid ISO date
    expect(new Date(data.timestamp).toISOString()).toBe(data.timestamp);
  });
});
