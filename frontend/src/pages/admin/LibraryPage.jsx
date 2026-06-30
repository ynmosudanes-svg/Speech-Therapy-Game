import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Gamepad2,
  Library,
  Palette,
  Plus,
  Save,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react';
import ConfirmModal from '../../components/ConfirmModal';
import { useTherapyStore } from '../../hooks/useTherapyStore';
import gameService from '../../services/gameService';
import gameLibraryService from '../../services/gameLibraryService';

const BOOK_COLORS = ['#138fbc', '#0f766e', '#2563eb', '#16a34a', '#f59e0b', '#e11d48'];
const GAME_TYPE_ORDER = [
  'matching.similar',
  'matching.different',
  'matching.find',
  'matching.shadow',
  'touch.hand',
  'picture.reveal',
  'image.complete_part',
  'sequence.order',
  'commands.multi_step',
  'action.drag_to_target',
  'spatial.concepts',
  'navigation.move_to_target',
  'navigation.maze',
  'cards.audio_flashcards',
  'memory.cards',
  'memory.grid',
  'puzzle.jigsaw',
  'matching.connect',
];
const GAME_TYPE_LABELS = {
  'matching.similar': 'الصورة المطابقة',
  'matching.different': 'اختيار من متعدد',
  'matching.find': 'أوجد الصورة',
  'matching.shadow': 'مطابقة الظل',
  'touch.hand': 'المس باليد',
  'picture.reveal': 'اكشف الصورة',
  'image.complete_part': 'أكمل الجزء الناقص',
  'sequence.order': 'ترتيب الصور',
  'commands.multi_step': 'تنفيذ الأوامر المركبة',
  'action.drag_to_target': 'السحب والإفلات',
  'spatial.concepts': 'المفاهيم المكانية',
  'navigation.move_to_target': 'التحريك للأهداف',
  'navigation.maze': 'لعبة المتاهة',
  'cards.audio_flashcards': 'الكروت الصوتية',
  'memory.cards': 'لعبة الذاكرة',
  'memory.grid': 'شبكة الذاكرة',
  'puzzle.jigsaw': 'البازل',
  'matching.connect': 'التوصيل',
};
const GAME_TYPE_LABELS_AR = {
  'matching.similar': 'الصورة المطابقة',
  'matching.different': 'اختيار من متعدد',
  'matching.find': 'أوجد الصورة',
  'matching.shadow': 'مطابقة الظل',
  'touch.hand': 'المس باليد',
  'picture.reveal': 'اكشف الصورة',
  'image.complete_part': 'أكمل الجزء الناقص',
  'sequence.order': 'ترتيب الصور',
  'commands.multi_step': 'تنفيذ الأوامر المركبة',
  'action.drag_to_target': 'السحب والإفلات',
  'spatial.concepts': 'المفاهيم المكانية',
  'navigation.move_to_target': 'التحريك للأهداف',
  'navigation.maze': 'لعبة المتاهة',
  'cards.audio_flashcards': 'الكروت الصوتية',
  'memory.cards': 'لعبة الذاكرة',
  'memory.grid': 'شبكة الذاكرة',
  'puzzle.jigsaw': 'البازل',
  'matching.connect': 'التوصيل',
};
const COLOR_PALETTE = [
  '#138fbc',
  '#0ea5e9',
  '#06b6d4',
  '#0f766e',
  '#16a34a',
  '#84cc16',
  '#facc15',
  '#f97316',
  '#e11d48',
  '#ec4899',
  '#7c3aed',
  '#4f46e5',
  '#64748b',
  '#334155',
  '#111827',
];

const COLOR_HUES = {
  '#138fbc': 197,
  '#0ea5e9': 199,
  '#06b6d4': 188,
  '#0f766e': 176,
  '#16a34a': 142,
  '#84cc16': 84,
  '#facc15': 48,
  '#f97316': 24,
  '#e11d48': 346,
  '#ec4899': 326,
  '#7c3aed': 262,
  '#4f46e5': 243,
  '#64748b': 215,
  '#334155': 215,
  '#111827': 221,
};

