'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ContentLayout } from '@/components/admin-panel/content-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    AlertTriangle,
    ArrowLeft,
    CheckCircle2,
    ExternalLink,
    Loader2,
    Repeat,
    ShieldAlert,
    Trash2,
} from 'lucide-react';
import { KerjasamaDetail, MOU } from '@/components/data-ajuan/data-ajuan-detail';
import { AjuanAllowedAction, AjuanReviewLog, AjuanStatus, kerjasamaAPI } from '@/lib/api/kerjasama';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const FLOW_STATUS_LABEL: Record<AjuanStatus, string> = {
    DRAFT: 'Draft',
    PENGAJUAN_DOKUMEN: 'Pengajuan Dokumen',
    VERIFIKASI_FAKULTAS: 'Verifikasi Fakultas',
    REVIEW_DKG: 'Review DKG',
    REVIEW_DKGE: 'Review DKGE',
    REVIEW_WR: 'Review WR',
    REVIEW_BLK: 'Review BLK',
    REVISI: 'Revisi',
    SELESAI: 'Selesai',
};

const formatFlowStatus = (status?: AjuanStatus | string | null) => {
    if (!status) return '-';
    const upper = status.toString().toUpperCase() as AjuanStatus;
    return FLOW_STATUS_LABEL[upper] || status;
};

const fmtDate = (iso?: string | null) => {
    if (!iso) return '-';
    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(new Date(iso));
};

const fmtDateTime = (iso?: string | null) => {
    if (!iso) return '-';
    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(iso));
};

/* ================= Mock data (prototype) ================= */
const mockData: MOU[] = [
    {
        id: 'AJ-001',
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
        status: 'REVIEW_DKG',
        documents: {
            suratPermohonanUrl: '/dokumen/mou-001-surat.pdf',
            proposalUrl: '/dokumen/mou-001-proposal.pdf',
            draftAjuanUrl: null,
        },
        processStatus: 'Menunggu review DKG',
        approvalStatus: 'Menunggu Review',
        statusNote: 'Menunggu review DKG',
        relatedIds: [],
    },
    {
        id: 'AJ-002',
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
        status: 'REVISI',
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
        statusNote: 'Lengkapi lampiran A',
        relatedIds: ['AJ-001'],
    },
];

type FlowMeta = {
    status: AjuanStatus;
    returnToStatus: AjuanStatus | null;
    revisionRequestedBy: string | null;
    allowedActions: AjuanAllowedAction[];
    reviewHistory: AjuanReviewLog[];
    submittedAt: string | null;
    resubmittedAt: string | null;
    completedAt: string | null;
    pengajuRole: string | null;
};

const emptyFlow: FlowMeta = {
    status: 'DRAFT',
    returnToStatus: null,
    revisionRequestedBy: null,
    allowedActions: [],
    reviewHistory: [],
    submittedAt: null,
    resubmittedAt: null,
    completedAt: null,
    pengajuRole: null,
};

