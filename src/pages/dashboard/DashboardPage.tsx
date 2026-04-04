import { useQuery } from '@tanstack/react-query'
import {
  ShoppingCart, Package, AlertTriangle, DollarSign,
  TrendingUp, Clock, CheckCircle, XCircle,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import api from '@/api/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

function StatCard({
  title, value, subtitle, icon: Icon,
}: {
  title: string
  value: string | number
  subtitle?: string
  icon: any
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
            <p className="text-2xl font-semibold text-foreground">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-16" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="w-9 h-9 rounded-lg" />
        </div>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/dashboard').then((r) => r.data),
  })

  const { data: chartData } = useQuery({
    queryKey: ['dashboard-chart'],
    queryFn: () => api.get('/dashboard/revenue-chart').then((r) => r.data),
  })

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Overview of your inventory and orders</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard
              title="Orders Today"
              value={stats?.today?.orders ?? 0}
              subtitle="New orders placed"
              icon={ShoppingCart}
            />
            <StatCard
              title="Revenue Today"
              value={`$${Number(stats?.today?.revenue ?? 0).toFixed(2)}`}
              subtitle="Excluding cancelled"
              icon={DollarSign}
            />
            <StatCard
              title="Pending Orders"
              value={stats?.orders?.pending ?? 0}
              subtitle="Awaiting confirmation"
              icon={Clock}
            />
            <StatCard
              title="Low Stock Items"
              value={stats?.inventory?.lowStockCount ?? 0}
              subtitle="Need restocking"
              icon={AlertTriangle}
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Revenue Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              Revenue — Last 7 Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartData ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--foreground))" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="hsl(var(--foreground))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                      fontSize: '12px',
                    }}
                    formatter={(v: any) => [`$${v}`, 'Revenue']}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--foreground))"
                    strokeWidth={1.5}
                    fill="url(#revenueGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <Skeleton className="h-48 w-full" />
            )}
          </CardContent>
        </Card>

        {/* Low Stock */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Package className="w-4 h-4 text-muted-foreground" />
              Low Stock
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)
            ) : stats?.lowStockProducts?.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">All products are well stocked</p>
            ) : (
              stats?.lowStockProducts?.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                  <div>
                    <p className="text-xs font-medium text-foreground">{p.name}</p>
                    <p className="text-[10px] text-muted-foreground">{p.category?.name}</p>
                  </div>
                  <Badge
                    variant={p.restockQueue?.priority === 'HIGH' ? 'destructive' : 'secondary'}
                    className="text-[10px]"
                  >
                    {p.stock} left
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Orders by Status + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Orders by Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-muted-foreground" />
              Orders by Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)
            ) : (
              stats?.orders?.byStatus?.map((s: any) => (
                <div key={s.status} className="flex items-center justify-between py-1">
                  <span className="text-xs text-muted-foreground capitalize">{s.status.toLowerCase()}</span>
                  <Badge variant="outline" className="text-xs">{s.count}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <XCircle className="w-4 h-4 text-muted-foreground" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)
            ) : stats?.recentActivity?.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No recent activity</p>
            ) : (
              stats?.recentActivity?.slice(0, 6).map((a: any) => (
                <div key={a.id} className="flex items-start gap-2 py-1.5 border-b border-border last:border-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground leading-snug">{a.description}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {a.user && ` · ${a.user.name}`}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
