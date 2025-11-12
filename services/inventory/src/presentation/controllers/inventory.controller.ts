import { Controller, Post, Body, Param, Get, Query } from '@nestjs/common';
import { CreateItemUseCase } from '../../application/use-cases/create-item.usecase';
import { GetItemUseCase } from '../../application/use-cases/get-item.usecase';
import { ListItemsUseCase } from '../../application/use-cases/list-items.usecase';
import { CreateInventoryItemDto } from '../../application/dto/create-inventory-item.dto';
import { FilterInventoryDto } from '../../application/dto/filter-inventory.dto';
import { InventoryRepository } from '../../infrastructure/repositories/inventory.repository';

/**
 * ✅ Inventory Controller
 *
 * REST API endpoints for inventory management
 *
 * Endpoints:
 * - POST /inventory - Create inventory item
 * - GET /inventory/:sku - Get inventory by SKU
 * - GET /inventory - List inventory items
 * - GET /inventory/batch - Get inventory for multiple SKUs (NEW)
 */
@Controller('inventory/inventory')
export class InventoryController {
  constructor(
    private readonly createUseCase: CreateItemUseCase,
    private readonly getUseCase: GetItemUseCase,
    private readonly listUseCase: ListItemsUseCase,
    private readonly inventoryRepository: InventoryRepository,
  ) {}

  /**
   * Create new inventory item
   */
  @Post()
  create(@Body() dto: CreateInventoryItemDto) {
    return this.createUseCase.execute(dto);
  }

  /**
   * ✅ NEW: Get inventory for multiple SKUs (batch operation)
   * Used by admin dashboard to show reserved/available stock for all products
   *
   * Query: GET /inventory/batch?skus=SKU-001,SKU-002,SKU-003
   */
  @Get('batch')
  async getBatch(@Query('skus') skusParam: string) {
    try {
      if (!skusParam) {
        return {
          success: false,
          message: 'SKUs parameter is required',
          data: {},
        };
      }

      // Parse comma-separated SKUs
      const skus = skusParam.split(',').map(s => s.trim()).filter(Boolean);

      if (skus.length === 0) {
        return {
          success: false,
          message: 'At least one SKU is required',
          data: {},
        };
      }

      // Fetch inventory for all SKUs
      const inventoryPromises = skus.map(async (sku) => {
        try {
          const inventory = await this.inventoryRepository.findBySku(sku);
          if (inventory) {
            return {
              sku,
              stock: inventory.stock,
              reserved: inventory.reserved,
              sold: inventory.sold,
              available: inventory.stock - inventory.reserved,
            };
          }
          return {
            sku,
            stock: 0,
            reserved: 0,
            sold: 0,
            available: 0,
          };
        } catch (error) {
          // If SKU not found, return zeros
          return {
            sku,
            stock: 0,
            reserved: 0,
            sold: 0,
            available: 0,
          };
        }
      });

      const inventoryItems = await Promise.all(inventoryPromises);

      // Create a map for easy lookup
      const inventoryMap: Record<string, any> = {};
      inventoryItems.forEach(item => {
        inventoryMap[item.sku] = item;
      });

      return {
        success: true,
        message: 'Inventory data fetched successfully',
        data: inventoryMap,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch batch inventory',
        data: {},
      };
    }
  }

  /**
   * Get single inventory item by SKU
   */
  @Get(':sku')
  async getOne(@Param('sku') sku: string) {
    try {
      const inventory = await this.getUseCase.execute(sku);
      if (!inventory) {
        return {
          success: false,
          message: 'Inventory not found',
        };
      }
      return {
        success: true,
        data: {
          ...inventory,
          available: inventory.stock - inventory.reserved,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Inventory not found',
      };
    }
  }

  /**
   * List all inventory items
   */
  @Get()
  async list(@Query() q: FilterInventoryDto) {
    try {
      const items = await this.listUseCase.execute(q);
      // Add available stock calculation to each item
      const enhancedItems = items.map(item => ({
        ...item,
        available: item.stock - item.reserved,
      }));
      return {
        success: true,
        data: enhancedItems,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch inventory',
        data: [],
      };
    }
  }
}
