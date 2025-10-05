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
    ExternalLink,
    Eye,
    FileDown,
    FileSignature,
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

/* ============== Page (Approved Only, UI mengikuti Data Ajuan) ============== */
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

    // filter lanjutan di atas approvedRows (sama seperti Data Ajuan)
    const filtered = useMemo(() => {
        const txt = q.trim().toLowerCase();
        return approvedRows.filter((d) => {
            const matchQ =
                txt === '' ||
                [
                    d.title,
                    d.partner,
                    d.documentNumber,
                    d.faculty,
                    d.studyProgram,
                    d.unit,
                    d.processStatus,
                    d.approvalStatus,
                ]
                    .filter(Boolean)
                    .join(' ')
                    .toLowerCase()
                    .includes(txt);

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
                {/* Info Bar (hitung dari approved saja) */}
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
                                    placeholder="Cari judul/no dokumen…"
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

                        <Button asChild variant="outline">
                            <Link href="/data-ajuan">Ke Data Ajuan (Pending)</Link>
                        </Button>
                    </CardContent>
                </Card>

                {/* Tabel (approved only) */}
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
                                    <Table className="min-w-[1200px]">
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[50px]">No</TableHead>
                                                <TableHead>Tentang</TableHead>
                                                <TableHead>Jenis Kerjasama</TableHead>
                                                <TableHead>Tanggal Entry</TableHead>
                                                <TableHead>Info Partner</TableHead>
                                                <TableHead>Unit</TableHead>
                                                <TableHead>Lingkup</TableHead>
                                                <TableHead>Masa Berlaku</TableHead>
                                                <TableHead>Dokumen</TableHead>
                                                <TableHead>Status Proses</TableHead>
                                                <TableHead>Catatan Status</TableHead>
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
                                                            <TableCell>
                                                                <div className="space-y-1">
                                                                    <a
                                                                        className="font-medium text-blue-600 hover:underline"
                                                                        href={row.fileUrl || '#'}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                    >
                                                                        {row.title}
                                                                    </a>

                                                                    {related.length > 0 && (
                                                                        <div className="flex flex-wrap gap-1 pt-1">
                                                                            {related.map((r) => (
                                                                                <Badge key={r.id} variant="outline" className="text-xs">
                                                                                    <Link href={`/data-berjalan/${encodeURIComponent(r.id)}`} className="hover:underline">
                                                                                        Terkait: {r.level}-{r.id.split('-')[1] ?? r.id}
                                                                                    </Link>
                                                                                </Badge>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </TableCell>

                                                            <TableCell>
                                                                <div className="space-y-1">
                                                                    <div className="font-medium">{row.level}</div>
                                                                    <div className="text-xs text-muted-foreground">
                                                                        {row.documentNumber || 'Belum Masuk ' + row.level}
                                                                    </div>
                                                                </div>
                                                            </TableCell>

                                                            <TableCell>{fmtDate(row.entryDate)}</TableCell>

                                                            <TableCell>
                                                                <div className="text-sm">
                                                                    {row.partnerInfo?.phone ? (
                                                                        <>
                                                                            Telepon / HP Pengaju:<br />
                                                                            {row.partnerInfo.phone}
                                                                            <br />
                                                                        </>
                                                                    ) : null}
                                                                    {row.partnerInfo?.email ? (
                                                                        <>
                                                                            Email Pengaju:
                                                                            <br />
                                                                            <a className="text-blue-600 hover:underline" href={`mailto:${row.partnerInfo.email}`}>
                                                                                {row.partnerInfo.email}
                                                                            </a>
                                                                        </>
                                                                    ) : null}
                                                                </div>
                                                            </TableCell>

                                                            <TableCell className="uppercase">{row.faculty || row.unit}</TableCell>

                                                            <TableCell>
                                                                <ul className="text-sm list-disc pl-4">
                                                                    {row.scope.map((s) => (
                                                                        <li key={s}>*{s}</li>
                                                                    ))}
                                                                </ul>
                                                            </TableCell>

                                                            <TableCell>
                                                                <div className="text-sm space-y-1">
                                                                    <div>
                                                                        Tanggal Mulai
                                                                        <br />
                                                                        <DateBadge date={row.startDate} />
                                                                    </div>
                                                                    <div>
                                                                        Tanggal Berakhir
                                                                        <br />
                                                                        <DateBadge date={row.endDate} />
                                                                    </div>
                                                                    <div className="pt-1">
                                                                        Masa Berlaku : {masaHari.toString().padStart(2, '0')} Hari
                                                                    </div>
                                                                </div>
                                                            </TableCell>

                                                            <TableCell>
                                                                <div className="text-sm space-y-4">
                                                                    <DocRow
                                                                        title="Dokumen Surat Permohonan"
                                                                        file={row.documents?.suratPermohonanFile || null}
                                                                        url={row.documents?.suratPermohonanUrl || null}
                                                                    />
                                                                    <DocRow
                                                                        title="Dokumen Proposal"
                                                                        file={row.documents?.proposalFile || null}
                                                                        url={row.documents?.proposalUrl || null}
                                                                        emptyClass="text-rose-600"
                                                                    />
                                                                    <DocRow
                                                                        title="Dokumen Draf Ajuan"
                                                                        file={row.documents?.draftAjuanFile || null}
                                                                        url={row.documents?.draftAjuanUrl || null}
                                                                    />
                                                                </div>
                                                            </TableCell>

                                                            <TableCell>
                                                                <div className="space-y-1">
                                                                    <div>{row.processStatus || '-'}</div>
                                                                    <div className="text-sm">
                                                                        Status Persetujuan:{' '}
                                                                        <span className="font-medium text-emerald-700">Disetujui</span>
                                                                    </div>
                                                                </div>
                                                            </TableCell>

                                                            <TableCell className="text-sm">{row.statusNote || '-'}</TableCell>

                                                            <TableCell className="text-right">
                                                                <Button asChild variant="outline" size="icon" className="h-8 w-8">
                                                                    <Link href={`/data-berjalan/${encodeURIComponent(row.id)}`} aria-label="Lihat detail">
                                                                        <Eye className="h-4 w-4" />
                                                                    </Link>
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={12} className="h-24 text-center text-sm text-muted-foreground">
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

/* ====== Komponen kecil untuk 1 jenis dokumen (judul + aksi) ====== */
function DocRow({
    title,
    file,
    url,
    emptyClass = 'text-muted-foreground',
}: {
    title: string;
    file: DocFile;
    url: string | null;
    emptyClass?: string;
}) {
    return (
        <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h4 className="text-sm font-medium">{title}</h4>
            </div>

            <div className="space-y-1">
                {file ? (
                    <a className="inline-flex items-center gap-1 text-blue-600 hover:underline" href={file.url} download={file.name || 'dokumen.pdf'}>
                        <FileDown className="h-3.5 w-3.5" />
                        Download file
                    </a>
                ) : null}

                {url ? (
                    <div>
                        <a className="inline-flex items-center gap-1 text-blue-600 hover:underline" href={url} target="_blank" rel="noreferrer" title={url}>
                            <ExternalLink className="h-3.5 w-3.5" />
                            Lihat file
                        </a>
                    </div>
                ) : null}

                {!file && !url ? <span className={emptyClass}>Tidak Ada</span> : null}
            </div>
        </div>
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