/* ============== SEMENTARA: mock fetch ============== */
async function fetchMouById(id: string): Promise<{ mou: MOU; flow: FlowMeta } | null> {
    try {
        const res = await kerjasamaAPI.getAjuanDetail(id);
        if (res.status === 'success') {
            const k = res.data as any;
            const rawStatus =
                (k.status as string) ||
                (k.statusProses as string) ||
                (k.statusDokumen as string) ||
                'DRAFT';
            const flowStatus = rawStatus.toString().toUpperCase() as AjuanStatus;
            const rawReturnTo =
                (k.returnToStatus as string) ||
                (k.return_to_status as string) ||
                null;
            const returnToStatus = rawReturnTo
                ? (rawReturnTo.toString().toUpperCase() as AjuanStatus)
                : null;

            const flow: FlowMeta = {
                status: flowStatus,
                returnToStatus,
                revisionRequestedBy:
                    (k.revisionRequestedBy as string) ||
                    (k.revision_requested_by as string) ||
                    null,
                allowedActions:
                    (k.allowed_actions as AjuanAllowedAction[]) ||
                    (k.allowedActions as AjuanAllowedAction[]) ||
                    [],
                reviewHistory:
                    (k.review_history as AjuanReviewLog[]) ||
                    (k.reviewHistory as AjuanReviewLog[]) ||
                    [],
                submittedAt: (k.submittedAt as string) || k.submitted_at || null,
                resubmittedAt: (k.resubmittedAt as string) || k.resubmitted_at || null,
                completedAt: (k.completedAt as string) || k.completed_at || null,
                pengajuRole: (k.pengajuRole as string) || k.pengaju_role || null,
            };

            const mou: MOU = {
                id: k.id,
                level: (k.jenis as any) || 'MOU',
                documentNumber: k.nomorDokumen || '',
                title: k.judul || '-',
                entryDate: k.tanggalEntry || new Date().toISOString(),
                partner: k.namaInstitusi || '-',
                partnerType: (k.jenisMitra as any) || 'Universitas',
                country: k.alamatNegara || 'Indonesia',
                faculty: k.unitId || '',
                scope: k.lingkup ? k.lingkup.split(',') : ['Nasional'],
                category: 'Cooperation',
                department: '-',
                owner: '-',
                startDate: k.tanggalMulai || new Date().toISOString(),
                endDate: k.tanggalBerakhir || new Date().toISOString(),
                status: (k.statusDokumen as any) || flowStatus || 'Draft',
                documents: {
                    reviewUrl: k.pdfReviewURL || undefined,
                },
                processStatus: k.statusProses,
                approvalStatus: k.statusPersetujuan,
                statusNote: k.catatanStatus,
                fileUrl: k.lampiranURL,
                relatedIds: k.idDokumenRelasi,
                partnerInfo: {
                    phone: k.teleponPengaju || undefined,
                    email: k.emailPengaju || undefined,
                    contactName: k.kontakNama || undefined,
                    contactTitle: k.kontakJabatan || undefined,
                    contactWhatsapp: k.kontakWA || undefined,
                    website: k.kontakWebsite || undefined,
                },
                institutionAddress: {
                    province: k.alamatProvinsi || undefined,
                    city: k.alamatKota || undefined,
                    country: k.alamatNegara || undefined,
                },
                durationYears: k.durasiKerjasama ?? null,
                persetujuanDekan: k.persetujuanDekan ?? null,
            };

            return { mou, flow };
        }
    } catch (error) {
        console.error('Fetch kerjasama by id error:', error);
    }
    const found = mockData.find((d) => d.id === id);
    return found
        ? {
              mou: found,
              flow: {
                  ...emptyFlow,
                  status: (found.status as AjuanStatus) || 'DRAFT',
              },
          }
        : null;
}

