import axios from 'axios';

const AUTH_TOKEN_KEY = 'bookstore_auth_token';

export const getAuthToken = () => {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY) || '';
  } catch {
    return '';
  }
};

export const setAuthToken = (token) => {
  try {
    if (token) {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      delete axios.defaults.headers.common.Authorization;
    }
  } catch {
    // Ignore storage failures; cookie auth may still work when available.
  }
  axios.defaults.withCredentials = true;
};

export const clearAuthToken = () => {
  setAuthToken('');
};

export const bootstrapAuthToken = () => {
  axios.defaults.withCredentials = true;
  const token = getAuthToken();
  if (token) {
    axios.defaults.headers.common.Authorization = `Bearer ${token}`;
  }
};
