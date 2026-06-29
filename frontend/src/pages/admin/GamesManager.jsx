import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Archive, Check, CheckCircle2, Clock3, Copy, Edit2, Gamepad2, History, PencilLine, Plus, Radio, RotateCcw, Search, Send, Trash2, XCircle } from 'lucide-react';
import Button from '../../components/Button';
import ConfirmModal from '../../components/ConfirmModal';
import gameService from '../../services/gameService';
import { useTherapyStore } from '../../hooks/useTherapyStore';
import { PERMISSIONS, hasPermission } from '../../utils/permissions';

const T = {
  title: '\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0623\u0644\u0639\u0627\u0628',
  subtitle: '\u0645\u062a\u0627\u0628\u0639\u0629 \u062d\u0627\u0644\u0627\u062a \u0627\u0644\u0623\u0644\u0639\u0627\u0628 \u0648\u0627\u0644\u0645\u0631\u0627\u062c\u0639\u0629 \u0648\u0627\u0644\u0623\u0631\u0634\u064a\u0641',
  search: '\u0627\u0628\u062d\u062b \u0628\u0643\u0648\u062f \u0627\u0644\u0644\u0639\u0628\u0629 \u0623\u0648 \u0627\u0644\u0627\u0633\u0645',
  newGame: '\u0644\u0639\u0628\u0629 \u062c\u062f\u064a\u062f\u0629',
  visible: '\u0644\u0639\u0628\u0629 \u0638\u0627\u0647\u0631\u0629 \u0641\u064a \u0627\u0644\u0646\u062a\u0627\u0626\u062c',
  name: '\u0627\u0633\u0645 \u0627\u0644\u0644\u0639\u0628\u0629',
  code: '\u0627\u0644\u0643\u0648\u062f',
  status: '\u0627\u0644\u062d\u0627\u0644\u0629',
  activities: '\u0627\u0644\u0623\u0646\u0634\u0637\u0629',
  actions: '\u0625\u062c\u0631\u0627\u0621\u0627\u062a',
  noGames: '\u0644\u0627 \u062a\u0648\u062c\u062f \u0623\u0644\u0639\u0627\u0628 \u0645\u0637\u0627\u0628\u0642\u0629',
  loading: '\u062c\u0627\u0631\u064a \u062a\u062d\u0645\u064a\u0644 \u0627\u0644\u0623\u0644\u0639\u0627\u0628...',
  copy: '\u0646\u0633\u062e',
  copied: '\u062a\u0645 \u0627\u0644\u0646\u0633\u062e',
  copyLink: '\u0646\u0633\u062e \u0631\u0627\u0628\u0637 \u0627\u0644\u0644\u0639\u0628\u0629',
  edit: '\u062a\u0639\u062f\u064a\u0644',
  versions: '\u0627\u0644\u0646\u0633\u062e \u0627\u0644\u0633\u0627\u0628\u0642\u0629',
  submitReview: '\u0625\u0631\u0633\u0627\u0644 \u0644\u0644\u0645\u0631\u0627\u062c\u0639\u0629',
  approve: '\u0627\u0639\u062a\u0645\u0627\u062f \u0627\u0644\u0645\u062d\u062a\u0648\u0649',
  reject: '\u0631\u0641\u0636 \u0645\u0639 \u0645\u0644\u0627\u062d\u0638\u0627\u062a',
  publish: '\u0646\u0634\u0631',
  restore: '\u0627\u0633\u062a\u0639\u0627\u062f\u0629',
  archive: '\u0623\u0631\u0634\u0641\u0629',
  permanentDelete: '\u062d\u0630\u0641 \u0646\u0647\u0627\u0626\u064a',
  note: '\u0645\u0644\u0627\u062d\u0638\u0629',
  rejectTitle: '\u0631\u0641\u0636 \u0627\u0644\u0645\u062d\u062a\u0648\u0649',
  rejectHelp: '\u0627\u0643\u062a\u0628 \u0645\u0644\u0627\u062d\u0638\u0627\u062a \u0627\u0644\u0645\u0631\u0627\u062c\u0639\u0629',
  rejectConfirm: '\u0631\u0641\u0636 \u0648\u0625\u0631\u062c\u0627\u0639 \u0644\u0644\u0645\u0633\u0648\u062f\u0629',
  cancel: '\u0625\u0644\u063a\u0627\u0621',
  close: '\u0625\u063a\u0644\u0627\u0642',
  version: '\u0627\u0644\u0646\u0633\u062e\u0629',
  operation: '\u0627\u0644\u0639\u0645\u0644\u064a\u0629',
  date: '\u0627\u0644\u062a\u0627\u0631\u064a\u062e',
  loadVersions: '\u062c\u0627\u0631\u064a \u062a\u062d\u0645\u064a\u0644 \u0627\u0644\u0646\u0633\u062e...',
  noVersions: '\u0644\u0627 \u062a\u0648\u062c\u062f \u0646\u0633\u062e \u0645\u062d\u0641\u0648\u0638\u0629',
  archiveGame: '\u0623\u0631\u0634\u0641\u0629 \u0627\u0644\u0644\u0639\u0628\u0629',
  archiveMessage: '\u0633\u064a\u062a\u0645 \u0625\u062e\u0641\u0627\u0621 \u0627\u0644\u0644\u0639\u0628\u0629 \u0648\u064a\u0645\u0643\u0646 \u0627\u0633\u062a\u0639\u0627\u062f\u062a\u0647\u0627 \u0644\u0627\u062d\u0642\u0627',
  deleteMessage: '\u0647\u0644 \u0623\u0646\u062a \u0645\u062a\u0623\u0643\u062f \u0645\u0646 \u0627\u0644\u062d\u0630\u0641 \u0627\u0644\u0646\u0647\u0627\u0626\u064a\u061f',
  yes: '\u0646\u0639\u0645',
  errorTitle: '\u062a\u0639\u0630\u0631 \u062a\u0646\u0641\u064a\u0630 \u0627\u0644\u0639\u0645\u0644\u064a\u0629',
  errorMessage: '\u062d\u062f\u062b \u062e\u0637\u0623. \u062d\u0627\u0648\u0644 \u0645\u0631\u0629 \u0623\u062e\u0631\u0649',
  previous: '\u0627\u0644\u0633\u0627\u0628\u0642',
  next: '\u0627\u0644\u062a\u0627\u0644\u064a',
  pageSummary: '\u0639\u0631\u0636',
  of: '\u0645\u0646',
  game: '\u0644\u0639\u0628\u0629',
};

