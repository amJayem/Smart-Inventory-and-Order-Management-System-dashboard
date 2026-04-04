import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Activity } from 'lucide-react'
import api from '@/api/client'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

const actionColors: Record<string, string> = {
  CREATE: 'bg-emerald-500',
  UPDATE: 'bg-blue-500',
  DELETE: 'bg-red-500',
  CANCEL: 'bg-amber-500',
  LOGIN: 'bg-purple-500',
  RESTOCK: 'bg-cyan-500',
}

export default function ActivityPage() {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)

  const { data, isLoading } = useQuery({
    queryKey: ['activity', page, limit],
    queryFn: () => api.get('/activity', { params: { page, limit } }).then((r) => r.data),
    placeholderData: (prev) => prev,
  })

  const logs = data?.data || []
  const totalPages = data?.totalPages || 1

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Activity Log</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{data?.total ?? 0} total events</p>
      </div>

      <div className="border border-border rounded-lg overflow-hidden bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Action</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Description</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">User</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Time</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                  ))}
                </tr>
              ))
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  No activity yet
                </td>
              </tr>
            ) : logs.map((log: any) => (
              <tr key={log.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${actionColors[log.action] || 'bg-muted-foreground'}`} />
                    <span className="text-xs font-medium text-foreground">{log.action}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground max-w-sm truncate">{log.description}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{log.user?.name || '—'}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {new Date(log.createdAt).toLocaleString([], {
                    month: 'short', day: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
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
          <Select value={String(limit)} onValueChange={(v) => { setLimit(+(v ?? limit)); setPage(1) }}>
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
    </div>
  )
}
