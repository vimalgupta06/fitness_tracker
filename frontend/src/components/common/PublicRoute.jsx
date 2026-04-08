import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export default function PublicRoute() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="loader">Loading...</div>;
  return !isAuthenticated ? <Outlet /> : <Navigate to="/dashboard" replace />;
}
