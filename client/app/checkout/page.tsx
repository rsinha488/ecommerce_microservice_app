'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/lib/redux/hooks';
import { clearCart } from '@/lib/redux/slices/cartSlice';
import { orderApi } from '@/lib/api/order';
import { toast } from 'react-toastify';

/**
 * Checkout Page
 *
 * Handles order placement with shipping information.
 * Currently supports Cash on Delivery (CoD) payment method.
 * Online payment integration is upcoming.
 *
 * Features:
 * - Shipping address form
 * - Order summary
 * - CoD payment (default)
 * - Real-time order creation
 * - Cart clearing after successful order
 * - Redirect to orders page
 *
 * @returns Checkout page with order placement
 */
export default function CheckoutPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { items, total } = useAppSelector((state) => state.cart);
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  const TAX_RATE = 0.10; // 10% tax rate
  const tax = total * TAX_RATE;
  const grandTotal = total + tax;

  const [loading, setLoading] = useState(false);
  const [shippingAddress, setShippingAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'USA',
  });

  useEffect(() => {
    // Redirect if not authenticated
    if (!isAuthenticated) {
      toast.info('Please sign in to checkout');
      router.push('/login');
      return;
    }

    // Redirect if cart is empty
    if (items.length === 0) {
      toast.info('Your cart is empty');
      router.push('/products');
      return;
    }
  }, [isAuthenticated, items, router]);

  /**
   * Handle form input changes
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShippingAddress({
      ...shippingAddress,
      [e.target.name]: e.target.value,
    });
  };

  /**
   * Validate shipping address
   */
  const validateAddress = (): boolean => {
    if (!shippingAddress.street.trim()) {
      toast.error('Street address is required');
      return false;
    }
    if (!shippingAddress.city.trim()) {
      toast.error('City is required');
      return false;
    }
    if (!shippingAddress.state.trim()) {
      toast.error('State is required');
      return false;
    }
    if (!shippingAddress.zipCode.trim()) {
      toast.error('Zip code is required');
      return false;
    }
    return true;
  };

  /**
   * Handle order placement
   */
  const handlePlaceOrder = async () => {
    if (!validateAddress()) return;

    if (!user?.id) {
      toast.error('User session expired. Please login again.');
      router.push('/login');
      return;
    }

    try {
      setLoading(true);

      // Prepare order data
      const orderData = {
        buyerId: user.id,
        items: items.map((item) => ({
          sku: item.sku,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
        })),
        shippingAddress,
        tax, // Include calculated tax (10%)
      };

      // Create order
      const order = await orderApi.createOrder(orderData);

      toast.success('Order placed successfully!');

      // Clear cart
      dispatch(clearCart());

      // Redirect to orders page
      router.push('/orders');
    } catch (error: any) {
      console.error('Error placing order:', error);
      toast.error(error.message || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="container-custom py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Shipping Information */}
          <div className="lg:col-span-2">
            <div className="card">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Shipping Information</h2>

              <div className="space-y-4">
                <div>
                  <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-2">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    id="street"
                    name="street"
                    value={shippingAddress.street}
                    onChange={handleInputChange}
                    placeholder="123 Main St, Apt 4B"
                    className="input w-full"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={shippingAddress.city}
                      onChange={handleInputChange}
                      placeholder="New York"
                      className="input w-full"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                      State *
                    </label>
                    <input
                      type="text"
                      id="state"
                      name="state"
                      value={shippingAddress.state}
                      onChange={handleInputChange}
                      placeholder="NY"
                      className="input w-full"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-2">
                      Zip Code *
                    </label>
                    <input
                      type="text"
                      id="zipCode"
                      name="zipCode"
                      value={shippingAddress.zipCode}
                      onChange={handleInputChange}
                      placeholder="10001"
                      className="input w-full"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                      Country *
                    </label>
                    <input
                      type="text"
                      id="country"
                      name="country"
                      value={shippingAddress.country}
                      onChange={handleInputChange}
                      className="input w-full"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="mt-8 pt-8 border-t">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Payment Method</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="cod"
                      name="payment"
                      checked
                      readOnly
                      className="w-4 h-4 text-blue-600"
                    />
                    <label htmlFor="cod" className="ml-3 text-gray-900 font-medium">
                      Cash on Delivery (CoD)
                    </label>
                  </div>
                  <p className="text-sm text-gray-600 mt-2 ml-7">
                    Pay with cash when your order is delivered
                  </p>
                </div>
                <p className="text-sm text-gray-500 mt-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Online payment methods (Credit Card, PayPal, etc.) coming soon!
                </p>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="card sticky top-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>

              <div className="space-y-3 mb-6">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <div className="flex-1">
                      <p className="text-gray-900 font-medium">{item.name}</p>
                      <p className="text-gray-600">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-gray-900 font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className="text-green-600 font-medium">FREE</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax (10%)</span>
                  <span className="text-gray-900">${tax.toFixed(2)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between">
                  <span className="text-lg font-bold text-gray-900">Total</span>
                  <span className="text-lg font-bold text-primary-600">${grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={loading}
                className="w-full mt-6 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  'Place Order'
                )}
              </button>

              <p className="text-xs text-gray-500 mt-4 text-center">
                By placing your order, you agree to our terms and conditions
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
