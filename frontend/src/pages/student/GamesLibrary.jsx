import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BookOpen, Gamepad2, Play, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import gameLibraryService from '../../services/gameLibraryService';
import { useTherapyStore } from '../../hooks/useTherapyStore';

const fallbackColors = ['#1584C3', '#06B6D4', '#DC0B13', '#14A383', '#A855F7', '#F59E0B'];

const getLibraryColor = (library, index) => library?.color || fallbackColors[index % fallbackColors.length];
const getGameTitle = (game) => game.titleAr || game.config?.nameAr || game.title || game.name || 'لعبة علاجية';

const normalizeList = (response) => (Array.isArray(response) ? response : response?.data || []);

const GamesLibrary = () => {
  const navigate = useNavigate();
  const { currentStudent } = useTherapyStore();
  const [libraries, setLibraries] = useState([]);
  const [selectedLibraryId, setSelectedLibraryId] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const fetchLibraries = async () => {
      try {
        setLoading(true);
        setLoadError('');
        const response = await gameLibraryService.getLibraries();
        const data = normalizeList(response);

        if (isMounted) {
          setLibraries(data);
        }
      } catch (error) {
        console.error('Failed to load game libraries', error);
        if (isMounted) {
          setLibraries([]);
          setLoadError('تعذر تحميل المكتبات العلاجية. تأكد أن السيرفر يعمل ثم أعد تحميل الصفحة.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchLibraries();

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedLibrary = useMemo(
    () => libraries.find((library) => String(library.id) === String(selectedLibraryId)) || null,
    [libraries, selectedLibraryId]
  );

  const filteredLibraries = useMemo(() => {
    const query = filter.trim().toLowerCase();
    if (!query) return libraries;

    return libraries.filter((library) => {
      const text = `${library.name || ''} ${library.description || ''}`.toLowerCase();
      return text.includes(query);
    });
  }, [filter, libraries]);

  const filteredGames = useMemo(() => {
    const games = Array.isArray(selectedLibrary?.games) ? selectedLibrary.games : [];
    const query = filter.trim().toLowerCase();
    if (!query) return games;

    return games.filter((game) => {
      const text = `${getGameTitle(game)} ${game.descriptionAr || ''} ${game.description || ''}`.toLowerCase();
      return text.includes(query);
    });
  }, [filter, selectedLibrary]);

  const openGame = (gameId) => {
    if (currentStudent) {
      navigate(`/student/game/${gameId}?mode=free`, {
        state: { isFreePlay: true, fromLibraryId: selectedLibrary?.id },
      });
      return;
    }

    navigate(`/play/${gameId}`, { state: { isFreePlay: true, fromLibraryId: selectedLibrary?.id } });
  };

  const clearSelection = () => {
    setSelectedLibraryId('');
    setFilter('');
  };

  return (
    <section dir="rtl" className="space-y-5">
      <header className="flex flex-col gap-4 border-b border-[#dbe7f3] pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 text-right">

          <h1 className="text-2xl font-black leading-10 text-slate-900 md:text-4xl">
            {selectedLibrary ? selectedLibrary.name : 'المكتبة العلاجية'}
          </h1>
          <p className="mt-1 max-w-3xl text-sm font-bold leading-7 text-slate-600 md:text-base">
            {selectedLibrary
              ? selectedLibrary.description || 'اختر لعبة من داخل هذه المكتبة وجربها بحرية بدون نقاط أو تقارير.'
              : 'كل مكتبات الأدمن تظهر هنا تلقائيًا. اختر مكتبة ثم ادخل على ألعابها كتجربة حرة.'}
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto lg:items-center">
          {selectedLibrary && (
            <button
              type="button"
              onClick={clearSelection}
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#cfe3f3] bg-white px-4 text-sm font-black text-[#1584C3] shadow-sm transition hover:bg-[#f1fbff]"
            >
              <ArrowRight size={18} />
              رجوع للمكتبات
            </button>
          )}

          <div className="relative w-full sm:w-[21rem]">
            <input
              type="text"
              placeholder={selectedLibrary ? 'ابحث عن لعبة...' : 'ابحث عن مكتبة...'}
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-4 pr-10 text-sm font-bold outline-none transition-all placeholder:text-slate-400 focus:border-[#1584C3] focus:ring-4 focus:ring-sky-100"
            />
            <Search size={17} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
        </div>
      </header>

      {loading ? (
        <div className="rounded-2xl border border-dashed border-[#c6d9ea] bg-white p-8 text-center font-bold text-slate-500">
          جاري تحميل المكتبات العلاجية...
        </div>
      ) : loadError ? (
        <div className="rounded-2xl border border-dashed border-red-200 bg-red-50 p-8 text-center font-bold text-red-600">
          {loadError}
        </div>
      ) : selectedLibrary ? (
        filteredGames.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filteredGames.map((game, index) => {
              const accent = getLibraryColor(selectedLibrary, index);
              return (
                <button
                  type="button"
                  key={game.id}
                  onClick={() => openGame(game.id)}
                  className="group relative min-h-[15rem] overflow-hidden rounded-[1.65rem] border border-[#dbe7f3] bg-white p-5 text-right shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="absolute inset-x-5 top-0 h-2 rounded-b-full" style={{ backgroundColor: accent }} aria-hidden="true" />

                  <div className="relative z-10 flex h-full flex-col">
                    <div className="mb-5 flex items-center justify-between gap-3">
                      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#EAF7FD] shadow-sm ring-1 ring-[#cfe3f3]" style={{ color: accent }}>
                        <Gamepad2 size={29} />
                      </span>
                      <span className="rounded-full bg-[#EAF7FD] px-3 py-1 text-xs font-black text-[#1584C3] ring-1 ring-[#cfe3f3]">
                        تجربة حرة
                      </span>
                    </div>

                    <h3 className="text-xl font-black leading-8 text-slate-900">{getGameTitle(game)}</h3>
                    <p className="mt-2 line-clamp-2 text-sm font-bold leading-7 text-slate-500">
                      {game.descriptionAr || game.description || 'لعبة تفاعلية لتنمية المهارات بصورة ممتعة ومحفزة.'}
                    </p>

                    <div className="mt-auto flex items-center justify-end pt-6">
                      <span className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-black text-white shadow-sm transition-transform group-hover:-translate-x-1" style={{ backgroundColor: accent }}>
                        <Play size={16} fill="currentColor" />
                        ابدأ اللعب
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#c6d9ea] bg-white p-8 text-center font-bold text-slate-600">
            لا توجد ألعاب داخل هذه المكتبة مطابقة للبحث.
          </div>
        )
      ) : filteredLibraries.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredLibraries.map((library, index) => {
            const accent = getLibraryColor(library, index);
            const gamesCount = Array.isArray(library.games) ? library.games.length : library.gamesCount || 0;

            return (
              <button
                type="button"
                key={library.id}
                onClick={() => {
                  setSelectedLibraryId(String(library.id));
                  setFilter('');
                }}
                className="group relative min-h-[18.5rem] overflow-hidden rounded-[2rem] border border-[#dbe7f3] bg-white p-8 text-right shadow-[0_18px_40px_-30px_rgba(15,23,42,0.4)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_52px_-32px_rgba(15,23,42,0.45)]"
              >
                <div className="absolute inset-x-4 top-0 h-2.5 rounded-b-full" style={{ backgroundColor: accent }} aria-hidden="true" />
                <div className="pointer-events-none absolute -left-14 -top-14 h-36 w-36 rounded-full opacity-10" style={{ backgroundColor: accent }} aria-hidden="true" />
                <span className="absolute left-8 top-8 rounded-full bg-slate-50 px-3.5 py-1.5 text-xs font-black text-slate-600 ring-1 ring-slate-100">
                  {gamesCount} لعبة
                </span>
                <span className="absolute right-8 top-8 grid h-[5.25rem] w-[5.25rem] place-items-center rounded-[1.65rem] bg-white shadow-[0_14px_30px_-24px_rgba(15,23,42,0.55)] ring-1 ring-slate-100" style={{ color: accent }}>
                  <BookOpen size={36} />
                </span>

                <div className="relative z-10 flex min-h-[14rem] flex-col pt-28">
                  <h2 className="line-clamp-2 text-2xl font-black leading-9 text-slate-900">{library.name}</h2>
                  <p className="mt-3 line-clamp-3 max-w-[24rem] text-sm font-bold leading-7 text-slate-500">
                    {library.description || 'مجموعة ألعاب علاجية منظمة للتجربة الحرة.'}
                  </p>

                  <div className="mt-auto flex items-center justify-start pt-8">
                    <span className="inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-black text-white shadow-[0_14px_24px_-18px_rgba(15,23,42,0.5)] transition-transform group-hover:-translate-x-1" style={{ backgroundColor: accent }}>
                      عرض الألعاب
                      <ArrowRight size={17} />
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[#c6d9ea] bg-white p-8 text-center font-bold text-slate-600">
          لا توجد مكتبات علاجية متاحة الآن.
        </div>
      )}
    </section>
  );
};

export default GamesLibrary;
