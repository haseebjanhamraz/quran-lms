'use client';

import React from 'react';
import { useAuth } from '../context/AuthContext';

interface PermissionGateProps {
  permissions: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAll?: boolean;
}

export default function PermissionGate({
  permissions,
  children,
  fallback = null,
  requireAll = false,
}: PermissionGateProps) {
  const { hasPermission } = useAuth();

  if (!permissions || permissions.length === 0) {
    return <>{children}</>;
  }

  const isAllowed = requireAll
    ? permissions.every((p) => hasPermission(p))
    : permissions.some((p) => hasPermission(p));

  if (!isAllowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
