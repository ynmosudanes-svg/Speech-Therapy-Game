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
  Bell,
  UserRound,
  UsersRound,
} from 'lucide-react';
import { useTherapyStore } from '../hooks/useTherapyStore';

const PAGE_TITLES = {
  '/admin/dashboard': 'لوحة التحكم',
  '/admin/patients': 'المرضى',
  '/admin/library': 'مكتبة الألعاب',
  '/admin/games': 'الألعاب',
  '/admin/reports': 'التقارير',
  '/admin/therapists': 'الأخصائيون',
  '/admin/parents': 'أولياء الأمور',
};

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { adminSession, currentStudent, logoutAdmin } = useTherapyStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth >= 1024);

  if (!adminSession?.token) {
    return <Navigate to="/" replace state={{ mode: 'staff' }} />;
  }

  const activePath = Object.keys(PAGE_TITLES).find((path) => location.pathname.startsWith(path));
  const currentTitle = activePath ? PAGE_TITLES[activePath] : 'لوحة الإدارة';

  const activeStudentName = currentStudent?.name || 'المستفيد';

  const menuItems = [
    ...(adminSession?.user?.role === 'SUPER_ADMIN'
      ? [{ path: '/admin/dashboard', icon: LayoutDashboard, label: 'لوحة التحكم' }]
      : []),
    { path: '/admin/patients', icon: Users, label: 'المرضى' },
    { path: '/admin/library', icon: FolderOpen, label: 'المكتبة' },
    { path: '/admin/games', icon: Gamepad2, label: 'الألعاب' },
    { path: '/admin/reports', icon: FileText, label: 'التقارير' },
    ...(adminSession?.user?.role === 'SUPER_ADMIN'
      ? [{ path: '/admin/therapists', icon: ShieldCheck, label: 'الأخصائيون' }]
      : []),
    { path: '/admin/parents', icon: UsersRound, label: 'أولياء الأمور' },
  ];

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
        <div
          className={`h-[80px] flex items-center border-b border-[#D9EAF2] ${
            isSidebarOpen ? 'px-6 justify-between' : 'px-4 justify-center'
          }`}
        >
          <Link
            to="/admin/dashboard"
            className={`flex items-center ${isSidebarOpen ? 'gap-3' : 'justify-center'}`}
            onClick={() => setIsSidebarOpen(false)}
          >
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#EAF7FD] flex items-center justify-center border border-[#D9EAF2] shadow-sm">
              <img src="/logo.png" alt="Clinic" className="w-8 h-8 object-contain" />
            </div>
            <div className={isSidebarOpen ? 'block' : 'hidden'}>
              <div className="font-bold text-base text-slate-800">{adminSession?.name || 'لوحة الإدارة'}</div>
              <div className="text-xs text-slate-500">مركز التأهيل والتخاطب</div>
            </div>
          </Link>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="app-icon-button lg:hidden w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
            aria-label="إغلاق القائمة"
          >
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
                <div className="text-[11px] font-bold text-[#138fbc]">المستفيد الحالي</div>
                <div className="truncate text-sm font-black text-slate-800">{activeStudentName}</div>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5 admin-sidebar-scroll">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`w-full flex items-center py-3.5 rounded-2xl font-bold text-[16px] transition-all duration-200 ${
                  isSidebarOpen ? 'gap-4 px-5 justify-start' : 'justify-center px-0'
                } ${
                  isActive
                    ? 'admin-nav-active'
                    : 'admin-nav-idle'
                }`}
              >
                <Icon size={22} strokeWidth={2} className={isActive ? 'text-white' : 'text-[#64748B]'} />
                <span className={isSidebarOpen ? 'block' : 'hidden'}>{item.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-[#D9EAF2] space-y-1.5 bg-white/95">
          <Link
            to="/"
            state={{ mode: 'student' }}
            onClick={() => setIsSidebarOpen(false)}
            className={`w-full flex items-center py-3.5 rounded-2xl font-bold text-[16px] admin-nav-idle transition-colors ${
              isSidebarOpen ? 'gap-4 px-5 justify-start' : 'justify-center px-0'
            }`}
          >
            <ArrowLeft size={22} strokeWidth={2} className="text-slate-500" />
            <span className={isSidebarOpen ? 'block' : 'hidden'}>وضع الأسرة</span>
          </Link>

          <button
            onClick={() => {
              logoutAdmin();
              navigate('/', { state: { mode: 'staff' } });
            }}
            className={`w-full flex items-center py-3.5 rounded-2xl font-bold text-[16px] border border-transparent text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors ${
              isSidebarOpen ? 'gap-4 px-5 justify-start' : 'justify-center px-0'
            }`}
          >
            <LogOut size={22} strokeWidth={2} className="text-red-500" />
            <span className={isSidebarOpen ? 'block' : 'hidden'}>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 h-full min-w-0 overflow-y-auto page-scroll-left">
        <header className="sticky top-0 z-30 h-[80px] bg-white/90 border-b border-[#D9EAF2] px-4 md:px-6 flex items-center justify-between shrink-0 backdrop-blur-md">
          <div className="flex items-center gap-3 md:gap-4">
            <button
              onClick={() => setIsSidebarOpen((prev) => !prev)}
              className="app-icon-button w-10 h-10 flex items-center justify-center rounded-xl transition-colors"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <div className="flex items-center gap-2 rounded-2xl border border-[#D9EAF2] bg-[#EAF7FD] px-4 py-2 shadow-sm">
              <span className="font-black text-[#0F6FA6]">{currentTitle}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 rounded-2xl border border-[#D9EAF2] bg-white px-2.5 py-1.5 shadow-sm">
              <div className="text-right leading-tight">
                <div className="text-[10px] font-bold text-[#138fbc]">
                  {currentStudent ? 'المستفيد الحالي' : 'لوحة التحكم'}
                </div>
                <div className="max-w-[120px] truncate text-sm font-black text-slate-800">
                  {currentStudent ? activeStudentName : adminSession?.name || 'الإدارة'}
                </div>
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
