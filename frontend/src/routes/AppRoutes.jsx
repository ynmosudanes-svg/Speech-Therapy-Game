import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import AdminLayout from '../layouts/AdminLayout';
import StudentLayout from '../layouts/StudentLayout';
import RoleRoute from '../components/RoleRoute';

import AdminDashboard from '../pages/admin/AdminDashboard';
import CreateGame from '../pages/admin/CreateGame';
import EditGame from '../pages/admin/EditGame';
import GamesManager from '../pages/admin/GamesManager';
import LibraryPage from '../pages/admin/LibraryPage';
import PatientDetails from '../pages/admin/PatientDetails';
import PatientsList from '../pages/admin/PatientsList';
import ReportsPage from '../pages/admin/ReportsPage';
import StudentForm from '../pages/admin/StudentForm';
import TherapistsList from '../pages/admin/TherapistsList';
import TherapistForm from '../pages/admin/TherapistForm';
import ParentsList from '../pages/admin/ParentsList';
import ParentForm from '../pages/admin/ParentForm';

import AuthLanding from '../pages/auth/AuthLanding';
import GamePlay from '../pages/student/GamePlay';
import Result from '../pages/student/Result';
import StudentHome from '../pages/student/StudentHome';
import StudentWorkspaceSection from '../pages/student/StudentWorkspaceSection';
import GamesLibrary from '../pages/student/GamesLibrary';
import ParentDashboard from '../pages/parent/ParentDashboard';
import ParentChildReport from '../pages/parent/ParentChildReport';
import { useTherapyStore } from '../hooks/useTherapyStore';

const AppRoutes = () => {
  const { adminSession } = useTherapyStore();

  return (
    <Routes>
      <Route path="/" element={<AuthLanding />} />
      <Route path="/auth/register" element={<Navigate to="/" replace state={{ mode: 'register' }} />} />
      <Route path="/auth/staff-login" element={<Navigate to="/" replace state={{ mode: 'staff' }} />} />
      <Route path="/parent/dashboard" element={<ParentDashboard />} />
      <Route path="/parent/reports/:studentId" element={<ParentChildReport />} />
      <Route path="/account/dashboard" element={<Navigate to="/" replace />} />
      <Route path="/trial/dashboard" element={<Navigate to="/" replace />} />
      <Route
        path="/library"
        element={
          <div dir="rtl" className="min-h-screen bg-[radial-gradient(circle_at_top,_#eaf7fb,_#f7fcfd_34%,_#ffffff_75%)] px-4 py-6 text-slate-800 md:px-8">
            <div className="mx-auto max-w-6xl">
              <GamesLibrary />
            </div>
          </div>
        }
      />
      <Route
        path="/play/:gameId"
        element={
          <div dir="rtl" className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_#eaf7fb,_#f7fcfd_34%,_#ffffff_75%)] px-3 py-4 text-slate-800 md:px-6 md:py-5">
            <GamePlay />
          </div>
        }
      />

      <Route path="/student" element={<StudentLayout />}>
        <Route index element={<Navigate to="/student/home" replace />} />
        <Route path="login" element={<Navigate to="/" replace state={{ mode: 'student' }} />} />
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

      <Route path="/admin/login" element={<Navigate to="/" replace state={{ mode: 'staff' }} />} />
      <Route
        path="/admin"
        element={
          <Navigate
            to={
              adminSession?.token
                ? adminSession?.user?.role === 'PARENT'
                  ? '/parent/dashboard'
                  : adminSession?.user?.role === 'SUPER_ADMIN'
                    ? '/admin/dashboard'
                    : '/admin/patients'
                : '/'
            }
            state={adminSession?.token ? undefined : { mode: 'staff' }}
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
        <Route element={<RoleRoute allowedRoles={['SUPER_ADMIN', 'THERAPIST']} />}>
          <Route path="library" element={<LibraryPage />} />
        </Route>
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

        <Route path="parents" element={<ParentsList />} />
        <Route path="parents/create" element={<ParentForm mode="create" />} />
        <Route path="parents/edit/:parentId" element={<ParentForm mode="edit" />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
