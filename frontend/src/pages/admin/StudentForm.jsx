import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Save, UserRoundPlus, Layers, User, Search, CheckCircle2, ChevronUp, ChevronDown, GripVertical, Check, UsersRound } from 'lucide-react';
import Button from '../../components/Button';
import ConfirmModal from '../../components/ConfirmModal';
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

const getPersonOptionLabel = (person) => [person?.name, person?.email].filter(Boolean).join(' - ');

const AssignmentDropdown = ({ label, required = false, value, placeholder, options, onChange, isOpen, onToggle, onClose, icon: Icon, assignmentLabel }) => {
  const selectedOption = options.find((option) => String(option.value) === String(value));

  return (
    <div className="relative">
      <label className="mb-1.5 block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <button
        type="button"
        onClick={onToggle}
        className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-right transition-all ${
          isOpen
            ? 'border-[#178bb6] bg-white shadow-[0_14px_32px_-24px_rgba(23,139,182,0.65)] ring-4 ring-cyan-100'
            : 'border-gray-200 bg-gray-50 hover:border-cyan-200 hover:bg-white'
        }`}
      >
        <span className="flex min-w-0 flex-1 items-center gap-2">
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${isOpen ? 'bg-cyan-50 text-[#178bb6]' : 'bg-white text-slate-400 ring-1 ring-slate-100'}`}
          >
            {Icon ? <Icon size={17} /> : <User size={17} />}
          </span>
          <span className={`min-w-0 flex-1 truncate text-sm font-bold ${selectedOption ? 'text-slate-900' : 'text-slate-400'}`}>
            {selectedOption?.label || placeholder}
          </span>
        </span>
        <ChevronDown size={17} className={`shrink-0 text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-[#178bb6]' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-[calc(100%+0.45rem)] z-50 overflow-hidden rounded-xl border border-cyan-100 bg-white p-1.5 shadow-[0_24px_55px_-32px_rgba(15,23,42,0.45)]">
          <div className="max-h-56 overflow-y-auto pl-1 custom-scrollbar">
            {options.map((option) => {
              const isSelected = String(option.value) === String(value);

              return (
                <button
                  key={option.value || 'empty'}
                  type="button"
                  onClick={() => {
                    onChange(option.value, option);
                    onClose();
                  }}
                  className={`grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg px-3 py-2.5 text-right text-sm font-bold transition ${
                    isSelected
                      ? 'bg-[#178bb6] text-white shadow-[0_12px_24px_-18px_rgba(23,139,182,0.8)]'
                      : 'text-slate-700 hover:bg-cyan-50 hover:text-[#126d8f]'
                  }`}
                >
                  <span className="flex h-5 w-5 items-center justify-center">
                    {isSelected && <Check size={15} />}
                  </span>
                  <span className="min-w-0 truncate">{option.label}</span>
                  {assignmentLabel && option.value ? (
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-black ${isSelected ? 'bg-white/20 text-white' : 'bg-cyan-50 text-[#178bb6]'}`}>
                      {assignmentLabel}
                    </span>
                  ) : (
                    <span />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

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
  const [gamesPanelOpen, setGamesPanelOpen] = useState(false);
  const [therapistMenuOpen, setTherapistMenuOpen] = useState(false);
  const [parentMenuOpen, setParentMenuOpen] = useState(false);
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);
  const [resultDialog, setResultDialog] = useState(null);
  const [assignmentAlert, setAssignmentAlert] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState({});

  const showAssignmentAlert = (assignmentLabel, option) => {
    if (!option?.value) return;

    setAssignmentAlert({
      title: '\u062a\u0623\u0643\u064a\u062f \u0627\u0644\u062a\u0639\u064a\u064a\u0646',
      message: `\u062a\u0645 \u0627\u062e\u062a\u064a\u0627\u0631 ${option.label} - ${assignmentLabel}.`,
    });
  };
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

  const therapistOptions = useMemo(
    () => therapists.map((therapist) => ({
      value: therapist.id,
      label: getPersonOptionLabel(therapist),
    })),
    [therapists]
  );

  const parentOptions = useMemo(
    () => [
      { value: '', label: '\u0628\u062f\u0648\u0646 \u0648\u0644\u064a \u0623\u0645\u0631' },
      ...parents.map((parent) => ({
        value: parent.id,
        label: getPersonOptionLabel(parent),
      })),
    ],
    [parents]
  );

  const selectedTherapistLabel = therapistOptions.find((option) => String(option.value) === String(formData.therapistId))?.label || '\u0644\u0645 \u064a\u062a\u0645 \u0627\u062e\u062a\u064a\u0627\u0631 \u0627\u0644\u062f\u0643\u062a\u0648\u0631';
  const selectedParentLabel = parentOptions.find((option) => String(option.value) === String(formData.parentId))?.label || '\u0628\u062f\u0648\u0646 \u0648\u0644\u064a \u0623\u0645\u0631';
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

  const moveAssignedGameOrder = (gameIndex, direction) => {
    const targetIndex = gameIndex + direction;
    if (targetIndex < 0 || targetIndex >= formData.assignedGameIds.length) return;

    setFormData((current) => {
      const nextAssignedGameIds = [...current.assignedGameIds];
      [nextAssignedGameIds[gameIndex], nextAssignedGameIds[targetIndex]] = [
        nextAssignedGameIds[targetIndex],
        nextAssignedGameIds[gameIndex],
      ];
      return { ...current, assignedGameIds: nextAssignedGameIds };
    });
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

  const buildPayload = () => ({
    name: formData.name.trim(),
    age: Number(formData.age),
    diagnosis: formData.diagnosis.trim() || undefined,
    planName: formData.planName.trim() || undefined,
    therapistId: formData.therapistId || undefined,
    parentId: formData.parentId || undefined,
    assignedGames: uniqueAssignedGameIds.map((id, index) => ({
      gameId: id,
      order: index,
    })),
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');
    setSuccessNotice('');

    if (!adminSession?.token) {
      setError('\u062c\u0644\u0633\u0629 \u0627\u0644\u0625\u062f\u0627\u0631\u0629 \u063a\u064a\u0631 \u0645\u062a\u0627\u062d\u0629. \u0633\u062c\u0644 \u0627\u0644\u062f\u062e\u0648\u0644 \u0645\u0631\u0629 \u0623\u062e\u0631\u0649.');
      return;
    }

    if (adminSession?.user?.role === 'SUPER_ADMIN' && !formData.therapistId) {
      setError('\u0627\u062e\u062a\u0627\u0631 \u0627\u0644\u062f\u0643\u062a\u0648\u0631 \u0627\u0644\u0645\u0633\u0624\u0648\u0644 \u0642\u0628\u0644 \u0627\u0644\u062d\u0641\u0638.');
      return;
    }

    setSaveConfirmOpen(true);
  };

  const handleConfirmedSubmit = async () => {
    setSaveConfirmOpen(false);
    setSubmitting(true);
    setError('');
    setSuccessNotice('');

    try {
      const payload = buildPayload();

      if (isEdit && student) {
        await updateStudent(student.id, payload);
      } else {
        await addStudent(payload);
      }

      await fetchStudents(adminSession.token);
      setResultDialog({
        title: isEdit ? '\u062a\u0645 \u062d\u0641\u0638 \u0627\u0644\u062a\u0639\u062f\u064a\u0644\u0627\u062a' : '\u062a\u0645\u062a \u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0645\u0633\u062a\u0641\u064a\u062f',
        message: '\u062a\u0645 \u062d\u0641\u0638 \u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0645\u0633\u062a\u0641\u064a\u062f \u0648\u062a\u062d\u062f\u064a\u062b \u0627\u0644\u062e\u0637\u0629 \u0628\u0646\u062c\u0627\u062d.',
      });
    } catch (submitError) {
      setSuccessNotice('');
      setError(submitError?.response?.data?.message || submitError?.message || '\u062a\u0639\u0630\u0631 \u062d\u0641\u0638 \u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0645\u0633\u062a\u0641\u064a\u062f.');
    } finally {
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

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* العمود الأيمن: الإعدادات واختيار الألعاب */}
        <div className="mx-auto max-w-3xl space-y-6">
          
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
                <AssignmentDropdown
                  label={'\u0627\u0644\u062f\u0643\u062a\u0648\u0631 \u0627\u0644\u0645\u0633\u0624\u0648\u0644'}
                  required
                  value={formData.therapistId}
                  placeholder={'\u0627\u062e\u062a\u0627\u0631 \u0627\u0644\u062f\u0643\u062a\u0648\u0631'}
                  options={therapistOptions}
                  icon={User}
                  assignmentLabel={'\u062a\u0639\u064a\u064a\u0646 \u0643\u0640 \u062f\u0643\u062a\u0648\u0631'}
                  isOpen={therapistMenuOpen}
                  onToggle={() => {
                    setTherapistMenuOpen((open) => !open);
                    setParentMenuOpen(false);
                  }}
                  onClose={() => setTherapistMenuOpen(false)}
                  onChange={(value, option) => {
                    setFormData((current) => ({ ...current, therapistId: value }));
                    showAssignmentAlert('\u062a\u0639\u064a\u064a\u0646 \u0643\u0640 \u062f\u0643\u062a\u0648\u0631', option);
                  }}
                />
              )}

              <AssignmentDropdown
                label={'\u0648\u0644\u064a \u0627\u0644\u0623\u0645\u0631 (\u0627\u062e\u062a\u064a\u0627\u0631\u064a)'}
                value={formData.parentId}
                placeholder={'\u0627\u062e\u062a\u0627\u0631 \u0648\u0644\u064a \u0627\u0644\u0623\u0645\u0631'}
                options={parentOptions}
                icon={UsersRound}
                assignmentLabel={'\u062a\u0639\u064a\u064a\u0646 \u0643\u0640 \u0648\u0644\u064a \u0623\u0645\u0631'}
                isOpen={parentMenuOpen}
                onToggle={() => {
                  setParentMenuOpen((open) => !open);
                  setTherapistMenuOpen(false);
                }}
                onClose={() => setParentMenuOpen(false)}
                onChange={(value, option) => {
                  setFormData((current) => ({ ...current, parentId: value }));
                  showAssignmentAlert('\u062a\u0639\u064a\u064a\u0646 \u0643\u0640 \u0648\u0644\u064a \u0623\u0645\u0631', option);
                }}
              />
            </div>
          </div>


          <div className="rounded-2xl border border-cyan-100 bg-[linear-gradient(135deg,#f8fdff,#eef9fd)] p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-[#178bb6] shadow-sm ring-1 ring-cyan-100">
                  <Layers size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900">{'\u0623\u0644\u0639\u0627\u0628 \u0627\u0644\u062e\u0637\u0629'}</h2>
                  <p className="mt-1 text-sm font-medium text-slate-500">
                    {formData.assignedGameIds.length ? '\u064a\u0645\u0643\u0646\u0643 \u062a\u0639\u062f\u064a\u0644 \u0627\u0644\u0623\u0644\u0639\u0627\u0628 \u0648\u062a\u0631\u062a\u064a\u0628\u0647\u0627 \u0645\u0646 \u0627\u0644\u0644\u0648\u062d\u0629 \u0627\u0644\u0639\u0627\u0626\u0645\u0629.' : '\u0644\u0645 \u064a\u062a\u0645 \u0627\u062e\u062a\u064a\u0627\u0631 \u0623\u0644\u0639\u0627\u0628 \u0628\u0639\u062f.'}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-white px-3 py-1.5 text-sm font-black text-[#178bb6] ring-1 ring-cyan-100">
                  {formData.assignedGameIds.length} {'\u0644\u0639\u0628\u0629'}
                </span>
                <button
                  type="button"
                  onClick={() => setGamesPanelOpen(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#178bb6] px-4 py-2.5 text-sm font-black text-white shadow-sm shadow-cyan-500/30 transition hover:bg-[#126d8f] active:scale-[0.98]"
                >
                  <Layers size={17} />
                  {'\u062a\u0639\u062f\u064a\u0644 \u0623\u0644\u0639\u0627\u0628 \u0627\u0644\u062e\u0637\u0629'}
                </button>
              </div>
            </div>

            {formData.assignedGameIds.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2 border-t border-cyan-100 pt-4">
                {formData.assignedGameIds.slice(0, 4).map((gameId) => {
                  const game = availableGames.find((item) => String(item.id) === String(gameId));
                  return (
                    <span key={gameId} className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-600 ring-1 ring-slate-100">
                      {game?.titleAr || game?.title || game?.name || gameId}
                    </span>
                  );
                })}
                {formData.assignedGameIds.length > 4 && (
                  <span className="rounded-full bg-cyan-50 px-3 py-1.5 text-xs font-black text-[#178bb6] ring-1 ring-cyan-100">
                    +{formData.assignedGameIds.length - 4}
                  </span>
                )}
              </div>
            )}
          </div>



        </div>

        {/* شريط الإجراءات السفلي */}
        <div className="mx-auto flex max-w-3xl justify-end pt-2">
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


      {gamesPanelOpen && (
        <div className="fixed inset-x-0 top-0 bottom-[-120px] z-[9999] flex items-start justify-center p-4 pt-8 sm:p-8" dir="rtl">
          <button
            type="button"
            aria-label="close games panel"
            className="absolute inset-0 bg-slate-950/65 backdrop-blur-sm"
            onClick={() => setGamesPanelOpen(false)}
          />
          <div className="relative flex h-[min(720px,calc(100vh-5rem))] w-full max-w-6xl flex-col overflow-hidden rounded-[1.25rem] border border-cyan-100 bg-slate-50 shadow-[0_28px_70px_-38px_rgba(15,23,42,0.6)]">
            <div className="flex flex-col gap-3 border-b border-cyan-100 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-[#178bb6]">
                  <Layers size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900">{'\u062a\u0639\u062f\u064a\u0644 \u0623\u0644\u0639\u0627\u0628 \u0627\u0644\u062e\u0637\u0629'}</h2>
                  <p className="mt-1 text-sm font-medium text-slate-500">{'\u0627\u062e\u062a\u0631 \u0627\u0644\u0623\u0644\u0639\u0627\u0628 \u0648\u063a\u064a\u0631 \u062a\u0631\u062a\u064a\u0628\u0647\u0627 \u062b\u0645 \u0627\u0636\u063a\u0637 \u062a\u0645 \u0644\u0644\u0631\u062c\u0648\u0639 \u0644\u0644\u0641\u0648\u0631\u0645.'}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                <span className="rounded-full bg-cyan-50 px-3 py-1.5 text-sm font-black text-[#178bb6] ring-1 ring-cyan-100">
                  {formData.assignedGameIds.length} {'\u0644\u0639\u0628\u0629 \u0645\u062e\u062a\u0627\u0631\u0629'}
                </span>
                <button
                  type="button"
                  onClick={() => setGamesPanelOpen(false)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#178bb6] px-4 py-2 text-sm font-black text-white shadow-sm shadow-cyan-500/30 transition hover:bg-[#126d8f] active:scale-[0.98]"
                >
                  <Check size={17} />
                  {'\u062a\u0645'}
                </button>
              </div>
            </div>

            <div className="grid min-h-0 flex-1 gap-3 overflow-hidden p-3 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                        {/* بطاقة اختيار الألعاب */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex min-h-0 h-full flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">الألعاب المخصصة</h2>
              <span className="bg-[#178bb6]/10 text-[#126d8f] text-xs px-2.5 py-1 rounded-full font-medium">
                {formData.assignedGameIds.length} مختارة
              </span>
            </div>

            <div className="grid gap-2 mb-4 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
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

            <div className="min-h-0 flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
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
                      {/* العمود الأيسر: ترتيب الألعاب */}
              <div className="min-h-0">
                <div className="flex h-full min-h-0 flex-col rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-start justify-between gap-3 border-b border-gray-100 pb-3">
                    <div>
                      <h2 className="text-lg font-black text-gray-800">{'\u062a\u0631\u062a\u064a\u0628 \u0627\u0644\u0623\u0644\u0639\u0627\u0628'}</h2>
                      <p className="mt-1 text-sm font-medium text-gray-500">{'\u062d\u062f\u062f \u062a\u0631\u062a\u064a\u0628 \u0638\u0647\u0648\u0631 \u0627\u0644\u0623\u0644\u0639\u0627\u0628 \u062f\u0627\u062e\u0644 \u0627\u0644\u062e\u0637\u0629.'}</p>
                    </div>
                    <span className="rounded-full bg-[#178bb6]/10 px-3 py-1.5 text-xs font-black text-[#126d8f]">
                      {formData.assignedGameIds.length} {'\u0645\u062e\u062a\u0627\u0631\u0629'}
                    </span>
                  </div>

                  {formData.assignedGameIds.length === 0 ? (
                    <div className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-slate-50 text-center text-gray-400">
                      <Layers size={44} className="mb-3 opacity-25" />
                      <p className="text-sm font-bold">{'\u0644\u0645 \u064a\u062a\u0645 \u0627\u062e\u062a\u064a\u0627\u0631 \u0623\u0644\u0639\u0627\u0628 \u0628\u0639\u062f'}</p>
                      <p className="mt-1 text-xs font-medium">{'\u0627\u062e\u062a\u0631 \u0623\u0644\u0639\u0627\u0628 \u0645\u0646 \u0627\u0644\u0642\u0627\u0626\u0645\u0629 \u0644\u0625\u0638\u0647\u0627\u0631\u0647\u0627 \u0647\u0646\u0627.'}</p>
                    </div>
                  ) : (
                    <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1 custom-scrollbar">
                      {formData.assignedGameIds.map((gameId, index) => {
                        const game = availableGames.find((item) => String(item.id) === String(gameId));
                        const gameTitle = game?.titleAr || game?.title || game?.name || '\u0644\u0639\u0628\u0629 ' + (index + 1);

                        return (
                          <div key={String(gameId)} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3 transition hover:border-cyan-100 hover:bg-white">
                            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white text-xs font-black text-[#178bb6] ring-1 ring-cyan-100">
                              {index + 1}
                            </span>
                            <GripVertical size={18} className="shrink-0 text-slate-300" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-black text-slate-800">{gameTitle}</p>
                              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-400">
                                {!!game?.gameCode && (
                                  <span className="rounded-full bg-white px-2 py-0.5 text-[#178bb6] ring-1 ring-cyan-100">
                                    {game.gameCode}
                                  </span>
                                )}
                                {(game?.config?.tags || []).length > 0 && (
                                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-blue-700 ring-1 ring-blue-100">
                                    {getTagLabel(game.config.tags[0])}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-1">
                              <button
                                type="button"
                                onClick={() => moveAssignedGameOrder(index, -1)}
                                disabled={index === 0}
                                className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-cyan-200 hover:text-[#178bb6] disabled:cursor-not-allowed disabled:opacity-35"
                                aria-label="move game up"
                              >
                                <ChevronUp size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={() => moveAssignedGameOrder(index, 1)}
                                disabled={index === formData.assignedGameIds.length - 1}
                                className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-cyan-200 hover:text-[#178bb6] disabled:cursor-not-allowed disabled:opacity-35"
                                aria-label="move game down"
                              >
                                <ChevronDown size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleAssignedGame(gameId)}
                                className="rounded-lg border border-red-100 bg-red-50 px-2.5 py-1.5 text-xs font-black text-red-600 transition hover:bg-red-100"
                              >
                                {'\u0625\u0632\u0627\u0644\u0629'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!assignmentAlert}
        onClose={() => setAssignmentAlert(null)}
        onConfirm={() => setAssignmentAlert(null)}
        title={assignmentAlert?.title || ''}
        message={assignmentAlert?.message || ''}
        confirmText={'\u062a\u0645\u0627\u0645'}
        isDestructive={false}
        hideCancelButton
      />
      <ConfirmModal
        isOpen={saveConfirmOpen}
        onClose={() => setSaveConfirmOpen(false)}
        onConfirm={handleConfirmedSubmit}
        title={'\u062a\u0623\u0643\u064a\u062f \u062d\u0641\u0638 \u0627\u0644\u0645\u0633\u062a\u0641\u064a\u062f'}
        message={`\u0633\u064a\u062a\u0645 \u062d\u0641\u0638 \u0628\u064a\u0627\u0646\u0627\u062a ${formData.name || '\u0627\u0644\u0645\u0633\u062a\u0641\u064a\u062f'} \u0645\u0639 \u0627\u0644\u062f\u0643\u062a\u0648\u0631: ${selectedTherapistLabel}\u060c \u0648\u0648\u0644\u064a \u0627\u0644\u0623\u0645\u0631: ${selectedParentLabel}\u060c \u0648\u0639\u062f\u062f \u0627\u0644\u0623\u0644\u0639\u0627\u0628: ${uniqueAssignedGameIds.length}.`}
        confirmText={submitting ? '\u062c\u0627\u0631\u064a \u0627\u0644\u062d\u0641\u0638...' : '\u062a\u0623\u0643\u064a\u062f \u0627\u0644\u062d\u0641\u0638'}
        cancelText={'\u0645\u0631\u0627\u062c\u0639\u0629 \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a'}
        isDestructive={false}
      />
      <ConfirmModal
        isOpen={!!resultDialog}
        onClose={() => {
          setResultDialog(null);
          navigate('/admin/patients');
        }}
        onConfirm={() => {
          setResultDialog(null);
          navigate('/admin/patients');
        }}
        title={resultDialog?.title || ''}
        message={resultDialog?.message || ''}
        confirmText={'\u062a\u0645\u0627\u0645'}
        isDestructive={false}
        hideCancelButton
      />
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
