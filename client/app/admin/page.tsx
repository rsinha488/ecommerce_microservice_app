'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/lib/redux/hooks';
import { productApi } from '@/lib/api/product';
import { Product } from '@/lib/redux/slices/productSlice';
import ProductForm from './components/ProductForm';
import ProductList from './components/ProductList';
import { toast } from 'react-toastify';

/**
 * Admin Dashboard Page
 *
 * Comprehensive product management dashboard for administrators.
 * Provides full CRUD operations for products with a modern, user-friendly interface.
 *
 * Features:
 * - View all products in a responsive table
 * - Add new products with form validation
 * - Edit existing products
 * - Delete products with confirmation
 * - Real-time stock and price management
 * - Image upload support
 * - Search and filter capabilities
 *
 * Security:
 * - Admin role verification
 * - Protected route (redirects non-admin users)
 *
 * @returns Admin dashboard with product management interface
 */
export default function AdminDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAppSelector((state) => state.auth);

  // State management
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [authChecked, setAuthChecked] = useState(false);

  /**
   * Check authentication and admin role on mount
   */
  useEffect(() => {
    // Wait for auth to be checked
    if (authLoading) return;

    // Mark that we've checked auth
    setAuthChecked(true);

    // Redirect if not authenticated
    if (!isAuthenticated) {
      router.replace('/admin/login');
      return;
    }

    // Check if user has admin role
    const isAdmin = user?.email?.toLowerCase().includes('admin') || user?.role === 'admin';

    if (!isAdmin) {
      toast.error('Access denied. Admin privileges required.', {
        position: 'top-right',
        autoClose: 3000,
      });
      router.replace('/products');
      return;
    }

    // Load products
    fetchProducts();
  }, [isAuthenticated, user, authLoading, router]);

  /**
   * Fetch all products from the API
   */
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await productApi.getProducts({ limit: 100 });
      setProducts(response.data || []);
    } catch (err: any) {
      console.error('Error fetching products:', err);
      setError(err.message || 'Failed to load products');
      toast.error('Failed to load products', {
        position: 'top-right',
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle adding a new product
   */
  const handleAddProduct = () => {
    setEditingProduct(null);
    setShowForm(true);
  };

  /**
   * Handle editing an existing product
   */
  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  /**
   * Handle product form submission (create or update)
   */
  const handleSubmitProduct = async (productData: Partial<Product>) => {
    try {
      if (editingProduct) {
        // Update existing product
        await productApi.updateProduct(editingProduct.sku, productData);
        toast.success('Product updated successfully!', {
          position: 'top-right',
          autoClose: 3000,
        });
      } else {
        // Create new product
        await productApi.createProduct(productData);
        toast.success('Product created successfully!', {
          position: 'top-right',
          autoClose: 3000,
        });
      }

      // Refresh product list
      await fetchProducts();

      // Close form
      setShowForm(false);
      setEditingProduct(null);
    } catch (err: any) {
      console.error('Error saving product:', err);
      toast.error(err.message || 'Failed to save product', {
        position: 'top-right',
        autoClose: 4000,
      });
      throw err; // Let the form handle the error
    }
  };

  /**
   * Handle deleting a product with confirmation
   */
  const handleDeleteProduct = async (product: Product) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${product.name}"?\n\nThis action cannot be undone.`
    );

    if (!confirmDelete) {
      return;
    }

    try {
      await productApi.deleteProduct(product._id);
      toast.success('Product deleted successfully!', {
        position: 'top-right',
        autoClose: 3000,
      });
      // Refresh product list
      await fetchProducts();
    } catch (err: any) {
      console.error('Error deleting product:', err);
      toast.error(err.message || 'Failed to delete product', {
        position: 'top-right',
        autoClose: 4000,
      });
    }
  };

  /**
   * Handle form cancellation
   */
  const handleCancelForm = () => {
    setShowForm(false);
    setEditingProduct(null);
  };

  /**
   * Filter products based on search and category
   */
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = !filterCategory || product.category === filterCategory;

    return matchesSearch && matchesCategory;
  });

  /**
   * Get unique categories from products
   */
  const categories = Array.from(new Set(products.map((p) => p.category)));

  // Show loading state while checking auth
  if (authLoading || !authChecked) {
    return (
      <div className="container-custom py-12">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Verifying admin access...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state for products
  if (loading && products.length === 0) {
    return (
      <div className="container-custom py-12">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading admin dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-custom py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Manage your product catalog
            </p>
          </div>
          <button
            onClick={handleAddProduct}
            className="btn-primary flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add New Product
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Products</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{products.length}</p>
            </div>
            <div className="bg-blue-600 p-3 rounded-full">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Stock</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {products.reduce((sum, p) => sum + p.stock, 0)}
              </p>
            </div>
            <div className="bg-green-600 p-3 rounded-full">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Categories</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{categories.length}</p>
            </div>
            <div className="bg-purple-600 p-3 rounded-full">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <strong className="font-bold">Error: </strong>
          <span>{error}</span>
        </div>
      )}

      {/* Product Form Modal */}
      {showForm && (
        <ProductForm
          product={editingProduct}
          onSubmit={handleSubmitProduct}
          onCancel={handleCancelForm}
        />
      )}

      {/* Search and Filter */}
      <div className="card mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name, SKU, or description..."
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
      </div>

      {/* Products List */}
      <ProductList
        products={filteredProducts}
        onEdit={handleEditProduct}
        onDelete={handleDeleteProduct}
        loading={loading}
      />
    </div>
  );
}
