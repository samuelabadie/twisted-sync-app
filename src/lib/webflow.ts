import axios, { AxiosInstance } from 'axios';

export class WebflowClient {
  private client: AxiosInstance;
  private siteId: string;

  constructor(apiToken: string, siteId: string) {
    this.siteId = siteId;
    this.client = axios.create({
      baseURL: 'https://api.webflow.com/v2',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
  }

  async findItemBySlug(collectionId: string, slug: string): Promise<string | null> {
    try {
      // Note: Webflow API pagination might be needed for large collections
      const response = await this.client.get(`/collections/${collectionId}/items`);
      const items = response.data.items;
      const item = items.find((i: any) => i.fieldData.slug === slug);
      return item ? item.id : null;
    } catch (error) {
      console.error('Error finding Webflow item:', error);
      return null;
    }
  }

  async createItem(collectionId: string, payload: any): Promise<string> {
    try {
      const response = await this.client.post(`/collections/${collectionId}/items`, {
        fieldData: payload,
      });
      return response.data.id;
    } catch (error) {
      console.error('Error creating Webflow item:', error);
      throw error;
    }
  }

  async updateItem(collectionId: string, itemId: string, payload: any): Promise<void> {
    try {
      await this.client.patch(`/collections/${collectionId}/items/${itemId}`, {
        fieldData: payload,
      });
    } catch (error) {
      console.error(`Error updating Webflow item ${itemId}:`, error);
      throw error;
    }
  }
}
