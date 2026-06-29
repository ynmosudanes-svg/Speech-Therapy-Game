import React, { useEffect, useMemo, useState } from 'react';
import { Activity, Filter, RefreshCw, Search } from 'lucide-react';
import auditService from '../../services/auditService';
import { useTherapyStore } from '../../hooks/useTherapyStore';

const ACTION_LABELS = {
  LOGIN_SUCCESS: '\u062a\u0633\u062c\u064a\u0644 \u062f\u062e\u0648\u0644',
  STUDENT_LOGIN_SUCCESS: '\u062f\u062e\u0648\u0644 \u0637\u0627\u0644\u0628',
  PATIENT_LOGIN_SUCCESS: '\u062f\u062e\u0648\u0644 \u0645\u0631\u064a\u0636',
  PARENT_REGISTERED: '\u062a\u0633\u062c\u064a\u0644 \u0648\u0644\u064a \u0623\u0645\u0631',
  USER_CREATED: '\u0625\u0646\u0634\u0627\u0621 \u0645\u0633\u062a\u062e\u062f\u0645',
  USER_UPDATED: '\u062a\u0639\u062f\u064a\u0644 \u0645\u0633\u062a\u062e\u062f\u0645',
  USER_ROLE_CHANGED: '\u062a\u063a\u064a\u064a\u0631 \u062f\u0648\u0631 \u0645\u0633\u062a\u062e\u062f\u0645',
  USER_DEACTIVATED: '\u062a\u0639\u0637\u064a\u0644 \u0645\u0633\u062a\u062e\u062f\u0645',
  USER_DELETED: '\u062d\u0630\u0641 \u0645\u0633\u062a\u062e\u062f\u0645',
  GAME_CREATED: '\u0625\u0646\u0634\u0627\u0621 \u0644\u0639\u0628\u0629',
  GAME_UPDATED: '\u062a\u0639\u062f\u064a\u0644 \u0644\u0639\u0628\u0629',
  GAME_SUBMITTED_FOR_REVIEW: '\u0625\u0631\u0633\u0627\u0644 \u0644\u0644\u0645\u0631\u0627\u062c\u0639\u0629',
  GAME_APPROVED: '\u0627\u0639\u062a\u0645\u0627\u062f \u0627\u0644\u0645\u062d\u062a\u0648\u0649',
  GAME_REJECTED: '\u0631\u0641\u0636 \u0627\u0644\u0645\u062d\u062a\u0648\u0649',
  GAME_PUBLISHED: '\u0646\u0634\u0631 \u0644\u0639\u0628\u0629',
  GAME_ARCHIVED: '\u0623\u0631\u0634\u0641\u0629 \u0644\u0639\u0628\u0629',
  GAME_RESTORED: '\u0627\u0633\u062a\u0639\u0627\u062f\u0629 \u0644\u0639\u0628\u0629',
  GAME_VERSION_RESTORED: '\u0627\u0633\u062a\u0639\u0627\u062f\u0629 \u0646\u0633\u062e\u0629',
  GAME_PERMANENT_DELETED: '\u062d\u0630\u0641 \u0646\u0647\u0627\u0626\u064a',
  FILE_UPLOADED: '\u0631\u0641\u0639 \u0645\u0644\u0641',
  FILE_DELETED: '\u062d\u0630\u0641 \u0645\u0644\u0641',
  FILES_MOVED: '\u0646\u0642\u0644 \u0645\u0644\u0641\u0627\u062a',
  IMAGE_LIBRARY_SAVED: '\u062d\u0641\u0638 \u0635\u0648\u0631\u0629',
  IMAGE_LIBRARY_DELETED: '\u062d\u0630\u0641 \u0635\u0648\u0631\u0629',
  MEDIA_FOLDER_CREATED: '\u0625\u0646\u0634\u0627\u0621 \u0645\u062c\u0644\u062f',
  MEDIA_FOLDER_DELETED: '\u062d\u0630\u0641 \u0645\u062c\u0644\u062f',
};

const ENTITY_LABELS = {
  User: '\u0645\u0633\u062a\u062e\u062f\u0645',
  Student: '\u0637\u0627\u0644\u0628',
  Game: '\u0644\u0639\u0628\u0629',
  MediaAsset: '\u0645\u0644\u0641',
  ImageLibrary: '\u0645\u0643\u062a\u0628\u0629 \u0627\u0644\u0635\u0648\u0631',
  MediaFolder: '\u0645\u062c\u0644\u062f',
};

