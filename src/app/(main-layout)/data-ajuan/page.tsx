'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ContentLayout } from '@/components/admin-panel/content-layout';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

import {
    Calendar as CalendarIcon,
    Search,
    CheckCircle2,
    AlertTriangle,
    XCircle,
    FileSignature,
    ChevronLeft,
    ChevronRight,
    ExternalLink,
    Eye,
    FileDown,
} from 'lucide-react';
import { getAuth } from '@/lib/proto/auth';
import Link from 'next/link';

// ================= Roles =================
type Role = 'LEMBAGA_KERJA_SAMA' | 'FAKULTAS' | 'PRODI' | 'ORANG_LUAR' | 'WR';

// ================= Types =================
type MOUStatus = 'Draft' | 'Active' | 'Expiring' | 'Expired' | 'Terminated';
type MOULevel = 'MOU' | 'MOA' | 'IA';
type PartnerType = 'Universitas' | 'Industri' | 'Pemerintah' | 'Organisasi';

type PartnerInfo = {
    phone?: string;
    email?: string;
};

// ===== Tambahan: metadata file upload (Blob URL + nama file) =====
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
    approvalStatus?: string;
    statusNote?: string;
    fileUrl?: string;
    notes?: string;
};

// ============== Helpers ==============
const fmtDate = (iso: string) =>
    new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(iso));

const daysBetween = (startISO: string, endISO: string) => {
    const ms = new Date(endISO).getTime() - new Date(startISO).getTime();
    return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
};

