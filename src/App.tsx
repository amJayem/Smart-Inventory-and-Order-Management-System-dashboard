import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/sonner'
import { useAuthStore } from '@/store/auth.store'
import LoginPage from '@/pages/auth/LoginPage'
import Layout from '@/components/layout/Layout'
import DashboardPage from '@/pages/dashboard/DashboardPage'
import CategoriesPage from '@/pages/categories/CategoriesPage'
import ProductsPage from '@/pages/products/ProductsPage'
import OrdersPage from '@/pages/orders/OrdersPage'
import RestockPage from '@/pages/restock/RestockPage'
import ActivityPage from '@/pages/activity/ActivityPage'
import UsersPage from '@/pages/users/UsersPage'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } },
})

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token)
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const isAdmin = useAuthStore((s) => s.isAdmin)()
  if (!isAdmin) return <Navigate to="/" replace />
  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token)
  if (token) return <Navigate to="/" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<DashboardPage />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="restock" element={<RestockPage />} />
            <Route path="activity" element={<ActivityPage />} />
            <Route path="users" element={<AdminRoute><UsersPage /></AdminRoute>} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  )
}
