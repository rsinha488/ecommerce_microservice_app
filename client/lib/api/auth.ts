import { authClient } from './client';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginResponse {
  session_id: string;
  access_token?: string;
  token_type?: string;
  expires_in?: number;
}

export interface UserInfoResponse {
  id: string;
  email: string;
  name: string;
  role?: string;
  sub?: string;
}

export const authApi = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await authClient.post('/auth/login', credentials);
    return response.data;
  },

  register: async (userData: RegisterRequest): Promise<any> => {
    const response = await authClient.post('/auth/register', userData);
    return response.data;
  },

  getUserInfo: async (token: string): Promise<UserInfoResponse> => {
    const response = await authClient.get('/auth/userinfo', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  logout: async (): Promise<void> => {
    // Call logout endpoint if available
    try {
      await authClient.post('/auth/logout');
    } catch (error) {
      // Ignore errors on logout
    }
  },

  refreshToken: async (refreshToken: string): Promise<LoginResponse> => {
    const response = await authClient.post('/auth/token', {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    });
    return response.data;
  },
};

