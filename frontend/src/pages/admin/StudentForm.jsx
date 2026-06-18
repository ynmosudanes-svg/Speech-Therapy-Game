import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Save, UserRoundPlus, Layers, User, Search, CheckCircle2, ChevronUp, ChevronDown, GripVertical, Check } from 'lucide-react';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { useTherapyStore } from '../../hooks/useTherapyStore';
import gameService from '../../services/gameService';
import gameLibraryService from '../../services/gameLibraryService';
import therapistService from '../../services/therapistService';
import parentService from '../../services/parentService';

const defaultForm = {
  name: '',
  age: 4,
  diagnosis: '',
  planName: '',
  currentLevel: 1,
  therapistId: '',
  parentId: '',
  assignedGameIds: [],
};

const getTagLabel = (tag) => `التصنيف ${tag}`;

const StudentForm = ({ mode = 'create' }) => {
  const navigate = useNavigate();
  const { studentId } = useParams();
  const { addStudent, adminSession, fetchStudents, students, updateStudent } = useTherapyStore();

  const [formData, setFormData] = useState(defaultForm);
  const [availableGames, setAvailableGames] = useState([]);
  const [libraries, setLibraries] = useState([]);
  const [therapists, setTherapists] = useState([]);
  const [parents, setParents] = useState([]);
  const [loadingGames, setLoadingGames] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [gamesFilter, setGamesFilter] = useState('');
  const [selectedLibraryId, setSelectedLibraryId] = useState('all');
  const [selectedTag, setSelectedTag] = useState('');
  const [tagMenuOpen, setTagMenuOpen] = useState(false);

  const allAvailableTags = useMemo(() => {
    const tags = new Set(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']);
    availableGames.forEach(g => {
      if (Array.isArray(g.config?.tags)) {
        g.config.tags.forEach(t => tags.add(t));
      }
    });
    return Array.from(tags).sort();
  }, [availableGames]);

  const isEdit = mode === 'edit';
  const student = useMemo(
    () => (Array.isArray(students) ? students.find((item) => String(item.id) === String(studentId)) : null),
    [studentId, students]
  );
  const selectedLibrary = useMemo(
    () => libraries.find((library) => String(library.id) === String(selectedLibraryId)) || null,
    [libraries, selectedLibraryId]
  );

  const filteredGames = useMemo(() => {
    let result = availableGames;

    if (selectedLibrary && Array.isArray(selectedLibrary.gameIds)) {
      const allowedIds = new Set(selectedLibrary.gameIds.map((id) => String(id)));
      result = result.filter((game) => allowedIds.has(String(game.id)));
    }

    if (selectedTag) {
      result = result.filter(game => (game.config?.tags || []).includes(selectedTag));
    }

    const query = gamesFilter.trim().toLowerCase();
    if (query) {
      result = result.filter((game) => {
        const searchableText = `${game.titleAr || ''} ${game.title || ''} ${game.name || ''} ${game.level || ''} ${game.gameCode || ''}`.toLowerCase();
        return searchableText.includes(query);
      });
    }

    return result;
  }, [availableGames, gamesFilter, selectedLibrary, selectedTag]);

  useEffect(() => {
    const fetchFormDependencies = async () => {
      let nextError = '';

      setLoadingGames(true);
      setError('');

      try {
        const gamesResponse = await gameService.getGames(adminSession?.token);
        setAvailableGames(
          Array.isArray(gamesResponse)
            ? gamesResponse
            : Array.isArray(gamesResponse?.data)
              ? gamesResponse.data
              : []
        );
      } catch (_gamesError) {
        setAvailableGames([]);
        nextError = 'تعذر تحميل الألعاب.';
      }

      try {
        const librariesResponse = await gameLibraryService.getLibraries(adminSession?.token);
        setLibraries(
          Array.isArray(librariesResponse)
            ? librariesResponse
            : Array.isArray(librariesResponse?.data)
              ? librariesResponse.data
              : []
        );
      } catch (_librariesError) {
        setLibraries([]);
      }

      try {
        const parentsResponse = await parentService.getParents(adminSession?.token);
        setParents(Array.isArray(parentsResponse?.data) ? parentsResponse.data : []);
      } catch (_parentsError) {
        setParents([]);
      }

      if (adminSession?.user?.role === 'SUPER_ADMIN' && adminSession?.token) {
        const adminOption = adminSession?.user
          ? [
              {
                id: adminSession.user.id,
                name: adminSession.user.name || adminSession.name,
                email: adminSession.user.email || adminSession.email,
              },
            ]
          : [];

        try {
          const therapistsResponse = await therapistService.getTherapists(adminSession.token);
          const therapistsData = Array.isArray(therapistsResponse?.data) ? therapistsResponse.data : [];
          const mergedTherapists = [...adminOption, ...therapistsData].filter(
            (therapist, index, array) => array.findIndex((item) => item.id === therapist.id) === index
          );

          setTherapists(mergedTherapists);
          if (!isEdit) {
            setFormData((current) => ({
              ...current,
              therapistId: current.therapistId || adminSession.user.id || mergedTherapists[0]?.id || '',
            }));
          }
        } catch (_therapistsError) {
          setTherapists(adminOption);
          if (!isEdit) {
            setFormData((current) => ({
              ...current,
              therapistId: current.therapistId || adminSession.user.id || adminOption[0]?.id || '',
            }));
          }
          if (!nextError) {
            nextError = 'تعذر تحميل قائمة الدكاترة.';
          }
        }
      } else {
        setTherapists([]);
      }

      setError(nextError);
      setLoadingGames(false);
    };

    fetchFormDependencies();
  }, [adminSession?.email, adminSession?.name, adminSession?.token, adminSession?.user, isEdit]);

  useEffect(() => {
    if (isEdit && student) {
      setFormData({
        name: student.name || '',
        age: student.age || 4,
        diagnosis: student.diagnosis || '',
        planName: student.planName || '',
        currentLevel: student.currentLevel || 1,
        therapistId: student.therapistId || '',
        parentId: student.parentId || '',
        assignedGameIds: Array.isArray(student.assignedGames)
          ? student.assignedGames.map((game) => String(game.id))
          : [],
      });
    }
  }, [isEdit, student]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const toggleAssignedGame = (gameId) => {
    setFormData((current) => ({
      ...current,
      assignedGameIds: current.assignedGameIds.includes(gameId)
        ? current.assignedGameIds.filter((id) => id !== gameId)
        : [...current.assignedGameIds, gameId],
    }));
  };

  const moveGameUp = (gameId) => {
    setFormData((current) => {
      const ids = [...current.assignedGameIds];
      const index = ids.indexOf(gameId);
      if (index > 0) {
        [ids[index - 1], ids[index]] = [ids[index], ids[index - 1]];
      }
      return { ...current, assignedGameIds: ids };
    });
  };

  const moveGameDown = (gameId) => {
    setFormData((current) => {
      const ids = [...current.assignedGameIds];
      const index = ids.indexOf(gameId);
      if (index < ids.length - 1 && index !== -1) {
        [ids[index + 1], ids[index]] = [ids[index], ids[index + 1]];
      }
      return { ...current, assignedGameIds: ids };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    if (!adminSession?.token) {
      setError('جلسة الإدارة غير متاحة. سجلي الدخول مرة أخرى.');
      setSubmitting(false);
      return;
    }

    const payload = {
      name: formData.name.trim(),
      age: Number(formData.age),
      diagnosis: formData.diagnosis.trim() || undefined,
      planName: formData.planName.trim() || undefined,
      currentLevel: Number(formData.currentLevel),
      therapistId: formData.therapistId || undefined,
      parentId: formData.parentId || undefined,
      assignedGames: formData.assignedGameIds.map((id, index) => ({
        gameId: id,
        order: index,
      })),
    };

    try {
      if (isEdit && student) {
        await updateStudent(student.id, payload);
      } else {
        await addStudent(payload);
      }

      await fetchStudents(adminSession.token);
      navigate('/admin/patients');
    } catch (submitError) {
      setError(submitError?.response?.data?.message || submitError?.message || 'تعذر حفظ بيانات المستفيد.');
      setSubmitting(false);
    }
  };

  if (isEdit && !student) {
    return (
      <div className="bg-white rounded-[2rem] border border-slate-200 p-10 text-center">
        <h2 className="text-3xl font-black text-slate-900 mb-3">المستفيد غير موجود</h2>
        <Button variant="primary" onClick={() => navigate('/admin/patients')}>
          العودة إلى المستفيدين
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      {/* الترويسة */}
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'تعديل بيانات المستفيد' : 'إضافة مستفيد جديد'}
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            كود الدخول يُنشأ تلقائيًا من النظام عند إنشاء المستفيد.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/admin/patients')} className="!py-2 !px-4 bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700">
            <ArrowRight size={18} />
            <span>إلغاء</span>
          </Button>
          <div className="hidden sm:flex h-12 w-12 bg-[#178bb6]/10 rounded-full items-center justify-center text-[#178bb6]">
            <Layers size={24} />
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl bg-red-50 border border-red-100 px-5 py-4 text-red-600 font-bold">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* العمود الأيمن: الإعدادات واختيار الألعاب */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* بطاقة البيانات الأساسية */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <User size={20} className="text-[#178bb6]" />
              البيانات الأساسية
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">اسم المستفيد <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#178bb6]/20 focus:border-[#178bb6] transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">العمر <span className="text-red-500">*</span></label>
                  <input 
                    type="number" 
                    min="1"
                    max="25"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    required
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#178bb6]/20 focus:border-[#178bb6] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">المستوى الحالي</label>
                  <input 
                    type="number" 
                    min="1"
                    name="currentLevel"
                    value={formData.currentLevel}
                    onChange={handleChange}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#178bb6]/20 focus:border-[#178bb6] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">التشخيص</label>
                <input 
                  type="text" 
                  name="diagnosis"
                  value={formData.diagnosis}
                  onChange={handleChange}
                  placeholder="اختياري"
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#178bb6]/20 focus:border-[#178bb6] transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">اسم الخطة العلاجية</label>
                <input 
                  type="text" 
                  name="planName"
                  value={formData.planName}
                  onChange={handleChange}
                  placeholder="مثال: الخطة الأولى للتدريب الصوتي"
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#178bb6]/20 focus:border-[#178bb6] transition-all"
                />
              </div>

              {adminSession?.user?.role === 'SUPER_ADMIN' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">الدكتور المسؤول <span className="text-red-500">*</span></label>
                  <select 
                    name="therapistId"
                    value={formData.therapistId}
                    onChange={handleChange}
                    required
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#178bb6]/20 focus:border-[#178bb6] transition-all"
                  >
                    <option value="">اختار الدكتور</option>
                    {therapists.map((therapist) => (
                      <option key={therapist.id} value={therapist.id}>
                        {therapist.name} - {therapist.email}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">ولي الأمر (اختياري)</label>
                <select 
                  name="parentId"
                  value={formData.parentId}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#178bb6]/20 focus:border-[#178bb6] transition-all"
                >
                  <option value="">اختار ولي الأمر</option>
                  {parents.map((parent) => (
                    <option key={parent.id} value={parent.id}>
                      {parent.name} - {parent.email}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* بطاقة اختيار الألعاب */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[500px]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">الألعاب المخصصة</h2>
              <span className="bg-[#178bb6]/10 text-[#126d8f] text-xs px-2.5 py-1 rounded-full font-medium">
                {formData.assignedGameIds.length} مختارة
              </span>
            </div>

            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Search size={18} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="ابحث بكود اللعبة أو الاسم..."
                  value={gamesFilter}
                  onChange={(e) => setGamesFilter(e.target.value)}
                  disabled={loadingGames}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl pr-10 pl-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#178bb6]/20 focus:border-[#178bb6] transition-all"
                />
              </div>
              <select
                value={selectedLibraryId}
                onChange={(e) => setSelectedLibraryId(e.target.value)}
                disabled={loadingGames || !libraries.length}
                className="w-36 sm:w-44 bg-white border border-gray-200 text-gray-900 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#178bb6]/20 focus:border-[#178bb6] transition-all"
              >
                <option value="all">كل المكتبات</option>
                {libraries.map((library) => (
                  <option key={library.id} value={library.id}>
                    {library.name}
                  </option>
                ))}
              </select>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setTagMenuOpen(!tagMenuOpen)}
                  className="bg-white border border-gray-200 text-gray-900 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#178bb6]/20 focus:border-[#178bb6] transition-all w-36 sm:w-44 flex items-center justify-between gap-2"
                >
                  {selectedTag ? (
                     <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md text-xs font-bold border border-blue-100 whitespace-nowrap">
                      {getTagLabel(selectedTag)}
                    </span>
                  ) : (
                    <span className="text-gray-500 font-medium">التصنيف</span>
                  )}
                  <ChevronDown size={16} className="text-gray-400" />
                </button>
                {tagMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setTagMenuOpen(false)} 
                    />
                    <div className="absolute z-50 top-full mt-2 left-0 w-44 bg-white rounded-xl shadow-xl border border-slate-200 p-2">
                      <div className="max-h-64 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                        <button
                          type="button"
                          onClick={() => { setSelectedTag(''); setTagMenuOpen(false); }}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-bold hover:bg-slate-50 text-right text-slate-500"
                        >
                          <span>كل التصنيفات</span>
                          {!selectedTag && <Check size={16} className="text-[#178bb6]" />}
                        </button>
                        {allAvailableTags.map(tag => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => { setSelectedTag(tag); setTagMenuOpen(false); }}
                            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-bold hover:bg-slate-50 text-right"
                          >
                            <span className="text-slate-700">{getTagLabel(tag)}</span>
                            {selectedTag === tag && <Check size={16} className="text-[#178bb6]" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {loadingGames && (
                <div className="text-center text-sm text-gray-500 py-4">جارٍ تحميل الألعاب...</div>
              )}
              {!loadingGames && !availableGames.length && (
                <div className="text-center text-sm text-gray-500 py-4">لا توجد ألعاب متاحة حاليًا.</div>
              )}
              {!loadingGames && !!availableGames.length && !filteredGames.length && (
                <div className="text-center text-sm text-gray-500 py-4">لا توجد نتائج مطابقة للبحث.</div>
              )}

              {filteredGames.map((game) => {
                const gameId = String(game.id);
                const isSelected = formData.assignedGameIds.includes(gameId);
                const gameTitle = game.titleAr || game.title || game.name;

                return (
                  <div 
                    key={game.id}
                    onClick={() => toggleAssignedGame(gameId)}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all select-none ${
                      isSelected 
                        ? 'bg-[#178bb6]/5 border-[#178bb6]/30' 
                        : 'bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div>
                      <p className={`font-medium text-sm ${isSelected ? 'text-[#126d8f]' : 'text-gray-700'}`}>
                        {gameTitle}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                        {!!game.gameCode && (
                          <span className="bg-cyan-50 text-[#178bb6] px-1.5 py-0.5 rounded text-[10px] font-bold border border-cyan-100">
                            {game.gameCode}
                          </span>
                        )}
                        <span>المستوى {game.level}</span>
                        {(game.config?.tags || []).length > 0 && (
                          <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-bold border border-blue-100">
                            {getTagLabel(game.config.tags[0])}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                      isSelected ? 'bg-[#178bb6] border-[#178bb6] text-white' : 'border-gray-300'
                    }`}>
                      {isSelected && <CheckCircle2 size={14} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* العمود الأيسر: ترتيب الألعاب */}
        <div className="lg:col-span-7">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full">
            <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
              <h2 className="text-lg font-semibold text-gray-800">ترتيب الألعاب في الخطة</h2>
              <p className="text-sm text-gray-500">يمكنك تغيير الترتيب باستخدام الأسهم</p>
            </div>

            {formData.assignedGameIds.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <Layers size={48} className="mb-4 opacity-20" />
                <p>لم يتم تحديد أي ألعاب بعد</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[800px] overflow-y-auto custom-scrollbar pr-2">
                {formData.assignedGameIds.map((gameId, index) => {
                  const game = availableGames.find(g => String(g.id) === gameId);
                  if (!game) return null;
                  const gameTitle = game.titleAr || game.title || game.name;

                  return (
                    <div 
                      key={gameId} 
                      className="group flex items-center bg-white border border-gray-100 p-3 rounded-xl hover:border-[#178bb6]/30 hover:shadow-sm transition-all"
                    >
                      {/* أزرار الترتيب */}
                      <div className="flex flex-col items-center ml-4 gap-1">
                        <button 
                          type="button"
                          onClick={() => moveGameUp(gameId)}
                          disabled={index === 0}
                          className={`p-1 rounded-md transition-colors ${
                            index === 0 ? 'text-gray-200 cursor-not-allowed' : 'text-gray-400 hover:text-[#178bb6] hover:bg-[#178bb6]/10'
                          }`}
                        >
                          <ChevronUp size={20} />
                        </button>
                        <button 
                          type="button"
                          onClick={() => moveGameDown(gameId)}
                          disabled={index === formData.assignedGameIds.length - 1}
                          className={`p-1 rounded-md transition-colors ${
                            index === formData.assignedGameIds.length - 1 ? 'text-gray-200 cursor-not-allowed' : 'text-gray-400 hover:text-[#178bb6] hover:bg-[#178bb6]/10'
                          }`}
                        >
                          <ChevronDown size={20} />
                        </button>
                      </div>

                      {/* رقم الترتيب */}
                      <div className="w-8 h-8 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-sm font-bold text-gray-600 ml-4 group-hover:bg-[#178bb6]/10 group-hover:text-[#178bb6] group-hover:border-[#178bb6]/20 transition-colors">
                        {index + 1}
                      </div>

                      {/* اسم اللعبة */}
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-800 text-base">{gameTitle}</h3>
                        <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                          {!!game.gameCode && (
                            <span className="bg-cyan-50 text-[#178bb6] px-1.5 py-0.5 rounded text-[10px] font-bold border border-cyan-100">
                              {game.gameCode}
                            </span>
                          )}
                          <span>المستوى {game.level}</span>
                        </p>
                      </div>

                      {/* أيقونة السحب */}
                      <div className="text-gray-300 mr-2">
                        <GripVertical size={20} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* شريط الإجراءات السفلي */}
        <div className="lg:col-span-12 flex justify-end pt-4">
          <button 
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 bg-[#178bb6] hover:bg-[#126d8f] text-white px-8 py-3 rounded-xl font-medium shadow-sm shadow-cyan-500/30 transition-all focus:ring-4 focus:ring-cyan-500/20 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isEdit ? <Save size={20} /> : <UserRoundPlus size={20} />}
            {isEdit ? 'حفظ التعديلات' : 'إضافة المستفيد'}
          </button>
        </div>

      </form>

      <style dangerouslySetInnerHTML={{__html: `
        /* تخصيص شريط التمرير ليكون أنيقاً */
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f9fafb;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e5e7eb;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #d1d5db;
        }
      `}} />
    </div>
  );
};

export default StudentForm;
