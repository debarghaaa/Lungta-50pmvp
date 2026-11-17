import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  Check,
  Plus,
  Trash2,
  Edit2,
  Clock,
  Sparkles,
  Pill,
  Stethoscope,
  Droplets,
  Calendar,
  AlertCircle,
  CheckCircle2,
  X,
  Phone,
  BookOpen,
  Footprints,
  Flower2,
  Palette,
  Heart,
  Award,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  TodoItem,
  ImportantReminder,
  ReminderCategory,
  TodoCategory,
  CompletedTaskArchiveItem,
} from '../types';
import { playDropSound, playChimeSound } from '../utils/sound';
import {
  loadTodos,
  saveTodos,
  loadImportantReminders,
  saveImportantReminders,
  calculateReminderStatus,
  getCurrentMinutesFromMidnight,
  validateTimeString,
  createUniqueId,
  ReminderCompletionFeedback,
  loadCompletedTasks,
  evaluateReminderPoints,
  permanentlyCompleteReminder,
  permanentlyCompleteTodo,
  restoreArchivedTask,
  removeCompletedTask,
} from '../utils/remindersStorage';
import {
  getLongTermMemoryPoints,
  MemoryPointsUpdateEvent,
} from '../utils/memoryPoints';
import { useLanguage } from '../context/LanguageContext';
import { ListenAloudButton } from './ListenAloudButton';

interface RemindersViewProps {
  seniorMode: boolean;
}

export interface PendingTaskCompletion {
  id: string;
  type: 'reminder' | 'todo';
  title: string;
  category?: string;
  timeString?: string;
  pointsPotential: number;
  message: string;
  secondsRemaining: number;
  targetTime: number;
}

