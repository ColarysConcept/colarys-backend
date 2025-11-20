import axios from 'axios';
import { env } from '@/config/env';

const apiClient = axios.create({
  baseURL: env.API_BASE_URL,
  timeout: 5000,
});

// Types pour TypeScript
export interface PlanningEntry {
  id?: number;
  agent: {
    prenom: string;
    nom: string;
    email: string;
    tel1: string;
    role?: { nom: string };
    plateforme?: { nom: string };
  };
  date: string;
  shiftType: string;
  heuresTravail: number;
  remarques: string;
}

export interface SearchParams {
  type?: string;
  date?: string;
  semaine?: string;
  shiftType?: string;
  plateforme?: number;
  role?: number;
  startDate?: string;
  endDate?: string;
}

export const PlanningApi = {
  async getPlanning(params: SearchParams): Promise<PlanningEntry[]> {
    try {
      let endpoint = '/planning';
      let config = {};
      
      if (params.startDate && params.endDate) {
        endpoint = '/planning';
        config = { params: { startDate: params.startDate, endDate: params.endDate } };
      } else {
        endpoint = '/planning/search';
        config = { params };
      }
      
      const response = await apiClient.get(endpoint, config);
      return response.data;
    } catch (error) {
      console.error('Error fetching planning:', error);
      throw error;
    }
  },

  async uploadPlanning(formData: FormData): Promise<any> {
    try {
      const response = await apiClient.post('/planning/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading planning:', error);
      throw error;
    }
  },

  async exportExcel(params: SearchParams): Promise<Blob> {
    try {
      const response = await apiClient.get('/planning/export-excel', {
        params,
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Error exporting Excel:', error);
      throw error;
    }
  }
};