import React, { useEffect, useState, useMemo } from 'react';
import { Filter, Play, Gamepad2, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import gameService from '../../services/gameService';

const GamesLibrary = () => {
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  
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
    if (!filter) return games;
    return games.filter(game => {
      const searchStr = `${game.titleAr || ''} ${game.title || ''} ${game.name || ''}`.toLowerCase();
      return searchStr.includes(filter.toLowerCase());
    });
  }, [games, filter]);

  return (
    <section dir="rtl" className="space-y-6">
      <div className="rounded-[2rem] border border-[#dbe7f3] bg-white p-6 md:p-8 shadow-sm">
        <h1 className="text-3xl md:text-5xl font-black mb-3 text-slate-900">مكتبة الألعاب</h1>
        <p className="text-slate-600 text-lg mb-6">مساحة للعب الحر! استكشف جميع الألعاب وجربها بدون تقييم رسمي.</p>
        
        <div className="relative max-w-md">
          <input 
            type="text" 
            placeholder="ابحث عن لعبة..." 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full pl-12 pr-12 py-3 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
          />
          <Filter size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-slate-500 font-bold">جارٍ تحميل الألعاب...</div>
      ) : filteredGames.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
          {filteredGames.map((game, index) => (
            <div 
              key={game.id} 
              className={`relative overflow-hidden rounded-[2rem] border p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group cursor-pointer
                ${index % 3 === 0 ? 'bg-gradient-to-br from-[#eff6ff] to-[#dbeafe] border-blue-100 hover:shadow-blue-200/50' : 
                  index % 3 === 1 ? 'bg-gradient-to-br from-[#f0fdf4] to-[#dcfce7] border-emerald-100 hover:shadow-emerald-200/50' : 
                  'bg-gradient-to-br from-[#fdf4ff] to-[#fae8ff] border-fuchsia-100 hover:shadow-fuchsia-200/50'}`}
              onClick={() => navigate(`/student/game/${game.id}`, { state: { isFreePlay: true } })}
            >
              <div className="absolute -top-4 -right-4 p-4 opacity-10 transition-transform duration-500 group-hover:scale-150 group-hover:rotate-12">
                <Sparkles className="w-32 h-32" />
              </div>
              
              <div className="relative z-10 text-right">
                <div className="flex justify-between items-start mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-white/80 shadow-sm border border-white/50 flex items-center justify-center backdrop-blur-sm">
                    <Gamepad2 className={`w-7 h-7 ${index % 3 === 0 ? 'text-blue-500' : index % 3 === 1 ? 'text-emerald-500' : 'text-fuchsia-500'}`} />
                  </div>
                </div>
                
                <h3 className="font-black text-slate-800 text-xl mb-2">{game.titleAr || game.title || game.name}</h3>
                <p className="text-sm font-bold text-slate-500 mb-6 line-clamp-2 leading-relaxed">
                  {game.descriptionAr || game.description || 'لعبة تفاعلية لتنمية المهارات بصورة ممتعة ومحفزة.'}
                </p>

                <div className="flex items-center justify-end mt-auto">
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white shadow-md transition-transform active:scale-95 group-hover:-translate-x-1
                    ${index % 3 === 0 ? 'bg-blue-600 shadow-blue-200' : index % 3 === 1 ? 'bg-emerald-600 shadow-emerald-200' : 'bg-fuchsia-600 shadow-fuchsia-200'}`}>
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
