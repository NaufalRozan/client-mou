// src/lib/api/auth.ts
import { apiClient } from './client';

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
            const data = await apiClient.post<LoginResponse>('/auth/login', credentials);
            console.log('Raw backend response:', data);

            // Simpan token ke localStorage jika login berhasil
            if (data.status === 200 && data.data?.access_token) {
                localStorage.setItem('auth_token', data.data.access_token);

                // Decode JWT untuk mendapatkan info user (optional, bisa skip jika tidak perlu)
                try {
                    const payload = this.decodeJWT(data.data.access_token);
                    console.log('JWT payload:', payload);

                    const user = {
                        id: payload.id || 'unknown',
                        email: payload.email || credentials.email,
                        name: payload.username || 'User',
                        role: payload.role || 'LEMBAGA_KERJA_SAMA'
                    };

                    localStorage.setItem('auth_user', JSON.stringify(user));
                } catch (jwtError) {
                    console.warn('Could not decode JWT:', jwtError);
                    // Fallback user object
                    const user = {
                        id: 'unknown',
                        email: credentials.email,
                        name: 'User',
                        role: 'LEMBAGA_KERJA_SAMA'
                    };
                    localStorage.setItem('auth_user', JSON.stringify(user));
                }
            }

            return data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    private decodeJWT(token: string): any {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        } catch (error) {
            throw new Error('Invalid JWT token');
        }
    }

    async logout(): Promise<void> {
        try {
            await apiClient.post('/auth/logout');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Hapus token dan user data dari localStorage
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
            localStorage.removeItem('proto_auth'); // Clear old auth data
        }
    }

    async refreshToken(): Promise<boolean> {
        try {
            const response = await apiClient.post<{ token: string }>('/auth/refresh');
            if (response.token) {
                localStorage.setItem('auth_token', response.token);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Token refresh failed:', error);
            return false;
        }
    }

    async getCurrentUser(): Promise<any> {
        try {
            const response = await apiClient.get('/auth/me');
            return response.data;
        } catch (error) {
            console.error('Get current user failed:', error);
            throw error;
        }
    }

    getToken(): string | null {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem('auth_token');
    }

    getUser(): any | null {
        if (typeof window === 'undefined') return null;
        const userStr = localStorage.getItem('auth_user');
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