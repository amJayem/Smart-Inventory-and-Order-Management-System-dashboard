import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, MoreHorizontal, Tag } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import api from '@/api/client'
import { useAuthStore } from '@/store/auth.store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
})
type FormData = z.infer<typeof schema>

export default function CategoriesPage() {
  const qc = useQueryClient()
  const isAdmin = useAuthStore((s) => s.isAdmin)()
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<any>(null)
  const [deleteTarget, setDeleteTarget] = useState<any>(null)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)

  const { data, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then((r) => r.data),
  })

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const openCreate = () => { setEditTarget(null); reset({ name: '', description: '' }); setModalOpen(true) }
  const openEdit = (cat: any) => { setEditTarget(cat); reset({ name: cat.name, description: cat.description || '' }); setModalOpen(true) }

  const saveMutation = useMutation({
    mutationFn: (data: FormData) =>
      editTarget
        ? api.patch(`/categories/${editTarget.id}`, data)
        : api.post('/categories', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] })
      toast.success(editTarget ? 'Category updated' : 'Category created')
      setModalOpen(false)
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to save'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/categories/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] })
      toast.success('Category deleted')
      setDeleteTarget(null)
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to delete'),
  })

  const categories = data || []
  const paged = categories.slice((page - 1) * limit, page * limit)
  const totalPages = Math.ceil(categories.length / limit)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Categories</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{categories.length} total categories</p>
        </div>
        {isAdmin && (
          <Button size="sm" onClick={openCreate} className="gap-1.5">
            <Plus className="w-4 h-4" /> New Category
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Description</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Products</th>
              {isAdmin && <th className="w-10 px-4 py-3" />}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-48" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-10" /></td>
                  {isAdmin && <td className="px-4 py-3" />}
                </tr>
              ))
            ) : paged.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 4 : 3} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  <Tag className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  No categories yet
                </td>
              </tr>
            ) : paged.map((cat: any) => (
              <tr key={cat.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-medium text-foreground">{cat.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{cat.description || <span className="opacity-40">—</span>}</td>
                <td className="px-4 py-3">
                  <Badge variant="secondary" className="text-xs">{cat._count?.products ?? 0}</Badge>
                </td>
                {isAdmin && (
                  <td className="px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="h-7 w-7 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                        <MoreHorizontal className="w-4 h-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-32">
                        <DropdownMenuItem onClick={() => openEdit(cat)}>
                          <Pencil className="w-3.5 h-3.5 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeleteTarget(cat)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {categories.length > 0 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <Select value={String(limit)} onValueChange={(v) => { setLimit(+(v ?? limit)); setPage(1) }}>
              <SelectTrigger className="h-7 w-16 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[5, 10, 20, 50].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-3">
            <span>Page {page} of {totalPages}</span>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => setPage(p => p - 1)} disabled={page <= 1}>Prev</Button>
              <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>Next</Button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editTarget ? 'Edit Category' : 'New Category'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="e.g. Electronics" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Description <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Textarea id="description" placeholder="Short description..." rows={2} {...register('description')} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting || saveMutation.isPending}>
                {editTarget ? 'Save changes' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete category?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleteTarget?.name}</strong>. Products in this category must be reassigned first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(deleteTarget.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