const T = {
  title: '\u0633\u062c\u0644 \u0627\u0644\u0646\u0634\u0627\u0637',
  subtitle: '\u0645\u062a\u0627\u0628\u0639\u0629 \u0627\u0644\u0639\u0645\u0644\u064a\u0627\u062a \u0644\u0645\u0639\u0631\u0641\u0629 \u0645\u0646 \u0639\u062f\u0644 \u0623\u0648 \u0631\u0641\u0639 \u0623\u0648 \u062d\u0630\u0641 \u062f\u0627\u062e\u0644 \u0627\u0644\u0646\u0638\u0627\u0645.',
  refresh: '\u062a\u062d\u062f\u064a\u062b',
  search: '\u0627\u0628\u062d\u062b \u0641\u064a \u0627\u0644\u0639\u0645\u0644\u064a\u0629 \u0623\u0648 \u0627\u0644\u0639\u0646\u0635\u0631 \u0623\u0648 \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645',
  allActions: '\u0643\u0644 \u0627\u0644\u0639\u0645\u0644\u064a\u0627\u062a',
  action: '\u0627\u0644\u0639\u0645\u0644\u064a\u0629',
  entity: '\u0627\u0644\u0639\u0646\u0635\u0631 \u0627\u0644\u0645\u062a\u0623\u062b\u0631',
  actor: '\u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645',
  date: '\u0627\u0644\u062a\u0627\u0631\u064a\u062e',
  loading: '\u062c\u0627\u0631\u064a \u062a\u062d\u0645\u064a\u0644 \u0627\u0644\u0633\u062c\u0644...',
  empty: '\u0644\u0627 \u062a\u0648\u062c\u062f \u0639\u0645\u0644\u064a\u0627\u062a \u0645\u0637\u0627\u0628\u0642\u0629.',
  unknownUser: '\u0645\u0633\u062a\u062e\u062f\u0645 \u063a\u064a\u0631 \u0645\u0639\u0631\u0648\u0641',
};

const formatDate = (value) => {
  if (!value) return '--';
  try {
    return new Intl.DateTimeFormat('ar-EG', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return String(value);
  }
};

const getActionLabel = (action) => ACTION_LABELS[action] || action || '--';
const getEntityLabel = (entityType) => ENTITY_LABELS[entityType] || entityType || '--';
const getActorLabel = (log) => log.actor?.name || log.actorName || log.actorEmail || log.actorId || T.unknownUser;

const ActivityLogPage = () => {
  const { adminSession } = useTherapyStore();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const loadLogs = async () => {
    if (!adminSession?.token) return;
    setLoading(true);
    try {
      const response = await auditService.getAuditLogs(adminSession.token, { limit: 250 });
      setLogs(Array.isArray(response?.data) ? response.data : []);
    } catch (error) {
      console.error('Error loading audit logs:', error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [adminSession?.token]);

  const actions = useMemo(() => Array.from(new Set(logs.map((log) => log.action).filter(Boolean))).sort(), [logs]);
  const filteredLogs = useMemo(() => {
    const normalizedQuery = String(query || '').trim().toLowerCase();
    return logs.filter((log) => {
      const matchesAction = !actionFilter || log.action === actionFilter;
      const haystack = [
        log.action,
        getActionLabel(log.action),
        log.entityType,
        getEntityLabel(log.entityType),
        log.entityId,
        log.actorId,
        log.actorRole,
        log.ipAddress,
        getActorLabel(log),
      ].join(' ').toLowerCase();
      return matchesAction && (!normalizedQuery || haystack.includes(normalizedQuery));
    });
  }, [actionFilter, logs, query]);

  return (
    <div className="space-y-5" dir="rtl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900">{T.title}</h2>
          <p className="mt-2 text-slate-500">{T.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={loadLogs}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 font-bold text-slate-700 shadow-sm hover:bg-slate-50"
        >
          <RefreshCw size={18} />
          {T.refresh}
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_16rem]">
        <div className="relative">
          <Search size={18} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full rounded-xl border border-[#dbe7f3] bg-white py-3 pl-4 pr-11 text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            placeholder={T.search}
          />
        </div>
        <div className="relative">
          <Filter size={18} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <select
            value={actionFilter}
            onChange={(event) => setActionFilter(event.target.value)}
            className="w-full appearance-none rounded-xl border border-[#dbe7f3] bg-white py-3 pl-4 pr-11 font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          >
            <option value="">{T.allActions}</option>
            {actions.map((action) => (
              <option key={action} value={action}>{getActionLabel(action)}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#dbe7f3] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] border-collapse text-right">
            <thead>
              <tr className="border-b border-[#dbe7f3] bg-slate-50">
                <th className="px-5 py-4 text-sm font-black text-slate-500">{T.action}</th>
                <th className="px-5 py-4 text-sm font-black text-slate-500">{T.entity}</th>
                <th className="px-5 py-4 text-sm font-black text-slate-500">{T.actor}</th>
                <th className="px-5 py-4 text-sm font-black text-slate-500">IP</th>
                <th className="px-5 py-4 text-sm font-black text-slate-500">{T.date}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="5" className="px-5 py-12 text-center font-bold text-slate-500">{T.loading}</td></tr>
              ) : filteredLogs.length ? (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <div className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-1.5 font-black text-blue-700">
                        <Activity size={16} />
                        {getActionLabel(log.action)}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-black text-slate-800">{getEntityLabel(log.entityType)}</div>
                      <div className="mt-1 text-xs font-bold text-slate-400">{log.entityId || '--'}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-700">{getActorLabel(log)}</div>
                      <div className="mt-1 text-xs font-bold text-slate-400">{log.actorRole || '--'}</div>
                    </td>
                    <td className="px-5 py-4 text-sm font-bold text-slate-500">{log.ipAddress || '--'}</td>
                    <td className="px-5 py-4 text-sm font-bold text-slate-500">{formatDate(log.createdAt)}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="5" className="px-5 py-12 text-center font-bold text-slate-500">{T.empty}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ActivityLogPage;
