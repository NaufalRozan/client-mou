'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ContentLayout } from '@/components/admin-panel/content-layout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { KerjasamaDetail, MOU } from '@/components/data-ajuan/data-ajuan-detail';

/* ================= Mock data (prototype) ================= */
const mockData: MOU[] = [
    {
        id: 'MOU-001',
        level: 'MOU',
        documentNumber: 'MOU/UMY/2025/01',
        title: 'KERJASAMA PENELITIAN DAN PERTUKARAN MAHASISWA',
        entryDate: '2025-07-10',
        partner: 'Universitas A',
        partnerType: 'Universitas',
        country: 'Indonesia',
        faculty: 'TEKNIK',
        scope: ['Nasional'],
        category: 'Cooperation',
        department: 'LKI',
        owner: 'Unit Teknik',
        startDate: '2025-07-15',
        endDate: '2027-07-15',
        status: 'Active',
        documents: {
            suratPermohonanUrl: '/dokumen/mou-001-surat.pdf',
            proposalUrl: '/dokumen/mou-001-proposal.pdf',
            draftAjuanUrl: null,
        },
        processStatus: 'Ditandatangani',
        approvalStatus: 'Disetujui',
        statusNote: '',
        relatedIds: [],
    },
    {
        id: 'MOA-001',
        level: 'MOA',
        documentNumber: '—',
        title:
            'PENYELENGGARAAN TRI DHARMA PERGURUAN TINGGI FAKULTAS KEDOKTERAN DAN ILMU KESEHATAN',
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
            draftAjuanFile: {
                name: 'draf-ajuan-contoh.pdf',
                url: '/dokumen/draf-ajuan-contoh.pdf',
            },
        },
        processStatus: 'Pengajuan Unit Ke LKI',
        approvalStatus: 'Menunggu Persetujuan',
        statusNote: '',
        relatedIds: ['MOU-001'],
    },
    {
        id: 'IA-001',
        level: 'IA',
        documentNumber: 'IA/2025/05',
        title: 'IMPLEMENTASI PELATIHAN BERSAMA INDUSTRI XYZ',
        entryDate: '2025-09-01',
        partner: 'PT Industri XYZ',
        partnerType: 'Industri',
        country: 'Indonesia',
        faculty: 'EKONOMI',
        scope: ['Lokal'],
        category: 'Academic',
        department: 'LKI',
        owner: 'Fakultas Ekonomi',
        startDate: '2025-09-05',
        endDate: '2026-09-05',
        status: 'Draft',
        documents: {
            suratPermohonanUrl: null,
            proposalUrl: null,
            draftAjuanUrl: null,
        },
        processStatus: 'Penyusunan draft',
        approvalStatus: 'Belum Disetujui',
        statusNote: 'Menunggu dokumen tambahan',
        relatedIds: ['MOU-001'],
    },
];

/* ============== SEMENTARA: mock fetch ============== */
async function fetchMouById(id: string): Promise<MOU | null> {
    const found = mockData.find((d) => d.id === id);
    return found || null;
}

export default function KerjasamaDetailPage() {
    const { id } = useParams<{ id: string }>();

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

    // Persist perubahan dari komponen (prototype: update ke mockData juga)
    const handleChange = (next: MOU) => {
        setMou(next);
        const idx = mockData.findIndex((d) => d.id === next.id);
        if (idx >= 0) {
            // simpan perubahan termasuk relatedIds yang diedit
            mockData[idx] = { ...mockData[idx], ...next };
        }
    };

    // render list dokumen terkait terbaru
    const relatedDocs = mou?.relatedIds?.length
        ? mockData.filter((d) => mou.relatedIds?.includes(d.id))
        : [];

    return (
        <ContentLayout title="Detail Kerjasama">
            <div className="mb-4">
                <Button asChild variant="outline" size="sm">
                    <Link href="/data-ajuan">
                        <ArrowLeft className="mr-1 h-4 w-4" /> Kembali
                    </Link>
                </Button>
            </div>

            {loading ? (
                <p className="text-muted-foreground">Memuat…</p>
            ) : !mou ? (
                <p className="text-rose-600">Data tidak ditemukan.</p>
            ) : (
                <>
                    {/* KIRIMKAN allDocs agar field "Kaitkan Dokumen" muncul dan bisa diedit */}
                    <KerjasamaDetail
                        data={mou}
                        onChange={handleChange}
                        allDocs={mockData}           // sumber kandidat relasi
                        disallowSameLevel={true}     // ceklis: larang relasi sesama level (opsional)
                    />

                    {/* Ringkasan dokumen terkait di bawahnya (ikut live update) */}
                    {relatedDocs.length > 0 && (
                        <div className="mt-6 border-t pt-4">
                            <h3 className="text-lg font-semibold mb-3">Dokumen Terkait</h3>
                            <ul className="space-y-2">
                                {relatedDocs.map((doc) => (
                                    <li
                                        key={doc.id}
                                        className="flex items-center justify-between border rounded-md p-3"
                                    >
                                        <div>
                                            <div className="font-medium">{doc.title}</div>
                                            <div className="text-sm text-muted-foreground">
                                                {doc.level} — {doc.id}
                                            </div>
                                        </div>
                                        <Button asChild variant="outline" size="sm">
                                            <Link href={`/kerjasama/${doc.id}`}>
                                                <ExternalLink className="h-4 w-4 mr-1" /> Lihat
                                            </Link>
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </>
            )}
        </ContentLayout>
    );
}
