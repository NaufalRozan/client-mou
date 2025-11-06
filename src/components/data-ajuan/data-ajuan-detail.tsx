'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Save,
    Pencil,
    FileDown,
    ExternalLink,
    FilePlus2,
    Send,
    Paperclip,
    MessageSquare,
    CheckCircle2,
    AlertTriangle,
    Link2,
    Trash2,
    History,
    Search,
    Info,
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';

/* =================== Types (selaras dengan list) =================== */
export type MOUStatus = 'Draft' | 'Active' | 'Expiring' | 'Expired' | 'Terminated';
export type MOULevel = 'MOU' | 'MOA' | 'IA';
export type PartnerType = 'Universitas' | 'Industri' | 'Pemerintah' | 'Organisasi';

export type PartnerInfo = {
    phone?: string;
    email?: string;
};

export type DocFile = { name: string; url: string } | null;

export type Documents = {
    suratPermohonanUrl?: string | null;
    proposalUrl?: string | null;
    draftAjuanUrl?: string | null;

    suratPermohonanFile?: DocFile;
    proposalFile?: DocFile;
    draftAjuanFile?: DocFile;

    finalUrl?: string | null;
    finalFile?: DocFile;
};

export type MOU = {
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

    /** baru: ID dokumen terkait (MOU/MOA/IA lain) */
    relatedIds?: string[];
};

/* =================== Helpers =================== */
const fmtDate = (iso: string) =>
    new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(iso));
const fmtDateTime = (iso: string) =>
    new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(iso));

const daysBetween = (startISO: string, endISO: string) => {
    const ms = new Date(endISO).getTime() - new Date(startISO).getTime();
    return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
};

const labelFromPrefix = (p: DocKey) =>
    p === 'suratPermohonan' ? 'Surat Permohonan'
        : p === 'proposal' ? 'Proposal'
            : p === 'draftAjuan' ? 'Draf Ajuan'
                : 'Dokumen Final';
type DocKey = 'suratPermohonan' | 'proposal' | 'draftAjuan' | 'final';


/* =================== Log Aktivitas Dokumen =================== */
type DocLogKind =
    | 'UPLOAD_FILE'
    | 'REPLACE_FILE'
    | 'REMOVE_FILE'
    | 'SET_LINK'
    | 'UPDATE_LINK'
    | 'REMOVE_LINK';

type DocLog = {
    id: string;
    at: string; // ISO
    actor: string; // nama user
    kind: DocLogKind;
    target: DocKey;
    detail?: string; // mis. nama file atau url
};

const kindLabel = (k: DocLogKind) => {
    switch (k) {
        case 'UPLOAD_FILE': return 'unggah file';
        case 'REPLACE_FILE': return 'ganti file';
        case 'REMOVE_FILE': return 'hapus file';
        case 'SET_LINK': return 'set link';
        case 'UPDATE_LINK': return 'ubah link';
        case 'REMOVE_LINK': return 'hapus link';
    }
};

const kindIcon = (k: DocLogKind) => {
    switch (k) {
        case 'UPLOAD_FILE': return <FilePlus2 className="h-4 w-4" />;
        case 'REPLACE_FILE': return <Pencil className="h-4 w-4" />;
        case 'REMOVE_FILE': return <Trash2 className="h-4 w-4" />;
        case 'SET_LINK':
        case 'UPDATE_LINK': return <ExternalLink className="h-4 w-4" />;
        case 'REMOVE_LINK': return <Trash2 className="h-4 w-4" />;
    }
};

/* =================== Props =================== */
type Props = {
    data: MOU;
    onChange?: (m: MOU) => void;

    /** opsional: daftar semua dokumen untuk dipakai di pemilih relasi */
    allDocs?: MOU[];
    /** opsional: larang relasi ke level yang sama (default true) */
    disallowSameLevel?: boolean;

    /** nama user yg aktif (untuk log). default: "Anda" */
    currentUserName?: string;
};

