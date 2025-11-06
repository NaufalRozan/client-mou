// src/hooks/use-auth.ts
import { useRouter } from 'next/navigation';
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { authAPI } from '@/lib/api/auth';
import { clearAuth } from '@/lib/proto/auth';

export function useAuth() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const logout = useCallback(async () => {
        try {
            setLoading(true);
            await authAPI.logout();
            clearAuth();
            toast.success('Logout berhasil');
            router.push('/auth');
        } catch (error) {
            console.error('Logout error:', error);
            // Force logout even if API fails
            clearAuth();
            toast.info('Logout berhasil');
            router.push('/auth');
        } finally {
            setLoading(false);
        }
    }, [router]);

    const refreshToken = useCallback(async (): Promise<boolean> => {
        try {
            return await authAPI.refreshToken();
        } catch (error) {
            console.error('Token refresh error:', error);
            return false;
        }
    }, []);

    return {
        logout,
        refreshToken,
        loading,
    };
}