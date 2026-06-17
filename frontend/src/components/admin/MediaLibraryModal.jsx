import React, { useEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { X, Search, Image as ImageIcon, Music, Video, LoaderCircle, UploadCloud } from 'lucide-react';
import { useTherapyStore } from '../../hooks/useTherapyStore';
import gameService from '../../services/gameService';

const MediaLibraryModal = ({ isOpen, onClose, onSelect, initialType = '' }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState(initialType);
  const [isUploading, setIsUploading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const fileInputRef = useRef(null);
  const { adminSession } = useTherapyStore();

  useEffect(() => {
    if (!isOpen) return;

    const fetchFiles = async () => {
      try {
        setLoading(true);
        const res = await gameService.getUploadedFiles(adminSession?.token, selectedType, searchQuery);
        setFiles(res?.data || []);
      } catch (error) {
        console.error('Failed to fetch media:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchFiles, 300);
    return () => clearTimeout(debounce);
  }, [isOpen, adminSession?.token, selectedType, searchQuery, refreshTrigger]);

  if (!isOpen) return null;

  const handleSelect = (url) => {
    onSelect(url);
    onClose();
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    try {
      setIsUploading(true);
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        await gameService.uploadAsset(adminSession?.token, formData);
      }
      setRefreshTrigger(prev => prev + 1); // Refresh the list
    } catch (error) {
      console.error('Failed to upload files:', error);
      alert('حدث خطأ أثناء رفع بعض الملفات، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsUploading(false);
      // Reset input so the same file can be uploaded again if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return ReactDOM.createPortal(
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }} onClick={onClose} />
      <div 
        style={{ position: 'relative', width: '100%', height: '100%', maxWidth: '65vw', maxHeight: '75vh', backgroundColor: 'rgba(255,255,255,0.97)', borderRadius: '2rem', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.5)' }}
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 md:p-6 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-xl md:text-2xl font-black text-slate-800">مكتبة الوسائط</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors text-slate-500 hover:text-slate-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* Filters and Search */}
        <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center bg-white">
          <div className="relative w-full md:w-96">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="ابحث عن ملف..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-12 py-3 rounded-2xl bg-slate-100 border-none outline-none focus:ring-4 focus:ring-blue-100 transition-all text-slate-700"
            />
          </div>

          <div className="flex bg-slate-100 p-1 rounded-2xl w-full md:w-auto">
            <button
              onClick={() => setSelectedType('')}
              className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl font-bold transition-all ${selectedType === '' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              الكل
            </button>
            <button
              onClick={() => setSelectedType('image')}
              className={`flex items-center justify-center gap-2 flex-1 md:flex-none px-6 py-2.5 rounded-xl font-bold transition-all ${selectedType === 'image' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <ImageIcon size={18} />
              صور
            </button>
            <button
              onClick={() => setSelectedType('audio')}
              className={`flex items-center justify-center gap-2 flex-1 md:flex-none px-6 py-2.5 rounded-xl font-bold transition-all ${selectedType === 'audio' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Music size={18} />
              صوتيات
            </button>
          </div>

          <div className="w-full md:w-auto mt-4 md:mt-0 flex gap-2">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              className="hidden" 
              accept="image/*,audio/*,video/*"
              multiple
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full md:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm whitespace-nowrap rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {isUploading ? (
                <LoaderCircle size={20} className="animate-spin" />
              ) : (
                <UploadCloud size={20} />
              )}
              {isUploading ? 'جاري الرفع...' : 'رفع ملف جديد'}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/50">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center text-blue-500 gap-3">
              <LoaderCircle size={40} className="animate-spin" />
              <p className="font-bold text-slate-500">جاري تحميل الوسائط...</p>
            </div>
          ) : files.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3">
              <ImageIcon size={60} className="opacity-20" />
              <p className="font-bold text-lg">لا توجد ملفات متطابقة</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {files.map((file) => (
                <button
                  key={file.id}
                  onClick={() => handleSelect(file.url)}
                  className="group relative bg-white rounded-2xl border border-slate-200 overflow-hidden aspect-square flex flex-col hover:border-blue-400 hover:shadow-lg transition-all hover:-translate-y-1 text-right focus:outline-none focus:ring-4 focus:ring-blue-100"
                >
                  <div className="flex-1 bg-slate-50 flex items-center justify-center overflow-hidden p-2 relative w-full h-full">
                    {file.type === 'image' ? (
                      <img src={file.url} alt={file.filename} className="w-full h-full object-contain mix-blend-multiply transition-transform group-hover:scale-110" loading="lazy" />
                    ) : file.type === 'audio' ? (
                      <Music size={40} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                    ) : file.type === 'video' ? (
                      <Video size={40} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                    ) : (
                      <ImageIcon size={40} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                    )}
                  </div>
                  <div className="p-3 border-t border-slate-100 bg-white">
                    <p className="text-xs font-bold text-slate-600 truncate w-full" dir="ltr" title={file.filename}>
                      {file.filename}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        </div>
    </div>,
    document.body
  );
};

export default MediaLibraryModal;
