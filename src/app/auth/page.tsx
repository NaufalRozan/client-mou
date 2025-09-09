'use client'

import React, { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, User } from 'lucide-react';
import { getAuth, isAuthed, setAuth } from '@/lib/proto/auth';
import { mockUsers } from '@/lib/proto/mockUsers';

export default function AuthPage() {
    const router = useRouter();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    // Jika sudah login (local), langsung lempar ke dashboard
    useEffect(() => {
        if (isAuthed()) {
            const u = getAuth();
            toast.info(`Kamu sudah login sebagai ${u?.role}`);
            router.replace('/data-ajuan');
        }
    }, [router]);

    const canSubmit = useMemo(() => {
        return username.trim() !== '' && password.trim() !== '';
    }, [username, password]);

    const onSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!canSubmit) return;

        setLoading(true);

        // PROTOTYPE: validasi ke mock users berdasarkan username & password (tanpa pilih role)
        const found = mockUsers.find(
            (u) => u.username === username.trim() && u.password === password
        );

        setTimeout(() => {
            if (!found) {
                toast.error('Username / password tidak cocok (mock).');
                setLoading(false);
                return;
            }

            // simpan sesi lokal dengan role dari mock
            setAuth({ username: found.username, role: found.role });
            toast.success(`Login berhasil sebagai ${found.role}`);
            router.push('/data-ajuan'); // sesuaikan jika ingin ke halaman lain
        }, 600); // sekadar animasi loading
    };

    return (
        <section className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="bg-white flex rounded-2xl shadow-lg w-full max-w-md p-6">
                <div className="w-full">
                    <div className="flex items-center gap-2 text-[#002D74]">
                        <User className="h-6 w-6" />
                        <h2 className="font-bold text-2xl">Login</h2>
                    </div>
                    <p className="text-sm mt-1 text-[#335c8b]">Prototype SIM MOU (client-only)</p>

                    <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Username</label>
                            <Input
                                placeholder="cth: ft_user"
                                value={username}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                            />
                        </div>

                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Password</label>
                            <div className="relative">
                                <Input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[#335c8b] hover:underline"
                                    onClick={() => setShowPassword((s) => !s)}
                                >
                                    {showPassword ? 'Hide' : 'Show'}
                                </button>
                            </div>
                        </div>

                        <Button type="submit" disabled={!canSubmit || loading} className="mt-2">
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Logging in...
                                </>
                            ) : (
                                'Login'
                            )}
                        </Button>

                        <div className="mt-1 text-xs text-muted-foreground">
                            Akun mock: <br />
                            <code>ft_user / ft123</code> → FAKULTAS<br />
                            <code>lki_admin / lki123</code> → LEMBAGA_KERJA_SAMA<br />
                            <code>prodi_user / prodi123</code> → PRODI<br />
                            <code>guest_ext / guest123</code> → ORANG_LUAR<br />
                            <code>wr_admin / wr123</code> → WR
                        </div>
                    </form>
                </div>
            </div>
        </section>
    );
}
