'use client';

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import {
  removeFromCart,
  updateQuantity,
  clearCart,
  loadCartFromStorage,
} from '@/lib/redux/slices/cartSlice';
import Link from 'next/link';
import Image from 'next/image';

export default function CartPage() {
  const dispatch = useAppDispatch();
  const { items, total, itemCount } = useAppSelector((state) => state.cart);

  useEffect(() => {
    // Load cart from localStorage on mount
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const cartItems = JSON.parse(savedCart);
        dispatch(loadCartFromStorage(cartItems));
      } catch (error) {
        console.error('Error loading cart:', error);
      }
    }
  }, [dispatch]);

  const handleUpdateQuantity = (id: string, quantity: number) => {
    dispatch(updateQuantity({ id, quantity }));
  };

  const handleRemoveItem = (id: string) => {
    dispatch(removeFromCart(id));
  };

  const handleClearCart = () => {
    if (confirm('Are you sure you want to clear your cart?')) {
      dispatch(clearCart());
    }
  };

  if (items.length === 0) {
    return (
      <div className="container-custom py-12">
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🛒</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Your Cart is Empty</h1>
          <p className="text-gray-600 mb-8">Add some products to get started!</p>
          <Link href="/products" className="btn-primary">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-custom py-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Shopping Cart</h1>
          <p className="text-gray-600">{itemCount} items in your cart</p>
        </div>
        <button onClick={handleClearCart} className="text-red-600 hover:text-red-700">
          Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item._id} className="card flex gap-4">
              <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                {item.images && item.images[0] ? (
                  <Image
                    src={item.images[0]}
                    alt={item.name}
                    width={96}
                    height={96}
                    className="rounded-lg object-cover"
                  />
                ) : (
                  <span className="text-4xl">📦</span>
                )}
              </div>

              <div className="flex-grow">
                <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                <p className="text-gray-600 text-sm mb-2">{item.category}</p>
                <p className="text-primary-600 font-semibold text-lg">
                  ${item.price.toFixed(2)}
                </p>
              </div>

              <div className="flex flex-col items-end justify-between">
                <button
                  onClick={() => handleRemoveItem(item._id)}
                  className="text-red-600 hover:text-red-700 text-sm"
                >
                  Remove
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUpdateQuantity(item._id, item.quantity - 1)}
                    className="w-8 h-8 rounded-lg border border-gray-300 hover:bg-gray-100"
                    disabled={item.quantity <= 1}
                  >
                    -
                  </button>
                  <span className="w-12 text-center font-semibold">{item.quantity}</span>
                  <button
                    onClick={() => handleUpdateQuantity(item._id, item.quantity + 1)}
                    className="w-8 h-8 rounded-lg border border-gray-300 hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>

                <p className="text-lg font-bold text-gray-900">
                  ${(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="card sticky top-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Summary</h2>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal ({itemCount} items)</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>Free</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax</span>
                <span>${(total * 0.1).toFixed(2)}</span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between text-xl font-bold text-gray-900">
                  <span>Total</span>
                  <span>${(total * 1.1).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <Link href="/checkout" className="btn-primary w-full text-center block mb-3">
              Proceed to Checkout
            </Link>
            <Link href="/products" className="btn-outline w-full text-center block">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

