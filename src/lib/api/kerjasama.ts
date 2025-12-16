import { apiClient } from './client';

export interface KerjasamaRequest {
  unitId?: string;
  jenis?: string; // MOU | MOA | IA
  nomorDokumen?: string;
  judul?: string;
  tanggalEntry?: string;
  tanggalMulai?: string;
  tanggalBerakhir?: string;
  teleponPengaju?: string;
  emailPengaju?: string;
  jenisMitra?: string; // Universitas | Dudika | Pemerintah | NGO | dll
  lingkup?: string; // Nasional | Internasional | Regional
  namaInstitusi?: string;
  alamatProvinsi?: string;
  alamatKota?: string;
  alamatNegara?: string;
  kontakNama?: string;
  kontakJabatan?: string;
  kontakEmail?: string;
  kontakWA?: string;
  kontakWebsite?: string;
  durasiKerjasama?: number;
  statusProses?: string; // Pengajuan | Proses | Disetujui | Ditolak
  statusPersetujuan?: string;
  statusDokumen?: string;
  catatanStatus?: string;
  persetujuanDekan?: boolean;
  pdfReviewURL?: string;
  lampiranURL?: string;
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
  jenisMitra?: string | null;
  lingkup?: string | null;
  namaInstitusi?: string | null;
  alamatProvinsi?: string | null;
  alamatKota?: string | null;
  alamatNegara?: string | null;
  kontakNama?: string | null;
  kontakJabatan?: string | null;
  kontakEmail?: string | null;
  kontakWA?: string | null;
  kontakWebsite?: string | null;
  durasiKerjasama?: number | null;
  statusProses?: string | null;
  statusPersetujuan?: string | null;
  statusDokumen?: string | null;
  catatanStatus?: string | null;
  persetujuanDekan?: boolean | null;
  pdfReviewURL?: string | null;
  lampiranURL?: string | null;
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
