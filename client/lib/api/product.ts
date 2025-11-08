import { productClient } from './client';
import { Product } from '../redux/slices/productSlice';

export interface ProductsResponse {
  products: Product[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
  };
}

export const productApi = {
  getProducts: async (params: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
    minPrice?: string;
    maxPrice?: string;
  } = {}): Promise<any> => {
    const response = await productClient.get('/products', { params });
    // Backend returns { success: true, data: [...], pagination: {...} }
    return response.data;
  },

  getProductById: async (id: string): Promise<Product> => {
    const response = await productClient.get(`/products/${id}`);
    return response.data;
  },

  searchProducts: async (query: string): Promise<Product[]> => {
    const response = await productClient.get('/products', {
      params: { search: query },
    });
    return response.data;
  },

  createProduct: async (productData: Partial<Product>): Promise<Product> => {
    const response = await productClient.post('/products', productData);
    return response.data;
  },

  updateProduct: async (id: string, productData: Partial<Product>): Promise<Product> => {
    const response = await productClient.put(`/products/${id}`, productData);
    return response.data;
  },

  deleteProduct: async (id: string): Promise<void> => {
    await productClient.delete(`/products/${id}`);
  },

  getCategories: async (): Promise<string[]> => {
    const response = await productClient.get('/products/categories');
    return response.data;
  },
};