const STATUS_LABELS = {
  DRAFT: '\u0645\u0633\u0648\u062f\u0629',
  UNDER_REVIEW: '\u0642\u064a\u062f \u0627\u0644\u0645\u0631\u0627\u062c\u0639\u0629',
  APPROVED: '\u0645\u0639\u062a\u0645\u062f\u0629',
  PUBLISHED: '\u0645\u0646\u0634\u0648\u0631\u0629',
  ARCHIVED: '\u0645\u0624\u0631\u0634\u0641\u0629',
};

const STATUS_FILTERS = [
  {
    value: '',
    label: '\u0643\u0644 \u0627\u0644\u0623\u0644\u0639\u0627\u0628',
    Icon: Gamepad2,
    activeClass: 'border-sky-200 bg-sky-50 text-sky-700 shadow-sky-100',
    idleClass: 'border-slate-200 bg-white text-slate-600 hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700',
  },
  {
    value: 'DRAFT',
    label: '\u0645\u0633\u0648\u062f\u0629',
    Icon: PencilLine,
    activeClass: 'border-slate-300 bg-slate-100 text-slate-700 shadow-slate-100',
    idleClass: 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700',
  },
  {
    value: 'UNDER_REVIEW',
    label: '\u0642\u064a\u062f \u0627\u0644\u0645\u0631\u0627\u062c\u0639\u0629',
    Icon: Clock3,
    activeClass: 'border-amber-200 bg-amber-50 text-amber-700 shadow-amber-100',
    idleClass: 'border-slate-200 bg-white text-slate-600 hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700',
  },
  {
    value: 'APPROVED',
    label: '\u0645\u0639\u062a\u0645\u062f\u0629',
    Icon: CheckCircle2,
    activeClass: 'border-emerald-200 bg-emerald-50 text-emerald-700 shadow-emerald-100',
    idleClass: 'border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700',
  },
  {
    value: 'PUBLISHED',
    label: '\u0645\u0646\u0634\u0648\u0631\u0629',
    Icon: Radio,
    activeClass: 'border-cyan-200 bg-cyan-50 text-cyan-700 shadow-cyan-100',
    idleClass: 'border-slate-200 bg-white text-slate-600 hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700',
  },
  {
    value: 'ARCHIVED',
    label: '\u0627\u0644\u0623\u0631\u0634\u064a\u0641',
    Icon: Archive,
    activeClass: 'border-zinc-300 bg-zinc-100 text-zinc-700 shadow-zinc-100',
    idleClass: 'border-slate-200 bg-white text-slate-600 hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-700',
  },
];

