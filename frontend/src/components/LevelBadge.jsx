import React from 'react';
import { Star } from 'lucide-react';

const LevelBadge = ({ level }) => {
  const getLevelInfo = () => {
    switch(level) {
      case 1: return { text: 'سهل', color: 'bg-green-400 text-white', stars: 1 };
      case 2: return { text: 'متوسط', color: 'bg-yellow-400 text-dark', stars: 2 };
      case 3: return { text: 'صعب', color: 'bg-red-400 text-white', stars: 3 };
      default: return { text: 'سهل', color: 'bg-green-400 text-white', stars: 1 };
    }
  };

  const info = getLevelInfo();

  return (
    <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold shadow-sm ${info.color}`}>
      <span>{info.text}</span>
      <div className="flex">
        {[...Array(3)].map((_, i) => (
          <Star 
            key={i} 
            size={14} 
            className={i < info.stars ? 'fill-current' : 'opacity-30'} 
          />
        ))}
      </div>
    </div>
  );
};

export default LevelBadge;
