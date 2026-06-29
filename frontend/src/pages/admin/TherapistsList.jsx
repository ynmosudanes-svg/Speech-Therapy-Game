import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit, EyeOff, Plus, Search, ShieldAlert, ShieldCheck, Trash2, UserCheck } from 'lucide-react';
import Button from '../../components/Button';
import ConfirmModal from '../../components/ConfirmModal';
import { useTherapyStore } from '../../hooks/useTherapyStore';
import { therapistService } from '../../services/therapistService';

const T = {
  title: '\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645\u064a\u0646',
  subtitle: '\u0623\u0636\u0641 \u0627\u0644\u062d\u0633\u0627\u0628\u0627\u062a \u0648\u062d\u062f\u062f \u062f\u0648\u0631 \u0643\u0644 \u0634\u062e\u0635 \u062f\u0627\u062e\u0644 \u0644\u0648\u062d\u0629 \u0627\u0644\u062a\u062d\u0643\u0645.',
  search: '\u0627\u0628\u062d\u062b \u0639\u0646 \u0645\u0633\u062a\u062e\u062f\u0645...',
  addUser: '\u0625\u0636\u0627\u0641\u0629 \u0645\u0633\u062a\u062e\u062f\u0645',
  active: '\u062d\u0633\u0627\u0628 \u0646\u0634\u0637',
  inactive: '\u063a\u064a\u0631 \u0646\u0634\u0637',
  edit: '\u062a\u0639\u062f\u064a\u0644',
  deactivate: '\u062a\u0639\u0637\u064a\u0644',
  activate: '\u062a\u0641\u0639\u064a\u0644',
  delete: '\u062d\u0630\u0641',
  noUsers: '\u0644\u0627 \u062a\u0648\u062c\u062f \u062d\u0633\u0627\u0628\u0627\u062a \u0645\u0637\u0627\u0628\u0642\u0629',
  sessionError: '\u062c\u0644\u0633\u0629 \u0627\u0644\u0625\u062f\u0627\u0631\u0629 \u063a\u064a\u0631 \u0645\u062a\u0627\u062d\u0629. \u0633\u062c\u0644 \u0627\u0644\u062f\u062e\u0648\u0644 \u0645\u0631\u0629 \u0623\u062e\u0631\u0649.',
  fetchError: '\u062d\u062f\u062b \u062e\u0637\u0623 \u0623\u062b\u0646\u0627\u0621 \u062c\u0644\u0628 \u0627\u0644\u062d\u0633\u0627\u0628\u0627\u062a.',
  actionError: '\u062d\u062f\u062b \u062e\u0637\u0623 \u0623\u062b\u0646\u0627\u0621 \u062a\u0646\u0641\u064a\u0630 \u0627\u0644\u0625\u062c\u0631\u0627\u0621.',
  confirmDeleteTitle: '\u062d\u0630\u0641 \u0627\u0644\u062d\u0633\u0627\u0628',
  confirmDeactivateTitle: '\u062a\u0639\u0637\u064a\u0644 \u0627\u0644\u062d\u0633\u0627\u0628',
  confirmActivateTitle: '\u062a\u0641\u0639\u064a\u0644 \u0627\u0644\u062d\u0633\u0627\u0628',
  confirmDeleteMessage: '\u0647\u0644 \u0623\u0646\u062a \u0645\u062a\u0623\u0643\u062f \u0645\u0646 \u062d\u0630\u0641 \u0647\u0630\u0627 \u0627\u0644\u062d\u0633\u0627\u0628\u061f',
  confirmDeactivateMessage: '\u0644\u0646 \u064a\u062a\u0645\u0643\u0646 \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645 \u0645\u0646 \u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644 \u062d\u062a\u0649 \u064a\u062a\u0645 \u062a\u0641\u0639\u064a\u0644\u0647 \u0645\u0631\u0629 \u0623\u062e\u0631\u0649.',
  confirmActivateMessage: '\u0633\u064a\u062a\u0645\u0643\u0646 \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645 \u0645\u0646 \u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644 \u0645\u0631\u0629 \u0623\u062e\u0631\u0649.',
  yes: '\u0646\u0639\u0645',
  cancel: '\u0625\u0644\u063a\u0627\u0621',
};

