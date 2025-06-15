import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/auth-context';

interface ProtectedRouteProps {
  children: React.ReactNode;
  userType?: 'validator' | 'client';
}

const ProtectedRoute = ({ children, userType }: ProtectedRouteProps) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (userType && user?.type !== userType) {
    return <Navigate to={`/${user?.type}-dashboard`} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;