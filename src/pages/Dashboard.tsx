import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase, type Task, type TaskInsert } from '@/lib/supabase';
import TaskFormModal from '@/components/TaskFormModal';
import NotificationBanner from '@/components/NotificationBanner';
import {
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  Calendar,
  LogOut,
  ListTodo,
} from 'lucide-react';

type FilterType = 'all' | 'active' | 'completed';
type SortType = 'priority' | 'deadline' | 'created';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('priority');
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setTasks(data as Task[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleSave = async (data: TaskInsert) => {
    if (editingTask) {
      const { error } = await supabase
        .from('tasks')
        .update({
          title: data.title,
          description: data.description,
          priority: data.priority,
          deadline: data.deadline,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingTask.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('tasks').insert({
        title: data.title,
        description: data.description,
        priority: data.priority ?? 'medium',
        deadline: data.deadline,
      });
      if (error) throw error;
    }
    setModalOpen(false);
    setEditingTask(null);
    await fetchTasks();
  };

  const handleToggleComplete = async (task: Task) => {
    const completed = !task.completed;
    const { error } = await supabase
      .from('tasks')
      .update({
        completed,
        completed_at: completed ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', task.id);
    if (error) {
      setError(error.message);
      return;
    }
    await fetchTasks();
  };

  const handleDelete = async (task: Task) => {
    const { error } = await supabase.from('tasks').delete().eq('id', task.id);
    if (error) {
      setError(error.message);
      return;
    }
    await fetchTasks();
  };

  const handleDismissNotification = async (task: Task) => {
    const { error } = await supabase
      .from('tasks')
      .update({ notified: true })
      .eq('id', task.id);
    if (error) return;
    await fetchTasks();
  };

  const openEdit = (task: Task) => {
    setEditingTask(task);
    setModalOpen(true);
  };

  const openNew = () => {
    setEditingTask(null);
    setModalOpen(true);
  };

  // Filtering and sorting
  const filteredTasks = tasks
    .filter((t) => {
      if (filter === 'active') return !t.completed;
      if (filter === 'completed') return t.completed;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'priority') {
        const order = { high: 0, medium: 1, low: 2 };
        return order[a.priority] - order[b.priority];
      }
      if (sortBy === 'deadline') {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const stats = {
    total: tasks.length,
    active: tasks.filter((t) => !t.completed).length,
    completed: tasks.filter((t) => t.completed).length,
    overdue: tasks.filter(
      (t) => !t.completed && t.deadline && new Date(t.deadline) < new Date()
    ).length,
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
              <ListTodo className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900">TaskMinder</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500 hidden sm:block truncate max-w-[200px]">
              {user?.email}
            </span>
            <button
              onClick={signOut}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard label="Total" value={stats.total} icon={<ListTodo className="w-4 h-4" />} color="blue" />
          <StatCard label="Active" value={stats.active} icon={<Circle className="w-4 h-4" />} color="amber" />
          <StatCard label="Completed" value={stats.completed} icon={<CheckCircle2 className="w-4 h-4" />} color="emerald" />
          <StatCard label="Overdue" value={stats.overdue} icon={<AlertTriangle className="w-4 h-4" />} color="red" />
        </div>

        {/* Notifications */}
        <NotificationBanner tasks={tasks} onDismiss={handleDismissNotification} />

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5 items-stretch sm:items-center justify-between">
          <div className="flex gap-2">
            {(['all', 'active', 'completed'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium capitalize transition ${
                  filter === f
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="flex gap-2 items-center">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortType)}
              className="px-3 py-2 rounded-lg text-sm font-medium bg-white border border-slate-200 text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="priority">Sort: Priority</option>
              <option value="deadline">Sort: Deadline</option>
              <option value="created">Sort: Newest</option>
            </select>
            <button
              onClick={openNew}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition shadow-sm whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              New Task
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Task list */}
        {loading ? (
          <div className="text-center py-16 text-slate-400">Loading your tasks...</div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
              <ListTodo className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-500 font-medium mb-1">
              {filter === 'completed' ? 'No completed tasks yet' : filter === 'active' ? 'No active tasks' : 'No tasks yet'}
            </p>
            <p className="text-slate-400 text-sm mb-4">
              {filter === 'all' ? 'Create your first task to get started.' : 'Try a different filter.'}
            </p>
            {filter === 'all' && (
              <button
                onClick={openNew}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition"
              >
                <Plus className="w-4 h-4" />
                Create a task
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggle={() => handleToggleComplete(task)}
                onEdit={() => openEdit(task)}
                onDelete={() => handleDelete(task)}
              />
            ))}
          </div>
        )}
      </main>

      {modalOpen && (
        <TaskFormModal
          task={editingTask}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditingTask(null); }}
        />
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: 'blue' | 'amber' | 'emerald' | 'red';
}) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    red: 'bg-red-50 text-red-600',
  };
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colors[color]}`}>
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold text-slate-900 leading-none">{value}</div>
        <div className="text-xs text-slate-500 mt-1">{label}</div>
      </div>
    </div>
  );
}

function TaskCard({
  task,
  onToggle,
  onEdit,
  onDelete,
}: {
  task: Task;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isOverdue =
    !task.completed && task.deadline && new Date(task.deadline) < new Date();

  const priorityStyles = {
    high: 'bg-red-100 text-red-700 border-red-200',
    medium: 'bg-amber-100 text-amber-700 border-amber-200',
    low: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  };

  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 p-4 flex items-start gap-3 group transition hover:shadow-md ${
        task.completed ? 'opacity-60' : ''
      }`}
    >
      <button
        onClick={onToggle}
        className="mt-0.5 flex-shrink-0 text-slate-400 hover:text-blue-600 transition"
      >
        {task.completed ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
        ) : (
          <Circle className="w-5 h-5" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3
            className={`font-medium text-slate-900 ${
              task.completed ? 'line-through text-slate-500' : ''
            }`}
          >
            {task.title}
          </h3>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${priorityStyles[task.priority]}`}
          >
            {task.priority}
          </span>
          {isOverdue && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Overdue
            </span>
          )}
        </div>
        {task.description && (
          <p className="text-sm text-slate-500 mt-1 line-clamp-2">{task.description}</p>
        )}
        {task.deadline && (
          <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400">
            <Calendar className="w-3.5 h-3.5" />
            <span className={isOverdue ? 'text-red-500 font-medium' : ''}>
              Due {formatDeadline(task.deadline)}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={onEdit}
          className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function formatDeadline(deadline: string): string {
  const date = new Date(deadline);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMs < 0) {
    return `overdue by ${Math.abs(diffDays)}d`;
  }
  if (diffHours < 1) {
    return `in less than 1h`;
  }
  if (diffHours < 24) {
    return `in ${Math.floor(diffHours)}h`;
  }
  if (diffDays === 1) return 'tomorrow';
  if (diffDays < 7) return `in ${diffDays}d`;

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
