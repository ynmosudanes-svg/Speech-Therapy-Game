import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import AdminLayout from '../layouts/AdminLayout';
import StudentLayout from '../layouts/StudentLayout';
import RoleRoute from '../components/RoleRoute';

import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminLogin from '../pages/admin/AdminLogin';
import CreateGame from '../pages/admin/CreateGame';
import EditGame from '../pages/admin/EditGame';
import GamesManager from '../pages/admin/GamesManager';
import PatientDetails from '../pages/admin/PatientDetails';
import PatientsList from '../pages/admin/PatientsList';
import ReportsPage from '../pages/admin/ReportsPage';
import StudentForm from '../pages/admin/StudentForm';
import TherapistsList from '../pages/admin/TherapistsList';
import TherapistForm from '../pages/admin/TherapistForm';

import GamePlay from '../pages/student/GamePlay';
import Result from '../pages/student/Result';
import StudentHome from '../pages/student/StudentHome';
import StudentLogin from '../pages/student/StudentLogin';
import StudentWorkspaceSection from '../pages/student/StudentWorkspaceSection';
import GamesLibrary from '../pages/student/GamesLibrary';
import { useTherapyStore } from '../hooks/useTherapyStore';

const AppRoutes = () => {
  const { adminSession } = useTherapyStore();

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/student/login" replace />} />

      <Route path="/student" element={<StudentLayout />}>
        <Route index element={<Navigate to="/student/home" replace />} />
        <Route path="login" element={<StudentLogin />} />
        <Route path="home" element={<StudentHome />} />
        <Route path="profile" element={<Navigate to="/student/medical?tab=profile" replace />} />
        <Route path="sessions" element={<StudentWorkspaceSection section="sessions" />} />
        <Route path="assessment" element={<Navigate to="/student/medical?tab=assessment" replace />} />
        <Route path="plan" element={<Navigate to="/student/home" replace />} />
        <Route path="behavior" element={<Navigate to="/student/medical?tab=behavior" replace />} />
        <Route path="reports" element={<StudentWorkspaceSection section="reports" />} />
        <Route path="library" element={<GamesLibrary />} />
        <Route path="medical" element={<StudentWorkspaceSection section="medical" />} />
        <Route path="journey" element={<Navigate to="/student/medical?tab=journey" replace />} />
        <Route path="games" element={<Navigate to="/student/home" replace />} />
        <Route path="game/:gameId" element={<GamePlay />} />
        <Route path="result" element={<Result />} />
      </Route>

      <Route path="/admin/login" element={<AdminLogin />} />
      <Route
        path="/admin"
        element={
          <Navigate
            to={adminSession?.token ? (adminSession?.user?.role === 'SUPER_ADMIN' ? '/admin/dashboard' : '/admin/patients') : '/admin/login'}
            replace
          />
        }
      />
      <Route path="/admin" element={<AdminLayout />}>
        <Route path="dashboard" element={<AdminDashboard />} />

        <Route path="patients" element={<PatientsList />} />
        <Route path="patients/create" element={<StudentForm mode="create" />} />
        <Route path="patients/edit/:studentId" element={<StudentForm mode="edit" />} />
        <Route path="patients/:id" element={<PatientDetails />} />
        <Route path="library" element={<Navigate to="/admin/games" replace />} />
        <Route path="curriculum" element={<Navigate to="/admin/games" replace />} />

        <Route path="games" element={<GamesManager />} />
        <Route path="games/create" element={<CreateGame />} />
        <Route path="games/edit/:gameId" element={<EditGame />} />

        <Route path="students" element={<Navigate to="/admin/patients" replace />} />
        <Route path="students/create" element={<Navigate to="/admin/patients/create" replace />} />
        <Route path="students/edit/:studentId" element={<StudentForm mode="edit" />} />
        <Route path="students/:id" element={<PatientDetails />} />
        <Route path="reports" element={<ReportsPage />} />

        <Route element={<RoleRoute allowedRoles={['SUPER_ADMIN']} />}>
          <Route path="therapists" element={<TherapistsList />} />
          <Route path="therapists/create" element={<TherapistForm mode="create" />} />
          <Route path="therapists/edit/:therapistId" element={<TherapistForm mode="edit" />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/student/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;
