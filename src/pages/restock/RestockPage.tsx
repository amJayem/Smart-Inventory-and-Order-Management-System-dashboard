import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/api/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

const priorityColors: Record<string, string> = {
  HIGH: 'bg-red-500/10 text-red-600 border-red-500/20',
  MEDIUM: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  LOW: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
}

export default function RestockPage() {
  const qc = useQueryClient()
  const [resolveTarget, setResolveTarget] = useState<any>(null)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)

  const { data, isLoading } = useQuery({
    queryKey: ['restock', page, limit],
    queryFn: () => api.get('/restock', { params: { page, limit } }).then((r) => r.data),
    placeholderData: (prev) => prev,
  })

  const removeMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/restock/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['restock'] })
      toast.success('Marked as restocked')
      setResolveTarget(null)
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  })

  const items = data?.data || []
  const totalPages = data?.totalPages || 1

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Restock Queue</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {data?.total ?? 0} items need restocking
        </p>
      </div>

      {/* Priority Legend */}
      <div className="flex gap-3 flex-wrap">
        {[
          { label: 'High Priority', desc: 'Stock < 5', color: priorityColors.HIGH },
          { label: 'Medium Priority', desc: 'Stock 5–19', color: priorityColors.MEDIUM },
          { label: 'Low Priority', desc: 'Stock 20–49', color: priorityColors.LOW },
        ].map(({ label, desc, color }) => (
          <div key={label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={`inline-flex px-1.5 py-0.5 rounded-full text-[10px] border ${color}`}>●</span>
            <span>{label}</span>
            <span className="opacity-50">({desc})</span>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Product</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Category</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Current Stock</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Min Threshold</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Priority</th>
              <th className="w-28 px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                  ))}
                </tr>
              ))
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  All products are well stocked
                </td>
              </tr>
            ) : items.map((item: any) => (
              <tr key={item.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-medium text-foreground">{item.product?.name}</td>
                <td className="px-4 py-3 text-muted-foreground text-xs">{item.product?.category?.name}</td>
                <td className="px-4 py-3 text-right">
                  <span className={`font-mono text-xs font-semibold ${item.product?.stock < 5 ? 'text-red-500' : 'text-amber-500'}`}>
                    {item.product?.stock}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-mono text-xs text-muted-foreground">
                  {item.product?.minStockThreshold}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${priorityColors[item.priority] || ''}`}>
                    {item.priority}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={() => setResolveTarget(item)}
                  >
                    <CheckCircle className="w-3 h-3" /> Mark Restocked
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>Rows per page:</span>
          <Select value={String(limit)} onValueChange={(v) => { setLimit(+v); setPage(1) }}>
            <SelectTrigger className="h-7 w-16 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[5, 10, 20, 50].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-3">
          <span>Page {page} of {totalPages || 1}</span>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => setPage(p => p - 1)} disabled={page <= 1}>Prev</Button>
            <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>Next</Button>
          </div>
        </div>
      </div>

      {/* Confirm Resolve */}
      <AlertDialog open={!!resolveTarget} onOpenChange={(o) => !o && setResolveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark as restocked?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove <strong>{resolveTarget?.product?.name}</strong> from the restock queue.
              Make sure you've actually added stock to the product first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => removeMutation.mutate(resolveTarget.id)}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
