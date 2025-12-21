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

// ======== Ajuan (flow) types =========
export type AjuanStatus =
  | 'DRAFT'
  | 'PENGAJUAN_DOKUMEN'
  | 'VERIFIKASI_FAKULTAS'
  | 'REVIEW_DKG'
  | 'REVIEW_DKGE'
  | 'REVIEW_WR'
  | 'REVIEW_BLK'
  | 'REVISI'
  | 'SELESAI';

export type AjuanAllowedAction =
  | 'submit'
  | 'resubmit'
  | 'approve'
  | 'request_revision'
  | 'edit';

export interface AjuanReviewLog {
  stageStatus?: string;
  action?: 'APPROVE' | 'REQUEST_REVISION';
  note?: string | null;
  attachmentUrl?: string | null;
  actorRole?: string | null;
  createdAt?: string;
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
  // Flow fields (v1)
  status?: AjuanStatus;
  returnToStatus?: AjuanStatus | null;
  revisionRequestedBy?: string | null;
  submittedAt?: string | null;
  resubmittedAt?: string | null;
  completedAt?: string | null;
  pengajuRole?: string | null;
  allowed_actions?: AjuanAllowedAction[];
  allowedActions?: AjuanAllowedAction[];
  review_history?: AjuanReviewLog[];
  reviewHistory?: AjuanReviewLog[];
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

export interface AjuanSingleResponse {
  data: Kerjasama;
  message: string;
  status: string;
}

export interface ApiResponse {
  message: string;
  status: string;
}

class KerjasamaAPI {
  // Prefix intentionally versionless because BASE_URL already contains /api or /api/v1.
  // Using /kerjasama avoids double /v1 when BASE_URL ends with /api/v1.
  private readonly prefix = '/kerjasama';

  async getAll(): Promise<KerjasamaListResponse> {
    return await apiClient.get(`${this.prefix}`);
  }

  async getAllAjuan(): Promise<KerjasamaListResponse> {
    // Prefer v1 (flow + allowed actions)
    return await apiClient.get(`${this.prefix}`);
  }

  async getById(id: string): Promise<KerjasamaSingleResponse> {
    return await apiClient.get(`${this.prefix}/${id}`);
  }

  async getAjuanDetail(id: string): Promise<AjuanSingleResponse> {
    return await apiClient.get(`${this.prefix}/${id}`);
  }

  async create(data: KerjasamaRequest): Promise<KerjasamaSingleResponse> {
    try {
      // Ensure idDokumenRelasi is present (send [] when empty)
      const body = {
        ...data,
        idDokumenRelasi: data.idDokumenRelasi || [],
      };
      return await apiClient.post(`${this.prefix}`, body);
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
      return await apiClient.put(`${this.prefix}/${id}`, body);
    } catch (error) {
      console.error('Update kerjasama api error:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<ApiResponse> {
    try {
      return await apiClient.delete(`${this.prefix}/${id}`);
    } catch (error) {
      console.error('Delete kerjasama api error:', error);
      throw error;
    }
  }

  // ======= Flow actions (v1) =======
  async submit(id: string): Promise<AjuanSingleResponse> {
    return await apiClient.post(`${this.prefix}/${id}/submit`);
  }

  async resubmit(id: string): Promise<AjuanSingleResponse> {
    return await apiClient.post(`${this.prefix}/${id}/resubmit`);
  }

  async reviewApprove(id: string, payload?: { note?: string; attachmentUrl?: string | null }): Promise<AjuanSingleResponse> {
    return await apiClient.post(`${this.prefix}/${id}/review/approve`, payload || {});
  }

  async reviewRevision(
    id: string,
    payload: { note: string; attachmentUrl?: string | null }
  ): Promise<AjuanSingleResponse> {
    return await apiClient.post(`${this.prefix}/${id}/review/revision`, payload);
  }
}

export const kerjasamaAPI = new KerjasamaAPI();
