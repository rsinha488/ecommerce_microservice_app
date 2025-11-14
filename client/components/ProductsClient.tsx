'use client';

import { useState, useEffect } from 'react';
import { Product } from '@/lib/redux/slices/productSlice';
import ProductGrid from './ProductGrid';

interface ProductsClientProps {
  initialProducts: Product[];
}

export function ProductsClient({ initialProducts }: ProductsClientProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);

  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  return (
    <div>
      
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
