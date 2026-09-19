import { useEffect, useState } from 'react';
import type { Task } from '@/lib/supabase';
import { Bell, X, Clock, AlertTriangle } from 'lucide-react';

type Props = {
  tasks: Task[];
  onDismiss: (task: Task) => void;
};

type Reminder = {
  task: Task;
  status: 'overdue' | 'due-soon';
};

export default function NotificationBanner({ tasks, onDismiss }: Props) {
  const [reminders, setReminders] = useState<Reminder[]>([]);

  useEffect(() => {
    const checkDeadlines = () => {
      const now = Date.now();
      const soon = now + 24 * 60 * 60 * 1000; // 24 hours from now

      const upcoming = tasks
        .filter((t) => !t.completed && !t.notified && t.deadline)
        .map((t) => {
          const deadlineMs = new Date(t.deadline!).getTime();
          if (deadlineMs < now) return { task: t, status: 'overdue' as const };
          if (deadlineMs <= soon) return { task: t, status: 'due-soon' as const };
          return null;
        })
        .filter((r): r is Reminder => r !== null);

      setReminders(upcoming);
    };

    checkDeadlines();
    const interval = setInterval(checkDeadlines, 60000); // re-check every minute

    return () => clearInterval(interval);
  }, [tasks]);

  if (reminders.length === 0) return null;

  return (
    <div className="mb-5 space-y-2">
      {reminders.map(({ task, status }) => (
        <div
          key={task.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
            status === 'overdue'
              ? 'bg-red-50 border-red-200'
              : 'bg-amber-50 border-amber-200'
          }`}
        >
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
              status === 'overdue' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
            }`}
          >
            {status === 'overdue' ? (
              <AlertTriangle className="w-5 h-5" />
            ) : (
              <Clock className="w-5 h-5" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">{task.title}</p>
            <p
              className={`text-xs ${
                status === 'overdue' ? 'text-red-600' : 'text-amber-600'
              }`}
            >
              {status === 'overdue'
                ? `This task is overdue — was due ${formatTime(task.deadline!)}`
                : `Due soon — ${formatTime(task.deadline!)}`}
            </p>
          </div>
          <button
            onClick={() => onDismiss(task)}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-white/60 hover:text-slate-600 transition flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

function formatTime(deadline: string): string {
  return new Date(deadline).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
