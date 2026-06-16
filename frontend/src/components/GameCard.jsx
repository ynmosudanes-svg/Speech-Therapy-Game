import React from 'react';
import { Play } from 'lucide-react';
import Card from './Card';
import Button from './Button';
import { useNavigate } from 'react-router-dom';

const GameCard = ({ game, basePath = '/student/game' }) => {
  const navigate = useNavigate();

  return (
    <Card className="flex flex-col h-full transform transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">
      <div className="p-6 flex-grow flex flex-col items-center text-center">
        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-4 shadow-inner">
          <Play size={48} className="text-blue-500 ml-2" />
        </div>
        <h3 className="text-2xl font-bold text-dark mb-2">{game.config?.nameAr || game.titleAr || game.title || game.name}</h3>
        <p className="text-gray-500 mb-4">{game.title}</p>
        <div className="mt-auto w-full flex justify-end items-center">
          <Button 
            variant="primary" 
            onClick={() => navigate(`${basePath}/${game.id}`)}
            className="!py-2 !px-4 !text-sm"
          >
            العب الآن
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default GameCard;
