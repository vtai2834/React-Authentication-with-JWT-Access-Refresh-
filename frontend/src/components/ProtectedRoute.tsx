import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from '../hooks/useAuth';
import { clearTokens, ensureAccessToken } from '../services/api';
import './ProtectedRoute.css';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const [status, setStatus] = useState<'checking' | 'ready' | 'redirect'>('checking');
  const { data: user, isLoading, error } = useUser({ enabled: status === 'ready' });

  useEffect(() => {
    let isActive = true;

    const verifyTokens = async () => {
      try {
        await ensureAccessToken();
        if (isActive) {
          setStatus('ready');
        }
      } catch {
        clearTokens();
        if (isActive) {
          setStatus('redirect');
        }
      }
    };

    verifyTokens();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (error) {
      clearTokens();
      setStatus('redirect');
    }
  }, [error]);

  useEffect(() => {
    if (status === 'ready' && !isLoading && !user) {
      clearTokens();
      setStatus('redirect');
    }
  }, [status, isLoading, user]);

  if (status === 'checking' || (status === 'ready' && isLoading)) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (status === 'redirect') {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

