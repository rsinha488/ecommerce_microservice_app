'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAppDispatch } from '@/lib/redux/hooks';
import { addToCart } from '@/lib/redux/slices/cartSlice';
import { Product } from '@/lib/redux/slices/productSlice';
import { useState } from 'react';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const dispatch = useAppDispatch();
  const [added, setAdded] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    dispatch(addToCart(product));
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <Link href={`/products/${product._id}`} className="group">
      <div className="card h-full flex flex-col transition-transform group-hover:scale-105">
        {/* Product Image */}
        <div className="relative w-full h-48 bg-gray-200 rounded-lg mb-4 overflow-hidden">
          {product.images && product.images[0] ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">
              📦
            </div>
          )}
          {product.stock < 10 && product.stock > 0 && (
            <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded">
              Low Stock
            </div>
          )}
          {product.stock === 0 && (
            <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
              Out of Stock
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex-grow">
          <div className="mb-2">
            <span className="text-xs text-gray-500 uppercase">{product.category}</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
            {product.name}
          </h3>
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {product.description}
          </p>
        </div>

        {/* Price and Action */}
        <div className="flex items-center justify-between mt-auto pt-4 border-t">
          <div>
            <p className="text-2xl font-bold text-primary-600">
              ${product.price.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500">{product.stock} in stock</p>
          </div>
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              added
                ? 'bg-green-500 text-white'
                : product.stock === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-primary-600 text-white hover:bg-primary-700'
            }`}
          >
            {added ? '✓ Added' : product.stock === 0 ? 'Unavailable' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </Link>
  );
}

