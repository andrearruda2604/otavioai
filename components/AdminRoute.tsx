import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface AdminRouteProps {
    children: React.ReactNode;
}

export default function AdminRoute({ children }: AdminRouteProps) {
    const { isAuthenticated, isAdmin, userPermissions } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    const hasUsersPermission = userPermissions.includes('users');

    if (!isAdmin && !hasUsersPermission) {
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
}
