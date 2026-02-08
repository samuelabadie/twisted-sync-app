// Mock modules before imports
jest.mock('../src/lib/bookla');
jest.mock('../src/lib/database');
jest.mock('../src/utils/alerts');
jest.mock('../src/utils/retry', () => ({
  withRetry: jest.fn((fn: () => Promise<any>) => fn()),
}));

import { NextRequest } from 'next/server';
import { BooklaClient } from '../src/lib/bookla';
import { DatabaseService } from '../src/lib/database';
import { sendAlert } from '../src/utils/alerts';
import { withRetry } from '../src/utils/retry';

// We need to import GET after mocks are set up
// Since Next.js route files use relative imports that resolve to the same modules,
// we import the route handler dynamically
let GET: (request: NextRequest) => Promise<any>;

const mockBookla = {
  cancelBooking: jest.fn(),
};

const mockDb = {
  getPendingBookings: jest.fn(),
  updateBookingStatus: jest.fn(),
};

beforeAll(async () => {
  const mod = await import('../app/api/cleanup-payments/route');
  GET = mod.GET;
});

beforeEach(() => {
  jest.clearAllMocks();
  process.env.CRON_SECRET = 'test-secret';
  process.env.BOOKLA_API_KEY = 'test-key';
  process.env.BOOKLA_COMPANY_ID = 'test-company';
  process.env.DATABASE_URL = 'postgresql://test';

  (BooklaClient as jest.Mock).mockImplementation(() => mockBookla);
  (DatabaseService as jest.Mock).mockImplementation(() => mockDb);
});

function makeRequest(options: { authHeader?: string; queryKey?: string } = {}) {
  const url = options.queryKey
    ? `http://localhost/api/cleanup-payments?key=${options.queryKey}`
    : 'http://localhost/api/cleanup-payments';

  const headers: Record<string, string> = {};
  if (options.authHeader) {
    headers['authorization'] = options.authHeader;
  }

  return new NextRequest(url, { method: 'GET', headers });
}

describe('GET /api/cleanup-payments', () => {
  it('returns 401 for unauthorized requests', async () => {
    const response = await GET(makeRequest());
    expect(response.status).toBe(401);
  });

  it('accepts Bearer token authorization', async () => {
    mockDb.getPendingBookings.mockResolvedValue([]);

    const response = await GET(makeRequest({ authHeader: 'Bearer test-secret' }));
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.cancelled).toBe(0);
  });

  it('accepts query param authorization', async () => {
    mockDb.getPendingBookings.mockResolvedValue([]);

    const response = await GET(makeRequest({ queryKey: 'test-secret' }));
    expect(response.status).toBe(200);
  });

  it('cancels expired bookings in both Bookla and DB', async () => {
    const expiredBooking = {
      bookingId: 'booking-1',
      createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(), // 20 min ago
    };
    mockDb.getPendingBookings.mockResolvedValue([expiredBooking]);
    mockBookla.cancelBooking.mockResolvedValue(undefined);

    const response = await GET(makeRequest({ authHeader: 'Bearer test-secret' }));
    const data = await response.json();

    expect(data.cancelled).toBe(1);
    expect(mockDb.updateBookingStatus).toHaveBeenCalledWith('booking-1', 'cancelled');
  });

  it('does NOT update DB when Bookla cancellation fails', async () => {
    const expiredBooking = {
      bookingId: 'booking-1',
      createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    };
    mockDb.getPendingBookings.mockResolvedValue([expiredBooking]);

    // withRetry will throw (simulating Bookla failure after retries)
    (withRetry as jest.Mock).mockRejectedValueOnce(new Error('Bookla API down'));

    const response = await GET(makeRequest({ authHeader: 'Bearer test-secret' }));
    const data = await response.json();

    expect(data.cancelled).toBe(0);
    expect(mockDb.updateBookingStatus).not.toHaveBeenCalled();
  });

  it('sends alert when Bookla cancellation fails', async () => {
    const expiredBooking = {
      bookingId: 'booking-1',
      createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    };
    mockDb.getPendingBookings.mockResolvedValue([expiredBooking]);
    (withRetry as jest.Mock).mockRejectedValueOnce(new Error('Bookla timeout'));

    await GET(makeRequest({ authHeader: 'Bearer test-secret' }));

    expect(sendAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: 'Cleanup: Bookla cancellation failed',
        context: expect.stringContaining('booking-1'),
        route: '/api/cleanup-payments',
      })
    );
  });

  it('skips non-expired bookings', async () => {
    const recentBooking = {
      bookingId: 'booking-1',
      createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 min ago
    };
    mockDb.getPendingBookings.mockResolvedValue([recentBooking]);

    const response = await GET(makeRequest({ authHeader: 'Bearer test-secret' }));
    const data = await response.json();

    expect(data.cancelled).toBe(0);
    expect(mockBookla.cancelBooking).not.toHaveBeenCalled();
  });

  it('continues processing other bookings if one fails', async () => {
    const bookings = [
      { bookingId: 'booking-1', createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString() },
      { bookingId: 'booking-2', createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString() },
      { bookingId: 'booking-3', createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
    ];
    mockDb.getPendingBookings.mockResolvedValue(bookings);

    // First and third succeed, second fails
    (withRetry as jest.Mock)
      .mockImplementationOnce((fn: () => Promise<any>) => fn()) // booking-1 OK
      .mockRejectedValueOnce(new Error('fail'))                  // booking-2 FAIL
      .mockImplementationOnce((fn: () => Promise<any>) => fn()); // booking-3 OK

    const response = await GET(makeRequest({ authHeader: 'Bearer test-secret' }));
    const data = await response.json();

    expect(data.cancelled).toBe(2); // 1 and 3 succeeded
    expect(mockDb.updateBookingStatus).toHaveBeenCalledTimes(2);
    expect(mockDb.updateBookingStatus).toHaveBeenCalledWith('booking-1', 'cancelled');
    expect(mockDb.updateBookingStatus).toHaveBeenCalledWith('booking-3', 'cancelled');
  });

  it('handles empty pending bookings list', async () => {
    mockDb.getPendingBookings.mockResolvedValue([]);

    const response = await GET(makeRequest({ authHeader: 'Bearer test-secret' }));
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.cancelled).toBe(0);
  });
});
