// src/app/auth/page.tsx
'use client';

import React, { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, User, RotateCcw } from 'lucide-react';
import { getAuth, isAuthed, setAuth } from '@/lib/proto/auth';
import { mockUsers } from '@/lib/proto/mockUsers';

/** ---------------- Google Icon (SVG) ---------------- */
function GoogleIcon() {
    return (
        <svg viewBox="0 0 48 48" className="h-4 w-4" aria-hidden="true">
            <path
                fill="#FFC107"
                d="M43.6 20.5H42V20H24v8h11.3C33.8 31.7 29.3 35 24 35c-6.6 0-12-5.4-12-12s5.4-12 
        12-12c3 0 5.7 1.1 7.8 3l5.7-5.7C34.1 5.1 29.3 3 24 3 12.4 
        3 3 12.4 3 24s9.4 21 21 21c10.5 0 20-7.6 20-21 
        0-1.2-.1-2.3-.4-3.5z"
            />
            <path
                fill="#FF3D00"
                d="M6.3 14.7l6.6 4.8C14.7 16.3 
        18.9 13 24 13c3 0 5.7 1.1 
        7.8 3l5.7-5.7C34.1 5.1 
        29.3 3 24 3 16 3 9.2 7.6 
        6.3 14.7z"
            />
            <path
                fill="#4CAF50"
                d="M24 45c5.2 0 10-1.7 
        13.7-4.7l-6.3-5.2C29.3 36.8 
        26.8 37.9 24 38c-5.2 0-9.6-3.3-11.2-8l-6.5 
        5C9.2 40.4 16 45 24 45z"
            />
            <path
                fill="#1976D2"
                d="M43.6 20.5H42V20H24v8h11.3c-1.3 
        3.3-4.8 7-11.3 7-5.2 0-9.6-3.3-11.2-8l-6.5 
        5C8.6 37.9 15.4 43 24 43c10.5 0 20-7.6 
        20-21 0-1.2-.1-2.3-.4-3.5z"
            />
        </svg>
    );
}

/** ---------------- Captcha sederhana ---------------- */
type Challenge = { a: number; b: number; op: '+' | '-' };

function generateChallenge(): Challenge {
    const a = Math.floor(Math.random() * 9) + 1;
    const b = Math.floor(Math.random() * 9) + 1;
    const op: '+' | '-' = Math.random() > 0.4 ? '+' : '-';
    if (op === '-' && b > a) return { a: b, b: a, op };
    return { a, b, op };
}
function solve({ a, b, op }: Challenge) {
    return op === '+' ? a + b : a - b;
}

