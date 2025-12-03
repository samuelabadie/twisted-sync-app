import axios, { AxiosInstance } from 'axios';
import { ServiceType } from '../types';

export class WebflowClient {
  private client: AxiosInstance;
  private siteId: string;
  private itemsCache: Map<string, any> | null = null; // Cache for all items
  private serviceTypesCache: ServiceType[] | null = null; // Cache for service types

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

  async deleteItem(collectionId: string, itemId: string): Promise<void> {
    try {
      await this.client.delete(`/collections/${collectionId}/items/${itemId}`);
      // Invalidate cache
      this.itemsCache = null;
    } catch (error) {
      console.error(`Error deleting Webflow item ${itemId}:`, error);
      throw error;
    }
  }

  // ========== SERVICE TYPES ==========

  /**
   * Get all service types from Webflow
   */
  async getServiceTypes(collectionId: string): Promise<ServiceType[]> {
    if (this.serviceTypesCache) return this.serviceTypesCache;

    const types: ServiceType[] = [];
    let offset = 0;
    const limit = 100;

    while (true) {
      const response = await this.client.get(`/collections/${collectionId}/items?limit=${limit}&offset=${offset}`);
      const items = response.data.items || [];

      for (const item of items) {
        types.push({
          id: item.id,
          name: item.fieldData?.name || '',
          slug: item.fieldData?.slug || '',
          serviceIds: item.fieldData?.service || [], // Multi-reference field
          categoryIds: item.fieldData?.['categorie'] || [], // Multi-reference field (homme/femme)
        });
      }

      if (items.length < limit) break;
      offset += limit;
    }

    this.serviceTypesCache = types;
    return types;
  }

  /**
   * Find which service type contains a given service ID
   */
  async findServiceTypeByServiceId(typeCollectionId: string, serviceId: string): Promise<ServiceType | null> {
    const types = await this.getServiceTypes(typeCollectionId);
    return types.find(t => t.serviceIds.includes(serviceId)) || null;
  }

  /**
   * Add a service to a service type's multi-reference field
   */
  async addServiceToType(typeCollectionId: string, typeId: string, serviceId: string): Promise<void> {
    try {
      // First get the current service type to get existing services
      const response = await this.client.get(`/collections/${typeCollectionId}/items/${typeId}`);
      const currentServiceIds: string[] = response.data.fieldData?.service || [];

      // Add the new service if not already present
      if (!currentServiceIds.includes(serviceId)) {
        const updatedServiceIds = [...currentServiceIds, serviceId];
        await this.client.patch(`/collections/${typeCollectionId}/items/${typeId}/live`, {
          fieldData: {
            service: updatedServiceIds,
          },
        });
        // Invalidate cache
        this.serviceTypesCache = null;
      }
    } catch (error) {
      console.error(`Error adding service ${serviceId} to type ${typeId}:`, error);
      throw error;
    }
  }

  /**
   * Remove a service from a service type's multi-reference field
   */
  async removeServiceFromType(typeCollectionId: string, typeId: string, serviceId: string): Promise<void> {
    try {
      const response = await this.client.get(`/collections/${typeCollectionId}/items/${typeId}`);
      const currentServiceIds: string[] = response.data.fieldData?.service || [];

      const updatedServiceIds = currentServiceIds.filter(id => id !== serviceId);
      
      if (updatedServiceIds.length !== currentServiceIds.length) {
        await this.client.patch(`/collections/${typeCollectionId}/items/${typeId}/live`, {
          fieldData: {
            service: updatedServiceIds,
          },
        });
        // Invalidate cache
        this.serviceTypesCache = null;
      }
    } catch (error) {
      console.error(`Error removing service ${serviceId} from type ${typeId}:`, error);
      throw error;
    }
  }

  /**
   * Create a new service type
   */
  async createServiceType(collectionId: string, name: string, slug: string, categoryIds: string[] = []): Promise<string> {
    try {
      const response = await this.client.post(`/collections/${collectionId}/items/live`, {
        fieldData: {
          name,
          slug,
          service: [],
          categorie: categoryIds,
        },
      });
      // Invalidate cache
      this.serviceTypesCache = null;
      return response.data.id;
    } catch (error) {
      console.error('Error creating service type:', error);
      throw error;
    }
  }

  /**
   * Clear the service types cache
   */
  clearServiceTypesCache(): void {
    this.serviceTypesCache = null;
  }
}
