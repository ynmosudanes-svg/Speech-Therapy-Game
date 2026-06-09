import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import authService from '../services/authService';
import reportService from '../services/reportService';
import sessionService from '../services/sessionService';
import studentService from '../services/studentService';

const STORAGE_KEYS = {
  adminSession: 'therapy_admin_session',
  studentSession: 'therapy_student_session',
  studentSessionTransient: 'therapy_student_session_transient',
  therapistSession: 'therapy_therapist_session',
};

const defaultTherapistSession = {
  isActive: false,
  therapistControlsEnabled: false,
  promptLevel: 'none',
  launchedGameId: null,
  studentId: null,
  startedAt: null,
};

export const PROMPT_LEVELS = [
  { id: 'none', label: 'بدون مساعدة' },
  { id: 'visual', label: 'بصري' },
  { id: 'verbal', label: 'لفظي' },
  { id: 'gestural', label: 'إيمائي' },
  { id: 'modeling', label: 'نمذجة' },
  { id: 'partial_physical', label: 'جسدي جزئي' },
  { id: 'full_physical', label: 'جسدي كامل' },
];

const TherapyContext = createContext(null);

const readStorage = (storage, key, fallback) => {
  try {
    const value = storage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const writeStorage = (key, value) => {
  if (!value) {
    localStorage.removeItem(key);
    return;
  }

  localStorage.setItem(key, JSON.stringify(value));
};

const normalizeRole = (role) => {
  if (!role) {
    return null;
  }

  const normalized = String(role).trim().toUpperCase();

  if (normalized === 'ADMIN' || normalized === 'SUPERADMIN' || normalized === 'SUPER_ADMIN') {
    return 'SUPER_ADMIN';
  }

  if (normalized === 'DOCTOR' || normalized === 'THERAPIST') {
    return 'THERAPIST';
  }

  if (normalized === 'STUDENT') {
    return 'STUDENT';
  }

  return normalized;
};

const normalizeAdminSession = (session) => {
  if (!session || typeof session !== 'object') {
    return null;
  }

  const role = normalizeRole(session.user?.role);

  // Reject old sessions that don't have a recognized role (forces fresh login)
  if (!session.token || !role) {
    return null;
  }

  return {
    ...session,
    user: {
      ...session.user,
      role,
    },
  };
};

const normalizeStudentSession = (session) => {
  if (!session || typeof session !== 'object') {
    return null;
  }

  return session.token && session.student ? session : null;
};

const readStudentSession = () => {
  const persistent = normalizeStudentSession(readStorage(localStorage, STORAGE_KEYS.studentSession, null));
  if (persistent) {
    return persistent;
  }

  return normalizeStudentSession(readStorage(sessionStorage, STORAGE_KEYS.studentSessionTransient, null));
};

const normalizeStudent = (student) => ({
  ...student,
  code: student.accessCode,
  assignedGames: Array.isArray(student.assignedGames) ? student.assignedGames : [],
});

const mapFrontendPromptToApi = (promptLevel) => {
  if (!promptLevel || promptLevel === 'none' || promptLevel === 'independent') return 'INDEPENDENT';
  if (promptLevel === 'physical' || promptLevel === 'full_physical') return 'PHYSICAL';
  if (promptLevel === 'verbal') return 'VERBAL';
  if (promptLevel === 'visual' || promptLevel === 'gestural' || promptLevel === 'gesture') return 'VISUAL';
  return 'PARTIAL';
};

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  fallback;

export function TherapyProvider({ children }) {
  const [adminSession, setAdminSession] = useState(() =>
    normalizeAdminSession(readStorage(localStorage, STORAGE_KEYS.adminSession, null))
  );
  const [studentSession, setStudentSession] = useState(() => readStudentSession());
  const [therapistSession, setTherapistSession] = useState(() =>
    readStorage(localStorage, STORAGE_KEYS.therapistSession, defaultTherapistSession)
  );
  const [students, setStudents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [lastError, setLastError] = useState('');

  const activeMode = therapistSession?.isActive ? 'therapist' : studentSession?.source || 'parent';
  const currentStudent = studentSession?.student || null;

  useEffect(() => {
    writeStorage(STORAGE_KEYS.adminSession, adminSession);
  }, [adminSession]);

  useEffect(() => {
    if (!studentSession) {
      localStorage.removeItem(STORAGE_KEYS.studentSession);
      sessionStorage.removeItem(STORAGE_KEYS.studentSessionTransient);
      return;
    }

    if (studentSession.rememberMe) {
      localStorage.setItem(STORAGE_KEYS.studentSession, JSON.stringify(studentSession));
      sessionStorage.removeItem(STORAGE_KEYS.studentSessionTransient);
      return;
    }

    sessionStorage.setItem(STORAGE_KEYS.studentSessionTransient, JSON.stringify(studentSession));
    localStorage.removeItem(STORAGE_KEYS.studentSession);
  }, [studentSession]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.therapistSession, therapistSession);
  }, [therapistSession]);

  useEffect(() => {
    const handleUnauthorized = () => {
      setAdminSession(null);
      setStudentSession(null);
      setStudents([]);
      setSessions([]);
      setTherapistSession(defaultTherapistSession);
      setLastError('انتهت الجلسة. سجل الدخول مرة أخرى.');
    };

    window.addEventListener('therapy:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('therapy:unauthorized', handleUnauthorized);
  }, []);

  const fetchStudents = useCallback(async (token = adminSession?.token) => {
    if (!token) {
      setStudents([]);
      return [];
    }

    setLoadingStudents(true);
    try {
      const response = await studentService.getStudents(token);
      const data = Array.isArray(response?.data) ? response.data.map(normalizeStudent) : [];
      setStudents(data);
      return data;
    } finally {
      setLoadingStudents(false);
    }
  }, [adminSession?.token]);

  const fetchSessions = useCallback(async (token = adminSession?.token) => {
    if (!token) {
      setSessions([]);
      return [];
    }

    setLoadingSessions(true);
    try {
      const response = await sessionService.getSessions(token);
      const data = Array.isArray(response?.data) ? response.data : [];
      setSessions(data);
      return data;
    } finally {
      setLoadingSessions(false);
    }
  }, [adminSession?.token]);

  useEffect(() => {
    if (adminSession?.token) {
      fetchStudents(adminSession.token).catch(() => {});
      fetchSessions(adminSession.token).catch(() => {});
    } else {
      setStudents([]);
      setSessions([]);
    }
  }, [adminSession?.token]);

  const loginAdmin = useCallback(async (email, password) => {
    try {
      setLastError('');
      const response = await authService.loginTherapist({ email, password });
      const session = {
        token: response.token,
        user: {
          ...response.user,
          role: normalizeRole(response.user?.role),
        },
        name: response.user.name,
        email: response.user.email,
        loggedInAt: new Date().toISOString(),
      };

      setAdminSession(session);
      return { success: true, session };
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(error, 'تعذر تسجيل الدخول.'),
      };
    }
  }, []);

  const logoutAdmin = useCallback(() => {
    setAdminSession(null);
    setStudents([]);
    setSessions([]);
    setTherapistSession(defaultTherapistSession);
  }, []);

  const loginStudent = useCallback(async (code, source = 'parent', rememberMe = false) => {
    try {
      setLastError('');
      const response = await authService.loginPatient(code.trim().toUpperCase());
      const studentPayload = response.student || response.patient;
      const session = {
        token: response.token,
        student: normalizeStudent(studentPayload),
        source,
        rememberMe,
        loggedInAt: new Date().toISOString(),
      };

      setStudentSession(session);

      if (source !== 'therapist') {
        setTherapistSession(defaultTherapistSession);
      }

      return { success: true, session };
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(error, 'الكود غير صحيح.'),
      };
    }
  }, []);

  const logoutStudent = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.studentSession);
    sessionStorage.removeItem(STORAGE_KEYS.studentSessionTransient);
    setStudentSession(null);
    if (!therapistSession?.isActive) {
      setTherapistSession(defaultTherapistSession);
    }
  }, [therapistSession?.isActive]);

  const startTherapistSession = useCallback((student, launchedGameId = null) => {
    const normalizedStudent = normalizeStudent(student);
    setStudentSession({
      token: null,
      student: normalizedStudent,
      source: 'therapist',
      loggedInAt: new Date().toISOString(),
    });

    const nextSession = {
      isActive: true,
      therapistControlsEnabled: true,
      promptLevel: 'none',
      launchedGameId,
      studentId: normalizedStudent.id,
      startedAt: new Date().toISOString(),
    };

    setTherapistSession(nextSession);
    return nextSession;
  }, []);

  const endTherapistSession = useCallback(() => {
    setTherapistSession(defaultTherapistSession);
    if (studentSession?.source === 'therapist') {
      setStudentSession(null);
    }
  }, [studentSession?.source]);

  const setTherapistControlsEnabled = useCallback((enabled) => {
    setTherapistSession((current) => ({
      ...current,
      therapistControlsEnabled: enabled,
    }));
  }, []);

  const setTherapistPromptLevel = useCallback((promptLevel) => {
    setTherapistSession((current) => ({
      ...current,
      promptLevel,
    }));
  }, []);

  const addStudent = useCallback(async (studentData) => {
    if (!adminSession?.token) {
      throw new Error('جلسة الإدارة غير متاحة.');
    }

    const response = await studentService.createStudent(adminSession.token, studentData);
    const student = normalizeStudent(response.data);
    setStudents((current) => [student, ...current]);
    return student;
  }, [adminSession?.token]);

  const updateStudent = useCallback(async (studentId, updates) => {
    if (!adminSession?.token) {
      throw new Error('جلسة الإدارة غير متاحة.');
    }

    const response = await studentService.updateStudent(adminSession.token, studentId, updates);
    const updatedStudent = normalizeStudent(response.data);

    setStudents((current) =>
      current.map((student) => (student.id === studentId ? updatedStudent : student))
    );

    if (currentStudent?.id === studentId) {
      setStudentSession((current) =>
        current
          ? {
              ...current,
              student: updatedStudent,
            }
          : current
      );
    }

    return updatedStudent;
  }, [adminSession?.token, currentStudent?.id]);

  const deleteStudent = useCallback(async (studentId) => {
    if (!adminSession?.token) {
      throw new Error('جلسة الإدارة غير متاحة.');
    }

    await studentService.deleteStudent(adminSession.token, studentId);
    setStudents((current) => current.filter((student) => student.id !== studentId));
    setSessions((current) => current.filter((session) => session.studentId !== studentId));

    if (currentStudent?.id === studentId) {
      setStudentSession(null);
      setTherapistSession(defaultTherapistSession);
    }
  }, [adminSession?.token, currentStudent?.id]);

  const regenerateStudentAccessCode = useCallback(async (studentId) => {
    if (!adminSession?.token) {
      throw new Error('جلسة الإدارة غير متاحة.');
    }

    const response = await studentService.regenerateAccessCode(adminSession.token, studentId);
    const updated = response?.data;

    if (updated?.id) {
      setStudents((current) =>
        current.map((student) =>
          String(student.id) === String(updated.id)
            ? { ...student, accessCode: updated.accessCode, code: updated.accessCode }
            : student
        )
      );
    }

    return updated;
  }, [adminSession?.token]);

  const saveSession = useCallback(async (sessionData) => {
    const candidateTokens = therapistSession?.isActive
      ? [adminSession?.token, studentSession?.token]
      : [studentSession?.token, adminSession?.token];
    const tokens = [...new Set(candidateTokens.filter(Boolean))];

    if (tokens.length === 0) {
      throw new Error('لا توجد صلاحية لحفظ الجلسة.');
    }

    let lastError = null;

    for (let index = 0; index < tokens.length; index += 1) {
      try {
        const response = await sessionService.createSession(tokens[index], sessionData);
        const session = response.data;
        setSessions((current) => [session, ...current]);
        return session;
      } catch (error) {
        lastError = error;
        const status = error?.response?.status;
        const canRetry = index < tokens.length - 1 && (status === 401 || status === 403);

        if (!canRetry) {
          throw error;
        }
      }
    }

    throw lastError || new Error('لا توجد صلاحية لحفظ الجلسة.');
  }, [adminSession?.token, studentSession?.token, therapistSession?.isActive]);

  const getStudentReport = useCallback(async (studentId) => {
    const token = adminSession?.token || studentSession?.token;
    if (!token) {
      throw new Error('لا توجد صلاحية لجلب التقرير.');
    }

    const response = await reportService.getStudentReport(token, studentId);
    return response.data;
  }, [adminSession?.token, studentSession?.token]);

  const value = useMemo(
    () => ({
      adminSession,
      studentSession,
      therapistSession,
      activeMode,
      currentStudent,
      students,
      sessions,
      loadingStudents,
      loadingSessions,
      lastError,
      setLastError,
      loginAdmin,
      logoutAdmin,
      loginStudent,
      logoutStudent,
      fetchStudents,
      fetchSessions,
      addStudent,
      updateStudent,
      deleteStudent,
      regenerateStudentAccessCode,
      saveSession,
      getStudentReport,
      startTherapistSession,
      endTherapistSession,
      setTherapistControlsEnabled,
      setTherapistPromptLevel,
      updateStudentLevel: async () => {},
      resetDemoData: async () => {},
      mapFrontendPromptToApi,
    }),
    [
      adminSession,
      studentSession,
      therapistSession,
      activeMode,
      currentStudent,
      students,
      sessions,
      loadingStudents,
      loadingSessions,
      lastError,
    ]
  );

  return React.createElement(TherapyContext.Provider, { value }, children);
}

export function useTherapyStore() {
  const context = useContext(TherapyContext);

  if (!context) {
    throw new Error('useTherapyStore must be used inside TherapyProvider.');
  }

  return context;
}
