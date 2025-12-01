"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { ContentLayout } from "@/components/admin-panel/content-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";

import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";

import {
  Calendar as CalendarIcon,
  Search,
  FileSignature,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Eye,
  FileDown,
  ChevronsUpDown,
  MoreHorizontal,
  Trash2
} from "lucide-react";

import { getAuth, isAuthed } from "@/lib/proto/auth";
import { kerjasamaAPI, type KerjasamaRequest } from "@/lib/api/kerjasama";
import { unitAPI } from "@/lib/api/unit";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";

/* ================= Roles ================= */
type Role = "LEMBAGA_KERJA_SAMA" | "FAKULTAS" | "PRODI" | "ORANG_LUAR" | "WR";

/* ================= Types ================= */
type MOUStatus = "Draft" | "Active" | "Expiring" | "Expired" | "Terminated";
type MOULevel = "MOU" | "MOA" | "IA";
type PartnerType = "Universitas" | "Industri" | "Pemerintah" | "Organisasi";

type PartnerInfo = {
  phone?: string;
  email?: string;
};

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
  category: "Cooperation" | "NDA" | "Grant" | "Vendor" | "Academic";
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
  new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(iso));

const daysBetween = (startISO: string, endISO: string) => {
  const ms = new Date(endISO).getTime() - new Date(startISO).getTime();
  return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
};

// trim string, return undefined when empty/whitespace
const normalizeOptionalText = (value?: string | null) => {
  if (value === undefined || value === null) return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
};

// safely convert date (yyyy-mm-dd) to ISO string
const normalizeIsoDate = (value?: string) => {
  if (!value) return undefined;
  return dateToISODateTime(value);
};

// Build payload for create so optional fields become nullish/empty safely
const buildCreatePayload = (m: Omit<MOU, "id">): KerjasamaRequest => ({
  unitId: normalizeOptionalText(m.unit || m.faculty) || "unknown",
  jenis: m.level,
  nomorDokumen: normalizeOptionalText(m.documentNumber) ?? null,
  judul: m.title.trim(),
  tanggalEntry: normalizeIsoDate(m.entryDate) || new Date().toISOString(),
  tanggalMulai: normalizeIsoDate(m.startDate) || new Date().toISOString(),
  tanggalBerakhir: normalizeIsoDate(m.endDate) || new Date().toISOString(),
  teleponPengaju: normalizeOptionalText(m.partnerInfo?.phone) ?? null,
  emailPengaju: normalizeOptionalText(m.partnerInfo?.email) ?? null,
  lingkup: m.scope.length ? m.scope.join(",") : null,
  statusProses: normalizeOptionalText(m.processStatus) ?? null,
  statusPersetujuan: normalizeOptionalText(m.approvalStatus) ?? null,
  catatanStatus: normalizeOptionalText(m.statusNote) ?? null,
  lampiranURL: normalizeOptionalText(m.fileUrl) ?? null,
  statusDokumen: m.status,
  idDokumenRelasi: m.relatedIds ?? []
});

// Helper function to convert date string to ISO datetime format
const dateToISODateTime = (dateString: string): string => {
  if (!dateString) return "";
  // If it's already in ISO format, return as is
  if (dateString.includes("T")) return dateString;
  // Convert YYYY-MM-DD to ISO datetime (start of day in local time)
  const date = new Date(dateString);
  return date.toISOString();
};

function DateBadge({ date }: { date: string }) {
  return (
    <Badge variant="secondary" className="font-normal">
      <CalendarIcon className="mr-1 h-3.5 w-3.5" />
      {fmtDate(date)}
    </Badge>
  );
}

