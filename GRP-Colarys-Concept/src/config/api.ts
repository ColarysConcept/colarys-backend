// src/config/api.js
export const API_CONFIG = {
  BASE_URL: 'https://colarys-bakend.vercel.app/api',
  TIMEOUT: 10000,
  ENDPOINTS: {
    AUTH: {
      LOGIN: 'api/auth/login',
      LOGOUT: '/auth/logout',
      ME: '/auth/me'
    },
    USERS: '/api/users',
    AGENTS: '/api/agents',
    // Ajoutez tous vos endpoints ici
  }
};

export const API_BASE_URL = API_CONFIG.BASE_URL;