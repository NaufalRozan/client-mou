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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";

import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";

import {
  Search,
  FileSignature,
  ChevronLeft,
  ChevronRight,
  Eye,
  ChevronsUpDown,
  MoreHorizontal,
  Trash2
} from "lucide-react";

import { getAuth, isAuthed, type AuthUser } from "@/lib/proto/auth";
import {
  kerjasamaAPI,
  type AjuanAllowedAction,
  type AjuanReviewLog,
  type AjuanStatus,
  type KerjasamaRequest
} from "@/lib/api/kerjasama";
import { unitAPI } from "@/lib/api/unit";
import { authAPI } from "@/lib/api/auth";
import { toast } from "sonner";
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
type Role =
  | "LEMBAGA_KERJA_SAMA"
  | "FAKULTAS"
  | "PRODI"
  | "ORANG_LUAR"
  | "WR"
  | "DKG"
  | "DKGE"
  | "BLK";

/* ================= Types ================= */
type FlowStatus = AjuanStatus;
type MOUStatus =
  | FlowStatus
  | "Draft"
  | "Active"
  | "Expiring"
  | "Expired"
  | "Terminated";
type AllowedAction = AjuanAllowedAction;
type MOULevel = "MOU" | "MOA" | "IA";
type PartnerType =
  | "Universitas"
  | "Industri"
  | "Pemerintah"
  | "Organisasi"
  | "Dudika";

type PartnerInfo = {
  phone?: string;
  email?: string;
  contactName?: string;
  contactTitle?: string;
  contactWhatsapp?: string;
  website?: string;
};

type DocFile = { name: string; url: string } | null;

type Documents = {
  suratPermohonanUrl?: string | null;
  proposalUrl?: string | null;
  draftAjuanUrl?: string | null;
  reviewUrl?: string | null;
  reviewFile?: DocFile;
  suratPermohonanFile?: DocFile;
  proposalFile?: DocFile;
  draftAjuanFile?: DocFile;
};

type InstitutionAddress = {
  province?: string;
  city?: string;
  country?: string;
};

type ReviewLog = AjuanReviewLog;

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
  institutionAddress?: InstitutionAddress;
  durationYears?: number | null;
  persetujuanDekan?: boolean | null;
  processStatus?: string;
  approvalStatus?: string; // "Disetujui" = sudah ACC WR
  statusNote?: string;
  fileUrl?: string;
  notes?: string;
  relatedIds?: string[];
  // Flow-related fields
  flowStatus?: FlowStatus;
  returnToStatus?: FlowStatus | null;
  revisionRequestedBy?: string | null;
  allowedActions?: AllowedAction[];
  reviewHistory?: ReviewLog[];
  submittedAt?: string | null;
  resubmittedAt?: string | null;
  completedAt?: string | null;
  pengajuRole?: string | null;
};

/* ============== Helpers ============== */
const fmtDate = (iso: string) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(iso));

const FLOW_STATUS_LABEL: Record<FlowStatus, string> = {
  DRAFT: "Draft",
  PENGAJUAN_DOKUMEN: "Pengajuan Dokumen",
  VERIFIKASI_FAKULTAS: "Verifikasi Fakultas",
  REVIEW_DKG: "Review DKG",
  REVIEW_DKGE: "Review DKGE",
  REVIEW_WR: "Review WR",
  REVIEW_BLK: "Review BLK",
  REVISI: "Revisi",
  SELESAI: "Selesai"
};

const formatFlowStatus = (status?: FlowStatus | string | null) => {
  if (!status) return "-";
  const upper = status.toUpperCase() as FlowStatus;
  return FLOW_STATUS_LABEL[upper] || status;
};

const FLOW_STATUS_OPTIONS: { value: FlowStatus; label: string }[] = [
  { value: "DRAFT", label: FLOW_STATUS_LABEL.DRAFT },
  { value: "PENGAJUAN_DOKUMEN", label: FLOW_STATUS_LABEL.PENGAJUAN_DOKUMEN },
  { value: "VERIFIKASI_FAKULTAS", label: FLOW_STATUS_LABEL.VERIFIKASI_FAKULTAS },
  { value: "REVIEW_DKG", label: FLOW_STATUS_LABEL.REVIEW_DKG },
  { value: "REVIEW_DKGE", label: FLOW_STATUS_LABEL.REVIEW_DKGE },
  { value: "REVIEW_WR", label: FLOW_STATUS_LABEL.REVIEW_WR },
  { value: "REVIEW_BLK", label: FLOW_STATUS_LABEL.REVIEW_BLK },
  { value: "REVISI", label: FLOW_STATUS_LABEL.REVISI },
  { value: "SELESAI", label: FLOW_STATUS_LABEL.SELESAI }
];

