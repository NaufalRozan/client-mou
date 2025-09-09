// Simple client-only auth helpers (prototype)

export type Role = "LEMBAGA_KERJA_SAMA" | "FAKULTAS" | "PRODI" | "ORANG_LUAR" | "WR";

export type AuthUser = {
    username: string;
    role: Role;
};

const KEY = "proto_auth";

export function setAuth(user: AuthUser) {
    if (typeof window === "undefined") return;
    localStorage.setItem(KEY, JSON.stringify(user));
}

export function getAuth(): AuthUser | null {
    if (typeof window === "undefined") return null;
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
}

export function isAuthed() {
    return !!getAuth();
}
