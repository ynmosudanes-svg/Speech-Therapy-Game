import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export default function CustomSelect({ value, onChange, options, placeholder = 'اختر...' }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border bg-white transition-all outline-none ${
          isOpen ? 'border-[#168FC7] ring-4 ring-sky-100' : 'border-gray-300 hover:border-[#168FC7]'
        }`}
      >
        <span className={selectedOption ? 'text-slate-800 font-bold' : 'text-slate-400'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={18} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-[#168FC7]' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 top-full mt-2 left-0 right-0 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 overflow-hidden">
          <div className="max-h-60 overflow-y-auto space-y-1 custom-scrollbar pr-1">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-colors text-right ${
                  value === option.value
                    ? 'bg-[#168FC7] text-white'
                    : 'text-slate-700 hover:bg-sky-50 hover:text-[#168FC7]'
                }`}
              >
                <span>{option.label}</span>
                {value === option.value && <Check size={18} className="text-white" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