const StatusPill = ({ status }: { status: MOUStatus }) => {
    const style =
        status === 'Draft'
            ? 'bg-slate-100 text-slate-700'
            : status === 'Active'
                ? 'bg-emerald-100 text-emerald-700'
                : status === 'Expiring'
                    ? 'bg-amber-100 text-amber-700'
                    : status === 'Expired'
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-gray-200 text-gray-700';
    const Icon =
        status === 'Draft'
            ? FileSignature
            : status === 'Active'
                ? CheckCircle2
                : status === 'Expiring'
                    ? AlertTriangle
                    : XCircle;

    return (
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${style}`}>
            <Icon className="h-3.5 w-3.5" />
            {status}
        </span>
    );
};

const DateBadge = ({ date }: { date: string }) => (
    <Badge variant="secondary" className="font-normal">
        <CalendarIcon className="mr-1 h-3.5 w-3.5" />
        {fmtDate(date)}
    </Badge>
);

// ============== Dummy data awal ==============
const initialData: MOU[] = [
    {
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
            draftAjuanFile: {
                name: 'draf-ajuan-contoh.pdf',
                url: '/dokumen/draf-ajuan-contoh.pdf',
            },
        },
        processStatus: 'Pengajuan Unit Ke LKI',
        approvalStatus: 'Menunggu Persetujuan',
        statusNote: '',
    },
];

// ============== Page ==============
export default function MOUPage() {
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [rows, setRows] = useState<MOU[]>([]);

    // ===== Role handling (prototype) =====
    const [role, setRole] = useState<Role | null>(null);

    useEffect(() => {
        const u = getAuth();
        setRole(u?.role ?? null);

        const onStorage = (e: StorageEvent) => {
            if (e.key === 'proto_auth') {
                const next = getAuth();
                setRole(next?.role ?? null);
            }
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, [router]);

    const canCreate = role !== 'WR';

    // filters
    const [q, setQ] = useState('');
    const [status, setStatus] = useState<MOUStatus | 'all'>('all');
    const [level, setLevel] = useState<MOULevel | 'all'>('all');

    // pagination (client-side)
    const [page, setPage] = useState(1);
    const limit = 10;

    useEffect(() => {
        const t = setTimeout(() => {
            setRows(initialData);
            setLoading(false);
        }, 250);
        return () => clearTimeout(t);
    }, []);

    const filtered = useMemo(() => {
        const txt = q.trim().toLowerCase();
        return rows.filter((d) => {
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
    }, [rows, q, status, level]);

    const total = filtered.length;
    const start = (page - 1) * limit;
    const end = start + limit;
    const pageRows = filtered.slice(start, end);
    const canPrev = page > 1;
    const canNext = end < total;

    // ringkasan
    const stats = useMemo(() => {
        const active = rows.filter((d) => d.status === 'Active').length;
        const expiring = rows.filter((d) => d.status === 'Expiring').length;
        const expired = rows.filter((d) => d.status === 'Expired').length;
        return { total: rows.length, active, expiring, expired };
    }, [rows]);

    // handler tambah dari sheet (masih ada kalau role boleh create)
    const handleCreate = (m: Omit<MOU, 'id'>) => {
        const nextId = `${m.level}-${String(rows.length + 1).padStart(3, '0')}`;
        setRows((prev) => [{ id: nextId, ...m }, ...prev]);
        setPage(1);
    };

    return (
        <ContentLayout title="Data Ajuan Kerjasama (MOU/MOA/IA)">
            <div className="mt-2">
                <Badge variant="secondary">Role: {role ? role.replaceAll('_', ' ') : '—'}</Badge>
            </div>

            <div className="mt-6 space-y-6">
                {/* Info Bar */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard title="Total" value={stats.total} subtitle="Semua status" icon={<FileSignature className="h-5 w-5" />} />
                    <StatCard title="Active" value={stats.active} subtitle="Sedang berjalan" icon={<CheckCircle2 className="h-5 w-5" />} />
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
                                    placeholder="Cari judul/mitra/no dokumen…"
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

                        <div className="flex items-center gap-2">
                            <Button variant="outline">Filter Lanjutan</Button>

                            {canCreate ? (
                                <NewMOUButton onCreate={handleCreate} />
                            ) : (
                                <TooltipProvider delayDuration={150}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span>
                                                <Button className="gap-2" disabled>
                                                    <FileSignature className="h-4 w-4" />
                                                    Tambah
                                                </Button>
                                            </span>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>WR tidak dapat membuat data baru</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Tabel */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Daftar Ajuan</CardTitle>
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
                                                    return (
                                                        <TableRow key={row.id} className="align-top">
                                                            <TableCell>{start + idx + 1}</TableCell>
                                                            <TableCell>
                                                                <a
                                                                    className="font-medium text-blue-600 hover:underline"
                                                                    href={row.fileUrl || '#'}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                >
                                                                    {row.title}
                                                                </a>
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
                                                                            <a
                                                                                className="text-blue-600 hover:underline"
                                                                                href={`mailto:${row.partnerInfo.email}`}
                                                                            >
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
                                                                        Status Persetujuan :{' '}
                                                                        <span className="font-medium text-rose-600">
                                                                            {row.approvalStatus || '-'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-sm">{row.statusNote || '-'}</TableCell>

                                                            <TableCell className="text-right">
                                                                <Button asChild variant="outline" size="icon" className="h-8 w-8">
                                                                    <Link href={`/data-ajuan/${encodeURIComponent(row.id)}`} aria-label="Lihat detail">
                                                                        <Eye className="h-4 w-4" />
                                                                    </Link>
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={11} className="h-24 text-center text-sm text-muted-foreground">
                                                        Tidak ada data yang sesuai.
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

/** ====== Komponen kecil untuk 1 jenis dokumen (judul + aksi) ====== */
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

// ============== Create Sheet (UI-only) — HANYA FIELD YANG ADA DI TABEL ==============
function NewMOUButton({ onCreate }: { onCreate: (m: Omit<MOU, 'id'>) => void }) {
    const [open, setOpen] = useState(false);

    const [level, setLevel] = useState<MOULevel | undefined>();
    const [documentNumber, setDocumentNumber] = useState('');
    const [title, setTitle] = useState('');
    const [entryDate, setEntryDate] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [faculty, setFaculty] = useState('');
    const [scopeStr, setScopeStr] = useState('Domestik,Kabupaten');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [suratPermohonanUrl, setSuratPermohonanUrl] = useState('');
    const [proposalUrl, setProposalUrl] = useState('');
    const [draftAjuanUrl, setDraftAjuanUrl] = useState('');
    const [processStatus, setProcessStatus] = useState('Pengajuan Unit Ke LKI');
    const [approvalStatus, setApprovalStatus] = useState('Menunggu Persetujuan');
    const [statusNote, setStatusNote] = useState('');
    const [fileUrl, setFileUrl] = useState('');

    const canSave = level && title.trim() && entryDate && faculty.trim() && startDate && endDate;

    const handleSave = () => {
        if (!canSave) return;

        const payload: Omit<MOU, 'id'> = {
            level: level!,
            documentNumber: documentNumber.trim() || '—',
            title: title.trim(),
            entryDate,
            partner: '—',
            partnerType: 'Universitas',
            partnerInfo: {
                phone: phone.trim() || undefined,
                email: email.trim() || undefined,
            },
            country: 'Indonesia',
            faculty: faculty.trim(),
            unit: faculty.trim(),
            scope: scopeStr.split(',').map((s) => s.trim()).filter(Boolean),
            category: 'Cooperation',
            department: '-',
            owner: '-',
            startDate,
            endDate,
            status: 'Active',
            documents: {
                suratPermohonanUrl: suratPermohonanUrl.trim() || null,
                proposalUrl: proposalUrl.trim() || null,
                draftAjuanUrl: draftAjuanUrl.trim() || null,
            },
            processStatus: processStatus.trim() || undefined,
            approvalStatus: approvalStatus.trim() || undefined,
            statusNote: statusNote.trim() || undefined,
            fileUrl: fileUrl.trim() || undefined,

            value: undefined,
            signDate: undefined,
            studyProgram: undefined,
            notes: undefined,
        };

        onCreate(payload);
        setOpen(false);
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button className="gap-2">
                    <FileSignature className="h-4 w-4" />
                    Tambah
                </Button>
            </SheetTrigger>

            <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Tambah Ajuan Kerjasama</SheetTitle>
                </SheetHeader>

                <div className="mt-6 grid gap-4">
                    {/* Jenis + Nomor */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Jenis Kerjasama</label>
                            <Select value={level} onValueChange={(v) => setLevel(v as MOULevel)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="MOU">MOU</SelectItem>
                                    <SelectItem value="MOA">MOA</SelectItem>
                                    <SelectItem value="IA">IA</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2 sm:col-span-2">
                            <label className="text-sm font-medium">No. Dokumen</label>
                            <Input placeholder="mis. 001/MOA/FT/2025" value={documentNumber} onChange={(e) => setDocumentNumber(e.target.value)} />
                        </div>
                    </div>

                    {/* Tentang */}
                    <div className="grid gap-2">
                        <label className="text-sm font-medium">Tentang</label>
                        <Input placeholder="Judul/Perihal Kerjasama" value={title} onChange={(e) => setTitle(e.target.value)} />
                    </div>

                    {/* Tanggal Entry + Masa Berlaku */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Tanggal Entry</label>
                            <Input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Mulai</label>
                            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Selesai</label>
                            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                        </div>
                    </div>

                    {/* Info Partner */}
                    <div className="grid gap-2">
                        <label className="text-sm font-medium">Info Partner</label>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <Input placeholder="Telepon/HP Pengaju" value={phone} onChange={(e) => setPhone(e.target.value)} />
                            <Input placeholder="Email Pengaju" value={email} onChange={(e) => setEmail(e.target.value)} />
                        </div>
                    </div>

                    {/* Unit + Lingkup */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Unit</label>
                            <Input placeholder="mis. KEDOKTERAN" value={faculty} onChange={(e) => setFaculty(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Lingkup (pisahkan koma)</label>
                            <Input placeholder="Domestik,Kabupaten" value={scopeStr} onChange={(e) => setScopeStr(e.target.value)} />
                        </div>
                    </div>

                    {/* Status Proses + Catatan */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Status Proses</label>
                            <Input value={processStatus} onChange={(e) => setProcessStatus(e.target.value)} />
                            <div className="text-xs text-muted-foreground">Contoh: Pengajuan Unit Ke LKI</div>
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Status Persetujuan</label>
                            <Input value={approvalStatus} onChange={(e) => setApprovalStatus(e.target.value)} />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <label className="text-sm font-medium">Catatan Status</label>
                        <Textarea rows={2} value={statusNote} onChange={(e) => setStatusNote(e.target.value)} />
                    </div>

                    {/* Opsional: link pada judul */}
                    <div className="grid gap-2">
                        <label className="text-sm font-medium">Lampiran Umum (URL) — untuk link pada kolom “Tentang”</label>
                        <Input placeholder="https://.../dokumen.pdf" value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} />
                    </div>
                </div>

                <SheetFooter className="mt-6">
                    <Button onClick={handleSave} disabled={!canSave}>
                        Simpan (UI-only)
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}

// ============== Small UI piece ==============
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
