// src/app/(main-layout)/kerjasama/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ContentLayout } from '@/components/admin-panel/content-layout';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { KerjasamaDetail, MOU } from '@/components/data-ajuan/data-ajuan-detail';

// === SEMENTARA: mock fetch. Ganti dgn fetch API milikmu.
async function fetchMouById(id: string): Promise<MOU | null> {
    const mock: MOU = {
        id: 'MOA-001',
        level: 'MOA',
        documentNumber: '—',
        title: 'PENYELENGGARAAN TRI DHARMA PERGURUAN TINGGI FAKULTAS KEDOKTERAN DAN ILMU KESEHATAN',
        entryDate: '2025-08-29',
        partner: '—',
        partnerType: 'Universitas',
        partnerInfo: {
            phone: '+62 819-0428-0196',
            email: 'kerjasamafkikumy@gmail.com',
        },
        country: 'Indonesia',
        faculty: 'KEDOKTERAN',
        scope: ['Domestik', 'Kabupaten'],
        category: 'Cooperation',
        department: 'LKI',
        owner: 'Unit Pengaju',
        startDate: '2025-08-29',
        endDate: '2025-08-29',
        status: 'Active',
        documents: {
            suratPermohonanUrl: '/dokumen/surat-permohonan.pdf',
            proposalUrl: null,
            draftAjuanUrl: 'https://contoh.com/preview-draf-ajuan',
            draftAjuanFile: { name: 'draf-ajuan-contoh.pdf', url: '/dokumen/draf-ajuan-contoh.pdf' },
        },
        processStatus: 'Pengajuan Unit Ke LKI',
        approvalStatus: 'Menunggu Persetujuan',
        statusNote: '',
        fileUrl: '',
        notes: '',
    };

    return id === mock.id ? mock : null;
}

export default function KerjasamaDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [mou, setMou] = useState<MOU | null>(null);

    useEffect(() => {
        (async () => {
            setLoading(true);
            const found = await fetchMouById(decodeURIComponent(id));
            setMou(found);
            setLoading(false);
        })();
    }, [id]);

    return (
        <ContentLayout title="Detail Kerjasama">

            {loading ? (
                <p className="text-muted-foreground">Memuat…</p>
            ) : !mou ? (
                <p className="text-rose-600">Data tidak ditemukan.</p>
            ) : (
                <KerjasamaDetail data={mou} onChange={setMou} />
            )}
        </ContentLayout>
    );
}
