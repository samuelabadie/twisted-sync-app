import { neon, NeonQueryFunction } from '@neondatabase/serverless';
import { Service, BookingRecord } from '../types';

export class DatabaseService {
  private sql: NeonQueryFunction<false, false>;

  constructor(databaseUrl?: string) {
    const url = databaseUrl || process.env.DATABASE_URL;
    if (!url) {
      throw new Error('DATABASE_URL is required');
    }
    this.sql = neon(url);
  }

  // ===== SERVICES =====

  async getServices(): Promise<Service[]> {
    try {
      const rows = await this.sql`
        SELECT
          id,
          webflow_id,
          webflow_slug,
          service_name,
          bookla_service_id,
          duration_minutes,
          price_eur,
          category_slug,
          bookla_category_id,
          resource_slug,
          bookla_resource_id,
          capacity_spots,
          visible,
          option_extra_slug,
          option_extra_price,
          option_extra_duration,
          bookla_updated_at,
          notes_internal,
          service_type,
          service_type_id,
          description_short,
          description_long,
          image_url
        FROM services
        ORDER BY id ASC
      `;

      return rows.map((row: any) => ({
        webflow_id: row.webflow_id,
        webflow_slug: row.webflow_slug,
        service_name: row.service_name,
        bookla_service_id: row.bookla_service_id,
        duration_minutes: row.duration_minutes,
        price_eur: parseFloat(row.price_eur),
        category_slug: row.category_slug,
        bookla_category_id: row.bookla_category_id,
        resource_slug: row.resource_slug,
        bookla_resource_id: row.bookla_resource_id,
        capacity_spots: row.capacity_spots,
        visible: row.visible,
        option_extra_slug: row.option_extra_slug,
        option_extra_price: row.option_extra_price ? parseFloat(row.option_extra_price) : 0,
        option_extra_duration: row.option_extra_duration,
        bookla_updated_at: row.bookla_updated_at,
        notes_internal: row.notes_internal,
        service_type: row.service_type,
        service_type_id: row.service_type_id,
        description_short: row.description_short,
        description_long: row.description_long,
        image_url: row.image_url,
        rowIndex: row.id, // Use id as rowIndex for compatibility
      }));
    } catch (error) {
      console.error('Error fetching services from database:', error);
      throw error;
    }
  }

  async getServiceBySlug(slug: string): Promise<Service | null> {
    try {
      const rows = await this.sql`
        SELECT
          id,
          webflow_id,
          webflow_slug,
          service_name,
          bookla_service_id,
          duration_minutes,
          price_eur,
          category_slug,
          bookla_category_id,
          resource_slug,
          bookla_resource_id,
          capacity_spots,
          visible,
          option_extra_slug,
          option_extra_price,
          option_extra_duration,
          bookla_updated_at,
          notes_internal,
          service_type,
          service_type_id,
          description_short,
          description_long,
          image_url
        FROM services
        WHERE webflow_slug = ${slug}
        LIMIT 1
      `;

      if (rows.length === 0) return null;

      const row = rows[0];
      return {
        webflow_id: row.webflow_id,
        webflow_slug: row.webflow_slug,
        service_name: row.service_name,
        bookla_service_id: row.bookla_service_id,
        duration_minutes: row.duration_minutes,
        price_eur: parseFloat(row.price_eur),
        category_slug: row.category_slug,
        bookla_category_id: row.bookla_category_id,
        resource_slug: row.resource_slug,
        bookla_resource_id: row.bookla_resource_id,
        capacity_spots: row.capacity_spots,
        visible: row.visible,
        option_extra_slug: row.option_extra_slug,
        option_extra_price: row.option_extra_price ? parseFloat(row.option_extra_price) : 0,
        option_extra_duration: row.option_extra_duration,
        bookla_updated_at: row.bookla_updated_at,
        notes_internal: row.notes_internal,
        service_type: row.service_type,
        service_type_id: row.service_type_id,
        description_short: row.description_short,
        description_long: row.description_long,
        image_url: row.image_url,
        rowIndex: row.id,
      };
    } catch (error) {
      console.error('Error fetching service by slug:', error);
      throw error;
    }
  }

