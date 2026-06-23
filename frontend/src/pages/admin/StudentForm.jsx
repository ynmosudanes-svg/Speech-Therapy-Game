import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Save, UserRoundPlus, Layers, User, Search, CheckCircle2, ChevronUp, ChevronDown, GripVertical, Check } from 'lucide-react';
import Button from '../../components/Button';
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
  const [successNotice, setSuccessNotice] = useState('');
  const [gamesFilter, setGamesFilter] = useState('');
  const [selectedLibraryId, setSelectedLibraryId] = useState('all');
  const [assignedLibraryIds, setAssignedLibraryIds] = useState([]);
  const [selectedTag, setSelectedTag] = useState('');
  const [libraryMenuOpen, setLibraryMenuOpen] = useState(false);
  const [tagMenuOpen, setTagMenuOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({});

  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: prev[groupId] === false ? true : false
    }));
  };

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
  const assignedLibraryLabel = assignedLibraryIds.length > 1
    ? `${assignedLibraryIds.length} مكتبات`
    : selectedLibrary
      ? selectedLibrary.name
      : 'كل المكتبات';

  const getLibraryGameIds = (library) =>
    Array.isArray(library?.gameIds) ? library.gameIds.map((id) => String(id)) : [];

  const uniqueAssignedGameIds = useMemo(
    () => Array.from(new Set(formData.assignedGameIds.map((id) => String(id)))),
    [formData.assignedGameIds]
  );



  const getAssignedLibraryOrder = (library) => {
    const index = assignedLibraryIds.indexOf(String(library?.id));
    return index === -1 ? null : index + 1;
  };

  const toggleAssignedLibrary = (library) => {
    const libraryId = String(library?.id);
    const libraryGameIds = getLibraryGameIds(library);

    if (!libraryId || !libraryGameIds.length) {
      return;
    }

    const libraryIsSelected = assignedLibraryIds.includes(libraryId);
    const nextAssignedLibraryIds = libraryIsSelected
      ? assignedLibraryIds.filter((currentLibraryId) => currentLibraryId !== libraryId)
      : [...assignedLibraryIds, libraryId];
    const remainingLibraryGameIds = new Set(
      libraries
        .filter((currentLibrary) => nextAssignedLibraryIds.includes(String(currentLibrary.id)))
        .flatMap((currentLibrary) => getLibraryGameIds(currentLibrary))
    );

    setAssignedLibraryIds(nextAssignedLibraryIds);
    setFormData((current) => {
      const assignedSet = new Set(current.assignedGameIds.map((id) => String(id)));
      const nextAssignedGameIds = libraryIsSelected
        ? current.assignedGameIds.filter(
            (gameId) => !libraryGameIds.includes(String(gameId)) || remainingLibraryGameIds.has(String(gameId))
          )
        : [
            ...current.assignedGameIds,
            ...libraryGameIds.filter((gameId) => !assignedSet.has(gameId)),
          ];

      return {
        ...current,
        assignedGameIds: nextAssignedGameIds,
      };
    });
  };

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
      } catch {
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
      } catch {
        setLibraries([]);
      }

      try {
        const parentsResponse = await parentService.getParents(adminSession?.token);
        setParents(Array.isArray(parentsResponse?.data) ? parentsResponse.data : []);
      } catch {
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
        } catch {
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
      // eslint-disable-next-line react-hooks/set-state-in-effect
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

  // Group games by library to allow ordering libraries and games within them
  const groupedAssignedGames = useMemo(() => {
    const groups = [];
    const processedLibs = new Set();
    const unassigned = { id: 'unassigned', name: 'ألعاب إضافية', gameIds: [] };

    formData.assignedGameIds.forEach(gameId => {
      let matchedLib = null;
      for (const lib of libraries) {
         if (lib.gameIds && lib.gameIds.some(id => String(id) === String(gameId))) {
            matchedLib = lib; break;
         }
      }
      
      if (matchedLib) {
         if (!processedLibs.has(String(matchedLib.id))) {
            processedLibs.add(String(matchedLib.id));
            groups.push({ id: String(matchedLib.id), name: matchedLib.name, gameIds: [] });
         }
         groups.find(g => g.id === String(matchedLib.id)).gameIds.push(gameId);
      } else {
         unassigned.gameIds.push(gameId);
      }
    });

    if (unassigned.gameIds.length > 0) {
      groups.push(unassigned);
    }
    return groups;
  }, [formData.assignedGameIds, libraries]);

  const visibleGroups = useMemo(() => {
    if (assignedLibraryIds.length > 0) {
      const assignedOrder = new Map(assignedLibraryIds.map((libraryId, index) => [String(libraryId), index]));
      return groupedAssignedGames
        .filter((group) => assignedOrder.has(String(group.id)))
        .sort((firstGroup, secondGroup) => assignedOrder.get(String(firstGroup.id)) - assignedOrder.get(String(secondGroup.id)));
    }

    if (!selectedLibrary || selectedLibraryId === 'all') return groupedAssignedGames;
    return groupedAssignedGames.filter(g => String(g.id) === String(selectedLibraryId));
  }, [assignedLibraryIds, groupedAssignedGames, selectedLibraryId, selectedLibrary]);

  const isLibraryOrderingFiltered = selectedLibraryId !== 'all' && assignedLibraryIds.length <= 1;

  const moveLibrary = (groupIndex, direction) => {
    const targetVisibleIndex = groupIndex + direction;
    if (targetVisibleIndex < 0 || targetVisibleIndex >= visibleGroups.length) return;

    if (assignedLibraryIds.length > 1) {
      const nextVisibleGroups = [...visibleGroups];
      [nextVisibleGroups[groupIndex], nextVisibleGroups[targetVisibleIndex]] = [nextVisibleGroups[targetVisibleIndex], nextVisibleGroups[groupIndex]];

      const nextAssignedLibraryIds = nextVisibleGroups
        .map((group) => String(group.id))
        .filter((groupId) => assignedLibraryIds.includes(groupId));
      const visibleGroupIds = new Set(nextVisibleGroups.map((group) => String(group.id)));
      const hiddenGroups = groupedAssignedGames.filter((group) => !visibleGroupIds.has(String(group.id)));
      const nextFlatIds = [...nextVisibleGroups, ...hiddenGroups].flatMap((group) => group.gameIds);

      setAssignedLibraryIds(nextAssignedLibraryIds);
      setFormData((current) => ({ ...current, assignedGameIds: nextFlatIds }));
      return;
    }

    const visibleGroup = visibleGroups[groupIndex];
    const actualIndex = groupedAssignedGames.findIndex(g => g.id === visibleGroup.id);
    if (actualIndex === -1) return;
    
    if (direction === -1 && actualIndex === 0) return;
    if (direction === 1 && actualIndex === groupedAssignedGames.length - 1) return;

    const newGroups = [...groupedAssignedGames];
    const targetIndex = actualIndex + direction;
    [newGroups[actualIndex], newGroups[targetIndex]] = [newGroups[targetIndex], newGroups[actualIndex]];
    
    const newFlatIds = newGroups.flatMap(g => g.gameIds);
    setFormData(prev => ({ ...prev, assignedGameIds: newFlatIds }));
  };

  const moveGameWithinLibrary = (groupId, gameIndex, direction) => {
    const actualGroupIndex = groupedAssignedGames.findIndex(g => g.id === groupId);
    if (actualGroupIndex === -1) return;

    const group = groupedAssignedGames[actualGroupIndex];
    if (direction === -1 && gameIndex === 0) return;
    if (direction === 1 && gameIndex === group.gameIds.length - 1) return;

    const newGameIds = [...group.gameIds];
    const targetIndex = gameIndex + direction;
    [newGameIds[gameIndex], newGameIds[targetIndex]] = [newGameIds[targetIndex], newGameIds[gameIndex]];
    
    const newGroups = [...groupedAssignedGames];
    newGroups[actualGroupIndex] = { ...group, gameIds: newGameIds };
    
    const newFlatIds = newGroups.flatMap(g => g.gameIds);
    setFormData(prev => ({ ...prev, assignedGameIds: newFlatIds }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccessNotice('');

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
      assignedGames: uniqueAssignedGameIds.map((id, index) => ({
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
      setSuccessNotice('تم الحفظ بنجاح');
      setSubmitting(false);
      await new Promise((resolve) => setTimeout(resolve, 900));
      navigate('/admin/patients');
    } catch (submitError) {
      setSuccessNotice('');
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

      {successNotice && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4 font-bold text-emerald-700">
          <CheckCircle2 size={20} />
          {successNotice}
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
              <div className="relative">
                <button
                  type="button"
                  disabled={loadingGames || !libraries.length}
                  onClick={() => {
                    setLibraryMenuOpen((open) => !open);
                    setTagMenuOpen(false);
                  }}
                  className="bg-white border border-gray-200 text-gray-900 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#178bb6]/20 focus:border-[#178bb6] transition-all w-36 sm:w-44 flex items-center justify-between gap-2 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="truncate font-medium">
                    {assignedLibraryLabel}
                  </span>
                  <ChevronDown size={16} className={`shrink-0 text-gray-400 transition-transform ${libraryMenuOpen ? 'rotate-180 text-[#178bb6]' : ''}`} />
                </button>

                {libraryMenuOpen && (
                  <div className="absolute z-50 top-full mt-2 left-0 w-44 bg-white rounded-xl shadow-xl border border-slate-200 p-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedLibraryId('all');
                        setLibraryMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-bold hover:bg-slate-50 text-right text-slate-500"
                    >
                      <span>كل المكتبات</span>
                      {selectedLibraryId === 'all' && <Check size={16} className="text-[#178bb6]" />}
                    </button>
                    <div className="max-h-64 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                      {libraries.map((library) => {
                        const isActive = String(selectedLibraryId) === String(library.id);
                        const assignedLibraryOrder = getAssignedLibraryOrder(library);

                        return (
                          <button
                            key={library.id}
                            type="button"
                            onClick={() => {
                              setSelectedLibraryId(String(library.id));
                              toggleAssignedLibrary(library);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-bold hover:bg-slate-50 text-right ${isActive ? 'bg-cyan-50/70 text-[#126d8f]' : ''}`}
                          >
                            <span className="truncate">{library.name}</span>
                            {assignedLibraryOrder && (
                              <span className="grid h-5 w-5 place-items-center rounded-full bg-[#178bb6] text-[11px] font-black text-white">
                                {assignedLibraryOrder}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setTagMenuOpen((open) => !open);
                    setLibraryMenuOpen(false);
                  }}
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
            ) : visibleGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <Layers size={48} className="mb-4 opacity-20" />
                <p>لا توجد ألعاب مخصصة في هذه المكتبة</p>
              </div>
            ) : (
              <div className="space-y-6 max-h-[800px] overflow-y-auto custom-scrollbar pr-2">
                {visibleGroups.map((group, groupIndex) => {
                  const isExpanded = expandedGroups[group.id] !== false; // Default to true

                  return (
                  <div key={group.id} className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-sm transition-all duration-300">
                    {/* رأس المكتبة (Group Header) */}
                    <div 
                      className="flex items-center justify-between bg-slate-100 px-4 py-3 border-b border-slate-200 cursor-pointer hover:bg-slate-200 transition-colors"
                      onClick={() => toggleGroup(group.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`text-slate-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                          <ChevronDown size={20} />
                        </div>
                        <div className="bg-[#178bb6] text-white p-1.5 rounded-lg shadow-sm">
                          <Layers size={18} />
                        </div>
                        <h3 className="font-bold text-slate-800 text-base">{group.name}</h3>
                        <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-xs font-bold">
                          {group.gameIds.length} لعبة
                        </span>
                      </div>
                      
                      {/* أزرار ترتيب المكتبة بالكامل */}
                      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        <span className="text-xs text-slate-500 ml-2 hidden sm:inline-block">ترتيب المكتبة:</span>
                        <button 
                          type="button"
                          onClick={() => moveLibrary(groupIndex, -1)}
                          disabled={isLibraryOrderingFiltered || groupIndex === 0}
                          className={`p-1 rounded-md transition-colors ${
                            (isLibraryOrderingFiltered || groupIndex === 0) ? 'text-gray-300 cursor-not-allowed' : 'text-slate-500 hover:text-[#178bb6] hover:bg-slate-300'
                          }`}
                          title="نقل المكتبة للأعلى"
                        >
                          <ChevronUp size={20} />
                        </button>
                        <button 
                          type="button"
                          onClick={() => moveLibrary(groupIndex, 1)}
                          disabled={isLibraryOrderingFiltered || groupIndex === visibleGroups.length - 1}
                          className={`p-1 rounded-md transition-colors ${
                            (isLibraryOrderingFiltered || groupIndex === visibleGroups.length - 1) ? 'text-gray-300 cursor-not-allowed' : 'text-slate-500 hover:text-[#178bb6] hover:bg-slate-300'
                          }`}
                          title="نقل المكتبة للأسفل"
                        >
                          <ChevronDown size={20} />
                        </button>
                      </div>
                    </div>

                    {/* قائمة الألعاب داخل المكتبة */}
                    {isExpanded && (
                      <div className="p-3 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                        {group.gameIds.map((gameId, gameIndex) => {
                          const game = availableGames.find(g => String(g.id) === gameId);
                          if (!game) return null;
                          const gameTitle = game.titleAr || game.title || game.name;

                        return (
                          <div 
                            key={gameId} 
                            className="group flex items-center bg-white border border-slate-200 p-2.5 rounded-xl hover:border-[#178bb6]/40 hover:shadow-sm transition-all"
                          >
                            {/* أزرار ترتيب اللعبة داخل المكتبة */}
                            <div className="flex flex-col items-center ml-3 gap-0.5">
                              <button 
                                type="button"
                                onClick={() => moveGameWithinLibrary(group.id, gameIndex, -1)}
                                disabled={gameIndex === 0}
                                className={`p-0.5 rounded-md transition-colors ${
                                  gameIndex === 0 ? 'text-gray-200 cursor-not-allowed' : 'text-gray-400 hover:text-[#178bb6] hover:bg-[#178bb6]/10'
                                }`}
                              >
                                <ChevronUp size={18} />
                              </button>
                              <button 
                                type="button"
                                onClick={() => moveGameWithinLibrary(group.id, gameIndex, 1)}
                                disabled={gameIndex === group.gameIds.length - 1}
                                className={`p-0.5 rounded-md transition-colors ${
                                  gameIndex === group.gameIds.length - 1 ? 'text-gray-200 cursor-not-allowed' : 'text-gray-400 hover:text-[#178bb6] hover:bg-[#178bb6]/10'
                                }`}
                              >
                                <ChevronDown size={18} />
                              </button>
                            </div>

                            {/* رقم الترتيب الكلي في الخطة */}
                            <div className="w-7 h-7 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-500 ml-3 group-hover:bg-[#178bb6]/10 group-hover:text-[#178bb6] group-hover:border-[#178bb6]/20 transition-colors">
                              {formData.assignedGameIds.indexOf(gameId) + 1}
                            </div>

                            {/* اسم اللعبة */}
                            <div className="flex-1">
                              <h4 className="font-medium text-slate-800 text-sm">{gameTitle}</h4>
                              <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                                {!!game.gameCode && (
                                  <span className="bg-cyan-50 text-[#178bb6] px-1.5 py-0.5 rounded font-bold border border-cyan-100">
                                    {game.gameCode}
                                  </span>
                                )}
                                <span>المستوى {game.level}</span>
                              </p>
                            </div>

                            {/* أيقونة السحب */}
                            <div className="text-slate-300 mr-2">
                              <GripVertical size={18} />
                            </div>
                          </div>
                        );
                      })}
                      </div>
                    )}
                  </div>
                )})}
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
