export type ActivityFile = { name: string; url: string };

export type Activity = {
    id: string;
    docId: string;          // id dokumen MOU/MOA/IA
    date: string;           // yyyy-mm-dd
    title: string;
    notes?: string;
    link?: string;
    files: ActivityFile[];
    createdAt: string;      // iso
};

// seed contoh
let _activities: Activity[] = [
    {
        id: 'act-1',
        docId: 'MOU-001',
        date: '2025-09-10',
        title: 'Workshop Pembukaan',
        notes: 'Pembukaan program kerjasama & sosialisasi.',
        link: 'https://contoh.com/brief',
        files: [],
        createdAt: new Date().toISOString(),
    },
];

export function getActivitiesByDocId(docId: string): Activity[] {
    return _activities
        .filter((a) => a.docId === docId)
        .sort((a, b) => a.date.localeCompare(b.date)); // urut tanggal
}

export function addActivity(a: Activity) {
    _activities = [a, ..._activities];
}

export function updateActivity(id: string, patch: Partial<Omit<Activity, 'id' | 'docId' | 'createdAt'>>) {
    _activities = _activities.map((a) => (a.id === id ? { ...a, ...patch } : a));
}

export function removeActivity(id: string) {
    _activities = _activities.filter((a) => a.id !== id);
}