  async createService(data: Omit<Service, 'rowIndex'>): Promise<number> {
    try {
      const result = await this.sql`
        INSERT INTO services (
          webflow_id,
          webflow_slug,
          service_name,
          bookla_service_id,
          duration_minutes,
          price_eur,
          category_slug,
          bookla_category_id,
          resource_slug,
          bookla_resource_id,
          capacity_spots,
          visible,
          option_extra_slug,
          option_extra_price,
          option_extra_duration,
          bookla_updated_at,
          notes_internal,
          service_type,
          service_type_id,
          description_short,
          description_long,
          image_url
        ) VALUES (
          ${data.webflow_id || null},
          ${data.webflow_slug},
          ${data.service_name},
          ${data.bookla_service_id || null},
          ${data.duration_minutes},
          ${data.price_eur},
          ${data.category_slug || null},
          ${data.bookla_category_id || null},
          ${data.resource_slug || null},
          ${data.bookla_resource_id || null},
          ${data.capacity_spots || 1},
          ${data.visible},
          ${data.option_extra_slug || null},
          ${data.option_extra_price || 0},
          ${data.option_extra_duration || 0},
          ${data.bookla_updated_at || null},
          ${data.notes_internal || null},
          ${data.service_type || null},
          ${data.service_type_id || null},
          ${data.description_short || null},
          ${data.description_long || null},
          ${data.image_url || null}
        )
        RETURNING id
      `;
      return result[0].id;
    } catch (error) {
      console.error('Error creating service:', error);
      throw error;
    }
  }

  async updateRow(rowIndex: number, data: Partial<Service>): Promise<void> {
    try {
      // For Neon serverless, we need to use tagged templates
      // We'll fetch the current record, merge, and update all fields
      const current = await this.sql`SELECT * FROM services WHERE id = ${rowIndex}`;
      if (current.length === 0) {
        throw new Error(`Service with id ${rowIndex} not found`);
      }

      const merged = { ...current[0], ...data };

      await this.sql`
        UPDATE services SET
          webflow_id = ${merged.webflow_id},
          webflow_slug = ${merged.webflow_slug},
          service_name = ${merged.service_name},
          bookla_service_id = ${merged.bookla_service_id},
          duration_minutes = ${merged.duration_minutes},
          price_eur = ${merged.price_eur},
          category_slug = ${merged.category_slug},
          bookla_category_id = ${merged.bookla_category_id},
          resource_slug = ${merged.resource_slug},
          bookla_resource_id = ${merged.bookla_resource_id},
          capacity_spots = ${merged.capacity_spots},
          visible = ${merged.visible},
          option_extra_slug = ${merged.option_extra_slug},
          option_extra_price = ${merged.option_extra_price},
          option_extra_duration = ${merged.option_extra_duration},
          bookla_updated_at = ${merged.bookla_updated_at},
          notes_internal = ${merged.notes_internal},
          service_type = ${merged.service_type},
          service_type_id = ${merged.service_type_id},
          description_short = ${merged.description_short},
          description_long = ${merged.description_long},
          image_url = ${merged.image_url},
          updated_at = NOW()
        WHERE id = ${rowIndex}
      `;
    } catch (error) {
      console.error(`Error updating service ${rowIndex}:`, error);
      throw error;
    }
  }

  async updateService(id: number, data: Partial<Service>): Promise<void> {
    // Alias for updateRow for cleaner API
    return this.updateRow(id, data);
  }

  async deleteService(id: number): Promise<void> {
    try {
      await this.sql`DELETE FROM services WHERE id = ${id}`;
    } catch (error) {
      console.error(`Error deleting service ${id}:`, error);
      throw error;
    }
  }

