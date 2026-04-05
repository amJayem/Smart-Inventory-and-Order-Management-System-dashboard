import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, MoreHorizontal, ShoppingCart, X, FileText, Mail, Phone, MapPin, User } from 'lucide-react'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import api from '@/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

const ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const

const statusColors: Record<string, string> = {
  PENDING: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  CONFIRMED: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  SHIPPED: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  DELIVERED: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  CANCELLED: 'bg-red-500/10 text-red-500 border-red-500/20',
}

const itemSchema = z.object({
  productId: z.string().min(1, 'Select a product'),
  quantity: z.coerce.number().int().min(1, 'Min 1'),
})

const schema = z.object({
  customerName: z.string().min(1, 'Customer name is required'),
  customerEmail: z.string().email('Invalid email format').optional().or(z.literal('')),
  customerPhone: z.string().optional(),
  customerAddress: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(itemSchema).min(1, 'Add at least one item'),
})
type FormData = z.infer<typeof schema>

export default function OrdersPage() {
  const qc = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [detailOrder, setDetailOrder] = useState<any>(null)
  const [cancelTarget, setCancelTarget] = useState<any>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)

  const { data, isLoading } = useQuery({
    queryKey: ['orders', page, limit, search, statusFilter],
    queryFn: () => api.get('/orders', {
      params: { page, limit, search: search || undefined, status: statusFilter !== 'all' ? statusFilter : undefined },
    }).then((r) => r.data),
    placeholderData: (prev) => prev,
  })

  const { data: products } = useQuery({
    queryKey: ['products-all'],
    queryFn: () => api.get('/products', { params: { limit: 100 } }).then((r) => r.data.data),
  })

  const {
    control, register, handleSubmit, reset, watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      customerName: '', customerEmail: '', customerPhone: '',
      customerAddress: '', notes: '',
      items: [{ productId: '', quantity: 1 }],
    },
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const watchedItems = watch('items')

  const createMutation = useMutation({
    mutationFn: (d: FormData) => {
      const payload = {
        ...d,
        customerEmail: d.customerEmail || undefined,
        customerPhone: d.customerPhone || undefined,
        customerAddress: d.customerAddress || undefined,
        notes: d.notes || undefined,
      }
      return api.post('/orders', payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] })
      qc.invalidateQueries({ queryKey: ['products'] })
      toast.success('Order created successfully')
      setCreateOpen(false)
      reset()
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to create order'),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/orders/${id}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] })
      toast.success('Status updated')
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Cannot update status'),
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/orders/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] })
      qc.invalidateQueries({ queryKey: ['products'] })
      toast.success('Order cancelled — stock restored')
      setCancelTarget(null)
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Cannot cancel order'),
  })

  const downloadInvoice = (order: any) => {
    const adminInfo = order.user
      ? `${order.user.name}${order.user.email ? ` <${order.user.email}>` : ''}`
      : '—'
    const lines = [
      'INVOICE',
      '='.repeat(50),
      `Order Number : ${order.orderNumber}`,
      `Date         : ${new Date(order.createdAt).toLocaleDateString()}`,
      `Status       : ${order.status}`,
      '',
      'CUSTOMER INFORMATION',
      '-'.repeat(50),
      `Name         : ${order.customerName}`,
      order.customerEmail ? `Email        : ${order.customerEmail}` : null,
      order.customerPhone ? `Phone        : ${order.customerPhone}` : null,
      order.customerAddress ? `Address      : ${order.customerAddress}` : null,
      '',
      'ORDER ITEMS',
      '-'.repeat(50),
      ...order.items.map((i: any) =>
        `${i.product.name.padEnd(30)} x${i.quantity}  @$${Number(i.unitPrice).toFixed(2)}  = $${(i.quantity * Number(i.unitPrice)).toFixed(2)}`
      ),
      '',
      '='.repeat(50),
      `TOTAL: $${Number(order.totalPrice).toFixed(2)}`,
      '',
      order.notes ? `Notes: ${order.notes}` : null,
      '',
      '-'.repeat(50),
      `Processed by : ${adminInfo}`,
    ].filter((l) => l !== null)

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `invoice-${order.orderNumber}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const calcTotal = () => {
    if (!watchedItems || !products) return 0
    return watchedItems.reduce((sum, item) => {
      const p = products.find((p: any) => p.id === item.productId)
      return sum + (p ? Number(p.price) * (item.quantity || 0) : 0)
    }, 0)
  }

  const orders = data?.data || []
  const totalPages = data?.totalPages || 1

  const nextStatuses: Record<string, string[]> = {
    PENDING: ['CONFIRMED'],
    CONFIRMED: ['SHIPPED'],
    SHIPPED: ['DELIVERED'],
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Orders</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{data?.total ?? 0} total orders</p>
        </div>
        <Button size="sm" onClick={() => { reset(); setCreateOpen(true) }} className="gap-1.5">
          <Plus className="w-4 h-4" /> New Order
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by customer..."
            className="pl-8 h-8 text-sm"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v ?? 'all'); setPage(1) }}>
          <SelectTrigger className="h-8 w-36 text-sm"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {ORDER_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Order</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Customer</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Total</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
              <th className="w-10 px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                  ))}
                </tr>
              ))
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  No orders found
                </td>
              </tr>
            ) : orders.map((o: any) => (
              <tr key={o.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <span className="font-mono text-xs text-muted-foreground">{o.orderNumber}</span>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-foreground">{o.customerName}</p>
                  {o.customerEmail && (
                    <p className="text-xs text-muted-foreground">{o.customerEmail}</p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${statusColors[o.status] || ''}`}>
                    {o.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-mono text-xs">${Number(o.totalPrice).toFixed(2)}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {new Date(o.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger className="h-7 w-7 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                      <MoreHorizontal className="w-4 h-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem onClick={() => setDetailOrder(o)}>View Details</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => downloadInvoice(o)}>
                        <FileText className="w-3.5 h-3.5 mr-2" /> Download Invoice
                      </DropdownMenuItem>
                      {nextStatuses[o.status]?.map((s) => (
                        <DropdownMenuItem key={s} onClick={() => statusMutation.mutate({ id: o.id, status: s })}>
                          Mark as {s}
                        </DropdownMenuItem>
                      ))}
                      {o.status !== 'CANCELLED' && !['SHIPPED', 'DELIVERED'].includes(o.status) && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setCancelTarget(o)}
                            className="text-destructive focus:text-destructive"
                          >
                            Cancel Order
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
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

      {/* ─── Create Order Modal ─────────────────────────────────────── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Order</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit((d) => createMutation.mutate(d as FormData))} className="space-y-5">

            {/* Customer Information */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Customer Information</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Full Name <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input className="pl-8" placeholder="John Doe" {...register('customerName')} />
                  </div>
                  {errors.customerName && <p className="text-xs text-destructive">{errors.customerName.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Email <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <div className="relative">
                    <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input className="pl-8" type="email" placeholder="customer@example.com" {...register('customerEmail')} />
                  </div>
                  {errors.customerEmail && <p className="text-xs text-destructive">{errors.customerEmail.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Phone <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <div className="relative">
                    <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input className="pl-8" placeholder="+1 555 000 0000" {...register('customerPhone')} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Address <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <div className="relative">
                    <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input className="pl-8" placeholder="123 Main St, City" {...register('customerAddress')} />
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Order Items */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Order Items</p>
                <Button type="button" variant="outline" size="sm" className="h-7 text-xs gap-1"
                  onClick={() => append({ productId: '', quantity: 1 })}>
                  <Plus className="w-3 h-3" /> Add Item
                </Button>
              </div>
              <div className="space-y-2">
                {fields.map((field, idx) => {
                  const selectedProduct = products?.find((p: any) => p.id === watchedItems?.[idx]?.productId)
                  return (
                    <div key={field.id} className="flex gap-2 items-start">
                      <Controller name={`items.${idx}.productId`} control={control} render={({ field: f }) => (
                        <Select onValueChange={f.onChange} value={f.value}>
                          <SelectTrigger className="flex-1 text-sm h-9"><SelectValue placeholder="Select product" /></SelectTrigger>
                          <SelectContent>
                            {products?.filter((p: any) => p.status === 'ACTIVE').map((p: any) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.name} — ${Number(p.price).toFixed(2)} ({p.stock} in stock)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )} />
                      <Input
                        type="number" min="1"
                        max={selectedProduct?.stock || undefined}
                        className="w-20 h-9 text-sm"
                        placeholder="Qty"
                        {...register(`items.${idx}.quantity`)}
                      />
                      {fields.length > 1 && (
                        <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0"
                          onClick={() => remove(idx)}>
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
              {errors.items && <p className="text-xs text-destructive">{(errors.items as any).message || 'Fix item errors'}</p>}
            </div>

            <Separator />

            {/* Notes */}
            <div className="space-y-1.5">
              <Label>Notes <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Textarea rows={2} placeholder="Delivery instructions, special requests..." {...register('notes')} />
            </div>

            {/* Total preview */}
            <div className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-muted/50 border border-border">
              <span className="text-sm text-muted-foreground">Estimated Total</span>
              <span className="font-semibold font-mono text-base">${calcTotal().toFixed(2)}</span>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting || createMutation.isPending} className="gap-1.5">
                <ShoppingCart className="w-4 h-4" /> Place Order
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── Order Details Modal ────────────────────────────────────── */}
      <Dialog open={!!detailOrder} onOpenChange={(o) => !o && setDetailOrder(null)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Order Details
              {detailOrder && (
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${statusColors[detailOrder.status] || ''}`}>
                  {detailOrder.status}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          {detailOrder && (
            <div className="space-y-4 text-sm">

              {/* Order meta */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Order Number</p>
                  <p className="font-mono text-xs mt-0.5">{detailOrder.orderNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="mt-0.5">{new Date(detailOrder.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <Separator />

              {/* Customer info */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Customer</p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="font-medium">{detailOrder.customerName}</span>
                  </div>
                  {detailOrder.customerEmail && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span>{detailOrder.customerEmail}</span>
                    </div>
                  )}
                  {detailOrder.customerPhone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span>{detailOrder.customerPhone}</span>
                    </div>
                  )}
                  {detailOrder.customerAddress && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span>{detailOrder.customerAddress}</span>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Items */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Items</p>
                <div className="space-y-1.5">
                  {detailOrder.items?.map((item: any) => (
                    <div key={item.id} className="flex justify-between">
                      <span>
                        {item.product?.name}
                        <span className="text-muted-foreground ml-1">×{item.quantity}</span>
                      </span>
                      <span className="font-mono text-xs">${(item.quantity * Number(item.unitPrice)).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-border">
                <span className="font-medium">Total</span>
                <span className="font-semibold font-mono">${Number(detailOrder.totalPrice).toFixed(2)}</span>
              </div>

              {detailOrder.notes && (
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Notes</p>
                  <p className="text-sm">{detailOrder.notes}</p>
                </div>
              )}

              <Separator />

              {/* Admin info */}
              {detailOrder.user && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Processed By</p>
                  <div className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/40 border border-border">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <User className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{detailOrder.user.name}</p>
                      {detailOrder.user.email && (
                        <p className="text-xs text-muted-foreground">{detailOrder.user.email}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailOrder(null)}>Close</Button>
            {detailOrder && (
              <Button onClick={() => downloadInvoice(detailOrder)} className="gap-1.5">
                <FileText className="w-4 h-4" /> Download Invoice
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Cancel Confirmation ─────────────────────────────────────── */}
      <AlertDialog open={!!cancelTarget} onOpenChange={(o) => !o && setCancelTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this order?</AlertDialogTitle>
            <AlertDialogDescription>
              Order <strong>{cancelTarget?.orderNumber}</strong> will be cancelled and all stock will be automatically restored.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Order</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => cancelMutation.mutate(cancelTarget.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancel Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
