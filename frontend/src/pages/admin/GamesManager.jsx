import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit2, Plus, Search, Trash2, Tag, ChevronDown, Check, Gamepad2, Sparkles, ArrowLeft } from 'lucide-react';
import Button from '../../components/Button';
import gameService from '../../services/gameService';
import { useTherapyStore } from '../../hooks/useTherapyStore';
import ConfirmModal from '../../components/ConfirmModal';

const getActivitiesCount = (game) =>
  Array.isArray(game?.config?.levels)
    ? game.config.levels.reduce(
        (total, level) => total + (Array.isArray(level.activities) ? level.activities.length : 0),
        0
      )
    : 0;

const getDisplayName = (game) => game?.config?.nameAr || game?.titleAr || game?.title || game?.name;

const normalizeSearchValue = (value) => String(value || '').trim().toLowerCase();

const GamesManager = () => {
  const navigate = useNavigate();
  const { adminSession } = useTherapyStore();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTags, setActiveTags] = useState([]);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [deleteGameId, setDeleteGameId] = useState(null);

  const allAvailableTags = useMemo(() => {
    const tags = new Set(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']); // default starter tags
    games.forEach(g => {
      if (Array.isArray(g.config?.tags)) {
        g.config.tags.forEach(t => tags.add(t));
      }
    });
    try {
      const local = JSON.parse(localStorage.getItem('allGameTags')) || [];
      local.forEach(t => tags.add(t));
    } catch {}
    return Array.from(tags).sort();
  }, [games]);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const response = await gameService.getGames(adminSession?.token);
        setGames(Array.isArray(response) ? response : []);
      } catch (error) {
        console.error('Error fetching games:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, [adminSession?.token]);

  const filteredGames = useMemo(() => {
    const query = normalizeSearchValue(searchTerm);

    return games.filter((game) => {
      const matchesSearch = !query || [
        game?.gameCode,
        getDisplayName(game),
        game?.type,
        game?.title,
        game?.name,
      ].some((value) => normalizeSearchValue(value).includes(query));

      const gameTags = game.config?.tags || [];
      const matchesTags = activeTags.length === 0 || activeTags.every(tag => gameTags.includes(tag));

      return matchesSearch && matchesTags;
    });
  }, [games, searchTerm, activeTags]);

  const handleDelete = (gameId) => {
    setDeleteGameId(gameId);
  };

  const confirmDelete = async () => {
    if (!deleteGameId) return;

    try {
      await gameService.deleteGame(adminSession?.token, deleteGameId);
      setGames((current) => current.filter((game) => game.id !== deleteGameId));
      setDeleteGameId(null);
    } catch (error) {
      console.error('Error deleting game:', error);
      window.alert('حدث خطأ أثناء حذف اللعبة.');
      setDeleteGameId(null);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xl font-bold text-slate-700">جارٍ تحميل الألعاب...</div>;
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900">إدارة الألعاب</h2>
          <p className="text-slate-500 mt-2">ابحث بالكود أو اسم اللعبة أو نوعها لتنظيم مكتبة الألعاب.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-3 xl:min-w-[40rem] items-center">
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <div className="relative flex-[2]">
              <Search
                size={18}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full rounded-2xl border border-[#dbe7f3] bg-white pr-11 pl-4 py-3 text-slate-800 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                placeholder="ابحث بكود اللعبة أو الاسم"
              />
            </div>

            <div className="relative flex-1">
              <button
                type="button"
                onClick={() => setFilterMenuOpen(!filterMenuOpen)}
                className="w-full flex items-center justify-between px-4 py-3 bg-white border border-[#dbe7f3] rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-slate-700"
              >
                <div className="flex items-center gap-2">
                  <Tag size={18} className="text-slate-400" />
                  <span className="font-bold whitespace-nowrap">
                    الفلاتر {activeTags.length > 0 ? `(${activeTags.length})` : ''}
                  </span>
                </div>
                <ChevronDown size={18} className={`text-slate-400 transition-transform ${filterMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {filterMenuOpen && (
                <div className="absolute z-50 left-0 top-full mt-2 w-full bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden" dir="ltr">
                  <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50" dir="rtl">
                    <span className="font-bold text-slate-700">تصفية بالتصنيفات</span>
                    {activeTags.length > 0 && (
                      <button
                        onClick={() => { setActiveTags([]); setFilterMenuOpen(false); }}
                        className="text-xs text-red-500 hover:text-red-700 font-bold px-2 py-1 bg-red-50 rounded-lg"
                      >
                        مسح الكل
                      </button>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto p-2">
                    {allAvailableTags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => setActiveTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors ${
                          activeTags.includes(tag) 
                            ? 'bg-blue-50 text-blue-700 font-bold' 
                            : 'hover:bg-slate-50 text-slate-700 font-semibold'
                        }`}
                      >
                        <span>{tag}</span>
                        {activeTags.includes(tag) && <Check size={16} className="text-blue-600" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <Button
            variant="primary"
            onClick={() => navigate('/admin/games/create')}
            className="w-full md:w-auto !py-3 !px-6 shrink-0 whitespace-nowrap shadow-sm shadow-blue-200"
          >
            <Plus size={20} />
            <span>لعبة جديدة</span>
          </Button>
        </div>
      </div>

      <div className="inline-flex items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50/50 px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm">
        <span className="font-black text-blue-700 bg-white border border-blue-100 px-2.5 py-0.5 rounded-lg shadow-sm">
          {filteredGames.length}
        </span>
        <span>لعبة ظاهرة في النتائج الحالية</span>
      </div>

      <div className="bg-white border border-[#dbe7f3] rounded-2xl shadow-sm overflow-hidden mt-6">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-[#dbe7f3]">
                <th className="px-6 py-4 text-sm font-black text-slate-500 whitespace-nowrap">اسم اللعبة</th>
                <th className="px-6 py-4 text-sm font-black text-slate-500 whitespace-nowrap">الكود</th>
                <th className="px-6 py-4 text-sm font-black text-slate-500 whitespace-nowrap">التصنيف</th>
                <th className="px-6 py-4 text-sm font-black text-slate-500 whitespace-nowrap">الأنشطة</th>
                <th className="px-6 py-4 text-sm font-black text-slate-500 whitespace-nowrap text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredGames.length > 0 ? (
                filteredGames.map((game) => (
                  <tr key={game.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                          <Gamepad2 size={20} />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-black text-slate-800 text-base">{getDisplayName(game)}</span>
                          {game.config?.itemDescription && (
                            <span className="text-xs text-slate-500 font-medium mt-0.5">{game.config.itemDescription}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-600 text-right">{game.gameCode || '--'}</td>
                    <td className="px-6 py-4">
                      {(game.config?.tags || []).length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {game.config.tags.map(tag => (
                            <span key={tag} className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md text-xs font-bold border border-blue-100">
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-sm">--</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center justify-center min-w-[2.5rem] h-7 px-2.5 bg-slate-100 text-slate-700 font-black text-sm rounded-lg border border-slate-200">
                        {getActivitiesCount(game)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => navigate(`/admin/games/edit/${game.id}`)}
                          className="w-9 h-9 flex items-center justify-center text-blue-600 hover:bg-blue-100 rounded-lg transition-colors border border-transparent hover:border-blue-200"
                          title="تعديل"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(game.id)}
                          className="w-9 h-9 flex items-center justify-center text-red-500 hover:bg-red-100 rounded-lg transition-colors border border-transparent hover:border-red-200"
                          title="حذف"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500 font-bold">
                    لا توجد ألعاب مطابقة للبحث.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <ConfirmModal
        isOpen={!!deleteGameId}
        onClose={() => setDeleteGameId(null)}
        onConfirm={confirmDelete}
        title="حذف اللعبة"
        message="هل أنت متأكد من حذف هذه اللعبة؟ لا يمكن التراجع عن هذه الخطوة."
        confirmText="نعم، احذف اللعبة"
        cancelText="إلغاء"
        isDestructive={true}
      />
    </div>
  );
};

export default GamesManager;