export function KerjasamaDetail({
    data,
    onChange,
    allDocs,
    disallowSameLevel = true,
    currentUserName = 'Anda',
}: Props) {
    // local form state
    const [form, setForm] = useState<MOU>(data);

    // ===== Prototype: contoh log awal =====
    const [docLogs, setDocLogs] = useState<DocLog[]>([
        {
            id: crypto.randomUUID(),
            at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
            actor: 'Admin LKI',
            kind: 'UPLOAD_FILE',
            target: 'suratPermohonan',
            detail: 'surat-permohonan-FT.pdf',
        },
        {
            id: crypto.randomUUID(),
            at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
            actor: 'WR',
            kind: 'SET_LINK',
            target: 'proposal',
            detail: 'https://example.com/proposal-v1.pdf',
        },
        {
            id: crypto.randomUUID(),
            at: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
            actor: 'Unit Pengaju',
            kind: 'REPLACE_FILE',
            target: 'suratPermohonan',
            detail: 'surat-permohonan-FT-revisi.pdf',
        },
    ]);

    useEffect(() => {
        // sinkron saat data luar berubah (mis. ganti ID di route lain)
        setForm(data);
    }, [data.id]); // eslint-disable-line react-hooks/exhaustive-deps

    const masaHari = useMemo(() => daysBetween(form.startDate, form.endDate), [form.startDate, form.endDate]);

    const setField = <K extends keyof MOU>(key: K, val: MOU[K]) => {
        setForm((prev) => ({ ...prev, [key]: val }));
    };

    // helper untuk push log
    const pushDocLog = (entry: Omit<DocLog, 'id' | 'at' | 'actor'>) => {
        setDocLogs((prev) => [
            {
                id: crypto.randomUUID(),
                at: new Date().toISOString(),
                actor: currentUserName,
                ...entry,
            },
            ...prev,
        ]);
    };

    const setDoc = (
        prefix: DocKey,
        payload: { linkUrl: string | null; file: DocFile }
    ) => {
        const urlKey = (prefix + 'Url') as keyof Documents;
        const fileKey = (prefix + 'File') as keyof Documents;

        setForm((prev) => {
            const beforeUrl = (prev.documents?.[urlKey] ?? null) as string | null;
            const beforeFile = (prev.documents?.[fileKey] ?? null) as DocFile;

            const next: MOU = {
                ...prev,
                documents: {
                    ...(prev.documents || {}),
                    [urlKey]: payload.linkUrl,
                    [fileKey]: payload.file,
                },
            };

            // === LOGIC LOG KHUSUS DOKUMEN ===
            // File:
            if (!beforeFile && payload.file) {
                pushDocLog({ kind: 'UPLOAD_FILE', target: prefix, detail: payload.file.name || 'file' });
            } else if (beforeFile && payload.file && (beforeFile.url !== payload.file.url || beforeFile.name !== payload.file.name)) {
                pushDocLog({ kind: 'REPLACE_FILE', target: prefix, detail: payload.file.name || 'file' });
            } else if (beforeFile && !payload.file) {
                pushDocLog({ kind: 'REMOVE_FILE', target: prefix, detail: beforeFile.name || 'file' });
            }

            // Link:
            if (!beforeUrl && payload.linkUrl) {
                pushDocLog({ kind: 'SET_LINK', target: prefix, detail: payload.linkUrl });
            } else if (beforeUrl && payload.linkUrl && beforeUrl !== payload.linkUrl) {
                pushDocLog({ kind: 'UPDATE_LINK', target: prefix, detail: `${beforeUrl} → ${payload.linkUrl}` });
            } else if (beforeUrl && !payload.linkUrl) {
                pushDocLog({ kind: 'REMOVE_LINK', target: prefix, detail: beforeUrl });
            }

            return next;
        });
    };

    const handleSave = async () => {
        // simpan (UI-only)
        onChange?.(form);
    };

    // ====== Kandidat relasi (jika allDocs disediakan) ======
    const [relQuery, setRelQuery] = useState('');
    const relatedSelected = form.relatedIds || [];

    const relationCandidates = useMemo(() => {
        if (!allDocs) return [];
        const t = relQuery.trim().toLowerCase();
        return allDocs
            .filter((d) => d.id !== form.id)
            .filter((d) => (disallowSameLevel ? d.level !== form.level : true))
            .filter((d) => {
                if (!t) return true;
                return [d.id, d.title, d.level, d.documentNumber].join(' ').toLowerCase().includes(t);
            });
    }, [allDocs, relQuery, form.id, form.level, disallowSameLevel]);

    const toggleRelation = (id: string) => {
        const next = relatedSelected.includes(id)
            ? relatedSelected.filter((x) => x !== id)
            : [...relatedSelected, id];
        setField('relatedIds', next);
    };

    return (
        <div className="grid gap-6 lg:grid-cols-3">
            {/* Kartu Informasi Utama */}
            <Card className="lg:col-span-2">
                <CardHeader className="flex flex-col gap-2">
                    <CardTitle className="text-base">Informasi Utama</CardTitle>
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">{form.level}</Badge>
                        <Badge variant="secondary">{form.status}</Badge>
                    </div>
                </CardHeader>

                <CardContent className="space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                        {/* Judul */}
                        <div className="grid gap-2">
                            <Label>Judul/Tentang</Label>
                            <Input
                                value={form.title}
                                onChange={(e) => setField('title', e.target.value)}
                                placeholder="Judul/Perihal Kerjasama"
                            />
                        </div>

                        {/* No Dok */}
                        <div className="grid gap-2">
                            <Label>No. Dokumen</Label>
                            <Input value={form.documentNumber} onChange={(e) => setField('documentNumber', e.target.value)} placeholder="—" />
                        </div>

                        {/* Entry */}
                        <div className="grid gap-2">
                            <Label>Tanggal Entry</Label>
                            <Input type="date" value={form.entryDate} onChange={(e) => setField('entryDate', e.target.value)} />
                            <p className="text-xs text-muted-foreground">Tampil: {fmtDate(form.entryDate)}</p>
                        </div>

                        {/* Unit */}
                        <div className="grid gap-2">
                            <Label>Unit</Label>
                            <Input
                                value={form.faculty || form.unit || ''}
                                onChange={(e) => {
                                    setField('faculty', e.target.value);
                                    setField('unit', e.target.value);
                                }}
                                placeholder="mis. KEDOKTERAN"
                                className="uppercase"
                            />
                        </div>

                        {/* Mulai */}
                        <div className="grid gap-2">
                            <Label>Mulai</Label>
                            <Input type="date" value={form.startDate} onChange={(e) => setField('startDate', e.target.value)} />
                            <p className="text-xs text-muted-foreground">Tampil: {fmtDate(form.startDate)}</p>
                        </div>

                        {/* Berakhir */}
                        <div className="grid gap-2">
                            <Label>Berakhir</Label>
                            <Input type="date" value={form.endDate} onChange={(e) => setField('endDate', e.target.value)} />
                            <p className="text-xs text-muted-foreground">Tampil: {fmtDate(form.endDate)}</p>
                        </div>
                    </div>

                    {/* Masa & Status */}
                    <div className="grid gap-4 sm:grid-cols-3">
                        <div className="grid gap-1">
                            <span className="text-sm text-muted-foreground">Masa Berlaku</span>
                            <span className="text-sm">{masaHari} Hari</span>
                        </div>
                        <div className="grid gap-2">
                            <Label>Status Proses</Label>
                            <Input
                                value={form.processStatus || ''}
                                onChange={(e) => setField('processStatus', e.target.value)}
                                placeholder="Pengajuan Unit Ke LKI"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Status Persetujuan</Label>
                            <Input
                                value={form.approvalStatus || ''}
                                onChange={(e) => setField('approvalStatus', e.target.value)}
                                placeholder="Menunggu Persetujuan"
                            />
                        </div>
                    </div>

                    {/* Kontak Pengaju */}
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label>Telepon/HP Pengaju</Label>
                            <Input
                                value={form.partnerInfo?.phone || ''}
                                onChange={(e) => setField('partnerInfo', { ...(form.partnerInfo || {}), phone: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Email Pengaju</Label>
                            <Input
                                type="email"
                                value={form.partnerInfo?.email || ''}
                                onChange={(e) => setField('partnerInfo', { ...(form.partnerInfo || {}), email: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* ===== Kaitkan MOU/MOA/IA (opsional) ===== */}
                    {allDocs && (
                        <div className="grid gap-2 border-t pt-4">
                            <div className="flex items-center gap-2">
                                <Link2 className="h-4 w-4" />
                                <Label className="font-semibold">Kaitkan Dokumen (MOU / MOA / IA)</Label>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                <div className="relative w-full sm:max-w-sm">
                                    <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Cari ID/Judul/Jenis…"
                                        value={relQuery}
                                        onChange={(e) => setRelQuery(e.target.value)}
                                        className="pl-8"
                                    />
                                </div>
                                <span className="text-xs text-muted-foreground sm:ml-auto">
                                    {disallowSameLevel ? 'Menampilkan dokumen beda level' : 'Menampilkan semua level'}
                                </span>
                            </div>

                            <div className="rounded-md border">
                                <ul className="max-h-64 overflow-y-auto divide-y">
                                    {relationCandidates.length === 0 ? (
                                        <li className="p-3 text-xs text-muted-foreground">Tidak ada kandidat.</li>
                                    ) : (
                                        relationCandidates.map((item) => {
                                            const checked = relatedSelected.includes(item.id);
                                            return (
                                                <li key={item.id} className="hover:bg-muted/50">
                                                    <label className="grid grid-cols-[auto,1fr] items-start gap-3 p-2 cursor-pointer">
                                                        <Checkbox
                                                            checked={checked}
                                                            onCheckedChange={() => toggleRelation(item.id)}
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
                                                </li>
                                            );
                                        })
                                    )}
                                </ul>
                            </div>

                            {relatedSelected.length > 0 && (
                                <div className="pt-2">
                                    <div className="text-xs mb-1 text-muted-foreground">Terpilih:</div>
                                    <div className="flex flex-wrap gap-1">
                                        {relatedSelected.map((id) => {
                                            const r = allDocs.find((x) => x.id === id);
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
                    )}

                    <div className="pt-2">
                        <Button onClick={handleSave}>
                            <Save className="h-4 w-4 mr-2" />
                            Simpan Perubahan
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Kartu Dokumen */}
            <Card>
                <CardHeader className="flex flex-col">
                    <CardTitle className="text-base">Dokumen</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <DocRow
                        title="Dokumen Final"
                        file={form.documents?.finalFile || null}
                        url={form.documents?.finalUrl || null}
                        onAdd={(payload) => setDoc('final', payload)}
                        emptyClass="text-rose-600"
                        showInfo
                        infoDescription="Unggah versi akhir yang telah ditandatangani/di-ACC sebagai arsip resmi."
                    />
                    <DocRow
                        title="Surat Permohonan"
                        file={form.documents?.suratPermohonanFile || null}
                        url={form.documents?.suratPermohonanUrl || null}
                        onAdd={(payload) => setDoc('suratPermohonan', payload)}
                    />
                    <DocRow
                        title="Proposal"
                        file={form.documents?.proposalFile || null}
                        url={form.documents?.proposalUrl || null}
                        onAdd={(payload) => setDoc('proposal', payload)}
                        emptyClass="text-rose-600"
                    />
                    <DocRow
                        title="Draf Ajuan"
                        file={form.documents?.draftAjuanFile || null}
                        url={form.documents?.draftAjuanUrl || null}
                        onAdd={(payload) => setDoc('draftAjuan', payload)}
                    />

                    {/* === Log Aktivitas Dokumen (scrollable & responsif) === */}
                    <div className="pt-4 border-t">
                        <h4 className="text-sm font-semibold mb-2">Log Aktivitas Dokumen</h4>
                        <DocLogList logs={docLogs} />
                    </div>
                </CardContent>
            </Card>

            {/* Panel Revisi & Diskusi (full width) */}
            <RevisionPanel />
        </div>
    );
}

/* ========== Bagian Dokumen (ikon-only trigger + sheet) ========== */
function DocRow({
    title,
    file,
    url,
    onAdd,
    emptyClass = 'text-muted-foreground',

    // ⬇️ props baru (opsional) untuk info
    showInfo = false,
    infoTitle = 'Dokumen Final',
    infoDescription = 'Unggah versi akhir yang telah disetujui WR. File/tautan ini akan menjadi rujukan resmi.',
    infoChecklist = [
        'Sudah ditandatangani para pihak',
        'Nomor dokumen sudah terbit (jika ada)',
        'Format PDF/A atau PDF standar',
    ],
}: {
    title: string;
    file: DocFile;
    url: string | null;
    onAdd: (payload: { linkUrl: string | null; file: DocFile }) => void;
    emptyClass?: string;

    // baru
    showInfo?: boolean;
    infoTitle?: string;
    infoDescription?: string;
    infoChecklist?: string[];
}) {
    const isEdit = Boolean(file || url);

    // ringkas status saat ini untuk dialog
    const statusNow = [
        file ? `File: ${file.name}` : 'File: —',
        url ? `Link: ${url}` : 'Link: —',
    ];

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium">{title}</h4>

                    {showInfo && (
                        <>
                            {/* Tooltip hover singkat */}
                            <TooltipProvider delayDuration={150}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button
                                            type="button"
                                            className="inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
                                            aria-label="Info dokumen final"
                                        >
                                            <Info className="h-3.5 w-3.5" />
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="max-w-xs text-xs">
                                        {infoDescription}
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            {/* Klik untuk detail (dialog) */}
                            <Dialog>
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
                        </>
                    )}
                </div>

                <AddDocButton isEdit={isEdit} onSave={onAdd} />
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


function AddDocButton({
    isEdit,
    onSave,
}: {
    isEdit: boolean;
    onSave: (payload: { linkUrl: string | null; file: DocFile }) => void;
}) {
    const [open, setOpen] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');
    const [file, setFile] = useState<File | null>(null);

    const pickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFile(e.target.files?.[0] || null);
    };

    const handleSave = () => {
        const fileData: DocFile = file ? { name: file.name, url: URL.createObjectURL(file) } : null;
        onSave({ linkUrl: linkUrl.trim() ? linkUrl.trim() : null, file: fileData });
        setOpen(false);
        setTimeout(() => {
            setLinkUrl('');
            setFile(null);
        }, 0);
    };

    return (
        <TooltipProvider delayDuration={150}>
            <Tooltip>
                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger asChild>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full"
                                aria-label={isEdit ? 'Ubah Dokumen' : 'Tambah Dokumen'}
                            >
                                {isEdit ? <Pencil className="h-4 w-4" /> : <FilePlus2 className="h-4 w-4" />}
                            </Button>
                        </TooltipTrigger>
                    </SheetTrigger>

                    <SheetContent className="w-full sm:max-w-md">
                        <SheetHeader>
                            <SheetTitle>Tambah/Ubah Dokumen</SheetTitle>
                        </SheetHeader>

                        <div className="mt-4 space-y-4">
                            <div className="grid gap-2">
                                <Label>Masukkan Link (opsional)</Label>
                                <Input placeholder="https://contoh.com/dokumen.pdf" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} />
                            </div>

                            <div className="grid gap-2">
                                <Label>Upload Dokumen (opsional)</Label>
                                <Input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg" onChange={pickFile} />
                                <p className="text-xs text-muted-foreground">Prototype: file dibuat sebagai Blob URL di browser (UI-only).</p>
                            </div>
                        </div>

                        <SheetFooter className="mt-6">
                            <Button onClick={handleSave}>
                                <Save className="h-4 w-4 mr-2" />
                                Simpan
                            </Button>
                        </SheetFooter>
                    </SheetContent>
                </Sheet>

                <TooltipContent>{isEdit ? 'Ubah Dokumen' : 'Tambah Dokumen'}</TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

/* =================== List Log Aktivitas Dokumen (SCROLLABLE) =================== */
function DocLogList({ logs }: { logs: DocLog[] }) {
    return (
        <div
            className="
        rounded-md border bg-muted/30
        max-h-64 overflow-y-auto
      "
            aria-label="Log aktivitas dokumen"
        >
            {/* Sticky header di dalam area scroll */}
            <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b bg-muted/60 px-2 py-1.5 backdrop-blur supports-[backdrop-filter]:bg-muted/40">
                <div className="flex items-center gap-2 text-xs font-medium">
                    <History className="h-3.5 w-3.5" />
                    Riwayat Perubahan
                </div>
                <div className="text-[11px] text-muted-foreground">{logs.length} aktivitas</div>
            </div>

            {logs.length === 0 ? (
                <div className="px-3 py-2 text-xs text-muted-foreground">Belum ada aktivitas dokumen.</div>
            ) : (
                <ul className="divide-y">
                    {logs.map((l) => (
                        <li key={l.id} className="flex items-start gap-3 px-3 py-2">
                            <span className="mt-0.5 shrink-0">{kindIcon(l.kind)}</span>
                            <div className="min-w-0">
                                <div className="text-sm">
                                    <span className="font-medium">{l.actor}</span>{' '}
                                    melakukan <span className="font-medium">{kindLabel(l.kind)}</span>{' '}
                                    pada <span className="font-medium">{labelFromPrefix(l.target)}</span>
                                    {l.detail ? <> — <span className="text-muted-foreground break-words">{l.detail}</span></> : null}
                                </div>
                                <div className="text-[11px] text-muted-foreground mt-0.5">{fmtDateTime(l.at)}</div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

/* =================== Panel Revisi & Diskusi (UI-only) =================== */

type ChatRole = 'UNIT' | 'WR';
type ChatAction = 'COMMENT' | 'REQUEST_CHANGES' | 'APPROVE';

type RevisionMessage = {
    id: string;
    author: ChatRole;
    text: string;
    createdAt: string; // ISO
    attachments?: { name: string }[];
    action: ChatAction;
};

function RevisionPanel() {
    // Simulasi role aktif (nanti ganti pakai role dari auth)
    const [asRole, setAsRole] = useState<ChatRole>('UNIT');

    // Thread dummy
    const [messages, setMessages] = useState<RevisionMessage[]>([
        {
            id: '1',
            author: 'UNIT',
            text: 'Halo WR, mohon review dokumen draf ajuan ya.',
            createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
            action: 'COMMENT',
        },
        {
            id: '2',
            author: 'WR',
            text: 'Tolong tambahkan ruang lingkup kegiatan poin “Publikasi Bersama”.',
            createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            action: 'REQUEST_CHANGES',
        },
    ]);

    const [text, setText] = useState('');
    const [action, setAction] = useState<ChatAction>('COMMENT');
    const [attachNames, setAttachNames] = useState<string[]>([]);
    const fileRef = useRef<HTMLInputElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // auto scroll ke bawah tiap ada pesan
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, [messages.length]);

    const fmtTime = (iso: string) =>
        new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' }).format(new Date(iso));

    const badgeFor = (a: ChatAction) =>
        a === 'REQUEST_CHANGES'
            ? <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100"><AlertTriangle className="h-3.5 w-3.5 mr-1" />Request changes</Badge>
            : a === 'APPROVE'
                ? <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100"><CheckCircle2 className="h-3.5 w-3.5 mr-1" />Approved</Badge>
                : <Badge variant="secondary">Komentar</Badge>;

    const onPickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setAttachNames(files.map((f) => f.name));
    };

    const send = () => {
        if (!text.trim() && attachNames.length === 0) return;
        const msg: RevisionMessage = {
            id: crypto.randomUUID(),
            author: asRole,
            text: text.trim(),
            createdAt: new Date().toISOString(),
            attachments: attachNames.map((n) => ({ name: n })),
            action,
        };
        setMessages((prev) => [...prev, msg]);
        setText('');
        setAttachNames([]);
        if (fileRef.current) fileRef.current.value = '';
    };

    return (
        <Card className="lg:col-span-3">
            <CardHeader className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Revisi & Diskusi
                    </CardTitle>

                    {/* Toggle role (demo) */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Kirim sebagai:</span>
                        <div className="flex gap-1">
                            <Button variant={asRole === 'UNIT' ? 'default' : 'outline'} size="sm" onClick={() => setAsRole('UNIT')}>
                                UNIT
                            </Button>
                            <Button variant={asRole === 'WR' ? 'default' : 'outline'} size="sm" onClick={() => setAsRole('WR')}>
                                WR
                            </Button>
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Thread */}
                <div ref={scrollRef} className="max-h-96 overflow-y-auto rounded-md border p-3 bg-muted/30">
                    <div className="space-y-3">
                        {messages.map((m) => {
                            const mine = m.author === asRole; // alignment demo
                            return (
                                <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                                    <div
                                        className={`max-w-[85%] rounded-lg border p-3 text-sm shadow-sm ${mine ? 'bg-primary text-primary-foreground' : 'bg-white'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="font-medium">{m.author === 'WR' ? 'WR' : 'Unit Pengaju'}</div>
                                            <div className="text-[11px] opacity-75">{fmtTime(m.createdAt)}</div>
                                        </div>

                                        <div className="mt-1 whitespace-pre-wrap">
                                            {m.text || <span className="opacity-70">(lampiran saja)</span>}
                                        </div>

                                        <div className="mt-2">{badgeFor(m.action)}</div>

                                        {m.attachments && m.attachments.length > 0 ? (
                                            <div className="mt-2 space-y-1">
                                                {m.attachments.map((a, i) => (
                                                    <div key={i} className="text-xs opacity-90">
                                                        • {a.name}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Composer */}
                <div className="rounded-md border p-3">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <Button variant={action === 'COMMENT' ? 'default' : 'outline'} size="sm" onClick={() => setAction('COMMENT')}>
                                Komentar
                            </Button>
                            <Button
                                variant={action === 'REQUEST_CHANGES' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setAction('REQUEST_CHANGES')}
                            >
                                Request changes
                            </Button>
                            <Button variant={action === 'APPROVE' ? 'default' : 'outline'} size="sm" onClick={() => setAction('APPROVE')}>
                                Approve
                            </Button>
                        </div>

                        <Textarea
                            placeholder={
                                action === 'REQUEST_CHANGES'
                                    ? 'Tulis permintaan revisi…'
                                    : action === 'APPROVE'
                                        ? 'Opsional: catatan persetujuan…'
                                        : 'Tulis komentar…'
                            }
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            rows={3}
                        />

                        {/* Attach */}
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                                    <Paperclip className="h-4 w-4 mr-2" />
                                    Lampirkan
                                </Button>
                                <input ref={fileRef} type="file" multiple className="hidden" onChange={onPickFiles} />
                                {attachNames.length > 0 && <span className="text-xs text-muted-foreground">{attachNames.length} file dipilih</span>}
                            </div>

                            <Button onClick={send}>
                                <Send className="h-4 w-4 mr-2" />
                                Kirim
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
