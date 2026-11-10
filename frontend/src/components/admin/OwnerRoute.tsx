import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function OwnerRoute() {
  const { session } = useAuth();
  return session?.admin.role === 'owner' ? <Outlet /> : <Navigate to="/admin" replace />;
}
