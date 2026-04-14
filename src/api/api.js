import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor for global error handling (e.g., redirect on 401/403)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // if (error.response && (error.response.status === 401 || error.response.status === 403)) {
    //   // Handle unauthorized/forbidden, e.g., redirect to login
    //   localStorage.removeItem('token');
    //   localStorage.removeItem('user');
    //   window.location.href = '/login'; // Or use react-router-dom navigate
    // }
    return Promise.reject(error);
  }
);

export default api;
