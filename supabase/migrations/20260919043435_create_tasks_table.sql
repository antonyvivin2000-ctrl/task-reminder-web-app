/*
# Create tasks table for task reminder app

1. New Tables
- `tasks`
  - `id` (uuid, primary key)
  - `user_id` (uuid, not null, defaults to authenticated user via auth.uid())
  - `title` (text, not null) - the task name
  - `description` (text, nullable) - optional details
  - `priority` (text, not null, default 'medium') - low | medium | high
  - `deadline` (timestamptz, nullable) - when the task is due
  - `completed` (boolean, not null, default false)
  - `completed_at` (timestamptz, nullable) - when the task was marked done
  - `notified` (boolean, not null, default false) - whether a deadline reminder was shown
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())
2. Security
- Enable RLS on `tasks`.
- Owner-scoped CRUD: each authenticated user can only access their own tasks.
- 4 separate policies (select/insert/update/delete) scoped to `authenticated`.
3. Indexes
- Index on `user_id` for per-user queries.
- Index on `deadline` for upcoming-deadline queries.
*/

CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  deadline timestamptz,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  notified boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_tasks" ON tasks;
CREATE POLICY "select_own_tasks" ON tasks FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_tasks" ON tasks;
CREATE POLICY "insert_own_tasks" ON tasks FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_tasks" ON tasks;
CREATE POLICY "update_own_tasks" ON tasks FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_tasks" ON tasks;
CREATE POLICY "delete_own_tasks" ON tasks FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