const ROLE_LABELS = {
  SUPER_ADMIN: '\u0645\u0633\u0624\u0648\u0644 \u0631\u0626\u064a\u0633\u064a',
  ADMIN: '\u0623\u062f\u0645\u0646 \u0645\u062d\u062a\u0648\u0649',
  DATA_ENTRY: '\u0645\u062f\u062e\u0644 \u0628\u064a\u0627\u0646\u0627\u062a',
  THERAPIST: '\u0623\u062e\u0635\u0627\u0626\u064a',
};

const ROLE_STYLES = {
  SUPER_ADMIN: 'border-amber-100 bg-amber-50 text-amber-700',
  ADMIN: 'border-blue-100 bg-blue-50 text-blue-700',
  DATA_ENTRY: 'border-sky-100 bg-sky-50 text-sky-700',
  THERAPIST: 'border-emerald-100 bg-emerald-50 text-emerald-700',
};

const TherapistsList = () => {
  const navigate = useNavigate();
  const { adminSession } = useTherapyStore();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null, currentStatus: false, actionType: null });

  const loadUsers = async () => {
    if (!adminSession?.token) {
      setUsers([]);
      setError(T.sessionError);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await therapistService.getTherapists(adminSession.token);
      setUsers(Array.isArray(response?.data) ? response.data : []);
    } catch (_fetchError) {
      setUsers([]);
      setError(T.fetchError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [adminSession?.token]);

  const displayedUsers = useMemo(() => {
    const list = Array.isArray(users) ? [...users] : [];
    const currentAdminId = adminSession?.user?.id;
    const alreadyIncluded = list.some((user) => String(user.id) === String(currentAdminId));

    if (adminSession?.user?.role === 'SUPER_ADMIN' && currentAdminId && !alreadyIncluded) {
      list.unshift({
        id: currentAdminId,
        name: adminSession?.name || adminSession?.user?.name || ROLE_LABELS.SUPER_ADMIN,
        email: adminSession?.email || adminSession?.user?.email || '',
        role: 'SUPER_ADMIN',
        isActive: true,
      });
    }

    const query = searchTerm.trim().toLowerCase();
    if (!query) return list;
    return list.filter((user) => [user.name, user.email, ROLE_LABELS[user.role], user.role].join(' ').toLowerCase().includes(query));
  }, [adminSession, searchTerm, users]);

  const executeConfirmAction = async () => {
    const { id, currentStatus, actionType } = confirmModal;
    setConfirmModal({ isOpen: false, id: null, currentStatus: false, actionType: null });

    try {
      setError('');
      if (actionType === 'delete') {
        await therapistService.deleteTherapist(adminSession.token, id);
      } else if (currentStatus) {
        await therapistService.deactivateTherapist(adminSession.token, id);
      } else {
        await therapistService.updateTherapist(adminSession.token, id, { isActive: true });
      }
      await loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || T.actionError);
    }
  };

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><div className="h-12 w-12 animate-spin rounded-full border-4 border-cyan-200 border-t-[#178bb6]" /></div>;
  }

  return (
    <div className="space-y-8 font-sans text-slate-800" dir="rtl">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-50 text-[#178bb6]"><ShieldCheck size={28} strokeWidth={2.5} /></div>
          <div><h1 className="text-2xl font-black text-slate-900">{T.title}</h1><p className="mt-1 text-sm text-slate-500">{T.subtitle}</p></div>
        </div>
        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <div className="relative w-full sm:w-72">
            <Search size={18} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder={T.search} value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-4 pr-11 text-slate-900 outline-none transition-all focus:border-[#178bb6] focus:ring-4 focus:ring-cyan-500/10" />
          </div>
          <button onClick={() => navigate('/admin/therapists/create')} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#178bb6] to-cyan-500 px-6 py-3 font-bold text-white shadow-md shadow-cyan-500/30 transition-all hover:from-[#126d8f] hover:to-[#178bb6] sm:w-auto"><Plus size={20} strokeWidth={2.5} />{T.addUser}</button>
        </div>
      </div>

      {error && <div className="rounded-2xl border border-red-100 bg-red-50 p-4 font-bold text-red-600">{error}</div>}

      {displayedUsers.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[2rem] border border-slate-100 bg-white p-12 text-center shadow-sm">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-slate-50 text-slate-400"><ShieldAlert size={40} /></div>
          <h3 className="mb-3 text-2xl font-black text-slate-900">{T.noUsers}</h3>
          <Button onClick={() => navigate('/admin/therapists/create')} variant="primary" className="bg-[#178bb6] hover:bg-[#126d8f]">{T.addUser}</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {displayedUsers.map((user) => {
            const isSuperAdmin = user.role === 'SUPER_ADMIN';
            return (
              <div key={user.id} className="relative flex min-h-[16rem] flex-col overflow-hidden rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl">
                <div className="absolute right-0 top-0 h-32 w-32 rounded-bl-full bg-gradient-to-br from-cyan-50 to-transparent opacity-60" />
                <div className="relative z-10 mb-6 flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#178bb6] to-cyan-400 text-2xl font-black text-white shadow-md">{String(user.name || '?').charAt(0).toUpperCase()}</div>
                  <div className="min-w-0"><h2 className="truncate text-xl font-black text-slate-900">{user.name}</h2><p className="truncate text-sm font-medium text-slate-500">{user.email}</p></div>
                </div>

                <div className="relative z-10 mt-auto flex flex-wrap gap-2 border-t border-slate-50 pt-4">
                  <span className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold ${ROLE_STYLES[user.role] || 'border-slate-200 bg-slate-50 text-slate-600'}`}><ShieldCheck size={14} />{ROLE_LABELS[user.role] || user.role}</span>
                  <span className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold ${user.isActive ? 'border-emerald-100 bg-emerald-50 text-emerald-600' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>{user.isActive ? <UserCheck size={14} /> : <EyeOff size={14} />}{user.isActive ? T.active : T.inactive}</span>
                </div>

                <div className="relative z-10 mt-5 flex flex-wrap gap-2">
                  <button onClick={() => navigate(`/admin/therapists/edit/${user.id}`)} className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700 ring-1 ring-slate-200 transition-colors hover:bg-slate-200"><Edit size={16} />{T.edit}</button>
                  {!isSuperAdmin && (
                    <button onClick={() => setConfirmModal({ isOpen: true, id: user.id, currentStatus: user.isActive, actionType: 'toggle' })} className="inline-flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-100">{user.isActive ? <EyeOff size={16} /> : <UserCheck size={16} />}{user.isActive ? T.deactivate : T.activate}</button>
                  )}
                  {!isSuperAdmin && (
                    <button onClick={() => setConfirmModal({ isOpen: true, id: user.id, currentStatus: false, actionType: 'delete' })} className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-600 transition-colors hover:bg-red-100"><Trash2 size={16} />{T.delete}</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, id: null, currentStatus: false, actionType: null })}
        onConfirm={executeConfirmAction}
        title={confirmModal.actionType === 'delete' ? T.confirmDeleteTitle : confirmModal.currentStatus ? T.confirmDeactivateTitle : T.confirmActivateTitle}
        message={confirmModal.actionType === 'delete' ? T.confirmDeleteMessage : confirmModal.currentStatus ? T.confirmDeactivateMessage : T.confirmActivateMessage}
        confirmText={T.yes}
        cancelText={T.cancel}
        isDestructive={confirmModal.actionType === 'delete' || confirmModal.currentStatus}
        position="top"
      />
    </div>
  );
};

export default TherapistsList;
