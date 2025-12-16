'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { ContentLayout } from '@/components/admin-panel/content-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
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


import { Plus, Search, Pencil, Trash2, Loader2 } from 'lucide-react';

import { unitAPI, Unit, CreateUnitRequest, UpdateUnitRequest } from '@/lib/api/unit';
import { getAuth, isAuthed } from '@/lib/proto/auth';
import { useRouter } from 'next/navigation';

export default function UnitPage() {
  const router = useRouter();
  
  // Auth check
  useEffect(() => {
    if (!isAuthed()) {
      router.replace('/auth');
      return;
    }
  }, [router]);

  // State
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Create/Edit state
  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const [showEditSheet, setShowEditSheet] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [formData, setFormData] = useState<CreateUnitRequest>({
    name: '',
    categoryId: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Delete state
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [unitToDelete, setUnitToDelete] = useState<Unit | null>(null);

  // Load units
  const loadUnits = async () => {
    try {
      setLoading(true);
      const response = await unitAPI.getAllUnits();
      if (response.status === 'success') {
        setUnits(response.data);
      } else {
        toast.error('Gagal memuat data unit');
      }
    } catch (error) {
      console.error('Load units error:', error);
      toast.error('Gagal memuat data unit');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUnits();
  }, []);

  // Filter units based on search
  const filteredUnits = units.filter(unit =>
    unit.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle create
  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast.error('Nama unit harus diisi');
      return;
    }

    try {
      setSubmitting(true);
      const response = await unitAPI.createUnit(formData);
      if (response.status === 'success') {
        toast.success('Unit berhasil dibuat');
        setShowCreateSheet(false);
        setFormData({ name: '', categoryId: '' });
        loadUnits();
      } else {
        toast.error('Gagal membuat unit');
      }
    } catch (error) {
      console.error('Create unit error:', error);
      toast.error('Gagal membuat unit');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle edit
  const openEditSheet = (unit: Unit) => {
    setEditingUnit(unit);
    setFormData({
      name: unit.name,
      categoryId: '' // We don't have categoryId in the response, so we'll leave it empty
    });
    setShowEditSheet(true);
  };

  const handleEdit = async () => {
    if (!editingUnit) return;
    if (!formData.name.trim()) {
      toast.error('Nama unit harus diisi');
      return;
    }

    try {
      setSubmitting(true);
      const response = await unitAPI.updateUnit(editingUnit.id, formData);
      if (response.status === 'success') {
        toast.success('Unit berhasil diperbarui');
        setShowEditSheet(false);
        setEditingUnit(null);
        setFormData({ name: '', categoryId: '' });
        loadUnits();
      } else {
        toast.error('Gagal memperbarui unit');
      }
    } catch (error) {
      console.error('Update unit error:', error);
      toast.error('Gagal memperbarui unit');
    } finally {
      setSubmitting(false);
    }
  };

  // Open delete dialog
  const openDeleteDialog = (unit: Unit) => {
    setUnitToDelete(unit);
    setShowDeleteDialog(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!unitToDelete) return;

    try {
      setDeleting(unitToDelete.id);
      const response = await unitAPI.deleteUnit(unitToDelete.id);
      if (response.status === 'success') {
        toast.success('Unit berhasil dihapus');
        loadUnits();
        setShowDeleteDialog(false);
        setUnitToDelete(null);
      } else {
        toast.error('Gagal menghapus unit');
      }
    } catch (error) {
      console.error('Delete unit error:', error);
      toast.error('Gagal menghapus unit');
    } finally {
      setDeleting(null);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <ContentLayout title="Unit Management">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Daftar Unit</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Cari unit..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              {/* Create Button */}
              <Sheet open={showCreateSheet} onOpenChange={setShowCreateSheet}>
                <SheetTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Tambah Unit
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Tambah Unit Baru</SheetTitle>
                    <SheetDescription>
                      Isi form di bawah untuk menambah unit baru.
                    </SheetDescription>
                  </SheetHeader>
                  
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Nama Unit</Label>
                      <Input
                        id="name"
                        placeholder="Masukkan nama unit"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="categoryId">Category ID</Label>
                      <Input
                        id="categoryId"
                        placeholder="Masukkan category ID"
                        value={formData.categoryId}
                        onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                      />
                    </div>
                  </div>
                  
                  <SheetFooter>
                    <Button 
                      onClick={handleCreate}
                      disabled={submitting}
                    >
                      {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {submitting ? 'Menyimpan...' : 'Simpan'}
                    </Button>
                  </SheetFooter>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Memuat data unit...</span>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Unit</TableHead>
                    <TableHead>Dibuat</TableHead>
                    <TableHead>Diperbarui</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUnits.length > 0 ? (
                    filteredUnits.map((unit) => (
                      <TableRow key={unit.id}>
                        <TableCell className="font-medium">
                          {unit.name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {formatDate(unit.createdAt)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {formatDate(unit.updatedAt)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditSheet(unit)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDeleteDialog(unit)}
                              disabled={deleting === unit.id}
                              className="text-destructive hover:text-destructive"
                            >
                              {deleting === unit.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        {searchQuery ? 'Tidak ada unit yang ditemukan' : 'Belum ada data unit'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Sheet */}
      <Sheet open={showEditSheet} onOpenChange={setShowEditSheet}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Edit Unit</SheetTitle>
            <SheetDescription>
              Perbarui informasi unit.
            </SheetDescription>
          </SheetHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Nama Unit</Label>
              <Input
                id="edit-name"
                placeholder="Masukkan nama unit"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-categoryId">Category ID</Label>
              <Input
                id="edit-categoryId"
                placeholder="Masukkan category ID"
                value={formData.categoryId}
                onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
              />
            </div>
          </div>
          
          <SheetFooter>
            <Button 
              onClick={handleEdit}
              disabled={submitting}
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitting ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Unit</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus unit{" "}
              <strong>{unitToDelete?.name}</strong>?
              <br />
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting === unitToDelete?.id}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting === unitToDelete?.id}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting === unitToDelete?.id && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {deleting === unitToDelete?.id ? 'Menghapus...' : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </ContentLayout>
  );
}
