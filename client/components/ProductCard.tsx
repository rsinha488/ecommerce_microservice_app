'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { addToCart } from '@/lib/redux/slices/cartSlice';
import { Product } from '@/lib/redux/slices/productSlice';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [added, setAdded] = useState(false);
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log('Add to Cart clicked for product:', product.id, JSON.stringify(product));
    if (isAuthenticated) {
      dispatch(addToCart(product));
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } else {
      toast.info('Please sign in to add items to your cart.');
      router.push('/login');
    }
  };

  return (
    <Link href={`/products/${product.id}`} className="group">
      <div className="card h-full flex flex-col transition-transform group-hover:scale-105">

        <div className="relative w-full h-48 bg-gray-200 rounded-lg mb-4 overflow-hidden">
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="object-contain bg-white"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">
              📦
            </div>
          )}
        </div>

        <div className="flex-grow">
          <span className="text-xs text-gray-500 uppercase">{product.category}</span>
          <h3 className="text-lg font-semibold text-gray-300 mb-2 line-clamp-2">
            {product.name}
          </h3>
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
        </div>

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
