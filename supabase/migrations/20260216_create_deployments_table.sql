-- Create deployments table
CREATE TYPE deployment_status AS ENUM ('queued', 'building', 'success', 'failed');
CREATE TYPE project_source_type AS ENUM ('github', 'upload');

CREATE TABLE IF NOT EXISTS deployments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  app_id UUID REFERENCES apps(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status deployment_status DEFAULT 'queued',
  source_type project_source_type NOT NULL,
  source_url TEXT, -- GitHub URL or Upload Storage Path
  commit_hash TEXT,
  commit_message TEXT,
  build_logs JSONB DEFAULT '[]'::JSONB,
  artifact_url TEXT,
  version TEXT,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  build_meta JSONB -- Store detected project type, framework, etc.
);

-- Realtime policies
ALTER TABLE deployments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own deployments"
  ON deployments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own deployments"
  ON deployments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own deployments"
  ON deployments FOR UPDATE
  USING (auth.uid() = user_id);
