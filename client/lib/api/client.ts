import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

// API base URLs from environment variables - using gateway for all services
const GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:3008';

const API_URLS = {
  auth: GATEWAY_URL,
  user: GATEWAY_URL,
  product: GATEWAY_URL,
  inventory: GATEWAY_URL,
  order: GATEWAY_URL,
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
          // window.location.href = '/login';
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
