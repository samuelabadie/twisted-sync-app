import { google } from 'googleapis';
import { Service } from '../types';

export class GoogleSheetsService {
  private sheets: any;
  private sheetId: string;

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
        range: 'A2:Q', // A to Q based on new CSV
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

      // Mapping based on new CSV structure:
      // Webflow_ID = Col A (0)
      // Bookla_ServiceID = Col D (3)
      // Bookla_UpdatedAt = Col P (15)

      if (data.webflow_id !== undefined) {
        updates.push({ range: `A${rowIndex}`, values: [[data.webflow_id]] });
      }
      if (data.bookla_service_id !== undefined) {
        updates.push({ range: `D${rowIndex}`, values: [[data.bookla_service_id]] });
      }
      if (data.bookla_updated_at !== undefined) {
        updates.push({ range: `P${rowIndex}`, values: [[data.bookla_updated_at]] });
      }

      if (updates.length > 0) {
        await this.sheets.spreadsheets.values.batchUpdate({
          spreadsheetId: this.sheetId,
          requestBody: {
            valueInputOption: 'USER_ENTERED',
            data: updates,
          },
        });
      }
    } catch (error) {
      console.error(`Error updating row ${rowIndex}:`, error);
      throw error;
    }
  }
}
