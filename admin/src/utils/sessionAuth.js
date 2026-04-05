import axios from 'axios';

const AUTH_TOKEN_KEY = 'bookstore_auth_token';
const AUTH_OWNER_KEY = 'bookstore_auth_owner';
const TAB_ID_KEY = 'bookstore_tab_id';

const OWNER_TTL_MS = 8 * 60 * 60 * 1000;

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const getTabId = () => {
  try {
    const existing = sessionStorage.getItem(TAB_ID_KEY);
    if (existing) return existing;
    const next = createId();
    sessionStorage.setItem(TAB_ID_KEY, next);
    return next;
  } catch {
    return '';
  }
};

const readOwner = () => {
  try {
    const raw = localStorage.getItem(AUTH_OWNER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writeOwner = (owner) => {
  try {
    localStorage.setItem(AUTH_OWNER_KEY, JSON.stringify(owner));
  } catch {
    // Ignore storage failures.
  }
};

const clearOwnerIfCurrentTab = () => {
  const tabId = getTabId();
  if (!tabId) return;
  const owner = readOwner();
  if (owner?.tabId === tabId) {
    try {
      localStorage.removeItem(AUTH_OWNER_KEY);
    } catch {
      // Ignore storage failures.
    }
  }
};

const isOwnerStale = (owner) => {
  const ts = Number(owner?.ts || 0);
  return !ts || Date.now() - ts > OWNER_TTL_MS;
};

const hasTabOwnership = () => {
  const tabId = getTabId();
  if (!tabId) return false;
  const owner = readOwner();

  if (!owner || isOwnerStale(owner)) {
    writeOwner({ tabId, ts: Date.now() });
    return true;
  }

  if (owner.tabId === tabId) {
    writeOwner({ tabId, ts: Date.now() });
    return true;
  }

  return false;
};

export const getAuthToken = () => {
  try {
    const token = sessionStorage.getItem(AUTH_TOKEN_KEY) || '';
    if (!token) return '';
    if (!hasTabOwnership()) {
      sessionStorage.removeItem(AUTH_TOKEN_KEY);
      delete axios.defaults.headers.common.Authorization;
      return '';
    }
    return token;
  } catch {
    return '';
  }
};

export const setAuthToken = (token) => {
  try {
    if (token) {
      sessionStorage.setItem(AUTH_TOKEN_KEY, token);
      // Clear any legacy shared token to prevent cross-tab reuse.
      localStorage.removeItem(AUTH_TOKEN_KEY);
      if (!hasTabOwnership()) {
        sessionStorage.removeItem(AUTH_TOKEN_KEY);
        delete axios.defaults.headers.common.Authorization;
        return;
      }
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
      sessionStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(AUTH_TOKEN_KEY);
      clearOwnerIfCurrentTab();
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

export const initAuthTabLifecycle = () => {
  getTabId();
  window.addEventListener('beforeunload', clearOwnerIfCurrentTab);
};
