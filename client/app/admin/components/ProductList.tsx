'use client';

import { useEffect, useState } from 'react';
import Image from "next/image";
import { Product } from '@/lib/redux/slices/productSlice';
import { inventoryApi, InventoryItem } from '@/lib/api/inventory';

/**
 * Product List Component Props
 */
interface ProductListProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  loading: boolean;
}

/**
 * Product List Component
 *
 * Displays products in a responsive table/card layout with action buttons.
 * Supports edit and delete operations for each product.
 *
 * Features:
 * - Responsive design (table on desktop, cards on mobile)
 * - Product image display
 * - Stock status indicators with inventory details
 * - Reserved and Available stock display (NEW)
 * - Quick edit and delete actions
 * - Empty state handling
 * - Loading states
 *
 * @param products - Array of products to display
 * @param onEdit - Callback for edit action
 * @param onDelete - Callback for delete action
 * @param loading - Loading state indicator
 */
export default function ProductList({ products, onEdit, onDelete, loading }: ProductListProps) {
  // State for inventory data
  const [inventoryData, setInventoryData] = useState<Record<string, InventoryItem>>({});
  const [inventoryLoading, setInventoryLoading] = useState(false);

  /**
   * Fetch inventory data for all products
   */
  useEffect(() => {
    const fetchInventory = async () => {
      if (products.length === 0) return;

      setInventoryLoading(true);
      try {
        const skus = products.map(p => p.sku);
        const inventory = await inventoryApi.getBatchInventory(skus);
        setInventoryData(inventory);
      } catch (error) {
        console.error('Failed to fetch inventory:', error);
        // Gracefully handle error - UI will show N/A
      } finally {
        setInventoryLoading(false);
      }
    };

    fetchInventory();
  }, [products]);

  /**
   * Get inventory for a specific product
   */
  const getInventory = (sku: string): InventoryItem | null => {
    return inventoryData[sku] || null;
  };

  /**
   * Format price to currency
   */
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  /**
   * Get stock status badge based on available stock
   */
  const getStockBadge = (sku: string, productStock: number) => {
    const inventory = getInventory(sku);
    const available = inventory ? inventory.available : productStock;

    if (available === 0) {
      return <span className="badge-danger">Out of Stock</span>;
    } else if (available < 10) {
      return <span className="badge-warning">Low Stock</span>;
    } else {
      return <span className="badge-success">In Stock</span>;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading products...</p>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (products.length === 0) {
    return (
      <div className="card">
        <div className="text-center py-12">
          <svg
            className="mx-auto h-24 w-24 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No products found</h3>
          <p className="mt-2 text-gray-600">
            Get started by adding your first product.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden lg:block card overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                SKU
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Stock
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reserved
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Available
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => {
              const inventory = getInventory(product.sku);
              const totalStock = inventory?.stock ?? product.stock;
              const reserved = inventory?.reserved ?? 0;
              const available = inventory?.available ?? product.stock;
              const sold = inventory?.sold ?? 0;

              return (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-12 w-12">
                        <img
                          src={product.images[0] || "https://via.placeholder.com/200?text=No+Image"}
                          alt={product.name}
                          className="h-12 w-12 rounded-lg object-contain bg-white"
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {product.name}
                        </div>
                        <div className="text-sm text-gray-500 line-clamp-1 max-w-xs">
                          {product.description}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 font-mono">{product.sku}</div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 capitalize">{product.category}</div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">
                      {formatPrice(product.price)}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 font-medium">
                      {inventoryLoading ? (
                        <span className="text-gray-400">Loading...</span>
                      ) : (
                        <span>{totalStock} units</span>
                      )}
                    </div>
                    {sold > 0 && (
                      <div className="text-xs text-gray-500">
                        Sold: {sold}
                      </div>
                    )}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    {inventoryLoading ? (
                      <span className="text-xs text-gray-400">...</span>
                    ) : (
                      <div className="flex items-center gap-1">
                        <span className={`text-sm font-medium ${reserved > 0 ? 'text-orange-600' : 'text-gray-500'}`}>
                          {reserved}
                        </span>
                        {reserved > 0 && (
                          <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    )}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    {inventoryLoading ? (
                      <span className="text-xs text-gray-400">...</span>
                    ) : (
                      <div className="text-sm font-bold text-green-600">
                        {available} units
                      </div>
                    )}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStockBadge(product.sku, product.stock)}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => onEdit(product)}
                      className="text-primary-600 hover:text-primary-900 mr-4 transition-colors"
                      title="Edit product"
                    >
                      <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {products.map((product) => {
          const inventory = getInventory(product.sku);
          const totalStock = inventory?.stock ?? product.stock;
          const reserved = inventory?.reserved ?? 0;
          const available = inventory?.available ?? product.stock;
          const sold = inventory?.sold ?? 0;

          return (
            <div key={product.id} className="card">
              <div className="flex gap-4">
                {/* Product Image */}
                <div className="flex-shrink-0">
                  <Image
                    src={product.images[0] || '/placeholder.png'}
                    alt={product.name}
                    width={96}
                    height={96}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {product.name}
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                    {product.description}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                      {product.sku}
                    </span>
                    <span className="text-sm capitalize bg-gray-100 px-2 py-1 rounded">
                      {product.category}
                    </span>
                  </div>
                </div>
              </div>

              {/* Product Details */}
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Price</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatPrice(product.price)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  <div className="mt-1">
                    {getStockBadge(product.sku, product.stock)}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total Stock</p>
                  <p className="text-base font-semibold text-gray-900">
                    {inventoryLoading ? '...' : `${totalStock} units`}
                  </p>
                  {sold > 0 && (
                    <p className="text-xs text-gray-500">Sold: {sold}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-500">Reserved</p>
                  <p className={`text-base font-semibold ${reserved > 0 ? 'text-orange-600' : 'text-gray-500'}`}>
                    {inventoryLoading ? '...' : reserved}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-500">Available for Sale</p>
                  <p className="text-xl font-bold text-green-600">
                    {inventoryLoading ? '...' : `${available} units`}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-4 pt-4 border-t">
                <button
                  onClick={() => onEdit(product)}
                  className="flex-1 btn-secondary flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
                <button
                  onClick={() => onDelete(product)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
