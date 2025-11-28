// src/config/api.js
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'https://theme-gestion-des-resources-et-prod.vercel.app/api',
  ENDPOINTS: {
    EMPLOYEES: '/colarys/employees',
    PRESENCES: '/colarys/presences',
    SALARIES: '/colarys/salaires',
    HEALTH: '/colarys/health'
  }
}

export const getApiUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`
}