/* ============== Dummy data awal (contoh) ============== */
const initialData: MOU[] = [
  {
    id: "MOU-001",
    level: "MOU",
    documentNumber: "MOU/UMY/2025/01",
    title: "KERJASAMA PENELITIAN DAN PERTUKARAN MAHASISWA",
    entryDate: "2025-07-10",
    partner: "Universitas A",
    partnerType: "Universitas",
    country: "Indonesia",
    faculty: "TEKNIK",
    scope: ["Nasional"],
    category: "Cooperation",
    department: "LKI",
    owner: "Unit Teknik",
    startDate: "2025-07-15",
    endDate: "2027-07-15",
    status: "Active",
    documents: {
      suratPermohonanUrl: "/dokumen/mou-001-surat.pdf",
      proposalUrl: "/dokumen/mou-001-proposal.pdf",
      draftAjuanUrl: null
    },
    processStatus: "Ditandatangani",
    approvalStatus: "Disetujui", // <- sudah ACC -> TIDAK tampil di halaman ini
    statusNote: "",
    relatedIds: []
  },
  {
    id: "MOA-001",
    level: "MOA",
    documentNumber: "—",
    title:
      "PENYELENGGARAAN TRI DHARMA PERGURUAN TINGGI FAKULTAS KEDOKTERAN DAN ILMU KESEHATAN",
    entryDate: "2025-08-29",
    partner: "—",
    partnerType: "Universitas",
    partnerInfo: {
      phone: "+62 819-0428-0196",
      email: "kerjasamafkikumy@gmail.com"
    },
    country: "Indonesia",
    faculty: "KEDOKTERAN",
    scope: ["Domestik", "Kabupaten"],
    category: "Cooperation",
    department: "LKI",
    owner: "Unit Pengaju",
    startDate: "2025-08-29",
    endDate: "2025-08-29",
    status: "Active",
    documents: {
      suratPermohonanUrl: "/dokumen/surat-permohonan.pdf",
      proposalUrl: null,
      draftAjuanUrl: "https://contoh.com/preview-draf-ajuan",
      draftAjuanFile: {
        name: "draf-ajuan-contoh.pdf",
        url: "/dokumen/draf-ajuan-contoh.pdf"
      }
    },
    processStatus: "Pengajuan Unit Ke LKI",
    approvalStatus: "Menunggu Persetujuan", // <- pending -> TAMPIL
    statusNote: "",
    relatedIds: ["MOU-001"]
  },
  {
    id: "IA-001",
    level: "IA",
    documentNumber: "IA/2025/05",
    title: "IMPLEMENTASI PELATIHAN BERSAMA INDUSTRI XYZ",
    entryDate: "2025-09-01",
    partner: "PT Industri XYZ",
    partnerType: "Industri",
    country: "Indonesia",
    faculty: "EKONOMI",
    scope: ["Lokal"],
    category: "Academic",
    department: "LKI",
    owner: "Fakultas Ekonomi",
    startDate: "2025-09-05",
    endDate: "2026-09-05",
    status: "Draft",
    documents: {
      suratPermohonanUrl: null,
      proposalUrl: null,
      draftAjuanUrl: null
    },
    processStatus: "Penyusunan draft",
    approvalStatus: "Belum Disetujui", // <- pending -> TAMPIL
    statusNote: "Menunggu dokumen tambahan",
    relatedIds: ["MOU-001"]
  }
];

/* ==== Opsi Lingkup (bisa kamu sesuaikan) ==== */
const SCOPE_OPTIONS = [
  "Internasional",
  "Nasional",
  "Domestik",
  "Provinsi",
  "Kabupaten",
  "Kota",
  "Lokal",
  "Fakultas",
  "Prodi"
];

