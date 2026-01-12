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

  /**
   * Convert minutes to ISO 8601 duration format
   * Examples: 60 -> PT1H, 90 -> PT1H30M, 120 -> PT2H, 45 -> PT45M
   */
  private minutesToISO8601(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0 && mins > 0) {
      return `PT${hours}H${mins}M`;
    } else if (hours > 0) {
      return `PT${hours}H`;
    } else {
      return `PT${mins}M`;
    }
  }

  async getResources(): Promise<any[]> {
    try {
      const response = await this.client.get(`/companies/${this.companyId}/resources`);
      return Array.isArray(response.data) ? response.data : (response.data.data || []);
    } catch (error: any) {
      console.error('Error fetching resources from Bookla:', error.message);
      return [];
    }
  }

  async linkResourceToService(serviceId: string, resourceId: string): Promise<void> {
    try {
      // POST /companies/{id}/services/{serviceId}/links
      await this.client.post(`/companies/${this.companyId}/services/${serviceId}/links`, {
        resourceID: resourceId,
        relatedResourceIDs: {
          all: [],
          any: []
        }
      });
    } catch (error: any) {
      // If resource is already linked or invalid, log but don't fail hard
      console.warn(`Warning: Could not link resource ${resourceId} to service ${serviceId}: ${error.response?.data?.message || error.message}`);
    }
  }

  async getService(id: string): Promise<any> {
    try {
      const response = await this.client.get(`/companies/${this.companyId}/services/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching service ${id}:`, error);
      throw error;
    }
  }

  async createService(payload: any): Promise<string> {
    try {
      const name = payload.title || payload.name;
      const durationMinutes = payload.duration || 60;
      
      // Build settings with proper ISO 8601 duration format
      const settings: any = {
        currency: 'EUR',
        bookingPolicy: 'instant',
        duration: this.minutesToISO8601(durationMinutes),
        timeInterval: 'PT30M',
      };
      
      // Add buffers if specified (default 15 min before and after)
      if (payload.bufferBefore !== undefined) {
        settings.bufferBefore = this.minutesToISO8601(payload.bufferBefore);
      } else {
        settings.bufferBefore = 'PT15M'; // Default 15 min buffer before
      }
      
      if (payload.bufferAfter !== undefined) {
        settings.bufferAfter = this.minutesToISO8601(payload.bufferAfter);
      } else {
        settings.bufferAfter = 'PT15M'; // Default 15 min buffer after
      }
      
      const data: any = {
        name,
        color: payload.color || '#CFC4E8', // Nice purple color like existing services
        type: 'fixed',
        settings,
      };

      // Note: We don't send 'resources' in POST /services as it's not supported there.
      // We will link them AFTER creation.
      
      const response = await this.client.post(`/companies/${this.companyId}/services`, data);
      const serviceId = response.data.id;
      
      // Create price rule if price is provided
      if (payload.price !== undefined && payload.price > 0) {
        await this.createPriceRule(serviceId, payload.price);
      }

      // Link resources if provided
      if (payload.resources && Array.isArray(payload.resources)) {
        for (const resourceId of payload.resources) {
            await this.linkResourceToService(serviceId, resourceId);
        }
      }
      
      return serviceId;
    } catch (error: any) {
      console.error('Error creating Bookla service:', error.response?.data || error.message);
      throw error;
    }
  }

  async updateService(serviceId: string, payload: any): Promise<void> {
    try {
      const data: any = {};
      
      // Name
      if (payload.title || payload.name) {
        data.name = payload.title || payload.name;
      }
      
      // Color
      if (payload.color) {
        data.color = payload.color;
      }
      
      // Settings (duration, buffers)
      if (payload.duration !== undefined || payload.bufferBefore !== undefined || payload.bufferAfter !== undefined) {
        data.settings = {};
        
        if (payload.duration !== undefined) {
          data.settings.duration = this.minutesToISO8601(payload.duration);
        }
        if (payload.bufferBefore !== undefined) {
          data.settings.bufferBefore = this.minutesToISO8601(payload.bufferBefore);
        }
        if (payload.bufferAfter !== undefined) {
          data.settings.bufferAfter = this.minutesToISO8601(payload.bufferAfter);
        }
      }

      // Use PATCH to update
      await this.client.patch(`/companies/${this.companyId}/services/${serviceId}`, data);
    } catch (error: any) {
      if (error.response && error.response.status === 400) {
        console.error(`Bookla 400 error for service ${serviceId}. Payload:`, JSON.stringify(payload), 'Response:', JSON.stringify(error.response.data));
      }
      console.error(`Error updating Bookla service ${serviceId}:`, error.response?.data || error.message);
      throw error;
    }
  }

  async confirmBooking(bookingId: string): Promise<void> {
    try {
      // According to Bookla API: PATCH /companies/{company_id}/bookings/{booking_id}
      await this.client.patch(`/companies/${this.companyId}/bookings/${bookingId}`, {
        status: 'confirmed'
      });
      console.log(`Booking ${bookingId} confirmed on Bookla`);
    } catch (error: any) {
      console.error(`Error confirming Bookla booking ${bookingId}:`, error.response?.data || error.message);
      throw error;
    }
  }

  async cancelBooking(bookingId: string): Promise<void> {
    try {
      // According to Bookla API: PATCH /companies/{company_id}/bookings/{booking_id}
      await this.client.patch(`/companies/${this.companyId}/bookings/${bookingId}`, {
        status: 'cancelled'
      });
      console.log(`Booking ${bookingId} cancelled on Bookla`);
    } catch (error: any) {
      console.error(`Error canceling Bookla booking ${bookingId}:`, error.response?.data || error.message);
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

  async deleteService(serviceId: string): Promise<void> {
    try {
      await this.client.delete(`/companies/${this.companyId}/services/${serviceId}`);
    } catch (error: any) {
      if (error.response?.status === 404) {
        // Already deleted, that's fine
        return;
      }
      console.error(`Error deleting Bookla service ${serviceId}:`, error);
      throw error;
    }
  }

  /**
   * Get price rules for a service
   */
  async getPriceRules(serviceId: string): Promise<any[]> {
    try {
      const response = await this.client.get(`/companies/${this.companyId}/services/${serviceId}/prices`);
      return response.data.rules || [];
    } catch (error: any) {
      if (error.response?.status === 404) {
        return [];
      }
      console.error(`Error getting price rules for service ${serviceId}:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Create a price rule for a service
   * @param serviceId - The service ID
   * @param priceEur - Price in EUR (e.g., 150 for 150€)
   */
  async createPriceRule(serviceId: string, priceEur: number): Promise<string> {
    try {
      const priceCents = Math.round(priceEur * 100); // Convert EUR to cents
      const response = await this.client.post(`/companies/${this.companyId}/services/${serviceId}/prices`, {
        type: 'fixed',
        price: { price: priceCents }
      });
      return response.data.id;
    } catch (error: any) {
      console.error(`Error creating price rule for service ${serviceId}:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Delete a price rule
   */
  async deletePriceRule(serviceId: string, priceRuleId: string): Promise<void> {
    try {
      await this.client.delete(`/companies/${this.companyId}/services/${serviceId}/prices/${priceRuleId}`);
    } catch (error: any) {
      if (error.response?.status === 404) {
        return; // Already deleted
      }
      console.error(`Error deleting price rule ${priceRuleId}:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Set price for a service (creates or updates price rule)
   * Since Bookla doesn't support updating, we delete existing and create new
   */
  async setServicePrice(serviceId: string, priceEur: number): Promise<void> {
    // Get existing price rules
    const existingRules = await this.getPriceRules(serviceId);
    
    // Delete all existing fixed price rules
    for (const rule of existingRules) {
      if (rule.type === 'fixed') {
        await this.deletePriceRule(serviceId, rule.id);
      }
    }
    
    // Create new price rule
    await this.createPriceRule(serviceId, priceEur);
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