export default function KerjasamaDetailPage() {
    const { id } = useParams<{ id: string }>();

    const [loading, setLoading] = useState(true);
    const [mou, setMou] = useState<MOU | null>(null);
    const [flow, setFlow] = useState<FlowMeta>(emptyFlow);
    const [actionLoading, setActionLoading] = useState<AjuanAllowedAction | null>(null);
    const [dialogAction, setDialogAction] = useState<'approve' | 'revision' | null>(null);
    const [note, setNote] = useState('');
    const [attachmentUrl, setAttachmentUrl] = useState('');
    const [confirmAction, setConfirmAction] = useState<'submit' | 'resubmit' | null>(null);

    const loadDetail = async () => {
        setLoading(true);
        const found = await fetchMouById(decodeURIComponent(id));
        if (found) {
            setMou(found.mou);
            setFlow(found.flow);
        } else {
            setMou(null);
            setFlow(emptyFlow);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadDetail();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    // Persist perubahan dari komponen (prototype: update ke mockData juga)
    const handleChange = async (next: MOU) => {
        const canEdit =
            flow.allowedActions.includes('edit') || flow.status === 'DRAFT' || flow.status === 'REVISI';
        if (!canEdit) {
            toast.error('Edit hanya diizinkan saat status DRAFT/REVISI.');
            return;
        }
        setMou(next);
        try {
            const payload = {
                unitId: next.unit || next.faculty,
                jenis: next.level,
                jenisMitra: next.partnerType || 'Universitas',
                nomorDokumen: next.documentNumber,
                judul: next.title,
                tanggalEntry: next.entryDate,
                tanggalMulai: next.startDate,
                tanggalBerakhir: next.endDate,
                teleponPengaju: next.partnerInfo?.phone || next.partnerInfo?.contactWhatsapp,
                emailPengaju: next.partnerInfo?.email,
                namaInstitusi: next.partner,
                alamatProvinsi: next.institutionAddress?.province,
                alamatKota: next.institutionAddress?.city,
                alamatNegara: next.institutionAddress?.country,
                kontakNama: next.partnerInfo?.contactName || next.partnerInfo?.contactTitle,
                kontakJabatan: next.partnerInfo?.contactTitle,
                kontakEmail: next.partnerInfo?.email,
                kontakWA: next.partnerInfo?.contactWhatsapp,
                kontakWebsite: next.partnerInfo?.website,
                durasiKerjasama: next.durationYears,
                persetujuanDekan: next.persetujuanDekan,
                lingkup: next.scope.join(','),
                lampiranURL: next.fileUrl,
                statusDokumen: next.status,
                statusProses: next.processStatus,
                statusPersetujuan: next.approvalStatus,
                catatanStatus: next.statusNote,
                idDokumenRelasi: next.relatedIds || [],
            };

            await kerjasamaAPI.update(next.id, payload);
            toast.success('Perubahan berhasil disimpan');
            await loadDetail();
        } catch (error) {
            console.error('Update kerjasama error:', error);
            toast.error('Gagal menyimpan perubahan');
        }
    };

    const performSubmitOrResubmit = async (action: 'submit' | 'resubmit') => {
        if (!mou) return;
        setActionLoading(action);
        try {
            if (action === 'submit') {
                await kerjasamaAPI.submit(mou.id);
            } else {
                await kerjasamaAPI.resubmit(mou.id);
            }
            toast.success(action === 'submit' ? 'Submit berhasil' : 'Resubmit berhasil');
            await loadDetail();
        } catch (error: any) {
            console.error(`${action} error`, error);
            toast.error(error?.message || 'Gagal memproses aksi');
        } finally {
            setActionLoading(null);
            setConfirmAction(null);
        }
    };

    const performReview = async (action: 'approve' | 'revision') => {
        if (!mou) return;
        const trimmedNote = note.trim();
        if (action === 'revision' && !trimmedNote) {
            toast.error('Catatan wajib untuk meminta revisi.');
            return;
        }

        setActionLoading(action === 'approve' ? 'approve' : 'request_revision');
        try {
            if (action === 'approve') {
                await kerjasamaAPI.reviewApprove(mou.id, {
                    note: trimmedNote || undefined,
                    attachmentUrl: attachmentUrl.trim() || undefined,
                });
            } else {
                await kerjasamaAPI.reviewRevision(mou.id, {
                    note: trimmedNote,
                    attachmentUrl: attachmentUrl.trim() || undefined,
                });
            }
            toast.success(action === 'approve' ? 'Review disetujui' : 'Permintaan revisi dikirim');
            setDialogAction(null);
            setNote('');
            setAttachmentUrl('');
            await loadDetail();
        } catch (error: any) {
            console.error(`${action} review error`, error);
            toast.error(error?.message || 'Gagal memproses aksi review');
        } finally {
            setActionLoading(null);
        }
    };

    // render list dokumen terkait terbaru
    const relatedDocs = mou?.relatedIds?.length
        ? mockData.filter((d) => mou.relatedIds?.includes(d.id))
        : [];
    const allowedActions = flow.allowedActions || [];
    const canEdit = allowedActions.includes('edit') || flow.status === 'DRAFT' || flow.status === 'REVISI';
    const allowAttachment = flow.status === 'REVIEW_DKGE';

    return (
        <ContentLayout title="Detail Kerjasama">
            <div className="mb-4">
                <Button asChild variant="outline" size="sm">
                    <Link href="/data-ajuan">
                        <ArrowLeft className="mr-1 h-4 w-4" /> Kembali
                    </Link>
                </Button>
                <Button className="ml-2" variant="destructive" size="sm" onClick={async () => {
                    if (!confirm('Apakah Anda yakin ingin menghapus ajuan ini?')) return;
                    if (!id) return;
                    try {
                        await kerjasamaAPI.delete(id);
                        toast.success('Ajuan berhasil dihapus');
                        // redirect back
                        window.location.href = '/data-ajuan';
                    } catch (error) {
                        console.error('Delete detail error', error);
                        toast.error('Gagal menghapus ajuan');
                    }
                }}>
                    <Trash2 className="mr-1 h-4 w-4" /> Hapus
                </Button>
            </div>

            {loading ? (
                <p className="text-muted-foreground">Memuat…</p>
            ) : !mou ? (
                <p className="text-rose-600">Data tidak ditemukan.</p>
            ) : (
                <>
                    <Card className="mb-4">
                        <CardHeader>
                            <CardTitle className="text-base">Status &amp; Aksi (backend)</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="secondary">{formatFlowStatus(flow.status)}</Badge>
                                {flow.returnToStatus ? (
                                    <Badge variant="outline" className="text-xs">
                                        Kembali ke {formatFlowStatus(flow.returnToStatus)}
                                    </Badge>
                                ) : null}
                                {flow.revisionRequestedBy ? (
                                    <span className="inline-flex items-center gap-1 text-xs text-amber-700">
                                        <ShieldAlert className="h-3.5 w-3.5" />
                                        Diminta revisi oleh {flow.revisionRequestedBy}
                                    </span>
                                ) : null}
                            </div>

                            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                                <div className="space-y-0.5">
                                    <div className="text-xs text-muted-foreground">Pengaju</div>
                                    <div>{flow.pengajuRole || '-'}</div>
                                </div>
                                <div className="space-y-0.5">
                                    <div className="text-xs text-muted-foreground">Diajukan</div>
                                    <div>{fmtDateTime(flow.submittedAt)}</div>
                                </div>
                                <div className="space-y-0.5">
                                    <div className="text-xs text-muted-foreground">Resubmit</div>
                                    <div>{fmtDateTime(flow.resubmittedAt)}</div>
                                </div>
                                <div className="space-y-0.5">
                                    <div className="text-xs text-muted-foreground">Selesai</div>
                                    <div>{fmtDateTime(flow.completedAt)}</div>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {allowedActions.includes('submit') ? (
                                    <Button
                                        size="sm"
                                        onClick={() => setConfirmAction('submit')}
                                        disabled={!!actionLoading}
                                        className="gap-1"
                                    >
                                        {actionLoading === 'submit' ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <CheckCircle2 className="h-4 w-4" />
                                        )}
                                        Submit
                                    </Button>
                                ) : null}

                                {allowedActions.includes('resubmit') ? (
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => setConfirmAction('resubmit')}
                                        disabled={!!actionLoading}
                                        className="gap-1"
                                    >
                                        {actionLoading === 'resubmit' ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Repeat className="h-4 w-4" />
                                        )}
                                        Resubmit
                                    </Button>
                                ) : null}

                                {allowedActions.includes('approve') ? (
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => setDialogAction('approve')}
                                        disabled={actionLoading === 'approve'}
                                        className="gap-1"
                                    >
                                        {actionLoading === 'approve' ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <CheckCircle2 className="h-4 w-4" />
                                        )}
                                        Approve
                                    </Button>
                                ) : null}

                                {allowedActions.includes('request_revision') ? (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setDialogAction('revision')}
                                        disabled={actionLoading === 'request_revision'}
                                        className="gap-1"
                                    >
                                        {actionLoading === 'request_revision' ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <AlertTriangle className="h-4 w-4" />
                                        )}
                                        Minta Revisi
                                    </Button>
                                ) : null}
                            </div>

                            <div className="text-xs text-muted-foreground">
                                Allowed actions (dari backend):{' '}
                                {allowedActions.length
                                    ? allowedActions.map((a) => a.replace('_', ' ')).join(', ')
                                    : 'Tidak ada aksi tersedia'}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="mb-4">
                        <CardHeader>
                            <CardTitle className="text-base">Riwayat Review</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ReviewHistoryList logs={flow.reviewHistory} />
                        </CardContent>
                    </Card>

                    <div className={canEdit ? '' : 'pointer-events-none opacity-60'}>
                        <KerjasamaDetail
                            data={mou}
                            onChange={handleChange}
                            allDocs={mockData} // sumber kandidat relasi
                            disallowSameLevel={true} // ceklis: larang relasi sesama level (opsional)
                        />
                    </div>
                    {!canEdit && (
                        <div className="mt-2 inline-flex items-center gap-2 text-xs text-amber-700">
                            <ShieldAlert className="h-4 w-4" />
                            Form hanya bisa diubah saat DRAFT atau REVISI (allowed_actions dari backend).
                        </div>
                    )}

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

                    <AlertDialog
                        open={!!confirmAction}
                        onOpenChange={(open) => setConfirmAction(open ? confirmAction : null)}
                    >
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>
                                    {confirmAction === 'resubmit' ? 'Kirim Ulang Ajuan?' : 'Submit Ajuan?'}
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                    {confirmAction === 'resubmit'
                                        ? `Data akan dikirim kembali ke tahap ${formatFlowStatus(flow.returnToStatus || flow.status)} dan terkunci sampai reviewer memberi respon.`
                                        : 'Setelah submit, ajuan akan dikunci kecuali masuk status REVISI.'}
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel disabled={!!actionLoading}>Batal</AlertDialogCancel>
                                <AlertDialogAction
                                    disabled={!!actionLoading || !confirmAction}
                                    onClick={() => confirmAction && performSubmitOrResubmit(confirmAction)}
                                >
                                    {actionLoading === confirmAction ? 'Memproses…' : 'Lanjut'}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                    <Dialog
                        open={!!dialogAction}
                        onOpenChange={(open) => {
                            setDialogAction(open ? dialogAction : null);
                            if (!open) {
                                setNote('');
                                setAttachmentUrl('');
                            }
                        }}
                    >
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>
                                    {dialogAction === 'approve' ? 'Approve Review' : 'Minta Revisi'}
                                </DialogTitle>
                                <DialogDescription>
                                    {dialogAction === 'approve'
                                        ? 'Berikan catatan (opsional) sebelum melanjutkan ke tahap berikutnya.'
                                        : 'Catatan revisi wajib diisi dan akan dikirim ke pengaju.'}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-3">
                                <div className="grid gap-1.5">
                                    <span className="text-xs text-muted-foreground">Catatan</span>
                                    <Textarea
                                        placeholder={
                                            dialogAction === 'approve'
                                                ? 'Opsional, contoh: lanjut WR'
                                                : 'Contoh: Lengkapi lampiran A'
                                        }
                                        value={note}
                                        onChange={(e) => setNote(e.target.value)}
                                    />
                                </div>

                                {allowAttachment && (
                                    <div className="grid gap-1.5">
                                        <span className="text-xs text-muted-foreground">Lampiran PDF (opsional)</span>
                                        <Input
                                            placeholder="https://files/review.pdf"
                                            value={attachmentUrl}
                                            onChange={(e) => setAttachmentUrl(e.target.value)}
                                        />
                                    </div>
                                )}
                            </div>

                            <DialogFooter className="mt-4">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setDialogAction(null);
                                        setNote('');
                                        setAttachmentUrl('');
                                    }}
                                >
                                    Batal
                                </Button>
                                <Button
                                    onClick={() =>
                                        performReview(dialogAction === 'approve' ? 'approve' : 'revision')
                                    }
                                    disabled={
                                        actionLoading === 'approve' || actionLoading === 'request_revision'
                                    }
                                >
                                    {actionLoading === 'approve' || actionLoading === 'request_revision' ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : dialogAction === 'approve' ? (
                                        <CheckCircle2 className="mr-2 h-4 w-4" />
                                    ) : (
                                        <AlertTriangle className="mr-2 h-4 w-4" />
                                    )}
                                    {dialogAction === 'approve' ? 'Approve' : 'Kirim Revisi'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </>
            )}
        </ContentLayout>
    );
}

