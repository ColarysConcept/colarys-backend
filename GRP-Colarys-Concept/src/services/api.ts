// ✅ URL BACKEND PERMANENTE
const API_BASE_URL = 'https://colarys-bakend.vercel.app/api';

export const api = {
  async get(url: string) {
    const response = await fetch(`${API_BASE_URL}/api${url}`);
    if (!response.ok) throw new Error(`GET Error: ${response.status}`);
    return response.json();
  },

  async post(url: string, data: any) {
    const response = await fetch(`${API_BASE_URL}/api${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`POST Error: ${response.status}`);
    return response.json();
  },

  async postFormData(url: string, formData: FormData) {
    const response = await fetch(`${API_BASE_URL}/api${url}`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) throw new Error(`POST Error: ${response.status}`);
    return response.json();
  },
};