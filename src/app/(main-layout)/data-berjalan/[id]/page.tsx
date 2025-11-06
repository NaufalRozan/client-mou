'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

import { ContentLayout } from '@/components/admin-panel/content-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    ArrowLeft,
    Calendar as CalendarIcon,
    ExternalLink,
    FileDown,
    Link2,
    Save,
    Info,
} from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetFooter,
    SheetTrigger,
} from '@/components/ui/sheet';

import {
    Tooltip,
    TooltipProvider,
    TooltipTrigger,
    TooltipContent,
} from '@/components/ui/tooltip';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

/* ==== Types (samakan dengan list) ==== */
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

    // ⬇️ tambahan untuk dokumen akhir
    finalUrl?: string | null;
    finalFile?: DocFile;
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
    approvalStatus?: string; // Disetujui untuk data berjalan
    statusNote?: string;
    fileUrl?: string;
    notes?: string;
    relatedIds?: string[];
};

/* ==== Helpers ==== */
const fmtDate = (iso: string) =>
    new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(iso));
const daysBetween = (a: string, b: string) =>
    Math.max(0, Math.round((+new Date(b) - +new Date(a)) / 86400000));

/* ==== Mock source: di real app, ganti ke fetch API/shared store ==== */
const MOCK_ROWS: MOU[] = [
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
            // contoh: punya dokumen final
            finalUrl: '/dokumen/mou-001-final.pdf',
            finalFile: { name: 'MOU-001-FINAL.pdf', url: '/dokumen/mou-001-final.pdf' },

            suratPermohonanUrl: '/dokumen/mou-001-surat.pdf',
            proposalUrl: '/dokumen/mou-001-proposal.pdf',
            draftAjuanUrl: null,
        },
        processStatus: 'Ditandatangani',
        approvalStatus: 'Disetujui',
        statusNote: '',
        relatedIds: ['MOA-001'],
    },
    {
        id: 'MOA-001',
        level: 'MOA',
        documentNumber: '—',
        title: 'PENYELENGGARAAN TRI DHARMA PERGURUAN TINGGI FAKULTAS KEDOKTERAN DAN ILMU KESEHATAN',
        entryDate: '2025-08-29',
        partner: '—',
        partnerType: 'Universitas',
        partnerInfo: { phone: '+62 819-0428-0196', email: 'kerjasamafkikumy@gmail.com' },
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
        approvalStatus: 'Menunggu Persetujuan', // tidak akan dipakai di data-berjalan
        statusNote: '',
        relatedIds: ['MOU-001'],
    },
];

async function fetchApprovedById(id: string): Promise<MOU | null> {
    const found = MOCK_ROWS.find(
        (d) => d.id === id && (d.approvalStatus || '').toLowerCase() === 'disetujui'
    );
    return found || null;
}

