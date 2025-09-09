export type MOUStatus = "Draft" | "Active" | "Expiring" | "Expired" | "Terminated";

export type MOU = {
    id: string;
    title: string;
    partner: string;
    category: "Cooperation" | "NDA" | "Grant" | "Vendor" | "Academic";
    department: string;
    owner: string;
    value?: number;
    startDate: string; // ISO
    endDate: string; // ISO
    status: MOUStatus;
    notes?: string;
    attachments?: Array<{ id: string; name: string; sizeKB: number }>;
};