// src/lib/api/unit.ts
import { apiClient } from './client';

export interface Unit {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUnitRequest {
  name: string;
  categoryId: string;
}

export interface UpdateUnitRequest {
  name: string;
  categoryId: string;
}

export interface UnitResponse {
  data: Unit[];
  message: string;
  status: string;
}

export interface SingleUnitResponse {
  data: Unit;
  message: string;
  status: string;
}

export interface ApiResponse {
  message: string;
  status: string;
}

class UnitAPI {
  async getAllUnits(): Promise<UnitResponse> {
    try {
      const response = await apiClient.get<UnitResponse>('/unit/');
      return response;
    } catch (error) {
      console.error('Get units error:', error);
      throw error;
    }
  }

  async getUnitById(id: string): Promise<SingleUnitResponse> {
    try {
      const response = await apiClient.get<SingleUnitResponse>(`/unit/${id}`);
      return response;
    } catch (error) {
      console.error('Get unit by ID error:', error);
      throw error;
    }
  }

  async createUnit(data: CreateUnitRequest): Promise<SingleUnitResponse> {
    try {
      const response = await apiClient.post<SingleUnitResponse>('/unit/', data);
      return response;
    } catch (error) {
      console.error('Create unit error:', error);
      throw error;
    }
  }

  async updateUnit(id: string, data: UpdateUnitRequest): Promise<SingleUnitResponse> {
    try {
      const response = await apiClient.put<SingleUnitResponse>(`/unit/${id}`, data);
      return response;
    } catch (error) {
      console.error('Update unit error:', error);
      throw error;
    }
  }

  async deleteUnit(id: string): Promise<ApiResponse> {
    try {
      const response = await apiClient.delete<ApiResponse>(`/unit/${id}`);
      return response;
    } catch (error) {
      console.error('Delete unit error:', error);
      throw error;
    }
  }
}

export const unitAPI = new UnitAPI();