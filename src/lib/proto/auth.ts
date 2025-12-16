// Enhanced auth helpers with backend integration

export type Role = "LEMBAGA_KERJA_SAMA" | "FAKULTAS" | "PRODI" | "ORANG_LUAR" | "WR";

export type AuthUser = {
    id?: string;
    username: string;
    email?: string;
    name?: string;
    role: Role;
    unitId?: string;
    unitName?: string;
    facultyName?: string;
    studyProgramName?: string;
    unit?: Array<{
        id: string;
        name: string;
        categoryId?: string;
        isUnit?: boolean;
    }>;
};

const KEY = "proto_auth";
const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

export function setAuth(user: AuthUser) {
    if (typeof window === "undefined") return;
    localStorage.setItem(KEY, JSON.stringify(user));
}

export function getAuth(): AuthUser | null {
    if (typeof window === "undefined") return null;

    // Check for new auth format first
    const userStr = localStorage.getItem(USER_KEY);
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            return {
                id: user.id,
                username: user.name || user.email || user.username || 'user',
                email: user.email,
                name: user.name,
                role: mapBackendRoleToLocal(user.role || null),
                unitId: user.unitId || user.unit_id || user.unitCode || user.unit,
                unitName: user.unitName || user.unit_name || user.unit,
                facultyName: user.facultyName || user.faculty || user.fakultas,
                studyProgramName: user.studyProgramName || user.programStudi || user.prodi,
                unit: Array.isArray(user.unit) ? user.unit : undefined,
            };
        } catch {
            // Fall through to legacy format
        }
    }

    // Fallback to legacy format
    const s = localStorage.getItem(KEY);
    if (!s) return null;
    try {
        return JSON.parse(s) as AuthUser;
    } catch {
        return null;
    }
}

export function clearAuth() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
}

export function isAuthed() {
    if (typeof window === "undefined") return false;

    // Check for token-based auth first
    const token = localStorage.getItem(TOKEN_KEY);
    const user = localStorage.getItem(USER_KEY);

    if (token && user) {
        return true;
    }

    // Fallback to legacy auth
    return !!getAuth();
}

export function getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
}

// Helper function to map backend roles to local roles
export function mapBackendRoleToLocal(backendRole: string | null): Role {
    if (!backendRole) return 'LEMBAGA_KERJA_SAMA'; // Default role jika null

    const roleMapping: Record<string, Role> = {
        'lembaga_kerja_sama': 'LEMBAGA_KERJA_SAMA',
        'fakultas': 'FAKULTAS',
        'prodi': 'PRODI',
        'orang_luar': 'ORANG_LUAR',
        'wr': 'WR',
        // Add exact matches too
        'LEMBAGA_KERJA_SAMA': 'LEMBAGA_KERJA_SAMA',
        'FAKULTAS': 'FAKULTAS',
        'PRODI': 'PRODI',
        'ORANG_LUAR': 'ORANG_LUAR',
        'WR': 'WR',
    };

    return roleMapping[backendRole] || 'LEMBAGA_KERJA_SAMA';
}
