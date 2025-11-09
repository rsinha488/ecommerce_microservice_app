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
  user_id: string;
  success: boolean;
}

export interface UserInfoResponse {
  id: string;
  email: string;
  name: string;
  role?: string;
  sub?: string;
}

export interface SessionResponse {
  valid: boolean;
  session: {
    user: UserInfoResponse;
    sessionId: string;
  };
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

  getSession: async (): Promise<SessionResponse> => {
    const response = await authClient.get('/auth/session');
    return response.data;
  },

  logout: async (): Promise<void> => {
    await authClient.post('/auth/logout');
  },
};
