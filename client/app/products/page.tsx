'use client';

import { productApi } from '@/lib/api/product';
import { ProductsClient } from '@/components/ProductsClient';
import { Product } from '@/lib/redux/slices/productSlice';
import { useEffect, useState, useMemo } from 'react';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  // Infinite scroll for products
  const fetchProducts = async (page: number, pageSize: number) => {
    const response = await productApi.getProducts({ page, limit: pageSize });
    return response.data || [];
  };

  const {
    items: products,
    loading,
    error: scrollError,
    hasMore,
    setLastElementRef,
  } = useInfiniteScroll<Product>(fetchProducts, 1, 20);

  const [error, setError] = useState<string | null>(scrollError);

  // Update error state when scroll error occurs
  useEffect(() => {
    if (scrollError) {
      setError(scrollError);
    }
  }, [scrollError]);

  // Filter products based on search and category
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = !filterCategory || product.category === filterCategory;

      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, filterCategory]);

  // Get unique categories from products
  const categories = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.category)));
  }, [products]);

  // Show loading state only on initial load
  if (loading && products.length === 0) {
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

      {/* Search and Filter */}
      <div className="card mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input w-full"
            />
          </div>
          <div className="w-full md:w-48">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="input w-full"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
        {/* {(searchTerm || filterCategory) && (
          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredProducts.length} of {products.length} products
          </div>
        )} */}
      </div>

      {/* Product Grid */}
      <ProductsClient initialProducts={filteredProducts} />

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

      {/* Infinite Scroll Trigger */}
      {hasMore && !loading && products.length > 0 && (
        <div ref={setLastElementRef} className="py-8 text-center">
          <div className="animate-pulse text-gray-600">Loading more products...</div>
        </div>
      )}

      {/* Loading More Indicator */}
      {loading && products.length > 0 && (
        <div className="py-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading more products...</p>
        </div>
      )}

      {/* No More Items */}
      {!hasMore && products.length > 0 && !loading && (
        <div className="py-8 text-center text-gray-500">
          <p>All products loaded</p>
        </div>
      )}
    </div>
  );
}



