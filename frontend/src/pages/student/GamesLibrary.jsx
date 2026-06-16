import React, { useEffect, useState, useMemo } from 'react';
import { Filter, Search, Play, Gamepad2, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import gameService from '../../services/gameService';

const GamesLibrary = () => {
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [activeTag, setActiveTag] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  useEffect(() => {
    const fetchGames = async () => {
      try {
        const response = await gameService.getGames();
        setGames(Array.isArray(response) ? response : response.data || []);
      } catch (error) {
        console.error("Failed to load games", error);
      } finally {
        setLoading(false);
      }
    };
    fetchGames();
  }, []);

  const filteredGames = useMemo(() => {
    return games.filter(game => {
      const searchStr = `${game.titleAr || ''} ${game.title || ''} ${game.name || ''}`.toLowerCase();
      const matchesSearch = !filter || searchStr.includes(filter.toLowerCase());
      const tags = Array.isArray(game.config?.tags) ? game.config.tags : [];
      const matchesTag = !activeTag || tags.includes(activeTag);
      return matchesSearch && matchesTag;
    });
  }, [games, filter, activeTag]);

  const tagOptions = useMemo(() => {
    return [...new Set(games.flatMap((game) => Array.isArray(game.config?.tags) ? game.config.tags : []))]
      .filter(Boolean)
      .slice(0, 6);
  }, [games]);

  return (
    <section dir="rtl" className="space-y-5">
      <div className="mx-auto max-w-5xl rounded-[1.5rem] border border-[#dbe7f3] bg-white p-4 shadow-sm sm:p-5 md:p-6">
        <h1 className="mb-2 text-2xl font-black text-slate-900 md:text-4xl">مكتبة الألعاب</h1>
        <p className="mb-4 max-w-3xl text-sm font-bold leading-6 text-slate-600 md:text-base">مساحة للعب الحر! استكشف جميع الألعاب وجربها بدون تقييم رسمي.</p>
        
        <div className="flex max-w-xl items-center gap-2">
          <div className="relative flex-1">
          <input 
            type="text" 
            placeholder="ابحث عن لعبة..." 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-4 pr-10 text-sm font-bold outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
          <Search size={17} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
          <button
            type="button"
            onClick={() => setShowFilters((current) => !current)}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-slate-300 bg-white text-slate-500 transition-colors hover:border-blue-400 hover:text-blue-600"
            aria-label="فلتر الألعاب"
          >
            <Filter size={18} />
          </button>
        </div>

        {showFilters && tagOptions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveTag('')}
              className={`h-9 rounded-xl border px-3 text-xs font-black transition-colors ${
                !activeTag ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-500'
              }`}
            >
              الكل
            </button>
            {tagOptions.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setActiveTag(tag)}
                className={`h-9 rounded-xl border px-3 text-xs font-black transition-colors ${
                  activeTag === tag ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-500'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-10 text-slate-500 font-bold">جارٍ تحميل الألعاب...</div>
      ) : filteredGames.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
          {filteredGames.map((game, index) => (
            <div 
              key={game.id} 
              className={`relative overflow-hidden rounded-[2rem] border p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group cursor-pointer
                ${index % 3 === 0 ? 'bg-gradient-to-br from-[#f1f8ff] to-[#dcecff] border-[#c8ddf3] hover:shadow-sky-200/45' : 
                  index % 3 === 1 ? 'bg-gradient-to-br from-[#eefcfb] to-[#d8f1ee] border-[#bde3df] hover:shadow-teal-200/45' : 
                  'bg-gradient-to-br from-[#f5f3ff] to-[#e5e7ff] border-[#d5d8f6] hover:shadow-indigo-200/45'}`}
              onClick={() => navigate(`/student/game/${game.id}`, { state: { isFreePlay: true } })}
            >
              <div className="absolute -top-4 -right-4 p-4 opacity-10 transition-transform duration-500 group-hover:scale-150 group-hover:rotate-12">
                <Sparkles className="w-32 h-32" />
              </div>
              
              <div className="relative z-10 text-right">
                <div className="flex justify-between items-start mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-white/80 shadow-sm border border-white/50 flex items-center justify-center backdrop-blur-sm">
                    <Gamepad2 className={`w-7 h-7 ${index % 3 === 0 ? 'text-sky-600' : index % 3 === 1 ? 'text-teal-600' : 'text-indigo-600'}`} />
                  </div>
                </div>
                
                <h3 className="font-black text-slate-800 text-xl mb-2">{game.titleAr || game.title || game.name}</h3>
                <p className="text-sm font-bold text-slate-500 mb-6 line-clamp-2 leading-relaxed">
                  {game.descriptionAr || game.description || 'لعبة تفاعلية لتنمية المهارات بصورة ممتعة ومحفزة.'}
                </p>

                <div className="flex items-center justify-end mt-auto">
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white shadow-md transition-transform active:scale-95 group-hover:-translate-x-1
                    ${index % 3 === 0 ? 'bg-sky-600 shadow-sky-200' : index % 3 === 1 ? 'bg-teal-600 shadow-teal-200' : 'bg-indigo-600 shadow-indigo-200'}`}>
                    <Play size={16} fill="currentColor" /> جرب اللعبة
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[#c6d9ea] bg-white p-8 text-center text-slate-600 font-bold">
          لا توجد ألعاب متطابقة مع بحثك.
        </div>
      )}
    </section>
  );
};

export default GamesLibrary;
