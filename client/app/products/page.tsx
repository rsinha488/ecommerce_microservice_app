'use client';

import { productApi } from '@/lib/api/product';
import { ProductsClient } from '@/components/ProductsClient';
import { Product } from '@/lib/redux/slices/productSlice';
import { useEffect, useState } from 'react';
export const dynamic = "force-dynamic";


/**
 * Products Page (User Dashboard)
 *
 * Displays all available products for browsing and purchasing.
 * Uses client-side rendering to fetch products from the API gateway.
 *
 * Features:
 * - Product browsing with search functionality
 * - Category filtering
 * - Add to cart functionality
 * - Real-time stock status
 * - Responsive grid layout
 *
 * @returns Products page with search and filter capabilities
 */
export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  /**
   * Fetch all products from the API
   */
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await productApi.getProducts({
        page: 1,
        limit: 100, // Load all products
      });
      setProducts(response.data || []); setProducts(response.data || []);

    } catch (err: any) {
      setError(err.message || 'Failed to load products');
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  }
  // Show loading state
  if (loading) {
    return (
      <div className="container-custom py-12">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading products...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-custom py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-300 mb-2">All Products</h1>
        <p className="text-gray-600">
          Browse our collection of quality products
        </p>
      </div>

      {/* Client-side filters and search */}
      <ProductsClient initialProducts={products} />

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <strong className="font-bold">Error: </strong>
          <span>{error}</span>
        </div>
      )}

      {!error && !loading && products.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600">No products found</p>
        </div>
      )}
    </div>
  );
}