export const RemindersView: React.FC<RemindersViewProps> = ({ seniorMode }) => {
  const { language, t } = useLanguage();
  // State
  const [todos, setTodos] = useState<TodoItem[]>(() => loadTodos());
  const [reminders, setReminders] = useState<ImportantReminder[]>(() => loadImportantReminders());
  const [memoryPoints, setMemoryPoints] = useState<number>(() => getLongTermMemoryPoints());
  const [currentMinutesNow, setCurrentMinutesNow] = useState<number>(() =>
    getCurrentMinutesFromMidnight()
  );

  // Modals & Feedback State
  const [feedbackToast, setFeedbackToast] = useState<ReminderCompletionFeedback | null>(null);
  const [showAddTodoModal, setShowAddTodoModal] = useState<boolean>(false);
  const [editingTodo, setEditingTodo] = useState<TodoItem | null>(null);
  const [showAddReminderModal, setShowAddReminderModal] = useState<boolean>(false);
  const [editingReminder, setEditingReminder] = useState<ImportantReminder | null>(null);

  // 5-Second Undo Completion State & Completed Tasks Archive
  const [pendingCompletions, setPendingCompletions] = useState<Record<string, PendingTaskCompletion>>({});
  const [completedArchive, setCompletedArchive] = useState<CompletedTaskArchiveItem[]>(() => loadCompletedTasks());
  const [showCompletedHistory, setShowCompletedHistory] = useState<boolean>(false);

  // Refs to prevent closure staleness & StrictMode double-effects
  const pendingTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const pendingCompletionsRef = useRef<Record<string, PendingTaskCompletion>>(pendingCompletions);
  pendingCompletionsRef.current = pendingCompletions;
  const remindersRef = useRef(reminders);
  remindersRef.current = reminders;
  const todosRef = useRef(todos);
  todosRef.current = todos;

  // Todo Form Fields
  const [todoTitle, setTodoTitle] = useState<string>('');
  const [todoCategory, setTodoCategory] = useState<TodoCategory>('general');
  const [todoFormError, setTodoFormError] = useState<string>('');

  // Reminder Form Fields
  const [reminderTitle, setReminderTitle] = useState<string>('');
  const [reminderCategory, setReminderCategory] = useState<ReminderCategory>('medicine');
  const [reminderTimeStr, setReminderTimeStr] = useState<string>('09:00 AM');
  const [reminderNotes, setReminderNotes] = useState<string>('');
  const [reminderFormError, setReminderFormError] = useState<string>('');

  // Update clock every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentMinutesNow(getCurrentMinutesFromMidnight());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Sync completed archive, reminders, and todos from storage / custom events
  useEffect(() => {
    const handleArchiveUpdate = () => {
      setCompletedArchive(loadCompletedTasks());
    };
    const handleRemindersUpdate = () => {
      setReminders(loadImportantReminders());
    };
    const handleTodosUpdate = () => {
      setTodos(loadTodos());
    };
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'lungta_completed_tasks_archive_v1') handleArchiveUpdate();
      if (e.key === 'lungta_important_reminders_v1') handleRemindersUpdate();
      if (e.key === 'lungta_my_todos_list_v1') handleTodosUpdate();
      if (e.key === 'lungta_longterm_memory_points') setMemoryPoints(getLongTermMemoryPoints());
    };
    window.addEventListener('lungta_completed_archive_updated', handleArchiveUpdate);
    window.addEventListener('lungta_reminders_updated', handleRemindersUpdate);
    window.addEventListener('lungta_todos_updated', handleTodosUpdate);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('lungta_completed_archive_updated', handleArchiveUpdate);
      window.removeEventListener('lungta_reminders_updated', handleRemindersUpdate);
      window.removeEventListener('lungta_todos_updated', handleTodosUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const hasPendingCompletions = Object.keys(pendingCompletions).length > 0;

  // 5-Second Countdown Ticking Loop
  useEffect(() => {
    if (!hasPendingCompletions) return;

    const interval = setInterval(() => {
      const now = Date.now();
      setPendingCompletions((prev) => {
        let hasChanges = false;
        const next: Record<string, PendingTaskCompletion> = {};
        const entries = Object.entries(prev) as [string, PendingTaskCompletion][];
        for (const [id, item] of entries) {
          const remainingMs = item.targetTime - now;
          const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));
          if (remainingSec !== item.secondsRemaining) {
            hasChanges = true;
            next[id] = { ...item, secondsRemaining: remainingSec };
          } else {
            next[id] = item;
          }
        }
        return hasChanges ? next : prev;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [hasPendingCompletions]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      (Object.values(pendingTimersRef.current) as (ReturnType<typeof setTimeout>)[]).forEach((t) =>
        clearTimeout(t)
      );
    };
  }, []);

  // Listen to external memory points & reminder updates
  useEffect(() => {
    const handlePointsUpdate = (e: Event) => {
      const custom = e as CustomEvent<MemoryPointsUpdateEvent>;
      if (custom.detail?.newTotal !== undefined) {
        setMemoryPoints(custom.detail.newTotal);
      } else {
        setMemoryPoints(getLongTermMemoryPoints());
      }
    };

    window.addEventListener('lungta_memory_points_changed', handlePointsUpdate);
    return () => window.removeEventListener('lungta_memory_points_changed', handlePointsUpdate);
  }, []);

  // Auto-dismiss toast after 4.5 seconds
  useEffect(() => {
    if (!feedbackToast) return;
    const t = setTimeout(() => {
      setFeedbackToast(null);
    }, 4500);
    return () => clearTimeout(t);
  }, [feedbackToast]);

  // --------------------------------------------------------------------------
  // COMPLETION & 5-SECOND UNDO LIFECYCLE
  // --------------------------------------------------------------------------
  const handleUndoCompletion = (id: string) => {
    if (pendingTimersRef.current[id]) {
      clearTimeout(pendingTimersRef.current[id]);
      delete pendingTimersRef.current[id];
    }

    const pendingItem = pendingCompletionsRef.current[id];
    if (!pendingItem) return;

    playDropSound();

    setPendingCompletions((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });

    setFeedbackToast({
      reminder: {
        id: pendingItem.id,
        title: pendingItem.title,
        category:
          pendingItem.category === 'medicine' ||
          pendingItem.category === 'doctor' ||
          pendingItem.category === 'hydration' ||
          pendingItem.category === 'event'
            ? pendingItem.category
            : 'event',
        timeString: pendingItem.timeString || 'Today',
        timeMinutes: 0,
        isCompleted: false,
        createdAt: Date.now(),
      },
      pointsAwarded: 0,
      isEarlyOrOnTime: true,
      message: `Restored "${pendingItem.title}". Task is active again.`,
    });
  };

  const finalizeCompletion = (id: string) => {
    if (pendingTimersRef.current[id]) {
      clearTimeout(pendingTimersRef.current[id]);
      delete pendingTimersRef.current[id];
    }

    const pendingItem = pendingCompletionsRef.current[id];
    if (!pendingItem) return;

    setPendingCompletions((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });

    if (pendingItem.type === 'reminder') {
      const res = permanentlyCompleteReminder(id, remindersRef.current);
      setReminders(res.updatedList);
      setCompletedArchive(loadCompletedTasks());

      if (res.pointsAwarded > 0) {
        playChimeSound();
      }
      setFeedbackToast({
        reminder: res.completedReminder || {
          id: pendingItem.id,
          title: pendingItem.title,
          category:
            pendingItem.category === 'medicine' ||
            pendingItem.category === 'doctor' ||
            pendingItem.category === 'hydration' ||
            pendingItem.category === 'event'
              ? pendingItem.category
              : 'medicine',
          timeString: pendingItem.timeString || '',
          timeMinutes: 0,
          isCompleted: true,
          createdAt: Date.now(),
        },
        pointsAwarded: res.pointsAwarded,
        isEarlyOrOnTime: res.pointsAwarded > 0,
        message: res.message || 'Completed gently and archived.',
      });
    } else {
      const res = permanentlyCompleteTodo(id, todosRef.current);
      setTodos(res.updatedList);
      setCompletedArchive(loadCompletedTasks());

      playChimeSound();
      setFeedbackToast({
        reminder: {
          id: pendingItem.id,
          title: pendingItem.title,
          category: 'event',
          timeString: 'Today',
          timeMinutes: 0,
          isCompleted: true,
          createdAt: Date.now(),
        },
        pointsAwarded: res.pointsAwarded,
        isEarlyOrOnTime: true,
        message:
          res.pointsAwarded > 0
            ? `Splendid! +${res.pointsAwarded} Memory Points permanently awarded.`
            : 'Completed gently and archived.',
      });
    }
  };

  const handleStartCompleteReminder = (rem: ImportantReminder) => {
    // If already in 5s pending window, tapping acts as undo
    if (pendingCompletions[rem.id]) {
      handleUndoCompletion(rem.id);
      return;
    }

    playDropSound();
    const { points, message } = evaluateReminderPoints(rem, currentMinutesNow);
    const targetTime = Date.now() + 5000;

    if (pendingTimersRef.current[rem.id]) {
      clearTimeout(pendingTimersRef.current[rem.id]);
    }

    setPendingCompletions((prev) => ({
      ...prev,
      [rem.id]: {
        id: rem.id,
        type: 'reminder',
        title: rem.title,
        category: rem.category,
        timeString: rem.timeString,
        pointsPotential: points,
        message,
        secondsRemaining: 5,
        targetTime,
      },
    }));

    pendingTimersRef.current[rem.id] = setTimeout(() => {
      finalizeCompletion(rem.id);
    }, 5000);
  };

  const handleStartCompleteTodo = (todo: TodoItem) => {
    // If already in 5s pending window, tapping acts as undo
    if (pendingCompletions[todo.id]) {
      handleUndoCompletion(todo.id);
      return;
    }

    playDropSound();
    const points = 10;
    const message = 'Splendid! You completed your personal daily rhythm task.';
    const targetTime = Date.now() + 5000;

    if (pendingTimersRef.current[todo.id]) {
      clearTimeout(pendingTimersRef.current[todo.id]);
    }

    setPendingCompletions((prev) => ({
      ...prev,
      [todo.id]: {
        id: todo.id,
        type: 'todo',
        title: todo.title,
        category: todo.category,
        pointsPotential: points,
        message,
        secondsRemaining: 5,
        targetTime,
      },
    }));

    pendingTimersRef.current[todo.id] = setTimeout(() => {
      finalizeCompletion(todo.id);
    }, 5000);
  };

  const handleRestoreArchived = (id: string) => {
    playDropSound();
    const res = restoreArchivedTask(id, todosRef.current, remindersRef.current);
    if (res) {
      if (res.restoredType === 'reminder' && res.updatedReminders) {
        setReminders(res.updatedReminders);
      } else if (res.restoredType === 'todo' && res.updatedTodos) {
        setTodos(res.updatedTodos);
      }
      setCompletedArchive(loadCompletedTasks());
      setFeedbackToast({
        reminder: {
          id,
          title: 'Task Restored',
          category: 'event',
          timeString: 'Today',
          timeMinutes: 0,
          isCompleted: false,
          createdAt: Date.now(),
        },
        pointsAwarded: 0,
        isEarlyOrOnTime: true,
        message: 'Task restored back to your active list.',
      });
    }
  };

  const handleDeleteArchived = (id: string) => {
    playDropSound();
    removeCompletedTask(id);
    setCompletedArchive(loadCompletedTasks());
  };

  // --------------------------------------------------------------------------
  // SECTION 1: MY TO-DOS HANDLERS
  // --------------------------------------------------------------------------
  const handleToggleTodo = (id: string) => {
    const target = todos.find((t) => t.id === id);
    if (target) {
      handleStartCompleteTodo(target);
    }
  };

  const handleOpenAddTodo = () => {
    playDropSound();
    setTodoTitle('');
    setTodoCategory('general');
    setTodoFormError('');
    setEditingTodo(null);
    setShowAddTodoModal(true);
  };

  const handleOpenEditTodo = (item: TodoItem) => {
    playDropSound();
    setTodoTitle(item.title);
    setTodoCategory(item.category || 'general');
    setTodoFormError('');
    setEditingTodo(item);
    setShowAddTodoModal(true);
  };

  const handleSaveTodo = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = todoTitle.trim();
    if (!cleanTitle) {
      setTodoFormError('Please enter a short description for your task.');
      return;
    }
    setTodoFormError('');
    playDropSound();

    if (editingTodo) {
      const updated = todos.map((item) =>
        item.id === editingTodo.id
          ? { ...item, title: cleanTitle, category: todoCategory }
          : item
      );
      setTodos(updated);
      saveTodos(updated);
    } else {
      const newItem: TodoItem = {
        id: createUniqueId('todo'),
        title: cleanTitle,
        category: todoCategory,
        isCompleted: false,
        createdAt: Date.now(),
      };
      const updated = [newItem, ...todos];
      setTodos(updated);
      saveTodos(updated);
    }

    setShowAddTodoModal(false);
    setEditingTodo(null);
  };

  const handleDeleteTodo = (id: string) => {
    playDropSound();
    const updated = todos.filter((item) => item.id !== id);
    setTodos(updated);
    saveTodos(updated);
  };

  // --------------------------------------------------------------------------
  // SECTION 2: IMPORTANT REMINDERS HANDLERS
  // --------------------------------------------------------------------------
  const handleToggleImportantReminder = (id: string) => {
    const target = reminders.find((r) => r.id === id);
    if (target) {
      handleStartCompleteReminder(target);
    }
  };

  const handleOpenAddReminder = () => {
    playDropSound();
    setReminderTitle('');
    setReminderCategory('medicine');
    setReminderTimeStr('09:00 AM');
    setReminderNotes('');
    setReminderFormError('');
    setEditingReminder(null);
    setShowAddReminderModal(true);
  };

  const handleOpenEditReminder = (rem: ImportantReminder) => {
    playDropSound();
    setReminderTitle(rem.title);
    setReminderCategory(rem.category);
    setReminderTimeStr(rem.timeString);
    setReminderNotes(rem.notes || '');
    setReminderFormError('');
    setEditingReminder(rem);
    setShowAddReminderModal(true);
  };

  const handleSaveReminder = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = reminderTitle.trim();
    if (!cleanTitle) {
      setReminderFormError('Please enter a title for this reminder.');
      return;
    }

    const timeCheck = validateTimeString(reminderTimeStr);
    if (!timeCheck.valid) {
      setReminderFormError(timeCheck.error || 'Please enter a valid time like 09:00 AM.');
      return;
    }

    setReminderFormError('');
    playDropSound();

    if (editingReminder) {
      const updated = reminders
        .map((r) =>
          r.id === editingReminder.id
            ? {
                ...r,
                title: cleanTitle,
                category: reminderCategory,
                timeString: timeCheck.formatted,
                timeMinutes: timeCheck.minutes,
                notes: reminderNotes.trim() || undefined,
              }
            : r
        )
        .sort((a, b) => a.timeMinutes - b.timeMinutes);
      setReminders(updated);
      saveImportantReminders(updated);
    } else {
      const newRem: ImportantReminder = {
        id: createUniqueId('rem'),
        title: cleanTitle,
        category: reminderCategory,
        timeString: timeCheck.formatted,
        timeMinutes: timeCheck.minutes,
        notes: reminderNotes.trim() || undefined,
        isCompleted: false,
        createdAt: Date.now(),
      };
      // Keep sorted by time
      const updated = [...reminders, newRem].sort((a, b) => a.timeMinutes - b.timeMinutes);
      setReminders(updated);
      saveImportantReminders(updated);
    }

    setShowAddReminderModal(false);
    setEditingReminder(null);
  };

  const handleDeleteReminder = (id: string) => {
    playDropSound();
    const updated = reminders.filter((r) => r.id !== id);
    setReminders(updated);
    saveImportantReminders(updated);
  };

  // Helper icons and styles for Important Reminders
  const getCategoryIcon = (category: ReminderCategory) => {
    switch (category) {
      case 'medicine':
        return <Pill className="w-5 h-5 sm:w-6 sm:h-6 text-[#8C3B3B]" />;
      case 'doctor':
        return <Stethoscope className="w-5 h-5 sm:w-6 sm:h-6 text-[#284B63]" />;
      case 'hydration':
        return <Droplets className="w-5 h-5 sm:w-6 sm:h-6 text-[#3C6E71]" />;
      case 'event':
      default:
        return <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-[#3C6E71]" />;
    }
  };

  const getCategoryBadge = (category: ReminderCategory) => {
    switch (category) {
      case 'medicine':
        return { label: 'Medicine', bg: 'bg-[#F4E6E4] text-[#5C2323] border-[#B87A74]' };
      case 'doctor':
        return { label: 'Doctor Appointment', bg: 'bg-[#EAEFF3] text-[#284B63] border-[#D9D9D9]' };
      case 'hydration':
        return { label: 'Hydration', bg: 'bg-[#E8EFEF] text-[#284B63] border-[#3C6E71]' };
      case 'event':
      default:
        return { label: 'Important Event', bg: 'bg-[#EFEFEF] text-[#284B63] border-[#D9D9D9]' };
    }
  };

  // Helper for Todo category badges
  const getTodoCategoryIcon = (category?: TodoCategory) => {
    switch (category) {
      case 'walk':
        return <Footprints className="w-4 h-4 text-[#284B63]" />;
      case 'plants':
        return <Flower2 className="w-4 h-4 text-[#3C6E71]" />;
      case 'family':
        return <Phone className="w-4 h-4 text-[#284B63]" />;
      case 'read':
        return <BookOpen className="w-4 h-4 text-[#3C6E71]" />;
      case 'hobby':
        return <Palette className="w-4 h-4 text-[#353535]" />;
      default:
        return <Heart className="w-4 h-4 text-[#3C6E71]" />;
    }
  };

  return (
    <div
      id="reminders-page"
      className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-10 animate-in fade-in duration-300"
    >
      {/* --------------------------------------------------------------------- */}
      {/* 1. PAGE TITLE & LONG-TERM MEMORY POINTS BADGE */}
      {/* --------------------------------------------------------------------- */}
      <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
        <div className="space-y-2">
          {/* Coordinates & Himalayan Eyebrow */}
          <div className="text-[#3C6E71] text-xs sm:text-sm tracking-[0.25em] font-bold uppercase drop-shadow-[0_1px_10px_rgba(255,255,255,0.9)]">
            27.700° N 88.158° E • HARMONY BELL REMINDERS
          </div>

          <h1
            className={`font-display font-black text-[#284B63] uppercase tracking-tight leading-none drop-shadow-[0_1px_12px_rgba(255,255,255,0.9)] ${
              seniorMode ? 'text-5xl sm:text-6xl lg:text-7xl' : 'text-4xl sm:text-5xl lg:text-6xl'
            }`}
          >
            THINGS TO REMEMBER
          </h1>

          <p
            className={`font-body font-medium text-[#353535] tracking-wide ${
              seniorMode ? 'text-xl sm:text-2xl' : 'text-lg sm:text-xl'
            }`}
          >
            Small reminders for everyday life.
          </p>
        </div>

        {/* Long-term Memory Points Card */}
        <div
          id="longterm-memory-points-pill"
          className="rounded-2xl bg-[#FFFFFF] border-[2.5px] border-[#D9D9D9] p-4 sm:p-5 shadow-xl flex items-center gap-4 shrink-0 text-[#284B63]"
        >
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-[#E8EFEF] border border-[#D9D9D9] flex items-center justify-center text-[#3C6E71] shadow-xs">
            <Award className="w-7 h-7 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#3C6E71]">
              <Sparkles className="w-3.5 h-3.5 text-[#3C6E71]" />
              <span>Long-Term Memory Points</span>
            </div>
            <div
              className={`font-display font-black text-[#284B63] leading-none mt-1 ${
                seniorMode ? 'text-3xl sm:text-4xl' : 'text-2xl sm:text-3xl'
              }`}
            >
              {memoryPoints}{' '}
              <span className="text-xs font-bold text-[#353535] uppercase tracking-widest">
                PTS
              </span>
            </div>
            <p className="text-[11px] font-semibold text-[#353535] mt-0.5">
              Awarded for mindful recall & games
            </p>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* 2. SECTION 2: IMPORTANT REMINDERS (Time-Sensitive, Critical) */}
      {/* Placed prominently at top so critical health items are never missed */}
      {/* --------------------------------------------------------------------- */}
      <section
        id="section-important-reminders"
        aria-label="Important Reminders"
        className="rounded-[32px] bg-[#FFFFFF] border-[3px] border-[#D9D9D9] shadow-2xl p-6 sm:p-8 space-y-6 text-[#284B63] relative overflow-hidden"
      >
        {/* Top Ribbon Motif */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#284B63] via-[#3C6E71] to-[#D9D9D9]" />

        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-[#3C6E71] uppercase">
              <Bell className="w-4 h-4 text-[#3C6E71] fill-[#3C6E71]" />
              <span>{t('critical_time_sensitive', 'Critical & Time-Sensitive')}</span>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2
                className={`font-display font-black text-[#284B63] uppercase tracking-tight ${
                  seniorMode ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'
                }`}
              >
                {t('important_reminders', 'Important Reminders')}
              </h2>
              <ListenAloudButton
                textToSpeak={`${t('important_reminders', 'Important Reminders')}. ${t('important_reminders_sub', 'Medicine, doctor visits, hydration, and events. Completing on or before scheduled time awards 25 Memory Points.')}`}
                currentLang={language}
                variant="subtle"
                size="sm"
              />
            </div>
            <p className="text-xs sm:text-sm text-[#353535] font-medium max-w-xl">
              {t('important_reminders_sub', 'Medicine, doctor visits, hydration, and events. Completing on or before scheduled time awards +25 Memory Points.')}
            </p>
          </div>

          {/* Add Reminder Button */}
          <button
            id="btn-add-important-reminder"
            onClick={handleOpenAddReminder}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#284B63] hover:bg-[#3C6E71] text-[#FFFFFF] font-bold text-sm sm:text-base shadow-md transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
            <span>{t('add_reminder', 'Add Reminder')}</span>
          </button>
        </div>

        {/* Reminders List */}
        <div className="space-y-3.5">
          {reminders.length === 0 ? (
            <div className="text-center py-10 px-4 rounded-2xl bg-[#F7F8F9] border border-[#D9D9D9] text-[#353535]">
              <Bell className="w-10 h-10 mx-auto text-[#3C6E71]/60 mb-2" />
              <p className="font-bold text-base text-[#284B63]">No important reminders scheduled.</p>
              <p className="text-xs text-[#353535] mt-1">Tap &ldquo;Add Reminder&rdquo; to add medicine, appointments or hydration.</p>
            </div>
          ) : (
            reminders.map((item, idx) => {
              const status = calculateReminderStatus(item, currentMinutesNow);
              const badge = getCategoryBadge(item.category);
              const pending = pendingCompletions[item.id];
              const isPending = Boolean(pending);

              // Status visual configurations
              let statusBorder = 'border-[#D9D9D9]';
              let statusCardBg = 'bg-white';
              let statusTag = (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#EAEFF3] text-[#284B63] border border-[#D9D9D9] text-xs font-bold">
                  <Clock className="w-3.5 h-3.5 text-[#3C6E71]" />
                  <span>Upcoming</span>
                </span>
              );

              if (isPending || item.isCompleted) {
                statusBorder = 'border-[#3C6E71] bg-[#E8EFEF] shadow-md ring-2 ring-[#3C6E71]/25';
                statusCardBg = 'bg-[#E8EFEF]';
                statusTag = (
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#FFFFFF] text-[#284B63] border border-[#3C6E71] text-xs font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#3C6E71]" />
                    <span>{isPending ? `Completing (${pending?.secondsRemaining}s)` : 'Completed'}</span>
                  </span>
                );
              } else if (status === 'missed') {
                statusBorder = 'border-[#B87A74]';
                statusCardBg = 'bg-[#F4E6E4]/75';
                statusTag = (
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#F4E6E4] text-[#5C2323] border border-[#B87A74] text-xs font-bold animate-pulse">
                    <AlertCircle className="w-3.5 h-3.5 text-[#8C3B3B]" />
                    <span>Missed</span>
                  </span>
                );
              }

              return (
                <div
                  key={item.id}
                  id={`reminder-item-${idx}`}
                  className={`rounded-2xl border-[2px] ${statusBorder} ${statusCardBg} p-4 sm:p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-3`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Left: Icon, Time, Title, Notes */}
                    <div className="flex items-start gap-4 flex-1">
                      {/* Category Icon */}
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#F2F4F5] border border-[#D9D9D9] flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                        {getCategoryIcon(item.category)}
                      </div>

                      <div className="space-y-1">
                        {/* Meta chips: Time + Category + Status */}
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Time chip */}
                          <div className="flex items-center gap-1 px-3 py-1 rounded-xl bg-[#284B63] text-[#FFFFFF] text-xs font-black tracking-wide shadow-xs">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{item.timeString}</span>
                          </div>

                          {/* Category tag */}
                          <span
                            className={`px-2.5 py-0.5 rounded-lg border text-[11px] font-bold uppercase tracking-wider ${badge.bg}`}
                          >
                            {badge.label}
                          </span>

                          {/* Status chip */}
                          {statusTag}
                        </div>

                        {/* Reminder Title & Listen Aloud Button */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3
                            className={`font-display font-bold text-[#284B63] ${
                              isPending || item.isCompleted ? 'line-through text-[#353535]/70' : ''
                            } ${seniorMode ? 'text-xl sm:text-2xl' : 'text-lg sm:text-xl'}`}
                          >
                            {item.title}
                          </h3>
                          <ListenAloudButton
                            textToSpeak={`${item.title}. ${item.timeString}. ${item.notes ? item.notes : ''}`}
                            currentLang={language}
                            size="sm"
                            variant="subtle"
                          />
                        </div>

                        {/* Notes / Instructions */}
                        {item.notes && (
                          <p className="text-xs sm:text-sm text-[#353535] font-medium">
                            {item.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right Actions: Complete Checkbox + Edit + Delete */}
                    <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-[#D9D9D9]">
                      {/* Big Complete / Mark Done Button with 5s Undo */}
                      {isPending ? (
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <div className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#3C6E71] text-[#FFFFFF] font-bold text-sm shadow-xs">
                            <Check className="w-5 h-5 stroke-[3]" />
                            <span>Completed</span>
                          </div>
                          <button
                            id={`btn-undo-reminder-${item.id}`}
                            onClick={() => handleUndoCompletion(item.id)}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#3C6E71] hover:bg-[#284B63] text-[#FFFFFF] font-black text-sm sm:text-base border-2 border-[#284B63] shadow-md cursor-pointer transition-all active:scale-95 animate-pulse min-h-[44px]"
                            aria-label={`Undo completion for ${item.title}. ${pending.secondsRemaining} seconds remaining`}
                          >
                            <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                            <span>Undo ({pending.secondsRemaining}s)</span>
                          </button>
                        </div>
                      ) : (
                        <button
                          id={`btn-complete-reminder-${idx}`}
                          onClick={() => handleStartCompleteReminder(item)}
                          className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold transition-all cursor-pointer shadow-xs min-h-[48px] ${
                            status === 'missed'
                              ? 'bg-[#8C3B3B] hover:bg-[#742F2F] text-[#FFFFFF] animate-pulse'
                              : 'bg-[#284B63] hover:bg-[#3C6E71] text-[#FFFFFF]'
                          } ${seniorMode ? 'text-base' : 'text-sm'}`}
                        >
                          {status === 'missed' ? (
                            <>
                              <AlertCircle className="w-5 h-5" />
                              <span>Take Now (Complete)</span>
                            </>
                          ) : (
                            <>
                              <Check className="w-5 h-5 stroke-[2.5]" />
                              <span>Completed</span>
                            </>
                          )}
                        </button>
                      )}

                      {!isPending && (
                        <div className="flex items-center gap-1.5">
                          {/* Edit */}
                          <button
                            onClick={() => handleOpenEditReminder(item)}
                            title="Edit Reminder"
                            aria-label="Edit reminder"
                            className="p-2.5 rounded-xl bg-white border border-[#D9D9D9] hover:bg-[#EFEFEF] text-[#284B63] cursor-pointer transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteReminder(item.id)}
                            title="Delete Reminder"
                            aria-label="Delete reminder"
                            className="p-2.5 rounded-xl bg-white border border-[#D9D9D9] hover:bg-[#F4E6E4] hover:border-[#B87A74] text-[#8C3B3B] cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 5-Second Undo Progress Notice */}
                  {isPending && (
                    <div className="w-full mt-2 pt-2 border-t border-[#3C6E71]/35 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#284B63] font-bold">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-[#3C6E71] shrink-0" />
                        <span>
                          {pending.pointsPotential > 0
                            ? `+${pending.pointsPotential} Memory Points will be awarded in ${pending.secondsRemaining}s...`
                            : `Permanently archiving in ${pending.secondsRemaining}s (tap Undo to cancel)...`}
                        </span>
                      </div>
                      <div className="w-full sm:w-44 h-2.5 rounded-full bg-[#D9D9D9] overflow-hidden shrink-0">
                        <div
                          className="h-full bg-[#3C6E71] transition-all duration-200 ease-linear rounded-full"
                          style={{ width: `${(pending.secondsRemaining / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 3. SECTION 1: MY TO-DOS (Simple Personal Tasks) */}
      {/* --------------------------------------------------------------------- */}
      <section
        id="section-my-todos"
        aria-label="My To-Dos"
        className="rounded-[32px] bg-[#FFFFFF] border-[3px] border-[#D9D9D9] shadow-2xl p-6 sm:p-8 space-y-6 text-[#284B63] relative overflow-hidden"
      >
        {/* Top Decorative Diamond Accent Strip */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-center gap-2 py-1 bg-[#F2F4F5] border-b border-[#D9D9D9] text-[#353535] select-none text-[9px] font-black">
          ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦
        </div>

        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-[#3C6E71] uppercase">
              <Footprints className="w-4 h-4 text-[#3C6E71]" />
              <span>{t('section_daily_tasks', 'Section 1 • Daily Personal Tasks')}</span>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2
                className={`font-display font-black text-[#284B63] uppercase tracking-tight ${
                  seniorMode ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'
                }`}
              >
                {t('my_todos', 'My To-Dos')}
              </h2>
              <ListenAloudButton
                textToSpeak={`${t('my_todos', 'My To-Dos')}. ${t('todos_desc', 'Gentle personal rhythms: walk, water plants, call family, read, or hobby. Add, edit, check off, and feel the joy of everyday presence.')}`}
                currentLang={language}
                variant="subtle"
                size="sm"
              />
            </div>
            <p className="text-xs sm:text-sm text-[#353535] font-medium max-w-xl">
              {t('todos_desc', 'Gentle personal rhythms: walk, water plants, call family, read, or hobby. Add, edit, check off, and feel the joy of everyday presence.')}
            </p>
          </div>

          {/* Add To-Do Button */}
          <button
            id="btn-add-todo"
            onClick={handleOpenAddTodo}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#284B63] hover:bg-[#3C6E71] text-[#FFFFFF] font-bold text-sm sm:text-base shadow-md transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
            <span>{t('add_todo', 'Add To-Do')}</span>
          </button>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1 pb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-[#353535] mr-1">
            Suggestions:
          </span>
          {[
            { label: 'Morning walk', cat: 'walk' as TodoCategory, icon: '🚶' },
            { label: 'Water plants', cat: 'plants' as TodoCategory, icon: '🌿' },
            { label: 'Call family', cat: 'family' as TodoCategory, icon: '📞' },
            { label: 'Read book', cat: 'read' as TodoCategory, icon: '📖' },
            { label: 'Hobby time', cat: 'hobby' as TodoCategory, icon: '🧶' },
          ].map((sug) => (
            <button
              key={sug.label}
              onClick={() => {
                playDropSound();
                setTodoTitle(sug.label);
                setTodoCategory(sug.cat);
                setEditingTodo(null);
                setShowAddTodoModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#D9D9D9] hover:bg-[#EFEFEF] text-xs font-bold text-[#284B63] cursor-pointer shadow-2xs"
            >
              <span>{sug.icon}</span>
              <span>{sug.label}</span>
            </button>
          ))}
        </div>

        {/* To-Do List Items */}
        <div className="space-y-3">
          {todos.length === 0 ? (
            <div className="text-center py-10 px-4 rounded-2xl bg-[#F7F8F9] border border-[#D9D9D9] text-[#353535]">
              <Footprints className="w-10 h-10 mx-auto text-[#3C6E71] mb-2" />
              <p className="font-bold text-base text-[#284B63]">Your personal task list is clear.</p>
              <p className="text-xs text-[#353535] mt-1">Tap &ldquo;Add To-Do&rdquo; to add a pleasant activity.</p>
            </div>
          ) : (
            todos.map((todo, idx) => {
              const pending = pendingCompletions[todo.id];
              const isPending = Boolean(pending);
              const isCompletedOrPending = todo.isCompleted || isPending;

              return (
                <div
                  key={todo.id}
                  id={`todo-item-${idx}`}
                  className={`rounded-2xl border-[2px] ${
                    isCompletedOrPending
                      ? 'border-[#3C6E71] bg-[#E8EFEF] shadow-sm ring-2 ring-[#3C6E71]/25'
                      : 'border-[#D9D9D9] bg-white hover:border-[#3C6E71]'
                  } p-4 sm:p-5 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between gap-3`}
                >
                  <div className="flex items-center justify-between gap-4">
                    {/* Left: Big Circular Checkbox + Title */}
                    <div className="flex items-center gap-4 flex-1">
                      {/* Big Checkbox */}
                      <button
                        id={`btn-checkbox-todo-${idx}`}
                        onClick={() => handleToggleTodo(todo.id)}
                        aria-label={isCompletedOrPending ? 'Tap to undo' : 'Mark completed'}
                        className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all cursor-pointer border-[2px] shrink-0 ${
                          isCompletedOrPending
                            ? 'bg-[#3C6E71] border-[#284B63] text-[#FFFFFF] shadow-xs'
                            : 'bg-[#F7F8F9] border-[#D9D9D9] hover:border-[#3C6E71] text-transparent'
                        }`}
                      >
                        <Check className="w-6 h-6 stroke-[3.5]" />
                      </button>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[#353535] bg-[#F7F8F9] px-2 py-0.5 rounded border border-[#D9D9D9]">
                            {getTodoCategoryIcon(todo.category)}
                            <span>{todo.category || 'general'}</span>
                          </span>
                          {isPending ? (
                            <span className="text-xs font-black text-[#284B63] flex items-center gap-1 bg-[#FFFFFF] px-2 py-0.5 rounded-lg border border-[#3C6E71]">
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#3C6E71]" />
                              Completing in {pending.secondsRemaining}s...
                            </span>
                          ) : todo.isCompleted ? (
                            <span className="text-xs font-black text-[#353535] flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#3C6E71]" />
                              Completed (+10 Pts)
                            </span>
                          ) : null}
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <h3
                            className={`font-display font-bold text-[#284B63] ${
                              isCompletedOrPending ? 'line-through text-[#353535]/75' : ''
                            } ${seniorMode ? 'text-xl sm:text-2xl' : 'text-base sm:text-lg'}`}
                          >
                            {todo.title}
                          </h3>
                          <ListenAloudButton
                            textToSpeak={`${todo.title}. ${todo.category || ''}`}
                            currentLang={language}
                            size="sm"
                            variant="subtle"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Right: Undo / Edit & Delete */}
                    <div className="flex items-center gap-2 shrink-0">
                      {isPending ? (
                        <button
                          id={`btn-undo-todo-${todo.id}`}
                          onClick={() => handleUndoCompletion(todo.id)}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#3C6E71] hover:bg-[#284B63] text-[#FFFFFF] font-black text-xs sm:text-sm border-2 border-[#284B63] shadow-sm cursor-pointer transition-all active:scale-95 animate-pulse min-h-[42px]"
                          aria-label={`Undo completion for ${todo.title}. ${pending.secondsRemaining} seconds remaining`}
                        >
                          <RotateCcw className="w-4 h-4 stroke-[2.5]" />
                          <span>Undo ({pending.secondsRemaining}s)</span>
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => handleOpenEditTodo(todo)}
                            title="Edit Task"
                            aria-label="Edit task"
                            className="p-2.5 rounded-xl bg-white border border-[#D9D9D9] hover:bg-[#EFEFEF] text-[#284B63] cursor-pointer transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDeleteTodo(todo.id)}
                            title="Delete Task"
                            aria-label="Delete task"
                            className="p-2.5 rounded-xl bg-white border border-[#D9D9D9] hover:bg-[#F4E6E4] hover:border-[#B87A74] text-[#8C3B3B] cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* 5-Second Undo Progress Notice */}
                  {isPending && (
                    <div className="w-full mt-2 pt-2 border-t border-[#3C6E71]/35 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs text-[#284B63] font-bold">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-[#3C6E71] shrink-0" />
                        <span>+10 Memory Points will be awarded in {pending.secondsRemaining}s...</span>
                      </div>
                      <div className="w-full sm:w-36 h-2 rounded-full bg-[#D9D9D9] overflow-hidden shrink-0">
                        <div
                          className="h-full bg-[#3C6E71] transition-all duration-200 ease-linear rounded-full"
                          style={{ width: `${(pending.secondsRemaining / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 4. COMPLETED TODAY ARCHIVE (Auto-organized, Non-cluttering) */}
      {/* --------------------------------------------------------------------- */}
      {completedArchive.length > 0 && (
        <section
          aria-labelledby="completed-archive-heading"
          className="rounded-[28px] bg-[#FFFFFF]/95 border border-[#D9D9D9] p-4 sm:p-6 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#E8EFEF] border border-[#3C6E71] flex items-center justify-center text-[#284B63] shrink-0">
                <CheckCircle2 className="w-5 h-5 text-[#3C6E71]" />
              </div>
              <div>
                <h2
                  id="completed-archive-heading"
                  className="font-display font-black text-[#284B63] text-base sm:text-lg uppercase tracking-wide flex items-center gap-2"
                >
                  <span>Completed Today</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#284B63] text-[#FFFFFF] text-xs font-bold">
                    {completedArchive.length}
                  </span>
                </h2>
                <p className="text-xs text-[#353535]">
                  Tasks are safely archived here once the 5-second window completes.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowCompletedHistory((prev) => !prev)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#D9D9D9] bg-white hover:bg-[#EFEFEF] text-xs font-bold text-[#284B63] cursor-pointer transition-colors"
            >
              <span>{showCompletedHistory ? 'Hide' : 'View'}</span>
              {showCompletedHistory ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>

          {showCompletedHistory && (
            <div className="space-y-2.5 pt-2 border-t border-[#D9D9D9]">
              {completedArchive.map((archived) => {
                const dateStr = new Date(archived.completedAt).toLocaleTimeString([], {
                  hour: 'numeric',
                  minute: '2-digit',
                });
                return (
                  <div
                    key={archived.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-[#EAEFF3]/80 border border-[#D9D9D9] text-[#284B63]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-[#3C6E71] text-[#FFFFFF] flex items-center justify-center shrink-0">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs uppercase font-bold text-[#353535] bg-white px-2 py-0.5 rounded border border-[#D9D9D9]">
                            {archived.type === 'reminder' ? 'Reminder' : 'To-Do'}
                          </span>
                          <span className="text-xs text-[#3C6E71] font-bold">
                            Completed at {dateStr}
                          </span>
                          {archived.pointsAwarded > 0 && (
                            <span className="text-xs font-black text-[#284B63] bg-[#FFFFFF] px-2 py-0.5 rounded-full border border-[#D9D9D9]">
                              +{archived.pointsAwarded} PTS
                            </span>
                          )}
                        </div>
                        <p className="font-bold text-[#284B63] text-sm mt-0.5">{archived.title}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => handleRestoreArchived(archived.id)}
                        title="Restore back to active list"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#D9D9D9] hover:bg-[#EFEFEF] text-xs font-bold text-[#284B63] cursor-pointer transition-colors shadow-xs"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restore to Active</span>
                      </button>

                      <button
                        onClick={() => handleDeleteArchived(archived.id)}
                        title="Delete permanently from archive"
                        aria-label="Delete permanently from archive"
                        className="p-1.5 rounded-lg bg-white border border-[#D9D9D9] hover:bg-[#F4E6E4] hover:border-[#B87A74] text-[#8C3B3B] cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* 5. GENTLE MINDFUL QUOTE FOOTER */}
      {/* --------------------------------------------------------------------- */}
      <div className="text-center pt-2 pb-6">
        <p className="font-editorial italic text-[#353535] text-sm sm:text-base max-w-xl mx-auto">
          “When we remember small things with calm awareness, the river of memory flows clear and
          unhindered like mountain snowmelt.”
        </p>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* 6. FLOATING 5-SECOND UNDO BANNER (Global Elderly-Friendly Prominent Notice) */}
      {/* --------------------------------------------------------------------- */}
      {(Object.values(pendingCompletions) as PendingTaskCompletion[]).map((pending) => (
        <div
          key={`floating-undo-${pending.id}`}
          role="alert"
          aria-live="assertive"
          className="fixed bottom-20 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 rounded-2xl bg-[#284B63] text-[#FFFFFF] border-2 border-[#3C6E71] p-4 shadow-2xl flex items-center justify-between gap-3 animate-in slide-in-from-bottom-5"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-[#3C6E71] text-[#FFFFFF] flex items-center justify-center font-black text-lg shrink-0 shadow-xs animate-pulse">
              {pending.secondsRemaining}s
            </div>
            <div className="min-w-0">
              <p className="text-xs text-[#D9D9D9] font-bold uppercase tracking-wider">
                Marked Completed (Undo in {pending.secondsRemaining}s)
              </p>
              <p className="text-sm font-black truncate text-[#FFFFFF]">{pending.title}</p>
            </div>
          </div>
          <button
            id={`floating-btn-undo-${pending.id}`}
            onClick={() => handleUndoCompletion(pending.id)}
            className="px-4 py-2.5 rounded-xl bg-[#FFFFFF] hover:bg-[#D9D9D9] text-[#284B63] font-black text-sm border-2 border-[#D9D9D9] shadow-md cursor-pointer transition-transform active:scale-95 flex items-center gap-1.5 shrink-0"
          >
            <RotateCcw className="w-4 h-4 stroke-[2.5]" />
            <span>Undo</span>
          </button>
        </div>
      ))}

      {/* --------------------------------------------------------------------- */}
      {/* 7. MEMORY POINTS FEEDBACK ANIMATION / FLOATING TOAST */}
      {/* --------------------------------------------------------------------- */}
      {feedbackToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 max-w-md w-[calc(100%-3rem)] rounded-[24px] bg-[#FFFFFF] border-[3px] border-[#D9D9D9] shadow-2xl p-5 text-[#284B63] animate-in slide-in-from-bottom-5 fade-in duration-300 overflow-hidden"
        >
          {/* Top colored accent */}
          <div
            className={`absolute top-0 left-0 right-0 h-1.5 ${
              feedbackToast.pointsAwarded > 0
                ? 'bg-gradient-to-r from-[#284B63] via-[#3C6E71] to-[#D9D9D9]'
                : 'bg-[#D9D9D9]'
            }`}
          />

          <div className="flex items-start gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                feedbackToast.pointsAwarded > 0
                  ? 'bg-[#E8EFEF] text-[#3C6E71] border border-[#D9D9D9]'
                  : 'bg-[#EAEFF3] text-[#284B63] border border-[#D9D9D9]'
              }`}
            >
              {feedbackToast.pointsAwarded > 0 ? (
                <Sparkles className="w-6 h-6 stroke-[2.5]" />
              ) : (
                <Check className="w-6 h-6 stroke-[2.5]" />
              )}
            </div>

            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#3C6E71]">
                  {feedbackToast.pointsAwarded > 0 ? 'Memory Points Awarded!' : 'Completed'}
                </span>
                {feedbackToast.pointsAwarded > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-[#E8EFEF] text-[#284B63] font-display font-black text-sm border border-[#3C6E71] animate-bounce">
                    +{feedbackToast.pointsAwarded} PTS
                  </span>
                )}
              </div>

              <p className="text-sm font-bold text-[#284B63] leading-snug">
                {feedbackToast.reminder.title}
              </p>
              <p className="text-xs text-[#353535]">{feedbackToast.message}</p>
            </div>

            <button
              onClick={() => setFeedbackToast(null)}
              aria-label="Close notification"
              className="p-1 text-[#353535] hover:text-[#284B63] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* 6. MODAL: ADD / EDIT TO-DO */}
      {/* --------------------------------------------------------------------- */}
      {showAddTodoModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="To-Do Item Dialog"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#284B63]/75 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="w-full max-w-lg rounded-[28px] bg-[#FFFFFF] border-[3px] border-[#D9D9D9] shadow-2xl p-6 sm:p-7 text-[#284B63] space-y-5 relative">
            <div className="flex items-center justify-between border-b border-[#D9D9D9] pb-3">
              <h3 className="font-display font-black text-xl text-[#284B63] uppercase">
                {editingTodo ? 'Edit To-Do' : 'Add Personal To-Do'}
              </h3>
              <button
                onClick={() => setShowAddTodoModal(false)}
                className="p-2 rounded-xl text-[#353535] hover:bg-[#EFEFEF] cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTodo} className="space-y-4">
              {/* Task Title */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#284B63]">
                  Task Description:
                </label>
                <input
                  type="text"
                  required
                  value={todoTitle}
                  onChange={(e) => setTodoTitle(e.target.value)}
                  placeholder="e.g. Morning walk, water plants, call family..."
                  className="w-full px-4 py-3.5 rounded-xl bg-white border-2 border-[#D9D9D9] text-base font-semibold text-[#284B63] focus:outline-hidden focus:border-[#3C6E71]"
                />
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#284B63]">
                  Category:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'walk', label: 'Walk', icon: '🚶' },
                    { id: 'plants', label: 'Plants', icon: '🌿' },
                    { id: 'family', label: 'Family', icon: '📞' },
                    { id: 'read', label: 'Read', icon: '📖' },
                    { id: 'hobby', label: 'Hobby', icon: '🧶' },
                    { id: 'general', label: 'Other', icon: '✨' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setTodoCategory(cat.id as TodoCategory)}
                      className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                        todoCategory === cat.id
                          ? 'bg-[#284B63] text-[#FFFFFF] border-[#284B63]'
                          : 'bg-white text-[#284B63] border-[#D9D9D9] hover:bg-[#EFEFEF]'
                      }`}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {todoFormError && (
                <p role="alert" className="text-xs font-bold text-[#5C2323] bg-[#F4E6E4] border border-[#B87A74] rounded-xl px-3 py-2">
                  {todoFormError}
                </p>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 pt-3">
                <button
                  type="submit"
                  className="flex-1 py-3.5 px-5 rounded-xl bg-[#284B63] hover:bg-[#3C6E71] text-[#FFFFFF] font-bold text-base shadow-md cursor-pointer transition-colors"
                >
                  {editingTodo ? 'Save Changes' : 'Add To-Do'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddTodoModal(false)}
                  className="py-3.5 px-5 rounded-xl bg-white border border-[#D9D9D9] hover:bg-[#EFEFEF] text-[#284B63] font-bold text-base cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* 7. MODAL: ADD / EDIT IMPORTANT REMINDER */}
      {/* --------------------------------------------------------------------- */}
      {showAddReminderModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Important Reminder Dialog"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#284B63]/75 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="w-full max-w-lg rounded-[28px] bg-[#FFFFFF] border-[3px] border-[#D9D9D9] shadow-2xl p-6 sm:p-7 text-[#284B63] space-y-5 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#D9D9D9] pb-3">
              <h3 className="font-display font-black text-xl text-[#284B63] uppercase">
                {editingReminder ? 'Edit Important Reminder' : 'Add Important Reminder'}
              </h3>
              <button
                onClick={() => setShowAddReminderModal(false)}
                className="p-2 rounded-xl text-[#353535] hover:bg-[#EFEFEF] cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveReminder} className="space-y-4">
              {/* Category */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#284B63]">
                  Reminder Type:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'medicine', label: '💊 Medicine' },
                    { id: 'doctor', label: '🩺 Doctor Visit' },
                    { id: 'hydration', label: '💧 Hydration' },
                    { id: 'event', label: '📅 Event' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setReminderCategory(cat.id as ReminderCategory)}
                      className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold border transition-colors cursor-pointer ${
                        reminderCategory === cat.id
                          ? 'bg-[#284B63] text-[#FFFFFF] border-[#284B63]'
                          : 'bg-white text-[#284B63] border-[#D9D9D9] hover:bg-[#EFEFEF]'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#284B63]">
                  Title:
                </label>
                <input
                  type="text"
                  required
                  value={reminderTitle}
                  onChange={(e) => setReminderTitle(e.target.value)}
                  placeholder="e.g. Blood pressure medicine, clinic visit..."
                  className="w-full px-4 py-3 rounded-xl bg-white border-2 border-[#D9D9D9] text-base font-semibold text-[#284B63] focus:outline-hidden focus:border-[#3C6E71]"
                />
              </div>

              {/* Time */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#284B63]">
                  Time (e.g. 09:00 AM, 02:30 PM):
                </label>
                <input
                  type="text"
                  required
                  value={reminderTimeStr}
                  onChange={(e) => setReminderTimeStr(e.target.value)}
                  placeholder="09:00 AM"
                  className="w-full px-4 py-3 rounded-xl bg-white border-2 border-[#D9D9D9] text-base font-semibold text-[#284B63] focus:outline-hidden focus:border-[#3C6E71]"
                />
                {/* Time Quick-Picks */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {['08:00 AM', '09:00 AM', '11:30 AM', '02:00 PM', '05:30 PM', '08:00 PM'].map(
                    (t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setReminderTimeStr(t)}
                        className="text-xs px-2.5 py-1 rounded-lg bg-white border border-[#D9D9D9] hover:bg-[#EFEFEF] text-[#284B63] font-bold cursor-pointer"
                      >
                        {t}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#284B63]">
                  Notes / Instructions (Optional):
                </label>
                <input
                  type="text"
                  value={reminderNotes}
                  onChange={(e) => setReminderNotes(e.target.value)}
                  placeholder="e.g. Take with warm water after food"
                  className="w-full px-4 py-3 rounded-xl bg-white border-2 border-[#D9D9D9] text-sm text-[#284B63] focus:outline-hidden focus:border-[#3C6E71]"
                />
              </div>

              {reminderFormError && (
                <p role="alert" className="text-xs font-bold text-[#5C2323] bg-[#F4E6E4] border border-[#B87A74] rounded-xl px-3 py-2">
                  {reminderFormError}
                </p>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 pt-3">
                <button
                  type="submit"
                  className="flex-1 py-3.5 px-5 rounded-xl bg-[#284B63] hover:bg-[#3C6E71] text-[#FFFFFF] font-bold text-base shadow-md cursor-pointer transition-colors"
                >
                  {editingReminder ? 'Save Changes' : 'Schedule Reminder'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddReminderModal(false)}
                  className="py-3.5 px-5 rounded-xl bg-white border border-[#D9D9D9] hover:bg-[#EFEFEF] text-[#284B63] font-bold text-base cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
