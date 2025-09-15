// src/components/kerjasama/kerjasama-detail.tsx
'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Save, Pencil, FileDown, ExternalLink, FilePlus2 } from 'lucide-react';

// ===== Types (sinkron dengan list)
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
};

// ===== Helpers
const fmtDate = (iso: string) =>
    new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(iso));

const daysBetween = (startISO: string, endISO: string) => {
    const ms = new Date(endISO).getTime() - new Date(startISO).getTime();
    return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
};

type Props = {
    data: MOU;
    onChange?: (m: MOU) => void;
};

export function KerjasamaDetail({ data, onChange }: Props) {
    // local form state
    const [form, setForm] = useState<MOU>(data);
    const [editing, setEditing] = useState(true); // langsung form aktif

    const masaHari = useMemo(() => daysBetween(form.startDate, form.endDate), [form.startDate, form.endDate]);

    const setField = <K extends keyof MOU>(key: K, val: MOU[K]) => {
        setForm(prev => ({ ...prev, [key]: val }));
    };

    const setDoc = (
        prefix: 'suratPermohonan' | 'proposal' | 'draftAjuan',
        payload: { linkUrl: string | null; file: DocFile }
    ) => {
        const urlKey = (prefix + 'Url') as keyof Documents;
        const fileKey = (prefix + 'File') as keyof Documents;
        setForm(prev => ({
            ...prev,
            documents: {
                ...(prev.documents || {}),
                [urlKey]: payload.linkUrl,
                [fileKey]: payload.file,
            },
        }));
    };

    const handleSave = async () => {
        // TODO: panggil API PUT/PATCH di sini
        onChange?.(form);
        setEditing(true); // tetap form, mengikuti permintaan: detail = form
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
                            <Input
                                value={form.documentNumber}
                                onChange={(e) => setField('documentNumber', e.target.value)}
                                placeholder="—"
                            />
                        </div>

                        {/* Entry */}
                        <div className="grid gap-2">
                            <Label>Tanggal Entry</Label>
                            <Input
                                type="date"
                                value={form.entryDate}
                                onChange={(e) => setField('entryDate', e.target.value)}
                            />
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
                            <Input
                                type="date"
                                value={form.startDate}
                                onChange={(e) => setField('startDate', e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">Tampil: {fmtDate(form.startDate)}</p>
                        </div>

                        {/* Berakhir */}
                        <div className="grid gap-2">
                            <Label>Berakhir</Label>
                            <Input
                                type="date"
                                value={form.endDate}
                                onChange={(e) => setField('endDate', e.target.value)}
                            />
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
                                onChange={(e) =>
                                    setField('partnerInfo', { ...(form.partnerInfo || {}), phone: e.target.value })
                                }
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Email Pengaju</Label>
                            <Input
                                type="email"
                                value={form.partnerInfo?.email || ''}
                                onChange={(e) =>
                                    setField('partnerInfo', { ...(form.partnerInfo || {}), email: e.target.value })
                                }
                            />
                        </div>
                    </div>

                    {/* Catatan */}
                    <div className="grid gap-2">
                        <Label>Catatan Status</Label>
                        <Textarea
                            rows={3}
                            value={form.statusNote || ''}
                            onChange={(e) => setField('statusNote', e.target.value)}
                        />
                    </div>

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
                <CardHeader>
                    <CardTitle className="text-base">Dokumen</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
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
                </CardContent>
            </Card>
        </div>
    );
}

/** ========== Bagian Dokumen (ikon-only trigger + sheet) ========== */
function DocRow({
    title,
    file,
    url,
    onAdd,
    emptyClass = 'text-muted-foreground',
}: {
    title: string;
    file: DocFile;
    url: string | null;
    onAdd: (payload: { linkUrl: string | null; file: DocFile }) => void;
    emptyClass?: string;
}) {
    const isEdit = Boolean(file || url);
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-medium">{title}</h4>
                <AddDocButton isEdit={isEdit} onSave={onAdd} />
            </div>

            <div className="space-y-1">
                {file ? (
                    <a className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                        href={file.url}
                        download={file.name || 'dokumen.pdf'}>
                        <FileDown className="h-3.5 w-3.5" />
                        Download file
                    </a>
                ) : null}

                {url ? (
                    <div>
                        <a className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            title={url}>
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
                    {/* Satu trigger saja: Tooltip + Sheet sama-sama asChild */}
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
                                <Input
                                    placeholder="https://contoh.com/dokumen.pdf"
                                    value={linkUrl}
                                    onChange={(e) => setLinkUrl(e.target.value)}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label>Upload Dokumen (opsional)</Label>
                                <Input
                                    type="file"
                                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                                    onChange={pickFile}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Prototype: file dibuat sebagai Blob URL di browser (UI-only).
                                </p>
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

                <TooltipContent>
                    {isEdit ? 'Ubah Dokumen' : 'Tambah Dokumen'}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
