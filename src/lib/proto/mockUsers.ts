import type { Role } from "./auth";

export const mockUsers: Array<{ username: string; password: string; role: Role }> = [
    { username: "lki_admin", password: "lki123", role: "LEMBAGA_KERJA_SAMA" },
    { username: "ft_user", password: "ft123", role: "FAKULTAS" },
    { username: "prodi_user", password: "prodi123", role: "PRODI" },
    { username: "guest_ext", password: "guest123", role: "ORANG_LUAR" },
    { username: "wr_admin", password: "wr123", role: "WR" },
];
