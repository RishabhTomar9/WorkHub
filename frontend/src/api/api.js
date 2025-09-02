import axios from 'axios';

// ✅ Use import.meta.env for Vite
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const instance = axios.create({
  baseURL: API_URL + '/api',
  timeout: 15000,
});

// Set Firebase auth token dynamically
export function setAuthToken(token) {
  if (token) {
    instance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete instance.defaults.headers.common['Authorization'];
  }
}

export default instance;
