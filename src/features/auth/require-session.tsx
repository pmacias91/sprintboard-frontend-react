import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './auth-context';
import { loginHref } from '../../lib/auth-navigation';

export function RequireSession({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { pathname, search, hash } = useLocation();

  if (!user) {
    return <Navigate to={loginHref(`${pathname}${search}${hash}`)} replace />;
  }

  return children;
}
