'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ContentLayout } from '@/components/admin-panel/content-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { ActivityForm, type ActivityFormValue } from '@/components/kegiatan/activity-form';
import { ArrowLeft, Plus } from 'lucide-react';
import {
    Sheet,
    SheetContent,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { Activity, addActivity, getActivitiesByDocId } from '@/lib/mock-kegiatan-store';
import { ActivityItem } from '@/components/kegiatan/activity-item';

export default function KegiatanPage() {
    const { id } = useParams<{ id: string }>();
    const [items, setItems] = useState<Activity[]>([]);
    const [open, setOpen] = useState(false);

    const reload = () => setItems(getActivitiesByDocId(id));

    useEffect(() => {
        reload();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const handleSubmit = (v: ActivityFormValue) => {
        addActivity({
            id: crypto.randomUUID(),
            docId: id,
            date: v.date,
            title: v.title,
            notes: v.notes,
            link: v.link,
            files: v.files.map((f) => ({ name: f.name, url: URL.createObjectURL(f) })),
            createdAt: new Date().toISOString(),
        });
        reload();
        setOpen(false);
    };

    return (
        <ContentLayout title={`Kegiatan – ${id}`}>
            <div className="mb-4 flex items-center justify-between">
                <Button asChild variant="outline" size="sm">
                    <Link href="/data-berjalan">
                        <ArrowLeft className="h-4 w-4 mr-1" /> Kembali
                    </Link>
                </Button>

                {/* Tambah via Sheet */}
                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger asChild>
                        <Button size="sm">
                            <Plus className="h-4 w-4 mr-1" /> Tambah Kegiatan
                        </Button>
                    </SheetTrigger>
                    <SheetContent className="w-full sm:max-w-md">
                        <SheetHeader>
                            <SheetTitle>Tambah Kegiatan</SheetTitle>
                        </SheetHeader>

                        <div className="mt-4">
                            <ActivityForm onSubmit={handleSubmit} submitLabel="Simpan Kegiatan" />
                        </div>

                        <SheetFooter />
                    </SheetContent>
                </Sheet>
            </div>

            <Card>
                <CardHeader className="flex items-center justify-between">
                    <CardTitle className="text-base">Daftar Kegiatan</CardTitle>
                </CardHeader>
                <CardContent>
                    {items.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Belum ada kegiatan.</p>
                    ) : (
                        <ul className="grid gap-3">
                            {items.map((a) => (
                                <li key={a.id}>
                                    <ActivityItem docId={id} a={a} />
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>
        </ContentLayout>
    );
}
