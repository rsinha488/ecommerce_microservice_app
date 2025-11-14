'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { fetchProductById, fetchProducts } from '@/lib/redux/slices/productSlice';
import { addToCart } from '@/lib/redux/slices/cartSlice';
import { toast } from 'react-toastify';
import ProductCard from '@/components/ProductCard';

/**
 * Product Details Page
 *
 * Displays comprehensive product information with:
 * - Image gallery with main image and thumbnails
 * - Product details (name, price, description, stock)
 * - Add to cart functionality
 * - Related products by category
 * - Breadcrumb navigation
 * - Responsive design with smooth animations
 */
export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const productId = params.id as string;
  const { selectedProduct, loading, error, products } = useAppSelector((state) => state.product);
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);

  // Fetch product details on mount
  useEffect(() => {
    if (productId) {
      dispatch(fetchProductById(productId))
        .unwrap()
        .catch((err) => {
          console.error('Error fetching product:', err);
          toast.error('Failed to load product details');
        });

      // Fetch all products for related products section if not already loaded
      if (products.length === 0) {
        dispatch(fetchProducts({ limit: 50 }));
      }
    }
  }, [productId, dispatch, products.length]);

  // Use selected product directly
  const product = selectedProduct;

  // Update selected image when product loads
  useEffect(() => {
    if (product?.images && product.images.length > 0) {
      setSelectedImage(0);
    }
  }, [product]);

  // Handle add to cart
  const handleAddToCart = () => {
    if (!isAuthenticated) {
      toast.info('Please sign in to add items to your cart.');
      router.push('/login');
      return;
    }

    if (!product) return;

    // Add multiple items based on quantity
    for (let i = 0; i < quantity; i++) {
      dispatch(addToCart(product));
    }

    setAddedToCart(true);
    toast.success(`Added ${quantity} ${quantity > 1 ? 'items' : 'item'} to cart!`);

    setTimeout(() => setAddedToCart(false), 3000);
  };

  // Get related products (same category, exclude current product)
  const relatedProducts = product
    ? products
        .filter((p) => p.category === product.category && p.id !== product.id)
        .slice(0, 4)
    : [];

  // Loading state
  if (loading && !product) {
    return (
      <div className="container-custom py-12">
        <div className="flex items-center justify-center min-h-[600px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading product details...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !product) {
    return (
      <div className="container-custom py-12">
        <div className="text-center min-h-[600px] flex flex-col items-center justify-center">
          <div className="text-6xl mb-4">📦</div>
          <h1 className="text-2xl font-bold text-gray-300 mb-2">Product Not Found</h1>
          <p className="text-gray-600 mb-6">
            {error || 'The product you are looking for does not exist.'}
          </p>
          <Link href="/products" className="btn-primary">
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  const isInStock = product.stock > 0;
  const stockStatus = product.stock === 0 ? 'Out of Stock' : product.stock < 10 ? `Only ${product.stock} left!` : 'In Stock';
  const stockColorClass = product.stock === 0 ? 'text-red-600' : product.stock < 10 ? 'text-orange-600' : 'text-green-600';

  return (
    <div className="container-custom py-8 animate-fade-in">

      {/* Main Product Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
        {/* Image Gallery */}
        <div className="space-y-4">
          {/* Main Image */}
          <div className="relative w-full h-[500px] bg-gradient-to-br from-primary-50 via-secondary-50 to-accent-50 rounded-2xl shadow-xl overflow-hidden group border border-primary-100">
            {product.images && product.images.length > 0 ? (
              <div className="relative w-full h-full p-4">
                <Image
                  src={product.images[selectedImage]}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
                  className="object-contain transition-transform duration-300 group-hover:scale-105"
                  priority
                />
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-9xl">
                📦
              </div>
            )}

            {/* Stock Badge */}
            <div className="absolute top-4 right-4 z-10">
              <span className={`px-4 py-2 rounded-full text-sm font-semibold shadow-lg backdrop-blur-sm ${
                isInStock ? 'bg-green-100/90 text-green-800' : 'bg-red-100/90 text-red-800'
              }`}>
                {isInStock ? 'Available' : 'Out of Stock'}
              </span>
            </div>
          </div>

          {/* Thumbnail Images */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {product.images.map((image: string, index: number) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all bg-gradient-to-br from-primary-50 to-secondary-50 ${
                    selectedImage === index
                      ? 'border-primary-600 shadow-lg scale-105 ring-2 ring-primary-200'
                      : 'border-gray-200 hover:border-primary-400'
                  }`}
                >
                  <Image
                    src={image}
                    alt={`${product.name} thumbnail ${index + 1}`}
                    fill
                    sizes="80px"
                    className="object-contain p-1"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Information */}
        <div className="space-y-6">
          {/* Category Badge */}
          <div>
            <span className="inline-block px-3 py-1 text-xs font-semibold text-primary-700 bg-primary-100 rounded-full">
              {product.category}
            </span>
          </div>

          {/* Product Name */}
          <h1 className="text-4xl font-bold text-gray-300 leading-tight">
            {product.name}
          </h1>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-5xl font-bold text-primary-600">
              ${product.price.toFixed(2)}
            </span>
            {product.stock < 10 && product.stock > 0 && (
              <span className="text-sm text-orange-600 font-semibold animate-pulse">
                Limited Stock
              </span>
            )}
          </div>

          {/* Stock Status */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-600">Stock Status:</span>
            <span className={`text-sm font-bold ${stockColorClass}`}>
              {stockStatus}
            </span>
          </div>

          {/* Description */}
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-lg font-semibold text-gray-300 mb-3">Description</h2>
            <p className="text-gray-600 leading-relaxed whitespace-pre-line">
              {product.description}
            </p>
          </div>

          {/* SKU */}
          <div className="text-sm text-gray-500">
            <span className="font-semibold">SKU:</span> {product.sku}
          </div>

          {/* Quantity Selector & Add to Cart */}
          <div className="border-t border-gray-200 pt-6 space-y-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <label className="text-sm font-semibold text-gray-700">Quantity:</label>
                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={!isInStock}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    -
                  </button>
                  <span className="px-6 py-2 bg-white text-gray-800 font-semibold min-w-[60px] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    disabled={!isInStock || quantity >= product.stock}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={!isInStock || addedToCart}
              className={`w-full py-4 rounded-lg font-bold text-lg transition-all transform ${
                addedToCart
                  ? 'bg-green-500 text-white scale-95'
                  : !isInStock
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-primary-600 text-white hover:bg-primary-700 hover:shadow-lg hover:scale-105'
              }`}
            >
              {addedToCart ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Added to Cart
                </span>
              ) : !isInStock ? (
                'Out of Stock'
              ) : (
                'Add to Cart'
              )}
            </button>
          </div>

          {/* Additional Info */}
          <div className="bg-gray-50 rounded-lg p-6 space-y-3">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <h3 className="font-semibold text-gray-800">Free Shipping</h3>
                <p className="text-sm text-gray-600">On orders over $50</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="font-semibold text-gray-800">Secure Payment</h3>
                <p className="text-sm text-gray-600">100% secure payment</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <div>
                <h3 className="font-semibold text-gray-800">Easy Returns</h3>
                <p className="text-sm text-gray-600">30-day return policy</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="border-t border-gray-200 pt-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-300">Related Products</h2>
            <Link
              href={`/products?category=${product.category}`}
              className="text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-2"
            >
              View All
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((relatedProduct) => (
              <ProductCard key={relatedProduct.id} product={relatedProduct} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
