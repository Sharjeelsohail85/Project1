/**
 * API Configuration Helper
 * Use this file as a reference for frontend integration
 */

// Backend API Configuration
export const API_CONFIG = {
  // Update this to match your backend URL
  baseURL: process.env.REACT_APP_API_URL || 
           process.env.VUE_APP_API_URL || 
           process.env.NEXT_PUBLIC_API_URL || 
           'http://localhost:8000/api/v1',
  
  // API Version
  version: 'v1',
  
  // Endpoints
  endpoints: {
    auth: {
      login: '/auth/login',
      register: '/auth/register',
    },
    video: {
      list: '/video',
      show: (id) => `/video/${id}`,
      create: '/video',
      update: (id) => `/video/${id}`,
      delete: (id) => `/video/${id}`,
      my: '/video/me',
      history: '/video/history',
      search: (name, results) => `/video/search/${name}/${results}`,
      like: (id) => `/video/${id}/like`,
      dislike: (id) => `/video/${id}/dislike`,
    },
    channel: {
      list: '/channel',
      show: (id) => `/channel/${id}`,
      create: '/channel',
      update: (id) => `/channel/${id}`,
      delete: (id) => `/channel/${id}`,
      my: '/channel/me',
      subscribe: (id) => `/channel/${id}/subscribe`,
      unsubscribe: (id) => `/channel/${id}/unsubscribe`,
      search: (name, results) => `/channel/search/${name}/${results}`,
    },
    user: {
      list: '/users',
      show: (id) => `/users/${id}`,
      register: '/users',
      me: '/users/me',
      update: '/users',
      search: (name, results) => `/user/search/${name}/${results}`,
    },
    comment: {
      list: (videoId) => `/video/${videoId}/comment`,
      create: (videoId) => `/video/${videoId}/comment`,
      update: (videoId, commentId) => `/video/${videoId}/comment/${commentId}`,
      delete: (videoId, commentId) => `/video/${videoId}/comment/${commentId}`,
    },
  },
};

// Helper function to get auth tokens from storage
export const getAuthTokens = () => {
  if (typeof window !== 'undefined') {
    return {
      token: localStorage.getItem('token'),
      client_id: localStorage.getItem('client_id'),
    };
  }
  return { token: null, client_id: null };
};

// Helper function to save auth tokens
export const saveAuthTokens = (token, clientId) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token);
    localStorage.setItem('client_id', clientId);
  }
};

// Helper function to clear auth tokens
export const clearAuthTokens = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('client_id');
  }
};

// Helper function to build authenticated request URL
export const buildAuthUrl = (endpoint) => {
  const { token, client_id } = getAuthTokens();
  const separator = endpoint.includes('?') ? '&' : '?';
  return token && client_id 
    ? `${endpoint}${separator}token=${token}&client_id=${client_id}`
    : endpoint;
};

// Example API client function
export const apiRequest = async (endpoint, options = {}) => {
  const { token, client_id } = getAuthTokens();
  const url = `${API_CONFIG.baseURL}${endpoint}`;
  
  // Add auth params to URL if tokens exist
  const authUrl = token && client_id 
    ? `${url}${url.includes('?') ? '&' : '?'}token=${token}&client_id=${client_id}`
    : url;

  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  try {
    const response = await fetch(authUrl, config);
    const data = await response.json();
    
    // Handle authentication errors
    if (data.status === 401 || data.error === 401) {
      clearAuthTokens();
      // Redirect to login or handle as needed
    }
    
    return data;
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
};

// Example usage:
/*
import { apiRequest, API_CONFIG, saveAuthTokens } from './api-config';

// Login
const loginResponse = await apiRequest(API_CONFIG.endpoints.auth.login, {
  method: 'POST',
  body: JSON.stringify({
    data: {
      email: 'user@example.com',
      password: 'password'
    }
  })
});

if (loginResponse.data && loginResponse.data.token) {
  saveAuthTokens(loginResponse.data.token, loginResponse.data.client_id);
}

// Get videos
const videos = await apiRequest(API_CONFIG.endpoints.video.list);
*/
