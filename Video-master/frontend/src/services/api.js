import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

const canUseBrowser = typeof window !== 'undefined';

function getStorageItemSafe(key) {
  if (!canUseBrowser) return null;

  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function setStorageItemSafe(key, value) {
  if (!canUseBrowser) return;

  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore storage failures in restricted environments
  }
}

function removeStorageItemSafe(key) {
  if (!canUseBrowser) return;

  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore storage failures in restricted environments
  }
}

export function getApiErrorMessage(error, fallback = 'An error occurred') {
  return (
    error?.response?.data?.error_description?.[0] ||
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
}

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token and client_id to requests
api.interceptors.request.use(
  (config) => {
    const token = getStorageItemSafe('token');
    const clientId = getStorageItemSafe('client_id');
    
    if (token && clientId) {
      // Add as query parameters
      config.params = {
        ...config.params,
        token,
        client_id: clientId,
      };
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle authentication errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear tokens and redirect to login
      removeStorageItemSafe('token');
      removeStorageItemSafe('client_id');

      if (canUseBrowser && window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', {
      data: { email, password },
    });
    
    if (response.data?.data?.token) {
      setStorageItemSafe('token', response.data.data.token);
      setStorageItemSafe('client_id', response.data.data.client_id);
    }
    
    return response.data;
  },

  register: async (userData) => {
    const response = await api.post('/auth/register', {
      data: userData,
    });
    return response.data;
  },

  logout: () => {
    removeStorageItemSafe('token');
    removeStorageItemSafe('client_id');
  },

  isAuthenticated: () => {
    return !!(getStorageItemSafe('token') && getStorageItemSafe('client_id'));
  },
};

// Video API
export const videoAPI = {
  getAll: async (params = {}) => {
    const response = await api.get('/video', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/video/${id}`);
    return response.data;
  },

  getMyVideos: async () => {
    const response = await api.get('/video/me');
    return response.data;
  },

  getHistory: async () => {
    const response = await api.get('/video/history');
    return response.data;
  },

  create: async (videoData) => {
    const response = await api.post('/video', {
      data: videoData,
    });
    return response.data;
  },

  update: async (id, videoData) => {
    const response = await api.put(`/video/${id}`, {
      data: videoData,
    });
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/video/${id}`);
    return response.data;
  },

  like: async (id) => {
    const response = await api.get(`/video/${id}/like`);
    return response.data;
  },

  dislike: async (id) => {
    const response = await api.get(`/video/${id}/dislike`);
    return response.data;
  },

  search: async (name, noOfResults = 10) => {
    const response = await api.get(`/video/search/${name}/${noOfResults}`);
    return response.data;
  },
};

// Channel API
export const channelAPI = {
  getAll: async () => {
    const response = await api.get('/channel');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/channel/${id}`);
    return response.data;
  },

  getMyChannels: async () => {
    const response = await api.get('/channel/me');
    return response.data;
  },

  create: async (channelData) => {
    const response = await api.post('/channel', {
      data: channelData,
    });
    return response.data;
  },

  update: async (id, channelData) => {
    const response = await api.put(`/channel/${id}`, {
      data: channelData,
    });
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/channel/${id}`);
    return response.data;
  },

  subscribe: async (id) => {
    const response = await api.get(`/channel/${id}/subscribe`);
    return response.data;
  },

  unsubscribe: async (id) => {
    const response = await api.get(`/channel/${id}/unsubscribe`);
    return response.data;
  },

  search: async (name, noOfResults = 10) => {
    const response = await api.get(`/channel/search/${name}/${noOfResults}`);
    return response.data;
  },
};

// User API
export const userAPI = {
  getAll: async () => {
    const response = await api.get('/users');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/users/me');
    return response.data;
  },

  update: async (userData) => {
    const response = await api.put('/users', {
      data: userData,
    });
    return response.data;
  },

  search: async (name, noOfResults = 10) => {
    const response = await api.get(`/user/search/${name}/${noOfResults}`);
    return response.data;
  },
};

// Comment API
export const commentAPI = {
  getByVideo: async (videoId) => {
    const response = await api.get(`/video/${videoId}/comment`);
    return response.data;
  },

  create: async (videoId, commentData) => {
    const response = await api.post(`/video/${videoId}/comment`, {
      data: commentData,
    });
    return response.data;
  },

  update: async (videoId, commentId, commentData) => {
    const response = await api.put(`/video/${videoId}/comment/${commentId}`, {
      data: commentData,
    });
    return response.data;
  },

  delete: async (videoId, commentId) => {
    const response = await api.delete(`/video/${videoId}/comment/${commentId}`);
    return response.data;
  },
};

export default api;