export default function AuthPage() {
    const router = useRouter();

    // form state
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    // captcha state
    const [ch, setCh] = useState<Challenge | null>(null); // mulai null
    const [ans, setAns] = useState('');
    const [captchaOK, setCaptchaOK] = useState(false);

    useEffect(() => {
        // generate captcha hanya di client setelah mount
        setCh(generateChallenge());
    }, []);

    useEffect(() => {
        setCaptchaOK(false);
    }, [ans]);

    const refreshChallenge = () => {
        setCh(generateChallenge());
        setAns('');
        setCaptchaOK(false);
    };

    const validateCaptcha = () => {
        if (!ch) return false;
        const expected = solve(ch);
        const ok = Number(ans) === expected;
        setCaptchaOK(ok);
        if (!ok) toast.error('Jawaban captcha salah. Coba lagi.');
        return ok;
    };

    // redirect jika sudah login
    useEffect(() => {
        if (isAuthed()) {
            const u = getAuth();
            toast.info(`Kamu sudah login sebagai ${u?.role}`);
            router.replace('/data-ajuan');
        }
    }, [router]);

    const canSubmitCreds = useMemo(() => {
        return username.trim() !== '' && password.trim() !== '' && captchaOK;
    }, [username, password, captchaOK]);

    const canSubmitGoogle = useMemo(() => captchaOK, [captchaOK]);

    const onSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!validateCaptcha()) return;
        if (!canSubmitCreds) return;

        setLoading(true);

        const found = mockUsers.find(
            (u) => u.username === username.trim() && u.password === password
        );

        setTimeout(() => {
            if (!found) {
                toast.error('Username / password tidak cocok (mock).');
                setLoading(false);
                return;
            }
            setAuth({ username: found.username, role: found.role });
            toast.success(`Login berhasil sebagai ${found.role}`);
            router.push('/data-ajuan');
        }, 600);
    };

    // prototype login Google untuk guest
    const loginGooglePrototype = () => {
        if (!validateCaptcha()) return;
        setAuth({ username: 'guest_google', role: 'ORANG_LUAR' });
        toast.success('Login (Prototype Google) sebagai ORANG_LUAR');
        router.replace('/data-ajuan');
    };

    return (
        <section className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="bg-white flex rounded-2xl shadow-lg w-full max-w-md p-6">
                <div className="w-full">
                    <div className="flex items-center gap-2 text-[#002D74]">
                        <User className="h-6 w-6" />
                        <h2 className="font-bold text-2xl">Login</h2>
                    </div>
                    <p className="text-sm mt-1 text-[#335c8b]">SIM MOU</p>

                    <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
                        {/* Username */}
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Username</label>
                            <Input
                                placeholder="cth: ft_user"
                                value={username}
                                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                    setUsername(e.target.value)
                                }
                            />
                        </div>

                        {/* Password */}
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Password</label>
                            <div className="relative">
                                <Input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                        setPassword(e.target.value)
                                    }
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

                        {/* Captcha */}
                        <div className="mt-2 rounded-lg border p-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Captcha Keamanan</span>
                                <button
                                    type="button"
                                    onClick={refreshChallenge}
                                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                                    disabled={!ch}
                                >
                                    <RotateCcw className="h-3.5 w-3.5" />
                                    Ganti soal
                                </button>
                            </div>

                            <div className="mt-2 grid grid-cols-1 sm:grid-cols-[auto,1fr] items-center gap-2">
                                <div className="text-sm text-slate-700">
                                    {ch ? (
                                        <>
                                            Berapa hasil:{' '}
                                            <span className="font-semibold">
                                                {ch.a} {ch.op} {ch.b}
                                            </span>{' '}
                                            ?
                                        </>
                                    ) : (
                                        <span className="text-muted-foreground">
                                            Menyiapkan captcha…
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Input
                                        inputMode="numeric"
                                        placeholder="Jawaban"
                                        value={ans}
                                        onChange={(e) => setAns(e.target.value)}
                                        className="w-28"
                                        disabled={!ch}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={validateCaptcha}
                                        disabled={!ch}
                                    >
                                        Cek
                                    </Button>
                                </div>
                            </div>

                            <p
                                className={`mt-2 text-xs ${captchaOK ? 'text-emerald-600' : 'text-muted-foreground'
                                    }`}
                            >
                                {captchaOK
                                    ? 'Captcha terverifikasi ✅'
                                    : 'Isi jawaban yang benar lalu klik "Cek".'}
                            </p>
                        </div>

                        {/* Tombol login */}
                        <Button
                            type="submit"
                            disabled={!canSubmitCreds || loading}
                            className="mt-1"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Logging in...
                                </>
                            ) : (
                                'Login'
                            )}
                        </Button>

                        {/* Divider */}
                        <div className="relative my-2">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs">
                                <span className="bg-white px-2 text-muted-foreground">
                                    atau
                                </span>
                            </div>
                        </div>

                        {/* Google Login */}
                        <Button
                            type="button"
                            variant="outline"
                            onClick={loginGooglePrototype}
                            className="gap-2"
                            disabled={!canSubmitGoogle}
                        >
                            <GoogleIcon />
                            Lanjutkan dengan Google
                        </Button>

                        <div className="mt-1 text-xs text-muted-foreground">
                            Akun mock: <br />
                            <code>ft_user / ft123</code> → FAKULTAS
                            <br />
                            <code>lki_admin / lki123</code> → LEMBAGA_KERJA_SAMA
                            <br />
                            <code>prodi_user / prodi123</code> → PRODI
                            <br />
                            <code>guest_ext / guest123</code> → ORANG_LUAR
                            <br />
                            <code>wr_admin / wr123</code> → WR
                        </div>
                    </form>
                </div>
            </div>
        </section>
    );
}
