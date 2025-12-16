// src/lib/api/auth.ts
import { apiClient } from "./client";
import { AuthUser, mapBackendRoleToLocal } from "@/lib/proto/auth";
import { BASE_URL, DOMAIN } from "@/constant/BaseURL";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  status: number;
  message: string;
  data: {
    access_token: string;
  };
}

export interface LoginResponseLegacy {
  success: boolean;
  message: string;
  data?: {
    token: string;
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
    };
  };
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

class AuthAPI {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const data = await apiClient.post<LoginResponse>(
        "/auth/login",
        credentials
      );
      console.log("Raw backend response:", data);

      // Simpan token ke localStorage jika login berhasil
      if (data.status === 200 && data.data?.access_token) {
        localStorage.setItem("auth_token", data.data.access_token);

        // Ambil profil lengkap (termasuk info unit/prodi)
        const profile = await this.fetchProfile();

        if (profile) {
          localStorage.setItem("auth_user", JSON.stringify(profile));
        } else {
          // Fallback: decode JWT untuk info minimal
          try {
            const payload = this.decodeJWT(data.data.access_token);
            console.log("JWT payload:", payload);

            const user: AuthUser = {
              id: payload.id || "unknown",
              email: payload.email || credentials.email,
              username: payload.username || payload.email || "user",
              name: payload.username || payload.email || "User",
              role: mapBackendRoleToLocal(payload.role || null),
              unitId:
                payload.unitId ||
                payload.unit_id ||
                payload.unitCode ||
                payload.unit,
              unitName: payload.unitName || payload.unit,
              facultyName:
                payload.facultyName || payload.faculty || payload.fakultas,
              studyProgramName:
                payload.studyProgramName ||
                payload.programStudi ||
                payload.prodi
            };

            localStorage.setItem("auth_user", JSON.stringify(user));
          } catch (jwtError) {
            console.warn("Could not decode JWT:", jwtError);
            const user: AuthUser = {
              id: "unknown",
              email: credentials.email,
              username: credentials.email,
              name: "User",
              role: "LEMBAGA_KERJA_SAMA"
            };
            localStorage.setItem("auth_user", JSON.stringify(user));
          }
        }
      }

      return data;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  }

  async fetchProfileAndStore(): Promise<AuthUser | null> {
    const profile = await this.fetchProfile();
    if (profile) {
      localStorage.setItem("auth_user", JSON.stringify(profile));
    }
    return profile;
  }

  private async fetchProfile(): Promise<AuthUser | null> {
    const domain = DOMAIN || BASE_URL.replace(/\/api\/?$/, "");
    const fallbackPaths = [
      process.env.NEXT_PUBLIC_USER_PROFILE_PATH, // full URL or relative override
      `${domain}/api/v1/users/access-token`,
      `${BASE_URL.replace(/\/$/, "")}/v1/users/access-token`,
      "/v1/users/access-token",
      "/api/v1/users/access-token"
    ].filter(Boolean) as string[];

    for (const path of fallbackPaths) {
      try {
        const res: any = await this.getWithToken(path);
        const profile = res?.data || res;
        if (!profile) continue;

        const unitArr = Array.isArray(profile.unit) ? profile.unit : [];
        const primaryUnit = unitArr[0];

        const user: AuthUser = {
          id: profile.id || "unknown",
          email: profile.email,
          username: profile.username || profile.email || "user",
          name: profile.username || profile.email || "User",
          role: mapBackendRoleToLocal(profile.role || null),
          unit: unitArr,
          unitId: primaryUnit?.id,
          unitName: primaryUnit?.name,
          facultyName: profile.facultyName || primaryUnit?.categoryId,
          studyProgramName:
            profile.studyProgramName ||
            (primaryUnit?.isUnit ? primaryUnit.name : undefined)
        };
        return user;
      } catch (err) {
        console.warn(`fetchProfile failed on ${path}:`, err);
        continue;
      }
    }

    return null;
  }

  // Mendukung path absolut atau relatif ke BASE_URL
  private async getWithToken(path: string): Promise<any> {
    const isAbsolute = /^https?:\/\//i.test(path);
    if (isAbsolute) {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("auth_token")
          : null;
      const res = await fetch(path, {
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    }

    return apiClient.get(path);
  }

  private decodeJWT(token: string): any {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map(function (c) {
            return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join("")
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      throw new Error("Invalid JWT token");
    }
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post("/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Hapus token dan user data dari localStorage
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      localStorage.removeItem("proto_auth"); // Clear old auth data
    }
  }

  async refreshToken(): Promise<boolean> {
    try {
      const response = await apiClient.post<{ token: string }>("/auth/refresh");
      if (response.token) {
        localStorage.setItem("auth_token", response.token);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Token refresh failed:", error);
      return false;
    }
  }

  async getCurrentUser(): Promise<any> {
    try {
      const response = await apiClient.get("/auth/me");
      return response.data;
    } catch (error) {
      console.error("Get current user failed:", error);
      throw error;
    }
  }

  getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("auth_token");
  }

  getUser(): any | null {
    if (typeof window === "undefined") return null;
    const userStr = localStorage.getItem("auth_user");
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  isAuthenticated(): boolean {
    return !!this.getToken() && !!this.getUser();
  }
}

export const authAPI = new AuthAPI();
