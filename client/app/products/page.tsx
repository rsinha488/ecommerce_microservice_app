import { productApi } from '@/lib/api/product';
import ProductGrid from '@/components/ProductGrid';
import ProductsClient from '@/components/ProductsClient';

// This demonstrates SSR with data fetching
export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { page?: string; category?: string };
}) {
  const page = Number(searchParams.page) || 1;
  const category = searchParams.category;

  let products = [];
  let error = null;

  try {
    const response = await productApi.getProducts({
      page,
      limit: 12,
      category,
    });
    
    // Backend returns { success: true, data: [...], pagination: {...} }
    products = response.data || [];
  } catch (err: any) {
    error = err.message;
    console.error('Error fetching products:', err);
  }

  return (
    <div className="container-custom py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">All Products</h1>
        <p className="text-gray-600">
          Browse our complete collection (Server-Side Rendered)
        </p>
      </div>

      {/* Client-side filters and search */}
      <ProductsClient initialProducts={products} />

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p>Error loading products: {error}</p>
          <p className="text-sm mt-2">
            Make sure the product service is running on port 3002
          </p>
        </div>
      )}

      {!error && products.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">No products found</p>
        </div>
      )}
    </div>
  );
}

// Enable ISR (Incremental Static Regeneration)
export const revalidate = 60; // Revalidate every 60 seconds

