'use client';

import { useEffect, useMemo, useState } from 'react';
import { ContentLayout } from '@/components/admin-panel/content-layout';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

import {
    Calendar as CalendarIcon,
    Search,
    CheckCircle2,
    AlertTriangle,
    XCircle,
    ChevronLeft,
    ChevronRight,
    FileSignature,
    Eye,
} from 'lucide-react';
import Link from 'next/link';

/* ================= Types (samakan dengan Data Ajuan) ================= */
type MOUStatus = 'Draft' | 'Active' | 'Expiring' | 'Expired' | 'Terminated';
type MOULevel = 'MOU' | 'MOA' | 'IA';
type PartnerType = 'Universitas' | 'Industri' | 'Pemerintah' | 'Organisasi';

type PartnerInfo = { phone?: string; email?: string };
type DocFile = { name: string; url: string } | null;

type Documents = {
    suratPermohonanUrl?: string | null;
    proposalUrl?: string | null;
    draftAjuanUrl?: string | null;
    suratPermohonanFile?: DocFile;
    proposalFile?: DocFile;
    draftAjuanFile?: DocFile;
};

type MOU = {
    id: string;
    level: MOULevel;
    documentNumber: string;
    title: string;
    entryDate: string;
    partner: string;
    partnerType: PartnerType;
    partnerInfo?: PartnerInfo;
    country: string;
    faculty: string;
    studyProgram?: string;
    unit?: string;
    scope: string[];
    category: 'Cooperation' | 'NDA' | 'Grant' | 'Vendor' | 'Academic';
    department: string;
    owner: string;
    value?: number;
    signDate?: string;
    startDate: string;
    endDate: string;
    status: MOUStatus;
    documents?: Documents;
    processStatus?: string;
    approvalStatus?: string; // "Disetujui" = sudah ACC WR
    statusNote?: string;
    fileUrl?: string;
    notes?: string;
    relatedIds?: string[];
};

/* ============== Helpers ============== */
const fmtDate = (iso: string) =>
    new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(iso));

const daysBetween = (startISO: string, endISO: string) => {
    const ms = new Date(endISO).getTime() - new Date(startISO).getTime();
    return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
};

function DateBadge({ date }: { date: string }) {
    return (
        <Badge variant="secondary" className="font-normal">
            <CalendarIcon className="mr-1 h-3.5 w-3.5" />
            {fmtDate(date)}
        </Badge>
    );
}

function StatusPill({ status }: { status: MOUStatus }) {
    const base = 'px-2 py-0.5 text-xs rounded-full border';
    const cls =
        status === 'Active'
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : status === 'Expiring'
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : status === 'Expired'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : status === 'Draft'
                        ? 'bg-slate-50 text-slate-700 border-slate-200'
                        : 'bg-zinc-50 text-zinc-700 border-zinc-200';
    return <span className={`${base} ${cls}`}>{status}</span>;
}

/* ============== Seed (boleh diganti dari API/shared store) ============== */
const initialData: MOU[] = [
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
        approvalStatus: 'Disetujui', // <- ini yang akan diambil
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
        approvalStatus: 'Menunggu Persetujuan', // <- tidak akan tampil di halaman berjalan
        statusNote: '',
        relatedIds: ['MOU-001'],
    },
];

