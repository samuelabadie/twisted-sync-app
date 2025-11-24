import axios, { AxiosInstance } from 'axios';

export class BooklaClient {
  private client: AxiosInstance;
  private companyId: string;

  constructor(apiKey: string, companyId: string) {
    this.companyId = companyId;
    this.client = axios.create({
      baseURL: 'https://api.bookla.com/v1', // Assumption, needs verification
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async createService(payload: any): Promise<string> {
    try {
      const response = await this.client.post(`/companies/${this.companyId}/services`, payload);
      return response.data.id;
    } catch (error) {
      console.error('Error creating Bookla service:', error);
      throw error;
    }
  }

  async updateService(serviceId: string, payload: any): Promise<void> {
    try {
      await this.client.put(`/companies/${this.companyId}/services/${serviceId}`, payload);
    } catch (error) {
      console.error(`Error updating Bookla service ${serviceId}:`, error);
      throw error;
    }
  }

  async confirmBooking(bookingId: string): Promise<void> {
    try {
      await this.client.post(`/bookings/${bookingId}/confirm`);
    } catch (error) {
      console.error(`Error confirming Bookla booking ${bookingId}:`, error);
      throw error;
    }
  }

  async cancelBooking(bookingId: string): Promise<void> {
    try {
      await this.client.post(`/bookings/${bookingId}/cancel`);
    } catch (error) {
      console.error(`Error canceling Bookla booking ${bookingId}:`, error);
      throw error;
    }
  }

  async getPendingBookings(): Promise<any[]> {
    try {
      // Assumption: Bookla API supports filtering by status
      // If not, we'd have to fetch all and filter, which is inefficient
      const response = await this.client.get(`/companies/${this.companyId}/bookings`, {
        params: {
          status: 'pending', // or whatever the status is for unpaid
          // created_before: ... // if supported
        }
      });
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching pending bookings:', error);
      return [];
    }
  }
}
