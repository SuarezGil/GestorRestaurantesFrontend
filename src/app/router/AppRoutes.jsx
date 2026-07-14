import { Routes, Route } from 'react-router-dom'
import { AuthPage } from '../../features/auth/pages/AuthPage'
import { VerifyEmailPage } from '../../features/auth/pages/VerifyEmailPage'
import { ResetPasswordPage } from '../../features/auth/pages/ResetPasswordPage'
import { UnauthorizedPage } from '../../features/auth/pages/UnauthorizedPage'
import { DashboardPage } from '../layouts/DashboardPage.jsx'
import { ClientPage, ClientHome, ClientMenu, ClientInvoices, ClientOrders } from '../pages/ClientPage'
import { ClientReviews } from '../../features/Resenas/ClientReviews'
import { ClientRestaurants } from '../../features/Restaurants/ClientRestaurants'
import { ProtectedRoute } from './ProtectedRoute'
import { UserProfile } from '../../features/auth/components/UserProfile'
import { ClientHistory } from '../../features/History/ClientHistory'
import { RoleGuard } from './RoleGuard'
import { LandingPage } from '../pages/LandingPage'
import { Facturas } from '../../features/Facturas/Facturas'
import { Estadisticas } from '../../features/Estadisticas/Estadisticas'
import { Restaurantes } from '../../features/Restaurantes/Restaurantes'
import { Mesas } from '../../features/Mesas/Mesas'
import { Inventory } from '../../features/inventory/components/Inventory'
import { Menus } from '../../features/Menus/Menus'
import { Resenas } from '../../features/Resenas/Resenas'
import { Orders } from '../../features/Orders/Orders'
import { AdminRestaurantes } from '../../features/AdminRestaurantes/AdminRestaurantes'
import { DashboardHome } from '../pages/DashboardHome'
import { Reservations } from '../../features/Reservations/Reservations'
import { ClientesFrecuentes } from '../../features/ClientesFrecuentes/ClientesFrecuentes'
import { Promotions } from '../../features/Promotions/Promotions'
import { PublicRestaurantsPage } from '../pages/PublicRestaurantsPage'
import { AdminDashboardHome } from '../pages/AdminDashboardHome'
import { AdminRestaurantePage } from '../pages/AdminRestaurantePage'
import { AdminUsuarios } from '../../features/AdminUsuarios/AdminUsuarios'
import { RestaurantDashboard } from '../../features/RestaurantAdmin/RestaurantDashboard'
import { RestaurantTables } from '../../features/RestaurantAdmin/RestaurantTables'
import { RestaurantMenus } from '../../features/RestaurantAdmin/RestaurantMenus'
import { RestaurantOrders } from '../../features/RestaurantAdmin/RestaurantOrders'
import { RestaurantReservations } from '../../features/RestaurantAdmin/RestaurantReservations'
import { RestaurantPromotions } from '../../features/RestaurantAdmin/RestaurantPromotions'
import { RestaurantInventory } from '../../features/RestaurantAdmin/RestaurantInventory'
import { RestaurantReports } from '../../features/RestaurantAdmin/RestaurantReports'
import { RestaurantSettings } from '../../features/RestaurantAdmin/RestaurantSettings'

import { useAuthStore } from '../../features/auth/store/authStore'

export const AppRoutes = () => {
  const user = useAuthStore((state) => state.user)

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/restaurantes" element={<PublicRestaurantsPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={['ADMIN_ROLE']}>
              <DashboardPage />
            </RoleGuard>
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboardHome />} />
        <Route path="restaurantes" element={<Restaurantes />} />
        <Route path="mesas" element={<Mesas />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="menus" element={<Menus />} />
        <Route path="orders" element={<Orders />} />
        <Route path="reservations" element={<Reservations />} />
        <Route path="promociones" element={<Promotions />} />
        <Route path="admin-restaurantes" element={<AdminRestaurantes />} />
        <Route path="clientes-frecuentes" element={<ClientesFrecuentes />} />
        <Route path="resenas" element={<Resenas />} />
        <Route path="facturas" element={<Facturas />} />
        <Route path="estadisticas" element={<Estadisticas />} />
        <Route path="usuarios" element={<AdminUsuarios />} />
      </Route>
      <Route
        path="/admin-restaurante"
        element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={['ADMIN_RESTAURANTE', 'ADMIN_RESTAURANT']}>
              <AdminRestaurantePage />
            </RoleGuard>
          </ProtectedRoute>
        }
      >
        <Route index element={<RestaurantDashboard />} />
        <Route path="mesas" element={<RestaurantTables />} />
        <Route path="menus" element={<RestaurantMenus />} />
        <Route path="ordenes" element={<RestaurantOrders />} />
        <Route path="reservaciones" element={<RestaurantReservations />} />
        <Route path="promociones" element={<RestaurantPromotions />} />
        <Route path="inventario" element={<RestaurantInventory />} />
        <Route path="reportes" element={<RestaurantReports />} />
        <Route path="configuracion" element={<RestaurantSettings />} />
      </Route>
      <Route
        path="/client"
        element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={['USER_ROLE']}>
              <ClientPage />
            </RoleGuard>
          </ProtectedRoute>
        }
      >
        <Route index element={<ClientHome />} />
        <Route path="restaurants" element={<ClientRestaurants />} />
        <Route path="historial" element={<ClientHistory />} />
        <Route path="menu" element={<ClientMenu />} />
        <Route path="orders" element={<ClientOrders />} />
        <Route path="menu" element={<ClientMenu />} />
        <Route path="history" element={<ClientHistory />} />
        <Route path="invoices" element={<ClientInvoices />} />
        <Route path="reviews" element={<ClientReviews />} />
        <Route path="profile" element={<UserProfile user={user} />} />
      </Route>
   
    </Routes>
  )
}
