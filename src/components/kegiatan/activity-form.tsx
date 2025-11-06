'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export type ActivityFormValue = {
    date: string;
    title: string;
    notes: string;
    link?: string;
    files: File[];
};

export function ActivityForm({
    defaultValue,
    onSubmit,
    submitLabel = 'Simpan',
}: {
    defaultValue?: Partial<ActivityFormValue>;
    onSubmit: (v: ActivityFormValue) => void;
    submitLabel?: string;
}) {
    const [date, setDate] = useState(defaultValue?.date || new Date().toISOString().slice(0, 10));
    const [title, setTitle] = useState(defaultValue?.title || '');
    const [notes, setNotes] = useState(defaultValue?.notes || '');
    const [link, setLink] = useState(defaultValue?.link || '');
    const [files, setFiles] = useState<File[]>([]);

    const pickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
        const fs = Array.from(e.target.files || []);
        setFiles(fs);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;
        onSubmit({
            date,
            title: title.trim(),
            notes: notes.trim(),
            link: link.trim() || undefined,
            files,
        });
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-2">
                <Label>Tanggal</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>

            <div className="grid gap-2">
                <Label>Judul Kegiatan</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Contoh: Workshop bersama" required />
            </div>

            <div className="grid gap-2">
                <Label>Deskripsi/Catatan</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} placeholder="Ringkasan kegiatan…" />
            </div>

            <div className="grid gap-2">
                <Label>Link (opsional)</Label>
                <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://contoh.com/laporan" />
            </div>

            <div className="grid gap-2">
                <Label>Lampiran (opsional)</Label>
                <Input type="file" multiple onChange={pickFiles} />
                {files.length > 0 && (
                    <p className="text-xs text-muted-foreground">{files.length} file dipilih</p>
                )}
            </div>

            <div className="pt-2">
                <Button type="submit">{submitLabel}</Button>
            </div>
        </form>
    );
}