/* ==== Page ==== */
export default function DataBerjalanDetailPage() {
    const { id } = useParams<{ id: string }>();
    const [loading, setLoading] = useState(true);
    const [row, setRow] = useState<MOU | null>(null);

    useEffect(() => {
        (async () => {
            setLoading(true);
            const data = await fetchApprovedById(decodeURIComponent(id));
            setRow(data);
            setLoading(false);
        })();
    }, [id]);

    const masaHari = useMemo(
        () => (row ? daysBetween(row.startDate, row.endDate) : 0),
        [row?.startDate, row?.endDate]
    );

    const relatedDocs = useMemo(() => {
        if (!row?.relatedIds?.length) return [];
        return MOCK_ROWS.filter((d) => row.relatedIds?.includes(d.id));
    }, [row?.relatedIds]);

    if (loading) {
        return (
            <ContentLayout title="Detail Dokumen Berjalan">
                <p className="text-muted-foreground">Memuat…</p>
            </ContentLayout>
        );
    }
    if (!row) {
        return (
            <ContentLayout title="Detail Dokumen Berjalan">
                <p className="text-rose-600">Data tidak ditemukan atau belum disetujui.</p>
            </ContentLayout>
        );
    }

    return (
        <ContentLayout title="Detail Dokumen Berjalan">
            <div className="mb-4">
                <Button asChild variant="outline" size="sm">
                    <Link href="/data-berjalan">
                        <ArrowLeft className="mr-1 h-4 w-4" /> Kembali
                    </Link>
                </Button>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Informasi Utama (read-only) */}
                <Card className="lg:col-span-2">
                    <CardHeader className="flex flex-col gap-2">
                        <CardTitle className="text-base">Informasi Utama</CardTitle>
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="secondary">{row.level}</Badge>
                            <Badge variant="secondary">{row.status}</Badge>
                            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                                Disetujui
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <InfoGrid label="Judul/Tentang" value={row.title} />
                        <InfoGrid label="No. Dokumen" value={row.documentNumber || '—'} />
                        <InfoGrid label="Tanggal Entry" value={fmtDate(row.entryDate)} />
                        <InfoGrid
                            label="Unit"
                            value={(row.faculty || row.unit || '').toUpperCase() || '—'}
                        />
                        <div className="grid gap-4 sm:grid-cols-3">
                            <MiniStat label="Mulai" value={fmtDate(row.startDate)} />
                            <MiniStat label="Berakhir" value={fmtDate(row.endDate)} />
                            <MiniStat label="Masa Berlaku" value={`${masaHari} Hari`} />
                        </div>
                        <InfoGrid label="Status Proses" value={row.processStatus || '-'} />
                        <InfoGrid label="Catatan Status" value={row.statusNote || '-'} />
                        <InfoGrid
                            label="Kontak Pengaju"
                            value={
                                <>
                                    {row.partnerInfo?.phone ? <div>Telepon: {row.partnerInfo.phone}</div> : null}
                                    {row.partnerInfo?.email ? (
                                        <div>
                                            Email:{' '}
                                            <a
                                                className="text-blue-600 hover:underline"
                                                href={`mailto:${row.partnerInfo.email}`}
                                            >
                                                {row.partnerInfo.email}
                                            </a>
                                        </div>
                                    ) : null}
                                    {!row.partnerInfo?.phone && !row.partnerInfo?.email ? '—' : null}
                                </>
                            }
                        />
                        {row.scope?.length ? (
                            <InfoGrid
                                label="Lingkup"
                                value={
                                    <ul className="list-disc pl-4">
                                        {row.scope.map((s) => (
                                            <li key={s}>*{s}</li>
                                        ))}
                                    </ul>
                                }
                            />
                        ) : null}
                    </CardContent>
                </Card>

                {/* Dokumen (read-only) */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Dokumen</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* ⬇️ Dokumen Final */}
                        <DocFinalRowView
                            title="Dokumen Final"
                            file={row.documents?.finalFile || null}
                            url={row.documents?.finalUrl || null}
                            emptyClass="text-rose-600"
                            infoTitle="Dokumen Final"
                            infoDescription="Versi akhir yang telah ditandatangani/di-ACC sebagai arsip resmi."
                            infoChecklist={[
                                'Sudah ditandatangani para pihak',
                                'Nomor dokumen sudah terbit (jika ada)',
                                'Format PDF/A atau PDF standar',
                            ]}
                        />

                        <DocRowView
                            title="Surat Permohonan"
                            file={row.documents?.suratPermohonanFile || null}
                            url={row.documents?.suratPermohonanUrl || null}
                        />
                        <DocRowView
                            title="Proposal"
                            file={row.documents?.proposalFile || null}
                            url={row.documents?.proposalUrl || null}
                            emptyClass="text-rose-600"
                        />
                        <DocRowView
                            title="Draf Ajuan"
                            file={row.documents?.draftAjuanFile || null}
                            url={row.documents?.draftAjuanUrl || null}
                        />
                    </CardContent>
                </Card>

                {/* Dokumen Terkait + Ubah Kaitan */}
                <Card className="lg:col-span-3">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-base">Dokumen Terkait</CardTitle>

                        {/* === Tombol Ubah Kaitan (Sheet) === */}
                        <EditRelatedSheet
                            current={row}
                            allRows={MOCK_ROWS}
                            onSave={(nextRelatedIds) => {
                                // UI-only: update state. Nanti ganti dengan PUT/PATCH API
                                setRow((prev) => (prev ? { ...prev, relatedIds: nextRelatedIds } : prev));
                                console.log('Simpan relatedIds:', nextRelatedIds);
                            }}
                        />
                    </CardHeader>

                    <CardContent>
                        {relatedDocs.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Belum ada dokumen terkait.</p>
                        ) : (
                            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {relatedDocs.map((d) => (
                                    <li key={d.id} className="rounded-md border p-3">
                                        <div className="font-medium line-clamp-2">{d.title}</div>
                                        <div className="text-sm text-muted-foreground mt-1">
                                            {d.level} — {d.id}
                                        </div>
                                        <div className="mt-2">
                                            <Button asChild size="sm" variant="outline">
                                                <Link href={`/data-berjalan/${d.id}`}>Lihat</Link>
                                            </Button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>
            </div>
        </ContentLayout>
    );
}

/* ==== Kecil-kecil UI ==== */

function InfoGrid({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="grid sm:grid-cols-[160px,1fr] gap-2">
            <div className="text-sm text-muted-foreground">{label}</div>
            <div className="text-sm">{value}</div>
        </div>
    );
}

function MiniStat({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-md border p-3 text-sm flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            <div>
                <div className="text-muted-foreground">{label}</div>
                <div className="font-medium">{value}</div>
            </div>
        </div>
    );
}

function DocRowView({
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
            <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-medium">{title}</h4>
            </div>

            <div className="space-y-1">
                {file ? (
                    <a
                        className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                        href={file.url}
                        download={file.name || 'dokumen.pdf'}
                    >
                        <FileDown className="h-3.5 w-3.5" />
                        Download file
                    </a>
                ) : null}

                {url ? (
                    <div>
                        <a
                            className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            title={url}
                        >
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

/* ==== Komponen: Dokumen Final (info tooltip + dialog) ==== */
function DocFinalRowView({
    title,
    file,
    url,
    emptyClass = 'text-rose-600',
    infoTitle = 'Dokumen Final',
    infoDescription = 'Unggah/arsipkan versi akhir yang telah disetujui WR. File/tautan ini akan menjadi rujukan resmi.',
    infoChecklist = ['Sudah ditandatangani para pihak', 'Nomor dokumen sudah terbit (jika ada)', 'Format PDF/A atau PDF standar'],
}: {
    title: string;
    file: DocFile;
    url: string | null;
    emptyClass?: string;
    infoTitle?: string;
    infoDescription?: string;
    infoChecklist?: string[];
}) {
    const statusNow = [file ? `File: ${file.name}` : 'File: —', url ? `Link: ${url}` : 'Link: —'];

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium">{title}</h4>

                    {/* Tooltip + Dialog info */}
                    <TooltipProvider delayDuration={150}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <button
                                            type="button"
                                            className="inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
                                            aria-label="Info dokumen final"
                                        >
                                            <Info className="h-3.5 w-3.5" />
                                        </button>
                                    </DialogTrigger>

                                    <DialogContent className="sm:max-w-md">
                                        <DialogHeader>
                                            <DialogTitle className="text-base">{infoTitle}</DialogTitle>
                                            <DialogDescription className="text-xs">
                                                {infoDescription}
                                            </DialogDescription>
                                        </DialogHeader>

                                        <div className="space-y-3">
                                            <div>
                                                <div className="text-xs font-medium mb-1">Checklist</div>
                                                <ul className="list-disc pl-4 text-sm space-y-1">
                                                    {infoChecklist.map((it, i) => (
                                                        <li key={i}>{it}</li>
                                                    ))}
                                                </ul>
                                            </div>

                                            <div className="rounded-md border bg-muted/30 p-2">
                                                <div className="text-xs font-medium mb-1">Status Saat Ini</div>
                                                <ul className="text-sm space-y-0.5 break-all">
                                                    {statusNow.map((s, i) => (
                                                        <li key={i}>• {s}</li>
                                                    ))}
                                                </ul>
                                            </div>

                                            {(file || url) && (
                                                <div className="flex items-center gap-2">
                                                    {file && (
                                                        <Button asChild size="sm" variant="secondary">
                                                            <a href={file.url} download={file.name || 'dokumen-final.pdf'}>
                                                                Unduh File
                                                            </a>
                                                        </Button>
                                                    )}
                                                    {url && (
                                                        <Button asChild size="sm" variant="outline">
                                                            <a href={url} target="_blank" rel="noreferrer">
                                                                Buka Link
                                                            </a>
                                                        </Button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs text-xs">
                                {infoDescription}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>

            {/* Link/Download sama seperti DocRowView */}
            <div className="space-y-1">
                {file ? (
                    <a
                        className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                        href={file.url}
                        download={file.name || 'dokumen.pdf'}
                    >
                        <FileDown className="h-3.5 w-3.5" />
                        Download file
                    </a>
                ) : null}

                {url ? (
                    <div>
                        <a
                            className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            title={url}
                        >
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

/* ==== Komponen: EditRelatedSheet (Sheet untuk ubah relatedIds) ==== */

function EditRelatedSheet({
    current,
    allRows,
    onSave,
}: {
    current: MOU;
    allRows: MOU[];
    onSave: (nextRelatedIds: string[]) => void;
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [tempSelected, setTempSelected] = useState<string[]>(current.relatedIds || []);

    // keep in sync saat dokumen berubah
    useEffect(() => {
        setTempSelected(current.relatedIds || []);
    }, [current.id]); // eslint-disable-line react-hooks/exhaustive-deps

    const candidates = useMemo(() => {
        const t = query.trim().toLowerCase();
        return allRows
            .filter((r) => r.id !== current.id) // selain dirinya
            .filter((r) => {
                if (!t) return true;
                return [r.id, r.title, r.level, r.documentNumber].join(' ').toLowerCase().includes(t);
            });
    }, [allRows, current.id, query]);

    const toggle = (id: string) => {
        setTempSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    };

    const handleSave = () => {
        onSave(tempSelected);
        setOpen(false);
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button size="sm" className="gap-2">
                    <Link2 className="h-4 w-4" />
                    Ubah Kaitan
                </Button>
            </SheetTrigger>

            <SheetContent className="w-full sm:max-w-xl">
                <SheetHeader>
                    <SheetTitle>Ubah Kaitan Dokumen</SheetTitle>
                </SheetHeader>

                <div className="mt-4 space-y-3">
                    <Input
                        placeholder="Cari ID/Judul/Jenis…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />

                    <div className="rounded-md border max-h-80 overflow-y-auto divide-y">
                        {candidates.length === 0 ? (
                            <div className="p-3 text-xs text-muted-foreground">Tidak ada kandidat.</div>
                        ) : (
                            candidates.map((item) => {
                                const checked = tempSelected.includes(item.id);
                                return (
                                    <label
                                        key={item.id}
                                        className="grid grid-cols-[auto,1fr] items-start gap-3 p-2 cursor-pointer hover:bg-muted/50"
                                    >
                                        <Checkbox
                                            checked={checked}
                                            onCheckedChange={() => toggle(item.id)}
                                            className="mt-0.5 h-4 w-4"
                                            aria-label={`Pilih ${item.id}`}
                                        />
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Badge variant="secondary" className="shrink-0">
                                                    {item.level}
                                                </Badge>
                                                <span className="font-medium shrink-0">{item.id}</span>
                                                <span className="text-muted-foreground truncate sm:whitespace-normal sm:truncate-0">
                                                    — {item.title}
                                                </span>
                                            </div>
                                            <div className="mt-0.5 text-[11px] text-muted-foreground">
                                                {item.documentNumber || 'Tanpa nomor dokumen'}
                                            </div>
                                        </div>
                                    </label>
                                );
                            })
                        )}
                    </div>

                    {tempSelected.length > 0 && (
                        <div className="pt-1">
                            <div className="text-xs mb-1 text-muted-foreground">Terpilih:</div>
                            <div className="flex flex-wrap gap-1">
                                {tempSelected.map((id) => {
                                    const r = allRows.find((x) => x.id === id);
                                    if (!r) return null;
                                    return (
                                        <Badge key={id} variant="outline" className="text-xs">
                                            {r.level}-{id.split('-')[1] ?? id}
                                        </Badge>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                <SheetFooter className="mt-6">
                    <Button onClick={handleSave}>
                        <Save className="h-4 w-4 mr-2" />
                        Simpan
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