  async deleteServiceByWebflowId(webflowId: string): Promise<void> {
    try {
      await this.sql`DELETE FROM services WHERE webflow_id = ${webflowId}`;
    } catch (error) {
      console.error(`Error deleting service by webflow_id ${webflowId}:`, error);
      throw error;
    }
  }

  // ===== BOOKINGS =====

  async addBooking(booking: BookingRecord): Promise<void> {
    try {
      await this.sql`
        INSERT INTO bookings (
          booking_id,
          client_email,
          client_name,
          client_phone,
          amount,
          status,
          checkout_url,
          created_at
        ) VALUES (
          ${booking.bookingId},
          ${booking.clientEmail},
          ${booking.clientName || null},
          ${booking.clientPhone || null},
          ${booking.amount},
          ${booking.status},
          ${booking.checkoutUrl || null},
          ${booking.createdAt}
        )
        ON CONFLICT (booking_id) DO UPDATE SET
          status = ${booking.status},
          client_name = COALESCE(${booking.clientName || null}, bookings.client_name),
          client_phone = COALESCE(${booking.clientPhone || null}, bookings.client_phone),
          checkout_url = ${booking.checkoutUrl || null},
          updated_at = NOW()
      `;
      console.log(`Booking ${booking.bookingId} added to database.`);
    } catch (error) {
      console.error('Error adding booking to database:', error);
      throw error;
    }
  }

  async getPendingBookings(): Promise<BookingRecord[]> {
    try {
      const rows = await this.sql`
        SELECT
          id,
          booking_id,
          client_email,
          client_name,
          client_phone,
          amount,
          status,
          checkout_url,
          created_at
        FROM bookings
        WHERE status = 'pending'
        ORDER BY created_at ASC
      `;

      return rows.map((row: any) => ({
        bookingId: row.booking_id,
        clientEmail: row.client_email,
        clientName: row.client_name,
        clientPhone: row.client_phone,
        amount: parseFloat(row.amount),
        status: row.status,
        createdAt: row.created_at,
        checkoutUrl: row.checkout_url,
        rowIndex: row.id,
      }));
    } catch (error) {
      console.error('Error getting pending bookings:', error);
      return [];
    }
  }

  async updateBookingStatus(bookingId: string, status: string): Promise<void> {
    try {
      await this.sql`
        UPDATE bookings
        SET status = ${status}, updated_at = NOW()
        WHERE booking_id = ${bookingId}
      `;
      console.log(`Updated booking ${bookingId} status to ${status} in database.`);
    } catch (error) {
      console.error(`Error updating booking status for ${bookingId}:`, error);
      throw error;
    }
  }

  async getAllBookings(): Promise<any[]> {
    try {
      const rows = await this.sql`
        SELECT
          id,
          booking_id,
          client_email,
          client_name,
          client_phone,
          amount,
          status,
          checkout_url,
          created_at,
          updated_at
        FROM bookings
        ORDER BY created_at DESC
        LIMIT 100
      `;

      return rows.map((row: any) => ({
        id: row.id,
        booking_id: row.booking_id,
        client_email: row.client_email,
        client_name: row.client_name,
        client_phone: row.client_phone,
        amount: parseFloat(row.amount),
        status: row.status,
        checkout_url: row.checkout_url,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }));
    } catch (error) {
      console.error('Error getting all bookings:', error);
      return [];
    }
  }

  async deleteBooking(bookingId: string): Promise<void> {
    try {
      await this.sql`DELETE FROM bookings WHERE booking_id = ${bookingId}`;
    } catch (error) {
      console.error(`Error deleting booking ${bookingId}:`, error);
      throw error;
    }
  }

  // ===== UTILITY =====

  async countServices(): Promise<number> {
    const result = await this.sql`SELECT COUNT(*) as count FROM services`;
    return parseInt(result[0].count);
  }

  async countBookings(): Promise<number> {
    const result = await this.sql`SELECT COUNT(*) as count FROM bookings`;
    return parseInt(result[0].count);
  }
}