const getHueFromColor = (color, fallback = 195) => {
  const normalized = String(color || '').toLowerCase();
  const hslMatch = normalized.match(/hsl\((\d+)/);
  if (hslMatch) return Number(hslMatch[1]);
  return COLOR_HUES[normalized] ?? fallback;
};

const createEmptyLibraryForm = () => ({
  id: null,
  name: '',
  description: '',
  color: BOOK_COLORS[0],
  gameIds: [],
});

const getGameTitle = (game) =>
  game?.titleAr || game?.config?.nameAr || game?.title || game?.name || 'لعبة علاجية';

const getActivityCount = (game) =>
  Array.isArray(game?.config?.levels)
    ? game.config.levels.reduce((sum, level) => sum + (level.activities?.length || 0), 0)
    : 0;

const getSelectedItemLabel = (index) => `لعبة ${index + 1}`;
const getGameCodeLabel = (gameCode) => `كود ${gameCode}`;
const getGameBandValue = (game) => String(game?.gameCode || '').trim().toUpperCase().charAt(0);
const getGameBandLabel = (band) => band || '\u0628\u0646\u062f \u063a\u064a\u0631 \u0645\u062d\u062f\u062f';
const getGameTypeLabel = (type) => GAME_TYPE_LABELS_AR[type] || GAME_TYPE_LABELS[type] || type || 'تصنيف غير محدد';
const getGameTypeOrderIndex = (type) => {
  const index = GAME_TYPE_ORDER.indexOf(type);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
};
const getPlanSpineLabel = (name, index = 0) => {
  const firstWord = String(name || '')
    .trim()
    .split(/\s+/)
    .find(Boolean);

  if (firstWord) {
    return firstWord.replace(/[^\p{L}\p{N}]/gu, '').slice(0, 2) || `خ${index + 1}`;
  }

  return `خ${index + 1}`;
};

const getLibraryErrorMessage = (error, fallback) => {
  const message = error?.response?.data?.message || error?.message || '';

  if (
    message.includes("Can't reach database server") ||
    message.includes('Invalid `prisma') ||
    message.includes('Database Request Timeout')
  ) {
    return 'تعذر الاتصال بقاعدة البيانات. تأكد أن قاعدة البيانات تعمل ثم أعد تحميل الصفحة.';
  }

  return message || fallback;
};

function TherapyBookCard({ libraryItem, onClick, index = 0 }) {
  const bookColor = libraryItem.color || BOOK_COLORS[index % BOOK_COLORS.length];
  const gamesCount = libraryItem.gamesCount || 0;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      layout
      whileHover={{
        y: -6,
        borderColor: bookColor,
        boxShadow: `0 24px 52px -32px ${bookColor}`,
      }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: 'spring', stiffness: 240, damping: 20 }}
      className="group relative min-h-[17.5rem] w-full overflow-hidden rounded-[1.65rem] border bg-white p-7 text-right outline-none transition-all duration-300 focus-visible:ring-4"
      style={{
        borderColor: '#dbe7f3',
        boxShadow: '0 18px 40px -30px rgba(15,23,42,0.4)',
        '--tw-ring-color': `${bookColor}33`,
      }}
    >
      <div className="absolute inset-x-4 top-0 h-2.5 rounded-b-full" style={{ backgroundColor: bookColor }} />
      <div className="pointer-events-none absolute -left-14 -top-14 h-36 w-36 rounded-full opacity-10" style={{ backgroundColor: bookColor }} />
      <span className="absolute left-8 top-8 rounded-full bg-slate-50 px-3.5 py-1.5 text-xs font-black text-slate-600 ring-1 ring-slate-100">
        {gamesCount} لعبة
      </span>
      <span className="absolute right-8 top-8 grid h-[5.25rem] w-[5.25rem] place-items-center rounded-[1.65rem] bg-white shadow-[0_14px_30px_-24px_rgba(15,23,42,0.55)] ring-1 ring-slate-100" style={{ color: bookColor }}>
        <BookOpen size={36} />
      </span>

      <div className="relative z-10 flex min-h-[14rem] flex-col pt-28">
        <h3 className="line-clamp-2 text-2xl font-black leading-9 text-slate-900">
          {libraryItem.name || 'خطة علاجية جديدة'}
        </h3>
        <p className="mt-3 line-clamp-3 max-w-[24rem] text-sm font-bold leading-7 text-slate-500">
          {libraryItem.description || 'خطة علاجية منظمة لألعاب التخاطب والأنشطة المناسبة للجلسات.'}
        </p>

        <div className="mt-auto flex items-center justify-start pt-8">
          <span
            className="inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-black text-white shadow-[0_14px_24px_-18px_rgba(15,23,42,0.5)] transition-transform group-hover:-translate-x-1"
            style={{ backgroundColor: bookColor }}
          >
            عرض الألعاب
            <ArrowRight size={17} />
          </span>
        </div>
      </div>
    </motion.button>
  );
}

function SelectedGameCard({ game, accentColor, index = 0 }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="rounded-[1.45rem] border border-slate-200 bg-white px-4 py-3 shadow-[0_16px_34px_-30px_rgba(15,23,42,0.3)]"
    >
      <div className="mb-2 flex items-start justify-between gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[1rem] text-white shadow-sm"
          style={{
            background: `linear-gradient(135deg, ${accentColor}, color-mix(in srgb, ${accentColor} 74%, #0f172a 26%))`,
          }}
        >
          <Gamepad2 size={18} />
        </div>
        <div className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-600">
          {getActivityCount(game)} نشاط
        </div>
      </div>
      <h4 className="line-clamp-2 text-[15px] font-black leading-6 text-slate-900">{getGameTitle(game)}</h4>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {game?.gameCode && (
          <span dir="ltr" className="inline-flex min-w-fit whitespace-nowrap rounded-full border border-sky-100 bg-sky-50 px-2.5 py-1 text-[10px] font-black text-sky-700">
            {getGameCodeLabel(game.gameCode)}
          </span>
        )}
        <span className="inline-flex min-w-fit whitespace-nowrap rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-700">
          {getSelectedItemLabel(index)}
        </span>
      </div>
    </motion.div>
  );
}

