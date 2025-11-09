import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

// API base URLs from environment variables
const API_URLS = {
  auth: process.env.API_AUTH_URL || 'http://localhost:4000',
  user: process.env.API_USER_URL || 'http://localhost:3001',
  // product: process.env.NEXT_PUBLIC_PRODUCT_API || "http://localhost:3002",
  product: process.env.API_PRODUCT_URL || 'http://localhost:3002',
  inventory: process.env.API_INVENTORY_URL || 'http://localhost:3003',
  order: process.env.API_ORDER_URL || 'http://localhost:5003',
};

// Create axios instances for each service
const createApiClient = (baseURL: string): AxiosInstance => {
  const client = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 10000,
  });

  // Response interceptor for error handling
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // Handle unauthorized access - redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
      return Promise.reject(error);
    }
  );

  return client;
};

// Export API clients
export const authClient = createApiClient(API_URLS.auth);
export const userClient = createApiClient(API_URLS.user);
export const productClient = createApiClient(API_URLS.product);
export const inventoryClient = createApiClient(API_URLS.inventory);
export const orderClient = createApiClient(API_URLS.order);

 const apiClients = {
  auth: authClient,
  user: userClient,
  product: productClient,
  inventory: inventoryClient,
  order: orderClient,
};
export default apiClients;