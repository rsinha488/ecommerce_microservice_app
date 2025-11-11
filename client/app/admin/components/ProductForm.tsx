'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Product } from '@/lib/redux/slices/productSlice';

/**
 * Product Form Component Props
 */
interface ProductFormProps {
  product: Product | null;
  onSubmit: (product: Partial<Product>) => Promise<void>;
  onCancel: () => void;
}

/**
 * Product Form Component
 *
 * Features:
 * - Image URL input with preview
 * - Multiple image support
 * - Drag and drop (commented code available)
 * - Form validation
 * - Create/Edit modes
 */
export default function ProductForm({ product, onSubmit, onCancel }: ProductFormProps) {
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    price: '',
    stock: '',
    category: '',
    images: [] as string[],
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [currentImageUrl, setCurrentImageUrl] = useState('');

  /**
   * Initialize form with product data when editing
   */
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        sku: product.sku || '',
        description: product.description || '',
        price: product.price?.toString() || '',
        stock: product.stock?.toString() || '',
        category: product.category || '',
        images: product.images || [],
      });
    }
  }, [product]);

  /**
   * Handle input field changes
   */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }

    if (error) {
      setError(null);
    }
  };

  /**
   * Add image URL to images array
   */
  const handleAddImageUrl = () => {
    if (!currentImageUrl.trim()) {
      setError('Please enter an image URL');
      return;
    }

    // Basic URL validation
    try {
      new URL(currentImageUrl);
    } catch {
      setError('Please enter a valid URL');
      return;
    }

    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, currentImageUrl.trim()],
    }));
    setCurrentImageUrl('');
    setError(null);
  };

  /**
   * Remove an image from the list
   */
  const handleRemoveImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  /**
   * Validate form data
   */
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Name validation
    if (!formData.name.trim()) {
      errors.name = 'Product name is required';
    } else if (formData.name.trim().length < 3) {
      errors.name = 'Product name must be at least 3 characters';
    }

    // SKU validation
    if (!formData.sku.trim()) {
      errors.sku = 'SKU is required';
    }

    // Description validation
    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    }

    // Price validation
    const price = parseFloat(formData.price);
    if (!formData.price || isNaN(price)) {
      errors.price = 'Valid price is required';
    } else if (price <= 0) {
      errors.price = 'Price must be greater than 0';
    }

    // Stock validation
    const stock = parseInt(formData.stock);
    if (!formData.stock || isNaN(stock)) {
      errors.stock = 'Valid stock quantity is required';
    } else if (stock < 0) {
      errors.stock = 'Stock cannot be negative';
    }

    // Category validation
    if (!formData.category) {
      errors.category = 'Category is required';
    }

    // Images validation
    if (formData.images.length === 0) {
      errors.images = 'At least one product image is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const productData = {
        name: formData.name.trim(),
        sku: formData.sku.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        category: formData.category,
        images: formData.images,
      };

      await onSubmit(productData);
    } catch (err: any) {
      setError(err.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
   * DRAG AND DROP FUNCTIONALITY (COMMENTED CODE)
   * =====================================================
   * Uncomment the code below to enable drag-and-drop for images
   * This implementation allows users to drag image files directly
   * into the form area for upload
   *
   * const [isDragging, setIsDragging] = useState(false);
   *
   * const handleDragEnter = (e: React.DragEvent) => {
   *   e.preventDefault();
   *   e.stopPropagation();
   *   setIsDragging(true);
   * };
   *
   * const handleDragLeave = (e: React.DragEvent) => {
   *   e.preventDefault();
   *   e.stopPropagation();
   *   setIsDragging(false);
   * };
   *
   * const handleDragOver = (e: React.DragEvent) => {
   *   e.preventDefault();
   *   e.stopPropagation();
   * };
   *
   * const handleDrop = (e: React.DragEvent) => {
   *   e.preventDefault();
   *   e.stopPropagation();
   *   setIsDragging(false);
   *
   *   const files = Array.from(e.dataTransfer.files);
   *   const imageFiles = files.filter(file => file.type.startsWith('image/'));
   *
   *   if (imageFiles.length === 0) {
   *     setError('Please drop valid image files');
   *     return;
   *   }
   *
   *   // Process dropped images
   *   imageFiles.forEach((file) => {
   *     const reader = new FileReader();
   *     reader.onload = (event) => {
   *       const dataUrl = event.target?.result as string;
   *       // Convert to URL or upload to server
   *       // For now, you can add the data URL or upload to image hosting service
   *       console.log('Dropped image:', file.name);
   *     };
   *     reader.readAsDataURL(file);
   *   });
   * };
   *
   * // Add these props to the form div:
   * // onDragEnter={handleDragEnter}
   * // onDragLeave={handleDragLeave}
   * // onDragOver={handleDragOver}
   * // onDrop={handleDrop}
   * // className={isDragging ? 'border-blue-500 bg-blue-50' : ''}
   * ===================================================== */

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {product ? 'Edit Product' : 'Add New Product'}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {product ? 'Update product information' : 'Fill in the details to create a new product'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Product Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`input w-full ${formErrors.name ? 'border-red-500' : ''}`}
                placeholder="Enter product name"
                disabled={loading}
              />
              {formErrors.name && (
                <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
              )}
            </div>

            {/* SKU */}
            <div>
              <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-1">
                SKU (Stock Keeping Unit) *
              </label>
              <input
                type="text"
                id="sku"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                className={`input w-full ${formErrors.sku ? 'border-red-500' : ''}`}
                placeholder="e.g., PROD-001"
                disabled={loading || !!product}
              />
              {formErrors.sku && (
                <p className="mt-1 text-sm text-red-600">{formErrors.sku}</p>
              )}
              {product && (
                <p className="mt-1 text-xs text-gray-500">SKU cannot be changed</p>
              )}
            </div>

            {/* Price */}
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                Price ($) *
              </label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                step="0.01"
                min="0"
                className={`input w-full ${formErrors.price ? 'border-red-500' : ''}`}
                placeholder="0.00"
                disabled={loading}
              />
              {formErrors.price && (
                <p className="mt-1 text-sm text-red-600">{formErrors.price}</p>
              )}
            </div>

            {/* Stock */}
            <div>
              <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-1">
                Stock Quantity *
              </label>
              <input
                type="number"
                id="stock"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                min="0"
                className={`input w-full ${formErrors.stock ? 'border-red-500' : ''}`}
                placeholder="0"
                disabled={loading}
              />
              {formErrors.stock && (
                <p className="mt-1 text-sm text-red-600">{formErrors.stock}</p>
              )}
            </div>

            {/* Category */}
            <div className="md:col-span-2">
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className={`input w-full ${formErrors.category ? 'border-red-500' : ''}`}
                disabled={loading}
              >
                <option value="">Select a category</option>
                <option value="electronics">Electronics</option>
                <option value="clothing">Clothing</option>
                <option value="books">Books</option>
                <option value="home">Home & Garden</option>
                <option value="sports">Sports & Outdoors</option>
                <option value="toys">Toys & Games</option>
                <option value="beauty">Beauty & Personal Care</option>
                <option value="food">Food & Beverages</option>
                <option value="automotive">Automotive</option>
                <option value="other">Other</option>
              </select>
              {formErrors.category && (
                <p className="mt-1 text-sm text-red-600">{formErrors.category}</p>
              )}
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className={`input w-full ${formErrors.description ? 'border-red-500' : ''}`}
                placeholder="Enter detailed product description"
                disabled={loading}
              />
              {formErrors.description && (
                <p className="mt-1 text-sm text-red-600">{formErrors.description}</p>
              )}
            </div>

            {/* Image URL Input */}
            <div className="md:col-span-2">
              <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-1">
                Product Images (URLs) *
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  id="imageUrl"
                  value={currentImageUrl}
                  onChange={(e) => setCurrentImageUrl(e.target.value)}
                  className="input flex-1"
                  placeholder="https://example.com/image.jpg"
                  disabled={loading}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddImageUrl();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddImageUrl}
                  disabled={loading || !currentImageUrl.trim()}
                  className="btn-secondary px-6"
                >
                  Add
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Enter image URL and click Add. Supports JPG, PNG, WebP formats.
              </p>
              {formErrors.images && (
                <p className="mt-1 text-sm text-red-600">{formErrors.images}</p>
              )}
            </div>

            {/* Image Preview Grid */}
            {formData.images.length > 0 && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image Previews ({formData.images.length})
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {formData.images.map((imageUrl, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                        {/* <Image
                          src={imageUrl}
                          alt={`Product ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://via.placeholder.com/200?text=Invalid+URL';
                          }}
                        /> */}
                        <img src={imageUrl ||'#'} alt={`Product ${index + 1}`}  className='object-cover'/>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-700"
                        disabled={loading}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                        Image {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="btn-secondary px-6"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary px-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  {product ? 'Updating...' : 'Creating...'}
                </span>
              ) : (
                <>{product ? 'Update Product' : 'Create Product'}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
