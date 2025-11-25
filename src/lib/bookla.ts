import axios, { AxiosInstance } from 'axios';

export class BooklaClient {
  private client: AxiosInstance;
  private companyId: string;

  constructor(apiKey: string, companyId: string) {
    this.companyId = companyId;
    this.client = axios.create({
      baseURL: 'https://eu.bookla.com/api/v1',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });
  }

  async createService(payload: any): Promise<string> {
    try {
      // Rename title to name if present, as Bookla requires name
      // Add default color and type if missing (required by Bookla)
      const { title, ...rest } = payload;
      const data = { 
        name: title || payload.name, 
        color: payload.color || '#000000', // Default black
        type: 'fixed', // CHANGED: 'service' seems to be invalid, trying 'fixed' based on debug output
        settings: { // Adding default settings structure often required for 'fixed' type
            currency: 'EUR',
            duration: `PT${(payload.duration || 60)}M`, // Duration in ISO 8601 format often required
            bookingPolicy: 'instant',
            timeInterval: 'PT30M'
        },
        price: payload.price, // Send price directly at root if that's where it was before
        ...rest 
      };
      
      // If the API expects simple duration/price numbers at root (as per our GET test earlier showing just number)
      // we keep them. But 'type_invalid' suggests the 'type' value itself is wrong.
      // The GET debug showed: "type": "fixed" for existing services.
      // So we MUST use "fixed", not "service".
      data.type = 'fixed';
      
      const response = await this.client.post(`/companies/${this.companyId}/services`, data);
      return response.data.id;
    } catch (error) {
      console.error('Error creating Bookla service:', error);
      throw error;
    }
  }

  async updateService(serviceId: string, payload: any): Promise<void> {
    try {
      // Rename title to name if present
      // Ensure color and type are present if required on update
      const { title, ...rest } = payload;
      const data = { 
        name: title || payload.name, 
        // color: payload.color || '#000000', // Uncomment if update also fails on color
        // type: payload.type || 'service',   // Uncomment if update also fails on type
        ...rest 
      };

      // Remove unnecessary fields that might cause errors if they are empty or invalid
      const cleanData: any = {};
      if (data.name) cleanData.name = data.name;
      if (data.price !== undefined) cleanData.price = data.price;
      if (data.duration !== undefined) cleanData.duration = data.duration;
      if (data.color) cleanData.color = data.color;
      // Add other fields explicitly if needed, rather than spreading ...rest which might contain garbage

      // Use PATCH instead of PUT as per debug results
      await this.client.patch(`/companies/${this.companyId}/services/${serviceId}`, cleanData);
    } catch (error: any) {
      // Log detailed error data for 400 Bad Request
      if (error.response && error.response.status === 400) {
        console.error(`Bookla 400 error for service ${serviceId}. Payload:`, JSON.stringify(payload), 'Response:', JSON.stringify(error.response.data));
      }
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

  async getServices(): Promise<any[]> {
    try {
      const response = await this.client.get(`/companies/${this.companyId}/services`);
      // Bookla usually returns an array or { data: [...] }
      return Array.isArray(response.data) ? response.data : (response.data.data || []);
    } catch (error) {
      console.error('Error fetching services from Bookla:', error);
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