/* ============== Page (Approved Only, table ringkas) ============== */
export default function DataBerjalanPage() {
    const [loading, setLoading] = useState(true);
    const [rows, setRows] = useState<MOU[]>([]);

    // filters
    const [q, setQ] = useState('');
    const [status, setStatus] = useState<MOUStatus | 'all'>('all');
    const [level, setLevel] = useState<MOULevel | 'all'>('all');

    // pagination
    const [page, setPage] = useState(1);
    const limit = 10;

    useEffect(() => {
        const t = setTimeout(() => {
            setRows(initialData);
            setLoading(false);
        }, 250);
        return () => clearTimeout(t);
    }, []);

    // === APPROVED ONLY: basis data hanya yang "Disetujui"
    const approvedRows = useMemo(
        () => rows.filter((d) => (d.approvalStatus || '').toLowerCase() === 'disetujui'),
        [rows]
    );

    // filter lanjutan di atas approvedRows
    const filtered = useMemo(() => {
        const txt = q.trim().toLowerCase();
        return approvedRows.filter((d) => {
            const matchQ =
                txt === '' ||
                [d.title, d.documentNumber, d.faculty, d.unit].filter(Boolean).join(' ').toLowerCase().includes(txt);

            const matchStatus = status === 'all' || d.status === status;
            const matchLevel = level === 'all' || d.level === level;

            return matchQ && matchStatus && matchLevel;
        });
    }, [approvedRows, q, status, level]);

    // pagination
    const total = filtered.length;
    const start = (page - 1) * limit;
    const end = start + limit;
    const pageRows = filtered.slice(start, end);
    const canPrev = page > 1;
    const canNext = end < total;

    // ringkasan (khusus data approved)
    const stats = useMemo(() => {
        const active = approvedRows.filter((d) => d.status === 'Active').length;
        const expiring = approvedRows.filter((d) => d.status === 'Expiring').length;
        const expired = approvedRows.filter((d) => d.status === 'Expired').length;
        return { total: approvedRows.length, active, expiring, expired };
    }, [approvedRows]);

    return (
        <ContentLayout title="Data Berjalan (Sudah ACC WR)">
            <div className="mt-6 space-y-6">
                {/* Info Bar */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard title="Total Berjalan" value={stats.total} subtitle="Sudah ACC WR" icon={<FileSignature className="h-5 w-5" />} />
                    <StatCard title="Active" value={stats.active} subtitle="Status dokumen" icon={<CheckCircle2 className="h-5 w-5" />} />
                    <StatCard title="Expiring" value={stats.expiring} subtitle="Perlu perhatian" icon={<AlertTriangle className="h-5 w-5" />} />
                    <StatCard title="Expired" value={stats.expired} subtitle="Butuh tindak lanjut" icon={<XCircle className="h-5 w-5" />} />
                </div>

                {/* Filter */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Pencarian</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                        <div className="flex w-full flex-wrap items-center gap-2">
                            <div className="relative w-full max-w-sm">
                                <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Cari judul / no dokumen / unit…"
                                    className="pl-8"
                                    value={q}
                                    onChange={(e) => {
                                        setPage(1);
                                        setQ(e.target.value);
                                    }}
                                />
                            </div>

                            <Select
                                onValueChange={(v) => {
                                    setPage(1);
                                    setLevel(v as any);
                                }}
                                defaultValue="all"
                            >
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Jenis Kerjasama" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua</SelectItem>
                                    <SelectItem value="MOU">MOU</SelectItem>
                                    <SelectItem value="MOA">MOA</SelectItem>
                                    <SelectItem value="IA">IA</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select
                                onValueChange={(v) => {
                                    setPage(1);
                                    setStatus(v as any);
                                }}
                                defaultValue="all"
                            >
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua status</SelectItem>
                                    <SelectItem value="Draft">Draft</SelectItem>
                                    <SelectItem value="Active">Active</SelectItem>
                                    <SelectItem value="Expiring">Expiring</SelectItem>
                                    <SelectItem value="Expired">Expired</SelectItem>
                                    <SelectItem value="Terminated">Terminated</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Tabel (approved only, ringkas) */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Daftar Dokumen Berjalan</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <p className="text-muted-foreground">Memuat data…</p>
                        ) : (
                            <>
                                <div className="relative overflow-x-auto rounded-md border">
                                    <Table className="min-w-[900px]">
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[56px]">No</TableHead>
                                                <TableHead>Tentang</TableHead>
                                                <TableHead>Jenis</TableHead>
                                                <TableHead>Unit</TableHead>
                                                <TableHead>Tgl Entry</TableHead>
                                                <TableHead>Berlaku</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Aksi</TableHead>
                                            </TableRow>
                                        </TableHeader>

                                        <TableBody>
                                            {pageRows.length ? (
                                                pageRows.map((row, idx) => {
                                                    const masaHari = daysBetween(row.startDate, row.endDate);
                                                    const related = (row.relatedIds || [])
                                                        .map((id) => rows.find((r) => r.id === id))
                                                        .filter(Boolean) as MOU[];

                                                    return (
                                                        <TableRow key={row.id} className="align-top">
                                                            <TableCell>{start + idx + 1}</TableCell>

                                                            {/* Tentang (judul + nomor dokumen + chip terkait) */}
                                                            <TableCell>
                                                                <div className="space-y-1">
                                                                    <div className="font-medium">{row.title}</div>
                                                                    <div className="text-xs text-muted-foreground">
                                                                        {row.documentNumber || '—'}
                                                                    </div>

                                                                    {related.length > 0 && (
                                                                        <div className="flex flex-wrap gap-1 pt-1">
                                                                            {related.map((r) => (
                                                                                <Badge key={r.id} variant="outline" className="text-[11px]">
                                                                                    <Link
                                                                                        href={`/data-berjalan/${encodeURIComponent(r.id)}`}
                                                                                        className="hover:underline"
                                                                                    >
                                                                                        Terkait: {r.level}-{r.id.split('-')[1] ?? r.id}
                                                                                    </Link>
                                                                                </Badge>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </TableCell>

                                                            {/* Jenis */}
                                                            <TableCell className="whitespace-nowrap">
                                                                <div className="font-medium">{row.level}</div>
                                                            </TableCell>

                                                            {/* Unit */}
                                                            <TableCell className="uppercase">
                                                                {row.faculty || row.unit || '—'}
                                                            </TableCell>

                                                            {/* Entry */}
                                                            <TableCell className="whitespace-nowrap">
                                                                {fmtDate(row.entryDate)}
                                                            </TableCell>

                                                            {/* Berlaku (range + total hari) */}
                                                            <TableCell>
                                                                <div className="text-sm space-y-1">
                                                                    <div className="flex gap-1 items-center">
                                                                        <DateBadge date={row.startDate} />
                                                                        <span className="text-muted-foreground text-[11px]">s/d</span>
                                                                        <DateBadge date={row.endDate} />
                                                                    </div>
                                                                    <div className="text-xs text-muted-foreground">
                                                                        {masaHari} hari
                                                                    </div>
                                                                </div>
                                                            </TableCell>

                                                            {/* Status (status + label Disetujui selalu) */}
                                                            <TableCell className="whitespace-nowrap">
                                                                <div className="flex flex-col gap-1">
                                                                    <StatusPill status={row.status} />
                                                                    <span className="text-[11px] text-emerald-700 font-medium">
                                                                        Disetujui
                                                                    </span>
                                                                </div>
                                                            </TableCell>

                                                            {/* Aksi */}
                                                            <TableCell className="text-right space-x-1">
                                                                <Button asChild variant="outline" size="icon" className="h-8 w-8" title="Detail">
                                                                    <Link href={`/data-berjalan/${encodeURIComponent(row.id)}`} aria-label="Lihat detail">
                                                                        <Eye className="h-4 w-4" />
                                                                    </Link>
                                                                </Button>

                                                                <Button asChild variant="outline" size="icon" className="h-8 w-8" title="Daftar Kegiatan">
                                                                    <Link href={`/data-berjalan/${encodeURIComponent(row.id)}/kegiatan`}>
                                                                        <CalendarIcon className="h-4 w-4" />
                                                                    </Link>
                                                                </Button>
                                                            </TableCell>


                                                        </TableRow>
                                                    );
                                                })
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={8} className="h-24 text-center text-sm text-muted-foreground">
                                                        Belum ada dokumen berjalan.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Pagination */}
                                <div className="mt-4 flex items-center justify-between">
                                    <div className="text-sm text-muted-foreground">
                                        Menampilkan {pageRows.length ? start + 1 : 0}–{Math.min(end, total)} dari {total} entri
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="icon" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={!canPrev}>
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        <Button variant="outline" size="icon" onClick={() => setPage((p) => (canNext ? p + 1 : p))} disabled={!canNext}>
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </ContentLayout>
    );
}

/* ============== Small UI piece (dipakai untuk dashboard) ============== */
function StatCard({
    title,
    value,
    subtitle,
    icon,
}: {
    title: string;
    value: number | string;
    subtitle?: string;
    icon?: React.ReactNode;
}) {
    return (
        <Card className="shadow-sm">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-semibold">{value}</div>
                {subtitle ? <p className="text-xs text-muted-foreground">{subtitle}</p> : null}
            </CardContent>
        </Card>
    );
}
