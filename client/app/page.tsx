import Link from 'next/link';
import { productApi } from '@/lib/api/product';
import ProductGrid from '@/components/ProductGrid';

export const dynamic = "force-dynamic";

// This is a Server Component with SSR
export default async function HomePage() {
  // Fetch products on the server
  let products = [];
  let error = null;

  try {
    const response = await productApi.getProducts({ page: 1, limit: 8 });
    products = response.data || [];
  } catch (err: any) {
    error = err.message;
    console.error('Error fetching products:', err);
  }

  return (
    <div className="container-custom py-12">
      {/* Hero Section */}
      <section className="mb-16 text-center animate-fade-in">
        <h1 className="text-5xl font-bold mb-4 text-gray-300">
          Welcome to Our E-commerce Platform
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Discover amazing products with Server-Side Rendering and Redux Toolkit
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/products" className="btn-primary text-lg">
            Shop Now
          </Link>
          <Link href="/about" className="btn-outline text-lg">
            Learn More
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="mb-16 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="card bg-gradient-to-r from-primary-50 to-primary-100 text-center animate-slide-up">
          <div className="text-4xl mb-4">🔒</div>
          <h3 className="text-xl font-semibold text-gray-400 mb-2">Secure Shopping</h3>
          <p className="text-gray-600">
            Your data is protected with top-notch security measures.
          </p>
        </div>
        <div className="card bg-gradient-to-r from-primary-50 to-primary-100 text-center animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="text-4xl mb-4">💳</div>
          <h3 className="text-xl font-semibold text-gray-400 mb-2">Cash on Delivery (CoD)</h3>
          <p className="text-gray-600">
            Secure and convenient payment option trusted by customers.
          </p>
        </div>
        <div className="card bg-gradient-to-r from-primary-50 to-primary-100 text-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="text-4xl mb-4">🚚</div>
          <h3 className="text-xl font-semibold text-gray-400 mb-2">Fast & Reliable Delivery</h3>
          <p className="text-gray-600">
            Real-time shipment tracking and doorstep delivery with trusted partners.
          </p>
        </div>
      </section>

      {/* Featured Products Section */}
      {/* <section>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-300">Featured Products</h2>
          <Link href="/products" className="text-primary-600 hover:text-primary-700 font-semibold">
            View All →
          </Link>
        </div>

        {error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p>Error loading products: {error}</p>
            <p className="text-sm mt-2">
              Make sure the product service is running on port 3002
            </p>
          </div>
        ) : products.length > 0 ? (
          <ProductGrid products={products} />
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No products available</p>
            <p className="text-gray-500 mt-2">
              Start the product service to see products
            </p>
          </div>
        )}
      </section> */}

      {/* SSR Benefits Section */}
      <section className="mt-16 bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg p-8">
        <h2 className="text-2xl font-bold mb-4 text-gray-900">
          Shopping Made Easy & Secure
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-400 text-lg mb-2">✓ Cash on Delivery Available</h3>
            <p className="text-gray-700">
              Shop confidently with our currently supported Cash on Delivery (CoD) service across major regions.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-400 text-lg mb-2">✓ Safe & Verified Login</h3>
            <p className="text-gray-700">
              We use OAuth 2.0 with OpenID Connect for secure authentication and identity protection.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-400 text-lg mb-2">✓ Smooth Shopping Experience</h3>
            <p className="text-gray-700">
              Enjoy fast browsing, easy navigation, and personalized product recommendations.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-400 text-lg mb-2">✓ Trusted & Transparent</h3>
            <p className="text-gray-700">
              Clear pricing, real-time updates, and reliable service for every order you place.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}

