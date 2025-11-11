import { productClient } from './client';
import { Product } from '../redux/slices/productSlice';

export interface ProductsResponse {
  success: boolean;
  data: Product[];
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
    const response = await productClient.get('/product/products', { params });
    // Backend returns { success: true, data: [...], pagination: {...} }
    return response.data;
  },

  getProductById: async (id: string): Promise<Product> => {
    const response = await productClient.get(`/product/products/${id}`);
    return response.data;
  },

  searchProducts: async (query: string): Promise<ProductsResponse> => {
    const response = await productClient.get('/product/products', {
      params: { search: query },
    });
    return response.data;
  },

  createProduct: async (productData: Partial<Product>): Promise<Product> => {
    const response = await productClient.post('/product/products', productData);
    return response.data;
  },

  updateProduct: async (id: string, productData: Partial<Product>): Promise<Product> => {
    const response = await productClient.put(`/product/products/${id}`, productData);
    return response.data;
  },

  deleteProduct: async (id: string): Promise<void> => {
    await productClient.delete(`/product/products/${id}`);
  },

  getCategories: async (): Promise<string[]> => {
    const response = await productClient.get('/product/products/categories');
    return response.data;
  },
};

