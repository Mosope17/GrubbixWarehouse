import { BrowserRouter, Route, Routes } from 'react-router-dom';
import AdminLayout from './components/admin/AdminLayout';
import OwnerRoute from './components/admin/OwnerRoute';
import ProtectedRoute from './components/admin/ProtectedRoute';
import PublicLayout from './components/layout/PublicLayout';
import { AuthProvider } from './hooks/useAuth';
import { SettingsProvider } from './hooks/useSettings';
import Catalog from './pages/Catalog';
import Home from './pages/Home';
import NotFound from './pages/NotFound';
import ProductDetails from './pages/ProductDetails';
import AdminForgotPassword from './pages/admin/AdminForgotPassword';
import AdminAcceptInvite from './pages/admin/AdminAcceptInvite';
import AdminAccounts from './pages/admin/AdminAccounts';
import AdminLogin from './pages/admin/AdminLogin';
import AdminResetPassword from './pages/admin/AdminResetPassword';
import Dashboard from './pages/admin/Dashboard';

export default function App() {
  return (
    <BrowserRouter>
      <SettingsProvider>
        <AuthProvider>
          <Routes>
            <Route element={<PublicLayout />}>
              <Route index element={<Home />} />
              <Route path="catalogue" element={<Catalog />} />
              <Route path="products/:slug" element={<ProductDetails />} />
              <Route path="*" element={<NotFound />} />
            </Route>

            <Route path="admin/login" element={<AdminLogin />} />
            <Route path="admin/forgot-password" element={<AdminForgotPassword />} />
            <Route path="admin/reset-password" element={<AdminResetPassword />} />
            <Route path="admin/accept-invite" element={<AdminAcceptInvite />} />

            <Route path="admin" element={<ProtectedRoute />}>
              <Route element={<AdminLayout />}>
                <Route index element={<Dashboard />} />
                <Route element={<OwnerRoute />}>
                  <Route path="accounts" element={<AdminAccounts />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Route>
            </Route>
          </Routes>
        </AuthProvider>
      </SettingsProvider>
    </BrowserRouter>
  );
}
