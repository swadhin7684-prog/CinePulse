import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to inject JWT token and active profile ID
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('cinepulse_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const activeProfile = localStorage.getItem('cinepulse_active_profile');
    if (activeProfile) {
      try {
        const parsed = JSON.parse(activeProfile);
        if (parsed && parsed._id) {
          config.headers['x-profile-id'] = parsed._id;
        }
      } catch (e) {
        // Ignore parse error
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to catch 401s and format standard API error message
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || error.message || 'Something went wrong';
    
    // If token expired, clear auth and redirect to login if not already there
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      // Don't auto-redirect if checkMe failed on initial visit
      if (!error.config.url.includes('/auth/me')) {
        localStorage.removeItem('cinepulse_token');
        localStorage.removeItem('cinepulse_user');
        window.location.href = '/login';
      }
    }

    return Promise.reject(new Error(message));
  }
);

export default api;
