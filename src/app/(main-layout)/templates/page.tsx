'use client';

import { ContentLayout } from '@/components/admin-panel/content-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText, Eye } from 'lucide-react';

// ==== Data template ====
const templates = [
    {
        id: 'tpl-mou',
        title: 'Template MOU',
        filename: 'template-mou.pdf', // lebih baik PDF untuk preview langsung
    },
    {
        id: 'tpl-moa',
        title: 'Template MOA',
        filename: 'template-moa.pdf',
    },
    {
        id: 'tpl-ia',
        title: 'Template IA',
        filename: 'template-ia.pdf',
    },
];

export default function TemplatesPage() {
    return (
        <ContentLayout title="Template Dokumen">
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                {templates.map((tpl) => (
                    <Card key={tpl.id} className="shadow-sm flex flex-col">
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                {tpl.title}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col gap-2">
                            <Button asChild variant="outline">
                                <a
                                    href={`/templates/${tpl.filename}`}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    <Eye className="h-4 w-4 mr-2" />
                                    Preview
                                </a>
                            </Button>
                            <Button asChild>
                                <a href={`/templates/${tpl.filename}`} download>
                                    <Download className="h-4 w-4 mr-2" />
                                    Download
                                </a>
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </ContentLayout>
    );
}
