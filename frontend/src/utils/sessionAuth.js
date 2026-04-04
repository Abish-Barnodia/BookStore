import axios from 'axios';

const AUTH_TOKEN_KEY = 'bookstore_auth_token';
const CHECKOUT_DRAFT_KEY = 'bookstore_checkout_draft';

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
    // Ignore storage failures; requests still use cookie auth when available.
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

export const getCheckoutDraft = () => {
  try {
    const raw = sessionStorage.getItem(CHECKOUT_DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setCheckoutDraft = (draft) => {
  try {
    if (draft && typeof draft === 'object') {
      sessionStorage.setItem(CHECKOUT_DRAFT_KEY, JSON.stringify(draft));
    }
  } catch {
    // Ignore storage failures.
  }
};

export const clearCheckoutDraft = () => {
  try {
    sessionStorage.removeItem(CHECKOUT_DRAFT_KEY);
  } catch {
    // Ignore storage failures.
  }
};