function ReviewHistoryList({ logs }: { logs: AjuanReviewLog[] }) {
    if (!logs || logs.length === 0) {
        return <p className="text-sm text-muted-foreground">Belum ada review.</p>;
    }

    const sorted = [...logs].sort((a, b) => {
        const aTime = new Date(a?.createdAt || '').getTime();
        const bTime = new Date(b?.createdAt || '').getTime();
        return aTime - bTime;
    });

    return (
        <ul className="space-y-3">
            {sorted.map((log, idx) => (
                <li key={idx} className="rounded-md border p-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{formatFlowStatus(log.stageStatus)}</Badge>
                        {log.action ? (
                            <Badge
                                variant={log.action === 'APPROVE' ? 'secondary' : 'destructive'}
                                className="text-[11px]"
                            >
                                {log.action}
                            </Badge>
                        ) : null}
                        {log.actorRole ? (
                            <span className="text-xs text-muted-foreground">{log.actorRole}</span>
                        ) : null}
                        {log.createdAt ? (
                            <span className="text-xs text-muted-foreground ml-auto">{fmtDateTime(log.createdAt)}</span>
                        ) : null}
                    </div>
                    {log.note ? <p className="mt-2 text-sm">{log.note}</p> : null}
                    {log.attachmentUrl ? (
                        <a
                            className="mt-2 inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                            href={log.attachmentUrl}
                            target="_blank"
                            rel="noreferrer"
                        >
                            <ExternalLink className="h-4 w-4" />
                            Lihat lampiran
                        </a>
                    ) : null}
                </li>
            ))}
        </ul>
    );
}
