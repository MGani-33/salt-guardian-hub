import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface System {
  id: string;
  hostname: string;
  ip_address: string;
  status: string;
  last_seen: string;
  os_type: string | null;
  os_version: string | null;
  created_at: string;
  updated_at: string;
}

export const useSystems = (filters?: { status?: string; search?: string }) => {
  return useQuery({
    queryKey: ["systems", filters?.status, filters?.search],
    queryFn: async () => {
      let query = supabase.from("systems").select("*").order("hostname");

      if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
      }

      if (filters?.search) {
        query = query.or(`hostname.ilike.%${filters.search}%,ip_address.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as System[];
    },
  });
};

export const useSystemDetails = (systemId: string | null) => {
  return useQuery({
    queryKey: ["system-details", systemId],
    queryFn: async () => {
      if (!systemId) return null;

      const [system, hardware, storage, network, services, applications] = await Promise.all([
        supabase.from("systems").select("*").eq("id", systemId).single(),
        supabase.from("system_hardware").select("*").eq("system_id", systemId).maybeSingle(),
        supabase.from("system_storage").select("*").eq("system_id", systemId),
        supabase.from("system_network").select("*").eq("system_id", systemId),
        supabase.from("system_services").select("*").eq("system_id", systemId),
        supabase.from("system_applications").select("*").eq("system_id", systemId),
      ]);

      if (system.error) throw system.error;

      return {
        system: system.data,
        hardware: hardware.data,
        storage: storage.data || [],
        network: network.data || [],
        services: services.data || [],
        applications: applications.data || [],
      };
    },
    enabled: !!systemId,
  });
};

export const useSystemStats = () => {
  return useQuery({
    queryKey: ["system-stats"],
    queryFn: async () => {
      const { data: systems, error } = await supabase.from("systems").select("status");

      if (error) throw error;

      const total = systems.length;
      const online = systems.filter((s) => s.status === "online").length;
      const offline = systems.filter((s) => s.status === "offline").length;
      const warning = systems.filter((s) => s.status === "warning").length;

      const { data: appsWithUpdates, error: appsError } = await supabase
        .from("system_applications")
        .select("system_id", { count: "exact", head: false })
        .eq("update_available", true);

      if (appsError) throw appsError;

      const systemsWithUpdates = new Set(appsWithUpdates?.map((a) => a.system_id) || []).size;

      return {
        total,
        online,
        offline,
        warning,
        systemsWithUpdates,
      };
    },
  });
};