/* ============== Page ============== */
export default function DataAjuanPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<MOU[]>([]);
  const [role, setRole] = useState<Role | null>(null);
  const [unitMap, setUnitMap] = useState<Record<string, string>>({});

  // filters
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<MOUStatus | "all">("all");
  const [level, setLevel] = useState<MOULevel | "all">("all");

  // pagination
  const [page, setPage] = useState(1);
  const limit = 10;

  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthed()) {
      console.log("❌ User not authenticated, redirecting to login...");
      router.replace("/auth");
      return;
    }

    const u = getAuth();
    console.log("✅ User authenticated:", u);
    setRole(u?.role ?? null);

    const onStorage = (e: StorageEvent) => {
      if (e.key === "proto_auth" || e.key === "auth_user") {
        const next = getAuth();
        setRole(next?.role ?? null);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [router]);

  const canCreate = role !== "WR";

  // load from backend
  const loadFromServer = async () => {
    try {
      setLoading(true);
      // load unit map for name display
      try {
        const unitRes = await unitAPI.getAllUnits();
        if (unitRes.status === "success") {
          const map: Record<string, string> = {};
          unitRes.data.forEach((u) => {
            map[u.id] = u.name;
          });
          setUnitMap(map);
        }
      } catch (err) {
        console.error("Load unit map error:", err);
      }

      const res = await kerjasamaAPI.getAll();
      if (res.status === "success") {
        // map backend kerjasama to frontend MOU type
        const mapped = res.data.map(
          (k) =>
            ({
              id: k.id,
              level: (k.jenis as MOULevel) || "MOU",
              documentNumber: k.nomorDokumen || "",
              title: k.judul || "-",
              entryDate: k.tanggalEntry || new Date().toISOString(),
              partner: "-",
              partnerType: "Universitas" as PartnerType,
              country: "Indonesia",
              faculty: k.unitId || "",
              unit: k.unitId || "",
              scope: k.lingkup ? k.lingkup.split(",") : ["Nasional"],
              category: "Cooperation" as MOU["category"],
              department: "-",
              owner: "-",
              startDate: k.tanggalMulai || new Date().toISOString(),
              endDate: k.tanggalBerakhir || new Date().toISOString(),
              status: (k.statusDokumen as MOUStatus) || "Draft",
              documents: {
                suratPermohonanUrl: k.lampiranURL || undefined
              },
              processStatus: k.statusProses,
              approvalStatus: k.statusPersetujuan,
              statusNote: k.catatanStatus,
              fileUrl: k.lampiranURL,
              relatedIds: k.idDokumenRelasi
            } as MOU)
        );

        setRows(mapped);
      } else {
        toast.error(res.message || "Gagal memuat data ajuan");
        setRows(initialData);
      }
    } catch (error) {
      console.error("Load kerjasama error:", error);
      toast.error("Gagal memuat data ajuan");
      setRows(initialData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFromServer();
  }, []);

  // Delete confirmation dialog (shadcn AlertDialog)

  // === Hanya data pending: approvalStatus ≠ "Disetujui"
  const pendingRows = useMemo(() => {
    return rows.filter(
      (d) => (d.approvalStatus || "").toLowerCase() !== "disetujui"
    );
  }, [rows]);

  // delete
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MOU | null>(null);

  const openDelete = (m: MOU) => {
    setDeleteTarget(m);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    try {
      setDeleting(deleteTarget.id);
      const res = await kerjasamaAPI.delete(deleteTarget.id);
      if (res.status === "success") {
        toast.success("Ajuan berhasil dihapus");
        loadFromServer();
      } else {
        toast.error(res.message || "Gagal menghapus ajuan");
      }
    } catch (error) {
      console.error("Delete kerjasama error:", error);
      toast.error("Gagal menghapus ajuan");
    } finally {
      setDeleting(null);
      setShowDeleteDialog(false);
      setDeleteTarget(null);
    }
  };

  // filter lanjutan
  const filtered = useMemo(() => {
    const txt = q.trim().toLowerCase();
    return pendingRows.filter((d) => {
      const matchQ =
        txt === "" ||
        [
          d.title,
          d.partner,
          d.documentNumber,
          d.faculty,
          d.studyProgram,
          d.unit,
          d.processStatus,
          d.approvalStatus
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(txt);

      const matchStatus = status === "all" || d.status === status;
      const matchLevel = level === "all" || d.level === level;

      return matchQ && matchStatus && matchLevel;
    });
  }, [pendingRows, q, status, level]);

  // pagination
  const total = filtered.length;
  const start = (page - 1) * limit;
  const end = start + limit;
  const pageRows = filtered.slice(start, end);
  const canPrev = page > 1;
  const canNext = end < total;

  // create
  const handleCreate = async (m: Omit<MOU, "id">) => {
    try {
      const payload = buildCreatePayload(m);

      // Validate unitId exists first
      if (payload.unitId) {
        try {
          await unitAPI.getUnitById(payload.unitId);
        } catch (e) {
          toast.error(`Unit dengan id ${payload.unitId} tidak ditemukan.`);
          return;
        }
      }

      // Validate related ids exist in current rows
      if (payload.idDokumenRelasi && payload.idDokumenRelasi.length) {
        const valid = (payload.idDokumenRelasi || []).filter((id) =>
          rows.some((r) => r.id === id)
        );
        if (valid.length !== (payload.idDokumenRelasi || []).length) {
          toast.info("Beberapa relasi tidak dikenali dan akan diabaikan.");
          payload.idDokumenRelasi = valid;
        }
      }

      const res = await kerjasamaAPI.create(payload);
      if (res.status === "success") {
        toast.success("Ajuan berhasil dibuat");
        // reload data from server
        await loadFromServer();
        setPage(1);
      } else {
        toast.error(res.message || "Gagal membuat ajuan");
      }
    } catch (error) {
      console.error("Create kerjasama error:", error);
      toast.error("Gagal membuat ajuan");
    }
  };

  // update
  const handleUpdate = async (id: string, m: Partial<Omit<MOU, "id">>) => {
    try {
      const payload: Partial<KerjasamaRequest> = {};

      if (m.unit || m.faculty) {
        payload.unitId = normalizeOptionalText(m.unit || m.faculty) ?? undefined;
      }
      if (m.level) payload.jenis = m.level;
      if (m.documentNumber !== undefined)
        payload.nomorDokumen = normalizeOptionalText(m.documentNumber) ?? null;
      if (m.title !== undefined) payload.judul = m.title.trim();
      if (m.entryDate !== undefined)
        payload.tanggalEntry = normalizeIsoDate(m.entryDate);
      if (m.startDate !== undefined)
        payload.tanggalMulai = normalizeIsoDate(m.startDate);
      if (m.endDate !== undefined)
        payload.tanggalBerakhir = normalizeIsoDate(m.endDate);
      if (m.partnerInfo?.phone !== undefined)
        payload.teleponPengaju =
          normalizeOptionalText(m.partnerInfo.phone) ?? null;
      if (m.partnerInfo?.email !== undefined)
        payload.emailPengaju =
          normalizeOptionalText(m.partnerInfo.email) ?? null;
      if (m.scope)
        payload.lingkup = m.scope.length ? m.scope.join(",") : null;
      if (m.processStatus !== undefined)
        payload.statusProses =
          normalizeOptionalText(m.processStatus) ?? null;
      if (m.approvalStatus !== undefined)
        payload.statusPersetujuan =
          normalizeOptionalText(m.approvalStatus) ?? null;
      if (m.statusNote !== undefined)
        payload.catatanStatus =
          normalizeOptionalText(m.statusNote) ?? null;
      if (m.fileUrl !== undefined)
        payload.lampiranURL = normalizeOptionalText(m.fileUrl) ?? null;
      if (m.status) payload.statusDokumen = m.status;
      if (m.relatedIds !== undefined) payload.idDokumenRelasi = m.relatedIds;

      const res = await kerjasamaAPI.update(id, payload);
      if (res.status === "success") {
        toast.success("Ajuan berhasil diperbarui");
        await loadFromServer();
      } else {
        toast.error(res.message || "Gagal memperbarui ajuan");
      }
    } catch (error) {
      console.error("Update kerjasama error:", error);
      toast.error("Gagal memperbarui ajuan");
    }
  };

  return (
    <ContentLayout title="Data Ajuan (Pending/Belum ACC WR)">
      {/* Header simple (tanpa dashboard) */}
      <div className="mt-6 space-y-6">
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

            <div className="flex items-center gap-2">
              <Button variant="outline">Filter Lanjutan</Button>

              {canCreate ? (
                <NewMOUButton onCreate={handleCreate} optionsRows={rows} />
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

        {/* Tabel Pending */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Daftar Ajuan (Pending)</CardTitle>
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
                          const masaHari = daysBetween(
                            row.startDate,
                            row.endDate
                          );
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
                                    href={row.fileUrl || "#"}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    {row.title}
                                  </a>

                                  {/* relasi */}
                                  {related.length > 0 && (
                                    <div className="flex flex-wrap gap-1 pt-1">
                                      {related.map((r) => (
                                        <Badge
                                          key={r.id}
                                          variant="outline"
                                          className="text-xs"
                                        >
                                          <Link
                                            href={`/data-ajuan/${encodeURIComponent(
                                              r.id
                                            )}`}
                                            className="hover:underline"
                                          >
                                            Terkait: {r.level}-
                                            {r.id.split("-")[1] ?? r.id}
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
                                    {row.documentNumber ||
                                      "Belum Masuk " + row.level}
                                  </div>
                                </div>
                              </TableCell>

                              <TableCell>{fmtDate(row.entryDate)}</TableCell>

                              <TableCell>
                                <div className="text-sm">
                                  {row.partnerInfo?.phone ? (
                                    <>
                                      Telepon / HP Pengaju:
                                      <br />
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

                              <TableCell>
                                {unitMap[row.unit || row.faculty || ""] ||
                                  row.faculty ||
                                  row.unit ||
                                  "-"}
                              </TableCell>

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
                                    Masa Berlaku :{" "}
                                    {masaHari.toString().padStart(2, "0")} Hari
                                  </div>
                                </div>
                              </TableCell>

                              <TableCell>
                                <div className="text-sm space-y-4">
                                  <DocRow
                                    title="Dokumen Surat Permohonan"
                                    file={
                                      row.documents?.suratPermohonanFile || null
                                    }
                                    url={
                                      row.documents?.suratPermohonanUrl || null
                                    }
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
                                  <div>{row.processStatus || "-"}</div>
                                  <div className="text-sm">
                                    Status Persetujuan:{" "}
                                    <span className="font-medium text-rose-600">
                                      {row.approvalStatus || "-"}
                                    </span>
                                  </div>
                                </div>
                              </TableCell>

                              <TableCell className="text-sm">
                                {row.statusNote || "-"}
                              </TableCell>

                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8"
                                    >
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem asChild>
                                      <Link
                                        href={`/data-ajuan/${encodeURIComponent(
                                          row.id
                                        )}`}
                                        className="flex items-center"
                                      >
                                        <Eye className="w-4 h-4 mr-3 text-muted-foreground" />
                                        Lihat
                                      </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => openDelete(row)}
                                      className="text-destructive"
                                    >
                                      <Trash2 className="w-4 h-4 mr-3" /> Hapus
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={12}
                            className="h-24 text-center text-sm text-muted-foreground"
                          >
                            Tidak ada data pending.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Menampilkan {pageRows.length ? start + 1 : 0}–
                    {Math.min(end, total)} dari {total} entri
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={!canPrev}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setPage((p) => (canNext ? p + 1 : p))}
                      disabled={!canNext}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Ajuan</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus ajuan "{deleteTarget?.title}"?
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!deleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={!!deleting}
              className="bg-destructive text-destructive-foreground"
            >
              {deleting ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ContentLayout>
  );
}

/* ====== Komponen kecil untuk 1 jenis dokumen (judul + aksi) ====== */
function DocRow({
  title,
  file,
  url,
  emptyClass = "text-muted-foreground"
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
          <a
            className="inline-flex items-center gap-1 text-blue-600 hover:underline"
            href={file.url}
            download={file.name || "dokumen.pdf"}
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

function MultiSelectScope({
  value,
  onChange,
  options = SCOPE_OPTIONS,
  placeholder = "Pilih lingkup…"
}: {
  value: string[];
  onChange: (next: string[]) => void;
  options?: string[];
  placeholder?: string;
}) {
  const toggle = (opt: string) => {
    onChange(
      value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt]
    );
  };

  const label = value.length ? `${value.length} dipilih` : placeholder;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          className="justify-between w-full"
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="truncate">{label}</span>
            {value.length > 0 && (
              <div className="hidden sm:flex gap-1">
                {value.slice(0, 3).map((v) => (
                  <Badge key={v} variant="secondary" className="text-[10px]">
                    {v}
                  </Badge>
                ))}
                {value.length > 3 && (
                  <span className="text-xs text-muted-foreground">
                    +{value.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-[260px] max-h-64 overflow-y-auto">
        {options.map((opt) => {
          const checked = value.includes(opt);
          return (
            <DropdownMenuCheckboxItem
              key={opt}
              checked={checked}
              onCheckedChange={() => toggle(opt)}
              className="cursor-pointer"
            >
              {opt}
            </DropdownMenuCheckboxItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** ========================================================================
 *  UnitDropdown: dropdown untuk memilih unit dari API
 *  ===================================================================== */
function UnitDropdown({
  value,
  onChange,
  placeholder = "Pilih Unit"
}: {
  value?: string;
  onChange: (unitId: string) => void;
  placeholder?: string;
}) {
  const [units, setUnits] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);

  // Load units from API
  useEffect(() => {
    const loadUnits = async () => {
      setLoading(true);
      try {
        const response = await unitAPI.getAllUnits();
        if (response.status === "success") {
          setUnits(response.data);
        } else {
          toast.error("Gagal memuat data unit");
        }
      } catch (error) {
        console.error("Failed to load units:", error);
        toast.error("Gagal memuat data unit");
      } finally {
        setLoading(false);
      }
    };

    loadUnits();
  }, []);

  const selectedUnit = units.find((unit) => unit.id === value);

  return (
    <Select
      value={selectedUnit ? selectedUnit.id : undefined}
      onValueChange={(v) => onChange(v)}
      disabled={loading}
    >
      <SelectTrigger className="w-full">
        <SelectValue
          placeholder={loading ? "Memuat..." : placeholder}
          aria-label={selectedUnit?.name || placeholder}
        />
      </SelectTrigger>
      <SelectContent>
        {units.length === 0 ? (
          <SelectItem value="__empty" disabled>
            {loading ? "Memuat..." : "Unit belum tersedia"}
          </SelectItem>
        ) : (
          units.map((unit) => (
            <SelectItem key={unit.id} value={unit.id}>
              {unit.name}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}

/** ========================================================================
 *  NewMOUButton: tambah entri baru (default Draft & Pending)
 *  ===================================================================== */
function NewMOUButton({
  onCreate,
  optionsRows
}: {
  onCreate: (m: Omit<MOU, "id">) => Promise<void> | void;
  optionsRows: MOU[];
}) {
  const [open, setOpen] = useState(false);

  const [level, setLevel] = useState<MOULevel | undefined>();
  const [documentNumber, setDocumentNumber] = useState("");
  const [title, setTitle] = useState("");
  const [entryDate, setEntryDate] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [unitId, setUnitId] = useState("");

  // ⬇️ ganti dari string ke array
  const [scopes, setScopes] = useState<string[]>(["Domestik", "Kabupaten"]);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [suratPermohonanUrl, setSuratPermohonanUrl] = useState("");
  const [proposalUrl, setProposalUrl] = useState("");
  const [draftAjuanUrl, setDraftAjuanUrl] = useState("");
  const [processStatus, setProcessStatus] = useState("Pengajuan Unit Ke LKI");
  const [approvalStatus, setApprovalStatus] = useState("Menunggu Persetujuan"); // default pending
  const [statusNote, setStatusNote] = useState("");
  const [fileUrl, setFileUrl] = useState("");

  // relasi (opsional)
  const [relatedSearch, setRelatedSearch] = useState("");
  const [relatedIds, setRelatedIds] = useState<string[]>([]);

  const canSave =
    level && title.trim() && entryDate && unitId.trim() && startDate && endDate;

  const toggleRelated = (id: string) => {
    setRelatedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const listFiltered = useMemo(() => {
    const t = relatedSearch.trim().toLowerCase();
    return optionsRows.filter((r) => {
      const textMatch =
        !t ||
        [r.id, r.title, r.level, r.documentNumber]
          .join(" ")
          .toLowerCase()
          .includes(t);
      const typeMatch = level ? r.level !== level : true; // tidak boleh relasi ke jenis yg sama
      return textMatch && typeMatch;
    });
  }, [optionsRows, relatedSearch, level]);

  const handleSave = async () => {
    if (!canSave) return;

    const sanitizedRelated = relatedIds.filter((id) => {
      const r = optionsRows.find((x) => x.id === id);
      if (!r) return false;
      if (!level) return true;
      return r.level !== level;
    });

    const payload: Omit<MOU, "id"> = {
      level: level!,
      documentNumber: documentNumber.trim(),
      title: title.trim(),
      entryDate,
      partner: "—",
      partnerType: "Universitas",
      partnerInfo: {
        phone: phone.trim() || undefined,
        email: email.trim() || undefined
      },
      country: "Indonesia",
      faculty: unitId.trim(),
      unit: unitId.trim(),

      // ⬇️ pakai array langsung
      scope: scopes,

      category: "Cooperation",
      department: "-",
      owner: "-",
      startDate,
      endDate,
      status: "Draft", // default Draft di halaman ajuan
      documents: {
        suratPermohonanUrl: suratPermohonanUrl.trim() || null,
        proposalUrl: proposalUrl.trim() || null,
        draftAjuanUrl: draftAjuanUrl.trim() || null
      },
      processStatus: processStatus.trim() || undefined,
      approvalStatus:
        (approvalStatus || "Menunggu Persetujuan").trim() ||
        "Menunggu Persetujuan",
      statusNote: statusNote.trim() || undefined,
      fileUrl: fileUrl.trim() || undefined,

      value: undefined,
      signDate: undefined,
      studyProgram: undefined,
      notes: undefined,

      relatedIds: sanitizedRelated.length ? sanitizedRelated : undefined
    };

    try {
      await onCreate(payload);
      setOpen(false);
    } catch (err) {
      // leave open to show error
      console.error("Create failed", err);
    }
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
              <Select
                value={level}
                onValueChange={(v) => setLevel(v as MOULevel)}
              >
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
              <Input
                placeholder="mis. 001/MOA/FT/2025"
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
              />
            </div>
          </div>

          {/* Tentang */}
          <div className="grid gap-2">
            <label className="text-sm font-medium">Tentang</label>
            <Input
              placeholder="Judul/Perihal Kerjasama"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Tanggal Entry + Masa Berlaku */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Tanggal Entry</label>
              <Input
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Mulai</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Selesai</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Info Partner */}
          <div className="grid gap-2">
            <label className="text-sm font-medium">Info Partner</label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Input
                placeholder="Telepon/HP Pengaju"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <Input
                placeholder="Email Pengaju"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Unit + Lingkup (Multi-select) */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Unit</label>
              <UnitDropdown value={unitId} onChange={setUnitId} />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Lingkup</label>
              <MultiSelectScope value={scopes} onChange={setScopes} />
              <div className="text-xs text-muted-foreground">
                Bisa pilih lebih dari satu.
              </div>
            </div>
          </div>

          {/* Status Proses + Persetujuan */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Status Proses</label>
              <Input
                value={processStatus}
                onChange={(e) => setProcessStatus(e.target.value)}
              />
              <div className="text-xs text-muted-foreground">
                Contoh: Pengajuan Unit Ke LKI
              </div>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Status Persetujuan</label>
              <Input
                value={approvalStatus}
                onChange={(e) => setApprovalStatus(e.target.value)}
              />
              <div className="text-xs text-muted-foreground">
                Biarkan "Menunggu Persetujuan" untuk pending.
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Catatan Status</label>
            <Textarea
              rows={2}
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
            />
          </div>

          {/* Lampiran umum (URL) */}
          <div className="grid gap-2">
            <label className="text-sm font-medium">
              Lampiran Umum (URL) — link pada kolom “Tentang”
            </label>
            <Input
              placeholder="https://.../dokumen.pdf"
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
            />
          </div>

          {/* Relasi (opsional) */}
          <div className="grid gap-3 border-t pt-4">
            <label className="text-sm font-semibold">
              Hubungkan dengan dokumen lain (opsional)
            </label>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <Input
                placeholder="Cari ID/Judul/Jenis…"
                value={relatedSearch}
                onChange={(e) => setRelatedSearch(e.target.value)}
                className="w-full sm:max-w-sm"
              />
              <span className="text-xs text-muted-foreground sm:ml-auto">
                Bisa pilih lebih dari satu
              </span>
            </div>

            <div className="rounded-md border">
              <ul className="max-h-64 overflow-y-auto divide-y">
                {listFiltered.length === 0 ? (
                  <li className="p-3 text-xs text-muted-foreground">
                    Tidak ada kandidat.
                  </li>
                ) : (
                  listFiltered.map((item) => {
                    const checked = relatedIds.includes(item.id);
                    return (
                      <li key={item.id} className="hover:bg-muted/50">
                        <label className="grid grid-cols-[auto,1fr] items-start gap-3 p-2 cursor-pointer">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => toggleRelated(item.id)}
                            className="mt-0.5 h-4 w-4"
                            aria-label={`Pilih ${item.id}`}
                          />
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="secondary" className="shrink-0">
                                {item.level}
                              </Badge>
                              <span className="font-medium shrink-0">
                                {item.id}
                              </span>
                              <span className="text-muted-foreground truncate sm:whitespace-normal sm:truncate-0">
                                — {item.title}
                              </span>
                            </div>
                            <div className="mt-0.5 text-[11px] text-muted-foreground">
                              {item.documentNumber || "Tanpa nomor dokumen"}
                            </div>
                          </div>
                        </label>
                      </li>
                    );
                  })
                )}
              </ul>
            </div>

            {relatedIds.length > 0 && (
              <div className="pt-2">
                <div className="text-xs mb-1 text-muted-foreground">
                  Terpilih:
                </div>
                <div className="flex flex-wrap gap-1">
                  {relatedIds.map((id) => {
                    const r = optionsRows.find((x) => x.id === id);
                    if (!r) return null;
                    return (
                      <Badge key={id} variant="outline" className="text-xs">
                        {r.level}-{id.split("-")[1] ?? id}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}
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