function LibraryFolderItemCard({ game, accentColor, index = 0 }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="rounded-[1.35rem] border border-slate-200 bg-white px-4 py-3 shadow-[0_14px_28px_-26px_rgba(15,23,42,0.28)]"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.95rem] text-white shadow-sm"
          style={{ backgroundColor: accentColor }}
        >
          <Gamepad2 size={17} />
        </div>
        <div className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-600">
          {getSelectedItemLabel(index)}
        </div>
      </div>

      <h4 className="line-clamp-2 text-[15px] font-black leading-6 text-slate-900">
        {getGameTitle(game)}
      </h4>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {game?.gameCode && (
          <span dir="ltr" className="inline-flex min-w-fit whitespace-nowrap rounded-full border border-sky-100 bg-sky-50 px-2.5 py-1 text-[10px] font-black text-sky-700">
            {getGameCodeLabel(game.gameCode)}
          </span>
        )}
        <span className="inline-flex min-w-fit whitespace-nowrap rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-600">
          {getActivityCount(game)} نشاط
        </span>
      </div>
    </motion.div>
  );
}

export default function LibraryPage() {
  const { adminSession } = useTherapyStore();
  const [libraries, setLibraries] = useState([]);
  const [games, setGames] = useState([]);
  const [selectedLibraryId, setSelectedLibraryId] = useState('');
  const [viewMode, setViewMode] = useState('shelf');
  const [libraryForm, setLibraryForm] = useState(createEmptyLibraryForm());
  const [searchQuery, setSearchQuery] = useState('');
  const [gameSearchQuery, setGameSearchQuery] = useState('');
  const [selectedGameBand, setSelectedGameBand] = useState('all');
  const [gameBandFilterOpen, setGameBandFilterOpen] = useState(false);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [colorHue, setColorHue] = useState(195);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      if (!adminSession?.token) return;

      setLoading(true);
      setError('');

      try {
        const [librariesResponse, gamesResponse] = await Promise.all([
          gameLibraryService.getLibraries(adminSession.token),
          gameService.getGames(adminSession.token),
        ]);

        const nextLibraries = Array.isArray(librariesResponse) ? librariesResponse : [];
        const nextGames = Array.isArray(gamesResponse) ? gamesResponse : [];

        setLibraries(nextLibraries);
        setGames(nextGames);

        if (nextLibraries.length) {
          setSelectedLibraryId(nextLibraries[0].id);
        } else {
          setSelectedLibraryId('');
          setLibraryForm(createEmptyLibraryForm());
        }
      } catch (loadError) {
        setError(getLibraryErrorMessage(loadError, 'تعذر تحميل المكتبة العلاجية.'));
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [adminSession?.token]);

  const filteredLibraries = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return libraries;

    return libraries.filter((libraryItem) => {
      const haystack = `${libraryItem.name || ''} ${libraryItem.description || ''}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [libraries, searchQuery]);

  const selectedLibrary = useMemo(
    () => libraries.find((libraryItem) => String(libraryItem.id) === String(selectedLibraryId)) || null,
    [libraries, selectedLibraryId]
  );

  const gameUsedInOtherPlanMap = useMemo(() => {
    const currentLibraryId = libraryForm.id ? String(libraryForm.id) : '';
    const usageMap = new Map();

    libraries.forEach((libraryItem) => {
      const libraryId = String(libraryItem?.id || '');
      if (!libraryId || libraryId === currentLibraryId) return;

      const gameIds = Array.isArray(libraryItem?.gameIds) ? libraryItem.gameIds : [];
      gameIds.forEach((gameId) => {
        const normalizedGameId = String(gameId);
        if (!usageMap.has(normalizedGameId)) {
          usageMap.set(normalizedGameId, libraryItem);
        }
      });
    });

    return usageMap;
  }, [libraries, libraryForm.id]);

  const gameBands = useMemo(() => {
    const bands = games
      .map((game) => getGameBandValue(game))
      .filter(Boolean);

    return [...new Set(bands)].sort((first, second) => first.localeCompare(second, 'ar', { numeric: true }));
  }, [games]);

  const selectedGameBandLabel = useMemo(
    () => (selectedGameBand === 'all' ? '\u0643\u0644 \u0627\u0644\u0628\u0646\u0648\u062f' : getGameBandLabel(selectedGameBand)),
    [selectedGameBand]
  );

  const filteredGames = useMemo(() => {
    const query = gameSearchQuery.trim().toLowerCase();

    return games.filter((game) => {
      const gameBand = getGameBandValue(game);
      const matchesBand = selectedGameBand === 'all' || gameBand === selectedGameBand;
      if (!matchesBand) return false;

      if (!query) return true;

      const haystack = `${getGameTitle(game)} ${game?.gameCode || ''} ${gameBand}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [games, gameSearchQuery, selectedGameBand]);

  const selectedGames = useMemo(
    () =>
      libraryForm.gameIds
        .map((gameId) => games.find((game) => String(game.id) === String(gameId)))
        .filter(Boolean),
    [games, libraryForm.gameIds]
  );

  const selectedLibraryGames = useMemo(
    () => (Array.isArray(selectedLibrary?.games) ? selectedLibrary.games : []),
    [selectedLibrary]
  );

  const handleCreateNew = () => {
    setSelectedLibraryId('');
    setLibraryForm(createEmptyLibraryForm());
    setColorHue(getHueFromColor(BOOK_COLORS[0]));
    setColorPickerOpen(false);
    setError('');
    setViewMode('edit');
  };

  const handleOpenLibrary = (libraryItem) => {
    setSelectedLibraryId(libraryItem.id);
    setLibraryForm({
      id: libraryItem.id,
      name: libraryItem.name || '',
      description: libraryItem.description || '',
      color: libraryItem.color || BOOK_COLORS[0],
      gameIds: Array.isArray(libraryItem.gameIds) ? libraryItem.gameIds.map(String) : [],
    });
    setColorHue(getHueFromColor(libraryItem.color || BOOK_COLORS[0]));
    setColorPickerOpen(false);
    setError('');
    setViewMode('folder');
  };

  const handleEditLibrary = (libraryItem) => {
    setSelectedLibraryId(libraryItem.id);
    setLibraryForm({
      id: libraryItem.id,
      name: libraryItem.name || '',
      description: libraryItem.description || '',
      color: libraryItem.color || BOOK_COLORS[0],
      gameIds: Array.isArray(libraryItem.gameIds) ? libraryItem.gameIds.map(String) : [],
    });
    setColorHue(getHueFromColor(libraryItem.color || BOOK_COLORS[0]));
    setColorPickerOpen(false);
    setError('');
    setViewMode('edit');
  };

  const handleToggleGame = (gameId) => {
    const normalizedGameId = String(gameId);
    const usedInOtherPlan = gameUsedInOtherPlanMap.has(normalizedGameId);

    setLibraryForm((current) => {
      const isSelected = current.gameIds.includes(normalizedGameId);
      if (usedInOtherPlan && !isSelected) return current;

      return {
        ...current,
        gameIds: isSelected
          ? current.gameIds.filter((id) => id !== normalizedGameId)
          : [...current.gameIds, normalizedGameId],
      };
    });
  };

  const moveGame = (gameId, direction) => {
    setLibraryForm((current) => {
      const currentIndex = current.gameIds.indexOf(gameId);
      if (currentIndex === -1) return current;

      const targetIndex = currentIndex + direction;
      if (targetIndex < 0 || targetIndex >= current.gameIds.length) return current;

      const nextGameIds = [...current.gameIds];
      [nextGameIds[currentIndex], nextGameIds[targetIndex]] = [
        nextGameIds[targetIndex],
        nextGameIds[currentIndex],
      ];

      return {
        ...current,
        gameIds: nextGameIds,
      };
    });
  };

  const returnToShelfAfterSave = (savedLibrary) => {
    setSelectedLibraryId(savedLibrary.id);
    setLibraryForm({
      id: savedLibrary.id,
      name: savedLibrary.name || '',
      description: savedLibrary.description || '',
      color: savedLibrary.color || BOOK_COLORS[0],
      gameIds: Array.isArray(savedLibrary.gameIds) ? savedLibrary.gameIds.map(String) : [],
    });
    setColorHue(getHueFromColor(savedLibrary.color || BOOK_COLORS[0]));
    setColorPickerOpen(false);
    setViewMode('shelf');
  };
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!adminSession?.token) return;

    setSaving(true);
    setError('');

    try {
      const payload = {
        name: libraryForm.name.trim(),
        description: libraryForm.description.trim(),
        color: libraryForm.color,
        gameIds: libraryForm.gameIds,
      };

      if (libraryForm.id) {
        const updated = await gameLibraryService.updateLibrary(adminSession.token, libraryForm.id, payload);
        setLibraries((current) =>
          current.map((libraryItem) => (String(libraryItem.id) === String(updated.id) ? updated : libraryItem))
        );
        returnToShelfAfterSave(updated);
      } else {
        const created = await gameLibraryService.createLibrary(adminSession.token, payload);
        setLibraries((current) => [...current, created]);
        returnToShelfAfterSave(created);
      }
    } catch (saveError) {
      setError(getLibraryErrorMessage(saveError, 'تعذر حفظ الخطة العلاجية.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLibrary = async () => {
    if (!adminSession?.token || !deleteTarget) return;

    try {
      await gameLibraryService.deleteLibrary(adminSession.token, deleteTarget.id);
      const nextLibraries = libraries.filter((libraryItem) => libraryItem.id !== deleteTarget.id);
      setLibraries(nextLibraries);
      setDeleteTarget(null);

      if (selectedLibraryId === deleteTarget.id) {
        if (nextLibraries.length) {
          handleOpenLibrary(nextLibraries[0]);
        } else {
          handleCreateNew();
          setViewMode('shelf');
        }
      }
    } catch (deleteError) {
      setError(getLibraryErrorMessage(deleteError, 'تعذر حذف الخطة العلاجية.'));
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6 [font-family:var(--font-arabic)]" dir="rtl">
      <section className="rounded-[1.75rem] border border-slate-200 bg-white/95 px-5 py-4 shadow-[0_18px_45px_-35px_rgba(15,23,42,0.24)] sm:px-6">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.25rem] bg-sky-50 text-sky-700">
              {viewMode === 'shelf' ? <Library size={28} /> : viewMode === 'folder' ? <BookOpen size={28} /> : <ClipboardList size={28} />}
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-black text-slate-900 lg:text-3xl">
                {viewMode === 'shelf'
                  ? 'المكتبة العلاجية'
                  : viewMode === 'folder'
                    ? selectedLibrary?.name || 'داخل الخطة العلاجية'
                  : libraryForm.id
                    ? libraryForm.name || 'تحرير الخطة العلاجية'
                    : 'إضافة خطة علاجية جديدة'}
              </h1>
              <p className="mt-1 text-sm font-medium leading-7 text-slate-500">
                {viewMode === 'shelf'
                  ? 'ادخل مباشرة على الرفوف، واختر خطة أو أضف خطة جديدة من الزر العلوي.'
                  : viewMode === 'folder'
                    ? 'هنا تظهر كل الألعاب الموجودة داخل هذه الخطة. يمكنك فتح التعديل من الزر العلوي.'
                  : 'عدّل بيانات الخطة ثم أضف الألعاب المناسبة لها من نفس الصفحة.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 xl:justify-end">
            {viewMode === 'shelf' ? (
              <>
                <div className="rounded-[1.3rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-700">
                  {libraries.length} خطة
                </div>
                <button
                  type="button"
                  onClick={handleCreateNew}
                  className="inline-flex items-center justify-center gap-2 rounded-[1.3rem] bg-[linear-gradient(135deg,_#0ea5e9,_#0284c7)] px-5 py-3 text-sm font-black text-white shadow-[0_20px_40px_-25px_rgba(2,132,199,0.55)] transition hover:-translate-y-0.5"
                >
                  <Plus size={18} />
                  إضافة خطة جديدة
                </button>
              </>
            ) : viewMode === 'folder' ? (
              <>
                <div className="rounded-[1.3rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-700">
                  {selectedLibraryGames.length} بند
                </div>
                <button
                  type="button"
                  onClick={() => selectedLibrary && handleEditLibrary(selectedLibrary)}
                  className="inline-flex items-center justify-center gap-2 rounded-[1.3rem] bg-[linear-gradient(135deg,_#0ea5e9,_#0284c7)] px-5 py-3 text-sm font-black text-white shadow-[0_20px_40px_-25px_rgba(2,132,199,0.55)] transition hover:-translate-y-0.5"
                >
                  <ClipboardList size={18} />
                  تحرير الخطة
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('shelf')}
                  className="inline-flex items-center justify-center gap-2 rounded-[1.3rem] border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
                >
                  <ArrowRight size={18} />
                  الرجوع إلى الرفوف
                </button>
              </>
            ) : (
              <>
                <div className="rounded-[1.3rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-700">
                  {libraryForm.gameIds.length} لعبة
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('shelf');
                    setColorPickerOpen(false);
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-[1.3rem] border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
                >
                  <ArrowRight size={18} />
                  الرجوع إلى الرفوف
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-[1.8rem] border border-red-100 bg-red-50 px-5 py-4 text-sm font-bold text-red-600 shadow-sm">
          {error}
        </div>
      )}

      {viewMode === 'shelf' && (
        <section className="rounded-[1.85rem] border border-slate-200 bg-white/90 p-5 shadow-[0_22px_55px_-38px_rgba(15,23,42,0.28)] backdrop-blur">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-900">رف الخطط العلاجية</h2>
              <p className="mt-2 text-sm leading-7 text-slate-500">
                اختر كتابًا لفتح الخطة، أو استخدم الزر العلوي لإنشاء خطة جديدة في صفحة مستقلة.
              </p>
            </div>

            <div className="flex w-full max-w-xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              <div className="relative w-full sm:max-w-sm">
                <Search size={18} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="ابحث عن خطة علاجية..."
                  className="w-full rounded-[1.6rem] border border-slate-200 bg-slate-50 py-3 pr-11 pl-4 text-sm font-bold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                />
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[1.5rem] border border-[#d9eaf3] bg-[linear-gradient(180deg,_#eff9ff_0%,_#f8fcff_42%,_#eef6fb_100%)] px-4 py-6 lg:px-6">

            {loading ? (
              <div className="rounded-[1.8rem] border border-dashed border-slate-200 bg-white/80 px-4 py-16 text-center text-sm font-bold text-slate-500">
                جاري تحميل الخطط العلاجية...
              </div>
            ) : filteredLibraries.length ? (
              <motion.div layout className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {filteredLibraries.map((libraryItem, index) => (
                  <TherapyBookCard
                    key={libraryItem.id}
                    libraryItem={libraryItem}
                    index={index}
                    onClick={() => handleOpenLibrary(libraryItem)}
                  />
                ))}
              </motion.div>
            ) : (
              <div className="rounded-[1.8rem] border border-dashed border-slate-200 bg-white/80 px-4 py-16 text-center">
                <BookOpen className="mx-auto mb-4 text-slate-300" size={42} />
                <div className="font-black text-slate-700">لا توجد خطط علاجية بعد</div>
                <div className="mt-2 text-sm text-slate-500">ابدأ بإضافة أول كتاب علاجي ليظهر على الرف.</div>
              </div>
            )}
          </div>
        </section>
      )}

      {viewMode === 'folder' && selectedLibrary && (
        <section className="rounded-[1.85rem] border border-slate-200 bg-white/90 p-5 shadow-[0_22px_55px_-38px_rgba(15,23,42,0.28)] backdrop-blur">
          <div className="mb-5 rounded-[1.8rem] border border-slate-200 bg-[linear-gradient(180deg,_#fbfdff,_#f4faff)] p-5">
            <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-xs font-black text-sky-700">
                  <BookOpen size={14} />
                  مجلد الخطة
                </div>
                <h2 className="text-2xl font-black text-slate-900">{selectedLibrary.name}</h2>
              </div>
              <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                {selectedLibraryGames.length} بند
              </div>
            </div>
            <p className="text-sm leading-8 text-slate-500">
              {selectedLibrary.description || 'هذه الخطة تحتوي على الألعاب التي اخترتها لها.'}
            </p>
          </div>

          {selectedLibraryGames.length ? (
            <motion.div layout className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              <AnimatePresence>
                {selectedLibraryGames.map((game, index) => (
                  <LibraryFolderItemCard
                    key={game.id}
                    game={game}
                    accentColor={selectedLibrary.color || BOOK_COLORS[0]}
                    index={index}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <div className="rounded-[1.8rem] border border-dashed border-slate-200 bg-slate-50 px-4 py-14 text-center">
              <Gamepad2 className="mx-auto mb-3 text-slate-300" size={40} />
              <div className="font-black text-slate-700">لا توجد ألعاب داخل هذه الخطة بعد</div>
              <div className="mt-2 text-sm text-slate-500">اضغط على تحرير الخطة لإضافة ألعابها وترتيبها.</div>
            </div>
          )}
        </section>
      )}

      {viewMode === 'edit' && (
        <section className="space-y-5">
          <AnimatePresence mode="wait">
        <motion.form
          key={libraryForm.id || 'draft'}
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 22, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -18, scale: 0.99 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          className="overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-[0_25px_70px_-42px_rgba(15,23,42,0.28)]"
        >
          <div className="grid gap-0 xl:grid-cols-[440px_minmax(0,1fr)]">
            <div className="relative overflow-hidden border-b border-slate-100 bg-[linear-gradient(180deg,_#fbfdff,_#f3f9fc)] p-5 xl:border-b-0 xl:border-l xl:p-6">
              <div className="pointer-events-none absolute -left-8 top-16 h-44 w-44 rounded-full bg-sky-100/70 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-10 right-10 h-40 w-40 rounded-full bg-amber-100/50 blur-3xl" />

              <div className="relative">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-sky-100 bg-white/80 px-3 py-1.5 text-xs font-black text-sky-700 shadow-sm">
                  <ClipboardList size={15} />
                  {libraryForm.id ? 'تحرير الخطة العلاجية' : 'خطة علاجية جديدة'}
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="mb-2 block text-sm font-black text-slate-700">اسم الخطة العلاجية</label>
                    <input
                      required
                      value={libraryForm.name}
                      onChange={(event) => setLibraryForm((current) => ({ ...current, name: event.target.value }))}
                      placeholder="مثال: اتباع التعليمات"
                      className="w-full rounded-[1.4rem] border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-black text-slate-700">وصف مختصر</label>
                    <textarea
                      rows={5}
                      value={libraryForm.description}
                      onChange={(event) =>
                        setLibraryForm((current) => ({ ...current, description: event.target.value }))
                      }
                      placeholder="مثال: تحسين اتباع التعليمات البسيطة والمتوسطة من خلال أنشطة بصرية وصوتية."
                      className="w-full resize-none rounded-[1.4rem] border border-slate-200 bg-white px-4 py-3 text-sm font-bold leading-7 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                    />
                  </div>

                  <div>
                    <div className="mb-2 flex items-center gap-2 text-sm font-black text-slate-700">
                      <Palette size={16} className="text-sky-700" />
                      لون الكتاب العلاجي
                    </div>
                    <div className="relative flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setColorPickerOpen((current) => !current)}
                        className="group relative grid h-16 w-16 place-items-center rounded-full bg-[conic-gradient(from_90deg,#ef4444,#f97316,#facc15,#22c55e,#06b6d4,#2563eb,#7c3aed,#ec4899,#ef4444)] shadow-lg ring-4 ring-white transition hover:scale-105"
                        aria-label="اختيار لون الكتاب"
                      >
                        <span
                          className="grid h-8 w-8 place-items-center rounded-full border-2 border-white shadow-sm"
                          style={{ backgroundColor: libraryForm.color }}
                        >
                          <Palette size={14} className="text-white drop-shadow" />
                        </span>
                      </button>

                      <div>
                        <div className="text-sm font-black text-slate-800">الغلاف الحالي</div>
                        <div className="mt-1 text-xs font-bold text-slate-500">
                          اختر لونًا هادئًا يسهّل تمييز الخطط داخل المكتبة
                        </div>
                      </div>

                      <AnimatePresence>
                        {colorPickerOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 6, scale: 0.98 }}
                            className="absolute right-0 top-20 z-30 w-[290px] rounded-[2rem] border border-slate-200 bg-white p-4 shadow-[0_30px_60px_-35px_rgba(15,23,42,0.4)]"
                          >
                            <div className="mb-3 flex items-center justify-between">
                              <span className="text-sm font-black text-slate-800">اختر لون الكتاب</span>
                              <span
                                className="h-8 w-8 rounded-full border-2 border-white shadow ring-1 ring-slate-200"
                                style={{ backgroundColor: libraryForm.color }}
                              />
                            </div>

                            <div className="mb-4 rounded-[1.4rem] border border-slate-100 bg-slate-50 p-3">
                              <div className="mb-2 text-xs font-black text-slate-500">اختيار حر</div>
                              <div className="relative h-7" dir="ltr">
                                <div className="absolute left-0 right-0 top-1/2 h-3 -translate-y-1/2 rounded-full bg-[linear-gradient(90deg,#ef4444,#f97316,#facc15,#84cc16,#16a34a,#06b6d4,#0ea5e9,#4f46e5,#7c3aed,#ec4899,#ef4444)]" />
                                <span
                                  className="pointer-events-none absolute top-1/2 h-6 w-6 -translate-y-1/2 rounded-full border-2 border-white shadow-md ring-1 ring-slate-300"
                                  style={{
                                    left: `calc(${(colorHue / 360) * 100}% - 12px)`,
                                    backgroundColor: libraryForm.color,
                                  }}
                                />
                                <input
                                  type="range"
                                  min="0"
                                  max="360"
                                  value={colorHue}
                                  onChange={(event) => {
                                    const hue = Number(event.target.value);
                                    setColorHue(hue);
                                    setLibraryForm((current) => ({ ...current, color: `hsl(${hue}, 85%, 45%)` }));
                                  }}
                                  className="absolute inset-0 h-7 w-full cursor-pointer opacity-0"
                                  aria-label="اختيار لون حر"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-5 gap-2">
                              {COLOR_PALETTE.map((color) => {
                                const isSelected =
                                  color.toLowerCase() === String(libraryForm.color).toLowerCase();

                                return (
                                  <button
                                    key={color}
                                    type="button"
                                    onClick={() => {
                                      setLibraryForm((current) => ({ ...current, color }));
                                      setColorHue(getHueFromColor(color, colorHue));
                                      setColorPickerOpen(false);
                                    }}
                                    className={`grid h-10 w-10 place-items-center rounded-full border-2 transition hover:scale-110 ${
                                      isSelected ? 'border-slate-950 shadow-md' : 'border-white'
                                    }`}
                                    style={{ backgroundColor: color }}
                                    aria-label={`اختيار لون ${color}`}
                                  >
                                    {isSelected && <CheckCircle2 size={17} className="text-white drop-shadow" />}
                                  </button>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
                      <div className="text-xs font-black text-slate-500">ألعاب الخطة</div>
                      <div className="mt-2 text-2xl font-black text-slate-900">{libraryForm.gameIds.length}</div>
                    </div>
                    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
                      <div className="text-xs font-black text-slate-500">لون الغلاف</div>
                      <div className="mt-3 flex items-center gap-3">
                        <span
                          className="h-8 w-8 rounded-full border-2 border-white shadow ring-1 ring-slate-200"
                          style={{ backgroundColor: libraryForm.color }}
                        />
                        <span className="text-sm font-black text-slate-700">مخصص لهذه الخطة</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center justify-center gap-2 rounded-[1.4rem] bg-[linear-gradient(135deg,_#0ea5e9,_#0284c7)] px-5 py-3 text-sm font-black text-white shadow-[0_20px_40px_-25px_rgba(2,132,199,0.55)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      <Save size={18} />
                      {saving ? 'جاري الحفظ...' : libraryForm.id ? 'حفظ الخطة' : 'إنشاء الخطة'}
                    </button>

                    {selectedLibrary && (
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(selectedLibrary)}
                        className="inline-flex items-center justify-center gap-2 rounded-[1.4rem] border border-red-100 bg-red-50 px-5 py-3 text-sm font-black text-red-600 transition hover:bg-red-100"
                      >
                        <Trash2 size={17} />
                        حذف الخطة
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 xl:p-6">
              <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h3 className="text-xl font-black text-slate-900">الألعاب المختارة داخل الخطة</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    تظهر هنا الألعاب التي أضفتها لهذه الخطة.
                  </p>
                </div>
                <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                  {selectedGames.length} لعبة
                </div>
              </div>

              {selectedGames.length ? (
                <motion.div layout className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <AnimatePresence>
                    {selectedGames.map((game, index) => (
                      <SelectedGameCard key={game.id} game={game} accentColor={libraryForm.color} index={index} />
                    ))}
                  </AnimatePresence>
                </motion.div>
              ) : (
                <div className="mb-6 rounded-[1.8rem] border border-dashed border-slate-200 bg-slate-50 px-4 py-12 text-center">
                  <Gamepad2 className="mx-auto mb-3 text-slate-300" size={40} />
                  <div className="font-black text-slate-700">لا توجد ألعاب مضافة بعد</div>
                  <div className="mt-2 text-sm text-slate-500">ابدأ باختيار الألعاب من القائمة التالية.</div>
                </div>
              )}

              <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h3 className="text-xl font-black text-slate-900">أضف ألعابًا إلى الخطة</h3>
                  <p className="text-sm text-slate-500">حدّد الألعاب التي تريد أن تظهر داخل هذه الخطة العلاجية.</p>
                </div>
                <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                  {filteredGames.length} نتيجة
                </div>
              </div>

              <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
                <div className="relative">
                  <Search size={18} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={gameSearchQuery}
                    onChange={(event) => setGameSearchQuery(event.target.value)}
                    placeholder="ابحث باسم اللعبة أو بالكود..."
                    className="w-full rounded-[1.4rem] border border-slate-200 bg-slate-50 py-3 pr-10 pl-4 text-sm font-bold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                  />
                </div>

                <div className="relative z-20">
                  <button
                    type="button"
                    onClick={() => setGameBandFilterOpen((current) => !current)}
                    aria-expanded={gameBandFilterOpen}
                    className={`flex w-full items-center justify-between gap-3 rounded-[1.05rem] border px-3 py-2 text-xs font-black outline-none transition-all duration-200 ${
                      gameBandFilterOpen
                        ? 'border-sky-400 bg-white text-sky-800 shadow-[0_16px_32px_-26px_rgba(14,165,233,0.75)] ring-4 ring-sky-100'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-sky-200 hover:bg-white'
                    }`}
                  >
                    <span className="truncate">{selectedGameBandLabel}</span>
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors ${
                      gameBandFilterOpen ? 'bg-sky-50 text-sky-700' : 'bg-white text-slate-400 ring-1 ring-slate-100'
                    }`}>
                      {gameBandFilterOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </span>
                  </button>

                  <AnimatePresence>
                    {gameBandFilterOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.98 }}
                        transition={{ duration: 0.16 }}
                        className="absolute left-0 right-0 top-[calc(100%+0.35rem)] z-30 overflow-hidden rounded-[1rem] border border-sky-100 bg-white p-1 shadow-[0_22px_50px_-30px_rgba(15,23,42,0.45)] ring-1 ring-sky-50"
                      >
                        <div className="max-h-48 overflow-y-auto pl-1">
                          {[{ value: 'all', label: '\u0643\u0644 \u0627\u0644\u0628\u0646\u0648\u062f' }, ...gameBands.map((band) => ({ value: band, label: getGameBandLabel(band) }))].map((option) => {
                            const isActive = selectedGameBand === option.value;

                            return (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => {
                                  setSelectedGameBand(option.value);
                                  setGameBandFilterOpen(false);
                                }}
                                className={`flex w-full items-center justify-between gap-3 rounded-[0.8rem] px-3 py-2 text-right text-xs font-black transition ${
                                  isActive
                                    ? 'bg-sky-600 text-white shadow-[0_12px_24px_-18px_rgba(2,132,199,0.75)]'
                                    : 'text-slate-700 hover:bg-sky-50 hover:text-sky-800'
                                }`}
                              >
                                <span>{option.label}</span>
                                {isActive && <CheckCircle2 size={14} />}
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="grid max-h-[620px] grid-cols-1 gap-3 overflow-y-auto pl-1">
                {filteredGames.length ? (
                  filteredGames.map((game) => {
                    const gameId = String(game.id);
                    const isSelected = libraryForm.gameIds.includes(gameId);
                    const usedInOtherPlan = gameUsedInOtherPlanMap.get(gameId);
                    const isBlocked = Boolean(usedInOtherPlan) && !isSelected;

                    return (
                      <motion.button
                        key={game.id}
                        layout
                        type="button"
                        disabled={isBlocked}
                        onClick={() => handleToggleGame(gameId)}
                        whileHover={isBlocked ? undefined : { y: -2 }}
                        whileTap={isBlocked ? undefined : { scale: 0.995 }}
                        className={`rounded-[1.6rem] border p-4 text-right transition disabled:cursor-not-allowed disabled:opacity-60 ${
                          isBlocked
                            ? 'border-slate-200 bg-slate-100/80'
                            : isSelected
                              ? 'border-sky-200 bg-sky-50 shadow-[0_20px_35px_-30px_rgba(14,165,233,0.8)]'
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex flex-wrap items-center gap-3 xl:justify-end">
                          <div
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                              isBlocked
                                ? 'bg-slate-200 text-slate-400'
                                : isSelected
                                  ? 'bg-sky-600 text-white'
                                  : 'bg-slate-100 text-sky-700'
                            }`}
                          >
                            {isSelected ? <CheckCircle2 size={19} /> : <Gamepad2 size={19} />}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="line-clamp-2 text-sm font-black leading-6 text-slate-900">
                                {getGameTitle(game)}
                              </h4>
                              {game.gameCode && (
                                <span dir="ltr" className="inline-flex min-w-fit shrink-0 whitespace-nowrap rounded-full border border-sky-100 bg-white px-2.5 py-1 text-[10px] font-black text-sky-700">
                                  {getGameCodeLabel(game.gameCode)}
                                </span>
                              )}
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-black">
                              <span className="inline-flex min-w-fit whitespace-nowrap rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                                {getActivityCount(game)} نشاط
                              </span>
                              {usedInOtherPlan && (
                                <span className="inline-flex min-w-fit whitespace-nowrap rounded-full bg-amber-50 px-3 py-1 text-amber-700">
                                  {'\u0645\u0648\u062c\u0648\u062f\u0629 \u0641\u064a \u062e\u0637\u0629'}: {usedInOtherPlan?.name || '--'}
                                </span>
                              )}
                              {!isBlocked && libraryForm.gameIds.includes(gameId) && (
                                <span className="inline-flex min-w-fit whitespace-nowrap rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
                                  {getSelectedItemLabel(libraryForm.gameIds.indexOf(gameId))}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.button>
                    );
                  })
                ) : (
                  <div className="rounded-[1.8rem] border border-dashed border-slate-200 bg-slate-50 px-4 py-12 text-center">
                    <Gamepad2 className="mx-auto mb-3 text-slate-300" size={40} />
                    <div className="font-black text-slate-700">لا توجد ألعاب مطابقة</div>
                    <div className="mt-2 text-sm text-slate-500">جرّب كلمة بحث مختلفة أو اختر تصنيفًا آخر.</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.form>
          </AnimatePresence>
        </section>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteLibrary}
        title="حذف الخطة العلاجية"
        message={`هل تريد حذف خطة "${deleteTarget?.name || ''}"؟ سيتم حذف الخطة فقط بدون حذف الألعاب نفسها.`}
        confirmText="حذف الخطة"
        cancelText="إلغاء"
        position="top"
      />
    </div>
  );
}
