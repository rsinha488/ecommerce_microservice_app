'use client';

import { useState, useEffect } from 'react';
import { useAppDispatch } from '@/lib/redux/hooks';
import { searchProducts } from '@/lib/redux/slices/productSlice';
import { Product } from '@/lib/redux/slices/productSlice';
import ProductGrid from './ProductGrid';

interface ProductsClientProps {
  initialProducts: Product[];
}

export default function ProductsClient({ initialProducts }: ProductsClientProps) {
  const dispatch = useAppDispatch();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setProducts(initialProducts);
      return;
    }

    setIsSearching(true);
    try {
      const results = await dispatch(searchProducts(searchQuery)).unwrap();
      setProducts(results?.data || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setProducts(initialProducts);
  };

  return (
    <div>
      {/* Search Bar */}
      <div className="mb-8">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products..."
            className="input flex-grow"
          />
          <button
            type="submit"
            disabled={isSearching}
            className="btn-primary"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
          {searchQuery && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="btn-secondary"
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {/* Product Grid */}
      <ProductGrid products={products || []} />

      {/* Results Info */}
      {products.length > 0 && (
        <div className="mt-8 text-center text-gray-600">
          Showing {products.length} product{products.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
