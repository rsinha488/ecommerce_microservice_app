import { inventoryClient } from './client';

/**
 * Inventory Item Interface
 */
export interface InventoryItem {
  sku: string;
  stock: number;
  reserved: number;
  sold: number;
  available: number;
  location?: string;
}

/**
 * Batch Inventory Response
 */
export interface BatchInventoryResponse {
  success: boolean;
  message: string;
  data: Record<string, InventoryItem>;
}

/**
 * ✅ Inventory API Client
 *
 * Handles all inventory-related API calls
 *
 * Features:
 * - Get inventory by SKU
 * - Get batch inventory for multiple SKUs
 * - List all inventory items
 *
 * Base URL: /inventory
 */
export const inventoryApi = {
  /**
   * Get inventory for a single SKU
   *
   * @param sku - Product SKU
   * @returns Inventory details
   */
  async getInventoryBySku(sku: string): Promise<InventoryItem> {
    const response = await inventoryClient.get(`/inventory/${sku}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch inventory');
    }
    return response.data.data;
  },

  /**
   * Get inventory for multiple SKUs (batch operation)
   *
   * @param skus - Array of product SKUs
   * @returns Map of SKU to inventory data
   *
   * @example
   * const inventory = await inventoryApi.getBatchInventory(['SKU-001', 'SKU-002']);
   * console.log(inventory['SKU-001'].available); // 85
   */
  async getBatchInventory(skus: string[]): Promise<Record<string, InventoryItem>> {
    if (skus.length === 0) {
      return {};
    }

    // Join SKUs with comma for query parameter
    const skusParam = skus.join(',');

    const response = await inventoryClient.get<BatchInventoryResponse>(
      `/inventory/batch?skus=${encodeURIComponent(skusParam)}`
    );

    if (!response.data.success) {
      console.warn('Failed to fetch batch inventory:', response.data.message);
      // Return empty object instead of throwing to allow graceful degradation
      return {};
    }

    return response.data.data;
  },

  /**
   * List all inventory items
   *
   * @returns Array of inventory items
   */
  async listInventory(): Promise<InventoryItem[]> {
    const response = await inventoryClient.get('/inventory');
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch inventory list');
    }
    return response.data.data;
  },
};
