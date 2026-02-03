import { google } from 'googleapis';
import { Service, BookingRecord } from '../types';

export class GoogleSheetsService {
  private sheets: any;
  private sheetId: string;
  private bookingsSheetChecked: boolean = false;

  constructor(sheetId: string, credentialsJson: string) {
    this.sheetId = sheetId;
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(credentialsJson),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    this.sheets = google.sheets({ version: 'v4', auth });
  }

  async getServices(): Promise<Service[]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.sheetId,
        range: 'A2:V', // Default sheet, columns A to V
      });

      const rows = response.data.values;
      if (!rows || rows.length === 0) {
        return [];
      }

      return rows.map((row: any[], index: number) => {
        return {
          webflow_id: row[0],
          webflow_slug: row[1],
          service_name: row[2],
          bookla_service_id: row[3],
          duration_minutes: parseInt(row[4] || '0'),
          price_eur: parseFloat(row[5] || '0'),
          category_slug: row[6],
          bookla_category_id: row[7],
          resource_slug: row[8],
          bookla_resource_id: row[9],
          capacity_spots: parseInt(row[10] || '1'),
          visible: row[11] === 'TRUE',
          option_extra_slug: row[12],
          option_extra_price: parseFloat(row[13] || '0'),
          option_extra_duration: parseInt(row[14] || '0'),
          bookla_updated_at: row[15],
          notes_internal: row[16],
          service_type: row[17],          // Col R - Service Type Name
          service_type_id: row[18],       // Col S - Service Type ID
          description_short: row[19],     // Col T - Description courte
          description_long: row[20],      // Col U - Description longue
          image_url: row[21],             // Col V - URL image
          rowIndex: index + 2,
        };
      });
    } catch (error) {
      console.error('Error fetching services from Google Sheets:', error);
      throw error;
    }
  }

  async updateRow(rowIndex: number, data: Partial<Service>): Promise<void> {
    try {
      const updates: { range: string; values: any[][] }[] = [];

      // Mapping based on CSV structure (assuming default sheet):
      if (data.webflow_id !== undefined) {
        updates.push({ range: `A${rowIndex}`, values: [[data.webflow_id]] });
      }
      if (data.service_name !== undefined) {
        updates.push({ range: `C${rowIndex}`, values: [[data.service_name]] });
      }
      if (data.bookla_service_id !== undefined) {
        updates.push({ range: `D${rowIndex}`, values: [[data.bookla_service_id]] });
      }
      if (data.duration_minutes !== undefined) {
        updates.push({ range: `E${rowIndex}`, values: [[data.duration_minutes]] });
      }
      if (data.price_eur !== undefined) {
        updates.push({ range: `F${rowIndex}`, values: [[data.price_eur]] });
      }
      if (data.bookla_updated_at !== undefined) {
        updates.push({ range: `P${rowIndex}`, values: [[data.bookla_updated_at]] });
      }
      if (data.service_type !== undefined) {
        updates.push({ range: `R${rowIndex}`, values: [[data.service_type]] });
      }
      if (data.service_type_id !== undefined) {
        updates.push({ range: `S${rowIndex}`, values: [[data.service_type_id]] });
      }
      if (data.description_short !== undefined) {
        updates.push({ range: `T${rowIndex}`, values: [[data.description_short]] });
      }
      if (data.description_long !== undefined) {
        updates.push({ range: `U${rowIndex}`, values: [[data.description_long]] });
      }
      if (data.image_url !== undefined) {
        updates.push({ range: `V${rowIndex}`, values: [[data.image_url]] });
      }

      if (updates.length > 0) {
        await this.performUpdate(rowIndex, updates);
      }
    } catch (error) {
       console.error(`Unexpected error preparing update for row ${rowIndex}:`, error);
    }
  }

  // --- BOOKINGS MANAGEMENT ---

  private async ensureBookingsSheet(): Promise<void> {
    if (this.bookingsSheetChecked) return;

    try {
      const meta = await this.sheets.spreadsheets.get({
        spreadsheetId: this.sheetId,
      });

      const sheets = meta.data.sheets;
      const bookingsSheet = sheets.find((s: any) => s.properties.title === 'Bookings');

      if (!bookingsSheet) {
        console.log('Creating Bookings sheet...');
        await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId: this.sheetId,
          requestBody: {
            requests: [
              {
                addSheet: {
                  properties: { title: 'Bookings' }
                }
              }
            ]
          }
        });
        
        // Add headers
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.sheetId,
          range: 'Bookings!A1:F1',
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [['Booking_ID', 'Client_Email', 'Amount_EUR', 'Status', 'Created_At', 'Checkout_URL']]
          }
        });
      }

      this.bookingsSheetChecked = true;
    } catch (error: any) {
      console.error('Error ensuring Bookings sheet exists:', error.message);
      // Fallback: try to proceed anyway, maybe it exists but we can't read meta?
    }
  }

  async addBooking(booking: BookingRecord): Promise<void> {
    await this.ensureBookingsSheet();

    try {
      const values = [[
        booking.bookingId,
        booking.clientEmail,
        booking.amount,
        booking.status,
        booking.createdAt,
        booking.checkoutUrl || ''
      ]];

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.sheetId,
        range: 'Bookings!A:F',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values }
      });
      console.log(`Booking ${booking.bookingId} added to Sheet.`);
    } catch (error) {
      console.error('Error adding booking to Sheet:', error);
      throw error;
    }
  }

  async getPendingBookings(): Promise<BookingRecord[]> {
    await this.ensureBookingsSheet();

    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.sheetId,
        range: 'Bookings!A2:F',
      });

      const rows = response.data.values;
      if (!rows || rows.length === 0) {
        return [];
      }

      const pending: BookingRecord[] = [];
      rows.forEach((row: any[], index: number) => {
        // Check status (Col D / index 3)
        if (row[3] === 'pending') {
          pending.push({
            bookingId: row[0],
            clientEmail: row[1],
            amount: parseFloat(row[2] || '0'),
            status: row[3],
            createdAt: row[4],
            checkoutUrl: row[5],
            rowIndex: index + 2 // A2 start
          });
        }
      });
      return pending;
    } catch (error) {
      console.error('Error getting pending bookings:', error);
      return [];
    }
  }

  async updateBookingStatus(bookingId: string, status: string): Promise<void> {
     await this.ensureBookingsSheet();

     // First find the row
     // This is inefficient (scan all), but simple for now. 
     // Optimization: Cache bookings or use batchGet.
     
     try {
        const response = await this.sheets.spreadsheets.values.get({
            spreadsheetId: this.sheetId,
            range: 'Bookings!A:A', // Get only IDs
        });
        
        const rows = response.data.values;
        if (!rows) return;

        const rowIndex = rows.findIndex((r: any[]) => r[0] === bookingId);
        
        if (rowIndex !== -1) {
            const actualRowIndex = rowIndex + 1; // 1-based
            await this.sheets.spreadsheets.values.update({
                spreadsheetId: this.sheetId,
                range: `Bookings!D${actualRowIndex}`,
                valueInputOption: 'USER_ENTERED',
                requestBody: {
                    values: [[status]]
                }
            });
            console.log(`Updated booking ${bookingId} status to ${status} in Sheet.`);
        } else {
            console.warn(`Booking ${bookingId} not found in Sheet.`);
        }

     } catch (error) {
         console.error(`Error updating booking status for ${bookingId}:`, error);
         throw error;
     }
  }

  private async performUpdate(rowIndex: number, updates: any[], retryCount = 0): Promise<void> {
    try {
        await this.sheets.spreadsheets.values.batchUpdate({
          spreadsheetId: this.sheetId,
          requestBody: {
            valueInputOption: 'USER_ENTERED',
            data: updates,
          },
        });
    } catch (error: any) {
      if (retryCount < 3 && (error.code === 429 || (error.message && error.message.includes('Quota exceeded')))) {
        const delay = 2000 * (retryCount + 1); // Exponential backoff: 2s, 4s, 6s
        console.warn(`Quota exceeded for row ${rowIndex}, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.performUpdate(rowIndex, updates, retryCount + 1);
      }
      console.error(`Error updating row ${rowIndex} after ${retryCount} retries:`, error);
    }
  }
}
