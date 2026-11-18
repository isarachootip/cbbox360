import React from 'react';
import { Navigate } from 'react-router-dom';
import { useEntitlement } from '../hooks/useEntitlement';

interface EntitledRouteProps {
  featureKey: string;
  requiredPermission?: string;
  redirectTo?: string;
  children: React.ReactNode;
}

/**
 * Guards React routes at runtime using tenant entitlements and permission RBAC.
 */
export const EntitledRoute: React.FC<EntitledRouteProps> = ({
  featureKey,
  requiredPermission,
  redirectTo = '/customers',
  children,
}) => {
  const { isEntitled, hasPermission } = useEntitlement();

  if (!isEntitled(featureKey)) {
    return <Navigate to={redirectTo} replace />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};
