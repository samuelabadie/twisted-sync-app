import axios, { AxiosInstance } from 'axios';

export class WebflowClient {
  private client: AxiosInstance;
  private siteId: string;
  private itemsCache: Map<string, any> | null = null; // Cache for all items

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

  // Fetch all items once and cache them (avoids repeated API calls)
  async getAllItems(collectionId: string): Promise<Map<string, any>> {
    if (this.itemsCache) return this.itemsCache;

    this.itemsCache = new Map();
    let offset = 0;
    const limit = 100;

    while (true) {
      const response = await this.client.get(`/collections/${collectionId}/items?limit=${limit}&offset=${offset}`);
      const items = response.data.items || [];
      
      for (const item of items) {
        // Index by bookla-id for easy lookup
        const booklaId = item.fieldData?.['bookla-id'];
        if (booklaId) {
          this.itemsCache.set(booklaId, item);
        }
      }

      if (items.length < limit) break;
      offset += limit;
    }

    return this.itemsCache;
  }

  // Find item by bookla-id (uses cache)
  async findItemByBooklaId(collectionId: string, booklaId: string): Promise<any | null> {
    const items = await this.getAllItems(collectionId);
    return items.get(booklaId) || null;
  }

  // Find item by Webflow ID directly
  async getItemById(collectionId: string, itemId: string): Promise<any | null> {
    try {
      const response = await this.client.get(`/collections/${collectionId}/items/${itemId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null; // Item doesn't exist
      }
      throw error;
    }
  }

  async findItemBySlug(collectionId: string, slug: string): Promise<string | null> {
    try {
      const response = await this.client.get(`/collections/${collectionId}/items`);
      const items = response.data.items;
      const item = items.find((i: any) => i.fieldData.slug === slug);
      return item ? item.id : null;
    } catch (error) {
      console.error('Error finding Webflow item:', error);
      return null;
    }
  }

  async createItem(collectionId: string, payload: any, publish: boolean = true): Promise<string> {
    try {
      const url = publish 
        ? `/collections/${collectionId}/items/live` 
        : `/collections/${collectionId}/items`;
      const response = await this.client.post(url, {
        fieldData: payload,
      });
      // Invalidate cache
      this.itemsCache = null;
      return response.data.id;
    } catch (error) {
      console.error('Error creating Webflow item:', error);
      throw error;
    }
  }

  async updateItem(collectionId: string, itemId: string, payload: any, publish: boolean = true): Promise<void> {
    try {
      const url = publish 
        ? `/collections/${collectionId}/items/${itemId}/live` 
        : `/collections/${collectionId}/items/${itemId}`;
      await this.client.patch(url, {
        fieldData: payload,
      });
      // Invalidate cache
      this.itemsCache = null;
    } catch (error) {
      console.error(`Error updating Webflow item ${itemId}:`, error);
      throw error;
    }
  }
}
