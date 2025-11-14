-- Create table for Salt Master configuration (user-specific)
CREATE TABLE IF NOT EXISTS public.salt_master_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  master_ip TEXT NOT NULL,
  master_port INTEGER DEFAULT 4506,
  ssh_user TEXT NOT NULL,
  ssh_password TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.salt_master_config ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own salt master config"
ON public.salt_master_config
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own salt master config"
ON public.salt_master_config
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own salt master config"
ON public.salt_master_config
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own salt master config"
ON public.salt_master_config
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_salt_master_config_updated_at
BEFORE UPDATE ON public.salt_master_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create table for tracking minion operations
CREATE TABLE IF NOT EXISTS public.salt_minion_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  minion_id TEXT NOT NULL,
  fingerprint TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS - allow all authenticated users to see minions
ALTER TABLE public.salt_minion_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view minion keys"
ON public.salt_minion_keys
FOR SELECT
TO authenticated
USING (true);

-- Create table for system update jobs
CREATE TABLE IF NOT EXISTS public.system_update_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  system_id UUID NOT NULL REFERENCES public.systems(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  command TEXT NOT NULL,
  output TEXT,
  error TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_update_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own update jobs"
ON public.system_update_jobs
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create update jobs"
ON public.system_update_jobs
FOR INSERT
WITH CHECK (auth.uid() = user_id);