const GAMES_PER_PAGE = 20;

const STATUS_STYLES = {
  DRAFT: 'border-slate-200 bg-slate-50 text-slate-600',
  UNDER_REVIEW: 'border-amber-200 bg-amber-50 text-amber-700',
  APPROVED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  PUBLISHED: 'border-blue-200 bg-blue-50 text-blue-700',
  ARCHIVED: 'border-orange-200 bg-orange-50 text-orange-700',
};

const getActivitiesCount = (game) => Array.isArray(game?.config?.levels)
  ? game.config.levels.reduce((total, level) => total + (Array.isArray(level.activities) ? level.activities.length : 0), 0)
  : 0;
const getDisplayName = (game) => game?.config?.nameAr || game?.titleAr || game?.title || game?.name || '--';
const normalizeSearchValue = (value) => String(value || '').trim().toLowerCase();
const formatDate = (value) => {
  if (!value) return '--';
  try { return new Intl.DateTimeFormat('ar-EG', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)); }
  catch { return String(value); }
};

const GamesManager = () => {
  const navigate = useNavigate();
  const { adminSession } = useTherapyStore();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeStatus, setActiveStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const [versionTarget, setVersionTarget] = useState(null);
  const [versions, setVersions] = useState([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [copiedGameId, setCopiedGameId] = useState('');
  const [dialog, setDialog] = useState(null);

  const userRole = adminSession?.user?.role;
  const currentUserId = adminSession?.user?.id;
  const canCreateGame = hasPermission(userRole, PERMISSIONS.GAMES_CREATE);
  const canArchiveGame = hasPermission(userRole, PERMISSIONS.GAMES_ARCHIVE);
  const canRestoreGame = hasPermission(userRole, PERMISSIONS.GAMES_RESTORE);
  const canPermanentDeleteGame = hasPermission(userRole, PERMISSIONS.GAMES_PERMANENT_DELETE);
  const canSubmitReview = hasPermission(userRole, PERMISSIONS.GAMES_SUBMIT_REVIEW);
  const canApproveContent = hasPermission(userRole, PERMISSIONS.GAMES_APPROVE_CONTENT);
  const canPublishGame = hasPermission(userRole, PERMISSIONS.GAMES_PUBLISH);
  const canViewVersions = hasPermission(userRole, PERMISSIONS.AUDIT_VIEW);
  const canUpdateAnyGame = hasPermission(userRole, PERMISSIONS.GAMES_UPDATE_ANY);
  const canUpdateOwnDraft = hasPermission(userRole, PERMISSIONS.GAMES_UPDATE_OWN_DRAFT);

  const canEditGame = (game) => canUpdateAnyGame ||
    (canUpdateOwnDraft && game?.status === 'DRAFT' && game?.createdById === currentUserId) ||
    (userRole === 'THERAPIST' && ['DRAFT', 'UNDER_REVIEW'].includes(game?.status));

  const fetchGames = async () => {
    if (!adminSession?.token) return;
    setLoading(true);
    try {
      const response = await gameService.getGames(adminSession.token);
      setGames(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error fetching games:', error);
      setGames([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGames(); }, [adminSession?.token]);

  const filteredGames = useMemo(() => {
    const query = normalizeSearchValue(searchTerm);
    return games.filter((game) => {
      const matchesSearch = !query || [game?.gameCode, getDisplayName(game), game?.type, STATUS_LABELS[game?.status]].some((value) => normalizeSearchValue(value).includes(query));
      const matchesStatus = !activeStatus || game.status === activeStatus;
      return matchesSearch && matchesStatus;
    });
  }, [activeStatus, games, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredGames.length / GAMES_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStartIndex = filteredGames.length ? (safeCurrentPage - 1) * GAMES_PER_PAGE : 0;
  const pageEndIndex = Math.min(pageStartIndex + GAMES_PER_PAGE, filteredGames.length);
  const paginatedGames = filteredGames.slice(pageStartIndex, pageEndIndex);
  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);

    const pages = new Set([1, totalPages, safeCurrentPage]);
    if (safeCurrentPage > 2) pages.add(safeCurrentPage - 1);
    if (safeCurrentPage < totalPages - 1) pages.add(safeCurrentPage + 1);

    return Array.from(pages).sort((first, second) => first - second);
  }, [safeCurrentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeStatus, searchTerm]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const archivedCount = useMemo(() => games.filter((game) => game.status === 'ARCHIVED').length, [games]);
  const mergeUpdatedGame = (updatedGame) => updatedGame?.id && setGames((current) => current.map((game) => game.id === updatedGame.id ? updatedGame : game));
  const showError = (message = T.errorMessage) => setDialog({ title: T.errorTitle, message, confirmText: T.yes, hideCancelButton: true, isDestructive: false });

  const runGameAction = async (gameId, actionName, payload) => {
    try {
      const response = await gameService[actionName](adminSession?.token, gameId, payload);
      mergeUpdatedGame(response?.data || response);
      return response?.data || response;
    } catch (error) {
      console.error('Error running game action:', error);
      showError(error?.response?.data?.message);
      return null;
    }
  };

  const handleCopyGameLink = async (gameId) => {
    const gameUrl = `${window.location.origin}/play/${gameId}`;
    try { await navigator.clipboard.writeText(gameUrl); }
    catch { window.prompt(T.copyLink, gameUrl); }
    setCopiedGameId(String(gameId));
    window.setTimeout(() => setCopiedGameId(''), 1800);
  };

  const confirmDelete = async () => {
    if (!deleteTarget?.id) return;
    try {
      if (deleteTarget.permanent) {
        await gameService.permanentlyDeleteGame(adminSession?.token, deleteTarget.id);
        setGames((current) => current.filter((game) => game.id !== deleteTarget.id));
      } else {
        const response = await gameService.deleteGame(adminSession?.token, deleteTarget.id);
        mergeUpdatedGame(response?.data || response);
        setActiveStatus('ARCHIVED');
      }
      setDeleteTarget(null);
    } catch (error) {
      showError(error?.response?.data?.message);
      setDeleteTarget(null);
    }
  };

  const confirmReject = async () => {
    if (!rejectTarget?.id) return;
    const updated = await runGameAction(rejectTarget.id, 'rejectGame', { reviewNotes: rejectNotes });
    if (updated) { setRejectTarget(null); setRejectNotes(''); setActiveStatus('DRAFT'); }
  };

  const openVersionModal = async (game) => {
    setVersionTarget(game);
    setVersions([]);
    setVersionsLoading(true);
    try {
      const response = await gameService.getGameVersions(adminSession?.token, game.id);
      setVersions(Array.isArray(response?.data) ? response.data : []);
    } catch (error) {
      showError();
      setVersionTarget(null);
    } finally {
      setVersionsLoading(false);
    }
  };

  const restoreVersion = async (versionId) => {
    if (!versionTarget?.id) return;
    try {
      const response = await gameService.restoreGameVersion(adminSession?.token, versionTarget.id, versionId);
      mergeUpdatedGame(response?.data || response);
      setVersionTarget(null);
      setVersions([]);
    } catch (error) {
      showError(error?.response?.data?.message);
    }
  };

  if (loading) return <div className="p-8 text-center text-xl font-bold text-slate-700">{T.loading}</div>;

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900">{T.title}</h2>
          <p className="mt-2 text-slate-500">{T.subtitle}</p>
        </div>
        <div className="flex flex-col items-center gap-3 md:flex-row xl:min-w-[36rem]">
          <div className="relative w-full">
            <Search size={18} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} className="w-full rounded-2xl border border-[#dbe7f3] bg-white py-3 pl-4 pr-11 text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" placeholder={T.search} />
          </div>
          {canCreateGame && <Button variant="primary" onClick={() => navigate('/admin/games/create')} className="w-full shrink-0 whitespace-nowrap !px-6 !py-3 md:w-auto"><Plus size={20} /><span>{T.newGame}</span></Button>}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((status) => {
          const StatusIcon = status.Icon;
          const isActive = activeStatus === status.value;
          return (
            <button
              key={status.value || 'all'}
              type="button"
              onClick={() => setActiveStatus(status.value)}
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-black shadow-sm transition-all ${isActive ? status.activeClass : status.idleClass}`}
            >
              <StatusIcon size={16} strokeWidth={2.4} />
              <span>{status.label}{status.value === 'ARCHIVED' && archivedCount > 0 ? ` (${archivedCount})` : ''}</span>
            </button>
          );
        })}
      </div>

      <div className="inline-flex items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50/50 px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm">
        <span className="rounded-lg border border-blue-100 bg-white px-2.5 py-0.5 font-black text-blue-700 shadow-sm">{filteredGames.length}</span>
        <span>{T.visible}</span>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-[#dbe7f3] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-right">
            <thead>
              <tr className="border-b border-[#dbe7f3] bg-slate-50">
                <th className="px-6 py-4 text-sm font-black text-slate-500">{T.name}</th>
                <th className="px-6 py-4 text-sm font-black text-slate-500">{T.code}</th>
                <th className="px-6 py-4 text-sm font-black text-slate-500">{T.status}</th>
                <th className="px-6 py-4 text-sm font-black text-slate-500">{T.activities}</th>
                <th className="px-6 py-4 text-center text-sm font-black text-slate-500">{T.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredGames.length ? paginatedGames.map((game) => (
                <tr key={game.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Gamepad2 size={20} /></div><div><div className="font-black text-slate-800">{getDisplayName(game)}</div>{game.reviewNotes && <div className="mt-1 max-w-[260px] truncate text-xs font-bold text-amber-600">{T.note}: {game.reviewNotes}</div>}</div></div></td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-600">{game.gameCode || '--'}</td>
                  <td className="px-6 py-4"><span className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-black ${STATUS_STYLES[game.status] || STATUS_STYLES.DRAFT}`}>{STATUS_LABELS[game.status] || game.status || '--'}</span></td>
                  <td className="px-6 py-4"><span className="inline-flex h-7 min-w-[2.5rem] items-center justify-center rounded-lg border border-slate-200 bg-slate-100 px-2.5 text-sm font-black text-slate-700">{getActivitiesCount(game)}</span></td>
                  <td className="px-6 py-4 text-center"><div className="flex items-center justify-center gap-2">
                    <button type="button" onClick={() => handleCopyGameLink(game.id)} className="flex h-9 min-w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100" title={T.copyLink}>{copiedGameId === String(game.id) ? <Check size={18} /> : <Copy size={18} />}</button>
                    {canEditGame(game) && <button onClick={() => navigate(`/admin/games/edit/${game.id}`)} className="flex h-9 w-9 items-center justify-center rounded-lg text-blue-600 hover:bg-blue-100" title={T.edit}><Edit2 size={18} /></button>}
                    {canViewVersions && <button onClick={() => openVersionModal(game)} className="flex h-9 w-9 items-center justify-center rounded-lg text-violet-600 hover:bg-violet-100" title={T.versions}><History size={18} /></button>}
                    {canSubmitReview && game.status === 'DRAFT' && game.createdById === currentUserId && <button onClick={() => runGameAction(game.id, 'submitGameForReview')} className="flex h-9 w-9 items-center justify-center rounded-lg text-amber-600 hover:bg-amber-100" title={T.submitReview}><Send size={18} /></button>}
                    {canApproveContent && game.status === 'UNDER_REVIEW' && <button onClick={() => runGameAction(game.id, 'approveGame')} className="flex h-9 w-9 items-center justify-center rounded-lg text-emerald-600 hover:bg-emerald-100" title={T.approve}><CheckCircle2 size={18} /></button>}
                    {canApproveContent && game.status === 'UNDER_REVIEW' && <button onClick={() => { setRejectTarget(game); setRejectNotes(game.reviewNotes || ''); }} className="flex h-9 w-9 items-center justify-center rounded-lg text-red-500 hover:bg-red-100" title={T.reject}><XCircle size={18} /></button>}
                    {canPublishGame && ['APPROVED', 'DRAFT', 'UNDER_REVIEW'].includes(game.status) && <button onClick={() => runGameAction(game.id, 'publishGame')} className="flex h-9 w-9 items-center justify-center rounded-lg text-green-600 hover:bg-green-100" title={T.publish}><Check size={18} /></button>}
                    {canRestoreGame && game.status === 'ARCHIVED' && <button onClick={() => runGameAction(game.id, 'restoreGame')} className="flex h-9 w-9 items-center justify-center rounded-lg text-sky-600 hover:bg-sky-100" title={T.restore}><RotateCcw size={18} /></button>}
                    {canArchiveGame && game.status !== 'ARCHIVED' && <button onClick={() => setDeleteTarget({ id: game.id, permanent: false })} className="flex h-9 w-9 items-center justify-center rounded-lg text-orange-600 hover:bg-orange-100" title={T.archive}><Archive size={18} /></button>}
                    {canPermanentDeleteGame && game.status === 'ARCHIVED' && <button onClick={() => setDeleteTarget({ id: game.id, permanent: true })} className="flex h-9 w-9 items-center justify-center rounded-lg text-red-500 hover:bg-red-100" title={T.permanentDelete}><Trash2 size={18} /></button>}
                  </div></td>
                </tr>
              )) : <tr><td colSpan="5" className="px-6 py-12 text-center font-bold text-slate-500">{T.noGames}</td></tr>}
            </tbody>
          </table>
        </div>

        {filteredGames.length > GAMES_PER_PAGE && (
          <div className="flex flex-col gap-3 border-t border-[#dbe7f3] bg-slate-50/60 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm font-bold text-slate-500">
              {T.pageSummary} <span className="font-black text-slate-800">{pageStartIndex + 1}-{pageEndIndex}</span> {T.of} <span className="font-black text-slate-800">{filteredGames.length}</span> {T.game}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={safeCurrentPage === 1}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {T.previous}
              </button>

              {pageNumbers.map((page, index) => {
                const previousPage = pageNumbers[index - 1];
                const needsGap = previousPage && page - previousPage > 1;

                return (
                  <React.Fragment key={page}>
                    {needsGap && <span className="px-1 text-sm font-black text-slate-400">...</span>}
                    <button
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={[
                        'grid h-9 min-w-9 place-items-center rounded-xl border px-3 text-sm font-black transition',
                        safeCurrentPage === page
                          ? 'border-blue-200 bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
                      ].join(' ')}
                    >
                      {page}
                    </button>
                  </React.Fragment>
                );
              })}

              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={safeCurrentPage === totalPages}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {T.next}
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete} title={deleteTarget?.permanent ? T.permanentDelete : T.archiveGame} message={deleteTarget?.permanent ? T.deleteMessage : T.archiveMessage} confirmText={T.yes} cancelText={T.cancel} isDestructive position="top" />

      {rejectTarget && <div className="fixed inset-0 z-[80] flex items-start justify-center bg-slate-950/40 px-4 py-16 backdrop-blur-sm"><div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl" dir="rtl"><h3 className="text-xl font-black text-slate-900">{T.rejectTitle}</h3><p className="mt-2 text-sm font-medium text-slate-500">{T.rejectHelp}</p><textarea value={rejectNotes} onChange={(event) => setRejectNotes(event.target.value)} rows={5} className="mt-4 w-full rounded-xl border border-slate-200 p-3 text-slate-800 outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100" /><div className="mt-4 flex justify-end gap-2"><button type="button" onClick={() => setRejectTarget(null)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 font-bold text-slate-600 hover:bg-slate-50">{T.cancel}</button><button type="button" onClick={confirmReject} className="rounded-xl bg-red-600 px-4 py-2 font-black text-white hover:bg-red-700">{T.rejectConfirm}</button></div></div></div>}

      {versionTarget && <div className="fixed inset-0 z-[80] flex items-start justify-center bg-slate-950/40 px-4 py-12 backdrop-blur-sm"><div className="w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl" dir="rtl"><div className="flex items-start justify-between gap-4"><div><h3 className="text-xl font-black text-slate-900">{T.versions}</h3><p className="mt-1 text-sm font-medium text-slate-500">{getDisplayName(versionTarget)}</p></div><button type="button" onClick={() => setVersionTarget(null)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-bold text-slate-600 hover:bg-slate-50">{T.close}</button></div><div className="mt-4 max-h-[60vh] overflow-auto rounded-xl border border-slate-100"><table className="w-full min-w-[680px] border-collapse text-right"><thead><tr className="border-b border-slate-100 bg-slate-50"><th className="px-4 py-3 text-sm font-black text-slate-500">{T.version}</th><th className="px-4 py-3 text-sm font-black text-slate-500">{T.operation}</th><th className="px-4 py-3 text-sm font-black text-slate-500">{T.status}</th><th className="px-4 py-3 text-sm font-black text-slate-500">{T.date}</th><th className="px-4 py-3 text-sm font-black text-slate-500">{T.actions}</th></tr></thead><tbody className="divide-y divide-slate-100">{versionsLoading ? <tr><td colSpan="5" className="px-4 py-10 text-center font-bold text-slate-500">{T.loadVersions}</td></tr> : versions.length ? versions.map((version) => <tr key={version.id} className="hover:bg-slate-50"><td className="px-4 py-3 font-black text-slate-800">#{version.versionNumber}</td><td className="px-4 py-3 text-sm font-bold text-slate-600">{version.changeType}</td><td className="px-4 py-3 text-sm font-bold text-slate-600">{STATUS_LABELS[version.snapshot?.status] || version.snapshot?.status || '--'}</td><td className="px-4 py-3 text-sm font-bold text-slate-600">{formatDate(version.createdAt)}</td><td className="px-4 py-3"><button type="button" onClick={() => restoreVersion(version.id)} className="rounded-lg bg-sky-50 px-3 py-1.5 text-sm font-black text-sky-700 hover:bg-sky-100">{T.restore}</button></td></tr>) : <tr><td colSpan="5" className="px-4 py-10 text-center font-bold text-slate-500">{T.noVersions}</td></tr>}</tbody></table></div></div></div>}

      {dialog && <ConfirmModal isOpen onClose={() => setDialog(null)} onConfirm={() => setDialog(null)} title={dialog.title} message={dialog.message} confirmText={dialog.confirmText} hideCancelButton={dialog.hideCancelButton} isDestructive={dialog.isDestructive} position="top" />}
    </div>
  );
};

export default GamesManager;