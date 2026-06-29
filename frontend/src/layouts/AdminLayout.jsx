import React, { useState } from 'react';
import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
  LayoutDashboard,
  Users,
  FolderOpen,
  Gamepad2,
  FileText,
  ShieldCheck,
  ArrowLeft,
  LogOut,
  History,
  UserRound,
  UsersRound,
} from 'lucide-react';
import { useTherapyStore } from '../hooks/useTherapyStore';

const T = {
  dashboard: '\u0644\u0648\u062d\u0629 \u0627\u0644\u062a\u062d\u0643\u0645',
  activity: '\u0633\u062c\u0644 \u0627\u0644\u0646\u0634\u0627\u0637',
  patients: '\u0627\u0644\u0645\u0631\u0636\u0649',
  library: '\u0645\u0643\u062a\u0628\u0629 \u0627\u0644\u0623\u0644\u0639\u0627\u0628',
  games: '\u0627\u0644\u0623\u0644\u0639\u0627\u0628',
  reports: '\u0627\u0644\u062a\u0642\u0627\u0631\u064a\u0631',
  therapists: '\u0627\u0644\u0623\u062e\u0635\u0627\u0626\u064a\u0648\u0646',
  parents: '\u0623\u0648\u0644\u064a\u0627\u0621 \u0627\u0644\u0623\u0645\u0648\u0631',
  adminPanel: '\u0644\u0648\u062d\u0629 \u0627\u0644\u0625\u062f\u0627\u0631\u0629',
  beneficiary: '\u0627\u0644\u0645\u0633\u062a\u0641\u064a\u062f',
  pendingRequests: '\u0637\u0644\u0628\u0627\u062a \u0645\u0639\u0644\u0642\u0629',
  centerName: '\u0627\u0644\u0639\u064a\u0627\u062f\u0629 \u0627\u0644\u0633\u0648\u062f\u0627\u0646\u064a\u0629',
  closeMenu: '\u0625\u063a\u0644\u0627\u0642 \u0627\u0644\u0642\u0627\u0626\u0645\u0629',
  currentBeneficiary: '\u0627\u0644\u0645\u0633\u062a\u0641\u064a\u062f \u0627\u0644\u062d\u0627\u0644\u064a',
  familyMode: '\u0648\u0636\u0639 \u0627\u0644\u0623\u0633\u0631\u0629',
  logout: '\u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062e\u0631\u0648\u062c',
  management: '\u0627\u0644\u0625\u062f\u0627\u0631\u0629',
  mainSection: '\u0627\u0644\u0631\u0626\u064a\u0633\u064a\u0629',
  usersSection: '\u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645\u0648\u0646',
  gamesSection: '\u0627\u0644\u0623\u0644\u0639\u0627\u0628',
  additionsSection: '\u0627\u0644\u0625\u0636\u0627\u0641\u0627\u062a',
};

