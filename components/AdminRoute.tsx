import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface AdminRouteProps {
    children: React.ReactNode;
}

export default function AdminRoute({ children }: AdminRouteProps) {
    const { isAuthenticated, isAdmin, userPermissions } = useAuth();

    if (!isAuthenticated) {
        console.log('AdminRoute: Not authenticated');
        return <Navigate to="/login" replace />;
    }

    const hasUsersPermission = userPermissions.includes('users');
    console.log('AdminRoute: Check Access', { isAdmin, hasUsersPermission, permissions: userPermissions });

    if (!isAdmin && !hasUsersPermission) {
        console.log('AdminRoute: Access Denied. Redirecting to dashboard.');
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
}
