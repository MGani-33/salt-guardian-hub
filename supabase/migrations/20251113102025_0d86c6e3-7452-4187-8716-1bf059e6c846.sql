-- Create systems table to track all monitored systems
CREATE TABLE public.systems (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hostname TEXT NOT NULL UNIQUE,
  ip_address TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'online', -- online, offline, warning
  last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  os_type TEXT,
  os_version TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create system_hardware table
CREATE TABLE public.system_hardware (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  system_id UUID NOT NULL REFERENCES public.systems(id) ON DELETE CASCADE,
  cpu_model TEXT,
  cpu_cores INTEGER,
  cpu_threads INTEGER,
  cpu_frequency TEXT,
  memory_total TEXT,
  memory_type TEXT,
  memory_used TEXT,
  gpu_model TEXT,
  gpu_memory TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create system_storage table
CREATE TABLE public.system_storage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  system_id UUID NOT NULL REFERENCES public.systems(id) ON DELETE CASCADE,
  device TEXT NOT NULL,
  type TEXT, -- SSD, HDD, NVMe
  size TEXT,
  used TEXT,
  mount_point TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create system_network table
CREATE TABLE public.system_network (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  system_id UUID NOT NULL REFERENCES public.systems(id) ON DELETE CASCADE,
  interface_name TEXT NOT NULL,
  ip_address TEXT,
  mac_address TEXT,
  status TEXT,
  speed TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create system_services table for monitoring services
CREATE TABLE public.system_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  system_id UUID NOT NULL REFERENCES public.systems(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  status TEXT NOT NULL, -- running, stopped, warning
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(system_id, service_name)
);

-- Create system_applications table for installed applications
CREATE TABLE public.system_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  system_id UUID NOT NULL REFERENCES public.systems(id) ON DELETE CASCADE,
  app_name TEXT NOT NULL,
  current_version TEXT NOT NULL,
  latest_version TEXT,
  update_available BOOLEAN DEFAULT false,
  category TEXT,
  size TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(system_id, app_name)
);

-- Enable Row Level Security
ALTER TABLE public.systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_hardware ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_storage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_network ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_applications ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public read access (adjust based on your security needs)
CREATE POLICY "Allow public read access to systems"
  ON public.systems FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to system_hardware"
  ON public.system_hardware FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to system_storage"
  ON public.system_storage FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to system_network"
  ON public.system_network FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to system_services"
  ON public.system_services FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to system_applications"
  ON public.system_applications FOR SELECT
  USING (true);

-- Create indexes for better query performance
CREATE INDEX idx_systems_hostname ON public.systems(hostname);
CREATE INDEX idx_systems_status ON public.systems(status);
CREATE INDEX idx_systems_last_seen ON public.systems(last_seen);
CREATE INDEX idx_system_hardware_system_id ON public.system_hardware(system_id);
CREATE INDEX idx_system_storage_system_id ON public.system_storage(system_id);
CREATE INDEX idx_system_network_system_id ON public.system_network(system_id);
CREATE INDEX idx_system_services_system_id ON public.system_services(system_id);
CREATE INDEX idx_system_applications_system_id ON public.system_applications(system_id);
CREATE INDEX idx_system_applications_update_available ON public.system_applications(update_available);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_systems_updated_at
  BEFORE UPDATE ON public.systems
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_system_hardware_updated_at
  BEFORE UPDATE ON public.system_hardware
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_system_storage_updated_at
  BEFORE UPDATE ON public.system_storage
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_system_network_updated_at
  BEFORE UPDATE ON public.system_network
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_system_services_updated_at
  BEFORE UPDATE ON public.system_services
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_system_applications_updated_at
  BEFORE UPDATE ON public.system_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for systems table
ALTER TABLE public.systems REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.systems;