const PAGE_TITLES = {
  '/admin/dashboard': T.dashboard,
  '/admin/activity': T.activity,
  '/admin/patients': T.patients,
  '/admin/library': T.library,
  '/admin/games': T.games,
  '/admin/reports': T.reports,
  '/admin/therapists': T.therapists,
  '/admin/parents': T.parents,
};

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { adminSession, currentStudent, logoutAdmin, students } = useTherapyStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth >= 1024);

  if (!adminSession?.token) {
    return <Navigate to="/" replace state={{ mode: 'staff' }} />;
  }

  const activePath = Object.keys(PAGE_TITLES).find((path) => location.pathname.startsWith(path));
  const currentTitle = activePath ? PAGE_TITLES[activePath] : T.adminPanel;
  const activeStudentName = currentStudent?.name || T.beneficiary;
  const pendingPatientRequestsCount = Array.isArray(students)
    ? students.filter((student) => student?.requestStatus === 'PENDING').length
    : 0;

  const menuSections = [
    {
      title: T.mainSection,
      items: adminSession?.user?.role === 'SUPER_ADMIN'
        ? [
            { path: '/admin/dashboard', icon: LayoutDashboard, label: T.dashboard },
          ]
        : [],
    },
    {
      title: T.usersSection,
      items: [
        {
          path: '/admin/patients',
          icon: Users,
          label: T.patients,
          badgeCount: pendingPatientRequestsCount,
          badgeLabel: T.pendingRequests,
        },
        ...(adminSession?.user?.role === 'SUPER_ADMIN'
          ? [{ path: '/admin/therapists', icon: ShieldCheck, label: T.therapists }]
          : []),
        { path: '/admin/parents', icon: UsersRound, label: T.parents },
      ],
    },
    {
      title: T.gamesSection,
      items: [
        { path: '/admin/library', icon: FolderOpen, label: T.library },
        { path: '/admin/games', icon: Gamepad2, label: T.games },
      ],
    },
    {
      title: T.additionsSection,
      items: [
        ...(adminSession?.user?.role === 'SUPER_ADMIN'
          ? [{ path: '/admin/activity', icon: History, label: T.activity }]
          : []),
        { path: '/admin/reports', icon: FileText, label: T.reports },
      ],
    },
  ].filter((section) => section.items.length > 0);

  return (
    <div dir="rtl" className="h-screen w-full bg-[radial-gradient(circle_at_top,_#eaf7fb,_#f7fcfd_34%,_#ffffff_75%)] flex overflow-hidden font-arabic text-slate-800">
      <div
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ${
          isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsSidebarOpen(false)}
      />

      <aside
        className={`fixed lg:static top-0 right-0 h-full bg-white/95 border-l border-[#D9EAF2] z-50 flex-col shrink-0 transform transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] backdrop-blur-md ${
          isSidebarOpen ? 'w-[280px] translate-x-0 flex' : 'w-[280px] lg:w-[88px] translate-x-full lg:translate-x-0 flex'
        }`}
      >
        <div className={`h-[80px] flex items-center border-b border-[#D9EAF2] ${isSidebarOpen ? 'px-6 justify-between' : 'px-4 justify-center'}`}>
          <Link to="/admin/dashboard" className={`flex items-center ${isSidebarOpen ? 'gap-3' : 'justify-center'}`} onClick={() => setIsSidebarOpen(false)}>
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#EAF7FD] flex items-center justify-center border border-[#D9EAF2] shadow-sm">
              <img src="/logo.png" alt="Clinic" className="w-8 h-8 object-contain" />
            </div>
            <div className={isSidebarOpen ? 'block' : 'hidden'}>
              <div className="font-bold text-base text-slate-800">{T.centerName}</div>
              <div className="text-xs text-slate-500">{T.adminPanel}</div>
            </div>
          </Link>
          <button onClick={() => setIsSidebarOpen(false)} className="app-icon-button lg:hidden w-9 h-9 flex items-center justify-center rounded-xl transition-colors" aria-label={T.closeMenu}>
            <X size={18} />
          </button>
        </div>

        {isSidebarOpen && currentStudent && (
          <div className="mx-4 mt-4 rounded-[1.35rem] border border-[#dbe7f3] bg-[#f8fbfd] px-4 py-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#d3edf5] bg-gradient-to-br from-[#f0f9fb] to-[#e1f4f9] shadow-inner">
                <UserRound size={24} className="text-sky-600" strokeWidth={2.2} />
              </div>
              <div className="min-w-0 text-right">
                <div className="text-[11px] font-bold text-[#138fbc]">{T.currentBeneficiary}</div>
                <div className="truncate text-sm font-black text-slate-800">{activeStudentName}</div>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-3 py-4 admin-sidebar-scroll">
          <nav className="space-y-4">
            {menuSections.map((section) => (
              <div key={section.title} className="space-y-1.5">
                {isSidebarOpen ? (
                  <div className="px-3 text-[11px] font-black uppercase tracking-wide text-slate-400">
                    {section.title}
                  </div>
                ) : (
                  <div className="mx-auto h-px w-8 bg-slate-100" />
                )}

                <div className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname.startsWith(item.path);
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setIsSidebarOpen(false)}
                        title={item.badgeCount > 0 ? item.label + ' - ' + item.badgeCount + ' ' + item.badgeLabel : item.label}
                        className={[
                          'relative w-full flex items-center rounded-xl font-bold text-sm transition-all duration-200',
                          isSidebarOpen ? 'gap-3 px-4 py-2.5 justify-start' : 'justify-center px-0 py-2.5',
                          isActive ? 'admin-nav-active shadow-sm' : 'admin-nav-idle',
                        ].join(' ')}
                      >
                        <span className="relative inline-flex">
                          <Icon size={20} strokeWidth={2} className={isActive ? 'text-white' : 'text-[#64748B]'} />
                          {!isSidebarOpen && item.badgeCount > 0 && (
                            <span className="absolute -right-2 -top-2 flex min-h-[17px] min-w-[17px] items-center justify-center rounded-full border-2 border-white bg-orange-500 px-1 text-[9px] font-black leading-none text-white shadow-md">
                              {item.badgeCount > 9 ? '9+' : item.badgeCount}
                            </span>
                          )}
                        </span>
                        <span className={isSidebarOpen ? 'block truncate' : 'hidden'}>{item.label}</span>
                        {isSidebarOpen && item.badgeCount > 0 && (
                          <span className="mr-auto inline-flex min-h-[22px] min-w-[22px] items-center justify-center rounded-full border border-orange-200 bg-orange-50 px-1.5 text-[11px] font-black text-orange-600 shadow-sm">
                            {item.badgeCount > 99 ? '99+' : item.badgeCount}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        <div className="border-t border-[#D9EAF2] bg-white/95 p-3 space-y-1">
          <Link to="/" state={{ mode: 'student' }} onClick={() => setIsSidebarOpen(false)} className={`w-full flex items-center py-2.5 rounded-xl font-bold text-sm admin-nav-idle transition-colors ${isSidebarOpen ? 'gap-4 px-5 justify-start' : 'justify-center px-0'}`}>
            <ArrowLeft size={20} strokeWidth={2} className="text-slate-500" />
            <span className={isSidebarOpen ? 'block' : 'hidden'}>{T.familyMode}</span>
          </Link>

          <button
            onClick={() => {
              logoutAdmin();
              navigate('/', { state: { mode: 'staff' } });
            }}
            className={`w-full flex items-center py-2.5 rounded-xl font-bold text-sm border border-transparent text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors ${isSidebarOpen ? 'gap-4 px-5 justify-start' : 'justify-center px-0'}`}
          >
            <LogOut size={20} strokeWidth={2} className="text-red-500" />
            <span className={isSidebarOpen ? 'block' : 'hidden'}>{T.logout}</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 h-full min-w-0 overflow-y-auto page-scroll-left">
        <header className="sticky top-0 z-30 h-[80px] bg-white/90 border-b border-[#D9EAF2] px-4 md:px-6 flex items-center justify-between shrink-0 backdrop-blur-md">
          <div className="flex items-center gap-3 md:gap-4">
            <button onClick={() => setIsSidebarOpen((prev) => !prev)} className="app-icon-button w-10 h-10 flex items-center justify-center rounded-xl transition-colors">
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="flex items-center gap-2 rounded-2xl border border-[#D9EAF2] bg-[#EAF7FD] px-4 py-2 shadow-sm">
              <span className="font-black text-[#0F6FA6]">{currentTitle}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2.5 rounded-2xl border border-[#D9EAF2] bg-white px-2.5 py-1.5 shadow-sm lg:flex">
              <div className="text-right leading-tight">
                <div className="text-[10px] font-bold text-[#138fbc]">{currentStudent ? T.currentBeneficiary : T.dashboard}</div>
                <div className="max-w-[120px] truncate text-sm font-black text-slate-800">{currentStudent ? activeStudentName : adminSession?.name || T.management}</div>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#d3edf5] bg-gradient-to-br from-[#f0f9fb] to-[#e1f4f9] shadow-inner">
                <UserRound size={20} className="text-sky-600" strokeWidth={2.2} />
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-8">
          <div className="w-full">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;