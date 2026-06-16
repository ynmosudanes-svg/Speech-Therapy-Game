import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  FolderOpen,
  Gamepad2,
  Library,
  Palette,
  Plus,
  Save,
  Search,
  Trash2,
} from 'lucide-react';
import ConfirmModal from '../../components/ConfirmModal';
import { useTherapyStore } from '../../hooks/useTherapyStore';
import gameService from '../../services/gameService';
import gameLibraryService from '../../services/gameLibraryService';

const FOLDER_COLORS = ['#138fbc', '#0f766e', '#7c3aed', '#e11d48', '#ea580c', '#16a34a'];
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
  color: FOLDER_COLORS[0],
  gameIds: [],
});

const getGameTitle = (game) =>
  game?.titleAr || game?.config?.nameAr || game?.title || game?.name || 'لعبة علاجية';

const getActivityCount = (game) =>
  Array.isArray(game?.config?.levels)
    ? game.config.levels.reduce((sum, level) => sum + (level.activities?.length || 0), 0)
    : 0;

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

export default function LibraryPage() {
  const { adminSession } = useTherapyStore();
  const [libraries, setLibraries] = useState([]);
  const [games, setGames] = useState([]);
  const [selectedLibraryId, setSelectedLibraryId] = useState('');
  const [libraryForm, setLibraryForm] = useState(createEmptyLibraryForm());
  const [searchQuery, setSearchQuery] = useState('');
  const [gameSearchQuery, setGameSearchQuery] = useState('');
  const [selectedGameType, setSelectedGameType] = useState('all');
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
          handleSelectLibrary(nextLibraries[0]);
        } else {
          setSelectedLibraryId('');
          setLibraryForm(createEmptyLibraryForm());
        }
      } catch (loadError) {
        setError(getLibraryErrorMessage(loadError, 'تعذر تحميل مكتبة الألعاب.'));
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

  const gameTypes = useMemo(() => {
    const types = games
      .map((game) => String(game?.type || '').trim())
      .filter(Boolean);

    return [...new Set(types)].sort((first, second) => first.localeCompare(second));
  }, [games]);

  const filteredGames = useMemo(() => {
    const query = gameSearchQuery.trim().toLowerCase();

    return games.filter((game) => {
      const gameType = String(game?.type || '').trim();
      const matchesType = selectedGameType === 'all' || gameType === selectedGameType;
      if (!matchesType) return false;

      if (!query) return true;

      const haystack = `${getGameTitle(game)} ${game?.gameCode || ''} ${game?.type || ''}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [games, gameSearchQuery, selectedGameType]);

  const selectedGamesPreview = useMemo(
    () => games.filter((game) => libraryForm.gameIds.includes(String(game.id))).slice(0, 3),
    [games, libraryForm.gameIds]
  );

  const handleCreateNew = () => {
    setSelectedLibraryId('');
    setLibraryForm(createEmptyLibraryForm());
    setColorHue(getHueFromColor(FOLDER_COLORS[0]));
    setError('');
  };

  const handleSelectLibrary = (libraryItem) => {
    setSelectedLibraryId(libraryItem.id);
    setLibraryForm({
      id: libraryItem.id,
      name: libraryItem.name || '',
      description: libraryItem.description || '',
      color: libraryItem.color || FOLDER_COLORS[0],
      gameIds: Array.isArray(libraryItem.gameIds) ? libraryItem.gameIds.map(String) : [],
    });
    setColorHue(getHueFromColor(libraryItem.color || FOLDER_COLORS[0]));
    setError('');
  };

  const handleToggleGame = (gameId) => {
    setLibraryForm((current) => ({
      ...current,
      gameIds: current.gameIds.includes(gameId)
        ? current.gameIds.filter((id) => id !== gameId)
        : [...current.gameIds, gameId],
    }));
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
        handleSelectLibrary(updated);
      } else {
        const created = await gameLibraryService.createLibrary(adminSession.token, payload);
        setLibraries((current) => [...current, created]);
        handleSelectLibrary(created);
      }
    } catch (saveError) {
      setError(getLibraryErrorMessage(saveError, 'تعذر حفظ المجموعة.'));
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
          handleSelectLibrary(nextLibraries[0]);
        } else {
          handleCreateNew();
        }
      }
    } catch (deleteError) {
      setError(getLibraryErrorMessage(deleteError, 'تعذر حذف المجموعة.'));
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="px-6 py-6 lg:px-8">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-black text-primary">
              <BookOpen size={15} />
              مكتبة علاجية
            </div>
            <h1 className="max-w-3xl text-2xl font-black leading-tight text-slate-950 lg:text-[28px]">
              رتب الألعاب في مجموعات جاهزة لكل خطة علاجية
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
              أنشئ مجموعة حسب الهدف، اختر لونها، ثم أضف الألعاب المناسبة لها حتى يصبح اختيار النشاط أثناء الجلسة أسرع وأوضح.
            </p>
          </div>

          <div className="border-t border-slate-100 bg-slate-50 px-6 py-5 lg:border-r lg:border-t-0">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-3 text-center">
                <Library className="mx-auto mb-2 text-primary" size={20} />
                <div className="text-xl font-black text-slate-950">{libraries.length}</div>
                <div className="text-xs font-bold text-slate-500">مجموعة</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-3 text-center">
                <Gamepad2 className="mx-auto mb-2 text-primary" size={20} />
                <div className="text-xl font-black text-slate-950">{games.length}</div>
                <div className="text-xs font-bold text-slate-500">لعبة</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-3 text-center">
                <CheckCircle2 className="mx-auto mb-2 text-primary" size={20} />
                <div className="text-xl font-black text-slate-950">{libraryForm.gameIds.length}</div>
                <div className="text-xs font-bold text-slate-500">مختارة</div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCreateNew}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-black text-white shadow-lg shadow-sky-900/10 transition hover:bg-primary-hover active:scale-[0.99]"
            >
              <Plus size={18} />
              مجموعة جديدة
            </button>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-bold text-red-600">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[350px_minmax(0,1fr)]">
        <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-slate-950">المجموعات</h2>
              <p className="text-xs font-bold text-slate-400">اختر مجموعة للتعديل أو أنشئ واحدة جديدة</p>
            </div>
            <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-black text-primary">
              {filteredLibraries.length}
            </span>
          </div>

          <div className="relative mb-4">
            <Search size={18} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="ابحث عن مجموعة..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pr-10 pl-4 text-sm font-bold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-sky-100"
            />
          </div>

          <div className="max-h-[640px] space-y-3 overflow-y-auto pl-1">
            {loading ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm font-bold text-slate-500">
                جاري تحميل المجموعات...
              </div>
            ) : filteredLibraries.length ? (
              filteredLibraries.map((libraryItem) => {
                const isActive = String(libraryItem.id) === String(selectedLibraryId);

                return (
                  <button
                    key={libraryItem.id}
                    type="button"
                    onClick={() => handleSelectLibrary(libraryItem)}
                    className={`w-full rounded-2xl border p-4 text-right transition ${
                      isActive
                        ? 'border-primary bg-sky-50 shadow-sm'
                        : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm"
                        style={{ backgroundColor: libraryItem.color || FOLDER_COLORS[0] }}
                      >
                        <FolderOpen size={21} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="truncate text-base font-black text-slate-950">{libraryItem.name}</h3>
                          <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-slate-600">
                            {libraryItem.gamesCount || 0} لعبة
                          </span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500">
                          {libraryItem.description || 'مجموعة بدون وصف بعد.'}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center">
                <FolderOpen className="mx-auto mb-3 text-slate-300" size={38} />
                <div className="font-black text-slate-700">لا توجد مجموعات</div>
                <div className="mt-1 text-sm text-slate-500">ابدأ بإنشاء أول مجموعة علاجية للألعاب.</div>
              </div>
            )}
          </div>
        </aside>

        <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-black text-primary">
                <ClipboardList size={16} />
                تخصيص المجموعة
              </div>
              <h2 className="text-xl font-black text-slate-950 lg:text-2xl">
                {libraryForm.id ? 'تعديل مجموعة علاجية' : 'إنشاء مجموعة علاجية جديدة'}
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                الاسم واللون يساعدان المعالج في التعرف على الهدف بسرعة داخل خطة المستفيد.
              </p>
            </div>

            {selectedLibrary && (
              <button
                type="button"
                onClick={() => setDeleteTarget(selectedLibrary)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-black text-red-600 transition hover:bg-red-100"
              >
                <Trash2 size={17} />
                حذف المجموعة
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-0 xl:grid-cols-[360px_minmax(0,1fr)]">
            <div className="border-b border-slate-100 p-5 xl:border-b-0 xl:border-l">
              <div className="space-y-5">
                <div>
                  <label className="mb-1.5 block text-sm font-black text-slate-700">اسم المجموعة</label>
                  <input
                    required
                    value={libraryForm.name}
                    onChange={(event) => setLibraryForm((current) => ({ ...current, name: event.target.value }))}
                    placeholder="مثال: مكتبة الانتباه"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-sky-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-black text-slate-700">وصف مختصر</label>
                  <textarea
                    rows={4}
                    value={libraryForm.description}
                    onChange={(event) =>
                      setLibraryForm((current) => ({ ...current, description: event.target.value }))
                    }
                    placeholder="مثال: ألعاب مخصصة للتمييز السمعي والبصري وزيادة مدة الانتباه."
                    className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold leading-7 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-sky-100"
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-center gap-2 text-sm font-black text-slate-700">
                    <Palette size={16} className="text-primary" />
                    لون المجموعة
                  </div>
                  <div className="relative inline-flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setColorPickerOpen((current) => !current)}
                      className="group relative grid h-14 w-14 place-items-center rounded-full bg-[conic-gradient(from_90deg,#ef4444,#f97316,#facc15,#22c55e,#06b6d4,#2563eb,#7c3aed,#ec4899,#ef4444)] shadow-md ring-4 ring-white transition hover:scale-105"
                      aria-label="اختيار لون المجموعة"
                    >
                      <span
                        className="grid h-7 w-7 place-items-center rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: libraryForm.color }}
                      >
                        <Palette size={13} className="text-white drop-shadow" />
                      </span>
                    </button>
                    {colorPickerOpen && (
                      <div className="absolute right-0 top-16 z-30 w-64 rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-900/15">
                        <div className="mb-3 flex items-center justify-between">
                          <span className="text-sm font-black text-slate-800">اختيار اللون</span>
                          <span
                            className="h-7 w-7 rounded-full border-2 border-white shadow ring-1 ring-slate-200"
                            style={{ backgroundColor: libraryForm.color }}
                          />
                        </div>
                        <div className="mb-4 rounded-2xl border border-slate-100 bg-slate-50 p-3">
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
                            const isSelected = color.toLowerCase() === String(libraryForm.color).toLowerCase();

                            return (
                              <button
                                key={color}
                                type="button"
                                onClick={() => {
                                  setLibraryForm((current) => ({ ...current, color }));
                                  setColorHue(getHueFromColor(color, colorHue));
                                  setColorPickerOpen(false);
                                }}
                                className={`grid h-9 w-9 place-items-center rounded-full border-2 transition hover:scale-110 ${
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
                      </div>
                    )}
                    {[].map((color) => {
                      const isSelected = color === libraryForm.color;

                      return (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setLibraryForm((current) => ({ ...current, color }))}
                          className={`grid h-11 w-11 place-items-center rounded-full border-2 transition ${
                            isSelected ? 'border-slate-950 shadow-md' : 'border-white hover:scale-105'
                          }`}
                          style={{ backgroundColor: color }}
                          aria-label={`اختيار لون ${color}`}
                        >
                          {isSelected && <CheckCircle2 size={18} className="text-white" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-sm font-black text-slate-700">ملخص المجموعة</div>
                  <div className="mt-3 flex items-end justify-between gap-3">
                    <div>
                      <div className="text-2xl font-black text-slate-950">{libraryForm.gameIds.length}</div>
                      <div className="text-sm font-bold text-slate-500">لعبة محددة</div>
                    </div>
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-2xl text-white"
                      style={{ backgroundColor: libraryForm.color }}
                    >
                      <FolderOpen size={22} />
                    </div>
                  </div>
                  {false && selectedGamesPreview.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {selectedGamesPreview.map((game) => (
                        <div key={game.id} className="truncate rounded-xl bg-white px-3 py-2 text-xs font-black text-slate-600">
                          {getGameTitle(game)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-5">
              <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h3 className="text-xl font-black text-slate-950">اختيار الألعاب</h3>
                  <p className="text-sm text-slate-500">حدد الألعاب التي ستظهر داخل هذه المجموعة.</p>
                </div>
                <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-black text-primary">
                  {filteredGames.length} نتيجة
                </span>
              </div>

              <div className="relative mb-4">
                <Search size={18} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={gameSearchQuery}
                  onChange={(event) => setGameSearchQuery(event.target.value)}
                  placeholder="ابحث بكود اللعبة أو الاسم..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pr-10 pl-4 text-sm font-bold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-sky-100"
                />
              </div>

              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-black text-slate-600">فلتر التصنيف</label>
                <div className="relative">
                <select
                  value={selectedGameType}
                  onChange={(event) => setSelectedGameType(event.target.value)}
                  className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 py-3 pr-4 pl-10 text-sm font-black text-slate-700 outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-sky-100"
                >
                  <option value="all">كل التصنيفات</option>
                  {gameTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={18}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                </div>
              </div>

              <div className="grid max-h-[620px] grid-cols-1 gap-2 overflow-y-auto pl-1">
                {filteredGames.length ? (
                  filteredGames.map((game) => {
                    const gameId = String(game.id);
                    const isSelected = libraryForm.gameIds.includes(gameId);

                    return (
                      <button
                        key={game.id}
                        type="button"
                        onClick={() => handleToggleGame(gameId)}
                        className={`rounded-2xl border p-3 text-right transition ${
                          isSelected
                            ? 'border-primary bg-sky-50 shadow-sm'
                            : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                              isSelected ? 'bg-primary text-white' : 'bg-slate-100 text-primary'
                            }`}
                          >
                            {isSelected ? <CheckCircle2 size={18} /> : <Gamepad2 size={18} />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="line-clamp-2 text-sm font-black leading-5 text-slate-950">
                                {getGameTitle(game)}
                              </h4>
                              {game.gameCode && (
                                <span className="shrink-0 rounded-full border border-sky-100 bg-white px-2 py-0.5 text-[10px] font-black text-primary">
                                  {game.gameCode}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex shrink-0 flex-wrap justify-start gap-2 text-[11px] font-black text-slate-500 sm:justify-end">
                            <span className="rounded-xl bg-slate-50 px-3 py-1.5">{getActivityCount(game)} نشاط</span>
                          </div>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center lg:col-span-2">
                    <Gamepad2 className="mx-auto mb-3 text-slate-300" size={40} />
                    <div className="font-black text-slate-700">لا توجد ألعاب مطابقة</div>
                    <div className="mt-1 text-sm text-slate-500">جرّب كلمة بحث مختلفة أو أضف ألعابًا من مدير الألعاب.</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end border-t border-slate-100 p-5">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-black text-white shadow-lg shadow-sky-900/10 transition hover:bg-primary-hover active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Save size={18} />
              {saving ? 'جاري الحفظ...' : libraryForm.id ? 'حفظ المجموعة' : 'إنشاء المجموعة'}
            </button>
          </div>
        </form>
      </div>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteLibrary}
        title="حذف المجموعة"
        message={`هل تريد حذف مجموعة "${deleteTarget?.name || ''}"؟ سيتم حذف المجموعة فقط بدون حذف الألعاب نفسها.`}
        confirmText="حذف المجموعة"
        cancelText="إلغاء"
      />
    </div>
  );
}
