'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, ExternalLink, FileDown, Calendar as CalendarIcon } from 'lucide-react';
import { useState } from 'react';
import { ActivityForm, ActivityFormValue } from './activity-form';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Activity, removeActivity, updateActivity } from '@/lib/mock-kegiatan-store';

export function ActivityItem({
    docId,
    a,
    onChanged,
}: {
    docId: string;
    a: Activity;
    onChanged?: () => void;
}) {
    const [openEdit, setOpenEdit] = useState(false);

    const handleEdit = (v: ActivityFormValue) => {
        updateActivity(a.id, {
            date: v.date,
            title: v.title,
            notes: v.notes,
            link: v.link,
            files: v.files.map((f) => ({ name: f.name, url: URL.createObjectURL(f) })),
        });
        setOpenEdit(false);
        onChanged?.();
    };

    const handleDelete = () => {
        if (!confirm('Hapus kegiatan ini?')) return;
        removeActivity(a.id);
        onChanged?.();
    };

    return (
        <Card className="border shadow-none">
            <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="secondary" className="font-normal">
                                <CalendarIcon className="h-3.5 w-3.5 mr-1" />
                                {new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(a.date))}
                            </Badge>
                            <span className="font-medium">{a.title}</span>
                        </div>
                        {a.notes ? <div className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">{a.notes}</div> : null}

                        <div className="mt-2 flex flex-wrap items-center gap-3">
                            {a.link ? (
                                <a href={a.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:underline">
                                    <ExternalLink className="h-3.5 w-3.5" />
                                    Buka tautan
                                </a>
                            ) : null}

                            {a.files?.length ? (
                                <div className="flex flex-wrap items-center gap-2">
                                    {a.files.map((f, i) => (
                                        <a key={i} href={f.url} download={f.name} className="inline-flex items-center gap-1 text-blue-600 hover:underline">
                                            <FileDown className="h-3.5 w-3.5" />
                                            {f.name || `file-${i + 1}`}
                                        </a>
                                    ))}
                                </div>
                            ) : null}
                        </div>
                    </div>

                    {/* aksi kecil (ikon) */}
                    <div className="flex items-center gap-1 shrink-0">
                        <Button variant="outline" size="icon" className="h-8 w-8" title="Edit" onClick={() => setOpenEdit(true)}>
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" className="h-8 w-8" title="Hapus" onClick={handleDelete}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardContent>

            {/* Edit Sheet */}
            <Sheet open={openEdit} onOpenChange={setOpenEdit}>
                <SheetContent className="w-full sm:max-w-md">
                    <SheetHeader>
                        <SheetTitle>Edit Kegiatan</SheetTitle>
                    </SheetHeader>
                    <div className="mt-4">
                        <ActivityForm
                            submitLabel="Simpan Perubahan"
                            onSubmit={handleEdit}
                            defaultValue={{
                                date: a.date,
                                title: a.title,
                                notes: a.notes,
                                link: a.link,
                            }}
                        />
                    </div>
                </SheetContent>
            </Sheet>
        </Card>
    );
}