const PARTNER_TYPE_OPTIONS: PartnerType[] = ["Universitas", "Dudika"];
const LINGKUP_OPTIONS = ["Nasional", "Internasional"] as const;
const PROCESS_OPTIONS = [
  "Pengajuan",
  "Review DKGE",
  "Review WR",
  "Review BLK",
  "Revisi",
  "Selesai"
] as const;
const DURATION_OPTIONS = [1, 2, 3, 4, 5];

const PROVINCES: Array<{ name: string; cities: string[] }> = [
  {
    name: "DI Yogyakarta",
    cities: ["Yogyakarta", "Sleman", "Bantul", "Kulon Progo", "Gunungkidul"]
  },
  { name: "DKI Jakarta", cities: ["Jakarta Pusat", "Jakarta Barat", "Jakarta Selatan", "Jakarta Timur", "Jakarta Utara"] },
  { name: "Jawa Barat", cities: ["Bandung", "Bekasi", "Depok", "Bogor"] },
  { name: "Jawa Tengah", cities: ["Semarang", "Surakarta", "Magelang"] },
  { name: "Jawa Timur", cities: ["Surabaya", "Malang", "Kediri", "Sidoarjo"] }
];

const COUNTRIES = [
  "Malaysia",
  "Singapore",
  "Thailand",
  "Australia",
  "United Kingdom",
  "United States",
  "Japan",
  "Saudi Arabia"
];

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

const todayISO = () => new Date().toISOString().slice(0, 10);

const calcEndDateFromDuration = (start: string, years: number) => {
  if (!start || Number.isNaN(years)) return "";
  const startDate = new Date(start);
  if (Number.isNaN(startDate.getTime())) return "";
  const end = new Date(startDate);
  end.setFullYear(end.getFullYear() + years);
  end.setDate(end.getDate() - 1);
  return end.toISOString().slice(0, 10);
};

const getDateParts = (value?: string) => {
  const parsed = value ? new Date(value) : new Date();
  const date = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return { year, month, day, dateOnly: `${year}-${month}-${day}` };
};

const generateDocumentNumber = (
  level?: MOULevel,
  entryDate?: string,
  existing: MOU[] = []
) => {
  if (!level) return "";
  const { year, month, day, dateOnly } = getDateParts(entryDate);
  const sequence =
    existing.filter((item) => {
      if (item.level !== level) return false;
      const itemDate = item.entryDate
        ? getDateParts(item.entryDate).dateOnly
        : "";
      return itemDate === dateOnly;
    }).length + 1;

  return `${level}/${year}/${month}/${day}/${String(sequence).padStart(3, "0")}`;
};

const extractUnitMeta = (user: AuthUser | null) => {
  if (!user) return {};
  const unitArr = Array.isArray(user.unit) ? user.unit : [];
  const primaryUnit = unitArr[0];
  const anyUser = user as Record<string, any>;
  const unitId =
    user.unitId ||
    primaryUnit?.id ||
    anyUser.unit_id ||
    anyUser.unitCode ||
    anyUser.unit;
  const unitName =
    user.unitName || primaryUnit?.name || anyUser.unit_name || anyUser.unit;
  const facultyName =
    user.facultyName ||
    primaryUnit?.categoryId ||
    anyUser.fakultas ||
    anyUser.faculty ||
    "";
  const studyProgramName =
    user.studyProgramName ||
    (primaryUnit?.isUnit ? primaryUnit.name : undefined) ||
    anyUser.studyProgramName ||
    anyUser.programStudi ||
    anyUser.prodi ||
    anyUser.studyProgram ||
    "";

  return {
    unitId: unitId as string | undefined,
    unitName: unitName as string | undefined,
    facultyName: facultyName as string | undefined,
    studyProgramName: studyProgramName as string | undefined
  };
};

