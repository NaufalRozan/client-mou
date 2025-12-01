import { apiClient } from './client';

export interface KerjasamaRequest {
  unitId: string;
  jenis: string; // MOU | MOA | IA
  nomorDokumen?: string | null;
  judul: string;
  tanggalEntry: string;
  tanggalMulai: string;
  tanggalBerakhir: string;
  teleponPengaju?: string | null;
  emailPengaju?: string | null;
  lingkup?: string | null; // comma separated or single
  statusProses?: string | null;
  statusPersetujuan?: string | null;
  catatanStatus?: string | null;
  lampiranURL?: string | null;
  statusDokumen?: string;
  idDokumenRelasi?: string[];
}

export interface Kerjasama {
  id: string;
  unitId?: string;
  jenis?: string;
  nomorDokumen?: string | null;
  judul?: string;
  tanggalEntry?: string;
  tanggalMulai?: string;
  tanggalBerakhir?: string;
  teleponPengaju?: string | null;
  emailPengaju?: string | null;
  lingkup?: string | null;
  statusProses?: string | null;
  statusPersetujuan?: string | null;
  catatanStatus?: string | null;
  lampiranURL?: string | null;
  statusDokumen?: string;
  idDokumenRelasi?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface KerjasamaListResponse {
  data: Kerjasama[];
  message: string;
  status: string;
}

export interface KerjasamaSingleResponse {
  data: Kerjasama;
  message: string;
  status: string;
}

export interface ApiResponse {
  message: string;
  status: string;
}

class KerjasamaAPI {
  async getAll(): Promise<KerjasamaListResponse> {
    return await apiClient.get('/kerjasama/');
  }

  async getById(id: string): Promise<KerjasamaSingleResponse> {
    return await apiClient.get(`/kerjasama/${id}`);
  }

  async create(data: KerjasamaRequest): Promise<KerjasamaSingleResponse> {
    try {
      // Ensure idDokumenRelasi is present (send [] when empty)
      const body = {
        ...data,
        idDokumenRelasi: data.idDokumenRelasi || [],
      };
      return await apiClient.post('/kerjasama/', body);
    } catch (error) {
      console.error('Create kerjasama api error:', error);
      throw error;
    }
  }

  async update(id: string, data: Partial<KerjasamaRequest>): Promise<KerjasamaSingleResponse> {
    try {
      const body = {
        ...data,
        idDokumenRelasi: data.idDokumenRelasi || [],
      };
      return await apiClient.put(`/kerjasama/${id}`, body);
    } catch (error) {
      console.error('Update kerjasama api error:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<ApiResponse> {
    try {
      return await apiClient.delete(`/kerjasama/${id}`);
    } catch (error) {
      console.error('Delete kerjasama api error:', error);
      throw error;
    }
  }
}

export const kerjasamaAPI = new KerjasamaAPI();
