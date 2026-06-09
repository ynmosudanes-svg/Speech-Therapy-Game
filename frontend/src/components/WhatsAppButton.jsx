import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export default function WhatsAppButton() {
  const location = useLocation();
  const isGamePlayRoute = location.pathname.startsWith('/student/game/');

  if (isGamePlayRoute) {
    return null;
  }

  return (
    <a
      href="https://wa.me/YOUR_PHONE_NUMBER"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 left-6 z-50 flex items-center justify-center w-14 h-14 bg-green-500 text-white rounded-full shadow-lg shadow-green-500/30 hover:bg-green-600 hover:scale-110 hover:shadow-green-600/50 transition-all duration-300 animate-[bounce_2s_infinite]"
      aria-label="تواصل معنا عبر واتساب"
    >
      <MessageCircle size={32} strokeWidth={2.5} />
    </a>
  );
}
