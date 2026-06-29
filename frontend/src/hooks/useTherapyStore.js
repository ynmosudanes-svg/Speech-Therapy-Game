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
  { id: 'none', label: '\u0628\u062f\u0648\u0646 \u0645\u0633\u0627\u0639\u062f\u0629' },
  { id: 'visual', label: '\u0628\u0635\u0631\u064a' },
  { id: 'verbal', label: '\u0644\u0641\u0638\u064a' },
  { id: 'gestural', label: '\u0625\u064a\u0645\u0627\u0626\u064a' },
  { id: 'modeling', label: '\u0646\u0645\u0630\u062c\u0629' },
  { id: 'partial_physical', label: '\u062c\u0633\u062f\u064a \u062c\u0632\u0626\u064a' },
  { id: 'full_physical', label: '\u062c\u0633\u062f\u064a \u0643\u0627\u0645\u0644' },
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

  if (normalized === 'SUPERADMIN' || normalized === 'SUPER_ADMIN') {
    return 'SUPER_ADMIN';
  }

  if (normalized === 'DATAENTRY' || normalized === 'DATA_ENTRY') {
    return 'DATA_ENTRY';
  }

  if (normalized === 'ADMIN') {
    return 'ADMIN';
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
  if (promptLevel === 'assisted') return 'PARTIAL';
  if (promptLevel === 'physical' || promptLevel === 'full_physical' || promptLevel === 'partial_physical') return 'FULL';
  return 'PARTIAL'; // visual, verbal, gestural, modeling
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
    const token = adminSession?.token || studentSession?.token;
    if (token) {
      if (adminSession?.token) {
        fetchStudents(token).catch(() => {});
      }
      fetchSessions(token).catch(() => {});
    } else {
      setStudents([]);
      setSessions([]);
    }
  }, [adminSession?.token, studentSession?.token, fetchSessions]);

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
        message: getErrorMessage(error, '\u0627\u0644\u0643\u0648\u062f \u063a\u064a\u0631 \u0635\u062d\u064a\u062d.'),
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
      throw new Error('\u0644\u0627 \u062a\u0648\u062c\u062f \u0635\u0644\u0627\u062d\u064a\u0629 \u0644\u062d\u0641\u0638 \u0627\u0644\u062c\u0644\u0633\u0629.');
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

    throw lastError || new Error('\u0644\u0627 \u062a\u0648\u062c\u062f \u0635\u0644\u0627\u062d\u064a\u0629 \u0644\u062d\u0641\u0638 \u0627\u0644\u062c\u0644\u0633\u0629.');
  }, [adminSession?.token, studentSession?.token, therapistSession?.isActive]);

  const getStudentReport = useCallback(async (studentId) => {
    const token = adminSession?.token || studentSession?.token;
    if (!token) {
      throw new Error('\u0644\u0627 \u062a\u0648\u062c\u062f \u0635\u0644\u0627\u062d\u064a\u0629 \u0644\u062c\u0644\u0628 \u0627\u0644\u062a\u0642\u0631\u064a\u0631.');
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
