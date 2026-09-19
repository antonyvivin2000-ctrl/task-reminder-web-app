import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Task = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  priority: 'low' | 'medium' | 'high';
  deadline: string | null;
  completed: boolean;
  completed_at: string | null;
  notified: boolean;
  created_at: string;
  updated_at: string;
};

export type TaskInsert = {
  title: string;
  description?: string | null;
  priority?: 'low' | 'medium' | 'high';
  deadline?: string | null;
};

export type TaskUpdate = {
  title?: string;
  description?: string | null;
  priority?: 'low' | 'medium' | 'high';
  deadline?: string | null;
  completed?: boolean;
  completed_at?: string | null;
  notified?: boolean;
};