// Build payload for create so optional fields become nullish/empty safely
const buildCreatePayload = (m: Omit<MOU, "id">): KerjasamaRequest => ({
  unitId: normalizeOptionalText(m.unit || m.faculty) || "unknown",
  jenis: m.level,
  jenisMitra: normalizeOptionalText(m.partnerType),
  nomorDokumen: normalizeOptionalText(m.documentNumber),
  judul: m.title.trim(),
  tanggalEntry: normalizeIsoDate(m.entryDate) || new Date().toISOString(),
  tanggalMulai: normalizeIsoDate(m.startDate) || new Date().toISOString(),
  tanggalBerakhir: normalizeIsoDate(m.endDate) || new Date().toISOString(),
  teleponPengaju:
    normalizeOptionalText(
      m.partnerInfo?.contactWhatsapp || m.partnerInfo?.phone
    ),
  emailPengaju: normalizeOptionalText(m.partnerInfo?.email),
  lingkup: m.scope.length ? m.scope[0] : undefined,
  namaInstitusi: normalizeOptionalText(m.partner),
  alamatProvinsi: normalizeOptionalText(m.institutionAddress?.province),
  alamatKota: normalizeOptionalText(m.institutionAddress?.city),
  alamatNegara: normalizeOptionalText(m.institutionAddress?.country),
  kontakNama: normalizeOptionalText(m.partnerInfo?.contactName),
  kontakJabatan: normalizeOptionalText(m.partnerInfo?.contactTitle),
  kontakEmail: normalizeOptionalText(m.partnerInfo?.email),
  kontakWA: normalizeOptionalText(m.partnerInfo?.contactWhatsapp),
  kontakWebsite: normalizeOptionalText(m.partnerInfo?.website),
  durasiKerjasama: m.durationYears ?? undefined,
  // Upload dokumen hanya dilakukan saat edit, tidak saat create
  lampiranURL: undefined,
  pdfReviewURL: undefined,
  persetujuanDekan:
    typeof m.persetujuanDekan === "boolean" ? m.persetujuanDekan : undefined,
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

/* ============== Dummy data awal (contoh) ============== */
const initialData: MOU[] = [
  {
    id: "AJ-001",
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
    status: "REVIEW_DKG",
    flowStatus: "REVIEW_DKG",
    documents: {
      suratPermohonanUrl: "/dokumen/mou-001-surat.pdf",
      proposalUrl: "/dokumen/mou-001-proposal.pdf",
      draftAjuanUrl: null
    },
    processStatus: "Menunggu review DKG",
    approvalStatus: "Menunggu Review",
    statusNote: "Menunggu review DKG",
    relatedIds: [],
    allowedActions: ["approve", "request_revision"],
    submittedAt: "2025-07-10T07:00:00.000Z",
    resubmittedAt: null,
    completedAt: null,
    returnToStatus: null,
    revisionRequestedBy: null,
    pengajuRole: "PRODI",
    reviewHistory: [
      {
        stageStatus: "VERIFIKASI_FAKULTAS",
        action: "APPROVE",
        note: "Verifikasi Fakultas selesai",
        actorRole: "FAKULTAS",
        createdAt: "2025-07-12T07:00:00.000Z"
      }
    ]
  },
  {
    id: "AJ-002",
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
    status: "REVISI",
    flowStatus: "REVISI",
    documents: {
      suratPermohonanUrl: "/dokumen/surat-permohonan.pdf",
      proposalUrl: null,
      draftAjuanUrl: "https://contoh.com/preview-draf-ajuan",
      draftAjuanFile: {
        name: "draf-ajuan-contoh.pdf",
        url: "/dokumen/draf-ajuan-contoh.pdf"
      }
    },
    processStatus: "Diminta revisi WR",
    approvalStatus: "Menunggu Resubmit",
    statusNote: "Lengkapi lampiran A",
    relatedIds: ["AJ-001"],
    allowedActions: ["edit", "resubmit"],
    returnToStatus: "REVIEW_WR",
    revisionRequestedBy: "WR",
    submittedAt: "2025-08-30T03:00:00.000Z",
    resubmittedAt: null,
    completedAt: null,
    reviewHistory: [
      {
        stageStatus: "REVIEW_WR",
        action: "REQUEST_REVISION",
        note: "Lengkapi lampiran A",
        actorRole: "WR",
        createdAt: "2025-08-30T03:00:00.000Z"
      }
    ]
  },
  {
    id: "AJ-003",
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
    status: "DRAFT",
    flowStatus: "DRAFT",
    documents: {
      suratPermohonanUrl: null,
      proposalUrl: null,
      draftAjuanUrl: null
    },
    processStatus: "Draft",
    approvalStatus: "Belum Disetujui",
    statusNote: "Menunggu submit",
    relatedIds: ["AJ-001"],
    allowedActions: ["submit", "edit"],
    submittedAt: null,
    resubmittedAt: null,
    completedAt: null,
    returnToStatus: null,
    revisionRequestedBy: null
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
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [unitMap, setUnitMap] = useState<Record<string, string>>({});

  // filters
  const [q, setQ] = useState("");
  const [flowStatusFilter, setFlowStatusFilter] = useState<FlowStatus | "all">(
    "all"
  );
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
    setAuthUser(u);

    // refresh profile to ensure unit/prodi populated
    authAPI
      .fetchProfileAndStore()
      .then((profile) => {
        if (profile) {
          setAuthUser(profile);
          setRole(profile.role ?? null);
        }
      })
      .catch((err) => {
        console.warn("Profile refresh failed:", err);
      });

    const onStorage = (e: StorageEvent) => {
      if (e.key === "proto_auth" || e.key === "auth_user") {
        const next = getAuth();
        setRole(next?.role ?? null);
        setAuthUser(next);
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

      const res = await kerjasamaAPI.getAllAjuan();
      if (res.status === "success") {
        // map backend kerjasama to frontend MOU type
        const mapped = res.data.map(
          (k) =>
          ({
            flowStatus:
              (k.status as FlowStatus) ||
              (k.statusProses as FlowStatus) ||
              ((k.statusDokumen || "").toUpperCase() as FlowStatus) ||
              "DRAFT",
            returnToStatus:
              ((k as any).returnToStatus ??
                (k as any).return_to_status ??
                null) as FlowStatus | null,
            revisionRequestedBy:
              ((k as any).revisionRequestedBy ??
                (k as any).revision_requested_by ??
                null) as string | null,
            allowedActions:
              ((k as any).allowed_actions as AllowedAction[]) ||
              ((k as any).allowedActions as AllowedAction[]) ||
              [],
            reviewHistory:
              ((k as any).review_history as ReviewLog[]) ||
              ((k as any).reviewHistory as ReviewLog[]) ||
              [],
            submittedAt:
              ((k as any).submittedAt as string | null) ||
              ((k as any).submitted_at as string | null) ||
              null,
            resubmittedAt:
              ((k as any).resubmittedAt as string | null) ||
              ((k as any).resubmitted_at as string | null) ||
              null,
            completedAt:
              ((k as any).completedAt as string | null) ||
              ((k as any).completed_at as string | null) ||
              null,
            pengajuRole:
              (k as any).pengajuRole || (k as any).pengaju_role || null,
            id: k.id,
            level: (k.jenis as MOULevel) || "MOU",
            documentNumber: k.nomorDokumen || "",
            title: k.judul || "-",
            entryDate: k.tanggalEntry || new Date().toISOString(),
            partner: k.namaInstitusi || "-",
            partnerType:
              (k.jenisMitra as PartnerType) || ("Universitas" as PartnerType),
            country: k.alamatNegara || "Indonesia",
            faculty: k.unitId || "",
            unit: k.unitId || "",
            scope: k.lingkup
              ? k.lingkup.split(",").map((s) => s.trim()).filter(Boolean)
              : ["Nasional"],
            category: "Cooperation" as MOU["category"],
            department: "-",
            owner: "-",
            startDate: k.tanggalMulai || new Date().toISOString(),
            endDate: k.tanggalBerakhir || new Date().toISOString(),
            status:
              ((k.statusDokumen || "") as MOUStatus) ||
              (((k as any).status as FlowStatus) as MOUStatus) ||
              "Draft",
            partnerInfo: {
              phone: k.teleponPengaju || undefined,
              email: k.emailPengaju || undefined,
              contactName: k.kontakNama || undefined,
              contactTitle: k.kontakJabatan || undefined,
              contactWhatsapp: k.kontakWA || undefined,
              website: k.kontakWebsite || undefined
            },
            institutionAddress: {
              province: k.alamatProvinsi || undefined,
              city: k.alamatKota || undefined,
              country: k.alamatNegara || undefined
            },
            durationYears: k.durasiKerjasama ?? null,
            persetujuanDekan: k.persetujuanDekan ?? null,
            documents: {
              reviewUrl: k.pdfReviewURL || undefined
            },
            processStatus: k.statusProses || formatFlowStatus(k.status as any),
            approvalStatus: k.statusPersetujuan,
            statusNote:
              k.catatanStatus ||
              ((((k as any).review_history ||
                (k as any).reviewHistory ||
                []) as ReviewLog[])
                .slice()
                .reverse()
                .find((r) => r?.note)?.note ?? undefined),
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
    return rows.filter((d) => {
      const flow = (d.flowStatus ||
        (typeof d.status === "string"
          ? (d.status.toUpperCase() as FlowStatus)
          : undefined)) as FlowStatus | undefined;
      const isFinished = flow === "SELESAI";
      const isDisetujui =
        (d.approvalStatus || "").toLowerCase() === "disetujui";
      return !isFinished && !isDisetujui;
    });
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

      const currentFlow = (d.flowStatus ||
        (typeof d.status === "string" ? d.status.toUpperCase() : undefined)) as
        | FlowStatus
        | undefined;
      const matchStatus =
        flowStatusFilter === "all" || currentFlow === flowStatusFilter;
      const matchLevel = level === "all" || d.level === level;

      return matchQ && matchStatus && matchLevel;
    });
  }, [pendingRows, q, flowStatusFilter, level]);

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
      const msg =
        (error as Error)?.message || "Gagal membuat ajuan, periksa kembali data.";
      toast.error(msg);
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
      if (m.partnerType !== undefined)
        payload.jenisMitra = normalizeOptionalText(m.partnerType);
      if (m.documentNumber !== undefined)
        payload.nomorDokumen = normalizeOptionalText(m.documentNumber);
      if (m.title !== undefined) payload.judul = m.title.trim();
      if (m.entryDate !== undefined)
        payload.tanggalEntry = normalizeIsoDate(m.entryDate);
      if (m.startDate !== undefined)
        payload.tanggalMulai = normalizeIsoDate(m.startDate);
      if (m.endDate !== undefined)
        payload.tanggalBerakhir = normalizeIsoDate(m.endDate);
      if (m.partnerInfo?.phone !== undefined)
        payload.teleponPengaju =
          normalizeOptionalText(m.partnerInfo.phone);
      if (m.partnerInfo?.email !== undefined)
        payload.emailPengaju =
          normalizeOptionalText(m.partnerInfo.email);
      if (m.scope)
        payload.lingkup = m.scope.length ? m.scope[0] : undefined;
      if (m.partner !== undefined)
        payload.namaInstitusi = normalizeOptionalText(m.partner);
      if (m.institutionAddress?.province !== undefined)
        payload.alamatProvinsi =
          normalizeOptionalText(m.institutionAddress.province);
      if (m.institutionAddress?.city !== undefined)
        payload.alamatKota =
          normalizeOptionalText(m.institutionAddress.city);
      if (m.institutionAddress?.country !== undefined)
        payload.alamatNegara =
          normalizeOptionalText(m.institutionAddress.country);
      if (m.partnerInfo?.contactName !== undefined)
        payload.kontakNama =
          normalizeOptionalText(m.partnerInfo.contactName);
      if (m.partnerInfo?.contactTitle !== undefined)
        payload.kontakJabatan =
          normalizeOptionalText(m.partnerInfo.contactTitle);
      if (m.partnerInfo?.email !== undefined)
        payload.kontakEmail =
          normalizeOptionalText(m.partnerInfo.email);
      if (m.partnerInfo?.contactWhatsapp !== undefined)
        payload.kontakWA =
          normalizeOptionalText(m.partnerInfo.contactWhatsapp);
      if (m.partnerInfo?.website !== undefined)
        payload.kontakWebsite =
          normalizeOptionalText(m.partnerInfo.website);
      if (m.durationYears !== undefined)
        payload.durasiKerjasama = m.durationYears ?? undefined;
      // Upload dokumen (lampiranURL & pdfReviewURL) bisa di-update saat edit
      if (m.fileUrl !== undefined)
        payload.lampiranURL = normalizeOptionalText(m.fileUrl);
      if (m.documents?.reviewUrl !== undefined)
        payload.pdfReviewURL =
          normalizeOptionalText(m.documents?.reviewUrl || undefined);
      if (m.persetujuanDekan !== undefined)
        payload.persetujuanDekan = m.persetujuanDekan ?? undefined;
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
                  setFlowStatusFilter(v as any);
                }}
                defaultValue="all"
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua status</SelectItem>
                  {FLOW_STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline">Filter Lanjutan</Button>

              {canCreate ? (
                <NewMOUButton
                  onCreate={handleCreate}
                  optionsRows={rows}
                  currentUser={authUser}
                />
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
                  <Table className="min-w-[960px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">No</TableHead>
                        <TableHead>Tentang</TableHead>
                        <TableHead>Jenis</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Catatan</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {pageRows.length ? (
                        pageRows.map((row, idx) => {
                          const flow = (row.flowStatus ||
                            (typeof row.status === "string"
                              ? (row.status.toUpperCase() as FlowStatus)
                              : undefined)) as FlowStatus | undefined;
                          const related = (row.relatedIds || [])
                            .map((id) => rows.find((r) => r.id === id))
                            .filter(Boolean) as MOU[];
                          const lastReviewEntry = (row.reviewHistory || [])
                            .slice()
                            .sort((a, b) => {
                              const aTime = new Date(
                                a?.createdAt || ""
                              ).getTime();
                              const bTime = new Date(
                                b?.createdAt || ""
                              ).getTime();
                              return aTime - bTime;
                            })
                            .at(-1);
                          const lastNote =
                            lastReviewEntry?.note || row.statusNote || "-";

                          return (
                            <TableRow key={row.id} className="align-top">
                              <TableCell>{start + idx + 1}</TableCell>

                              <TableCell>
                                <div className="space-y-1">
                                  <Link
                                    className="font-semibold text-blue-600 hover:underline"
                                    href={`/data-ajuan/${encodeURIComponent(
                                      row.id
                                    )}`}
                                  >
                                    {row.title}
                                  </Link>
                                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                    <span>
                                      Institusi:{" "}
                                      {row.partner && row.partner !== "—"
                                        ? row.partner
                                        : "-"}
                                    </span>
                                    <span className="hidden sm:inline">•</span>
                                    <span>Diajukan {fmtDate(row.entryDate)}</span>
                                  </div>
                                  <div className="text-[11px] text-muted-foreground">
                                    ID: {row.id}
                                  </div>
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
                                  <Badge variant="secondary">{row.level}</Badge>
                                  <div className="text-xs text-muted-foreground">
                                    {row.documentNumber ||
                                      "Belum Masuk " + row.level}
                                  </div>
                                </div>
                              </TableCell>

                              <TableCell>
                                <div className="text-sm">
                                  {unitMap[row.unit || row.faculty || ""] ||
                                    row.faculty ||
                                    row.unit ||
                                    "-"}
                                </div>
                              </TableCell>

                              <TableCell className="text-sm">
                                <div className="space-y-2">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Badge variant="secondary">
                                      {formatFlowStatus(flow)}
                                    </Badge>
                                    {row.returnToStatus ? (
                                      <Badge variant="outline" className="text-xs">
                                        Kembali ke{" "}
                                        {formatFlowStatus(row.returnToStatus)}
                                      </Badge>
                                    ) : null}
                                  </div>
                                  {row.processStatus ? (
                                    <div className="text-xs text-muted-foreground">
                                      {row.processStatus}
                                    </div>
                                  ) : null}
                                  {row.approvalStatus ? (
                                    <div className="text-xs text-muted-foreground">
                                      Persetujuan: {row.approvalStatus}
                                    </div>
                                  ) : null}
                                  {row.revisionRequestedBy ? (
                                    <div className="text-xs text-amber-700">
                                      Revisi oleh {row.revisionRequestedBy}
                                    </div>
                                  ) : null}
                                </div>
                              </TableCell>

                              <TableCell className="text-sm">
                                <div className="space-y-1">
                                  {lastReviewEntry ? (
                                    <>
                                      <div className="flex items-center gap-2">
                                        <Badge variant="outline">
                                          {formatFlowStatus(
                                            (lastReviewEntry.stageStatus ||
                                              row.flowStatus) as FlowStatus
                                          )}
                                        </Badge>
                                        {lastReviewEntry.actorRole ? (
                                          <span className="text-xs text-muted-foreground">
                                            {lastReviewEntry.actorRole}
                                          </span>
                                        ) : null}
                                      </div>
                                      <div>{lastNote}</div>
                                    </>
                                  ) : (
                                    <span>{lastNote}</span>
                                  )}
                                </div>
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
                            colSpan={7}
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
              Apakah Anda yakin ingin menghapus ajuan {deleteTarget?.title}?
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
 *  NewMOUButton: tambah entri baru (default Draft & Pending)
 *  ===================================================================== */
function NewMOUButton({
  onCreate,
  optionsRows,
  currentUser
}: {
  onCreate: (m: Omit<MOU, "id">) => Promise<void> | void;
  optionsRows: MOU[];
  currentUser: AuthUser | null;
}) {
  const [open, setOpen] = useState(false);

  const [level, setLevel] = useState<MOULevel | undefined>();
  const [documentNumber, setDocumentNumber] = useState("");
  const [title, setTitle] = useState("");
  const [entryDate, setEntryDate] = useState(todayISO());

  const [partnerType, setPartnerType] =
    useState<PartnerType>("Universitas");
  const [lingkup, setLingkup] =
    useState<(typeof LINGKUP_OPTIONS)[number]>("Nasional");
  const [institutionName, setInstitutionName] = useState("");
  const [address, setAddress] = useState<InstitutionAddress>({});
  const [contactName, setContactName] = useState("");
  const [contactTitle, setContactTitle] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactWhatsapp, setContactWhatsapp] = useState("");
  const [contactWebsite, setContactWebsite] = useState("");

  const [unitId, setUnitId] = useState("");
  const [unitMeta, setUnitMeta] = useState<{ studyProgramName?: string }>({});
  const [hasDeanApproval, setHasDeanApproval] = useState(
    currentUser?.role !== "PRODI"
  );

  const [startDate, setStartDate] = useState("");
  const [durationYears, setDurationYears] = useState<number>(1);
  const [endDate, setEndDate] = useState("");

  const [processStatus, setProcessStatus] =
    useState<(typeof PROCESS_OPTIONS)[number]>("Pengajuan");

  // relasi (opsional)
  const [relatedSearch, setRelatedSearch] = useState("");
  const [relatedIds, setRelatedIds] = useState<string[]>([]);

  const isProdi = currentUser?.role === "PRODI";

  useEffect(() => {
    setHasDeanApproval(currentUser?.role !== "PRODI");
    const meta = extractUnitMeta(currentUser);
    setUnitMeta((prev) => ({
      studyProgramName: meta.studyProgramName || prev.studyProgramName
    }));

    if (meta.unitId && !unitId) {
      setUnitId(meta.unitId);
    }
  }, [currentUser, unitId]);

  useEffect(() => {
    if (!open) return;
    setEntryDate((prev) => prev || todayISO());
  }, [open]);

  useEffect(() => {
    setEndDate(calcEndDateFromDuration(startDate, durationYears));
  }, [startDate, durationYears]);

  useEffect(() => {
    if (!open || !level) return;
    const nextDocNumber = generateDocumentNumber(level, entryDate, optionsRows);
    setDocumentNumber(nextDocNumber);
  }, [open, level, entryDate, optionsRows]);

  useEffect(() => {
    setAddress((prev) => {
      if (lingkup === "Nasional") {
        return { province: prev.province || "", city: prev.city || "" };
      }
      return { country: prev.country || "" };
    });
  }, [lingkup]);

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
      const typeMatch = level ? r.level !== level : true;
      return textMatch && typeMatch;
    });
  }, [optionsRows, relatedSearch, level]);

  const hasAddress =
    lingkup === "Nasional"
      ? Boolean((address.province || "").trim() && (address.city || "").trim())
      : Boolean((address.country || "").trim());

  const hasDocumentNumber = documentNumber.trim().length > 0;
  const canSave =
    level &&
    hasDocumentNumber &&
    title.trim() &&
    entryDate &&
    unitId.trim() &&
    startDate &&
    endDate &&
    institutionName.trim() &&
    contactName.trim() &&
    contactTitle.trim() &&
    contactEmail.trim() &&
    hasAddress &&
    (!isProdi || hasDeanApproval);

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
      partner: institutionName.trim(),
      partnerType,
      partnerInfo: {
        phone: contactWhatsapp.trim() || undefined,
        email: contactEmail.trim() || undefined,
        contactName: contactName.trim() || undefined,
        contactTitle: contactTitle.trim() || undefined,
        contactWhatsapp: contactWhatsapp.trim() || undefined,
        website: contactWebsite.trim() || undefined
      },
      country: lingkup === "Nasional" ? "Indonesia" : address.country || "",
      faculty: unitId.trim(),
      unit: unitId.trim(),
      scope: [lingkup],
      category: "Cooperation",
      department: "-",
      owner: "-",
      startDate,
      endDate,
      status: "DRAFT",
      flowStatus: "DRAFT",
      // Dokumen tidak di-upload saat create, hanya saat edit
      documents: undefined,
      institutionAddress: address,
      durationYears,
      persetujuanDekan: hasDeanApproval,
      processStatus: processStatus.trim() || undefined,
      approvalStatus: isProdi
        ? "Disetujui Dekan"
        : "Menunggu Persetujuan",
      statusNote: undefined,
      fileUrl: undefined, // Upload dokumen hanya di edit
      value: undefined,
      signDate: undefined,
      studyProgram: unitMeta.studyProgramName,
      notes:
        lingkup === "Nasional"
          ? [address.city, address.province].filter(Boolean).join(", ")
          : address.country,
      relatedIds: sanitizedRelated.length ? sanitizedRelated : undefined
    };

    try {
      await onCreate(payload);
      setOpen(false);
    } catch (err) {
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
          <div className="text-sm font-semibold">
            Detail informasi institusi
          </div>

          {/* Jenis mitra + Lingkup */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Jenis Mitra</label>
              <Select
                value={partnerType}
                onValueChange={(v) => setPartnerType(v as PartnerType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jenis mitra" />
                </SelectTrigger>
                <SelectContent>
                  {PARTNER_TYPE_OPTIONS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Lingkup</label>
              <Select
                value={lingkup}
                onValueChange={(v) =>
                  setLingkup(v as (typeof LINGKUP_OPTIONS)[number])
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih lingkup" />
                </SelectTrigger>
                <SelectContent>
                  {LINGKUP_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Nama Institusi */}
          <div className="grid gap-2">
            <label className="text-sm font-medium">
              Nama Institusi <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="Contoh: Universitas Teknologi Nusantara"
              value={institutionName}
              onChange={(e) => setInstitutionName(e.target.value)}
            />
          </div>

          {/* Alamat */}
          <div className="grid gap-3">
            <label className="text-sm font-medium">
              Alamat Institusi <span className="text-destructive">*</span>
            </label>
            {lingkup === "Nasional" ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Select
                  value={address.province}
                  onValueChange={(v) =>
                    setAddress((prev) => ({ ...prev, province: v, city: "" }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih provinsi" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVINCES.map((p) => (
                      <SelectItem key={p.name} value={p.name}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={address.city}
                  onValueChange={(v) =>
                    setAddress((prev) => ({ ...prev, city: v }))
                  }
                  disabled={!address.province}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kota/kabupaten" />
                  </SelectTrigger>
                  <SelectContent>
                    {(PROVINCES.find((p) => p.name === address.province)
                      ?.cities || []
                    ).map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <Select
                value={address.country}
                onValueChange={(v) =>
                  setAddress((prev) => ({ ...prev, country: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih negara" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Kontak person institusi */}
          <div className="grid gap-2">
            <div className="text-sm font-medium">Kontak person institusi</div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-xs text-muted-foreground">
                  Nama <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="Nama PIC"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <label className="text-xs text-muted-foreground">
                  Jabatan <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="Contoh: Dekan, Ketua Prodi"
                  value={contactTitle}
                  onChange={(e) => setContactTitle(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <label className="text-xs text-muted-foreground">
                  Email <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="email@institusi.com"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <label className="text-xs text-muted-foreground">
                  Nomor WhatsApp (opsional)
                </label>
                <Input
                  placeholder="contoh: +62xxxx"
                  value={contactWhatsapp}
                  onChange={(e) => setContactWhatsapp(e.target.value)}
                />
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <label className="text-xs text-muted-foreground">
                  URL/Website mitra (opsional)
                </label>
                <Input
                  placeholder="https://"
                  value={contactWebsite}
                  onChange={(e) => setContactWebsite(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Nomor & tanggal MOU */}
          <div className="grid gap-3">
            <label className="text-sm font-medium">
              Nomor &amp; Tanggal MOU
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-xs text-muted-foreground">
                  Jenis Kerjasama
                </label>
                <Select
                  value={level}
                  onValueChange={(v) => setLevel(v as MOULevel)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jenis dokumen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MOU">MOU</SelectItem>
                    <SelectItem value="MOA">MOA</SelectItem>
                    <SelectItem value="IA">IA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <label className="text-xs text-muted-foreground">
                  No. Dokumen
                </label>
                <Input
                  placeholder="Akan terisi otomatis"
                  value={documentNumber}
                  readOnly
                />

              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-xs text-muted-foreground">
                  Tanggal Entry
                </label>
                <Input
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <label className="text-xs text-muted-foreground">
                  Tentang
                </label>
                <Input
                  placeholder="Judul/Perihal Kerjasama"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Tanggal mulai & durasi */}
          <div className="grid gap-3">
            <label className="text-sm font-medium">
              Tanggal Mulai &amp; Durasi
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="grid gap-2">
                <label className="text-xs text-muted-foreground">
                  Mulai
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <label className="text-xs text-muted-foreground">
                  Durasi Kerjasama
                </label>
                <Select
                  value={String(durationYears)}
                  onValueChange={(v) => setDurationYears(Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Durasi tahun" />
                  </SelectTrigger>
                  <SelectContent>
                    {DURATION_OPTIONS.map((d) => (
                      <SelectItem key={d} value={String(d)}>
                        {d} tahun
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <label className="text-xs text-muted-foreground">
                  Tanggal Berakhir (otomatis)
                </label>
                <Input type="date" value={endDate} readOnly />
              </div>
            </div>
          </div>

          {/* Status proses */}
          <div className="grid gap-2">
            <label className="text-sm font-medium">Status Proses</label>
            <Select
              value={processStatus}
              onValueChange={(v) =>
                setProcessStatus(
                  v as (typeof PROCESS_OPTIONS)[number]
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih status proses" />
              </SelectTrigger>
              <SelectContent>
                {PROCESS_OPTIONS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Persetujuan dekan */}
          {isProdi ? (
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <div className="text-sm font-medium">Persetujuan Dekan</div>
                <div className="text-xs text-muted-foreground">
                  Wajib dicentang untuk Prodi
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={hasDeanApproval}
                  onCheckedChange={(v) => setHasDeanApproval(Boolean(v))}
                />
                <span className="text-sm">Sudah disetujui</span>
              </div>
            </div>
          ) : (
            <div className="rounded-md border p-3 text-xs text-muted-foreground">
              Persetujuan dekan tidak wajib untuk peran {currentUser?.role || "-"}.
            </div>
          )}

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
            Simpan
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
