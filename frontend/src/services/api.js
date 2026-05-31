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

export const communityService = {
  reportSite: async (siteData) => {
    const response = await api.post('/community/sites', siteData);
    return response.data;
  },
  getSites: async () => {
    const response = await api.get('/community/sites');
    return response.data;
  },
  submitObservation: async (obsData) => {
    const response = await api.post('/community/observations', obsData);
    return response.data;
  },
  getObservations: async () => {
    const response = await api.get('/community/observations');
    return response.data;
  },
  submitValidation: async (valData) => {
    const response = await api.post('/community/validations', valData);
    return response.data;
  },
  getValidationsForProject: async (projectId) => {
    const response = await api.get(`/community/validations/project/${projectId}`);
    return response.data;
  },
  submitComplaint: async (compData) => {
    const response = await api.post('/community/complaints', compData);
    return response.data;
  },
  getComplaints: async () => {
    const response = await api.get('/community/complaints');
    return response.data;
  },
  submitActivity: async (actData) => {
    const response = await api.post('/community/activities', actData);
    return response.data;
  },
  getActivities: async () => {
    const response = await api.get('/community/activities');
    return response.data;
  },
  askAiAssistant: async (question) => {
    const response = await api.post('/community/ai/assistant', { question });
    return response.data;
  },
  getAiSuggestions: async (latitude, longitude) => {
    const response = await api.post('/community/ai/recommendation', { latitude, longitude });
    return response.data;
  }
};

export const auditorService = {
  getProjects: async (status) => {
    const response = await api.get('/auditor/projects', { params: { status } });
    return response.data;
  },
  updateStatus: async (id, status) => {
    const response = await api.put(`/auditor/projects/${id}/status`, { status });
    return response.data;
  },
  getAnalysis: async (id) => {
    const response = await api.get(`/auditor/projects/${id}/analysis`);
    return response.data;
  },
  verifyProject: async (id, payload) => {
    const response = await api.post(`/auditor/projects/${id}/verify`, payload);
    return response.data;
  },
  generateReport: async (id) => {
    const response = await api.post(`/auditor/projects/${id}/report`);
    return response.data;
  }
};

export default api;
