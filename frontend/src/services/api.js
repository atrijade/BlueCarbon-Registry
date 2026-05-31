import axios from 'axios';
import supabase from './supabase';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Axios request interceptor to inject the JWT access token (mock or Supabase)
api.interceptors.request.use(
  async (config) => {
    try {
      // 1. Check if a mock token is set in localStorage
      const token = localStorage.getItem('bluecarbon_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        // 2. Fallback to Supabase token
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.access_token) {
          config.headers.Authorization = `Bearer ${session.access_token}`;
        }
      }
    } catch (err) {
      console.error('Error fetching session token for API request:', err);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// API Service calls
export const projectService = {
  getAll: async (status) => {
    const response = await api.get('/projects', { params: { status } });
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/projects/${id}`);
    return response.data;
  },
  getMy: async () => {
    const response = await api.get('/projects/my');
    return response.data;
  },
  create: async (projectData) => {
    const response = await api.post('/projects', projectData);
    return response.data;
  }
};

export const verificationService = {
  submit: async (verificationData) => {
    const response = await api.post('/verifications', verificationData);
    return response.data;
  },
  getByProject: async (projectId) => {
    const response = await api.get(`/verifications/project/${projectId}`);
    return response.data;
  }
};

export const dashboardService = {
  getStats: async () => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  }
};

export const authService = {
  getPendingUsers: async () => {
    const response = await api.get('/auth/pending-users');
    return response.data;
  },
  approveUser: async (id) => {
    const response = await api.put(`/auth/approve-user/${id}`);
    return response.data;
  }
};

export default api;
