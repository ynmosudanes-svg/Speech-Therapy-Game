import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useTherapyStore } from '../hooks/useTherapyStore';

const RoleRoute = ({ allowedRoles }) => {
  const { adminSession } = useTherapyStore();

  if (!adminSession?.token) {
    return <Navigate to="/" replace state={{ mode: 'staff' }} />;
  }

  const userRole = adminSession?.user?.role;

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    if (userRole === 'PARENT') {
      return <Navigate to="/parent/dashboard" replace />;
    }

    return <Navigate to={userRole === 'SUPER_ADMIN' ? '/admin/dashboard' : '/admin/patients'} replace />;
  }

  return <Outlet />;
};

export default RoleRoute;
